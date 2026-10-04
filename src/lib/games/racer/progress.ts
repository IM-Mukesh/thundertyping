import type { GhostRun } from "@/lib/games/racer/ghost-store";

/**
 * How far down the track a racer actually is.
 *
 * A ghost is replayed as a position in the race text, so the player's position
 * has to be one too. Using the raw keystroke count instead meant holding the
 * spacebar crossed the line: 400 spaces and nothing else won the race and saved
 * itself as the next ghost. The only honest definition is how much of the text
 * has genuinely been reproduced, so a wrong character stops the car until it is
 * corrected.
 */
export function racePositionOf(typed: string, text: string): number {
  let i = 0;
  while (i < typed.length && i < text.length && typed[i] === text[i]) i += 1;
  return i;
}

/**
 * Start index of the word the car is standing on.
 *
 * Anchored to the car's position rather than to the spaces in the buffer: the
 * buffer may hold one uncorrected wrong character, and deriving the word from
 * it would drift the display away from where the car actually is.
 */
export function wordStartAt(text: string, position: number): number {
  return text.lastIndexOf(" ", Math.max(0, position - 1)) + 1;
}

/** Opponent completion never stops the player from finishing their baseline. */
export function raceOutcome(position: number, totalChars: number, elapsedMs: number, ghostMs: number): "racing" | "won" | "lost" | "tie" {
  if (totalChars <= 0 || position < totalChars) return "racing";
  return elapsedMs < ghostMs ? "won" : elapsedMs > ghostMs ? "lost" : "tie";
}

export type MultiRaceOutcome = "racing" | "won" | "lost" | "tie";

type RunLike = Pick<GhostRun, "id" | "name" | "durationMs">;

/** A rival run or a rival object returned by createGhostRivals. */
export type RaceEntrantInput = RunLike | {
  readonly id: string;
  readonly name: string;
  readonly color?: string;
  readonly isPlayer?: boolean;
  readonly run: RunLike;
};

export interface RacePlacement {
  readonly id: string;
  readonly name: string;
  readonly durationMs: number;
  /** Competition placement: equal finish times share this number. */
  readonly placement: number;
  /** Stable display order: ties are ordered by id, then name. */
  readonly rank: number;
  readonly tied: boolean;
  readonly isPlayer: boolean;
  readonly color?: string;
}

export interface MultiRaceResult {
  readonly outcome: MultiRaceOutcome;
  readonly placement: number;
  readonly player: RacePlacement;
  readonly standings: RacePlacement[];
}

function durationOf(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : Number.POSITIVE_INFINITY;
}

function stableCompare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function unwrapEntrant(input: RaceEntrantInput): { run: RunLike; id: string; name: string; color?: string; isPlayer: boolean } {
  if ("run" in input) {
    return { run: input.run, id: input.id, name: input.name, color: input.color, isPlayer: input.isPlayer ?? false };
  }
  return { run: input, id: input.id, name: input.name, isPlayer: false };
}

/**
 * Deterministically ranks a field. `placement` keeps ties honest while
 * `rank` gives the UI a stable order for tied rows.
 */
export function rankRaceParticipants(participants: readonly RaceEntrantInput[]): RacePlacement[] {
  const entries = participants.map((input, index) => {
    const entrant = unwrapEntrant(input);
    return { ...entrant, durationMs: durationOf(entrant.run.durationMs), index };
  });
  const ordered = [...entries].sort((a, b) =>
    a.durationMs - b.durationMs || stableCompare(a.id, b.id) || stableCompare(a.name, b.name) || a.index - b.index,
  );
  return ordered.map((entry, index) => ({
    id: entry.id,
    name: entry.name,
    durationMs: entry.durationMs,
    placement: 1 + entries.filter((other) => other.durationMs < entry.durationMs).length,
    rank: index + 1,
    tied: entries.some((other) => other !== entry && other.durationMs === entry.durationMs),
    isPlayer: entry.isPlayer,
    ...(entry.color ? { color: entry.color } : {}),
  }));
}

/** Competition placement for a finished player against the rival field. */
export function racePlacement(playerDurationMs: number, rivals: readonly RaceEntrantInput[]): number {
  const player = durationOf(playerDurationMs);
  return 1 + rivals.map((rival) => unwrapEntrant(rival).run.durationMs)
    .filter((duration) => durationOf(duration) < player).length;
}

/** Outcome against all four rivals; equal fastest finishes are a tie. */
export function raceOutcomeAgainstRivals(
  position: number,
  totalChars: number,
  elapsedMs: number,
  rivals: readonly RaceEntrantInput[],
): MultiRaceOutcome {
  if (totalChars <= 0 || position < totalChars) return "racing";
  const player = durationOf(elapsedMs);
  const rivalDurations = rivals.map((rival) => durationOf(unwrapEntrant(rival).run.durationMs));
  if (rivalDurations.some((duration) => duration < player)) return "lost";
  if (rivalDurations.some((duration) => duration === player)) return "tie";
  return "won";
}

/** Build standings and outcome in one call for a completed player run. */
export function rankPlayerAgainstRivals(player: RunLike, rivals: readonly RaceEntrantInput[]): MultiRaceResult {
  const standings = rankRaceParticipants([
    { id: player.id, name: player.name, isPlayer: true, run: player },
    ...rivals,
  ]);
  const playerStanding = standings.find((entry) => entry.isPlayer && entry.id === player.id) ?? standings[0];
  const playerDuration = durationOf(player.durationMs);
  const rivalDurations = rivals.map((rival) => durationOf(unwrapEntrant(rival).run.durationMs));
  const outcome: MultiRaceOutcome = rivalDurations.some((duration) => duration < playerDuration)
    ? "lost"
    : rivalDurations.some((duration) => duration === playerDuration) ? "tie" : "won";
  return { outcome, placement: playerStanding.placement, player: playerStanding, standings };
}

export const multiRivalOutcome = raceOutcomeAgainstRivals;
export const rankRacers = rankRaceParticipants;
export const raceResultAgainstRivals = rankPlayerAgainstRivals;
