export type TestMode = "time" | "words" | "quote" | "custom";
export type TimeDuration = 15 | 30 | 60 | 120;
export type WordCountOption = 10 | 25 | 50 | 100;
export type QuoteLength = "short" | "medium" | "long";

export const TIME_DURATIONS: TimeDuration[] = [15, 30, 60, 120];
export const WORD_COUNTS: WordCountOption[] = [10, 25, 50, 100];
export const QUOTE_LENGTHS: QuoteLength[] = ["short", "medium", "long"];

export interface TestConfig {
  mode: TestMode;
  timeDuration: TimeDuration;
  wordCount: WordCountOption;
  quoteLength: QuoteLength;
  customText: string;
  punctuation: boolean;
  numbers: boolean;
}

export type CharState = "pending" | "correct" | "incorrect" | "extra";

export interface WordState {
  target: string;
  typed: string;
  chars: CharState[];
}

export type TestStatus = "idle" | "running" | "finished";

export interface WpmSample {
  t: number;
  wpm: number;
  rawWpm: number;
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
  wpmSamples: WpmSample[];
  charTally: CharTally;
  quoteSource: string | null;
}

