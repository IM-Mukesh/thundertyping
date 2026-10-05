import type { SpecialId, WarDifficulty, WarState } from "@/lib/games/rakshasa/types";
import { SPECIALS, WAR_STAGES } from "@/lib/games/rakshasa/content";

export type WarQuality = "auto" | "low" | "high";
export interface WarProgress {
  version: 1;
  completed: number[];
  defeated: number;
  tutorialDone: boolean;
  difficulty: WarDifficulty;
  quality: WarQuality;
  reducedMotion: boolean;
}
export interface WarStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; }
const PREFIX = "herotyping:rakshasa-war:v1";
export const warProgressKey = (owner: string | null) => owner ? `${PREFIX}:account:${owner}` : `${PREFIX}:guest`;
export const freshWarProgress = (): WarProgress => ({ version: 1, completed: [], defeated: 0, tutorialDone: false, difficulty: "normal", quality: "auto", reducedMotion: false });

/** Whole-record validation avoids trusting stale or partially corrupted saves. */
export function parseWarProgress(raw: string | null): WarProgress {
  const fallback = freshWarProgress();
  if (!raw || raw.length > 4096) return fallback;
  try {
    const p: unknown = JSON.parse(raw);
    if (!p || typeof p !== "object" || Array.isArray(p)) return fallback;
    const v = p as Record<string, unknown>;
    if (v.version !== 1 || !Array.isArray(v.completed) || v.completed.length > WAR_STAGES.length ||
      !v.completed.every((id, index) => id === index) ||
      typeof v.defeated !== "number" || !Number.isSafeInteger(v.defeated) || v.defeated < 0 || v.defeated > 10_000_000 ||
      typeof v.tutorialDone !== "boolean" || typeof v.difficulty !== "string" || !["easy", "normal", "hard"].includes(v.difficulty) ||
      typeof v.quality !== "string" || !["auto", "low", "high"].includes(v.quality) || typeof v.reducedMotion !== "boolean") return fallback;
    return { version: 1, completed: [...v.completed], defeated: v.defeated, tutorialDone: v.tutorialDone,
      difficulty: v.difficulty as WarDifficulty, quality: v.quality as WarQuality, reducedMotion: v.reducedMotion };
  } catch { return fallback; }
}
function browserStorage(): WarStorage | null {
  try { return typeof window === "undefined" ? null : window.localStorage; } catch { return null; }
}
export function readWarProgress(owner: string | null, storage = browserStorage()): WarProgress {
  try { return parseWarProgress(storage?.getItem(warProgressKey(owner)) ?? null); } catch { return freshWarProgress(); }
}
export function saveWarProgress(owner: string | null, value: WarProgress, storage = browserStorage()): boolean {
  if (!storage) return false;
  const json = JSON.stringify(value);
  if (JSON.stringify(parseWarProgress(json)) !== json) return false;
  try { storage.setItem(warProgressKey(owner), json); return storage.getItem(warProgressKey(owner)) === json; } catch { return false; }
}
export const unlockedWarStage = (progress: WarProgress): number => Math.min(WAR_STAGES.length - 1, progress.completed.length);
export const unlockedWarSpecials = (progress: WarProgress): SpecialId[] => SPECIALS.filter((special) => progress.defeated >= special.unlockAt).map((special) => special.id);

/** Apply each clear delta once in the controller, never from replayed effects. */
export function advanceWarProgress(progress: WarProgress, before: WarState, after: WarState): WarProgress {
  if (after.tutorialStep > 0) return after.phase === "victory" ? { ...progress, tutorialDone: true } : progress;
  const defeated = Math.min(10_000_000, progress.defeated + Math.max(0, after.cleared - before.cleared));
  const completed = [...progress.completed];
  if (after.phase === "victory" && after.stage === completed.length) completed.push(after.stage);
  return { ...progress, defeated, completed };
}
