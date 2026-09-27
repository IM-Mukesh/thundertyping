import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateLessonPass,
  calculateLessonStars,
  evaluateLessonStars,
} from "@/lib/lessons/star-system";

describe("star-system: pure progression and star calculation", () => {
  it("Rule 8: Exact minimum progression rule (60% accuracy boundary)", () => {
    // 59.9% -> fail (cannot continue)
    assert.equal(calculateLessonPass(59.9), false);
    // 60.0% -> pass (can continue)
    assert.equal(calculateLessonPass(60.0), true);
    // 60.1% -> pass (can continue)
    assert.equal(calculateLessonPass(60.1), true);

    // Explicit progression test suite
    assert.equal(calculateLessonPass(0), false);
    assert.equal(calculateLessonPass(35), false);
    assert.equal(calculateLessonPass(59), false);
    assert.equal(calculateLessonPass(60), true);
    assert.equal(calculateLessonPass(65), true);
    assert.equal(calculateLessonPass(75), true);
    assert.equal(calculateLessonPass(90), true);
    assert.equal(calculateLessonPass(94), true);
    assert.equal(calculateLessonPass(100), true);
  });

  it("Rule 9 & 49: 94%+ accuracy AND 25+ WPM = 5 stars", () => {
    // 94% + 25 WPM -> 5 stars
    assert.equal(calculateLessonStars(94.0, 25.0), 5);
    // 94.1% + 25 WPM -> 5 stars
    assert.equal(calculateLessonStars(94.1, 25.0), 5);
    // 95% + 25 WPM -> 5 stars
    assert.equal(calculateLessonStars(95.0, 25.0), 5);
    // 94% + 30 WPM -> 5 stars
    assert.equal(calculateLessonStars(94.0, 30.0), 5);
    // 100% + 25 WPM -> 5 stars
    assert.equal(calculateLessonStars(100.0, 25.0), 5);

    // Below 94% or below 25 WPM does not trigger 5 stars (unless near-perfect 98%+)
    assert.equal(calculateLessonStars(93.9, 25.0), 4);
    assert.equal(calculateLessonStars(94.0, 24.9), 4);
    assert.equal(calculateLessonStars(94.0, 25.1), 5);
  });

  it("Star tiers are fair, deterministic, and consistent", () => {
    // 1 Star: < 40%
    assert.equal(calculateLessonStars(0, 10), 1);
    assert.equal(calculateLessonStars(39.9, 15), 1);

    // 2 Stars: 40% - 59.9%
    assert.equal(calculateLessonStars(40.0, 15), 2);
    assert.equal(calculateLessonStars(50.0, 20), 2);
    assert.equal(calculateLessonStars(59.9, 22), 2);

    // 3 Stars: 60% - 87.9% (Passing)
    assert.equal(calculateLessonStars(60.0, 15), 3);
    assert.equal(calculateLessonStars(75.0, 20), 3);
    assert.equal(calculateLessonStars(87.9, 22), 3);

    // 4 Stars: 88% - 93.9% (or 94%+ with <25 WPM)
    assert.equal(calculateLessonStars(88.0, 20), 4);
    assert.equal(calculateLessonStars(92.0, 22), 4);
    assert.equal(calculateLessonStars(95.0, 20), 4); // 95% acc but only 20 WPM

    // 5 Stars: 94%+ with 25+ WPM OR 98%+ in beginner tier
    assert.equal(calculateLessonStars(94.0, 25.0), 5);
    assert.equal(calculateLessonStars(98.0, 15.0, { isBeginner: true }), 5);
  });
});

describe("star-system: evaluateLessonStars user feedback and action flows", () => {
  it("1-star flow: requires retry, gives encouraging slow-down advice", () => {
    const result = evaluateLessonStars({
      accuracy: 35,
      wpm: 12,
      minAccuracy: 60,
      stage: "home-row",
      tier: "beginner",
      errorCount: 15,
    });

    assert.equal(result.stars, 1);
    assert.equal(result.passed, false);
    assert.equal(result.recommendedAction, "retry");
    assert.equal(result.headline, "LET'S BUILD THIS FIRST");
    assert.ok(result.mistakeSummary?.includes("15 mistakes"));
  });

  it("2-star flow: requires retry, explains missing the 60% requirement", () => {
    const result = evaluateLessonStars({
      accuracy: 58,
      wpm: 18,
      minAccuracy: 60,
      stage: "home-row",
      tier: "beginner",
      errorCount: 8,
    });

    assert.equal(result.stars, 2);
    assert.equal(result.passed, false);
    assert.equal(result.recommendedAction, "retry");
    assert.equal(result.headline, "ALMOST THERE");
    assert.ok(result.mistakeSummary?.includes("60%"));
  });

  it("3-star flow: allows continue, acknowledges meeting 60% requirement", () => {
    const result = evaluateLessonStars({
      accuracy: 62,
      wpm: 18,
      minAccuracy: 60,
      stage: "home-row",
      tier: "beginner",
      errorCount: 7,
    });

    assert.equal(result.stars, 3);
    assert.equal(result.passed, true);
    assert.equal(result.recommendedAction, "continue");
    assert.equal(result.headline, "GOOD JOB!");
  });

  it("4-star flow: allows continue with great control feedback", () => {
    const result = evaluateLessonStars({
      accuracy: 90,
      wpm: 22,
      minAccuracy: 60,
      stage: "home-row",
      tier: "beginner",
      errorCount: 2,
    });

    assert.equal(result.stars, 4);
    assert.equal(result.passed, true);
    assert.equal(result.recommendedAction, "continue");
    assert.equal(result.headline, "GREAT CONTROL!");
  });

  it("5-star flow: excellent run for 94%+ accuracy and 25+ WPM", () => {
    const result = evaluateLessonStars({
      accuracy: 96,
      wpm: 28,
      minAccuracy: 60,
      stage: "home-row",
      tier: "beginner",
      errorCount: 1,
    });

    assert.equal(result.stars, 5);
    assert.equal(result.passed, true);
    assert.equal(result.recommendedAction, "continue");
    assert.equal(result.headline, "EXCELLENT RUN");
  });

  it("5-star flow: literally perfect run for 100% accuracy and 0 errors", () => {
    const result = evaluateLessonStars({
      accuracy: 100,
      wpm: 32,
      minAccuracy: 60,
      stage: "home-row",
      tier: "beginner",
      errorCount: 0,
    });

    assert.equal(result.stars, 5);
    assert.equal(result.passed, true);
    assert.equal(result.headline, "PERFECT RUN");
  });

  it("diagnoses specific key weaknesses and targets retryFocusKeys", () => {
    const result = evaluateLessonStars({
      accuracy: 55,
      wpm: 20,
      minAccuracy: 60,
      stage: "home-row",
      tier: "beginner",
      errorCount: 10,
      newKeys: ["f", "j"],
      keyOutcomes: {
        f: [true, true, true, true, true], // 0 errors
        j: [false, false, true, false, false], // 4 errors
      },
    });

    assert.equal(result.stars, 2);
    assert.equal(result.passed, false);
    assert.ok(result.weaknessFeedback?.includes("J"));
    assert.deepEqual(result.retryFocusKeys, ["j"]);
  });
});
