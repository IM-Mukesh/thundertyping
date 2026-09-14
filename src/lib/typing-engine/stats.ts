import type { CharTally, WpmSample } from "@/lib/typing-engine/engine-types";

const CHARS_PER_WORD = 5;

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

export function calculateAccuracy(correct: number, incorrect: number): number {
  const total = correct + incorrect;
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
  return { correct: 0, incorrect: 0, extra: 0, missed: 0 };
}

export function round(value: number): number {
  return Math.round(value);
}
