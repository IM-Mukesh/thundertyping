import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { LESSON_LIST, type LessonId } from "@/lib/lessons/lesson-types";

// A real zustand store, not the plain-function/localStorage pattern
// game-scores.ts uses -- deliberately, and unlike that one. Progress here is
// read reactively from many places at once (the dashboard's top stats bar,
// every unit row, the drill's own "resume at step N") rather than written
// once and read by a single badge, which is settings-store.ts's profile, not
// game-scores.ts's. Follows settings-store.ts's exact persist/merge/sanitize
// shape for that reason -- including reading/writing across the
// next/dynamic(ssr:false) boundary that LessonDrill's chunk sits behind,
// which is the same boundary settings-store already crosses today (the
// dynamically-loaded typing test writes it, the always-loaded header reads
// it) without the module-duplication problem documented on
// test-status-store.ts elsewhere in this codebase -- that bug was specific
// to a hand-rolled module-level store, not to zustand's create().

export interface UnitProgress {
  completed: boolean;
  /** How many sub-lesson steps have been passed, 0..subLessonCount. Where "Resume" picks back up. */
  currentStep: number;
  /** Count of *passing* attempts only -- what avgAccuracy/avgWpm are averaged over. A failed retry updates totalTimeMs (an honest total) but not the averages, so struggling on one step doesn't drag down the number the dashboard shows for the whole unit. */
  passCount: number;
  avgAccuracy: number;
  avgWpm: number;
  totalTimeMs: number;
  completedAt: number;
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
}

export interface LessonProgressState {
  units: Partial<Record<LessonId, UnitProgress>>;
  totals: LessonTotals;
  recordAttempt: (unitId: LessonId, input: RecordAttemptInput) => { passed: boolean; unitCompleted: boolean };
}

const emptyTotals = (): LessonTotals => ({ typedChars: 0, correctChars: 0, incorrectChars: 0, timeMs: 0 });

// A finite, non-negative number -- rejects NaN/Infinity/negatives, which
// `typeof === "number"` alone lets straight through. A corrupted or
// hand-edited value passing validation here used to mean a dashboard row
// could render e.g. "-50 wpm" or a progress bar past 100%.
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
    isFiniteNonNegative(v.completedAt)
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

/**
 * The actual pass/fail + averaging logic, pulled out as a pure function --
 * exported for tests -- for the same reason use-typing-engine.ts exports its
 * reducer separately from the hook: through the store action, a wrong
 * average or a gating bug is invisible; here it can be asserted directly.
 */
export function computeUnitProgressUpdate(
  existing: UnitProgress | undefined,
  input: RecordAttemptInput,
): { unit: UnitProgress; passed: boolean; unitCompleted: boolean } {
  const passed = input.accuracy >= input.minAccuracy;
  const unitCompleted = passed && input.step >= input.totalSteps;

  // Only a passing attempt feeds the displayed averages. A failed retry
  // still counts toward totalTimeMs (an honest total -- the time was really
  // spent) but not toward avgAccuracy/avgWpm, so acing 6 of 7 steps and
  // needing three tries on one doesn't show a misleadingly low unit average.
  const prevPassCount = existing?.passCount ?? 0;
  const nextPassCount = passed ? prevPassCount + 1 : prevPassCount;
  const avgAccuracy = passed
    ? ((existing?.avgAccuracy ?? 0) * prevPassCount + input.accuracy) / nextPassCount
    : (existing?.avgAccuracy ?? 0);
  const avgWpm = passed
    ? ((existing?.avgWpm ?? 0) * prevPassCount + input.wpm) / nextPassCount
    : (existing?.avgWpm ?? 0);

  const unit: UnitProgress = {
    completed: (existing?.completed ?? false) || unitCompleted,
    currentStep: passed ? Math.max(existing?.currentStep ?? 0, input.step) : (existing?.currentStep ?? 0),
    passCount: nextPassCount,
    avgAccuracy,
    avgWpm,
    totalTimeMs: (existing?.totalTimeMs ?? 0) + input.elapsedMs,
    completedAt: unitCompleted ? Date.now() : (existing?.completedAt ?? 0),
  };

  return { unit, passed, unitCompleted };
}

// Drops any single malformed unit entry rather than discarding the whole
// map -- one corrupted record shouldn't erase progress on every other unit.
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
      units: {},
      totals: emptyTotals(),
      recordAttempt: (unitId, input) => {
        const state = get();
        const { unit, passed, unitCompleted } = computeUnitProgressUpdate(state.units[unitId], input);

        set({
          units: { ...state.units, [unitId]: unit },
          // Accumulated on every attempt, pass or fail -- an honest total,
          // same spirit as the main engine never pausing its clock on blur.
          totals: {
            typedChars: state.totals.typedChars + input.typedChars,
            correctChars: state.totals.correctChars + input.correctChars,
            incorrectChars: state.totals.incorrectChars + input.incorrectChars,
            timeMs: state.totals.timeMs + input.elapsedMs,
          },
        });

        return { passed, unitCompleted };
      },
    }),
    {
      // Left unrenamed on the HeroTyping rebrand -- every existing player's
      // lesson progress is saved under this name, and renaming it would
      // orphan it.
      name: "thundertyping-lesson-progress",
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const p = (typeof persistedState === "object" && persistedState !== null ? persistedState : {}) as Partial<{
          units: unknown;
          totals: unknown;
        }>;
        return {
          ...currentState,
          units: sanitizeUnits(p.units),
          totals: isValidTotals(p.totals) ? p.totals : currentState.totals,
        };
      },
    },
  ),
);

/**
 * Pure, derived from LESSON_LIST order + the progress map -- there is no
 * separate "unlocked" field persisted anywhere, so nothing can desync from
 * actual completion state (the same single-source-of-truth reasoning behind
 * this codebase's accuracy/breakdown fix). The first unit is always
 * unlocked.
 */
export function isLessonUnlocked(lessonId: LessonId, units: LessonProgressState["units"]): boolean {
  const index = LESSON_LIST.findIndex((l) => l.id === lessonId);
  if (index <= 0) return index === 0;
  const previous = LESSON_LIST[index - 1];
  return units[previous.id]?.completed ?? false;
}
