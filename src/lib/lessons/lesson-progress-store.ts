import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { LESSON_LIST, type LessonId } from "@/lib/lessons/lesson-types";
import { getCurrentUserId, subscribeCurrentUser, isAuthLoading } from "@/lib/auth/current-user";
import { primeCloudXp } from "@/lib/profile/player-profile";
import { mapCloudLessonRowToUnitProgress, type CloudLessonRowInput } from "@/lib/contracts/data-integrity";
import { normalizeLanguageCode } from "@/lib/i18n/config";

export type LearnerGoal =
  | "touch-typing"
  | "accuracy"
  | "speed-40"
  | "speed-60"
  | "speed-80"
  | "coding";

export const LEARNER_GOAL_CONFIGS: Record<LearnerGoal, { title: string; subtitle: string; targetWpm: number; targetAcc: number }> = {
  "touch-typing": { title: "Touch Typing Mastery", subtitle: "Form flawless muscle memory and touch typing habits", targetWpm: 35, targetAcc: 95 },
  accuracy: { title: "Precision First", subtitle: "Zero-tolerance for typos (aim for 98%+ accuracy)", targetWpm: 45, targetAcc: 98 },
  "speed-40": { title: "Fluency Builder (40 WPM)", subtitle: "Smooth conversational pace for everyday writing", targetWpm: 40, targetAcc: 94 },
  "speed-60": { title: "Professional Speed (60 WPM)", subtitle: "Fast, effortless typing for office and creative work", targetWpm: 60, targetAcc: 95 },
  "speed-80": { title: "Advanced Cadence (80+ WPM)", subtitle: "High-cadence flow with minimal finger latency", targetWpm: 80, targetAcc: 96 },
  coding: { title: "Developer & Code Syntax", subtitle: "Brackets, operators, symbols, and camelCase flow", targetWpm: 50, targetAcc: 96 },
};

export interface UnitProgress {
  completed: boolean;
  /** How many sub-lesson steps have been passed, 0..subLessonCount. Where "Resume" picks back up. */
  currentStep: number;
  /** Count of *passing* attempts only -- what avgAccuracy/avgWpm are averaged over. */
  passCount: number;
  avgAccuracy: number;
  avgWpm: number;
  totalTimeMs: number;
  completedAt: number;
  bestWpm?: number;
  bestAccuracy?: number;
  attemptsCount?: number;
  lastAttemptAt?: number;
  bestStars?: number;
  latestStars?: number;
}

export interface LessonTotals {
  typedChars: number;
  correctChars: number;
  incorrectChars: number;
  timeMs: number;
}

export interface RecordAttemptInput {
  step: number;
  totalSteps: number;
  accuracy: number;
  wpm: number;
  typedChars: number;
  correctChars: number;
  incorrectChars: number;
  elapsedMs: number;
  minAccuracy: number;
  stars?: number;
}

export type ProgressLifecycle =
  | "guest"
  | "auth-loading"
  | "account-loading"
  | "account-ready"
  | "syncing"
  | "sync-error"
  | "synced"
  | "idle"
  | "error";

export interface LessonProgressState {
  version: number;
  learnerGoal: LearnerGoal;
  units: Partial<Record<LessonId, UnitProgress>>;
  totals: LessonTotals;
  syncStatus?: ProgressLifecycle;
  lifecycleStatus?: ProgressLifecycle;
  lastSyncError?: string | null;
  guestImportAvailable?: { count: number; lessons: LessonId[] } | null;
  mergeGuestProgress?: () => Promise<void>;
  dismissGuestImport?: () => void;
  setLearnerGoal: (goal: LearnerGoal) => void;
  recordAttempt: (unitId: LessonId, input: RecordAttemptInput) => {
    passed: boolean;
    unitCompleted: boolean;
    savePromise?: Promise<{ success: boolean; idempotent?: boolean }>;
  };
  resetProgress: () => void;
  unlockUpToLesson: (targetLessonId: LessonId) => void;
  exportProgress: () => string;
  importProgress: (jsonString: string) => boolean;
  /** Authoritative cloud rows update local store without wiping unconfirmed local state. */
  replaceCloudUnits: (rows: Array<CloudLessonRowInput & { typed_chars?: number; correct_chars?: number; incorrect_chars?: number }>) => void;
  retryPendingOutbox: () => Promise<void>;
}

export const CURRENT_SCHEMA_VERSION = 2;
export const GUEST_STORAGE_KEY = "thundertyping-lesson-progress";
export const GUEST_ARCHIVE_KEY = "thundertyping-lesson-progress:archive";
export const OUTBOX_STORAGE_PREFIX = "herotyping-lesson-outbox";
export const MIGRATED_FLAG_PREFIX = "herotyping-guest-migrated";
export const DISMISSED_FLAG_PREFIX = "herotyping-guest-dismissed";

export interface LessonOutboxItem {
  runId: string;
  lessonId: LessonId;
  languageCode: string;
  completed: boolean;
  stars: number;
  wpm: number;
  accuracy: number;
  attemptCount: number;
  step: number;
  totalSteps: number;
  typedChars: number;
  correctChars: number;
  incorrectChars: number;
  elapsedMs: number;
  createdAt: number;
  retryCount: number;
  userId: string;
}

function getLocalStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage as unknown as Storage;
  }
  return null;
}

function getPathSegment(): string {
  if (typeof window !== "undefined" && window.location && typeof window.location.pathname === "string") {
    return window.location.pathname.split("/")[1] || "en";
  }
  return "en";
}

export function getAccountStorageKey(userId?: string | null): string {
  const current = userId !== undefined ? userId : getCurrentUserId();
  return current ? `${GUEST_STORAGE_KEY}:account:${current}` : GUEST_STORAGE_KEY;
}

export function getLessonOutbox(userId: string): LessonOutboxItem[] {
  const storage = getLocalStorage();
  if (!storage || !userId) return [];
  try {
    const raw = storage.getItem(`${OUTBOX_STORAGE_PREFIX}:${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LessonOutboxItem[]) : [];
  } catch {
    return [];
  }
}

export function enqueueLessonOutbox(userId: string, item: LessonOutboxItem): void {
  const storage = getLocalStorage();
  if (!storage || !userId) return;
  try {
    const queue = getLessonOutbox(userId);
    const filtered = queue.filter((i) => i.runId !== item.runId);
    filtered.push(item);
    const bounded = filtered.slice(-50);
    storage.setItem(`${OUTBOX_STORAGE_PREFIX}:${userId}`, JSON.stringify(bounded));
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

export function dequeueLessonOutbox(userId: string, runId: string): void {
  const storage = getLocalStorage();
  if (!storage || !userId) return;
  try {
    const queue = getLessonOutbox(userId);
    const filtered = queue.filter((i) => i.runId !== runId);
    if (filtered.length === 0) {
      storage.removeItem(`${OUTBOX_STORAGE_PREFIX}:${userId}`);
    } else {
      storage.setItem(`${OUTBOX_STORAGE_PREFIX}:${userId}`, JSON.stringify(filtered));
    }
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

export function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64; // version 4
    bytes[8] = (bytes[8] & 63) | 128; // variant RFC4122
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function sendLessonOutboxItem(
  item: LessonOutboxItem
): Promise<{ success: boolean; idempotent?: boolean }> {
  try {
    const res = await fetch("/api/lessons/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        runId: item.runId,
        lessonId: item.lessonId,
        languageCode: item.languageCode,
        completed: item.completed,
        stars: item.stars,
        wpm: item.wpm,
        accuracy: item.accuracy,
        attemptCount: item.attemptCount,
        step: item.step,
        totalSteps: item.totalSteps,
        typedChars: item.typedChars,
        correctChars: item.correctChars,
        incorrectChars: item.incorrectChars,
        elapsedMs: item.elapsedMs,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      dequeueLessonOutbox(item.userId, item.runId);
      if (json?.success && json.data?.totalXp !== undefined) {
        primeCloudXp(json.data.totalXp);
      }
      return { success: true, idempotent: json?.data?.idempotent };
    }

    if (res.status === 409) {
      // Conflict: run ID already recorded on server (idempotent replay)
      dequeueLessonOutbox(item.userId, item.runId);
      return { success: true, idempotent: true };
    }

    if (res.status >= 400 && res.status < 500 && res.status !== 429) {
      // Permanent client validation error (e.g. 400, 403) - dequeue to avoid poison pill
      console.warn(`[lessons] Cloud save permanently rejected with status ${res.status}`);
      dequeueLessonOutbox(item.userId, item.runId);
      return { success: false };
    }

    // 429 or 5xx: transient error; leave in outbox for subsequent retry
    return { success: false };
  } catch (err) {
    // Network failure or offline: item remains in outbox for automatic retry
    console.warn("[lessons] Cloud save network failure, remaining in outbox:", err);
    return { success: false };
  }
}

let flushInFlight: Promise<void> | null = null;

export async function flushLessonOutbox(userId: string): Promise<void> {
  const storage = getLocalStorage();
  if (!storage || !userId) return;

  while (flushInFlight) {
    await flushInFlight;
  }

  const items = getLessonOutbox(userId);
  if (items.length === 0) return;

  flushInFlight = (async () => {
    try {
      const pending = getLessonOutbox(userId);
      for (const item of pending) {
        if (userId !== getCurrentUserId()) break;
        await sendLessonOutboxItem(item);
      }
    } finally {
      flushInFlight = null;
    }
  })();

  return flushInFlight;
}

function saveCurrentStoreSnapshot(
  units: LessonProgressState["units"],
  totals: LessonTotals,
  learnerGoal: LearnerGoal
): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    const key = getAccountStorageKey();
    const payload = JSON.stringify({
      state: {
        version: CURRENT_SCHEMA_VERSION,
        learnerGoal,
        units,
        totals,
      },
      version: CURRENT_SCHEMA_VERSION,
    });
    storage.setItem(key, payload);
  } catch {
    // Ignore storage quota / private browsing errors
  }
}

export function getGuestStoredUnits(): LessonProgressState["units"] | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const data = parsed?.state ?? parsed;
    if (data && typeof data.units === "object" && data.units !== null) {
      return sanitizeUnits(data.units);
    }
    return null;
  } catch {
    return null;
  }
}

export function archiveAndClearGuestProgress(guestUnits: LessonProgressState["units"]): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(
      GUEST_ARCHIVE_KEY,
      JSON.stringify({
        archivedAt: Date.now(),
        units: guestUnits,
      })
    );
    storage.removeItem(GUEST_STORAGE_KEY);
  } catch {
    // Ignore storage quota / private browsing errors
  }
}

export async function transferGuestUnitsToAccount(
  userId: string,
  guestUnits: LessonProgressState["units"],
  cloudUnitsTarget?: LessonProgressState["units"]
): Promise<number> {
  const syncPromises: Promise<{ success: boolean; idempotent?: boolean }>[] = [];

  for (const [id, guestUnit] of Object.entries(guestUnits)) {
    if (!guestUnit) continue;
    const lessonId = id as LessonId;

    if (guestUnit.completed || guestUnit.currentStep > 0 || guestUnit.passCount > 0) {
      if (cloudUnitsTarget) {
        cloudUnitsTarget[lessonId] = { ...guestUnit };
      }

      const lesson = LESSON_LIST.find((l) => l.id === lessonId);
      const totalSteps = lesson?.subLessonCount || 1;
      const runId = generateUuid();
      const outboxItem: LessonOutboxItem = {
        runId,
        lessonId,
        languageCode: "en",
        completed: guestUnit.completed,
        stars: guestUnit.bestStars ?? (guestUnit.completed ? 3 : 1),
        wpm: Math.round(guestUnit.bestWpm || guestUnit.avgWpm || 30),
        accuracy: Math.round(guestUnit.bestAccuracy || guestUnit.avgAccuracy || 90),
        attemptCount: Math.max(1, guestUnit.attemptsCount || 1),
        step: Math.min(totalSteps, Math.max(1, guestUnit.currentStep || (guestUnit.completed ? totalSteps : 1))),
        totalSteps,
        typedChars: Math.max(10, Math.round(guestUnit.avgWpm || 30) * 5),
        correctChars: Math.max(9, Math.round(((guestUnit.avgWpm || 30) * 5 * (guestUnit.avgAccuracy || 90)) / 100)),
        incorrectChars: Math.max(0, Math.round(((guestUnit.avgWpm || 30) * 5 * (100 - (guestUnit.avgAccuracy || 90))) / 100)),
        elapsedMs: Math.max(1000, Math.round(guestUnit.totalTimeMs || 15000)),
        createdAt: Date.now(),
        retryCount: 0,
        userId,
      };

      enqueueLessonOutbox(userId, outboxItem);
      syncPromises.push(sendLessonOutboxItem(outboxItem));
    }
  }

  if (syncPromises.length === 0) return 0;
  const results = await Promise.all(syncPromises);
  const allSucceeded = results.every((r) => r.success);
  return allSucceeded ? results.length : 0;
}

export async function reconcileLocalProgressWithCloud(
  userId: string,
  cloudRows: Array<CloudLessonRowInput>,
  localUnits: LessonProgressState["units"],
  cloudUnitsTarget?: LessonProgressState["units"]
): Promise<void> {
  const storage = getLocalStorage();
  if (!storage || !userId) return;

  // Cloud rows are authoritative. If cloud has zero records (e.g. past server error or empty account),
  // safely recover any unsynced local progress ahead of cloud into outbox.
  if (cloudRows.length === 0) {
    const existingOutbox = getLessonOutbox(userId);
    const outboxLessonIds = new Set(existingOutbox.map((i) => i.lessonId));
    const syncPromises: Promise<{ success: boolean; idempotent?: boolean }>[] = [];

    for (const [id, localUnit] of Object.entries(localUnits)) {
      if (!localUnit) continue;
      const lessonId = id as LessonId;

      if ((localUnit.completed || localUnit.currentStep > 0 || localUnit.passCount > 0) && !outboxLessonIds.has(lessonId)) {
        if (cloudUnitsTarget) {
          cloudUnitsTarget[lessonId] = { ...localUnit };
        }

        const lesson = LESSON_LIST.find((l) => l.id === lessonId);
        const totalSteps = lesson?.subLessonCount || 1;
        const runId = generateUuid();
        const outboxItem: LessonOutboxItem = {
          runId,
          lessonId,
          languageCode: "en",
          completed: localUnit.completed,
          stars: localUnit.bestStars ?? (localUnit.completed ? 3 : 1),
          wpm: Math.round(localUnit.bestWpm || localUnit.avgWpm || 30),
          accuracy: Math.round(localUnit.bestAccuracy || localUnit.avgAccuracy || 90),
          attemptCount: Math.max(1, localUnit.attemptsCount || 1),
          step: Math.min(totalSteps, Math.max(1, localUnit.currentStep || (localUnit.completed ? totalSteps : 1))),
          totalSteps,
          typedChars: Math.max(10, Math.round(localUnit.avgWpm || 30) * 5),
          correctChars: Math.max(9, Math.round(((localUnit.avgWpm || 30) * 5 * (localUnit.avgAccuracy || 90)) / 100)),
          incorrectChars: Math.max(0, Math.round(((localUnit.avgWpm || 30) * 5 * (100 - (localUnit.avgAccuracy || 90))) / 100)),
          elapsedMs: Math.max(1000, Math.round(localUnit.totalTimeMs || 15000)),
          createdAt: Date.now(),
          retryCount: 0,
          userId,
        };

        enqueueLessonOutbox(userId, outboxItem);
        syncPromises.push(sendLessonOutboxItem(outboxItem));
      }
    }

    if (syncPromises.length > 0) {
      await Promise.allSettled(syncPromises);
    }
  }
}

const emptyTotals = (): LessonTotals => ({ typedChars: 0, correctChars: 0, incorrectChars: 0, timeMs: 0 });

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isValidUnitProgress(value: unknown): value is UnitProgress {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<UnitProgress>;
  return (
    typeof v.completed === "boolean" &&
    isFiniteNonNegative(v.currentStep) &&
    isFiniteNonNegative(v.passCount) &&
    isFiniteNonNegative(v.avgAccuracy) &&
    v.avgAccuracy <= 100 &&
    isFiniteNonNegative(v.avgWpm) &&
    isFiniteNonNegative(v.totalTimeMs) &&
    isFiniteNonNegative(v.completedAt) &&
    (v.bestWpm === undefined || isFiniteNonNegative(v.bestWpm)) &&
    (v.bestAccuracy === undefined || (isFiniteNonNegative(v.bestAccuracy) && v.bestAccuracy <= 100)) &&
    (v.attemptsCount === undefined || isFiniteNonNegative(v.attemptsCount)) &&
    (v.lastAttemptAt === undefined || isFiniteNonNegative(v.lastAttemptAt)) &&
    (v.bestStars === undefined || (isFiniteNonNegative(v.bestStars) && v.bestStars <= 5)) &&
    (v.latestStars === undefined || (isFiniteNonNegative(v.latestStars) && v.latestStars <= 5))
  );
}

function isValidTotals(value: unknown): value is LessonTotals {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<LessonTotals>;
  return (
    isFiniteNonNegative(v.typedChars) &&
    isFiniteNonNegative(v.correctChars) &&
    isFiniteNonNegative(v.incorrectChars) &&
    isFiniteNonNegative(v.timeMs)
  );
}

export function computeUnitProgressUpdate(
  existing: UnitProgress | undefined,
  input: RecordAttemptInput,
): { unit: UnitProgress; passed: boolean; unitCompleted: boolean; stars: number } {
  const minAcc = input.minAccuracy ?? 60;
  const passed = input.stars !== undefined
    ? input.stars >= 3 && input.accuracy >= minAcc
    : input.accuracy >= minAcc;
  const unitCompleted = passed && input.step >= input.totalSteps;

  const currentStars = input.stars ?? (passed ? (input.accuracy >= 98 ? 5 : input.accuracy >= 92 ? 4 : 3) : (input.accuracy >= input.minAccuracy - 12 ? 2 : 1));
  const prevBestStars = existing?.bestStars ?? (existing?.completed ? 3 : 0);
  const bestStars = Math.max(prevBestStars, currentStars);

  const prevPassCount = existing?.passCount ?? 0;
  const nextPassCount = passed ? prevPassCount + 1 : prevPassCount;
  const avgAccuracy = passed
    ? ((existing?.avgAccuracy ?? 0) * prevPassCount + input.accuracy) / nextPassCount
    : (existing?.avgAccuracy ?? 0);
  const avgWpm = passed
    ? ((existing?.avgWpm ?? 0) * prevPassCount + input.wpm) / nextPassCount
    : (existing?.avgWpm ?? 0);

  const prevAttempts = existing?.attemptsCount ?? existing?.passCount ?? 0;
  const prevBestWpm = existing?.bestWpm ?? existing?.avgWpm ?? 0;
  const prevBestAcc = existing?.bestAccuracy ?? existing?.avgAccuracy ?? 0;

  const unit: UnitProgress = {
    completed: (existing?.completed ?? false) || unitCompleted,
    currentStep: passed ? Math.max(existing?.currentStep ?? 0, input.step) : (existing?.currentStep ?? 0),
    passCount: nextPassCount,
    avgAccuracy,
    avgWpm,
    totalTimeMs: (existing?.totalTimeMs ?? 0) + input.elapsedMs,
    completedAt: unitCompleted ? Date.now() : (existing?.completedAt ?? 0),
    bestWpm: passed ? Math.max(prevBestWpm, input.wpm) : prevBestWpm,
    bestAccuracy: Math.max(prevBestAcc, input.accuracy),
    attemptsCount: prevAttempts + 1,
    lastAttemptAt: Date.now(),
    bestStars,
    latestStars: currentStars,
  };

  return { unit, passed, unitCompleted, stars: currentStars };
}

export function sanitizeUnits(value: unknown): LessonProgressState["units"] {
  if (typeof value !== "object" || value === null) return {};
  const result: LessonProgressState["units"] = {};
  for (const [id, entry] of Object.entries(value as Record<string, unknown>)) {
    if (isValidUnitProgress(entry)) result[id as LessonId] = entry;
  }
  return result;
}

const accountAwareStorage: StateStorage = {
  getItem: () => {
    const storage = getLocalStorage();
    if (!storage) return null;
    try {
      const key = getAccountStorageKey();
      return storage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (_name, value) => {
    const storage = getLocalStorage();
    if (!storage) return;
    try {
      const key = getAccountStorageKey();
      storage.setItem(key, value);
    } catch {
      // Ignore
    }
  },
  removeItem: () => {
    const storage = getLocalStorage();
    if (!storage) return;
    try {
      const key = getAccountStorageKey();
      storage.removeItem(key);
    } catch {
      // Ignore
    }
  },
};

export const useLessonProgressStore = create<LessonProgressState>()(
  persist(
    (set, get) => ({
      version: CURRENT_SCHEMA_VERSION,
      learnerGoal: "touch-typing",
      units: {},
      totals: emptyTotals(),
      syncStatus: isAuthLoading() ? "auth-loading" : (getCurrentUserId() ? "account-loading" : "guest"),
      lifecycleStatus: isAuthLoading() ? "auth-loading" : (getCurrentUserId() ? "account-loading" : "guest"),
      lastSyncError: null,
      guestImportAvailable: null,
      mergeGuestProgress: async () => {
        const userId = getCurrentUserId();
        if (!userId) return;
        const guestUnits = getGuestStoredUnits();
        if (!guestUnits) return;

        const state = get();
        const nextUnits = { ...state.units };
        await transferGuestUnitsToAccount(userId, guestUnits, nextUnits);
        archiveAndClearGuestProgress(guestUnits);

        const storage = getLocalStorage();
        storage?.setItem(`${MIGRATED_FLAG_PREFIX}:${userId}`, "true");

        set({
          units: nextUnits,
          guestImportAvailable: null,
        });
        saveCurrentStoreSnapshot(nextUnits, state.totals, state.learnerGoal);
      },
      dismissGuestImport: () => {
        const userId = getCurrentUserId();
        if (userId) {
          const storage = getLocalStorage();
          storage?.setItem(`${DISMISSED_FLAG_PREFIX}:${userId}`, "true");
        }
        set({ guestImportAvailable: null });
      },
      setLearnerGoal: (goal) => {
        set({ learnerGoal: goal });
        saveCurrentStoreSnapshot(get().units, get().totals, goal);
      },
      recordAttempt: (unitId, input) => {
        const state = get();
        const { unit, passed, unitCompleted, stars } = computeUnitProgressUpdate(state.units[unitId], input);

        const nextUnits = { ...state.units, [unitId]: unit };
        const nextTotals = {
          typedChars: state.totals.typedChars + input.typedChars,
          correctChars: state.totals.correctChars + input.correctChars,
          incorrectChars: state.totals.incorrectChars + input.incorrectChars,
          timeMs: state.totals.timeMs + input.elapsedMs,
        };

        set({
          units: nextUnits,
          totals: nextTotals,
        });

        saveCurrentStoreSnapshot(nextUnits, nextTotals, state.learnerGoal);

        const userId = getCurrentUserId();
        let savePromise: Promise<{ success: boolean; idempotent?: boolean }> = Promise.resolve({ success: true });

        if (userId) {
          const runId = generateUuid();
          const pathSegment = getPathSegment();
          const languageCode = normalizeLanguageCode(pathSegment);

          const outboxItem: LessonOutboxItem = {
            runId,
            lessonId: unitId,
            languageCode,
            completed: unit.completed,
            stars,
            wpm: input.wpm,
            accuracy: input.accuracy,
            attemptCount: 1,
            step: input.step,
            totalSteps: input.totalSteps,
            typedChars: input.typedChars,
            correctChars: input.correctChars,
            incorrectChars: input.incorrectChars,
            elapsedMs: Math.max(0, Math.round(input.elapsedMs)),
            createdAt: Date.now(),
            retryCount: 0,
            userId,
          };

          enqueueLessonOutbox(userId, outboxItem);
          savePromise = sendLessonOutboxItem(outboxItem);
        }

        return { passed, unitCompleted, savePromise };
      },
      resetProgress: () => {
        primeGeneration++;
        primedUserId = null;
        primeInFlight = null;
        const userId = getCurrentUserId();
        set({
          units: {},
          totals: emptyTotals(),
          learnerGoal: "touch-typing",
          guestImportAvailable: null,
        });
        saveCurrentStoreSnapshot({}, emptyTotals(), "touch-typing");
        if (userId) {
          const storage = getLocalStorage();
          storage?.removeItem(`${OUTBOX_STORAGE_PREFIX}:${userId}`);
          fetch("/api/lessons/progress", { method: "DELETE" }).catch((err) => {
            console.warn("[lessons] failed to delete remote lesson progress:", err);
          });
        }
      },
      unlockUpToLesson: (targetLessonId: LessonId) => {
        const targetIndex = LESSON_LIST.findIndex((l) => l.id === targetLessonId);
        if (targetIndex <= 0) return;
        const state = get();
        const nextUnits = { ...state.units };
        let modified = false;

        for (let i = 0; i < targetIndex; i++) {
          const lesson = LESSON_LIST[i];
          const existing = nextUnits[lesson.id];
          if (!existing || !existing.completed) {
            modified = true;
            nextUnits[lesson.id] = {
              completed: true,
              currentStep: lesson.subLessonCount,
              passCount: Math.max(1, existing?.passCount ?? 1),
              avgAccuracy: existing?.avgAccuracy ?? 95,
              avgWpm: existing?.avgWpm ?? 40,
              totalTimeMs: existing?.totalTimeMs ?? 0,
              completedAt: existing?.completedAt || Date.now(),
              bestWpm: Math.max(existing?.bestWpm ?? 40, 40),
              bestAccuracy: Math.max(existing?.bestAccuracy ?? 95, 95),
              attemptsCount: Math.max(1, existing?.attemptsCount ?? 1),
              lastAttemptAt: Date.now(),
              bestStars: Math.max(existing?.bestStars ?? 4, 4),
              latestStars: existing?.latestStars ?? 4,
            };
          }
        }

        if (modified) {
          set({ units: nextUnits });
          saveCurrentStoreSnapshot(nextUnits, state.totals, state.learnerGoal);
        }
      },
      exportProgress: () => {
        const state = get();
        return JSON.stringify(
          {
            version: CURRENT_SCHEMA_VERSION,
            schemaVersion: CURRENT_SCHEMA_VERSION,
            exportedAt: Date.now(),
            learnerGoal: state.learnerGoal,
            units: state.units,
            totals: state.totals,
          },
          null,
          2,
        );
      },
      replaceCloudUnits: (rows) => {
        const units: LessonProgressState["units"] = {};
        for (const row of rows) {
          const lesson = LESSON_LIST.find((item) => item.id === row.lesson_id);
          if (!lesson) continue;
          units[lesson.id] = mapCloudLessonRowToUnitProgress(row, lesson.subLessonCount);
        }
        const totals = rows.reduce((tot, row) => ({
          typedChars: tot.typedChars + Number(row.typed_chars ?? 0),
          correctChars: tot.correctChars + Number(row.correct_chars ?? 0),
          incorrectChars: tot.incorrectChars + Number(row.incorrect_chars ?? 0),
          timeMs: tot.timeMs + Number(row.total_time_ms ?? 0),
        }), emptyTotals());

        set({ units, totals });
        saveCurrentStoreSnapshot(units, totals, get().learnerGoal);
      },
      retryPendingOutbox: async () => {
        const userId = getCurrentUserId();
        if (userId) {
          await flushLessonOutbox(userId);
        }
      },
      importProgress: (jsonString: string) => {
        if (getCurrentUserId() || jsonString.length > 1_000_000) return false;
        try {
          const parsed = JSON.parse(jsonString);
          if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return false;
          if (typeof parsed.units !== "object" || parsed.units === null || Array.isArray(parsed.units)) return false;

          const cleanUnits = sanitizeUnits(parsed.units);
          const cleanTotals = isValidTotals(parsed.totals) ? parsed.totals : emptyTotals();
          const cleanGoal: LearnerGoal =
            typeof parsed.learnerGoal === "string" && Object.hasOwn(LEARNER_GOAL_CONFIGS, parsed.learnerGoal)
              ? parsed.learnerGoal
              : "touch-typing";

          set({
            version: CURRENT_SCHEMA_VERSION,
            units: cleanUnits,
            totals: cleanTotals,
            learnerGoal: cleanGoal,
          });
          saveCurrentStoreSnapshot(cleanUnits, cleanTotals, cleanGoal);
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: GUEST_STORAGE_KEY,
      storage: createJSONStorage(() => accountAwareStorage),
      merge: (persistedState, currentState) => {
        const p = (typeof persistedState === "object" && persistedState !== null ? persistedState : {}) as Partial<{
          version?: unknown;
          learnerGoal?: unknown;
          units: unknown;
          totals: unknown;
        }>;

        const cleanUnits = sanitizeUnits(p.units);
        const cleanTotals = isValidTotals(p.totals) ? p.totals : currentState.totals;
        const cleanGoal: LearnerGoal =
          p.learnerGoal && typeof p.learnerGoal === "string" && p.learnerGoal in LEARNER_GOAL_CONFIGS
            ? (p.learnerGoal as LearnerGoal)
            : currentState.learnerGoal;

        return {
          ...currentState,
          version: CURRENT_SCHEMA_VERSION,
          learnerGoal: cleanGoal,
          units: cleanUnits,
          totals: cleanTotals,
        };
      },
    },
  ),
);

let primeInFlight: Promise<void> | null = null;
let primedUserId: string | null = null;
let primeGeneration = 0;

export async function primeCloudLessonProgress(options?: { force?: boolean }): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) {
    useLessonProgressStore.setState({
      syncStatus: "guest",
      lifecycleStatus: "guest",
    });
    return;
  }

  if (!options?.force && primedUserId === userId && !primeInFlight) {
    return;
  }

  while (primeInFlight) {
    await primeInFlight;
    if (!options?.force && primedUserId === userId) {
      return;
    }
  }

  const currentGen = primeGeneration;

  primeInFlight = (async () => {
    try {
      useLessonProgressStore.setState({
        syncStatus: "syncing",
        lifecycleStatus: "syncing",
      });

      // Capture store units snapshot at the start before network calls
      const snapshotUnitsAtStart = { ...useLessonProgressStore.getState().units };

      // 1. Flush any pending outbox items first
      await flushLessonOutbox(userId);

      // 2. Fetch cloud progress
      const pathSegment = getPathSegment();
      const languageCode = normalizeLanguageCode(pathSegment);
      const res = await fetch(`/api/lessons/progress?languageCode=${languageCode}`);
      if (!res.ok) {
        throw new Error(`Cloud progress fetch failed with status ${res.status}`);
      }

      const json = await res.json();
      if (!json?.success || !Array.isArray(json.data)) {
        throw new Error("Invalid response payload from /api/lessons/progress");
      }

      // Ensure user hasn't signed out, reset, or changed during fetch
      if (userId !== getCurrentUserId() || currentGen !== primeGeneration) return;

      const rows: Array<CloudLessonRowInput & { typed_chars?: number; correct_chars?: number; incorrect_chars?: number }> = json.data;

      // 3. Map cloud rows as the authoritative baseline
      const cloudUnits: LessonProgressState["units"] = {};
      for (const row of rows) {
        const lesson = LESSON_LIST.find((item) => item.id === row.lesson_id);
        if (!lesson) continue;
        cloudUnits[lesson.id] = mapCloudLessonRowToUnitProgress(row, lesson.subLessonCount);
      }

      const storage = getLocalStorage();
      const isMigrated = storage ? storage.getItem(`${MIGRATED_FLAG_PREFIX}:${userId}`) === "true" : true;
      const isDismissed = storage ? storage.getItem(`${DISMISSED_FLAG_PREFIX}:${userId}`) === "true" : false;
      const guestUnits = getGuestStoredUnits();
      const hasGuestUnits = Boolean(
        guestUnits &&
          Object.values(guestUnits).some(
            (u) => u && (u.completed || u.currentStep > 0 || u.passCount > 0)
          )
      );

      // CASE B: User signs in and account has NO cloud progress
      if (rows.length === 0 && hasGuestUnits && !isMigrated) {
        const migratedCount = await transferGuestUnitsToAccount(userId, guestUnits!, cloudUnits);
        if (migratedCount > 0) {
          archiveAndClearGuestProgress(guestUnits!);
          storage?.setItem(`${MIGRATED_FLAG_PREFIX}:${userId}`, "true");
        }
      }
      // CASE C: User signs in and account ALREADY has progress
      else if (rows.length > 0 && hasGuestUnits && !isMigrated && !isDismissed) {
        const unmergedLessons: LessonId[] = [];
        for (const [id, gu] of Object.entries(guestUnits!)) {
          if (!gu) continue;
          const lessonId = id as LessonId;
          const cu = cloudUnits[lessonId];
          const hasNewProgress =
            !cu || (!cu.completed && gu.completed) || (gu.currentStep > (cu.currentStep ?? 0));
          if (hasNewProgress && (gu.completed || gu.currentStep > 0)) {
            unmergedLessons.push(lessonId);
          }
        }

        if (unmergedLessons.length > 0) {
          useLessonProgressStore.setState({
            guestImportAvailable: {
              count: unmergedLessons.length,
              lessons: unmergedLessons,
            },
          });
        }
      }

      // Safe recovery: if cloud is empty and local units were ahead before prime, reconcile and push to cloud
      await reconcileLocalProgressWithCloud(userId, rows, snapshotUnitsAtStart, cloudUnits);

      // 4. Merge any still-unconfirmed genuine outbox items that remain pending (in-flight or offline retry)
      const pendingItems = getLessonOutbox(userId);
      for (const pending of pendingItems) {
        const existing = cloudUnits[pending.lessonId];
        const { unit } = computeUnitProgressUpdate(existing, {
          step: pending.step,
          totalSteps: pending.totalSteps,
          accuracy: pending.accuracy,
          wpm: pending.wpm,
          typedChars: pending.typedChars,
          correctChars: pending.correctChars,
          incorrectChars: pending.incorrectChars,
          elapsedMs: pending.elapsedMs,
          minAccuracy: 60,
          stars: pending.stars,
        });
        cloudUnits[pending.lessonId] = unit;
      }

      // 5. Authoritative cloud baseline + confirmed reconciliations & pending items becomes state
      const totalTyped = rows.reduce((acc, r) => acc + Number(r.typed_chars ?? 0), 0);
      const totalCorrect = rows.reduce((acc, r) => acc + Number(r.correct_chars ?? 0), 0);
      const totalIncorrect = rows.reduce((acc, r) => acc + Number(r.incorrect_chars ?? 0), 0);
      const totalTime = rows.reduce((acc, r) => acc + Number(r.total_time_ms ?? 0), 0);

      const current = useLessonProgressStore.getState();
      const nextTotals: LessonTotals = {
        typedChars: Math.max(current.totals.typedChars, totalTyped),
        correctChars: Math.max(current.totals.correctChars, totalCorrect),
        incorrectChars: Math.max(current.totals.incorrectChars, totalIncorrect),
        timeMs: Math.max(current.totals.timeMs, totalTime),
      };

      if (userId !== getCurrentUserId() || currentGen !== primeGeneration) return;

      useLessonProgressStore.setState({
        units: cloudUnits,
        totals: nextTotals,
        syncStatus: "account-ready",
        lifecycleStatus: "account-ready",
        lastSyncError: null,
      });

      saveCurrentStoreSnapshot(cloudUnits, nextTotals, current.learnerGoal);
      primedUserId = userId;
    } catch (err) {
      console.warn("[lessons] failed to load cloud progress:", err);
      useLessonProgressStore.setState({
        syncStatus: "error",
        lifecycleStatus: "sync-error",
        lastSyncError: err instanceof Error ? err.message : "Network error",
      });
      // NOTE: We do NOT wipe units! The user's account-cached progress remains visible!
    } finally {
      primeInFlight = null;
    }
  })();

  return primeInFlight;
}

subscribeCurrentUser(() => {
  const userId = getCurrentUserId();
  const loading = isAuthLoading();
  primedUserId = null;
  primeInFlight = null;

  if (loading) {
    useLessonProgressStore.setState({
      syncStatus: "auth-loading",
      lifecycleStatus: "auth-loading",
      guestImportAvailable: null,
    });
    return;
  }

  const targetKey = getAccountStorageKey(userId);
  const storage = getLocalStorage();

  if (userId) {
    // 1. Read cached state BEFORE pointing persist to targetKey, to prevent persist overwriting it
    const raw = storage?.getItem(targetKey);
    let seededUnits: LessonProgressState["units"] = {};
    let seededTotals = emptyTotals();
    let seededGoal: LearnerGoal = "touch-typing";

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const data = parsed?.state ?? parsed;
        if (data && typeof data.units === "object" && data.units !== null) {
          seededUnits = sanitizeUnits(data.units);
          seededTotals = isValidTotals(data.totals) ? data.totals : emptyTotals();
          seededGoal = data.learnerGoal ?? "touch-typing";
        }
      } catch {
        // Ignore
      }
    }

    useLessonProgressStore.setState({
      units: seededUnits,
      totals: seededTotals,
      learnerGoal: seededGoal,
      syncStatus: "account-loading",
      lifecycleStatus: "account-loading",
      guestImportAvailable: null,
    });

    useLessonProgressStore.persist.setOptions({ name: targetKey });
    void useLessonProgressStore.persist.rehydrate();
    void primeCloudLessonProgress();
  } else {
    restoreLocalLessonProgress();
  }
});

export function restoreLocalLessonProgress(): void {
  primedUserId = null;
  primeInFlight = null;

  const storage = getLocalStorage();
  const raw = storage?.getItem(GUEST_STORAGE_KEY);
  let cleanUnits: LessonProgressState["units"] = {};
  let cleanTotals = emptyTotals();
  let cleanGoal: LearnerGoal = "touch-typing";

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const data = parsed?.state ?? parsed;
      if (data && typeof data.units === "object" && data.units !== null) {
        cleanUnits = sanitizeUnits(data.units);
        cleanTotals = isValidTotals(data.totals) ? data.totals : emptyTotals();
        cleanGoal = data.learnerGoal ?? "touch-typing";
      }
    } catch {
      // Ignore
    }
  }

  // Set clean guest state into memory before pointing persist back to GUEST_STORAGE_KEY
  useLessonProgressStore.setState({
    units: cleanUnits,
    totals: cleanTotals,
    learnerGoal: cleanGoal,
    syncStatus: "guest",
    lifecycleStatus: "guest",
    guestImportAvailable: null,
  });

  useLessonProgressStore.persist.setOptions({ name: GUEST_STORAGE_KEY });
  void useLessonProgressStore.persist.rehydrate();
}

export function isLessonUnlocked(lessonId: LessonId, units: LessonProgressState["units"]): boolean {
  const index = LESSON_LIST.findIndex((l) => l.id === lessonId);
  if (index <= 0) return index === 0;
  const previous = LESSON_LIST[index - 1];
  return units[previous.id]?.completed ?? false;
}
