import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { WordState } from "@/lib/typing-engine/engine-types";
import { tallyKeyOutcomes, statFromOutcomes, type KeyStat } from "@/lib/lessons/key-performance";

// A rolling window per key, not a lifetime tally -- a key the user struggled
// with weeks ago and has since fixed must stop showing as "weak" once enough
// recent attempts are clean, or the coach would be lying about the present
// based on the past. Capped at KEY_WINDOW outcomes per key; oldest drops off
// as new ones arrive. Same real-zustand-store shape as lesson-progress-store
// (read reactively from the drill's result screen and the hub's Today's
// Training card, not written-once-read-once like game-scores.ts).

export const KEY_WINDOW = 20;

export interface KeyPerformanceState {
  keys: Record<string, boolean[]>;
  recordKeyAttempt: (wordStates: readonly WordState[]) => void;
}

function isValidRecent(value: unknown): value is boolean[] {
  return Array.isArray(value) && value.length <= KEY_WINDOW && value.every((v) => typeof v === "boolean");
}

/**
 * Drops a single corrupted key's entry rather than wiping the whole map --
 * same discipline as lesson-progress-store.ts's sanitizeUnits, for the same
 * reason: one hand-edited or truncated field must not erase every other
 * key's history.
 */
export function sanitizeKeys(value: unknown): Record<string, boolean[]> {
  if (typeof value !== "object" || value === null) return {};
  const result: Record<string, boolean[]> = {};
  for (const [key, recent] of Object.entries(value as Record<string, unknown>)) {
    if (isValidRecent(recent)) result[key] = recent;
  }
  return result;
}

export const useKeyPerformanceStore = create<KeyPerformanceState>()(
  persist(
    (set) => ({
      keys: {},
      recordKeyAttempt: (wordStates) => {
        const outcomes = tallyKeyOutcomes(wordStates);
        set((state) => {
          const keys = { ...state.keys };
          for (const [key, newOutcomes] of Object.entries(outcomes)) {
            const merged = [...(keys[key] ?? []), ...newOutcomes];
            keys[key] = merged.slice(-KEY_WINDOW);
          }
          return { keys };
        });
      },
    }),
    {
      name: "thundertyping-lesson-key-performance",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ keys: state.keys }),
      merge: (persistedState, currentState) => {
        const p = (typeof persistedState === "object" && persistedState !== null ? persistedState : {}) as Partial<{
          keys: unknown;
        }>;
        return { ...currentState, keys: sanitizeKeys(p.keys) };
      },
    },
  ),
);

/** Reduces the rolling windows into a plain attempts/errors map for the callers in key-performance.ts. */
export function getKeyStats(keys: Readonly<Record<string, boolean[]>>): Record<string, KeyStat> {
  const stats: Record<string, KeyStat> = {};
  for (const [key, recent] of Object.entries(keys)) stats[key] = statFromOutcomes(recent);
  return stats;
}
