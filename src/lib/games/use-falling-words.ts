import { useCallback, useEffect, useReducer, useRef } from "react";
import { generateWords } from "@/lib/typing-engine/word-generator";
import type { GameDefinition, GameId, GameStatus } from "@/lib/games/game-types";

// Everything below is specific to the descending-words mechanic, so it lives
// with the engine rather than in game-types.ts. That file holds only the
// contract every game shares (name, rules, lives, how the score is formatted);
// a game with a different mechanic keeps its own state shape and tuning in its
// own module the same way.

export interface FallingWord {
  id: number;
  text: string;
  /** 0 = just spawned at the ceiling, 1 = reached the floor. */
  progress: number;
  /** Milliseconds this particular word takes to fall, fixed at spawn. */
  fallMs: number;
  /** Horizontal lane index, so words don't overlap each other. */
  lane: number;
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

type GameAction =
  | { type: "START" }
  | { type: "RESET" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "TICK" }
  | { type: "SPAWN"; text: string; lane: number }
  | { type: "SET_TYPED"; value: string };

function createInitialState(definition: GameDefinition): GameState {
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
  };
}

/** Difficulty ramps with words cleared, so it tracks skill rather than the clock. */
export function currentSpawnMs(state: GameState): number {
  const { initialSpawnMs, minSpawnMs, spawnRampPerClear } = tuningFor(state.definition.id);
  return Math.max(minSpawnMs, initialSpawnMs - state.cleared * spawnRampPerClear);
}

function currentFallMs(state: GameState): number {
  const { initialFallMs, minFallMs, fallRampPerClear } = tuningFor(state.definition.id);
  return Math.max(minFallMs, initialFallMs - state.cleared * fallRampPerClear);
}

// Caps at 2x so a long combo stays rewarding without making the early score
// irrelevant to the final total.
function comboMultiplier(combo: number): number {
  return 1 + Math.min(combo, 10) * 0.1;
}

function scoreForWord(text: string, combo: number): number {
  return Math.round(text.length * 10 * comboMultiplier(combo));
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

function reducer(state: GameState, action: GameAction): GameState {
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
        progress: 0,
        fallMs: currentFallMs(state),
        lane: action.lane,
      };
      return { ...state, words: [...state.words, word] };
    }

    case "TICK": {
      if (state.status !== "running") return state;

      const survivors: FallingWord[] = [];
      let landed = 0;
      for (const word of state.words) {
        const progress = word.progress + TICK_MS / word.fallMs;
        if (progress >= 1) landed += 1;
        else survivors.push({ ...word, progress });
      }

      const elapsedMs = state.elapsedMs + TICK_MS;
      if (landed === 0) return { ...state, words: survivors, elapsedMs };

      const lives = Math.max(0, state.lives - landed);
      // A landed word may have been the one being typed — drop the lock so the
      // next keystroke re-targets instead of matching against a gone word.
      const lockedStillAlive = survivors.some((w) => w.id === state.lockedId);
      return {
        ...state,
        words: survivors,
        elapsedMs,
        lives,
        missed: state.missed + landed,
        combo: 0,
        typed: lockedStillAlive ? state.typed : "",
        lockedId: lockedStillAlive ? state.lockedId : null,
        status: lives === 0 ? "over" : state.status,
      };
    }

    case "SET_TYPED": {
      if (state.status !== "running") return state;
      const value = action.value;

      if (value.length < state.typed.length) {
        // Backspace: allowed, and deliberately not counted as a mistake.
        return { ...state, typed: value, lockedId: value === "" ? null : state.lockedId };
      }
      if (value === state.typed) return state;

      const target = findTarget(state.words, value, state.lockedId);
      const added = value.length - state.typed.length;

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
        return {
          ...state,
          words: state.words.filter((w) => w.id !== target.id),
          typed: "",
          lockedId: null,
          cleared: state.cleared + 1,
          score: state.score + scoreForWord(target.text, state.combo),
          combo,
          bestCombo: Math.max(state.bestCombo, combo),
          correctKeystrokes,
        };
      }

      return { ...state, typed: value, lockedId: target.id, correctKeystrokes };
    }
  }
}

export function useFallingWords(definition: GameDefinition) {
  const [state, dispatch] = useReducer(reducer, definition, createInitialState);

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
          // Retry a few times to avoid two identical words on screen, which is
          // ambiguous to type against; give up rather than loop forever on a
          // small word list.
          let text = generateWords(1, { punctuation: false, numbers: false })[0];
          for (let i = 0; i < 8 && active.has(text); i++) {
            text = generateWords(1, { punctuation: false, numbers: false })[0];
          }
          if (!active.has(text)) {
            const usedLanes = new Set(current.words.map((w) => w.lane));
            const freeLanes = Array.from({ length: LANE_COUNT }, (_, i) => i).filter(
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
              dispatch({ type: "SPAWN", text, lane });
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
