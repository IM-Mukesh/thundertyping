/**
 * The cross-game player profile: XP, level, achievements, unlocks, stats.
 *
 * This is the layer that gives a reason to come back. A player who has unlocked
 * three characters and holds a nine-day streak returns; a player starting from
 * zero every visit does not.
 *
 * Storage goes through `storage.ts`, the same SSR-safe wrapper the settings and
 * results stores use, so a future server-backed profile swaps in behind this
 * interface without any game code changing.
 */

import {
  getStorageItem,
  setStorageItem,
} from "@/lib/persistence/storage";

const KEY = "thundertyping:profile:v1";
const CHANGE_EVENT = "thundertyping:profile-change";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  /** Hidden achievements are not listed until earned. */
  secret?: boolean;
}

export interface PlayerProfile {
  xp: number;
  /** Achievement id -> ISO date earned. */
  achievements: Record<string, string>;
  /** Unlock id (character, cosmetic, mode) -> ISO date. */
  unlocks: Record<string, string>;
  /** Per-game counters, e.g. { spellbound: { runs: 12, wins: 2 } }. */
  stats: Record<string, Record<string, number>>;
  /** Daily challenge completions, keyed by seed date. */
  dailies: Record<string, number>;
  streak: { count: number; lastDate: string };
}

const EMPTY: PlayerProfile = {
  xp: 0,
  achievements: {},
  unlocks: {},
  stats: {},
  dailies: {},
  streak: { count: 0, lastDate: "" },
};

/**
 * Levels get progressively more expensive, but never so steep that a player
 * stops seeing progress: level n needs 100 * n^1.35 cumulative XP, so early
 * levels arrive in a run or two and later ones in a session or two.
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level - 1, 1.35));
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp && level < 999) level++;
  return level;
}

export function levelProgress(xp: number): {
  level: number;
  into: number;
  needed: number;
  fraction: number;
} {
  const level = levelForXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const needed = Math.max(1, next - base);
  const into = xp - base;
  return { level, into, needed, fraction: Math.min(1, into / needed) };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Reads defensively. A profile that fails to parse, or that has been hand-edited
 * into a bad shape, must degrade to an empty profile rather than throwing on
 * every render -- corrupted local state is a normal condition, not an error.
 */
export function readProfile(): PlayerProfile {
  const raw = getStorageItem(KEY);
  if (!raw) return { ...EMPTY };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return { ...EMPTY };
    const streak = isRecord(parsed.streak) ? parsed.streak : {};
    return {
      xp: typeof parsed.xp === "number" && parsed.xp >= 0 ? parsed.xp : 0,
      achievements: isRecord(parsed.achievements)
        ? (parsed.achievements as Record<string, string>)
        : {},
      unlocks: isRecord(parsed.unlocks)
        ? (parsed.unlocks as Record<string, string>)
        : {},
      stats: isRecord(parsed.stats)
        ? (parsed.stats as Record<string, Record<string, number>>)
        : {},
      dailies: isRecord(parsed.dailies)
        ? (parsed.dailies as Record<string, number>)
        : {},
      streak: {
        count: typeof streak.count === "number" ? streak.count : 0,
        lastDate: typeof streak.lastDate === "string" ? streak.lastDate : "",
      },
    };
  } catch {
    return { ...EMPTY };
  }
}

function write(profile: PlayerProfile): void {
  setStorageItem(KEY, JSON.stringify(profile));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

/**
 * The stored profile as its raw string, for useSyncExternalStore.
 *
 * The snapshot a store returns must be referentially stable between changes.
 * `readProfile()` parses into a fresh object every call, so using it directly
 * as a snapshot re-renders forever. Callers take this string and parse it in a
 * useMemo instead -- the same shape the test-status store settled on after
 * exactly this bug.
 */
export function readProfileRaw(): string | null {
  return getStorageItem(KEY);
}

export function profileServerSnapshot(): string | null {
  return null;
}

export function subscribeProfile(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

export interface XpResult {
  xp: number;
  level: number;
  leveledUp: boolean;
  gained: number;
}

export function awardXp(amount: number): XpResult {
  const profile = readProfile();
  const before = levelForXp(profile.xp);
  profile.xp += Math.max(0, Math.round(amount));
  const after = levelForXp(profile.xp);
  write(profile);
  return {
    xp: profile.xp,
    level: after,
    leveledUp: after > before,
    gained: Math.max(0, Math.round(amount)),
  };
}

/** Returns true only the first time, so callers can fire a celebration once. */
export function grantAchievement(id: string): boolean {
  const profile = readProfile();
  if (profile.achievements[id]) return false;
  profile.achievements[id] = new Date().toISOString();
  write(profile);
  return true;
}

export function hasAchievement(id: string): boolean {
  return Boolean(readProfile().achievements[id]);
}

/** Returns true only the first time. */
export function grantUnlock(id: string): boolean {
  const profile = readProfile();
  if (profile.unlocks[id]) return false;
  profile.unlocks[id] = new Date().toISOString();
  write(profile);
  return true;
}

export function hasUnlock(id: string): boolean {
  return Boolean(readProfile().unlocks[id]);
}

export function bumpStat(gameId: string, stat: string, by = 1): number {
  const profile = readProfile();
  profile.stats[gameId] ??= {};
  profile.stats[gameId][stat] = (profile.stats[gameId][stat] ?? 0) + by;
  write(profile);
  return profile.stats[gameId][stat];
}

export function getStat(gameId: string, stat: string): number {
  return readProfile().stats[gameId]?.[stat] ?? 0;
}

/**
 * Record a finished daily and advance the streak.
 *
 * The streak only survives consecutive UTC days. Missing a day resets it to 1
 * rather than 0, because the run just played still counts -- resetting to zero
 * after a completed run reads as a bug to the player.
 */
export function recordDaily(dateKey: string, score: number): {
  streak: number;
  isBest: boolean;
} {
  const profile = readProfile();
  const previous = profile.dailies[dateKey];
  const isBest = previous === undefined || score > previous;
  if (isBest) profile.dailies[dateKey] = score;

  if (profile.streak.lastDate !== dateKey) {
    const yesterday = new Date(`${dateKey}T00:00:00Z`);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yKey = yesterday.toISOString().slice(0, 10);
    profile.streak.count =
      profile.streak.lastDate === yKey ? profile.streak.count + 1 : 1;
    profile.streak.lastDate = dateKey;
  }

  write(profile);
  return { streak: profile.streak.count, isBest };
}

/** Wipes the profile. Only ever called from an explicit settings action. */
export function resetProfile(): void {
  write({ ...EMPTY });
}
