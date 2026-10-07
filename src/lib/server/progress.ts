import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { withOptimisticRetry, UNIQUE_VIOLATION } from "@/lib/server/optimistic-retry";
import { PLAYABLE_GAME_LIST } from "@/lib/games/game-types";
import { levelForXp } from "@/lib/profile/player-profile";
import { ACHIEVEMENT_LIST } from "@/lib/profile/achievements";
import { verifyServerGameRunProof, type ServerGameRunProof } from "@/lib/server/game-proof";

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

export interface GameScoreRecord {
  id?: string;
  game_id: string;
  variant?: string | null;
  score: number;
  cleared?: number | null;
  best_combo?: number | null;
  survived_ms?: number | null;
  wpm?: number | null;
  accuracy?: number | null;
  proof?: ServerGameRunProof | null;
}

export const GAME_SCORE_ACHIEVEMENTS: readonly string[] = [
  "site:all-games",
  "typing-survivor:first-run",
  "typing-survivor:combo-25",
  "ghost-racer:first-race",
  "ghost-racer:legend",
  "ghost-racer:flawless",
  "fruit-fury:first-slice",
  "fruit-fury:combo-10",
  "fruit-fury:score-10000",
  "spellbound:first-run",
  "card-battle:first-run",
  "type-before-death:first-run",
  "type-before-death:combo-25",
  "type-before-death:100-wpm",
  "type-before-death:daily",
  "type-before-death:boss",
  "type-before-death:overdrive",
] as const;

export function evaluateGameRunAchievements(
  existingUnlocked: ReadonlySet<string>,
  gameScores: readonly GameScoreRecord[],
): string[] {
  const newlyUnlocked: string[] = [];
  const currentUnlocked = new Set(existingUnlocked);

  // Check All Playable Games achievement: site:all-games
  if (!currentUnlocked.has("site:all-games")) {
    const playedGameIds = new Set(gameScores.map((g) => g.game_id));
    const allPlayed = PLAYABLE_GAME_LIST.every((g) => playedGameIds.has(g.id));
    if (allPlayed) {
      newlyUnlocked.push("site:all-games");
      currentUnlocked.add("site:all-games");
    }
  }

  for (const run of gameScores) {
    // Typing Survivor
    if (run.game_id === "typing-survivor") {
      if (!currentUnlocked.has("typing-survivor:first-run")) {
        newlyUnlocked.push("typing-survivor:first-run");
        currentUnlocked.add("typing-survivor:first-run");
      }
      if ((run.best_combo ?? 0) >= 25 && !currentUnlocked.has("typing-survivor:combo-25")) {
        newlyUnlocked.push("typing-survivor:combo-25");
        currentUnlocked.add("typing-survivor:combo-25");
      }
    }

    // Ghost Racer
    if (run.game_id === "ghost-racer") {
      if (!currentUnlocked.has("ghost-racer:first-race")) {
        newlyUnlocked.push("ghost-racer:first-race");
        currentUnlocked.add("ghost-racer:first-race");
      }
      if (run.wpm && run.wpm >= 100 && !currentUnlocked.has("ghost-racer:legend")) {
        newlyUnlocked.push("ghost-racer:legend");
        currentUnlocked.add("ghost-racer:legend");
      }
      if (run.accuracy && run.accuracy === 100 && !currentUnlocked.has("ghost-racer:flawless")) {
        newlyUnlocked.push("ghost-racer:flawless");
        currentUnlocked.add("ghost-racer:flawless");
      }
    }

    // Fruit Fury
    if (run.game_id === "fruit-fury") {
      if ((run.cleared ?? 0) >= 1 && !currentUnlocked.has("fruit-fury:first-slice")) {
        newlyUnlocked.push("fruit-fury:first-slice");
        currentUnlocked.add("fruit-fury:first-slice");
      }
      if ((run.best_combo ?? 0) >= 10 && !currentUnlocked.has("fruit-fury:combo-10")) {
        newlyUnlocked.push("fruit-fury:combo-10");
        currentUnlocked.add("fruit-fury:combo-10");
      }
      if (run.score >= 10_000 && !currentUnlocked.has("fruit-fury:score-10000")) {
        newlyUnlocked.push("fruit-fury:score-10000");
        currentUnlocked.add("fruit-fury:score-10000");
      }
    }

    // Spellbound
    if (run.game_id === "spellbound") {
      if (!currentUnlocked.has("spellbound:first-run")) {
        newlyUnlocked.push("spellbound:first-run");
        currentUnlocked.add("spellbound:first-run");
      }
    }

    // Card Battle
    if (run.game_id === "card-battle") {
      if (!currentUnlocked.has("card-battle:first-run")) {
        newlyUnlocked.push("card-battle:first-run");
        currentUnlocked.add("card-battle:first-run");
      }
    }

    // TYPE BEFORE DEATH (F10)
    // Server-authoritative gameplay proof: client-supplied variant tags (:victory, :overdrive, :daily)
    // are strictly un-trusted and cannot manufacture achievements without verified gameplay metrics.
    if (run.game_id === "type-before-death") {
      if ((run.score ?? 0) > 0 && (run.survived_ms ?? 0) >= 5000 && (run.cleared ?? 0) >= 1 && !currentUnlocked.has("type-before-death:first-run")) {
        newlyUnlocked.push("type-before-death:first-run");
        currentUnlocked.add("type-before-death:first-run");
      }
      if ((run.best_combo ?? 0) >= 25 && (run.score ?? 0) >= 250 && (run.cleared ?? 0) >= 25 && !currentUnlocked.has("type-before-death:combo-25")) {
        newlyUnlocked.push("type-before-death:combo-25");
        currentUnlocked.add("type-before-death:combo-25");
      }
      // 100-WPM: requires authoritative 100-WPM proof (mathematically proven outputChars >= 100 Net WPM)
      // Client reports of 100+ WPM with fabricated metrics without authentic proof are strictly REJECTED.
      if (
        run.wpm &&
        run.wpm >= 100 &&
        run.wpm <= 350 &&
        (run.cleared ?? 0) >= 10 &&
        (run.survived_ms ?? 0) >= 5000 &&
        verifyServerGameRunProof(run.proof, "type-before-death", run, "100-wpm") &&
        !currentUnlocked.has("type-before-death:100-wpm")
      ) {
        newlyUnlocked.push("type-before-death:100-wpm");
        currentUnlocked.add("type-before-death:100-wpm");
      }
      // Daily: authentic daily mode variant format AND actual completed run
      if (
        typeof run.variant === "string" &&
        run.variant.startsWith("daily:") &&
        (run.score ?? 0) >= 200 &&
        (run.cleared ?? 0) >= 5 &&
        (run.survived_ms ?? 0) >= 15000 &&
        !currentUnlocked.has("type-before-death:daily")
      ) {
        newlyUnlocked.push("type-before-death:daily");
        currentUnlocked.add("type-before-death:daily");
      }
      // Boss: Requires campaign mode, qualified encounter metrics, AND authoritative boss-completion proof.
      // Fabricated metric sets (even when meeting thresholds) without authentic proof are strictly REJECTED.
      if (
        typeof run.variant === "string" &&
        run.variant.startsWith("campaign:") &&
        (run.score ?? 0) >= 1500 &&
        (run.cleared ?? 0) >= 28 &&
        (run.survived_ms ?? 0) >= 45000 &&
        (run.accuracy ?? 0) >= 80 &&
        verifyServerGameRunProof(run.proof, "type-before-death", run, "boss-defeated") &&
        !currentUnlocked.has("type-before-death:boss")
      ) {
        newlyUnlocked.push("type-before-death:boss");
        currentUnlocked.add("type-before-death:boss");
      }
      // Overdrive: Requires verified density, survival, AND authoritative overdrive activation proof.
      // Fabricated metric sets without authentic overdrive proof are strictly REJECTED.
      if (
        (run.cleared ?? 0) >= 15 &&
        (run.score ?? 0) >= 600 &&
        (run.survived_ms ?? 0) >= 15000 &&
        ((run.score ?? 0) / (run.cleared ?? 1)) >= 35 &&
        verifyServerGameRunProof(run.proof, "type-before-death", run, "overdrive-activated") &&
        !currentUnlocked.has("type-before-death:overdrive")
      ) {
        newlyUnlocked.push("type-before-death:overdrive");
        currentUnlocked.add("type-before-death:overdrive");
      }
    }
  }

  return newlyUnlocked;
}

async function checkGameAchievementEligibility(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  achievementId: string,
): Promise<boolean> {
  switch (achievementId) {
    case "site:all-games": {
      const checks = await Promise.all(
        PLAYABLE_GAME_LIST.map((g) =>
          supabase
            .from("game_scores")
            .select("id")
            .eq("user_id", userId)
            .eq("game_id", g.id)
            .gt("score", 0)
            .limit(1)
            .maybeSingle(),
        ),
      );
      return checks.every((c) => !c.error && c.data !== null);
    }
    case "typing-survivor:first-run": {
      const { data } = await supabase
        .from("game_scores")
        .select("id")
        .eq("user_id", userId)
        .eq("game_id", "typing-survivor")
        .gt("score", 0)
        .limit(1)
        .maybeSingle();
      return data !== null;
    }
    case "typing-survivor:combo-25": {
      const { data } = await supabase
        .from("game_scores")
        .select("id")
        .eq("user_id", userId)
        .eq("game_id", "typing-survivor")
        .gte("best_combo", 25)
        .limit(1)
        .maybeSingle();
      return data !== null;
    }
    case "ghost-racer:first-race": {
      const { data } = await supabase
        .from("game_scores")
        .select("id")
        .eq("user_id", userId)
        .eq("game_id", "ghost-racer")
        .gt("score", 0)
        .limit(1)
        .maybeSingle();
      return data !== null;
    }
    case "ghost-racer:legend": {
      const { data } = await supabase
        .from("game_scores")
        .select("id")
        .eq("user_id", userId)
        .eq("game_id", "ghost-racer")
        .gte("wpm", 100)
        .limit(1)
        .maybeSingle();
      return data !== null;
    }
    case "ghost-racer:flawless": {
      const { data } = await supabase
        .from("game_scores")
        .select("id")
        .eq("user_id", userId)
        .eq("game_id", "ghost-racer")
        .gte("accuracy", 100)
        .limit(1)
        .maybeSingle();
      return data !== null;
    }
    case "fruit-fury:first-slice": {
      const { data } = await supabase
        .from("game_scores")
        .select("id")
        .eq("user_id", userId)
        .eq("game_id", "fruit-fury")
        .gte("cleared", 1)
        .limit(1)
        .maybeSingle();
      return data !== null;
    }
    case "fruit-fury:combo-10": {
      const { data } = await supabase
        .from("game_scores")
        .select("id")
        .eq("user_id", userId)
        .eq("game_id", "fruit-fury")
        .gte("best_combo", 10)
        .limit(1)
        .maybeSingle();
      return data !== null;
    }
    case "fruit-fury:score-10000": {
      const { data } = await supabase
        .from("game_scores")
        .select("id")
        .eq("user_id", userId)
        .eq("game_id", "fruit-fury")
        .gte("score", 10000)
        .limit(1)
        .maybeSingle();
      return data !== null;
    }
    case "spellbound:first-run": {
      const { data } = await supabase
        .from("game_scores")
        .select("id")
        .eq("user_id", userId)
        .eq("game_id", "spellbound")
        .gt("score", 0)
        .limit(1)
        .maybeSingle();
      return data !== null;
    }
    case "card-battle:first-run": {
      const { data } = await supabase
        .from("game_scores")
        .select("id")
        .eq("user_id", userId)
        .eq("game_id", "card-battle")
        .gt("score", 0)
        .limit(1)
        .maybeSingle();
      return data !== null;
    }
    case "type-before-death:first-run": {
      const { data } = await supabase
        .from("game_scores")
        .select("id")
        .eq("user_id", userId)
        .eq("game_id", "type-before-death")
        .gt("score", 0)
        .gte("survived_ms", 5000)
        .gte("cleared", 1)
        .limit(1)
        .maybeSingle();
      return data !== null;
    }
    case "type-before-death:combo-25": {
      const { data } = await supabase
        .from("game_scores")
        .select("id")
        .eq("user_id", userId)
        .eq("game_id", "type-before-death")
        .gte("best_combo", 25)
        .gte("score", 250)
        .gte("cleared", 25)
        .limit(1)
        .maybeSingle();
      return data !== null;
    }
    case "type-before-death:100-wpm": {
      const { data } = await supabase
        .from("game_scores")
        .select("id")
        .eq("user_id", userId)
        .eq("game_id", "type-before-death")
        .gte("wpm", 100)
        .lte("wpm", 350)
        .gte("cleared", 10)
        .gte("survived_ms", 5000)
        .limit(1)
        .maybeSingle();
      return data !== null;
    }
    case "type-before-death:daily": {
      const { data } = await supabase
        .from("game_scores")
        .select("id")
        .eq("user_id", userId)
        .eq("game_id", "type-before-death")
        .like("variant", "daily:%")
        .gte("score", 200)
        .gte("cleared", 5)
        .gte("survived_ms", 15000)
        .limit(1)
        .maybeSingle();
      return data !== null;
    }
    case "type-before-death:boss": {
      const { data } = await supabase
        .from("game_scores")
        .select("id")
        .eq("user_id", userId)
        .eq("game_id", "type-before-death")
        .like("variant", "campaign:%")
        .gte("score", 1500)
        .gte("cleared", 28)
        .gte("survived_ms", 45000)
        .gte("accuracy", 80)
        .limit(1)
        .maybeSingle();
      return data !== null;
    }
    case "type-before-death:overdrive": {
      const { data } = await supabase
        .from("game_scores")
        .select("id, score, cleared")
        .eq("user_id", userId)
        .eq("game_id", "type-before-death")
        .gte("cleared", 15)
        .gte("score", 600)
        .gte("survived_ms", 15000)
        .limit(5);
      if (!data || data.length === 0) return false;
      return data.some((r) => (r.score ?? 0) / (r.cleared ?? 1) >= 35);
    }
    default:
      return false;
  }
}

/**
 * Evaluates and grants eligible achievements based on persisted records in
 * PostgreSQL (player_streaks, game_scores,
 * lesson_progress, daily_stats).
 *
 * The browser can never claim an achievement arbitrarily; it is only
 * unlocked when database records meet the rules. Game measurements are
 * client-reported; storing them does not verify that gameplay occurred.
 */
export async function evaluateAndSyncAchievements(
  userId: string
): Promise<{ newlyUnlocked: string[]; allUnlocked: string[] }> {
  const supabase = createAdminClient();

  // Load existing user records
  const [achievementsRes, streakRes] = await Promise.all([
    supabase.from("achievements").select("achievement_id").eq("user_id", userId),
    supabase.from("player_streaks").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const readError = achievementsRes.error ?? streakRes.error;
  if (readError) throw new Error(`Failed to check achievements: ${readError.message}`);

  const existingUnlocked = new Set<string>((achievementsRes.data || []).map((r) => r.achievement_id));
  const newlyUnlocked: string[] = [];

  const streak = streakRes.data;

  // 1. Check Level 10 achievement: site:level-10
  if (streak && !existingUnlocked.has("site:level-10")) {
    const userLevel = levelForXp(streak.total_xp);
    if (userLevel >= 10) {
      newlyUnlocked.push("site:level-10");
      existingUnlocked.add("site:level-10");
    }
  }

  // 2. Check 7-day streak achievement: site:streak-7
  if (streak && !existingUnlocked.has("site:streak-7")) {
    if (streak.current_streak >= 7 || streak.longest_streak >= 7) {
      newlyUnlocked.push("site:streak-7");
      existingUnlocked.add("site:streak-7");
    }
  }

  // 3. Game-specific achievements: database-driven exact existence queries per missing achievement (F23)
  const missingGameAchievements = GAME_SCORE_ACHIEVEMENTS.filter((id) => !existingUnlocked.has(id));

  if (missingGameAchievements.length > 0) {
    const checkResults = await Promise.all(
      missingGameAchievements.map(async (achId) => {
        const eligible = await checkGameAchievementEligibility(supabase, userId, achId);
        return { achId, eligible };
      })
    );

    for (const { achId, eligible } of checkResults) {
      if (eligible) {
        newlyUnlocked.push(achId);
        existingUnlocked.add(achId);
      }
    }
  }

  // Persist newly unlocked achievements idempotently
  const toInsert = [...new Set(newlyUnlocked)];
  if (toInsert.length > 0) {
    const rows = toInsert.map((achievement_id) => ({
      user_id: userId,
      achievement_id,
    }));
    const { error } = await supabase.from("achievements").upsert(rows, { onConflict: "user_id,achievement_id", ignoreDuplicates: true });
    if (error) throw new Error(`Failed to persist achievements: ${error.message}`);
  }

  return {
    newlyUnlocked: toInsert,
    allUnlocked: Array.from(existingUnlocked),
  };
}

/**
 * Grants an achievement only when persisted records meet the server's rules.
 * Client-reported game metrics are not independent gameplay verification.
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
