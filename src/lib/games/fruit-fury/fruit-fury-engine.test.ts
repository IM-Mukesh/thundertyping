import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  acceptsFruitInput, advanceFruitState, createFruitState, fruitMissionProgress,
  fruitRunSummary, fruitVariant, missFruitKey, pickAvailableFruitKey, sliceFruitState, tutorialTarget,
} from "@/lib/games/fruit-fury/fruit-fury-engine";
import { TYPING_MODES, type FruitFuryState, type FruitRunMode, type FruitType } from "@/lib/games/fruit-fury/fruit-fury-types";

const running = (runMode: FruitRunMode = "classic"): FruitFuryState => ({ ...createFruitState("medium", "home", "keyboard", runMode), status: "running" });
const target = (type: FruitType = "apple", letter = "A", visibleAt = 0) => ({ type, letter, visibleAt });

describe("Fruit Fury production state transitions", () => {
  it("accumulates every slice in a batch, including combo, score, level and fever", () => {
    let state = { ...running(), feverGauge: 90, elapsedMs: 1000 };
    state = sliceFruitState(state, target());
    state = sliceFruitState(state, target());
    state = sliceFruitState(state, target());
    assert.equal(state.fruitsCleared, 3);
    assert.equal(state.combo, 3);
    assert.equal(state.maxCombo, 3);
    assert.equal(state.score, 500); // third hit receives combo + newly activated fever
    assert.equal(state.correctTyped, 3);
    assert.equal(state.feverEver, true);
    for (let i = 0; i < 5; i++) state = sliceFruitState(state, target());
    assert.equal(state.fruitsCleared, 8);
    assert.equal(state.level, 2);
    assert.equal(state.maxCombo, 8);
  });

  it("stops the rest of a multi-hit batch immediately when a bomb ends a Classic run", () => {
    const first = sliceFruitState(running(), target());
    const bombed = sliceFruitState(first, target("bomb", "B"));
    assert.equal(bombed.gameOverReason, "bombed");
    assert.equal(bombed.bombsHit, 1);
    assert.equal(bombed.fruitsCleared, 1);
    assert.strictEqual(sliceFruitState(bombed, target("golden")), bombed);
  });

  it("retains golden and fever facts after the powerup expires", () => {
    const golden = sliceFruitState({ ...running(), feverGauge: 75 }, target("golden"));
    assert.equal(golden.goldenSliced, 1);
    assert.equal(golden.score, 900);
    assert.equal(golden.feverEver, true);
    const after = advanceFruitState(golden, 8001);
    assert.equal(after.isFeverActive, false);
    assert.equal(after.feverGauge, 0);
    assert.equal(after.feverEver, true);
    assert.equal(after.goldenSliced, 1);
  });

  it("uses full active duration and rounds only the result; paused time is excluded", () => {
    let state = advanceFruitState(running(), 250.25);
    state = advanceFruitState(state, 749.5);
    assert.equal(state.elapsedMs, 999.75);
    assert.equal(fruitRunSummary(state).survivedMs, 1000);
    const paused = { ...state, status: "paused" as const };
    assert.strictEqual(advanceFruitState(paused, 30_000), paused);
    state = advanceFruitState({ ...paused, status: "running" }, 100.25);
    assert.equal(state.elapsedMs, 1100);
  });

  it("resets combo at its real deadline and ignores bad deltas", () => {
    let state = sliceFruitState(running(), target());
    state = advanceFruitState(state, 1400);
    assert.equal(sliceFruitState(state, target()).combo, 1);
    const frozen = sliceFruitState(running(), target("frozen"));
    assert.equal(advanceFruitState(frozen, -5).frozenTimeRemaining, frozen.frozenTimeRemaining);
    assert.equal(advanceFruitState(frozen, NaN).elapsedMs, 0);
  });

  it("accounts for several drops in one frame and clamps remaining lives", () => {
    const over = advanceFruitState(running(), 100, ["A", "A", "S", "D"], 2);
    assert.equal(over.lives, 0);
    assert.equal(over.gameOverReason, "lives_depleted");
    assert.equal(over.missedFruits, 4);
    assert.deepEqual(over.missedKeys, { A: 2, S: 1, D: 1 });
    assert.equal(over.bombsAvoided, 2);
  });
});

describe("Fruit Fury input and record separation", () => {
  it("allows only the run's chosen input source, including when paused", () => {
    const keyboard = running();
    const touch = { ...keyboard, inputMode: "touch" as const };
    assert.equal(acceptsFruitInput(keyboard, "touch"), false);
    assert.equal(acceptsFruitInput(keyboard, "keyboard"), true);
    assert.equal(acceptsFruitInput(touch, "keyboard"), false);
    assert.equal(acceptsFruitInput(touch, "touch"), true);
    assert.equal(acceptsFruitInput({ ...keyboard, status: "paused" }, "keyboard"), false);
    assert.strictEqual(missFruitKey(touch, "a"), touch);
    assert.strictEqual(missFruitKey(keyboard, "Tab"), keyboard);
  });

  it("exhausts the smallest key pool without assigning duplicate or ambiguous targets", () => {
    const active = new Set<string>();
    const pool = TYPING_MODES.bottom.keys;
    for (let i = 0; i < pool.length; i++) {
      const key = pickAvailableFruitKey(pool, active, () => 0);
      assert.ok(key);
      assert.equal(active.has(key), false);
      active.add(key);
    }
    assert.equal(pickAvailableFruitKey(pool, active), undefined);
    active.delete("Z");
    assert.equal(pickAvailableFruitKey(pool, active), "Z");
  });

  it("separates control/difficulty/pool records and excludes every assisted session", () => {
    assert.equal(fruitVariant("keyboard", "easy", "home"), "keyboard:easy:home");
    assert.equal(fruitVariant("touch", "medium", "home"), "touch:medium:all");
    assert.notEqual(fruitVariant("keyboard", "hard", "home"), fruitVariant("keyboard", "easy", "home"));
    assert.equal(fruitRunSummary(running()).eligible, true);
    for (const mode of ["tutorial", "combo", "clean"] as const) assert.equal(fruitRunSummary(running(mode)).eligible, false);
  });

  it("reports actual errors and reaction feedback without inventing touch accuracy or WPM", () => {
    let state = advanceFruitState(running(), 750);
    state = sliceFruitState(state, target("apple", "A", 250));
    state = missFruitKey(state, "s");
    state = advanceFruitState(state, 100, ["A"]);
    const result = fruitRunSummary(state);
    assert.equal(result.reactionMs, 500);
    assert.equal(result.accuracy, 50);
    assert.deepEqual(state.keyErrors, { S: 1 });
    assert.match(result.recommendation, /Home Row/);
    assert.equal("wpm" in result, false);
    assert.equal(fruitRunSummary({ ...state, inputMode: "touch" }).accuracy, null);
    assert.equal(fruitRunSummary(running()).accuracy, null);
  });
});

describe("Fruit Fury guided lesson and mission outcomes", () => {
  it("teaches safe bomb avoidance and requires all lesson steps to actually complete", () => {
    let state = running("tutorial");
    assert.equal(tutorialTarget(state), "apple");
    state = sliceFruitState(state, target());
    assert.equal(tutorialTarget(state), "bomb");
    state = sliceFruitState(state, target("bomb"));
    assert.equal(state.status, "running");
    assert.equal(state.lives, 3);
    assert.equal(tutorialTarget(state), "bomb");
    state = advanceFruitState(state, 2000, [], 1);
    assert.equal(tutorialTarget(state), "golden");
    state = sliceFruitState(state, target("golden"));
    assert.equal(tutorialTarget(state), "frozen");
    state = sliceFruitState(state, target("frozen"));
    assert.equal(state.status, "running");
    state = sliceFruitState(state, target("watermelon"));
    assert.equal(state.gameOverReason, "completed");
    assert.match(fruitMissionProgress(state), /Lesson complete/);
    assert.equal(fruitRunSummary(state).eligible, false);
  });

  it("finishes Combo eight only at eight, and enforces its deadline", () => {
    let state = running("combo");
    for (let i = 0; i < 7; i++) state = sliceFruitState(advanceFruitState(state, 1000), target());
    assert.equal(state.status, "running");
    assert.equal(sliceFruitState(state, target()).gameOverReason, "completed");
    const timedOut = advanceFruitState(state, 38_000);
    assert.equal(timedOut.gameOverReason, "time_up");
    assert.strictEqual(sliceFruitState(timedOut, target()), timedOut);
  });

  it("Clean dozen fails on a wrong key or dropped fruit, and succeeds on twelve real slices", () => {
    assert.equal(missFruitKey(running("clean"), "X").gameOverReason, "mission_failed");
    assert.equal(advanceFruitState(running("clean"), 100, ["A"]).gameOverReason, "mission_failed");
    let state = running("clean");
    for (let i = 0; i < 11; i++) state = sliceFruitState(state, target());
    assert.equal(state.status, "running");
    const finished = sliceFruitState(state, target());
    assert.equal(finished.gameOverReason, "completed");
    assert.equal(finished.fruitsCleared, 12);
    assert.strictEqual(sliceFruitState(finished, target()), finished);
  });
});
