/** Presentation only: none of these values feed race distance, timing or results. */
export type GhostRacerPhase = "idle" | "countdown" | "racing" | "paused" | "done";

export type RacerSectorId = "city" | "bridge" | "tunnel";

export interface RacerSector {
  readonly id: RacerSectorId;
  readonly index: number;
  readonly name: string;
  readonly start: number;
  readonly sky: string;
  readonly horizon: string;
  readonly accent: string;
  readonly secondary: string;
}

export const RACER_SECTORS: readonly RacerSector[] = [
  { id: "city", index: 0, name: "Neon district", start: 0, sky: "#060b20", horizon: "#482448", accent: "#65e7ff", secondary: "#ed69c7" },
  { id: "bridge", index: 1, name: "Skyline bridge", start: 1 / 3, sky: "#041321", horizon: "#144955", accent: "#6df6dc", secondary: "#a8a0ff" },
  { id: "tunnel", index: 2, name: "Midnight tunnel", start: 2 / 3, sky: "#090c1b", horizon: "#242548", accent: "#9da6ff", secondary: "#70ebff" },
];

export type RacerRivalKind = "rival" | "ghost" | "pacer";

/** The stable identity/style supplied by the race controller for a rival bike. */
export interface RacerRivalPresentation {
  readonly id: string;
  readonly name: string;
  readonly progress: number;
  readonly color: string;
  readonly finished: boolean;
  /** Road lateral position. -1 is the left edge and 1 is the right edge. */
  readonly lane: number;
  readonly kind: RacerRivalKind;
}

/** Short aliases keep the prop contract ergonomic for race controllers. */
export type RacerRival = RacerRivalPresentation;
export type RacerRivalInput = RacerRivalPresentation;

/** Stable style and lane assignment. Pace/progress is deliberately not stored here. */
export interface RacerRivalProfile {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly lane: number;
  readonly kind: RacerRivalKind;
}

export const RACER_RIVAL_PROFILES: readonly RacerRivalProfile[] = [
  { id: "rival-cyan", name: "Vega", color: "#47e7e0", lane: -0.66, kind: "rival" },
  { id: "rival-coral", name: "Kite", color: "#ff738f", lane: 0, kind: "rival" },
  { id: "rival-gold", name: "Sol", color: "#ffd36b", lane: 0.66, kind: "rival" },
  { id: "rival-violet", name: "Nyx", color: "#c39cff", lane: -0.34, kind: "rival" },
];

export interface RacerFrameInput {
  phase: GhostRacerPhase;
  progress: number;
  /** Legacy one-ghost input. It remains optional while callers migrate to rivals. */
  ghostProgress?: number;
  /** Omit for legacy ghost rendering; pass [] to intentionally render no rivals. */
  rivals?: readonly RacerRivalPresentation[] | null;
  elapsedMs: number;
  wpm: number;
  errors: number;
  reducedMotion: boolean;
}

export interface RacerFrameSnapshot {
  phase: GhostRacerPhase;
  progress: number;
  ghostProgress: number;
  rivals: readonly RacerRivalPresentation[];
  elapsedMs: number;
  wpm: number;
  errors: number;
  reducedMotion: boolean;
  sector: RacerSector;
  /** Normalized visual intensity; it is deliberately not a distance. */
  speed: number;
  ghostDelta: number;
  roadOffset: number;
  finished: boolean;
}

/** Visual world units, independent of the replay's character count. */
export const RACER_WORLD_LENGTH = 18_000;
export const RACER_VIEW_DISTANCE = 2_700;
export const RACER_PLAYER_DEPTH = 0.052;
export const RACER_MAX_LANE = 0.86;
export const RACER_WORLD_UNITS_PER_WPM_SECOND = 8;

const LEGACY_GHOST: RacerRivalProfile = {
  id: "ghost",
  name: "Your best ghost",
  color: "#b998ff",
  lane: 0.3,
  kind: "ghost",
};

export function clampRacerNumber(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
}

/**
 * Decorative road motion follows the displayed live pace, while actual race
 * progress remains strict-prefix typing. A stopped typist therefore coasts
 * visually without receiving free characters, distance or score.
 */
export function advanceRacerRoadOffset(current: number, actualProgressOffset: number, liveWpm: number, deltaSeconds: number): number {
  const currentSafe = clampRacerNumber(current, 0, Number.MAX_SAFE_INTEGER);
  const actualSafe = clampRacerNumber(actualProgressOffset, 0, Number.MAX_SAFE_INTEGER);
  const pace = clampRacerNumber(liveWpm, 0, Number.MAX_SAFE_INTEGER);
  const dt = clampRacerNumber(deltaSeconds, 0, 1);
  return Math.max(actualSafe, currentSafe + pace * RACER_WORLD_UNITS_PER_WPM_SECOND * dt);
}

export function racerSectorForProgress(progress: number): RacerSector {
  const safe = clampRacerNumber(progress, 0, 1);
  return RACER_SECTORS[safe >= 2 / 3 ? 2 : safe >= 1 / 3 ? 1 : 0];
}

function fallbackProfile(index: number): RacerRivalProfile {
  return RACER_RIVAL_PROFILES[index % RACER_RIVAL_PROFILES.length] ?? LEGACY_GHOST;
}

/**
 * Converts controller data into finite canvas data. This is intentionally pure so a
 * race can build it in its render path without coupling presentation to race state.
 */
export function normalizeRacerRivals(
  rivals: readonly RacerRivalPresentation[] | null | undefined,
  legacyGhostProgress = 0,
): readonly RacerRivalPresentation[] {
  if (rivals === undefined) {
    return [{ ...LEGACY_GHOST, progress: clampRacerNumber(legacyGhostProgress, 0, 1), finished: false }];
  }
  if (!Array.isArray(rivals)) return [];

  return rivals.reduce<RacerRivalPresentation[]>((normalized, candidate, index) => {
    if (!candidate || typeof candidate !== "object") return normalized;
    const raw = candidate as Partial<RacerRivalPresentation>;
    const fallback = fallbackProfile(index);
    const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : `${fallback.id}-${index}`;
    const name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : fallback.name;
    const color = typeof raw.color === "string" && raw.color.trim() ? raw.color : fallback.color;
    const kind = raw.kind === "ghost" || raw.kind === "pacer" || raw.kind === "rival" ? raw.kind : fallback.kind;
    const finished = Boolean(raw.finished);
    normalized.push({
      id,
      name,
      color,
      progress: finished ? 1 : clampRacerNumber(raw.progress ?? 0, 0, 1),
      finished,
      lane: clampRacerNumber(raw.lane ?? fallback.lane, -RACER_MAX_LANE, RACER_MAX_LANE),
      kind,
    });
    return normalized;
  }, []);
}

/** A finite, immutable-by-convention input to a frame, also useful outside canvas. */
export function createRacerFrameSnapshot(input: RacerFrameInput): RacerFrameSnapshot {
  const progress = clampRacerNumber(input.progress, 0, 1);
  const ghostProgress = clampRacerNumber(input.ghostProgress ?? 0, 0, 1);
  const elapsedMs = clampRacerNumber(input.elapsedMs, 0, Number.MAX_SAFE_INTEGER);
  const wpm = clampRacerNumber(input.wpm, 0, Number.MAX_SAFE_INTEGER);
  const rivals = normalizeRacerRivals(input.rivals, ghostProgress);
  return {
    phase: input.phase,
    progress,
    ghostProgress,
    rivals,
    elapsedMs,
    wpm,
    errors: Math.floor(clampRacerNumber(input.errors, 0, Number.MAX_SAFE_INTEGER)),
    reducedMotion: Boolean(input.reducedMotion),
    sector: racerSectorForProgress(progress),
    speed: clampRacerNumber(wpm / 110, 0, 1),
    ghostDelta: ghostProgress - progress,
    roadOffset: progress * RACER_WORLD_LENGTH,
    finished: progress >= 1 || input.phase === "done",
  };
}

export interface RoadProjection {
  x: number;
  y: number;
  halfWidth: number;
  scale: number;
  depth: number;
  horizonY: number;
  bend: number;
}

/**
 * Camera-space depth: 0 is below the camera, 1 is the vanishing point.
 * Lateral -1/+1 are the road edges. The bend is fixed to course progress;
 * advancing a cosmetic animation clock can never advance the road.
 */
export function projectRacerRoad(
  progress: number,
  depth: number,
  width: number,
  height: number,
  lateral = 0,
): RoadProjection {
  const p = clampRacerNumber(progress, 0, 1);
  const z = clampRacerNumber(depth, 0, 1);
  const w = clampRacerNumber(width, 0, 100_000);
  const h = clampRacerNumber(height, 0, 100_000);
  const lane = clampRacerNumber(lateral, -10, 10);
  const scale = (1 - z) / (1 + z * 12);
  const bend = Math.sin(p * Math.PI * 2.6 - 0.3) * 0.58 + Math.sin(p * Math.PI * 5) * 0.2;
  const horizonY = h * (0.36 + Math.sin(p * Math.PI * 3) * 0.012);
  const halfWidth = w * 0.82 * scale;
  const center = w * 0.5 + bend * w * 0.24 * (1 - scale) ** 2;
  return {
    x: center + lane * halfWidth,
    y: horizonY + (h * 1.13 - horizonY) * scale,
    halfWidth,
    scale,
    depth: z,
    horizonY,
    bend,
  };
}

export interface RacerRivalProjection extends RoadProjection {
  id: string;
  name: string;
  color: string;
  kind: RacerRivalKind;
  lane: number;
  finished: boolean;
  visible: boolean;
  relativeScale: number;
  delta: number;
}

/** Project one rival from its actual progress and assigned road lane. */
export function projectRacerRival(
  progress: number,
  rival: RacerRivalPresentation,
  width: number,
  height: number,
): RacerRivalProjection {
  const player = clampRacerNumber(progress, 0, 1);
  const normalized = normalizeRacerRivals([rival])[0] ?? { ...fallbackProfile(0), progress: 0, finished: false };
  const delta = normalized.progress - player;
  const depth = RACER_PLAYER_DEPTH + (delta * RACER_WORLD_LENGTH) / RACER_VIEW_DISTANCE;
  const projected = projectRacerRoad(player, depth, width, height, normalized.lane);
  const playerScale = projectRacerRoad(player, RACER_PLAYER_DEPTH, width, height).scale;
  return {
    ...projected,
    depth,
    id: normalized.id,
    name: normalized.name,
    color: normalized.color,
    kind: normalized.kind,
    lane: normalized.lane,
    finished: normalized.finished,
    visible: depth >= 0 && depth < 1 && Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0,
    relativeScale: playerScale > 0 ? projected.scale / playerScale : 0,
    delta,
  };
}

/** Sorts far-to-near for painter's order; id/index tie breaks keep overtakes stable. */
export function sortRacerRivalProjections(
  projections: readonly RacerRivalProjection[],
): RacerRivalProjection[] {
  return projections.map((projection, index) => ({ projection, index })).sort((a, b) =>
    b.projection.depth - a.projection.depth || a.projection.id.localeCompare(b.projection.id) || a.index - b.index,
  ).map(({ projection }) => projection);
}

export const sortRacerRivalsByDepth = sortRacerRivalProjections;

/** Project and depth-sort all rivals in one pure operation for a scene frame. */
export function projectRacerRivals(
  progress: number,
  rivals: readonly RacerRivalPresentation[] | null | undefined,
  width: number,
  height: number,
): RacerRivalProjection[] {
  const normalized = normalizeRacerRivals(rivals);
  return sortRacerRivalProjections(normalized.map((rival) => projectRacerRival(progress, rival, width, height)));
}

/** Backwards-compatible one-ghost projection for callers outside the scene. */
export type RacerGhostProjection = RacerRivalProjection;

export function projectRacerGhost(
  progress: number,
  ghostProgress: number,
  width: number,
  height: number,
): RacerGhostProjection {
  const ghost = normalizeRacerRivals(undefined, ghostProgress)[0];
  return projectRacerRival(progress, ghost, width, height);
}
