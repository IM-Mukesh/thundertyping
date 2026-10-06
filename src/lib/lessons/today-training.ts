import { LESSON_LIST } from "@/lib/lessons/lesson-types";
import type { LessonProgressState } from "@/lib/lessons/lesson-progress-store";
import { getWeakKeys, type KeyStat } from "@/lib/lessons/key-performance";
import { VOCAB_DIFFICULTIES, VOCAB_WORDS } from "@/lib/vocabulary/vocabulary-words";
import type { VocabProgress } from "@/lib/vocabulary/vocabulary-progress";
import { SESSION_WORD_COUNT } from "@/lib/vocabulary/vocabulary-content";

export type TrainingActionType = "weak-key-drill" | "continue-lesson" | "vocabulary-review" | "speed-challenge";

export interface TrainingAction {
  type: TrainingActionType;
  label: string;
  detail: string;
  estimatedMinutes: number;
  href: string;
}

// A rough, honestly-labeled pace used only to turn a word count into an
// "estimated minutes" figure — not a claim about this specific learner's
// speed (that would need their own wpm, which a brand-new user doesn't have
// yet). Kept as one named constant so every estimate in this file is
// consistent and easy to reconsider later, rather than a scatter of magic
// numbers.
const ASSUMED_WPM = 30;

function estimateMinutes(wordCount: number): number {
  return Math.max(1, Math.round(Math.max(1, wordCount) / ASSUMED_WPM));
}

export interface TodaysTrainingInput {
  units: LessonProgressState["units"];
  keyStats: Readonly<Record<string, KeyStat>>;
  vocabProgress: VocabProgress;
}

/**
 * Deterministic, rule-based recommendations — no ML, nothing invented.
 * Every action here must be traceable to real stored data; see
 * getWeakKeys/isLessonUnlocked for the data this reads. Order is priority,
 * not chronology: a weak-key drill outranks continuing the curriculum
 * because fixing a live weakness compounds, and never returns an empty
 * list — there is always at least a next real step for the user to take.
 */
export function getTodaysTraining(input: TodaysTrainingInput): TrainingAction[] {
  const actions: TrainingAction[] = [];

  const weakKeys = getWeakKeys(input.keyStats);
  if (weakKeys.length > 0) {
    const shown = weakKeys.slice(0, 3);
    actions.push({
      type: "weak-key-drill",
      label: "Weak key drill",
      detail: `Practice ${shown.join(", ")}`,
      estimatedMinutes: 2,
      href: "/lessons/practice",
    });
  }

  const lessonAction = findLessonAction(input.units);
  if (lessonAction) actions.push(lessonAction);

  const vocabAction = findVocabAction(input.vocabProgress);
  if (vocabAction) actions.push(vocabAction);

  if (actions.length === 0) {
    actions.push({
      type: "speed-challenge",
      label: "Speed challenge",
      detail: "Every lesson and vocabulary tier is mastered — go for speed",
      estimatedMinutes: 3,
      href: "/games/ghost-racer",
    });
  }

  return actions.slice(0, 3);
}

function findLessonAction(units: LessonProgressState["units"]): TrainingAction | null {
  // Prefer resuming a unit already in progress over starting a fresh one.
  const inProgress = LESSON_LIST.find((l) => {
    const p = units[l.id];
    return p && !p.completed && p.currentStep > 0;
  });
  const target = inProgress ?? LESSON_LIST.find((l) => !units[l.id]?.completed);
  if (!target) return null;

  const isResume = Boolean(inProgress);
  return {
    type: "continue-lesson",
    label: isResume ? "Continue lesson" : "Start next lesson",
    detail: target.name,
    estimatedMinutes: estimateMinutes(target.content.wordCount),
    href: `/lessons/${target.id}`,
  };
}

function findVocabAction(vocabProgress: VocabProgress): TrainingAction | null {
  const tier = VOCAB_DIFFICULTIES.find((d) => vocabProgress[d].mastered.length < VOCAB_WORDS[d].length);
  if (!tier) return null;

  return {
    type: "vocabulary-review",
    label: "Vocabulary review",
    detail: `${tier[0].toUpperCase()}${tier.slice(1)} tier`,
    estimatedMinutes: estimateMinutes(SESSION_WORD_COUNT),
    href: `/vocabulary/${tier}`,
  };
}
