import {
  clampTypeBeforeDeath,
  type TypeBeforeDeathBossView,
  type TypeBeforeDeathEffectView,
  type TypeBeforeDeathEnemyView,
  type TypeBeforeDeathProjection,
  type TypeBeforeDeathRenderMode,
  type TypeBeforeDeathRenderQuality,
  type TypeBeforeDeathSceneView,
} from "@/lib/games/type-before-death/scene-contract";

export {
  clampTypeBeforeDeath,
  type TypeBeforeDeathBossView,
  type TypeBeforeDeathEffectView,
  type TypeBeforeDeathEnemyView,
  type TypeBeforeDeathProjection,
  type TypeBeforeDeathRenderMode,
  type TypeBeforeDeathRenderQuality,
  type TypeBeforeDeathSceneState,
  type TypeBeforeDeathSceneView,
} from "@/lib/games/type-before-death/scene-contract";

export interface TypeBeforeDeathRendererOptions {
  readonly quality: TypeBeforeDeathRenderQuality;
  readonly reducedMotion: boolean;
  /** The scene boundary may use this to expose the active renderer to HUD. */
  readonly onMode?: (mode: TypeBeforeDeathRenderMode) => void;
}

export interface TypeBeforeDeathSceneRenderer {
  readonly mode: TypeBeforeDeathRenderMode;
  resize(width: number, height: number, dpr: number): void;
  /** Rendering is read-only with respect to the supplied view model. */
  render(view: TypeBeforeDeathSceneView, now: number): void;
  projectEnemy(enemy: TypeBeforeDeathEnemyView): TypeBeforeDeathProjection;
  projectBoss(boss: TypeBeforeDeathBossView): TypeBeforeDeathProjection;
  dispose(): void;
}

type Vec3 = readonly [number, number, number];
type Color = readonly [number, number, number];
type Mat4 = Float32Array;
type Context2D = CanvasRenderingContext2D;

const TAU = Math.PI * 2;
const STRIDE = 11;
const MAX_VERTICES = 54_000;
const MAX_DYNAMIC_PARTICLES = 84;
const ROAD_FAR = -72;
const ROAD_NEAR = 8;
const PLAYER_Z = 5.15;
const EMPTY_PROJECTION: TypeBeforeDeathProjection = { x: 0, y: 0, depth: 0, scale: 0, visible: false };
const BOX_FACES = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 4, 7, 3], [1, 2, 6, 5], [3, 7, 6, 2], [0, 1, 5, 4]] as const;

const NIGHT_SKY: Color = [0.025, 0.045, 0.095];
const NIGHT_FOG: Color = [0.095, 0.14, 0.19];
const ROAD_COLOR: Color = [0.075, 0.092, 0.11];
const SIDEWALK_COLOR: Color = [0.13, 0.15, 0.16];
const BUILDING_COLOR: Color = [0.095, 0.115, 0.14];
const WINDOW_COLOR: Color = [0.96, 0.61, 0.28];
const SAFEHOUSE_COLOR: Color = [0.18, 0.27, 0.3];
const SAFEHOUSE_GLOW: Color = [0.28, 0.9, 0.78];
const EMBER_COLOR: Color = [1, 0.36, 0.12];
const RAIN_COLOR: Color = [0.32, 0.56, 0.7];
const MUZZLE_FLASH: Color = [1, 0.72, 0.28];
const IMPACT_FLASH: Color = [1, 0.42, 0.2];
const BLOOD_RED: Color = [0.76, 0.08, 0.055];
const BLOOD_DARK: Color = [0.38, 0.025, 0.02];
const BLOOD_HIGHLIGHT: Color = [1, 0.24, 0.12];

function finite(value: number | undefined, fallback = 0): number {
  return Number.isFinite(value) ? value as number : fallback;
}

function noise(seed: number): number {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function color(hex: string): Color {
  const raw = hex.replace("#", "");
  const expanded = raw.length === 3 ? raw.split("").map((part) => part + part).join("") : raw;
  if (!/^[0-9a-f]{6}$/i.test(expanded)) return [0.2, 0.24, 0.28];
  return [parseInt(expanded.slice(0, 2), 16) / 255, parseInt(expanded.slice(2, 4), 16) / 255, parseInt(expanded.slice(4, 6), 16) / 255];
}

function mix(a: Color, b: Color, amount: number): Color {
  const t = clampTypeBeforeDeath(amount, 0, 1);
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function css(c: Color): string {
  return `rgb(${c.map((value) => Math.round(clampTypeBeforeDeath(value, 0, 1) * 255)).join(", ")})`;
}

function identity(): Mat4 {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Float32Array(16);
  for (let column = 0; column < 4; column++) for (let row = 0; row < 4; row++) {
    out[column * 4 + row] = a[row] * b[column * 4] + a[4 + row] * b[column * 4 + 1] + a[8 + row] * b[column * 4 + 2] + a[12 + row] * b[column * 4 + 3];
  }
  return out;
}

function transform(parent: Mat4, position: Vec3, rx = 0, ry = 0, rz = 0, scale = 1): Mat4 {
  const sx = Math.sin(rx), cx = Math.cos(rx), sy = Math.sin(ry), cy = Math.cos(ry), sz = Math.sin(rz), cz = Math.cos(rz);
  const local = new Float32Array([
    cy * cz * scale, (cx * sz + sx * sy * cz) * scale, (sx * sz - cx * sy * cz) * scale, 0,
    -cy * sz * scale, (cx * cz - sx * sy * sz) * scale, (sx * cz + cx * sy * sz) * scale, 0,
    sy * scale, -sx * cy * scale, cx * cy * scale, 0,
    position[0], position[1], position[2], 1,
  ]);
  return multiply(parent, local);
}

function point(matrix: Mat4, value: Vec3): Vec3 {
  return [matrix[0] * value[0] + matrix[4] * value[1] + matrix[8] * value[2] + matrix[12], matrix[1] * value[0] + matrix[5] * value[1] + matrix[9] * value[2] + matrix[13], matrix[2] * value[0] + matrix[6] * value[1] + matrix[10] * value[2] + matrix[14]];
}

function normalize(value: Vec3): Vec3 {
  const length = Math.hypot(value[0], value[1], value[2]) || 1;
  return [value[0] / length, value[1] / length, value[2] / length];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function viewMatrix(eye: Vec3, target: Vec3): Mat4 {
  const z = normalize([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]);
  const x = normalize(cross([0, 1, 0], z));
  const y = cross(z, x);
  return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1]);
}

function perspective(aspect: number, zoom = 0): Mat4 {
  const f = 1 / Math.tan((52 - clampTypeBeforeDeath(zoom, -8, 8)) * Math.PI / 360);
  const near = 0.3, far = 110;
  return new Float32Array([f / Math.max(0.1, aspect), 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0]);
}

function projectPoint(value: Vec3, matrix: ArrayLike<number>, width: number, height: number): TypeBeforeDeathProjection {
  const w = matrix[3] * value[0] + matrix[7] * value[1] + matrix[11] * value[2] + matrix[15];
  if (!Number.isFinite(w) || w <= 0.28 || width <= 0 || height <= 0) return EMPTY_PROJECTION;
  const nx = (matrix[0] * value[0] + matrix[4] * value[1] + matrix[8] * value[2] + matrix[12]) / w;
  const ny = (matrix[1] * value[0] + matrix[5] * value[1] + matrix[9] * value[2] + matrix[13]) / w;
  const nz = (matrix[2] * value[0] + matrix[6] * value[1] + matrix[10] * value[2] + matrix[14]) / w;
  const scale = height / (2 * Math.tan(52 * Math.PI / 360) * w);
  return {
    x: (nx + 1) * width / 2,
    y: (1 - ny) * height / 2,
    depth: w,
    scale,
    visible: Number.isFinite(nx + ny + nz) && Math.abs(nx) < 1.2 && ny > -1.18 && ny < 1.18 && nz >= -1 && nz <= 1,
  };
}

/** Fixed-capacity flat-shaded geometry, reused outside React and across frames. */
class Geometry {
  readonly data: Float32Array;
  readonly capacity: number;
  count = 0;
  clipped = false;

  constructor(capacity = MAX_VERTICES) {
    this.capacity = Math.floor(capacity / 3) * 3;
    this.data = new Float32Array(this.capacity * STRIDE);
  }

  clear(): void {
    this.count = 0;
    this.clipped = false;
  }

  triangle(a: Vec3, b: Vec3, c: Vec3, tint: Color, emission = 0, alpha = 1): void {
    if (this.count + 3 > this.capacity) {
      this.clipped = true;
      return;
    }
    const normal = normalize(cross([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [c[0] - a[0], c[1] - a[1], c[2] - a[2]]));
    for (const vertex of [a, b, c]) {
      const offset = this.count++ * STRIDE;
      this.data[offset] = finite(vertex[0]);
      this.data[offset + 1] = finite(vertex[1]);
      this.data[offset + 2] = finite(vertex[2]);
      this.data[offset + 3] = normal[0];
      this.data[offset + 4] = normal[1];
      this.data[offset + 5] = normal[2];
      this.data[offset + 6] = tint[0];
      this.data[offset + 7] = tint[1];
      this.data[offset + 8] = tint[2];
      this.data[offset + 9] = clampTypeBeforeDeath(alpha, 0, 1);
      this.data[offset + 10] = clampTypeBeforeDeath(emission, 0, 1);
    }
  }

  quad(a: Vec3, b: Vec3, c: Vec3, d: Vec3, tint: Color, emission = 0, alpha = 1): void {
    this.triangle(a, b, c, tint, emission, alpha);
    this.triangle(a, c, d, tint, emission, alpha);
  }

  box(matrix: Mat4, center: Vec3, size: Vec3, tint: Color, emission = 0, alpha = 1): void {
    const [x, y, z] = center;
    const [width, height, depth] = size;
    const vertices = [
      [-width / 2, -height / 2, -depth / 2], [width / 2, -height / 2, -depth / 2], [width / 2, height / 2, -depth / 2], [-width / 2, height / 2, -depth / 2],
      [-width / 2, -height / 2, depth / 2], [width / 2, -height / 2, depth / 2], [width / 2, height / 2, depth / 2], [-width / 2, height / 2, depth / 2],
    ].map((vertex) => point(matrix, [x + vertex[0], y + vertex[1], z + vertex[2]]));
    for (const [a, b, c, d] of BOX_FACES) this.quad(vertices[a], vertices[b], vertices[c], vertices[d], tint, emission, alpha);
  }

  pyramid(matrix: Mat4, center: Vec3, width: number, height: number, depth: number, tint: Color, emission = 0, alpha = 1): void {
    const [x, y, z] = center;
    const base: Vec3[] = [[x - width / 2, y, z - depth / 2], [x + width / 2, y, z - depth / 2], [x + width / 2, y, z + depth / 2], [x - width / 2, y, z + depth / 2]];
    const tip = point(matrix, [x, y + height, z]);
    for (let index = 0; index < 4; index++) this.triangle(point(matrix, base[index]), tip, point(matrix, base[(index + 1) % 4]), tint, emission, alpha);
  }

  ring(center: Vec3, radius: number, thickness: number, tint: Color, alpha = 1, segments = 24): void {
    for (let index = 0; index < segments; index++) {
      const a = index * TAU / segments;
      const b = (index + 1) * TAU / segments;
      const at = (angle: number, size: number): Vec3 => [center[0] + Math.cos(angle) * size, center[1], center[2] + Math.sin(angle) * size];
      this.quad(at(a, radius), at(b, radius), at(b, radius + thickness), at(a, radius + thickness), tint, 0.85, alpha);
    }
  }
}

function laneX(lane: number | undefined): number {
  return (clampTypeBeforeDeath(finite(lane, 0), -1, 1)) * 2.05;
}

export function typeBeforeDeathEnemyPosition(enemy: Pick<TypeBeforeDeathEnemyView, "progress" | "lane" | "x">): Vec3 {
  const x = Number.isFinite(enemy.x) ? clampTypeBeforeDeath(enemy.x as number, -3, 3) : laneX(enemy.lane);
  const progress = clampTypeBeforeDeath(finite(enemy.progress), 0, 1);
  return [x, 0, ROAD_FAR + progress * (ROAD_NEAR - ROAD_FAR)];
}

function bossPosition(boss: TypeBeforeDeathBossView): Vec3 {
  const progress = clampTypeBeforeDeath(finite(boss.progress, 0.36), 0.02, 0.94);
  return [0, 0, -54 + progress * 56];
}

function effectProgress(effect: TypeBeforeDeathEffectView, reducedMotion: boolean): number {
  if (Number.isFinite(effect.life)) return clampTypeBeforeDeath(effect.life as number, 0, 1);
  if (Number.isFinite(effect.elapsedMs) && Number.isFinite(effect.durationMs) && (effect.durationMs as number) > 0) return clampTypeBeforeDeath((effect.elapsedMs as number) / (effect.durationMs as number), 0, 1);
  if (reducedMotion) return 0.35;
  return clampTypeBeforeDeath(finite(effect.progress, 0.25), 0, 1);
}

function effectWorldPosition(effect: TypeBeforeDeathEffectView, view: TypeBeforeDeathSceneView, fallback: Vec3): Vec3 {
  if (Number.isFinite(effect.enemyId)) {
    const enemy = view.enemies.find((candidate) => candidate.id === effect.enemyId);
    if (enemy) return typeBeforeDeathEnemyPosition(enemy);
  } else if (effect.enemyId !== undefined) {
    const enemy = view.enemies.find((candidate) => String(candidate.id) === String(effect.enemyId));
    if (enemy) return typeBeforeDeathEnemyPosition(enemy);
  }
  if (Number.isFinite(effect.progress)) {
    return [Number.isFinite(effect.x) ? clampTypeBeforeDeath(effect.x as number, -3, 3) : laneX(effect.lane), 0.08, ROAD_FAR + clampTypeBeforeDeath(effect.progress as number, 0, 1) * (ROAD_NEAR - ROAD_FAR)];
  }
  return [finite(effect.x, fallback[0]), fallback[1], finite(effect.z, fallback[2])];
}

interface CharacterStyle {
  body: Color;
  cloth: Color;
  accent: Color;
  glow: Color;
  width: number;
  height: number;
  lean: number;
  weapon: "none" | "gun";
  hood: boolean;
  undead: boolean;
  ragged: number;
  hunched: number;
  crouch: number;
}

const PLAYER_STYLE: CharacterStyle = {
  body: color("#10151c"), cloth: color("#1a2730"), accent: color("#db4f55"), glow: color("#ffd394"), width: 0.95, height: 2.28, lean: 0, weapon: "gun", hood: false, undead: false, ragged: 0.08, hunched: 0.02, crouch: 0,
};

function characterStyle(kind: string, boss = false): CharacterStyle {
  const normalized = kind.toLowerCase();
  if (boss || normalized.includes("boss") || normalized.includes("overlord")) return { body: color("#24151e"), cloth: color("#401d2d"), accent: color("#f0525b"), glow: color("#ffad62"), width: 1.65, height: 3.5, lean: 0.02, weapon: "none", hood: false, undead: true, ragged: 1, hunched: 0.2, crouch: 0 };
  if (normalized.includes("brute") || normalized.includes("tank") || normalized.includes("heavy")) return { body: color("#242630"), cloth: color("#3d2934"), accent: color("#d65c45"), glow: color("#ffb168"), width: 1.46, height: 2.68, lean: 0.04, weapon: "none", hood: false, undead: true, ragged: 0.95, hunched: 0.28, crouch: 0 };
  if (normalized.includes("shooter") || normalized.includes("sniper") || normalized.includes("gunner")) return { body: color("#15232d"), cloth: color("#253945"), accent: color("#d28a4d"), glow: color("#fbe0a0"), width: 0.82, height: 2.22, lean: -0.08, weapon: "gun", hood: true, undead: true, ragged: 0.62, hunched: 0.2, crouch: 0.03 };
  if (normalized.includes("stalker") || normalized.includes("assassin") || normalized.includes("shadow")) return { body: color("#191b22"), cloth: color("#292d35"), accent: color("#a94c4f"), glow: color("#b9e08d"), width: 0.76, height: 1.92, lean: 0.16, weapon: "none", hood: false, undead: true, ragged: 0.86, hunched: 0.34, crouch: 0.22 };
  if (normalized.includes("swarm") || normalized.includes("drone") || normalized.includes("crawler")) return { body: color("#1b2b2a"), cloth: color("#243d3a"), accent: color("#9a5544"), glow: color("#b7f6ad"), width: 0.52, height: 1.15, lean: 0.18, weapon: "none", hood: false, undead: true, ragged: 1, hunched: 0.4, crouch: 0.1 };
  if (normalized.includes("runner") || normalized.includes("hound") || normalized.includes("infected")) return { body: color("#142733"), cloth: color("#1f3e4a"), accent: color("#bd554f"), glow: color("#a4fff4"), width: 0.72, height: 2.03, lean: -0.12, weapon: "none", hood: false, undead: true, ragged: 0.74, hunched: 0.29, crouch: 0.08 };
  return { body: color("#1e242b"), cloth: color("#293642"), accent: color("#a65b52"), glow: color("#d6edf6"), width: 0.9, height: 2.12, lean: 0.04, weapon: "none", hood: false, undead: true, ragged: 0.78, hunched: 0.24, crouch: 0 };
}

function drawFirearm3D(batch: Geometry, matrix: Mat4, body: Color, cloth: Color, accent: Color, alpha: number, low: boolean): void {
  const box = (center: Vec3, size: Vec3, tint: Color, emission = 0): void => batch.box(matrix, center, size, tint, emission, alpha);
  // A compact carbine silhouette: stock, receiver, magazine, barrel, and a low sight.
  const stock = transform(matrix, [0, -0.2, 0], 0, 0, -0.08);
  batch.box(stock, [0, 0, 0], [0.16, 0.3, 0.14], cloth, 0, alpha);
  box([0, 0.035, 0], [0.23, 0.28, 0.16], body);
  box([0, -0.055, -0.105], [0.11, 0.16, 0.075], accent, 0.12);
  box([0, 0.35, 0], [0.09, 0.53, 0.085], body);
  box([0, 0.64, 0], [0.12, 0.1, 0.12], accent, 0.18);
  box([0, 0.25, 0.095], [0.045, 0.13, 0.035], accent, 0.2);
  if (!low) box([0, 0.19, -0.09], [0.045, 0.1, 0.035], cloth, 0.08);
}

function drawCharacter(batch: Geometry, position: Vec3, style: CharacterStyle, time: number, seed: number, options: { player?: boolean; boss?: boolean; low?: boolean; still?: boolean; hitFlash?: number; alpha?: number }): void {
  const flash = clampTypeBeforeDeath(finite(options.hitFlash), 0, 1);
  const body = mix(style.body, [0.9, 0.92, 0.9], flash);
  const cloth = mix(style.cloth, [1, 0.8, 0.65], flash * 0.8);
  const accent = mix(style.accent, [1, 0.94, 0.8], flash);
  const alpha = clampTypeBeforeDeath(finite(options.alpha, 1), 0, 1);
  const scale = options.boss ? 1 : 1;
  const stride = options.still ? 0 : Math.sin(time * 0.004 + seed * 1.77) * 0.22;
  const crouch = style.crouch;
  const root = transform(identity(), [position[0], position[1] + crouch * 0.18, position[2]], style.lean + style.hunched * 0.45 + (options.player ? 0 : stride * 0.04), 0, 0, scale);
  const box = (matrix: Mat4, center: Vec3, size: Vec3, tint: Color, emission = 0): void => batch.box(matrix, center, size, tint, emission, alpha);
  const torso = transform(root, [0, style.height * 0.51, 0]);
  box(torso, [0, 0, 0], [style.width * 0.62, style.height * 0.53, 0.38], body);
  box(torso, [0, -style.height * 0.13, 0.21], [style.width * 0.36, style.height * 0.28, 0.055], cloth);
  box(torso, [0, style.height * 0.2, 0.2], [style.width * 0.48, 0.065, 0.04], accent, 0.18);
  if (style.undead) {
    for (const side of [-1, 1]) {
      const shoulder = transform(torso, [side * style.width * 0.24, style.height * 0.08, -0.03], 0, 0, side * 0.1);
      batch.triangle(point(shoulder, [-style.width * 0.17, 0.12, 0.2]), point(shoulder, [style.width * 0.17, 0.12, 0.2]), point(shoulder, [side * style.width * 0.21, -style.height * (0.2 + style.ragged * 0.12), 0.2]), mix(cloth, body, 0.24), 0.02, alpha);
    }
    const tornHem = transform(torso, [0, -style.height * 0.18, 0.2], 0, 0, style.lean * 0.18);
    batch.triangle(point(tornHem, [-style.width * 0.25, 0.18, 0]), point(tornHem, [0, 0.18, 0]), point(tornHem, [-style.width * 0.12, -style.height * (0.16 + style.ragged * 0.1), 0]), cloth, 0.01, alpha);
    batch.triangle(point(tornHem, [0, 0.18, 0]), point(tornHem, [style.width * 0.25, 0.18, 0]), point(tornHem, [style.width * 0.1, -style.height * (0.13 + style.ragged * 0.14), 0]), mix(cloth, body, 0.18), 0.01, alpha);
  }
  if (style.hood) {
    box(torso, [0, style.height * 0.18, 0.09], [style.width * 0.76, style.height * 0.28, 0.34], cloth);
  }
  const head = transform(torso, [0, style.height * 0.39, 0], options.player ? 0 : stride * 0.1);
  box(head, [0, 0, 0], [style.width * 0.42, style.height * 0.22, 0.34], style.hood ? cloth : body);
  if (style.undead) {
    box(head, [0, -style.height * 0.08, 0.17], [style.width * 0.3, style.height * 0.1, 0.055], mix(body, [0.03, 0.04, 0.045], 0.35));
    for (const side of [-1, 1]) box(head, [side * style.width * 0.1, -style.height * 0.015, 0.2], [style.width * 0.075, style.height * 0.045, 0.035], style.glow, 0.92);
  } else {
    box(head, [0, -style.height * 0.04, -0.19], [style.width * 0.13, style.height * 0.06, 0.035], style.glow, 0.55);
  }
  for (const side of [-1, 1]) {
    const leg = transform(root, [side * style.width * 0.19, style.height * 0.25, 0], (options.player ? side * 0.12 : stride * side));
    box(leg, [0, -style.height * 0.14, 0], [style.width * 0.2, style.height * 0.38, 0.25], cloth);
    box(leg, [0, -style.height * 0.35, 0], [style.width * 0.24, style.height * 0.26, 0.29], body);
  }
  for (const side of [-1, 1]) {
    const armRotation = options.player ? (side > 0 ? -0.45 : 0.2) : style.hunched * 0.72 + side * 0.12;
    const arm = transform(torso, [side * style.width * 0.42, style.height * 0.11, 0], armRotation);
    box(arm, [0, -style.height * 0.12, 0], [style.width * 0.2, style.height * 0.32, 0.25], body);
    const hand = transform(arm, [0, -style.height * 0.28, 0]);
    box(hand, [0, -0.03, 0], [style.width * 0.16, style.height * 0.12, 0.18], cloth);
    if (side > 0 && style.weapon !== "none") {
      const weapon = transform(hand, [0, -style.height * 0.1, -0.08], -Math.PI / 2.15, 0, options.player ? -0.08 : -0.04);
      drawFirearm3D(batch, weapon, body, cloth, accent, alpha, Boolean(options.low));
    }
  }
  if (style.hood) box(head, [0, style.height * 0.08, 0.16], [style.width * 0.58, style.height * 0.12, 0.15], cloth);
}

function buildScenery(batch: Geometry, low: boolean): void {
  batch.clear();
  const box = (position: Vec3, size: Vec3, tint: Color, emission = 0, rotation = 0): void => batch.box(transform(identity(), position, 0, rotation), [0, 0, 0], size, tint, emission);
  const ground = mix(ROAD_COLOR, [0.03, 0.05, 0.07], 0.28);
  const curb = mix(SIDEWALK_COLOR, [0.3, 0.34, 0.36], 0.18);
  batch.quad([-31, -0.08, ROAD_FAR], [31, -0.08, ROAD_FAR], [31, -0.08, ROAD_NEAR], [-31, -0.08, ROAD_NEAR], ground);
  batch.quad([-4.3, 0, ROAD_FAR], [4.3, 0, ROAD_FAR], [4.3, 0, ROAD_NEAR], [-4.3, 0, ROAD_NEAR], ROAD_COLOR);
  batch.quad([-6.9, 0.01, ROAD_FAR], [-4.3, 0.01, ROAD_FAR], [-4.3, 0.01, ROAD_NEAR], [-6.9, 0.01, ROAD_NEAR], sidewalkColor(0));
  batch.quad([4.3, 0.01, ROAD_FAR], [6.9, 0.01, ROAD_FAR], [6.9, 0.01, ROAD_NEAR], [4.3, 0.01, ROAD_NEAR], sidewalkColor(1));
  for (let index = 0; index < (low ? 12 : 22); index++) {
    const z = ROAD_NEAR - 3 - index * (low ? 5.8 : 3.7);
    batch.quad([-4.32, 0.012, z], [4.32, 0.012, z], [4.32, 0.012, z - (low ? 1.8 : 1.2)], [-4.32, 0.012, z - (low ? 1.8 : 1.2)], mix(ROAD_COLOR, [0.6, 0.64, 0.62], 0.3));
  }
  for (const x of [-4.3, 4.3]) box([x, 0.12, -30], [0.24, 0.24, 78], curb);
  const buildingCount = low ? 7 : 11;
  for (let index = 0; index < buildingCount; index++) {
    for (const side of [-1, 1]) {
      const height = 5.1 + noise(index * 4.2 + side * 11) * 8.8;
      const width = 2.9 + noise(index * 8.7 + side * 3) * 2;
      const depth = 4.3 + noise(index * 6.1 + side * 5) * 2.3;
      const z = -7 - index * 6.35 + noise(index * 1.7 + side) * 1.1;
      const x = side * (7.8 + noise(index * 2.4 + side * 8) * 1.8);
      const tint = mix(BUILDING_COLOR, [0.06, 0.075, 0.09], noise(index + side * 4) * 0.45);
      box([x, height / 2, z], [width, height, depth], tint);
      batch.pyramid(identity(), [x, height, z], width * 1.05, 0.7 + noise(index * 2.1) * 0.8, depth * 0.96, mix(tint, [0.18, 0.2, 0.22], 0.35));
      const floors = Math.max(2, Math.floor(height / 2.25));
      for (let floor = 0; floor < floors; floor++) {
        for (let column = 0; column < 2; column++) {
          if (noise(index * 19 + floor * 7 + column * 2 + side * 2) < 0.22) continue;
          const wx = x - width * 0.25 + column * width * 0.5;
          const wy = 1.2 + floor * 2.1;
          box([wx, wy, z + depth / 2 + 0.035], [0.35, 0.68, 0.045], floor % 3 === 0 ? mix(WINDOW_COLOR, [0.46, 0.65, 0.68], 0.58) : WINDOW_COLOR, 0.5);
        }
      }
      if (!low && index % 3 === 1) box([x + side * width * 0.24, height * 0.62, z + depth / 2 + 0.05], [0.09, height * 0.3, 0.04], [0.03, 0.04, 0.05]);
    }
  }
  // The safehouse reads as a warm, geometric anchor behind the player.
  box([6.3, 2.1, 4.1], [3.4, 4.2, 3.4], SAFEHOUSE_COLOR);
  batch.pyramid(identity(), [6.3, 4.2, 4.1], 3.6, 1.05, 3.55, mix(SAFEHOUSE_COLOR, [0.2, 0.35, 0.38], 0.45));
  box([6.3, 1.18, 2.35], [1.05, 2.35, 0.08], [0.04, 0.1, 0.12]);
  box([6.3, 1.42, 2.29], [0.2, 1.3, 0.03], SAFEHOUSE_GLOW, 0.92);
  box([5.55, 2.05, 2.28], [0.42, 0.56, 0.035], mix(SAFEHOUSE_GLOW, WINDOW_COLOR, 0.32), 0.8);
  box([7.05, 2.05, 2.28], [0.42, 0.56, 0.035], mix(SAFEHOUSE_GLOW, WINDOW_COLOR, 0.32), 0.8);
  // Barricade planks and warning lamps stay close to the combat read.
  for (const x of [-3.15, 3.15]) {
    box([x, 0.72, 1.1], [0.22, 1.45, 0.22], [0.22, 0.18, 0.16]);
    box([x, 1.45, 1.08], [0.36, 0.12, 0.36], WINDOW_COLOR, 0.82);
  }
  box([0, 1.12, 1.04], [6.55, 0.22, 0.28], [0.24, 0.18, 0.15], 0, -0.08);
  box([0, 0.58, 1.2], [6.55, 0.2, 0.25], [0.17, 0.15, 0.14], 0, 0.08);
  // Streetlights make the perspective depth legible even in the fog.
  const lightCount = low ? 4 : 6;
  for (let index = 0; index < lightCount; index++) {
    const z = 1 - index * 12.2;
    for (const side of [-1, 1]) {
      const x = side * (5.45 + (index % 2) * 0.16);
      box([x, 3.1, z], [0.09, 6.2, 0.09], [0.32, 0.36, 0.38]);
      box([x - side * 0.42, 6.05, z], [0.85, 0.08, 0.08], [0.32, 0.36, 0.38]);
      box([x - side * 0.8, 5.85, z], [0.38, 0.2, 0.18], WINDOW_COLOR, 0.95);
      batch.quad([x - side * 1.02, 5.74, z - 0.35], [x - side * 0.58, 5.74, z - 0.35], [x - side * 0.58, 5.74, z + 0.35], [x - side * 1.02, 5.74, z + 0.35], [0.75, 0.47, 0.23], 0.35, 0.26);
    }
  }
  function sidewalkColor(side: number): Color {
    return mix(SIDEWALK_COLOR, (side ? [0.15, 0.19, 0.2] : [0.19, 0.17, 0.18]) as Color, 0.22);
  }
}

function appendRingEffect(batch: Geometry, position: Vec3, radius: number, progress: number, tint: Color, alpha = 1): void {
  batch.ring([position[0], 0.07, position[2]], Math.max(0.05, radius * progress), Math.max(0.035, 0.16 * (1 - progress)), tint, alpha * (1 - progress), 24);
}

function drawEffects(batch: Geometry, frame: SceneFrame): void {
  const view = frame.view;
  if (!view) return;
  const fallback = [frame.playerX(), 0.2, PLAYER_Z] as Vec3;
  let particles = 0;
  for (const effect of view.effects) {
    if (particles >= MAX_DYNAMIC_PARTICLES) break;
    const progress = effectProgress(effect, frame.reducedMotion);
    const position = effectWorldPosition(effect, view, fallback);
    const intensity = clampTypeBeforeDeath(finite(effect.intensity, 1), 0, 2);
    const customTint = Boolean(effect.color);
    const tint: Color = effect.color ? color(effect.color) : effect.kind === "overdrive" ? [0.3, 0.82, 1] : effect.kind === "death" ? BLOOD_RED : MUZZLE_FLASH;
    if (effect.kind === "muzzle") {
      const flash = 1 - progress;
      const muzzle = [position[0] + 0.5, 1.45, position[2] - 0.2] as Vec3;
      const flashTint = customTint ? tint : MUZZLE_FLASH;
      const spread = effect.shotType === "buckshot" ? 1.35 : effect.shotType === "headshot" ? 0.7 : 1;
      batch.pyramid(identity(), muzzle, 0.48 * intensity * flash * spread, 0.42 * intensity * flash * spread, 0.48, flashTint, 1, 0.85 * flash);
      batch.box(transform(identity(), muzzle, 0, 0, Math.PI / 4), [0, 0, 0], [0.16 * intensity * flash, 0.16 * intensity * flash, 0.16], [1, 0.9, 0.62], 1, 0.7 * flash);
      batch.ring(muzzle, 0.42 * flash, 0.09, flashTint, 0.8 * flash, 12);
      if (effect.shotType === "buckshot") {
        for (const pellet of [-1, 0, 1]) {
          batch.pyramid(identity(), [muzzle[0] + pellet * 0.18 * flash, muzzle[1] + Math.abs(pellet) * 0.08, muzzle[2] - 0.22], 0.12 * flash, 0.14 * flash, 0.12, flashTint, 0.9, 0.75 * flash);
        }
      }
    } else if (effect.kind === "impact") {
      const impactTint = customTint ? tint : effect.shotType === "headshot" ? BLOOD_HIGHLIGHT : BLOOD_RED;
      const flash = 1 - progress;
      const impactScale = effect.shotType === "headshot" ? 1.35 : effect.shotType === "buckshot" ? 1.15 : 1;
      appendRingEffect(batch, position, 1.35 * intensity * impactScale, progress, impactTint, 0.9);
      batch.box(transform(identity(), [position[0], 0.16, position[2]], 0, 0, Math.PI / 4), [0, 0, 0], [0.16 * intensity * flash, 0.1 * intensity * flash, 0.16 * intensity * flash], customTint ? impactTint : IMPACT_FLASH, 0.85, 0.72 * flash);
      batch.ring([position[0], 0.15, position[2]], 0.2 + 0.35 * flash, 0.055, customTint ? impactTint : IMPACT_FLASH, 0.72 * flash, frame.low ? 12 : 18);
      for (let index = 0; index < (frame.low ? 5 : 10); index++) {
        if (particles >= MAX_DYNAMIC_PARTICLES) break;
        const angle = index * TAU / 10 + finite(effect.seed, 0) * 0.7;
        const radius = 0.26 + progress * 1.15;
        const sparkTint = !customTint && index % 3 === 0 ? IMPACT_FLASH : impactTint;
        batch.pyramid(identity(), [position[0] + Math.cos(angle) * radius, 0.08 + flash * 0.6, position[2] + Math.sin(angle) * radius], 0.09, 0.2 * flash, 0.09, sparkTint, 0.75, flash);
        particles++;
      }
    } else if (effect.kind === "overdrive") {
      appendRingEffect(batch, position, 3.2 * intensity, progress, tint, 0.95);
      batch.ring([position[0], 1.4, position[2]], 1.25 * (1 - progress), 0.06, [0.72, 0.95, 1] as Color, 0.8 * (1 - progress), 18);
    } else if (effect.kind === "death") {
      const bloodTint = customTint ? tint : BLOOD_RED;
      const flash = 1 - progress;
      appendRingEffect(batch, position, 0.78 * intensity, progress, customTint ? bloodTint : BLOOD_DARK, 0.42);
      for (let index = 0; index < (frame.low ? 6 : 12); index++) {
        if (particles >= MAX_DYNAMIC_PARTICLES) break;
        const angle = index * TAU / 12 + finite(effect.seed, 0);
        const radius = 0.14 + progress * (0.62 + noise(index + finite(effect.seed, 0)) * 1.35);
        const particleTint = !customTint && index % 4 === 0 ? BLOOD_HIGHLIGHT : bloodTint;
        batch.pyramid(identity(), [position[0] + Math.cos(angle) * radius, 0.18 + flash * (0.42 + noise(index) * 1.05), position[2] + Math.sin(angle) * radius], 0.075, 0.17 * flash, 0.075, particleTint, 0.62, flash);
        particles++;
      }
    }
  }
  if (view.overdrive > 0.01) {
    const pulse = frame.reducedMotion ? 0.35 : (Math.sin(frame.time * 0.006) + 1) * 0.5;
    const player = [frame.playerX(), 0, PLAYER_Z] as Vec3;
    batch.ring(player, 1.1 + pulse * 0.5, 0.08, [0.27, 0.82, 1] as Color, clampTypeBeforeDeath(view.overdrive, 0, 1) * 0.8, frame.low ? 16 : 28);
  }
  const healthRatio = clampTypeBeforeDeath(view.maxHealth > 0 ? view.health / view.maxHealth : 0, 0, 1);
  if (healthRatio < 0.38) {
    const player = [frame.playerX(), 0.04, PLAYER_Z] as Vec3;
    batch.ring(player, 1.18, 0.065, [0.92, 0.2, 0.22] as Color, (0.38 - healthRatio) * 1.7, frame.low ? 14 : 24);
  }
}

function buildActors(batch: Geometry, frame: SceneFrame): void {
  batch.clear();
  const view = frame.view;
  if (!view) return;
  const low = frame.low;
  const still = frame.reducedMotion;
  const enemies = [...view.enemies].sort((a, b) => Number(b.targeted) - Number(a.targeted) || b.progress - a.progress).slice(0, low ? 7 : 12);
  for (const enemy of enemies) {
    const position = typeBeforeDeathEnemyPosition(enemy);
    if (!frame.project(position, true).visible) continue;
    const style = characterStyle(enemy.kind);
    drawCharacter(batch, position, style, frame.time, Number(String(enemy.id).replace(/\D/g, "")) || 1, { low: low || enemy.progress < 0.18, still, hitFlash: enemy.hitFlash });
    if (enemy.targeted) batch.ring([position[0], 0.06, position[2]], style.width * 0.72, 0.08, [1, 0.78, 0.38], 0.9, low ? 14 : 24);
    if (enemy.hitFlash > 0.02) appendRingEffect(batch, position, 1.2, clampTypeBeforeDeath(1 - enemy.hitFlash, 0, 1), [1, 0.54, 0.34], enemy.hitFlash);
  }
  if (view.boss?.active) {
    const position = bossPosition(view.boss);
    drawCharacter(batch, position, characterStyle(view.boss.kind ?? "boss", true), frame.time, 901, { boss: true, low, still, hitFlash: view.boss.hitFlash });
    batch.ring([position[0], 0.06, position[2]], 1.9, 0.12, [1, 0.29, 0.32], 0.65, low ? 18 : 32);
    if (view.boss.targeted) batch.ring([position[0], 0.09, position[2]], 2.25, 0.07, [1, 0.82, 0.46], 0.85, low ? 20 : 36);
  }
  const playerPosition: Vec3 = [frame.playerX(), 0, PLAYER_Z];
  drawCharacter(batch, playerPosition, PLAYER_STYLE, frame.time, 13, { player: true, low, still: true, hitFlash: view.player.hitFlash ?? 0 });
  const barricade = clampTypeBeforeDeath(view.barricade, 0, 1);
  if (barricade < 0.98) {
    const damage = 1 - barricade;
    for (let index = 0; index < (low ? 2 : 4); index++) {
      const side = index % 2 ? 1 : -1;
      const x = side * (0.65 + index * 0.72);
      batch.box(transform(identity(), [x, 1.05 + (index % 3) * 0.16, 0.91], 0, 0, side * 0.28), [0, 0, 0], [0.06 + damage * 0.06, 0.74 + damage * 0.5, 0.05], [0.84, 0.22, 0.18] as Color, 0.55, Math.min(0.86, damage));
    }
  }
  drawEffects(batch, frame);
  if (!frame.reducedMotion) {
    const count = low ? 18 : 36;
    for (let index = 0; index < count; index++) {
      const x = -10 + noise(index * 4.1) * 20;
      const z = ROAD_FAR + ((noise(index * 9.7) + frame.time * 0.000035 * (0.45 + noise(index))) % 1 + 1) % 1 * 72;
      const y = 1.5 + noise(index * 3.2) * 7;
      batch.box(transform(identity(), [x, y, z], 0.13, 0, 0.04), [0, 0, 0], [0.025, 0.55 + noise(index) * 0.45, 0.025], RAIN_COLOR, 0.15, 0.42);
      if (index < (low ? 6 : 13)) batch.pyramid(identity(), [x * 0.72, 0.5 + noise(index * 5) * 1.8, ROAD_FAR + noise(index * 12) * 68], 0.08, 0.16, 0.08, EMBER_COLOR, 0.65, 0.7);
    }
  }
}

class SceneFrame {
  width = 1;
  height = 1;
  low = false;
  reducedMotion: boolean;
  time = 0;
  view: TypeBeforeDeathSceneView | null = null;
  viewMatrix = identity();
  viewProjection = identity();
  private projectionZoom = 0;

  constructor(options: TypeBeforeDeathRendererOptions) {
    this.reducedMotion = options.reducedMotion;
  }

  resize(width: number, height: number, quality: TypeBeforeDeathRenderQuality): void {
    this.width = Math.max(1, finite(width, 1));
    this.height = Math.max(1, finite(height, 1));
    this.low = quality === "low" || (quality === "auto" && this.width < 720);
  }

  update(view: TypeBeforeDeathSceneView, now: number): void {
    this.view = view;
    this.reducedMotion = Boolean(view.reducedMotion);
    this.time = this.reducedMotion ? 0 : finite(now, 0);
    const targetEnemy = [...view.enemies].filter((enemy) => enemy.targeted).sort((a, b) => b.progress - a.progress)[0];
    const target = targetEnemy ? typeBeforeDeathEnemyPosition(targetEnemy) : view.boss?.active ? bossPosition(view.boss) : [0, 0, -28] as Vec3;
    const explicitX = finite(view.camera?.x, target[0]);
    const explicitZ = finite(view.camera?.z, target[2]);
    const emphasis = view.boss?.active && view.boss.targeted ? 0.9 : targetEnemy ? 0.62 : 0.22;
    const cameraX = explicitX * 0.2 * emphasis;
    const baseShake = finite(view.camera?.shake, 0) + view.effects.reduce((sum, effect) => sum + (["impact", "death", "muzzle", "overdrive", "camera-shake"].includes(effect.kind) ? finite(effect.intensity, 0.3) * (1 - effectProgress(effect, this.reducedMotion)) : 0), 0);
    const shake = this.reducedMotion ? 0 : clampTypeBeforeDeath(baseShake, 0, 1.2) * 0.1;
    const phase = this.time * 0.047;
    const shakeX = Math.sin(phase) * shake;
    const shakeY = Math.cos(phase * 1.31) * shake * 0.55;
    this.projectionZoom = finite(view.camera?.zoom, 0) + (view.overdrive > 0.6 ? 1.5 : 0) + emphasis * 0.7;
    const eye: Vec3 = [cameraX + shakeX, 3.15 + shakeY, 8.8];
    const lookAt: Vec3 = [cameraX * 0.35, 1.15 + shakeY * 0.2, -27 + (explicitZ + 27) * emphasis * 0.16];
    this.viewMatrix = viewMatrix(eye, lookAt);
    this.viewProjection = multiply(perspective(this.width / this.height, this.projectionZoom), this.viewMatrix);
  }

  project(value: Vec3, visibility = false): TypeBeforeDeathProjection {
    const result = projectPoint(value, this.viewProjection, this.width, this.height);
    return visibility ? result : { ...result, visible: result.depth > 0.28 && Number.isFinite(result.x + result.y) };
  }

  projectEnemy(enemy: TypeBeforeDeathEnemyView): TypeBeforeDeathProjection {
    const position = typeBeforeDeathEnemyPosition(enemy);
    return this.project([position[0], 1.9, position[2]]);
  }

  projectBoss(boss: TypeBeforeDeathBossView): TypeBeforeDeathProjection {
    const position = bossPosition(boss);
    return this.project([position[0], 2.75, position[2]]);
  }

  playerX(): number {
    if (!this.view) return 0;
    return Number.isFinite(this.view.player.x) ? clampTypeBeforeDeath(this.view.player.x as number, -2.3, 2.3) : laneX(this.view.player.lane);
  }
}

const VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec4 aColor;
attribute float aEmission;
uniform mat4 uViewProjection;
uniform mat4 uView;
varying vec3 vNormal;
varying vec4 vColor;
varying float vEmission;
varying float vDepth;
void main() {
  gl_Position = uViewProjection * vec4(aPosition, 1.0);
  vNormal = aNormal;
  vColor = aColor;
  vEmission = aEmission;
  vDepth = -(uView * vec4(aPosition, 1.0)).z;
}`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform vec3 uFog;
varying vec3 vNormal;
varying vec4 vColor;
varying float vEmission;
varying float vDepth;
void main() {
  vec3 normal = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
  float sunlight = max(0.0, dot(normal, normalize(vec3(-0.42, 0.84, 0.5))));
  float rim = max(0.0, dot(normal, normalize(vec3(0.7, 0.3, -0.7))));
  vec3 lighting = vec3(0.36, 0.43, 0.52) + vec3(0.72, 0.64, 0.54) * sunlight + vec3(0.12, 0.22, 0.34) * rim;
  vec3 lit = vColor.rgb * mix(lighting, vec3(1.35), clamp(vEmission, 0.0, 1.0));
  float fog = smoothstep(18.0, 76.0, vDepth) * 0.9;
  gl_FragColor = vec4(mix(lit, uFog, fog), vColor.a);
}`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string, shaders: WebGLShader[]): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to allocate Type Before Death shader");
  shaders.push(shader);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error("Type Before Death scene shader compilation failed");
  return shader;
}

/** WebGL renderer. Setup failures are intentionally thrown so the boundary can use Canvas. */
export function createWebGLTypeBeforeDeathRenderer(canvas: HTMLCanvasElement, options: TypeBeforeDeathRendererOptions): TypeBeforeDeathSceneRenderer {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: options.quality !== "low", depth: true, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: "low-power" });
  if (!gl) throw new Error("WebGL unavailable");
  const shaders: WebGLShader[] = [];
  const buffers: WebGLBuffer[] = [];
  let program: WebGLProgram | null = null;
  let disposed = false;
  const release = (): void => {
    for (const buffer of buffers) gl.deleteBuffer(buffer);
    for (const shader of shaders) gl.deleteShader(shader);
    if (program) gl.deleteProgram(program);
    buffers.length = 0;
    shaders.length = 0;
    program = null;
  };
  try {
    const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER, shaders);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER, shaders);
    program = gl.createProgram();
    if (!program) throw new Error("Unable to allocate Type Before Death scene program");
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Type Before Death scene shader linking failed");
    gl.detachShader(program, vertex);
    gl.detachShader(program, fragment);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    shaders.length = 0;
    for (let index = 0; index < 2; index++) {
      const buffer = gl.createBuffer();
      if (!buffer) throw new Error("Unable to allocate Type Before Death scene geometry");
      buffers.push(buffer);
    }
    const linkedProgram = program;
    const position = gl.getAttribLocation(linkedProgram, "aPosition");
    const normal = gl.getAttribLocation(linkedProgram, "aNormal");
    const tint = gl.getAttribLocation(linkedProgram, "aColor");
    const emission = gl.getAttribLocation(linkedProgram, "aEmission");
    const viewProjection = gl.getUniformLocation(linkedProgram, "uViewProjection");
    const view = gl.getUniformLocation(linkedProgram, "uView");
    const fog = gl.getUniformLocation(linkedProgram, "uFog");
    if ([position, normal, tint, emission].some((value) => value < 0) || !viewProjection || !view || !fog) throw new Error("Type Before Death scene shader interface unavailable");
    const frame = new SceneFrame(options);
    const scenery = new Geometry();
    const actors = new Geometry();
    let sceneryKey = "";
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[1]);
    gl.bufferData(gl.ARRAY_BUFFER, actors.data.byteLength, gl.DYNAMIC_DRAW);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    if (typeof gl.enable === "function" && typeof gl.blendFunc === "function") {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    const drawBatch = (buffer: WebGLBuffer, count: number): void => {
      if (!count) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      for (const [attribute, size, offset] of [[position, 3, 0], [normal, 3, 3], [tint, 4, 6], [emission, 1, 10]] as const) {
        gl.enableVertexAttribArray(attribute);
        gl.vertexAttribPointer(attribute, size, gl.FLOAT, false, STRIDE * 4, offset * 4);
      }
      gl.drawArrays(gl.TRIANGLES, 0, count);
    };
    const renderer: TypeBeforeDeathSceneRenderer = {
      mode: "webgl",
      resize(width, height, dpr) {
        if (disposed) return;
        frame.resize(width, height, options.quality);
        const ratio = clampTypeBeforeDeath(dpr, 1, frame.low ? 1 : 1.5);
        canvas.width = Math.max(1, Math.round(frame.width * ratio));
        canvas.height = Math.max(1, Math.round(frame.height * ratio));
        gl.viewport(0, 0, canvas.width, canvas.height);
      },
      render(viewState, now) {
        if (disposed) return;
        if (typeof gl.isContextLost === "function" && gl.isContextLost()) throw new Error("Type Before Death WebGL context lost");
        frame.update(viewState, now);
        const key = String(frame.low);
        if (key !== sceneryKey) {
          buildScenery(scenery, frame.low);
          gl.bindBuffer(gl.ARRAY_BUFFER, buffers[0]);
          gl.bufferData(gl.ARRAY_BUFFER, scenery.data.subarray(0, scenery.count * STRIDE), gl.STATIC_DRAW);
          sceneryKey = key;
        }
        buildActors(actors, frame);
        const sky = NIGHT_SKY;
        gl.clearColor(sky[0], sky[1], sky[2], 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(linkedProgram);
        gl.uniformMatrix4fv(viewProjection, false, frame.viewProjection);
        gl.uniformMatrix4fv(view, false, frame.viewMatrix);
        gl.uniform3f(fog, NIGHT_FOG[0], NIGHT_FOG[1], NIGHT_FOG[2]);
        drawBatch(buffers[0], scenery.count);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers[1]);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, actors.data.subarray(0, actors.count * STRIDE));
        drawBatch(buffers[1], actors.count);
        if (typeof gl.getError === "function" && gl.getError() !== gl.NO_ERROR) throw new Error("Type Before Death scene graphics unavailable");
      },
      projectEnemy(enemy) {
        return frame.projectEnemy(enemy);
      },
      projectBoss(boss) {
        return frame.projectBoss(boss);
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        release();
        scenery.clear();
        actors.clear();
        frame.view = null;
      },
    };
    options.onMode?.("webgl");
    return renderer;
  } catch (error) {
    release();
    throw error;
  }
}

function polygon2D(ctx: Context2D, points: readonly (readonly [number, number])[], fill: string): void {
  if (points.length < 3 || points.some((pointValue) => !Number.isFinite(pointValue[0] + pointValue[1]))) return;
  ctx.beginPath();
  points.forEach((pointValue, index) => index ? ctx.lineTo(pointValue[0], pointValue[1]) : ctx.moveTo(pointValue[0], pointValue[1]));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function worldPolygon2D(ctx: Context2D, frame: SceneFrame, vertices: readonly Vec3[], tint: Color, alpha = 1): void {
  const projected = vertices.map((vertex) => frame.project(vertex));
  if (projected.some((pointValue) => pointValue.depth <= 0.28 || !Number.isFinite(pointValue.x + pointValue.y))) return;
  ctx.save();
  ctx.globalAlpha = clampTypeBeforeDeath(alpha, 0, 1);
  polygon2D(ctx, projected.map((pointValue) => [pointValue.x, pointValue.y]), css(tint));
  ctx.restore();
}

function box2D(ctx: Context2D, frame: SceneFrame, position: Vec3, size: Vec3, tint: Color, emission = 0, alpha = 1): void {
  const [x, y, z] = position;
  const [width, height, depth] = size;
  const glow = mix(tint, [1, 0.72, 0.4], clampTypeBeforeDeath(emission, 0, 1) * 0.38);
  worldPolygon2D(ctx, frame, [[x - width / 2, y + height / 2, z - depth / 2], [x + width / 2, y + height / 2, z - depth / 2], [x + width / 2, y + height / 2, z + depth / 2], [x - width / 2, y + height / 2, z + depth / 2]], mix(tint, [0.5, 0.55, 0.58], 0.18), alpha);
  worldPolygon2D(ctx, frame, [[x - width / 2, y - height / 2, z + depth / 2], [x + width / 2, y - height / 2, z + depth / 2], [x + width / 2, y + height / 2, z + depth / 2], [x - width / 2, y + height / 2, z + depth / 2]], glow, alpha);
  worldPolygon2D(ctx, frame, [[x - width / 2, y - height / 2, z - depth / 2], [x - width / 2, y - height / 2, z + depth / 2], [x - width / 2, y + height / 2, z + depth / 2], [x - width / 2, y + height / 2, z - depth / 2]], mix(tint, [0.02, 0.025, 0.04], 0.3), alpha);
}

function backdrop2D(ctx: Context2D, frame: SceneFrame): void {
  const { width, height } = frame;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#070d21");
  gradient.addColorStop(0.48, "#17283a");
  gradient.addColorStop(1, "#182027");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.fillStyle = "#e9d9af";
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.arc(width * 0.76, height * 0.2, Math.max(12, Math.min(width, height) * 0.035), 0, TAU);
  ctx.fill();
  ctx.restore();
  worldPolygon2D(ctx, frame, [[-31, -0.05, ROAD_FAR], [31, -0.05, ROAD_FAR], [31, -0.05, ROAD_NEAR], [-31, -0.05, ROAD_NEAR]], mix(ROAD_COLOR, [0.02, 0.03, 0.05], 0.1));
  worldPolygon2D(ctx, frame, [[-4.3, 0, ROAD_FAR], [4.3, 0, ROAD_FAR], [4.3, 0, ROAD_NEAR], [-4.3, 0, ROAD_NEAR]], ROAD_COLOR);
  worldPolygon2D(ctx, frame, [[-6.9, 0.01, ROAD_FAR], [-4.3, 0.01, ROAD_FAR], [-4.3, 0.01, ROAD_NEAR], [-6.9, 0.01, ROAD_NEAR]], SIDEWALK_COLOR);
  worldPolygon2D(ctx, frame, [[4.3, 0.01, ROAD_FAR], [6.9, 0.01, ROAD_FAR], [6.9, 0.01, ROAD_NEAR], [4.3, 0.01, ROAD_NEAR]], SIDEWALK_COLOR);
  for (let index = 0; index < (frame.low ? 11 : 20); index++) {
    const z = ROAD_NEAR - 3 - index * (frame.low ? 6 : 3.9);
    worldPolygon2D(ctx, frame, [[-4.29, 0.014, z], [4.29, 0.014, z], [4.29, 0.014, z - 1.2], [-4.29, 0.014, z - 1.2]], [0.23, 0.25, 0.24], 0.5);
  }
  for (let index = 0; index < (frame.low ? 7 : 11); index++) {
    for (const side of [-1, 1]) {
      const heightValue = 5.1 + noise(index * 4.2 + side * 11) * 8.8;
      const buildingWidth = 2.9 + noise(index * 8.7 + side * 3) * 2;
      const depth = 4.3 + noise(index * 6.1 + side * 5) * 2.3;
      const z = -7 - index * 6.35 + noise(index * 1.7 + side) * 1.1;
      const x = side * (7.8 + noise(index * 2.4 + side * 8) * 1.8);
      const tint = mix(BUILDING_COLOR, [0.03, 0.04, 0.06], noise(index + side * 4) * 0.45);
      box2D(ctx, frame, [x, heightValue / 2, z], [buildingWidth, heightValue, depth], tint);
      for (let floor = 0; floor < Math.max(2, Math.floor(heightValue / 2.25)); floor++) for (let column = 0; column < 2; column++) {
        if (noise(index * 19 + floor * 7 + column * 2 + side * 2) < 0.22) continue;
        box2D(ctx, frame, [x - buildingWidth * 0.25 + column * buildingWidth * 0.5, 1.2 + floor * 2.1, z + depth / 2 + 0.04], [0.35, 0.68, 0.045], floor % 3 === 0 ? mix(WINDOW_COLOR, [0.46, 0.65, 0.68], 0.58) : WINDOW_COLOR, 0.5);
      }
    }
  }
  box2D(ctx, frame, [6.3, 2.1, 4.1], [3.4, 4.2, 3.4], SAFEHOUSE_COLOR);
  box2D(ctx, frame, [6.3, 1.18, 2.35], [1.05, 2.35, 0.08], [0.04, 0.1, 0.12]);
  box2D(ctx, frame, [6.3, 1.42, 2.29], [0.2, 1.3, 0.03], SAFEHOUSE_GLOW, 0.92);
  for (const x of [-3.15, 3.15]) {
    box2D(ctx, frame, [x, 0.72, 1.1], [0.22, 1.45, 0.22], [0.22, 0.18, 0.16]);
    box2D(ctx, frame, [x, 1.45, 1.08], [0.36, 0.12, 0.36], WINDOW_COLOR, 0.82);
  }
  box2D(ctx, frame, [0, 1.12, 1.04], [6.55, 0.22, 0.28], [0.24, 0.18, 0.15]);
  box2D(ctx, frame, [0, 0.58, 1.2], [6.55, 0.2, 0.25], [0.17, 0.15, 0.14]);
  for (let index = 0; index < (frame.low ? 4 : 6); index++) for (const side of [-1, 1]) {
    const z = 1 - index * 12.2;
    const x = side * (5.45 + (index % 2) * 0.16);
    box2D(ctx, frame, [x, 3.1, z], [0.09, 6.2, 0.09], [0.32, 0.36, 0.38]);
    box2D(ctx, frame, [x - side * 0.8, 5.85, z], [0.38, 0.2, 0.18], WINDOW_COLOR, 0.95);
  }
}

function drawFirearm2D(frame: SceneFrame, rect: (x: number, y: number, width: number, height: number, fill: string) => void, body: string, cloth: string, accent: string, h: number, w: number): void {
  const receiverX = w * 0.3;
  const receiverY = h * 0.23;
  // Keep the fallback's firearm legible at a glance without adding a texture asset.
  rect(receiverX - w * 0.17, receiverY - h * 0.01, w * 0.2, h * 0.1, cloth);
  rect(receiverX, receiverY, w * 0.24, h * 0.14, body);
  rect(receiverX + w * 0.05, receiverY - h * 0.1, w * 0.11, h * 0.11, accent);
  rect(receiverX + w * 0.2, receiverY + h * 0.035, w * 0.49, h * 0.065, body);
  rect(receiverX + w * 0.67, receiverY + h * 0.02, w * 0.1, h * 0.08, accent);
  rect(receiverX + w * 0.08, receiverY + h * 0.14, w * 0.055, h * 0.09, accent);
  if (!frame.low) rect(receiverX + w * 0.18, receiverY + h * 0.15, w * 0.05, h * 0.055, cloth);
}

function character2D(ctx: Context2D, frame: SceneFrame, position: Vec3, style: CharacterStyle, options: { boss?: boolean; player?: boolean; hitFlash?: number; alpha?: number }): void {
  const projection = frame.project([position[0], 0, position[2]]);
  if (!projection.visible || projection.scale <= 0) return;
  const flash = clampTypeBeforeDeath(finite(options.hitFlash), 0, 1);
  const alpha = clampTypeBeforeDeath(finite(options.alpha, 1), 0, 1);
  const scale = projection.scale * (options.boss ? 1.02 : 0.92);
  const body = css(mix(style.body, [0.95, 0.95, 0.9], flash));
  const cloth = css(mix(style.cloth, [1, 0.78, 0.6], flash));
  const accent = css(mix(style.accent, [1, 0.92, 0.75], flash));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(projection.x, projection.y);
  ctx.scale(scale, -scale);
  ctx.rotate((style.lean + style.hunched * 0.35) * 0.45);
  const rect = (x: number, y: number, width: number, height: number, fill: string): void => { ctx.fillStyle = fill; ctx.fillRect(x, y, width, height); };
  const h = style.height;
  const w = style.width;
  rect(-w * 0.3, h * 0.34, w * 0.6, h * 0.5, body);
  rect(-w * 0.19, h * 0.02, w * 0.38, h * 0.34, cloth);
  if (style.undead) {
    polygon2D(ctx, [[-w * 0.31, h * 0.48], [w * 0.31, h * 0.48], [w * 0.27, h * 0.08], [w * 0.12, -h * 0.04], [0, h * 0.06], [-w * 0.12, -h * 0.03], [-w * 0.28, h * 0.1]], cloth);
    for (const side of [-1, 1]) polygon2D(ctx, [[side * w * 0.2, h * 0.77], [side * w * 0.48, h * 0.63], [side * w * 0.32, h * 0.46]], css(mix(style.cloth, style.body, 0.22)));
  }
  for (const side of [-1, 1]) {
    rect(side * w * 0.1 - w * 0.095, -h * 0.15, w * 0.19, h * 0.34, body);
    rect(side * w * 0.1 - w * 0.1, -h * 0.48, w * 0.2, h * 0.28, body);
    ctx.save();
    ctx.translate(side * w * 0.38, h * 0.59);
    ctx.rotate(side * (0.12 + style.hunched * 0.16));
    rect(-w * 0.1, -h * 0.19, w * 0.2, h * 0.34, body);
    ctx.restore();
  }
  rect(-w * 0.2, h * 0.88, w * 0.4, h * 0.23, style.hood ? cloth : body);
  if (style.hood) rect(-w * 0.28, h * 0.92, w * 0.56, h * 0.16, cloth);
  if (style.undead) {
    rect(-w * 0.17, h * 0.94, w * 0.34, h * 0.075, css(mix(style.body, [0.02, 0.03, 0.035], 0.62)));
    for (const side of [-1, 1]) rect(side * w * 0.1 - w * 0.037, h * 0.955, w * 0.074, h * 0.038, css(style.glow));
  } else rect(-w * 0.08, h * 0.96, w * 0.16, h * 0.035, css(style.glow));
  if (options.player) rect(-w * 0.22, h * 0.43, w * 0.44, h * 0.08, accent);
  if (style.weapon === "gun") drawFirearm2D(frame, rect, body, cloth, accent, h, w);
  ctx.restore();
}

function fallbackEffects(ctx: Context2D, frame: SceneFrame): void {
  const view = frame.view;
  if (!view) return;
  const projectEffect = (effect: TypeBeforeDeathEffectView): TypeBeforeDeathProjection => frame.project(effectWorldPosition(effect, view, [frame.playerX(), 0.2, PLAYER_Z]));
  for (const effect of view.effects) {
    const progress = effectProgress(effect, frame.reducedMotion);
    const position = projectEffect(effect);
    if (!position.visible) continue;
    const intensity = clampTypeBeforeDeath(finite(effect.intensity, 1), 0, 2);
    const customTint = Boolean(effect.color);
    const tint = effect.color ?? (effect.kind === "overdrive" ? "#8feaff" : effect.kind === "death" ? "#c73132" : "#ffd18b");
    ctx.save();
    ctx.globalAlpha = (1 - progress) * 0.86;
    ctx.strokeStyle = tint;
    ctx.fillStyle = tint;
    if (effect.kind === "muzzle") {
      const flash = 1 - progress;
      const muzzleX = position.x + position.scale * 0.45;
      const muzzleY = position.y - position.scale * 0.22;
      const radius = position.scale * (0.3 + flash * 0.45) * intensity;
      ctx.fillStyle = customTint ? tint : "#ffc35a";
      ctx.beginPath(); ctx.arc(muzzleX, muzzleY, radius, 0, TAU); ctx.fill();
      if (effect.shotType === "buckshot") {
        for (const pellet of [-1, 0, 1]) {
          ctx.beginPath();
          ctx.arc(muzzleX + pellet * radius * 0.7, muzzleY + Math.abs(pellet) * radius * 0.25, radius * 0.28, 0, TAU);
          ctx.fill();
        }
      }
      ctx.strokeStyle = customTint ? tint : "#fff0bb";
      ctx.lineWidth = Math.max(1, position.scale * 0.045);
      for (let index = 0; index < (frame.low ? 4 : 7); index++) {
        const angle = index * TAU / 7;
        ctx.beginPath(); ctx.moveTo(muzzleX, muzzleY); ctx.lineTo(muzzleX + Math.cos(angle) * radius * 1.8, muzzleY + Math.sin(angle) * radius * 1.8); ctx.stroke();
      }
    } else if (effect.kind === "impact" || effect.kind === "overdrive") {
      const flash = 1 - progress;
      const impactTint = customTint || effect.kind === "overdrive" ? tint : "#d8443d";
      const radius = position.scale * (effect.kind === "overdrive" ? 0.7 + flash * 2.5 : 0.3 + flash * 1.2) * intensity * (effect.shotType === "headshot" ? 1.35 : 1);
      ctx.strokeStyle = impactTint;
      ctx.lineWidth = Math.max(1.5, position.scale * 0.06);
      ctx.beginPath(); ctx.ellipse(position.x, position.y, radius, radius * 0.3, 0, 0, TAU); ctx.stroke();
      if (effect.kind === "impact") {
        ctx.fillStyle = customTint ? tint : "#f05a43";
        ctx.globalAlpha *= 0.35;
        ctx.beginPath(); ctx.arc(position.x, position.y, Math.max(1.5, radius * 0.16), 0, TAU); ctx.fill();
        ctx.globalAlpha *= 2.85;
        for (let index = 0; index < (frame.low ? 4 : 7); index++) {
          const angle = index * TAU / 7 + finite(effect.seed, 0);
          ctx.beginPath(); ctx.moveTo(position.x, position.y); ctx.lineTo(position.x + Math.cos(angle) * radius * 0.9, position.y + Math.sin(angle) * radius * 0.45); ctx.stroke();
        }
      }
    } else if (effect.kind === "death") {
      for (let index = 0; index < (frame.low ? 5 : 10); index++) {
        const angle = index * TAU / 10 + finite(effect.seed, 0);
        const radius = position.scale * (0.16 + (1 - progress) * 0.72) * intensity;
        const size = Math.max(2, position.scale * 0.06);
        ctx.fillStyle = !customTint && index % 4 === 0 ? "#ff4f39" : tint;
        ctx.fillRect(position.x + Math.cos(angle) * radius, position.y + Math.sin(angle) * radius, size, size * 0.72);
      }
    }
    ctx.restore();
  }
  if (view.overdrive > 0.01) {
    const player = frame.project([frame.playerX(), 0, PLAYER_Z]);
    if (player.visible) {
      ctx.save(); ctx.globalAlpha = clampTypeBeforeDeath(view.overdrive, 0, 1) * 0.7; ctx.strokeStyle = "#7ee9ff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(player.x, player.y, player.scale * 1.1, player.scale * 0.4, 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
  }
  const healthRatio = clampTypeBeforeDeath(view.maxHealth > 0 ? view.health / view.maxHealth : 0, 0, 1);
  if (healthRatio < 0.38) {
    const player = frame.project([frame.playerX(), 0, PLAYER_Z]);
    if (player.visible) {
      ctx.save(); ctx.globalAlpha = (0.38 - healthRatio) * 1.7; ctx.strokeStyle = "#f04d52"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(player.x, player.y, player.scale * 1.16, player.scale * 0.42, 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
  }
}

function drawFallback(ctx: Context2D, frame: SceneFrame): void {
  backdrop2D(ctx, frame);
  const view = frame.view;
  if (!view) return;
  const enemies = [...view.enemies].sort((a, b) => a.progress - b.progress).slice(-10);
  for (const enemy of enemies) character2D(ctx, frame, typeBeforeDeathEnemyPosition(enemy), characterStyle(enemy.kind), { hitFlash: enemy.hitFlash });
  if (view.boss?.active) character2D(ctx, frame, bossPosition(view.boss), characterStyle(view.boss.kind ?? "boss", true), { boss: true, hitFlash: view.boss.hitFlash });
  character2D(ctx, frame, [frame.playerX(), 0, PLAYER_Z], PLAYER_STYLE, { player: true, hitFlash: view.player.hitFlash ?? 0 });
  const barricade = clampTypeBeforeDeath(view.barricade, 0, 1);
  if (barricade < 0.98) {
    const damage = 1 - barricade;
    const anchor = frame.project([0, 0, 1.05]);
    if (anchor.visible) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.86, damage);
      ctx.strokeStyle = "#e0584f";
      ctx.lineWidth = Math.max(1.5, anchor.scale * 0.065);
      for (let index = 0; index < (frame.low ? 2 : 4); index++) {
        const x = anchor.x + (index - 1.5) * anchor.scale * 0.52;
        ctx.beginPath(); ctx.moveTo(x, anchor.y - anchor.scale * 0.22); ctx.lineTo(x + anchor.scale * 0.18, anchor.y + anchor.scale * 0.35); ctx.stroke();
      }
      ctx.restore();
    }
  }
  fallbackEffects(ctx, frame);
  if (!frame.reducedMotion) {
    ctx.save();
    ctx.strokeStyle = "#5d90ab";
    ctx.globalAlpha = frame.low ? 0.18 : 0.27;
    ctx.lineWidth = 1;
    const count = frame.low ? 26 : 50;
    for (let index = 0; index < count; index++) {
      const x = noise(index * 4.1) * frame.width;
      const y = (noise(index * 9.7) * frame.height + frame.time * (0.035 + noise(index) * 0.04)) % frame.height;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 11 + noise(index * 2) * 10); ctx.stroke();
    }
    ctx.restore();
  }
  // A restrained vignette keeps the fallback's typing labels readable.
  const vignette = ctx.createRadialGradient(frame.width * 0.5, frame.height * 0.52, frame.height * 0.18, frame.width * 0.5, frame.height * 0.52, frame.height * 0.82);
  vignette.addColorStop(0, "#00000000");
  vignette.addColorStop(1, "#02050bd9");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, frame.width, frame.height);
}

/** Canvas renderer remains useful on browsers without WebGL or after context loss. */
export function createCanvasTypeBeforeDeathRenderer(canvas: HTMLCanvasElement, options: TypeBeforeDeathRendererOptions): TypeBeforeDeathSceneRenderer {
  let context: Context2D | null = null;
  try { context = canvas.getContext("2d", { alpha: false }); } catch { context = null; }
  const frame = new SceneFrame(options);
  let ratio = 1;
  let disposed = false;
  const renderer: TypeBeforeDeathSceneRenderer = {
    mode: "fallback",
    resize(width, height, dpr) {
      if (disposed) return;
      frame.resize(width, height, options.quality);
      ratio = clampTypeBeforeDeath(dpr, 1, frame.low ? 1 : 1.5);
      canvas.width = Math.max(1, Math.round(frame.width * ratio));
      canvas.height = Math.max(1, Math.round(frame.height * ratio));
    },
    render(view, now) {
      if (disposed) return;
      frame.update(view, now);
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.globalAlpha = 1;
      drawFallback(context, frame);
    },
    projectEnemy(enemy) { return frame.projectEnemy(enemy); },
    projectBoss(boss) { return frame.projectBoss(boss); },
    dispose() {
      if (disposed) return;
      disposed = true;
      context = null;
      frame.view = null;
    },
  };
  options.onMode?.("fallback");
  return renderer;
}

/** Try WebGL for a host and fall back to Canvas in one lazy-friendly factory. */
export function createTypeBeforeDeathRenderer(webglCanvas: HTMLCanvasElement, fallbackCanvas: HTMLCanvasElement, options: TypeBeforeDeathRendererOptions): TypeBeforeDeathSceneRenderer {
  try {
    return createWebGLTypeBeforeDeathRenderer(webglCanvas, options);
  } catch {
    return createCanvasTypeBeforeDeathRenderer(fallbackCanvas, options);
  }
}

// Naming aliases keep the renderer easy to discover beside the game's component.
export const createTypeBeforeDeathWebGLRenderer = createWebGLTypeBeforeDeathRenderer;
export const createFallbackTypeBeforeDeathRenderer = createCanvasTypeBeforeDeathRenderer;
