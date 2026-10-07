import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parsePracticeMode,
  parsePracticeFinger,
  parseKeyList,
  parsePairList,
  isValidPracticeMode,
  isValidPracticeFinger,
  VALID_PRACTICE_MODES,
  VALID_PRACTICE_FINGERS,
} from "@/lib/lessons/practice-query";
import { generateFingerIsolationDrill } from "@/lib/lessons/content-generator";
import type { FingerId } from "@/lib/lessons/keyboard-layout";

describe("F07: Practice Query Validation & Finger Isolation Safety", () => {
  it("validates all known practice modes", () => {
    for (const mode of VALID_PRACTICE_MODES) {
      assert.equal(isValidPracticeMode(mode), true);
      assert.equal(parsePracticeMode(mode), mode);
    }
  });

  it("safely falls back for invalid or malicious practice modes", () => {
    assert.equal(parsePracticeMode("bogus"), "weak-keys");
    assert.equal(parsePracticeMode(null), "weak-keys");
    assert.equal(parsePracticeMode(undefined), "weak-keys");
    assert.equal(parsePracticeMode(""), "weak-keys");
    assert.equal(parsePracticeMode("javascript:alert(1)"), "weak-keys");
    assert.equal(parsePracticeMode("constructor"), "weak-keys");
    assert.equal(parsePracticeMode("__proto__"), "weak-keys");
    assert.equal(parsePracticeMode("bogus", "speed"), "speed");
  });

  it("validates all known practice fingers", () => {
    for (const finger of VALID_PRACTICE_FINGERS) {
      assert.equal(isValidPracticeFinger(finger), true);
      assert.equal(parsePracticeFinger(finger), finger);
    }
  });

  it("safely falls back for invalid finger query parameters", () => {
    assert.equal(parsePracticeFinger("banana"), "left-pinky");
    assert.equal(parsePracticeFinger(null), "left-pinky");
    assert.equal(parsePracticeFinger(undefined), "left-pinky");
    assert.equal(parsePracticeFinger(""), "left-pinky");
    assert.equal(parsePracticeFinger("thumb"), "left-pinky"); // thumb is not a drill option
    assert.equal(parsePracticeFinger("left-pinky", "right-index"), "left-pinky");
    assert.equal(parsePracticeFinger("invalid-finger", "right-index"), "right-index");
  });

  it("safely parses key lists and sanitizes characters", () => {
    assert.deepEqual(parseKeyList("a,s,d"), ["a", "s", "d"]);
    assert.deepEqual(parseKeyList("A, S , d "), ["a", "s", "d"]);
    assert.deepEqual(parseKeyList(""), []);
    assert.deepEqual(parseKeyList(null), []);
    assert.deepEqual(parseKeyList("invalid,a,,1,;;"), ["a", "1"]);
  });

  it("safely parses transition pairs", () => {
    assert.deepEqual(parsePairList("th,he,in"), ["th", "he", "in"]);
    assert.deepEqual(parsePairList(" TH, he , in "), ["th", "he", "in"]);
    assert.deepEqual(parsePairList("t,toolong,in"), ["in"]);
    assert.deepEqual(parsePairList(""), []);
    assert.deepEqual(parsePairList(null), []);
  });

  it("generateFingerIsolationDrill never produces undefined when given invalid finger input", () => {
    const drillBogus = generateFingerIsolationDrill("bogus" as unknown as FingerId);
    assert.ok(drillBogus.length > 0);
    assert.equal(drillBogus.includes("undefined"), false);
    assert.equal(typeof drillBogus, "string");

    const drillNull = generateFingerIsolationDrill(null as unknown as FingerId);
    assert.ok(drillNull.length > 0);
    assert.equal(drillNull.includes("undefined"), false);
  });
});
