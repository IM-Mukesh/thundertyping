import { useCallback, useEffect, useReducer } from "react";
import { generateWords } from "@/lib/typing-engine/word-generator";
import { calculateAccuracy, calculateNetWpm } from "@/lib/typing-engine/stats";
import type { GameDefinition, GameStatus } from "@/lib/games/game-types";

// Typing Grand Prix is a genuinely different mechanic from the falling-words
// engine (sequential like the main test, one active word, a horizontal race
// against pace-setting opponents), so per the games architecture note it gets
// its own module rather than another entry in the falling-words tuning table.
// All of its tuning lives here; game-types.ts keeps only the shared contract.

// -------------------------------------------------------------------------
// Tuning
// -------------------------------------------------------------------------

/** Distance of the race. Long enough to punish a burst, short enough to retry. */
export const RACE_WORD_COUNT = 40;

/**
 * State advances in fixed steps, exactly like use-falling-words.ts, and for
 * the same reasons: pausing is just "stop ticking" (no timestamps to rebase),
 * and requestAnimationFrame is throttled to nothing in a hidden tab, which
 * would freeze the opponents and silently break the race. The visual smoothing
 * is a CSS transition on the cars' `left` matched to exactly this interval, so
 * 20 updates a second still read as continuous motion.
 */
export const TICK_MS = 50;

/** Lights-out delay so the player can read the first word before the flag drops. */
const LEAD_IN_MS = 2100;
/** One counted beat of the lead-in, so it renders as 3 → 2 → 1. */
export const LEAD_IN_BEAT_MS = 700;

export const OPPONENT_COUNT = 3;

/**
 * Deliberately real-world reference speeds rather than arbitrary numbers:
 * ~35 WPM is a typical hunt-and-peck pace, ~50 WPM an average touch typist,
 * ~70 WPM a competent one. Beating a specific car therefore means something.
 */
export const OPPONENT_BASE_WPM = [35, 50, 70];

/** Per-run variation on each base speed, so no two races are identical. */
const OPPONENT_WPM_SPREAD = 4;

/** Random-walk knobs for opponent pace. Small steps at 20Hz read as a human wobble. */
const JITTER_STEP = 0.07;
const JITTER_RANGE = 0.18;
/** Pull back toward the base speed so the walk can't drift away and stay there. */
const JITTER_PULL = 0.03;

/** The standard WPM convention, matching stats.ts. */
const CHARS_PER_WORD = 5;

/** Hard stop on runaway extra characters past the end of a word. */
const MAX_EXTRA_CHARS = 8;

/**
 * Finishing position is worth far more than raw speed — this is a race, and a
 * podium place should beat a fast fourth. The gaps are wide on purpose: they
 * make "can I hold this position" the decision that matters most, which is
 * what separates this game from the plain typing test.
 */
const PLACEMENT_BONUS = [1500, 800, 300, 0];

/** Points per WPM, before the accuracy multiplier. */
const WPM_POINT_RATE = 12;

// -------------------------------------------------------------------------
// State
// -------------------------------------------------------------------------

export interface Racer {
  id: number;
  /** Base pace in WPM for this run, before jitter. */
  targetWpm: number;
  /** Current multiplier on `targetWpm`, random-walking around 1. */
  speedFactor: number;
  /** 0 = start line, 1 = finish line. */
  progress: number;
  /** Elapsed ms at which this car crossed, or null if it hasn't. */
  finishedAtMs: number | null;
}

export interface GrandPrixState {
  status: GameStatus;
  definition: GameDefinition;
  words: string[];
  /**
   * Length of the whole race in characters (spaces excluded, matching how
   * stats.ts counts keystrokes). Both the player's car and the opponents'
   * measure their position against this, which is what makes an opponent's
   * "50 WPM" mean literally the same thing as the player's 50 WPM.
   */
  totalChars: number;
  wordIndex: number;
  typed: string;
  /** Characters of already-committed words — drives the car, not the score. */
  bankedChars: number;
  playerProgress: number;
  opponents: Racer[];
  correctKeystrokes: number;
  incorrectKeystrokes: number;
  /** Characters skipped by committing a word early — feeds accuracy only. */
  missedChars: number;
  elapsedMs: number;
  /** Counts down before the flag drops; nothing moves and typing is ignored. */
  leadInMs: number;
  /** 1–4, set the moment the player crosses the line. */
  place: number | null;
  score: number;
}

type GrandPrixAction =
  | { type: "START" }
  | { type: "RESET" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "TICK" }
  | { type: "SET_TYPED"; value: string }
  | { type: "COMMIT_WORD" };

function createOpponents(): Racer[] {
  return OPPONENT_BASE_WPM.slice(0, OPPONENT_COUNT).map((base, id) => ({
    id,
    targetWpm: base + (Math.random() * 2 - 1) * OPPONENT_WPM_SPREAD,
    speedFactor: 1,
    progress: 0,
    finishedAtMs: null,
  }));
}

// Exported for tests: progress accounting is the anti-exploit surface here.
export function createInitialState(definition: GameDefinition): GrandPrixState {
  const words = generateWords(RACE_WORD_COUNT, { punctuation: false, numbers: false });
  return {
    status: "idle",
    definition,
    words,
    totalChars: words.reduce((sum, word) => sum + word.length, 0),
    wordIndex: 0,
    typed: "",
    bankedChars: 0,
    playerProgress: 0,
    opponents: createOpponents(),
    correctKeystrokes: 0,
    incorrectKeystrokes: 0,
    missedChars: 0,
    elapsedMs: 0,
    leadInMs: LEAD_IN_MS,
    place: null,
    score: 0,
  };
}

/**
 * One tick of an opponent. The pace is a mean-reverting random walk around its
 * base WPM rather than a constant, so cars trade places mid-race and the field
 * reads as alive instead of as three metronomes.
 */
function advanceOpponent(racer: Racer, totalChars: number, elapsedMs: number): Racer {
  if (racer.progress >= 1) return racer;

  const drifted = racer.speedFactor + (Math.random() - 0.5) * JITTER_STEP;
  const pulled = drifted + (1 - drifted) * JITTER_PULL;
  const speedFactor = Math.min(1 + JITTER_RANGE, Math.max(1 - JITTER_RANGE, pulled));

  const charsThisTick = (racer.targetWpm * speedFactor * CHARS_PER_WORD * TICK_MS) / 60000;
  const progress = Math.min(1, racer.progress + charsThisTick / totalChars);

  return {
    ...racer,
    speedFactor,
    progress,
    finishedAtMs: progress >= 1 ? elapsedMs : null,
  };
}

/**
 * Where the player's car sits: as far along the track as the characters they
 * have actually typed correctly.
 *
 * Distance is NOT raw keystrokes. Banking the target's length for whatever the
 * player happened to press meant a rival could be beaten by holding one letter
 * and space -- the car advanced a full word per press, and accuracy alone does
 * not stop you crossing the line first. Tying distance to correct characters
 * keeps it consistent with the WPM numerator: the car has gone exactly as far
 * as the score says it has.
 *
 * Clamped to never decrease, so backspacing costs time without visibly
 * reversing the car.
 */
function correctCharsIn(typed: string, target: string): number {
  let n = 0;
  for (let i = 0; i < typed.length && i < target.length; i++) {
    if (typed[i] === target[i]) n += 1;
  }
  return n;
}

function playerProgressFor(state: GrandPrixState, bankedChars: number, typed: string): number {
  if (state.totalChars <= 0) return 0;
  const target = state.words[state.wordIndex] ?? "";
  const reached = (bankedChars + correctCharsIn(typed, target)) / state.totalChars;
  return Math.min(1, Math.max(state.playerProgress, reached));
}

function finishRace(state: GrandPrixState): GrandPrixState {
  // Where the car actually ended up. Running out of words ends the race, but
  // it does not mean the player drove the distance: spacing through all forty
  // words used to pin the car to the finish line and hand it first place,
  // because progress was forced to 1 here and placing only counted opponents
  // who had already finished. Finishing position is now read off the real
  // distance travelled, so a player who typed nothing places last.
  const progress =
    state.totalChars > 0 ? Math.min(1, state.bankedChars / state.totalChars) : 0;
  const place =
    1 +
    state.opponents.filter((o) => o.finishedAtMs !== null || o.progress > progress)
      .length;
  const wpm = calculateNetWpm(state.correctKeystrokes, state.elapsedMs);
  const accuracy = calculateAccuracy(
    state.correctKeystrokes,
    state.incorrectKeystrokes,
    state.missedChars,
  );
  const bonus = PLACEMENT_BONUS[place - 1] ?? 0;
  const score = Math.max(0, Math.round(wpm * WPM_POINT_RATE * (accuracy / 100)) + bonus);

  return {
    ...state,
    status: "over",
    typed: "",
    wordIndex: state.words.length,
    playerProgress: progress,
    place,
    score,
  };
}

export function reducer(state: GrandPrixState, action: GrandPrixAction): GrandPrixState {
  switch (action.type) {
    case "START":
      // A fresh word list every race, so re-running isn't re-typing.
      return { ...createInitialState(state.definition), status: "running" };

    case "RESET":
      return createInitialState(state.definition);

    case "PAUSE":
      return state.status === "running" ? { ...state, status: "paused" } : state;

    case "RESUME":
      return state.status === "paused" ? { ...state, status: "running" } : state;

    case "TICK": {
      if (state.status !== "running") return state;

      // Nothing moves and no time is recorded until the flag drops, so the
      // player's WPM is measured from the green light, not from the click.
      if (state.leadInMs > 0) {
        return { ...state, leadInMs: Math.max(0, state.leadInMs - TICK_MS) };
      }

      const elapsedMs = state.elapsedMs + TICK_MS;
      return {
        ...state,
        elapsedMs,
        opponents: state.opponents.map((o) => advanceOpponent(o, state.totalChars, elapsedMs)),
      };
    }

    case "SET_TYPED": {
      if (state.status !== "running" || state.leadInMs > 0) return state;
      const target = state.words[state.wordIndex];
      if (target === undefined) return state;

      const value = action.value;
      if (value === state.typed) return state;
      if (value.length > target.length + MAX_EXTRA_CHARS) return state;

      if (value.length < state.typed.length) {
        // Backspace: allowed, never counted as a mistake, and deliberately
        // does not pull the car back — it costs time, which is enough.
        return { ...state, typed: value };
      }

      // Loops rather than assuming one new character, so an IME commit or a
      // multi-character insertion credits/blames each character individually.
      let correctKeystrokes = state.correctKeystrokes;
      let incorrectKeystrokes = state.incorrectKeystrokes;
      for (let i = state.typed.length; i < value.length; i++) {
        if (i < target.length && value[i] === target[i]) correctKeystrokes += 1;
        else incorrectKeystrokes += 1;
      }

      const next: GrandPrixState = {
        ...state,
        typed: value,
        correctKeystrokes,
        incorrectKeystrokes,
        playerProgress: playerProgressFor(state, state.bankedChars, value),
      };

      // Completing the final word crosses the line — the same auto-finish the
      // main typing test does, so nobody has to press space at a finish line.
      const isLastWord = state.wordIndex === state.words.length - 1;
      if (isLastWord && value === target) {
        return finishRace({ ...next, bankedChars: state.bankedChars + correctCharsIn(value, target) });
      }
      return next;
    }

    case "COMMIT_WORD": {
      if (state.status !== "running" || state.leadInMs > 0) return state;
      const target = state.words[state.wordIndex];
      if (target === undefined) return state;
      // A space before typing anything is a no-op, not an empty word.
      if (state.typed.length === 0) return state;

      const bankedChars = state.bankedChars + correctCharsIn(state.typed, target);
      const committed: GrandPrixState = {
        ...state,
        bankedChars,
        // Committing is what turns "not typed yet" into "skipped".
        missedChars: state.missedChars + Math.max(0, target.length - state.typed.length),
        playerProgress: Math.min(1, Math.max(state.playerProgress, bankedChars / state.totalChars)),
      };

      if (state.wordIndex === state.words.length - 1) return finishRace(committed);

      return { ...committed, typed: "", wordIndex: state.wordIndex + 1 };
    }
  }
}

export function useTypingGrandPrix(definition: GameDefinition) {
  const [state, dispatch] = useReducer(reducer, definition, createInitialState);

  useEffect(() => {
    if (state.status !== "running") return;
    const id = setInterval(() => dispatch({ type: "TICK" }), TICK_MS);
    return () => clearInterval(id);
  }, [state.status]);

  // Pausing on tab-hide keeps the opponents from driving the whole race while
  // the player is looking at another tab.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") dispatch({ type: "PAUSE" });
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const start = useCallback(() => dispatch({ type: "START" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);
  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
  const resume = useCallback(() => dispatch({ type: "RESUME" }), []);
  const setTyped = useCallback((value: string) => dispatch({ type: "SET_TYPED", value }), []);
  const commitWord = useCallback(() => dispatch({ type: "COMMIT_WORD" }), []);

  return { state, start, reset, pause, resume, setTyped, commitWord };
}

/**
 * Live standing, counting cars strictly ahead of the player. Derived rather
 * than stored: it changes on every tick and has no meaning of its own beyond
 * the positions it reads from.
 */
export function livePosition(state: GrandPrixState): number {
  if (state.place !== null) return state.place;
  return 1 + state.opponents.filter((o) => o.progress > state.playerProgress).length;
}
