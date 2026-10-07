import { getStorageItem, setStorageItem } from "@/lib/persistence/storage";
import type { TestConfig, TestMode } from "@/lib/typing-engine/engine-types";
import { getAuthGeneration, getCurrentUserId, subscribeCurrentUser } from "@/lib/auth/current-user";
import { primeCloudXp } from "@/lib/profile/player-profile";

// Left unrenamed on the HeroTyping rebrand -- every existing player's
// personal bests are saved under this prefix, and renaming it would orphan
// them.
const KEY_PREFIX = "thundertyping-pb";

function pbKey(mode: TestMode, param: number | string, punctuation: boolean, numbers: boolean): string {
  return `${KEY_PREFIX}:${mode}:${param}:${punctuation ? 1 : 0}:${numbers ? 1 : 0}`;
}

// The mode-specific dimension that, together with mode/punctuation/numbers,
// identifies one PB "bucket" -- e.g. words-mode PBs are tracked per word
// count, time-mode per duration, so a 15s PB and a 60s PB never overwrite
// each other. "custom" text has no natural param, so it isn't trackable
// (see isTrackableMode) and falls back to a fixed label.
export function paramForConfig(config: TestConfig): number | string {
  switch (config.mode) {
    case "time":
      return config.timeDuration;
    case "words":
      return config.wordCount;
    case "quote":
      return config.quoteLength;
    case "vocabulary":
      return config.vocabDifficulty;
    case "custom":
      return "custom";
  }
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

function isTrackableMode(mode: TestMode): mode is "time" | "words" | "quote" | "vocabulary" {
  return mode === "time" || mode === "words" || mode === "quote" || mode === "vocabulary";
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

// Signed-in players are cloud-only for typing-test bests: this cache is an
// in-memory mirror of the authoritative server history, rebuilt on sign-in
// and dropped on sign-out, so a different account signing in later on the
// same browser can never inherit another player's bests from localStorage.
const cloudBestCache = new Map<string, PersonalBest>();
let cloudBestsPrimedForUserId: string | null = null;

function getValidRunId(preferred?: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (preferred && uuidRegex.test(preferred)) {
    return preferred;
  }
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Called by AuthProvider right after sign-in. Fire-and-forget. */
export function primeCloudPersonalBests(userId: string): Promise<void> {
  const generation = getAuthGeneration();
  if (userId !== getCurrentUserId()) return Promise.resolve();
  if (cloudBestsPrimedForUserId === userId) return Promise.resolve();
  cloudBestCache.clear();
  cloudBestsPrimedForUserId = userId;
  return fetch("/api/typing-results?bests=true")
    .then((res) => res.json())
    .then((json) => {
      if (generation !== getAuthGeneration() || userId !== getCurrentUserId() || !json?.success || !Array.isArray(json.data)) return;
      for (const row of json.data as Array<{
        mode: string;
        param: string | null;
        punctuation: boolean;
        numbers: boolean;
        wpm: number;
        accuracy: number;
        created_at: string;
      }>) {
        if (!isTrackableMode(row.mode as TestMode)) continue;
        const key = pbKey(row.mode as TestMode, row.param ?? "", row.punctuation, row.numbers);
        const existing = cloudBestCache.get(key);
        if (!existing || row.wpm > existing.wpm) {
          cloudBestCache.set(key, {
            wpm: row.wpm,
            accuracy: row.accuracy,
            achievedAt: new Date(row.created_at).getTime(),
          });
        }
      }
    })
    .catch((err) => console.warn("[results-store] failed to load cloud bests:", err));
}

/** Called by AuthProvider on sign-out. */
export function clearCloudPersonalBests(): void {
  cloudBestCache.clear();
  cloudBestsPrimedForUserId = null;
}

subscribeCurrentUser(clearCloudPersonalBests);

export function getPersonalBest(
  mode: TestMode,
  param: number | string,
  punctuation: boolean,
  numbers: boolean,
): PersonalBest | null {
  if (!isTrackableMode(mode)) return null;
  if (getCurrentUserId()) {
    return cloudBestCache.get(pbKey(mode, param, punctuation, numbers)) ?? null;
  }
  const raw = getStorageItem(pbKey(mode, param, punctuation, numbers));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isValidPersonalBest(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export interface RecordResultDetails {
  rawWpm?: number;
  consistency?: number;
  durationSec: number;
  correctChars: number;
  scoringChars?: number;
  incorrectChars: number;
  extraChars?: number;
  missedChars?: number;
  runId?: string;
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
  details?: RecordResultDetails,
): { isNewBest: boolean; best: PersonalBest | null } {
  if (!isTrackableMode(mode)) return { isNewBest: false, best: null };

  const existing = getPersonalBest(mode, param, punctuation, numbers);
  const isNewBest = !existing || wpm > existing.wpm;
  const best: PersonalBest = { wpm, accuracy, achievedAt: Date.now() };

  const userId = getCurrentUserId();
  const generation = getAuthGeneration();
  if (userId) {
    if (isNewBest) cloudBestCache.set(pbKey(mode, param, punctuation, numbers), best);
    if (details) {
      const runId = getValidRunId(details.runId);
      fetch("/api/typing-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId,
          mode,
          duration: details.durationSec,
          wpm,
          rawWpm: details.rawWpm ?? null,
          accuracy,
          consistency: details.consistency ?? null,
          correctChars: details.correctChars,
          scoringChars: details.scoringChars ?? details.correctChars,
          incorrectChars: details.incorrectChars,
          extraChars: details.extraChars ?? 0,
          missedChars: details.missedChars ?? 0,
          param: String(param),
          punctuation,
          numbers,
        }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (generation === getAuthGeneration() && userId === getCurrentUserId() && json?.success && json.data?.totalXp !== undefined) {
            primeCloudXp(json.data.totalXp);
          }
        })
        .catch((err) => console.warn("[results-store] failed to save cloud result:", err));
    }
    return { isNewBest, best: isNewBest ? best : existing };
  }

  if (!isNewBest) {
    return { isNewBest: false, best: existing };
  }
  setStorageItem(pbKey(mode, param, punctuation, numbers), JSON.stringify(best));
  return { isNewBest: true, best };
}
