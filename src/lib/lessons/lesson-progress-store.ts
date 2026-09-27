import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { LESSON_LIST, type LessonId } from "@/lib/lessons/lesson-types";

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

export interface LessonProgressState {
  version: number;
  learnerGoal: LearnerGoal;
  units: Partial<Record<LessonId, UnitProgress>>;
  totals: LessonTotals;
  setLearnerGoal: (goal: LearnerGoal) => void;
  recordAttempt: (unitId: LessonId, input: RecordAttemptInput) => { passed: boolean; unitCompleted: boolean };
  resetProgress: () => void;
  unlockUpToLesson: (targetLessonId: LessonId) => void;
  exportProgress: () => string;
  importProgress: (jsonString: string) => boolean;
}

export const CURRENT_SCHEMA_VERSION = 2;

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
  // Exact minimum progression rule: 60% accuracy is required to move forward (3+ stars),
  // or the configured minAccuracy threshold if specified.
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

export const useLessonProgressStore = create<LessonProgressState>()(
  persist(
    (set, get) => ({
      version: CURRENT_SCHEMA_VERSION,
      learnerGoal: "touch-typing",
      units: {},
      totals: emptyTotals(),
      setLearnerGoal: (goal) => set({ learnerGoal: goal }),
      recordAttempt: (unitId, input) => {
        const state = get();
        const { unit, passed, unitCompleted } = computeUnitProgressUpdate(state.units[unitId], input);

        set({
          units: { ...state.units, [unitId]: unit },
          totals: {
            typedChars: state.totals.typedChars + input.typedChars,
            correctChars: state.totals.correctChars + input.correctChars,
            incorrectChars: state.totals.incorrectChars + input.incorrectChars,
            timeMs: state.totals.timeMs + input.elapsedMs,
          },
        });

        return { passed, unitCompleted };
      },
      resetProgress: () =>
        set({ units: {}, totals: emptyTotals(), learnerGoal: "touch-typing" }),
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
      importProgress: (jsonString: string) => {
        try {
          const parsed = JSON.parse(jsonString);
          if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return false;
          if (typeof parsed.units !== "object" || parsed.units === null || Array.isArray(parsed.units)) return false;

          const cleanUnits = sanitizeUnits(parsed.units);
          const cleanTotals = isValidTotals(parsed.totals) ? parsed.totals : emptyTotals();
          const cleanGoal: LearnerGoal =
            parsed.learnerGoal && parsed.learnerGoal in LEARNER_GOAL_CONFIGS
              ? parsed.learnerGoal
              : "touch-typing";

          set({
            version: CURRENT_SCHEMA_VERSION,
            units: cleanUnits,
            totals: cleanTotals,
            learnerGoal: cleanGoal,
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: "thundertyping-lesson-progress",
      storage: createJSONStorage(() => localStorage),
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

export function isLessonUnlocked(lessonId: LessonId, units: LessonProgressState["units"]): boolean {
  const index = LESSON_LIST.findIndex((l) => l.id === lessonId);
  if (index <= 0) return index === 0;
  const previous = LESSON_LIST[index - 1];
  return units[previous.id]?.completed ?? false;
}
