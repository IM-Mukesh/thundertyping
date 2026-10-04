import { useCallback, useEffect, useReducer, useRef } from "react";
import { generateWords } from "@/lib/typing-engine/word-generator";
import type { GameDefinition, GameStatus } from "@/lib/games/game-types";
import { ENGLISH_WORDS } from "@/data/words/english-1k";
import { advanceLaneTargets, availableWord } from "@/lib/games/arcade-layout";

// Word Blaster gets its own engine rather than another entry in
// `use-falling-words.ts`'s tuning table, because the mechanic really is
// different rather than differently tuned: threat is horizontal distance to a
// single defended wall (not height), lanes behave as queues that words stack up
// in (not as independent columns), a target has a firing solution the UI draws a
// tracer along, and a kill has to report *where* it happened so the hit effect
// can be drawn there. Per the games architecture note, tune-don't-fork applies
// to variants of "words descend, you type them" — this isn't one.
//
// All the pacing/scoring knobs live in this file. game-types.ts holds only the
// contract every game shares (name, rules, lives, how the score is formatted).

export type EnemyType = "standard" | "swarmer" | "tank" | "emp";

export interface Enemy {
  id: number;
  text: string;
  /** 0 = just entered at the right edge, 1 = reached the base wall. */
  progress: number;
  /** Milliseconds this particular enemy takes to cross, fixed at spawn. */
  travelMs: number;
  /** Vertical lane index, so enemies don't overlap each other. */
  lane: number;
  type?: EnemyType;
  /** Shield hits remaining for tank archetype */
  shieldHp?: number;
}

/**
 * A kill worth drawing a tracer and an explosion for. The engine reports the
 * firing solution (which lane, how far across the field) rather than pixels or
 * percentages, so layout stays entirely the component's business.
 *
 * These live in engine state, expiring on the tick, rather than in component
 * state driven by AnimatePresence — which has been observed in this project
 * failing to unmount rapidly re-keyed children and leaking DOM nodes. Kills can
 * land several times a second, so this is exactly that failure case. Ageing
 * them off the same interval that moves the enemies means the list is
 * structurally bounded, cleans itself up with no extra timers to leak, and
 * freezes with the game when it pauses.
 */
export interface HitEffect {
  seq: number;
  lane: number;
  progress: number;
  /** `elapsedMs` at the moment of the kill, so the UI can age the effect. */
  bornMs: number;
  /** The real score this kill awarded, for a damage-number popup that shows
   *  an actual value rather than a decorative placeholder. */
  points: number;
}

/**
 * A boss encounter. Deliberately not modeled as an `Enemy` — a boss has no
 * lane or travel progress, it has to be typed down over several words rather
 * than one, and it suspends normal spawning rather than joining it. Giving it
 * its own shape keeps both reducer branches simple instead of bending `Enemy`
 * into a union of two unrelated things.
 */
export interface Boss {
  hp: number;
  maxHp: number;
  word: string;
  /** `elapsedMs` by which the current word must be finished, or the boss
   *  escapes. Reset on every landed word, not just once at spawn, so a player
   *  who keeps landing hits is never punished for a long encounter — only
   *  stalling on one word costs anything. */
  deadlineMs: number;
}

export interface WordBlasterState {
  status: GameStatus;
  definition: GameDefinition;
  enemies: Enemy[];
  /** What the player has typed toward the currently locked enemy or boss. */
  typed: string;
  /** The enemy the current keystrokes are committed to, once one matches. */
  lockedId: number | null;
  boss: Boss | null;
  /** Lifetime boss kills, tracked separately from `destroyed` (which a boss
   *  kill also increments once, as one significant kill) so the result
   *  screen can call out "2 bosses defeated" without recomputing it. */
  bossesDefeated: number;
  /** The `destroyed` count at which the next boss spawns. */
  nextBossAt: number;
  /** `elapsedMs` of the most recent boss kill, for a victory flash. */
  lastBossDefeatMs: number | null;
  /** `elapsedMs` of the most recent boss escape, for a warning flash. */
  lastBossEscapeMs: number | null;
  /** `elapsedMs` of the most recently landed boss word, for a damage-number
   *  popup — fires on every hit, not just the killing one. */
  lastBossHitMs: number | null;
  /** The real score that hit awarded, shown by the same popup. */
  lastBossHitPoints: number;
  lives: number;
  score: number;
  destroyed: number;
  breached: number;
  combo: number;
  bestCombo: number;
  correctKeystrokes: number;
  incorrectKeystrokes: number;
  elapsedMs: number;
  hits: HitEffect[];
  /** `elapsedMs` of the most recent breach, for the base's damage flash. */
  lastBreachMs: number | null;
}

// ---------------------------------------------------------------------------
// Tuning
// ---------------------------------------------------------------------------

/**
 * The loop is a plain `setInterval` state tick, deliberately not
 * `requestAnimationFrame`: rAF is throttled to nothing in a hidden tab (and in
 * a preview pane that isn't displayed), which would both freeze the run in a
 * way pausing can't reason about and break every visual driven off it. Enemies
 * advance by a fixed fraction per tick instead of by comparing timestamps, so
 * pausing is just "stop ticking" with no timestamps to rebase afterwards.
 *
 * 20 updates a second is far below frame rate; the UI transitions `left` over
 * exactly this interval so the stepped positions read as continuous motion.
 */
export const TICK_MS = 50;

/** Vertical lanes enemies fly down. Five keeps the board readable at 400px. */
export const LANE_COUNT = 5;

/** Milliseconds between spawns at the start, and the floor the ramp reaches. */
const INITIAL_SPAWN_MS = 1600;
const MIN_SPAWN_MS = 560;
/** Shaved off the spawn gap per kill — reaches the floor at ~43 kills. */
const SPAWN_RAMP_PER_KILL = 24;

/** Milliseconds an enemy takes to cross at the start, and the ramp's floor. */
const INITIAL_TRAVEL_MS = 8200;
const MIN_TRAVEL_MS = 3300;
/** Shaved off travel time per kill — reaches the floor at ~79 kills. */
const TRAVEL_RAMP_PER_KILL = 62;

/** Cap so a burst of spawns can never make the board unreadable. */
const MAX_ACTIVE_ENEMIES = 6;

/**
 * How long a hit effect stays in state — a whole number of ticks, so it expires
 * exactly when the UI's matching CSS animation ends. The cap is what bounds the
 * effect DOM node count no matter how fast kills land.
 */
export const HIT_EFFECT_MS = 400;
const MAX_HIT_EFFECTS = 6;

/**
 * A lane won't take a new enemy while its rearmost one is still this close to
 * the right edge — otherwise two words spawn on top of each other and the pair
 * is unreadable for the second or so it takes them to separate.
 */
const LANE_CLEARANCE = 0.2;

/** 10 steps of +0.1 = 2x, the cap. */
const MAX_COMBO_STEPS = 10;
const POINTS_PER_CHAR = 10;

// ---------------------------------------------------------------------------
// Boss tuning
// ---------------------------------------------------------------------------

/** A boss spawns after this many total kills, then again every this many. */
const BOSS_EVERY_KILLS = 12;
/** Words the boss takes to bring down. */
const BOSS_HP_HITS = 4;
/** Time allowed per boss word before it escapes. Generous on purpose — the
 *  words are also longer, and the tension should come from their length, not
 *  a hidden clock the player can't see coming. */
export const BOSS_TIME_PER_WORD_MS = 6000;
/** Flat score awarded on top of the word's own points for landing the kill. */
const BOSS_DEFEAT_BONUS = 500;
/** Sampled and the longest kept, since the shared word list has no length
 *  metadata to filter on directly. */
const BOSS_WORD_SAMPLES = 6;

/**
 * Escalates within one encounter: `hitsLanded` is 0 for the boss's first
 * word and climbs toward `maxHp - 1` for its last, so the finishing word is
 * reliably harder than the opener.
 */
function pickBossWord(hitsLanded: number): string {
  const candidates = generateWords(BOSS_WORD_SAMPLES, { punctuation: false, numbers: false });
  const minLength = 4 + hitsLanded;
  const longEnough = candidates.filter((w) => w.length >= minLength);
  const pool = longEnough.length > 0 ? longEnough : candidates;
  return pool.reduce((a, b) => (b.length > a.length ? b : a));
}

/** Difficulty ramps with kills, so it tracks skill rather than the clock. */
function currentSpawnMs(state: WordBlasterState): number {
  return Math.max(MIN_SPAWN_MS, INITIAL_SPAWN_MS - state.destroyed * SPAWN_RAMP_PER_KILL);
}

function currentTravelMs(state: WordBlasterState): number {
  return Math.max(MIN_TRAVEL_MS, INITIAL_TRAVEL_MS - state.destroyed * TRAVEL_RAMP_PER_KILL);
}

/**
 * Caps at 2x. High enough that a clean run is worth chasing, low enough that
 * the first twenty kills still count toward the final total.
 */
function comboMultiplier(combo: number): number {
  return 1 + Math.min(combo, MAX_COMBO_STEPS) * 0.1;
}

function scoreForKill(text: string, combo: number): number {
  return Math.round(text.length * POINTS_PER_CHAR * comboMultiplier(combo));
}

function pickEnemyType(destroyed: number): EnemyType {
  const r = Math.random();
  if (destroyed >= 12 && r < 0.16) return "emp";
  if (destroyed >= 6 && r < 0.38) return "tank";
  if (destroyed >= 2 && r < 0.65) return "swarmer";
  return "standard";
}

function pickTankCoreWord(enemies: Enemy[]): string {
  const candidates = generateWords(4, { punctuation: false, numbers: false });
  const used = new Set(enemies.map((enemy) => enemy.text));
  return availableWord(candidates.sort((a, b) => b.length - a.length), used)
    ?? availableWord(ENGLISH_WORDS, used)!;
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type GameAction =
  | { type: "START" }
  | { type: "RESET" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "TICK" }
  | { type: "SPAWN"; text: string; lane: number }
  | { type: "SET_TYPED"; value: string };

export function createInitialState(definition: GameDefinition): WordBlasterState {
  return {
    status: "idle",
    definition,
    enemies: [],
    typed: "",
    lockedId: null,
    boss: null,
    bossesDefeated: 0,
    nextBossAt: BOSS_EVERY_KILLS,
    lastBossDefeatMs: null,
    lastBossEscapeMs: null,
    lastBossHitMs: null,
    lastBossHitPoints: 0,
    lives: definition.lives,
    score: 0,
    destroyed: 0,
    breached: 0,
    combo: 0,
    bestCombo: 0,
    correctKeystrokes: 0,
    incorrectKeystrokes: 0,
    elapsedMs: 0,
    hits: [],
    lastBreachMs: null,
  };
}

/** Drops hit effects the tick has aged out. Identity is preserved when nothing
 *  expired, so a quiet board doesn't churn a new array every 50ms. */
function expireHits(hits: HitEffect[], elapsedMs: number): HitEffect[] {
  if (hits.length === 0) return hits;
  const live = hits.filter((hit) => elapsedMs - hit.bornMs < HIT_EFFECT_MS);
  return live.length === hits.length ? hits : live;
}

/**
 * Picks which enemy the next keystrokes belong to. Once one is locked it stays
 * locked even if another would also match the prefix — otherwise the turret
 * would visibly swing mid-word. With nothing locked the enemy closest to the
 * base wins: it's the one about to cost a life, so it's almost always the one
 * the player meant.
 */
function findTarget(enemies: Enemy[], value: string, lockedId: number | null): Enemy | null {
  if (lockedId !== null) {
    const locked = enemies.find((e) => e.id === lockedId);
    if (locked && locked.text.startsWith(value)) return locked;
  }
  const matches = enemies.filter((e) => e.text.startsWith(value));
  if (matches.length === 0) return null;
  // Prefer an exact match over "closest to the wall" -- otherwise typing a
  // word perfectly (e.g. "a") could still target a different, longer enemy
  // that merely shares the prefix and is further along (e.g. "are"),
  // leaving the correctly-typed one un-destroyed. Only reached when there's
  // no active lock on a still-matching enemy (see above).
  const exact = matches.find((e) => e.text === value);
  if (exact) return exact;
  return matches.reduce((a, b) => (b.progress > a.progress ? b : a));
}

let nextEnemyId = 0;
/** React key for a hit effect — stable for the effect's whole short life. */
let nextHitSeq = 0;

export function reducer(state: WordBlasterState, action: GameAction): WordBlasterState {
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
      if (state.enemies.length >= MAX_ACTIVE_ENEMIES) return state;
      const type = pickEnemyType(state.destroyed);
      const baseTravel = currentTravelMs(state);
      const travelMs =
        type === "swarmer"
          ? Math.round(baseTravel * 0.65)
          : type === "tank"
            ? Math.round(baseTravel * 1.35)
            : baseTravel;
      const enemy: Enemy = {
        id: nextEnemyId++,
        text: action.text,
        progress: 0,
        travelMs,
        lane: action.lane,
        type,
        shieldHp: type === "tank" ? 2 : 1,
      };
      return { ...state, enemies: [...state.enemies, enemy] };
    }

    case "TICK": {
      if (state.status !== "running") return state;

      const elapsedMs = state.elapsedMs + TICK_MS;

      // A boss in progress owns the tick: lane enemies don't advance (the
      // board was cleared when it spawned) and no new one spawns (the hook's
      // spawn timer checks `boss` before dispatching SPAWN) — the encounter
      // is the only thing happening until it resolves one way or the other.
      if (state.boss) {
        if (elapsedMs < state.boss.deadlineMs) {
          return { ...state, elapsedMs, hits: expireHits(state.hits, elapsedMs) };
        }
        // Escaped: costs a life, same as a breach, but doesn't touch
        // `breached` — that count means "a lane enemy got through," which
        // this isn't.
        const lives = Math.max(0, state.lives - 1);
        return {
          ...state,
          elapsedMs,
          hits: expireHits(state.hits, elapsedMs),
          boss: null,
          lives,
          combo: 0,
          typed: "",
          lockedId: null,
          lastBossEscapeMs: elapsedMs,
          nextBossAt: state.destroyed + BOSS_EVERY_KILLS,
          status: lives === 0 ? "over" : state.status,
        };
      }

      if (state.destroyed > 0 && state.destroyed >= state.nextBossAt) {
        return {
          ...state,
          elapsedMs,
          hits: expireHits(state.hits, elapsedMs),
          enemies: [],
          typed: "",
          lockedId: null,
          boss: {
            hp: BOSS_HP_HITS,
            maxHp: BOSS_HP_HITS,
            word: pickBossWord(0),
            deadlineMs: elapsedMs + BOSS_TIME_PER_WORD_MS,
          },
        };
      }

      const survivors: Enemy[] = [];
      let breaches = 0;
      for (const enemy of advanceLaneTargets(state.enemies, (enemy) => enemy.progress + TICK_MS / enemy.travelMs, LANE_CLEARANCE)) {
        const progress = enemy.progress;
        if (progress >= 1) breaches += 1;
        else survivors.push({ ...enemy, progress });
      }

      const hits = expireHits(state.hits, elapsedMs);
      if (breaches === 0) return { ...state, enemies: survivors, elapsedMs, hits };

      const lives = Math.max(0, state.lives - breaches);
      // A breaching enemy may have been the one being typed — drop the lock so
      // the next keystroke re-targets instead of matching a gone enemy.
      const lockedStillAlive = survivors.some((e) => e.id === state.lockedId);
      return {
        ...state,
        enemies: survivors,
        elapsedMs,
        hits,
        lives,
        breached: state.breached + breaches,
        combo: 0,
        typed: lockedStillAlive ? state.typed : "",
        lockedId: lockedStillAlive ? state.lockedId : null,
        lastBreachMs: elapsedMs,
        status: lives === 0 ? "over" : state.status,
      };
    }

    case "SET_TYPED": {
      if (state.status !== "running") return state;
      const rawValue = action.value;
      const value = rawValue.trim().toLowerCase();

      if (rawValue.length < state.typed.length) {
        // Backspace: allowed, and deliberately not counted as a mistake.
        // Emptying the buffer releases the lock, which is the only way out of a
        // target you committed to by mistake.
        return { ...state, typed: value, lockedId: value === "" ? null : state.lockedId };
      }
      if (value === state.typed && rawValue.length <= state.typed.length) return state;
      const added = Math.max(1, rawValue.length - state.typed.length);

      if (state.boss) {
        const boss = state.boss;
        if (!boss.word.startsWith(value)) {
          return {
            ...state,
            incorrectKeystrokes: state.incorrectKeystrokes + added,
            combo: 0,
          };
        }

        const correctKeystrokes = state.correctKeystrokes + added;
        if (value !== boss.word) {
          return { ...state, typed: value, correctKeystrokes };
        }

        const combo = state.combo + 1;
        const scoreGain = scoreForKill(boss.word, state.combo);
        const hp = boss.hp - 1;

        if (hp <= 0) {
          return {
            ...state,
            boss: null,
            typed: "",
            lockedId: null,
            destroyed: state.destroyed + 1,
            bossesDefeated: state.bossesDefeated + 1,
            nextBossAt: state.destroyed + 1 + BOSS_EVERY_KILLS,
            score: state.score + scoreGain + BOSS_DEFEAT_BONUS,
            combo,
            bestCombo: Math.max(state.bestCombo, combo),
            correctKeystrokes,
            lastBossDefeatMs: state.elapsedMs,
            lastBossHitMs: state.elapsedMs,
            lastBossHitPoints: scoreGain + BOSS_DEFEAT_BONUS,
          };
        }

        const hitsLanded = boss.maxHp - hp;
        return {
          ...state,
          boss: {
            ...boss,
            hp,
            word: pickBossWord(hitsLanded),
            // Reset, not extended — a fresh full window for the next word.
            deadlineMs: state.elapsedMs + BOSS_TIME_PER_WORD_MS,
          },
          typed: "",
          lockedId: null,
          score: state.score + scoreGain,
          combo,
          bestCombo: Math.max(state.bestCombo, combo),
          correctKeystrokes,
          lastBossHitMs: state.elapsedMs,
          lastBossHitPoints: scoreGain,
        };
      }

      const target = findTarget(state.enemies, value, state.lockedId);

      if (!target) {
        // Nothing on screen starts with this — reject the character outright
        // rather than letting the buffer drift into an unmatchable string.
        return {
          ...state,
          incorrectKeystrokes: state.incorrectKeystrokes + added,
          combo: 0,
        };
      }

      const correctKeystrokes = state.correctKeystrokes + added;

      if (target.text === value) {
        // Tank archetype: first word cracks the armor shield, second word eliminates the hull
        if (target.type === "tank" && target.shieldHp && target.shieldHp > 1) {
          const combo = state.combo + 1;
          const shieldPoints = 60;
          const secondWord = pickTankCoreWord(state.enemies);
          const updatedEnemies = state.enemies.map((e) =>
            e.id === target.id
              ? { ...e, text: secondWord, shieldHp: 1 }
              : e
          );
          return {
            ...state,
            enemies: updatedEnemies,
            typed: "",
            lockedId: null,
            score: state.score + shieldPoints,
            combo,
            bestCombo: Math.max(state.bestCombo, combo),
            correctKeystrokes,
            hits: [
              ...state.hits,
              {
                seq: nextHitSeq++,
                lane: target.lane,
                progress: target.progress,
                bornMs: state.elapsedMs,
                points: shieldPoints,
              },
            ].slice(-MAX_HIT_EFFECTS),
          };
        }

        const combo = state.combo + 1;
        const points = scoreForKill(target.text, state.combo);
        let bonusPoints = 0;
        let empKills: Enemy[] = [];

        if (target.type === "emp") {
          // Detonate EMP shockwave across target lane, destroying any other enemies in that lane
          empKills = state.enemies.filter((e) => e.lane === target.lane && e.id !== target.id);
          bonusPoints = empKills.length * 100;
        }

        const destroyedEnemies = new Set([target.id, ...empKills.map((e) => e.id)]);
        const totalCleared = state.destroyed + destroyedEnemies.size;

        const newHits = [
          ...state.hits,
          {
            seq: nextHitSeq++,
            lane: target.lane,
            progress: target.progress,
            bornMs: state.elapsedMs,
            points,
          },
          ...empKills.map((e) => ({
            seq: nextHitSeq++,
            lane: e.lane,
            progress: e.progress,
            bornMs: state.elapsedMs,
            points: 100,
          })),
        ].slice(-MAX_HIT_EFFECTS);

        return {
          ...state,
          enemies: state.enemies.filter((e) => !destroyedEnemies.has(e.id)),
          typed: "",
          lockedId: null,
          destroyed: totalCleared,
          score: state.score + points + bonusPoints,
          combo,
          bestCombo: Math.max(state.bestCombo, combo),
          correctKeystrokes,
          hits: newHits,
        };
      }

      return { ...state, typed: value, lockedId: target.id, correctKeystrokes };
    }
  }
}

// ---------------------------------------------------------------------------
// Spawn placement
// ---------------------------------------------------------------------------

/**
 * Picks a lane with room at the right edge, or null if every lane is still
 * busy — skipping a spawn is better than stacking two words on one another.
 */
function pickLane(enemies: Enemy[]): number | null {
  const open: number[] = [];
  for (let lane = 0; lane < LANE_COUNT; lane++) {
    // The smallest progress in the lane is its rearmost enemy, i.e. the one
    // nearest the right edge — the only one a new spawn could collide with.
    let rearmost = 1;
    for (const enemy of enemies) {
      if (enemy.lane === lane && enemy.progress < rearmost) rearmost = enemy.progress;
    }
    if (rearmost >= LANE_CLEARANCE) open.push(lane);
  }
  if (open.length === 0) return null;
  return open[Math.floor(Math.random() * open.length)];
}

/**
 * Two identical words on screen are ambiguous to type against, so retry a few
 * times — then give up rather than loop forever on a ~360-word list.
 */
function pickText(enemies: Enemy[]): string | null {
  const active = new Set(enemies.map((e) => e.text));
  let text = generateWords(1, { punctuation: false, numbers: false })[0];
  for (let i = 0; i < 8 && active.has(text); i++) {
    text = generateWords(1, { punctuation: false, numbers: false })[0];
  }
  return active.has(text) ? null : text;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWordBlaster(definition: GameDefinition) {
  const [state, dispatch] = useReducer(reducer, definition, createInitialState);

  // Read by the spawn timer without making it a dependency, so a changing
  // difficulty mid-run doesn't tear down and restart the timer chain. Synced in
  // an effect rather than during render; this effect is declared first so it
  // lands before the timers below re-run, and the first spawn is a full
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
  // spawns shrinks as the run goes on, and re-reading it each time is what makes
  // the ramp continuous instead of stepped.
  useEffect(() => {
    if (state.status !== "running") return;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      timer = setTimeout(() => {
        const current = stateRef.current;
        if (
          current.status === "running" &&
          !current.boss &&
          current.enemies.length < MAX_ACTIVE_ENEMIES
        ) {
          const lane = pickLane(current.enemies);
          const text = lane === null ? null : pickText(current.enemies);
          if (lane !== null && text !== null) dispatch({ type: "SPAWN", text, lane });
        }
        schedule();
      }, currentSpawnMs(stateRef.current));
    };

    schedule();
    return () => clearTimeout(timer);
  }, [state.status]);

  // Pausing on tab-hide keeps a backgrounded run from silently losing every life
  // at once the moment the player comes back.
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
