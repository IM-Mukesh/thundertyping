import type { CharTally, WordState, WpmSample } from "@/lib/typing-engine/engine-types";

const CHARS_PER_WORD = 5;

/**
 * Net WPM scoring characters (Concept F).
 *
 * In accordance with standard typing test rules (e.g. Monkeytype):
 * - Characters in a committed word only contribute to Net WPM if the word was
 *   typed completely correctly without uncorrected errors.
 * - An inter-word separator (space) only contributes if the word it follows
 *   was completed correctly.
 * - For an uncommitted active word (e.g. during live typing or upon time-mode
 *   expiration), typed characters contribute only if they match the target
 *   prefix without error (i.e. target.startsWith(typed)). If there are any
 *   errors or extra characters, the active word contributes 0.
 */
export function calculateNetWpmCharacters(
  words: readonly string[],
  wordStates: readonly WordState[],
  activeWordIndex: number,
): number {
  let chars = 0;
  const lastIndex = words.length - 1;

  // 1. Committed words (0 through activeWordIndex - 1)
  const committedCount = Math.min(activeWordIndex, wordStates.length);
  for (let i = 0; i < committedCount; i++) {
    const ws = wordStates[i];
    if (ws && ws.typed === ws.target) {
      chars += ws.target.length;
      if (i < lastIndex) {
        chars += 1; // Inter-word separator for correctly completed word
      }
    }
  }

  // 2. Active word (if in-progress and within range)
  if (activeWordIndex < wordStates.length) {
    const active = wordStates[activeWordIndex];
    if (active && active.typed.length > 0) {
      if (active.typed === active.target) {
        chars += active.target.length;
      } else if (active.target.startsWith(active.typed)) {
        // Clean prefix in progress without errors
        chars += active.typed.length;
      }
    }
  }

  return chars;
}

// A WPM figure computed from a few keystrokes over a handful of milliseconds
// is mathematically unstable (one correct char at 5ms elapsed implies a
// ~12,000 WPM pace). Flooring the time denominator for *live* display keeps
// the number sane during the first second, then converges to the real value
// once enough time has actually passed. The final result always uses the
// true elapsed time, never this floor.
export const MIN_LIVE_WPM_WINDOW_MS = 1000;

export function calculateLiveWpm(correct: number, elapsedMs: number): number {
  return calculateNetWpm(correct, Math.max(elapsedMs, MIN_LIVE_WPM_WINDOW_MS));
}

export function calculateRawWpm(correct: number, incorrect: number, elapsedMs: number): number {
  const minutes = elapsedMs / 60000;
  if (minutes <= 0) return 0;
  return (correct + incorrect) / CHARS_PER_WORD / minutes;
}

export function calculateNetWpm(correct: number, elapsedMs: number): number {
  const minutes = elapsedMs / 60000;
  if (minutes <= 0) return 0;
  return correct / CHARS_PER_WORD / minutes;
}

/**
 * Skipped characters count against accuracy.
 *
 * `missed` is included because accuracy computed from keystrokes alone can
 * only see characters the user actually pressed — so spacing past "Among;" or
 * "98" produced a flawless 100% on a run with visible skips, which is the
 * opposite of what the number is meant to communicate. Extra characters are
 * already inside `incorrect` (a keystroke past the end of the word is counted
 * as wrong when it happens), so they must not be added again here.
 *
 * `missed` defaults to 0 so callers without a character tally — the games,
 * which track missed *words*, not characters — keep the keystroke-only
 * meaning that's correct for them.
 */
export function calculateAccuracy(correct: number, incorrect: number, missed = 0): number {
  const total = correct + incorrect + missed;
  if (total <= 0) return 100;
  return (correct / total) * 100;
}

/** Consistency is measured over whole seconds of typing, not raw ticks. */
export const CONSISTENCY_BUCKET_MS = 1000;

/**
 * Calculates consistency by mapping COV from [0, +infinity) to [100, 0).
 * Matches Monkeytype's exact kogasa sigmoid mapping (packages/util/src/numbers.ts).
 */
export function kogasa(cov: number): number {
  return 100 * (1 - Math.tanh(cov + Math.pow(cov, 3) / 3 + Math.pow(cov, 5) / 5));
}

/**
 * How evenly the typing was paced, calculated from per-second raw WPM rates
 * using Monkeytype's exact standard deviation / mean coefficient of variation
 * and kogasa sigmoid mapping.
 *
 * Samples arrive as cumulative counts. We reconstruct the exact 1-second grid
 * boundaries starting from t = 0 (0 characters typed), find the cumulative
 * keystroke count at each 1-second boundary, and derive each second's discrete rate.
 * Short tail fragments under 500ms are discarded to prevent boundary artifacts.
 */
export function calculateConsistency(samples: WpmSample[]): number {
  if (samples.length < 2) return 100;

  const endMs = samples[samples.length - 1].t;
  const tickCount = Math.floor(endMs / CONSISTENCY_BUCKET_MS);
  if (tickCount < 1) return 100;

  // Reconstruct cumulative typed characters at each 1-second boundary (0, 1000, 2000, ..., tickCount * 1000).
  // Baseline at t = 0 is always 0 characters.
  const typedAtBoundary = [0];
  for (let s = 1; s <= tickCount; s++) {
    const targetMs = s * CONSISTENCY_BUCKET_MS;
    let closestSample: WpmSample | null = null;
    for (const sample of samples) {
      if (sample.t <= targetMs) {
        if (!closestSample || sample.t > closestSample.t) {
          closestSample = sample;
        }
      }
    }
    typedAtBoundary.push(closestSample ? closestSample.typed : 0);
  }

  // Derive per-second raw WPM rates across full 1-second intervals
  const rates: number[] = [];
  for (let s = 1; s <= tickCount; s++) {
    const deltaChars = typedAtBoundary[s] - typedAtBoundary[s - 1];
    rates.push(Math.round((deltaChars / CHARS_PER_WORD) * 60));
  }

  // Only include tail remainder if >= 500ms (Monkeytype boundary parity)
  const remainderMs = endMs - tickCount * CONSISTENCY_BUCKET_MS;
  if (remainderMs >= 500) {
    const lastTyped = samples[samples.length - 1].typed;
    const deltaChars = lastTyped - typedAtBoundary[tickCount];
    rates.push(Math.round((deltaChars / CHARS_PER_WORD) / (remainderMs / 60000)));
  }

  if (rates.length < 2) return 100;

  const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
  if (mean <= 0) return 0;
  const variance = rates.reduce((sum, v) => sum + (v - mean) ** 2, 0) / rates.length;
  const cov = Math.sqrt(variance) / mean;

  const consistency = kogasa(cov);
  return Number.isFinite(consistency) ? Math.max(0, Math.min(100, Math.round(consistency * 100) / 100)) : 0;
}

export function emptyCharTally(): CharTally {
  return { extra: 0, missed: 0 };
}

export function round(value: number): number {
  return Math.round(value);
}
