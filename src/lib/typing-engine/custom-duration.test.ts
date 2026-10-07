import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_CUSTOM_TIME_DURATION, MIN_CUSTOM_TIME_DURATION, TIME_DURATIONS } from "@/lib/typing-engine/engine-types";
import {
  formatDuration,
  getInitialUrlDuration,
  parseCustomDuration,
  parseUrlDuration,
} from "@/lib/typing-engine/custom-duration";

import { createInitialState, reducer } from "@/lib/typing-engine/use-typing-engine";

describe("custom time duration helpers", () => {
  it("ends the quick presets at 1m, reserving the fourth slot for the custom icon", () => {
    assert.deepEqual(TIME_DURATIONS, [15, 30, 60]);
    assert.equal(parseCustomDuration("120"), 120, "2 minutes remains a valid custom duration");
  });

  it("runs the selected arbitrary duration rather than rounding to a preset", () => {
    const timeDuration = parseCustomDuration("73")!;
    let state = createInitialState({ mode: "time", timeDuration, wordCount: 25, quoteLength: "medium",
      customText: "", punctuation: false, numbers: false, vocabDifficulty: "easy", wordDifficulty: "all" });
    state = reducer(state, { type: "SET_TYPED", value: state.words[0][0], now: 1000 });
    state = reducer(state, { type: "TICK", now: 73999 });
    assert.equal(state.status, "running");
    state = reducer(state, { type: "TICK", now: 74000 });
    assert.equal(state.status, "finished");
    assert.equal(state.elapsedMs, 73000);
  });
  it("accepts whole seconds in the supported range", () => {
    assert.equal(parseCustomDuration(` ${MIN_CUSTOM_TIME_DURATION} `), MIN_CUSTOM_TIME_DURATION);
    assert.equal(parseCustomDuration("3600"), 3600);
    assert.equal(parseCustomDuration(String(MAX_CUSTOM_TIME_DURATION)), MAX_CUSTOM_TIME_DURATION);
  });

  it("rejects blank, fractional, non-numeric, and out-of-range values", () => {
    for (const draft of ["", "  ", "1.5", "abc", "0", String(MAX_CUSTOM_TIME_DURATION + 1)]) {
      assert.equal(parseCustomDuration(draft), null, `Expected ${JSON.stringify(draft)} to be rejected`);
    }
  });

  it("formats preset and custom durations without losing unit context and omitting redundant zeros", () => {
    assert.equal(formatDuration(1), "1s");
    assert.equal(formatDuration(15), "15s");
    assert.equal(formatDuration(30), "30s");
    assert.equal(formatDuration(59), "59s");
    assert.equal(formatDuration(60), "1m");
    assert.equal(formatDuration(61), "1m 1s");
    assert.equal(formatDuration(70), "1m 10s");
    assert.equal(formatDuration(90), "1m 30s");
    assert.equal(formatDuration(119), "1m 59s");
    assert.equal(formatDuration(120), "2m");
    assert.equal(formatDuration(121), "2m 1s");
    assert.equal(formatDuration(125), "2m 5s");
    assert.equal(formatDuration(180), "3m");
    assert.equal(formatDuration(185), "3m 5s");
    assert.equal(formatDuration(300), "5m");
    assert.equal(formatDuration(600), "10m");
    assert.equal(formatDuration(3599), "59m 59s");
    assert.equal(formatDuration(3600), "1h");
    assert.equal(formatDuration(3661), "1h 1m 1s");
    assert.equal(formatDuration(3665), "1h 1m 5s");
  });

  describe("parseUrlDuration and getInitialUrlDuration", () => {
    it("parses valid URL duration parameter values in seconds", () => {
      assert.equal(parseUrlDuration("60"), 60);
      assert.equal(parseUrlDuration("180"), 180);
      assert.equal(parseUrlDuration("300"), 300);
      assert.equal(parseUrlDuration("600"), 600);
      assert.equal(parseUrlDuration(["300", "600"]), 300);
    });

    it("rejects invalid, negative, zero, decimal, and out-of-range URL duration values", () => {
      assert.equal(parseUrlDuration(null), null);
      assert.equal(parseUrlDuration(undefined), null);
      assert.equal(parseUrlDuration(""), null);
      assert.equal(parseUrlDuration("   "), null);
      assert.equal(parseUrlDuration("abc"), null);
      assert.equal(parseUrlDuration("-1"), null);
      assert.equal(parseUrlDuration("0"), null);
      assert.equal(parseUrlDuration("1.5"), null);
      assert.equal(parseUrlDuration("999999999"), null);
      assert.equal(parseUrlDuration("null"), null);
      assert.equal(parseUrlDuration("true"), null);
    });

    it("safely returns null for getInitialUrlDuration when not in browser environment", () => {
      assert.equal(getInitialUrlDuration(), null);
    });
  });
});

