import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { startDeath, tickDeath, typeDeathKey } from "@/lib/games/type-before-death/engine";
import { deathSceneView } from "@/lib/games/type-before-death/scene-view";

describe("Type Before Death scene projection", () => {
  it("projects a bounded readable target and defensive layers", () => {
    const state = tickDeath(startDeath({ seed: "scene" }), 1600);
    const view = deathSceneView(state, false, "auto");
    assert.equal(view.maxHealth, state.maxHealth);
    assert.equal(view.maxHealth >= view.health, true);
    assert.equal(view.barricade >= 0 && view.barricade <= 1, true);
    assert.equal(view.enemies.every((enemy) => enemy.typed >= 0 && enemy.typed <= enemy.word.length), true);
  });

  it("keeps the target flag stable through a typed prefix", () => {
    const state = tickDeath(startDeath({ seed: "target" }), 1600);
    const enemy = state.enemies.find((candidate) => candidate.visible);
    assert.ok(enemy);
    const typed = typeDeathKey(state, enemy.word[0]);
    const view = deathSceneView(typed, true, "low");
    const target = view.enemies.find((candidate) => candidate.id === enemy.id);
    assert.equal(target?.targeted, true);
    assert.equal(target?.typed, 1);
    assert.equal(view.reducedMotion, true);
    assert.equal(view.quality, "low");
  });

  it("does not expose hidden stalkers before they emerge", () => {
    const state = tickDeath(startDeath({ mission: 2, seed: "hidden-stalker" }), 1600);
    const hidden = state.enemies[0];
    assert.ok(hidden);
    const view = deathSceneView({ ...state, enemies: [{ ...hidden, visible: false }] }, false, "auto");
    assert.deepEqual(view.enemies, []);
  });

  it("keeps all authored lanes distinct and applies lateral offsets inside the road", () => {
    const state = tickDeath(startDeath({ seed: "lanes" }), 1600);
    const template = state.enemies[0];
    assert.ok(template);
    const enemies = Array.from({ length: 5 }, (_, lane) => ({
      ...template,
      id: lane + 100,
      lane,
      lateral: 0,
      visible: true,
    }));
    const view = deathSceneView({ ...state, enemies, targetId: null }, false, "auto");
    assert.deepEqual(view.enemies.map((enemy) => enemy.x), [-2.05, -1.025, 0, 1.025, 2.05]);
    assert.equal(new Set(view.enemies.map((enemy) => enemy.x)).size, 5);

    const offsetView = deathSceneView({
      ...state,
      targetId: null,
      enemies: [
        { ...template, id: 201, lane: 2, lateral: -1, visible: true },
        { ...template, id: 202, lane: 2, lateral: 1, visible: true },
      ],
    }, false, "auto");
    assert.equal(offsetView.enemies[1].x! - offsetView.enemies[0].x!, 0.7);
    assert.equal(offsetView.enemies.every((enemy) => enemy.x! > -3 && enemy.x! < 3), true);
  });

  it("marks paused snapshots static for the scene clock", () => {
    const state = tickDeath(startDeath({ seed: "paused-scene" }), 1600);
    const paused = deathSceneView({ ...state, phase: "paused", pausedFrom: "combat" }, false, "auto");
    assert.equal(paused.reducedMotion, true);
    assert.equal(deathSceneView(state, false, "auto").reducedMotion, false);
  });
});
