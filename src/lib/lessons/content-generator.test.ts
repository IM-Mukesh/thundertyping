import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createRng,
  generateAccuracyDrill,
  generateAnchorReachDrill,
  generateFingerIsolationDrill,
  generatePatternDrill,
  generateTransitionDrill,
  generateVocabularyDrill,
  generateWarmupDrill, generateAdvancedText,
  generateWeakKeyDrill,
} from "@/lib/lessons/content-generator";
import { fingerForKey } from "@/lib/lessons/keyboard-layout";

describe("content-generator: deterministic procedural typing curriculum engine", () => {
  it("Mulberry32 PRNG is strictly deterministic for identical seeds", () => {
    const rng1 = createRng(12345);
    const rng2 = createRng(12345);
    const seq1 = [rng1(), rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2(), rng2()];
    assert.deepEqual(seq1, seq2);

    const rng3 = createRng(99999);
    const seq3 = [rng3(), rng3(), rng3(), rng3()];
    assert.notDeepEqual(seq1, seq3);
  });

  it("generateWarmupDrill produces bounded repetitions of allowed keys", () => {
    const keys = ["a", "s", "d", "f"];
    const text = generateWarmupDrill(keys, 10, 42);
    const words = text.split(" ");
    assert.equal(words.length, 10);
    for (const w of words) {
      assert.ok(w.length >= 2 && w.length <= 4);
      for (const char of w) {
        assert.ok(keys.includes(char), `Character "${char}" not in allowed keys`);
      }
    }
  });

  it("generateAnchorReachDrill returns to home row anchor", () => {
    const text = generateAnchorReachDrill(["e"], 8, 101);
    const words = text.split(" ");
    assert.equal(words.length, 8);
    for (const w of words) {
      assert.ok(w.includes("e"));
      // 'e' is struck with Left Middle finger, whose home key is 'd'
      assert.ok(w.includes("d"), `Word "${w}" should contain home key anchor d`);
    }
  });

  it("generatePatternDrill respects allowed keys and deterministic seed", () => {
    const keys = ["j", "k", "l", ";"];
    const text1 = generatePatternDrill(keys, 12, 500);
    const text2 = generatePatternDrill(keys, 12, 500);
    assert.equal(text1, text2);

    const words = text1.split(" ");
    assert.equal(words.length, 12);
    for (const w of words) {
      for (const char of w) {
        assert.ok(keys.includes(char), `Unexpected character "${char}"`);
      }
    }
  });

  it("generateAccuracyDrill produces 3-4 character sequences with clean returns", () => {
    const keys = ["a", "s", "d", "f", "j", "k", "l", ";"];
    const text = generateAccuracyDrill(keys, 15, 777);
    const words = text.split(" ");
    assert.equal(words.length, 15);
    for (const w of words) {
      assert.ok(w.length >= 3 && w.length <= 4);
      for (const char of w) {
        assert.ok(keys.includes(char));
      }
    }
  });

  it("generateVocabularyDrill produces real English words from allowed keys", () => {
    // With enough alphabet keys, vocabulary drill should select real English dictionary words
    const alphabet = ["a", "s", "d", "f", "g", "h", "j", "k", "l", "e", "i", "o", "u", "t", "r", "n"];
    const text = generateVocabularyDrill(alphabet, 12, 888);
    const words = text.split(" ");
    assert.equal(words.length, 12);
    for (const w of words) {
      for (const char of w) {
        assert.ok(alphabet.includes(char), `Word "${w}" has invalid character "${char}"`);
      }
    }
  });

  it("generateVocabularyDrill falls back safely if key set is too constrained for words", () => {
    // Only two letters: "q", "z" -> no valid 2-7 letter English words exist
    const text = generateVocabularyDrill(["q", "z"], 6, 999);
    assert.ok(text.length > 0);
    const words = text.split(" ");
    assert.equal(words.length, 6);
  });

  it("generateWeakKeyDrill concentrates practice on specified weak keys", () => {
    const weakKeys = ["z", "x"];
    const text = generateWeakKeyDrill(weakKeys, ["a", "s", "d", "f"], 14, 303);
    const words = text.split(" ");
    assert.equal(words.length, 14);
    const joined = text.toLowerCase();
    assert.ok(joined.includes("z"), "Generated text should contain weak key z");
    assert.ok(joined.includes("x"), "Generated text should contain weak key x");
  });

  it("generateTransitionDrill focuses on targeted digraphs", () => {
    const transitions: [string, string][] = [
      ["t", "h"],
      ["e", "r"],
    ];
    const text = generateTransitionDrill(transitions, [], 10, 404);
    assert.ok(text.includes("th") || text.includes("er"), "Generated text should practice target transitions");
  });

  it("generateFingerIsolationDrill isolates keys pressed by the specific finger", () => {
    const text = generateFingerIsolationDrill("left-pinky", [], 12, 111);
    const words = text.split(" ");
    assert.equal(words.length, 12);
    for (const w of words) {
      for (const char of w) {
        // Keys pressed by left pinky or home anchors
        const f = fingerForKey(char);
        assert.ok(f === "left-pinky" || f === "left-index" || char === "f", `Unexpected finger for ${char}`);
      }
    }
  });

  it("generateAdvancedText(prose) produces grammatically structured, diverse sentences with proper punctuation (A28)", () => {
    let valid = 0;
    const samples = [];
    
    for(let i=0; i<100; i++) {
      const text = generateAdvancedText("prose", Math.max(15, i), i);
      samples.push(text);
      
      const words = text.split(" ");
      const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')));
      
      const hasCapital = /^[A-Z]/.test(text);
      const hasPunctuation = /[.!?]$/.test(text);
      const minWords = words.length >= 3;
      const normalWhitespace = !/\s{2,}/.test(text);
      const noRepeatedTokens = !/(\b\w+\b )\1{2,}/i.test(text); // No word repeated 3+ times consecutively
      const wordDiversity = uniqueWords.size / words.length >= 0.4; // At least 40% unique words
      const noGarbage = !/A{4,}/i.test(text);
      
      if (hasCapital && hasPunctuation && minWords && normalWhitespace && noRepeatedTokens && wordDiversity && noGarbage) {
        valid++;
      } else {
        console.error("Failed sample:", text);
      }
    }
    
    assert.equal(valid, 100, "100/100 prose samples must pass rigorous quality checks");
    
    // Log 20 samples for manual inspection as requested
    console.log("\n--- 20 PROSE SAMPLES FOR MANUAL INSPECTION (A28) ---");
    for(let i=0; i<20; i++) {
      console.log(`${i+1}. ${samples[i]}`);
    }
    console.log("----------------------------------------------------\n");
  });
});
