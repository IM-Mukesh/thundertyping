import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ValidatedTypingResultInput } from "@/lib/server/validation";
import { withOptimisticRetry, UNIQUE_VIOLATION } from "@/lib/server/optimistic-retry";
import { evaluateAndSyncAchievements } from "@/lib/server/progress";
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

  // 1. Idempotency Check: if runId is supplied, check if already recorded
  if (input.runId) {
    const { data: existingRun } = await supabase
      .from("typing_results")
      .select("*")
      .eq("user_id", userId)
      .eq("id", input.runId)
      .maybeSingle();

    if (existingRun) {
      // Already processed idempotently; return existing record without double-rewarding
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

  // 2. Authoritative Metric Derivation
  // Calculate authoritative Net WPM and accuracy server-side from verifiable raw counts
  const authoritativeWpm =
    input.duration > 0
      ? Math.round(((input.correctChars / 5) / (input.duration / 60)) * 100) / 100
      : input.wpm;

  const totalChars = input.correctChars + input.incorrectChars + input.missedChars;
  const authoritativeAccuracy =
    totalChars > 0
      ? Math.round((input.correctChars / totalChars) * 10000) / 100
      : 100;

  // 3. Insert result record with authoritative server timestamp
  const insertPayload: TypingResultInsert = {
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
    ...(input.runId ? { id: input.runId } : {}),
  };

  const { data: result, error: insertError } = await supabase
    .from("typing_results")
    .insert(insertPayload)
    .select()
    .single();

  if (insertError) {
    if (insertError.code === UNIQUE_VIOLATION && input.runId) {
      // Race condition idempotency recovery
      const { data: duplicate } = await supabase
        .from("typing_results")
        .select("*")
        .eq("user_id", userId)
        .eq("id", input.runId)
        .single();
      if (duplicate) return { result: duplicate, earnedXp: 0, idempotent: true };
    }
    throw new Error(`Failed to save typing result: ${insertError.message}`);
  }

  // 4. Update daily aggregate stats
  const today = new Date().toISOString().split("T")[0];
  let finalTotalXp = 0;
  const earnedXp = Math.max(5, Math.min(150, Math.round(authoritativeWpm / 2)));

  try {
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

    // 5. Update player streak & authoritative XP
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

    // 6. Check eligible achievements authoritatively
    await evaluateAndSyncAchievements(userId).catch((err) =>
      console.warn("[typing-results] achievement sync non-fatal error:", err)
    );
  } catch (err) {
    console.error("Non-fatal error updating daily stats/streaks:", err);
  }

  return {
    result,
    earnedXp,
    totalXp: finalTotalXp,
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
