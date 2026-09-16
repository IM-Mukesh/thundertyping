/**
 * Deterministic RNG, so a run can be reproduced from a seed.
 *
 * This is what makes daily challenges possible: everyone who plays the daily
 * gets the same floors, the same relic offers and the same enemies, because
 * the seed is derived from the date rather than from `Math.random`. It is also
 * what makes a bug reproducible -- a run is fully described by its seed plus
 * the player's keystrokes.
 *
 * Algorithm is mulberry32: 32-bit state, one multiply-shift round, passes the
 * usual smallcrush-level checks and is a handful of operations. Quality beyond
 * that buys nothing here; nobody is doing cryptography with loot tables.
 */

export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max], inclusive both ends. */
  int(min: number, max: number): number;
  /** Float in [min, max). */
  range(min: number, max: number): number;
  /** True with the given probability. */
  chance(p: number): boolean;
  /** Uniform pick. Throws on an empty array rather than returning undefined. */
  pick<T>(items: readonly T[]): T;
  /** Weighted pick; weights need not sum to 1. */
  weighted<T>(items: readonly T[], weight: (item: T) => number): T;
  /** A new shuffled copy, Fisher-Yates. Does not mutate the input. */
  shuffle<T>(items: readonly T[]): T[];
  /** n distinct items, or all of them when n exceeds the list. */
  sample<T>(items: readonly T[], n: number): T[];
  /** A child generator, so a subsystem cannot disturb the parent's sequence. */
  fork(label: string): Rng;
}

export function hashSeed(seed: string): number {
  // FNV-1a, 32-bit.
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function createRng(seed: string | number): Rng {
  let state = (typeof seed === "string" ? hashSeed(seed) : seed >>> 0) || 1;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const rng: Rng = {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    range: (min, max) => next() * (max - min) + min,
    chance: (p) => next() < p,

    pick(items) {
      if (items.length === 0) throw new Error("pick() on an empty list");
      return items[Math.floor(next() * items.length)];
    },

    weighted(items, weight) {
      if (items.length === 0) throw new Error("weighted() on an empty list");
      let total = 0;
      for (const it of items) total += Math.max(0, weight(it));
      if (total <= 0) return rng.pick(items);
      let roll = next() * total;
      for (const it of items) {
        roll -= Math.max(0, weight(it));
        if (roll <= 0) return it;
      }
      return items[items.length - 1];
    },

    shuffle(items) {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },

    sample(items, n) {
      return rng.shuffle(items).slice(0, Math.max(0, Math.min(n, items.length)));
    },

    // Derived from the label and the current state, so forking twice with the
    // same label at the same point gives the same child -- but advancing the
    // parent first gives a different one.
    fork(label) {
      return createRng(hashSeed(label) ^ (state >>> 0));
    },
  };

  return rng;
}

/**
 * The daily seed, as a UTC date string.
 *
 * UTC deliberately, not local time: a daily challenge that rolls over at
 * different moments per timezone cannot have a shared leaderboard, and players
 * on the boundary would see yesterday's puzzle as today's.
 */
export function dailySeed(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Seed for one game's daily, e.g. "2026-09-16:spellbound". */
export function dailySeedFor(gameId: string, date = new Date()): string {
  return `${dailySeed(date)}:${gameId}`;
}

/** Milliseconds until the next daily rolls over, for a countdown display. */
export function msUntilNextDaily(now = new Date()): number {
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}
