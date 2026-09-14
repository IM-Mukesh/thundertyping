export type TestMode = "time" | "words" | "quote" | "custom";
export type TimeDuration = 15 | 30 | 60 | 120;
export type WordCountOption = 10 | 25 | 50 | 100;
export type QuoteLength = "short" | "medium" | "long";

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
}

export interface CharTally {
  correct: number;
  incorrect: number;
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

export interface TestResult {
  mode: TestMode;
  config: TestConfig;
  netWpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  charTally: CharTally;
  durationMs: number;
}
