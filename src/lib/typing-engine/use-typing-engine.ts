import { useCallback, useEffect, useReducer, useRef } from "react";
import type { CharState, CharTally, TestConfig, TestState, WordState } from "@/lib/typing-engine/engine-types";
import { generateWords } from "@/lib/typing-engine/word-generator";
import { pickRandomQuote } from "@/lib/typing-engine/quotes";
import { calculateNetWpm, emptyCharTally, MIN_LIVE_WPM_WINDOW_MS } from "@/lib/typing-engine/stats";

const TIME_MODE_BATCH = 40;
const TIME_MODE_LOOKAHEAD = 15;
const TICK_INTERVAL_MS = 100;

type EngineAction =
  | { type: "SET_TYPED"; value: string; now: number }
  | { type: "COMMIT_WORD"; now: number }
  | { type: "TICK"; now: number }
  | { type: "RESTART" }
  | { type: "APPLY_CONFIG"; config: TestConfig };

function computeCharStates(target: string, typed: string): CharState[] {
  const len = Math.max(target.length, typed.length);
  const chars: CharState[] = new Array(len);
  for (let i = 0; i < len; i++) {
    if (i >= target.length) chars[i] = "extra";
    else if (i >= typed.length) chars[i] = "pending";
    else chars[i] = typed[i] === target[i] ? "correct" : "incorrect";
  }
  return chars;
}

function buildWords(config: TestConfig): { words: string[]; quoteSource: string | null } {
  const options = { punctuation: config.punctuation, numbers: config.numbers };
  switch (config.mode) {
    case "time":
      // Double the usual top-up batch so a fast typist doesn't hit the
      // COMMIT_WORD lookahead check within the first few words of the test.
      return { words: generateWords(TIME_MODE_BATCH * 2, options), quoteSource: null };
    case "words":
      return { words: generateWords(config.wordCount, options), quoteSource: null };
    case "quote": {
      const quote = pickRandomQuote(config.quoteLength);
      return { words: quote.text.split(" ").filter(Boolean), quoteSource: quote.source };
    }
    case "custom":
      return { words: config.customText.trim().split(/\s+/).filter(Boolean), quoteSource: null };
  }
}

function createInitialState(config: TestConfig): TestState {
  const { words, quoteSource } = buildWords(config);
  return {
    status: "idle",
    config,
    words,
    wordStates: words.map((w) => ({ target: w, typed: "", chars: [] })),
    activeWordIndex: 0,
    startedAt: null,
    elapsedMs: 0,
    correctKeystrokes: 0,
    incorrectKeystrokes: 0,
    wpmSamples: [],
    charTally: emptyCharTally(),
    quoteSource,
  };
}

function tallyWord(tally: CharTally, word: WordState): CharTally {
  const next = { ...tally };
  for (const c of word.chars) {
    if (c === "correct") next.correct += 1;
    else if (c === "incorrect") next.incorrect += 1;
    else if (c === "extra") next.extra += 1;
  }
  if (word.typed.length < word.target.length) {
    next.missed += word.target.length - word.typed.length;
  }
  return next;
}

function finalize(state: TestState, tally: CharTally, now: number): TestState {
  const elapsedMs = state.startedAt !== null ? now - state.startedAt : state.elapsedMs;
  return { ...state, status: "finished", charTally: tally, elapsedMs };
}

function reducer(state: TestState, action: EngineAction): TestState {
  switch (action.type) {
    case "APPLY_CONFIG":
      return createInitialState(action.config);

    case "RESTART":
      return createInitialState(state.config);

    case "SET_TYPED": {
      if (state.status === "finished") return state;
      const activeIndex = state.activeWordIndex;
      const target = state.words[activeIndex];
      if (target === undefined) return state;

      const prevWordState = state.wordStates[activeIndex];
      const prevTyped = prevWordState.typed;
      const newTyped = action.value;
      const chars = computeCharStates(target, newTyped);

      // Loops rather than assuming a single new character so a multi-character
      // insertion (IME composition, programmatic autofill — paste itself is
      // blocked in HiddenInput) still credits/blames each character instead
      // of silently under-counting keystrokes.
      let correctKeystrokes = state.correctKeystrokes;
      let incorrectKeystrokes = state.incorrectKeystrokes;
      for (let i = prevTyped.length; i < newTyped.length; i++) {
        const isCorrect = i < target.length && newTyped[i] === target[i];
        if (isCorrect) correctKeystrokes += 1;
        else incorrectKeystrokes += 1;
      }

      const nextWordStates = [...state.wordStates];
      nextWordStates[activeIndex] = { target, typed: newTyped, chars };

      let status = state.status;
      let startedAt = state.startedAt;
      if (status === "idle") {
        status = "running";
        startedAt = action.now;
      }

      const isLastWord = activeIndex === state.words.length - 1;
      const isExactMatch = newTyped === target;
      const shouldAutoFinish = state.config.mode !== "time" && isLastWord && isExactMatch;

      const nextState: TestState = {
        ...state,
        wordStates: nextWordStates,
        correctKeystrokes,
        incorrectKeystrokes,
        status,
        startedAt,
      };

      if (shouldAutoFinish) {
        return finalize(nextState, tallyWord(state.charTally, nextWordStates[activeIndex]), action.now);
      }

      return nextState;
    }

    case "COMMIT_WORD": {
      if (state.status === "finished") return state;
      const activeIndex = state.activeWordIndex;
      const wordState = state.wordStates[activeIndex];
      if (!wordState || wordState.typed.length === 0) return state;

      const tally = tallyWord(state.charTally, wordState);
      const isLastWord = activeIndex === state.words.length - 1;

      if (state.config.mode !== "time" && isLastWord) {
        return finalize(state, tally, action.now);
      }

      let words = state.words;
      let wordStates = state.wordStates;
      const nextIndex = activeIndex + 1;

      if (state.config.mode === "time" && words.length - nextIndex < TIME_MODE_LOOKAHEAD) {
        const more = generateWords(TIME_MODE_BATCH, {
          punctuation: state.config.punctuation,
          numbers: state.config.numbers,
        });
        words = [...words, ...more];
        wordStates = [...wordStates, ...more.map((w) => ({ target: w, typed: "", chars: [] as CharState[] }))];
      }

      return { ...state, words, wordStates, activeWordIndex: nextIndex, charTally: tally };
    }

    case "TICK": {
      if (state.status !== "running" || state.startedAt === null) return state;
      const elapsedMs = action.now - state.startedAt;
      // Samples from the first second are dropped rather than computed: a
      // WPM figure from a handful of milliseconds is noise, and feeding it
      // into the consistency calculation would just skew that score.
      const wpmSamples =
        elapsedMs >= MIN_LIVE_WPM_WINDOW_MS
          ? [...state.wpmSamples, { t: elapsedMs, wpm: calculateNetWpm(state.correctKeystrokes, elapsedMs) }]
          : state.wpmSamples;

      if (state.config.mode === "time" && elapsedMs >= state.config.timeDuration * 1000) {
        const activeWord = state.wordStates[state.activeWordIndex];
        const tally = activeWord ? tallyWord(state.charTally, activeWord) : state.charTally;
        return finalize({ ...state, wpmSamples, elapsedMs: state.config.timeDuration * 1000 }, tally, action.now);
      }

      return { ...state, elapsedMs, wpmSamples };
    }
  }
}

export function useTypingEngine(initialConfig: TestConfig) {
  const [state, dispatch] = useReducer(reducer, initialConfig, createInitialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.status !== "running") return;
    intervalRef.current = setInterval(() => dispatch({ type: "TICK", now: Date.now() }), TICK_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.status]);

  const setTyped = useCallback((value: string) => dispatch({ type: "SET_TYPED", value, now: Date.now() }), []);
  const commitWord = useCallback(() => dispatch({ type: "COMMIT_WORD", now: Date.now() }), []);
  const restart = useCallback(() => dispatch({ type: "RESTART" }), []);
  const applyConfig = useCallback((config: TestConfig) => dispatch({ type: "APPLY_CONFIG", config }), []);

  return { state, setTyped, commitWord, restart, applyConfig };
}
