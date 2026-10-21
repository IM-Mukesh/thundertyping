import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GAME_DEFINITIONS } from "@/lib/games/game-types";
import {
  createInitialState,
  drainRate,
  OVERDRIVE_CHARGE_MAX,
  OVERDRIVE_CHARGE_PER_CLEAR,
  OVERDRIVE_MS,
  reducer,
  scoreForWord,
  TICK_MS,
} from "@/lib/games/use-combo-rush";
import type { ComboRushState } from "@/lib/games/use-combo-rush";

const definition = GAME_DEFINITIONS["combo-rush"];

function running(queue: string[] = ["alpha"]): ComboRushState {
  return { ...createInitialState(definition), status: "running" as const, queue };
}

function clearWord(state: ComboRushState, word = state.queue[0]!) {
  return reducer(state, { type: "SET_TYPED", value: word });
}

describe("Combo Rush Overdrive engine", () => {
  it("starts empty and resets all Overdrive state on restart", () => {
    const initial = createInitialState(definition);
    assert.equal(initial.status, "idle");
    assert.equal(initial.overdriveCharge, 0);
    assert.equal(initial.overdriveMs, 0);
    assert.equal(initial.overdriveActivations, 0);

    const restarted = reducer(
      {
        ...initial,
        status: "over",
        queue: ["stale"],
        score: 900,
        overdriveCharge: 80,
        overdriveMs: 250,
        overdriveActivations: 3,
      },
      { type: "START", words: ["fresh"] },
    );

    assert.equal(restarted.status, "running");
    assert.deepEqual(restarted.queue, ["fresh"]);
    assert.equal(restarted.score, 0);
    assert.equal(restarted.overdriveCharge, 0);
    assert.equal(restarted.overdriveMs, 0);
    assert.equal(restarted.overdriveActivations, 0);
  });

  it("adds a bounded charge for clean clears without changing combo math", () => {
    let state = running(["one", "two", "three", "four", "five", "six"]);

    for (let i = 0; i < 4; i += 1) state = clearWord(state);
    assert.equal(state.combo, 4);
    assert.equal(state.overdriveCharge, OVERDRIVE_CHARGE_PER_CLEAR * 4);
    assert.ok(state.overdriveCharge < OVERDRIVE_CHARGE_MAX);

    state = clearWord(state);
    assert.equal(state.combo, 5);
    assert.equal(state.overdriveCharge, 0, "full charge is consumed immediately");
    assert.equal(state.overdriveMs, OVERDRIVE_MS);
    assert.equal(state.overdriveActivations, 1);
    assert.ok(state.overdriveCharge >= 0 && state.overdriveCharge <= OVERDRIVE_CHARGE_MAX);
  });

  it("does not refill or chain Overdrive during its active window", () => {
    const state = {
      ...running(["alpha"]),
      overdriveMs: OVERDRIVE_MS,
      overdriveActivations: 1,
    };
    const next = clearWord(state);

    assert.equal(next.overdriveCharge, 0);
    assert.equal(next.overdriveMs, OVERDRIVE_MS);
    assert.equal(next.overdriveActivations, 1);
  });

  it("starts charging again only after the active window has fully expired", () => {
    let state = {
      ...running(["alpha", "beta"]),
      overdriveMs: TICK_MS,
      overdriveActivations: 1,
    };

    state = reducer(state, { type: "TICK" });
    assert.equal(state.overdriveMs, 0);
    assert.equal(state.overdriveCharge, 0);

    state = clearWord(state);
    assert.equal(state.overdriveCharge, OVERDRIVE_CHARGE_PER_CLEAR);
    assert.equal(state.overdriveActivations, 1);
  });

  it("reduces clock drain and counts down the active window on ticks", () => {
    const normal = { ...running(), cleared: 20, timeLeftMs: 10_000 };
    const overdrive = { ...normal, overdriveMs: OVERDRIVE_MS };
    const normalTick = reducer(normal, { type: "TICK" });
    const overdriveTick = reducer(overdrive, { type: "TICK" });

    assert.equal(normalTick.timeLeftMs, 10_000 - TICK_MS * drainRate(20));
    assert.equal(
      overdriveTick.timeLeftMs,
      10_000 - TICK_MS * drainRate(20, true),
    );
    assert.ok(overdriveTick.timeLeftMs > normalTick.timeLeftMs);
    assert.equal(overdriveTick.overdriveMs, OVERDRIVE_MS - TICK_MS);
  });

  it("awards the Overdrive score bonus without changing the time award", () => {
    const normal = clearWord(running(["hello"]));
    const overdrive = clearWord({ ...running(["hello"]), overdriveMs: OVERDRIVE_MS });

    assert.equal(normal.score, scoreForWord("hello", 0));
    assert.equal(overdrive.score, scoreForWord("hello", 0, true));
    assert.ok(overdrive.score > normal.score);
    assert.equal(overdrive.timeLeftMs, normal.timeLeftMs);
  });

  it("keeps typo and skip penalties separate from charge and active Overdrive", () => {
    const base = {
      ...running(["alpha", "beta"]),
      combo: 3,
      overdriveCharge: 40,
      overdriveMs: OVERDRIVE_MS,
    };
    const typo = reducer(base, { type: "SET_TYPED", value: "z" });
    assert.equal(typo.combo, 0);
    assert.equal(typo.incorrectKeystrokes, 1);
    assert.equal(typo.overdriveCharge, base.overdriveCharge);
    assert.equal(typo.overdriveMs, base.overdriveMs);
    assert.deepEqual(typo.queue, base.queue);

    const skipped = reducer({ ...base, typed: "al" }, { type: "SKIP" });
    assert.equal(skipped.skipped, 1);
    assert.equal(skipped.combo, 0);
    assert.equal(skipped.timeLeftMs, base.timeLeftMs - 750);
    assert.equal(skipped.overdriveCharge, base.overdriveCharge);
    assert.equal(skipped.overdriveMs, base.overdriveMs);
    assert.deepEqual(skipped.queue, ["beta"]);
  });

  it("freezes the full engine while paused and ends exactly when the clock expires", () => {
    const paused = reducer({ ...running(), overdriveMs: OVERDRIVE_MS }, { type: "PAUSE" });
    assert.deepEqual(reducer(paused, { type: "TICK" }), paused);
    assert.deepEqual(reducer(paused, { type: "SET_TYPED", value: "a" }), paused);

    const expiring = { ...running(), timeLeftMs: 1 };
    const over = reducer(expiring, { type: "TICK" });
    assert.equal(over.status, "over");
    assert.equal(over.timeLeftMs, 0);
    assert.equal(over.elapsedMs, TICK_MS);
    assert.strictEqual(reducer(over, { type: "TICK" }), over);
  });
});
