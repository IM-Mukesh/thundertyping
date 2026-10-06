import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GAME_DEFINITIONS } from "@/lib/games/game-types";
import {
  createSkyfallState, currentSkyfallSpawnMs, startSkyfall, tickSkyfall, typeSkyfallKey,
  pauseSkyfall, resumeSkyfall, skyfallStats, phaseForCleared,
  type SkyfallState, type SkyfallWord,
} from "@/lib/games/falling-words/engine";
import type { FallingWordsAudioState } from "@/lib/games/falling-words/audio";
import type { FallingWordsVisualState } from "@/lib/games/falling-words/visual-model";
import type { GameState, WordKind } from "@/lib/games/use-falling-words";

const definition = GAME_DEFINITIONS["falling-words"];
const word = (overrides: Partial<SkyfallWord> = {}): SkyfallWord => ({
  id: 1, text: "cloud", kind: "normal", lane: 0, progress: 0.2, fallMs: 9000, highWater: 0, ...overrides,
});
const running = (overrides: Partial<SkyfallState> = {}): SkyfallState => ({
  ...startSkyfall(definition, { seed: "skyfall-test" }), words: [word()], nextId: 2, spawnMs: 100_000, ...overrides,
});
function type(state: SkyfallState, text: string): SkyfallState {
  for (const key of text) state = typeSkyfallKey(state, key);
  return state;
}
function close(actual: number, expected: number, tolerance = 1e-7): void {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
}
function equivalent(actual: SkyfallState, expected: SkyfallState): void {
  close(actual.elapsedMs, expected.elapsedMs);
  close(actual.spawnMs, expected.spawnMs);
  close(actual.lastMissMs ?? 0, expected.lastMissMs ?? 0);
  for (const field of ["status", "lives", "missed", "score", "cleared", "combo", "bestCombo", "outputChars", "correctKeystrokes", "incorrectKeystrokes", "nextId", "typed", "lockedId", "overdriveMs", "slowdownMs"] as const) {
    assert.equal(actual[field], expected[field], field);
  }
  assert.equal(actual.words.length, expected.words.length);
  for (let index = 0; index < actual.words.length; index++) {
    close(actual.words[index].progress, expected.words[index].progress);
    assert.deepEqual({ ...actual.words[index], progress: 0 }, { ...expected.words[index], progress: 0 });
  }
  assert.deepEqual(actual.destroyed, expected.destroyed);
}
function readable(state: SkyfallState): void {
  assert.ok(state.words.length <= Math.min(6, state.laneCount));
  assert.equal(new Set(state.words.map((word) => word.id)).size, state.words.length);
  assert.equal(new Set(state.words.map((word) => word.lane)).size, state.words.length);
  assert.equal(new Set(state.words.map((word) => word.text[0])).size, state.words.length);
  for (const word of state.words) {
    assert.match(word.text, /^[a-z]{3,10}$/);
    assert.ok(word.lane >= 0 && word.lane < state.laneCount);
    assert.ok(word.progress >= 0 && word.progress < 1);
    assert.equal(word.highWater, 0);
    assert.ok(word.kind === "elite" ? word.text.length >= 7 : word.text.length <= 6);
  }
}

describe("Falling Words pure state and strict typing", () => {
  it("is idle until started, exposes the legacy fields, and resets every run", () => {
    const idle = createSkyfallState(definition);
    const legacy: GameState = idle;
    const visual: FallingWordsVisualState = idle;
    const audio: FallingWordsAudioState = idle;
    assert.equal(legacy.status, "idle");
    assert.deepEqual(visual.words, []);
    assert.equal(audio.cleared, 0);
    assert.equal(idle.lives, 3);
    assert.equal(tickSkyfall(idle, 60_000), idle);
    assert.equal(typeSkyfallKey(idle, "c"), idle);
    assert.equal(resumeSkyfall(idle), idle);
    const played = type(running(), "cloud");
    assert.ok(played.score > 0);
    const restarted = startSkyfall(played.definition, { seed: played.seed });
    assert.equal(restarted.status, "running");
    for (const field of ["score", "cleared", "missed", "combo", "bestCombo", "correctKeystrokes", "incorrectKeystrokes", "outputChars", "elapsedMs", "fever", "overdriveMs", "slowdownMs"] as const) {
      assert.equal(restarted[field], 0, field);
    }
    assert.deepEqual(restarted.words, []);
    assert.deepEqual(restarted.destroyed, []);
    assert.equal(restarted.nextId, 1);
    assert.equal(restarted.lockedId, null);
    assert.equal(restarted.lastMissMs, null);
  });

  it("locks an urgent matching target and never switches after a wrong character", () => {
    const words = [word({ text: "cat", progress: 0.8 }), word({ id: 2, text: "car", lane: 1, progress: 0.3 })];
    const locked = type(running({ words, combo: 8 }), "ca");
    assert.equal(locked.lockedId, 1);
    const wrong = typeSkyfallKey(locked, "r");
    assert.equal(wrong.typed, "ca");
    assert.equal(wrong.lockedId, 1);
    assert.equal(wrong.incorrectKeystrokes, 1);
    assert.equal(wrong.correctKeystrokes, 2);
    assert.equal(wrong.outputChars, 2);
    assert.equal(wrong.combo, 0);
    assert.equal(wrong.cleared, 0);
    assert.equal(typeSkyfallKey(wrong, "t").cleared, 1);
    const tied = typeSkyfallKey(running({ words: [{ ...words[1], progress: 0.8 }, words[0]] }), "c");
    assert.equal(tied.lockedId, 1, "equal urgency uses stable ID, not array order");
  });

  it("preserves correct attempts but cannot farm output or points by retyping", () => {
    let state = type(running(), "clo");
    for (let n = 0; n < 40; n++) state = typeSkyfallKey(typeSkyfallKey(state, "Backspace"), "o");
    assert.equal(state.correctKeystrokes, 43);
    assert.equal(state.incorrectKeystrokes, 0);
    assert.equal(state.outputChars, 3);
    assert.equal(state.words[0].highWater, 3);
    assert.equal(state.score, 0);
    assert.equal(state.fever, 0);
    assert.deepEqual(state.destroyed, []);
    state = type(state, "ud");
    assert.equal(state.outputChars, 5);
    assert.equal(state.score, 50);
    assert.equal(state.cleared, 1);
    assert.equal(state.correctKeystrokes, 45);
    assert.deepEqual(state.words, []);
  });

  it("releasing a lock through backspace retains each word's high-water mark", () => {
    let state = type(running({ words: [word(), word({ id: 2, text: "rain", lane: 1 })] }), "cl");
    state = typeSkyfallKey(typeSkyfallKey(state, "Backspace"), "Backspace");
    assert.equal(state.lockedId, null);
    assert.equal(state.outputChars, 2);
    state = typeSkyfallKey(typeSkyfallKey(state, "r"), "Backspace");
    state = type(state, "cloud");
    assert.equal(state.outputChars, 6, "five cloud characters and one rain character, once each");
    assert.equal(state.correctKeystrokes, 8);
    assert.equal(state.score, 50);
  });

  it("unmatched letters only break combo; unsupported chunks and special keys do nothing", () => {
    const before = running({ combo: 5 });
    const wrong = type(before, "x".repeat(100));
    assert.equal(wrong.incorrectKeystrokes, 100);
    assert.equal(wrong.combo, 0);
    assert.equal(wrong.outputChars, 0);
    assert.equal(wrong.score, 0);
    assert.equal(wrong.cleared, 0);
    assert.deepEqual(wrong.words, before.words);
    for (const key of [" ", "1", "2", "3", "cloud", "é", "Enter", ""]) assert.equal(typeSkyfallKey(before, key), before);
  });

  it("accepts uppercase ASCII as a correct letter and stays immutable", () => {
    const before = running();
    Object.freeze(before.words[0]);
    Object.freeze(before.words);
    Object.freeze(before.destroyed);
    Object.freeze(before);
    const after = typeSkyfallKey(before, "C");
    assert.equal(after.typed, "c");
    assert.equal(after.words[0].highWater, 1);
    assert.equal(before.words[0].highWater, 0);
    assert.equal(before.outputChars, 0);
    assert.ok(tickSkyfall(before, 100).words[0].progress > before.words[0].progress);
  });

  it("reports unique output over whole active time and keystroke accuracy", () => {
    const state = running({ elapsedMs: 60_000, outputChars: 50, correctKeystrokes: 75, incorrectKeystrokes: 25 });
    assert.deepEqual(skyfallStats(state), { wpm: 10, accuracy: 75 });
    close(skyfallStats(tickSkyfall(state, 10_000)).wpm, 50 / 5 / (70_000 / 60_000));
    assert.deepEqual(skyfallStats(createSkyfallState(definition)), { wpm: 0, accuracy: 100 });
    assert.deepEqual(skyfallStats(running({ elapsedMs: NaN, outputChars: Infinity })), { wpm: 0, accuracy: 100 });
  });
});

describe("Falling Words legacy rewards and difficulty", () => {
  it("plays a seeded standard run through all five phases using timed physical letters", () => {
    let state = startSkyfall(definition, { seed: "full-run" });
    const phases = new Set<number>([state.phase]);
    const kinds = new Set<WordKind>();
    let sawOverdrive = false;
    for (let step = 0; step < 3000 && state.cleared < 80 && state.status === "running"; step++) {
      state = tickSkyfall(state, 100);
      const target = state.words.find((word) => word.id === state.lockedId)
        ?? [...state.words].sort((a, b) => b.progress - a.progress || a.id - b.id)[0];
      if (!target) continue;
      kinds.add(target.kind);
      state = typeSkyfallKey(state, target.text[state.typed.length]);
      phases.add(state.phase);
      sawOverdrive ||= state.overdriveMs > 0;
      if (state.typed === "") readable(state);
    }
    assert.equal(state.status, "running");
    assert.equal(state.cleared, 80);
    assert.equal(state.lives, 3);
    assert.equal(state.incorrectKeystrokes, 0);
    assert.equal(state.outputChars, state.correctKeystrokes);
    assert.equal(state.phaseName, "Overdrive Frenzy");
    assert.deepEqual([...phases], [1, 2, 3, 4, 5]);
    assert.deepEqual([...kinds].sort(), ["elite", "freeze", "golden", "hazard", "normal"]);
    assert.ok(sawOverdrive);
    assert.ok(state.score > state.outputChars * 10);
    assert.ok(skyfallStats(state).wpm > 0);
  });

  it("preserves every word-kind weight, hazard bonus and fever gain", () => {
    const cases: [WordKind, number, number][] = [
      ["normal", 50, 7], ["elite", 90, 17], ["golden", 150, 21], ["freeze", 70, 7], ["hazard", 125, 7],
    ];
    for (const [kind, points, fever] of cases) {
      const state = type(running({ words: [word({ kind })] }), "cloud");
      assert.equal(state.score, points, kind);
      assert.equal(state.fever, fever, kind);
      assert.equal(state.outputChars, 5, kind);
      assert.equal(state.slowdownMs, kind === "freeze" ? 3500 : 0, kind);
      assert.deepEqual(state.destroyed[0], { seq: 1, lane: 0, progress: 0.2, points, kind, bornMs: 0 });
    }
  });

  it("scores from the preceding combo, caps its multiplier at 2x, and awards the fifth-clear fever bonus", () => {
    assert.equal(type(running({ combo: 4 }), "cloud").score, 70);
    assert.equal(type(running({ combo: 4 }), "cloud").fever, 19);
    assert.equal(type(running({ combo: 10 }), "cloud").score, 100);
    assert.equal(type(running({ combo: 500 }), "cloud").score, 100);
    assert.equal(type(running({ combo: 10 }), "xcloud").score, 50);
    assert.equal(type(running({ combo: 10, bestCombo: 10 }), "cloud").bestCombo, 11);
  });

  it("spends earned fever into 7000ms Overdrive and never refills it during Overdrive", () => {
    const entered = type(running({ fever: 93 }), "cloud");
    assert.equal(entered.fever, 0);
    assert.equal(entered.overdriveMs, 7000);
    assert.equal(entered.score, 50, "the triggering clear is scored before activation");
    const active = type(running({ words: [word({ kind: "hazard" })], overdriveMs: 4000, fever: 12 }), "cloud");
    assert.equal(active.score, 175, "1.5x word score; flat 25 hazard bonus");
    assert.equal(active.fever, 12);
    assert.equal(active.overdriveMs, 4000);
    assert.equal(active.outputChars, 5);
  });

  it("keeps all five thresholds and only advances a phase on completed words", () => {
    const cases: [number, number, string][] = [
      [0, 1, "Scout Warmup"], [10, 2, "Pressure Surge"], [25, 3, "Mixed Threats"],
      [45, 4, "Elite Swarm"], [70, 5, "Overdrive Frenzy"],
    ];
    for (const [cleared, phase, name] of cases) {
      assert.deepEqual(phaseForCleared(cleared), { phase, name });
      if (cleared === 0) continue;
      assert.equal(phaseForCleared(cleared - 1).phase, phase - 1);
      const previous = phaseForCleared(cleared - 1);
      const partial = type(running({ cleared: cleared - 1, phase: previous.phase, phaseName: previous.name }), "clou");
      assert.equal(partial.phase, phase - 1);
      const complete = typeSkyfallKey(partial, "d");
      assert.equal(complete.phase, phase);
      assert.equal(complete.phaseName, name);
    }
  });

  it("preserves 1700→620 spawn and 9000→3600 fall pacing with the legacy ramps", () => {
    for (const cleared of [0, 10, 25, 45, 70, 1000]) {
      const before = running({ words: [], nextId: 1, spawnMs: 0, cleared });
      const after = tickSkyfall(before, 1);
      assert.equal(currentSkyfallSpawnMs(before), Math.max(620, 1700 - cleared * 20));
      close(after.spawnMs, currentSkyfallSpawnMs(before) - 1);
      const base = Math.max(3600, 9000 - cleared * 58);
      assert.equal(after.words[0].fallMs, after.words[0].kind === "hazard" ? Math.round(base * 0.82) : base);
    }
  });

  it("bounds destroy bursts and ages them at their exact active-time lifetime", () => {
    let state = running();
    for (let n = 0; n < 12; n++) state = type({ ...state, words: [word({ id: n + 1 })] }, "cloud");
    assert.equal(state.destroyed.length, 6);
    assert.equal(state.destroyed[0].seq, 7);
    const surviving = tickSkyfall(state, 419);
    assert.equal(surviving.destroyed.length, 6);
    assert.deepEqual(tickSkyfall(surviving, 1).destroyed, []);
  });
});

describe("Falling Words deterministic spawning and real-time boundaries", () => {
  it("spawns reproducibly, never shares a lane or starting letter, and caps mobile at three", () => {
    for (const laneCount of [1, 3, 6]) {
      for (let seed = 0; seed < 40; seed++) {
        const initial = startSkyfall(definition, { seed: `readable-${seed}`, laneCount });
        let state: SkyfallState = { ...initial, cleared: 30, overdriveMs: 7000 };
        for (let step = 0; step < 50 && state.status === "running"; step++) {
          state = tickSkyfall(state, 250);
          readable(state);
        }
        const once = tickSkyfall({ ...initial, cleared: 30, overdriveMs: 7000 }, state.elapsedMs);
        equivalent(state, once);
        assert.deepEqual(once, tickSkyfall({ ...initial, cleared: 30, overdriveMs: 7000 }, state.elapsedMs));
      }
    }
    const a = tickSkyfall(startSkyfall(definition, { seed: "a" }), 5000);
    const b = tickSkyfall(startSkyfall(definition, { seed: "b" }), 5000);
    assert.notDeepEqual(a.words.map((word) => word.text), b.words.map((word) => word.text));
  });

  it("unlocks hazards at ten clears and longer elite words at fifteen", () => {
    const seen = new Set<WordKind>();
    for (let seed = 0; seed < 300; seed++) {
      for (const cleared of [0, 9, 10, 14, 15]) {
        const initial = startSkyfall(definition, { seed: `kinds-${seed}` });
        const spawned = tickSkyfall({ ...initial, cleared }, 1700).words[0];
        assert.ok(cleared >= 10 || spawned.kind !== "hazard");
        assert.ok(cleared >= 15 || spawned.kind !== "elite");
        if (cleared === 15) seen.add(spawned.kind);
        readable({ ...initial, words: [spawned] });
      }
    }
    assert.deepEqual([...seen].sort(), ["elite", "freeze", "golden", "hazard", "normal"]);
  });

  it("pauses clocks, spawns, movement, effects, buffs and input without losing the prefix", () => {
    const started = type(running({ overdriveMs: 3000, slowdownMs: 2000 }), "cl");
    const paused = pauseSkyfall(started);
    assert.equal(paused.status, "paused");
    assert.equal(pauseSkyfall(paused), paused);
    assert.equal(tickSkyfall(paused, 1e12), paused);
    for (const key of ["o", "x", "Backspace", "Escape", "Tab"]) assert.equal(typeSkyfallKey(paused, key), paused);
    assert.deepEqual(resumeSkyfall(paused), started);
    assert.equal(typeSkyfallKey(started, "Escape").status, "paused");
    assert.equal(typeSkyfallKey(started, "Tab").status, "paused");
    assert.equal(resumeSkyfall(started), started);
  });

  it("integrates frost expiry within a delay at 50% speed rather than capping the delay", () => {
    const initial = running({ words: [word({ progress: 0, fallMs: 1000 })], slowdownMs: 200, overdriveMs: 350 });
    const result = tickSkyfall(initial, 400);
    assert.equal(result.elapsedMs, 400);
    close(result.words[0].progress, 0.3);
    assert.equal(result.slowdownMs, 0);
    assert.equal(result.overdriveMs, 0);
    equivalent(result, tickSkyfall(tickSkyfall(initial, 100), 300));
  });

  it("spawns at actual times and applies Overdrive only while active at spawn", () => {
    const initial = { ...startSkyfall(definition), overdriveMs: 2000 };
    const result = tickSkyfall(initial, 3500);
    assert.equal(result.words.length, 2);
    assert.equal(result.words[0].fallMs, 12600);
    assert.equal(result.words[1].fallMs, 9000);
    close(result.words[0].progress, 1800 / 12600);
    close(result.words[1].progress, 100 / 9000);
    assert.equal(result.elapsedMs, 3500);
    const expiry = tickSkyfall({ ...startSkyfall(definition), overdriveMs: 1700 }, 1700);
    assert.equal(expiry.words[0].fallMs, 9000, "expiration precedes equal-time spawn");
  });

  it("stops the clock at the actual fatal breach and discards a breached target's buffer", () => {
    const initial = type(running({ words: [word({ progress: 0.9, fallMs: 1000 })], lives: 1, slowdownMs: 50, overdriveMs: 500 }), "cl");
    const result = tickSkyfall(initial, 1e12);
    assert.equal(result.status, "over");
    close(result.elapsedMs, 125);
    close(result.lastMissMs!, 125);
    close(result.overdriveMs, 375);
    assert.equal(result.missed, 1);
    assert.equal(result.lives, 0);
    assert.equal(result.typed, "");
    assert.equal(result.lockedId, null);
    assert.equal(result.outputChars, 2);
    assert.equal(result.score, 0);
    assert.equal(tickSkyfall(result, 60000), result);
    assert.equal(typeSkyfallKey(result, "c"), result);
  });

  it("resolves simultaneous breaches before a same-time spawn and stops after fatal damage", () => {
    const initial = running({ lives: 1, spawnMs: 100, words: [
      word({ id: 2, progress: 0.9, fallMs: 1000, lane: 1 }),
      word({ id: 1, progress: 0.9, fallMs: 1000 }),
    ] });
    const result = tickSkyfall(initial, 1000);
    assert.equal(result.status, "over");
    assert.equal(result.nextId, initial.nextId, "no spawn after fatal breach");
    assert.equal(result.missed, 1);
    assert.equal(result.words[0].id, 2, "equal-time fatal breaches resolve by stable ID");
    close(result.elapsedMs, 100);
  });

  it("consumes a very long standard delay until defeat, matching small updates", () => {
    const initial = { ...startSkyfall(definition, { seed: "delay" }), overdriveMs: 4200, slowdownMs: 2200 };
    const once = tickSkyfall(initial, Number.MAX_VALUE);
    let split = initial;
    for (let step = 0; step < 2000 && split.status === "running"; step++) split = tickSkyfall(split, 17);
    assert.equal(once.status, "over");
    assert.equal(once.missed, 3);
    assert.equal(once.lives, 0);
    assert.equal(once.outputChars, 0);
    assert.ok(once.elapsedMs < 30_000);
    equivalent(once, split);
  });

  it("ignores invalid deltas and normalizes unsupported lane counts", () => {
    const state = running();
    for (const delta of [-1, 0, NaN, Infinity, -Infinity]) assert.equal(tickSkyfall(state, delta), state);
    assert.equal(startSkyfall(definition, { laneCount: 3.9 }).laneCount, 3);
    assert.equal(startSkyfall(definition, { laneCount: -5 }).laneCount, 1);
    assert.equal(startSkyfall(definition, { laneCount: 50 }).laneCount, 6);
    assert.equal(startSkyfall(definition, { laneCount: NaN }).laneCount, 6);
    assert.equal(startSkyfall(definition, { laneCount: Infinity }).laneCount, 6);
  });
});

describe("Falling Words explicitly separated Zen practice", () => {
  it("falls and spawns slower and breaches without ending the run or granting output", () => {
    const initial = startSkyfall(definition, { mode: "zen", seed: "practice", laneCount: 3 });
    assert.equal(initial.mode, "zen");
    assert.ok(initial.spawnMs > 1700);
    const first = tickSkyfall(initial, initial.spawnMs);
    assert.ok(first.words[0].fallMs > 9000);
    const result = tickSkyfall(first, 120_000);
    assert.equal(result.status, "running");
    assert.equal(result.lives, 3);
    assert.ok(result.missed > 3);
    assert.equal(result.elapsedMs, initial.spawnMs + 120_000);
    assert.equal(result.outputChars, 0);
    assert.equal(result.correctKeystrokes, 0);
    assert.equal(result.score, 0);
    assert.equal(result.cleared, 0);
    readable(result);
  });

  it("arithmetically seeks idle practice, matching event updates even after buff/phase transients", () => {
    for (const laneCount of [1, 3, 6]) {
      for (const cleared of [0, 70]) {
        let initial = tickSkyfall(startSkyfall(definition, { seed: `seek-${laneCount}`, laneCount, mode: "zen" }), 9000);
        initial = { ...initial, cleared, slowdownMs: 2100, overdriveMs: 3400 };
        if (initial.words[0]) initial = typeSkyfallKey(initial, initial.words[0].text[0]);
        const once = tickSkyfall(initial, 300_000);
        let split = initial;
        for (let step = 0; step < 3000; step++) split = tickSkyfall(split, 100);
        equivalent(once, split);
        readable(once);
        assert.equal(once.outputChars, initial.outputChars);
        assert.equal(once.lives, 3);
      }
    }
  });

  it("handles enormous finite practice delays in bounded work with a valid readable board", { timeout: 1000 }, () => {
    for (const laneCount of [1, 3, 6]) {
      for (const delta of [1e12, Number.MAX_VALUE]) {
        const result = tickSkyfall(startSkyfall(definition, { mode: "zen", laneCount }), delta);
        assert.equal(result.elapsedMs, delta);
        assert.equal(result.status, "running");
        assert.equal(result.lives, 3);
        assert.ok(Number.isFinite(result.missed));
        assert.ok(Number.isFinite(result.lastMissMs));
        assert.ok(result.nextId >= 1 && result.nextId <= 1_000_000_020);
        assert.ok(result.spawnMs > 0 && result.spawnMs <= currentSkyfallSpawnMs(result));
        assert.equal(result.outputChars, 0);
        readable(result);
      }
    }
  });

  it("keeps arithmetic seeks deterministic across ID recycling and cleared prefixes", () => {
    const initial = { ...startSkyfall(definition, { seed: "recycle", mode: "zen" }), nextId: 1_000_000_015 };
    const once = tickSkyfall(initial, 100_000);
    let split = initial;
    for (let step = 0; step < 1000; step++) split = tickSkyfall(split, 100);
    equivalent(once, split);
    readable(once);
    const active = tickSkyfall(startSkyfall(definition, { mode: "zen" }), 8000);
    const cleared = type(active, active.words[0].text);
    equivalent(tickSkyfall(cleared, 200_000), tickSkyfall(tickSkyfall(cleared, 50_000), 150_000));
  });
});
