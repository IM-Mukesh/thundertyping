import { LESSON_LIST } from "@/lib/lessons/lesson-types";
import type { LessonProgressState } from "@/lib/lessons/lesson-progress-store";
import { round } from "@/lib/typing-engine/stats";

// Unlike the game achievements (ACHIEVEMENT_LIST in profile/achievements.ts),
// lesson achievements are not events a one-off unlock call records -- every
// condition here is already sitting in useLessonProgressStore's `units`/
// `totals`, so "earned" is computed fresh each render instead of a second,
// timestamped "earned" record that could drift from the progress it's
// describing. That does mean no "earned on <date>" -- an honest trade for
// not duplicating state.

export interface LessonAchievementDef {
  id: string;
  name: string;
  description: string;
}

const BEGINNER_COUNT = LESSON_LIST.filter((l) => l.tier === "beginner").length;
const INTERMEDIATE_COUNT = LESSON_LIST.filter((l) => l.tier === "intermediate").length;
const TOTAL_COUNT = LESSON_LIST.length;
const QUICK_STUDY_WPM = 40;

export const LESSON_ACHIEVEMENT_LIST: readonly LessonAchievementDef[] = [
  { id: "lessons:first-unit", name: "First Steps", description: "Complete your first lesson unit." },
  {
    id: "lessons:beginner-graduate",
    name: "Beginner Graduate",
    description: `Complete all ${BEGINNER_COUNT} Beginner units -- the whole keyboard, home row to numbers.`,
  },
  {
    id: "lessons:intermediate-graduate",
    name: "Intermediate Graduate",
    description: `Complete all ${INTERMEDIATE_COUNT} Intermediate units of real-sentence practice.`,
  },
  {
    id: "lessons:keyboard-master",
    name: "Keyboard Master",
    description: `Complete the entire ${TOTAL_COUNT}-unit curriculum, Beginner through Advanced.`,
  },
  {
    id: "lessons:quick-study",
    name: "Quick Study",
    description: `Average ${QUICK_STUDY_WPM}+ WPM on any completed unit.`,
  },
];

export function computeLessonAchievements(units: LessonProgressState["units"]): Record<string, boolean> {
  const completedIds = new Set(Object.entries(units).filter(([, p]) => p?.completed).map(([id]) => id));
  const completedCount = completedIds.size;
  const byTier = (tier: string) => LESSON_LIST.filter((l) => l.tier === tier).every((l) => completedIds.has(l.id));
  const anyQuickStudy = Object.values(units).some((p) => p?.completed && round(p.avgWpm) >= QUICK_STUDY_WPM);

  return {
    "lessons:first-unit": completedCount >= 1,
    "lessons:beginner-graduate": byTier("beginner"),
    "lessons:intermediate-graduate": byTier("intermediate"),
    "lessons:keyboard-master": completedCount >= TOTAL_COUNT,
    "lessons:quick-study": anyQuickStudy,
  };
}
