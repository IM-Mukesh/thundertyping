import { ENGLISH_WORDS } from "@/data/words/english-1k";
import { createRng, dailySeed, hashSeed } from "@/lib/rng/seeded-rng";
import { isGhostDifficulty, type GhostDifficulty } from "@/lib/games/racer/difficulty";

export { GHOST_DIFFICULTIES, GHOST_DIFFICULTY_PROFILES, DIFFICULTY_PROFILES, difficultyProfiles, getGhostDifficultyProfile, isGhostDifficulty } from "@/lib/games/racer/difficulty";
export type { GhostDifficulty, GhostDifficultyProfile, GhostRivalProfile } from "@/lib/games/racer/difficulty";

export const GHOST_WORD_COUNT = 30;
export const GHOST_RULES = "v3:strict-prefix:spaces-count:active-clock:finish-full-text:ties-draw";
/** @deprecated Practice and daily are retained only for old replays and storage. */
export type GhostMode = "practice" | "daily";

export interface GhostCourse {
  /** The selected public difficulty, or null for a legacy practice/daily run. */
  readonly difficulty: GhostDifficulty | null;
  /** Legacy mode field; new callers should use difficulty. */
  readonly mode: GhostMode | GhostDifficulty;
  readonly day: string | null;
  readonly words: string[];
  readonly text: string;
  readonly textKey: string;
}

export interface DifficultyGhostCourse extends GhostCourse {
  readonly difficulty: GhostDifficulty;
  readonly mode: GhostDifficulty;
}

/** @deprecated Shape retained for old practice/daily callers. */
export interface LegacyGhostCourse extends GhostCourse {
  readonly difficulty: null;
  readonly mode: GhostMode;
}

/** Both content and scoring rules belong to replay identity, not just length. */
export function ghostTextKey(seed: string, text: string, rules = GHOST_RULES): string {
  return `ghost:v3:${seed}:r${hashSeed(rules).toString(16)}:t${hashSeed(text).toString(16)}-${hashSeed(`${text.length}:${text}`).toString(16)}`;
}

/** A canonical pool and seeded selection: Math.random never participates. */
export function createGhostCourse(difficulty: GhostDifficulty): DifficultyGhostCourse;
/** @deprecated Use createGhostCourse(difficulty) for new races. */
export function createGhostCourse(mode: GhostMode, day?: string): LegacyGhostCourse;
export function createGhostCourse(selection: GhostDifficulty | GhostMode, day = dailySeed()): GhostCourse {
  const difficulty = isGhostDifficulty(selection) ? selection : null;
  const seed = difficulty ? `difficulty:${difficulty}` : selection === "daily" ? `daily:${day}` : "practice:english";
  const rng = createRng(`${seed}:ghost-racer:v3`);
  const words = Array.from({ length: GHOST_WORD_COUNT }, () => rng.pick(ENGLISH_WORDS));
  const text = words.join(" ");
  return {
    difficulty,
    mode: selection,
    day: !difficulty && selection === "daily" ? day : null,
    words,
    text,
    textKey: ghostTextKey(seed, text),
  };
}
