/**
 * Typing engine tests.
 *
 * Driven against the reducer directly rather than a rendered component: the
 * reducer is the scoring engine, and through the UI a dropped keystroke and a
 * missed render look the same. Run with `npm test`.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createInitialState,
  reducer,
} from "@/lib/typing-engine/use-typing-engine";
import type { TestConfig, TestState } from "@/lib/typing-engine/engine-types";
import { splitOnCommit } from "@/lib/typing-engine/input-commit";
import {
  calculateAccuracy,
  calculateConsistency,
  calculateNetWpm,
  calculateRawWpm,
  round,
} from "@/lib/typing-engine/stats";

const BASE: TestConfig = {
  mode: "words",
  timeDuration: 15,
  wordCount: 10,
  quoteLength: "short",
  customText: "",
  punctuation: false,
  numbers: false,
};

/** A deterministic state with a known target, bypassing word generation. */
function stateFor(words: string[], config: Partial<TestConfig> = {}): TestState {
  const base = createInitialState({ ...BASE, ...config });
  return {
    ...base,
    words,
    wordStates: words.map((w) => ({ target: w, typed: "", chars: [] })),
    activeWordIndex: 0,
  };
}

/** Types a literal string, sending a space through COMMIT_WORD as the UI does. */
function type(state: TestState, text: string, startMs = 0): TestState {
  let s = state;
  let buffer = "";
  let t = startMs;
  for (const ch of text) {
    t += 10;
    if (ch === " ") {
      s = reducer(s, { type: "COMMIT_WORD", now: t });
      buffer = "";
    } else {
      buffer += ch;
      s = reducer(s, { type: "SET_TYPED", value: buffer, now: t });
    }
  }
  return s;
}

describe("character counting", () => {
  it("counts every correct character", () => {
    const s = type(stateFor(["abc"]), "abc");
    assert.equal(s.correctKeystrokes, 3);
    assert.equal(s.incorrectKeystrokes, 0);
  });

  it("counts a wrong character as incorrect, not as nothing", () => {
    const s = type(stateFor(["abc"]), "axc");
    assert.equal(s.correctKeystrokes, 2);
    assert.equal(s.incorrectKeystrokes, 1);
  });

  it("counts characters typed past the end of a word as extra", () => {
    let s = type(stateFor(["abc", "next"]), "abcd");
    s = reducer(s, { type: "COMMIT_WORD", now: 999 });
    assert.equal(s.charTally.extra, 1);
  });

  it("counts characters skipped by an early space as missed", () => {
    let s = type(stateFor(["abcdef", "next"]), "ab");
    s = reducer(s, { type: "COMMIT_WORD", now: 999 });
    assert.equal(s.charTally.missed, 4);
  });
});

describe("the space between words", () => {
  // The engine's single largest measurement error: pressing space advanced the
  // word cursor without ever being counted, so roughly one character per word
  // vanished from the score.
  it("counts the separator as a correct character", () => {
    const s = type(stateFor(["ab", "cd", "ef"]), "ab cd ");
    // 4 letters + 2 separators
    assert.equal(s.correctKeystrokes, 6);
  });

  it("does not credit a separator after the final word", () => {
    let s = type(stateFor(["ab", "cd"]), "ab cd");
    const before = s.correctKeystrokes;
    s = reducer(s, { type: "COMMIT_WORD", now: 500 });
    assert.equal(s.correctKeystrokes, before, "last word has no trailing space");
  });

  it("does not count a space pressed on an empty word", () => {
    let s = stateFor(["ab", "cd"]);
    s = reducer(s, { type: "COMMIT_WORD", now: 10 });
    assert.equal(s.correctKeystrokes, 0);
    assert.equal(s.activeWordIndex, 0, "cursor must not advance on an empty word");
  });

  it("reproduces the reported deficit", () => {
    // 18 four-letter words in 15s. Without separators this scored 72/5/0.25 =
    // 57.6 WPM; with them it is 89/5/0.25 = 71.2.
    const words = Array.from({ length: 18 }, () => "abcd");
    const s = type(stateFor(words), words.join(" ") + " ");
    const withoutSeparators = 18 * 4;
    assert.equal(s.correctKeystrokes, withoutSeparators + 17);
    const lost = calculateNetWpm(withoutSeparators, 15000);
    const actual = calculateNetWpm(s.correctKeystrokes, 15000);
    assert.ok(actual > lost * 1.2, `separators must recover >20%: ${lost} -> ${actual}`);
  });
});

describe("backspace", () => {
  it("keeps the wrong keystroke in history after it is deleted", () => {
    let s = type(stateFor(["abc"]), "ax");
    assert.equal(s.incorrectKeystrokes, 1);
    s = reducer(s, { type: "SET_TYPED", value: "a", now: 100 });
    assert.equal(s.incorrectKeystrokes, 1, "deleting a mistake does not un-make it");
  });

  it("records the deletion as a corrected error", () => {
    let s = type(stateFor(["abc"]), "ax");
    s = reducer(s, { type: "SET_TYPED", value: "a", now: 100 });
    assert.equal(s.correctedErrors, 1);
  });

  it("does not count a deleted correct character as a corrected error", () => {
    let s = type(stateFor(["abc"]), "ab");
    s = reducer(s, { type: "SET_TYPED", value: "a", now: 100 });
    assert.equal(s.correctedErrors, 0);
  });

  it("does not inflate the character count when retyping", () => {
    let s = type(stateFor(["abc"]), "ax");
    s = reducer(s, { type: "SET_TYPED", value: "a", now: 100 });
    s = reducer(s, { type: "SET_TYPED", value: "ab", now: 110 });
    s = reducer(s, { type: "SET_TYPED", value: "abc", now: 120 });
    assert.equal(s.correctKeystrokes, 3, "a,b,c correct");
    assert.equal(s.incorrectKeystrokes, 1, "the original x");
    assert.equal(s.totalTyped, 4, "four printable attempts were made");
  });
});

describe("totals", () => {
  it("totalTyped equals correct plus incorrect", () => {
    const s = type(stateFor(["abc", "de"]), "axc de");
    assert.equal(s.totalTyped, s.correctKeystrokes + s.incorrectKeystrokes);
  });

  it("counts backspace as a keypress but not as a character", () => {
    let s = type(stateFor(["abc"]), "ax");
    const typedBefore = s.totalTyped;
    s = reducer(s, { type: "SET_TYPED", value: "a", now: 100 });
    assert.equal(s.totalTyped, typedBefore, "backspace types nothing");
    assert.ok(s.totalKeypresses > typedBefore, "but it is still a keypress");
  });
});

describe("timer", () => {
  it("does not start before the first character", () => {
    const s = stateFor(["abc"]);
    assert.equal(s.status, "idle");
    assert.equal(s.startedAt, null);
  });

  it("starts on the first character, not on mount", () => {
    const s = reducer(stateFor(["abc"]), { type: "SET_TYPED", value: "a", now: 4242 });
    assert.equal(s.status, "running");
    assert.equal(s.startedAt, 4242);
  });

  it("records exactly the nominal duration for a completed time test", () => {
    let s = stateFor(["abcd", "efgh"], { mode: "time", timeDuration: 15 });
    s = reducer(s, { type: "SET_TYPED", value: "a", now: 1000 });
    // A tick lands past the boundary; the recorded duration must still be 15s.
    s = reducer(s, { type: "TICK", now: 1000 + 15_040 });
    assert.equal(s.status, "finished");
    assert.equal(s.elapsedMs, 15_000);
  });

  it("does not end early one tick before the boundary", () => {
    let s = stateFor(["abcd"], { mode: "time", timeDuration: 15 });
    s = reducer(s, { type: "SET_TYPED", value: "a", now: 0 });
    s = reducer(s, { type: "TICK", now: 14_999 });
    assert.equal(s.status, "running");
  });

  it("does not count the unfinished word as missed when time expires", () => {
    let s = stateFor(["abcdefgh"], { mode: "time", timeDuration: 15 });
    s = reducer(s, { type: "SET_TYPED", value: "ab", now: 0 });
    s = reducer(s, { type: "TICK", now: 15_000 });
    assert.equal(s.charTally.missed, 0, "the clock ran out; the user did not skip");
  });
});

describe("restart", () => {
  it("clears every counter", () => {
    let s = type(stateFor(["abc", "de"]), "axc de");
    s = reducer(s, { type: "RESTART" });
    assert.equal(s.correctKeystrokes, 0);
    assert.equal(s.incorrectKeystrokes, 0);
    assert.equal(s.totalTyped, 0);
    assert.equal(s.totalKeypresses, 0);
    assert.equal(s.correctedErrors, 0);
    assert.equal(s.charTally.extra, 0);
    assert.equal(s.charTally.missed, 0);
    assert.equal(s.status, "idle");
    assert.equal(s.startedAt, null);
    assert.equal(s.activeWordIndex, 0);
  });
});

describe("scoring is consistent and reproducible", () => {
  it("net WPM follows correct characters over elapsed time", () => {
    assert.equal(round(calculateNetWpm(108, 15_000)), 86);
    assert.equal(round(calculateNetWpm(82, 15_000)), 66);
  });

  it("raw WPM includes incorrect characters", () => {
    assert.ok(calculateRawWpm(100, 8, 15_000) > calculateNetWpm(100, 15_000));
  });

  it("accuracy counts skipped characters against the user", () => {
    assert.equal(calculateAccuracy(90, 0, 10), 90);
  });

  it("is deterministic for identical input", () => {
    const a = type(stateFor(["abc", "de", "fgh"]), "abc de fgh");
    const b = type(stateFor(["abc", "de", "fgh"]), "abc de fgh");
    assert.deepEqual(
      [a.correctKeystrokes, a.incorrectKeystrokes, a.totalTyped, a.charTally],
      [b.correctKeystrokes, b.incorrectKeystrokes, b.totalTyped, b.charTally],
    );
  });

  it("does not invent a score when nothing was typed", () => {
    const s = stateFor(["abc"]);
    assert.equal(calculateNetWpm(s.correctKeystrokes, s.elapsedMs), 0);
  });
});

describe("no score inflation", () => {
  it("never credits more correct characters than were typed", () => {
    const s = type(stateFor(["abc", "def"]), "abc def");
    assert.ok(s.correctKeystrokes <= s.totalTyped);
  });

  it("does not count untyped generated text", () => {
    // Ten words generated, one typed. The other nine must not score.
    const words = Array.from({ length: 10 }, () => "abcd");
    const s = type(stateFor(words), "abcd");
    assert.equal(s.correctKeystrokes, 4);
  });
});

describe("consistency", () => {
  /** Builds cumulative samples from a per-second character output. */
  function samples(perSecond: number[]) {
    let cumulative = 0;
    return perSecond.map((chars, i) => {
      cumulative += chars;
      const t = (i + 1) * 1000;
      const wpm = calculateNetWpm(cumulative, t);
      return { t, wpm, rawWpm: wpm, correct: cumulative, typed: cumulative };
    });
  }

  it("is perfect for perfectly even typing", () => {
    assert.equal(round(calculateConsistency(samples(Array(15).fill(7)))), 100);
  });

  it("collapses for a typist who alternates full speed and dead stops", () => {
    // The old formula scored the cumulative average, which converges no matter
    // how erratic the input, and reported 78% for this.
    const alternating = Array.from({ length: 15 }, (_, i) => (i % 2 === 0 ? 14 : 0));
    assert.ok(
      calculateConsistency(samples(alternating)) < 20,
      "alternating burst/stop is not consistent typing",
    );
  });

  it("penalises a long stall mid-test", () => {
    const steady = calculateConsistency(samples(Array(15).fill(7)));
    const stalled = calculateConsistency(samples([7, 7, 7, 7, 7, 7, 7, 0, 0, 0, 0, 7, 7, 7, 7]));
    assert.ok(stalled < steady - 30, `stall must cost: ${steady} vs ${stalled}`);
  });

  it("does not claim consistency it cannot measure", () => {
    assert.equal(calculateConsistency([]), 100);
    assert.equal(calculateConsistency(samples([5])), 100);
  });
});

describe("mobile keyboards deliver the space in the value", () => {
  // Android's GBoard reports composing input as keydown keyCode 229 / key
  // "Unidentified", so the desktop `key === " "` path never fires on a phone.
  // The space lands in the field value, and without this split it scored as a
  // wrong character -- leaving the test stuck on the first word.

  it("commits the word when a space arrives in the value", () => {
    assert.deepEqual(splitOnCommit("hello "), { value: "hello", commit: true });
  });

  it("does not commit while the word is still being typed", () => {
    assert.deepEqual(splitOnCommit("hel"), { value: "hel", commit: false });
  });

  it("keeps only the text before the space", () => {
    // Autocorrect can hand over the whole word plus its separator at once.
    assert.deepEqual(splitOnCommit("hello world"), { value: "hello", commit: true });
  });

  it("treats a leading space as an empty commit, not a typed character", () => {
    assert.deepEqual(splitOnCommit(" "), { value: "", commit: true });
  });

  it("never leaves a space inside the word buffer", () => {
    for (const raw of ["a ", " a", "ab cd", "  ", "x y z"]) {
      assert.ok(!splitOnCommit(raw).value.includes(" "), `leaked a space from ${JSON.stringify(raw)}`);
    }
  });

  it("drives a full mobile-style run to a correct score", () => {
    // The whole point: typing words and letting spaces arrive in the value
    // must score identically to the desktop keydown path.
    const words = ["ab", "cd", "ef"];
    let s = stateFor(words);
    let buffer = "";
    for (const word of words) {
      for (const ch of word) {
        buffer += ch;
        s = reducer(s, { type: "SET_TYPED", value: buffer, now: 10 });
      }
      const split = splitOnCommit(buffer + " ");
      s = reducer(s, { type: "SET_TYPED", value: split.value, now: 20 });
      if (split.commit) s = reducer(s, { type: "COMMIT_WORD", now: 21 });
      buffer = "";
    }
    assert.equal(s.incorrectKeystrokes, 0, "no space may be scored as a mistake");
    assert.equal(s.correctKeystrokes, 6 + 2, "6 letters + 2 separators");
    assert.equal(s.activeWordIndex, 2, "the cursor advanced through the words");
  });
});
