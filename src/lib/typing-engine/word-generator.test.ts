import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { COMMON_WORD_COUNT, generateWords } from "@/lib/typing-engine/word-generator";
import { ENGLISH_WORDS } from "@/data/words/english-1k";

describe("word difficulty", () => {
  it("'common' only draws from the first COMMON_WORD_COUNT (most frequent) words", () => {
    const commonPool = new Set(ENGLISH_WORDS.slice(0, COMMON_WORD_COUNT));
    const words = generateWords(400, { punctuation: false, numbers: false, wordDifficulty: "common" });
    for (const w of words) {
      assert.ok(commonPool.has(w), `"${w}" is outside the common word pool`);
    }
  });

  it("'all' can draw words outside the common pool", () => {
    const commonPool = new Set(ENGLISH_WORDS.slice(0, COMMON_WORD_COUNT));
    // Large sample so an outside-the-common-pool word is practically certain
    // to turn up if "all" truly uses the full ~489-word list.
    const words = generateWords(400, { punctuation: false, numbers: false, wordDifficulty: "all" });
    assert.ok(words.some((w) => !commonPool.has(w)), "expected at least one word outside the common pool");
  });

  it("omitting wordDifficulty behaves exactly like 'all' (back-compat for games/lessons callers)", () => {
    const commonPool = new Set(ENGLISH_WORDS.slice(0, COMMON_WORD_COUNT));
    const words = generateWords(400, { punctuation: false, numbers: false });
    assert.ok(words.some((w) => !commonPool.has(w)), "expected at least one word outside the common pool");
  });

  it("common pool is smaller than the full pool, so the distinction is meaningful", () => {
    assert.ok(COMMON_WORD_COUNT < ENGLISH_WORDS.length);
  });
});
