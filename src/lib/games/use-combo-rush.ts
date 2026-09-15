import { useCallback, useEffect, useReducer } from "react";
import { generateWords } from "@/lib/typing-engine/word-generator";
import type { GameDefinition, GameStatus } from "@/lib/games/game-types";

// Combo Rush — a time-attack engine, deliberately NOT built on
// `use-falling-words.ts`.
//
// That engine models a spatial board: many concurrent targets, positions, a
// floor, lives. This one has a single active word and one scalar that matters
// (the clock). Reusing it would have meant a board with one lane, an infinite
// fall time and a life count that never changes — i.e. carrying the whole
// spatial model to express none of it. The games architecture note in
// PROGRESS.md draws the line exactly here: tune the shared engine for another
// "words descend, you type them" variant, write a new one for a genuinely
// different mechanic.
//
// What IS shared, and should stay shared: `generateWords`, the maths in
// `stats.ts`, `game-scores.ts`, `game-audio.ts`, and the theme.

/**
 * Milliseconds per state tick. Same 20Hz cadence as the falling-words engine
 * and for the same reason: `setInterval` keeps running when the tab is
 * backgrounded (where `requestAnimationFrame` is throttled to nothing), it
 * makes pausing a matter of not ticking rather than rebasing timestamps, and
 * the UI smooths the steps with CSS transitions timed to this exact interval.
 * Do not "optimise" this into a rAF loop.
 */
export const TICK_MS = 50;

/* ------------------------------------------------------------------ *
 * Tuning. All of it lives here, and the balance argument behind each
 * number is written down so a later change is a decision, not a guess.
 *
 * Reference typist: the word list (`english-1k.ts`) averages 4.45 letters
 * per word, so one word costs `4.45 / (WPM * 5 / 60)` seconds of real time —
 * about 1.07s at 50 WPM, 1.78s at 30 WPM, 0.76s at 70 WPM.
 * ------------------------------------------------------------------ */

/** The clock a run opens with. Small on purpose — the first word matters. */
export const START_TIME_MS = 15_000;
/**
 * Hard ceiling on banked time. Without it a fast opening streak buys a minute
 * of coasting and the game stops being a time attack; with it, a full clock is
 * a signal to push the combo for score rather than to relax.
 */
export const MAX_TIME_MS = 20_000;
/** Below this the clock reddens and pulses. */
export const LOW_TIME_MS = 5_000;

/**
 * Time paid per cleared word: `BASE + PER_CHAR * length`, times the combo
 * multiplier. Deliberately dominated by the per-character term so every word
 * pays at close to the same rate per keystroke — otherwise short words would
 * be strictly more time-efficient and the optimal play would be to skip every
 * long word, which is a boring exploit rather than a strategy.
 *
 * At combo 1 an average word pays 150 + 240*4.45 = 1218ms, which is a hair
 * more than the 1068ms of real time a 50 WPM typist spends earning it. So the
 * baseline exchange rate is break-even-plus for a competent typist and clearly
 * negative (1218ms earned against 1780ms spent) for a 30 WPM one.
 */
const BASE_GAIN_MS = 150;
const PER_CHAR_GAIN_MS = 240;

/**
 * Cost of skipping the current word with space. Skipping already resets the
 * combo, which is the real penalty; the flat charge exists so that spamming
 * space to hunt for a comfortable word is strictly losing.
 */
const SKIP_PENALTY_MS = 750;

/**
 * Multiplier = 1 + min(combo, 12) * 0.05, so it climbs to 1.6x over twelve
 * clean words and applies to both time and score. Twelve is chosen so that
 * rebuilding a broken combo costs roughly ten seconds of play — long enough
 * that a mistake is felt for a while, short enough that a run is recoverable.
 */
const COMBO_STEP = 0.05;
const COMBO_CAP = 12;

/**
 * The clock drains at `1 + cleared * 0.014` times real time, capped at 2.4x
 * (reached at 100 words cleared). Ramping on words cleared rather than on
 * elapsed time is the same choice the falling-words engine makes: it tracks
 * how well the player is actually doing instead of punishing a slow start.
 *
 * Where this puts each skill level, taking the average word:
 *   30 WPM — negative from the first word; dead in well under a minute.
 *   50 WPM — positive early, break-even around 1.8x drain even with a maxed
 *            combo, so the wall arrives around 60-70 words cleared.
 *   70 WPM — survives at the 2.4x cap only while the combo holds; one typo
 *            turns +0.1s per word into -0.5s per word.
 */
const BASE_DRAIN = 1;
const DRAIN_PER_CLEAR = 0.014;
const MAX_DRAIN = 2.4;

/** Score per character, before the combo multiplier. */
const POINTS_PER_CHAR = 10;

/** Current word plus the three queued behind it. */
export const QUEUE_SIZE = 4;

/**
 * How long the "+1.2s" and mistake flashes stay on screen, measured in game
 * time rather than wall time. Both are expressed as an `elapsedMs` deadline
 * the UI compares against, so they age out on the existing tick: no extra
 * timers, no `AnimatePresence` (which has been observed in this project
 * failing to unmount rapidly re-keyed children), and they freeze correctly
 * while the run is paused.
 */
const GAIN_FLASH_MS = 700;
const MISTAKE_FLASH_MS = 300;

/** A cleared word's time award, kept just long enough to flash it. */
export interface TimeGain {
  /** Unique per award, so the UI can re-key the flash and restart it. */
  seq: number;
  /** Milliseconds actually added — less than the award if the clock capped. */
  ms: number;
  /** Game-time deadline after which the flash is gone. */
  untilMs: number;
}

export interface ComboRushState {
  status: GameStatus;
  definition: GameDefinition;
  /** Current word first, then the look-ahead. */
  queue: string[];
  /** Always a prefix of the current word — wrong characters are rejected. */
  typed: string;
  timeLeftMs: number;
  score: number;
  cleared: number;
  /** Words dismissed with space. */
  skipped: number;
  combo: number;
  bestCombo: number;
  correctKeystrokes: number;
  incorrectKeystrokes: number;
  /** Real time survived, which is the run's length — not the clock. */
  elapsedMs: number;
  lastGain: TimeGain | null;
  /** Game-time deadline for the mistake flash; 0 when there isn't one. */
  mistakeUntilMs: number;
}

/** Rises to 1.6x over twelve clean words; applies to time *and* score. */
export function comboMultiplier(combo: number): number {
  return 1 + Math.min(combo, COMBO_CAP) * COMBO_STEP;
}

/** Clock-milliseconds burned per real millisecond, given words cleared. */
export function drainRate(cleared: number): number {
  return Math.min(MAX_DRAIN, BASE_DRAIN + cleared * DRAIN_PER_CLEAR);
}

function timeAward(word: string, combo: number): number {
  return Math.round((BASE_GAIN_MS + PER_CHAR_GAIN_MS * word.length) * comboMultiplier(combo));
}

function scoreForWord(word: string, combo: number): number {
  return Math.round(word.length * POINTS_PER_CHAR * comboMultiplier(combo));
}

type ComboRushAction =
  | { type: "START"; words: string[] }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "TICK" }
  | { type: "ENQUEUE"; words: string[] }
  | { type: "SET_TYPED"; value: string }
  | { type: "SKIP" };

function createInitialState(definition: GameDefinition): ComboRushState {
  return {
    status: "idle",
    definition,
    queue: [],
    typed: "",
    timeLeftMs: START_TIME_MS,
    score: 0,
    cleared: 0,
    skipped: 0,
    combo: 0,
    bestCombo: 0,
    correctKeystrokes: 0,
    incorrectKeystrokes: 0,
    elapsedMs: 0,
    lastGain: null,
    mistakeUntilMs: 0,
  };
}

/**
 * Appends without ever repeating the word directly in front of it — reading
 * the same word twice in a row in the look-ahead makes the queue look stuck.
 * `generateWords` never repeats within one batch, so at most the first word of
 * a batch is ever dropped, which guarantees the queue always makes progress.
 */
function appendWords(queue: string[], words: string[]): string[] {
  const next = [...queue];
  for (const word of words) {
    if (next.length >= QUEUE_SIZE) break;
    if (next[next.length - 1] === word) continue;
    next.push(word);
  }
  return next;
}

function reducer(state: ComboRushState, action: ComboRushAction): ComboRushState {
  switch (action.type) {
    case "START":
      return {
        ...createInitialState(state.definition),
        status: "running",
        queue: appendWords([], action.words),
      };

    case "PAUSE":
      return state.status === "running" ? { ...state, status: "paused" } : state;

    case "RESUME":
      return state.status === "paused" ? { ...state, status: "running" } : state;

    case "TICK": {
      if (state.status !== "running") return state;
      const elapsedMs = state.elapsedMs + TICK_MS;
      const timeLeftMs = state.timeLeftMs - TICK_MS * drainRate(state.cleared);
      if (timeLeftMs <= 0) {
        return { ...state, elapsedMs, timeLeftMs: 0, status: "over" };
      }
      return { ...state, elapsedMs, timeLeftMs };
    }

    case "ENQUEUE": {
      if (state.status !== "running") return state;
      const queue = appendWords(state.queue, action.words);
      // Returning the same object when nothing was added keeps the refill
      // effect from re-firing on its own output.
      return queue.length === state.queue.length ? state : { ...state, queue };
    }

    case "SET_TYPED": {
      if (state.status !== "running") return state;
      const word = state.queue[0];
      if (word === undefined) return state;

      const value = action.value;
      // Backspace is allowed and deliberately not a mistake — `typed` can only
      // ever hold a correct prefix, so this just gives back ground.
      if (value.length < state.typed.length) return { ...state, typed: value };
      if (value === state.typed) return state;

      const added = value.length - state.typed.length;

      if (!word.startsWith(value)) {
        // Reject the character outright rather than letting the buffer drift
        // into something unmatchable. The keystroke is what costs the combo;
        // no time is deducted, because the drain is punishment enough and a
        // double penalty makes a single slip unrecoverable.
        return {
          ...state,
          incorrectKeystrokes: state.incorrectKeystrokes + added,
          combo: 0,
          mistakeUntilMs: state.elapsedMs + MISTAKE_FLASH_MS,
        };
      }

      const correctKeystrokes = state.correctKeystrokes + added;
      if (value !== word) return { ...state, typed: value, correctKeystrokes };

      // Complete. No space needed — same convention as the falling-words
      // games, and the whole point here is rhythm without a separator key.
      // The award uses the combo *before* this word, so the first clear of a
      // streak pays 1x and the multiplier is something you have earned.
      const timeLeftMs = Math.min(MAX_TIME_MS, state.timeLeftMs + timeAward(word, state.combo));
      const combo = state.combo + 1;
      const cleared = state.cleared + 1;
      return {
        ...state,
        queue: state.queue.slice(1),
        typed: "",
        timeLeftMs,
        score: state.score + scoreForWord(word, state.combo),
        cleared,
        combo,
        bestCombo: Math.max(state.bestCombo, combo),
        correctKeystrokes,
        lastGain: {
          seq: cleared,
          ms: timeLeftMs - state.timeLeftMs,
          untilMs: state.elapsedMs + GAIN_FLASH_MS,
        },
      };
    }

    case "SKIP": {
      if (state.status !== "running") return state;
      if (state.queue.length === 0) return state;
      const timeLeftMs = state.timeLeftMs - SKIP_PENALTY_MS;
      return {
        ...state,
        queue: state.queue.slice(1),
        typed: "",
        skipped: state.skipped + 1,
        combo: 0,
        timeLeftMs: Math.max(0, timeLeftMs),
        mistakeUntilMs: state.elapsedMs + MISTAKE_FLASH_MS,
        status: timeLeftMs <= 0 ? "over" : state.status,
      };
    }
  }
}

export function useComboRush(definition: GameDefinition) {
  const [state, dispatch] = useReducer(reducer, definition, createInitialState);

  useEffect(() => {
    if (state.status !== "running") return;
    const id = setInterval(() => dispatch({ type: "TICK" }), TICK_MS);
    return () => clearInterval(id);
  }, [state.status]);

  // Refill the look-ahead whenever a word leaves it. Randomness stays out of
  // the reducer: words are generated here and handed over in the action, the
  // same separation the falling-words spawn timer uses.
  //
  // `appendWords` always adds at least one word, so this settles in a single
  // pass and the flag flips back to false — it cannot feed itself.
  const needsWords = state.status === "running" && state.queue.length < QUEUE_SIZE;
  useEffect(() => {
    if (!needsWords) return;
    dispatch({
      type: "ENQUEUE",
      words: generateWords(QUEUE_SIZE, { punctuation: false, numbers: false }),
    });
  }, [needsWords]);

  // A backgrounded run would otherwise drain the whole clock while nobody is
  // looking and be over before the player comes back.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") dispatch({ type: "PAUSE" });
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const start = useCallback(
    () =>
      dispatch({
        type: "START",
        words: generateWords(QUEUE_SIZE, { punctuation: false, numbers: false }),
      }),
    [],
  );
  const resume = useCallback(() => dispatch({ type: "RESUME" }), []);
  const setTyped = useCallback((value: string) => dispatch({ type: "SET_TYPED", value }), []);
  const skip = useCallback(() => dispatch({ type: "SKIP" }), []);

  return { state, start, resume, setTyped, skip };
}
