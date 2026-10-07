/** Serializable simulation contract. Coordinates and clocks are renderer-independent. */
export type DeathPhase = "menu" | "briefing" | "combat" | "boss" | "wave" | "upgrade" | "results" | "paused";
export type DeathDifficulty = "easy" | "normal" | "hard";
export type DeathMode = "campaign" | "daily" | "endless";
export type DeathOutcome = "victory" | "defeat" | "abandoned";
export type DeathEnemyKind = "walker" | "runner" | "brute" | "spitter" | "bomber" | "stalker" | "swarm" | "mutant" | "elite" | "boss";
export type DeathWordTier = "short" | "medium" | "long" | "extreme";
export type DeathBehavior = "advance" | "charge" | "armor" | "ranged" | "explode" | "ambush" | "pack" | "regenerate" | "enrage" | "commander";
export type DeathUpgradeId = "hollow-point" | "longshot" | "quickload" | "coolant" | "reinforcement" | "field-medic" | "capacitor" | "precision" | "salvager";
export type DeathUpgradeRanks = Record<DeathUpgradeId, number>;
export type DeathWeaponId = "pistol" | "smg" | "shotgun" | "sniper" | "plasma";
export type DeathSurvivorId = "soldier" | "scout" | "engineer" | "medic" | "hacker";

export interface DeathWeaponDefinition {
  readonly id: DeathWeaponId;
  readonly name: string;
  readonly description: string;
  readonly damage: number;
  readonly heat: number;
  readonly shortWord: number;
  readonly longWord: number;
  readonly cleanWord: number;
  readonly energy: number;
}

export interface DeathSurvivorDefinition {
  readonly id: DeathSurvivorId;
  readonly name: string;
  readonly description: string;
  readonly damage: number;
  readonly maxHealth: number;
  readonly maxBarricade: number;
  readonly energy: number;
}

export interface DeathEnemyDefinition {
  readonly name: string;
  readonly description: string;
  /** Multiplier of the authored mission's approach speed. */
  readonly speed: number;
  readonly damage: number;
  readonly hp: number;
  readonly tier: DeathWordTier;
  readonly behavior: DeathBehavior;
  readonly armor: number;
  readonly reward: number;
  readonly color: string;
}

export interface DeathEnemy {
  id: number;
  kind: DeathEnemyKind;
  lane: number;
  /** Fixed, seeded offset within a lane, useful for 3D placement. */
  lateral: number;
  progress: number;
  travelMs: number;
  hp: number;
  maxHp: number;
  word: string;
  tier: DeathWordTier;
  typed: number;
  /** Unique prefix output. Deletion/retyping cannot farm energy or WPM. */
  highWater: number;
  wordSerial: number;
  wordMistakes: number;
  visible: boolean;
  bornAt: number;
  lastHitAt: number;
  /** Remaining ranged charge; only advances after reaching firing distance. */
  attackMs: number;
  regenMs: number;
}

export interface DeathBoss extends DeathEnemy {
  kind: "boss";
  name: string;
  bossPhase: 1 | 2 | 3;
  chargeMs: number;
  chargeLimitMs: number;
  wordsThisCharge: number;
  attacks: number;
}

export interface DeathEffect {
  id: number;
  kind: "shot" | "hit" | "kill" | "breach" | "acid" | "explosion" | "hurt" | "overdrive" | "jam" | "wave" | "boss-phase" | "block" | "upgrade";
  at: number;
  lane: number;
  progress: number;
  enemyId?: number;
  enemyKind?: DeathEnemyKind;
  amount?: number;
}

export interface DeathMission {
  readonly id: number;
  readonly name: string;
  readonly subtitle: string;
  readonly briefing: string;
  readonly scenery: "street" | "depot" | "hospital" | "metro" | "bridge" | "lab";
  readonly palette: { readonly sky: string; readonly fog: string; readonly ground: string; readonly glow: string };
  readonly enemies: readonly Exclude<DeathEnemyKind, "boss">[];
  readonly waves: number;
  readonly approachMs: number;
  readonly bossName: string;
}

export interface DeathUpgradeDefinition {
  readonly id: DeathUpgradeId;
  readonly name: string;
  readonly description: string;
  readonly maxRank: number;
}

export interface DeathState {
  phase: DeathPhase;
  pausedFrom: DeathPhase | null;
  mode: DeathMode;
  difficulty: DeathDifficulty;
  mission: number;
  wave: number;
  seed: string;
  /** Supply a unique receipt for each real attempt when recording progression. */
  runId: string;
  dailyDay: string | null;
  weapon: DeathWeaponId;
  survivor: DeathSurvivorId;
  health: number;
  maxHealth: number;
  barricade: number;
  maxBarricade: number;
  score: number;
  combo: number;
  bestCombo: number;
  correctKeys: number;
  incorrectKeys: number;
  outputChars: number;
  wordsCompleted: number;
  cleanWords: number;
  cleared: number;
  missed: number;
  damageDealt: number;
  damageTaken: number;
  wavesCleared: number;
  overdrives: number;
  jams: number;
  /** Only combat/boss time contributes to run duration and WPM. */
  elapsedMs: number;
  sceneMs: number;
  phaseTimeMs: number;
  targetId: number | null;
  enemies: DeathEnemy[];
  boss: DeathBoss | null;
  effects: DeathEffect[];
  heat: number;
  jamMs: number;
  energy: number;
  overdriveMs: number;
  spawnMs: number;
  spawned: number;
  resolved: number;
  waveKills: number;
  nextId: number;
  nextEffectId: number;
  upgrades: DeathUpgradeRanks;
  upgradeChoices: DeathUpgradeId[];
  outcome: DeathOutcome | null;
  resultReason: "boss-defeated" | "health-depleted" | "time-limit" | "abandoned" | null;
  message: string;
}

export interface DeathStartOptions {
  mission?: number;
  difficulty?: DeathDifficulty;
  mode?: DeathMode;
  /** Convenience flag for callers that do not keep a separate mode selector. */
  daily?: boolean;
  seed?: string;
  runId?: string;
  weapon?: DeathWeaponId;
  survivor?: DeathSurvivorId;
  /** Explicit UTC date (YYYY-MM-DD) or Date. Required for daily mode. */
  day?: string | Date;
}

export interface DeathStats {
  wpm: number;
  accuracy: number;
  score: number;
  cleared: number;
  missed: number;
  bestCombo: number;
  survivedMs: number;
  correctKeys: number;
  incorrectKeys: number;
  outputChars: number;
  wordsCompleted: number;
  cleanWords: number;
  damageDealt: number;
  damageTaken: number;
  wavesCleared: number;
  overdrives: number;
  jams: number;
}

export interface DeathRunStats extends DeathStats {
  variant: string;
  outcome: DeathOutcome | null;
  mission: number;
  wave: number;
}

export interface DeathDailyChallenge {
  day: string;
  seed: string;
  mission: number;
  difficulty: "normal";
}

export interface DeathProgress {
  version: 1;
  completed: number[];
  runs: number;
  defeated: number;
  bestScore: number;
  bestWpm: number;
  bestAccuracy: number;
  missionBests: number[];
  dailyBests: { day: string; score: number }[];
  /** Bounded result receipts make replayed controller transitions idempotent. */
  receipts: string[];
  quality: "auto" | "low" | "high";
  reducedMotion: boolean;
  weapon: DeathWeaponId;
  survivor: DeathSurvivorId;
}

/** Verbose aliases keep the public contract discoverable for route controllers. */
export type TypeBeforeDeathPhase = DeathPhase;
export type TypeBeforeDeathDifficulty = DeathDifficulty;
export type TypeBeforeDeathEnemyKind = DeathEnemyKind;
export type TypeBeforeDeathState = DeathState;
export type TypeBeforeDeathStats = DeathStats;
export type TypeBeforeDeathRunStats = DeathRunStats;
