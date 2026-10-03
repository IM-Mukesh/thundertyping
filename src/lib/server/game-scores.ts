import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ValidatedGameScoreInput } from "@/lib/server/validation";
import { withOptimisticRetry, UNIQUE_VIOLATION } from "@/lib/server/optimistic-retry";
import { PLAYABLE_GAME_LIST } from "@/lib/games/game-types";
import { evaluateAndSyncAchievements } from "@/lib/server/progress";
import type { Database } from "@/lib/supabase/database.types";

type GameScoreInsert = Database["public"]["Tables"]["game_scores"]["Insert"];

async function getSupabaseForRead() {
  try {
    return createAdminClient();
  } catch {
    return await createClient();
  }
}

/**
 * Derives legitimate XP from verified game performance server-side.
 * Strictly capped at 150 XP per run to prevent runaway progression exploitation.
 */
function calculateGameXp(gameId: string, score: number, cleared: number): number {
  let rawXp = 0;
  if (gameId === "fruit-fury") {
    rawXp = Math.round(score / 15) + Math.min(40, cleared * 2);
  } else if (gameId === "card-battle" || gameId === "spellbound") {
    rawXp = Math.round(score / 8) + Math.min(40, cleared * 5);
  } else {
    rawXp = Math.round(score / 10) + Math.min(40, cleared * 2);
  }
  return Math.max(5, Math.min(150, rawXp));
}

export async function saveGameScore(userId: string, input: ValidatedGameScoreInput) {
  const supabase = createAdminClient();

  // 1. Idempotency Check: if runId is supplied, check if already recorded
  if (input.runId) {
    const { data: existingRun } = await supabase
      .from("game_scores")
      .select("*")
      .eq("user_id", userId)
      .eq("id", input.runId)
      .maybeSingle();

    if (existingRun) {
      const { data: streak } = await supabase
        .from("player_streaks")
        .select("total_xp")
        .eq("user_id", userId)
        .maybeSingle();

      return {
        record: existingRun,
        isNewBest: false,
        earnedXp: 0,
        totalXp: streak?.total_xp ?? 0,
        idempotent: true,
      };
    }
  }

  // 2. Check existing best score for this game using index
  const { data: previousBest } = await supabase
    .from("game_scores")
    .select("score")
    .eq("user_id", userId)
    .eq("game_id", input.gameId)
    .order("score", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isNewBest = !previousBest || input.score > previousBest.score;

  // 3. Insert game score run with authoritative timestamp
  const insertPayload: GameScoreInsert = {
    user_id: userId,
    game_id: input.gameId,
    score: input.score,
    wpm: input.wpm ?? null,
    accuracy: input.accuracy ?? null,
    cleared: input.cleared || 0,
    best_combo: input.bestCombo || 0,
    survived_ms: input.survivedMs || 0,
    ...(input.runId ? { id: input.runId } : {}),
  };

  const { data: record, error: insertError } = await supabase
    .from("game_scores")
    .insert(insertPayload)
    .select()
    .single();

  if (insertError) {
    if (insertError.code === UNIQUE_VIOLATION && input.runId) {
      // Race condition idempotency recovery
      const { data: duplicate } = await supabase
        .from("game_scores")
        .select("*")
        .eq("user_id", userId)
        .eq("id", input.runId)
        .single();
      if (duplicate) return { record: duplicate, isNewBest: false, earnedXp: 0, idempotent: true };
    }
    throw new Error(`Failed to save game score: ${insertError.message}`);
  }

  // 4. Update daily games played aggregate
  const today = new Date().toISOString().split("T")[0];
  const earnedXp = calculateGameXp(input.gameId, input.score, input.cleared);
  let finalTotalXp = 0;

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

    // 5. Award server-calculated XP
    await withOptimisticRetry(async () => {
      const { data: streak } = await supabase
        .from("player_streaks")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (streak) {
        finalTotalXp = streak.total_xp + earnedXp;
        const { data: updatedRows, error } = await supabase
          .from("player_streaks")
          .update({
            total_xp: finalTotalXp,
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
      console.warn("[game-scores] achievement sync non-fatal error:", err)
    );
    } catch (err) {
    console.error("Failed to update daily game stats/XP:", err);
    throw err;
  }

  return {
    record,
    isNewBest,
    earnedXp,
    totalXp: finalTotalXp,
  };
}

/**
 * Scalable Game Best Retrieval:
 * Uses Postgres index-scan with LIMIT 1 per registered playable game in parallel,
 * avoiding transferring thousands of historical runs across the network.
 */
export async function getUserGameBests(userId: string) {
  const supabase = await getSupabaseForRead();

  // Query each registered game with limit(1) using index idx_game_scores_user_game
  const queries = PLAYABLE_GAME_LIST.map((game) =>
    supabase
      .from("game_scores")
      .select("*")
      .eq("user_id", userId)
      .eq("game_id", game.id)
      .order("score", { ascending: false })
      .limit(1)
      .maybeSingle()
  );

  const results = await Promise.all(queries);
  const bests: Array<NonNullable<(typeof results)[0]["data"]>> = [];

  for (const res of results) {
    if (res.data) {
      bests.push(res.data);
    }
  }

  return bests;
}
