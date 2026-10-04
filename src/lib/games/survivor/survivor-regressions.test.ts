import assert from "node:assert/strict";
import { test } from "node:test";
import { createRng, type Rng } from "@/lib/rng/seeded-rng";
import { ENEMY_TYPES } from "@/lib/games/survivor/content";
import { decaySurvivorEnemies, strikeSurvivor, typeSurvivorWord, xpForLevel } from "@/lib/games/survivor/transitions";
import type { Enemy, SurvivorState } from "@/lib/games/survivor/use-survivor";

function enemy(uid: number, hp: number, word = "survivor"): Enemy {
  return { uid, hp, maxHp: hp, word, type: { ...ENEMY_TYPES[0], xp: 4 }, typed: 0,
    progress: 0.2, angle: 0, hitFlash: 0, guard: 0 };
}
function run(overrides: Partial<SurvivorState> = {}): SurvivorState {
  return {
    phase: "playing", characterId: "test", hp: 40, maxHp: 100, wave: 1, waveMs: 0, elapsedMs: 1234,
    enemies: [enemy(1, 100)], typed: "", lockedUid: null, xp: 0, xpToNext: xpForLevel(1),
    level: 1, upgrades: [], offer: [], pendingLevelUps: 0, score: 0, kills: 0, combo: 0,
    bestCombo: 0, perfectWords: 0, wordFlawless: true, banner: null, ...overrides,
  };
}
function noCrit(): Rng {
  return { ...createRng("survivor"), chance: () => false };
}

test("corpse flash decays to zero and corpse leaves the actual entity array", () => {
  const before = [{ ...enemy(1, 0), hitFlash: 220 }, enemy(2, 30)];
  let enemies = before;
  for (let i = 0; i < 12; i++) enemies = decaySurvivorEnemies(enemies, 50);
  assert.deepEqual(enemies.map((e) => e.uid), [2]);
  assert.equal(before[0].hitFlash, 220);
});

test("a detonation and its chain award every death once, including XP, healing and score", () => {
  const before = run({ kills: 2, upgrades: ["detonate", "chain", "bloodletting"],
    enemies: [enemy(1, 1), enemy(2, 8, "spark"), enemy(3, 17, "flame")], xpToNext: 1000 });
  // 22 direct, 9 splash; the third lifetime kill arcs for 11 and finishes enemy 3.
  const result = strikeSurvivor(before, 1, noCrit());
  assert.equal(result.state.kills, 5);
  assert.equal(result.state.xp, 12);
  assert.equal(result.state.hp, 46);
  assert.equal(result.state.score, 35 + 26 + 26);
  assert.deepEqual(result.events.filter((e) => e.kind === "kill").map((e) => e.enemy.uid), [1, 2, 3]);
  assert.equal(result.state.combo, 1, "combo counts completed words, not splash victims");
  assert.equal(before.enemies[0].hp, 1);
  const replay = strikeSurvivor(result.state, 1, noCrit());
  assert.equal(replay.state, result.state);
  assert.equal(replay.events.length, 0);
});

test("secondary kills can earn several levels and each earned draft is retained", () => {
  const enemies = [enemy(1, 1), enemy(2, 1), enemy(3, 1)].map((e) => ({ ...e, type: { ...e.type, xp: 40 } }));
  const result = strikeSurvivor(run({ enemies, upgrades: ["detonate"] }), 1, noCrit());
  assert.equal(result.state.phase, "draft");
  assert.ok(result.levelsGained >= 2);
  assert.equal(result.state.pendingLevelUps, result.levelsGained - 1);
  assert.equal(result.state.offer.length, 3);
});

test("bestCombo tracks successful nonlethal words and chain waits for a real kill", () => {
  const result = strikeSurvivor(run({ kills: 2, combo: 7, bestCombo: 7,
    upgrades: ["chain"], enemies: [enemy(1, 100), enemy(2, 100)] }), 1, noCrit());
  assert.equal(result.state.combo, 8);
  assert.equal(result.state.bestCombo, 8);
  assert.equal(result.state.enemies[1].hp, 100);
  assert.equal(result.state.kills, 2);
});

test("Perfectionist uses mistake history rather than the inevitably complete typed length", () => {
  const initial = run({ upgrades: ["perfectionist"] });
  const partial = typeSurvivorWord(initial, "sur").state;
  const typo = typeSurvivorWord(partial, "surx");
  assert.equal(typo.miss, true);
  const corrected = typeSurvivorWord(typo.state, "survivor");
  assert.equal(corrected.state.enemies[0].typed, 8);
  assert.equal(corrected.state.wordFlawless, false);
  let chance = 0;
  const rng = { ...createRng("chance"), chance: (p: number) => { chance = p; return false; } };
  const flawed = strikeSurvivor(corrected.state, corrected.strikeUid!, rng);
  assert.equal(chance, 0.05);
  assert.equal(flawed.state.perfectWords, 0);
  const clean = typeSurvivorWord(flawed.state, "survivor");
  const perfect = strikeSurvivor(clean.state, clean.strikeUid!, rng);
  assert.equal(chance, 0.3);
  assert.equal(perfect.state.perfectWords, 1);
});

test("backspacing/resetting the buffer does not erase an attempt's accuracy history", () => {
  const partial = typeSurvivorWord(run(), "sur").state;
  const corrected = typeSurvivorWord(partial, "su").state;
  assert.equal(corrected.wordFlawless, false);
  const cleared = typeSurvivorWord(corrected, "").state;
  assert.equal(cleared.wordFlawless, false);
  assert.equal(cleared.enemies[0].typed, 0);
});

test("same snapshot and seed produce the same strike without mutating its input", () => {
  const initial = run({ upgrades: ["detonate", "chain"], enemies: [enemy(1, 2), enemy(2, 3)] });
  assert.deepEqual(strikeSurvivor(initial, 1, createRng("repeat")), strikeSurvivor(initial, 1, createRng("repeat")));
  assert.equal(initial.kills, 0);
});
