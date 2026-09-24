import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { truncateAtWord } from "@/lib/seo/metadata";

describe("truncateAtWord", () => {
  it("returns the text unchanged when it's already short enough", () => {
    assert.equal(truncateAtWord("short text", 100), "short text");
  });

  it("cuts at the last full word, never mid-word", () => {
    const text = "how long a word takes to cast depends on its length";
    const result = truncateAtWord(text, 28);
    assert.ok(!result.endsWith("t"), `should not end mid-word: "${result}"`);
    assert.equal(result, "how long a word takes to");
  });

  it("never exceeds maxLength", () => {
    const text = "a".repeat(50);
    assert.ok(truncateAtWord(text, 20).length <= 20);
  });

  it("falls back to a hard cut only when there's no space to break on", () => {
    const text = "supercalifragilisticexpialidocious";
    assert.equal(truncateAtWord(text, 10), text.slice(0, 10));
  });
});
