import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateComprehensivePlacement,
  PLACEMENT_DIAGNOSTIC_PASSAGE,
  type PlacementInputMetrics,
} from "@/lib/lessons/lesson-placement-engine";
import { LESSON_DEFINITIONS } from "@/lib/lessons/lesson-types";

describe("lesson-placement-engine: multi-dimensional diagnostic placement evaluation", () => {
  it("PLACEMENT_DIAGNOSTIC_PASSAGE covers full alphabet and home row anchors", () => {
    assert.ok(PLACEMENT_DIAGNOSTIC_PASSAGE.length > 50);
    const lower = PLACEMENT_DIAGNOSTIC_PASSAGE.toLowerCase();
    // Covers key touch typing letters
    assert.ok(["a", "f", "j", "z", "q", "p"].every((c) => lower.includes(c)));
  });

  it("recommends foundation tier for beginners or low accuracy", () => {
    const input: PlacementInputMetrics = {
      wpm: 18,
      rawWpm: 22,
      accuracy: 78,
      consistency: 65,
      elapsedMs: 25000,
    };
    const analysis = evaluateComprehensivePlacement(input);
    assert.equal(analysis.tier, "foundation");
    assert.equal(analysis.recommendedStart.lessonId, "home-row-left");
    assert.equal(analysis.recommendedStart.tier, "beginner");
    assert.ok(analysis.recommendedStart.lessonId in LESSON_DEFINITIONS);
  });

  it("recommends intermediate tier for competent speed with solid accuracy", () => {
    const inputReview: PlacementInputMetrics = {
      wpm: 45,
      rawWpm: 48,
      accuracy: 92,
      consistency: 85,
      elapsedMs: 20000,
    };
    const analysisReview = evaluateComprehensivePlacement(inputReview);
    assert.equal(analysisReview.recommendedStart.lessonId, "full-keyboard-words");

    const inputProse: PlacementInputMetrics = {
      wpm: 55,
      rawWpm: 58,
      accuracy: 94,
      consistency: 88,
      elapsedMs: 20000,
    };
    const analysisProse = evaluateComprehensivePlacement(inputProse);
    assert.ok(analysisProse.tier === "competent" || analysisProse.tier === "fluent");
    assert.equal(analysisProse.recommendedStart.lessonId, "everyday-sentences");
    assert.equal(analysisProse.startFromBeginning.lessonId, "home-row-left");
    assert.ok(analysisProse.challengeTrack.lessonId in LESSON_DEFINITIONS);
  });

  it("recommends advanced tier for high speed and precision", () => {
    const input: PlacementInputMetrics = {
      wpm: 78,
      rawWpm: 82,
      accuracy: 97,
      consistency: 92,
      elapsedMs: 15000,
    };
    const analysis = evaluateComprehensivePlacement(input);
    assert.equal(analysis.tier, "advanced");
    assert.equal(analysis.recommendedStart.lessonId, "speed-endurance");
    assert.equal(analysis.recommendedStart.tier, "advanced");
  });

  it("computes row breakdown when wordStates are provided", () => {
    const input: PlacementInputMetrics = {
      wpm: 35,
      rawWpm: 38,
      accuracy: 90,
      consistency: 80,
      elapsedMs: 20000,
      wordStates: [
        {
          target: "asdf",
          typed: "asdf",
          chars: ["correct", "correct", "correct", "correct"],
        },
        {
          target: "qwer",
          typed: "qter",
          chars: ["correct", "incorrect", "correct", "correct"],
        },
      ],
    };
    const analysis = evaluateComprehensivePlacement(input);
    // Home row (asdf) was 100%
    assert.equal(analysis.rowBreakdown.homeRowAcc, 100);
    // Top row (qwer) had 1 error out of 4 -> 75%
    assert.equal(analysis.rowBreakdown.topRowAcc, 75);
  });

  it("handles non-finite, zero, and negative inputs without crashing", () => {
    const input: PlacementInputMetrics = {
      wpm: -10,
      accuracy: NaN,
      elapsedMs: 0,
    };
    const analysis = evaluateComprehensivePlacement(input);
    assert.equal(analysis.metrics.wpm, 0);
    assert.equal(analysis.metrics.accuracy, 0);
    assert.equal(analysis.recommendedStart.lessonId, "home-row-left");
  });
});
