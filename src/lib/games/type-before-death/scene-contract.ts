/**
 * The scene is deliberately independent from the Type Before Death combat
 * engine. The controller can project its state into this small, serializable
 * view model without making the renderer know about game rules.
 */

export type TypeBeforeDeathRenderMode = "webgl" | "fallback";
export type TypeBeforeDeathRenderQuality = "auto" | "low" | "high";

export interface TypeBeforeDeathEnemyView {
  readonly id: string | number;
  /** A stable archetype name, for example `runner`, `brute`, or `shooter`. */
  readonly kind: string;
  /** 0 is the distant end of the road; 1 is the player barricade. */
  readonly progress: number;
  readonly hp: number;
  readonly maxHp: number;
  /** Number of characters already entered in word. */
  readonly typed: number;
  readonly word: string;
  readonly targeted: boolean;
  /** A short-lived normalized flash amount, normally 0..1. */
  readonly hitFlash: number;
  /** Optional world-space lane. -1, 0, and 1 are left, centre, and right. */
  readonly lane?: number;
  /** Optional world-space horizontal position, overriding lane. */
  readonly x?: number;
}

export interface TypeBeforeDeathPlayerView {
  /** World-space horizontal position. If omitted, the centre lane is used. */
  readonly x?: number;
  readonly lane?: number;
  readonly hitFlash?: number;
  readonly aiming?: boolean;
}

export interface TypeBeforeDeathBossView {
  readonly active: boolean;
  readonly name?: string;
  readonly kind?: string;
  readonly progress?: number;
  readonly hp: number;
  readonly maxHp: number;
  readonly hitFlash: number;
  readonly targeted?: boolean;
  readonly word?: string;
  readonly typed?: number;
}

export type TypeBeforeDeathEffectKind =
  | "muzzle"
  | "impact"
  | "overdrive"
  | "death"
  | "ember"
  | "rain"
  | "camera-shake"
  | (string & {});

export interface TypeBeforeDeathEffectView {
  readonly id?: string | number;
  readonly kind: TypeBeforeDeathEffectKind;
  /** Optional world-space location. */
  readonly x?: number;
  readonly z?: number;
  readonly lane?: number;
  readonly progress?: number;
  readonly enemyId?: string | number;
  /** Normalized lifetime, if the controller already has one. */
  readonly life?: number;
  readonly elapsedMs?: number;
  readonly durationMs?: number;
  readonly intensity?: number;
  readonly seed?: number;
  readonly color?: string;
}

export interface TypeBeforeDeathSceneView {
  readonly enemies: readonly TypeBeforeDeathEnemyView[];
  readonly player: TypeBeforeDeathPlayerView;
  readonly boss: TypeBeforeDeathBossView | null;
  /** Normalized Overdrive charge/active intensity. */
  readonly overdrive: number;
  readonly health: number;
  readonly maxHealth: number;
  /** 1 is intact, 0 is destroyed. */
  readonly barricade: number;
  readonly effects: readonly TypeBeforeDeathEffectView[];
  readonly reducedMotion: boolean;
  readonly quality: TypeBeforeDeathRenderQuality;
  /** Optional controller-provided cinematic emphasis. */
  readonly camera?: {
    readonly x?: number;
    readonly z?: number;
    readonly zoom?: number;
    readonly shake?: number;
  };
}

/** Alias used by controllers that call the projection a scene state. */
export type TypeBeforeDeathSceneState = TypeBeforeDeathSceneView;

export interface TypeBeforeDeathProjection {
  /** CSS-pixel coordinates relative to the scene host. */
  readonly x: number;
  readonly y: number;
  /** Positive camera-space depth. */
  readonly depth: number;
  /** Approximate CSS pixels per world unit at this depth. */
  readonly scale: number;
  readonly visible: boolean;
}

export function clampTypeBeforeDeath(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}
