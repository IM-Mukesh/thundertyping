import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { freshDeathProgress, advanceDeathProgress, parseDeathProgress, serializeDeathProgress, unlockedDeathMission } from "@/lib/games/type-before-death/progress";
import { startDeath, tickDeath } from "@/lib/games/type-before-death/engine";
import type { DeathState } from "@/lib/games/type-before-death/types";

function result(outcome: "victory" | "defeat", runId: string, mission = 0): DeathState {
  const started = startDeath({ mission, seed: runId, runId });
  return {
    ...started,
    phase: "results",
    outcome,
    resultReason: outcome === "victory" ? "boss-defeated" : "health-depleted",
    score: 500,
    cleared: 8,
    correctKeys: 20,
    outputChars: 20,
    elapsedMs: 60_000,
  };
}

describe("Type Before Death progress", () => {
  it("records a result once and unlocks the contiguous mission", () => {
    const initial = freshDeathProgress();
    const victory = result("victory", "run-1");
    const once = advanceDeathProgress(initial, victory, victory);
    const twice = advanceDeathProgress(once, victory, victory);
    assert.equal(once.runs, 1);
    assert.equal(once.defeated, 8);
    assert.deepEqual(once.completed, [0]);
    assert.equal(unlockedDeathMission(once), 1);
    assert.deepEqual(twice, once);
  });

  it("bounds and round-trips valid progress while rejecting malformed records", () => {
    const progress = { ...freshDeathProgress(), completed: [0], bestScore: 123, receipts: ["x"] };
    const parsed = parseDeathProgress(serializeDeathProgress(progress));
    assert.deepEqual(parsed, progress);
    assert.deepEqual(parseDeathProgress("not json"), freshDeathProgress());
    assert.deepEqual(parseDeathProgress(JSON.stringify({ version: 2, completed: [0] })), freshDeathProgress());
  });

  it("does not unlock a mission after defeat", () => {
    const defeated = advanceDeathProgress(freshDeathProgress(), result("defeat", "run-2", 1), result("defeat", "run-2", 1));
    assert.equal(defeated.runs, 1);
    assert.deepEqual(defeated.completed, []);
    assert.equal(unlockedDeathMission(defeated), 0);
  });

  it("keeps progress pure and does not mutate the simulation snapshot", () => {
    const state = tickDeath(startDeath({ seed: "pure" }), 1500);
    const before = JSON.stringify(state);
    const progress = advanceDeathProgress(freshDeathProgress(), state, result("victory", "run-3"));
    assert.ok(progress.runs > 0);
    assert.equal(JSON.stringify(state), before);
  });
});
