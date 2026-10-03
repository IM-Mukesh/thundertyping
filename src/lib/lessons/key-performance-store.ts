import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { accountStorageKey, subscribeCurrentUser } from "@/lib/auth/current-user";
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
  transitions: Record<string, boolean[]>;
  lastUpdated: number;
  recordKeyAttempt: (wordStates: readonly WordState[]) => void;
  resetStats: () => void;
}

function isValidRecent(value: unknown): value is boolean[] {
  return Array.isArray(value) && value.length <= KEY_WINDOW && value.every((v) => typeof v === "boolean");
}

/**
 * Drops a single corrupted entry rather than wiping the whole map --
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

/**
 * Extracts per-transition (character pair) outcomes from word states.
 */
export function tallyTransitionOutcomes(wordStates: readonly WordState[]): Record<string, boolean[]> {
  const outcomes: Record<string, boolean[]> = {};
  for (const word of wordStates) {
    let prevChar: string | null = null;
    for (let i = 0; i < word.target.length; i++) {
      const targetChar = word.target[i].toLowerCase();
      const state = word.chars[i];
      if (state !== "correct" && state !== "incorrect" && state !== "missed") continue;
      const isCorrect = state === "correct";

      if (prevChar && prevChar.trim() && targetChar.trim()) {
        const pair = `${prevChar}${targetChar}`;
        (outcomes[pair] ??= []).push(isCorrect);
      }
      prevChar = targetChar;
    }
  }
  return outcomes;
}

export const useKeyPerformanceStore = create<KeyPerformanceState>()(
  persist(
    (set) => ({
      keys: {},
      transitions: {},
      lastUpdated: 0,
      recordKeyAttempt: (wordStates) => {
        const keyOutcomes = tallyKeyOutcomes(wordStates);
        const transOutcomes = tallyTransitionOutcomes(wordStates);

        set((state) => {
          const keys = { ...state.keys };
          for (const [key, newOutcomes] of Object.entries(keyOutcomes)) {
            const merged = [...(keys[key] ?? []), ...newOutcomes];
            keys[key] = merged.slice(-KEY_WINDOW);
          }

          const transitions = { ...state.transitions };
          for (const [pair, newOutcomes] of Object.entries(transOutcomes)) {
            const merged = [...(transitions[pair] ?? []), ...newOutcomes];
            transitions[pair] = merged.slice(-KEY_WINDOW);
          }

          return { keys, transitions, lastUpdated: Date.now() };
        });
      },
      resetStats: () => set({ keys: {}, transitions: {}, lastUpdated: Date.now() }),
    }),
    {
      // Left unrenamed on the HeroTyping rebrand -- every existing player's
      // key-performance history is saved under this name, and renaming it
      // would orphan it.
      name: accountStorageKey("thundertyping-lesson-key-performance"),
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ keys: state.keys, transitions: state.transitions, lastUpdated: state.lastUpdated }),
      merge: (persistedState, currentState) => {
        const p = (typeof persistedState === "object" && persistedState !== null ? persistedState : {}) as Partial<{
          keys: unknown;
          transitions: unknown;
          lastUpdated: unknown;
        }>;
        return {
          ...currentState,
          keys: sanitizeKeys(p.keys),
          transitions: sanitizeKeys(p.transitions),
          lastUpdated: typeof p.lastUpdated === "number" ? p.lastUpdated : 0,
        };
      },
    },
  ),
);

subscribeCurrentUser(() => {
  // Reset under the old key before changing persistence options would destroy
  // that account's history. Read the new key first, then reset and hydrate.
  const name = accountStorageKey("thundertyping-lesson-key-performance");
  const storage = useKeyPerformanceStore.persist.getOptions().storage;
  const saved = storage?.getItem(name);
  useKeyPerformanceStore.persist.setOptions({ name });
  useKeyPerformanceStore.setState({ keys: {}, transitions: {}, lastUpdated: 0 });
  if (saved && !(saved instanceof Promise)) storage?.setItem(name, saved);
  void useKeyPerformanceStore.persist.rehydrate();
});

/** Reduces the rolling windows into a plain attempts/errors map for the callers in key-performance.ts. */
export function getKeyStats(keys: Readonly<Record<string, boolean[]>>): Record<string, KeyStat> {
  const stats: Record<string, KeyStat> = {};
  for (const [key, recent] of Object.entries(keys)) stats[key] = statFromOutcomes(recent);
  return stats;
}

/** Reduces transitions rolling windows into an attempts/errors map */
export function getTransitionStats(transitions: Readonly<Record<string, boolean[]>>): Record<string, KeyStat> {
  const stats: Record<string, KeyStat> = {};
  for (const [pair, recent] of Object.entries(transitions)) stats[pair] = statFromOutcomes(recent);
  return stats;
}
