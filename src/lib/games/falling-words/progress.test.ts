import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GAME_DEFINITIONS } from "@/lib/games/game-types";
import { createSkyfallState } from "@/lib/games/falling-words/engine";
import { completeSkyfallProgress, freshSkyfallProgress, parseSkyfallProgress, readSkyfallProgress, saveSkyfallProgress, skyfallProgressKey } from "@/lib/games/falling-words/progress";

describe("Skyfall device-local progress", () => {
  it("rejects broken, partial, oversized and hostile records", () => {
    const fresh = freshSkyfallProgress();
    for (const raw of [null, "not-json", "{}", "null", "[]", "x".repeat(3000), JSON.stringify({ ...fresh, runs: -1 }), JSON.stringify({ ...fresh, bestPhase: 99 }), JSON.stringify({ ...fresh, quality: "ultra" }), JSON.stringify({ ...fresh, quality: ["auto"] })]) assert.deepEqual(parseSkyfallProgress(raw), fresh);
  });
  it("separates guest/accounts and survives unavailable storage", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    const progress = { ...freshSkyfallProgress(), runs: 3, quality: "low" as const };
    assert.ok(saveSkyfallProgress("owner-a", progress, storage));
    assert.deepEqual(readSkyfallProgress("owner-a", storage), progress);
    assert.deepEqual(readSkyfallProgress("owner-b", storage), freshSkyfallProgress());
    assert.notEqual(skyfallProgressKey(null), skyfallProgressKey("owner-a"));
    assert.equal(saveSkyfallProgress(null, progress, null), false);
    const denied = { getItem() { throw Error("denied"); }, setItem() { throw Error("denied"); } };
    assert.deepEqual(readSkyfallProgress(null, denied), freshSkyfallProgress());
    assert.equal(saveSkyfallProgress(null, progress, denied), false);
  });
  it("updates only ended standard runs, never practice or abandoned attempts", () => {
    const initial = freshSkyfallProgress();
    const state = { ...createSkyfallState(GAME_DEFINITIONS["falling-words"]), status: "over" as const, cleared: 25, phase: 3, bestCombo: 8 };
    assert.deepEqual(completeSkyfallProgress(initial, state), { ...initial, runs: 1, totalCleared: 25, bestPhase: 3, bestCombo: 8 });
    assert.equal(completeSkyfallProgress(initial, { ...state, mode: "zen" }), initial);
    assert.equal(completeSkyfallProgress(initial, { ...state, status: "paused" }), initial);
  });
});
