// Pure calculation core for the WPM/CPM/KPH calculator (/guides/wpm-cpm-kph-calculator).
// Mirrors the same 5-characters-per-word convention and net-WPM formula as
// the live typing engine (src/lib/typing-engine/stats.ts: correct chars only,
// errors simply excluded rather than subtracted as a penalty) -- see
// /guides/net-wpm-vs-gross-wpm for why that specific choice matters and how
// it differs from the gross-minus-penalty formula some other tests use.

export const CHARS_PER_WORD = 5;

export interface TestInput {
  /** Total characters typed, correct and incorrect, including spaces and punctuation. */
  charactersTyped: number;
  /** Characters typed incorrectly (uncorrected errors). Must be <= charactersTyped. */
  errors: number;
  /** Test duration in seconds. */
  seconds: number;
}

export interface TestResult {
  grossWpm: number;
  netWpm: number;
  cpm: number;
  kph: number;
  accuracy: number;
  correctCharacters: number;
}

/** Returns null for a non-positive duration or a negative input -- there's no meaningful rate to report. */
export function calculateFromTest({ charactersTyped, errors, seconds }: TestInput): TestResult | null {
  if (seconds <= 0 || charactersTyped < 0 || errors < 0) return null;
  const clampedErrors = Math.min(errors, charactersTyped);
  const correctCharacters = charactersTyped - clampedErrors;
  const minutes = seconds / 60;

  const grossWpm = charactersTyped / CHARS_PER_WORD / minutes;
  const netWpm = correctCharacters / CHARS_PER_WORD / minutes;
  const cpm = charactersTyped / minutes;
  const kph = cpm * 60;
  const accuracy = charactersTyped > 0 ? (correctCharacters / charactersTyped) * 100 : 100;

  return { grossWpm, netWpm, cpm, kph, accuracy, correctCharacters };
}

/** Direct, lossless conversions -- no test data needed, just the fixed 5-char/word and 60 min/hour relationships. */
export const wpmToCpm = (wpm: number): number => wpm * CHARS_PER_WORD;
export const cpmToWpm = (cpm: number): number => cpm / CHARS_PER_WORD;
export const cpmToKph = (cpm: number): number => cpm * 60;
export const kphToCpm = (kph: number): number => kph / 60;
export const wpmToKph = (wpm: number): number => wpmToCpm(wpm) * 60;
export const kphToWpm = (kph: number): number => cpmToWpm(kphToCpm(kph));

export function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
