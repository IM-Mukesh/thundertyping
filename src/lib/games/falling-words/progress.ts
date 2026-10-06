import type { FallingWordsRenderQuality } from "./visual-model";
import type { SkyfallState } from "./engine";

/** Only completed standard runs and preferences; never resumes an unfinished run. */
export interface SkyfallProgress {
  version: 1;
  runs: number;
  totalCleared: number;
  bestPhase: number;
  bestCombo: number;
  quality: FallingWordsRenderQuality;
  reducedMotion: boolean;
  touchKeys: boolean;
}
export interface SkyfallStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; }
export const skyfallProgressKey = (owner: string | null) => `herotyping:skyfall:v1:${owner ? `account:${owner}` : "guest"}`;
export const freshSkyfallProgress = (): SkyfallProgress => ({ version: 1, runs: 0, totalCleared: 0, bestPhase: 1, bestCombo: 0, quality: "auto", reducedMotion: false, touchKeys: false });

export function parseSkyfallProgress(raw: string | null): SkyfallProgress {
  if (!raw || raw.length > 2048) return freshSkyfallProgress();
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return freshSkyfallProgress();
    const p = value as Record<string, unknown>;
    const count = (v: unknown, max: number) => typeof v === "number" && Number.isSafeInteger(v) && v >= 0 && v <= max;
    if (p.version !== 1 || !count(p.runs, 1_000_000) || !count(p.totalCleared, 10_000_000) || !count(p.bestCombo, 1_000_000) || !count(p.bestPhase, 5) || p.bestPhase === 0 || typeof p.quality !== "string" || !["auto", "low", "high"].includes(p.quality) || typeof p.reducedMotion !== "boolean" || typeof p.touchKeys !== "boolean") return freshSkyfallProgress();
    return { version: 1, runs: p.runs as number, totalCleared: p.totalCleared as number, bestCombo: p.bestCombo as number, bestPhase: p.bestPhase as number, quality: p.quality as FallingWordsRenderQuality, reducedMotion: p.reducedMotion, touchKeys: p.touchKeys };
  } catch { return freshSkyfallProgress(); }
}

function browserStorage(): SkyfallStorage | null {
  try { return typeof window === "undefined" ? null : window.localStorage; } catch { return null; }
}
export function readSkyfallProgress(owner: string | null, storage = browserStorage()): SkyfallProgress {
  try { return parseSkyfallProgress(storage?.getItem(skyfallProgressKey(owner)) ?? null); } catch { return freshSkyfallProgress(); }
}
export function saveSkyfallProgress(owner: string | null, progress: SkyfallProgress, storage = browserStorage()): boolean {
  if (!storage) return false;
  try {
    const normalized = parseSkyfallProgress(JSON.stringify(progress));
    if (Object.keys(progress).length !== Object.keys(normalized).length || Object.keys(normalized).some(key => progress[key as keyof SkyfallProgress] !== normalized[key as keyof SkyfallProgress])) return false;
    const raw = JSON.stringify(normalized);
    storage.setItem(skyfallProgressKey(owner), raw);
    return storage.getItem(skyfallProgressKey(owner)) === raw;
  } catch { return false; }
}
export function completeSkyfallProgress(progress: SkyfallProgress, state: SkyfallState): SkyfallProgress {
  if (state.status !== "over" || state.mode !== "standard") return progress;
  return { ...progress, runs: Math.min(1_000_000, progress.runs + 1), totalCleared: Math.min(10_000_000, progress.totalCleared + state.cleared), bestPhase: Math.max(progress.bestPhase, state.phase), bestCombo: Math.max(progress.bestCombo, state.bestCombo) };
}

export const SKYFALL_SIGNALS = [
  { at: 10, name: "First light", description: "Rescue 10 words" },
  { at: 50, name: "Night watch", description: "Rescue 50 words" },
  { at: 200, name: "Storm keeper", description: "Rescue 200 words" },
  { at: 500, name: "Skyline legend", description: "Rescue 500 words" },
] as const;
