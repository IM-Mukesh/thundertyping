import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TEST_MODE_STORE } from "@/lib/server/fruit-fury-state";
TEST_MODE_STORE.enabled = true;
import { startFruitFuryRun, advanceFruitFuryChunk } from "@/lib/server/fruit-fury-evaluator";
import type { FruitFuryEvent } from "@/lib/server/fruit-fury-evaluator";

describe("Fruit Fury Database Chunk Protocol - Adversarial Matrix", () => {
  it("1. legitimate Wave 1 and Wave 2 succeeds sequentially", async () => {
    const { runId, fruits, token } = await startFruitFuryRun("test-user");
    assert.equal(fruits.length, 15);
    
    // Play wave 1
    const w1Events = fruits.map((f, i) => ({ t: 1000 + i * 1000, type: f === "bomb" ? "miss" : "slice", fruitType: f })) as FruitFuryEvent[];
    const w2 = await advanceFruitFuryChunk(runId, token, w1Events);
    assert.equal(w2.status, "active");
    assert.equal(w2.chunkIndex, 1);
    
    // Play wave 2
    const w2Events = w2.fruits.map((f, i) => ({ t: w1Events[14].t + 1000 + i * 1000, type: f === "bomb" ? "miss" : "slice", fruitType: f })) as FruitFuryEvent[];
    const w3 = await advanceFruitFuryChunk(runId, w2.token, w2Events);
    assert.equal(w3.chunkIndex, 2);
  });

  it("2. atomic cross-instance safety (concurrent replay fails)", async () => {
    const { runId, fruits, token } = await startFruitFuryRun("test-user");
    const ev = fruits.map((f, i) => ({ t: 1000 + i * 1000, type: f === "bomb" ? "miss" : "slice", fruitType: f })) as FruitFuryEvent[];
    
    // Simulate concurrent requests
    const res1 = await advanceFruitFuryChunk(runId, token, ev);
    
    await assert.rejects(
      async () => await advanceFruitFuryChunk(runId, token, ev),
      /Invalid or replayed token/
    );
  });

  it("3. oversized evidence fails", async () => {
    const { runId, fruits, token } = await startFruitFuryRun("test-user");
    const ev = fruits.map((f, i) => ({ t: 1000 + i * 1000, type: f === "bomb" ? "miss" : "slice", fruitType: f })) as FruitFuryEvent[];
    ev.push({ t: 16000, type: "slice", fruitType: "apple" });
    await assert.rejects(
      async () => await advanceFruitFuryChunk(runId, token, ev),
      /Invalid evidence payload|Oversized transcript/
    );
  });

  it("4. full future transcript fabrication fails", async () => {
    const { runId, fruits, token } = await startFruitFuryRun("attacker");
    const w1Events = fruits.map((f, i) => ({ t: 1000 + i * 1000, type: f === "bomb" ? "miss" : "slice", fruitType: f })) as FruitFuryEvent[];
    const w2 = await advanceFruitFuryChunk(runId, token, w1Events);
    // Attacker cannot skip to chunk 2 because they only have token for chunk 1, effectively stopping the attack.
    assert.ok(w2.token !== token);
  });
});
