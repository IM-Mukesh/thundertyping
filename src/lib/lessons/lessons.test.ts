/**
 * Lessons: content generation, sub-lesson scaling and progress gating.
 *
 * Drives the pure functions directly, same reasoning as
 * typing-engine.test.ts and games-integrity.test.ts -- a lesson that leaks a
 * disallowed key into a drill, or that unlocks itself without a passing run,
 * is invisible through the UI until someone happens to notice. The zustand
 * store's `persist` wiring is not exercised here (no `localStorage` global in
 * the Node test runner, and no other store in this codebase is tested that
 * way either) -- computeUnitProgressUpdate and sanitizeUnits are exported
 * specifically so the actual logic is still covered without it.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDrillLine, buildReviewText, buildSubLessons } from "@/lib/lessons/lesson-content";
import { LESSON_LIST } from "@/lib/lessons/lesson-types";
import {
  computeUnitProgressUpdate,
  isLessonUnlocked,
  sanitizeUnits,
  type UnitProgress,
} from "@/lib/lessons/lesson-progress-store";

describe("buildDrillLine: never emits a key outside the allowed set", () => {
  it("home row only", () => {
    const allowed = ["a", "s", "d", "f", "j", "k", "l", ";"];
    const line = buildDrillLine(allowed, 30);
    const allowedSet = new Set(allowed);
    for (const char of line.replace(/ /g, "")) {
      assert.ok(allowedSet.has(char), `"${char}" is not in the allowed set`);
    }
  });

  it("a single-key set only ever produces that key", () => {
    const line = buildDrillLine(["q"], 10);
    assert.ok(/^[q ]+$/.test(line), line);
  });

  it("returns an empty string for an empty key set rather than throwing", () => {
    assert.equal(buildDrillLine([], 10), "");
  });
});

describe("buildReviewText: only returns words fully composed of allowed keys", () => {
  it("full alphabet plus punctuation keys", () => {
    const allowed = "abcdefghijklmnopqrstuvwxyz;,./".split("");
    const text = buildReviewText(allowed, 20);
    const allowedSet = new Set(allowed);
    for (const word of text.split(" ")) {
      for (const char of word) {
        assert.ok(allowedSet.has(char), `"${char}" in "${word}" is not in the allowed set`);
      }
    }
  });

  it("falls back to a synthetic drill when too few real words qualify", () => {
    // "a s d f" alone yields very few, if any, real English words.
    const allowed = ["a", "s", "d", "f"];
    const text = buildReviewText(allowed, 10);
    const allowedSet = new Set(allowed);
    assert.ok(text.length > 0);
    for (const char of text.replace(/ /g, "")) {
      assert.ok(allowedSet.has(char), `"${char}" is not in the allowed set`);
    }
  });
});

describe("buildSubLessons: expands one unit into a graduated step sequence", () => {
  it("produces exactly subLessonCount steps", () => {
    for (const unit of LESSON_LIST) {
      const steps = buildSubLessons(unit);
      assert.equal(steps.length, unit.subLessonCount, unit.id);
    }
  });

  it("word counts never decrease step over step", () => {
    const unit = LESSON_LIST.find((l) => l.subLessonCount >= 4)!;
    const steps = buildSubLessons(unit);
    for (let i = 1; i < steps.length; i++) {
      assert.ok(
        steps[i].content.wordCount >= steps[i - 1].content.wordCount,
        `step ${i + 1} (${steps[i].content.wordCount}) is shorter than step ${i} (${steps[i - 1].content.wordCount})`,
      );
    }
  });

  it("the last step reaches the unit's full word count", () => {
    const unit = LESSON_LIST.find((l) => l.id === "top-row-left")!;
    const steps = buildSubLessons(unit);
    assert.equal(steps.at(-1)!.content.wordCount, unit.content.wordCount);
  });

  it("a review unit's first step warms up as a plain drill over the same keys", () => {
    const unit = LESSON_LIST.find((l) => l.content.kind === "review")!;
    const steps = buildSubLessons(unit);
    assert.equal(steps[0].content.kind, "drill");
    if (unit.content.kind === "review") {
      assert.deepEqual(steps[0].content.kind === "drill" ? steps[0].content.allowedKeys : null, unit.content.allowedKeys);
    }
  });

  it("a graduation unit only introduces numbers in its later steps, never its first", () => {
    const unit = LESSON_LIST.find((l) => l.content.kind === "graduation" && l.content.numbers)!;
    const steps = buildSubLessons(unit);
    const firstContent = steps[0].content;
    assert.equal(firstContent.kind === "graduation" ? firstContent.numbers : undefined, false);
  });
});

describe("isLessonUnlocked: derived purely from LESSON_LIST order + completion", () => {
  it("the first lesson is always unlocked", () => {
    assert.equal(isLessonUnlocked(LESSON_LIST[0].id, {}), true);
  });

  it("the second lesson is locked until the first is completed", () => {
    const second = LESSON_LIST[1].id;
    assert.equal(isLessonUnlocked(second, {}), false);

    const units = {
      [LESSON_LIST[0].id]: completedUnit(),
    };
    assert.equal(isLessonUnlocked(second, units), true);
  });

  it("an incomplete previous lesson does not unlock the next one", () => {
    const second = LESSON_LIST[1].id;
    const units = {
      [LESSON_LIST[0].id]: { ...completedUnit(), completed: false },
    };
    assert.equal(isLessonUnlocked(second, units), false);
  });

  it("an unknown lesson id is treated as locked, not as index 0", () => {
    assert.equal(isLessonUnlocked("not-a-real-lesson" as never, {}), false);
  });
});

function completedUnit(): UnitProgress {
  return { completed: true, currentStep: 5, passCount: 5, avgAccuracy: 95, avgWpm: 30, totalTimeMs: 5000, completedAt: 1 };
}

describe("computeUnitProgressUpdate: gates completion on minAccuracy and step count", () => {
  const baseInput = { step: 1, totalSteps: 3, accuracy: 92, wpm: 20, typedChars: 50, correctChars: 46, incorrectChars: 4, elapsedMs: 15000, minAccuracy: 90 };

  it("a run below minAccuracy does not pass or complete", () => {
    const { unit, passed, unitCompleted } = computeUnitProgressUpdate(undefined, { ...baseInput, accuracy: 70 });
    assert.equal(passed, false);
    assert.equal(unitCompleted, false);
    assert.equal(unit.completed, false);
    assert.equal(unit.currentStep, 0);
  });

  it("a passing run on the last step completes the unit", () => {
    const { unit, passed, unitCompleted } = computeUnitProgressUpdate(undefined, { ...baseInput, step: 3, totalSteps: 3 });
    assert.equal(passed, true);
    assert.equal(unitCompleted, true);
    assert.equal(unit.completed, true);
    assert.equal(unit.currentStep, 3);
  });

  it("a passing run on an earlier step advances currentStep but does not complete the unit", () => {
    const { unit, unitCompleted } = computeUnitProgressUpdate(undefined, baseInput);
    assert.equal(unitCompleted, false);
    assert.equal(unit.completed, false);
    assert.equal(unit.currentStep, 1);
  });

  it("a failed retry does not regress currentStep below what was already passed", () => {
    const existing = computeUnitProgressUpdate(undefined, baseInput).unit; // passed step 1
    const { unit } = computeUnitProgressUpdate(existing, { ...baseInput, step: 2, accuracy: 40 }); // fails step 2
    assert.equal(unit.currentStep, 1);
    assert.equal(unit.completed, false);
  });

  it("averages accuracy/wpm across passing attempts rather than overwriting", () => {
    const first = computeUnitProgressUpdate(undefined, { ...baseInput, step: 1, accuracy: 92, wpm: 10 }).unit;
    const second = computeUnitProgressUpdate(first, { ...baseInput, step: 2, accuracy: 100, wpm: 30 }).unit;
    assert.equal(second.avgAccuracy, 96);
    assert.equal(second.avgWpm, 20);
    assert.equal(second.passCount, 2);
  });

  it("a failed attempt does not drag the displayed average down", () => {
    const passing = computeUnitProgressUpdate(undefined, { ...baseInput, accuracy: 96, wpm: 40 }).unit;
    const { unit } = computeUnitProgressUpdate(passing, { ...baseInput, step: 2, accuracy: 20, wpm: 5 }); // fails
    assert.equal(unit.avgAccuracy, 96, "a failed retry must not lower the average");
    assert.equal(unit.avgWpm, 40);
    assert.equal(unit.passCount, 1, "passCount only advances on a pass");
  });
});

describe("sanitizeUnits: drops a single malformed entry, not the whole map", () => {
  it("keeps valid entries and discards an invalid one", () => {
    const units = sanitizeUnits({
      "home-row-left": completedUnit(),
      "home-row-right": { completed: "yes" }, // malformed: wrong types entirely
    });
    assert.equal(units["home-row-left"]?.completed, true);
    assert.equal("home-row-right" in units, false);
  });

  it("returns an empty map for garbage input rather than throwing", () => {
    assert.deepEqual(sanitizeUnits("not an object"), {});
    assert.deepEqual(sanitizeUnits(null), {});
    assert.deepEqual(sanitizeUnits([]), {});
  });
});

describe("curriculum data integrity", () => {
  it("LESSON_LIST order fields are strictly increasing", () => {
    for (let i = 1; i < LESSON_LIST.length; i++) {
      assert.ok(
        LESSON_LIST[i].order > LESSON_LIST[i - 1].order,
        `${LESSON_LIST[i].id} does not come after ${LESSON_LIST[i - 1].id}`,
      );
    }
  });

  it("exactly one unit is marked as graduation, and it is the last one", () => {
    const graduationUnits = LESSON_LIST.filter((l) => l.isGraduation);
    assert.equal(graduationUnits.length, 1);
    assert.equal(LESSON_LIST[LESSON_LIST.length - 1].isGraduation, true);
  });

  it("every tier is represented and units within a tier stay contiguous", () => {
    const tiers = LESSON_LIST.map((l) => l.tier);
    assert.deepEqual(new Set(tiers), new Set(["beginner", "intermediate", "advanced"]));
    // Contiguous: once a tier changes, it never reappears later in the list.
    const seen = new Set<string>();
    let lastTier = tiers[0];
    for (const tier of tiers) {
      if (tier !== lastTier) {
        assert.ok(!seen.has(tier), `tier "${tier}" reappears non-contiguously`);
        seen.add(lastTier);
        lastTier = tier;
      }
    }
  });

  it("every unit has a positive subLessonCount", () => {
    for (const unit of LESSON_LIST) {
      assert.ok(unit.subLessonCount > 0, unit.id);
    }
  });
});
