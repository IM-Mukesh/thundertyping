import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  RACER_RIVAL_PROFILES,
  advanceRacerRoadOffset,
  createRacerFrameSnapshot,
  normalizeRacerRivals,
  projectRacerRivals,
  projectRacerRoad,
  sortRacerRivalProjections,
  type RacerRivalPresentation,
} from "@/lib/games/racer/presentation";

function rivals(progresses: readonly number[]): RacerRivalPresentation[] {
  return progresses.map((progress, index) => ({
    ...RACER_RIVAL_PROFILES[index],
    progress,
    finished: false,
  }));
}

describe("Ghost Racer presentation rivals", () => {
  it("keeps the road coasting at live pace without changing typed progress", () => {
    assert.equal(advanceRacerRoadOffset(100, 100, 0, 1), 100);
    assert.equal(advanceRacerRoadOffset(100, 100, 8, 1), 164);
    assert.equal(advanceRacerRoadOffset(100, 260, 8, 1), 260);
    assert.equal(advanceRacerRoadOffset(100, 100, 80, 0), 100);
  });
  it("normalizes four stable identities, colors and lanes without coupling to race state", () => {
    const input = rivals([0.12, 0.21, 0.08, 0.34]);
    const normalized = normalizeRacerRivals(input);
    assert.equal(normalized.length, 4);
    assert.deepEqual(normalized.map((rival) => rival.id), RACER_RIVAL_PROFILES.map((profile) => profile.id));
    assert.deepEqual(normalized.map((rival) => rival.name), ["Vega", "Kite", "Sol", "Nyx"]);
    assert.deepEqual(normalized.map((rival) => rival.lane), [-0.66, 0, 0.66, -0.34]);
    assert.deepEqual(normalized.map((rival) => rival.color), ["#47e7e0", "#ff738f", "#ffd36b", "#c39cff"]);
  });

  it("uses actual progress for depth and sorts far-to-near stably through overtakes", () => {
    const frameRivals = rivals([0.8, 0.42, 0.61, 0.42]);
    const projected = projectRacerRivals(0.5, frameRivals, 900, 400);
    assert.deepEqual(projected.map((rival) => rival.id), ["rival-cyan", "rival-gold", "rival-coral", "rival-violet"]);
    assert.ok(projected[0].depth > projected[1].depth);
    assert.equal(projected[2].depth, projected[3].depth);
    assert.equal(projected[2].lane, 0);
    assert.equal(projected[3].lane, -0.34);

    const reversed = projectRacerRivals(0.7, rivals([0.55, 0.42, 0.91, 0.42]), 900, 400);
    assert.ok(reversed.findIndex((rival) => rival.id === "rival-gold") < reversed.findIndex((rival) => rival.id === "rival-cyan"));
  });

  it("clamps hostile or missing numeric inputs and keeps empty lists empty", () => {
    const [safe] = normalizeRacerRivals([{
      id: "bad",
      name: "Bad",
      progress: Number.NaN,
      color: "#fff",
      finished: false,
      lane: Number.POSITIVE_INFINITY,
      kind: "rival",
    }]);
    assert.equal(safe.progress, 0);
    assert.equal(safe.lane, -0.86);
    assert.deepEqual(normalizeRacerRivals([]), []);
    assert.equal(projectRacerRoad(Number.NaN, Number.POSITIVE_INFINITY, Number.NaN, Number.NaN).x, 0);
    const snapshot = createRacerFrameSnapshot({
      phase: "racing",
      progress: Number.POSITIVE_INFINITY,
      ghostProgress: Number.NaN,
      rivals: [],
      elapsedMs: Number.NaN,
      wpm: Number.POSITIVE_INFINITY,
      errors: Number.NaN,
      reducedMotion: false,
    });
    assert.equal(snapshot.progress, 0);
    assert.equal(snapshot.ghostProgress, 0);
    assert.equal(snapshot.elapsedMs, 0);
    assert.equal(snapshot.wpm, 0);
    assert.equal(snapshot.errors, 0);
    assert.deepEqual(snapshot.rivals, []);
  });

  it("keeps finish and reduced-motion state explicit while projection remains finite", () => {
    const finished = createRacerFrameSnapshot({
      phase: "done",
      progress: 1,
      ghostProgress: 0.9,
      rivals: [{ ...RACER_RIVAL_PROFILES[0], progress: 0.92, finished: true }],
      elapsedMs: 1000,
      wpm: 80,
      errors: 1,
      reducedMotion: true,
    });
    assert.equal(finished.finished, true);
    assert.equal(finished.reducedMotion, true);
    assert.equal(finished.rivals[0].finished, true);
    assert.equal(finished.rivals[0].progress, 1);
    const projected = projectRacerRivals(finished.progress, finished.rivals, 800, 420);
    assert.equal(projected.length, 1);
    assert.equal(projected[0].visible, true);
    assert.ok(Number.isFinite(projected[0].x) && Number.isFinite(projected[0].y));
  });

  it("sorts equal-depth projections with deterministic id and input tie breaks", () => {
    const frameRivals = rivals([0.2, 0.2, 0.2, 0.2]);
    const projections = projectRacerRivals(0.1, frameRivals, 640, 320);
    const sorted = sortRacerRivalProjections([...projections].reverse());
    assert.deepEqual(sorted.map((rival) => rival.id), ["rival-coral", "rival-cyan", "rival-gold", "rival-violet"]);
  });
});
