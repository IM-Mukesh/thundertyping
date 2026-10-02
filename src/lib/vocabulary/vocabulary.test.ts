/**
 * Vocabulary typing test: word selection, the round reducer, and the
 * progress sanitizer. Same reasoning as lessons.test.ts and
 * games-integrity.test.ts -- these are pure functions driven directly, no
 * DOM or localStorage needed to catch a real bug.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pickPracticeWords, pickSessionWords, SESSION_WORD_COUNT } from "@/lib/vocabulary/vocabulary-content";
import { createInitialState, reducer } from "@/lib/vocabulary/use-vocabulary-test";
import { isValidVocabProgress } from "@/lib/vocabulary/vocabulary-progress";
import { VOCAB_WORDS, type VocabDifficulty } from "@/lib/vocabulary/vocabulary-words";

function typeWord(state: ReturnType<typeof createInitialState>, word: string) {
  let s = state;
  for (let i = 1; i <= word.length; i++) {
    s = reducer(s, { type: "SET_TYPED", value: word.slice(0, i) });
  }
  return s;
}

describe("vocabulary: word selection", () => {
  it("returns exactly the requested count when the pool has enough words", () => {
    const words = pickSessionWords("easy", new Set(), 20);
    assert.equal(words.length, 20);
  });

  it("never returns duplicate words in one round", () => {
    const words = pickSessionWords("hard", new Set(), SESSION_WORD_COUNT);
    const unique = new Set(words.map((w) => w.word));
    assert.equal(unique.size, words.length);
  });

  it("caps at the pool size rather than repeating when count exceeds it", () => {
    const pool = VOCAB_WORDS.easy;
    const words = pickSessionWords("easy", new Set(), pool.length + 50);
    assert.equal(words.length, pool.length);
  });

  it("puts unseen words before mastered ones when the pool is larger than the round", () => {
    const pool = VOCAB_WORDS.medium;
    const masteredWords = new Set(pool.slice(0, pool.length - 5).map((w) => w.word));
    // Only 5 words are unmastered -- a 20-word round must include all 5.
    const words = pickSessionWords("medium", masteredWords, 20);
    const unmasteredInRound = words.filter((w) => !masteredWords.has(w.word));
    assert.equal(unmasteredInRound.length, 5);
  });

  it("pickPracticeWords returns plain, unique word strings for the main typing test", () => {
    const words = pickPracticeWords("medium", 25);
    assert.equal(words.length, 25);
    assert.equal(new Set(words).size, 25);
    for (const w of words) assert.equal(typeof w, "string");
  });

  it("pickPracticeWords fills the full requested count even past the pool size, by repeating", () => {
    const pool = VOCAB_WORDS.hard;
    const words = pickPracticeWords("hard", pool.length + 30);
    // Must hand back exactly what was configured -- a typing test silently
    // running shorter than the word count the user picked is the bug this
    // guards against.
    assert.equal(words.length, pool.length + 30);
    for (const w of words) assert.ok(pool.some((p) => p.word === w));
  });

  it("every tier has real, unique words with a definition", () => {
    const tiers: VocabDifficulty[] = ["easy", "medium", "hard"];
    for (const tier of tiers) {
      const pool = VOCAB_WORDS[tier];
      assert.ok(pool.length >= 50, `${tier} tier should have a substantial word pool`);
      const unique = new Set(pool.map((w) => w.word));
      assert.equal(unique.size, pool.length, `${tier} tier should have no duplicate words`);
      for (const entry of pool) {
        assert.ok(entry.definition.length > 0, `${entry.word} is missing a definition`);
        assert.ok(entry.pos.length > 0, `${entry.word} is missing a part of speech`);
      }
    }
  });

  it("satisfies user ratio requirements: 1300 words total, 50% easy (650), 30% medium (390), 20% hard (260), and 0 duplicates across all tiers", () => {
    assert.equal(VOCAB_WORDS.easy.length, 650, "easy tier must have exactly 650 words (50%)");
    assert.equal(VOCAB_WORDS.medium.length, 390, "medium tier must have exactly 390 words (30%)");
    assert.equal(VOCAB_WORDS.hard.length, 260, "hard tier must have exactly 260 words (20%)");

    const allWords = [
      ...VOCAB_WORDS.easy.map((w) => w.word.toLowerCase()),
      ...VOCAB_WORDS.medium.map((w) => w.word.toLowerCase()),
      ...VOCAB_WORDS.hard.map((w) => w.word.toLowerCase()),
    ];

    assert.equal(allWords.length, 1300, "total vocabulary pool must be exactly 1300 words");
    const uniqueWords = new Set(allWords);
    assert.equal(uniqueWords.size, 1300, "all 1300 words across easy, medium, and hard must be distinct with zero duplicates anywhere");
  });
});

describe("vocabulary: round reducer", () => {
  it("advances to the next word only once it is typed exactly", () => {
    const words = [
      { word: "brave", pos: "adj.", definition: "showing courage" },
      { word: "calm", pos: "adj.", definition: "free from excitement" },
    ];
    let state = reducer(createInitialState(), { type: "START", difficulty: "easy", words });
    state = reducer(state, { type: "SET_TYPED", value: "bra" });
    assert.equal(state.index, 0, "an incomplete word must not advance the round");

    state = typeWord(state, "brave");
    assert.equal(state.index, 1);
    assert.equal(state.typed, "");
    assert.equal(state.results[0].word, "brave");
    assert.equal(state.results[0].correct, true);
  });

  it("advances with a trailing space without penalizing accuracy", () => {
    const words = [
      { word: "brave", pos: "adj.", definition: "showing courage" },
      { word: "calm", pos: "adj.", definition: "free from excitement" },
    ];
    let state = reducer(createInitialState(), { type: "START", difficulty: "easy", words });
    state = reducer(state, { type: "SET_TYPED", value: "brave " });
    assert.equal(state.index, 1);
    assert.equal(state.typed, "");
    assert.equal(state.results[0].correct, true);
    assert.equal(state.incorrectKeystrokes, 0);
    assert.equal(state.correctKeystrokes, 5);
  });

  it("marks a word incorrect (not just slow) the instant a wrong character is typed", () => {
    const words = [{ word: "calm", pos: "adj.", definition: "free from excitement" }];
    let state = reducer(createInitialState(), { type: "START", difficulty: "easy", words });
    state = reducer(state, { type: "SET_TYPED", value: "c" });
    state = reducer(state, { type: "SET_TYPED", value: "cx" }); // wrong character
    state = reducer(state, { type: "SET_TYPED", value: "cxlm" });
    // Finish the word by clearing and retyping cleanly -- committing still
    // only requires an exact match against the target, mistakes and all
    // must have happened for the round to remember this word as missed.
    state = reducer(state, { type: "SET_TYPED", value: "calm" });
    assert.equal(state.status, "over");
    assert.equal(state.results[0].correct, false, "a word with any wrong keystroke is never a first-try success");
  });

  it("finishes the round after the last word and stops accepting input", () => {
    const words = [{ word: "brave", pos: "adj.", definition: "showing courage" }];
    let state = reducer(createInitialState(), { type: "START", difficulty: "easy", words });
    state = typeWord(state, "brave");
    assert.equal(state.status, "over");
    assert.equal(state.results.length, 1);
    assert.equal(state.results[0].correct, true);

    const untouched = reducer(state, { type: "SET_TYPED", value: "x" });
    assert.equal(untouched, state, "typing after the round ends must be a no-op");
  });

  it("never un-counts a keystroke on backspace", () => {
    const words = [{ word: "calm", pos: "adj.", definition: "free from excitement" }];
    let state = reducer(createInitialState(), { type: "START", difficulty: "easy", words });
    state = reducer(state, { type: "SET_TYPED", value: "cx" }); // 1 correct, 1 wrong
    state = reducer(state, { type: "SET_TYPED", value: "c" }); // backspace
    assert.equal(state.correctKeystrokes, 1);
    assert.equal(state.incorrectKeystrokes, 1);
  });
});

describe("vocabulary: progress sanitizer", () => {
  it("accepts a well-formed progress object", () => {
    const valid = {
      easy: { mastered: ["brave"], bestWpm: 42, bestAccuracy: 98, sessionsCompleted: 3 },
      medium: { mastered: [], bestWpm: 0, bestAccuracy: 0, sessionsCompleted: 0 },
      hard: { mastered: [], bestWpm: 0, bestAccuracy: 0, sessionsCompleted: 0 },
    };
    assert.equal(isValidVocabProgress(valid), true);
  });

  it("rejects corrupted or partial storage", () => {
    assert.equal(isValidVocabProgress(null), false);
    assert.equal(isValidVocabProgress({}), false);
    assert.equal(isValidVocabProgress({ easy: { mastered: "not-an-array" } }), false);
    assert.equal(
      isValidVocabProgress({
        easy: { mastered: [1, 2], bestWpm: 0, bestAccuracy: 0, sessionsCompleted: 0 },
        medium: { mastered: [], bestWpm: 0, bestAccuracy: 0, sessionsCompleted: 0 },
        hard: { mastered: [], bestWpm: 0, bestAccuracy: 0, sessionsCompleted: 0 },
      }),
      false,
      "mastered must contain only strings",
    );
  });
});
