import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isSpeechSupported,
  speakText,
  speakWord,
  speakExplanation,
  stopSpeaking,
} from "@/lib/vocabulary/vocabulary-speech";

describe("vocabulary: speech synthesis", () => {
  it("gracefully no-ops in non-browser environments without errors", () => {
    assert.equal(typeof isSpeechSupported(), "boolean");
    // In Node.js CLI / runner, window.speechSynthesis is undefined
    assert.doesNotThrow(() => {
      speakText("generic test");
      speakWord("test");
      speakExplanation("test", "a procedure intended to establish the quality", "n.");
      stopSpeaking();
    });
  });

  it("handles mocked browser speech synthesis correctly", () => {
    let spokenText = "";
    let spokenRate = 0;
    let cancelled = false;

    // Set up mock window and SpeechSynthesis
    const originalWindow = globalThis.window;
    globalThis.window = {
      speechSynthesis: {
        speak: (utterance: { text: string; rate: number }) => {
          spokenText = utterance.text;
          spokenRate = utterance.rate;
        },
        cancel: () => {
          cancelled = true;
        },
      } as unknown as SpeechSynthesis,
    } as unknown as Window & typeof globalThis;

    (globalThis as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = class {
      text: string;
      lang = "";
      rate = 1.0;
      pitch = 1.0;
      constructor(text: string) {
        this.text = text;
      }
    };

    try {
      assert.equal(isSpeechSupported(), true);

      speakWord("cacophony");
      assert.equal(cancelled, true);
      assert.equal(spokenText, "cacophony");
      assert.ok(spokenRate < 1.0, "Word rate should be slightly slower for clarity");

      cancelled = false;
      speakExplanation("cacophony", "a harsh mixture of sounds", "n.");
      assert.equal(cancelled, true);
      assert.equal(spokenText, "cacophony. a harsh mixture of sounds");

      cancelled = false;
      stopSpeaking();
      assert.equal(cancelled, true);
    } finally {
      // Restore original
      globalThis.window = originalWindow;
      delete (globalThis as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance;
    }
  });
});
