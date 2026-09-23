import type { WordState } from "@/lib/typing-engine/engine-types";

export interface KeyStat {
  attempts: number;
  errors: number;
}

/**
 * Raw per-occurrence outcomes (true = correct) for one finished attempt,
 * keyed by lowercased character — `target[j]` paired with `chars[j]` already
 * tells you exactly which physical character was right or wrong, so this
 * needs no changes to the shared typing engine. Case-folded to a single
 * entry per letter (matches `buildReviewText`'s lowercase convention
 * elsewhere in this codebase). "extra" characters (typed past the end of the
 * target word) are skipped — they have no corresponding target key to blame.
 *
 * Kept as raw per-occurrence outcomes, not pre-aggregated counts, so a
 * rolling-window store (key-performance-store.ts) can push each occurrence
 * individually and let old outcomes age out.
 */
export function tallyKeyOutcomes(wordStates: readonly WordState[]): Record<string, boolean[]> {
  const outcomes: Record<string, boolean[]> = {};

  for (const word of wordStates) {
    for (let i = 0; i < word.chars.length; i++) {
      const state = word.chars[i];
      if (state !== "correct" && state !== "incorrect" && state !== "missed") continue;
      const key = word.target[i]?.toLowerCase();
      if (!key) continue;

      (outcomes[key] ??= []).push(state === "correct");
    }
  }

  return outcomes;
}

/** Aggregates raw outcomes into an attempts/errors count. */
export function statFromOutcomes(outcomes: readonly boolean[]): KeyStat {
  return { attempts: outcomes.length, errors: outcomes.filter((correct) => !correct).length };
}

/** Convenience: the full aggregate tally for one attempt, in one call. */
export function tallyKeyAttempt(wordStates: readonly WordState[]): Record<string, KeyStat> {
  const outcomes = tallyKeyOutcomes(wordStates);
  const stats: Record<string, KeyStat> = {};
  for (const key in outcomes) stats[key] = statFromOutcomes(outcomes[key]);
  return stats;
}

export interface WeakKeyOptions {
  /** A key needs at least this many attempts before its accuracy means anything. */
  minAttempts: number;
  /** Below this accuracy (0-100), a key with enough attempts counts as weak. */
  accuracyThreshold: number;
}

const DEFAULT_WEAK_KEY_OPTIONS: WeakKeyOptions = { minAttempts: 6, accuracyThreshold: 90 };

/**
 * Keys with enough data to be meaningful and below the accuracy threshold,
 * worst-first. A key with too few attempts is excluded outright rather than
 * treated as 0% weak — sparse data isn't evidence, and the whole point of
 * this function is to never fabricate a weakness the data doesn't support.
 */
export function getWeakKeys(
  stats: Readonly<Record<string, KeyStat>>,
  options: Partial<WeakKeyOptions> = {},
): string[] {
  const { minAttempts, accuracyThreshold } = { ...DEFAULT_WEAK_KEY_OPTIONS, ...options };

  return Object.entries(stats)
    .filter(([, s]) => s.attempts >= minAttempts)
    .map(([key, s]) => ({ key, accuracy: ((s.attempts - s.errors) / s.attempts) * 100 }))
    .filter((s) => s.accuracy < accuracyThreshold)
    .sort((a, b) => a.accuracy - b.accuracy)
    .map((s) => s.key);
}
