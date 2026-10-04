import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_CUSTOM_TIME_DURATION, MIN_CUSTOM_TIME_DURATION, TIME_DURATIONS } from "@/lib/typing-engine/engine-types";
import { formatDuration, parseCustomDuration } from "@/lib/typing-engine/custom-duration";
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

  it("formats preset and custom durations without losing unit context", () => {
    assert.equal(formatDuration(15), "15s");
    assert.equal(formatDuration(120), "2m");
    assert.equal(formatDuration(3665), "1h 1m 5s");
  });
});
