import { useCallback, useEffect, useReducer, useRef } from "react";
import { generateWords } from "@/lib/typing-engine/word-generator";
import type { GameDefinition, GameId, GameStatus } from "@/lib/games/game-types";

// Everything below is specific to the descending-words mechanic, so it lives
// with the engine rather than in game-types.ts. That file holds only the
// contract every game shares (name, rules, lives, how the score is formatted);
// a game with a different mechanic keeps its own state shape and tuning in its
// own module the same way.

/**
 * Normal is the vast majority of spawns. Elite trades a longer, harder word
 * for a bigger reward; golden is a rare bonus on an ordinary-length word.
 * Deliberately just two variants beyond normal — enough to create real
 * priority decisions ("save the golden one first") without needing the
 * player to learn a whole bestiary of falling-object types.
 */
export type WordKind = "normal" | "elite" | "golden" | "freeze" | "hazard";

export interface FallingWord {
  id: number;
  text: string;
  kind: WordKind;
  /** 0 = just spawned at the ceiling, 1 = reached the floor. */
  progress: number;
  /** Milliseconds this particular word takes to fall, fixed at spawn. */
  fallMs: number;
  /** Horizontal lane index, so words don't overlap each other. */
  lane: number;
}

/**
 * A destroyed word, kept around just long enough for the UI to draw a
 * particle burst and a damage-style number at the spot it died — same
 * pattern as Word Blaster's `HitEffect` and Boss Battle's hit timers: state
 * that ages itself out on the engine's own tick rather than component state
 * driven by AnimatePresence, which has been observed in this project failing
 * to unmount rapidly re-keyed children.
 */
export interface DestroyEffect {
  seq: number;
  lane: number;
  progress: number;
  points: number;
  kind: WordKind;
  bornMs: number;
}

export interface GameState {
  status: GameStatus;
  definition: GameDefinition;
  words: FallingWord[];
  /** What the player has typed toward the currently targeted word. */
  typed: string;
  /** The word the current keystrokes are committed to, once one matches. */
  lockedId: number | null;
  lives: number;
  score: number;
  cleared: number;
  missed: number;
  combo: number;
  bestCombo: number;
  correctKeystrokes: number;
  incorrectKeystrokes: number;
  elapsedMs: number;
  destroyed: DestroyEffect[];
  /** `elapsedMs` of the most recent miss, for the impact flash. */
  lastMissMs: number | null;
  /** Builds on clean clears, spends itself into Overdrive at 100. */
  fever: number;
  /** While positive: words spawn falling slower and score more. */
  overdriveMs: number;
  /** While positive: active freeze slows all falling words by 50%. */
  slowdownMs: number;
  phase: number;
  phaseName: string;
}

/** Pacing knobs — the only thing separating the two games on this engine. */
interface FallingWordsTuning {
  /** Milliseconds between spawns at the start, and the floor it ramps toward. */
  initialSpawnMs: number;
  minSpawnMs: number;
  /** Milliseconds shaved off the spawn interval per cleared word. */
  spawnRampPerClear: number;
  /** Milliseconds a word takes to fall at the start, and the floor it ramps toward. */
  initialFallMs: number;
  minFallMs: number;
  /** Milliseconds shaved off the fall time per cleared word. */
  fallRampPerClear: number;
}

const TUNING: Record<"falling-words" | "word-rain", FallingWordsTuning> = {
  "falling-words": {
    initialSpawnMs: 1700,
    minSpawnMs: 620,
    spawnRampPerClear: 20,
    initialFallMs: 9000,
    minFallMs: 3600,
    fallRampPerClear: 58,
  },
  // Faster from the first second and ramps harder — it's the endurance mode,
  // and it only gives you one life.
  "word-rain": {
    initialSpawnMs: 1250,
    minSpawnMs: 400,
    spawnRampPerClear: 15,
    initialFallMs: 7600,
    minFallMs: 2700,
    fallRampPerClear: 46,
  },
};

function tuningFor(id: GameId): FallingWordsTuning {
  return TUNING[id as keyof typeof TUNING] ?? TUNING["falling-words"];
}

// Words advance by a fixed fraction each tick rather than by comparing
// timestamps. That keeps pausing trivial (just stop ticking — no timestamps
// to rebase afterwards) and keeps the logic independent of animation frames,
// which matters because requestAnimationFrame is throttled to nothing in a
// hidden tab. The visual smoothing is handled in CSS by transitioning `top`
// over exactly this interval, so 20 updates a second still reads as
// continuous motion without running the game loop at 60fps.
const TICK_MS = 50;

export const LANE_COUNT = 6;

/** Cap so a burst of spawns can never make the board unreadable. */
const MAX_ACTIVE_WORDS = 7;

/** How long a destroy effect stays in state — a whole number of ticks, so it
 *  expires exactly when the UI's matching CSS animation ends. */
export const DESTROY_EFFECT_MS = 420;
const MAX_DESTROY_EFFECTS = 6;
/** How long the impact flash holds after a miss. */
export const MISS_FLASH_MS = 400;

// ---------------------------------------------------------------------------
// Fever / Overdrive
// ---------------------------------------------------------------------------

const FEVER_MAX = 100;
const FEVER_PER_CLEAR = 7;
const FEVER_BONUS_ELITE = 10;
const FEVER_BONUS_GOLDEN = 14;
/** Extra fever awarded when a clear also crosses a combo-of-5 milestone. */
const FEVER_BONUS_COMBO_MILESTONE = 12;
export const OVERDRIVE_MS = 7000;
/** Words spawned during Overdrive fall this much slower... */
const OVERDRIVE_FALL_SCALE = 1.4;
/** ...and are worth this much more. */
const OVERDRIVE_SCORE_MULT = 1.5;

// Elite words are simply longer, and the shared word list has no length
// metadata to filter on directly, so a handful are sampled and the longest
// kept — same approach Boss Battle's word draw already uses.
const ELITE_MIN_LENGTH = 7;
const ELITE_SAMPLES = 6;
const ELITE_UNLOCK_AT_CLEARED = 15;
export function phaseForCleared(cleared: number): { phase: number; name: string } {
  if (cleared >= 70) return { phase: 5, name: "Overdrive Frenzy" };
  if (cleared >= 45) return { phase: 4, name: "Elite Swarm" };
  if (cleared >= 25) return { phase: 3, name: "Mixed Threats" };
  if (cleared >= 10) return { phase: 2, name: "Pressure Surge" };
  return { phase: 1, name: "Scout Warmup" };
}

function pickWordKind(cleared: number): WordKind {
  const rand = Math.random();
  if (rand < 0.07) return "golden";
  if (rand < 0.16) return "freeze";
  if (cleared >= 10 && rand < 0.28) return "hazard";
  if (cleared >= ELITE_UNLOCK_AT_CLEARED && rand < 0.44) return "elite";
  return "normal";
}

function drawWordFor(kind: WordKind): string {
  if (kind !== "elite") return generateWords(1, { punctuation: false, numbers: false })[0];
  const candidates = generateWords(ELITE_SAMPLES, { punctuation: false, numbers: false });
  const longEnough = candidates.filter((w) => w.length >= ELITE_MIN_LENGTH);
  const pool = longEnough.length > 0 ? longEnough : candidates;
  return pool.reduce((a, b) => (b.length > a.length ? b : a));
}

type GameAction =
  | { type: "START" }
  | { type: "RESET" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "TICK" }
  | { type: "SPAWN"; text: string; lane: number; kind: WordKind }
  | { type: "SET_TYPED"; value: string };

export function createInitialState(definition: GameDefinition): GameState {
  const initialPhase = phaseForCleared(0);
  return {
    status: "idle",
    definition,
    words: [],
    typed: "",
    lockedId: null,
    lives: definition.lives,
    score: 0,
    cleared: 0,
    missed: 0,
    combo: 0,
    bestCombo: 0,
    correctKeystrokes: 0,
    incorrectKeystrokes: 0,
    elapsedMs: 0,
    destroyed: [],
    lastMissMs: null,
    fever: 0,
    overdriveMs: 0,
    slowdownMs: 0,
    phase: initialPhase.phase,
    phaseName: initialPhase.name,
  };
}

/** Difficulty ramps with words cleared, so it tracks skill rather than the clock. */
export function currentSpawnMs(state: GameState): number {
  const { initialSpawnMs, minSpawnMs, spawnRampPerClear } = tuningFor(state.definition.id);
  return Math.max(minSpawnMs, initialSpawnMs - state.cleared * spawnRampPerClear);
}

function currentFallMs(state: GameState, kind: WordKind = "normal"): number {
  const { initialFallMs, minFallMs, fallRampPerClear } = tuningFor(state.definition.id);
  let base = Math.max(minFallMs, initialFallMs - state.cleared * fallRampPerClear);
  if (kind === "hazard") base = Math.round(base * 0.82); // Hazard falls faster!
  return state.overdriveMs > 0 ? Math.round(base * OVERDRIVE_FALL_SCALE) : base;
}

// Caps at 2x so a long combo stays rewarding without making the early score
// irrelevant to the final total.
function comboMultiplier(combo: number): number {
  return 1 + Math.min(combo, 10) * 0.1;
}

const KIND_SCORE_MULT: Record<WordKind, number> = {
  normal: 1,
  elite: 1.8,
  golden: 3,
  freeze: 1.4,
  hazard: 2,
};

function scoreForWord(text: string, combo: number, kind: WordKind, overdriveActive: boolean): number {
  const base = text.length * 10 * comboMultiplier(combo) * KIND_SCORE_MULT[kind];
  return Math.round(overdriveActive ? base * OVERDRIVE_SCORE_MULT : base);
}

function feverForClear(kind: WordKind, comboAfter: number): number {
  let gain = FEVER_PER_CLEAR;
  if (kind === "elite") gain += FEVER_BONUS_ELITE;
  if (kind === "golden") gain += FEVER_BONUS_GOLDEN;
  if (comboAfter > 0 && comboAfter % 5 === 0) gain += FEVER_BONUS_COMBO_MILESTONE;
  return gain;
}

/**
 * Picks which on-screen word the next keystrokes belong to. Once a word is
 * locked in it stays locked even if another word would also match the prefix,
 * otherwise the target could switch mid-word and make the highlight jump. When
 * nothing is locked, the word closest to the floor wins — that's the one about
 * to cost a life, so it's almost always what the player means.
 */
function findTarget(words: FallingWord[], value: string, lockedId: number | null): FallingWord | null {
  if (lockedId !== null) {
    const locked = words.find((w) => w.id === lockedId);
    if (locked && locked.text.startsWith(value)) return locked;
  }
  const matches = words.filter((w) => w.text.startsWith(value));
  if (matches.length === 0) return null;
  // Prefer an exact match over "closest to the floor" -- otherwise a word
  // typed perfectly could be passed over for a different, longer word that
  // merely shares a prefix and is further along (e.g. "a" vs "are"), leaving
  // the correctly-typed word uncleared. Real dictionary collisions like this
  // are common among the shortest, most frequent words. Only reached when
  // there's no active lock on a still-matching word (see above) -- an
  // existing lock still wins, matching the documented "targeting locks on"
  // behavior.
  const exact = matches.find((w) => w.text === value);
  if (exact) return exact;
  return matches.reduce((a, b) => (b.progress > a.progress ? b : a));
}

let nextWordId = 0;
/** React key for a destroy effect — stable for the effect's whole short life. */
let nextDestroySeq = 0;

export function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START":
      return { ...createInitialState(state.definition), status: "running" };

    case "RESET":
      return createInitialState(state.definition);

    case "PAUSE":
      return state.status === "running" ? { ...state, status: "paused" } : state;

    case "RESUME":
      return state.status === "paused" ? { ...state, status: "running" } : state;

    case "SPAWN": {
      if (state.status !== "running") return state;
      if (state.words.length >= MAX_ACTIVE_WORDS) return state;
      const word: FallingWord = {
        id: nextWordId++,
        text: action.text,
        kind: action.kind,
        progress: 0,
        fallMs: currentFallMs(state, action.kind),
        lane: action.lane,
      };
      return { ...state, words: [...state.words, word] };
    }

    case "TICK": {
      if (state.status !== "running") return state;

      const survivors: FallingWord[] = [];
      let landed = 0;
      const speedMult = state.slowdownMs > 0 ? 0.5 : 1;

      for (const word of state.words) {
        const progress = word.progress + (TICK_MS * speedMult) / word.fallMs;
        if (progress >= 1) landed += 1;
        else survivors.push({ ...word, progress });
      }

      const elapsedMs = state.elapsedMs + TICK_MS;
      const destroyed = state.destroyed.filter((d) => elapsedMs - d.bornMs < DESTROY_EFFECT_MS);
      const overdriveMs = Math.max(0, state.overdriveMs - TICK_MS);
      const slowdownMs = Math.max(0, state.slowdownMs - TICK_MS);

      if (landed === 0) {
        return { ...state, words: survivors, elapsedMs, destroyed, overdriveMs, slowdownMs };
      }

      const lives = Math.max(0, state.lives - landed);
      // A landed word may have been the one being typed — drop the lock so the
      // next keystroke re-targets instead of matching against a gone word.
      const lockedStillAlive = survivors.some((w) => w.id === state.lockedId);
      return {
        ...state,
        words: survivors,
        elapsedMs,
        destroyed,
        overdriveMs,
        slowdownMs,
        lives,
        missed: state.missed + landed,
        combo: 0,
        lastMissMs: elapsedMs,
        typed: lockedStillAlive ? state.typed : "",
        lockedId: lockedStillAlive ? state.lockedId : null,
        status: lives === 0 ? "over" : state.status,
      };
    }

    case "SET_TYPED": {
      if (state.status !== "running") return state;
      const rawValue = action.value;
      const value = rawValue.trim();

      if (rawValue.length < state.typed.length) {
        // Backspace: allowed, and deliberately not counted as a mistake.
        return { ...state, typed: value, lockedId: value === "" ? null : state.lockedId };
      }
      if (value === state.typed && rawValue.length <= state.typed.length) return state;

      const target = findTarget(state.words, value, state.lockedId);
      const added = Math.max(1, rawValue.length - state.typed.length);

      if (!target) {
        // No word on screen starts with this — reject the character outright
        // rather than letting the buffer drift into an unmatchable string.
        return {
          ...state,
          incorrectKeystrokes: state.incorrectKeystrokes + added,
          combo: 0,
        };
      }

      const correctKeystrokes = state.correctKeystrokes + added;

      if (target.text === value) {
        const combo = state.combo + 1;
        const overdriveActive = state.overdriveMs > 0;
        const bonus = target.kind === "hazard" ? 25 : 0;
        const points =
          scoreForWord(target.text, state.combo, target.kind, overdriveActive) + bonus;

        // Fever builds on every clean clear and is spent the instant it caps —
        // Overdrive doesn't also refill fever while it's active, so the
        // reward has a real cost (you have to earn the next one from zero).
        const feverGain = overdriveActive ? 0 : feverForClear(target.kind, combo);
        const fever = overdriveActive ? state.fever : Math.min(FEVER_MAX, state.fever + feverGain);
        const enteringOverdrive = !overdriveActive && fever >= FEVER_MAX;
        const activatesSlowdown = target.kind === "freeze";
        const newSlowdownMs = activatesSlowdown ? 3500 : state.slowdownMs;
        const newCleared = state.cleared + 1;
        const phaseInfo = phaseForCleared(newCleared);

        return {
          ...state,
          words: state.words.filter((w) => w.id !== target.id),
          typed: "",
          lockedId: null,
          cleared: newCleared,
          phase: phaseInfo.phase,
          phaseName: phaseInfo.name,
          score: state.score + points,
          combo,
          bestCombo: Math.max(state.bestCombo, combo),
          correctKeystrokes,
          slowdownMs: newSlowdownMs,
          fever: enteringOverdrive ? 0 : fever,
          overdriveMs: enteringOverdrive ? OVERDRIVE_MS : state.overdriveMs,
          destroyed: [
            ...state.destroyed,
            {
              seq: nextDestroySeq++,
              lane: target.lane,
              progress: target.progress,
              points,
              kind: target.kind,
              bornMs: state.elapsedMs,
            },
          ].slice(-MAX_DESTROY_EFFECTS),
        };
      }

      return { ...state, typed: value, lockedId: target.id, correctKeystrokes };
    }
  }
}

export interface UseFallingWordsOptions {
  laneCount?: number;
}

export function useFallingWords(definition: GameDefinition, options?: UseFallingWordsOptions) {
  const [state, dispatch] = useReducer(reducer, definition, createInitialState);
  const laneCount = options?.laneCount ?? LANE_COUNT;
  const laneCountRef = useRef(laneCount);
  useEffect(() => {
    laneCountRef.current = laneCount;
  }, [laneCount]);

  // Read by the spawn timer without making it a dependency, so changing
  // difficulty mid-run doesn't tear down and restart the timer chain. Synced
  // in an effect rather than during render; this effect is declared first, so
  // it lands before the timers below re-run, and the first spawn is a full
  // interval away regardless.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (state.status !== "running") return;
    const id = setInterval(() => dispatch({ type: "TICK" }), TICK_MS);
    return () => clearInterval(id);
  }, [state.status]);

  // Self-rescheduling timeout rather than a fixed interval: the gap between
  // spawns shrinks as the run goes on, and re-reading it each time is what
  // makes the ramp continuous instead of stepped.
  useEffect(() => {
    if (state.status !== "running") return;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      timer = setTimeout(() => {
        const current = stateRef.current;
        if (current.status === "running") {
          const active = new Set(current.words.map((w) => w.text));
          const kind = pickWordKind(current.cleared);
          // Retry a few times to avoid two identical words on screen, which is
          // ambiguous to type against; give up rather than loop forever on a
          // small word list.
          let text = drawWordFor(kind);
          for (let i = 0; i < 8 && active.has(text); i++) {
            text = drawWordFor(kind);
          }
          if (!active.has(text)) {
            const usedLanes = new Set(current.words.map((w) => w.lane));
            const currentLanes = laneCountRef.current;
            const freeLanes = Array.from({ length: currentLanes }, (_, i) => i).filter(
              (l) => !usedLanes.has(l),
            );
            // MAX_ACTIVE_WORDS (7) can exceed LANE_COUNT (6), so all lanes
            // being occupied is a real, reachable state, not just a
            // theoretical one. Previously falling back to a random --
            // already-occupied -- lane here forced two words to overlap at
            // the exact same horizontal position, contradicting `lane`'s own
            // doc comment ("so words don't overlap") and sometimes making
            // one genuinely unreadable/untypeable before it reached the
            // floor. Skipping the spawn (same choice Word Blaster's
            // pickLane already makes) is strictly better than a guaranteed
            // collision -- this tick's spawn is simply deferred to the next.
            if (freeLanes.length > 0) {
              const lane = freeLanes[Math.floor(Math.random() * freeLanes.length)];
              dispatch({ type: "SPAWN", text, lane, kind });
            }
          }
        }
        schedule();
      }, currentSpawnMs(stateRef.current));
    };

    schedule();
    return () => clearTimeout(timer);
  }, [state.status]);

  // Pausing on tab-hide keeps a backgrounded run from silently draining every
  // life at once the moment the player comes back.
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

  return { state, start, reset, pause, resume, setTyped };
}
