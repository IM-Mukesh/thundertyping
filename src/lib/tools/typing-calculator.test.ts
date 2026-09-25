import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateFromTest,
  cpmToKph,
  cpmToWpm,
  kphToCpm,
  kphToWpm,
  round,
  wpmToCpm,
  wpmToKph,
} from "@/lib/tools/typing-calculator";

describe("calculateFromTest", () => {
  it("matches the worked example from the WPM-calculation guide (1-minute test)", () => {
    const result = calculateFromTest({ charactersTyped: 250, errors: 5, seconds: 60 });
    assert.ok(result);
    assert.equal(round(result.grossWpm), 50);
    assert.equal(round(result.netWpm), 49);
  });

  it("computes CPM and KPH from raw character count, independent of errors", () => {
    const result = calculateFromTest({ charactersTyped: 300, errors: 0, seconds: 60 });
    assert.ok(result);
    assert.equal(result.cpm, 300);
    assert.equal(result.kph, 18000);
  });

  it("computes accuracy as correct / total, not a fixed penalty", () => {
    const result = calculateFromTest({ charactersTyped: 200, errors: 20, seconds: 60 });
    assert.ok(result);
    assert.equal(result.accuracy, 90);
    assert.equal(result.correctCharacters, 180);
  });

  it("returns null for a zero or negative duration -- there's no rate to report", () => {
    assert.equal(calculateFromTest({ charactersTyped: 100, errors: 0, seconds: 0 }), null);
    assert.equal(calculateFromTest({ charactersTyped: 100, errors: 0, seconds: -5 }), null);
  });

  it("clamps errors that exceed characters typed rather than going negative", () => {
    const result = calculateFromTest({ charactersTyped: 50, errors: 999, seconds: 60 });
    assert.ok(result);
    assert.equal(result.correctCharacters, 0);
    assert.equal(result.accuracy, 0);
  });

  it("returns 100% accuracy for a zero-character input rather than dividing by zero", () => {
    const result = calculateFromTest({ charactersTyped: 0, errors: 0, seconds: 60 });
    assert.ok(result);
    assert.equal(result.accuracy, 100);
  });
});

describe("unit conversions", () => {
  it("round-trips WPM -> CPM -> WPM", () => {
    assert.equal(cpmToWpm(wpmToCpm(64)), 64);
  });

  it("round-trips WPM -> KPH -> WPM", () => {
    assert.equal(kphToWpm(wpmToKph(64)), 64);
  });

  it("round-trips CPM -> KPH -> CPM", () => {
    assert.equal(kphToCpm(cpmToKph(320)), 320);
  });

  it("matches the documented WPM x 300 = KPH shortcut", () => {
    assert.equal(wpmToKph(40), 12000);
    assert.equal(wpmToKph(60), 18000);
  });
});
