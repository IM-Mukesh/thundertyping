import { getStorageItem, setStorageItem } from "@/lib/persistence/storage";
import { GAME_DEFINITIONS, type GameId } from "@/lib/games/game-types";
import { trackEvent } from "@/lib/analytics";

// Separate from results-store.ts on purpose: that one keys personal bests by
// typing-test mode + config and only tracks WPM/accuracy, which doesn't
// describe a game run. Same defensive posture though — parsed storage is
// validated before it reaches the UI.

// Left unrenamed on the HeroTyping rebrand -- every existing player's best
// scores are saved under this prefix, and renaming it would orphan them.
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

/**
 * Exposed so a component can subscribe to the raw stored string rather than a
 * parsed object. `useSyncExternalStore` compares snapshots by identity, and
 * `getGameBest` parses fresh JSON on every call — returning a new object each
 * time would loop forever. A string is stable by value.
 */
export function gameBestKey(gameId: GameId): string {
  return bestKey(gameId);
}

export function parseGameBest(raw: string | null): GameBest | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isValidGameBest(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isValidGameBest(value: unknown): value is GameBest {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<GameBest>;
  return (
    isFiniteNonNegative(v.score) &&
    isFiniteNonNegative(v.cleared) &&
    isFiniteNonNegative(v.bestCombo) &&
    isFiniteNonNegative(v.survivedMs) &&
    isFiniteNonNegative(v.achievedAt)
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

export function recordGameStart(gameId: GameId): void {
  const def = GAME_DEFINITIONS[gameId];
  trackEvent("game_started", {
    game_id: gameId,
    game_name: def?.name ?? gameId,
  });
}

export function recordGameResult(
  gameId: GameId,
  run: Omit<GameBest, "achievedAt">,
  result?: string,
): { isNewBest: boolean; best: GameBest } {
  const def = GAME_DEFINITIONS[gameId];
  trackEvent("game_completed", {
    game_id: gameId,
    game_name: def?.name ?? gameId,
    score: run.score,
    duration_ms: run.survivedMs,
    result,
  });

  const existing = getGameBest(gameId);
  if (existing && existing.score >= run.score) {
    return { isNewBest: false, best: existing };
  }
  const best: GameBest = { ...run, achievedAt: Date.now() };
  setStorageItem(bestKey(gameId), JSON.stringify(best));
  return { isNewBest: true, best };
}
