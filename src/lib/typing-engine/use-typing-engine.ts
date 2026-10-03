import { useCallback, useEffect, useReducer, useRef } from "react";
import type { CharState, CharTally, TestConfig, TestState, WordState } from "@/lib/typing-engine/engine-types";
import { generateWords } from "@/lib/typing-engine/word-generator";
import { pickRandomQuote } from "@/lib/typing-engine/quotes";
import { pickPracticeWords } from "@/lib/vocabulary/vocabulary-content";
import {
  calculateActiveWordNetWpmChars,
  calculateCommittedWordNetWpmChars,
  calculateNetWpm,
  calculateRawWpm,
  emptyCharTally,
  MIN_LIVE_WPM_WINDOW_MS,
} from "@/lib/typing-engine/stats";

const TIME_MODE_BATCH = 40;
const TIME_MODE_LOOKAHEAD = 15;
const TICK_INTERVAL_MS = 100;

type EngineAction =
  | { type: "SET_TYPED"; value: string; now: number }
  | { type: "COMMIT_WORD"; now: number }
  | { type: "TICK"; now: number }
  | { type: "RESTART" }
  | { type: "APPLY_CONFIG"; config: TestConfig };

// Finds the minimal edit region between two strings via common prefix/suffix,
// so a diff isn't forced to assume every edit is a pure tail append or a pure
// tail backspace. Native cursor movement (arrow keys, Home/End) plus
// select-and-retype are not blocked by HiddenInput -- only Space/Tab/Escape
// are -- so a same-length or mid-string edit is a real, reachable case, not
// just a defensive guard.
function computeEditRegion(
  prev: string,
  next: string,
): { prevStart: number; prevEnd: number; nextStart: number; nextEnd: number } {
  const maxPrefix = Math.min(prev.length, next.length);
  let prefixLen = 0;
  while (prefixLen < maxPrefix && prev[prefixLen] === next[prefixLen]) prefixLen++;

  const maxSuffix = Math.min(prev.length, next.length) - prefixLen;
  let suffixLen = 0;
  while (
    suffixLen < maxSuffix &&
    prev[prev.length - 1 - suffixLen] === next[next.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  return {
    prevStart: prefixLen,
    prevEnd: prev.length - suffixLen,
    nextStart: prefixLen,
    nextEnd: next.length - suffixLen,
  };
}

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
  const options = {
    punctuation: config.punctuation,
    numbers: config.numbers,
    wordDifficulty: config.wordDifficulty,
  };
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
    case "custom": {
      const parsed = config.customText.trim().split(/\s+/).filter(Boolean);
      const fallback = ["The", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog"];
      return { words: parsed.length > 0 ? parsed : fallback, quoteSource: null };
    }
    case "vocabulary":
      return { words: pickPracticeWords(config.vocabDifficulty, config.wordCount), quoteSource: null };
  }
}

export function createInitialState(config: TestConfig): TestState {
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
    netWpmCharacters: 0,
    committedNetWpmChars: 0,
    totalTyped: 0,
    totalKeypresses: 0,
    correctedErrors: 0,
    wpmSamples: [],
    charTally: emptyCharTally(),
    quoteSource,
  };
}

// Deliberately does NOT tally "correct"/"incorrect" here — those come from
// state.correctKeystrokes/incorrectKeystrokes (full keystroke history), so
// the results screen's accuracy% and its correct/incorrect breakdown always
// agree. A per-word tally would only reflect the *final* state of each word,
// silently forgiving any backspaced-out mistake — accuracy would then say
// e.g. 75% while the breakdown said "0 incorrect", which is confusing, not
// wrong-looking-by-coincidence (this was a real, reported, reproduced bug).
// "extra"/"missed" have no keystroke-history equivalent — they're inherently
// about what's left over in the *final* submitted text — so they stay here.

// Every target character the user never typed before committing the word.
//
// Punctuation used to be exempt here, so spacing past "Among;" or "98" cost
// nothing. That was an explicit earlier request, and it was explicitly
// reversed later: skipping a character is a mistake whatever the character
// is. Treating punctuation and digits as free also made accuracy read 100%
// on a run with visible skips, which is what surfaced it.
function countMissed(target: string, typed: string): number {
  return Math.max(0, target.length - typed.length);
}

function tallyWord(
  tally: CharTally,
  word: WordState,
  // Time-mode expiry interrupts a word mid-typing. Those untyped characters
  // weren't skipped — the clock simply ran out — so they must not be counted
  // as misses or the last partial word silently inflates the error count.
  { countMissedChars = true }: { countMissedChars?: boolean } = {},
): CharTally {
  const next = { ...tally };
  for (const c of word.chars) {
    if (c === "extra") next.extra += 1;
  }
  if (countMissedChars) next.missed += countMissed(word.target, word.typed);
  return next;
}

// Re-labels the characters the user skipped so the word-stream can render them
// as errors instead of leaving them dim like untyped text. Only applied once a
// word is committed — while it's still active, untyped characters are simply
// not typed yet, not mistakes.
function markMissedChars(word: WordState): WordState {
  if (word.typed.length >= word.target.length) return word;
  return {
    ...word,
    chars: word.chars.map((c, i) =>
      i >= word.typed.length && i < word.target.length ? "missed" : c,
    ),
  };
}

// `elapsedMsOverride` pins the recorded duration for a time-mode test that ran
// to completion: the tick runs every TICK_INTERVAL_MS, so wall-clock elapsed
// overshoots the nominal duration by up to that interval, and a 30s test would
// otherwise record ~30.1s and report WPM a few tenths of a percent low. Every
// other finish path (auto-finish on the last word, committing the last word)
// omits it and uses true elapsed time, which is correct for those.
function finalize(state: TestState, tally: CharTally, now: number, elapsedMsOverride?: number): TestState {
  const elapsedMs =
    elapsedMsOverride ?? (state.startedAt !== null ? now - state.startedAt : state.elapsedMs);
  return { ...state, status: "finished", charTally: tally, elapsedMs };
}

/**
 * Exported for tests.
 *
 * The reducer is the whole scoring engine and is already pure: given a state
 * and an action it returns the next state, with no reference to the DOM, to
 * React, or to a clock it owns. Exporting it lets the counters be driven and
 * asserted directly -- through a rendered component, a dropped keystroke and a
 * missed render are indistinguishable.
 */
export function reducer(state: TestState, action: EngineAction): TestState {
  switch (action.type) {
    case "APPLY_CONFIG":
      return createInitialState(action.config);

    case "RESTART":
      return createInitialState(state.config);

    case "SET_TYPED": {
      if (state.status === "finished") return state;
      if (state.status === "running" && state.config.mode === "time" && state.startedAt !== null &&
          action.now - state.startedAt >= state.config.timeDuration * 1000) {
        const activeWord = state.wordStates[state.activeWordIndex];
        return finalize(state, activeWord ? tallyWord(state.charTally, activeWord, { countMissedChars: false }) : state.charTally,
          action.now, state.config.timeDuration * 1000);
      }
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
      let totalTyped = state.totalTyped;
      let correctedErrors = state.correctedErrors;

      // A single contiguous edit region (common-prefix/common-suffix diff)
      // covers pure append, pure backspace, AND a cursor-repositioned
      // insert/delete/replace with the same logic -- rather than assuming
      // the edit can only ever happen at the tail.
      const region = computeEditRegion(prevTyped, newTyped);

      // Characters removed from their old position: deleting a mistake does
      // not un-make it (correctKeystrokes/incorrectKeystrokes are a running
      // history, never decremented), but a wrong character that gets removed
      // is recorded as corrected, so the results screen can distinguish
      // "typed badly" from "typed badly and fixed it".
      for (let i = region.prevStart; i < region.prevEnd; i++) {
        const wasWrong = i >= target.length || prevTyped[i] !== target[i];
        if (wasWrong) correctedErrors += 1;
      }

      // Characters newly present at their new position are genuinely new
      // keystrokes, scored against what the target expects right there.
      for (let i = region.nextStart; i < region.nextEnd; i++) {
        const isCorrect = i < target.length && newTyped[i] === target[i];
        if (isCorrect) correctKeystrokes += 1;
        else incorrectKeystrokes += 1;
        totalTyped += 1;
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

      // committedNetWpmChars already accounts for every word before this one
      // (updated once, on COMMIT_WORD) -- only the active word's own
      // contribution needs recomputing here, so this stays O(1) per keystroke
      // instead of re-summing every committed word every time, which would
      // turn a long test (the engine supports custom durations up to 24
      // hours) into an ever-slower-growing hang as words accumulate.
      const nextNetWpmCharacters =
        state.committedNetWpmChars + calculateActiveWordNetWpmChars(target, newTyped);

      const nextState: TestState = {
        ...state,
        wordStates: nextWordStates,
        correctKeystrokes,
        incorrectKeystrokes,
        netWpmCharacters: nextNetWpmCharacters,
        totalTyped,
        correctedErrors,
        totalKeypresses: state.totalKeypresses + 1,
        status,
        startedAt,
      };

      if (shouldAutoFinish) {
        // A test whose very first keystroke batch also completes its only
        // word (e.g. custom text "a") starts and finishes in this same
        // action, so `now - startedAt` is exactly 0 -- not wrong, but not a
        // meaningful rate either. Floor it to the same minimum window live
        // display already uses for the identical reason (a few ms of elapsed
        // time implies an absurd WPM), rather than reporting a literal 0 WPM
        // for a test the user just successfully completed.
        const elapsedMsOverride =
          startedAt === action.now ? MIN_LIVE_WPM_WINDOW_MS : undefined;
        return finalize(
          nextState,
          tallyWord(state.charTally, nextWordStates[activeIndex]),
          action.now,
          elapsedMsOverride,
        );
      }

      return nextState;
    }

    case "COMMIT_WORD": {
      if (state.status === "finished") return state;
      if (state.status === "running" && state.config.mode === "time" && state.startedAt !== null &&
          action.now - state.startedAt >= state.config.timeDuration * 1000) {
        const activeWord = state.wordStates[state.activeWordIndex];
        return finalize(state, activeWord ? tallyWord(state.charTally, activeWord, { countMissedChars: false }) : state.charTally,
          action.now, state.config.timeDuration * 1000);
      }
      const activeIndex = state.activeWordIndex;
      const wordState = state.wordStates[activeIndex];
      if (!wordState || wordState.typed.length === 0) return state;

      const tally = tallyWord(state.charTally, wordState);
      const isLastWord = activeIndex === state.words.length - 1;
      const isWordCorrect = wordState.typed === wordState.target;

      // The space between two words is part of the target text and standard
      // 5-character word normalization.
      //
      // HOWEVER, a space must NEVER receive correct-character credit merely
      // because Space was pressed:
      // 1. If the word was completed with 100% accuracy (no errors, not
      //    incomplete, no extra characters), the space is a valid separator
      //    attempt and is credited as a correct keystroke.
      // 2. If the word had typos, extra characters, or was incomplete, the
      //    space is an invalid separator attempt / skipping an erroneous word,
      //    so it is counted as an incorrect keystroke.
      // 3. The final word has no trailing separator in the target text and so is
      //    not credited one either way.
      const typedSeparator = !isLastWord;
      const correctKeystrokes =
        state.correctKeystrokes + (typedSeparator && isWordCorrect ? 1 : 0);
      const incorrectKeystrokes =
        state.incorrectKeystrokes + (typedSeparator && !isWordCorrect ? 1 : 0);
      const totalTyped = state.totalTyped + (typedSeparator ? 1 : 0);
      const totalKeypresses = state.totalKeypresses + 1;

      // Committing is what turns "not typed yet" into "skipped", so this is
      // where the skipped characters get marked for display.
      const committedStates = [...state.wordStates];
      committedStates[activeIndex] = markMissedChars(wordState);

      if (state.config.mode !== "time" && isLastWord) {
        // No lookahead refill ever runs outside time mode, so state.words is
        // final here -- isLastWord is safe to use as-is.
        const committedNetWpmChars =
          state.committedNetWpmChars + calculateCommittedWordNetWpmChars(wordState, isLastWord);
        return finalize(
          {
            ...state,
            wordStates: committedStates,
            correctKeystrokes,
            incorrectKeystrokes,
            netWpmCharacters: committedNetWpmChars,
            committedNetWpmChars,
            totalTyped,
            totalKeypresses,
          },
          tally,
          action.now,
        );
      }

      let words = state.words;
      let wordStates = committedStates;
      const nextIndex = activeIndex + 1;

      if (state.config.mode === "time" && words.length - nextIndex < TIME_MODE_LOOKAHEAD) {
        const more = generateWords(TIME_MODE_BATCH, {
          punctuation: state.config.punctuation,
          numbers: state.config.numbers,
          wordDifficulty: state.config.wordDifficulty,
        });
        words = [...words, ...more];
        wordStates = [...wordStates, ...more.map((w) => ({ target: w, typed: "", chars: [] as CharState[] }))];
      }

      // Re-check against the possibly-just-extended `words`, not the earlier
      // `isLastWord` -- a time-mode refill right on this exact commit (the
      // word that trips the lookahead threshold) means this word is no
      // longer actually last, and its separator must still be credited.
      const committedIsLastWord = activeIndex === words.length - 1;
      const committedNetWpmChars =
        state.committedNetWpmChars + calculateCommittedWordNetWpmChars(wordState, committedIsLastWord);

      // The next active word starts empty, so its own contribution is 0 --
      // the running total is exactly committedNetWpmChars until it types.
      return {
        ...state,
        words,
        wordStates,
        activeWordIndex: nextIndex,
        charTally: tally,
        correctKeystrokes,
        incorrectKeystrokes,
        netWpmCharacters: committedNetWpmChars,
        committedNetWpmChars,
        totalTyped,
        totalKeypresses,
      };
    }

    case "TICK": {
      if (state.status !== "running" || state.startedAt === null) return state;
      const elapsedMs = action.now - state.startedAt;
      // Samples from the first second are dropped rather than computed: a
      // WPM figure from a handful of milliseconds is noise, and feeding it
      // into the consistency calculation would just skew that score.
      const wpmSamples =
        elapsedMs >= MIN_LIVE_WPM_WINDOW_MS
          ? [
              ...state.wpmSamples,
              {
                t: elapsedMs,
                wpm: calculateNetWpm(state.netWpmCharacters, elapsedMs),
                rawWpm: calculateRawWpm(state.correctKeystrokes, state.incorrectKeystrokes, elapsedMs),
                correct: state.correctKeystrokes,
                typed: state.totalTyped,
              },
            ]
          : state.wpmSamples;

      if (state.config.mode === "time" && elapsedMs >= state.config.timeDuration * 1000) {
        const activeWord = state.wordStates[state.activeWordIndex];
        const tally = activeWord
          ? tallyWord(state.charTally, activeWord, { countMissedChars: false })
          : state.charTally;
        return finalize({ ...state, wpmSamples }, tally, action.now, state.config.timeDuration * 1000);
      }

      return { ...state, elapsedMs, wpmSamples };
    }
  }
}

/**
 * Monotonic clock for every timestamp the engine records.
 *
 * Date.now() is wall-clock: an NTP correction, a manual clock change or a
 * daylight-saving jump during a test would move it, and a long test could
 * record a duration that never happened. performance.now() only ever moves
 * forward at a steady rate, which is the guarantee a stopwatch needs.
 *
 * Falls back on the server, where the value is never read -- the engine only
 * timestamps in response to real input.
 */
function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function useTypingEngine(initialConfig: TestConfig) {
  const [state, dispatch] = useReducer(reducer, initialConfig, createInitialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.status !== "running") return;
    intervalRef.current = setInterval(() => dispatch({ type: "TICK", now: now() }), TICK_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.status]);

  const setTyped = useCallback((value: string) => dispatch({ type: "SET_TYPED", value, now: now() }), []);
  const commitWord = useCallback(() => dispatch({ type: "COMMIT_WORD", now: now() }), []);
  const restart = useCallback(() => dispatch({ type: "RESTART" }), []);
  const applyConfig = useCallback((config: TestConfig) => dispatch({ type: "APPLY_CONFIG", config }), []);

  return { state, setTyped, commitWord, restart, applyConfig };
}
