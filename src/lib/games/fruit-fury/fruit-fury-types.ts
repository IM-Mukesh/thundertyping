export type FruitType =
  | "apple"
  | "banana"
  | "orange"
  | "watermelon"
  | "pineapple"
  | "strawberry"
  | "kiwi"
  | "dragonfruit"
  | "golden"
  | "frozen"
  | "bomb";

export interface FruitConfig {
  type: FruitType;
  name: string;
  isBomb: boolean;
  isSpecial: boolean;
  baseScore: number;
  radius: number;
  primaryColor: string;
  secondaryColor: string;
  juiceColor: string;
}

export const FRUIT_CONFIGS: Record<FruitType, FruitConfig> = {
  apple: {
    type: "apple",
    name: "Apple",
    isBomb: false,
    isSpecial: false,
    baseScore: 100,
    radius: 34,
    primaryColor: "#ef4444",
    secondaryColor: "#b91c1c",
    juiceColor: "#fca5a5",
  },
  banana: {
    type: "banana",
    name: "Banana",
    isBomb: false,
    isSpecial: false,
    baseScore: 110,
    radius: 32,
    primaryColor: "#eab308",
    secondaryColor: "#ca8a04",
    juiceColor: "#fef08a",
  },
  orange: {
    type: "orange",
    name: "Orange",
    isBomb: false,
    isSpecial: false,
    baseScore: 120,
    radius: 34,
    primaryColor: "#f97316",
    secondaryColor: "#c2410c",
    juiceColor: "#fdba74",
  },
  watermelon: {
    type: "watermelon",
    name: "Watermelon",
    isBomb: false,
    isSpecial: false,
    baseScore: 130,
    radius: 40,
    primaryColor: "#15803d",
    secondaryColor: "#ef4444",
    juiceColor: "#f87171",
  },
  pineapple: {
    type: "pineapple",
    name: "Pineapple",
    isBomb: false,
    isSpecial: false,
    baseScore: 140,
    radius: 38,
    primaryColor: "#d97706",
    secondaryColor: "#b45309",
    juiceColor: "#fde047",
  },
  strawberry: {
    type: "strawberry",
    name: "Strawberry",
    isBomb: false,
    isSpecial: false,
    baseScore: 150,
    radius: 30,
    primaryColor: "#e11d48",
    secondaryColor: "#be123c",
    juiceColor: "#fda4af",
  },
  kiwi: {
    type: "kiwi",
    name: "Kiwi",
    isBomb: false,
    isSpecial: false,
    baseScore: 160,
    radius: 32,
    primaryColor: "#65a30d",
    secondaryColor: "#4d7c0f",
    juiceColor: "#bef264",
  },
  dragonfruit: {
    type: "dragonfruit",
    name: "Dragon Fruit",
    isBomb: false,
    isSpecial: false,
    baseScore: 180,
    radius: 38,
    primaryColor: "#db2777",
    secondaryColor: "#be185d",
    juiceColor: "#f472b6",
  },
  golden: {
    type: "golden",
    name: "Golden Dragon",
    isBomb: false,
    isSpecial: true,
    baseScore: 500,
    radius: 36,
    primaryColor: "#fbbf24",
    secondaryColor: "#f59e0b",
    juiceColor: "#fef08a",
  },
  frozen: {
    type: "frozen",
    name: "Frost Berry",
    isBomb: false,
    isSpecial: true,
    baseScore: 250,
    radius: 34,
    primaryColor: "#38bdf8",
    secondaryColor: "#0284c7",
    juiceColor: "#bae6fd",
  },
  bomb: {
    type: "bomb",
    name: "Bomb",
    isBomb: true,
    isSpecial: false,
    baseScore: 0,
    radius: 36,
    primaryColor: "#1e293b",
    secondaryColor: "#0f172a",
    juiceColor: "#f97316",
  },
};

export const STANDARD_FRUIT_TYPES: FruitType[] = [
  "apple",
  "banana",
  "orange",
  "watermelon",
  "pineapple",
  "strawberry",
  "kiwi",
  "dragonfruit",
];

export type GameDifficulty = "easy" | "medium" | "hard";

export type TypingMode = "all" | "home" | "top" | "bottom" | "numbers";

export type FruitInputMode = "keyboard" | "touch";
export type FruitRunMode = "classic" | "tutorial" | "combo" | "clean";

export interface TypingModeConfig {
  id: TypingMode;
  label: string;
  description: string;
  shortLabel: string;
  keys: string[];
}

export const TYPING_MODES: Record<TypingMode, TypingModeConfig> = {
  all: {
    id: "all",
    label: "All Keys",
    shortLabel: "A–Z",
    description: "Full keyboard A–Z arcade reflex challenge.",
    keys: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  },
  home: {
    id: "home",
    label: "Home Row",
    shortLabel: "ASDF",
    description: "Middle row core keys (A S D F G H J K L).",
    keys: "ASDFGHJKL".split(""),
  },
  top: {
    id: "top",
    label: "Top Row",
    shortLabel: "QWER",
    description: "Upper row finger extensions (Q W E R T Y U I O P).",
    keys: "QWERTYUIOP".split(""),
  },
  bottom: {
    id: "bottom",
    label: "Bottom Row",
    shortLabel: "ZXCV",
    description: "Lower row finger curls (Z X C V B N M).",
    keys: "ZXCVBNM".split(""),
  },
  numbers: {
    id: "numbers",
    label: "Numbers",
    shortLabel: "0–9",
    description: "Top number row speed reflex (1 2 3 4 5 6 7 8 9 0).",
    keys: "1234567890".split(""),
  },
};

export interface DifficultyConfig {
  label: string;
  description: string;
  initialSpeedY: number; // upward launch velocity (negative in canvas)
  gravity: number;
  initialSpawnInterval: number; // ms between fruit launches
  minSpawnInterval: number;
  bombChanceStart: number; // 0 to 1
  bombChanceMax: number;
  specialChance: number;
  simultaneousMax: number;
  floatTimeWindow: number; // ms spent near apex
  feverDrainRate: number; // per second
}

export const DIFFICULTY_CONFIGS: Record<GameDifficulty, DifficultyConfig> = {
  easy: {
    label: "Easy",
    description: "Gentle launches, generous apex float, and no early bombs. Great for learning the rhythm.",
    initialSpeedY: -15.0,
    gravity: 0.24,
    initialSpawnInterval: 1700,
    minSpawnInterval: 1100,
    bombChanceStart: 0.0,
    bombChanceMax: 0.10,
    specialChance: 0.14,
    simultaneousMax: 3,
    floatTimeWindow: 450,
    feverDrainRate: 10,
  },
  medium: {
    label: "Medium",
    description: "Standard arcade pace. Multi-fruit volleys, occasional bombs, and escalating pressure.",
    initialSpeedY: -16.2,
    gravity: 0.27,
    initialSpawnInterval: 1350,
    minSpawnInterval: 800,
    bombChanceStart: 0.08,
    bombChanceMax: 0.18,
    specialChance: 0.11,
    simultaneousMax: 5,
    floatTimeWindow: 350,
    feverDrainRate: 12.5,
  },
  hard: {
    label: "Hard",
    description: "Fierce reflex challenge. Rapid volleys, frequent bombs, and swift trajectories.",
    initialSpeedY: -17.5,
    gravity: 0.31,
    initialSpawnInterval: 1050,
    minSpawnInterval: 550,
    bombChanceStart: 0.14,
    bombChanceMax: 0.26,
    specialChance: 0.09,
    simultaneousMax: 7,
    floatTimeWindow: 260,
    feverDrainRate: 15,
  },
};

export interface FruitHalf {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  va: number; // angular velocity
  opacity: number;
  sliceAngle: number;
  isLeft: boolean;
}

export interface ActiveFruit {
  id: string;
  type: FruitType;
  letter: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  state: "flying" | "sliced" | "exploded" | "missed";
  visibleAt?: number; // active play time when the target first became visible
  slicedAt?: number;
  halves?: [FruitHalf, FruitHalf];
  fusePhase?: number; // For bombs: 0 to 1 spark pulse
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  shape: "circle" | "drop" | "spark" | "shard" | "seed" | "pulp";
  rotation?: number;
  rotationSpeed?: number;
}

export interface BladeSlash {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  createdAt: number;
  durationMs: number;
}

export interface JuiceSplat {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  createdAt: number;
  durationMs: number;
  droplets: Array<{ dx: number; dy: number; r: number }>;
  drips?: Array<{ dx: number; dy: number; length: number; width: number }>;
}

export interface AmbientMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  rotation: number;
  vRot: number;
  color: string;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  alpha: number;
  createdAt: number;
  durationMs: number;
  vy: number;
}

export interface FruitFuryState {
  status: "idle" | "running" | "paused" | "over";
  gameOverReason: "bombed" | "lives_depleted" | "completed" | "mission_failed" | "time_up" | null;
  difficulty: GameDifficulty;
  typingMode: TypingMode;
  inputMode: FruitInputMode;
  runMode: FruitRunMode;
  score: number;
  level: number;
  fruitsCleared: number;
  lives: number;
  maxLives: number;
  combo: number;
  maxCombo: number;
  lastSliceTime: number;
  feverGauge: number; // 0 to 100
  isFeverActive: boolean;
  feverEver: boolean;
  goldenSliced: number;
  feverTimeRemaining: number;
  isFrozenActive: boolean;
  frozenTimeRemaining: number;
  totalTyped: number;
  correctTyped: number;
  bombsAvoided: number;
  bombsHit: number;
  missedFruits: number;
  keyErrors: Record<string, number>;
  missedKeys: Record<string, number>;
  reactionTotalMs: number;
  reactionSamples: number;
  startTime: number;
  elapsedMs: number;
  screenShake: { intensity: number; decay: number; offsetX: number; offsetY: number };
  flashColor: string | null;
  flashAlpha: number;
}

export const COMBO_WINDOW_MS = 1400;
export const FEVER_DURATION_MS = 8000;
export const FROZEN_DURATION_MS = 4500;
export const SLICE_ANIM_DURATION_MS = 400;
