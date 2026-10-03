import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { withOptimisticRetry, UNIQUE_VIOLATION } from "@/lib/server/optimistic-retry";
import { PLAYABLE_GAME_LIST } from "@/lib/games/game-types";
import { levelForXp } from "@/lib/profile/player-profile";
import { ACHIEVEMENT_LIST } from "@/lib/profile/achievements";

const VALID_ACHIEVEMENT_IDS = new Set<string>(ACHIEVEMENT_LIST.map((a) => a.id));

export const MAX_XP_PER_EVENT = 500;

/**
 * Awards XP to a user with strict server-side bounds, type validation,
 * and optimistic concurrency control.
 *
 * CRITICAL SECURITY INVARIANTS:
 * - Reject NaN, Infinity, negative numbers, floats, or amounts > MAX_XP_PER_EVENT
 * - Atomic database updates with retry logic on concurrent conflicts
 */
export async function awardCloudXp(
  userId: string,
  amount: number
): Promise<{ totalXp: number }> {
  if (
    typeof amount !== "number" ||
    !Number.isInteger(amount) ||
    amount <= 0 ||
    amount > MAX_XP_PER_EVENT
  ) {
    throw new Error(`INVALID_XP_AMOUNT: amount must be an integer between 1 and ${MAX_XP_PER_EVENT}`);
  }

  const supabase = createAdminClient();

  return withOptimisticRetry(async () => {
    const { data: streak } = await supabase
      .from("player_streaks")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!streak) {
      const { data: inserted, error } = await supabase
        .from("player_streaks")
        .insert({ user_id: userId, total_xp: amount })
        .select()
        .single();
      if (error) {
        if (error.code === UNIQUE_VIOLATION) {
          throw new Error("CONFLICT: player_streaks row created concurrently");
        }
        throw error;
      }
      return { totalXp: inserted.total_xp };
    }

    const newTotal = streak.total_xp + amount;
    const { data: updatedRows, error } = await supabase
      .from("player_streaks")
      .update({ total_xp: newTotal, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("updated_at", streak.updated_at)
      .select();

    if (error) throw error;
    if (!updatedRows || updatedRows.length === 0) {
      throw new Error("CONFLICT: player_streaks row changed concurrently");
    }
    return { totalXp: newTotal };
  });
}

export async function getCloudAchievements(userId: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to fetch achievements: ${error.message}`);
  }

  return (data || []).map((row) => row.achievement_id);
}

/**
 * Authoritatively evaluates and grants eligible achievements based on
 * verified server records in PostgreSQL (player_streaks, game_scores,
 * lesson_progress, daily_stats).
 *
 * The browser can never claim an achievement arbitrarily; it is only
 * unlocked when database records prove eligibility.
 */
export async function evaluateAndSyncAchievements(
  userId: string
): Promise<{ newlyUnlocked: string[]; allUnlocked: string[] }> {
  const supabase = createAdminClient();

  // Load existing user records
  const [achievementsRes, streakRes, gamesRes] = await Promise.all([
    supabase.from("achievements").select("achievement_id").eq("user_id", userId),
    supabase.from("player_streaks").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("game_scores").select("game_id, score, cleared, best_combo, survived_ms, wpm, accuracy").eq("user_id", userId),
  ]);

  if (achievementsRes.error) {
    throw new Error(`Failed to check achievements: ${achievementsRes.error.message}`);
  }

  const existingUnlocked = new Set<string>((achievementsRes.data || []).map((r) => r.achievement_id));
  const newlyUnlocked: string[] = [];

  const streak = streakRes.data;
  const gameScores = gamesRes.data || [];

  // 1. Check Level 10 achievement: site:level-10
  if (streak && !existingUnlocked.has("site:level-10")) {
    const userLevel = levelForXp(streak.total_xp);
    if (userLevel >= 10) {
      newlyUnlocked.push("site:level-10");
    }
  }

  // 2. Check 7-day streak achievement: site:streak-7
  if (streak && !existingUnlocked.has("site:streak-7")) {
    if (streak.current_streak >= 7 || streak.longest_streak >= 7) {
      newlyUnlocked.push("site:streak-7");
    }
  }

  // 3. Check All Playable Games achievement: site:all-games
  if (!existingUnlocked.has("site:all-games")) {
    const playedGameIds = new Set(gameScores.map((g) => g.game_id));
    const allPlayed = PLAYABLE_GAME_LIST.every((g) => playedGameIds.has(g.id));
    if (allPlayed) {
      newlyUnlocked.push("site:all-games");
    }
  }

  // 4. Check game-specific achievements from authoritative game_scores runs
  for (const run of gameScores) {
    // Typing Survivor
    if (run.game_id === "typing-survivor") {
      if (!existingUnlocked.has("typing-survivor:first-run")) newlyUnlocked.push("typing-survivor:first-run");
      if ((run.best_combo ?? 0) >= 25 && !existingUnlocked.has("typing-survivor:combo-25")) {
        newlyUnlocked.push("typing-survivor:combo-25");
      }
    }

    // Ghost Racer
    if (run.game_id === "ghost-racer") {
      if (!existingUnlocked.has("ghost-racer:first-race")) newlyUnlocked.push("ghost-racer:first-race");
      if (run.wpm && run.wpm >= 100 && !existingUnlocked.has("ghost-racer:legend")) {
        newlyUnlocked.push("ghost-racer:legend");
      }
      if (run.accuracy && run.accuracy === 100 && !existingUnlocked.has("ghost-racer:flawless")) {
        newlyUnlocked.push("ghost-racer:flawless");
      }
    }

    // Fruit Fury
    if (run.game_id === "fruit-fury") {
      if ((run.cleared ?? 0) >= 1 && !existingUnlocked.has("fruit-fury:first-slice")) {
        newlyUnlocked.push("fruit-fury:first-slice");
      }
      if ((run.best_combo ?? 0) >= 10 && !existingUnlocked.has("fruit-fury:combo-10")) {
        newlyUnlocked.push("fruit-fury:combo-10");
      }
      if (run.score >= 10_000 && !existingUnlocked.has("fruit-fury:score-10000")) {
        newlyUnlocked.push("fruit-fury:score-10000");
      }
    }

    // Spellbound
    if (run.game_id === "spellbound") {
      if (!existingUnlocked.has("spellbound:first-run")) newlyUnlocked.push("spellbound:first-run");
    }

    // Card Battle
    if (run.game_id === "card-battle") {
      if (!existingUnlocked.has("card-battle:first-run")) newlyUnlocked.push("card-battle:first-run");
    }
  }

  // Persist newly unlocked achievements idempotently
  const toInsert = newlyUnlocked.filter((id) => !existingUnlocked.has(id));
  if (toInsert.length > 0) {
    const rows = toInsert.map((achievement_id) => ({
      user_id: userId,
      achievement_id,
    }));
    const { error } = await supabase.from("achievements").upsert(rows, { onConflict: "user_id,achievement_id", ignoreDuplicates: true });
    if (error) throw new Error(`Failed to persist achievements: ${error.message}`);
    for (const id of toInsert) {
      existingUnlocked.add(id);
    }
  }

  return {
    newlyUnlocked: toInsert,
    allUnlocked: Array.from(existingUnlocked),
  };
}

/**
 * Grants an achievement ONLY if it passes authoritative validation
 * or is an authoritatively verified gameplay event.
 */
export async function grantVerifiedCloudAchievement(
  userId: string,
  achievementId: string
): Promise<{ granted: boolean; allUnlocked: string[] }> {
  if (!VALID_ACHIEVEMENT_IDS.has(achievementId)) {
    return { granted: false, allUnlocked: await getCloudAchievements(userId) };
  }

  // Run full authoritative evaluation against database state
  const { allUnlocked } = await evaluateAndSyncAchievements(userId);
  return {
    granted: allUnlocked.includes(achievementId),
    allUnlocked,
  };
}
