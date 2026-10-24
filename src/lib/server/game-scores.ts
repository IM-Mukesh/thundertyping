import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ValidatedGameScoreInput } from "@/lib/server/validation";
import { evaluateAndSyncAchievements } from "@/lib/server/progress";
import { parseCloudGameRecord, type CloudGameRecord } from "@/lib/games/game-result-contract";
import type { GameId } from "@/lib/games/game-types";
import { getFinalRunStats } from "@/lib/server/fruit-fury-evaluator";
import { checkGameRpcError, settleGameResult } from "@/lib/server/game-score-settlement";
import {
  verifyAndConsumeGameRunChallenge,
  verifyTranscriptAgainstSeed,
  issueServerGameRunProof,
  storeVerifiedGameRunProof,
  type GameplayEvidence,
  type GameAchievementEvent,
  type ServerGameRunProof,
} from "@/lib/server/game-proof";

export { GameSettlementUnavailable, GameRunConflict } from "@/lib/server/game-score-settlement";

export async function saveGameScore(userId: string, input: ValidatedGameScoreInput) {
  if (input.ownerId !== userId) throw new Error("GAME_OWNER_CHANGED");

  const supabase = createAdminClient();

  // 0. Idempotent Retry Check: If this runId was already settled in PostgreSQL, delegate to settlement RPC
  const { data: existingSavedRun } = await supabase
    .from("game_scores")
    .select("id, user_id, game_id, variant, score")
    .eq("id", input.runId)
    .maybeSingle();

  if (existingSavedRun) {
    const acknowledgement = await settleGameResult(userId, input, (args) => supabase.rpc("settle_game_run", args));
    return {
      ...acknowledgement,
      verified: true,
      trustTier: "verified",
    };
  }

  let isVerified = false;
  let verifiedProof: ServerGameRunProof | null = null;

  if (input.gameId === "fruit-fury") {
    const evidence = input.evidence as { token?: string } | undefined;
    if (evidence && typeof evidence === "object" && typeof evidence.token === "string") {
      try {
        const derived = await getFinalRunStats(input.runId, evidence.token);
        input.score = derived.score;
        input.cleared = derived.cleared;
        input.bestCombo = derived.bestCombo;
        input.survivedMs = derived.survivedMs;
        isVerified = true;
      } catch {
        isVerified = false;
      }
    } else {
      isVerified = false;
    }
  } else if (input.gameId === "type-before-death") {
    const evidence = input.evidence as GameplayEvidence | undefined;
    if (evidence && typeof evidence === "object" && typeof evidence.seed === "string") {
      const challengeVerification = await verifyAndConsumeGameRunChallenge(
        userId,
        input.runId,
        "type-before-death",
        evidence
      );

      if (
        challengeVerification.valid &&
        challengeVerification.challenge &&
        challengeVerification.challenge.seed === evidence.seed
      ) {
        const challenge = challengeVerification.challenge;
        const mission = evidence.mission ?? challenge.mission ?? 0;
        const words = evidence.wordsCompleted ?? [];
        const transcriptValid = verifyTranscriptAgainstSeed(words, challenge.seed, mission);

        const elapsedMs = Math.max(0, input.survivedMs);
        const keysTyped = evidence.totalKeysTyped ?? 0;
        const cps = elapsedMs > 0 ? keysTyped / (elapsedMs / 1000) : 0;
        const physicalValid = elapsedMs >= 1000 && cps <= 40;

        if (transcriptValid && physicalValid) {
          const events: GameAchievementEvent[] = [];
          if (evidence.bossDefeated) events.push("boss-defeated");
          if ((evidence.overdriveActivations ?? 0) >= 1) events.push("overdrive-activated");
          if ((input.wpm ?? 0) >= 100) events.push("100-wpm");

          if (events.length > 0) {
            verifiedProof = issueServerGameRunProof(
              "type-before-death",
              input.runId,
              {
                variant: input.variant,
                score: input.score,
                cleared: input.cleared,
                survivedMs: input.survivedMs,
                accuracy: input.accuracy,
                wpm: input.wpm,
                outputChars: evidence.outputChars,
                wavesCleared: events.includes("boss-defeated") ? 3 : undefined,
                overdrives: evidence.overdriveActivations,
              },
              events,
              evidence,
            );
          }

          isVerified = true;
          if (verifiedProof) {
            storeVerifiedGameRunProof(verifiedProof);
          }
        }
      }
    }
  }

  if (isVerified) {
    const acknowledgement = await settleGameResult(userId, input, (args) => supabase.rpc("settle_game_run", args));

    await evaluateAndSyncAchievements(
      userId,
      verifiedProof
        ? {
            id: input.runId,
            game_id: input.gameId,
            variant: input.variant,
            score: input.score,
            cleared: input.cleared,
            best_combo: input.bestCombo,
            survived_ms: input.survivedMs,
            wpm: input.wpm,
            accuracy: input.accuracy,
            proof: verifiedProof,
          }
        : undefined
    ).catch((err) => console.warn("[game-scores] achievement sync failed:", err));

    return {
      ...acknowledgement,
      verified: true,
      trustTier: "verified",
    };
  }

  // UNVERIFIED / SELF-REPORTED RUN
  // Games lacking server-authoritative replay simulation or runs failing proof verification
  // are explicitly classified as self-reported:
  // - Zero cloud XP is awarded
  // - Daily stats are not mutated
  // - Competitive achievements are not granted
  // - Personal records in cloud are not overwritten
  // - Cosmetic local results and ordinary gameplay remain smooth
  const { data: streak } = await supabase
    .from("player_streaks")
    .select("total_xp")
    .eq("user_id", userId)
    .maybeSingle();

  const totalXp = streak?.total_xp ?? 0;

  const { data: existingBests } = await supabase
    .from("game_scores")
    .select("*")
    .eq("user_id", userId)
    .eq("game_id", input.gameId)
    .eq("variant", input.variant)
    .order("score", { ascending: false })
    .limit(1);

  const existingBestRow = existingBests && existingBests.length > 0 ? existingBests[0] : null;

  const record: CloudGameRecord = {
    id: input.runId,
    user_id: userId,
    game_id: input.gameId,
    variant: input.variant,
    score: input.score,
    cleared: input.cleared,
    best_combo: input.bestCombo,
    survived_ms: input.survivedMs,
    wpm: input.wpm,
    accuracy: input.accuracy,
    created_at: new Date().toISOString(),
  };

  const bestRecord: CloudGameRecord = existingBestRow
    ? {
        id: existingBestRow.id,
        user_id: userId,
        game_id: existingBestRow.game_id as GameId,
        variant: existingBestRow.variant,
        score: Math.max(input.score, existingBestRow.score),
        cleared: existingBestRow.cleared ?? 0,
        best_combo: existingBestRow.best_combo ?? 0,
        survived_ms: existingBestRow.survived_ms ?? 0,
        wpm: existingBestRow.wpm,
        accuracy: existingBestRow.accuracy,
        created_at: existingBestRow.created_at,
      }
    : record;

  return {
    record,
    best: bestRecord,
    totalXp,
    earnedXp: 0,
    isNewBest: false,
    idempotent: false,
    verified: false,
    trustTier: "self_reported",
  };
}

export async function getUserGameBests(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_game_bests", { p_user_id: userId });
  checkGameRpcError(error);
  if (!Array.isArray(data)) throw new Error("Invalid game bests response");
  return data.map((row) => parseCloudGameRecord(row, userId));
}
