import { getStorageItem, setStorageItem } from "@/lib/persistence/storage";
import type { GameId } from "@/lib/games/game-types";

// Separate from results-store.ts on purpose: that one keys personal bests by
// typing-test mode + config and only tracks WPM/accuracy, which doesn't
// describe a game run. Same defensive posture though — parsed storage is
// validated before it reaches the UI.

const KEY_PREFIX = "thundertyping-game-best";

export interface GameBest {
  score: number;
  cleared: number;
  bestCombo: number;
  survivedMs: number;
  achievedAt: number;
}

function bestKey(gameId: GameId): string {
  return `${KEY_PREFIX}:${gameId}`;
}

function isValidGameBest(value: unknown): value is GameBest {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<GameBest>;
  return (
    typeof v.score === "number" &&
    typeof v.cleared === "number" &&
    typeof v.bestCombo === "number" &&
    typeof v.survivedMs === "number" &&
    typeof v.achievedAt === "number"
  );
}

export function getGameBest(gameId: GameId): GameBest | null {
  const raw = getStorageItem(bestKey(gameId));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isValidGameBest(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function recordGameResult(
  gameId: GameId,
  run: Omit<GameBest, "achievedAt">,
): { isNewBest: boolean; best: GameBest } {
  const existing = getGameBest(gameId);
  if (existing && existing.score >= run.score) {
    return { isNewBest: false, best: existing };
  }
  const best: GameBest = { ...run, achievedAt: Date.now() };
  setStorageItem(bestKey(gameId), JSON.stringify(best));
  return { isNewBest: true, best };
}
