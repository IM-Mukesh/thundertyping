import type { CharTally, WpmSample } from "@/lib/typing-engine/engine-types";

const CHARS_PER_WORD = 5;

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

export function calculateConsistency(samples: WpmSample[]): number {
  if (samples.length < 2) return 100;
  const values = samples.map((s) => s.wpm);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean <= 0) return 100;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const stddev = Math.sqrt(variance);
  const consistency = 100 - (stddev / mean) * 100;
  return Math.max(0, Math.min(100, consistency));
}

export function emptyCharTally(): CharTally {
  return { extra: 0, missed: 0 };
}

export function round(value: number): number {
  return Math.round(value);
}
