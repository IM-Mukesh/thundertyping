import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ValidatedGameScoreInput } from "@/lib/server/validation";
import { withOptimisticRetry, UNIQUE_VIOLATION } from "@/lib/server/optimistic-retry";

async function getSupabaseForRead() {
  try {
    return createAdminClient();
  } catch {
    return await createClient();
  }
}

export async function saveGameScore(userId: string, input: ValidatedGameScoreInput) {
  const supabase = createAdminClient();

  // 1. Check existing best score for this game
  const { data: previousBest } = await supabase
    .from("game_scores")
    .select("score")
    .eq("user_id", userId)
    .eq("game_id", input.gameId)
    .order("score", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isNewBest = !previousBest || input.score > previousBest.score;

  // 2. Insert game score run
  const { data: record, error: insertError } = await supabase
    .from("game_scores")
    .insert({
      user_id: userId,
      game_id: input.gameId,
      score: input.score,
      wpm: input.wpm ?? null,
      accuracy: input.accuracy ?? null,
      cleared: input.cleared || 0,
      best_combo: input.bestCombo || 0,
      survived_ms: input.survivedMs || 0,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to save game score: ${insertError.message}`);
  }

  // 3. Update daily games played aggregate
  const today = new Date().toISOString().split("T")[0];
  try {
    await withOptimisticRetry(async () => {
      const { data: existingDaily } = await supabase
        .from("daily_stats")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle();

      if (existingDaily) {
        const { data: updatedRows, error } = await supabase
          .from("daily_stats")
          .update({
            games_played: existingDaily.games_played + 1,
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
          games_played: 1,
        });
        if (error) {
          if (error.code === UNIQUE_VIOLATION) {
            throw new Error("CONFLICT: daily_stats row created concurrently");
          }
          throw error;
        }
      }
    });
  } catch (err) {
    console.error("Non-fatal: failed to update daily game stats:", err);
  }

  return { record, isNewBest };
}

export async function getUserGameBests(userId: string) {
  const supabase = await getSupabaseForRead();

  const { data, error } = await supabase
    .from("game_scores")
    .select("*")
    .eq("user_id", userId)
    .order("score", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch game scores: ${error.message}`);
  }

  // Deduplicate to highest score per game_id
  const bestsByGame = new Map<string, typeof data[0]>();
  for (const row of data || []) {
    if (!bestsByGame.has(row.game_id)) {
      bestsByGame.set(row.game_id, row);
    }
  }

  return Array.from(bestsByGame.values());
}
