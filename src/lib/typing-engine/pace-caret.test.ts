import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computePaceCaretPosition } from "@/lib/typing-engine/pace-caret";

describe("computePaceCaretPosition", () => {
  it("returns null for non-positive elapsed time, non-positive target WPM, or an empty word list", () => {
    assert.equal(computePaceCaretPosition(["hi"], 0, 60), null);
    assert.equal(computePaceCaretPosition(["hi"], -5, 60), null);
    assert.equal(computePaceCaretPosition(["hi"], 1000, 0), null);
    assert.equal(computePaceCaretPosition(["hi"], 1000, -10), null);
    assert.equal(computePaceCaretPosition([], 1000, 60), null);
  });

  it("lands exactly at a word boundary after one second at 60 wpm (5 chars/sec)", () => {
    // "hello" (5) + separator (1) = 6 chars = exactly 1 second at 5 chars/sec.
    const pos = computePaceCaretPosition(["hello", "world", "test"], 1000, 60);
    assert.deepEqual(pos, { wordIndex: 0, charIndex: 5 });
  });

  it("crosses into the next word once the separator is also consumed", () => {
    const pos = computePaceCaretPosition(["hello", "world", "test"], 1200, 60);
    assert.deepEqual(pos, { wordIndex: 1, charIndex: 0 });
  });

  it("sits mid-word for a non-last word, not just at boundaries", () => {
    // 60 wpm = 5 chars/sec; 500ms => 2.5 target chars, rounds to 3.
    const pos = computePaceCaretPosition(["abcde", "end"], 500, 60);
    assert.deepEqual(pos, { wordIndex: 0, charIndex: 3 });
  });

  it("pins at the end of the last word instead of reporting a position past the list", () => {
    const pos = computePaceCaretPosition(["hi"], 60_000, 60);
    assert.deepEqual(pos, { wordIndex: 0, charIndex: 2 });
  });

  it("never returns a charIndex longer than the word itself", () => {
    const pos = computePaceCaretPosition(["a", "b", "c"], 10_000, 600);
    assert.ok(pos);
    assert.ok(pos.charIndex <= ["a", "b", "c"][pos.wordIndex].length);
  });
});
