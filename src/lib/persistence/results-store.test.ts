import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { paramForConfig } from "@/lib/persistence/results-store";
import type { TestConfig } from "@/lib/typing-engine/engine-types";

const BASE: TestConfig = {
  mode: "words",
  timeDuration: 30,
  wordCount: 25,
  quoteLength: "medium",
  customText: "",
  punctuation: false,
  numbers: false,
  vocabDifficulty: "easy",
  wordDifficulty: "all",
};

describe("paramForConfig", () => {
  it("picks the mode-specific dimension that buckets a personal best", () => {
    assert.equal(paramForConfig({ ...BASE, mode: "time", timeDuration: 60 }), 60);
    assert.equal(paramForConfig({ ...BASE, mode: "words", wordCount: 50 }), 50);
    assert.equal(paramForConfig({ ...BASE, mode: "quote", quoteLength: "long" }), "long");
    assert.equal(paramForConfig({ ...BASE, mode: "vocabulary", vocabDifficulty: "hard" }), "hard");
    assert.equal(paramForConfig({ ...BASE, mode: "custom" }), "custom");
  });
});
