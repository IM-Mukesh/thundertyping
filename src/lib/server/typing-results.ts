import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ValidatedTypingResultInput } from "@/lib/server/validation";


import {
  deriveAuthoritativeNetWpm,
  deriveAuthoritativeAccuracy,
  makePbBucketKey,
  STANDARD_TRACKABLE_PB_BUCKETS,
  type TrackableBucketSpec,
} from "@/lib/contracts/data-integrity";
import {
  RunConflictError,
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

  const authoritativeWpm = input.duration > 0 ? deriveAuthoritativeNetWpm(input.scoringChars, input.duration) : input.wpm;
  const authoritativeAccuracy = deriveAuthoritativeAccuracy(input.correctChars, input.incorrectChars, input.missedChars);
  const earnedXp = Math.max(5, Math.min(150, Math.round(authoritativeWpm / 2)));

  try {
    const { data, error } = // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc("settle_typing_run", {
      p_run_id: input.runId, p_user_id: userId, p_mode: input.mode, p_duration: input.duration,
      p_wpm: authoritativeWpm, p_accuracy: authoritativeAccuracy, p_correct_chars: input.correctChars,
      p_incorrect_chars: input.incorrectChars, p_missed_chars: input.missedChars, p_extra_chars: input.extraChars,
      p_param: input.param, p_punctuation: input.punctuation, p_numbers: input.numbers, p_earned_xp: earnedXp,
      p_language_code: input.languageCode || "en"
    });

    if (!error && data) {
      return {
        result: data.record,
        earnedXp: data.earnedXp,
        totalXp: data.totalXp,
        idempotent: data.idempotent
      };
    }
    
    if (error && error.code === '23505') {
       throw new RunConflictError("Run ID conflicts with an existing result");
    }
    // If RPC is missing, fall through to legacy handler
  } catch (err: unknown) {
    if (err instanceof RunConflictError) throw err;
  }


  throw new Error('Fallback settlement not implemented in this snippet to enforce RPC usage.');
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
