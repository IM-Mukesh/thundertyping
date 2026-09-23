/**
 * Per-key weakness detection: pure functions driven directly, same reasoning
 * as lessons.test.ts -- a bad threshold or a case-folding slip here would
 * silently mislabel a learner's weak keys with nothing to catch it.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getWeakKeys, tallyKeyAttempt, tallyKeyOutcomes, statFromOutcomes } from "@/lib/lessons/key-performance";
import type { WordState } from "@/lib/typing-engine/engine-types";

function word(target: string, chars: WordState["chars"]): WordState {
  return { target, typed: target, chars };
}

describe("tallyKeyOutcomes / tallyKeyAttempt", () => {
  it("returns an empty tally for empty wordStates", () => {
    assert.deepEqual(tallyKeyOutcomes([]), {});
    assert.deepEqual(tallyKeyAttempt([]), {});
  });

  it("an all-correct word tallies zero errors for each of its keys", () => {
    const stats = tallyKeyAttempt([word("cat", ["correct", "correct", "correct"])]);
    assert.deepEqual(stats, { c: { attempts: 1, errors: 0 }, a: { attempts: 1, errors: 0 }, t: { attempts: 1, errors: 0 } });
  });

  it("incorrect and missed characters both count as errors", () => {
    const stats = tallyKeyAttempt([word("cat", ["incorrect", "missed", "correct"])]);
    assert.equal(stats.c.errors, 1);
    assert.equal(stats.a.errors, 1);
    assert.equal(stats.t.errors, 0);
  });

  it("excludes extra characters typed past the end of the target", () => {
    const stats = tallyKeyAttempt([word("cat", ["correct", "correct", "correct", "extra"])]);
    assert.equal(Object.keys(stats).length, 3);
  });

  it("case-folds so 'C' and 'c' tally under the same key", () => {
    const stats = tallyKeyAttempt([word("Cat", ["correct", "correct", "correct"])]);
    assert.equal(stats.c.attempts, 1);
    assert.equal(stats.C, undefined);
  });

  it("accumulates across multiple words in one attempt", () => {
    const stats = tallyKeyAttempt([word("cat", ["correct", "correct", "correct"]), word("car", ["correct", "incorrect", "correct"])]);
    assert.equal(stats.c.attempts, 2);
    assert.equal(stats.a.attempts, 2);
    assert.equal(stats.a.errors, 1);
  });
});

describe("statFromOutcomes", () => {
  it("counts attempts and errors from a raw outcome list", () => {
    assert.deepEqual(statFromOutcomes([true, true, false, true, false]), { attempts: 5, errors: 2 });
  });

  it("an empty outcome list has zero attempts and zero errors", () => {
    assert.deepEqual(statFromOutcomes([]), { attempts: 0, errors: 0 });
  });
});

describe("getWeakKeys", () => {
  it("returns nothing for empty stats", () => {
    assert.deepEqual(getWeakKeys({}), []);
  });

  it("excludes a key below threshold if it doesn't have enough attempts yet", () => {
    // 0% accuracy, but only 2 attempts -- not enough evidence to call it weak.
    const weak = getWeakKeys({ p: { attempts: 2, errors: 2 } }, { minAttempts: 6, accuracyThreshold: 90 });
    assert.deepEqual(weak, []);
  });

  it("flags a key with enough attempts and accuracy below the threshold", () => {
    const weak = getWeakKeys({ p: { attempts: 10, errors: 3 } }, { minAttempts: 6, accuracyThreshold: 90 });
    assert.deepEqual(weak, ["p"]);
  });

  it("excludes a key exactly at the threshold (boundary is exclusive)", () => {
    // 90/100 = 90% accuracy, threshold 90 -- not below, so not weak.
    const weak = getWeakKeys({ p: { attempts: 100, errors: 10 } }, { minAttempts: 6, accuracyThreshold: 90 });
    assert.deepEqual(weak, []);
  });

  it("orders multiple weak keys worst-accuracy-first", () => {
    const weak = getWeakKeys(
      {
        p: { attempts: 10, errors: 2 }, // 80%
        q: { attempts: 10, errors: 5 }, // 50%
        z: { attempts: 10, errors: 1 }, // 90%, not weak
      },
      { minAttempts: 6, accuracyThreshold: 90 },
    );
    assert.deepEqual(weak, ["q", "p"]);
  });

  it("falls back to sane defaults when no options are given", () => {
    const weak = getWeakKeys({ p: { attempts: 20, errors: 15 } });
    assert.deepEqual(weak, ["p"]);
  });
});
