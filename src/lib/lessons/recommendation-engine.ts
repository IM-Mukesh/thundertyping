import { LESSON_LIST } from "@/lib/lessons/lesson-types";
import type { LessonProgressState, LearnerGoal } from "@/lib/lessons/lesson-progress-store";
import type { KeyStat } from "@/lib/lessons/key-performance";
import { getWeakKeys } from "@/lib/lessons/key-performance";

export type RecommendationType =
  | "remediation-weak-key"
  | "remediation-transition"
  | "remediation-finger"
  | "continue-curriculum"
  | "spaced-review"
  | "goal-challenge"
  | "placement-assessment";

export interface PersonalizedRecommendation {
  type: RecommendationType;
  priority: number; // Lower is higher priority (1 = highest)
  title: string;
  detail: string;
  rationale: string;
  estimatedMinutes: number;
  href: string;
  badge?: string;
  targetKeys?: string[];
  targetTransitions?: [string, string][];
}

export interface RecommendationContext {
  units: LessonProgressState["units"];
  keyStats: Readonly<Record<string, KeyStat>>;
  transitions?: Readonly<Record<string, { attempts: number; errors: number }>>;
  learnerGoal?: LearnerGoal;
  lastPracticedAt?: number;
  userWpm?: number;
}

const DEFAULT_ASSUMED_WPM = 30;

function computePacedMinutes(wordCount: number, userWpm?: number): number {
  const effectiveWpm = userWpm && userWpm >= 15 ? userWpm : DEFAULT_ASSUMED_WPM;
  return Math.max(1, Math.round(Math.max(1, wordCount) / effectiveWpm));
}

/**
 * Builds personalized, explainable learning recommendations based on the student's
 * current curriculum position, diagnosed weaknesses, spaced review needs, and goal.
 */
export function generateRecommendations(context: RecommendationContext): PersonalizedRecommendation[] {
  const recommendations: PersonalizedRecommendation[] = [];
  const goal = context.learnerGoal ?? "touch-typing";
  const userWpm = context.userWpm;

  // 1. Check for chronic weak keys (Confidence-weighted)
  const weakKeys = getWeakKeys(context.keyStats, { minAttempts: 6, accuracyThreshold: 90 });
  if (weakKeys.length > 0) {
    const focus = weakKeys.slice(0, 3);
    recommendations.push({
      type: "remediation-weak-key",
      priority: 1,
      title: "Weak Key Remediation",
      detail: `Reinforce ${focus.map((k) => (k === " " ? "space" : k.toUpperCase())).join(", ")}`,
      rationale: `Your accuracy on ${focus.join(", ")} is below 90%. Stabilizing this reach prevents errors from compounding.`,
      estimatedMinutes: 2,
      href: `/lessons/practice?mode=weak-keys&keys=${encodeURIComponent(focus.join(","))}`,
      badge: "High Priority",
      targetKeys: focus,
    });
  }

  // 2. Check for chronic transition bottlenecks
  if (context.transitions) {
    const problematicTransitions = Object.entries(context.transitions)
      .filter(([, s]) => s.attempts >= 5 && (s.errors / s.attempts) >= 0.2) // >= 20% error rate
      .sort((a, b) => b[1].errors / b[1].attempts - a[1].errors / a[1].attempts)
      .slice(0, 2);

    if (problematicTransitions.length > 0) {
      const pairs = problematicTransitions.map(([p]) => p);
      recommendations.push({
        type: "remediation-transition",
        priority: 2,
        title: "Difficult Transition Drill",
        detail: `Smooth out letter pairs: ${pairs.map((p) => p.toUpperCase()).join(", ")}`,
        rationale: `Frequent hesitations detected when transitioning between ${pairs.join(" and ")}.`,
        estimatedMinutes: 2,
        href: `/lessons/practice?mode=transitions&pairs=${encodeURIComponent(pairs.join(","))}`,
        badge: "Finger Flow",
        targetTransitions: problematicTransitions.map(([p]) => [p[0], p[1]] as [string, string]),
      });
    }
  }

  // 3. Curriculum continuation
  const inProgress = LESSON_LIST.find((l) => {
    const p = context.units[l.id];
    return p && !p.completed && p.currentStep > 0;
  });
  const nextFresh = LESSON_LIST.find((l) => !context.units[l.id]?.completed);
  const targetUnit = inProgress ?? nextFresh;

  if (targetUnit) {
    const isResume = Boolean(inProgress);
    const inProgressProgress = inProgress ? context.units[inProgress.id] : undefined;
    const stepNumber = inProgressProgress ? inProgressProgress.currentStep + 1 : 1;
    recommendations.push({
      type: "continue-curriculum",
      priority: 3,
      title: isResume ? `Continue ${targetUnit.name}` : `Start ${targetUnit.name}`,
      detail: isResume ? `Resume at Step ${stepNumber} of ${targetUnit.subLessonCount}` : targetUnit.instructions[0],
      rationale: `Advance your structured touch typing track in the ${targetUnit.tier.toUpperCase()} tier.`,
      estimatedMinutes: computePacedMinutes(targetUnit.content.wordCount * 1.5, userWpm),
      href: `/lessons/${targetUnit.id}`,
      badge: isResume ? "In Progress" : "Next Up",
    });
  }

  // 4. Spaced Review check: Identify completed units that haven't been practiced recently
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const staleCompletedUnits = LESSON_LIST.filter((l) => {
    const p = context.units[l.id];
    if (!p || !p.completed) return false;
    const lastActive = p.lastAttemptAt ?? p.completedAt ?? 0;
    return lastActive > 0 && now - lastActive > SEVEN_DAYS_MS;
  });

  if (staleCompletedUnits.length > 0) {
    const reviewTarget = staleCompletedUnits[0];
    recommendations.push({
      type: "spaced-review",
      priority: 4,
      title: `Spaced Review: ${reviewTarget.name}`,
      detail: "Refresh motor pathways on previously mastered keys",
      rationale: `It has been over 7 days since you completed ${reviewTarget.name}. A quick review preserves automaticity.`,
      estimatedMinutes: 2,
      href: `/lessons/${reviewTarget.id}`,
      badge: "Memory Refresh",
    });
  }

  // 5. Goal-specific challenge drill
  if (goal === "accuracy") {
    recommendations.push({
      type: "goal-challenge",
      priority: 5,
      title: "Accuracy Shield Drill",
      detail: "Zero-error practice with strict 98% accuracy threshold",
      rationale: "Aligns with your Precision First goal to completely eliminate look-down slips.",
      estimatedMinutes: 3,
      href: "/lessons/practice?mode=accuracy",
      badge: "Goal Focus",
    });
  } else if (goal === "coding") {
    recommendations.push({
      type: "goal-challenge",
      priority: 5,
      title: "Code Syntax & Symbols",
      detail: "Practice braces, camelCase, arrows, and operator spacing",
      rationale: "Aligns with your Developer goal to type programming syntax without glancing down.",
      estimatedMinutes: 3,
      href: "/lessons/practice?mode=coding",
      badge: "Developer",
    });
  } else if (goal === "speed-60" || goal === "speed-80") {
    recommendations.push({
      type: "goal-challenge",
      priority: 5,
      title: "Speed Cadence Sprint",
      detail: "Burst typing to raise your comfortable speed ceiling",
      rationale: `Targeted sprint designed to bridge towards ${goal === "speed-80" ? "80+" : "60"} WPM.`,
      estimatedMinutes: 2,
      href: "/lessons/practice?mode=speed",
      badge: "Speed Burst",
    });
  }

  // Fallback if everything is mastered
  if (recommendations.length === 0) {
    recommendations.push({
      type: "goal-challenge",
      priority: 5,
      title: "Mastery Maintenance",
      detail: "All curriculum units cleared! Keep your reflexes sharp with full-prose practice.",
      rationale: "Regular natural-text practice maintains your top-tier speed and precision.",
      estimatedMinutes: 3,
      href: "/lessons/practice",
      badge: "All Mastered",
    });
  }

  // Sort by priority and cap at top 3
  return recommendations.sort((a, b) => a.priority - b.priority).slice(0, 3);
}
