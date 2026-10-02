import type { VocabDifficulty } from "@/lib/vocabulary/vocabulary-words";
import type { WordDifficulty } from "@/lib/typing-engine/word-generator";

export type TestMode = "time" | "words" | "quote" | "custom" | "vocabulary";
// Any positive integer is valid (see MIN/MAX_CUSTOM_TIME_DURATION below) -
// the literal union of presets was widened to plain `number` so a
// user-entered custom duration has somewhere to live without a second field.
export type TimeDuration = number;
export type WordCountOption = 10 | 25 | 50 | 100;
export type QuoteLength = "short" | "medium" | "long";

export const TIME_DURATIONS: TimeDuration[] = [15, 30, 60, 120];
export const WORD_COUNTS: WordCountOption[] = [10, 25, 50, 100];
export const QUOTE_LENGTHS: QuoteLength[] = ["short", "medium", "long"];
export const MIN_CUSTOM_TIME_DURATION = 1;
export const MAX_CUSTOM_TIME_DURATION = 86400; // 24 hours

export interface TestConfig {
  mode: TestMode;
  timeDuration: TimeDuration;
  wordCount: WordCountOption;
  quoteLength: QuoteLength;
  customText: string;
  punctuation: boolean;
  numbers: boolean;
  vocabDifficulty: VocabDifficulty;
  wordDifficulty: WordDifficulty;
}

// "missed" is a character the user skipped past by committing the word early.
// It only ever appears on a word that's already been committed — the active
// word's untyped characters stay "pending" (dim), because they aren't skipped
// yet. Kept distinct from "incorrect" so the two can be told apart visually and
// counted separately.
export type CharState = "pending" | "correct" | "incorrect" | "extra" | "missed";

export interface WordState {
  target: string;
  typed: string;
  chars: CharState[];
}

export type TestStatus = "idle" | "running" | "finished";

export interface WpmSample {
  t: number;
  /** Cumulative net WPM at time `t`. Drives the results graph. */
  wpm: number;
  /** Cumulative raw WPM at time `t`. Drives the results graph. */
  rawWpm: number;
  /**
   * Cumulative character counts at time `t`.
   *
   * Stored raw so consistency can reconstruct *instantaneous* speed per
   * interval. Deriving it back out of the WPM figures above would work
   * arithmetically but accumulates float error at 100ms resolution.
   */
  correct: number;
  typed: number;
}

// "correct"/"incorrect" deliberately live on TestState directly
// (correctKeystrokes/incorrectKeystrokes), not here — see the comment on
// tallyWord in use-typing-engine.ts for why.
export interface CharTally {
  extra: number;
  missed: number;
}

export interface TestState {
  status: TestStatus;
  config: TestConfig;
  words: string[];
  wordStates: WordState[];
  activeWordIndex: number;
  startedAt: number | null;
  elapsedMs: number;
  correctKeystrokes: number;
  incorrectKeystrokes: number;
  /**
   * Net WPM scoring characters (Concept F).
   *
   * Characters from completely correct words + valid inter-word separators
   * (plus clean uncorrupted prefixes of the active word), which drives Net WPM
   * scoring according to standard 5-character word normalization.
   */
  netWpmCharacters: number;
  /**
   * Net WPM characters already locked in from committed words (everything
   * before `activeWordIndex`) -- the running total `netWpmCharacters` is
   * rebuilt from on every keystroke as committedNetWpmChars + the active
   * word's own contribution, an O(1) update instead of re-summing every
   * committed word on every keystroke. Internal to the reducer; nothing
   * outside use-typing-engine.ts should need this.
   */
  committedNetWpmChars: number;
  /**
   * Every printable character attempt, including the spaces between words.
   *
   * Kept alongside correct/incorrect because those two are what the WPM
   * formulas consume, while this is what the results screen reports as
   * "total typed" -- and a reader should be able to check that the breakdown
   * adds up without doing arithmetic in their head.
   */
  totalTyped: number;
  /**
   * Physical key events the engine accepted, including Backspace. Diagnostic
   * only: it is deliberately NOT a character count and never feeds a score.
   */
  totalKeypresses: number;
  /** Wrong characters the user backspaced away and retyped correctly. */
  correctedErrors: number;
  wpmSamples: WpmSample[];
  charTally: CharTally;
  quoteSource: string | null;
}

