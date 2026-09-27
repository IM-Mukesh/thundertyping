import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateWilsonLowerBound,
  evaluateDetailedMastery,
  extractAttemptOutcomes,
  type KeyRecord,
} from "@/lib/lessons/mastery-engine";
import type { WordState } from "@/lib/typing-engine/engine-types";

describe("mastery-engine: statistical Bayesian typing mastery & weakness diagnostics", () => {
  it("calculateWilsonLowerBound provides conservative confidence lower bound", () => {
    // 0 attempts -> 0
    assert.equal(calculateWilsonLowerBound(0, 0), 0);

    // 100 out of 100 -> high confidence (~0.96+)
    const highSample = calculateWilsonLowerBound(100, 100);
    assert.ok(highSample >= 0.95 && highSample <= 1.0);

    // 1 out of 1 is 100% raw accuracy, but low sample confidence lower bound should be much lower
    const singleSample = calculateWilsonLowerBound(1, 1);
    assert.ok(singleSample < 0.6, `Single sample should have low confidence bound, got ${singleSample}`);

    // Lower successes gives lower bound
    const half = calculateWilsonLowerBound(50, 100);
    assert.ok(half > 0.35 && half < 0.5);
  });

  it("extractAttemptOutcomes extracts per-key and transition successes and errors", () => {
    const wordStates: WordState[] = [
      {
        target: "the",
        typed: "tge",
        chars: ["correct", "incorrect", "correct"],
      },
    ];

    const outcomes = extractAttemptOutcomes(wordStates);
    // 't' was correct, 'h' had error (typed 'g'), 'e' was correct
    assert.equal(outcomes.keyOutcomes["t"].correct, 1);
    assert.equal(outcomes.keyOutcomes["t"].errors, 0);

    assert.equal(outcomes.keyOutcomes["h"].correct, 0);
    assert.equal(outcomes.keyOutcomes["h"].errors, 1);

    assert.equal(outcomes.keyOutcomes["e"].correct, 1);
    assert.equal(outcomes.keyOutcomes["e"].errors, 0);

    // Transition 'th' had error
    assert.ok(outcomes.transitionOutcomes["th"]);
    assert.equal(outcomes.transitionOutcomes["th"].errors, 1);
  });

  it("evaluateDetailedMastery accurately classifies skill tiers and weak keys", () => {
    const keyRecords: Record<string, KeyRecord> = {
      // Key 'a': 100 attempts, 2 errors -> mastered
      a: { attempts: 100, errors: 2, lastPracticedAt: Date.now() },
      // Key 's': 50 attempts, 20 errors -> struggling
      s: { attempts: 50, errors: 20, lastPracticedAt: Date.now() },
      // Key 'd': 5 attempts, 0 errors -> new (not enough confidence for mastered)
      d: { attempts: 5, errors: 0, lastPracticedAt: Date.now() },
      // Key 'f': 25 attempts, 3 errors -> developing
      f: { attempts: 25, errors: 3, lastPracticedAt: Date.now() },
    };

    const profile = evaluateDetailedMastery(keyRecords, {});
    assert.equal(profile.keys["a"].level, "mastered");
    assert.equal(profile.keys["s"].level, "struggling");
    assert.equal(profile.keys["d"].level, "new");
    assert.equal(profile.keys["f"].level, "developing");

    assert.ok(profile.weakestKeys.includes("s"));
    assert.ok(profile.overallMasteryScore > 0 && profile.overallMasteryScore <= 100);
  });

  it("evaluates hand balance and finger dexterity aggregates", () => {
    const keyRecords: Record<string, KeyRecord> = {
      // Left hand keys: f (left index), a (left pinky)
      f: { attempts: 50, errors: 1, lastPracticedAt: Date.now() },
      a: { attempts: 50, errors: 1, lastPracticedAt: Date.now() },
      // Right hand keys: j (right index), l (right ring) with high errors
      j: { attempts: 50, errors: 15, lastPracticedAt: Date.now() },
      l: { attempts: 50, errors: 20, lastPracticedAt: Date.now() },
    };

    const profile = evaluateDetailedMastery(keyRecords, {});
    assert.ok(profile.hands.left.accuracy > profile.hands.right.accuracy);
    assert.ok(profile.fingers["right-ring"].accuracy < profile.fingers["left-index"].accuracy);
  });
});
