import { getStorageItem, setStorageItem } from "@/lib/persistence/storage";
import type { TestMode } from "@/lib/typing-engine/engine-types";

const KEY_PREFIX = "thundertyping-pb";

function pbKey(mode: TestMode, param: number | string, punctuation: boolean, numbers: boolean): string {
  return `${KEY_PREFIX}:${mode}:${param}:${punctuation ? 1 : 0}:${numbers ? 1 : 0}`;
}

export interface PersonalBest {
  wpm: number;
  accuracy: number;
  achievedAt: number;
}

function isTrackableMode(mode: TestMode): mode is "time" | "words" {
  return mode === "time" || mode === "words";
}

function isValidPersonalBest(value: unknown): value is PersonalBest {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<PersonalBest>;
  return typeof v.wpm === "number" && typeof v.accuracy === "number" && typeof v.achievedAt === "number";
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
  wpm: number,
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
