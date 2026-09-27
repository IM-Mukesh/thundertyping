import { LESSON_DEFINITIONS, type LessonId } from "@/lib/lessons/lesson-types";

export interface PlacementRecommendation {
  suggestedLessonId: LessonId;
  lessonName: string;
  stageName: string;
  headline: string;
  rationale: string;
  metrics: {
    wpm: number;
    accuracy: number;
  };
}

/**
 * Deterministic, conservative placement evaluation based on a measured sample.
 * Does not make inflated skill claims or mutate lesson completion state.
 */
export function evaluatePlacement(wpm: number, accuracy: number): PlacementRecommendation {
  const safeWpm = Math.max(0, Math.round(Number.isFinite(wpm) ? wpm : 0));
  const safeAcc = Math.max(0, Math.min(100, Math.round(Number.isFinite(accuracy) ? accuracy : 0)));

  let suggestedLessonId: LessonId = "home-row-left";
  let headline = "Home Row Foundations";
  let rationale =
    "Focus on tactile touch-typing habits from the home row (A S D F J K L ;) without glancing down at the keyboard.";

  if (safeAcc >= 90 && safeWpm >= 70) {
    suggestedLessonId = "speed-endurance";
    headline = "Advanced Speed & Precision";
    rationale =
      "You have strong baseline speed. The Advanced tier will help you sustain cadence across longer complex passages.";
  } else if (safeAcc >= 88 && safeWpm >= 50) {
    suggestedLessonId = "everyday-sentences";
    headline = "Intermediate Real-Prose Practice";
    rationale =
      "Your core keyboard reaches are solid. Focus on typing full sentences, capitalization, and punctuation rhythm.";
  } else if (safeAcc >= 86 && safeWpm >= 38) {
    suggestedLessonId = "full-keyboard-words";
    headline = "Full Keyboard Mastery";
    rationale =
      "You type with moderate speed. Review the full alphabet and number transitions to tighten finger discipline.";
  } else if (safeAcc >= 84 && safeWpm >= 25) {
    suggestedLessonId = "top-row-left";
    headline = "Top Row Expansion";
    rationale =
      "You have good baseline dexterity. Practice expanding upward to Q W E R T Y U I O P while keeping fingers anchored.";
  }

  const def = LESSON_DEFINITIONS[suggestedLessonId];

  return {
    suggestedLessonId,
    lessonName: def.name,
    stageName: def.stage,
    headline,
    rationale,
    metrics: {
      wpm: safeWpm,
      accuracy: safeAcc,
    },
  };
}

export {
  evaluateComprehensivePlacement,
  PLACEMENT_DIAGNOSTIC_PASSAGE,
  type DetailedPlacementAnalysis,
  type PlacementInputMetrics,
  type SkillStageTier,
  type StageRecommendationOption,
} from "@/lib/lessons/lesson-placement-engine";
