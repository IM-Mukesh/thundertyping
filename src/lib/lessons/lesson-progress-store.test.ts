import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  useLessonProgressStore,
  isLessonUnlocked,
} from "@/lib/lessons/lesson-progress-store";

describe("lesson-progress-store: schema v2 persistence, migrations, and progress tracking", () => {
  beforeEach(() => {
    useLessonProgressStore.getState().resetProgress();
  });

  it("first lesson is unlocked by default; subsequent lessons are locked until predecessor completes", () => {
    const state = useLessonProgressStore.getState();
    assert.equal(isLessonUnlocked("home-row-left", state.units), true);
    assert.equal(isLessonUnlocked("home-row-right", state.units), false);

    // Complete home-row-left
    state.recordAttempt("home-row-left", {
      step: 1,
      totalSteps: 1,
      accuracy: 95,
      wpm: 35,
      typedChars: 50,
      correctChars: 48,
      incorrectChars: 2,
      elapsedMs: 15000,
      minAccuracy: 90,
    });

    const updated = useLessonProgressStore.getState().units;
    assert.equal(updated["home-row-left"]?.completed, true);
    assert.equal(isLessonUnlocked("home-row-right", updated), true);
  });

  it("recordAttempt updates currentStep, averages, and best metrics when passing", () => {
    const store = useLessonProgressStore.getState();
    const outcome = store.recordAttempt("home-row-left", {
      step: 1,
      totalSteps: 3,
      accuracy: 94,
      wpm: 40,
      typedChars: 60,
      correctChars: 56,
      incorrectChars: 4,
      elapsedMs: 12000,
      minAccuracy: 90,
    });

    assert.equal(outcome.passed, true);
    assert.equal(outcome.unitCompleted, false);

    const progress = useLessonProgressStore.getState().units["home-row-left"]!;
    assert.equal(progress.currentStep, 1);
    assert.equal(progress.bestWpm, 40);
    assert.equal(progress.bestAccuracy, 94);
    assert.equal(progress.attemptsCount, 1);
    assert.ok(progress.lastAttemptAt && progress.lastAttemptAt > 0);
  });

  it("recordAttempt does not advance step on failed accuracy", () => {
    const store = useLessonProgressStore.getState();
    const outcome = store.recordAttempt("home-row-left", {
      step: 1,
      totalSteps: 3,
      accuracy: 80, // minAccuracy is 90
      wpm: 50,
      typedChars: 60,
      correctChars: 48,
      incorrectChars: 12,
      elapsedMs: 10000,
      minAccuracy: 90,
    });

    assert.equal(outcome.passed, false);
    assert.equal(outcome.unitCompleted, false);

    const progress = useLessonProgressStore.getState().units["home-row-left"]!;
    assert.equal(progress.currentStep, 0); // didn't advance
  });

  it("exportProgress and importProgress round-trips state safely", () => {
    const store = useLessonProgressStore.getState();
    store.setLearnerGoal("speed-60");
    store.recordAttempt("home-row-left", {
      step: 1,
      totalSteps: 1,
      accuracy: 96,
      wpm: 52,
      typedChars: 100,
      correctChars: 96,
      incorrectChars: 4,
      elapsedMs: 20000,
      minAccuracy: 90,
    });

    const exportedJson = store.exportProgress();
    const exportedObj = JSON.parse(exportedJson);
    assert.equal(exportedObj.schemaVersion, 2);
    assert.equal(exportedObj.learnerGoal, "speed-60");

    // Reset store
    store.resetProgress();
    assert.equal(useLessonProgressStore.getState().learnerGoal, "touch-typing");
    assert.equal(Object.keys(useLessonProgressStore.getState().units).length, 0);

    // Import
    const success = useLessonProgressStore.getState().importProgress(exportedJson);
    assert.equal(success, true);

    const restored = useLessonProgressStore.getState();
    assert.equal(restored.learnerGoal, "speed-60");
    assert.equal(restored.units["home-row-left"]?.completed, true);
    assert.equal(restored.units["home-row-left"]?.bestWpm, 52);
  });

  it("importProgress safely rejects corrupted or invalid JSON payloads", () => {
    const store = useLessonProgressStore.getState();
    assert.equal(store.importProgress("not-json"), false);
    assert.equal(store.importProgress("{}"), false);
    assert.equal(store.importProgress(JSON.stringify({ units: "not an object" })), false);
  });

  it("unlockUpToLesson unlocks targeted lesson and completes all predecessors without overriding existing accomplishments", () => {
    const store = useLessonProgressStore.getState();
    // Initially lesson 5 ("top-row-left") is locked
    assert.equal(isLessonUnlocked("top-row-left", store.units), false);

    // Call unlockUpToLesson("top-row-left")
    store.unlockUpToLesson("top-row-left");

    const updated = useLessonProgressStore.getState();
    assert.equal(isLessonUnlocked("top-row-left", updated.units), true);
    assert.equal(updated.units["home-row-left"]?.completed, true);
    assert.equal(updated.units["home-row-right"]?.completed, true);
    assert.equal(updated.units["home-row-combined"]?.completed, true);
    assert.equal(updated.units["home-row-words"]?.completed, true);
    // target itself is unlocked for playing, but not marked completed yet
    assert.equal(updated.units["top-row-left"]?.completed ?? false, false);
  });

  it("hydrates the saved checkpoint and aggregate totals without inventing completion dates", () => {
    useLessonProgressStore.getState().replaceCloudUnits([{
      lesson_id: "home-row-left",
      completed: false,
      current_step: 2,
      stars: 4,
      best_wpm: 42,
      best_accuracy: 97,
      attempt_count: 3,
      total_time_ms: 12_500,
      completed_at: null,
      typed_chars: 120,
      correct_chars: 116,
      incorrect_chars: 4,
    }]);

    const state = useLessonProgressStore.getState();
    assert.equal(state.units["home-row-left"]?.currentStep, 2);
    assert.equal(state.units["home-row-left"]?.completedAt, 0);
    assert.equal(state.units["home-row-left"]?.totalTimeMs, 12_500);
    assert.deepEqual(state.totals, { typedChars: 120, correctChars: 116, incorrectChars: 4, timeMs: 12_500 });
  });
});
