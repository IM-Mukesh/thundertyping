import { GAME_DEFINITIONS, type GameId } from "@/lib/games/game-types";
import { trackEvent } from "@/lib/analytics";
import { getAuthGeneration, getCurrentUserId, subscribeCurrentUser } from "@/lib/auth/current-user";
import { primeCloudXp } from "@/lib/profile/player-profile";
import { GameResultStore } from "@/lib/games/game-result-store";
import type { GameRun } from "@/lib/games/game-result-contract";

export { gameBestKey } from "@/lib/games/game-result-store";
export { parseGameBest, type GameBest, type GameRun } from "@/lib/games/game-result-contract";
export type { GameSaveState } from "@/lib/games/game-result-store";

function notify(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("herotyping:game-bests"));
}

const store = new GameResultStore({
  userId: getCurrentUserId, generation: getAuthGeneration, now: Date.now,
  uuid: () => {
    if (typeof crypto === "undefined") return "";
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
    if (typeof crypto.getRandomValues !== "function") return "";
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    const hex = [...bytes].map((n) => n.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  },
  get: (key) => { try { return typeof window === "undefined" ? null : window.localStorage.getItem(key); } catch { return null; } },
  set: (key, value) => { if (typeof window === "undefined") throw new Error("Device storage unavailable"); window.localStorage.setItem(key, value); },
  fetch: (url, init) => fetch(url, init), notify, xp: primeCloudXp,
});

export const primeCloudGameBests = (userId: string) => store.prime(userId);
export const clearCloudGameBests = () => store.identityChanged();
subscribeCurrentUser(clearCloudGameBests);

export function subscribeGameBests(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("herotyping:game-bests", listener);
  window.addEventListener("storage", listener);
  return () => { window.removeEventListener("herotyping:game-bests", listener); window.removeEventListener("storage", listener); };
}

export const getGameBest = (gameId: GameId, variant?: string) => store.getBest(gameId, variant);
export function readGameBestRaw(gameId: GameId, variant?: string): string | null {
  const best = getGameBest(gameId, variant);
  return best ? JSON.stringify(best) : null;
}
export const readGameSaveState = (gameId: GameId) => store.state(gameId);
export const readGameSaveStateRaw = (gameId: GameId) => JSON.stringify(store.state(gameId));
export const retryGameSaves = (gameId: GameId) => store.retry(gameId);

export function recordGameStart(gameId: GameId, variant?: string): void {
  store.start(gameId, variant);
  trackEvent("game_started", { game_id: gameId, game_name: GAME_DEFINITIONS[gameId]?.name ?? gameId });
}

/** Same synchronous return shape; cloud bests change only after acknowledgement. */
export function recordGameResult(gameId: GameId, run: GameRun, result?: string) {
  const recorded = store.record(gameId, run);
  trackEvent("game_completed", { game_id: gameId, game_name: GAME_DEFINITIONS[gameId]?.name ?? gameId,
    score: run.score, duration_ms: run.survivedMs, result });
  return recorded;
}
