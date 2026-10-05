import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ENEMY_DEFINITIONS, WAR_STAGES } from "@/lib/games/rakshasa/content";
import { createWarState, startWar, tickWar, typeWarKey, pauseWar, resumeWar, warStats, MAX_ENEMIES, MAX_EFFECTS } from "@/lib/games/rakshasa/engine";
import type { EnemyClass, WarEnemy, WarState } from "@/lib/games/rakshasa/types";

const makeEnemy = (kind: EnemyClass = "fallen-soldier", overrides: Partial<WarEnemy> = {}): WarEnemy => ({
  id: 1, kind, word: "guard", lane: 1, progress: .2, travelMs: 15000,
  hp: (1 + ENEMY_DEFINITIONS[kind].armor) * 100, maxHp: (1 + ENEMY_DEFINITIONS[kind].armor) * 100,
  elite: false, typed: 0, highWater: 0, bornAt: 0, lastHitAt: -1, ...overrides,
});
const running = (overrides: Partial<WarState> = {}): WarState => ({ ...startWar({ stage: 0, difficulty: "normal", seed: "test-war" }),
  phase: "playing", enemies: [makeEnemy()], spawnMs: 2000, spawned: 1, nextId: 50, ...overrides });
function type(state: WarState, text: string, ms = 0): WarState {
  for (const character of text) state = typeWarKey(ms ? tickWar(state, ms) : state, character);
  return state;
}
/** End-to-end simulation through production entry points, with real per-key time. */
export function completeWarStage(stage: number, difficulty: "easy" | "normal" | "hard" = "normal"): WarState {
  let state = startWar({ stage, difficulty, seed: `campaign-${stage}` });
  for (let step = 0; step < 9000 && !["victory", "defeat"].includes(state.phase); step++) {
    if (["intro", "boss-intro"].includes(state.phase)) { state = tickWar(state, 50); continue; }
    if (state.phase === "finisher" && state.boss?.typed === state.boss?.text.length) { state = tickWar(state, 50); continue; }
    const enemy = state.enemies.find((enemy) => enemy.id === state.targetId) ?? [...state.enemies].sort((a, b) => b.progress - a.progress || a.id - b.id)[0];
    const key = state.boss ? state.boss.text[state.boss.typed] : enemy?.word[enemy.typed];
    state = tickWar(state, key ? 95 : 50);
    if (key) state = typeWarKey(state, key);
    assert.ok(state.enemies.length <= MAX_ENEMIES);
    assert.ok(state.effects.length <= MAX_EFFECTS);
    assert.ok(new Set(state.enemies.map((e) => e.word[0])).size === state.enemies.length);
  }
  return state;
}

describe("Typebound: The Last Dawn typing and score integrity", () => {
  it("is idle until an explicit start; introductions cannot accept attacks", () => {
    const menu = createWarState();
    assert.equal(typeWarKey(menu, "g"), menu);
    const intro = startWar({ stage: 0, difficulty: "normal" });
    assert.equal(typeWarKey(intro, "g"), intro);
    const playing = tickWar(intro, 1600);
    assert.equal(playing.phase, "playing");
    assert.equal(playing.elapsedMs, 0);
    assert.equal(playing.enemies.length, 1);
  });
  it("a correct character strikes visibly; finishing the word earns a kill and score", () => {
    const before = running();
    const after = typeWarKey(before, "g");
    assert.equal(before.enemies[0].typed, 0, "pure transition preserves input");
    assert.equal(after.targetId, 1);
    assert.equal(after.enemies[0].typed, 1);
    assert.equal(after.outputChars, 1);
    assert.equal(after.score, 0);
    assert.equal(after.effects[0].kind, "attack");
    assert.ok(after.enemies[0].hp < 100);
    const killed = type(after, "uard");
    assert.equal(killed.cleared, 1);
    assert.equal(killed.score, 50);
    assert.equal(killed.outputChars, 5);
    assert.equal(killed.combo, 1);
    assert.equal(killed.targetId, null);
    assert.ok(killed.effects.some((effect) => effect.kind === "kill"));
  });
  it("wrong characters and space spam cannot score, damage or finish a target", () => {
    const after = type(running(), " x".repeat(80));
    assert.equal(after.outputChars, 0);
    assert.equal(after.score, 0);
    assert.equal(after.cleared, 0);
    assert.equal(after.enemies[0].hp, 100);
    assert.equal(after.incorrectKeys, 160);
  });
  it("mistakes leave the target prefix intact and break combo immediately", () => {
    const after = type(typeWarKey(running({ combo: 7 }), "g"), "x");
    assert.equal(after.enemies[0].typed, 1);
    assert.equal(after.combo, 0);
    assert.equal(after.incorrectKeys, 1);
    assert.equal(after.targetId, 1);
  });
  it("selects matching targets by urgency and ID, then keeps the target locked", () => {
    const a = makeEnemy("fallen-soldier", { id: 1, progress: .4 });
    const b = makeEnemy("fallen-soldier", { id: 2, word: "grave", progress: .7 });
    const chosen = typeWarKey(running({ enemies: [a, b] }), "g");
    assert.equal(chosen.targetId, 2);
    const stillLocked = typeWarKey(chosen, "u");
    assert.equal(stillLocked.enemies[0].typed, 0);
    assert.equal(stillLocked.targetId, 2);
    assert.equal(stillLocked.incorrectKeys, 1);
    assert.equal(typeWarKey(running({ enemies: [b, { ...a, progress: .7 }] }), "g").targetId, 1);
  });
  it("backspacing/retyping cannot farm output, HP damage, score or energy", () => {
    let s = type(running(), "gua");
    const hp = s.enemies[0].hp, energy = s.energy;
    for (let n = 0; n < 40; n++) s = typeWarKey(typeWarKey(s, "Backspace"), "a");
    assert.equal(s.outputChars, 3);
    assert.equal(s.enemies[0].hp, hp);
    assert.equal(s.energy, energy);
    assert.equal(s.score, 0);
    assert.equal(s.correctKeys, 43);
    s = type(s, "rd");
    assert.equal(s.score, 50);
    assert.equal(s.outputChars, 5);
  });
  it("armor requires a new complete word per layer, including giants and elites", () => {
    for (const kind of ["armored-revenant", "giant-revenant"] as const) {
      let s = running({ enemies: [makeEnemy(kind)] });
      for (let layer = 0; layer <= ENEMY_DEFINITIONS[kind].armor; layer++) {
        const word = s.enemies[0].word;
        s = type(s, word);
        if (layer < ENEMY_DEFINITIONS[kind].armor) {
          assert.equal(s.cleared, 0);
          assert.notEqual(s.enemies[0].word, word);
        }
      }
      assert.equal(s.cleared, 1);
    }
    const elite = type(running({ enemies: [makeEnemy("fallen-soldier", { elite: true, hp: 200, maxHp: 200 })] }), "guard");
    assert.equal(elite.cleared, 0);
    assert.equal(elite.enemies[0].hp, 100);
  });
  it("combos deterministically raise completion points and stop at the cap", () => {
    const first = type(running(), "guard");
    const clean = type(running({ combo: 10 }), "guard");
    const capped = type(running({ combo: 300 }), "guard");
    assert.ok(clean.score > first.score);
    assert.equal(capped.score, 100);
    assert.equal(type(running({ combo: 10 }), "xguard").score, first.score);
  });
  it("scores WPM from unique output over active wall time, not presses or special kills", () => {
    const s = running({ outputChars: 50, correctKeys: 75, incorrectKeys: 25, elapsedMs: 60000 });
    assert.deepEqual(warStats(s), { wpm: 10, accuracy: 75 });
    assert.equal(warStats(tickWar(s, 1000)).wpm, 50 / 5 / (61000 / 60000));
  });
});

describe("Typebound: The Last Dawn campaign and time boundaries", () => {
  it("covers eight distinct environments, ten classes and their authored bosses", () => {
    assert.equal(WAR_STAGES.length, 8);
    assert.equal(new Set(WAR_STAGES.map((s) => s.scenery)).size, 8);
    assert.equal(Object.keys(ENEMY_DEFINITIONS).length, 10);
    assert.equal(new Set(WAR_STAGES.flatMap((s) => [...s.enemies])).size, 10);
    for (const stage of WAR_STAGES) {
      assert.equal(stage.sentences.length, 3);
      assert.ok(stage.sentences.every((text) => /^[a-z .']+$/.test(text)));
      assert.ok(stage.finisher.endsWith("."));
    }
  });
  it("completes all eight production campaigns across all three difficulties", () => {
    for (const difficulty of ["easy", "normal", "hard"] as const) for (let stage = 0; stage < 8; stage++) {
      const completed = completeWarStage(stage, difficulty);
      assert.equal(completed.phase, "victory", `${stage}/${difficulty}`);
      assert.equal(completed.wave, 3);
      assert.equal(completed.boss?.phase, 3);
      assert.equal(completed.boss?.typed, WAR_STAGES[stage].finisher.length);
      assert.equal(completed.cleared, 19);
      assert.ok(completed.health > 0 && completed.score > 0 && completed.elapsedMs > 0);
      assert.ok(completed.outputChars >= WAR_STAGES[stage].sentences.join("").length + WAR_STAGES[stage].finisher.length);
    }
  });
  it("without typing, waiting ends in defeat, never campaign victory", () => {
    for (let stage = 0; stage < 8; stage++) {
      const s = tickWar(startWar({ stage, difficulty: "easy", seed: "no-output" }), 1_000_000);
      assert.equal(s.phase, "defeat");
      assert.equal(s.outputChars, 0);
      assert.equal(s.score, 0);
    }
  });
  it("pauses every active phase without moving clocks, effects, charges or typing", () => {
    const states = [startWar({ stage: 0, difficulty: "normal" }), running(), startWar({ stage: 0, difficulty: "normal", tutorial: true }),
      { ...running(), phase: "boss-intro" as const }, { ...running(), phase: "boss" as const }, { ...running(), phase: "finisher" as const }];
    for (const s of states) {
      const paused = pauseWar(s);
      assert.equal(paused.phase, "paused");
      assert.equal(tickWar(paused, 600000), paused);
      assert.equal(typeWarKey(paused, "g"), paused);
      assert.deepEqual(resumeWar(paused), { ...s, pausedFrom: null });
    }
  });
  it("consumes long delays exactly, with equivalent segmented updates", () => {
    const start = running({ enemies: [makeEnemy("fallen-soldier", { travelMs: 8000 })] });
    const once = tickWar(start, 12000);
    let split = start;
    for (let n = 0; n < 120; n++) split = tickWar(split, 100);
    assert.equal(once.elapsedMs, 12000);
    assert.equal(split.health, once.health);
    assert.equal(split.spawned, once.spawned);
    assert.equal(split.enemies.length, once.enemies.length);
    split.enemies.forEach((enemy, index) => assert.ok(Math.abs(enemy.progress - once.enemies[index].progress) < 1e-8));
  });
  it("ignores invalid deltas and clamps invalid start options", () => {
    const s = running();
    for (const dt of [-1, 0, Infinity, NaN]) assert.equal(tickWar(s, dt), s);
    assert.equal(startWar({ stage: Infinity, difficulty: "normal" }).stage, 0);
    assert.equal(startWar({ stage: 999, difficulty: "normal" }).stage, 7);
  });
  it("necromancers cast early and possessed humans accelerate", () => {
    const caster = running({ spawnMs: 100000, enemies: [makeEnemy("necromancer", { progress: .679, travelMs: 10000 })] });
    const cursed = tickWar(caster, 20);
    assert.equal(cursed.enemies.length, 0);
    assert.equal(cursed.health, 77);
    const possessed = tickWar(running({ enemies: [makeEnemy("possessed-human", { progress: .55, travelMs: 10000 })], spawnMs: 100000 }), 100);
    assert.ok(Math.abs(possessed.enemies[0].progress - .566) < 1e-9);
  });
  it("caps adaptive pressure and applies it only at wave boundaries", () => {
    const s = running({ elapsedMs: 60000, outputChars: 600, spawned: 5, enemies: [makeEnemy()] });
    const unchanged = typeWarKey(s, "g");
    assert.equal(unchanged.pressure, 1);
    const advanced = type(unchanged, "uard");
    assert.equal(advanced.wave, 2);
    assert.ok(advanced.pressure > 1 && advanced.pressure <= 1.08);
  });
  it("ages effects out and resets the entire run on restart", () => {
    const attacked = typeWarKey(running(), "g");
    assert.equal(tickWar(attacked, 2000).effects.length, 0);
    const restarted = startWar({ stage: 0, difficulty: "normal" });
    for (const key of ["score", "combo", "cleared", "outputChars", "elapsedMs", "energy"] as const) assert.equal(restarted[key], 0);
    assert.deepEqual(restarted.enemies, []);
  });
  it("safe tutorial requires real word, armor and full sentence completion", () => {
    let s = tickWar(startWar({ stage: 0, difficulty: "normal", tutorial: true }), 600000);
    assert.equal(s.phase, "tutorial");
    assert.equal(s.health, 100);
    s = type(s, "guard", 120);
    assert.equal(s.tutorialStep, 2);
    s = type(s, "shieldresolve", 120);
    assert.equal(s.tutorialStep, 3);
    const text = s.boss!.text;
    s = type(s, text.slice(0, -1), 120);
    assert.equal(tickWar(s, 10000).phase, "tutorial", "partial sentence cannot finish");
    s = type(s, text.slice(-1), 120);
    assert.equal(s.phase, "finisher");
    const elapsed = s.elapsedMs;
    s = tickWar(s, 1400);
    assert.equal(s.phase, "victory");
    assert.equal(s.elapsedMs, elapsed, "completed execution is unscored cinematic time");
  });
  it("boss sentence attacks preserve prefixes and retypes cannot double damage", () => {
    const text = WAR_STAGES[0].sentences[0];
    let s = running({ phase: "boss", enemies: [], boss: { name: "Warden", phase: 0, hp: 100, maxHp: 100, text, typed: 0, highWater: 0, chargeMs: 0, chargeLimitMs: 1000 } });
    s = type(s, "a ");
    const hp = s.boss!.hp;
    s = typeWarKey(typeWarKey(s, "Backspace"), " ");
    assert.equal(s.outputChars, 2);
    assert.equal(s.boss!.hp, hp);
    s = tickWar(s, 1000);
    assert.equal(s.health, 86);
    assert.equal(s.boss!.typed, 2);
    const mistakes = s.incorrectKeys;
    s = typeWarKey(s, "x");
    assert.equal(s.incorrectKeys, mistakes + 1);
    assert.equal(s.boss!.hp, hp);
  });
});

describe("Typebound: The Last Dawn earned specials", () => {
  it("requires both the play-unlocked ability and sufficient energy", () => {
    const locked = running({ energy: 100 });
    assert.equal(typeWarKey(locked, "1"), locked);
    const poor = running({ energy: 34, specialUnlocks: ["shockwave"] });
    assert.equal(typeWarKey(poor, "1"), poor);
    const used = typeWarKey(running({ energy: 100, specialUnlocks: ["shockwave"] }), "1");
    assert.equal(used.specialUses, 1);
    assert.equal(used.energy, 65);
    assert.equal(used.outputChars, 0);
    assert.equal(used.correctKeys, 0);
    assert.equal(used.cleared, 1);
    assert.equal(used.score, 12);
  });
  it("respects spectral/ember immunity and cannot bypass armored targets", () => {
    const enemies = [makeEnemy("wraith", { id: 1 }), makeEnemy("burning-undead", { id: 2, word: "ash" }), makeEnemy("armored-revenant", { id: 3, word: "iron" }), makeEnemy("fallen-soldier", { id: 4, word: "night" })];
    const used = typeWarKey(running({ enemies, energy: 100, specialUnlocks: ["ember"] }), "3");
    assert.deepEqual(used.enemies.map((e) => e.id), [1, 2, 3]);
    assert.equal(used.cleared, 1);
    assert.equal(used.outputChars, 0);
  });
  it("frost slows motion for six active seconds and survives pause", () => {
    let s = typeWarKey(running({ energy: 100, specialUnlocks: ["frost"] }), "2");
    assert.equal(s.frostMs, 6000);
    const slow = tickWar(s, 500);
    const normal = tickWar(running(), 500);
    assert.ok(slow.enemies[0].progress < normal.enemies[0].progress);
    s = resumeWar(tickWar(pauseWar(s), 100000));
    assert.equal(s.frostMs, 6000);
    assert.equal(tickWar(s, 6000).frostMs, 0);
  });
  it("specials buy boss time, never boss damage or sentence output", () => {
    let s = running({ phase: "boss", enemies: [], energy: 100, specialUnlocks: ["shockwave", "frost", "ember"], boss: { name: "Warden", phase: 0, hp: 100, maxHp: 100, text: "hold the line.", typed: 0, highWater: 0, chargeMs: 1800, chargeLimitMs: 10000 } });
    for (const key of ["1", "2", "3"]) { s = { ...s, energy: 100 }; s = typeWarKey(s, key); }
    assert.equal(s.boss!.hp, 100);
    assert.equal(s.boss!.typed, 0);
    assert.equal(s.outputChars, 0);
    assert.equal(s.score, 0);
    assert.equal(s.phase, "boss");
  });
});
