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
  vocabDifficulty: "easy",
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

describe("custom mode fallback", () => {
  it("provides fallback words when custom text is empty or whitespace", () => {
    const config = {
      mode: "custom" as const,
      timeDuration: 30 as const,
      wordCount: 25 as const,
      quoteLength: "medium" as const,
      customText: "   ",
      punctuation: false,
      numbers: false,
      vocabDifficulty: "easy" as const,
    };
    const s = createInitialState(config);
    assert.ok(s.words.length > 0, "must provide fallback words rather than an empty array");
    assert.ok(s.wordStates.length > 0, "wordStates must have entries");
    assert.equal(s.words[0], "The");
  });
});

describe("scoring integrity and Monkeytype-parity regression tests", () => {
  // 1. Perfect typing
  it("1. Perfect typing has 100% accuracy and standard WPM with correct separators", () => {
    const words = ["the", "quick", "brown", "fox", "jumps"];
    const s = type(stateFor(words), "the quick brown fox jumps");
    // "the " (3+1) + "quick " (5+1) + "brown " (5+1) + "fox " (3+1) + "jumps" (5) = 25 chars = 5 words
    assert.equal(s.correctKeystrokes, 25);
    assert.equal(s.incorrectKeystrokes, 0);
    assert.equal(s.totalTyped, 25);
    assert.equal(s.charTally.missed, 0);
    assert.equal(s.charTally.extra, 0);
    assert.equal(s.netWpmCharacters, 25);
    const acc = calculateAccuracy(s.correctKeystrokes, s.incorrectKeystrokes, s.charTally.missed);
    assert.equal(acc, 100);
    // 25 chars / 5 chars/word / 0.25 min = 20 WPM
    const netWpm = calculateNetWpm(s.netWpmCharacters, 15_000);
    assert.equal(round(netWpm), 20);
    const rawWpm = calculateRawWpm(s.correctKeystrokes, s.incorrectKeystrokes, 15_000);
    assert.equal(round(rawWpm), 20);
  });

  // 2. Completely wrong word + Space
  it("2. Completely wrong word + Space never credits the space or characters to Net WPM", () => {
    const words = ["hello", "world"];
    const s = type(stateFor(words), "zzzzz ");
    assert.equal(s.correctKeystrokes, 0, "no correct keystrokes");
    assert.equal(s.incorrectKeystrokes, 6, "5 wrong letters + 1 wrong space separator");
    assert.equal(s.totalTyped, 6);
    assert.equal(s.netWpmCharacters, 0, "net WPM characters must be 0");
    const netWpm = calculateNetWpm(s.netWpmCharacters, 15_000);
    assert.equal(netWpm, 0);
  });

  // 3. Random letters + frequent spaces
  it("3. Random letters + frequent spaces produces 0 Net WPM and no inflation from spaces", () => {
    const words = ["the", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog"];
    const s = type(stateFor(words), "xyz abcde qwerty mnop asdfgh qwer tyui opas dfgh ");
    assert.equal(s.netWpmCharacters, 0, "net WPM must be 0 for gibberish words");
    const netWpm = calculateNetWpm(s.netWpmCharacters, 15_000);
    assert.equal(netWpm, 0);
    assert.ok(s.incorrectKeystrokes > 30);
    assert.ok(s.totalTyped > 30);
  });

  // 4. Correct word + Space
  it("4. Correct word + Space gives intended credit for characters plus separator", () => {
    const words = ["first", "second"];
    const s = type(stateFor(words), "first ");
    assert.equal(s.correctKeystrokes, 6, "5 letters + 1 separator space");
    assert.equal(s.incorrectKeystrokes, 0);
    assert.equal(s.netWpmCharacters, 6);
  });

  // 5. Incomplete word + Space
  it("5. Incomplete word committed with Space gives no Net WPM credit", () => {
    const words = ["complete", "next"];
    const s = type(stateFor(words), "com ");
    assert.equal(s.correctKeystrokes, 3);
    assert.equal(s.incorrectKeystrokes, 1, "space after incomplete word is incorrect");
    assert.equal(s.charTally.missed, 5, "5 skipped characters");
    assert.equal(s.netWpmCharacters, 0, "incomplete word must NOT contribute to Net WPM");
  });

  // 6. Extra characters + Space
  it("6. Extra characters + Space remain errors/extra and give no Net WPM credit", () => {
    const words = ["fox", "next"];
    const s = type(stateFor(words), "foxes ");
    assert.equal(s.correctKeystrokes, 3, "f, o, x");
    assert.equal(s.incorrectKeystrokes, 3, "e (extra), s (extra), space (invalid)");
    assert.equal(s.charTally.extra, 2, "2 extra chars");
    assert.equal(s.netWpmCharacters, 0, "word with extra chars must NOT contribute to Net WPM");
  });

  // 7. Backspace behavior and historical accounting
  it("7. Backspace preserves historical keystroke accounting while fixing Net WPM credit", () => {
    const words = ["hello", "world"];
    let s = stateFor(words);
    // Type "helx"
    s = reducer(s, { type: "SET_TYPED", value: "helx", now: 10 });
    assert.equal(s.correctKeystrokes, 3);
    assert.equal(s.incorrectKeystrokes, 1);
    assert.equal(s.netWpmCharacters, 0, "uncorrected error prevents net WPM credit");

    // Backspace to "hel"
    s = reducer(s, { type: "SET_TYPED", value: "hel", now: 20 });
    assert.equal(s.correctKeystrokes, 3, "correct keystrokes preserved");
    assert.equal(s.incorrectKeystrokes, 1, "mistake remains in history");
    assert.equal(s.correctedErrors, 1, "deletion recorded as corrected error");
    assert.equal(s.netWpmCharacters, 3, "clean prefix now contributes to in-progress Net WPM");

    // Finish typing "hello "
    s = reducer(s, { type: "SET_TYPED", value: "hello", now: 30 });
    s = reducer(s, { type: "COMMIT_WORD", now: 40 });
    assert.equal(s.correctKeystrokes, 6, "5 letters + 1 valid space separator");
    assert.equal(s.incorrectKeystrokes, 1, "1 deleted mistake");
    assert.equal(s.totalTyped, 7, "3+1+2+1 = 7 physical printable keys");
    assert.equal(s.netWpmCharacters, 6, "completely corrected word awards full Net WPM credit");
  });

  // 8. Timer expiration during partially typed word
  it("8a. Timer expiration credits clean prefix characters of active word to Net WPM", () => {
    let s = stateFor(["the", "running"], { mode: "time", timeDuration: 15 });
    s = type(s, "the ");
    assert.equal(s.netWpmCharacters, 4); // 3 + 1

    s = reducer(s, { type: "SET_TYPED", value: "runn", now: 1000 });
    assert.equal(s.netWpmCharacters, 8); // 4 + 4

    const start = s.startedAt ?? 0;
    s = reducer(s, { type: "TICK", now: start + 15_000 });
    assert.equal(s.status, "finished");
    assert.equal(s.netWpmCharacters, 8, "clean partial word characters credited");
    assert.equal(s.charTally.missed, 0, "partial word at expiry not marked as missed");
  });

  it("8b. Timer expiration does NOT credit partial word if it contains an error", () => {
    let s = stateFor(["the", "running"], { mode: "time", timeDuration: 15 });
    s = type(s, "the ");
    s = reducer(s, { type: "SET_TYPED", value: "ruxx", now: 1000 });
    assert.equal(s.netWpmCharacters, 4, "error in active word yields 0 credit for that word");

    const start = s.startedAt ?? 0;
    s = reducer(s, { type: "TICK", now: start + 15_000 });
    assert.equal(s.status, "finished");
    assert.equal(s.netWpmCharacters, 4, "erroneous active word yields 0 Net WPM credit");
  });

  // 9. 15s, 30s, 60s, 120s modes
  it("9. Handles 15s, 30s, 60s, and 120s time mode durations correctly", () => {
    for (const duration of [15, 30, 60, 120]) {
      let s = stateFor(["word", "test", "time", "clock"], { mode: "time", timeDuration: duration });
      s = type(s, "word ");
      assert.equal(s.netWpmCharacters, 5);
      const start = s.startedAt ?? 0;
      s = reducer(s, { type: "TICK", now: start + duration * 1000 });
      assert.equal(s.status, "finished");
      assert.equal(s.elapsedMs, duration * 1000);
    }
  });

  // 10. punctuation, numbers, quote, custom, vocabulary modes
  it("10. Scoring holds consistently across modes (punctuation, numbers, quote, custom, vocabulary)", () => {
    let sQuote = createInitialState({ ...BASE, mode: "quote", quoteLength: "short" });
    const firstWord = sQuote.words[0];
    sQuote = type(sQuote, firstWord + " ");
    assert.equal(sQuote.netWpmCharacters, firstWord.length + 1);

    let sCustom = createInitialState({ ...BASE, mode: "custom", customText: "special-case 1234 test" });
    sCustom = type(sCustom, "special-case ");
    assert.equal(sCustom.netWpmCharacters, 13); // 12 + 1

    let sPunct = createInitialState({ ...BASE, mode: "words", punctuation: true, numbers: true, wordCount: 10 });
    const pWord = sPunct.words[0];
    sPunct = type(sPunct, pWord + " ");
    assert.equal(sPunct.netWpmCharacters, pWord.length + 1);
  });

  // 11. Mobile / splitOnCommit space delivery
  it("11. Mobile splitOnCommit space delivery scores identical to desktop keydown", () => {
    const words = ["alpha", "beta"];
    let s = stateFor(words);
    const { value, commit } = splitOnCommit("alpha ");
    s = reducer(s, { type: "SET_TYPED", value, now: 100 });
    if (commit) s = reducer(s, { type: "COMMIT_WORD", now: 101 });

    assert.equal(s.correctKeystrokes, 6);
    assert.equal(s.incorrectKeystrokes, 0);
    assert.equal(s.netWpmCharacters, 6);
    assert.equal(s.activeWordIndex, 1);
  });

  // 12. Single physical keystroke is counted exactly once
  it("12. Single physical keystroke is counted exactly once in totalTyped and totalKeypresses", () => {
    let s = stateFor(["ab"]);
    s = reducer(s, { type: "SET_TYPED", value: "a", now: 10 });
    assert.equal(s.totalTyped, 1);
    assert.equal(s.totalKeypresses, 1);
    assert.equal(s.correctKeystrokes, 1);
    assert.equal(s.incorrectKeystrokes, 0);

    s = reducer(s, { type: "SET_TYPED", value: "ab", now: 20 });
    assert.equal(s.totalTyped, 2);
    assert.equal(s.totalKeypresses, 2);
    assert.equal(s.correctKeystrokes, 2);
    assert.equal(s.incorrectKeystrokes, 0);
  });
});
