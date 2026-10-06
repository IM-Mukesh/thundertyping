/**
 * The daily recommendation engine: pure, deterministic, driven directly.
 * Same reasoning as lessons.test.ts -- a wrong rule order here silently
 * changes what every user is told to do next.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getTodaysTraining, type TodaysTrainingInput } from "@/lib/lessons/today-training";
import { LESSON_LIST } from "@/lib/lessons/lesson-types";
import { VOCAB_DIFFICULTIES, VOCAB_WORDS } from "@/lib/vocabulary/vocabulary-words";
import type { LessonProgressState } from "@/lib/lessons/lesson-progress-store";
import type { VocabProgress } from "@/lib/vocabulary/vocabulary-progress";

function emptyVocabProgress(): VocabProgress {
  const progress = {} as VocabProgress;
  for (const d of VOCAB_DIFFICULTIES) progress[d] = { mastered: [], bestWpm: 0, bestAccuracy: 0, sessionsCompleted: 0 };
  return progress;
}

function fullyMasteredVocabProgress(): VocabProgress {
  const progress = {} as VocabProgress;
  for (const d of VOCAB_DIFFICULTIES) {
    progress[d] = {
      mastered: VOCAB_WORDS[d].map((w) => w.word),
      bestWpm: 60,
      bestAccuracy: 100,
      sessionsCompleted: 3,
    };
  }
  return progress;
}

function baseInput(overrides: Partial<TodaysTrainingInput> = {}): TodaysTrainingInput {
  return {
    units: {},
    keyStats: {},
    vocabProgress: emptyVocabProgress(),
    ...overrides,
  };
}

describe("getTodaysTraining", () => {
  it("never returns an empty list", () => {
    assert.ok(getTodaysTraining(baseInput()).length > 0);
  });

  it("a brand-new user is recommended the very first lesson", () => {
    const actions = getTodaysTraining(baseInput());
    const lessonAction = actions.find((a) => a.type === "continue-lesson");
    assert.ok(lessonAction);
    assert.equal(lessonAction!.href, `/lessons/${LESSON_LIST[0].id}`);
  });

  it("a weak key with enough data is recommended first", () => {
    const actions = getTodaysTraining(
      baseInput({ keyStats: { p: { attempts: 20, errors: 10 } } }),
    );
    assert.equal(actions[0].type, "weak-key-drill");
  });

  it("a key with too few attempts is not treated as weak", () => {
    const actions = getTodaysTraining(baseInput({ keyStats: { p: { attempts: 2, errors: 2 } } }));
    assert.ok(actions.every((a) => a.type !== "weak-key-drill"));
  });

  it("resumes an in-progress unit rather than starting the next one", () => {
    const units: LessonProgressState["units"] = {
      [LESSON_LIST[0].id]: {
        completed: false,
        currentStep: 2,
        passCount: 2,
        avgAccuracy: 95,
        avgWpm: 30,
        totalTimeMs: 1000,
        completedAt: 0,
      },
    };
    const actions = getTodaysTraining(baseInput({ units }));
    const lessonAction = actions.find((a) => a.type === "continue-lesson");
    assert.equal(lessonAction!.href, `/lessons/${LESSON_LIST[0].id}`);
    assert.equal(lessonAction!.label, "Continue lesson");
  });

  it("a completed unit is not recommended again as continue/start", () => {
    const units: LessonProgressState["units"] = {
      [LESSON_LIST[0].id]: {
        completed: true,
        currentStep: 99,
        passCount: 5,
        avgAccuracy: 95,
        avgWpm: 30,
        totalTimeMs: 1000,
        completedAt: Date.now(),
      },
    };
    const actions = getTodaysTraining(baseInput({ units }));
    const lessonAction = actions.find((a) => a.type === "continue-lesson");
    assert.equal(lessonAction!.href, `/lessons/${LESSON_LIST[1].id}`);
  });

  it("recommends vocabulary review when a tier isn't fully mastered", () => {
    const actions = getTodaysTraining(baseInput());
    assert.ok(actions.some((a) => a.type === "vocabulary-review"));
  });

  it("falls back to a speed challenge once everything is mastered", () => {
    const units: LessonProgressState["units"] = {};
    for (const unit of LESSON_LIST) {
      units[unit.id] = {
        completed: true,
        currentStep: unit.subLessonCount,
        passCount: 1,
        avgAccuracy: 95,
        avgWpm: 40,
        totalTimeMs: 1000,
        completedAt: Date.now(),
      };
    }
    const actions = getTodaysTraining(baseInput({ units, vocabProgress: fullyMasteredVocabProgress() }));
    assert.equal(actions.length, 1);
    assert.equal(actions[0].type, "speed-challenge");
    assert.equal(actions[0].href, "/games/ghost-racer");
  });

  it("every returned action has a positive, finite estimatedMinutes", () => {
    const actions = getTodaysTraining(baseInput({ keyStats: { p: { attempts: 20, errors: 15 } } }));
    for (const action of actions) {
      assert.ok(Number.isFinite(action.estimatedMinutes));
      assert.ok(action.estimatedMinutes > 0);
    }
  });
});
