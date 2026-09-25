import { useCallback, useEffect, useReducer } from "react";
import type { VocabDifficulty, VocabWord } from "@/lib/vocabulary/vocabulary-words";

/** How often the live clock advances while a round is running. */
export const TICK_MS = 200;

export interface VocabWordResult {
  word: string;
  /** True only if the word was typed with zero incorrect keystrokes. */
  correct: boolean;
}

export interface VocabTestState {
  status: "idle" | "running" | "over";
  difficulty: VocabDifficulty;
  words: VocabWord[];
  index: number;
  typed: string;
  correctKeystrokes: number;
  incorrectKeystrokes: number;
  startedAtMs: number | null;
  elapsedMs: number;
  results: VocabWordResult[];
  mistakeThisWord: boolean;
}

type VocabTestAction =
  | { type: "START"; difficulty: VocabDifficulty; words: VocabWord[] }
  | { type: "SET_TYPED"; value: string }
  | { type: "TICK" }
  | { type: "RESET" };

export function createInitialState(): VocabTestState {
  return {
    status: "idle",
    difficulty: "easy",
    words: [],
    index: 0,
    typed: "",
    correctKeystrokes: 0,
    incorrectKeystrokes: 0,
    startedAtMs: null,
    elapsedMs: 0,
    results: [],
    mistakeThisWord: false,
  };
}

function advanceWord(state: VocabTestState): VocabTestState {
  const current = state.words[state.index];
  const results = [...state.results, { word: current.word, correct: !state.mistakeThisWord }];
  const index = state.index + 1;

  if (index >= state.words.length) {
    return {
      ...state,
      status: "over",
      results,
      typed: "",
      index,
      elapsedMs: state.startedAtMs === null ? state.elapsedMs : Date.now() - state.startedAtMs,
    };
  }

  return { ...state, results, typed: "", index, mistakeThisWord: false };
}

export function reducer(state: VocabTestState, action: VocabTestAction): VocabTestState {
  switch (action.type) {
    case "START":
      return {
        ...createInitialState(),
        status: "running",
        difficulty: action.difficulty,
        words: action.words,
        startedAtMs: Date.now(),
      };

    case "RESET":
      return createInitialState();

    case "TICK": {
      if (state.status !== "running" || state.startedAtMs === null) return state;
      return { ...state, elapsedMs: Date.now() - state.startedAtMs };
    }

    case "SET_TYPED": {
      if (state.status !== "running") return state;
      const target = state.words[state.index]?.word ?? "";
      const prevTyped = state.typed;
      const value = action.value;

      let correctKeystrokes = state.correctKeystrokes;
      let incorrectKeystrokes = state.incorrectKeystrokes;
      let mistakeThisWord = state.mistakeThisWord;

      // Only newly appended characters are scored — matches every other
      // engine in this codebase: backspacing edits the buffer but never
      // un-counts a keystroke that already happened.
      if (value.length > prevTyped.length) {
        for (let i = prevTyped.length; i < value.length; i++) {
          const isTrailingSpaceCommit =
            i === target.length &&
            value[i] === " " &&
            value.slice(0, target.length) === target;

          if (isTrailingSpaceCommit) {
            continue;
          }

          if (value[i] === target[i]) {
            correctKeystrokes++;
          } else {
            incorrectKeystrokes++;
            mistakeThisWord = true;
          }
        }
      }

      const next: VocabTestState = { ...state, typed: value, correctKeystrokes, incorrectKeystrokes, mistakeThisWord };
      const trimmed = value.trim();
      const isMatch = value === target || (value.endsWith(" ") && trimmed === target);
      if (target.length > 0 && isMatch) return advanceWord(next);
      return next;
    }

    default:
      return state;
  }
}

export function useVocabularyTest() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  useEffect(() => {
    if (state.status !== "running") return;
    const id = setInterval(() => dispatch({ type: "TICK" }), TICK_MS);
    return () => clearInterval(id);
  }, [state.status]);

  const start = useCallback(
    (difficulty: VocabDifficulty, words: VocabWord[]) => dispatch({ type: "START", difficulty, words }),
    [],
  );
  const setTyped = useCallback((value: string) => dispatch({ type: "SET_TYPED", value }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { state, start, setTyped, reset };
}
