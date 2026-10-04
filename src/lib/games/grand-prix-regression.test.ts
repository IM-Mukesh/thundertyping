import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GAME_DEFINITIONS } from "@/lib/games/game-types";
import { createInitialState, raceAccuracy, raceStandings, reducer, scoredChars, TICK_MS, type GrandPrixState } from "@/lib/games/use-typing-grand-prix";

function race(words = ["hello", "world"]): GrandPrixState {
  return { ...createInitialState(GAME_DEFINITIONS["typing-grand-prix"]), status: "running", leadInMs: 0,
    elapsedMs: 10_000, words, totalChars: words.join("").length };
}

function commit(state: GrandPrixState, value: string) {
  return reducer(reducer(state, { type: "SET_TYPED", value }), { type: "COMMIT_WORD" });
}

describe("Grand Prix finish and scored distance", () => {
  it("declares DNF without a finish bonus even when partial distance leads every rival", () => {
    let state = race();
    state = commit(state, "hello");
    const earned = state.score;
    state = commit(state, "w");
    assert.equal(state.status, "over");
    assert.equal(state.dnf, true);
    assert.equal(state.playerProgress, 0.6);
    assert.equal(state.place, 4);
    assert.equal(state.score, earned);
    assert.equal(raceStandings(state).at(-1)?.isPlayer, true);
  });

  it("cannot farm WPM, accuracy, or finish points by deleting/retyping a correct prefix", () => {
    let honest = commit(race(), "hello");
    honest = commit(honest, "world");
    let repeated = race();
    for (let i = 0; i < 50; i++) {
      repeated = reducer(repeated, { type: "SET_TYPED", value: "hell" });
      assert.equal(scoredChars(repeated), 4);
      repeated = reducer(repeated, { type: "SET_TYPED", value: "" });
    }
    repeated = commit(commit(repeated, "hello"), "world");
    assert.equal(scoredChars(repeated), scoredChars(honest));
    assert.equal(raceAccuracy(repeated), raceAccuracy(honest));
    assert.equal(repeated.score, honest.score);
    assert.equal(repeated.dnf, false);
  });

  it("does not dilute an error's accuracy penalty with repeated correct attempts", () => {
    let state = reducer(race(), { type: "SET_TYPED", value: "x" });
    state = reducer(state, { type: "SET_TYPED", value: "" });
    for (let i = 0; i < 20; i++) {
      state = reducer(state, { type: "SET_TYPED", value: "hell" });
      state = reducer(state, { type: "SET_TYPED", value: "" });
    }
    state = commit(commit(state, "hello"), "world");
    assert.equal(raceAccuracy(state), 10 / 11 * 100);
  });

  it("counts a same-length wrong replacement and only scores actual matching distance", () => {
    let state = reducer(race(), { type: "SET_TYPED", value: "hell" });
    state = reducer(state, { type: "SET_TYPED", value: "hexl" });
    assert.equal(state.incorrectKeystrokes, 1);
    assert.equal(scoredChars(state), 3);
  });

  it("orders finish times and exact ties identically in standings and result place", () => {
    let state = race(["hello"]);
    state.opponents = state.opponents.map((opponent, index) => ({ ...opponent, progress: 1, finishedAtMs: index === 2 ? 9000 : 10_000 }));
    state = commit(state, "hello");
    assert.equal(state.place, 4);
    assert.deepEqual(raceStandings(state).map((racer) => racer.id), [2, 0, 1, -1]);
    assert.equal(state.dnf, false);
  });

  it("interpolates a rival's crossing inside a tick instead of stamping every rival at tick end", (context) => {
    const state = race(["hello"]);
    context.mock.method(Math, "random", () => 0.5);
    state.opponents = [{ id: 0, progress: 0.99, speedFactor: 1, targetWpm: 60, finishedAtMs: null }];
    const next = reducer(state, { type: "TICK" });
    assert.equal(next.opponents[0].finishedAtMs, 10_010);
    assert.equal(next.elapsedMs, 10_000 + TICK_MS);
  });

  it("freezes timer, rivals, boost and typing during manual/visibility pause", () => {
    const paused = reducer({ ...race(), boostMs: 4000 }, { type: "PAUSE" });
    assert.equal(reducer(paused, { type: "TICK" }), paused);
    assert.equal(reducer(paused, { type: "SET_TYPED", value: "hello" }), paused);
    assert.equal(reducer(paused, { type: "COMMIT_WORD" }), paused);
    assert.equal(reducer(paused, { type: "RESUME" }).elapsedMs, 10_000);
  });

  it("uses real integer delta time across delayed ticks and the end of the lead-in", () => {
    const state = { ...race(), leadInMs: 100, elapsedMs: 0, boostMs: 4000 };
    const next = reducer(state, { type: "TICK", deltaMs: 537 });
    assert.equal(next.leadInMs, 0);
    assert.equal(next.elapsedMs, 437);
    assert.equal(next.boostMs, 3563);
    const paused = reducer(next, { type: "PAUSE" });
    assert.equal(reducer(paused, { type: "TICK", deltaMs: 10_000 }), paused);
    assert.equal(reducer(reducer(paused, { type: "RESUME" }), { type: "TICK", deltaMs: 13 }).elapsedMs, 450);
  });
});
