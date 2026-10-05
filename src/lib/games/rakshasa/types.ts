/** Isolated simulation/renderer contract. Rendering never changes combat state. */
export type WarDifficulty = "easy" | "normal" | "hard";
export type WarPhase = "menu" | "tutorial" | "intro" | "playing" | "boss-intro" | "boss" | "finisher" | "victory" | "defeat" | "paused";
export type EnemyClass = "fallen-soldier" | "zombie-warrior" | "wraith" | "possessed-human" | "shadow-soldier" | "burning-undead" | "armored-revenant" | "flying-wraith" | "necromancer" | "giant-revenant";
export type SpecialId = "shockwave" | "frost" | "ember";
export interface WarEnemy {
  id: number;
  kind: EnemyClass;
  word: string;
  lane: number;
  progress: number;
  travelMs: number;
  hp: number;
  maxHp: number;
  elite: boolean;
  typed: number;
  highWater: number;
  bornAt: number;
  lastHitAt: number;
}
export interface WarBoss {
  name: string;
  phase: number;
  hp: number;
  maxHp: number;
  text: string;
  typed: number;
  highWater: number;
  chargeMs: number;
  chargeLimitMs: number;
}
export interface WarEffect {
  id: number;
  kind: "attack" | "kill" | "hurt" | "special" | "boss-hit";
  at: number;
  lane: number;
  progress: number;
  special?: SpecialId;
  enemyId?: number;
  enemyClass?: EnemyClass;
}
export interface WarState {
  phase: WarPhase;
  pausedFrom: WarPhase | null;
  difficulty: WarDifficulty;
  stage: number;
  wave: number;
  health: number;
  score: number;
  combo: number;
  bestCombo: number;
  cleared: number;
  correctKeys: number;
  incorrectKeys: number;
  outputChars: number;
  elapsedMs: number;
  sceneMs: number;
  phaseTimeMs: number;
  targetId: number | null;
  enemies: WarEnemy[];
  boss: WarBoss | null;
  effects: WarEffect[];
  energy: number;
  specialUnlocks: SpecialId[];
  specialUses: number;
  frostMs: number;
  spawnMs: number;
  spawned: number;
  resolved: number;
  nextId: number;
  seed: string;
  pressure: number;
  message: string;
  tutorialStep: number;
}
export interface WarStage {
  id: number;
  name: string;
  subtitle: string;
  intro: string;
  palette: { sky: string; fog: string; ground: string; glow: string };
  scenery: "village" | "forest" | "kingdom" | "battlefield" | "castle" | "city" | "underworld" | "demon";
  enemies: readonly EnemyClass[];
  bossName: string;
  sentences: readonly string[];
  finisher: string;
}
export interface WarEnemyDefinition {
  name: string;
  description: string;
  speed: number;
  armor: number;
  damage: number;
  color: string;
}
export interface WarSpecialDefinition {
  id: SpecialId;
  name: string;
  key: string;
  cost: number;
  unlockAt: number;
  description: string;
}
