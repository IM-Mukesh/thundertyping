import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TestConfig, TestState } from "@/lib/typing-engine/engine-types";
import {
  createInitialState,
  reducer,
  selectDisplayWordStates,
} from "@/lib/typing-engine/use-typing-engine";

const CONFIG: TestConfig = {
  mode: "custom",
  customText: "hello world next",
  timeDuration: 15,
  wordCount: 10,
  quoteLength: "short",
  punctuation: false,
  numbers: false,
  vocabDifficulty: "easy",
  wordDifficulty: "all",
};

function initial(config: Partial<TestConfig> = {}): TestState {
  const state = createInitialState({ ...CONFIG, ...config });
  // Keep time-mode expiry cases deterministic too.
  const words = (config.customText ?? CONFIG.customText).split(" ");
  return { ...state, words, wordStates: words.map((target) => ({ target, typed: "", chars: [] })) };
}

function preview(state: TestState, value: string | null, now: number): TestState {
  return reducer(state, { type: "COMPOSITION_PREVIEW", value, now });
}

function scored(state: TestState) {
  return {
    correct: state.correctKeystrokes,
    incorrect: state.incorrectKeystrokes,
    typed: state.totalTyped,
    keypresses: state.totalKeypresses,
    corrected: state.correctedErrors,
    net: state.netWpmCharacters,
    committedNet: state.committedNetWpmChars,
    tally: state.charTally,
  };
}

describe("unscored composition preview", () => {
  it("shows candidate characters and caret text without changing committed words or scores", () => {
    const before = initial();
    const state = preview(before, "hexlop", 100);
    const display = selectDisplayWordStates(state);
    assert.equal(state.compositionPreview, "hexlop");
    assert.equal(display[0].typed, "hexlop");
    assert.deepEqual(display[0].chars, ["correct", "correct", "incorrect", "correct", "correct", "extra"]);
    assert.notEqual(display, state.wordStates);
    assert.equal(display[1], state.wordStates[1]);
    assert.equal(state.wordStates, before.wordStates);
    assert.equal(state.wordStates[0].typed, "");
    assert.deepEqual(scored(state), scored(before));
    assert.deepEqual(selectDisplayWordStates(state), display, "the selector is repeatable and does not mutate state");
  });

  it("starts the real clock on the first nonempty draft, never on an empty preview", () => {
    let state = initial();
    state = preview(state, null, 50);
    state = preview(state, "", 75);
    assert.equal(state.status, "idle");
    assert.equal(state.startedAt, null);
    state = preview(state, "h", 100);
    assert.equal(state.status, "running");
    assert.equal(state.startedAt, 100);
    state = preview(state, "he", 200);
    state = reducer(state, { type: "TICK", now: 1100 });
    assert.equal(state.startedAt, 100);
    assert.equal(state.elapsedMs, 1000);
    assert.deepEqual(state.wpmSamples, [{ t: 1000, wpm: 0, rawWpm: 0, correct: 0, typed: 0 }]);
  });

  it("replaces candidates live and scores only the final choice once", () => {
    let state = preview(initial(), "hx", 100);
    state = preview(state, "hexlop", 200);
    state = preview(state, "hello", 300);
    assert.equal(selectDisplayWordStates(state)[0].typed, "hello");
    assert.equal(state.totalTyped, 0);
    assert.equal(state.totalKeypresses, 0);
    assert.equal(state.correctedErrors, 0);
    state = reducer(state, { type: "SET_TYPED", value: "hello", now: 1100 });
    assert.equal(state.compositionPreview, null);
    assert.equal(state.wordStates[0].typed, "hello");
    assert.equal(selectDisplayWordStates(state), state.wordStates);
    assert.equal(state.startedAt, 100);
    assert.equal(state.correctKeystrokes, 5);
    assert.equal(state.incorrectKeystrokes, 0);
    assert.equal(state.totalTyped, 5);
    assert.equal(state.totalKeypresses, 1);
    assert.equal(state.correctedErrors, 0);
    assert.equal(state.netWpmCharacters, 5);
    assert.equal(reducer(state, { type: "SET_TYPED", value: "hello", now: 1101 }), state);
  });

  it("scores replacements against committed prior text, preserving real mistake history", () => {
    let state = reducer(initial(), { type: "SET_TYPED", value: "hexlo", now: 100 });
    const before = scored(state);
    state = preview(state, "heyyy", 200);
    state = preview(state, "hello", 300);
    assert.deepEqual(scored(state), before);
    assert.equal(state.wordStates[0].typed, "hexlo");
    state = reducer(state, { type: "SET_TYPED", value: "hello", now: 400 });
    assert.equal(state.correctKeystrokes, 5, "only the replaced third character is newly correct");
    assert.equal(state.incorrectKeystrokes, 1, "the real x attempt remains in history");
    assert.equal(state.correctedErrors, 1);
    assert.equal(state.totalTyped, 6);
    assert.equal(state.totalKeypresses, 2);
    assert.equal(state.netWpmCharacters, 5);
    assert.equal(state.compositionPreview, null);
  });

  it("clears a candidate finalized to unchanged text without inventing a keypress", () => {
    let state = reducer(initial(), { type: "SET_TYPED", value: "he", now: 100 });
    const before = scored(state);
    state = preview(state, "hey", 200);
    state = reducer(state, { type: "SET_TYPED", value: "he", now: 300 });
    assert.equal(state.compositionPreview, null);
    assert.equal(selectDisplayWordStates(state), state.wordStates);
    assert.deepEqual(scored(state), before);
    assert.equal(state.startedAt, 100);
  });

  it("ignores duplicate empty input without starting a test", () => {
    const state = initial();
    assert.equal(reducer(state, { type: "SET_TYPED", value: "", now: 100 }), state);
    assert.equal(state.status, "idle");
  });

  it("cancel restores the committed text while keeping composition time on the clock", () => {
    let state = reducer(initial(), { type: "SET_TYPED", value: "he", now: 100 });
    const committed = state.wordStates;
    const before = scored(state);
    state = preview(state, "hello", 500);
    state = preview(state, null, 1100);
    assert.equal(state.compositionPreview, null);
    assert.equal(selectDisplayWordStates(state), committed);
    assert.deepEqual(scored(state), before);
    assert.equal(state.status, "running");
    assert.equal(state.startedAt, 100);
    state = reducer(state, { type: "TICK", now: 2100 });
    assert.equal(state.elapsedMs, 2000);
  });

  it("canceling the initial candidate does not reset the timer", () => {
    let state = preview(initial(), "h", 0);
    state = preview(state, null, 1000);
    state = preview(state, "w", 2000);
    assert.equal(state.startedAt, 0);
    assert.equal(state.status, "running");
    assert.equal(state.totalTyped, 0);
    state = reducer(state, { type: "SET_TYPED", value: "", now: 3000 });
    assert.equal(state.compositionPreview, null);
    assert.equal(state.startedAt, 0);
    assert.equal(state.totalKeypresses, 0);
  });

  it("can preview an empty replacement without deleting committed text or scoring a correction", () => {
    let state = reducer(initial(), { type: "SET_TYPED", value: "hx", now: 100 });
    const before = scored(state);
    state = preview(state, "", 200);
    assert.equal(selectDisplayWordStates(state)[0].typed, "");
    assert.deepEqual(selectDisplayWordStates(state)[0].chars, Array(5).fill("pending"));
    assert.equal(state.wordStates[0].typed, "hx");
    assert.deepEqual(scored(state), before);
    state = reducer(state, { type: "SET_TYPED", value: "", now: 300 });
    assert.equal(state.wordStates[0].typed, "");
    assert.equal(state.correctedErrors, 1);
    assert.equal(state.totalKeypresses, 2);
  });

  it("does not commit a provisional draft, even when committed text already exists", () => {
    for (const typed of ["", "he"]) {
      let state = initial();
      if (typed) state = reducer(state, { type: "SET_TYPED", value: typed, now: 100 });
      state = preview(state, "hello", 200);
      assert.equal(reducer(state, { type: "COMMIT_WORD", now: 300 }), state);
      assert.equal(state.activeWordIndex, 0);
      assert.equal(state.compositionPreview, "hello");
    }
  });

  it("safely clears a preview equal to committed text when advancing", () => {
    let state = reducer(initial(), { type: "SET_TYPED", value: "hello", now: 100 });
    state = preview(state, "hello", 200);
    state = reducer(state, { type: "COMMIT_WORD", now: 300 });
    assert.equal(state.activeWordIndex, 1);
    assert.equal(state.compositionPreview, null);
    assert.equal(state.correctKeystrokes, 6);
    assert.equal(state.netWpmCharacters, 6);
    assert.equal(selectDisplayWordStates(state)[1].typed, "");
  });

  it("finalizes then commits the candidate with the normal separator scoring", () => {
    let state = preview(initial(), "hello", 100);
    state = reducer(state, { type: "SET_TYPED", value: "hello", now: 200 });
    state = reducer(state, { type: "COMMIT_WORD", now: 201 });
    assert.equal(state.activeWordIndex, 1);
    assert.equal(state.compositionPreview, null);
    assert.equal(state.correctKeystrokes, 6);
    assert.equal(state.totalTyped, 6);
    assert.equal(state.netWpmCharacters, 6);
    state = preview(state, "wo", 300);
    assert.equal(selectDisplayWordStates(state)[1].typed, "wo");
    assert.equal(state.wordStates[0].typed, "hello");
    assert.equal(state.wordStates[1].typed, "");
    assert.equal(state.netWpmCharacters, 6);
  });
});

describe("composition deadline and end boundaries", () => {
  const expiryActions = [
    { type: "TICK" },
    { type: "COMPOSITION_PREVIEW", value: "hello" },
    { type: "COMPOSITION_PREVIEW", value: null },
    { type: "SET_TYPED", value: "hello" },
    { type: "COMMIT_WORD" },
  ] as const;

  for (const action of expiryActions) {
    it(`expires on ${action.type}${"value" in action ? ` (${String(action.value)})` : ""} without scoring candidates`, () => {
      let state = preview(initial({ mode: "time" }), "hello!", 100);
      state = reducer(state, { ...action, now: 15_100 });
      assert.equal(state.status, "finished");
      assert.equal(state.elapsedMs, 15_000);
      assert.equal(state.compositionPreview, null);
      assert.equal(state.totalTyped, 0);
      assert.equal(state.totalKeypresses, 0);
      assert.equal(state.correctKeystrokes, 0);
      assert.equal(state.incorrectKeystrokes, 0);
      assert.equal(state.netWpmCharacters, 0);
      assert.deepEqual(state.charTally, { extra: 0, missed: 0 });
      assert.equal(selectDisplayWordStates(state), state.wordStates);
      assert.equal(state.wordStates[0].typed, "");
    });
  }

  it("keeps committed scoring at expiry and ignores candidate corrections and extras", () => {
    let state = reducer(initial({ mode: "time" }), { type: "SET_TYPED", value: "he", now: 100 });
    const before = scored(state);
    state = preview(state, "hellooo", 200);
    state = reducer(state, { type: "TICK", now: 15_200 });
    assert.equal(state.status, "finished");
    assert.equal(state.elapsedMs, 15_000);
    assert.deepEqual(scored(state), before);
    assert.equal(state.wordStates[0].typed, "he");
    assert.equal(state.netWpmCharacters, 2);
    assert.equal(state.compositionPreview, null);
  });

  it("still tallies finalized extra characters when a candidate is present at expiry", () => {
    let state = reducer(initial({ mode: "time" }), { type: "SET_TYPED", value: "hello!", now: 100 });
    state = preview(state, "hello", 200);
    state = reducer(state, { type: "TICK", now: 15_100 });
    assert.equal(state.charTally.extra, 1);
    assert.equal(state.incorrectKeystrokes, 1);
    assert.equal(state.wordStates[0].typed, "hello!");
    assert.equal(state.netWpmCharacters, 0);
  });

  it("accepts final input just before the deadline and still ends on time", () => {
    let state = preview(initial({ mode: "time" }), "hello", 100);
    state = reducer(state, { type: "SET_TYPED", value: "hello", now: 15_099 });
    assert.equal(state.status, "running");
    assert.equal(state.totalTyped, 5);
    state = reducer(state, { type: "TICK", now: 15_100 });
    assert.equal(state.status, "finished");
    assert.equal(state.elapsedMs, 15_000);
    assert.equal(state.correctKeystrokes, 5);
  });

  it("does not auto-finish the final word until the candidate is finalized", () => {
    let state = preview(initial({ customText: "hello" }), "hello", 100);
    assert.equal(state.status, "running");
    assert.equal(state.totalTyped, 0);
    state = reducer(state, { type: "SET_TYPED", value: "hello", now: 3100 });
    assert.equal(state.status, "finished");
    assert.equal(state.elapsedMs, 3000, "the initial composition time is part of the result");
    assert.equal(state.compositionPreview, null);
    assert.equal(state.correctKeystrokes, 5);
    assert.equal(selectDisplayWordStates(state), state.wordStates);
  });

  it("clears the preview when safely committing the final incomplete word", () => {
    let state = reducer(initial({ customText: "hello" }), { type: "SET_TYPED", value: "he", now: 100 });
    state = preview(state, "he", 200);
    state = reducer(state, { type: "COMMIT_WORD", now: 300 });
    assert.equal(state.status, "finished");
    assert.equal(state.compositionPreview, null);
    assert.equal(state.charTally.missed, 3);
    assert.equal(state.netWpmCharacters, 0);
    assert.equal(state.elapsedMs, 200);
  });

  it("rejects late candidate and duplicate final events after finishing", () => {
    let state = preview(initial({ customText: "hello" }), "hello", 100);
    state = reducer(state, { type: "SET_TYPED", value: "hello", now: 200 });
    assert.equal(preview(state, "wrong", 300), state);
    assert.equal(preview(state, null, 301), state);
    assert.equal(reducer(state, { type: "SET_TYPED", value: "hello", now: 302 }), state);
    assert.equal(reducer(state, { type: "COMMIT_WORD", now: 303 }), state);
  });

  it("checks the deadline before ignoring duplicate input or preview values", () => {
    let state = reducer(initial({ mode: "time" }), { type: "SET_TYPED", value: "he", now: 100 });
    assert.equal(reducer(state, { type: "SET_TYPED", value: "he", now: 15_100 }).status, "finished");
    state = preview(state, "hello", 200);
    assert.equal(preview(state, "hello", 15_100).status, "finished");
  });
});

describe("composition reset boundaries", () => {
  it("clears drafts and increments the input revision on restart and config changes", () => {
    let state = initial();
    assert.equal(state.inputRevision, 0);
    assert.equal(state.compositionPreview, null);
    state = preview(state, "hello", 100);
    state = reducer(state, { type: "RESTART" });
    assert.equal(state.inputRevision, 1);
    assert.equal(state.compositionPreview, null);
    assert.equal(state.status, "idle");
    assert.equal(state.startedAt, null);
    assert.equal(state.totalTyped, 0);
    assert.equal(selectDisplayWordStates(state), state.wordStates);
    state = preview(state, "h", 200);
    state = reducer(state, { type: "APPLY_CONFIG", config: { ...CONFIG, customText: "new words" } });
    assert.equal(state.inputRevision, 2);
    assert.equal(state.compositionPreview, null);
    assert.equal(state.status, "idle");
    assert.equal(state.startedAt, null);
    assert.deepEqual(state.words, ["new", "words"]);
    state = reducer(state, { type: "RESTART" });
    assert.equal(state.inputRevision, 3, "even an empty reset invalidates the input's local draft");
  });
});
