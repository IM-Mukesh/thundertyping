import { useCallback, useEffect, useReducer, useRef } from "react";
import { generateWords } from "@/lib/typing-engine/word-generator";
import type {
  FallingWord,
  GameDefinition,
  GameState,
} from "@/lib/games/game-types";

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
  const { initialSpawnMs, minSpawnMs, spawnRampPerClear } = state.definition;
  return Math.max(minSpawnMs, initialSpawnMs - state.cleared * spawnRampPerClear);
}

function currentFallMs(state: GameState): number {
  const { initialFallMs, minFallMs, fallRampPerClear } = state.definition;
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
            const lanes = freeLanes.length > 0 ? freeLanes : [Math.floor(Math.random() * LANE_COUNT)];
            dispatch({ type: "SPAWN", text, lane: lanes[Math.floor(Math.random() * lanes.length)] });
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
