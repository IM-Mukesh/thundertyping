import { useCallback, useEffect, useReducer, useRef } from "react";
import { generateWords } from "@/lib/typing-engine/word-generator";
import type { GameDefinition, GameStatus } from "@/lib/games/game-types";

export type StormPhase = "MIST" | "DRIZZLE" | "DOWNPOUR" | "GALE FORCE" | "HURRICANE";

export interface StormPhaseInfo {
  phase: StormPhase;
  minElapsedMs: number;
  spawnMs: number;
  fallMs: number;
  rainDensity: number;
  description: string;
}

export const STORM_PHASES: StormPhaseInfo[] = [
  {
    phase: "MIST",
    minElapsedMs: 0,
    spawnMs: 1400,
    fallMs: 7500,
    rainDensity: 20,
    description: "Light mist gathers. Find your typing cadence.",
  },
  {
    phase: "DRIZZLE",
    minElapsedMs: 20_000,
    spawnMs: 1100,
    fallMs: 6000,
    rainDensity: 40,
    description: "Winds pick up. Words fall faster.",
  },
  {
    phase: "DOWNPOUR",
    minElapsedMs: 45_000,
    spawnMs: 850,
    fallMs: 4800,
    rainDensity: 70,
    description: "Heavy rain descends. Hold your focus.",
  },
  {
    phase: "GALE FORCE",
    minElapsedMs: 80_000,
    spawnMs: 650,
    fallMs: 3800,
    rainDensity: 100,
    description: "Gale force storm! Pure endurance test.",
  },
  {
    phase: "HURRICANE",
    minElapsedMs: 120_000,
    spawnMs: 480,
    fallMs: 2800,
    rainDensity: 140,
    description: "The storm's eye! Maximum survival glory.",
  },
];

export interface RainWord {
  id: number;
  text: string;
  progress: number;
  fallMs: number;
  lane: number;
  isUrgent?: boolean;
}

export interface RainDestroyEffect {
  seq: number;
  lane: number;
  progress: number;
  isNearMiss: boolean;
  bornMs: number;
}

export interface WordRainState {
  status: GameStatus;
  definition: GameDefinition;
  words: RainWord[];
  typed: string;
  lockedId: number | null;
  elapsedMs: number;
  cleared: number;
  nearMisses: number;
  combo: number;
  bestCombo: number;
  correctKeystrokes: number;
  incorrectKeystrokes: number;
  currentPhaseIndex: number;
  pressure: number; // 0 to 100%
  destroyed: RainDestroyEffect[];
  lastThunderMs: number | null;
  lastMissMs: number | null;
}

export type WordRainAction =
  | { type: "START" }
  | { type: "RESET" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "TICK" }
  | { type: "SPAWN"; text: string; lane: number }
  | { type: "SET_TYPED"; value: string };

export const TICK_MS = 50;
export const MAX_ACTIVE_WORDS = 8;
export const DESTROY_EFFECT_MS = 450;
export const NEAR_MISS_THRESHOLD = 0.76;

export function getStormPhase(elapsedMs: number): StormPhaseInfo {
  let active = STORM_PHASES[0];
  for (const p of STORM_PHASES) {
    if (elapsedMs >= p.minElapsedMs) active = p;
  }
  return active;
}

export function createInitialState(definition: GameDefinition): WordRainState {
  return {
    status: "idle",
    definition,
    words: [],
    typed: "",
    lockedId: null,
    elapsedMs: 0,
    cleared: 0,
    nearMisses: 0,
    combo: 0,
    bestCombo: 0,
    correctKeystrokes: 0,
    incorrectKeystrokes: 0,
    currentPhaseIndex: 0,
    pressure: 0,
    destroyed: [],
    lastThunderMs: null,
    lastMissMs: null,
  };
}

let nextRainWordId = 1;
let nextRainSeq = 1;

export function findTarget(words: RainWord[], value: string, lockedId: number | null): RainWord | null {
  if (lockedId !== null) {
    const locked = words.find((w) => w.id === lockedId);
    if (locked && locked.text.startsWith(value)) return locked;
  }
  const matches = words.filter((w) => w.text.startsWith(value));
  if (matches.length === 0) return null;
  const exact = matches.find((w) => w.text === value);
  if (exact) return exact;
  return matches.reduce((a, b) => (b.progress > a.progress ? b : a));
}

export const reducer = wordRainReducer;
export function wordRainReducer(state: WordRainState, action: WordRainAction): WordRainState {

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

      const phase = getStormPhase(state.elapsedMs);
      const word: RainWord = {
        id: nextRainWordId++,
        text: action.text,
        progress: 0,
        fallMs: phase.fallMs,
        lane: action.lane,
      };
      return { ...state, words: [...state.words, word] };
    }

    case "TICK": {
      if (state.status !== "running") return state;

      const survivors: RainWord[] = [];
      let reachedFloor = false;
      let highestProgress = 0;

      for (const word of state.words) {
        const progress = word.progress + TICK_MS / word.fallMs;
        if (progress >= 1) {
          reachedFloor = true;
        } else {
          highestProgress = Math.max(highestProgress, progress);
          survivors.push({ ...word, progress, isUrgent: progress >= NEAR_MISS_THRESHOLD });
        }
      }

      const elapsedMs = state.elapsedMs + TICK_MS;
      const phase = getStormPhase(elapsedMs);
      const phaseIndex = STORM_PHASES.indexOf(phase);
      const phaseChanged = phaseIndex !== state.currentPhaseIndex;

      // Pressure is based on how close the most dangerous word is to the bottom
      const pressure = Math.round(highestProgress * 100);
      const destroyed = state.destroyed.filter((d) => elapsedMs - d.bornMs < DESTROY_EFFECT_MS);

      if (reachedFloor) {
        // One life ends the run immediately in Word Rain!
        return {
          ...state,
          words: survivors,
          elapsedMs,
          status: "over",
          lastMissMs: elapsedMs,
          combo: 0,
        };
      }

      return {
        ...state,
        words: survivors,
        elapsedMs,
        pressure,
        destroyed,
        currentPhaseIndex: phaseIndex,
        lastThunderMs: phaseChanged ? elapsedMs : state.lastThunderMs,
      };
    }

    case "SET_TYPED": {
      if (state.status !== "running") return state;
      const rawValue = action.value;
      const value = rawValue.trim();

      if (rawValue.length < state.typed.length) {
        return { ...state, typed: value, lockedId: value === "" ? null : state.lockedId };
      }
      if (value === state.typed && rawValue.length <= state.typed.length) return state;

      const target = findTarget(state.words, value, state.lockedId);
      const added = Math.max(1, rawValue.length - state.typed.length);

      if (!target) {
        return {
          ...state,
          incorrectKeystrokes: state.incorrectKeystrokes + added,
          combo: 0,
        };
      }

      const correctKeystrokes = state.correctKeystrokes + added;

      if (target.text === value) {
        const isNearMiss = target.progress >= NEAR_MISS_THRESHOLD;
        const combo = state.combo + 1;
        const destroyEffect: RainDestroyEffect = {
          seq: nextRainSeq++,
          lane: target.lane,
          progress: target.progress,
          isNearMiss,
          bornMs: state.elapsedMs,
        };

        return {
          ...state,
          words: state.words.filter((w) => w.id !== target.id),
          typed: "",
          lockedId: null,
          cleared: state.cleared + 1,
          nearMisses: state.nearMisses + (isNearMiss ? 1 : 0),
          combo,
          bestCombo: Math.max(state.bestCombo, combo),
          correctKeystrokes,
          destroyed: [...state.destroyed, destroyEffect],
        };
      }

      return {
        ...state,
        typed: value,
        lockedId: target.id,
        correctKeystrokes,
      };
    }

    default:
      return state;
  }
}

export function useWordRain(definition: GameDefinition, options: { laneCount?: number } = {}) {
  const laneCount = options.laneCount ?? 5;
  const [state, dispatch] = useReducer(wordRainReducer, definition, createInitialState);

  const wordPoolRef = useRef<string[]>([]);
  const nextSpawnTimeRef = useRef(0);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const start = useCallback(() => dispatch({ type: "START" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);
  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
  const resume = useCallback(() => dispatch({ type: "RESUME" }), []);
  const setTyped = useCallback((value: string) => dispatch({ type: "SET_TYPED", value }), []);

  // Main game tick
  useEffect(() => {
    if (state.status !== "running") return;
    const interval = setInterval(() => {
      dispatch({ type: "TICK" });
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [state.status]);

  // Spawner loop
  useEffect(() => {
    if (state.status !== "running") return;

    nextSpawnTimeRef.current = stateRef.current.elapsedMs + getStormPhase(stateRef.current.elapsedMs).spawnMs;
    const spawnCheck = setInterval(() => {
      const current = stateRef.current;
      const now = current.elapsedMs;
      if (now < nextSpawnTimeRef.current) return;

      const phase = getStormPhase(now);
      nextSpawnTimeRef.current = now + phase.spawnMs;

      if (wordPoolRef.current.length < 15) {
        wordPoolRef.current = [...wordPoolRef.current, ...generateWords(30, { punctuation: false, numbers: false })];
      }

      const occupiedLanes = new Set(
        current.words.filter((w) => w.progress < 0.22).map((w) => w.lane),
      );
      const freeLanes: number[] = [];
      for (let l = 0; l < laneCount; l++) {
        if (!occupiedLanes.has(l)) freeLanes.push(l);
      }
      if (freeLanes.length === 0) return;

      const lane = freeLanes[Math.floor(Math.random() * freeLanes.length)];
      const text = wordPoolRef.current.shift() ?? "rain";

      dispatch({ type: "SPAWN", text, lane });
    }, 100);

    return () => clearInterval(spawnCheck);
  }, [state.status, laneCount]);

  return { state, start, reset, pause, resume, setTyped };
}
