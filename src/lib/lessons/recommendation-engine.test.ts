import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateRecommendations,
  type RecommendationContext,
} from "@/lib/lessons/recommendation-engine";
import type { KeyStat } from "@/lib/lessons/key-performance";

describe("recommendation-engine: explainable personalized learning coach", () => {
  it("prioritizes weak-key remediation when error rate is high", () => {
    const keyStats: Record<string, KeyStat> = {
      // Struggling on key 'b'
      b: { attempts: 20, errors: 6 },
      // Solid on key 'f'
      f: { attempts: 50, errors: 1 },
    };

    const ctx: RecommendationContext = {
      units: {},
      keyStats,
      learnerGoal: "touch-typing",
      userWpm: 35,
    };

    const recs = generateRecommendations(ctx);
    assert.ok(recs.length > 0);
    const topRec = recs[0];
    assert.equal(topRec.type, "remediation-weak-key");
    assert.ok(topRec.targetKeys?.includes("b"));
    assert.ok(topRec.rationale.includes("below 90%"));
  });

  it("recommends resuming an in-progress lesson unit", () => {
    const ctx: RecommendationContext = {
      units: {
        "home-row-left": {
          completed: false,
          currentStep: 2,
          attemptsCount: 2,
          passCount: 2,
          avgWpm: 30,
          avgAccuracy: 95,
          totalTimeMs: 12000,
          completedAt: 0,
        },
      },
      keyStats: {},
      learnerGoal: "touch-typing",
    };

    const recs = generateRecommendations(ctx);
    const curriculumRec = recs.find((r) => r.type === "continue-curriculum");
    assert.ok(curriculumRec);
    assert.ok(curriculumRec.title.includes("Continue Home Row"));
    assert.equal(curriculumRec.href, "/lessons/home-row-left");
  });

  it("recommends spaced review for completed units older than 7 days", () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const ctx: RecommendationContext = {
      units: {
        "home-row-left": {
          completed: true,
          currentStep: 4,
          attemptsCount: 5,
          passCount: 4,
          avgWpm: 35,
          avgAccuracy: 96,
          totalTimeMs: 30000,
          completedAt: eightDaysAgo,
          lastAttemptAt: eightDaysAgo,
        },
      },
      keyStats: {},
      learnerGoal: "touch-typing",
    };

    const recs = generateRecommendations(ctx);
    const reviewRec = recs.find((r) => r.type === "spaced-review");
    assert.ok(reviewRec, "Should recommend spaced review for stale completed unit");
    assert.equal(reviewRec.href, "/lessons/home-row-left");
  });

  it("adapts recommendations according to learner goal", () => {
    // Speed goal
    const speedCtx: RecommendationContext = {
      units: {},
      keyStats: {},
      learnerGoal: "speed-60",
      userWpm: 45,
    };
    const speedRecs = generateRecommendations(speedCtx);
    const speedGoalRec = speedRecs.find((r) => r.type === "goal-challenge");
    assert.ok(speedGoalRec);
    assert.ok(speedGoalRec.title.toLowerCase().includes("speed") || speedGoalRec.title.toLowerCase().includes("sprint"));

    // Accuracy goal
    const accuracyCtx: RecommendationContext = {
      units: {},
      keyStats: {},
      learnerGoal: "accuracy",
    };
    const accRecs = generateRecommendations(accuracyCtx);
    const accGoalRec = accRecs.find((r) => r.type === "goal-challenge");
    assert.ok(accGoalRec);
    assert.ok(accGoalRec.title.toLowerCase().includes("accuracy") || accGoalRec.title.toLowerCase().includes("precision"));
  });

  it("computes realistic paced duration from user WPM", () => {
    const fastUserCtx: RecommendationContext = {
      units: {},
      keyStats: {},
      userWpm: 80,
    };
    const slowUserCtx: RecommendationContext = {
      units: {},
      keyStats: {},
      userWpm: 20,
    };

    const fastRecs = generateRecommendations(fastUserCtx);
    const slowRecs = generateRecommendations(slowUserCtx);

    const fastCurriculum = fastRecs.find((r) => r.type === "continue-curriculum");
    const slowCurriculum = slowRecs.find((r) => r.type === "continue-curriculum");

    assert.ok(fastCurriculum && slowCurriculum);
    assert.ok(fastCurriculum.estimatedMinutes <= slowCurriculum.estimatedMinutes);
  });
});
