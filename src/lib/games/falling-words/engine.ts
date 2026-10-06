import type { GameDefinition } from "@/lib/games/game-types";
import type { FallingWord, GameState, WordKind } from "@/lib/games/use-falling-words";
import { createRng } from "@/lib/rng/seeded-rng";
import { calculateAccuracy, calculateNetWpm } from "@/lib/typing-engine/stats";

export type SkyfallMode = "standard" | "zen";

export interface SkyfallWord extends FallingWord {
  /** Furthest correctly typed prefix, retained after deleting or releasing a lock. */
  highWater: number;
}

/** Structurally compatible with the legacy HUD and read-only scene/audio projections. */
export interface SkyfallState extends GameState {
  words: SkyfallWord[];
  outputChars: number;
  seed: string;
  nextId: number;
  /** Active milliseconds remaining until the next scheduled spawn attempt. */
  spawnMs: number;
  /** Practice is explicit so controllers can exclude it from saves and rewards. */
  mode: SkyfallMode;
  laneCount: number;
}

export interface SkyfallStartOptions {
  seed?: string;
  laneCount?: number;
  mode?: SkyfallMode;
}

export const LANE_COUNT = 6;
export const MAX_ACTIVE_WORDS = 6;
export const DESTROY_EFFECT_MS = 420;
export const MISS_FLASH_MS = 400;
export const OVERDRIVE_MS = 7000;

const MAX_DESTROY_EFFECTS = 6;
const FROST_MS = 3500;
const ZEN_SCALE = 1.6;
const TIME_EPSILON = 1e-9;
const PROGRESS_EPSILON = 1e-12;

// A multiple of every supported lane count. IDs recycle only after a billion
// attempts, allowing arithmetic seeks in unlimited practice with precise IDs.
const ID_CYCLE = 1_000_000_020;

// Everyday, readable ASCII words: ordinary words stay short and elites are
// always 7–10 letters. Disjoint initial-letter pools per lane remove prefix
// ambiguity without random retries, including on a three-lane mobile board.
const WORDS = [
  "arch", "apple", "bloom", "breeze", "cloud", "calm", "dawn", "dream",
  "ember", "earth", "flame", "field", "glow", "garden", "haven", "heart",
  "island", "ivory", "jade", "jewel", "kite", "kind", "light", "leaf",
  "mist", "moon", "night", "north", "ocean", "orbit", "pulse", "pearl",
  "quest", "quiet", "rain", "river", "star", "shore", "tide", "trail",
  "unity", "under", "veil", "valley", "wave", "willow", "yarn", "young",
  "zinc", "zebra",
] as const;
const ELITE_WORDS = [
  "avalanche", "blossom", "crescent", "daylight", "evergreen", "firelight",
  "guardian", "horizon", "iceberg", "journey", "kingdom", "lantern",
  "mountain", "nightfall", "orchard", "paradise", "quicksand", "radiance",
  "starlight", "treasure", "umbrella", "velocity", "whirlwind", "xylophone",
  "yearning", "zeppelin",
] as const;

const KIND_SCORE_MULT: Record<WordKind, number> = {
  normal: 1, elite: 1.8, golden: 3, freeze: 1.4, hazard: 2,
};

export function phaseForCleared(cleared: number): { phase: number; name: string } {
  if (cleared >= 70) return { phase: 5, name: "Overdrive Frenzy" };
  if (cleared >= 45) return { phase: 4, name: "Elite Swarm" };
  if (cleared >= 25) return { phase: 3, name: "Mixed Threats" };
  if (cleared >= 10) return { phase: 2, name: "Pressure Surge" };
  return { phase: 1, name: "Scout Warmup" };
}

export function createSkyfallState(definition: GameDefinition): SkyfallState {
  const phase = phaseForCleared(0);
  return {
    status: "idle", definition, words: [], destroyed: [], lockedId: null, typed: "",
    lives: 3, score: 0, cleared: 0, missed: 0, combo: 0, bestCombo: 0,
    correctKeystrokes: 0, incorrectKeystrokes: 0, outputChars: 0, elapsedMs: 0,
    lastMissMs: null, fever: 0, overdriveMs: 0, slowdownMs: 0,
    phase: phase.phase, phaseName: phase.name,
    seed: "falling-words", nextId: 1, spawnMs: 1700, mode: "standard", laneCount: LANE_COUNT,
  };
}

export function startSkyfall(definition: GameDefinition, options: SkyfallStartOptions = {}): SkyfallState {
  const state = createSkyfallState(definition);
  state.status = "running";
  state.seed = typeof options.seed === "string" ? options.seed : state.seed;
  state.mode = options.mode === "zen" ? "zen" : "standard";
  state.laneCount = Number.isFinite(options.laneCount)
    ? Math.max(1, Math.min(LANE_COUNT, Math.trunc(options.laneCount!)))
    : LANE_COUNT;
  state.spawnMs = currentSkyfallSpawnMs(state);
  return state;
}

function baseFallMs(state: SkyfallState): number {
  const normal = Math.max(3600, 9000 - state.cleared * 58);
  return state.mode === "zen" ? Math.round(normal * ZEN_SCALE) : normal;
}

export function currentSkyfallSpawnMs(state: SkyfallState): number {
  const normal = Math.max(620, 1700 - state.cleared * 20);
  if (state.mode === "standard") return normal;
  // Practice remains slower, and steady-state words vacate their lane before
  // its next turn. This also makes arbitrarily long idle practice seekable.
  return Math.max(Math.round(normal * ZEN_SCALE), Math.ceil(baseFallMs(state) / state.laneCount) + 1);
}

function fallMsFor(state: SkyfallState, kind: WordKind): number {
  let fallMs = baseFallMs(state);
  if (kind === "hazard") fallMs = Math.round(fallMs * 0.82);
  return state.overdriveMs > 0 ? Math.round(fallMs * 1.4) : fallMs;
}

function advanceId(id: number, attempts = 1): number {
  return ((id - 1 + attempts % ID_CYCLE + ID_CYCLE) % ID_CYCLE) + 1;
}

function laneForId(id: number, laneCount: number): number {
  return (id - 1) % laneCount;
}

function drawWord(state: SkyfallState, id: number, lane: number): SkyfallWord {
  const rng = createRng(`${state.seed}:spawn:${id}`);
  const roll = rng.next();
  const kind: WordKind = roll < 0.07 ? "golden" : roll < 0.16 ? "freeze"
    : state.cleared >= 10 && roll < 0.28 ? "hazard"
      : state.cleared >= 15 && roll < 0.44 ? "elite" : "normal";
  const pool: readonly string[] = kind === "elite" ? ELITE_WORDS : WORDS;
  const choices = pool.filter((word) => (word.charCodeAt(0) - 97) % state.laneCount === lane);
  return { id, text: rng.pick(choices), kind, lane, progress: 0, fallMs: fallMsFor(state, kind), highWater: 0 };
}

function spawn(state: SkyfallState): void {
  const id = state.nextId;
  state.nextId = advanceId(id);
  state.spawnMs = currentSkyfallSpawnMs(state);
  if (state.words.length >= Math.min(MAX_ACTIVE_WORDS, state.laneCount)) return;
  const used = new Set(state.words.map((word) => word.lane));
  const preferred = laneForId(id, state.laneCount);
  let lane = preferred;
  if (used.has(lane)) {
    if (state.mode === "zen") return;
    lane = Array.from({ length: state.laneCount }, (_, offset) => (preferred + offset) % state.laneCount)
      .find((candidate) => !used.has(candidate)) ?? -1;
  }
  if (lane >= 0) state.words.push(drawWord(state, id, lane));
}

function settleBreaches(state: SkyfallState): void {
  const landed = state.words.filter((word) => word.progress >= 1 - PROGRESS_EPSILON)
    .sort((a, b) => a.id - b.id);
  for (const word of landed) {
    state.words = state.words.filter((candidate) => candidate.id !== word.id);
    state.missed++;
    state.combo = 0;
    state.lastMissMs = state.elapsedMs;
    if (state.lockedId === word.id) {
      state.lockedId = null;
      state.typed = "";
    }
    if (state.mode === "standard") {
      state.lives = Math.max(0, state.lives - 1);
      if (state.lives === 0) {
        state.status = "over";
        return;
      }
    }
  }
}

function ageEffects(state: SkyfallState): void {
  state.destroyed = state.destroyed.filter((effect) => state.elapsedMs - effect.bornMs < DESTROY_EFFECT_MS);
}

function addFinite(a: number, b: number): number {
  return Math.min(Number.MAX_VALUE, a + b);
}

function advanceTime(state: SkyfallState, deltaMs: number): void {
  const speed = state.slowdownMs > 0 ? 0.5 : 1;
  for (const word of state.words) word.progress = Math.min(1, word.progress + deltaMs * speed / word.fallMs);
  state.elapsedMs = addFinite(state.elapsedMs, deltaMs);
  state.spawnMs = Math.max(0, state.spawnMs - deltaMs);
  state.slowdownMs = Math.max(0, state.slowdownMs - deltaMs);
  state.overdriveMs = Math.max(0, state.overdriveMs - deltaMs);
  ageEffects(state);
}

/** Can every future practice attempt use its own regular lane without blocking? */
function steadyPractice(state: SkyfallState, interval: number): boolean {
  if (state.mode !== "zen" || state.slowdownMs > 0 || state.overdriveMs > 0
    || state.spawnMs <= 0 || state.spawnMs > interval) return false;
  return state.words.every((word) => {
    const behind = (state.nextId - 1 - word.id + ID_CYCLE) % ID_CYCLE;
    const age = interval - state.spawnMs + behind * interval;
    return behind < state.laneCount && word.lane === laneForId(word.id, state.laneCount)
      && word.fallMs === fallMsFor(state, word.kind)
      && Math.abs(word.progress - age / word.fallMs) < PROGRESS_EPSILON;
  });
}

/**
 * Seek a long steady practice delay in O(lanes), including every breach and
 * spawn. Each authored lifetime is shorter than one full lane rotation, so
 * only the final rotation can survive. No randomness or gameplay is skipped:
 * each word is independently derived from its seed and scheduled ID.
 */
function seekPractice(state: SkyfallState, deltaMs: number): boolean {
  const interval = currentSkyfallSpawnMs(state);
  if (deltaMs < interval * (state.laneCount + 2) || !steadyPractice(state, interval)) return false;
  const attempts = Math.floor((deltaMs - state.spawnMs) / interval) + 1;
  const endAge = (deltaMs % interval - state.spawnMs + interval) % interval;
  const endMs = addFinite(state.elapsedMs, deltaMs);
  const nextId = advanceId(state.nextId, attempts);
  const survivors: SkyfallWord[] = [];
  let lastMissMs = state.lastMissMs;
  for (const word of state.words) {
    const breach = addFinite(state.elapsedMs, (1 - word.progress) * word.fallMs);
    lastMissMs = Math.max(lastMissMs ?? 0, breach);
  }
  // One extra expired candidate supplies the exact most recent breach time,
  // even when every word in the final lane rotation is still on screen.
  for (let behind = state.laneCount; behind >= 0; behind--) {
    const id = advanceId(nextId, -behind - 1);
    const word = drawWord(state, id, laneForId(id, state.laneCount));
    const age = endAge + behind * interval;
    if (age >= word.fallMs - TIME_EPSILON) {
      lastMissMs = Math.max(lastMissMs ?? 0, endMs - Math.max(0, age - word.fallMs));
    } else {
      word.progress = age / word.fallMs;
      survivors.push(word);
    }
  }
  const missed = state.words.length + attempts - survivors.length;
  state.missed = addFinite(state.missed, missed);
  state.combo = 0;
  state.lastMissMs = lastMissMs;
  state.words = survivors;
  state.typed = "";
  state.lockedId = null;
  state.nextId = nextId;
  state.elapsedMs = endMs;
  state.spawnMs = interval - endAge;
  ageEffects(state);
  return true;
}

/** Integrate whole wall delays at spawn, breach, frost and Overdrive boundaries. */
export function tickSkyfall(state: SkyfallState, deltaMs: number): SkyfallState {
  if (state.status !== "running" || !Number.isFinite(deltaMs) || deltaMs <= 0) return state;
  const next: SkyfallState = { ...state, words: state.words.map((word) => ({ ...word })) };
  let remaining = deltaMs;
  while (remaining > 0 && next.status === "running") {
    settleBreaches(next);
    if (next.status !== "running") break;
    if (next.spawnMs <= TIME_EPSILON) spawn(next);
    if (seekPractice(next, remaining)) break;
    let step = Math.min(remaining, next.spawnMs);
    if (next.slowdownMs > 0) step = Math.min(step, next.slowdownMs);
    if (next.overdriveMs > 0) step = Math.min(step, next.overdriveMs);
    const speed = next.slowdownMs > 0 ? 0.5 : 1;
    for (const word of next.words) step = Math.min(step, Math.max(0, 1 - word.progress) * word.fallMs / speed);
    advanceTime(next, step);
    remaining -= step;
    settleBreaches(next);
    // Equal-time timer expiries and breaches resolve before the spawn.
    if (next.status === "running" && next.spawnMs <= TIME_EPSILON) spawn(next);
  }
  return next;
}

export function pauseSkyfall(state: SkyfallState): SkyfallState {
  return state.status === "running" ? { ...state, status: "paused" } : state;
}

export function resumeSkyfall(state: SkyfallState): SkyfallState {
  return state.status === "paused" ? { ...state, status: "running" } : state;
}

function clearWord(state: SkyfallState, target: SkyfallWord, correctKeystrokes: number, outputChars: number): SkyfallState {
  const combo = state.combo + 1;
  const overdrive = state.overdriveMs > 0;
  const base = target.text.length * 10 * (1 + Math.min(state.combo, 10) * 0.1) * KIND_SCORE_MULT[target.kind];
  const points = Math.round(base * (overdrive ? 1.5 : 1)) + (target.kind === "hazard" ? 25 : 0);
  const gain = 7 + (target.kind === "elite" ? 10 : target.kind === "golden" ? 14 : 0)
    + (combo % 5 === 0 ? 12 : 0);
  const fever = overdrive ? state.fever : Math.min(100, state.fever + gain);
  const enteringOverdrive = !overdrive && fever >= 100;
  const cleared = state.cleared + 1;
  const phase = phaseForCleared(cleared);
  return {
    ...state, words: state.words.filter((word) => word.id !== target.id),
    typed: "", lockedId: null, cleared, phase: phase.phase, phaseName: phase.name,
    score: state.score + points, combo, bestCombo: Math.max(state.bestCombo, combo),
    correctKeystrokes, outputChars,
    slowdownMs: target.kind === "freeze" ? FROST_MS : state.slowdownMs,
    fever: enteringOverdrive ? 0 : fever,
    overdriveMs: enteringOverdrive ? OVERDRIVE_MS : state.overdriveMs,
    destroyed: [...state.destroyed, {
      seq: cleared, lane: target.lane, progress: target.progress, points,
      kind: target.kind, bornMs: state.elapsedMs,
    }].slice(-MAX_DESTROY_EFFECTS),
  };
}

export function typeSkyfallKey(state: SkyfallState, key: string): SkyfallState {
  if (state.status !== "running" || typeof key !== "string") return state;
  if (key === "Escape" || key === "Tab") return pauseSkyfall(state);
  if (key === "Backspace") {
    if (state.typed.length === 0) return state;
    const typed = state.typed.slice(0, -1);
    return { ...state, typed, lockedId: typed === "" ? null : state.lockedId };
  }
  if (!/^[a-zA-Z]$/.test(key)) return state;
  const letter = key.toLowerCase();
  const target = state.lockedId === null
    ? state.words.filter((word) => word.text[0] === letter)
      .sort((a, b) => b.progress - a.progress || a.id - b.id)[0]
    : state.words.find((word) => word.id === state.lockedId);
  const typed = state.typed + letter;
  if (!target || !target.text.startsWith(typed)) {
    return { ...state, incorrectKeystrokes: state.incorrectKeystrokes + 1, combo: 0 };
  }
  const correctKeystrokes = state.correctKeystrokes + 1;
  const highWater = Math.max(target.highWater, typed.length);
  const outputChars = state.outputChars + highWater - target.highWater;
  if (typed === target.text) return clearWord(state, target, correctKeystrokes, outputChars);
  return {
    ...state, typed, lockedId: target.id, correctKeystrokes, outputChars,
    words: state.words.map((word) => word.id === target.id ? { ...word, highWater } : word),
  };
}

export function skyfallStats(state: SkyfallState): { wpm: number; accuracy: number } {
  const nonnegative = (value: number): number => Number.isFinite(value) ? Math.max(0, value) : 0;
  const wpm = calculateNetWpm(nonnegative(state.outputChars), nonnegative(state.elapsedMs));
  return {
    wpm: Number.isFinite(wpm) ? wpm : 0,
    accuracy: calculateAccuracy(nonnegative(state.correctKeystrokes), nonnegative(state.incorrectKeystrokes)),
  };
}
