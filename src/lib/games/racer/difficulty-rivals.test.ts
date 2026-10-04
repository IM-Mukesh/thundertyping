import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createGhostCourse } from "@/lib/games/racer/course";
import {
  GHOST_DIFFICULTIES,
  GHOST_DIFFICULTY_PROFILES,
  type GhostDifficulty,
} from "@/lib/games/racer/difficulty";
import { createGhostRivalRuns, createGhostRivals } from "@/lib/games/racer/rivals";
import {
  raceOutcomeAgainstRivals,
  racePlacement,
  rankPlayerAgainstRivals,
  rankRaceParticipants,
} from "@/lib/games/racer/progress";
import { isValidGhostRun } from "@/lib/games/racer/ghost-store";

describe("Ghost Racer difficulty courses and rivals", () => {
  it("keeps one stable, distinct course identity per difficulty", () => {
    const first = GHOST_DIFFICULTIES.map((difficulty) => createGhostCourse(difficulty));
    const second = GHOST_DIFFICULTIES.map((difficulty) => createGhostCourse(difficulty));
    assert.deepEqual(first, second);
    assert.equal(new Set(first.map((course) => course.textKey)).size, GHOST_DIFFICULTIES.length);
    assert.ok(first.every((course) => course.difficulty && course.mode === course.difficulty));
  });

  it("creates four validated rivals at each fixed profile pace", () => {
    for (const difficulty of GHOST_DIFFICULTIES) {
      const course = createGhostCourse(difficulty);
      const rivals = createGhostRivals(course);
      const profile = GHOST_DIFFICULTY_PROFILES[difficulty];
      assert.equal(rivals.length, 4);
      assert.deepEqual(rivals.map((rival) => rival.targetWpm), profile.targetWpms);
      assert.equal(new Set(rivals.map((rival) => rival.name)).size, 4);
      assert.equal(new Set(rivals.map((rival) => rival.color)).size, 4);
      assert.ok(rivals.every((rival) => isValidGhostRun(rival.run)));
      assert.deepEqual(createGhostRivalRuns(course), rivals.map((rival) => rival.run));
    }
  });

  it("orders a player against rivals and gives equal times the same placement", () => {
    const course = createGhostCourse("medium");
    const rivals = createGhostRivals(course);
    const player = { id: "player", name: "You", durationMs: rivals[3].run.durationMs };
    const result = rankPlayerAgainstRivals(player, rivals);
    assert.equal(result.outcome, "tie");
    assert.equal(result.placement, 1);
    assert.equal(result.player.placement, 1);
    assert.equal(result.player.tied, true);
    assert.equal(result.standings.length, 5);
    assert.deepEqual(
      rankRaceParticipants(result.standings).map((entry) => entry.id),
      result.standings.map((entry) => entry.id),
    );
    assert.equal(racePlacement(player.durationMs, rivals), 1);
  });

  it("reports incomplete, won, lost and tied multi-rival outcomes", () => {
    const course = createGhostCourse("easy");
    const rivals = createGhostRivals(course);
    const fastest = rivals[3].run.durationMs;
    assert.equal(raceOutcomeAgainstRivals(course.text.length - 1, course.text.length, fastest, rivals), "racing");
    assert.equal(raceOutcomeAgainstRivals(course.text.length, course.text.length, fastest + 1, rivals), "lost");
    assert.equal(raceOutcomeAgainstRivals(course.text.length, course.text.length, fastest, rivals), "tie");
    assert.equal(raceOutcomeAgainstRivals(course.text.length, course.text.length, fastest - 1, rivals), "won");
  });
});

// Keep this value checked by TypeScript when profile additions are made.
const _difficultyTypeCheck: GhostDifficulty = "legend";
void _difficultyTypeCheck;
