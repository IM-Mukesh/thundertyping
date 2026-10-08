import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ValidatedGameScoreInput } from "@/lib/server/validation";
import { evaluateAndSyncAchievements } from "@/lib/server/progress";
import { parseCloudGameRecord } from "@/lib/games/game-result-contract";
import { getFinalRunStats } from "@/lib/server/fruit-fury-evaluator";
import { checkGameRpcError, settleGameResult } from "@/lib/server/game-score-settlement";
export { GameSettlementUnavailable, GameRunConflict } from "@/lib/server/game-score-settlement";

export async function saveGameScore(userId: string, input: ValidatedGameScoreInput) {
  if (input.ownerId !== userId) throw new Error("GAME_OWNER_CHANGED");
  
  if (input.gameId === "fruit-fury") {
    if (!input.evidence) throw new Error("Fruit Fury requires verifiable gameplay evidence");
    // We enforce the new chunk-based server authoritative architecture
    // Note: we now require the token to be passed from the client inside evidence.
    const derived = await getFinalRunStats(input.runId, (input.evidence as unknown as any /* eslint-disable-line @typescript-eslint/no-explicit-any */).token);
    input.score = derived.score;
    input.cleared = derived.cleared;
    input.bestCombo = derived.bestCombo;
    input.survivedMs = derived.survivedMs;
    // WPM and Accuracy are currently client-reported metrics but do not affect score bounds
    // We enforce that the DB receives the mathematically derived primary traits
  }

  const supabase = createAdminClient();
  const acknowledgement = await settleGameResult(userId, input, (args) => supabase.rpc("settle_game_run", args));

  // Achievements are a repairable projection of saved client-reported metrics.
  // Their failure must not turn an already committed run into an ambiguous save.
  await evaluateAndSyncAchievements(userId).catch((err) => console.warn("[game-scores] achievement sync failed:", err));
  return acknowledgement;
}

export async function getUserGameBests(userId: string) {
  const supabase = createAdminClient();
  // DISTINCT ON in PostgreSQL returns a best for each game+variant, not one
  // unbounded history download or an accidental comparison of Fruit modes.
  const { data, error } = await supabase.rpc("get_game_bests", { p_user_id: userId });
  checkGameRpcError(error);
  if (!Array.isArray(data)) throw new Error("Invalid game bests response");
  return data.map((row) => parseCloudGameRecord(row, userId));
}
