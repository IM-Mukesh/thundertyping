import { LESSON_DEFINITIONS, type LessonId } from "@/lib/lessons/lesson-types";
import type { WordState } from "@/lib/typing-engine/engine-types";

export interface PlacementInputMetrics {
  wpm: number;
  rawWpm?: number;
  accuracy: number;
  consistency?: number;
  elapsedMs: number;
  wordStates?: readonly WordState[];
}

export type SkillStageTier = "foundation" | "developing" | "competent" | "fluent" | "advanced";

export interface StageRecommendationOption {
  lessonId: LessonId;
  lessonName: string;
  stageName: string;
  tier: "beginner" | "intermediate" | "advanced";
  label: string;
  description: string;
}

export interface DetailedPlacementAnalysis {
  tier: SkillStageTier;
  headline: string;
  summary: string;
  rationale: string;
  metrics: {
    wpm: number;
    accuracy: number;
    consistency: number;
  };
  strengths: string[];
  focusAreas: string[];
  rowBreakdown: {
    homeRowAcc: number;
    topRowAcc: number;
    bottomRowAcc: number;
  };
  recommendedStart: StageRecommendationOption;
  startFromBeginning: StageRecommendationOption;
  challengeTrack: StageRecommendationOption;
}

export const PLACEMENT_DIAGNOSTIC_PASSAGE =
  "Quick brown foxes jump over lazy dogs while warm sunlight streams into the quiet room. Take your time, breathe calmly, and keep your hands anchored on the home row.";

/**
 * Evaluates a placement test attempt with multi-dimensional pedagogical analysis.
 * Prioritizes technique and accuracy over raw unanchored speed.
 */
export function evaluateComprehensivePlacement(
  input: PlacementInputMetrics,
): DetailedPlacementAnalysis {
  const safeWpm = Math.max(0, Math.round(Number.isFinite(input.wpm) ? input.wpm : 0));
  const safeAcc = Math.max(0, Math.min(100, Math.round(Number.isFinite(input.accuracy) ? input.accuracy : 0)));
  const safeConsistency = Math.max(0, Math.min(100, Math.round(Number.isFinite(input.consistency ?? 80) ? (input.consistency ?? 80) : 80)));

  // Row breakdown analysis if wordStates are available
  let homeAttempts = 0, homeErrors = 0;
  let topAttempts = 0, topErrors = 0;
  let bottomAttempts = 0, bottomErrors = 0;

  if (input.wordStates && input.wordStates.length > 0) {
    const HOME_SET = new Set(["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"]);
    const TOP_SET = new Set(["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"]);
    const BOTTOM_SET = new Set(["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"]);

    for (const w of input.wordStates) {
      for (let i = 0; i < w.target.length; i++) {
        const char = w.target[i].toLowerCase();
        const isCorrect = w.chars[i] === "correct";

        if (HOME_SET.has(char)) {
          homeAttempts++;
          if (!isCorrect) homeErrors++;
        } else if (TOP_SET.has(char)) {
          topAttempts++;
          if (!isCorrect) topErrors++;
        } else if (BOTTOM_SET.has(char)) {
          bottomAttempts++;
          if (!isCorrect) bottomErrors++;
        }
      }
    }
  }

  const homeRowAcc = homeAttempts > 0 ? Math.round(((homeAttempts - homeErrors) / homeAttempts) * 100) : safeAcc;
  const topRowAcc = topAttempts > 0 ? Math.round(((topAttempts - topErrors) / topAttempts) * 100) : safeAcc;
  const bottomRowAcc = bottomAttempts > 0 ? Math.round(((bottomAttempts - bottomErrors) / bottomAttempts) * 100) : safeAcc;

  // Derive strengths and focus areas
  const strengths: string[] = [];
  const focusAreas: string[] = [];

  if (safeAcc >= 95) strengths.push("Excellent keystroke accuracy (95%+)");
  else if (safeAcc >= 90) strengths.push("Good general accuracy baseline");
  else focusAreas.push("Stabilizing accuracy above 90% before accelerating");

  if (homeRowAcc >= 95) strengths.push("Strong home row tactile anchoring");
  else focusAreas.push("Re-anchoring home row discipline on F and J");

  if (safeWpm >= 50) strengths.push("Fluent typing cadence");
  else if (safeWpm >= 30) strengths.push("Consistent typing rhythm");
  else focusAreas.push("Eliminating hesitations on letter reaches");

  if (topRowAcc < 88) focusAreas.push("Upward vertical finger reach precision");
  if (bottomRowAcc < 85) focusAreas.push("Downward reach control and return-to-home");

  // Determine stage tier based on both speed AND accuracy
  let tier: SkillStageTier = "foundation";
  let recommendedLessonId: LessonId = "home-row-left";
  let challengeLessonId: LessonId = "top-row-left";
  let headline = "Home Row Foundations";
  let summary = "Build tactile muscle memory from scratch with zero looking down.";
  let rationale =
    "Focus on tactile touch-typing habits from the home row (A S D F J K L ;) without glancing down at the keyboard. This establishes a high speed ceiling.";

  if (safeAcc >= 94 && safeWpm >= 70) {
    tier = "advanced";
    recommendedLessonId = "speed-endurance";
    challengeLessonId = "numbers-and-symbols-mastery";
    headline = "Advanced Speed & Cadence";
    summary = "High baseline speed detected. Hone long-form endurance, consistency, and symbol control.";
    rationale =
      "Your baseline touch typing is fluent and disciplined. Focus on sustaining 70+ WPM cadence across longer passages, symbols, and complex technical syntax.";
  } else if (safeAcc >= 90 && safeWpm >= 50) {
    tier = "fluent";
    recommendedLessonId = "everyday-sentences";
    challengeLessonId = "speed-endurance";
    headline = "Intermediate Prose & Sentence Flow";
    summary = "Solid core dexterity. Transition from isolated key reaches to natural sentence rhythm.";
    rationale =
      "Your physical key reaches are consistent. Training natural prose, capitalization, and punctuation cadence will unlock seamless 60+ WPM fluency.";
  } else if (safeAcc >= 86 && safeWpm >= 35) {
    tier = "competent";
    recommendedLessonId = "full-keyboard-words";
    challengeLessonId = "everyday-sentences";
    headline = "Full Keyboard Integration";
    summary = "Comfortable with most reaches. Bridge home, top, and bottom rows into full vocabulary.";
    rationale =
      "You have good familiarity with the alphabet. Reinforcing multi-row transitions and number reaches will solidify your finger ownership.";
  } else if (safeAcc >= 82 && safeWpm >= 22) {
    tier = "developing";
    recommendedLessonId = "top-row-left";
    challengeLessonId = "full-keyboard-words";
    headline = "Top Row Finger Reaches";
    summary = "Basic typing familiarity detected. Expand upward from home row with strict finger ownership.";
    rationale =
      "You can strike keys comfortably. Practicing upward reaches to Q W E R T Y while keeping index fingers anchored on F and J will boost your consistency.";
  }

  const defRec = LESSON_DEFINITIONS[recommendedLessonId];
  const defFirst = LESSON_DEFINITIONS["home-row-left"];
  const defChal = LESSON_DEFINITIONS[challengeLessonId];

  return {
    tier,
    headline,
    summary,
    rationale,
    metrics: {
      wpm: safeWpm,
      accuracy: safeAcc,
      consistency: safeConsistency,
    },
    strengths: strengths.slice(0, 3),
    focusAreas: focusAreas.slice(0, 3),
    rowBreakdown: {
      homeRowAcc,
      topRowAcc,
      bottomRowAcc,
    },
    recommendedStart: {
      lessonId: recommendedLessonId,
      lessonName: defRec.name,
      stageName: defRec.stage,
      tier: defRec.tier,
      label: "Recommended Starting Point",
      description: `Starts at ${defRec.name} matching your diagnosed skill level.`,
    },
    startFromBeginning: {
      lessonId: "home-row-left",
      lessonName: defFirst.name,
      stageName: defFirst.stage,
      tier: defFirst.tier,
      label: "Start from Lesson 1",
      description: "Build clean touch typing habits from the ground up.",
    },
    challengeTrack: {
      lessonId: challengeLessonId,
      lessonName: defChal.name,
      stageName: defChal.stage,
      tier: defChal.tier,
      label: "Challenge Track",
      description: `Skip ahead to ${defChal.name} for an accelerated challenge.`,
    },
  };
}
