import { getStorageItem, setStorageItem } from "@/lib/persistence/storage";
import type { TestMode } from "@/lib/typing-engine/engine-types";

const KEY_PREFIX = "thundertyping-pb";

function pbKey(mode: TestMode, param: number | string, punctuation: boolean, numbers: boolean): string {
  return `${KEY_PREFIX}:${mode}:${param}:${punctuation ? 1 : 0}:${numbers ? 1 : 0}`;
}

export interface PersonalBest {
  /**
   * Unrounded. Beating a best is decided on the real number, not the one on
   * screen -- rounding first makes 65.6 and 66.4 both "66", so a genuine
   * improvement of nearly a word per minute silently reads as a tie. Round at
   * the point of display, never before the comparison.
   */
  wpm: number;
  accuracy: number;
  achievedAt: number;
}

function isTrackableMode(mode: TestMode): mode is "time" | "words" {
  return mode === "time" || mode === "words";
}

// Finite, non-negative, and (for accuracy) capped at 100 -- `typeof ===
// "number"` alone lets NaN/Infinity/negative values through. A corrupted
// `wpm` of NaN would make `existing.wpm >= wpm` always false in
// recordResult, so every run "wins" and silently keeps overwriting the
// record; a corrupted absurdly-high `wpm` would instead permanently block
// any real run from ever registering a new best, with no way to recover
// short of clearing storage. Matches the range-checking settings-store.ts
// already does for its own persisted fields.
function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isValidPersonalBest(value: unknown): value is PersonalBest {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<PersonalBest>;
  return (
    isFiniteNonNegative(v.wpm) &&
    isFiniteNonNegative(v.accuracy) &&
    v.accuracy <= 100 &&
    isFiniteNonNegative(v.achievedAt)
  );
}

export function getPersonalBest(
  mode: TestMode,
  param: number | string,
  punctuation: boolean,
  numbers: boolean,
): PersonalBest | null {
  if (!isTrackableMode(mode)) return null;
  const raw = getStorageItem(pbKey(mode, param, punctuation, numbers));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isValidPersonalBest(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function recordResult(
  mode: TestMode,
  param: number | string,
  punctuation: boolean,
  numbers: boolean,
  /** Unrounded net WPM. */
  wpm: number,
  /** Unrounded accuracy percentage. */
  accuracy: number,
): { isNewBest: boolean; best: PersonalBest | null } {
  if (!isTrackableMode(mode)) return { isNewBest: false, best: null };

  const existing = getPersonalBest(mode, param, punctuation, numbers);
  if (existing && existing.wpm >= wpm) {
    return { isNewBest: false, best: existing };
  }

  const best: PersonalBest = { wpm, accuracy, achievedAt: Date.now() };
  setStorageItem(pbKey(mode, param, punctuation, numbers), JSON.stringify(best));
  return { isNewBest: true, best };
}
