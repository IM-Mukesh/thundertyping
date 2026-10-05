import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { advanceWarProgress, freshWarProgress, parseWarProgress, readWarProgress, saveWarProgress, unlockedWarSpecials, unlockedWarStage, warProgressKey, type WarStorage } from "@/lib/games/rakshasa/progress";
import { createWarState, startWar } from "@/lib/games/rakshasa/engine";

describe("Typebound: The Last Dawn corruption-safe device campaign progress", () => {
  it("round-trips actual writes and separates guest and two accounts", () => {
    const values = new Map<string, string>();
    const storage: WarStorage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); } };
    const first = { ...freshWarProgress(), completed: [0, 1], defeated: 38, tutorialDone: true };
    assert.ok(saveWarProgress("account-a", first, storage));
    assert.deepEqual(readWarProgress("account-a", storage), first);
    assert.deepEqual(readWarProgress("account-b", storage), freshWarProgress());
    assert.deepEqual(readWarProgress(null, storage), freshWarProgress());
    assert.ok(saveWarProgress(null, { ...freshWarProgress(), defeated: 12 }, storage));
    assert.equal(readWarProgress("account-a", storage).defeated, 38);
    assert.notEqual(warProgressKey(null), warProgressKey("account-a"));
  });
  it("rejects malformed JSON, stale schema, gaps, invalid types and unbounded records", () => {
    const invalid = ["{broken", "null", "[]", " ".repeat(4097), ...[
      { version: 2 }, { completed: [0, 2] }, { completed: [1] }, { completed: [0, 0] }, { completed: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
      { defeated: -1 }, { defeated: 1.2 }, { defeated: 10_000_001 }, { tutorialDone: "true" }, { difficulty: ["normal"] },
      { quality: ["auto"] }, { quality: "ultra" }, { reducedMotion: 1 },
    ].map((bad) => JSON.stringify({ ...freshWarProgress(), ...bad }))];
    for (const raw of invalid) assert.deepEqual(parseWarProgress(raw), freshWarProgress());
  });
  it("continues safely when storage reads/writes fail, and verifies read-back", () => {
    const blocked: WarStorage = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("quota"); } };
    assert.deepEqual(readWarProgress(null, blocked), freshWarProgress());
    assert.equal(saveWarProgress(null, freshWarProgress(), blocked), false);
    assert.equal(saveWarProgress(null, freshWarProgress(), { getItem: () => null, setItem: () => {} }), false);
    assert.equal(saveWarProgress(null, freshWarProgress(), null), false);
  });
  it("unlocks stages sequentially and does not grant a skipped victory", () => {
    const before = startWar({ stage: 0, difficulty: "normal" });
    const first = advanceWarProgress(freshWarProgress(), before, { ...before, phase: "victory", cleared: 19 });
    assert.deepEqual(first.completed, [0]);
    assert.equal(unlockedWarStage(first), 1);
    const skipped = advanceWarProgress(first, { ...before, stage: 4 }, { ...before, stage: 4, phase: "victory" });
    assert.deepEqual(skipped.completed, [0]);
    const replayed = advanceWarProgress(first, before, { ...before, phase: "victory", cleared: 19 });
    assert.deepEqual(replayed.completed, [0]);
  });
  it("earn-unlocks all three specials at the real lifetime defeat thresholds", () => {
    for (const [defeated, count] of [[11, 0], [12, 1], [34, 1], [35, 2], [64, 2], [65, 3]]) {
      assert.equal(unlockedWarSpecials({ ...freshWarProgress(), defeated }).length, count);
    }
    const before = { ...createWarState(), phase: "playing" as const, cleared: 10 };
    const progressed = advanceWarProgress({ ...freshWarProgress(), defeated: 10 }, before, { ...before, cleared: 12 });
    assert.equal(progressed.defeated, 12, "only the delta is added");
    assert.deepEqual(unlockedWarSpecials(progressed), ["shockwave"]);
  });
  it("tutorial completion grants no stages, combat defeats or specials", () => {
    const before = startWar({ stage: 0, difficulty: "normal", tutorial: true });
    const after = advanceWarProgress(freshWarProgress(), before, { ...before, phase: "victory", cleared: 50 });
    assert.equal(after.tutorialDone, true);
    assert.equal(after.defeated, 0);
    assert.deepEqual(after.completed, []);
    assert.deepEqual(unlockedWarSpecials(after), []);
  });
});
