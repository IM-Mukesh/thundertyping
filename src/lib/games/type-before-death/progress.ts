import { DEATH_LIMITS, DEATH_MISSIONS, DEATH_SURVIVOR_REGISTRY, DEATH_WEAPON_REGISTRY } from "@/lib/games/type-before-death/content";
import { deathRunStats } from "@/lib/games/type-before-death/engine";
import type { DeathProgress, DeathState, DeathSurvivorId, DeathWeaponId } from "@/lib/games/type-before-death/types";
import { accountStorageKey, getCurrentUserId } from "@/lib/auth/current-user";
import { getStorageItem, setStorageItem } from "@/lib/persistence/storage";

const MAX_PROGRESS_BYTES = 16_384;
const PROGRESS_KEY = "herotyping:type-before-death:v1";

const clampInt = (value: number, low: number, high: number): number =>
  Math.max(low, Math.min(high, Number.isSafeInteger(value) ? value : low));

export function freshDeathProgress(): DeathProgress {
  return {
    version: 1,
    completed: [],
    runs: 0,
    defeated: 0,
    bestScore: 0,
    bestWpm: 0,
    bestAccuracy: 0,
    missionBests: [],
    dailyBests: [],
    receipts: [],
    quality: "auto",
    reducedMotion: false,
    weapon: "pistol",
    survivor: "soldier",
  };
}

export const createDeathProgress = freshDeathProgress;

function normalizeProgress(value: Partial<DeathProgress>): DeathProgress {
  const completed = Array.isArray(value.completed)
    ? [...new Set(value.completed.filter((mission): mission is number => Number.isSafeInteger(mission) && mission >= 0 && mission < DEATH_MISSIONS.length))].sort((a, b) => a - b)
    : [];
  const missionBests = Array.isArray(value.missionBests)
    ? value.missionBests.slice(0, DEATH_MISSIONS.length).map((score) => clampInt(score, 0, DEATH_LIMITS.score))
    : [];
  const dailyBests = Array.isArray(value.dailyBests)
    ? value.dailyBests.filter((entry): entry is { day: string; score: number } =>
      Boolean(entry) && typeof entry.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(entry.day) && Number.isSafeInteger(entry.score) && entry.score >= 0,
    ).slice(0, DEATH_LIMITS.dailyBests).map((entry) => ({ day: entry.day, score: clampInt(entry.score, 0, DEATH_LIMITS.score) }))
    : [];
  const receipts = Array.isArray(value.receipts)
    ? value.receipts.filter((receipt): receipt is string => typeof receipt === "string" && receipt.length > 0 && receipt.length <= 256).slice(-DEATH_LIMITS.receipts)
    : [];
  const quality = value.quality === "low" || value.quality === "high" ? value.quality : "auto";
  const reducedMotion = typeof value.reducedMotion === "boolean" ? value.reducedMotion : false;
  const weapon: DeathWeaponId = typeof value.weapon === "string" && Object.hasOwn(DEATH_WEAPON_REGISTRY, value.weapon) ? value.weapon as DeathWeaponId : "pistol";
  const survivor: DeathSurvivorId = typeof value.survivor === "string" && Object.hasOwn(DEATH_SURVIVOR_REGISTRY, value.survivor) ? value.survivor as DeathSurvivorId : "soldier";
  return {
    version: 1,
    completed,
    runs: clampInt(value.runs ?? 0, 0, DEATH_LIMITS.counter),
    defeated: clampInt(value.defeated ?? 0, 0, DEATH_LIMITS.counter),
    bestScore: clampInt(value.bestScore ?? 0, 0, DEATH_LIMITS.score),
    bestWpm: Number.isFinite(value.bestWpm) ? Math.max(0, Math.min(DEATH_LIMITS.wpm, value.bestWpm!)) : 0,
    bestAccuracy: Number.isFinite(value.bestAccuracy) ? Math.max(0, Math.min(100, value.bestAccuracy!)) : 0,
    missionBests,
    dailyBests,
    receipts,
    quality,
    reducedMotion,
    weapon,
    survivor,
  };
}

/** Whole-record validation keeps malformed local/cloud payloads from unlocking missions. */
export function parseDeathProgress(raw: string | null): DeathProgress {
  const fallback = freshDeathProgress();
  if (typeof raw !== "string" || raw.length === 0 || raw.length > MAX_PROGRESS_BYTES) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fallback;
    const value = parsed as Partial<DeathProgress> & { version?: unknown };
    if (value.version !== 1) return fallback;
    if (!Array.isArray(value.completed) || !Array.isArray(value.missionBests) || !Array.isArray(value.dailyBests) || !Array.isArray(value.receipts)) return fallback;
    return normalizeProgress(value);
  } catch {
    return fallback;
  }
}

export function deathProgressKey(owner: string | null = getCurrentUserId()): string {
  void owner;
  return accountStorageKey(PROGRESS_KEY);
}

export function readDeathProgress(owner: string | null = getCurrentUserId()): DeathProgress {
  // `accountStorageKey` reads the current auth mirror deliberately. The owner
  // argument documents the controller's binding; callers must remount when it
  // changes so a previous account's progress is never rebound to this run.
  void owner;
  return parseDeathProgress(getStorageItem(deathProgressKey()));
}

export function saveDeathProgress(owner: string | null, progress: DeathProgress): boolean {
  void owner;
  const serialized = serializeDeathProgress(progress);
  try {
    setStorageItem(deathProgressKey(), serialized);
    return getStorageItem(deathProgressKey()) === serialized;
  } catch {
    return false;
  }
}

export function serializeDeathProgress(progress: DeathProgress): string {
  return JSON.stringify(normalizeProgress(progress));
}

export function unlockedDeathMission(progress: DeathProgress): number {
  let unlocked = 0;
  while (progress.completed.includes(unlocked) && unlocked < DEATH_MISSIONS.length - 1) unlocked += 1;
  return unlocked;
}

export const getUnlockedDeathMission = unlockedDeathMission;
export const getTypeBeforeDeathProgressMission = unlockedDeathMission;

export function isDeathMissionUnlocked(progress: DeathProgress, mission: number): boolean {
  return Number.isSafeInteger(mission) && mission >= 0 && mission <= unlockedDeathMission(progress);
}

function recordDailyBest(progress: DeathProgress, day: string, score: number): { day: string; score: number }[] {
  const existing = progress.dailyBests.filter((entry) => entry.day !== day);
  const previous = progress.dailyBests.find((entry) => entry.day === day);
  existing.push({ day, score: Math.max(previous?.score ?? 0, score) });
  return existing.sort((a, b) => b.day.localeCompare(a.day)).slice(0, DEATH_LIMITS.dailyBests);
}

/**
 * Apply a completed result exactly once. `before` is accepted for parity with
 * other game progress reducers and lets a controller call this at transition
 * time; the result receipt, rather than a replayed effect, is the idempotency
 * boundary.
 */
export function advanceDeathProgress(progress: DeathProgress, before: DeathState, after: DeathState): DeathProgress {
  void before;
  if (after.phase !== "results" || !after.outcome || after.outcome === "abandoned" || after.runId.length === 0) return normalizeProgress(progress);
  if (progress.receipts.includes(after.runId)) return normalizeProgress(progress);
  const stats = deathRunStats(after);
  const next = normalizeProgress(progress);
  next.receipts = [...next.receipts, after.runId].slice(-DEATH_LIMITS.receipts);
  next.runs = clampInt(next.runs + 1, 0, DEATH_LIMITS.counter);
  next.defeated = clampInt(next.defeated + stats.cleared, 0, DEATH_LIMITS.counter);
  next.bestScore = Math.max(next.bestScore, stats.score);
  next.bestWpm = Math.max(next.bestWpm, stats.wpm);
  next.bestAccuracy = Math.max(next.bestAccuracy, stats.accuracy);
  if (after.outcome === "victory" && after.mission >= 0 && after.mission < DEATH_MISSIONS.length && !next.completed.includes(after.mission)) {
    next.completed = [...next.completed, after.mission].sort((a, b) => a - b);
  }
  if (after.mission >= 0 && after.mission < DEATH_MISSIONS.length) {
    next.missionBests[after.mission] = Math.max(next.missionBests[after.mission] ?? 0, stats.score);
  }
  if (after.dailyDay) next.dailyBests = recordDailyBest(next, after.dailyDay, stats.score);
  return normalizeProgress(next);
}

export const recordDeathProgress = advanceDeathProgress;
export const updateDeathProgress = advanceDeathProgress;

export function progressForDeathRun(progress: DeathProgress, state: DeathState): DeathProgress {
  return advanceDeathProgress(progress, state, state);
}
