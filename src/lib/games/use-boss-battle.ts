import { useCallback, useEffect, useReducer } from "react";
import { generateWords } from "@/lib/typing-engine/word-generator";
import { calculateAccuracy, calculateNetWpm, round } from "@/lib/typing-engine/stats";
import type { GameDefinition, GameStatus } from "@/lib/games/game-types";

// Boss Battle is a duel, not a board: one word at a time, one enemy, and a
// timer that is trying to kill you. That makes it a genuinely different
// mechanic from the descending-words engine (spatial, many concurrent
// targets), so it keeps its own state shape and its own tuning here rather
// than bending `use-falling-words.ts` around a second model — see the "Games
// architecture" note in PROGRESS.md.
//
// Everything mechanic-specific lives in this file. `game-types.ts` only holds
// what the hub card, the route metadata and the best-score badge need.

export type BossOutcome = "victory" | "defeat";

export interface BossBattleState {
  status: GameStatus;
  definition: GameDefinition;
  /** Which way the run ended. Victory and defeat are deliberately distinct. */
  outcome: BossOutcome | null;
  bossHp: number;
  /** 1-based, so `phase` doubles as "how many phases have been entered". */
  phase: number;
  /** The single word currently being typed. Empty only during a phase change. */
  word: string;
  typed: string;
  /** Pre-drawn words for the current phase, refilled off the reducer. */
  queue: string[];
  lives: number;
  score: number;
  damageDealt: number;
  phaseBonus: number;
  speedBonus: number;
  accuracyBonus: number;
  victoryBonus: number;
  cleared: number;
  /** Attacks survived because the quota was met in time. */
  blocked: number;
  /** Attacks that landed. Each one costs a life. */
  hitsTaken: number;
  combo: number;
  bestCombo: number;
  correctKeystrokes: number;
  incorrectKeystrokes: number;
  elapsedMs: number;
  /** How far the boss is into charging its current attack. */
  chargeMs: number;
  /** Words cleared inside the current charge window — the block quota. */
  clearsThisCharge: number;
  /** While positive the boss is staggered and its charge is frozen. */
  staggerMs: number;
  // Countdown timers driving the flash effects, ticked down with everything
  // else. Explicit timers rather than AnimatePresence on purpose: these fire
  // several times a second, and AnimatePresence has been observed here failing
  // to unmount rapidly re-keyed children. A number counting down also freezes
  // correctly when the run pauses, which a CSS animation would not.
  bossHitMs: number;
  playerHitMs: number;
  blockMs: number;
  phaseFlashMs: number;
}

/* ------------------------------------------------------------------ tuning */

/**
 * Boss health. Sized so a ~40 WPM run takes roughly a minute to win: damage
 * averages about 40 a word with a live combo, and that pace clears roughly
 * two-thirds of a word a second.
 */
export const BOSS_MAX_HP = 1500;

/** Health fractions that trigger the next phase. */
const PHASE_THRESHOLDS = [0.66, 0.33];

interface PhaseTuning {
  /** How long the boss takes to charge one attack. */
  chargeMs: number;
  /** Words that must be cleared inside a charge window to block the attack. */
  requiredClears: number;
  /** Shortest word the phase will hand out. Later phases hit harder to type. */
  minWordLength: number;
}

/**
 * Three phases, escalating exactly the two ways the player can feel: the
 * attack window shrinks and the words get longer.
 *
 * The quota stays at two words a window throughout, so the escalation reads as
 * one thing getting worse rather than two knobs moving at once. The required
 * pace works out at roughly 17 WPM in phase one, 27 in phase two and 34 in
 * phase three (word lengths in the generator's list average 4.6 / 5.1 / 5.9
 * characters under these filters). That is the intended difficulty statement:
 * anyone can hold phase one, an average typist wins with a small margin, and a
 * slow typist loses their three lives to the final phase.
 */
export const PHASES: PhaseTuning[] = [
  { chargeMs: 6400, requiredClears: 2, minWordLength: 3 },
  { chargeMs: 4800, requiredClears: 2, minWordLength: 4 },
  { chargeMs: 4000, requiredClears: 2, minWordLength: 5 },
];

export const PHASE_COUNT = PHASES.length;

/** Damage = this, plus length squared, times the combo multiplier. */
const DAMAGE_BASE = 6;
/**
 * Length is squared rather than scaled linearly: it makes an eight-letter word
 * worth more than two four-letter ones, so committing to the long word is the
 * correct play instead of a risk.
 */
const DAMAGE_PER_LENGTH_SQ = 0.9;
const COMBO_STEP = 0.05;
const COMBO_CAP = 12;

/** Breather after a phase change — the boss staggers before charging again. */
const STAGGER_MS = 1100;

const PHASE_CLEAR_BONUS = 300;
const VICTORY_BONUS = 800;
const VICTORY_LIFE_BONUS = 400;
const SPEED_BONUS_PER_WPM = 6;
/** Accuracy only starts paying above this, so the bonus means something. */
const ACCURACY_BONUS_FLOOR = 85;
const ACCURACY_BONUS_PER_POINT = 20;

// The loop is a plain interval, not requestAnimationFrame: rAF is throttled to
// nothing in a hidden tab, which would silently freeze the charge timer and
// make pausing meaningless. Ticking state 20 times a second and letting CSS
// transition the health and charge bars over exactly this interval reads as
// continuous motion without running any game logic at frame rate.
export const TICK_MS = 50;

const BOSS_HIT_FLASH_MS = 160;
const PLAYER_HIT_FLASH_MS = 700;
const BLOCK_FLASH_MS = 500;
const PHASE_FLASH_MS = 1100;

/** How many words are kept ready, and when the supply is topped up. */
const QUEUE_TARGET = 6;
const QUEUE_MIN = 3;

/* ------------------------------------------------------------------- words */

/**
 * Draws words for a phase from the shared generator and filters by length —
 * deliberately not a second word list. The generator's list is short enough
 * that a long-word filter still has ~200 candidates at the strictest phase,
 * and reusing it keeps every mode typing the same vocabulary.
 */
export function drawWords(minLength: number, count: number): string[] {
  const picked: string[] = [];
  const seen = new Set<string>();

  for (let attempt = 0; attempt < 6 && picked.length < count; attempt++) {
    for (const word of generateWords(48, { punctuation: false, numbers: false })) {
      if (word.length < minLength || seen.has(word)) continue;
      seen.add(word);
      picked.push(word);
      if (picked.length >= count) break;
    }
  }

  // The filter can never be allowed to starve the fight of words, however the
  // word list changes later, so fall back to unfiltered ones.
  if (picked.length === 0) {
    return generateWords(count, { punctuation: false, numbers: false });
  }
  return picked;
}

/* ----------------------------------------------------------------- reducer */

export function phaseTuning(phase: number): PhaseTuning {
  return PHASES[Math.min(Math.max(phase, 1), PHASE_COUNT) - 1];
}

function phaseForHp(hp: number): number {
  const fraction = hp / BOSS_MAX_HP;
  let phase = 1;
  for (const threshold of PHASE_THRESHOLDS) {
    if (fraction <= threshold) phase += 1;
  }
  return Math.min(phase, PHASE_COUNT);
}

export function comboMultiplier(combo: number): number {
  return 1 + Math.min(combo, COMBO_CAP) * COMBO_STEP;
}

export function damageFor(word: string, combo: number): number {
  return Math.round((DAMAGE_BASE + word.length * word.length * DAMAGE_PER_LENGTH_SQ) * comboMultiplier(combo));
}

type BossAction =
  | { type: "START"; words: string[] }
  | { type: "RESET" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "TICK" }
  | { type: "REFILL"; words: string[] }
  | { type: "SET_TYPED"; value: string };

function createInitialState(definition: GameDefinition): BossBattleState {
  return {
    status: "idle",
    definition,
    outcome: null,
    bossHp: BOSS_MAX_HP,
    phase: 1,
    word: "",
    typed: "",
    queue: [],
    lives: definition.lives,
    score: 0,
    damageDealt: 0,
    phaseBonus: 0,
    speedBonus: 0,
    accuracyBonus: 0,
    victoryBonus: 0,
    cleared: 0,
    blocked: 0,
    hitsTaken: 0,
    combo: 0,
    bestCombo: 0,
    correctKeystrokes: 0,
    incorrectKeystrokes: 0,
    elapsedMs: 0,
    chargeMs: 0,
    clearsThisCharge: 0,
    staggerMs: 0,
    bossHitMs: 0,
    playerHitMs: 0,
    blockMs: 0,
    phaseFlashMs: 0,
  };
}

function decay(ms: number): number {
  return ms > 0 ? Math.max(0, ms - TICK_MS) : 0;
}

/**
 * Closes out a run. The end-of-run bonuses are stored broken out as well as
 * folded into the score, so the result card can show what the number is made
 * of rather than presenting an opaque total.
 */
function settle(state: BossBattleState, outcome: BossOutcome): BossBattleState {
  const accuracy = calculateAccuracy(state.correctKeystrokes, state.incorrectKeystrokes);
  const speedBonus = round(calculateNetWpm(state.correctKeystrokes, state.elapsedMs) * SPEED_BONUS_PER_WPM);
  const accuracyBonus = round(Math.max(0, accuracy - ACCURACY_BONUS_FLOOR) * ACCURACY_BONUS_PER_POINT);
  const victoryBonus = outcome === "victory" ? VICTORY_BONUS + state.lives * VICTORY_LIFE_BONUS : 0;

  return {
    ...state,
    status: "over",
    outcome,
    typed: "",
    speedBonus,
    accuracyBonus,
    victoryBonus,
    score: state.score + speedBonus + accuracyBonus + victoryBonus,
  };
}

function reducer(state: BossBattleState, action: BossAction): BossBattleState {
  switch (action.type) {
    case "START": {
      const fresh = createInitialState(state.definition);
      return {
        ...fresh,
        status: "running",
        word: action.words[0] ?? "",
        queue: action.words.slice(1),
      };
    }

    case "RESET":
      return createInitialState(state.definition);

    case "PAUSE":
      return state.status === "running" ? { ...state, status: "paused" } : state;

    case "RESUME":
      return state.status === "paused" ? { ...state, status: "running" } : state;

    case "REFILL": {
      if (state.status !== "running") return state;
      const queue = [...state.queue, ...action.words];
      // A refill also unblocks the fight if a phase change emptied the board.
      if (state.word !== "") return { ...state, queue };
      return { ...state, word: queue[0] ?? "", queue: queue.slice(1), typed: "" };
    }

    case "TICK": {
      if (state.status !== "running") return state;

      const next: BossBattleState = {
        ...state,
        elapsedMs: state.elapsedMs + TICK_MS,
        bossHitMs: decay(state.bossHitMs),
        playerHitMs: decay(state.playerHitMs),
        blockMs: decay(state.blockMs),
        phaseFlashMs: decay(state.phaseFlashMs),
      };

      // Staggered: the boss is reeling from a phase break and is not charging.
      if (state.staggerMs > 0) {
        next.staggerMs = decay(state.staggerMs);
        return next;
      }

      const { chargeMs: chargeDuration, requiredClears } = phaseTuning(state.phase);
      const chargeMs = state.chargeMs + TICK_MS;
      if (chargeMs < chargeDuration) {
        next.chargeMs = chargeMs;
        return next;
      }

      // The attack fires. Clearing the quota inside the window is what blocks
      // it — the whole reason the player has to hurry rather than type calmly.
      next.chargeMs = 0;
      next.clearsThisCharge = 0;

      if (state.clearsThisCharge >= requiredClears) {
        next.blocked = state.blocked + 1;
        next.blockMs = BLOCK_FLASH_MS;
        return next;
      }

      const lives = state.lives - 1;
      next.lives = Math.max(0, lives);
      next.hitsTaken = state.hitsTaken + 1;
      next.combo = 0;
      next.playerHitMs = PLAYER_HIT_FLASH_MS;
      // The word and any progress on it survive the hit; losing a life is
      // punishment enough, and yanking a half-typed word away reads as a bug.
      return lives <= 0 ? settle(next, "defeat") : next;
    }

    case "SET_TYPED": {
      if (state.status !== "running" || state.word === "") return state;
      const value = action.value;

      if (value.length < state.typed.length) {
        // Backspace: allowed, and deliberately not counted as a mistake.
        return { ...state, typed: value };
      }
      if (value === state.typed) return state;

      const added = value.length - state.typed.length;

      if (!state.word.startsWith(value)) {
        // Reject the character outright rather than letting the buffer drift
        // into something that can never match. Accuracy is the combo, and the
        // combo is damage, so a typo costs real damage without costing a life.
        return {
          ...state,
          incorrectKeystrokes: state.incorrectKeystrokes + added,
          combo: 0,
        };
      }

      const correctKeystrokes = state.correctKeystrokes + added;
      if (value !== state.word) {
        return { ...state, typed: value, correctKeystrokes };
      }

      // Word complete: the boss takes a hit.
      const combo = state.combo + 1;
      const damage = Math.min(damageFor(state.word, state.combo), state.bossHp);
      const bossHp = state.bossHp - damage;
      const nextPhase = phaseForHp(bossHp);
      // A single big hit can cross both thresholds, so pay per threshold.
      const phasesCrossed = Math.max(0, nextPhase - state.phase);
      const phaseBonus = phasesCrossed * PHASE_CLEAR_BONUS;

      const hit: BossBattleState = {
        ...state,
        bossHp,
        damageDealt: state.damageDealt + damage,
        score: state.score + damage + phaseBonus,
        phaseBonus: state.phaseBonus + phaseBonus,
        cleared: state.cleared + 1,
        combo,
        bestCombo: Math.max(state.bestCombo, combo),
        correctKeystrokes,
        clearsThisCharge: state.clearsThisCharge + 1,
        typed: "",
        bossHitMs: BOSS_HIT_FLASH_MS,
      };

      if (bossHp <= 0) {
        return settle({ ...hit, word: "", queue: [] }, "victory");
      }

      if (phasesCrossed > 0) {
        return {
          ...hit,
          phase: nextPhase,
          // The queued words belong to the old phase and are too short for the
          // new one; the supply effect refills during the stagger.
          queue: [],
          word: "",
          chargeMs: 0,
          clearsThisCharge: 0,
          staggerMs: STAGGER_MS,
          phaseFlashMs: PHASE_FLASH_MS,
        };
      }

      return { ...hit, word: state.queue[0] ?? "", queue: state.queue.slice(1) };
    }
  }
}

/* -------------------------------------------------------------------- hook */

export function useBossBattle(definition: GameDefinition) {
  const [state, dispatch] = useReducer(reducer, definition, createInitialState);

  useEffect(() => {
    if (state.status !== "running") return;
    const id = setInterval(() => dispatch({ type: "TICK" }), TICK_MS);
    return () => clearInterval(id);
  }, [state.status]);

  // Word supply lives outside the reducer so the reducer stays pure — it is
  // re-invoked in development, and drawing random words inside it would make
  // the fight non-deterministic per dispatch.
  useEffect(() => {
    if (state.status !== "running") return;
    if (state.word !== "" && state.queue.length >= QUEUE_MIN) return;
    dispatch({
      type: "REFILL",
      words: drawWords(phaseTuning(state.phase).minWordLength, QUEUE_TARGET),
    });
  }, [state.status, state.word, state.queue.length, state.phase]);

  // Pausing on tab-hide keeps a backgrounded run from letting the boss land
  // every remaining attack while nobody is looking.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") dispatch({ type: "PAUSE" });
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const start = useCallback(
    () => dispatch({ type: "START", words: drawWords(PHASES[0].minWordLength, QUEUE_TARGET) }),
    [],
  );
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);
  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
  const resume = useCallback(() => dispatch({ type: "RESUME" }), []);
  const setTyped = useCallback((value: string) => dispatch({ type: "SET_TYPED", value }), []);

  return { state, start, reset, pause, resume, setTyped };
}
