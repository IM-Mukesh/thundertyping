import { useCallback, useEffect, useReducer, useRef } from "react";
import { generateWords } from "@/lib/typing-engine/word-generator";
import { calculateAccuracy, calculateNetWpm } from "@/lib/typing-engine/stats";
import type { GameDefinition, GameStatus } from "@/lib/games/game-types";

// Typing Grand Prix is a genuinely different mechanic from the falling-words
// engine (sequential like the main test, one active word, a horizontal race
// against pace-setting opponents), so per the games architecture note it gets
// its own module rather than another entry in the falling-words tuning table.
// All of its tuning lives here; game-types.ts keeps only the shared contract.

export const MUSIC = {
  race: "/audio/music/grandprix-race.opus",
  finalLap: "/audio/music/grandprix-final-lap.opus",
} as const;

// -------------------------------------------------------------------------
// Tuning
// -------------------------------------------------------------------------

/** Distance of the race. Long enough to punish a burst, short enough to retry. */
export const RACE_WORD_COUNT = 40;

/**
 * The UI updates around 20Hz. The hook supplies actual active integer elapsed
 * time, including the fraction of a tick before typing/pausing; reducer tests
 * can omit deltaMs to advance a single fixed step. Hidden tabs pause explicitly.
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

/** Fixed identity per opponent id, index-aligned with `OPPONENT_BASE_WPM` —
 *  a name and an art role the component resolves to one of the generated
 *  rival car images. Purely cosmetic; the race itself only ever knows them
 *  by id. */
export const OPPONENT_IDENTITY = [
  { name: "Shadow", art: "car-shadow" },
  { name: "Blaze", art: "car-blaze" },
  { name: "Nova", art: "car-nova" },
] as const;

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

/** Points per WPM, before the accuracy multiplier — paid once, at the finish. */
const FINISH_WPM_POINT_RATE = 12;

// ---------------------------------------------------------------------------
// Combo / Boost
// ---------------------------------------------------------------------------

/** Points per character of a committed word, before combo/boost multipliers —
 *  this is what makes the score climb live during the race, not just at the
 *  end. */
const WORD_POINT_RATE = 9;
/** Caps at 2x, same shape as every other game's combo curve. */
const COMBO_CAP = 10;
const COMBO_STEP = 0.1;

const BOOST_MAX = 100;
const BOOST_PER_WORD = 9;
/** Extra charge when a word also lands on a combo-of-5 milestone. */
const BOOST_COMBO_BONUS = 10;
export const BOOST_DURATION_MS = 6000;
const BOOST_SCORE_MULT = 1.6;

function comboMultiplier(combo: number): number {
  return 1 + Math.min(combo, COMBO_CAP) * COMBO_STEP;
}

function boostGainFor(comboAfter: number): number {
  const milestone = comboAfter > 0 && comboAfter % 5 === 0;
  return BOOST_PER_WORD + (milestone ? BOOST_COMBO_BONUS : 0);
}

/** Live standing computed from explicit progress values, usable inside the
 *  reducer (unlike the exported `livePosition`, which reads a whole state and
 *  is meant for the component). Used to detect a real overtake/overtaken
 *  transition as it happens, not guessed from the outside. */
function positionFor(playerProgress: number, opponents: Racer[]): number {
  return 1 + opponents.filter((o) => o.progress > playerProgress).length;
}

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
  /** Exhausting the word list without covering the course is not a finish. */
  dnf: boolean;
  /**
   * Live, not just a final total: increments per word so the HUD has a real
   * number to show mid-race, then gains the speed/accuracy/placement bonus
   * on top at the finish line rather than being overwritten by it.
   */
  score: number;
  /** Consecutive words committed with zero incorrect keystrokes on them. */
  combo: number;
  bestCombo: number;
  /** Builds on clean words, spends itself into a scoring window at 100.
   *  Deliberately never touches `playerProgress` — the car's position must
   *  stay tied only to real correct characters typed, which is the exact
   *  invariant `bankedChars`/`playerProgress` exist to protect (see the
   *  anti-exploit tests). Boost affects the score, not the distance. */
  boost: number;
  /** While positive: word points score at BOOST_SCORE_MULT. */
  boostMs: number;
  /** Score awarded by the most recently committed word, for a real popup. */
  lastWordPoints: number;
  /** `elapsedMs` of the moment the player most recently gained a place. */
  lastOvertakeMs: number | null;
  /** `elapsedMs` of the moment the player most recently lost a place. */
  lastOvertakenMs: number | null;
}

type GrandPrixAction =
  | { type: "START" }
  | { type: "RESET" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "TICK"; deltaMs?: number }
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
    dnf: false,
    score: 0,
    combo: 0,
    bestCombo: 0,
    boost: 0,
    boostMs: 0,
    lastWordPoints: 0,
    lastOvertakeMs: null,
    lastOvertakenMs: null,
  };
}

/**
 * One tick of an opponent. The pace is a mean-reverting random walk around its
 * base WPM rather than a constant, so cars trade places mid-race and the field
 * reads as alive instead of as three metronomes.
 */
function advanceOpponent(racer: Racer, totalChars: number, elapsedMs: number, deltaMs: number): Racer {
  if (racer.progress >= 1) return racer;

  const drifted = racer.speedFactor + (Math.random() - 0.5) * JITTER_STEP;
  const pulled = drifted + (1 - drifted) * JITTER_PULL;
  const speedFactor = Math.min(1 + JITTER_RANGE, Math.max(1 - JITTER_RANGE, pulled));

  const charsThisTick = (racer.targetWpm * speedFactor * CHARS_PER_WORD * deltaMs) / 60000;
  const progress = Math.min(1, racer.progress + charsThisTick / totalChars);

  return {
    ...racer,
    speedFactor,
    progress,
    finishedAtMs: progress >= 1
      ? Math.round(elapsedMs - deltaMs + ((1 - racer.progress) * totalChars / charsThisTick) * deltaMs)
      : null,
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

/** Applies the combo/boost/score update for a *cleanly* committed word (typed
 *  to an exact match, no skipped or wrong characters). Shared by COMMIT_WORD
 *  and SET_TYPED's auto-finish path for the final word, so both routes to a
 *  clean word are scored identically. Reads its combo/boost baseline off
 *  whatever state it's given — the caller passes the already-updated `next`
 *  when one exists, so a mistake earlier in the same keystroke batch is
 *  reflected before this adds its own +1. */
function cleanWordBonus(
  state: GrandPrixState,
  target: string,
): Pick<GrandPrixState, "combo" | "bestCombo" | "score" | "boost" | "boostMs" | "lastWordPoints"> {
  const combo = state.combo + 1;
  const bestCombo = Math.max(state.bestCombo, combo);
  const boostActive = state.boostMs > 0;
  const lastWordPoints = Math.round(
    target.length * WORD_POINT_RATE * comboMultiplier(state.combo) * (boostActive ? BOOST_SCORE_MULT : 1),
  );
  const score = state.score + lastWordPoints;

  let boost = state.boost;
  let boostMs = state.boostMs;
  if (!boostActive) {
    boost = Math.min(BOOST_MAX, state.boost + boostGainFor(combo));
    if (boost >= BOOST_MAX) {
      boostMs = BOOST_DURATION_MS;
      boost = 0;
    }
  }

  return { combo, bestCombo, score, boost, boostMs, lastWordPoints };
}

/** Stamps a real overtake/overtaken transition onto `next`, comparing the
 *  standing before and after whatever just changed (a keystroke moving the
 *  player, or a tick moving the field). A pure read of real progress values —
 *  never guessed, never fired without an actual position change. */
function withOvertakeSignals<S extends GrandPrixState>(
  prevPlayerProgress: number,
  prevOpponents: Racer[],
  next: S,
): S {
  const before = positionFor(prevPlayerProgress, prevOpponents);
  const after = positionFor(next.playerProgress, next.opponents);
  if (after === before) return next;
  return {
    ...next,
    lastOvertakeMs: after < before ? next.elapsedMs : next.lastOvertakeMs,
    lastOvertakenMs: after > before ? next.elapsedMs : next.lastOvertakenMs,
  };
}

/** Unique distance reproduced, never the number of repeated correct keypresses. */
export function scoredChars(state: GrandPrixState): number {
  return state.bankedChars + correctCharsIn(state.typed, state.words[state.wordIndex] ?? "");
}

export function raceAccuracy(state: GrandPrixState): number {
  return calculateAccuracy(scoredChars(state), state.incorrectKeystrokes, state.missedChars);
}

function finishRace(state: GrandPrixState): GrandPrixState {
  const progress =
    state.totalChars > 0 ? Math.min(1, state.bankedChars / state.totalChars) : 0;
  const dnf = progress < 1;
  // Ties go to the rivals (stable id order); a DNF is always unclassified/last,
  // even if the opponents have not yet reached its partial distance.
  const place = dnf ? state.opponents.length + 1 : 1 + state.opponents.filter(
    (o) => o.finishedAtMs !== null && o.finishedAtMs <= state.elapsedMs,
  ).length;
  const wpm = calculateNetWpm(state.bankedChars, state.elapsedMs);
  const accuracy = calculateAccuracy(
    state.bankedChars,
    state.incorrectKeystrokes,
    state.missedChars,
  );
  const bonus = PLACEMENT_BONUS[place - 1] ?? 0;
  // Added on top of the score already earned live, word by word, during the
  // race — not a replacement for it. A player who raced well the whole way
  // and only stumbled on the last word still keeps every point they banked.
  const finishBonus = dnf ? 0 : Math.max(0, Math.round(wpm * FINISH_WPM_POINT_RATE * (accuracy / 100))) + bonus;

  return {
    ...state,
    status: "over",
    typed: "",
    wordIndex: state.words.length,
    playerProgress: progress,
    place,
    dnf,
    score: state.score + finishBonus,
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
      const deltaMs = Math.max(0, Math.round(action.deltaMs ?? TICK_MS));
      if (!Number.isFinite(deltaMs) || deltaMs === 0) return state;

      // Nothing moves and no time is recorded until the flag drops, so the
      // player's WPM is measured from the green light, not from the click.
      if (state.leadInMs >= deltaMs) {
        return { ...state, leadInMs: state.leadInMs - deltaMs };
      }

      const activeMs = deltaMs - state.leadInMs;
      const elapsedMs = state.elapsedMs + activeMs;
      const opponents = state.opponents.map((o) => advanceOpponent(o, state.totalChars, elapsedMs, activeMs));
      const boostMs = Math.max(0, state.boostMs - activeMs);
      return withOvertakeSignals(state.playerProgress, state.opponents, {
        ...state,
        leadInMs: 0,
        elapsedMs,
        opponents,
        boostMs,
      });
    }

    case "SET_TYPED": {
      if (state.status !== "running" || state.leadInMs > 0) return state;
      const target = state.words[state.wordIndex];
      if (target === undefined) return state;

      const value = action.value;
      if (value === state.typed) return state;
      if (value.length > target.length + MAX_EXTRA_CHARS) return state;

      // Loops rather than assuming one new character, so an IME commit or a
      // replacement credits/blames every changed character, even at equal length.
      let changedFrom = 0;
      while (changedFrom < state.typed.length && changedFrom < value.length && state.typed[changedFrom] === value[changedFrom]) changedFrom++;
      let correctKeystrokes = state.correctKeystrokes;
      let incorrectKeystrokes = state.incorrectKeystrokes;
      let mistakeThisCall = false;
      for (let i = changedFrom; i < value.length; i++) {
        if (i < target.length && value[i] === target[i]) correctKeystrokes += 1;
        else {
          incorrectKeystrokes += 1;
          mistakeThisCall = true;
        }
      }

      const next: GrandPrixState = {
        ...state,
        typed: value,
        correctKeystrokes,
        incorrectKeystrokes,
        // A mistake anywhere in the word breaks the streak the instant it
        // happens, same as every other game's combo — it doesn't wait for
        // the word to be committed.
        combo: mistakeThisCall ? 0 : state.combo,
        playerProgress: playerProgressFor(state, state.bankedChars, value),
      };

      // Completing the final word crosses the line — the same auto-finish the
      // main typing test does, so nobody has to press space at a finish line.
      const isLastWord = state.wordIndex === state.words.length - 1;
      if (isLastWord && value === target) {
        const bonus = cleanWordBonus(next, target);
        return finishRace(
          withOvertakeSignals(state.playerProgress, state.opponents, {
            ...next,
            ...bonus,
            bankedChars: state.bankedChars + correctCharsIn(value, target),
          }),
        );
      }
      return withOvertakeSignals(state.playerProgress, state.opponents, next);
    }

    case "COMMIT_WORD": {
      if (state.status !== "running" || state.leadInMs > 0) return state;
      const target = state.words[state.wordIndex];
      if (target === undefined) return state;
      // A space before typing anything is a no-op, not an empty word.
      if (state.typed.length === 0) return state;

      // Combo/boost/score only reward a word committed exactly right —
      // spacing past a wrong or half-typed word still advances the race (the
      // existing skip-penalty via missedChars already covers that) but earns
      // nothing and breaks the streak, the same way a mid-word mistake does.
      const clean = state.typed === target;
      const bonus = clean
        ? cleanWordBonus(state, target)
        : { combo: 0, bestCombo: state.bestCombo, score: state.score, boost: state.boost, boostMs: state.boostMs, lastWordPoints: 0 };

      const bankedChars = state.bankedChars + correctCharsIn(state.typed, target);
      const committed: GrandPrixState = {
        ...state,
        ...bonus,
        bankedChars,
        // Committing is what turns "not typed yet" into "skipped".
        missedChars: state.missedChars + Math.max(0, target.length - state.typed.length),
        playerProgress: Math.min(1, Math.max(state.playerProgress, bankedChars / state.totalChars)),
      };

      const withSignals = withOvertakeSignals(state.playerProgress, state.opponents, committed);

      if (state.wordIndex === state.words.length - 1) return finishRace(withSignals);

      return { ...withSignals, typed: "", wordIndex: state.wordIndex + 1 };
    }
  }
}

export function useTypingGrandPrix(definition: GameDefinition) {
  const [state, dispatch] = useReducer(reducer, definition, createInitialState);
  const clock = useRef(0);
  const clockActive = useRef(false);

  const advanceClock = useCallback(() => {
    if (!clockActive.current) return;
    const deltaMs = Math.max(0, Math.round(performance.now() - clock.current));
    // Preserve fractional milliseconds instead of discarding them every tick.
    clock.current += deltaMs;
    if (deltaMs > 0) dispatch({ type: "TICK", deltaMs });
  }, []);

  const start = useCallback(() => {
    clock.current = performance.now();
    clockActive.current = true;
    dispatch({ type: "START" });
  }, []);
  const reset = useCallback(() => {
    clockActive.current = false;
    dispatch({ type: "RESET" });
  }, []);
  const pause = useCallback(() => {
    advanceClock();
    clockActive.current = false;
    dispatch({ type: "PAUSE" });
  }, [advanceClock]);
  const resume = useCallback(() => {
    if (document.visibilityState === "hidden") return;
    clock.current = performance.now();
    clockActive.current = true;
    dispatch({ type: "RESUME" });
  }, []);
  const setTyped = useCallback((value: string) => {
    advanceClock();
    dispatch({ type: "SET_TYPED", value });
  }, [advanceClock]);
  const commitWord = useCallback(() => {
    advanceClock();
    dispatch({ type: "COMMIT_WORD" });
  }, [advanceClock]);

  useEffect(() => {
    if (state.status !== "running") {
      clockActive.current = false;
      return;
    }
    const id = setInterval(advanceClock, TICK_MS);
    return () => clearInterval(id);
  }, [state.status, advanceClock]);

  // Pausing on tab-hide keeps the opponents from driving the whole race while
  // the player is looking at another tab.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") pause();
    };
    const onBlur = pause;
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [pause]);

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

/** Same finish ordering as the result card, including equal-time tie breaks. */
export function raceStandings(state: GrandPrixState) {
  return [
    { id: -1, isPlayer: true, progress: state.playerProgress, finishedAtMs: state.status === "over" && !state.dnf ? state.elapsedMs : null },
    ...state.opponents.map((o) => ({ ...o, isPlayer: false })),
  ].sort((a, b) => {
    if (state.dnf && (a.isPlayer || b.isPlayer)) return a.isPlayer ? 1 : -1;
    if (a.finishedAtMs !== null && b.finishedAtMs !== null) {
      return a.finishedAtMs - b.finishedAtMs || Number(a.isPlayer) - Number(b.isPlayer) || a.id - b.id;
    }
    if (a.finishedAtMs !== null) return -1;
    if (b.finishedAtMs !== null) return 1;
    return b.progress - a.progress || a.id - b.id;
  });
}
