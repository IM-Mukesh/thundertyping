import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluatePlacement } from "@/lib/lessons/lesson-placement";
import { LESSON_DEFINITIONS } from "@/lib/lessons/lesson-types";

describe("evaluatePlacement: deterministic starting point recommendation", () => {
  it("recommends home row for beginners or low accuracy", () => {
    const lowSpeed = evaluatePlacement(15, 92);
    assert.equal(lowSpeed.suggestedLessonId, "home-row-left");

    const lowAccuracy = evaluatePlacement(50, 75);
    assert.equal(lowAccuracy.suggestedLessonId, "home-row-left");
  });

  it("recommends top row for moderate accuracy and 25-37 WPM", () => {
    const rec = evaluatePlacement(30, 88);
    assert.equal(rec.suggestedLessonId, "top-row-left");
  });

  it("recommends full keyboard for 38-49 WPM with solid accuracy", () => {
    const rec = evaluatePlacement(42, 89);
    assert.equal(rec.suggestedLessonId, "full-keyboard-words");
  });

  it("recommends intermediate everyday sentences for 50-69 WPM", () => {
    const rec = evaluatePlacement(55, 90);
    assert.equal(rec.suggestedLessonId, "everyday-sentences");
  });

  it("recommends advanced speed endurance for 70+ WPM with 90%+ accuracy", () => {
    const rec = evaluatePlacement(75, 95);
    assert.equal(rec.suggestedLessonId, "speed-endurance");
  });

  it("handles negative and non-finite inputs safely without throwing", () => {
    const rec = evaluatePlacement(NaN, Infinity);
    assert.equal(rec.suggestedLessonId, "home-row-left");
    assert.equal(rec.metrics.wpm, 0);
  });

  it("suggestedLessonId is always a valid key in LESSON_DEFINITIONS", () => {
    const testCases = [
      [10, 95],
      [28, 85],
      [45, 89],
      [60, 91],
      [80, 94],
    ];
    for (const [w, a] of testCases) {
      const rec = evaluatePlacement(w, a);
      assert.ok(rec.suggestedLessonId in LESSON_DEFINITIONS);
      assert.ok(rec.lessonName.length > 0);
    }
  });
});
