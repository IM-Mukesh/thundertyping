import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { WAR_STAGES, ENEMY_DEFINITIONS } from "@/lib/games/rakshasa/content";
import { createWebGLWarRenderer, createTacticalWarRenderer, warEnemyPosition, projectWarPoint, clampWar } from "@/lib/games/rakshasa/renderer";
import { startWar, tickWar, typeWarKey } from "@/lib/games/rakshasa/engine";
import type { EnemyClass, WarEnemy } from "@/lib/games/rakshasa/types";

/** WebGL call double verifies data/bounds/lifetimes, not driver shader/visual QA. */
function glHarness(failure: "compile" | "link" | "buffer" | null = null) {
  let id = 0, lost = false, draws = 0, deletedShaders = 0, deletedPrograms = 0, deletedBuffers = 0;
  let lastActors = new Float32Array();
  const counts: number[] = [];
  const shaderSources: string[] = [];
  const gl = {
    VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4, ARRAY_BUFFER: 5, DYNAMIC_DRAW: 6, STATIC_DRAW: 7,
    DEPTH_TEST: 8, LEQUAL: 9, BLEND: 10, CULL_FACE: 11, FLOAT: 12, TRIANGLES: 13, NO_ERROR: 0, COLOR_BUFFER_BIT: 16, DEPTH_BUFFER_BIT: 32,
    createShader: () => ({ id: ++id }), shaderSource: (_: unknown, source: string) => shaderSources.push(source), compileShader() {},
    getShaderParameter: () => failure !== "compile", deleteShader() { deletedShaders++; }, detachShader() {},
    createProgram: () => ({ id: ++id }), attachShader() {}, linkProgram() {}, getProgramParameter: () => failure !== "link",
    deleteProgram() { deletedPrograms++; }, createBuffer: () => failure === "buffer" ? null : ({ id: ++id }), deleteBuffer() { deletedBuffers++; },
    getAttribLocation: () => 0, getUniformLocation: () => ({}), bindBuffer() {}, bufferData() {},
    bufferSubData: (_: unknown, __: unknown, data: Float32Array) => { lastActors = new Float32Array(data); }, enable() {}, disable() {}, depthFunc() {},
    enableVertexAttribArray() {}, vertexAttribPointer() {}, drawArrays: (_: unknown, __: unknown, count: number) => { draws++; counts.push(count); },
    viewport() {}, clearColor() {}, clearDepth() {}, clear() {}, useProgram() {}, uniformMatrix4fv() {}, uniform3f() {},
    isContextLost: () => lost, getError: () => 0,
  };
  const canvas = { width: 0, height: 0, getContext: () => gl } as unknown as HTMLCanvasElement;
  return { canvas, setLost: () => { lost = true; }, stats: () => ({ draws, deletedBuffers, deletedPrograms, deletedShaders, counts, lastActors, shaderSources }) };
}
const enemy = (kind: EnemyClass, id = 1): WarEnemy => ({ id, kind, word: "guard", lane: id % 3, progress: .55, travelMs: 14000,
  hp: 100, maxHp: 100, elite: false, typed: 0, highWater: 0, bornAt: 0, lastHitAt: -1 });

describe("Typebound: The Last Dawn rendering contracts", () => {
  it("clamps world lanes/progress and keeps project math finite", () => {
    assert.deepEqual(warEnemyPosition(1, 0), [0, 0, -34]);
    assert.deepEqual(warEnemyPosition(99, Infinity), [2.65, 0, -34]);
    assert.equal(clampWar(NaN, 0, 10), 0);
    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    const projected = projectWarPoint([0, 0, 0], identity, 1440, 780);
    assert.equal(projected.x, 720);
    assert.equal(projected.y, 390);
    assert.equal(projected.visible, true);
    assert.equal(projectWarPoint([0, 0, 0], new Array(16).fill(0), 1440, 780).visible, false);
  });
  it("builds bounded perspective geometry for all eight worlds and all ten humanoids without changing state", () => {
    const h = glHarness();
    const renderer = createWebGLWarRenderer(h.canvas, { quality: "high", reducedMotion: false });
    renderer.resize(1440, 780, 4);
    assert.equal(h.canvas.width, 2160, "DPR is capped to 1.5");
    const hashes = new Set<number>();
    for (const stage of WAR_STAGES) {
      for (const kind of Object.keys(ENEMY_DEFINITIONS) as EnemyClass[]) {
        const s = { ...startWar({ stage: stage.id, difficulty: "normal" }), phase: "playing" as const, sceneMs: 3000, enemies: [enemy(kind)] };
        const serialized = JSON.stringify(s);
        renderer.render(s, stage, 1000);
        assert.equal(JSON.stringify(s), serialized);
        const projection = renderer.projectEnemy(s.enemies[0]);
        assert.ok(projection.visible && Number.isFinite(projection.x + projection.y + projection.scale));
        const data = h.stats().lastActors;
        assert.ok(data.length > 500 && data.every(Number.isFinite));
        hashes.add(Math.round(data.reduce((sum, value, index) => sum + value * (index % 17 + 1), 0) * 100));
      }
    }
    assert.ok(hashes.size >= 10, "classes build different geometry/material data");
    assert.ok(h.stats().counts.every((count) => count <= 72000));
    assert.equal(h.stats().draws, 160, "two batched draws per complete scene");
    assert.ok(h.stats().shaderSources.some((source) => source.includes("uViewProjection")));
    renderer.dispose(); renderer.dispose();
    assert.equal(h.stats().deletedBuffers, 2);
    assert.equal(h.stats().deletedPrograms, 1);
    assert.equal(h.stats().deletedShaders, 2);
  });
  it("low quality reduces geometry and caps pixels; attack/kill/special states render", () => {
    const high = glHarness(), low = glHarness();
    const a = createWebGLWarRenderer(high.canvas, { quality: "high", reducedMotion: false });
    const b = createWebGLWarRenderer(low.canvas, { quality: "low", reducedMotion: true });
    a.resize(1440, 780, 2); b.resize(1440, 780, 2);
    assert.equal(low.canvas.width, 1440);
    let s = tickWar(startWar({ stage: 0, difficulty: "normal" }), 1600);
    s = typeWarKey(s, s.enemies[0].word[0]);
    a.render(s, WAR_STAGES[0], 1000); b.render(s, WAR_STAGES[0], 1000);
    assert.ok(low.stats().counts[0] < high.stats().counts[0]);
    assert.ok(low.stats().lastActors.length < high.stats().lastActors.length);
    s = typeWarKey({ ...s, energy: 100, specialUnlocks: ["shockwave"] }, "1");
    a.render(s, WAR_STAGES[0], 1150);
    assert.ok(high.stats().lastActors.every(Number.isFinite));
    a.dispose(); b.dispose();
  });
  it("cleans partial allocations on compile/link/buffer failure and rejects context loss", () => {
    for (const failure of ["compile", "link", "buffer"] as const) {
      const h = glHarness(failure);
      assert.throws(() => createWebGLWarRenderer(h.canvas, { quality: "auto", reducedMotion: false }));
      assert.ok(h.stats().deletedShaders > 0);
      if (failure !== "compile") assert.equal(h.stats().deletedPrograms, 1);
    }
    const h = glHarness();
    const renderer = createWebGLWarRenderer(h.canvas, { quality: "auto", reducedMotion: false });
    h.setLost();
    assert.throws(() => renderer.render(startWar({ stage: 0, difficulty: "normal" }), WAR_STAGES[0], 0));
    renderer.dispose();
    assert.equal(h.stats().deletedBuffers, 2);
  });
  it("keeps DOM projection available even when neither WebGL nor Canvas exists", () => {
    const canvas = { getContext: () => null, width: 0, height: 0 } as unknown as HTMLCanvasElement;
    assert.throws(() => createWebGLWarRenderer(canvas, { quality: "auto", reducedMotion: true }));
    const renderer = createTacticalWarRenderer(canvas, { quality: "low", reducedMotion: true });
    assert.equal(renderer.mode, "fallback");
    renderer.resize(390, 650, 4);
    renderer.render({ ...startWar({ stage: 0, difficulty: "normal" }), enemies: [enemy("wraith")] }, WAR_STAGES[0], 0);
    assert.ok(renderer.projectEnemy(enemy("wraith")).visible);
    assert.equal(canvas.width, 390);
    renderer.dispose(); renderer.dispose();
  });
});
