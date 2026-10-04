import {
  getGhostDifficultyProfile,
  isGhostDifficulty,
  type GhostDifficulty,
  type GhostRivalProfile,
} from "@/lib/games/racer/difficulty";
import type { GhostCourse } from "@/lib/games/racer/course";
import { isValidGhostRun, pacerGhost, type GhostRun } from "@/lib/games/racer/ghost-store";

export interface GhostRival extends GhostRivalProfile {
  readonly difficulty: GhostDifficulty;
  readonly run: GhostRun;
}

function courseDifficulty(course: GhostCourse, requested?: GhostDifficulty): GhostDifficulty {
  const difficulty = requested ?? course.difficulty;
  if (!isGhostDifficulty(difficulty)) {
    throw new Error("Ghost rivals require a public difficulty course");
  }
  if (course.difficulty && course.difficulty !== difficulty) {
    throw new Error("Ghost rival difficulty must match the course difficulty");
  }
  return difficulty;
}

/**
 * Build the four deterministic opponents for a public difficulty course.
 * Pacer ghosts are used as the replay source so every result passes the same
 * validation path as a recorded run and no user-selected WPM is involved.
 */
export function createGhostRivals(course: GhostCourse, requestedDifficulty?: GhostDifficulty): GhostRival[] {
  const difficulty = courseDifficulty(course, requestedDifficulty);
  const profile = getGhostDifficultyProfile(difficulty);
  const totalChars = course.text.length;
  const rivals = profile.rivals.map((rival) => {
    const base = pacerGhost(course.textKey, totalChars, rival.targetWpm);
    const run: GhostRun = {
      ...base,
      id: `pacer-${difficulty}-${rival.id}-${rival.targetWpm}`,
      name: rival.name,
    };
    if (!isValidGhostRun(run)) {
      throw new Error(`Invalid generated Ghost Racer rival: ${rival.id}`);
    }
    return { ...rival, difficulty, run };
  });
  return rivals;
}

/** Return only replay runs when a presentation layer does not need metadata. */
export function createGhostRivalRuns(course: GhostCourse, requestedDifficulty?: GhostDifficulty): GhostRun[] {
  return createGhostRivals(course, requestedDifficulty).map((rival) => rival.run);
}

/** Explicit aliases for callers that call the AI racers opponents. */
export const createGhostOpponents = createGhostRivals;
export const createRivalGhostRuns = createGhostRivalRuns;
export const createRivalOpponents = createGhostRivals;
export const createRivalRuns = createGhostRivalRuns;
