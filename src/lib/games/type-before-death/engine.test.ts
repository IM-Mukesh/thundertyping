import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  activateDeathOverdrive,
  calculateDeathWordDamage,
  calculateDeathWordScore,
  chooseDeathUpgrade,
  dailyChallengeSeed,
  deathStats,
  getDailyChallenge,
  pauseDeath,
  resumeDeath,
  startDeath,
  startDeathWave,
  tickDeath,
  typeDeathKey,
} from "@/lib/games/type-before-death/engine";
import { DEATH_ENEMIES, DEATH_LIMITS, DEATH_MISSIONS, DEATH_UPGRADES } from "@/lib/games/type-before-death/content";
import type { DeathEnemy, DeathState } from "@/lib/games/type-before-death/types";

function combat(seed = "test-seed"): DeathState {
  return tickDeath(startDeath({ mission: 0, difficulty: "normal", seed }), 1500);
}

function typeWord(state: DeathState, word: string): DeathState {
  let next = state;
  for (const key of word) next = typeDeathKey(next, key);
  return next;
}

function replaceEnemy(state: DeathState, patch: Partial<DeathEnemy>): DeathState {
  const source = state.enemies[0];
  assert.ok(source);
  return {
    ...state,
    enemies: [{ ...source, ...patch }],
    targetId: null,
    spawned: 1,
    spawnMs: 10_000,
  };
}

function finishRun(seed = "complete-run"): DeathState {
  let state = startDeath({ mission: 0, difficulty: "easy", seed });
  for (let guard = 0; guard < 3000 && state.phase !== "results"; guard += 1) {
    if (state.phase === "briefing" || state.phase === "wave") {
      state = tickDeath(state, 2000);
    } else if (state.phase === "upgrade") {
      state = chooseDeathUpgrade(state, state.upgradeChoices[0]);
    } else if (state.phase === "combat") {
      const enemy = state.enemies.find((candidate) => candidate.id === state.targetId)
        ?? [...state.enemies].sort((a, b) => b.progress - a.progress || a.id - b.id)[0];
      if (enemy) state = typeWord(state, enemy.word);
      state = tickDeath(state, 1000);
    } else if (state.phase === "boss" && state.boss) {
      state = typeWord(state, state.boss.word);
      state = tickDeath(state, 1000);
    }
  }
  return state;
}

describe("Type Before Death deterministic engine", () => {
  it("uses deterministic seeded spawn/content decisions", () => {
    const a = tickDeath(startDeath({ mission: 2, seed: "same" }), 4000);
    const b = tickDeath(startDeath({ mission: 2, seed: "same" }), 4000);
    const c = tickDeath(startDeath({ mission: 2, seed: "different" }), 4000);
    assert.deepEqual(a, b);
    assert.notDeepEqual(a.enemies.map((enemy) => [enemy.kind, enemy.word, enemy.lane]), c.enemies.map((enemy) => [enemy.kind, enemy.word, enemy.lane]));
  });

  it("locks the most urgent matching prefix and retains the lock through a mistake", () => {
    const initial = combat();
    const first = initial.enemies[0];
    assert.ok(first);
    const a = { ...first, id: 10, word: "guard", progress: 0.2, typed: 0, highWater: 0 };
    const b = { ...first, id: 11, word: "gate", progress: 0.8, typed: 0, highWater: 0 };
    const state = { ...initial, enemies: [a, b], spawned: 2 };
    const locked = typeDeathKey(state, "g");
    assert.equal(locked.targetId, 11);
    const mistake = typeDeathKey(locked, "x");
    assert.equal(mistake.targetId, 11);
    assert.equal(mistake.enemies.find((enemy) => enemy.id === 11)?.typed, 1);
    assert.equal(mistake.combo, 0);
    assert.equal(mistake.incorrectKeys, 1);
  });

  it("does not count an empty backspace as a typing mistake", () => {
    const state = combat("empty-backspace");
    const next = typeDeathKey({ ...state, targetId: null }, "Backspace");
    assert.equal(next.incorrectKeys, state.incorrectKeys);
    assert.equal(next.heat, state.heat);
    assert.equal(next.combo, state.combo);
  });

  it("applies difficulty travel as duration and archetype speed once", () => {
    const progress = (["easy", "normal", "hard"] as const).map((difficulty) => {
      const state = tickDeath(startDeath({ mission: 0, difficulty, seed: "walker-0" }), 1500);
      assert.equal(state.enemies[0]?.kind, "walker");
      const next = tickDeath(state, 1000);
      assert.equal(next.enemies[0]?.travelMs, 18_000 * { easy: 1.3, normal: 1, hard: 0.84 }[difficulty]);
      return next.enemies[0]?.progress ?? 0;
    });
    assert.ok(Math.abs(progress[0] - 1000 / (18_000 * 1.3)) < 1e-9);
    assert.ok(Math.abs(progress[1] - 1000 / 18_000) < 1e-9);
    assert.ok(Math.abs(progress[2] - 1000 / (18_000 * 0.84)) < 1e-9);
    assert.ok(progress[0] < progress[1] && progress[1] < progress[2]);
  });

  it("splits runner acceleration at the half-approach boundary", () => {
    const initial = replaceEnemy(combat("runner-boundary"), {
      kind: "runner",
      progress: 0.45,
      travelMs: 18_000,
      visible: true,
    });
    const whole = tickDeath(initial, 3500);
    let segmented = initial;
    for (let i = 0; i < 35; i += 1) segmented = tickDeath(segmented, 100);
    const wholeEnemy = whole.enemies[0];
    const segmentedEnemy = segmented.enemies[0];
    assert.ok(wholeEnemy);
    assert.ok(segmentedEnemy);
    assert.ok(wholeEnemy.progress > 0.89);
    assert.ok(Math.abs(wholeEnemy.progress - 0.892708333333) < 1e-9);
    assert.ok(Math.abs(wholeEnemy.progress - segmentedEnemy.progress) < 1e-9);
  });

  it("counts unique prefix output once and scales damage with word length", () => {
    const short = replaceEnemy(combat("short"), { word: "ash", tier: "short", hp: 10_000, maxHp: 10_000 });
    const long = replaceEnemy(combat("long"), { word: "barricade", tier: "long", hp: 10_000, maxHp: 10_000 });
    const shortDone = typeWord(short, "ash");
    const longDone = typeWord(long, "barricade");
    assert.equal(shortDone.outputChars, 3);
    assert.equal(longDone.outputChars, 9);
    assert.ok(longDone.damageDealt > shortDone.damageDealt);
    const retreated = typeDeathKey(typeDeathKey(shortDone, "Backspace"), "h");
    assert.equal(retreated.outputChars, 3);
    assert.equal(retreated.damageDealt, shortDone.damageDealt);
  });

  it("handles heat jams, overdrive, pause and bounded stats", () => {
    let state = replaceEnemy(combat("heat"), { word: "aaaaaaaa", tier: "long", hp: 10_000, maxHp: 10_000 });
    // A wrong key adds heat without changing prefix progress.
    for (let i = 0; i < 12; i += 1) state = typeDeathKey(state, "x");
    assert.ok(state.jams >= 1);
    assert.ok(state.jamMs > 0);
    const paused = pauseDeath(state);
    assert.equal(tickDeath(paused, 100_000), paused);
    assert.equal(resumeDeath(paused).phase, "combat");
    const charged = { ...state, phase: "combat" as const, jamMs: 0, energy: 100 };
    const overdrive = activateDeathOverdrive(charged);
    assert.ok(overdrive.overdriveMs > 0);
    assert.equal(overdrive.energy, 0);
    const stats = deathStats({ ...overdrive, score: Number.MAX_VALUE, elapsedMs: Number.MAX_VALUE, outputChars: Number.MAX_VALUE });
    assert.ok(stats.score <= 2_000_000_000);
    assert.ok(stats.wpm <= 1000);
    assert.ok(stats.accuracy >= 0 && stats.accuracy <= 100);
  });

  it("moves through waves, upgrade draft and three boss phases", () => {
    const completed = finishRun();
    assert.equal(completed.phase, "results");
    assert.equal(completed.outcome, "victory");
    assert.equal(completed.resultReason, "boss-defeated");
    assert.equal(completed.wavesCleared, DEATH_MISSIONS[0].waves);
    assert.equal(completed.boss?.bossPhase, 3);
    assert.ok(completed.score > 0);
    assert.ok(completed.cleared > 0);
    assert.ok(completed.upgrades["hollow-point"] + completed.upgrades.longshot + completed.upgrades.quickload > 0);
  });

  it("offers seeded upgrades and applies their bounded repair effect", () => {
    const state = { ...combat("upgrade"), enemies: [], spawned: 999, barricade: 5, maxBarricade: 100 };
    const upgradePhase = tickDeath(state, 1);
    assert.equal(upgradePhase.phase, "upgrade");
    assert.equal(upgradePhase.upgradeChoices.length, 3);
    const reinforcement = upgradePhase.upgradeChoices.includes("reinforcement")
      ? "reinforcement"
      : upgradePhase.upgradeChoices[0];
    const chosen = chooseDeathUpgrade(upgradePhase, reinforcement);
    assert.equal(chosen.phase, "wave");
    assert.ok(chosen.barricade <= chosen.maxBarricade);
    assert.equal(chosen.upgrades[reinforcement], 1);
  });

  it("does not treat the campaign quota as an endless final wave", () => {
    const endlessWave = {
      ...startDeath({ mode: "endless", seed: "endless-wave" }),
      phase: "wave" as const,
      wave: 4,
      wavesCleared: DEATH_MISSIONS[0].waves,
      phaseTimeMs: 0,
      enemies: [],
      upgradeChoices: [],
    };
    assert.equal(tickDeath(endlessWave, 1000).phase, "combat");
    assert.equal(startDeathWave(endlessWave).phase, "combat");

    const campaignFinalWave = {
      ...endlessWave,
      mode: "campaign" as const,
    };
    assert.equal(tickDeath(campaignFinalWave, 1000).phase, "boss");
    assert.equal(startDeathWave(campaignFinalWave).phase, "boss");
  });

  it("skips an exhausted endless upgrade draft without changing boss scheduling", () => {
    const base = startDeath({ mode: "endless", seed: "exhausted-upgrades" });
    const upgrades = { ...base.upgrades };
    for (const upgrade of DEATH_UPGRADES) upgrades[upgrade.id] = upgrade.maxRank;
    const waveState = {
      ...base,
      phase: "combat" as const,
      wave: 40,
      wavesCleared: 39,
      enemies: [],
      spawned: 1000,
      resolved: 1000,
      upgrades,
      upgradeChoices: [],
    };
    const nextWave = tickDeath(waveState, 1);
    assert.equal(nextWave.phase, "wave");
    assert.equal(nextWave.wave, 41);
    assert.deepEqual(nextWave.upgradeChoices, []);

    const bossWave = tickDeath({ ...waveState, wave: 44, wavesCleared: 43 }, 1);
    assert.equal(bossWave.phase, "boss");
    assert.equal(bossWave.wave, 45);
    assert.ok(bossWave.boss);
  });

  it("ends active play exactly at the run limit while excluding notices", () => {
    const notice = {
      ...startDeath({ seed: "time-limit-notice" }),
      phase: "wave" as const,
      phaseTimeMs: 0,
      elapsedMs: DEATH_LIMITS.runMs - 100,
    };
    const combatState = tickDeath(notice, 850);
    assert.equal(combatState.phase, "combat");
    assert.equal(combatState.elapsedMs, DEATH_LIMITS.runMs - 100);

    const timedOut = tickDeath(combatState, 100);
    assert.equal(timedOut.phase, "results");
    assert.equal(timedOut.outcome, "defeat");
    assert.equal(timedOut.resultReason, "time-limit");
    assert.equal(timedOut.elapsedMs, DEATH_LIMITS.runMs);
    assert.equal(tickDeath(timedOut, 1000), timedOut);
    assert.deepEqual(typeDeathKey(timedOut, "a"), timedOut);
  });
});

describe("Type Before Death daily challenge", () => {
  it("derives stable UTC daily seeds and normalizes daily mode", () => {
    assert.equal(dailyChallengeSeed("2026-10-06"), "2026-10-06:type-before-death");
    assert.equal(getDailyChallenge("2026-10-06").seed, getDailyChallenge(new Date("2026-10-06T23:59:00.000Z")).seed);
    assert.notEqual(dailyChallengeSeed("2026-10-06"), dailyChallengeSeed("2026-10-07"));
    const state = startDeath({ mode: "daily", day: "2026-10-06", seed: "ignored", difficulty: "hard" });
    assert.equal(state.mode, "daily");
    assert.equal(state.difficulty, "normal");
    assert.equal(state.seed, dailyChallengeSeed("2026-10-06"));
  });

  it("keeps enemy archetype registry distinct", () => {
    const kinds = Object.keys(DEATH_ENEMIES);
    assert.equal(kinds.length, 10);
    assert.equal(new Set(kinds.map((kind) => DEATH_ENEMIES[kind as keyof typeof DEATH_ENEMIES].behavior)).size, 10);
    assert.ok(DEATH_ENEMIES.bomber.damage > DEATH_ENEMIES.walker.damage);
    assert.ok(DEATH_ENEMIES.brute.hp > DEATH_ENEMIES.runner.hp);
  });

  it("applies weapon and survivor loadouts without changing the input contract", () => {
    const base = combat("loadout");
    const enemy = base.enemies[0];
    assert.ok(enemy);
    const pistol = { ...base, weapon: "pistol" as const, survivor: "soldier" as const };
    const sniper = { ...base, weapon: "sniper" as const, survivor: "scout" as const };
    assert.ok(calculateDeathWordDamage(sniper, enemy, 8, true) > calculateDeathWordDamage(pistol, enemy, 8, true));
    const engineer = startDeath({ seed: "engineer", survivor: "engineer", weapon: "shotgun" });
    assert.ok(engineer.maxBarricade > base.maxBarricade);
    assert.equal(engineer.weapon, "shotgun");
    assert.equal(engineer.survivor, "engineer");
  });

  it("F11: Overdrive notification accurately describes 1.5x damage and 2x score multipliers", () => {
    const base = combat("overdrive-test");
    const enemy = base.enemies[0];
    assert.ok(enemy);

    const readyState = { ...base, energy: 100, overdriveMs: 0 };
    const overdriveState = activateDeathOverdrive(readyState);

    assert.equal(
      overdriveState.message,
      "OVERDRIVE: the barricade systems are synchronized. 1.5x damage and 2x score.",
      "Overdrive message must accurately state 1.5x damage and 2x score",
    );

    // Verify exact 1.5x damage multiplier
    const normalDmg = calculateDeathWordDamage(readyState, enemy, 6, true);
    const overdriveDmg = calculateDeathWordDamage(overdriveState, enemy, 6, true);
    assert.equal(Math.round(overdriveDmg * 100), Math.round(normalDmg * 1.5 * 100));

    // Verify exact 2x score multiplier
    const normalScore = calculateDeathWordScore(readyState, enemy, 6, true);
    const overdriveScore = calculateDeathWordScore(overdriveState, enemy, 6, true);
    assert.equal(Math.round(overdriveScore), Math.round(normalScore * 2));
  });
});
