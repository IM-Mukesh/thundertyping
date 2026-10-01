import { LESSON_LIST } from "@/lib/lessons/lesson-types";
import { GAME_LIST } from "@/lib/games/game-types";
import { ACHIEVEMENT_LIST } from "@/lib/profile/achievements";

const VALID_LESSON_IDS = new Set<string>(LESSON_LIST.map((l) => l.id));
const VALID_GAME_IDS = new Set<string>(GAME_LIST.map((g) => g.id));
const VALID_ACHIEVEMENT_IDS = new Set<string>(ACHIEVEMENT_LIST.map((a) => a.id));
const VALID_TEST_MODES = new Set<string>(["time", "words", "quote", "custom", "vocabulary"]);

function isFiniteNumber(val: unknown): val is number {
  return typeof val === "number" && Number.isFinite(val);
}

function isNonNegativeNumber(val: unknown): val is number {
  return isFiniteNumber(val) && val >= 0;
}

export interface ValidatedTypingResultInput {
  mode: string;
  duration: number;
  wpm: number;
  rawWpm: number | null;
  accuracy: number;
  consistency: number | null;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  param: string | null;
  punctuation: boolean;
  numbers: boolean;
  createdAt?: string;
}

export function validateTypingResultInput(data: unknown): { valid: true; data: ValidatedTypingResultInput } | { valid: false; message: string } {
  if (typeof data !== "object" || data === null) {
    return { valid: false, message: "Payload must be a non-null object" };
  }

  const p = data as Record<string, unknown>;

  if (typeof p.mode !== "string" || !VALID_TEST_MODES.has(p.mode)) {
    return { valid: false, message: `Invalid mode. Must be one of: ${Array.from(VALID_TEST_MODES).join(", ")}` };
  }

  if (!isNonNegativeNumber(p.duration) || p.duration <= 0 || p.duration > 7200) {
    return { valid: false, message: "duration must be a positive number up to 7200 seconds" };
  }

  if (!isNonNegativeNumber(p.wpm) || p.wpm > 350) {
    return { valid: false, message: "wpm must be between 0 and 350" };
  }

  if (p.rawWpm !== null && p.rawWpm !== undefined && (!isNonNegativeNumber(p.rawWpm) || p.rawWpm > 450)) {
    return { valid: false, message: "rawWpm must be between 0 and 450 or null" };
  }

  if (!isNonNegativeNumber(p.accuracy) || p.accuracy > 100) {
    return { valid: false, message: "accuracy must be between 0 and 100" };
  }

  if (p.consistency !== null && p.consistency !== undefined && (!isNonNegativeNumber(p.consistency) || p.consistency > 100)) {
    return { valid: false, message: "consistency must be between 0 and 100 or null" };
  }

  if (!isNonNegativeNumber(p.correctChars) || !Number.isInteger(p.correctChars)) {
    return { valid: false, message: "correctChars must be a non-negative integer" };
  }

  if (!isNonNegativeNumber(p.incorrectChars) || !Number.isInteger(p.incorrectChars)) {
    return { valid: false, message: "incorrectChars must be a non-negative integer" };
  }

  const extraChars = isNonNegativeNumber(p.extraChars) && Number.isInteger(p.extraChars) ? p.extraChars : 0;
  const missedChars = isNonNegativeNumber(p.missedChars) && Number.isInteger(p.missedChars) ? p.missedChars : 0;
  const punctuation = Boolean(p.punctuation);
  const numbers = Boolean(p.numbers);
  const param = p.param !== undefined && p.param !== null ? String(p.param).slice(0, 50) : null;
  const createdAt = typeof p.createdAt === "string" && !isNaN(Date.parse(p.createdAt)) ? p.createdAt : undefined;

  return {
    valid: true,
    data: {
      mode: p.mode,
      duration: p.duration,
      wpm: p.wpm,
      rawWpm: p.rawWpm !== undefined && p.rawWpm !== null ? (p.rawWpm as number) : null,
      accuracy: p.accuracy,
      consistency: p.consistency !== undefined && p.consistency !== null ? (p.consistency as number) : null,
      correctChars: p.correctChars,
      incorrectChars: p.incorrectChars,
      extraChars,
      missedChars,
      param,
      punctuation,
      numbers,
      createdAt,
    },
  };
}

export interface ValidatedLessonProgressInput {
  lessonId: string;
  completed: boolean;
  stars: number;
  wpm: number;
  accuracy: number;
  attemptCount?: number;
}

export function validateLessonProgressInput(data: unknown): { valid: true; data: ValidatedLessonProgressInput } | { valid: false; message: string } {
  if (typeof data !== "object" || data === null) {
    return { valid: false, message: "Payload must be a non-null object" };
  }

  const p = data as Record<string, unknown>;

  if (typeof p.lessonId !== "string" || !VALID_LESSON_IDS.has(p.lessonId)) {
    return { valid: false, message: "Invalid or unknown lessonId" };
  }

  if (!isNonNegativeNumber(p.stars) || !Number.isInteger(p.stars) || p.stars > 5) {
    return { valid: false, message: "stars must be an integer between 0 and 5" };
  }

  if (!isNonNegativeNumber(p.wpm) || p.wpm > 350) {
    return { valid: false, message: "wpm must be between 0 and 350" };
  }

  if (!isNonNegativeNumber(p.accuracy) || p.accuracy > 100) {
    return { valid: false, message: "accuracy must be between 0 and 100" };
  }

  const completed = Boolean(p.completed);
  const attemptCount = isNonNegativeNumber(p.attemptCount) ? Math.floor(p.attemptCount) : 1;

  return {
    valid: true,
    data: {
      lessonId: p.lessonId,
      completed,
      stars: p.stars,
      wpm: p.wpm,
      accuracy: p.accuracy,
      attemptCount,
    },
  };
}

export interface ValidatedGameScoreInput {
  gameId: string;
  score: number;
  cleared?: number;
  bestCombo?: number;
  survivedMs?: number;
  wpm?: number | null;
  accuracy?: number | null;
}

export function validateGameScoreInput(data: unknown): { valid: true; data: ValidatedGameScoreInput } | { valid: false; message: string } {
  if (typeof data !== "object" || data === null) {
    return { valid: false, message: "Payload must be a non-null object" };
  }

  const p = data as Record<string, unknown>;

  if (typeof p.gameId !== "string" || !VALID_GAME_IDS.has(p.gameId)) {
    return { valid: false, message: "Invalid or unknown gameId" };
  }

  if (!isNonNegativeNumber(p.score) || p.score > 50_000_000) {
    return { valid: false, message: "score must be a non-negative number up to 50,000,000" };
  }

  const cleared = isNonNegativeNumber(p.cleared) ? Math.floor(p.cleared) : 0;
  const bestCombo = isNonNegativeNumber(p.bestCombo) ? Math.floor(p.bestCombo) : 0;
  const survivedMs = isNonNegativeNumber(p.survivedMs) ? Math.floor(p.survivedMs) : 0;
  const wpm = isNonNegativeNumber(p.wpm) && p.wpm <= 350 ? p.wpm : null;
  const accuracy = isNonNegativeNumber(p.accuracy) && p.accuracy <= 100 ? p.accuracy : null;

  return {
    valid: true,
    data: {
      gameId: p.gameId,
      score: Math.floor(p.score),
      cleared,
      bestCombo,
      survivedMs,
      wpm,
      accuracy,
    },
  };
}

export interface ValidatedProfileUpdateInput {
  displayName?: string;
  username?: string;
}

export function validateProfileUpdateInput(data: unknown): { valid: true; data: ValidatedProfileUpdateInput } | { valid: false; message: string } {
  if (typeof data !== "object" || data === null) {
    return { valid: false, message: "Payload must be a non-null object" };
  }

  const p = data as Record<string, unknown>;
  const out: ValidatedProfileUpdateInput = {};

  if (p.displayName !== undefined) {
    if (typeof p.displayName !== "string" || p.displayName.trim().length === 0 || p.displayName.length > 50) {
      return { valid: false, message: "displayName must be between 1 and 50 characters" };
    }
    out.displayName = p.displayName.trim();
  }

  if (p.username !== undefined) {
    if (typeof p.username !== "string" || !/^[a-zA-Z0-9_]{3,24}$/.test(p.username)) {
      return { valid: false, message: "username must be 3-24 alphanumeric characters or underscores" };
    }
    out.username = p.username.toLowerCase();
  }

  return { valid: true, data: out };
}

export interface ValidatedPreferencesInput {
  theme?: string;
  soundEnabled?: boolean;
  soundVolume?: number;
  keyboardLayout?: string;
  confidenceMode?: string;
  quickRestart?: string;
  smoothCaret?: string;
  fontSize?: string;
  fontFamily?: string;
  defaultTestMode?: string;
  defaultTestDuration?: number;
  punctuation?: boolean;
  numbers?: boolean;
}

export function validatePreferencesInput(data: unknown): { valid: true; data: ValidatedPreferencesInput } | { valid: false; message: string } {
  if (typeof data !== "object" || data === null) {
    return { valid: false, message: "Payload must be a non-null object" };
  }

  const p = data as Record<string, unknown>;
  const out: ValidatedPreferencesInput = {};

  if (p.theme !== undefined) {
    if (typeof p.theme !== "string" || p.theme.length > 50) return { valid: false, message: "Invalid theme" };
    out.theme = p.theme;
  }
  if (p.soundEnabled !== undefined) {
    out.soundEnabled = Boolean(p.soundEnabled);
  }
  if (p.soundVolume !== undefined) {
    if (typeof p.soundVolume !== "number" || p.soundVolume < 0 || p.soundVolume > 1) {
      return { valid: false, message: "soundVolume must be between 0 and 1" };
    }
    out.soundVolume = p.soundVolume;
  }
  if (p.keyboardLayout !== undefined) {
    if (typeof p.keyboardLayout !== "string" || p.keyboardLayout.length > 50) return { valid: false, message: "Invalid keyboardLayout" };
    out.keyboardLayout = p.keyboardLayout;
  }
  if (p.confidenceMode !== undefined) {
    if (typeof p.confidenceMode !== "string" || !["off", "on", "max"].includes(p.confidenceMode)) {
      return { valid: false, message: "Invalid confidenceMode" };
    }
    out.confidenceMode = p.confidenceMode;
  }
  if (p.quickRestart !== undefined) {
    if (typeof p.quickRestart !== "string" || !["tab", "esc", "enter", "off"].includes(p.quickRestart)) {
      return { valid: false, message: "Invalid quickRestart" };
    }
    out.quickRestart = p.quickRestart;
  }
  if (p.smoothCaret !== undefined) {
    if (typeof p.smoothCaret !== "string" || !["off", "slow", "medium", "fast"].includes(p.smoothCaret)) {
      return { valid: false, message: "Invalid smoothCaret" };
    }
    out.smoothCaret = p.smoothCaret;
  }
  if (p.fontSize !== undefined) {
    if (typeof p.fontSize !== "string" || !["small", "medium", "large", "xlarge"].includes(p.fontSize)) {
      return { valid: false, message: "Invalid fontSize" };
    }
    out.fontSize = p.fontSize;
  }
  if (p.fontFamily !== undefined) {
    if (typeof p.fontFamily !== "string" || p.fontFamily.length > 50) return { valid: false, message: "Invalid fontFamily" };
    out.fontFamily = p.fontFamily;
  }
  if (p.defaultTestMode !== undefined) {
    if (typeof p.defaultTestMode !== "string" || !VALID_TEST_MODES.has(p.defaultTestMode)) {
      return { valid: false, message: "Invalid defaultTestMode" };
    }
    out.defaultTestMode = p.defaultTestMode;
  }
  if (p.defaultTestDuration !== undefined) {
    if (!isFiniteNumber(p.defaultTestDuration) || p.defaultTestDuration <= 0 || p.defaultTestDuration > 7200) {
      return { valid: false, message: "defaultTestDuration must be positive number up to 7200" };
    }
    out.defaultTestDuration = Math.round(p.defaultTestDuration);
  }
  if (p.punctuation !== undefined) {
    out.punctuation = Boolean(p.punctuation);
  }
  if (p.numbers !== undefined) {
    out.numbers = Boolean(p.numbers);
  }

  return { valid: true, data: out };
}

export interface ValidatedXpAwardInput {
  amount: number;
}

export function validateXpAwardInput(data: unknown): { valid: true; data: ValidatedXpAwardInput } | { valid: false; message: string } {
  if (typeof data !== "object" || data === null) {
    return { valid: false, message: "Payload must be a non-null object" };
  }

  const p = data as Record<string, unknown>;

  if (!isNonNegativeNumber(p.amount) || !Number.isInteger(p.amount) || p.amount <= 0 || p.amount > 2000) {
    return { valid: false, message: "amount must be a positive integer up to 2000" };
  }

  return { valid: true, data: { amount: p.amount } };
}

export interface ValidatedAchievementGrantInput {
  achievementId: string;
}

export function validateAchievementGrantInput(data: unknown): { valid: true; data: ValidatedAchievementGrantInput } | { valid: false; message: string } {
  if (typeof data !== "object" || data === null) {
    return { valid: false, message: "Payload must be a non-null object" };
  }

  const p = data as Record<string, unknown>;

  if (typeof p.achievementId !== "string" || !VALID_ACHIEVEMENT_IDS.has(p.achievementId)) {
    return { valid: false, message: "Invalid or unknown achievementId" };
  }

  return { valid: true, data: { achievementId: p.achievementId } };
}
