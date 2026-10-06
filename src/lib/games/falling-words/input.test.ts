import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { skyfallKeyboardKey, skyfallTextInput, type SkyfallKeyboardEvent } from "@/lib/games/falling-words/input";

describe("Falling Words keyboard input", () => {
  it("normalizes one physical ASCII letter and preserves navigation controls", () => {
    assert.equal(skyfallKeyboardKey({ key: "A" }), "a");
    assert.equal(skyfallKeyboardKey({ key: "z" }), "z");
    for (const key of ["Backspace", "Escape", "Tab"]) assert.equal(skyfallKeyboardKey({ key }), key);
  });

  it("rejects held keys, native shortcuts and IME for letters and controls", () => {
    for (const flag of ["repeat", "ctrlKey", "metaKey", "altKey", "isComposing"] as const) {
      for (const key of ["a", "Backspace", "Escape", "Tab"]) {
        const event: SkyfallKeyboardEvent = { key, [flag]: true };
        assert.equal(skyfallKeyboardKey(event), null, `${key}/${flag}`);
      }
    }
    assert.equal(skyfallKeyboardKey({ key: "v", ctrlKey: true }), null, "paste shortcut");
  });

  it("rejects spaces, specials, composed characters and synthetic text chunks", () => {
    for (const key of ["", " ", "Enter", "Delete", "1", "2", "3", "!", "é", "あ", "Dead", "Process", "cloud", "Paste"]) {
      assert.equal(skyfallKeyboardKey({ key }), null, key);
    }
  });
});

describe("Falling Words controlled text input", () => {
  it("accepts exactly one new ASCII letter, including keyboard capitalization", () => {
    assert.equal(skyfallTextInput("", "C", "insertText"), "c");
    assert.equal(skyfallTextInput("cl", "clO", "insertText"), "o");
    assert.equal(skyfallTextInput("cl", "clo"), "o");
    assert.equal(skyfallTextInput("cl", "clo", ""), "o");
  });

  it("returns Backspace only for one removed final character", () => {
    assert.equal(skyfallTextInput("clo", "cl", "deleteContentBackward"), "Backspace");
    assert.equal(skyfallTextInput("clo", "cl", "deleteContentForward"), "Backspace");
    assert.equal(skyfallTextInput("c", ""), "Backspace");
    assert.equal(skyfallTextInput("clo", "c", "deleteContentBackward"), null);
    assert.equal(skyfallTextInput("clo", "co", "deleteContentBackward"), null);
    assert.equal(skyfallTextInput("clo", "lo", "deleteContentBackward"), null);
    assert.equal(skyfallTextInput("clo", "cl", "deleteByCut"), null);
  });

  it("rejects paste, autocomplete, replacements and composition, even for a single letter", () => {
    for (const inputType of ["insertFromPaste", "insertFromDrop", "insertReplacementText", "insertCompositionText", "insertFromComposition", "historyUndo"]) {
      assert.equal(skyfallTextInput("cl", "clo", inputType), null, inputType);
      assert.equal(skyfallTextInput("clo", "cl", inputType), null, inputType);
    }
    assert.equal(skyfallTextInput("", "cloud", "insertText"), null);
    assert.equal(skyfallTextInput("cl", "cloud"), null);
    assert.equal(skyfallTextInput("cl", "ClO", "insertText"), null);
    assert.equal(skyfallTextInput("cl", "co", "insertText"), null);
    assert.equal(skyfallTextInput("cl", "clo", "deleteContentBackward"), null);
    assert.equal(skyfallTextInput("clo", "cl", "insertText"), null);
  });

  it("ignores no-op values and rejects punctuation, spaces and non-ASCII input", () => {
    for (const value of ["cl", "cl ", "cl1", "cl!", "clé", "clあ", "cloo"]) {
      assert.equal(skyfallTextInput("cl", value), null, value);
    }
    assert.equal(skyfallTextInput("", ""), null);
    assert.equal(skyfallTextInput("Cl", "Clo"), null);
  });
});
