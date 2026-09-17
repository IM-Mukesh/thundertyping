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

/** Consistency is measured over whole seconds of typing, not raw ticks. */
export const CONSISTENCY_BUCKET_MS = 1000;

/**
 * How evenly the typing was paced, as 100 minus the coefficient of variation
 * of per-second speed.
 *
 * The samples arrive as *cumulative* figures, and this deliberately does not
 * use their `wpm` field. A cumulative average converges by construction: its
 * spread shrinks as the test runs regardless of how erratic the typing was,
 * so scoring its deviation rewards nothing but test length and reports a high
 * number for everyone. Real bursts and pauses only show up in *instantaneous*
 * speed, which is what the per-bucket deltas below recover.
 *
 * Buckets are one second wide. The 100ms tick is too fine to be meaningful --
 * at 80 WPM a single tick holds under two characters, so rounding alone swings
 * the per-tick rate by tens of WPM and the score would measure sampling noise.
 */
export function calculateConsistency(samples: WpmSample[]): number {
  if (samples.length < 2) return 100;

  // Collapse the ticks into one-second buckets, keeping the last cumulative
  // reading in each, then difference them to get each second's own output.
  const buckets: WpmSample[] = [];
  for (const sample of samples) {
    const index = Math.floor(sample.t / CONSISTENCY_BUCKET_MS);
    const previous = buckets[buckets.length - 1];
    if (previous && Math.floor(previous.t / CONSISTENCY_BUCKET_MS) === index) {
      buckets[buckets.length - 1] = sample;
    } else {
      buckets.push(sample);
    }
  }
  if (buckets.length < 2) return 100;

  const rates: number[] = [];
  for (let i = 1; i < buckets.length; i++) {
    const deltaMs = buckets[i].t - buckets[i - 1].t;
    if (deltaMs <= 0) continue;
    const deltaChars = buckets[i].typed - buckets[i - 1].typed;
    rates.push(deltaChars / CHARS_PER_WORD / (deltaMs / 60000));
  }
  if (rates.length < 2) return 100;

  const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
  if (mean <= 0) return 0;
  const variance = rates.reduce((sum, v) => sum + (v - mean) ** 2, 0) / rates.length;
  const consistency = 100 - (Math.sqrt(variance) / mean) * 100;
  return Math.max(0, Math.min(100, consistency));
}

export function emptyCharTally(): CharTally {
  return { extra: 0, missed: 0 };
}

export function round(value: number): number {
  return Math.round(value);
}
