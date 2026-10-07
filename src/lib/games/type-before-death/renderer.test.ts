import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { startDeath, tickDeath } from "@/lib/games/type-before-death/engine";
import { deathSceneView } from "@/lib/games/type-before-death/scene-view";
import { typeBeforeDeathEnemyPosition } from "@/lib/games/type-before-death/renderer";

describe("Type Before Death scene renderer geometry", () => {
  it("uses the projected lane offset rather than clumping explicit x positions", () => {
    const state = tickDeath(startDeath({ seed: "renderer-lanes" }), 1600);
    const template = state.enemies[0];
    assert.ok(template);
    const view = deathSceneView({
      ...state,
      targetId: null,
      enemies: Array.from({ length: 5 }, (_, lane) => ({
        ...template,
        id: lane + 300,
        lane,
        lateral: 0,
        visible: true,
      })),
    }, false, "low");

    const positions = view.enemies.map((enemy) => typeBeforeDeathEnemyPosition(enemy)[0]);
    assert.deepEqual(positions, [-2.05, -1.025, 0, 1.025, 2.05]);
    assert.equal(new Set(positions).size, 5);
  });
});
