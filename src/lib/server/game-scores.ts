import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ValidatedGameScoreInput } from "@/lib/server/validation";
import { evaluateAndSyncAchievements } from "@/lib/server/progress";
import { parseCloudGameRecord } from "@/lib/games/game-result-contract";
import { checkGameRpcError, settleGameResult } from "@/lib/server/game-score-settlement";
export { GameSettlementUnavailable, GameRunConflict } from "@/lib/server/game-score-settlement";

export async function saveGameScore(userId: string, input: ValidatedGameScoreInput) {
  if (input.ownerId !== userId) throw new Error("GAME_OWNER_CHANGED");
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
