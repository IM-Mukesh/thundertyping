import "server-only";
import type { Database, Json } from "@/lib/supabase/database.types";
import { parseGameAcknowledgement, type GameScorePayload } from "@/lib/games/game-result-contract";

export class GameSettlementUnavailable extends Error {
  constructor() { super("Game saving is unavailable until the game settlement migration is installed. Your pending result can be retried later."); }
}
export class GameRunConflict extends Error {
  constructor() { super("This run ID already belongs to a different result."); }
}

export function checkGameRpcError(error: { code?: string; message: string } | null): void {
  if (!error) return;
  if (error.code === "PGRST202" || error.code === "42883" || error.code === "42703") throw new GameSettlementUnavailable();
  if (error.code === "23505" || error.code === "22023") throw new GameRunConflict();
  throw new Error(`Game settlement failed: ${error.message}`);
}

type SettlementRpc = (args: Database["public"]["Functions"]["settle_game_run"]["Args"]) =>
  PromiseLike<{ data: Json | null; error: { code?: string; message: string } | null }>;

/** One RPC or a visible failure. There is deliberately no partial-write path. */
export async function settleGameResult(userId: string, input: GameScorePayload, rpc: SettlementRpc) {
  if (input.ownerId !== userId) throw new Error("GAME_OWNER_CHANGED");
  const { data, error } = await rpc({
    p_user_id: userId, p_run_id: input.runId, p_game_id: input.gameId, p_variant: input.variant,
    p_score: input.score, p_cleared: input.cleared, p_best_combo: input.bestCombo,
    p_survived_ms: input.survivedMs, p_wpm: input.wpm, p_accuracy: input.accuracy,
  });
  checkGameRpcError(error);
  return parseGameAcknowledgement(data, input);
}
