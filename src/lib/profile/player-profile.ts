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
import { PLAYABLE_GAME_LIST } from "@/lib/games/game-types";
import { accountStorageKey, getAuthGeneration, getCurrentUserId, subscribeCurrentUser } from "@/lib/auth/current-user";
import { getGameBest } from "@/lib/games/game-scores";

// Storage key deliberately left unrenamed on the HeroTyping (formerly
// ThunderTyping) rebrand -- it's what every existing player's XP,
// achievements and unlocks are saved under, and renaming it would silently
// orphan that data. Only the in-memory change-event name below changed.
const KEY = "thundertyping:profile:v1";
const CHANGE_EVENT = "herotyping:profile-change";

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

function emptyProfile(): PlayerProfile {
  return { xp: 0, achievements: {}, unlocks: {}, stats: {}, dailies: {}, streak: { count: 0, lastDate: "" } };
}

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

function validProfile(p: Record<string, unknown>): boolean {
  const number = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= Number.MAX_SAFE_INTEGER;
  const key = (k: string) => k.length <= 100 && !["__proto__", "constructor", "prototype"].includes(k);
  const map = (v: unknown, check: (v: unknown) => boolean, limit = 1000): boolean =>
    isRecord(v) && Object.keys(v).length <= limit && Object.entries(v).every(([k, value]) => key(k) && check(value));
  const date = (v: unknown) => typeof v === "string" && v.length <= 30 && Number.isFinite(Date.parse(v));
  return number(p.xp) && map(p.achievements, date) && map(p.unlocks, date) &&
    map(p.stats, (v) => map(v, number, 100), 100) && map(p.dailies, number) &&
    isRecord(p.streak) && number(p.streak.count) && Number.isInteger(p.streak.count) &&
    (p.streak.lastDate === "" || (typeof p.streak.lastDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.streak.lastDate) && date(p.streak.lastDate)));
}

/**
 * Reads defensively. A profile that fails to parse, or that has been hand-edited
 * into a bad shape, must degrade to an empty profile rather than throwing on
 * every render -- corrupted local state is a normal condition, not an error.
 */
export function readProfile(): PlayerProfile {
  return parseProfile(getStorageItem(accountStorageKey(KEY)));
}

/**
 * Parse a stored profile string.
 *
 * Exported so a component holding a useSyncExternalStore snapshot can derive
 * from that exact string rather than re-reading storage. Deriving from the
 * snapshot is what makes the memo honest -- calling readProfile() inside a memo
 * keyed on the snapshot works only by coincidence, because the value it reads
 * is not the value it depends on.
 */
export function parseProfile(raw: string | null): PlayerProfile {
  if (!raw || raw.length > 256_000) return emptyProfile();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return emptyProfile();
    if (!validProfile(parsed)) return emptyProfile();
    const streak = parsed.streak as Record<string, unknown>;
    return {
      xp: typeof parsed.xp === "number" && Number.isFinite(parsed.xp) && parsed.xp >= 0 ? parsed.xp : 0,
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
        count: typeof streak.count === "number" && Number.isFinite(streak.count) && streak.count >= 0 ? streak.count : 0,
        lastDate: typeof streak.lastDate === "string" ? streak.lastDate : "",
      },
    };
  } catch {
    return emptyProfile();
  }
}

function write(profile: PlayerProfile): void {
  setStorageItem(accountStorageKey(KEY), JSON.stringify(profile));
  if (typeof window !== "undefined") {
    queueMicrotask(() => {
      window.dispatchEvent(new Event(CHANGE_EVENT));
    });
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
  if (!getCurrentUserId()) return getStorageItem(KEY);
  return JSON.stringify({ ...readProfile(), xp: cloudXp, achievements: Object.fromEntries([...cloudAchievements].map((id) => [id, "1970-01-01T00:00:00.000Z"])) });
}

export function profileServerSnapshot(): string | null {
  return null;
}

export function subscribeProfile(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

// Signed-in players are cloud-only for XP and achievements: these mirrors are
// in-memory only, primed from the server on sign-in and dropped on sign-out,
// so a different account signing in later on the same browser can never
// inherit another player's XP or achievements from localStorage. Guests are
// unaffected (real localStorage via readProfile()/write() below).
let cloudXp = 0;
const cloudAchievements = new Set<string>();

/** Called by AuthProvider right after sign-in, with the server's current total. */
export function primeCloudXp(totalXp: number): void {
  cloudXp = totalXp;
  if (typeof window !== "undefined") {
    queueMicrotask(() => window.dispatchEvent(new Event(CHANGE_EVENT)));
  }
}

/** Called by AuthProvider right after sign-in. Fire-and-forget. */
export function primeCloudAchievements(): Promise<void> {
  const userId = getCurrentUserId();
  const generation = getAuthGeneration();
  if (!userId) return Promise.resolve();
  return fetch("/api/profile/achievements")
    .then((res) => res.json())
    .then((json) => {
      if (generation === getAuthGeneration() && userId === getCurrentUserId() && json?.success && Array.isArray(json.data)) {
        cloudAchievements.clear();
        for (const id of json.data as string[]) cloudAchievements.add(id);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(CHANGE_EVENT));
        }
      }
    })
    .catch((err) => console.warn("[profile] failed to load cloud achievements:", err));
}

/** Called by AuthProvider on sign-out. */
export function clearCloudProfile(): void {
  cloudXp = 0;
  cloudAchievements.clear();
  pendingAchievements.clear();
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}

subscribeCurrentUser(clearCloudProfile);
const pendingAchievements = new Set<string>();

/** Cloud-aware count of earned game achievements, for display. */
export function getEarnedAchievementCount(): number {
  if (getCurrentUserId()) return cloudAchievements.size;
  return Object.keys(readProfile().achievements).length;
}

export interface XpResult {
  xp: number;
  level: number;
  leveledUp: boolean;
  gained: number;
}

export function awardXp(amount: number): XpResult {
  const gained = Math.max(0, Math.round(amount));
  const userId = getCurrentUserId();

  if (userId) {
    const before = levelForXp(cloudXp);
    cloudXp += gained;
    const after = levelForXp(cloudXp);
    if (typeof window !== "undefined") {
      queueMicrotask(() => window.dispatchEvent(new Event(CHANGE_EVENT)));
    }
    return { xp: cloudXp, level: after, leveledUp: after > before, gained };
  }

  const profile = readProfile();
  const before = levelForXp(profile.xp);
  profile.xp += gained;
  const after = levelForXp(profile.xp);
  write(profile);
  return { xp: profile.xp, level: after, leveledUp: after > before, gained };
}

/** Returns true only the first time, so callers can fire a celebration once. */
export function grantAchievement(id: string): boolean {
  const userId = getCurrentUserId();
  if (userId) {
    if (cloudAchievements.has(id) || pendingAchievements.has(id)) return false;
    const generation = getAuthGeneration();
    pendingAchievements.add(id);
    fetch("/api/profile/achievements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ achievementId: id }),
    }).then(async (res) => {
      const json = await res.json();
      if (generation !== getAuthGeneration() || userId !== getCurrentUserId()) return;
      if (res.ok && json?.success) await primeCloudAchievements();
    }).catch((err) => console.warn("[profile] failed to grant cloud achievement:", err))
      .finally(() => { if (generation === getAuthGeneration()) pendingAchievements.delete(id); });
    // Synchronous callers must not celebrate an unconfirmed award.
    return false;
  }

  const profile = readProfile();
  if (profile.achievements[id]) return false;
  profile.achievements[id] = new Date().toISOString();
  write(profile);
  return true;
}

export function hasAchievement(id: string): boolean {
  if (getCurrentUserId()) return cloudAchievements.has(id);
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

/**
 * Grant the cross-game achievements.
 *
 * Kept here rather than in each game so a rule like "play every game" has one
 * definition instead of four partial ones, and so adding a game does not mean
 * remembering to update four call sites. Safe to call often: every grant is
 * already idempotent.
 *
 * Checks only currently playable (non-upcoming) games so upcoming releases like
 * Spellbound do not render the achievement impossible to earn.
 */
export function checkSiteAchievements(playableGameIds?: readonly string[]): string[] {
  const userId = getCurrentUserId();
  const profile = readProfile();
  const granted: string[] = [];

  const playableSet = new Set(PLAYABLE_GAME_LIST.map((g) => g.id as string));
  const targets =
    playableGameIds && playableGameIds.length > 0
      ? playableGameIds.filter((id) => playableSet.has(id))
      : PLAYABLE_GAME_LIST.map((g) => g.id);

  // Signed-in: "played" comes from the cloud game-bests cache, not this
  // browser's local stats, so the achievement reflects the account's actual
  // cloud history rather than whatever a different signed-in player (or a
  // guest session) last left in this browser's localStorage.
  const playedAll =
    targets.length > 0 &&
    targets.every((id) =>
      userId ? Boolean(getGameBest(id as Parameters<typeof getGameBest>[0])) : (profile.stats[id]?.runs ?? 0) > 0
    );
  if (playedAll && grantAchievement("site:all-games")) granted.push("site:all-games");

  const currentXp = userId ? cloudXp : profile.xp;
  if (levelForXp(currentXp) >= 10 && grantAchievement("site:level-10")) {
    granted.push("site:level-10");
  }
  // Day streak and daily-challenge completions are not cloud-tracked yet --
  // these two checks stay local-only for both guests and signed-in players.
  if (!userId && profile.streak.count >= 7 && grantAchievement("site:streak-7")) {
    granted.push("site:streak-7");
  }
  if (
    !userId && Object.keys(profile.dailies).length > 0 &&
    grantAchievement("site:daily")
  ) {
    granted.push("site:daily");
  }
  return granted;
}

/** Wipes the profile. Only ever called from an explicit settings action. */
export function resetProfile(): void {
  write(emptyProfile());
}
