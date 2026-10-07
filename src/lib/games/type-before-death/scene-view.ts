import type { TypeBeforeDeathRenderQuality, TypeBeforeDeathSceneView } from "@/lib/games/type-before-death/scene-contract";
import type { DeathState } from "@/lib/games/type-before-death/types";

const HIT_FLASH_MS = 220;
const EFFECT_DURATION_MS = 900;
const AUTHORED_LANE_COUNT = 5;
const LANE_WORLD_WIDTH = 2.05;
const LATERAL_WORLD_WIDTH = 0.35;

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, Number.isFinite(value) ? value : low));
}

function flash(now: number, lastHitAt: number): number {
  if (!Number.isFinite(lastHitAt) || lastHitAt < 0) return 0;
  return clamp(1 - Math.max(0, now - lastHitAt) / HIT_FLASH_MS, 0, 1);
}

/**
 * The simulation owns five integer lanes (0..4), while the scene contract
 * uses a centred -1..1 lane coordinate. Keep that conversion in the view so
 * both actors and lane-based effects share the same road positions.
 */
function sceneLane(lane: number): number {
  return (clamp(lane, 0, AUTHORED_LANE_COUNT - 1) - 2) / 2;
}

function sceneX(lane: number, lateral: number): number {
  return sceneLane(lane) * LANE_WORLD_WIDTH + clamp(lateral, -1, 1) * LATERAL_WORLD_WIDTH;
}

/**
 * Projects the serializable combat snapshot into the renderer's deliberately
 * smaller view model. Keeping this pure makes visual regressions testable and
 * prevents renderer concerns from leaking back into score rules.
 */
export function deathSceneView(
  state: DeathState,
  reducedMotion: boolean,
  quality: TypeBeforeDeathRenderQuality,
): TypeBeforeDeathSceneView {
  const now = state.sceneMs;
  // A paused snapshot is rendered once, then the scene loop can remain idle.
  // This also makes SceneFrame's animation clock deterministic while the UI
  // promises that enemies, effects and camera movement are frozen.
  const frozen = state.phase === "paused";
  return {
    // Stalkers are intentionally untargetable until they emerge from the mist.
    // Do not leak their labels into the scene while they are hidden.
    enemies: state.enemies.filter((enemy) => enemy.visible).map((enemy) => ({
      id: enemy.id,
      kind: enemy.kind,
      progress: enemy.progress,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      typed: enemy.typed,
      word: enemy.word,
      targeted: enemy.id === state.targetId,
      hitFlash: flash(now, enemy.lastHitAt),
      lane: sceneLane(enemy.lane),
      x: sceneX(enemy.lane, enemy.lateral),
    })),
    player: {
      lane: 0,
      hitFlash: state.effects.some((effect) => effect.kind === "hurt" && now - effect.at < HIT_FLASH_MS) ? 1 : 0,
      aiming: state.targetId !== null,
    },
    boss: state.phase === "boss" && state.boss ? {
      active: true,
      name: state.boss.name,
      kind: state.boss.kind,
      progress: Math.min(0.84, 0.34 + state.boss.bossPhase * 0.08),
      hp: state.boss.hp,
      maxHp: state.boss.maxHp,
      hitFlash: flash(now, state.boss.lastHitAt),
      targeted: state.targetId === state.boss.id,
      word: state.boss.word,
      typed: state.boss.typed,
    } : null,
    overdrive: state.overdriveMs > 0 ? 1 : clamp(state.energy / 100, 0, 1),
    health: state.health,
    maxHealth: state.maxHealth,
    barricade: state.maxBarricade > 0 ? clamp(state.barricade / state.maxBarricade, 0, 1) : 0,
    effects: state.effects.map((effect) => ({
      id: effect.id,
      kind: effect.kind === "shot" ? "muzzle" : effect.kind === "hit" ? "impact" : effect.kind === "kill" ? "death" : effect.kind === "hurt" || effect.kind === "breach" ? "camera-shake" : effect.kind,
      lane: sceneLane(effect.lane),
      progress: effect.progress,
      enemyId: effect.enemyId,
      elapsedMs: Math.max(0, now - effect.at),
      durationMs: EFFECT_DURATION_MS,
      intensity: effect.amount ? clamp(effect.amount / 160, 0.25, 1.4) : effect.kind === "overdrive" ? 1 : 0.8,
      seed: effect.id * 0.71,
      color: effect.kind === "overdrive" ? "#8feaff" : effect.kind === "hurt" || effect.kind === "breach" ? "#ff625d" : undefined,
    })),
    reducedMotion: reducedMotion || frozen,
    quality,
    camera: {
      x: 0,
      z: state.targetId === null ? -28 : -18,
      zoom: state.phase === "boss" ? 1.2 : state.overdriveMs > 0 ? 0.8 : 0,
      shake: state.effects.some((effect) => effect.kind === "hurt" || effect.kind === "explosion") ? 0.28 : 0,
    },
  };
}
