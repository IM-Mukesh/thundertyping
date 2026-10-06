import type { DestroyEffect, FallingWord, GameState, WordKind } from "@/lib/games/use-falling-words";

export type FallingWordsRenderMode = "webgl" | "canvas" | "static";
export type FallingWordsRenderQuality = "auto" | "low" | "high";
export type ResolvedVisualQuality = Exclude<FallingWordsRenderQuality, "auto">;

/** A full GameState is assignable; none of these fields can be changed by the scene. */
export interface FallingWordsVisualState {
  readonly status: GameState["status"];
  readonly elapsedMs: number;
  readonly words: readonly Readonly<FallingWord>[];
  readonly destroyed: readonly Readonly<DestroyEffect>[];
  readonly lockedId: number | null;
  readonly lastMissMs: number | null;
  readonly overdriveMs: number;
  readonly slowdownMs: number;
  readonly fever: number;
  readonly phase?: number;
  readonly correctKeystrokes?: number;
  readonly typed?: string;
  readonly lives?: number;
}

/** Normalized board coordinates. Use the same layout for the DOM word labels. */
export interface FallingWordsVisualLayout {
  readonly top: number;
  readonly floor: number;
  readonly laneInset: number;
  readonly horizon: number;
}

export const FALLING_WORDS_VISUAL_LAYOUT: FallingWordsVisualLayout = Object.freeze({
  top: 0.12,
  floor: 0.87,
  laneInset: 0.10,
  horizon: 0.66,
});

export const MAX_VISUAL_WORDS = 12;
export const MAX_VISUAL_EFFECTS = 6;
export const MAX_SCENE_SPRITES = 128;
export const MAX_SCENE_VERTICES = 12_000;
export const MAX_SCENE_DRAW_CALLS = 4;
export const SCENE_VERTEX_STRIDE = 11;
/** Matches the engine's effect lifetime without importing any gameplay runtime. */
const EFFECT_MS = 420;
const MISS_MS = 400;

export interface VisualDeviceHints {
  readonly hardwareConcurrency?: number;
  readonly deviceMemory?: number;
  readonly saveData?: boolean;
  readonly coarsePointer?: boolean;
}

export interface VisualBudget {
  readonly quality: ResolvedVisualQuality;
  readonly dprCap: number;
  readonly maxPixels: number;
  readonly fps: number;
  readonly stars: number;
  readonly particlesPerBurst: number;
  readonly geometryVertices: number;
  readonly towers: number;
  readonly idleFps: number;
}

export interface VisualSize {
  readonly width: number;
  readonly height: number;
  readonly pixelWidth: number;
  readonly pixelHeight: number;
  readonly dpr: number;
}

export type SceneColor = readonly [number, number, number];
export const WORD_COLORS: Readonly<Record<WordKind, SceneColor>> = Object.freeze({
  normal: [0.32, 0.88, 0.8],
  elite: [0.76, 0.55, 1],
  golden: [1, 0.78, 0.34],
  freeze: [0.34, 0.84, 1],
  hazard: [1, 0.34, 0.44],
});

export interface SceneWord {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly progress: number;
  readonly color: SceneColor;
  readonly targeted: boolean;
  readonly matched: number;
  readonly kind: WordKind;
}

export interface SceneEffect {
  readonly seq: number;
  readonly x: number;
  readonly y: number;
  readonly age: number;
  readonly color: SceneColor;
}

export interface FallingWordsVisualFrame {
  readonly time: number;
  readonly laneCount: number;
  readonly overdrive: number;
  readonly frost: number;
  readonly fever: number;
  readonly coreEnergy: number;
  readonly phase: number;
  readonly palette: FallingWordsPalette;
  readonly impact: number;
  readonly reducedMotion: boolean;
  readonly layout: FallingWordsVisualLayout;
  readonly words: readonly SceneWord[];
  readonly effects: readonly SceneEffect[];
}

export interface SceneSprite {
  /** Normalized screen coordinates; size is a diameter in CSS pixels. */
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly color: SceneColor;
  readonly alpha: number;
  readonly ring: boolean;
}

export function clampVisual(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

export function resolveVisualQuality(
  quality: FallingWordsRenderQuality,
  hints: VisualDeviceHints = {},
): ResolvedVisualQuality {
  if (quality !== "auto") return quality;
  const limitedCores = (hints.hardwareConcurrency ?? 0) > 0 && (hints.hardwareConcurrency ?? 0) <= 4;
  const limitedMemory = (hints.deviceMemory ?? 0) > 0 && (hints.deviceMemory ?? 0) <= 4;
  return hints.saveData || hints.coarsePointer || limitedCores || limitedMemory ? "low" : "high";
}

export function visualBudget(quality: ResolvedVisualQuality, reducedMotion: boolean): VisualBudget {
  return {
    quality,
    dprCap: quality === "low" ? 1 : 1.75,
    maxPixels: quality === "low" ? 1_000_000 : 2_500_000,
    fps: reducedMotion ? 0 : quality === "low" ? 24 : 45,
    stars: quality === "low" ? 24 : 64,
    particlesPerBurst: reducedMotion ? 0 : quality === "low" ? 3 : 10,
    geometryVertices: quality === "low" ? 6_000 : MAX_SCENE_VERTICES,
    towers: quality === "low" ? 10 : 20,
    idleFps: reducedMotion ? 0 : 8,
  };
}

/** Caps total pixels as well as DPR, including very large or ultrawide parents. */
export function visualSize(width: number, height: number, dpr: number, budget: VisualBudget): VisualSize {
  const w = clampVisual(width, 1, 16_384);
  const h = clampVisual(height, 1, 16_384);
  const scale = Math.min(
    clampVisual(dpr, 0.5, budget.dprCap),
    Math.sqrt(budget.maxPixels / (w * h)),
    4096 / Math.max(w, h),
  );
  return {
    width: w,
    height: h,
    pixelWidth: Math.max(1, Math.floor(w * scale)),
    pixelHeight: Math.max(1, Math.floor(h * scale)),
    dpr: scale,
  };
}

export function normalizeVisualLayout(layout: FallingWordsVisualLayout): FallingWordsVisualLayout {
  const top = clampVisual(layout.top, 0, 0.5);
  const floor = clampVisual(layout.floor, top + 0.1, 1);
  return {
    top,
    floor,
    laneInset: clampVisual(layout.laneInset, 0, 0.4),
    horizon: clampVisual(layout.horizon, top + 0.05, floor - 0.05),
  };
}

/** Also usable by the DOM labels; renderer coordinates never advance a word. */
export function fallingWordScreenPosition(
  lane: number,
  progress: number,
  laneCount: number,
  layout: FallingWordsVisualLayout = FALLING_WORDS_VISUAL_LAYOUT,
): { x: number; y: number } {
  const lanes = Math.floor(clampVisual(laneCount, 1, 24));
  const safe = normalizeVisualLayout(layout);
  return {
    x: safe.laneInset + (clampVisual(lane, 0, lanes - 1) + 0.5) * (1 - 2 * safe.laneInset) / lanes,
    y: safe.top + clampVisual(progress, 0, 1) * (safe.floor - safe.top),
  };
}

/** A bounded, deterministic read-only snapshot; interpolation is cosmetic only. */
export function createFallingWordsVisualFrame(
  state: FallingWordsVisualState,
  laneCount: number,
  reducedMotion: boolean,
  offsetMs = 0,
  layout: FallingWordsVisualLayout = FALLING_WORDS_VISUAL_LAYOUT,
  cosmeticMs = state.elapsedMs + offsetMs,
): FallingWordsVisualFrame {
  const safeLayout = normalizeVisualLayout(layout);
  const lanes = Math.floor(clampVisual(laneCount, 1, 24));
  const elapsed = clampVisual(state.elapsedMs, 0, Number.MAX_SAFE_INTEGER);
  const offset = state.status === "running" && !reducedMotion ? clampVisual(offsetMs, 0, 50) : 0;
  const now = elapsed + offset;
  const ageSinceMiss = state.lastMissMs === null ? MISS_MS : now - state.lastMissMs;
  const phase = Math.floor(clampVisual(state.phase ?? 1, 1, 5));
  const palette = phasePalette(phase, state.overdriveMs > 0, state.slowdownMs > 0);
  const fever = clampVisual(state.fever / 100, 0, 1);
  const typedLength = typeof state.typed === "string" ? Math.min(64, state.typed.length) : 0;
  return {
    // Cosmetic time has its own sampling clock; it never advances engine time.
    time: reducedMotion ? 0 : (clampVisual(cosmeticMs, 0, Number.MAX_SAFE_INTEGER) % 120_000) / 1000,
    laneCount: lanes,
    overdrive: state.overdriveMs > 0 ? 1 : 0,
    frost: state.slowdownMs > 0 ? 1 : 0,
    fever,
    coreEnergy: clampVisual(0.28 + fever * 0.42 + (state.overdriveMs > 0 ? 0.4 : 0) + (phase - 1) * 0.04 + typedLength * 0.008, 0, 1) * (state.lives === undefined ? 1 : .1 + .9 * clampVisual(state.lives / 3, 0, 1)),
    phase,
    palette,
    impact: reducedMotion || ageSinceMiss < 0 ? 0 : 1 - clampVisual(ageSinceMiss / MISS_MS, 0, 1),
    reducedMotion,
    layout: safeLayout,
    words: state.words.slice(0, MAX_VISUAL_WORDS).map((word) => ({
      id: word.id,
      ...fallingWordScreenPosition(word.lane, word.progress, lanes, safeLayout),
      progress: clampVisual(word.progress, 0, 1),
      color: word.progress >= 0.74 ? WORD_COLORS.hazard : WORD_COLORS[word.kind] ?? WORD_COLORS.normal,
      targeted: word.id === state.lockedId,
      matched: word.id === state.lockedId ? clampVisual(typedLength / Math.max(1, word.text.length), 0, 1) : 0,
      kind: word.kind,
    })),
    effects: state.destroyed.slice(-MAX_VISUAL_EFFECTS).filter((effect) => {
      const age = now - effect.bornMs;
      return Number.isFinite(age) && age >= 0 && age < EFFECT_MS;
    }).map((effect) => ({
      seq: effect.seq,
      ...fallingWordScreenPosition(effect.lane, effect.progress, lanes, safeLayout),
      age: clampVisual((now - effect.bornMs) / EFFECT_MS, 0, 1),
      color: WORD_COLORS[effect.kind] ?? WORD_COLORS.normal,
    })),
  };
}

/** Stable pseudorandomness, shared by the WebGL and Canvas effects. */
export function visualRandom(seed: number): number {
  const value = Math.sin((Number.isFinite(seed) ? seed % 1_000_003 : 0) * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

/** No particle history or unbounded event queue: every particle comes from this frame. */
export function createSceneSprites(frame: FallingWordsVisualFrame, size: VisualSize, budget: VisualBudget): SceneSprite[] {
  const sprites: SceneSprite[] = [];
  const add = (sprite: SceneSprite) => {
    if (sprites.length < MAX_SCENE_SPRITES) sprites.push(sprite);
  };
  for (const word of frame.words) {
    const symbol = crystalScreenPosition(word, size);
    add({ x: symbol.x, y: symbol.y, size: symbol.diameter * 1.6, color: word.color, alpha: word.targeted ? 0.25 : 0.13, ring: false });
    if (!frame.reducedMotion && budget.quality === "high") {
      for (let i = 1; i <= 2; i++) {
        add({ x: symbol.x, y: symbol.y - i * 0.016, size: 7 - i * 2, color: word.color, alpha: 0.16 / i, ring: false });
      }
    }
  }
  for (const effect of frame.effects) {
    const y = effect.y - crystalLabelOffset(size.height) / size.height;
    const t = effect.age;
    const alpha = (1 - t) * 0.65;
    add({ x: effect.x, y, size: frame.reducedMotion ? 25 : 18 + t * 48, color: effect.color, alpha, ring: true });
    for (let i = 0; i < budget.particlesPerBurst; i++) {
      const angle = i / budget.particlesPerBurst * Math.PI * 2 + visualRandom(effect.seq + 3) * Math.PI;
      const distance = t * (18 + visualRandom(effect.seq * 13 + i) * 34);
      add({
        x: effect.x + Math.cos(angle) * distance / size.width,
        y: y + (Math.sin(angle) * distance + t * t * 16) / size.height,
        size: 2 + (1 - t) * 3,
        color: effect.color,
        alpha,
        ring: false,
      });
    }
  }
  return sprites;
}

export interface FallingWordsPalette {
  readonly skyTop: SceneColor;
  readonly skyBottom: SceneColor;
  readonly accent: SceneColor;
  readonly secondary: SceneColor;
  readonly ground: SceneColor;
}

const PHASE_ACCENTS: readonly SceneColor[] = [
  [0.23, 0.86, 0.78], [0.35, 0.66, 1], [0.74, 0.43, 1], [1, 0.41, 0.48], [0.98, 0.72, 0.26],
];
const PHASE_SECONDARY: readonly SceneColor[] = [
  [0.36, 0.46, 0.89], [0.26, 0.95, 0.86], [1, 0.56, 0.36], [0.71, 0.42, 1], [0.38, 0.92, 0.71],
];

export function phasePalette(phase: number, overdrive = false, frost = false): FallingWordsPalette {
  const index = Math.floor(clampVisual(phase, 1, 5)) - 1;
  const accent: SceneColor = frost ? [0.34, 0.83, 1] : overdrive ? [1, 0.74, 0.28] : PHASE_ACCENTS[index];
  const secondary = PHASE_SECONDARY[index];
  return {
    skyTop: [0.019 + secondary[0] * 0.016, 0.025, 0.068 + secondary[2] * 0.03],
    skyBottom: [0.045 + accent[0] * 0.035, 0.09 + accent[1] * 0.045, 0.13 + accent[2] * 0.05],
    ground: [0.027 + accent[0] * 0.022, 0.043 + accent[1] * 0.021, 0.056 + accent[2] * 0.024],
    accent,
    secondary,
  };
}

export function crystalLabelOffset(height: number): number {
  return clampVisual(height * 0.052, 20, 35);
}

export function crystalScreenPosition(word: Pick<SceneWord, "x" | "y">, size: VisualSize) {
  return {
    x: word.x,
    y: word.y - crystalLabelOffset(size.height) / size.height,
    diameter: clampVisual(size.height * 0.05, 22, 32),
  };
}

export type ScenePoint = readonly [number, number, number];
export interface FallingWordsCamera {
  readonly eye: ScenePoint;
  readonly focal: number;
  readonly aspect: number;
  readonly horizon: number;
  readonly matrix: Float32Array;
}

/** An off-centre perspective camera with a horizontal view and elevated horizon. */
export function fallingWordsCamera(size: VisualSize, horizon = FALLING_WORDS_VISUAL_LAYOUT.horizon): FallingWordsCamera {
  const focal = 1.15;
  const aspect = size.width / size.height;
  const eye: ScenePoint = [0, 2.4, 10];
  const sx = 2 * focal / aspect;
  const sy = 2 * focal;
  const oy = 1 - 2 * horizon;
  const near = 0.2, far = 100;
  const a = (far + near) / (near - far);
  const b = 2 * far * near / (near - far);
  return {
    focal, aspect, eye, horizon,
    matrix: new Float32Array([sx, 0, 0, 0, 0, sy, 0, 0, 0, -oy, a, -1, 0, -sy * eye[1] + oy * eye[2], b - a * eye[2], eye[2]]),
  };
}

/** Inverse projection anchors real world geometry exactly behind the DOM helper. */
export function screenToFallingWordsWorld(x: number, y: number, depth: number, camera: FallingWordsCamera): ScenePoint {
  const d = clampVisual(depth, 0.3, 90);
  return [
    camera.eye[0] + (x - 0.5) * camera.aspect * d / camera.focal,
    camera.eye[1] + (camera.horizon - y) * d / camera.focal,
    camera.eye[2] - d,
  ];
}

/** CSS pixels; shared by the CPU fallback and projection contract tests. */
export function projectFallingWordsPoint(point: ScenePoint, camera: FallingWordsCamera, size: VisualSize) {
  const depth = camera.eye[2] - point[2];
  if (!Number.isFinite(depth) || depth <= 0.2) return { x: 0, y: 0, depth: 0, visible: false };
  const x = (0.5 + (point[0] - camera.eye[0]) * camera.focal / (camera.aspect * depth)) * size.width;
  const y = (camera.horizon - (point[1] - camera.eye[1]) * camera.focal / depth) * size.height;
  return { x, y, depth, visible: Number.isFinite(x + y) && depth < 100 };
}

/** A monotonic cosmetic clock, rebased to the actual time each state was sampled. */
export class FallingWordsVisualClock {
  private state: FallingWordsVisualState | null = null;
  private sampledAt = 0;
  private lastFrameAt: number | null = null;
  private lastAnimated = false;
  private cosmeticMs = 0;

  suspend(): void {
    this.lastFrameAt = null;
    this.lastAnimated = false;
  }

  frame(state: FallingWordsVisualState, laneCount: number, now: number, reducedMotion: boolean, sampleAt?: number): FallingWordsVisualFrame {
    const timestamp = clampVisual(now, 0, Number.MAX_SAFE_INTEGER);
    if (state !== this.state) {
      this.state = state;
      this.sampledAt = clampVisual(sampleAt ?? timestamp, 0, timestamp);
    }
    const animate = !reducedMotion && (state.status === "running" || state.status === "idle");
    const delta = animate && this.lastAnimated && this.lastFrameAt !== null ? clampVisual(timestamp - this.lastFrameAt, 0, 100) : 0;
    this.cosmeticMs += delta * (state.status === "idle" ? 0.22 : 1);
    this.lastFrameAt = timestamp;
    this.lastAnimated = animate;
    return createFallingWordsVisualFrame(state, laneCount, reducedMotion, timestamp - this.sampledAt, FALLING_WORDS_VISUAL_LAYOUT, this.cosmeticMs);
  }
}
