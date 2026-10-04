/**
 * The four public Ghost Racer levels.
 *
 * Rival speeds are deliberately fixed rather than selected by the player. The
 * bands are intentionally wide enough to describe a useful progression:
 * Easy (20-32 WPM) is approachable for a beginner, Medium (34-50 WPM) is a
 * balanced race, Hard (52-72 WPM) is demanding, and Legend (75-100 WPM) is
 * aimed at elite typists. A run is still scored from the player's actual
 * elapsed time; these values only determine the deterministic AI opponents.
 */
export const GHOST_DIFFICULTIES = ["easy", "medium", "hard", "legend"] as const;
export type GhostDifficulty = (typeof GHOST_DIFFICULTIES)[number];

export interface GhostRivalProfile {
  readonly id: string;
  readonly name: string;
  /** Display color for this rival's lane and result row. */
  readonly color: string;
  /** Fixed target pace used to build the rival's replay. */
  readonly targetWpm: number;
}

export interface GhostDifficultyProfile {
  readonly id: GhostDifficulty;
  readonly label: string;
  readonly description: string;
  /** The four deterministic paces, from the slowest rival to the fastest. */
  readonly targetWpms: readonly [number, number, number, number];
  /** Alias retained for callers that use the singular "rival" vocabulary. */
  readonly rivalWpms: readonly [number, number, number, number];
  /** Explicit alias for UI/config consumers that call these target rival paces. */
  readonly targetRivalWpms: readonly [number, number, number, number];
  readonly rivalNames: readonly [string, string, string, string];
  readonly rivalColors: readonly [string, string, string, string];
  readonly rivals: readonly [GhostRivalProfile, GhostRivalProfile, GhostRivalProfile, GhostRivalProfile];
}

const RIVAL_IDENTITIES = [
  { id: "rival-spark", name: "Spark", color: "#38bdf8" },
  { id: "rival-ember", name: "Ember", color: "#fb7185" },
  { id: "rival-bolt", name: "Bolt", color: "#fbbf24" },
  { id: "rival-zenith", name: "Zenith", color: "#a78bfa" },
] as const;

function profile(
  id: GhostDifficulty,
  label: string,
  description: string,
  targetWpms: readonly [number, number, number, number],
): GhostDifficultyProfile {
  const rivals = RIVAL_IDENTITIES.map((identity, index) => ({
    ...identity,
    targetWpm: targetWpms[index],
  })) as unknown as GhostDifficultyProfile["rivals"];
  const rivalNames = RIVAL_IDENTITIES.map((identity) => identity.name) as unknown as GhostDifficultyProfile["rivalNames"];
  const rivalColors = RIVAL_IDENTITIES.map((identity) => identity.color) as unknown as GhostDifficultyProfile["rivalColors"];
  return { id, label, description, targetWpms, rivalWpms: targetWpms, targetRivalWpms: targetWpms, rivalNames, rivalColors, rivals };
}

/** Stable configuration used by both the course and rival-run generators. */
export const GHOST_DIFFICULTY_PROFILES: Record<GhostDifficulty, GhostDifficultyProfile> = {
  easy: profile(
    "easy",
    "Easy",
    "A forgiving first race for building confidence at the keyboard.",
    [20, 24, 28, 32],
  ),
  medium: profile(
    "medium",
    "Medium",
    "A balanced field that rewards steady, accurate typing.",
    [34, 39, 44, 50],
  ),
  hard: profile(
    "hard",
    "Hard",
    "A demanding pace for typists ready to push their consistency.",
    [52, 59, 66, 72],
  ),
  legend: profile(
    "legend",
    "Legend",
    "An elite field reserved for racers who can sustain exceptional speed.",
    [75, 83, 91, 100],
  ),
};

/** Short alias for consumers that do not need the Ghost-specific prefix. */
export const DIFFICULTY_PROFILES = GHOST_DIFFICULTY_PROFILES;
export const difficultyProfiles = GHOST_DIFFICULTY_PROFILES;

export function isGhostDifficulty(value: unknown): value is GhostDifficulty {
  return typeof value === "string" && (GHOST_DIFFICULTIES as readonly string[]).includes(value);
}

export function getGhostDifficultyProfile(difficulty: GhostDifficulty): GhostDifficultyProfile {
  return GHOST_DIFFICULTY_PROFILES[difficulty];
}
