import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LESSON_LIST,
  LESSON_DEFINITIONS,
  type LessonId,
} from "@/lib/lessons/lesson-types";
import { buildSubLessons, buildTextForContent } from "@/lib/lessons/lesson-content";
import { evaluateLessonStars } from "@/lib/lessons/star-system";

describe("HeroTyping Curriculum Pedagogical Invariants", () => {
  it("Rule 3: NEVER introduce more than 2 new alphanumeric keys in any unit", () => {
    for (const unit of LESSON_LIST) {
      const alphanumericKeys = unit.newKeys.filter((k) => /^[a-z0-9]$/i.test(k));
      assert.ok(
        alphanumericKeys.length <= 2,
        `Unit "${unit.id}" (${unit.name}) introduces ${alphanumericKeys.length} alphanumeric keys: ${alphanumericKeys.join(", ")}`,
      );
      assert.ok(
        unit.newKeys.length <= 2,
        `Unit "${unit.id}" (${unit.name}) has total newKeys length ${unit.newKeys.length}`,
      );
    }
  });

  it("Rule 4: The first unit introduces exactly the F and J home-row anchors", () => {
    const first = LESSON_LIST[0];
    assert.equal(first.id, "home-row-left");
    assert.deepEqual(first.newKeys, ["f", "j"]);
    assert.equal(first.tier, "beginner");
    assert.equal(first.stage, "home-row");
  });

  it("Rule 23: Semicolon ';' is taught as a home-row key in the home-row stage", () => {
    const semiUnit = LESSON_LIST.find((u) => u.newKeys.includes(";"));
    assert.ok(semiUnit, "A unit must introduce semicolon ';'");
    assert.equal(semiUnit.stage, "home-row", `Unit introducing ';' must be in home-row stage`);
    assert.equal(semiUnit.tier, "beginner", `Unit introducing ';' must be in beginner tier`);
  });

  it("Rule 7: Every unit reinforces all previously introduced keys cumulatively", () => {
    const accumulatedKeys = new Set<string>();
    for (const unit of LESSON_LIST) {
      for (const k of unit.newKeys) {
        accumulatedKeys.add(k);
      }
      if (unit.content.kind === "drill") {
        const allowedSet = new Set(unit.content.allowedKeys);
        for (const k of accumulatedKeys) {
          assert.ok(
            allowedSet.has(k),
            `Unit "${unit.id}" is missing previously learned key "${k}" from its allowedKeys`,
          );
        }
      }
    }
  });

  it("Rule 6: No lesson run/drill output contains fewer than 10 target characters", () => {
    const testSeeds = [1, 17, 42, 99, 137, 202];
    for (const unit of LESSON_LIST) {
      const steps = buildSubLessons(unit);
      for (const step of steps) {
        for (const seed of testSeeds) {
          const text = buildTextForContent(step.content, seed);
          assert.ok(
            text.length >= 10,
            `Unit "${unit.id}" Step ${step.step} (${step.title}) generated text length ${text.length} < 10 for seed ${seed}: "${text}"`,
          );
        }
      }
    }
  });

  it("Preserves all 28 original route IDs and sitemap links without breaks", () => {
    assert.equal(LESSON_LIST.length, 28);
    const expectedIds: LessonId[] = [
      "home-row-left",
      "home-row-right",
      "home-row-combined",
      "home-row-words",
      "top-row-left",
      "top-row-right",
      "top-row-combined",
      "top-row-words",
      "bottom-row-left",
      "bottom-row-right",
      "bottom-row-combined",
      "bottom-row-words",
      "numbers-low",
      "numbers-high",
      "full-keyboard-words",
      "full-keyboard-punctuation",
      "graduation",
      "everyday-sentences",
      "building-speed",
      "numbers-and-words",
      "longer-passages",
      "mixed-practice",
      "intermediate-checkpoint",
      "speed-endurance",
      "precision-under-pressure",
      "long-form-typing",
      "numbers-and-symbols-mastery",
      "final-challenge",
    ];

    for (let i = 0; i < expectedIds.length; i++) {
      const expectedId = expectedIds[i];
      assert.equal(
        LESSON_LIST[i].id,
        expectedId,
        `Unit at index ${i} should have id "${expectedId}"`,
      );
      assert.ok(
        expectedId in LESSON_DEFINITIONS,
        `LESSON_DEFINITIONS must define "${expectedId}"`,
      );
    }
  });

  it("2-key units use the 7-phase deliberate motor progression with forgiving discovery threshold", () => {
    const twoKeyUnits = LESSON_LIST.filter((u) => u.newKeys.length === 2);
    assert.ok(twoKeyUnits.length >= 10, "Should have 10+ 2-key units");

    for (const unit of twoKeyUnits) {
      const steps = buildSubLessons(unit);
      assert.equal(steps.length, 7, `Unit "${unit.id}" should have exactly 7 steps`);

      // Phase A: Discover Key 1
      assert.equal(steps[0].content.kind, "drill");
      if (steps[0].content.kind === "drill") {
        assert.equal(steps[0].content.style, "discover-1");
      }
      assert.equal(steps[0].minAccuracy, 75, "Step 1 accuracy must be forgiving 75%");

      // Phase B: Discover Key 2
      assert.equal(steps[1].content.kind, "drill");
      if (steps[1].content.kind === "drill") {
        assert.equal(steps[1].content.style, "discover-2");
      }
      assert.equal(steps[1].minAccuracy, 75, "Step 2 accuracy must be forgiving 75%");

      // Phase C: Pair & Mix
      if (steps[2].content.kind === "drill") {
        assert.equal(steps[2].content.style, "pair-mix");
      }

      // Phase D: Rapid Alternation
      if (steps[3].content.kind === "drill") {
        assert.equal(steps[3].content.style, "alternation");
      }

      // Phase E: Integration
      if (steps[4].content.kind === "drill") {
        assert.equal(steps[4].content.style, "integration");
      }

      // Phase G: Checkpoint reaches unit.minAccuracy
      assert.equal(steps[6].phase, "checkpoint");
      assert.equal(steps[6].minAccuracy, unit.minAccuracy);
    }
  });

  it("Star system guarantees: 3+ stars = PASS, 1-2 stars = RETRY with weakness diagnosis", () => {
    const passResult = evaluateLessonStars({
      accuracy: 95,
      wpm: 25,
      minAccuracy: 80,
      stage: "home-row",
      tier: "beginner",
      errorCount: 1,
    });
    assert.ok(passResult.stars >= 3);
    assert.equal(passResult.passed, true);
    assert.equal(passResult.recommendedAction, "continue");

    const failResult = evaluateLessonStars({
      accuracy: 55,
      wpm: 12,
      minAccuracy: 60,
      stage: "home-row",
      tier: "beginner",
      errorCount: 8,
      keyOutcomes: {
        f: [true, true, true, true],
        j: [false, false, true, false],
      },
    });
    assert.ok(failResult.stars <= 2);
    assert.equal(failResult.passed, false);
    assert.equal(failResult.recommendedAction, "retry");
    assert.ok(failResult.weaknessFeedback?.includes("J"));
    assert.deepEqual(failResult.retryFocusKeys, ["j"]);
  });
});
