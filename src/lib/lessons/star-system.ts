import type { LessonStage, LessonTier } from "@/lib/lessons/lesson-types";
import { FINGER_LABELS, fingerForKey } from "@/lib/lessons/keyboard-layout";

export type StarCount = 1 | 2 | 3 | 4 | 5;

export interface StarEvaluationInput {
  accuracy: number;
  wpm: number;
  minAccuracy?: number;
  stage: LessonStage;
  tier: LessonTier;
  errorCount: number;
  keyOutcomes?: Record<string, boolean[]>;
  newKeys?: readonly string[];
  stepNumber?: number;
  totalSteps?: number;
  consecutiveRetries?: number;
}

export interface StarRatingResult {
  stars: StarCount;
  passed: boolean;
  headline: string;
  feedback: string;
  mistakeSummary?: string;
  weaknessFeedback?: string;
  retryFocusKeys?: string[];
  recommendedAction: "continue" | "retry" | "practice";
}

/**
 * Exact progression boundary: 60% accuracy is the minimum required to move forward.
 */
export function calculateLessonPass(accuracy: number): boolean {
  return accuracy >= 60;
}

/**
 * Pure, deterministic touch-typing star rating calculation (1-5 Stars).
 *
 * Scoring Philosophy:
 * - 5 Stars: 94%+ accuracy AND 25+ WPM (or near-perfect 98%+ in beginner tier).
 * - 4 Stars: 88%+ accuracy (with reasonable pace, or 94%+ accuracy with lower speed).
 * - 3 Stars: 60%+ accuracy (PASS threshold - good enough to advance).
 * - 2 Stars: 40% - 59.9% accuracy (Needs improvement, retry required).
 * - 1 Star:  <40% accuracy (Significant mistakes, deliberate retry required).
 */
export function calculateLessonStars(
  accuracy: number,
  wpm: number,
  options?: { isBeginner?: boolean }
): StarCount {
  const isBeginner = options?.isBeginner ?? false;

  // 5 Stars: 94%+ accuracy AND 25+ WPM (explicit non-negotiable rule)
  if (accuracy >= 94 && wpm >= 25) {
    return 5;
  }
  // 5 Stars: Near-perfect accuracy (98%+) with solid control
  if (accuracy >= 98 && (isBeginner || wpm >= 20)) {
    return 5;
  }

  // 4 Stars: High accuracy (94%+) with lower WPM, or 88%+ accuracy with solid control
  if (accuracy >= 94) {
    return 4;
  }
  if (accuracy >= 88 && (isBeginner || wpm >= 18)) {
    return 4;
  }

  // 3 Stars: 60%+ accuracy (PASS: good enough to advance)
  if (accuracy >= 60) {
    return 3;
  }

  // 2 Stars: 40% - 59.9% (Almost there, but requires retry)
  if (accuracy >= 40) {
    return 2;
  }

  // 1 Star: Heavy mistakes (<40%)
  return 1;
}

/**
 * Comprehensive evaluation of touch-typing performance, producing
 * human-centered, constructive feedback and actionable weakness remediation.
 */
export function evaluateLessonStars(input: StarEvaluationInput): StarRatingResult {
  const { accuracy, wpm, keyOutcomes, newKeys, errorCount } = input;
  const isBeginner = input.tier === "beginner";
  const passed = calculateLessonPass(accuracy);
  const stars = calculateLessonStars(accuracy, wpm, { isBeginner });

  let headline: string;
  let feedback: string;
  let mistakeSummary: string | undefined;

  if (stars === 5) {
    if (accuracy === 100 && errorCount === 0) {
      headline = "PERFECT RUN";
      feedback = "Flawless precision and outstanding cadence. Touch typing at its finest!";
    } else {
      headline = "EXCELLENT RUN";
      feedback = "Outstanding control and swift pace. You've thoroughly mastered this challenge.";
    }
  } else if (stars === 4) {
    headline = "GREAT CONTROL!";
    if (accuracy >= 94 && wpm < 25) {
      feedback = "Excellent accuracy! With a little more practice, you'll easily push your speed past 25 WPM.";
    } else {
      feedback = "Very strong accuracy and clean keystroke rhythm. Ready to build even higher speed.";
    }
  } else if (stars === 3) {
    headline = "GOOD JOB!";
    feedback = "You reached the 60% accuracy needed to move forward. Your muscle memory is locking in.";
  } else if (stars === 2) {
    headline = "ALMOST THERE";
    feedback = `Your accuracy was ${Math.round(accuracy)}%. You need at least 60% to move forward. A short retry will help lock in these keys.`;
    mistakeSummary = errorCount > 0
      ? `You made ${errorCount} mistake${errorCount === 1 ? "" : "s"} (${Math.round(accuracy)}% accuracy). Needed: 60%.`
      : `Accuracy was ${Math.round(accuracy)}%. 60% minimum needed to move forward.`;
  } else {
    headline = "LET'S BUILD THIS FIRST";
    feedback = "These key combinations need a bit more practice before moving on. Slow down and focus on relaxed finger taps.";
    mistakeSummary = errorCount > 0
      ? `You made ${errorCount} mistake${errorCount === 1 ? "" : "s"} (${Math.round(accuracy)}% accuracy). Focus on accuracy over speed.`
      : `Accuracy was ${Math.round(accuracy)}%. Needed: 60%.`;
  }

  // Diagnose specific weakness and extract problem keys
  let weaknessFeedback: string | undefined;
  let retryFocusKeys: string[] | undefined;

  if (keyOutcomes && Object.keys(keyOutcomes).length > 0) {
    const keyErrorStats: { key: string; errors: number; total: number; acc: number }[] = [];

    for (const [k, attempts] of Object.entries(keyOutcomes)) {
      if (!k || k === " ") continue;
      const total = attempts.length;
      if (total === 0) continue;
      const errors = attempts.filter((correct) => !correct).length;
      const acc = Math.round(((total - errors) / total) * 100);
      keyErrorStats.push({ key: k, errors, total, acc });
    }

    keyErrorStats.sort((a, b) => b.errors - a.errors || a.acc - b.acc);
    const worstKeys = keyErrorStats.filter((k) => k.errors > 0);

    if (worstKeys.length > 0) {
      const worst = worstKeys[0];
      const finger = fingerForKey(worst.key);
      const fingerName = finger ? FINGER_LABELS[finger].toLowerCase() : "finger";

      const affectedKeysList = worstKeys
        .slice(0, 3)
        .map((k) => (k.key === " " ? "SPACE" : k.key.toUpperCase()))
        .join(" · ");

      if (!passed || stars <= 3) {
        weaknessFeedback = `Most affected: ${affectedKeysList}. Keep your hands rested on home row and strike with your ${fingerName}.`;
      }
      retryFocusKeys = worstKeys.slice(0, 2).map((k) => k.key);
    } else if (!passed) {
      weaknessFeedback = "Take a breath and focus on an even, relaxed alternating rhythm.";
      if (newKeys && newKeys.length > 0) {
        retryFocusKeys = [...newKeys];
      }
    }
  }

  return {
    stars,
    passed,
    headline,
    feedback,
    mistakeSummary,
    weaknessFeedback,
    retryFocusKeys,
    recommendedAction: passed ? "continue" : "retry",
  };
}
