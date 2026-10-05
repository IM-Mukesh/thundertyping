import type { EnemyClass, WarEffect, WarEnemy, WarStage, WarState } from "./types";

export type WarRenderMode = "webgl" | "fallback";
export type WarRenderQuality = "auto" | "low" | "high";
export interface WarRendererOptions {
  quality: WarRenderQuality;
  reducedMotion: boolean;
}
export interface WarProjection {
  /** CSS pixels, relative to the canvas. */
  x: number;
  y: number;
  depth: number;
  scale: number;
  visible: boolean;
}
export interface WarSceneRenderer {
  readonly mode: WarRenderMode;
  resize(width: number, height: number, dpr: number): void;
  /** now is the RAF monotonic timestamp; combat state is never mutated. */
  render(state: WarState, stage: WarStage, now: number): void;
  projectEnemy(enemy: WarEnemy): WarProjection;
  dispose(): void;
}

type Vec3 = readonly [number, number, number];
type Color = readonly [number, number, number];
type Mat4 = Float32Array;
type Context2D = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const STRIDE = 11;
const MAX_VERTICES = 72_000;
const MAX_ENEMIES = 6;
const BOX_FACES = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 4, 7, 3], [1, 2, 6, 5], [3, 7, 6, 2], [0, 1, 5, 4]] as const;
const HERO_POSITION: Vec3 = [-1.35, 0, 2.6];
const BOSS_POSITION: Vec3 = [0, 0, -10];
const EMPTY_PROJECTION: WarProjection = { x: 0, y: 0, depth: 0, scale: 0, visible: false };

export function clampWar(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

/** Lanes are zero-based: 0 = left, 1 = centre, 2 = right. */
export function warEnemyPosition(lane: number, progress: number): Vec3 {
  return [(clampWar(lane, 0, 2) - 1) * 2.65, 0, -34 + clampWar(progress, 0, 1) * 36];
}

function noise(value: number): number {
  const n = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}
function color(hex: string): Color {
  const raw = hex.replace("#", "");
  const expanded = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  if (!/^[0-9a-f]{6,8}$/i.test(expanded)) return [0.18, 0.22, 0.28];
  return [parseInt(expanded.slice(0, 2), 16) / 255, parseInt(expanded.slice(2, 4), 16) / 255, parseInt(expanded.slice(4, 6), 16) / 255];
}
function mix(a: Color, b: Color, amount: number): Color {
  return [a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount, a[2] + (b[2] - a[2]) * amount];
}
function css(c: Color): string { return `rgb(${c.map((v) => Math.round(clampWar(v, 0, 1) * 255)).join(", ")})`; }
function identity(): Mat4 { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); }
function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  }
  return out;
}
function transform(parent: Mat4, position: Vec3, rx = 0, ry = 0, rz = 0, scale = 1): Mat4 {
  const sx = Math.sin(rx), cx = Math.cos(rx), sy = Math.sin(ry), cy = Math.cos(ry), sz = Math.sin(rz), cz = Math.cos(rz);
  const t = new Float32Array([
    cy * cz * scale, (cx * sz + sx * sy * cz) * scale, (sx * sz - cx * sy * cz) * scale, 0,
    -cy * sz * scale, (cx * cz - sx * sy * sz) * scale, (sx * cz + cx * sy * sz) * scale, 0,
    sy * scale, -sx * cy * scale, cx * cy * scale, 0,
    position[0], position[1], position[2], 1,
  ]);
  return multiply(parent, t);
}
function point(matrix: Mat4, p: Vec3): Vec3 {
  return [matrix[0] * p[0] + matrix[4] * p[1] + matrix[8] * p[2] + matrix[12], matrix[1] * p[0] + matrix[5] * p[1] + matrix[9] * p[2] + matrix[13], matrix[2] * p[0] + matrix[6] * p[1] + matrix[10] * p[2] + matrix[14]];
}
function normalize(v: Vec3): Vec3 {
  const length = Math.hypot(...v) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}
function cross(a: Vec3, b: Vec3): Vec3 { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function dot(a: Vec3, b: Vec3): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function viewMatrix(eye: Vec3, target: Vec3): Mat4 {
  const z = normalize([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]);
  const x = normalize(cross([0, 1, 0], z)), y = cross(z, x);
  return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1]);
}
function perspective(aspect: number): Mat4 {
  const f = 1 / Math.tan(48 * Math.PI / 360), near = 0.35, far = 100;
  return new Float32Array([f / Math.max(0.1, aspect), 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0]);
}

/** Column-major view-projection matrix, suitable for WebGL and CPU labels. */
export function projectWarPoint(p: Vec3, viewProjection: ArrayLike<number>, width: number, height: number): WarProjection {
  const m = viewProjection;
  const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
  if (!Number.isFinite(w) || w <= 0.35 || width <= 0 || height <= 0) return EMPTY_PROJECTION;
  const nx = (m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12]) / w;
  const ny = (m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13]) / w;
  const nz = (m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]) / w;
  return { x: (nx + 1) * width / 2, y: (1 - ny) * height / 2, depth: w, scale: height / (2 * Math.tan(48 * Math.PI / 360) * w), visible: Number.isFinite(nx + ny + nz) && Math.abs(nx) < 1.18 && ny > -1.12 && ny < 1.12 && nz >= -1 && nz <= 1 };
}

/** Interleaved flat-shaded geometry, uploaded as a single draw batch. */
class Geometry {
  readonly data = new Float32Array(MAX_VERTICES * STRIDE);
  count = 0;
  clear(): void { this.count = 0; }
  triangle(a: Vec3, b: Vec3, c: Vec3, tint: Color, emission = 0, alpha = 1): void {
    if (this.count + 3 > MAX_VERTICES) return;
    const n = normalize(cross([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [c[0] - a[0], c[1] - a[1], c[2] - a[2]]));
    for (const p of [a, b, c]) {
      const offset = this.count++ * STRIDE;
      this.data[offset] = p[0]; this.data[offset + 1] = p[1]; this.data[offset + 2] = p[2];
      this.data[offset + 3] = n[0]; this.data[offset + 4] = n[1]; this.data[offset + 5] = n[2];
      this.data[offset + 6] = tint[0]; this.data[offset + 7] = tint[1]; this.data[offset + 8] = tint[2];
      this.data[offset + 9] = alpha; this.data[offset + 10] = emission;
    }
  }
  quad(a: Vec3, b: Vec3, c: Vec3, d: Vec3, tint: Color, emission = 0, alpha = 1): void {
    this.triangle(a, b, c, tint, emission, alpha);
    this.triangle(a, c, d, tint, emission, alpha);
  }
  box(matrix: Mat4, center: Vec3, size: Vec3, tint: Color, emission = 0, alpha = 1): void {
    const [x, y, z] = center, [w, h, d] = size;
    const vertices = [
      [-w, -h, -d], [w, -h, -d], [w, h, -d], [-w, h, -d],
      [-w, -h, d], [w, -h, d], [w, h, d], [-w, h, d],
    ].map((v) => point(matrix, [x + v[0] / 2, y + v[1] / 2, z + v[2] / 2]));
    for (const [a, b, c, d] of BOX_FACES) this.quad(vertices[a], vertices[b], vertices[c], vertices[d], tint, emission, alpha);
  }
  pyramid(matrix: Mat4, center: Vec3, width: number, height: number, depth: number, tint: Color, emission = 0, alpha = 1): void {
    const [x, y, z] = center;
    const base: Vec3[] = [[x - width / 2, y, z - depth / 2], [x + width / 2, y, z - depth / 2], [x + width / 2, y, z + depth / 2], [x - width / 2, y, z + depth / 2]];
    const tip = point(matrix, [x, y + height, z]);
    for (let i = 0; i < 4; i++) this.triangle(point(matrix, base[i]), tip, point(matrix, base[(i + 1) % 4]), tint, emission, alpha);
  }
  ring(center: Vec3, radius: number, thickness: number, tint: Color, alpha = 1, segments = 32, tilt = 0): void {
    for (let i = 0; i < segments; i++) {
      const a = i * TAU / segments, b = (i + 1) * TAU / segments;
      const at = (angle: number, r: number): Vec3 => [center[0] + Math.cos(angle) * r, center[1] + Math.sin(angle) * r * tilt, center[2] + Math.sin(angle) * r];
      this.quad(at(a, radius), at(b, radius), at(b, radius + thickness), at(a, radius + thickness), tint, 0.85, alpha);
    }
  }
}

interface WarriorLook {
  scale: number;
  breadth: number;
  skin: Color;
  armor: Color;
  cloth: Color;
  steel: Color;
  glow: Color;
  helmet: "open" | "closed" | "hood" | "crown";
  weapon: "sword" | "axe" | "daggers" | "staff" | "greatsword";
  shield: boolean;
  hunch: number;
  floats: number;
  burning?: boolean;
  wings?: boolean;
  heavy?: boolean;
}
const WARRIORS: Record<EnemyClass, WarriorLook> = {
  "fallen-soldier": { scale: 1, breadth: 1, skin: color("#a3aaa1"), armor: color("#59666b"), cloth: color("#77623c"), steel: color("#c2c4b0"), glow: color("#b7ceba"), helmet: "open", weapon: "sword", shield: true, hunch: 0.05, floats: 0 },
  "zombie-warrior": { scale: 1.04, breadth: 1.15, skin: color("#7c8b68"), armor: color("#754c39"), cloth: color("#4e5140"), steel: color("#939d94"), glow: color("#bbbc79"), helmet: "open", weapon: "axe", shield: false, hunch: 0.28, floats: 0 },
  "wraith": { scale: 1.15, breadth: 0.74, skin: color("#b5bdcd"), armor: color("#42455f"), cloth: color("#292a49"), steel: color("#aeb7d5"), glow: color("#c2a6fa"), helmet: "hood", weapon: "sword", shield: false, hunch: 0.07, floats: 0.2 },
  "possessed-human": { scale: 0.96, breadth: 0.88, skin: color("#b99c86"), armor: color("#5c4350"), cloth: color("#772f45"), steel: color("#bcc1c6"), glow: color("#ea6587"), helmet: "open", weapon: "daggers", shield: false, hunch: 0.14, floats: 0 },
  "shadow-soldier": { scale: 1.08, breadth: 1.04, skin: color("#6c8291"), armor: color("#253846"), cloth: color("#182b37"), steel: color("#87a4b8"), glow: color("#76d5e3"), helmet: "closed", weapon: "sword", shield: true, hunch: 0, floats: 0 },
  "burning-undead": { scale: 1.06, breadth: 0.86, skin: color("#76625b"), armor: color("#574a44"), cloth: color("#713627"), steel: color("#bb8860"), glow: color("#ffab47"), helmet: "open", weapon: "sword", shield: false, hunch: 0.2, floats: 0, burning: true },
  "armored-revenant": { scale: 1.16, breadth: 1.34, skin: color("#9a9b92"), armor: color("#7a7e83"), cloth: color("#444c63"), steel: color("#d0c39c"), glow: color("#d2bd83"), helmet: "closed", weapon: "greatsword", shield: true, hunch: 0.04, floats: 0, heavy: true },
  "flying-wraith": { scale: 1.1, breadth: 0.71, skin: color("#bad3d2"), armor: color("#487477"), cloth: color("#315d63"), steel: color("#c2eeee"), glow: color("#91e8da"), helmet: "hood", weapon: "sword", shield: false, hunch: 0.05, floats: 1.1, wings: true },
  "necromancer": { scale: 1.12, breadth: 0.84, skin: color("#afb59b"), armor: color("#49564c"), cloth: color("#39324e"), steel: color("#b1aa7c"), glow: color("#a4e8a1"), helmet: "crown", weapon: "staff", shield: false, hunch: 0.11, floats: 0 },
  "giant-revenant": { scale: 1.55, breadth: 1.32, skin: color("#9c9787"), armor: color("#665f55"), cloth: color("#69453a"), steel: color("#b8a170"), glow: color("#dfa25e"), helmet: "crown", weapon: "greatsword", shield: false, hunch: 0.09, floats: 0, heavy: true },
};
const HERO: WarriorLook = { scale: 1.07, breadth: 1.08, skin: color("#c3a58a"), armor: color("#7d8995"), cloth: color("#922f32"), steel: color("#e0c083"), glow: color("#ffe4b3"), helmet: "open", weapon: "sword", shield: false, hunch: 0, floats: 0, heavy: true };

interface BodyPose {
  position: Vec3;
  time: number;
  seed: number;
  hero?: boolean;
  boss?: boolean;
  low?: boolean;
  still?: boolean;
  attack?: number;
  stagger?: number;
  fall?: number;
  alpha?: number;
  frost?: boolean;
}
interface SwordPose { grip: Vec3; tip: Vec3; }

/** Every unit has a head, torso, shoulder/elbow arms and hip/knee legs. */
function humanoid(batch: Geometry | null, look: WarriorLook, pose: BodyPose): SwordPose {
  const { hero = false, low = false } = pose;
  const alpha = pose.alpha ?? 1, s = look.scale * (pose.boss ? 1.65 : 1), width = look.breadth;
  const gait = pose.still ? 0 : Math.sin(pose.time * (look.heavy ? 0.0036 : 0.005) + pose.seed * 1.7);
  const float = look.floats + (look.floats && !pose.still ? Math.sin(pose.time * 0.002 + pose.seed) * 0.08 : 0);
  const fall = pose.fall ?? 0, stagger = pose.stagger ?? 0;
  const attack = pose.attack ?? -1;
  const swing = attack >= 0 ? Math.sin(clampWar(attack, 0, 1) * Math.PI) : 0;
  const root = transform(identity(), [pose.position[0], pose.position[1] + float - fall * 0.35, pose.position[2]], -look.hunch - stagger * 0.3 + fall * 1.45, hero ? swing * -0.5 : Math.PI, stagger * 0.12 + fall * 0.4, s);
  const armor = pose.frost ? mix(look.armor, color("#c0efff"), 0.45) : look.armor;
  const steel = look.steel;
  const box = (m: Mat4, p: Vec3, size: Vec3, tint: Color, emission = 0) => batch?.box(m, p, size, tint, emission, alpha);
  const torso = transform(root, [0, 1.32, 0], hero ? swing * 0.08 : 0, hero ? swing * 0.45 : 0);
  box(torso, [0, 0.28, 0], [0.64 * width, 0.79, 0.36], armor);
  box(torso, [0, 0.13, -0.2], [0.43 * width, 0.59, 0.07], mix(armor, steel, 0.22));
  box(torso, [0, -0.15, 0], [0.66 * width, 0.12, 0.43], steel);
  box(torso, [0, -0.18, -0.235], [0.12, 0.13, 0.055], steel);
  box(torso, [0, -0.42, -0.185], [0.26, 0.46, 0.045], look.cloth);
  if (look.weapon === "staff" || look.weapon === "axe") {
    const sidearm = transform(torso, [-0.36 * width, -0.1, 0.09], 0, 0, -0.15);
    box(sidearm, [0, -0.37, 0], [0.08, 0.69, 0.055], steel);
    box(sidearm, [0, 0.02, 0], [0.23, 0.045, 0.075], steel);
    box(sidearm, [0, 0.1, 0], [0.065, 0.14, 0.065], look.cloth);
  }
  if (!low) {
    for (const side of [-1, 1]) box(torso, [side * 0.2 * width, -0.35, 0], [0.22 * width, 0.28, 0.4], armor);
    box(torso, [0, 0.57, -0.25], [0.18, 0.13, 0.055], steel);
    if (look.burning) for (const side of [-1, 1]) box(torso, [side * 0.13, 0.24, -0.245], [0.025, 0.46, 0.02], look.glow, 0.95);
  }

  const head = transform(torso, [0, 0.86, 0], 0.04 + stagger * 0.22, hero ? swing * -0.3 : Math.sin(pose.seed) * 0.1);
  box(head, [0, 0, 0], [0.34, 0.41, 0.32], look.skin);
  box(head, [0, -0.04, -0.19], [0.065, 0.1, 0.07], look.skin);
  box(head, [0, -0.2, 0], [0.17, 0.16, 0.19], armor);
  if (look.helmet === "hood") {
    box(head, [0, 0.16, 0.015], [0.49, 0.18, 0.42], look.cloth);
    for (const side of [-1, 1]) box(head, [side * 0.205, -0.025, 0.015], [0.11, 0.43, 0.37], look.cloth);
    box(head, [0, 0.03, 0.17], [0.43, 0.42, 0.09], look.cloth);
  } else if (look.helmet === "closed") {
    box(head, [0, 0.08, 0], [0.44, 0.41, 0.4], armor);
    box(head, [0, -0.1, -0.19], [0.38, 0.13, 0.06], steel);
    box(head, [0, 0.03, -0.211], [0.27, 0.035, 0.015], look.glow, 0.95);
  } else if (look.helmet === "crown") {
    box(head, [0, 0.19, 0], [0.4, 0.12, 0.37], steel);
    for (const side of [-1, 1]) batch?.pyramid(head, [side * 0.16, 0.23, 0], 0.12, 0.32, 0.13, steel, 0, alpha);
    if (look.heavy) for (const side of [-1, 1]) box(transform(head, [side * 0.26, 0.16, 0], 0, 0, -side * 0.7), [0, 0.1, 0], [0.09, 0.37, 0.1], steel);
  } else {
    box(head, [0, 0.15, 0.03], [0.41, 0.19, 0.38], armor);
    box(head, [0, 0.16, -0.2], [0.075, 0.25, 0.04], steel);
    if (hero || look.shield) for (const side of [-1, 1]) box(head, [side * 0.17, -0.1, -0.01], [0.065, 0.24, 0.31], armor);
  }
  if (look.helmet !== "closed") for (const side of [-1, 1]) box(head, [side * 0.085, 0.015, -0.17], [0.058, 0.035, 0.025], hero ? color("#1e262b") : look.glow, hero ? 0 : 0.8);

  for (const side of [-1, 1]) {
    const legAngle = look.floats > 0.5 ? 0.23 + side * 0.14 : (hero ? 0.12 + side * 0.13 : gait * side * 0.26);
    const hip = transform(root, [side * 0.19 * width, 1.08, 0], legAngle);
    box(hip, [0, -0.24, 0], [0.24 * width, 0.46, 0.26], look.cloth);
    const knee = transform(hip, [0, -0.46, 0], Math.max(0, -legAngle) * 0.65 + (look.floats ? 0.15 : 0));
    box(knee, [0, -0.045, -0.025], [0.28 * width, 0.18, 0.31], armor);
    box(knee, [0, -0.23, 0], [0.22 * width, 0.42, 0.23], armor);
    box(knee, [0, -0.44, -0.065], [0.26 * width, 0.14, 0.4], mix(armor, look.cloth, 0.5));
    // Split robe panels leave both articulated legs visible.
    if (look.helmet === "hood" || look.weapon === "staff") {
      const cloth = transform(root, [side * 0.23, 1.1, 0.12], 0.03 + Math.abs(gait) * 0.06, 0, side * -0.1);
      box(cloth, [0, -0.35, 0], [0.28, 0.75, 0.04], look.cloth);
      if (!low) batch?.triangle(point(cloth, [-0.14, -0.72, 0]), point(cloth, [0.14, -0.72, 0]), point(cloth, [side * 0.07, -0.99, 0.02]), look.cloth, 0, alpha);
    }
  }

  let sword: SwordPose = { grip: pose.position, tip: pose.position };
  for (const side of [-1, 1]) {
    const right = side === 1;
    const shoulderX = hero && right ? 0.25 + swing * 1.5 : (look.weapon === "staff" && right ? 0.32 : gait * side * -0.18 + (look.hunch ? 0.32 : 0.05));
    const shoulder = transform(torso, [side * 0.43 * width, 0.57, 0], shoulderX, hero && right && attack >= 0 ? -0.8 + attack * 1.9 : 0, side * (0.1 + (hero && right ? swing * -0.35 : 0)));
    box(shoulder, [0, -0.02, 0], [0.34 * width, look.heavy ? 0.28 : 0.2, 0.43], armor);
    if (look.heavy && !low) box(shoulder, [side * 0.06, 0.085, 0], [0.29 * width, 0.08, 0.46], steel);
    box(shoulder, [0, -0.22, 0], [0.21 * width, 0.38, 0.22], armor);
    const elbow = transform(shoulder, [0, -0.4, 0], hero && right ? 0.4 + swing * 0.75 : 0.18);
    box(elbow, [0, -0.19, 0], [0.19 * width, 0.35, 0.21], look.skin);
    if (!low) box(elbow, [0, -0.24, -0.015], [0.22 * width, 0.22, 0.23], armor);
    const hand = transform(elbow, [0, -0.41, 0]);
    box(hand, [0, 0, 0], [0.17, 0.16, 0.19], look.skin);
    if (!right && look.shield) {
      box(hand, [-0.08, 0.22, -0.15], [0.55 * width, 0.79, 0.09], armor);
      box(hand, [-0.08, 0.22, -0.21], [0.07, 0.74, 0.04], steel);
      if (!low) box(hand, [-0.08, 0.22, -0.22], [0.36, 0.07, 0.025], steel);
      batch?.triangle(point(hand, [-0.34 * width, -0.17, -0.19]), point(hand, [0.2 * width, -0.17, -0.19]), point(hand, [-0.08, -0.4, -0.19]), armor, 0, alpha);
    }
    if (right || look.weapon === "daggers") {
      const weapon = transform(hand, [0, 0, -0.065], hero ? -0.8 : 0, 0, right ? -0.15 : 0.15);
      if (look.weapon === "staff") {
        box(weapon, [0, 0.5, 0], [0.055, 2.1, 0.055], steel);
        box(weapon, [0, 1.45, 0], [0.18, 0.21, 0.16], look.glow, 0.9);
        for (const branch of [-1, 1]) box(transform(weapon, [branch * 0.11, 1.35, 0], 0, 0, branch * -0.45), [0, 0.12, 0], [0.05, 0.34, 0.05], steel);
      } else if (look.weapon === "axe") {
        box(weapon, [0, 0.38, 0], [0.06, 1.35, 0.06], look.cloth);
        box(weapon, [0.13, 0.86, 0], [0.4, 0.4, 0.08], steel);
        batch?.triangle(point(weapon, [0.33, 1.06, 0]), point(weapon, [0.46, 0.7, 0]), point(weapon, [0.15, 0.66, 0]), steel, 0, alpha);
      } else {
        const length = look.weapon === "daggers" ? 0.63 : look.weapon === "greatsword" ? 1.68 : 1.32;
        const bladeColor = hero ? color("#dce4e9") : steel;
        box(weapon, [0, 0, 0], [0.075, 0.26, 0.07], look.cloth);
        box(weapon, [0, 0.16, 0], [0.34, 0.055, 0.09], steel);
        box(weapon, [0, 0.22 + length / 2, 0], [look.weapon === "greatsword" ? 0.19 : 0.115, length, 0.035], bladeColor, hero || look.burning ? 0.25 : 0);
        batch?.triangle(point(weapon, [-0.06, 0.22 + length, -0.01]), point(weapon, [0.06, 0.22 + length, -0.01]), point(weapon, [0, 0.43 + length, -0.01]), bladeColor, 0.25, alpha);
        if (right) sword = { grip: point(weapon, [0, 0.25, 0]), tip: point(weapon, [0, 0.43 + length, 0]) };
      }
    }
  }

  if (hero || look.helmet === "hood" || look.weapon === "staff") {
    const cape = transform(torso, [0, 0.65, 0.24], -0.14 - (pose.still ? 0 : Math.sin(pose.time * 0.002 + pose.seed) * 0.045));
    const left = point(cape, [-0.34 * width, 0, 0]), right = point(cape, [0.34 * width, 0, 0]);
    const bottomLeft = point(cape, [-0.44 * width, -1.2, 0.18]), bottomRight = point(cape, [0.44 * width, -1.16, 0.23]);
    const fold = point(cape, [0.07, -0.8, 0.3]);
    batch?.triangle(left, right, fold, look.cloth, 0, alpha);
    batch?.triangle(left, fold, bottomLeft, mix(look.cloth, color("#000000"), 0.13), 0, alpha);
    batch?.quad(fold, right, bottomRight, bottomLeft, look.cloth, 0, alpha);
  }
  if (look.wings && !low) for (const side of [-1, 1]) {
    const m = transform(torso, [side * 0.3, 0.4, 0.16], 0, side * 0.1, side * -0.1);
    batch?.triangle(point(m, [0, 0, 0]), point(m, [side * 1.0, -0.3, 0.2]), point(m, [side * 0.7, -1.3, 0.35]), look.cloth, 0.1, alpha * 0.65);
    batch?.triangle(point(m, [0, 0, 0]), point(m, [side * 0.7, -1.3, 0.35]), point(m, [side * 0.18, -1.1, 0.25]), look.glow, 0.4, alpha * 0.3);
  }
  return sword;
}

interface SceneryLights { fires: Vec3[]; rifts: Vec3[]; }

function buildScenery(batch: Geometry, stage: WarStage, low: boolean): SceneryLights {
  batch.clear();
  const lights: SceneryLights = { fires: [], rifts: [] };
  const ground = color(stage.palette.ground), glow = color(stage.palette.glow);
  const stone = mix(ground, color("#9a9993"), 0.35), darkStone = mix(stone, color("#0e1420"), 0.45);
  const wood = color("#4d3c32"), dark = color("#17202b"), metal = color("#737881");
  const box = (p: Vec3, size: Vec3, tint: Color, emission = 0, rotation = 0) => batch.box(transform(identity(), p, 0, rotation), [0, 0, 0], size, tint, emission);
  const pyramid = (p: Vec3, w: number, h: number, d: number, tint: Color, emission = 0) => batch.pyramid(identity(), p, w, h, d, tint, emission);
  const roof = (p: Vec3, w: number, h: number, d: number, tint: Color) => {
    const [x, y, z] = p;
    const a: Vec3 = [x - w / 2, y, z - d / 2], b: Vec3 = [x + w / 2, y, z - d / 2];
    const c: Vec3 = [x + w / 2, y, z + d / 2], e: Vec3 = [x - w / 2, y, z + d / 2];
    const front: Vec3 = [x, y + h, z + d / 2], back: Vec3 = [x, y + h, z - d / 2];
    batch.quad(a, back, front, e, tint);
    batch.quad(b, c, front, back, mix(tint, color("#a8a8a0"), 0.1));
    batch.triangle(a, b, back, tint);
    batch.triangle(e, front, c, tint);
  };
  const standard = (x: number, z: number, tint: Color, height = 4) => {
    box([x, height / 2, z], [0.075, height, 0.075], metal);
    box([x + 0.5, height - 0.3, z], [1.25, 0.065, 0.065], metal);
    batch.quad([x + 0.08, height - 0.3, z], [x + 1.04, height - 0.3, z], [x + 0.95, height - 1.85, z + 0.08], [x + 0.08, height - 1.55, z], tint);
    batch.triangle([x + 0.08, height - 1.55, z], [x + 0.95, height - 1.85, z + 0.08], [x + 0.51, height - 2.16, z + 0.05], tint);
    box([x + 0.52, height - 1.1, z + 0.035], [0.1, 0.65, 0.02], mix(tint, color("#d6bd86"), 0.65));
  };
  const crenels = (x: number, y: number, z: number, count: number, axis: "x" | "z") => {
    for (let i = 0; i < count; i++) box([x + (axis === "x" ? i * 1.1 : 0), y, z - (axis === "z" ? i * 1.1 : 0)], [0.65, 0.8, 0.65], stone);
  };
  const tower = (x: number, z: number, h: number, ruined = false) => {
    box([x, h / 2, z], [3.2, h, 3.2], darkStone);
    for (let level = 1; level < h / 2; level++) {
      box([x, level * 2, z], [3.45, 0.15, 3.45], stone);
      if (!low) for (const side of [-1, 1]) box([x + side * 0.8, level * 2 + 0.6, z + 1.62], [0.35, 0.75, 0.045], dark);
    }
    if (ruined) {
      box([x - 0.75, h + 0.7, z + 0.45], [1.1, 1.4, 2.3], darkStone);
      pyramid([x + 0.7, h, z - 0.7], 1.4, 2.1, 1.2, darkStone);
    } else {
      crenels(x - 1.2, h + 0.3, z + 1.35, 3, "x");
      crenels(x - 1.35, h + 0.3, z + 0.35, 3, "z");
      crenels(x + 1.35, h + 0.3, z + 0.35, 3, "z");
    }
  };

  box([0, -0.18, -29], [85, 0.3, 100], ground);
  box([0, -0.015, -23], [8.8, 0.055, 63], mix(ground, color("#c1b399"), stage.scenery === "forest" ? 0.08 : 0.17));
  for (let i = 0; i < (low ? 14 : 26); i++) {
    const z = 7 - i * (low ? 4.0 : 2.15);
    for (const side of [-1, 1]) box([side * 4.8, 0.07, z], [0.24, 0.19, 0.9], stone);
    if (!low && stage.scenery !== "forest" && stage.scenery !== "village") box([(noise(i + 5) - 0.5) * 5, 0.022, z], [1.2, 0.06, 1.5], mix(ground, stone, 0.2), 0, noise(i) * 0.16);
  }
  for (let i = 0; i < 9; i++) pyramid([(i - 4) * 11, -1, -64 - noise(i) * 14], 16, 9 + noise(i + 11) * 14, 20, mix(color(stage.palette.fog), color(stage.palette.sky), 0.6));

  if (stage.scenery === "village" || stage.scenery === "kingdom") {
    for (let i = 0; i < (low ? 6 : 10); i++) {
      const side = i % 2 ? -1 : 1, z = -2 - Math.floor(i / 2) * 9;
      const x = side * (8.4 + noise(i) * 2.5), h = 2.4 + noise(i + 10) * 0.7;
      box([x, h / 2, z], [4.2, h, 4], stage.scenery === "village" ? mix(wood, stone, 0.2) : darkStone);
      roof([x, h, z], 4.9, 1.6, 4.7, stage.scenery === "village" ? color("#59504c") : color("#543631"));
      box([x, 0.95, z + 2.015], [0.9, 1.9, 0.05], dark);
      for (const offset of [-1.35, 1.35]) {
        box([x + offset, 1.45, z + 2.025], [0.55, 0.65, 0.04], stage.scenery === "kingdom" ? color("#d17839") : color("#c3a969"), 0.5);
        if (!low) box([x + offset, h / 2, z + 2.07], [0.11, h, 0.08], wood);
      }
      box([x + 1.4, h + 0.55, z - 0.8], [0.48, 1.35, 0.5], stone);
      if (stage.scenery === "kingdom") lights.fires.push([x - 1.2, h + 1, z + 0.8]);
      if (stage.scenery === "village" && !low) for (let fence = 0; fence < 4; fence++) box([side * 6.2, 0.48, z + fence * 0.75], [0.09, 0.95, 0.13], wood);
    }
    if (stage.scenery === "village") {
      box([-8, 0.6, 7], [1.7, 1.2, 1.7], stone);
      roof([-8, 2.3, 7], 2.5, 0.9, 2.5, wood);
      for (const side of [-1, 1]) box([-8 + side * 0.8, 1.55, 7], [0.12, 1.65, 0.12], wood);
    } else {
      for (const side of [-1, 1]) tower(side * 7, -43, 8);
      box([0, 7.1, -44], [12, 2.2, 3], stone);
      standard(-5.1, -36, color("#702e37"), 5);
    }
  } else if (stage.scenery === "forest") {
    for (let i = 0; i < (low ? 18 : 32); i++) {
      const side = i % 2 ? -1 : 1, x = side * (6.8 + noise(i + 33) * 12), z = 5 - Math.floor(i / 2) * 3.7;
      const h = 5.5 + noise(i + 50) * 5;
      box([x, h / 2, z], [0.55 + noise(i), h, 0.55], mix(wood, darkStone, 0.3));
      for (let tier = 0; tier < (low ? 2 : 3); tier++) pyramid([x, h * 0.5 + tier * 1.4, z], 3.8 - tier * 0.65, 3.1, 3.4 - tier * 0.55, mix(color("#243e35"), dark, noise(i) * 0.5));
      if (!low && i % 4 === 0) batch.box(transform(identity(), [x, 2.7, z], 0, 0, side * 0.9), [0, 0, 0], [0.15, 2, 0.15], wood);
    }
    for (let i = 0; i < 7; i++) box([i % 2 ? -5.8 : 5.8, 0.14, -i * 7], [1.6, 0.27, 0.7], darkStone, 0, noise(i) * 2);
  } else if (stage.scenery === "battlefield") {
    for (let i = 0; i < (low ? 8 : 16); i++) {
      const side = i % 2 ? -1 : 1, x = side * (6 + noise(i + 50) * 7), z = 5 - i * 3.1;
      if (i % 2 === 0) standard(x, z, i % 4 ? color("#65543b") : color("#682d39"), 3 + noise(i) * 2);
      const m = transform(identity(), [x, 0.22, z + 1.5], 0, noise(i) * Math.PI, 0.11);
      batch.box(m, [0, 0, 0], [1.6, 0.3, 0.8], wood);
      batch.box(m, [0.6, 0.35, 0], [0.6, 0.7, 0.12], metal);
      if (!low) {
        batch.ring([x + 1.2, 0.3, z], 0.44, 0.09, wood, 1, 12, 1);
        batch.box(transform(identity(), [x - 0.4, 0.64, z - 0.9], 0.3, 0, -0.28), [0, 0, 0], [0.08, 1.3, 0.05], metal);
      }
    }
  } else if (stage.scenery === "castle") {
    for (const side of [-1, 1]) {
      box([side * 8, 2.1, -17], [2, 4.2, 53], darkStone);
      box([side * 7, 3.45, -17], [0.7, 0.3, 53], stone);
      crenels(side * 7, 4.45, 8, low ? 24 : 44, "z");
      for (let i = 0; i < 3; i++) tower(side * 9, -4 - i * 17, 6 + i * 0.7);
    }
    box([0, 7.2, -46], [16, 2, 3], darkStone);
    crenels(-7, 8.6, -45, 13, "x");
  } else if (stage.scenery === "city") {
    for (let i = 0; i < (low ? 6 : 10); i++) {
      const x = (i % 2 ? -1 : 1) * (8.2 + noise(i) * 4), z = 3 - Math.floor(i / 2) * 11;
      tower(x, z, 5 + noise(i + 10) * 8, true);
      box([x * 0.77, 0.7, z + 4], [2.2, 1.4, 3.5], darkStone, 0, noise(i) * 1.4);
      if (i % 3 === 0) lights.fires.push([x, 2, z + 1.8]);
    }
  } else if (stage.scenery === "underworld") {
    for (let i = 0; i < (low ? 8 : 12); i++) {
      const side = i % 2 ? -1 : 1, x = side * 7.5, z = 2 - Math.floor(i / 2) * 9;
      box([x, 0.35, z], [2.3, 0.7, 2.3], darkStone);
      box([x, 3.4, z], [1.1, 5.5, 1.1], mix(stone, color("#333350"), 0.6));
      box([x, 6.2, z], [2, 0.55, 2], stone);
      box([x, 3.4, z + 0.56], [0.09, 4.8, 0.025], glow, 0.7);
      lights.rifts.push([x + side * 1.9, 0.06, z - 2]);
      batch.quad([x + side, 0.045, z - 3], [x + side * 3, 0.045, z - 1], [x + side * 2.7, 0.045, z - 0.7], [x + side * 0.8, 0.045, z - 2.7], glow, 0.85);
    }
    box([0, 7, -48], [17, 1.4, 3], darkStone);
  } else {
    // Final-war gate: an enormous broken obsidian arch and inward horns.
    for (const side of [-1, 1]) {
      box([side * 6.2, 5.2, -33], [3.1, 10.4, 3.8], darkStone);
      box([side * 6.2, 0.55, -33], [4.2, 1.1, 4.6], stone);
      for (let horn = 0; horn < 4; horn++) batch.box(transform(identity(), [side * (6.2 - horn * 0.36), 10.4 + horn * 0.75, -33], 0, 0, side * 0.3), [0, 0, 0], [1.1 - horn * 0.2, 1.8, 1], stone);
      box([side * 6.2, 5, -30.99], [0.15, 8.7, 0.045], glow, 0.9);
      for (let i = 0; i < (low ? 4 : 7); i++) {
        const x = side * (7 + noise(i) * 3), z = 4 - i * 6.2;
        pyramid([x, 0, z], 1.4, 3.2 + noise(i + 10) * 2.6, 1.4, darkStone);
        if (i % 2 === 0) standard(x + side * 1.8, z, color("#762d39"), 4);
      }
    }
    box([0, 10.2, -33], [13.5, 1.6, 3.6], darkStone);
    batch.ring([0, 0.065, -15], 4.1, 0.085, glow, 0.65, low ? 24 : 48);
    lights.rifts.push([0, 2.4, -34]);
    for (const x of [-5.8, 5.8]) lights.fires.push([x, 10.2, -32]);
  }
  if (stage.scenery !== "forest") for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const x = side * 5.35, z = -3 - i * 13;
    box([x, 0.85, z], [0.15, 1.7, 0.15], wood);
    box([x, 1.65, z], [0.33, 0.16, 0.33], metal);
    lights.fires.push([x, 1.78, z]);
  }
  return lights;
}

interface VisualEffect extends WarEffect { start: number; }
interface Corpse { enemy: WarEnemy; start: number; }

class SceneFrame {
  width = 1;
  height = 1;
  low = false;
  time = 0;
  extrapolation = 0;
  view = identity();
  viewProjection = identity();
  effects: VisualEffect[] = [];
  corpses: Corpse[] = [];
  state: WarState | null = null;
  stage: WarStage | null = null;
  private sampleScene = -1;
  private sampleNow = 0;
  private stageKey = "";
  private seen = new Set<number>();
  private history = new Map<number, { enemy: WarEnemy; seen: number }>();

  readonly options: WarRendererOptions;
  constructor(options: WarRendererOptions) { this.options = options; }

  resize(width: number, height: number): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.low = this.options.quality === "low" || (this.options.quality === "auto" && width < 760);
  }

  update(state: WarState, stage: WarStage, now: number): void {
    const key = `${stage.id}:${stage.scenery}`;
    if (state.sceneMs < this.sampleScene || key !== this.stageKey) {
      this.effects = [];
      this.corpses = [];
      this.history.clear();
      this.seen.clear();
      this.sampleScene = -1;
      this.stageKey = key;
    }
    if (state.sceneMs !== this.sampleScene) { this.sampleNow = now; this.sampleScene = state.sceneMs; }
    const moving = ["playing", "boss", "boss-intro", "finisher", "intro", "tutorial"].includes(state.phase);
    this.extrapolation = moving ? clampWar(now - this.sampleNow, 0, 120) : 0;
    this.time = state.sceneMs + this.extrapolation;
    this.state = state;
    this.stage = stage;
    const current = new Set(state.enemies.map((e) => e.id));
    for (const effect of state.effects.slice(-40)) {
      if (this.seen.has(effect.id)) continue;
      this.seen.add(effect.id);
      const start = this.time - clampWar(state.sceneMs - effect.at, 0, 2_000);
      this.effects.push({ ...effect, start });
      if (effect.kind === "kill") {
        let victim: WarEnemy | null = effect.enemyId ? this.history.get(effect.enemyId)?.enemy ?? null : null, distance = victim ? 0 : Infinity;
        if (!effect.enemyId) for (const { enemy } of this.history.values()) {
          const d = Math.abs(enemy.lane - effect.lane) * 4 + Math.abs(enemy.progress - effect.progress) + (current.has(enemy.id) ? 2 : 0);
          if (d < distance && !this.corpses.some((c) => c.enemy.id === enemy.id)) { victim = enemy; distance = d; }
        }
        const snapshot: WarEnemy = victim && distance < 0.35 ? { ...victim, progress: effect.progress } : {
          id: effect.enemyId ?? -effect.id, kind: effect.enemyClass ?? stage.enemies[0] ?? "fallen-soldier", word: "", lane: effect.lane,
          progress: effect.progress, travelMs: 1, hp: 0, maxHp: 1, elite: false, typed: 0,
          highWater: 0, bornAt: effect.at, lastHitAt: effect.at,
        };
        this.corpses.push({ enemy: snapshot, start });
      }
    }
    while (this.seen.size > 128) this.seen.delete(this.seen.values().next().value!);
    this.effects = this.effects.filter((e) => this.time - e.start < (e.kind === "special" ? 1_450 : 650)).slice(-(this.low ? 14 : 28));
    this.corpses = this.corpses.filter((c) => this.time - c.start < (this.options.reducedMotion ? 650 : 1_250)).slice(-(this.low ? 6 : 12));
    for (const enemy of state.enemies.slice(0, 96)) this.history.set(enemy.id, { enemy: { ...enemy }, seen: this.time });
    for (const [id, entry] of this.history) if (this.time - entry.seen > 2_000 || this.history.size > 96) this.history.delete(id);

    let focus = 0, orbit = 0;
    if (!this.options.reducedMotion) {
      if (state.phase === "boss-intro") focus = clampWar(state.phaseTimeMs / 1_200, 0, 1);
      if (state.phase === "boss") focus = 0.18;
      if (state.phase === "finisher") { focus = 0.62; orbit = Math.sin((this.cinematicProgress() || this.finisherProgress()) * Math.PI) * 0.9; }
    }
    const sway = this.options.reducedMotion || state.phase === "paused" || this.low ? 0 : Math.sin(this.time * 0.0004) * 0.045;
    const narrowDistance = Math.max(0, 1.3 - this.width / this.height) * 7;
    const eye: Vec3 = [0.8 + orbit + sway, 4.15 - focus * 0.4, 10.5 - focus * 1.0 + narrowDistance];
    this.view = viewMatrix(eye, [0, 1.5 + focus * 1.8, -12]);
    this.viewProjection = multiply(perspective(this.width / this.height), this.view);
  }

  enemyPosition(enemy: WarEnemy): Vec3 {
    const speed = this.state?.frostMs ? 0.35 : 1;
    const progress = enemy.progress + (enemy.travelMs > 0 ? this.extrapolation / enemy.travelMs * speed : 0);
    return warEnemyPosition(enemy.lane, progress);
  }
  project(p: Vec3): WarProjection { return projectWarPoint(p, this.viewProjection, this.width, this.height); }
  projectEnemy(enemy: WarEnemy): WarProjection {
    const p = this.enemyPosition(enemy), look = WARRIORS[enemy.kind];
    return this.project([p[0], p[1] + 2.7 * look.scale + look.floats, p[2]]);
  }
  heroAttack(): number {
    if (this.state?.phase === "finisher") {
      if (this.state.boss && this.state.boss.typed === this.state.boss.text.length) return clampWar((this.state.phaseTimeMs + this.extrapolation) / 520, 0, 1);
      const progress = this.finisherProgress();
      return progress > 0.82 ? clampWar((progress - 0.82) / 0.18, 0, 1) : 0.16 + progress * 0.22;
    }
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i], age = this.time - e.start;
      if ((e.kind === "attack" || e.kind === "boss-hit") && age >= 0 && age < 430) return age / 430;
    }
    return -1;
  }
  stagger(enemy?: WarEnemy): number {
    let strength = 0;
    for (const effect of this.effects) {
      const age = this.time - effect.start;
      if (age < 0 || age > 300) continue;
       const relevant = enemy ? effect.kind === "attack" && (effect.enemyId ? effect.enemyId === enemy.id : effect.lane === enemy.lane && Math.abs(effect.progress - enemy.progress) < 0.075) : effect.kind === "boss-hit";
      if (relevant) strength = Math.max(strength, Math.sin(age / 300 * Math.PI) * (this.options.reducedMotion ? 0.3 : 1));
    }
    return strength;
  }
  finisherProgress(): number {
    const boss = this.state?.boss;
    return boss && boss.text.length ? clampWar(boss.typed / boss.text.length, 0, 1) : clampWar((this.state?.phaseTimeMs ?? 0) / 2_200, 0, 1);
  }
  cinematicProgress(): number {
    return this.state?.phase === "finisher" && this.state.boss && this.state.boss.typed === this.state.boss.text.length ? clampWar((this.state.phaseTimeMs + this.extrapolation) / 1_250, 0, 1) : 0;
  }
  bossLook(): WarriorLook {
    const stage = this.stage!;
    const base = stage.scenery === "forest" || stage.scenery === "underworld" ? WARRIORS.necromancer : WARRIORS["armored-revenant"];
    return { ...base, scale: 1.24, breadth: 1.3, heavy: true, helmet: "crown", shield: false, armor: mix(base.armor, color(stage.palette.glow), 0.15), glow: color(stage.palette.glow), cloth: mix(base.cloth, color(stage.palette.glow), 0.13) };
  }
  clear(): void { this.effects = []; this.corpses = []; this.history.clear(); this.seen.clear(); this.state = null; this.stage = null; }
}

function drawEffects(batch: Geometry, frame: SceneFrame, lights: SceneryLights): void {
  const { state, stage, time, low, options } = frame;
  if (!state || !stage) return;
  const subtle = options.reducedMotion, warm = color("#ffb967"), ice = color("#a4e5ff"), glow = color(stage.palette.glow);
  const flameCount = low || subtle ? 1 : 3;
  for (const [index, fire] of lights.fires.slice(0, low ? 8 : 18).entries()) for (let i = 0; i < flameCount; i++) {
    const pulse = subtle ? 0.6 : 0.55 + Math.sin(time * 0.008 + index * 2 + i) * 0.18;
    const m = transform(identity(), [fire[0] + (i - 1) * 0.1, fire[1], fire[2]], 0, time * 0.0003 + i);
    batch.pyramid(m, [0, 0, 0], 0.2 + i * 0.03, pulse + i * 0.12, 0.2, i ? warm : color("#ffd7a0"), 1, 0.85);
  }
  if (!low && !subtle) for (const [i, rift] of lights.rifts.slice(0, 6).entries()) {
    const y = 0.5 + (time * 0.001 + i * 0.7) % 2.5;
    batch.pyramid(identity(), [rift[0], rift[1] + y, rift[2]], 0.07, 0.14, 0.07, glow, 1, 0.7);
  }
  const attack = frame.heroAttack();
  if (attack >= 0 && attack < 1) {
    const count = low || subtle ? 2 : 6;
    for (let i = 0; i < count; i++) {
      const a = Math.max(0, attack - i * 0.022), b = Math.max(0, a - 0.04);
      const previous = humanoid(null, HERO, { position: HERO_POSITION, time, seed: 0, hero: true, still: true, attack: b });
      const current = humanoid(null, HERO, { position: HERO_POSITION, time, seed: 0, hero: true, still: true, attack: a });
      batch.quad(previous.grip, previous.tip, current.tip, current.grip, i ? warm : color("#fff1ca"), 1, (1 - i / (count + 1)) * (subtle ? 0.3 : 0.65));
    }
  }
  for (const effect of frame.effects) {
    const age = time - effect.start;
    if (age < 0) continue;
    const p = effect.kind === "boss-hit" ? BOSS_POSITION : warEnemyPosition(effect.lane, effect.progress);
    if ((effect.kind === "attack" || effect.kind === "boss-hit") && age < 250) {
      const y = effect.kind === "boss-hit" ? 2.7 : 1.5;
      const fade = 1 - age / 250;
      batch.quad([p[0] - 0.34, y + 0.4, p[2] + 0.32], [p[0] + 0.33, y - 0.28, p[2] + 0.32], [p[0] + 0.3, y - 0.32, p[2] + 0.34], [p[0] - 0.39, y + 0.38, p[2] + 0.34], color("#fff3cf"), 1, fade);
      if (!subtle) for (let i = 0; i < (low ? 3 : 7); i++) {
        const angle = noise(effect.id * 31 + i) * TAU, travel = age * 0.004;
        batch.pyramid(identity(), [p[0] + Math.cos(angle) * travel, y + Math.sin(angle) * travel, p[2] + 0.45], 0.035, 0.09, 0.035, warm, 1, fade);
      }
    }
    if (effect.kind === "special" && age < 1_300) {
      const progress = age / 1_300, tint = effect.special === "frost" ? ice : effect.special === "ember" ? warm : color("#e9d4a6");
      const radius = subtle ? 4 + progress : 0.7 + progress * 17;
      batch.ring([0, 0.1, 1.8], radius, low ? 0.16 : 0.24, tint, (1 - progress) * 0.8, low || subtle ? 24 : 48);
      if (effect.special === "frost") {
        for (let i = 0; i < (low || subtle ? 6 : 14); i++) {
          const angle = i * TAU / (low || subtle ? 6 : 14);
          batch.pyramid(identity(), [Math.cos(angle) * radius, 0.04, 1.8 + Math.sin(angle) * radius], 0.12, 0.45 * (1 - progress), 0.14, ice, 0.8, 1 - progress);
        }
      } else if (effect.special === "ember") {
        for (let i = 0; i < (low || subtle ? 5 : 15); i++) {
          const angle = i * TAU / (low || subtle ? 5 : 15);
          batch.pyramid(identity(), [Math.cos(angle) * radius, 0.08, 1.8 + Math.sin(angle) * radius], 0.2, 0.9 * (1 - progress), 0.2, warm, 1, 1 - progress);
        }
      } else if (!low && !subtle) batch.ring([0, 0.15, 1.8], Math.max(0.2, radius - 0.7), 0.08, tint, (1 - progress) * 0.4, 40);
    }
  }
  if (state.frostMs > 0) for (const enemy of state.enemies.slice(0, low ? 8 : 16)) {
    const p = frame.enemyPosition(enemy);
    batch.ring([p[0], 0.06, p[2]], 0.45, 0.055, ice, 0.55, 16);
  }
  if (state.boss) {
    batch.ring([0, 0.06, -10], 2.1, 0.09, glow, state.phase === "boss-intro" ? 0.8 : 0.35, low ? 24 : 40);
    if (state.phase === "finisher") {
      const progress = frame.finisherProgress();
      batch.ring([0, 0.15, -10], 2.5 + progress, 0.12 + progress * 0.12, color("#ffe4b0"), 0.75, low ? 24 : 48);
      if (!low && !subtle) for (let i = 0; i < 8; i++) {
        const angle = i * TAU / 8 + progress * 1.6;
        batch.pyramid(identity(), [Math.cos(angle) * 2.6, progress * 2.8, -10 + Math.sin(angle) * 2.6], 0.07, 0.22, 0.07, warm, 1, 0.65);
      }
      const cinematic = frame.cinematicProgress();
      if (cinematic > 0 && cinematic < 0.7) batch.ring([0, 2.1, -10], 0.5 + cinematic * 4, 0.16, color("#fff3ce"), 1 - cinematic, low || subtle ? 24 : 48, subtle ? 0 : 1);
    }
  }
}

function buildActors(batch: Geometry, frame: SceneFrame, lights: SceneryLights): void {
  batch.clear();
  const { state, time, options, low } = frame;
  if (!state) return;
  const still = options.reducedMotion || state.phase === "paused" || state.phase === "menu" || state.phase === "victory" || state.phase === "defeat";
  const enemies = state.enemies.slice().sort((a, b) => Number(b.id === state.targetId) - Number(a.id === state.targetId) || b.progress - a.progress).slice(0, MAX_ENEMIES);
  for (const enemy of enemies) {
    if (!frame.projectEnemy(enemy).visible) continue;
    const position = frame.enemyPosition(enemy);
    humanoid(batch, WARRIORS[enemy.kind], { position, seed: enemy.id, time, low: low || enemy.progress < 0.28, still, stagger: frame.stagger(enemy), frost: state.frostMs > 0 });
    if (enemy.id === state.targetId) batch.ring([position[0], 0.075, position[2]], WARRIORS[enemy.kind].breadth * 0.64, 0.085, color("#ffda87"), 0.9, low ? 16 : 24);
    if (enemy.elite && !low) batch.ring([position[0], 0.08, position[2]], WARRIORS[enemy.kind].breadth * 0.76, 0.035, color("#a57ae2"), 0.65, 20);
    if (WARRIORS[enemy.kind].burning && !low && !options.reducedMotion) for (const side of [-1, 1]) batch.pyramid(identity(), [position[0] + side * 0.35, 1.95, position[2]], 0.12, 0.28 + Math.sin(time * 0.007 + enemy.id) * 0.05, 0.13, WARRIORS[enemy.kind].glow, 1, 0.7);
  }
  for (const corpse of frame.corpses) {
    const age = (time - corpse.start) / (options.reducedMotion ? 650 : 1_250);
    if (age < 0) continue;
    humanoid(batch, WARRIORS[corpse.enemy.kind], { position: warEnemyPosition(corpse.enemy.lane, corpse.enemy.progress), seed: corpse.enemy.id, time, low: true, still: true, fall: options.reducedMotion ? 0.75 : clampWar(age * 2.7, 0, 1), alpha: 1 - age });
  }
  if (state.boss) {
    const cinematic = frame.cinematicProgress();
    humanoid(batch, frame.bossLook(), { position: BOSS_POSITION, time, seed: 991, boss: true, low, still, stagger: frame.stagger(), fall: options.reducedMotion ? 0 : Math.min(0.8, cinematic), alpha: state.phase === "victory" ? 0 : 1 - cinematic });
  }
  humanoid(batch, HERO, { position: HERO_POSITION, time, seed: 0, hero: true, low, still: true, attack: frame.heroAttack(), stagger: state.phase === "defeat" ? 0.9 : 0 });
  drawEffects(batch, frame, lights);
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
  // Ordered non-gore dissolve: depth-tested opaque fragments, no sorting.
  vec2 p = mod(floor(gl_FragCoord.xy), 4.0);
  float threshold = mod(p.x * 2.0 + p.y * 3.0, 4.0) * 0.25
    + mod(floor(p.x * 0.5) + floor(p.y * 0.5) * 2.0, 4.0) * 0.0625;
  if (vColor.a <= threshold) discard;
  vec3 normal = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
  float sunlight = max(0.0, dot(normal, normalize(vec3(-0.45, 0.85, 0.5))));
  float rim = max(0.0, dot(normal, normalize(vec3(0.7, 0.3, -0.7))));
  vec3 lighting = vec3(0.42, 0.47, 0.55) + vec3(0.8, 0.72, 0.57) * sunlight
    + vec3(0.13, 0.24, 0.34) * rim;
  vec3 lit = vColor.rgb * mix(lighting, vec3(1.4), clamp(vEmission, 0.0, 1.0));
  float fog = smoothstep(14.0, 64.0, vDepth) * 0.92;
  gl_FragColor = vec4(mix(lit, uFog, fog), 1.0);
}`;

/** Throws only during setup/render; the scene boundary replaces it with Canvas. */
export function createWebGLWarRenderer(canvas: HTMLCanvasElement, options: WarRendererOptions): WarSceneRenderer {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: options.quality !== "low", depth: true, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: "low-power" });
  if (!gl) throw new Error("WebGL unavailable");
  const shaders: WebGLShader[] = [], buffers: WebGLBuffer[] = [];
  let program: WebGLProgram | null = null;
  let disposed = false;
  const release = () => {
    for (const buffer of buffers) gl.deleteBuffer(buffer);
    for (const shader of shaders) gl.deleteShader(shader);
    if (program) gl.deleteProgram(program);
    buffers.length = 0;
    shaders.length = 0;
    program = null;
  };
  try {
    for (const [kind, source] of [[gl.VERTEX_SHADER, VERTEX_SHADER], [gl.FRAGMENT_SHADER, FRAGMENT_SHADER]] as const) {
      const shader = gl.createShader(kind);
      if (!shader) throw new Error("Unable to allocate scene shader");
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error("Scene shader compilation failed");
    }
    program = gl.createProgram();
    if (!program) throw new Error("Unable to allocate scene program");
    for (const shader of shaders) gl.attachShader(program, shader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Scene shader linking failed");
    for (const shader of shaders) { gl.detachShader(program, shader); gl.deleteShader(shader); }
    shaders.length = 0;
    for (let i = 0; i < 2; i++) {
      const buffer = gl.createBuffer();
      if (!buffer) throw new Error("Unable to allocate scene geometry");
      buffers.push(buffer);
    }
    const linkedProgram = program;
    const position = gl.getAttribLocation(program, "aPosition"), normal = gl.getAttribLocation(program, "aNormal"), tint = gl.getAttribLocation(program, "aColor"), emission = gl.getAttribLocation(program, "aEmission");
    const viewProjection = gl.getUniformLocation(program, "uViewProjection"), view = gl.getUniformLocation(program, "uView"), fog = gl.getUniformLocation(program, "uFog");
    if ([position, normal, tint, emission].some((i) => i < 0) || !viewProjection || !view || !fog) throw new Error("Scene shader interface unavailable");
    const frame = new SceneFrame(options), scenery = new Geometry(), actors = new Geometry();
    let sceneryKey = "", lights: SceneryLights = { fires: [], rifts: [] };
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[1]);
    gl.bufferData(gl.ARRAY_BUFFER, actors.data.byteLength, gl.DYNAMIC_DRAW);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);
    const drawBatch = (buffer: WebGLBuffer, count: number) => {
      if (!count) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      for (const [attribute, size, offset] of [[position, 3, 0], [normal, 3, 3], [tint, 4, 6], [emission, 1, 10]]) {
        gl.enableVertexAttribArray(attribute);
        gl.vertexAttribPointer(attribute, size, gl.FLOAT, false, STRIDE * 4, offset * 4);
      }
      gl.drawArrays(gl.TRIANGLES, 0, count);
    };
    return {
      mode: "webgl",
      resize(width, height, dpr) {
        if (disposed) return;
        frame.resize(width, height);
        const ratio = clampWar(dpr, 1, frame.low ? 1 : 1.5);
        canvas.width = Math.max(1, Math.round(frame.width * ratio));
        canvas.height = Math.max(1, Math.round(frame.height * ratio));
        gl.viewport(0, 0, canvas.width, canvas.height);
      },
      render(state, stage, now) {
        if (disposed) return;
        if (gl.isContextLost()) throw new Error("Scene context lost");
        frame.update(state, stage, now);
        const key = `${stage.id}:${stage.scenery}:${Object.values(stage.palette).join(":")}:${frame.low}`;
        if (key !== sceneryKey) {
          lights = buildScenery(scenery, stage, frame.low);
          gl.bindBuffer(gl.ARRAY_BUFFER, buffers[0]);
          gl.bufferData(gl.ARRAY_BUFFER, scenery.data.subarray(0, scenery.count * STRIDE), gl.STATIC_DRAW);
          sceneryKey = key;
        }
        buildActors(actors, frame, lights);
        const sky = color(stage.palette.sky);
        gl.clearColor(sky[0], sky[1], sky[2], 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(linkedProgram);
        gl.uniformMatrix4fv(viewProjection, false, frame.viewProjection);
        gl.uniformMatrix4fv(view, false, frame.view);
        gl.uniform3f(fog, ...color(stage.palette.fog));
        drawBatch(buffers[0], scenery.count);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers[1]);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, actors.data.subarray(0, actors.count * STRIDE));
        drawBatch(buffers[1], actors.count);
        const error = gl.getError();
        if (error !== gl.NO_ERROR) throw new Error("Scene graphics unavailable");
      },
      projectEnemy: (enemy) => frame.projectEnemy(enemy),
      dispose() {
        if (disposed) return;
        disposed = true;
        release();
        frame.clear();
        scenery.clear();
        actors.clear();
      },
    };
  } catch (error) {
    release();
    throw error;
  }
}

function polygon2D(ctx: Context2D, points: readonly (readonly [number, number])[], fill: string): void {
  if (points.length < 3 || points.some((p) => !Number.isFinite(p[0] + p[1]))) return;
  ctx.beginPath();
  points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}
function worldPolygon2D(ctx: Context2D, frame: SceneFrame, vertices: readonly Vec3[], tint: Color): void {
  const projected = vertices.map((p) => frame.project(p));
  if (projected.some((p) => p.depth <= 0.35)) return;
  polygon2D(ctx, projected.map((p) => [p.x, p.y]), css(tint));
}
function box2D(ctx: Context2D, frame: SceneFrame, p: Vec3, size: Vec3, tint: Color): void {
  const [x, y, z] = p, [w, h, d] = size;
  worldPolygon2D(ctx, frame, [[x - w / 2, y + h / 2, z - d / 2], [x + w / 2, y + h / 2, z - d / 2], [x + w / 2, y + h / 2, z + d / 2], [x - w / 2, y + h / 2, z + d / 2]], mix(tint, color("#bbc4cd"), 0.18));
  worldPolygon2D(ctx, frame, [[x - w / 2, y - h / 2, z + d / 2], [x + w / 2, y - h / 2, z + d / 2], [x + w / 2, y + h / 2, z + d / 2], [x - w / 2, y + h / 2, z + d / 2]], tint);
  const side = x > 0 ? -1 : 1;
  worldPolygon2D(ctx, frame, [[x + side * w / 2, y - h / 2, z - d / 2], [x + side * w / 2, y - h / 2, z + d / 2], [x + side * w / 2, y + h / 2, z + d / 2], [x + side * w / 2, y + h / 2, z - d / 2]], mix(tint, color("#050a12"), 0.25));
}

function backdrop2D(ctx: Context2D, frame: SceneFrame, stage: WarStage): void {
  const { width: w, height: h } = frame;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, stage.palette.sky);
  sky.addColorStop(0.6, stage.palette.fog);
  sky.addColorStop(1, stage.palette.ground);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const ground = color(stage.palette.ground), stone = mix(ground, color("#8d9299"), 0.32), wood = color("#54463c"), glow = color(stage.palette.glow);
  for (let i = 0; i < 10; i++) polygon2D(ctx, [[i * w / 8 - w / 7, h * 0.52], [i * w / 8, h * (0.22 + noise(i) * 0.18)], [i * w / 8 + w / 7, h * 0.52]], css(mix(color(stage.palette.sky), color(stage.palette.fog), 0.3)));
  worldPolygon2D(ctx, frame, [[-50, -0.02, -75], [50, -0.02, -75], [50, -0.02, 7], [-50, -0.02, 7]], ground);
  worldPolygon2D(ctx, frame, [[-4.8, 0, -65], [4.8, 0, -65], [4.8, 0, 7], [-4.8, 0, 7]], mix(ground, color("#bcc3bd"), 0.09));
  for (const x of [-1.33, 1.33]) worldPolygon2D(ctx, frame, [[x - 0.025, 0.01, -53], [x + 0.025, 0.01, -53], [x + 0.025, 0.01, 6], [x - 0.025, 0.01, 6]], mix(ground, color("#d8c39d"), 0.36));

  if (stage.scenery === "demon") {
    for (const side of [-1, 1]) {
      box2D(ctx, frame, [side * 6, 5, -34], [2.9, 10, 3.4], stone);
      worldPolygon2D(ctx, frame, [[side * 7.3, 9, -32], [side * 4.4, 14, -32], [side * 5.3, 10, -32]], stone);
      box2D(ctx, frame, [side * 6, 5, -32.2], [0.13, 8, 0.1], glow);
    }
    box2D(ctx, frame, [0, 9.5, -34], [12, 1.5, 3.4], stone);
  }
  if (stage.scenery === "castle") for (const side of [-1, 1]) {
    box2D(ctx, frame, [side * 8, 1.8, -21], [2, 3.6, 50], stone);
    for (let i = 18; i >= 0; i--) box2D(ctx, frame, [side * 7.2, 4, 3 - i * 2.4], [0.6, 0.8, 0.7], stone);
  }
  for (let i = 7; i >= 0; i--) for (const side of [-1, 1]) {
    const z = 3 - i * 7, x = side * (7.6 + noise(i + 10) * 2);
    if (stage.scenery === "village" || stage.scenery === "kingdom") {
      const tint = stage.scenery === "village" ? wood : stone;
      box2D(ctx, frame, [x, 1.4, z], [3.8, 2.8, 3.5], tint);
      worldPolygon2D(ctx, frame, [[x - 2.2, 2.7, z + 1.8], [x + 2.2, 2.7, z + 1.8], [x, 4.3, z + 1.8]], mix(tint, color("#3b2429"), 0.4));
      box2D(ctx, frame, [x - 0.9, 1.45, z + 1.78], [0.48, 0.6, 0.05], glow);
      box2D(ctx, frame, [x + 0.5, 1, z + 1.78], [0.78, 2, 0.06], color("#1a2025"));
      if (stage.scenery === "kingdom") worldPolygon2D(ctx, frame, [[x - 1, 3.5, z], [x + 0.4, 3.5, z], [x - 0.3, 5 + Math.sin(frame.time * 0.004 + i) * (frame.options.reducedMotion ? 0 : 0.3), z]], color("#ef9b4e"));
    } else if (stage.scenery === "forest") {
      box2D(ctx, frame, [x, 3, z], [0.55, 6, 0.5], wood);
      for (let tier = 0; tier < 2; tier++) worldPolygon2D(ctx, frame, [[x - 2 + tier * 0.3, 2.4 + tier * 1.6, z + 0.1], [x + 2 - tier * 0.3, 2.4 + tier * 1.6, z + 0.1], [x, 6.1 + tier * 1.3, z + 0.1]], color("#263d33"));
    } else if (stage.scenery === "battlefield" || stage.scenery === "demon") {
      box2D(ctx, frame, [x, 2.1, z], [0.075, 4.2, 0.075], stone);
      worldPolygon2D(ctx, frame, [[x, 4, z], [x + 1.2, 4, z], [x + 1, 2.3, z], [x, 2.5, z]], i % 2 ? color("#6e3340") : color("#726343"));
      box2D(ctx, frame, [x + side, 0.22, z + 1.2], [1.5, 0.44, 0.7], wood);
    } else if (stage.scenery === "castle" || stage.scenery === "city") {
      const height = stage.scenery === "city" ? 5 + noise(i) * 6 : 6;
      box2D(ctx, frame, [x + side * 1.5, height / 2, z], [2.7, height, 2.7], stone);
      for (let level = 1; level < height / 2; level++) box2D(ctx, frame, [x + side * 1.5, level * 2, z + 1.38], [0.45, 0.7, 0.04], color("#171d29"));
      if (stage.scenery === "city") worldPolygon2D(ctx, frame, [[x + side * 1.5 - 1.3, height, z], [x + side * 1.5 + 1.3, height, z], [x + side * 1.5 - 0.8, height + 1.8, z]], stone);
    } else {
      box2D(ctx, frame, [x, 3.1, z], [0.85, 6.2, 0.85], stone);
      box2D(ctx, frame, [x, 6.1, z], [1.9, 0.5, 1.9], stone);
      box2D(ctx, frame, [x, 0.25, z], [1.9, 0.5, 1.9], stone);
      box2D(ctx, frame, [x, 3.2, z + 0.43], [0.06, 4.5, 0.02], glow);
      worldPolygon2D(ctx, frame, [[x, 0.03, z], [x + side * 3, 0.03, z - 2], [x + side * 2.7, 0.03, z - 1.8]], glow);
    }
  }
}

function warrior2D(ctx: Context2D, frame: SceneFrame, look: WarriorLook, pose: BodyPose): void {
  const projected = frame.project([pose.position[0], look.floats, pose.position[2]]);
  if (!projected.visible || projected.scale <= 0) return;
  const scale = projected.scale * look.scale * (pose.boss ? 1.65 : 1), width = look.breadth;
  const armor = css(pose.frost ? mix(look.armor, color("#b2e1f5"), 0.4) : look.armor), cloth = css(look.cloth), steel = css(look.steel), skin = css(look.skin);
  const gait = pose.still ? 0 : Math.sin(pose.time * 0.004 + pose.seed);
  const attack = pose.attack ?? -1, swing = attack >= 0 ? Math.sin(attack * Math.PI) : 0;
  ctx.save();
  ctx.globalAlpha = clampWar(pose.alpha ?? 1, 0, 1);
  ctx.translate(projected.x, projected.y);
  ctx.scale(scale, -scale);
  ctx.rotate((pose.fall ?? 0) * 1.35 + (pose.stagger ?? 0) * 0.11);
  const rect = (x: number, y: number, w: number, h: number, fill: string) => { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); };
  if (look.wings) for (const side of [-1, 1]) polygon2D(ctx, [[side * 0.25, 1.85], [side * 1.25, 1.4], [side * 0.75, 0.2]], cloth);
  if (pose.hero || look.helmet === "hood" || look.weapon === "staff") polygon2D(ctx, [[-0.3 * width, 1.96], [0.3 * width, 1.96], [0.48 * width, 0.4], [-0.43 * width, 0.35]], cloth);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 0.19 * width, 1.06);
    ctx.rotate(pose.hero ? side * 0.16 : gait * side * 0.18);
    rect(-0.12 * width, -0.48, 0.24 * width, 0.48, cloth);
    ctx.translate(0, -0.46);
    ctx.rotate(Math.max(0, gait * -side) * 0.14);
    rect(-0.13 * width, -0.45, 0.26 * width, 0.46, armor);
    rect(-0.15 * width, -0.58, 0.32 * width, 0.17, armor);
    ctx.restore();
  }
  rect(-0.31 * width, 1.12, 0.62 * width, 0.79, armor);
  rect(-0.22 * width, 1.31, 0.44 * width, 0.52, css(mix(look.armor, look.steel, 0.17)));
  rect(-0.34 * width, 1.1, 0.68 * width, 0.1, steel);
  if (pose.hero) polygon2D(ctx, [[-0.26 * width, 1.9], [0.26 * width, 1.9], [0.39 * width, 0.55], [-0.35 * width, 0.49]], cloth);
  else rect(-0.12, 0.75, 0.24, 0.39, cloth);
  if (look.helmet === "hood" || look.weapon === "staff") for (const side of [-1, 1]) polygon2D(ctx, [[side * 0.12, 1.18], [side * 0.33, 1.18], [side * 0.39, 0.25], [side * 0.1, 0.36]], cloth);
  rect(-0.16, 1.96, 0.32, 0.4, skin);
  if (look.helmet === "hood") {
    rect(-0.24, 2.31, 0.48, 0.15, cloth);
    for (const side of [-1, 1]) rect(side * 0.17 - 0.045, 1.96, 0.09, 0.43, cloth);
  } else if (look.helmet === "closed") {
    rect(-0.21, 1.96, 0.42, 0.48, armor);
    rect(-0.14, 2.16, 0.28, 0.04, css(look.glow));
    rect(-0.18, 2.01, 0.36, 0.1, steel);
  } else {
    rect(-0.21, 2.3, 0.42, 0.16, armor);
    if (look.helmet === "crown") for (const side of [-1, 1]) polygon2D(ctx, [[side * 0.14 - 0.05, 2.44], [side * 0.14 + 0.05, 2.44], [side * 0.18, 2.7]], steel);
    if (!pose.hero) for (const side of [-1, 1]) rect(side * 0.075 - 0.025, 2.16, 0.055, 0.035, css(look.glow));
  }
  for (const side of [-1, 1]) {
    const right = side === 1;
    ctx.save();
    ctx.translate(side * 0.4 * width, 1.79);
    ctx.rotate(pose.hero && right ? -0.2 + swing * 1.8 : side * 0.12 - gait * side * 0.15);
    rect(-0.17 * width, -0.1, 0.34 * width, look.heavy ? 0.26 : 0.2, armor);
    rect(-0.105 * width, -0.4, 0.21 * width, 0.38, armor);
    ctx.translate(0, -0.4);
    ctx.rotate(pose.hero && right ? swing * -0.6 : 0.08);
    rect(-0.095 * width, -0.37, 0.19 * width, 0.35, skin);
    rect(-0.11 * width, -0.3, 0.22 * width, 0.18, armor);
    rect(-0.085, -0.49, 0.17, 0.17, skin);
    if (!right && look.shield) {
      polygon2D(ctx, [[-0.29 * width, 0.03], [0.23 * width, 0.03], [0.23 * width, -0.56], [-0.03, -0.84], [-0.29 * width, -0.56]], armor);
      rect(-0.06, -0.62, 0.07, 0.66, steel);
    }
    if (right || look.weapon === "daggers") {
      ctx.translate(0, -0.43);
      ctx.rotate(right ? -0.22 : 0.22);
      if (look.weapon === "staff") {
        rect(-0.03, -0.5, 0.06, 2.1, steel);
        polygon2D(ctx, [[-0.14, 1.53], [0, 1.77], [0.14, 1.53], [0, 1.36]], css(look.glow));
      } else if (look.weapon === "axe") {
        rect(-0.025, -0.22, 0.05, 1.4, cloth);
        polygon2D(ctx, [[-0.05, 1.12], [0.35, 1.16], [0.5, 0.79], [0.05, 0.65]], steel);
      } else {
        const length = look.weapon === "daggers" ? 0.57 : look.weapon === "greatsword" ? 1.55 : 1.3;
        rect(-0.035, -0.12, 0.07, 0.26, cloth);
        rect(-0.18, 0.13, 0.36, 0.045, steel);
        polygon2D(ctx, [[-0.06, 0.18], [0.06, 0.18], [0.06, length], [0, length + 0.22], [-0.06, length]], pose.hero ? "#e9eef0" : steel);
      }
    }
    ctx.restore();
  }
  if (look.burning) for (const side of [-1, 1]) polygon2D(ctx, [[side * 0.35 - 0.07, 1.82], [side * 0.35 + 0.07, 1.82], [side * 0.35, 2.15]], css(look.glow));
  ctx.restore();
}

function effects2D(ctx: Context2D, frame: SceneFrame): void {
  const state = frame.state;
  if (!state) return;
  for (const effect of frame.effects) {
    const age = frame.time - effect.start;
    if (age < 0) continue;
    const world = effect.kind === "boss-hit" ? BOSS_POSITION : warEnemyPosition(effect.lane, effect.progress);
    if ((effect.kind === "attack" || effect.kind === "boss-hit") && age < 250) {
      const p = frame.project([world[0], effect.kind === "boss-hit" ? 2.5 : 1.55, world[2]]);
      if (!p.visible) continue;
      ctx.save();
      ctx.globalAlpha = 1 - age / 250;
      ctx.strokeStyle = "#ffe6af";
      ctx.lineWidth = Math.max(1.5, p.scale * 0.065);
      ctx.beginPath(); ctx.moveTo(p.x - p.scale * 0.28, p.y - p.scale * 0.34); ctx.lineTo(p.x + p.scale * 0.3, p.y + p.scale * 0.23); ctx.stroke();
      ctx.restore();
    }
    if (effect.kind === "special" && age < 1_300) {
      const p = frame.project([0, 0.08, 1.8]), progress = age / 1_300;
      const radius = p.scale * (frame.options.reducedMotion ? 4 + progress : 0.6 + progress * 9);
      ctx.save();
      ctx.globalAlpha = (1 - progress) * 0.7;
      ctx.strokeStyle = effect.special === "frost" ? "#a9e7ff" : effect.special === "ember" ? "#ffc27b" : "#eee1bc";
      ctx.lineWidth = effect.special === "ember" ? 4 : 2;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, radius, radius * 0.25, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    }
  }
  if (frame.heroAttack() >= 0 && frame.heroAttack() < 1) {
    const p = frame.project([HERO_POSITION[0], 1.45, HERO_POSITION[2]]);
    ctx.save();
    ctx.globalAlpha = frame.options.reducedMotion ? 0.2 : 0.45;
    ctx.strokeStyle = "#ffe0a3"; ctx.lineWidth = frame.low ? 2 : 4;
    ctx.beginPath(); ctx.ellipse(p.x + p.scale * 0.35, p.y, p.scale * 0.9, p.scale * 0.65, -0.5, -1.8, -0.2 + Math.sin(frame.heroAttack() * Math.PI) * 1.5); ctx.stroke();
    ctx.restore();
  }
  const cinematic = frame.cinematicProgress();
  if (cinematic > 0 && cinematic < 0.8) {
    const p = frame.project([0, 2.1, -10]);
    ctx.save(); ctx.globalAlpha = 1 - cinematic; ctx.strokeStyle = "#fff0bf"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, p.scale * (0.5 + cinematic * 4), p.scale * (0.5 + cinematic * 4) * (frame.options.reducedMotion ? 0.25 : 1), 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }
}

/** Separate canvas is necessary: a WebGL canvas cannot later acquire 2D. */
export function createTacticalWarRenderer(canvas: HTMLCanvasElement, options: WarRendererOptions): WarSceneRenderer {
  let ctx: Context2D | null = null;
  try { ctx = canvas.getContext("2d", { alpha: false }); } catch { /* DOM words still provide the playable targeting layer. */ }
  const frame = new SceneFrame(options);
  let ratio = 1, disposed = false;
  return {
    mode: "fallback",
    resize(width, height, dpr) {
      if (disposed) return;
      frame.resize(width, height);
      ratio = clampWar(dpr, 1, frame.low ? 1 : 1.5);
      canvas.width = Math.max(1, Math.round(frame.width * ratio));
      canvas.height = Math.max(1, Math.round(frame.height * ratio));
    },
    render(state, stage, now) {
      if (disposed) return;
      frame.update(state, stage, now);
      if (!ctx) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.globalAlpha = 1;
      backdrop2D(ctx, frame, stage);
      const still = options.reducedMotion || ["paused", "menu", "victory", "defeat"].includes(state.phase);
      for (const corpse of frame.corpses) {
        const progress = (frame.time - corpse.start) / (options.reducedMotion ? 650 : 1_250);
        warrior2D(ctx, frame, WARRIORS[corpse.enemy.kind], { position: warEnemyPosition(corpse.enemy.lane, corpse.enemy.progress), seed: corpse.enemy.id, time: frame.time, still: true, fall: options.reducedMotion ? 0.75 : clampWar(progress * 2.7, 0, 1), alpha: 1 - progress });
      }
      if (state.boss) warrior2D(ctx, frame, frame.bossLook(), { position: BOSS_POSITION, seed: 991, time: frame.time, boss: true, still, stagger: frame.stagger(), fall: options.reducedMotion ? 0 : frame.cinematicProgress() * 0.8, alpha: state.phase === "victory" ? 0 : 1 - frame.cinematicProgress() });
      for (const enemy of state.enemies.slice().sort((a, b) => a.progress - b.progress).slice(-MAX_ENEMIES)) {
        const position = frame.enemyPosition(enemy);
        warrior2D(ctx, frame, WARRIORS[enemy.kind], { position, seed: enemy.id, time: frame.time, still, stagger: frame.stagger(enemy), frost: state.frostMs > 0 });
        if (enemy.id === state.targetId) {
          const p = frame.project(position);
          ctx.strokeStyle = "#ffdb91"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(p.x, p.y, Math.max(3, p.scale * 0.6), Math.max(2, p.scale * 0.15), 0, 0, TAU); ctx.stroke();
        }
      }
      warrior2D(ctx, frame, HERO, { position: HERO_POSITION, seed: 0, time: frame.time, hero: true, still: true, attack: frame.heroAttack(), stagger: state.phase === "defeat" ? 0.6 : 0 });
      effects2D(ctx, frame);
    },
    projectEnemy: (enemy) => frame.projectEnemy(enemy),
    dispose() { if (disposed) return; disposed = true; frame.clear(); ctx = null; },
  };
}
