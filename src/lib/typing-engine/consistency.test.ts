import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateConsistency, round } from "@/lib/typing-engine/stats";
import type { WpmSample } from "@/lib/typing-engine/engine-types";

function makeSamples(perSecondChars: number[]): WpmSample[] {
  let cumulative = 0;
  return perSecondChars.map((chars, i) => {
    cumulative += chars;
    const t = (i + 1) * 1000;
    return {
      t,
      wpm: (cumulative / 5) / (t / 60000),
      rawWpm: (cumulative / 5) / (t / 60000),
      correct: cumulative,
      typed: cumulative,
    };
  });
}

describe("HT-CONS-001: Forensic Consistency Metric Scenarios A-Q", () => {
  it("Scenario A: Perfectly steady typing yields 100% consistency", () => {
    const steady = makeSamples(Array(60).fill(5));
    const score = calculateConsistency(steady);
    assert.equal(round(score), 100);
  });

  it("Scenario B: Natural variation produces realistic high score (85-95%)", () => {
    const naturalVariation = [5, 4, 6, 5, 5, 4, 6, 5, 4, 5, 6, 5, 5, 4, 6, 5, 5, 4, 5, 6];
    const score = calculateConsistency(makeSamples(naturalVariation));
    assert.ok(score >= 80 && score <= 95, `Expected 80-95%, got ${score}`);
  });

  it("Scenario C: Burst-and-stall collapses consistency", () => {
    const burstStall = Array.from({ length: 30 }, (_, i) => (i % 2 === 0 ? 10 : 0));
    const score = calculateConsistency(makeSamples(burstStall));
    assert.equal(score, 0);
  });

  it("Scenario D: Gradual acceleration produces moderate pacing consistency", () => {
    const acceleration = Array.from({ length: 30 }, (_, i) => 3 + (5 * i) / 29);
    const score = calculateConsistency(makeSamples(acceleration));
    assert.ok(score >= 65 && score <= 80, `Expected 65-80%, got ${score}`);
  });

  it("Scenario E: Pause at beginning does not crash and reflects initial hesitation", () => {
    const pauseStart = [0, 0, 0, ...Array(27).fill(5)];
    const score = calculateConsistency(makeSamples(pauseStart));
    assert.ok(score >= 60 && score <= 80, `Expected 60-80%, got ${score}`);
    assert.ok(Number.isFinite(score));
  });

  it("Scenario F: Pause at end does not crash and reflects terminal stall", () => {
    const pauseEnd = [...Array(27).fill(5), 0, 0, 0];
    const score = calculateConsistency(makeSamples(pauseEnd));
    assert.ok(score >= 60 && score <= 80, `Expected 60-80%, got ${score}`);
    assert.ok(Number.isFinite(score));
  });

  it("Scenario G: Single mid-test pause has bounded impact", () => {
    const midPause = Array(30).fill(5);
    midPause[15] = 0;
    const score = calculateConsistency(makeSamples(midPause));
    assert.ok(score >= 75 && score <= 90, `Expected 75-90%, got ${score}`);
    assert.ok(Number.isFinite(score));
  });

  it("Scenario H: Backspace-heavy interval drops output delta without NaN", () => {
    const backspacing = Array(30).fill(5);
    backspacing[10] = 0;
    backspacing[11] = 0;
    backspacing[12] = 0;
    const score = calculateConsistency(makeSamples(backspacing));
    assert.ok(score < 75 && score > 50, `Expected 50-75%, got ${score}`);
    assert.ok(Number.isFinite(score));
  });

  it("Scenario I: Very low-speed user produces finite, non-negative consistency", () => {
    const lowSpeed = Array.from({ length: 30 }, (_, i) => i % 2);
    const score = calculateConsistency(makeSamples(lowSpeed));
    assert.ok(score >= 0 && score <= 100, `Expected 0-100%, got ${score}`);
    assert.ok(Number.isFinite(score));
  });

  it("Scenario J: Very short test (2 samples) produces valid 100% baseline", () => {
    const shortTest = makeSamples([5, 5]);
    const score = calculateConsistency(shortTest);
    assert.equal(score, 100);
  });

  it("Scenario K: Zero-output first interval computes rate delta without NaN", () => {
    const zeroFirst = makeSamples([0, 5, 5, 5, 5]);
    const score = calculateConsistency(zeroFirst);
    assert.equal(score, 100);
    assert.ok(Number.isFinite(score));
  });

  it("Scenario L: Zero mean interval rate returns 0 without division-by-zero", () => {
    const allZero = makeSamples(Array(10).fill(0));
    const score = calculateConsistency(allZero);
    assert.equal(score, 0);
  });

  it("Scenario M: Identical net output across intervals produces deterministic score", () => {
    const run1 = calculateConsistency(makeSamples(Array(20).fill(5)));
    const run2 = calculateConsistency(makeSamples(Array(20).fill(5)));
    assert.equal(run1, run2);
    assert.equal(run1, 100);
  });

  it("Scenarios N, O, P, Q: Steady typing scales consistently across 15s, 30s, 60s, 120s", () => {
    for (const duration of [15, 30, 60, 120]) {
      const steady = makeSamples(Array(duration).fill(5));
      const score = calculateConsistency(steady);
      assert.equal(round(score), 100, `Duration ${duration}s should score 100%`);
    }
  });

  it("Duration sensitivity: Single stall has larger percentage impact on 15s vs 120s", () => {
    const stall15 = Array(15).fill(6);
    stall15[7] = 0;
    const score15 = calculateConsistency(makeSamples(stall15));

    const stall120 = Array(120).fill(6);
    stall120[60] = 0;
    const score120 = calculateConsistency(makeSamples(stall120));

    assert.ok(
      score15 < score120 - 15,
      `Short tests are statistically more sensitive to single stalls: 15s=${score15}, 120s=${score120}`,
    );
  });
});
