import { getStorageItem, setStorageItem } from "@/lib/persistence/storage";
import { GAME_DEFINITIONS, type GameId } from "@/lib/games/game-types";
import { trackEvent } from "@/lib/analytics";
import { getAuthGeneration, getCurrentUserId, subscribeCurrentUser } from "@/lib/auth/current-user";
import { primeCloudXp } from "@/lib/profile/player-profile";

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

// --- Signed-in (cloud) game bests ------------------------------------------
// Guests are local-only (below). Signed-in players are cloud-only: no game
// result is ever read from or written to localStorage while signed in, so a
// different account signing in later on the same browser can never inherit
// another player's scores. This cache is purely an in-memory mirror of the
// authoritative server state, rebuilt on each sign-in and dropped on sign-out.
const cloudBestCache = new Map<GameId, GameBest | null>();
let cloudBestsPrimedForUserId: string | null = null;
let primeInFlight: Promise<void> | null = null;

function cloudRowToBest(row: {
  score: number;
  cleared: number | null;
  best_combo: number | null;
  survived_ms: number | null;
  created_at: string;
}): GameBest {
  return {
    score: row.score,
    cleared: row.cleared ?? 0,
    bestCombo: row.best_combo ?? 0,
    survivedMs: row.survived_ms ?? 0,
    achievedAt: new Date(row.created_at).getTime(),
  };
}

/** Called by AuthProvider right after sign-in. Fire-and-forget. */
export function primeCloudGameBests(userId: string): Promise<void> {
  const generation = getAuthGeneration();
  if (userId !== getCurrentUserId()) return Promise.resolve();
  if (cloudBestsPrimedForUserId === userId) {
    return primeInFlight ?? Promise.resolve();
  }
  cloudBestCache.clear();
  cloudBestsPrimedForUserId = userId;
  primeInFlight = fetch("/api/games/scores")
    .then((res) => res.json())
    .then((json) => {
      if (generation === getAuthGeneration() && userId === getCurrentUserId() && json?.success && Array.isArray(json.data)) {
        for (const row of json.data) {
          if (row?.game_id) cloudBestCache.set(row.game_id as GameId, cloudRowToBest(row));
        }
        notifyGameBests();
      }
    })
    .catch((err) => console.warn("[game-scores] failed to load cloud bests:", err))
    .finally(() => {
      if (generation === getAuthGeneration()) primeInFlight = null;
    });
  return primeInFlight;
}

/** Called by AuthProvider on sign-out. */
export function clearCloudGameBests(): void {
  cloudBestCache.clear();
  cloudBestsPrimedForUserId = null;
  primeInFlight = null;
  notifyGameBests();
}

subscribeCurrentUser(clearCloudGameBests);

function notifyGameBests(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("herotyping:game-bests"));
}

export function subscribeGameBests(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("herotyping:game-bests", listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener("herotyping:game-bests", listener);
    window.removeEventListener("storage", listener);
  };
}

export function readGameBestRaw(gameId: GameId): string | null {
  const best = getGameBest(gameId);
  return best ? JSON.stringify(best) : null;
}

export function getGameBest(gameId: GameId): GameBest | null {
  if (getCurrentUserId()) {
    return cloudBestCache.get(gameId) ?? null;
  }
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

  const userId = getCurrentUserId();
  const generation = getAuthGeneration();
  const existing = getGameBest(gameId);
  const isNewBest = !existing || run.score > existing.score;
  const best: GameBest = { ...run, achievedAt: Date.now() };

  if (userId) {
    if (isNewBest) { cloudBestCache.set(gameId, best); notifyGameBests(); }
    const runId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : undefined;
    fetch("/api/games/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId,
        gameId,
        score: run.score,
        cleared: run.cleared,
        bestCombo: run.bestCombo,
        survivedMs: run.survivedMs,
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (generation === getAuthGeneration() && userId === getCurrentUserId() && json?.success && json.data?.totalXp !== undefined) {
          primeCloudXp(json.data.totalXp);
        }
      })
      .catch((err) => console.warn("[game-scores] failed to save cloud score:", err));
    return { isNewBest, best };
  }

  if (!isNewBest) {
    return { isNewBest: false, best: existing! };
  }
  setStorageItem(bestKey(gameId), JSON.stringify(best));
  notifyGameBests();
  return { isNewBest: true, best };
}
