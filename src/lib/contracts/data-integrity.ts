import { LESSON_LIST } from "@/lib/lessons/lesson-types";
import { calculateLessonStars, calculateLessonPass } from "@/lib/lessons/star-system";

export const CHARS_PER_WORD = 5;

/**
 * Authoritative canonical Net WPM calculation.
 * Matches Monkeytype and HeroTyping typing-engine parity:
 * Net WPM = (scoringChars / 5) / (durationInSeconds / 60)
 *
 * Scoring characters represent characters in error-free words + clean prefixes
 * of active words upon timer expiration.
 */
export function deriveAuthoritativeNetWpm(scoringChars: number, durationSec: number): number {
  if (durationSec <= 0) return 0;
  const minutes = durationSec / 60;
  return Math.round(((scoringChars / CHARS_PER_WORD) / minutes) * 100) / 100;
}

/**
 * Authoritative canonical accuracy calculation.
 * Accuracy = (correctChars / (correctChars + incorrectChars + missedChars)) * 100
 */
export function deriveAuthoritativeAccuracy(
  correctChars: number,
  incorrectChars: number,
  missedChars = 0
): number {
  const total = correctChars + incorrectChars + missedChars;
  if (total <= 0) return 100;
  return Math.round((correctChars / total) * 10000) / 100;
}

export interface LessonStepEvaluation {
  substepPassed: boolean;
  unitCompleted: boolean;
  authoritativeStars: number;
  authoritativeTotalSteps: number;
  minAccuracy: number;
}

/**
 * Evaluates lesson progress authoritatively using curriculum metadata.
 * A passing substep DOES NOT equal whole-unit completion.
 * Whole-unit completion strictly requires:
 * 1. The substep itself validly met pass criteria (accuracy >= minAccuracy, stars >= 3)
 * 2. The step index has reached or exceeded the unit's authoritative subLessonCount.
 */
export function evaluateLessonStepCompletion(
  lessonId: string,
  step: number,
  accuracy: number,
  wpm: number
): LessonStepEvaluation {
  const lesson = LESSON_LIST.find((l) => l.id === lessonId);
  if (!lesson) {
    throw new Error(`Unknown lesson ID: ${lessonId}`);
  }

  const isBeginner = lesson.tier === "beginner";
  const stars = calculateLessonStars(accuracy, wpm, { isBeginner });
  const minAccuracy = 60; // Authoritative pre-Part-1 baseline progression threshold (calculateLessonPass: accuracy >= 60)
  const substepPassed = calculateLessonPass(accuracy);
  const unitCompleted = substepPassed && step >= lesson.subLessonCount;

  return {
    substepPassed,
    unitCompleted,
    authoritativeStars: stars,
    authoritativeTotalSteps: lesson.subLessonCount,
    minAccuracy,
  };
}

export interface CloudLessonRowInput {
  lesson_id: string;
  completed?: boolean | null;
  current_step?: number | null;
  pass_count?: number | null;
  attempt_count?: number | null;
  avg_wpm?: number | null;
  best_wpm?: number | null;
  avg_accuracy?: number | null;
  best_accuracy?: number | null;
  stars?: number | null;
  total_time_ms?: number | null;
  completed_at?: string | null;
  last_attempt_at?: string | null;
}

export interface MappedUnitProgress {
  completed: boolean;
  currentStep: number;
  passCount: number;
  attemptsCount: number;
  avgAccuracy: number;
  bestAccuracy: number;
  avgWpm: number;
  bestWpm: number;
  totalTimeMs: number;
  completedAt: number;
  lastAttemptAt?: number;
  bestStars: number;
  latestStars: number;
}

/**
 * Maps PostgreSQL `lesson_progress` row directly to client `UnitProgress`.
 * Preserves strict 1:1 semantic field mappings without substituting:
 * - pass_count -> passes (never attempt_count)
 * - attempt_count -> attempts
 * - avg_wpm -> averageWpm (never best_wpm)
 * - best_wpm -> bestWpm
 * - avg_accuracy -> averageAccuracy (never best_accuracy)
 * - best_accuracy -> bestAccuracy
 */
export function mapCloudLessonRowToUnitProgress(
  row: CloudLessonRowInput,
  authoritativeSubLessonCount: number
): MappedUnitProgress {
  const completed = Boolean(row.completed);
  const passCount = Math.max(0, Number(row.pass_count ?? (completed ? 1 : 0)));
  const attemptsCount = Math.max(passCount, Number(row.attempt_count ?? (completed ? 1 : 1)));

  const bestWpm = Math.max(0, Number(row.best_wpm ?? 0));
  const bestAccuracy = Math.max(0, Math.min(100, Number(row.best_accuracy ?? 0)));

  // If avg_wpm / avg_accuracy are explicitly in row, use them directly.
  // In legacy rows where avg fields may be null, fall back to best only if passCount > 0, else 0.
  const avgWpm =
    row.avg_wpm !== undefined && row.avg_wpm !== null
      ? Math.max(0, Number(row.avg_wpm))
      : passCount > 0
      ? bestWpm
      : 0;

  const avgAccuracy =
    row.avg_accuracy !== undefined && row.avg_accuracy !== null
      ? Math.max(0, Math.min(100, Number(row.avg_accuracy)))
      : passCount > 0
      ? bestAccuracy
      : 0;

  const currentStep = Math.min(
    authoritativeSubLessonCount,
    Math.max(0, Number(row.current_step ?? (completed ? authoritativeSubLessonCount : 0)))
  );

  const completedAt = completed
    ? row.completed_at
      ? Date.parse(row.completed_at) || 0
      : 0
    : 0;

  const lastAttemptAt = row.last_attempt_at
    ? Date.parse(row.last_attempt_at) || undefined
    : undefined;

  const stars = Math.max(0, Math.min(5, Number(row.stars ?? 0)));

  return {
    completed,
    currentStep,
    passCount,
    attemptsCount,
    avgAccuracy,
    bestAccuracy,
    avgWpm,
    bestWpm,
    totalTimeMs: Math.max(0, Number(row.total_time_ms ?? 0)),
    completedAt,
    lastAttemptAt,
    bestStars: stars,
    latestStars: stars,
  };
}

/**
 * Canonical PB bucket key formatting.
 * Identifies a personal best partition across mode, param, punctuation, and numbers.
 */
export function makePbBucketKey(
  mode: string,
  param: string | number | null | undefined,
  punctuation: boolean,
  numbers: boolean,
  languageCode: string = "en"
): string {
  const safeParam = param !== null && param !== undefined ? String(param) : "";
  const prefix = languageCode === "en" ? "thundertyping-pb" : `thundertyping-pb:${languageCode}`;
  return `${prefix}:${mode}:${safeParam}:${punctuation ? 1 : 0}:${numbers ? 1 : 0}`;
}

export interface TrackableBucketSpec {
  mode: "time" | "words" | "quote" | "vocabulary";
  param: string;
  punctuation: boolean;
  numbers: boolean;
}

export const STANDARD_TRACKABLE_PB_BUCKETS: readonly TrackableBucketSpec[] = [
  // Time mode presets (15s, 30s, 60s, 120s, plus standard durations 180s, 300s, 600s)
  ...["15", "30", "60", "120", "180", "300", "600"].flatMap((param) => [
    { mode: "time" as const, param, punctuation: false, numbers: false },
    { mode: "time" as const, param, punctuation: true, numbers: false },
    { mode: "time" as const, param, punctuation: false, numbers: true },
    { mode: "time" as const, param, punctuation: true, numbers: true },
  ]),
  // Words mode presets (10, 25, 50, 100)
  ...["10", "25", "50", "100"].flatMap((param) => [
    { mode: "words" as const, param, punctuation: false, numbers: false },
    { mode: "words" as const, param, punctuation: true, numbers: false },
    { mode: "words" as const, param, punctuation: false, numbers: true },
    { mode: "words" as const, param, punctuation: true, numbers: true },
  ]),
  // Quote mode presets (short, medium, long)
  ...["short", "medium", "long"].map((param) => ({
    mode: "quote" as const,
    param,
    punctuation: false,
    numbers: false,
  })),
  // Vocabulary mode presets (easy, medium, hard)
  ...["easy", "medium", "hard"].map((param) => ({
    mode: "vocabulary" as const,
    param,
    punctuation: false,
    numbers: false,
  })),
];
