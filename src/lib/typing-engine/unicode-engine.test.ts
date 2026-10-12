import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TestConfig, TestState } from "@/lib/typing-engine/engine-types";
import { computePaceCaretPosition } from "@/lib/typing-engine/pace-caret";
import {
  calculateActiveWordNetWpmChars,
  calculateCommittedWordNetWpmChars,
  calculateNetWpmCharacters,
} from "@/lib/typing-engine/stats";
import { segmentGraphemes, segmentGraphemesFallback } from "@/lib/typing-engine/unicode";
import { createInitialState, reducer, selectDisplayWordStates } from "@/lib/typing-engine/use-typing-engine";

const CONFIG: TestConfig = {
  mode: "custom",
  customText: "",
  timeDuration: 15,
  wordCount: 10,
  quoteLength: "short",
  punctuation: false,
  numbers: false,
  vocabDifficulty: "easy",
  wordDifficulty: "all",
};

const WORDS: [string, string[]][] = [
  ["हिंदी", ["हिं", "दी"]],
  ["नमस्ते", ["न", "म", "स्ते"]],
  ["सीखना", ["सी", "ख", "ना"]],
  ["किताब", ["कि", "ता", "ब"]],
  ["दुनिया", ["दु", "नि", "या"]],
  ["अच्छा", ["अ", "च्छा"]],
  ["विद्यालय", ["वि", "द्या", "ल", "य"]],
  ["क्षमा", ["क्ष", "मा"]],
  ["त्रिकोण", ["त्रि", "को", "ण"]],
  ["ज्ञान", ["ज्ञा", "न"]],
  ["माँ", ["माँ"]],
  ["फ़ैसला", ["फ़ै", "स", "ला"]],
  ["mañana", ["m", "a", "ñ", "a", "n", "a"]],
  ["español", ["e", "s", "p", "a", "ñ", "o", "l"]],
  ["acción", ["a", "c", "c", "i", "ó", "n"]],
  ["rápido", ["r", "á", "p", "i", "d", "o"]],
  ["你好", ["你", "好"]],
  ["中文输入", ["中", "文", "输", "入"]],
  ["𠮷野家", ["𠮷", "野", "家"]],
];

function initial(text: string): TestState {
  return createInitialState({ ...CONFIG, customText: text });
}

function type(state: TestState, value: string, now = 100): TestState {
  return reducer(state, { type: "SET_TYPED", value, now });
}

describe("Unicode visual-unit engine accounting", () => {
  it("segments every requested language with Intl.Segmenter and the deterministic fallback", () => {
    for (const [word, graphemes] of WORDS) {
      assert.deepEqual(segmentGraphemes(word), graphemes, word);
      assert.deepEqual(segmentGraphemesFallback(word), graphemes, `${word} fallback`);
    }
    assert.deepEqual(segmentGraphemesFallback("👩‍👩‍👧‍👦"), ["👩‍👩‍👧‍👦"]);
    assert.deepEqual(segmentGraphemesFallback("🇮🇳"), ["🇮🇳"]);
    assert.deepEqual(segmentGraphemesFallback("\r\n"), ["\r\n"]);
  });

  for (const [word, graphemes] of WORDS) {
    it(`scores and completes ${word} by grapheme, both batched and incrementally`, () => {
      const batched = type(initial(word), word);
      let incremental = initial(word);
      let value = "";
      for (const grapheme of graphemes) {
        value += grapheme;
        incremental = type(incremental, value);
      }
      for (const state of [batched, incremental]) {
        assert.equal(state.status, "finished");
        assert.deepEqual(state.wordStates[0].chars, graphemes.map(() => "correct"));
        assert.equal(state.wordStates[0].typed, word);
        assert.equal(state.correctKeystrokes, graphemes.length);
        assert.equal(state.totalTyped, graphemes.length);
        assert.equal(state.incorrectKeystrokes, 0);
        assert.equal(state.netWpmCharacters, graphemes.length);
        assert.deepEqual(state.charTally, { extra: 0, missed: 0 });
      }
    });
  }

  it("counts a whole wrong cluster and its correction once, including a shared matra suffix", () => {
    let state = type(initial("किताब आगे"), "किदाब");
    assert.deepEqual(state.wordStates[0].chars, ["correct", "incorrect", "correct"]);
    assert.equal(state.correctKeystrokes, 2);
    assert.equal(state.incorrectKeystrokes, 1);
    state = type(state, "किताब", 200);
    assert.deepEqual(state.wordStates[0].chars, ["correct", "correct", "correct"]);
    assert.equal(state.correctedErrors, 1);
    assert.equal(state.correctKeystrokes, 3, "unchanged suffixes are not credited again");
    assert.equal(state.incorrectKeystrokes, 1, "the original error stays in history");
    assert.equal(state.totalTyped, 4);
    assert.equal(state.netWpmCharacters, 3);
  });

  it("diffs a middle insertion/deletion at grapheme boundaries", () => {
    let state = type(initial("हिंदी आगे"), "हिंदी");
    state = type(state, "हिंक्षदी", 200);
    assert.equal(state.totalTyped, 3);
    assert.equal(state.incorrectKeystrokes, 1);
    assert.deepEqual(state.wordStates[0].chars, ["correct", "incorrect", "extra"]);
    state = type(state, "हिंदी", 300);
    assert.equal(state.totalTyped, 3, "a deletion does not type another character");
    assert.equal(state.correctedErrors, 1);
    assert.equal(state.netWpmCharacters, 2);
    assert.deepEqual(state.wordStates[0].chars, ["correct", "correct"]);
  });

  it("backspacing a multi-code-point grapheme removes one error, not its component marks", () => {
    let state = type(initial("माँ आगे"), "माँक्ष");
    assert.deepEqual(state.wordStates[0].chars, ["correct", "extra"]);
    assert.equal(state.totalTyped, 2);
    assert.equal(state.incorrectKeystrokes, 1);
    state = type(state, "माँ", 200);
    assert.equal(state.correctedErrors, 1);
    assert.equal(state.totalTyped, 2);
    assert.equal(state.netWpmCharacters, 1);
    state = type(state, "", 300);
    assert.equal(state.correctedErrors, 1, "removing a correct cluster is not an error");
    assert.equal(state.totalTyped, 2);
    assert.deepEqual(state.wordStates[0].chars, ["pending"]);
  });

  it("counts missed conjuncts and extra clusters exactly once on commit", () => {
    let state = type(initial("नमस्ते माँ आगे"), "नम");
    state = reducer(state, { type: "COMMIT_WORD", now: 200 });
    assert.deepEqual(state.wordStates[0].chars, ["correct", "correct", "missed"]);
    assert.equal(state.charTally.missed, 1);
    state = type(state, "माँक्ष", 300);
    state = reducer(state, { type: "COMMIT_WORD", now: 400 });
    assert.deepEqual(state.charTally, { extra: 1, missed: 1 });
    assert.equal(state.totalTyped, 6, "four clusters and two separators");
    assert.equal(state.incorrectKeystrokes, 3, "one extra and two invalid separators");
  });

  it("credits valid separators in the same grapheme units as active and committed WPM", () => {
    let state = type(initial("हिंदी किताब"), "हिंदी");
    state = reducer(state, { type: "COMMIT_WORD", now: 200 });
    state = type(state, "किता", 300);
    assert.equal(state.correctKeystrokes, 5);
    assert.equal(state.netWpmCharacters, 5);
    assert.equal(state.committedNetWpmChars, 3);
    assert.equal(calculateNetWpmCharacters(state.words, state.wordStates, state.activeWordIndex), 5);
    assert.equal(calculateActiveWordNetWpmChars("किताब", "कि"), 1);
    assert.equal(calculateActiveWordNetWpmChars("किताब", "क"), 0, "a partial matra cluster is not a correct grapheme");
    assert.equal(calculateCommittedWordNetWpmChars(state.wordStates[0], false), 3);
  });

  it("uses canonical equality for comparisons and completion without rewriting input", () => {
    for (const [target, typed] of [["mañana", "man\u0303ana"], ["फ़ैसला", "\u095eैसला"]]) {
      const state = type(initial(target), typed);
      assert.equal(state.status, "finished");
      assert.equal(state.incorrectKeystrokes, 0);
      assert.equal(state.wordStates[0].typed, typed, "native input code points are retained");
      assert.equal(state.wordStates[0].target, target, "prompt code points are retained");
      assert.ok(state.wordStates[0].chars.every((char) => char === "correct"));
    }
  });

  it("does not double-score a canonically identical compositionend/input pair", () => {
    let state = type(initial("mañana next"), "mañana");
    state = reducer(state, { type: "COMPOSITION_PREVIEW", value: "man\u0303ana", now: 200 });
    state = type(state, "man\u0303ana", 300);
    assert.equal(state.compositionPreview, null);
    assert.equal(state.wordStates[0].typed, "man\u0303ana");
    assert.equal(state.correctKeystrokes, 6);
    assert.equal(state.incorrectKeystrokes, 0);
    assert.equal(state.totalKeypresses, 1);
    state = reducer(state, { type: "COMMIT_WORD", now: 400 });
    assert.equal(state.correctKeystrokes, 7);
    assert.equal(state.netWpmCharacters, 7);
  });

  it("preserves meaningful marks and never folds visually similar but different words", () => {
    for (const [target, typed] of [["माँ", "मा"], ["फ़ैसला", "फैसला"], ["हिंदी", "हिदी"], ["mañana", "manana"], ["中文", "中又"]]) {
      const state = type(initial(target), typed);
      assert.equal(state.status, "running", `${target} cannot be completed by ${typed}`);
      assert.equal(state.incorrectKeystrokes, 1);
      assert.equal(state.netWpmCharacters, 0);
    }
  });
});

describe("Unicode composition and caret boundaries", () => {
  it("previews changing Hindi marks and conjuncts without scoring or finishing early", () => {
    let state = initial("हिंदी");
    for (const value of ["ह", "हि", "हिं", "हिंद", "हिंदी"]) {
      state = reducer(state, { type: "COMPOSITION_PREVIEW", value, now: 100 });
      assert.equal(state.status, "running");
      assert.equal(state.totalTyped, 0);
      assert.equal(state.incorrectKeystrokes, 0);
      assert.equal(state.wordStates[0].typed, "");
      assert.equal(selectDisplayWordStates(state)[0].typed, value);
    }
    assert.deepEqual(selectDisplayWordStates(state)[0].chars, ["correct", "correct"]);
    state = type(state, "हिंदी", 2100);
    assert.equal(state.status, "finished");
    assert.equal(state.elapsedMs, 2000);
    assert.equal(state.correctKeystrokes, 2);
    assert.equal(state.totalKeypresses, 1);
    assert.equal(reducer(state, { type: "SET_TYPED", value: "हिंदी", now: 2101 }), state);
  });

  it("blocks word commit while a Hindi candidate is unfinished and discards it on cancel", () => {
    let state = type(initial("नमस्ते आगे"), "नम");
    state = reducer(state, { type: "COMPOSITION_PREVIEW", value: "नमस्ते", now: 200 });
    assert.equal(reducer(state, { type: "COMMIT_WORD", now: 300 }), state);
    assert.deepEqual(selectDisplayWordStates(state)[0].chars, ["correct", "correct", "correct"]);
    state = reducer(state, { type: "COMPOSITION_PREVIEW", value: null, now: 400 });
    assert.deepEqual(selectDisplayWordStates(state)[0].chars, ["correct", "correct", "pending"]);
    assert.equal(state.correctKeystrokes, 2);
    assert.equal(state.correctedErrors, 0);
  });

  it("scores Chinese candidates only at commit", () => {
    let state = initial("中文输入");
    for (const value of ["zhong", "中", "中文", "中文输入"]) {
      state = reducer(state, { type: "COMPOSITION_PREVIEW", value, now: 100 });
    }
    assert.equal(state.totalTyped, 0);
    state = type(state, "中文输入", 1000);
    assert.equal(state.status, "finished");
    assert.equal(state.correctKeystrokes, 4);
    assert.equal(state.incorrectKeystrokes, 0);
  });

  it("positions the pace caret on clusters and the inter-word separator", () => {
    // 60 WPM is five graphemes per second.
    assert.deepEqual(computePaceCaretPosition(["हिंदी", "माँ"], 200, 60), { wordIndex: 0, charIndex: 1 });
    assert.deepEqual(computePaceCaretPosition(["हिंदी", "माँ"], 400, 60), { wordIndex: 0, charIndex: 2 });
    assert.deepEqual(computePaceCaretPosition(["हिंदी", "माँ"], 600, 60), { wordIndex: 1, charIndex: 0 });
    assert.deepEqual(computePaceCaretPosition(["हिंदी", "माँ"], 6000, 60), { wordIndex: 1, charIndex: 1 });
    assert.deepEqual(computePaceCaretPosition(["man\u0303ana", "𠮷野家"], 1400, 60), { wordIndex: 1, charIndex: 0 });
  });
});
