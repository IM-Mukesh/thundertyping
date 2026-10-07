import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ValidatedTypingResultInput } from "@/lib/server/validation";
import { withOptimisticRetry, UNIQUE_VIOLATION } from "@/lib/server/optimistic-retry";
import { evaluateAndSyncAchievements } from "@/lib/server/progress";
import {
  deriveAuthoritativeNetWpm,
  deriveAuthoritativeAccuracy,
  makePbBucketKey,
  STANDARD_TRACKABLE_PB_BUCKETS,
  type TrackableBucketSpec,
} from "@/lib/contracts/data-integrity";
import {
  getSettlementReceipt,
  updateSettlementReceipt,
  assertTypingPayloadMatch,
} from "@/lib/server/settlement";
import type { Database } from "@/lib/supabase/database.types";

type TypingResultInsert = Database["public"]["Tables"]["typing_results"]["Insert"];

async function getSupabaseForRead() {
  try {
    return createAdminClient();
  } catch {
    return await createClient();
  }
}

export async function saveTypingResult(userId: string, input: ValidatedTypingResultInput) {
  const supabase = createAdminClient();

  // Authoritative Metric Derivation (F01)
  // Calculate authoritative Net WPM strictly from scoringChars
  const authoritativeWpm =
    input.duration > 0
      ? deriveAuthoritativeNetWpm(input.scoringChars, input.duration)
      : input.wpm;

  const authoritativeAccuracy = deriveAuthoritativeAccuracy(
    input.correctChars,
    input.incorrectChars,
    input.missedChars
  );

  // 1. Idempotency & Conflict Check (F03 & F06)
  const { data: existingRun } = await supabase
    .from("typing_results")
    .select("*")
    .eq("id", input.runId)
    .maybeSingle();

  let receipt = await getSettlementReceipt(userId, input.runId, "typing_test");

  if (existingRun) {
    // Assert identity and payload match: conflicting reuse of runId is rejected
    assertTypingPayloadMatch(existingRun, {
      userId,
      mode: input.mode,
      duration: input.duration,
      wpm: authoritativeWpm,
      correctChars: input.correctChars,
      incorrectChars: input.incorrectChars,
    });

    if (receipt?.stage === "complete") {
      const { data: streak } = await supabase
        .from("player_streaks")
        .select("total_xp")
        .eq("user_id", userId)
        .maybeSingle();

      return {
        result: existingRun,
        earnedXp: 0,
        totalXp: streak?.total_xp ?? 0,
        idempotent: true,
      };
    }
  }

  if (!receipt) {
    receipt = {
      runId: input.runId,
      userId,
      eventType: "typing_test",
      stage: existingRun ? "primary_saved" : "received",
      earnedXp: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  // 2. Primary Save: Insert result record if not already recorded
  let result = existingRun;
  if (!result) {
    const insertPayload: TypingResultInsert = {
      id: input.runId,
      user_id: userId,
      mode: input.mode,
      duration: input.duration,
      wpm: authoritativeWpm,
      raw_wpm: input.rawWpm,
      accuracy: authoritativeAccuracy,
      consistency: input.consistency,
      correct_chars: input.correctChars,
      incorrect_chars: input.incorrectChars,
      extra_chars: input.extraChars,
      missed_chars: input.missedChars,
      param: input.param,
      punctuation: input.punctuation,
      numbers: input.numbers,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("typing_results")
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      if (insertError.code === UNIQUE_VIOLATION) {
        // Race condition idempotency recovery
        const { data: duplicate } = await supabase
          .from("typing_results")
          .select("*")
          .eq("id", input.runId)
          .single();

        if (duplicate) {
          assertTypingPayloadMatch(duplicate, {
            userId,
            mode: input.mode,
            duration: input.duration,
            wpm: authoritativeWpm,
            correctChars: input.correctChars,
            incorrectChars: input.incorrectChars,
          });
          result = duplicate;
        } else {
          throw new Error(`Failed to recover concurrent typing result: ${insertError.message}`);
        }
      } else {
        throw new Error(`Failed to save typing result: ${insertError.message}`);
      }
    } else {
      result = inserted;
    }

    receipt.stage = "primary_saved";
    await updateSettlementReceipt(receipt);
  }

  // 3. Multi-Stage Resumable Settlement (F03)
  const today = new Date().toISOString().split("T")[0];
  let finalTotalXp = 0;
  const earnedXp = Math.max(5, Math.min(150, Math.round(authoritativeWpm / 2)));

  // Stage: daily_stats update
  if (receipt.stage === "primary_saved") {
    await withOptimisticRetry(async () => {
      const { data: existingDaily } = await supabase
        .from("daily_stats")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle();

      if (existingDaily) {
        const newTestsCompleted = existingDaily.tests_completed + 1;
        const newAvgWpm = Math.round(
          (existingDaily.average_wpm * existingDaily.tests_completed + authoritativeWpm) / newTestsCompleted
        );
        const newBestWpm = Math.max(existingDaily.best_wpm, authoritativeWpm);
        const newAvgAcc = Math.round(
          (existingDaily.average_accuracy * existingDaily.tests_completed + authoritativeAccuracy) /
            newTestsCompleted
        );

        const { data: updatedRows, error } = await supabase
          .from("daily_stats")
          .update({
            tests_completed: newTestsCompleted,
            average_wpm: newAvgWpm,
            best_wpm: newBestWpm,
            average_accuracy: newAvgAcc,
            practice_minutes: Number(
              (existingDaily.practice_minutes + input.duration / 60).toFixed(2)
            ),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("date", today)
          .eq("updated_at", existingDaily.updated_at)
          .select();

        if (error) throw error;
        if (!updatedRows || updatedRows.length === 0) {
          throw new Error("CONFLICT: daily_stats row changed concurrently");
        }
      } else {
        const { error } = await supabase.from("daily_stats").insert({
          user_id: userId,
          date: today,
          tests_completed: 1,
          average_wpm: Math.round(authoritativeWpm),
          best_wpm: Math.round(authoritativeWpm),
          average_accuracy: Math.round(authoritativeAccuracy),
          practice_minutes: Number((input.duration / 60).toFixed(2)),
        });
        if (error) {
          if (error.code === UNIQUE_VIOLATION) {
            throw new Error("CONFLICT: daily_stats row created concurrently");
          }
          throw error;
        }
      }
    });

    receipt.stage = "aggregate_saved";
    await updateSettlementReceipt(receipt);
  }

  // Stage: player_streaks & XP update
  if (receipt.stage === "aggregate_saved") {
    await withOptimisticRetry(async () => {
      const { data: streak } = await supabase
        .from("player_streaks")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (streak) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        let newStreak = streak.current_streak;

        if (streak.last_active_date === yesterday) {
          newStreak += 1;
        } else if (streak.last_active_date !== today) {
          newStreak = 1;
        }

        const newTotalXp = streak.total_xp + earnedXp;
        finalTotalXp = newTotalXp;

        const { data: updatedRows, error } = await supabase
          .from("player_streaks")
          .update({
            current_streak: newStreak,
            longest_streak: Math.max(streak.longest_streak, newStreak),
            last_active_date: today,
            total_xp: newTotalXp,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("updated_at", streak.updated_at)
          .select();

        if (error) throw error;
        if (!updatedRows || updatedRows.length === 0) {
          throw new Error("CONFLICT: player_streaks row changed concurrently");
        }
      }
    });

    receipt.stage = "rewards_saved";
    receipt.earnedXp = earnedXp;
    await updateSettlementReceipt(receipt);
  } else {
    // Already rewarded previously; retrieve current total XP
    const { data: streak } = await supabase
      .from("player_streaks")
      .select("total_xp")
      .eq("user_id", userId)
      .maybeSingle();
    finalTotalXp = streak?.total_xp ?? 0;
  }

  // Check eligible achievements
  await evaluateAndSyncAchievements(userId).catch((err) =>
    console.warn("[typing-results] achievement sync non-fatal error:", err)
  );

  // Settlement complete
  receipt.stage = "complete";
  await updateSettlementReceipt(receipt);

  return {
    result: result!,
    earnedXp: existingRun ? 0 : earnedXp,
    totalXp: finalTotalXp,
    idempotent: Boolean(existingRun),
  };
}

export async function getTypingResultsHistory(userId: string, limit = 50) {
  const supabase = await getSupabaseForRead();
  const safeLimit = Math.min(Math.max(1, limit), 100);

  const { data, error } = await supabase
    .from("typing_results")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new Error(`Failed to fetch typing history: ${error.message}`);
  }

  return data || [];
}

export { STANDARD_TRACKABLE_PB_BUCKETS, type TrackableBucketSpec };

/**
 * All-time Personal Bests retrieval (F05).
 * Queries true all-time best score per mode and configuration bucket.
 */
export async function getTypingPersonalBests(userId: string) {
  const supabase = createAdminClient();

  // 1. Primary: PostgreSQL RPC get_typing_bests (single-roundtrip, all-time DISTINCT ON)
  try {
    const rpcClient = supabase as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
    };
    const { data, error } = await rpcClient.rpc("get_typing_bests", { p_user_id: userId });
    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch {
    // Fall back to database-driven bucketed queries
  }

  // 2. Mathematically guaranteed fallback:
  // Query the absolute #1 maximum WPM result for each trackable bucket via indexed LIMIT 1.
  // This guarantees that all historical results are considered and no bucket can be shadowed
  // by another mode's high volume of attempts, independent of historical row count.
  const bucketPromises = STANDARD_TRACKABLE_PB_BUCKETS.map(async (bucket) => {
    try {
      const { data, error } = await supabase
        .from("typing_results")
        .select("mode, param, punctuation, numbers, wpm, accuracy, created_at")
        .eq("user_id", userId)
        .eq("mode", bucket.mode)
        .eq("param", bucket.param)
        .eq("punctuation", bucket.punctuation)
        .eq("numbers", bucket.numbers)
        .order("wpm", { ascending: false })
        .limit(1)
        .maybeSingle();

      return !error && data ? data : null;
    } catch {
      return null;
    }
  });

  // Also query any non-standard/custom durations (e.g., duration=70)
  const customPromise = (async () => {
    try {
      const standardParams = [
        "15", "30", "60", "120", "180", "300", "600",
        "10", "25", "50", "100",
        "short", "medium", "long",
        "easy", "medium", "hard",
      ];
      const { data, error } = await supabase
        .from("typing_results")
        .select("mode, param, punctuation, numbers, wpm, accuracy, created_at")
        .eq("user_id", userId)
        .not("param", "in", `(${standardParams.map((p) => `"${p}"`).join(",")})`)
        .order("wpm", { ascending: false })
        .limit(50);

      return !error && Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  })();

  const [bucketResults, customResults] = await Promise.all([
    Promise.all(bucketPromises),
    customPromise,
  ]);

  const bestsMap = new Map<string, {
    mode: string;
    param: string | null;
    punctuation: boolean;
    numbers: boolean;
    wpm: number;
    accuracy: number;
    created_at: string;
  }>();

  for (const row of bucketResults) {
    if (row) {
      const key = makePbBucketKey(row.mode, row.param, row.punctuation, row.numbers);
      bestsMap.set(key, row);
    }
  }

  for (const row of customResults) {
    const key = makePbBucketKey(row.mode, row.param, row.punctuation, row.numbers);
    const existing = bestsMap.get(key);
    if (!existing || row.wpm > existing.wpm) {
      bestsMap.set(key, row);
    }
  }

  return Array.from(bestsMap.values());
}
