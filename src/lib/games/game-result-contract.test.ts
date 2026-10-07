import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeGameRun, parseGameScorePayload } from "@/lib/games/game-result-contract";
import { DEATH_LIMITS } from "@/lib/games/type-before-death/content";

describe("F09: Game API / Database WPM Range Consistency", () => {
  it("DEATH_LIMITS.wpm is capped at 350 to match database check constraint", () => {
    assert.equal(DEATH_LIMITS.wpm, 350);
  });

  it("accepts valid WPM values within [0, 350]", () => {
    const baseRun = {
      score: 100,
      cleared: 10,
      bestCombo: 5,
      survivedMs: 12000,
    };

    assert.equal(normalizeGameRun({ ...baseRun, wpm: 0 }).wpm, 0);
    assert.equal(normalizeGameRun({ ...baseRun, wpm: 120 }).wpm, 120);
    assert.equal(normalizeGameRun({ ...baseRun, wpm: 349 }).wpm, 349);
    assert.equal(normalizeGameRun({ ...baseRun, wpm: 350 }).wpm, 350);
  });

  it("rejects WPM values exceeding 350", () => {
    const baseRun = {
      score: 100,
      cleared: 10,
      bestCombo: 5,
      survivedMs: 12000,
    };

    assert.throws(
      () => normalizeGameRun({ ...baseRun, wpm: 350.1 }),
      /wpm must be between 0 and 350/,
    );
    assert.throws(
      () => normalizeGameRun({ ...baseRun, wpm: 351 }),
      /wpm must be between 0 and 350/,
    );
    assert.throws(
      () => normalizeGameRun({ ...baseRun, wpm: 1000 }),
      /wpm must be between 0 and 350/,
    );
  });

  it("rejects negative or non-finite WPM values", () => {
    const baseRun = {
      score: 100,
      cleared: 10,
      bestCombo: 5,
      survivedMs: 12000,
    };

    assert.throws(
      () => normalizeGameRun({ ...baseRun, wpm: -1 }),
      /wpm must be between 0 and 350/,
    );
    assert.throws(
      () => normalizeGameRun({ ...baseRun, wpm: Infinity }),
      /wpm must be between 0 and 350/,
    );
    assert.throws(
      () => normalizeGameRun({ ...baseRun, wpm: NaN }),
      /wpm must be between 0 and 350/,
    );
  });

  it("parseGameScorePayload rejects payloads with wpm > 350", () => {
    const payload = {
      runId: "11111111-1111-4111-8111-111111111111",
      ownerId: "22222222-2222-4222-8222-222222222222",
      gameId: "type-before-death",
      variant: "campaign:normal:mission-0:rifle:scout",
      score: 500,
      cleared: 20,
      bestCombo: 10,
      survivedMs: 45000,
      wpm: 351,
      accuracy: 95,
    };

    assert.throws(
      () => parseGameScorePayload(payload),
      /wpm must be between 0 and 350/,
    );
  });
});
