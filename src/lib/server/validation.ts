import "server-only";
import { LESSON_LIST } from "@/lib/lessons/lesson-types";
import { GAME_LIST } from "@/lib/games/game-types";
import { ACHIEVEMENT_LIST } from "@/lib/profile/achievements";
import { calculateLessonStars, calculateLessonPass } from "@/lib/lessons/star-system";

const VALID_LESSON_IDS = new Set<string>(LESSON_LIST.map((l) => l.id));
const VALID_GAME_IDS = new Set<string>(GAME_LIST.map((g) => g.id));
const VALID_ACHIEVEMENT_IDS = new Set<string>(ACHIEVEMENT_LIST.map((a) => a.id));
const VALID_TEST_MODES = new Set<string>(["time", "words", "quote", "custom", "vocabulary"]);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(val: unknown): val is string {
  return typeof val === "string" && UUID_REGEX.test(val);
}

function isFiniteNumber(val: unknown): val is number {
  return typeof val === "number" && Number.isFinite(val);
}

function isNonNegativeNumber(val: unknown): val is number {
  return isFiniteNumber(val) && val >= 0;
}

function isNonNegativeInteger(val: unknown): val is number {
  return typeof val === "number" && Number.isInteger(val) && val >= 0;
}

export interface ValidatedTypingResultInput {
  mode: string;
  duration: number;
  wpm: number;
  rawWpm: number | null;
  accuracy: number;
  consistency: number | null;
  correctChars: number;
  scoringChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  param: string | null;
  punctuation: boolean;
  numbers: boolean;
  runId?: string;
}

export function validateTypingResultInput(
  data: unknown
): { valid: true; data: ValidatedTypingResultInput } | { valid: false; message: string } {
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

  if (!isNonNegativeInteger(p.correctChars)) {
    return { valid: false, message: "correctChars must be a non-negative integer" };
  }

  if (!isNonNegativeInteger(p.incorrectChars)) {
    return { valid: false, message: "incorrectChars must be a non-negative integer" };
  }

  const extraChars = isNonNegativeInteger(p.extraChars) ? p.extraChars : 0;
  const missedChars = isNonNegativeInteger(p.missedChars) ? p.missedChars : 0;

  // Strict boolean validation (Rule: Boolean("false") is NOT validation)
  if (p.punctuation !== undefined && typeof p.punctuation !== "boolean") {
    return { valid: false, message: "punctuation must be a boolean" };
  }
  if (p.numbers !== undefined && typeof p.numbers !== "boolean") {
    return { valid: false, message: "numbers must be a boolean" };
  }
  const punctuation = Boolean(p.punctuation);
  const numbers = Boolean(p.numbers);

  // Optional runId for idempotency
  let runId: string | undefined;
  if (p.runId !== undefined) {
    if (!isValidUuid(p.runId)) {
      return { valid: false, message: "runId must be a valid UUID v4" };
    }
    runId = p.runId;
  }

  // --- Mathematical and Physical Integrity Checks ---
  // 1. Human typing speed limit check:
  // Sustaining over 40 characters per second (>480 raw WPM) is physically impossible for human hands.
  const scoringChars = p.scoringChars === undefined ? p.correctChars : p.scoringChars;
  if (!isNonNegativeNumber(scoringChars)) return { valid: false, message: "scoringChars must be non-negative" };
  const totalTyped = p.correctChars + p.incorrectChars;
  if (totalTyped < 1 || scoringChars < 1) {
    return { valid: false, message: "A typing result must contain at least one typed character" };
  }
  const cps = totalTyped / p.duration;
  if (cps > 40) {
    return { valid: false, message: "Typing speed exceeds maximum possible human keystroke rate" };
  }

  // 2. Net WPM consistency check:
  // Expected net WPM = (correctChars / 5) / (duration / 60)
  // We allow a reasonable tolerance of +/- 2.5 WPM for fractional timing / word separator nuances
  const expectedWpm = (scoringChars / 5) / (p.duration / 60);
  if (p.correctChars > 0 && Math.abs(p.wpm - expectedWpm) > 2.5) {
    return {
      valid: false,
      message: `Claimed WPM (${p.wpm}) does not match characters typed (${p.correctChars}) over duration (${p.duration}s)`,
    };
  }

  // 3. Accuracy consistency check:
  // Expected accuracy = (correctChars / (correctChars + incorrectChars + missedChars)) * 100
  const totalRelevantChars = p.correctChars + p.incorrectChars + missedChars;
  if (totalRelevantChars > 0) {
    const expectedAccuracy = (p.correctChars / totalRelevantChars) * 100;
    if (Math.abs(p.accuracy - expectedAccuracy) > 2.0) {
      return {
        valid: false,
        message: `Claimed accuracy (${p.accuracy}%) does not match character counts`,
      };
    }
  }

  const param = p.param !== undefined && p.param !== null ? String(p.param).slice(0, 50) : null;

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
      scoringChars,
      incorrectChars: p.incorrectChars,
      extraChars,
      missedChars,
      param,
      punctuation,
      numbers,
      runId,
    },
  };
}

export interface ValidatedLessonProgressInput {
  lessonId: string;
  completed: boolean;
  stars: number;
  wpm: number;
  accuracy: number;
  attemptCount: number;
  runId?: string;
  step: number;
  totalSteps: number;
  typedChars: number;
  correctChars: number;
  incorrectChars: number;
  elapsedMs: number;
}

export function validateLessonProgressInput(
  data: unknown
): { valid: true; data: ValidatedLessonProgressInput } | { valid: false; message: string } {
  if (typeof data !== "object" || data === null) {
    return { valid: false, message: "Payload must be a non-null object" };
  }

  const p = data as Record<string, unknown>;

  if (typeof p.lessonId !== "string" || !VALID_LESSON_IDS.has(p.lessonId)) {
    return { valid: false, message: "Invalid or unknown lessonId" };
  }

  // Strict boolean validation for completed
  if (p.completed !== undefined && typeof p.completed !== "boolean") {
    return { valid: false, message: "completed must be a boolean" };
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

  const step = p.step === undefined ? 1 : p.step;
  const totalSteps = p.totalSteps === undefined ? 1 : p.totalSteps;
  if (!Number.isInteger(step) || !Number.isInteger(totalSteps) ||
      (step as number) < 0 || (totalSteps as number) < 1 ||
      (step as number) > (totalSteps as number)) {
    return { valid: false, message: "step must be an integer within totalSteps" };
  }
  for (const field of ["typedChars", "correctChars", "incorrectChars", "elapsedMs"] as const) {
    if (p[field] !== undefined && !isNonNegativeNumber(p[field])) return { valid: false, message: `${field} must be non-negative` };
  }

  let runId: string | undefined;
  if (p.runId !== undefined) {
    if (!isValidUuid(p.runId)) {
      return { valid: false, message: "runId must be a valid UUID v4" };
    }
    runId = p.runId;
  }

  // --- Authoritative Server-Side Derivation ---
  // The server independently calculates pass and star rating using the lesson curriculum rules
  const lessonMeta = LESSON_LIST.find((l) => l.id === p.lessonId);
  const isBeginner = lessonMeta?.tier === "beginner";
  const authoritativeStars = calculateLessonStars(p.accuracy, p.wpm, { isBeginner });
  const authoritativePassed = calculateLessonPass(p.accuracy);

  // If client claims completion but accuracy does not satisfy pass requirement, reject false completion
  const completed = Boolean(p.completed) && authoritativePassed;

  return {
    valid: true,
    data: {
      lessonId: p.lessonId,
      completed,
      stars: authoritativeStars,
      wpm: p.wpm,
      accuracy: p.accuracy,
      attemptCount: 1, // Server always enforces 1 attempt per valid submission
      runId,
      step: step as number,
      totalSteps: totalSteps as number,
      typedChars: (p.typedChars as number | undefined) ?? 0,
      correctChars: (p.correctChars as number | undefined) ?? 0,
      incorrectChars: (p.incorrectChars as number | undefined) ?? 0,
      elapsedMs: (p.elapsedMs as number | undefined) ?? 0,
    },
  };
}

export interface ValidatedGameScoreInput {
  gameId: string;
  score: number;
  cleared: number;
  bestCombo: number;
  survivedMs: number;
  wpm: number | null;
  accuracy: number | null;
  runId?: string;
}

// Game-specific maximum realistic score limits
const MAX_GAME_SCORES: Record<string, { maxScore: number; maxCombo: number; maxCleared: number }> = {
  "falling-words": { maxScore: 100_000, maxCombo: 200, maxCleared: 1_000 },
  "word-rain": { maxScore: 100_000, maxCombo: 200, maxCleared: 1_000 },
  "word-blaster": { maxScore: 100_000, maxCombo: 200, maxCleared: 500 },
  "typing-grand-prix": { maxScore: 50_000, maxCombo: 100, maxCleared: 200 },
  "boss-battle": { maxScore: 100_000, maxCombo: 100, maxCleared: 100 },
  "combo-rush": { maxScore: 100_000, maxCombo: 150, maxCleared: 150 },
  spellbound: { maxScore: 100_000, maxCombo: 100, maxCleared: 100 },
  "typing-survivor": { maxScore: 100_000, maxCombo: 150, maxCleared: 250 },
  "ghost-racer": { maxScore: 50_000, maxCombo: 100, maxCleared: 150 },
  "card-battle": { maxScore: 50_000, maxCombo: 50, maxCleared: 50 },
  "fruit-fury": { maxScore: 200_000, maxCombo: 150, maxCleared: 1_500 },
};

export function validateGameScoreInput(
  data: unknown
): { valid: true; data: ValidatedGameScoreInput } | { valid: false; message: string } {
  if (typeof data !== "object" || data === null) {
    return { valid: false, message: "Payload must be a non-null object" };
  }

  const p = data as Record<string, unknown>;

  if (typeof p.gameId !== "string" || !VALID_GAME_IDS.has(p.gameId)) {
    return { valid: false, message: "Invalid or unknown gameId" };
  }

  const limits = MAX_GAME_SCORES[p.gameId] || { maxScore: 100_000, maxCombo: 200, maxCleared: 1000 };

  if (!isNonNegativeNumber(p.score) || !Number.isInteger(p.score) || p.score > limits.maxScore) {
    return { valid: false, message: `score must be a non-negative integer up to ${limits.maxScore.toLocaleString()}` };
  }

  const cleared = isNonNegativeInteger(p.cleared) ? p.cleared : 0;
  if (cleared > limits.maxCleared) {
    return { valid: false, message: `cleared exceeds maximum possible limit (${limits.maxCleared})` };
  }

  const bestCombo = isNonNegativeInteger(p.bestCombo) ? p.bestCombo : 0;
  if (bestCombo > limits.maxCombo) {
    return { valid: false, message: `bestCombo exceeds maximum possible limit (${limits.maxCombo})` };
  }

  const survivedMs = isNonNegativeInteger(p.survivedMs) ? p.survivedMs : 0;
  // Maximum survival time: 2 hours (7,200,000 ms)
  if (survivedMs > 7_200_000) {
    return { valid: false, message: "survivedMs exceeds maximum session limit (2 hours)" };
  }

  // Plausibility check: Cannot score > 0 with 0ms survival time and 0 cleared
  if (p.score > 0 && survivedMs < 500 && cleared === 0) {
    return { valid: false, message: "Mathematically impossible score for game duration" };
  }

  const wpm = isNonNegativeNumber(p.wpm) && p.wpm <= 350 ? p.wpm : null;
  const accuracy = isNonNegativeNumber(p.accuracy) && p.accuracy <= 100 ? p.accuracy : null;

  let runId: string | undefined;
  if (p.runId !== undefined) {
    if (!isValidUuid(p.runId)) {
      return { valid: false, message: "runId must be a valid UUID v4" };
    }
    runId = p.runId;
  }

  return {
    valid: true,
    data: {
      gameId: p.gameId,
      score: p.score,
      cleared,
      bestCombo,
      survivedMs,
      wpm,
      accuracy,
      runId,
    },
  };
}

export interface ValidatedProfileUpdateInput {
  displayName?: string;
  username?: string;
}

export function validateProfileUpdateInput(
  data: unknown
): { valid: true; data: ValidatedProfileUpdateInput } | { valid: false; message: string } {
  if (typeof data !== "object" || data === null) {
    return { valid: false, message: "Payload must be a non-null object" };
  }

  const p = data as Record<string, unknown>;
  const out: ValidatedProfileUpdateInput = {};

  if (p.displayName !== undefined) {
    if (typeof p.displayName !== "string" || p.displayName.trim().length === 0 || p.displayName.length > 50) {
      return { valid: false, message: "displayName must be between 1 and 50 characters" };
    }
    // Reject control characters
    if (/[\x00-\x1F\x7F]/.test(p.displayName)) {
      return { valid: false, message: "displayName contains invalid control characters" };
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

export function validatePreferencesInput(
  data: unknown
): { valid: true; data: ValidatedPreferencesInput } | { valid: false; message: string } {
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
    if (typeof p.soundEnabled !== "boolean") return { valid: false, message: "soundEnabled must be a boolean" };
    out.soundEnabled = p.soundEnabled;
  }
  if (p.soundVolume !== undefined) {
    if (typeof p.soundVolume !== "number" || !Number.isFinite(p.soundVolume) || p.soundVolume < 0 || p.soundVolume > 1) {
      return { valid: false, message: "soundVolume must be a number between 0 and 1" };
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
    if (typeof p.punctuation !== "boolean") return { valid: false, message: "punctuation must be a boolean" };
    out.punctuation = p.punctuation;
  }
  if (p.numbers !== undefined) {
    if (typeof p.numbers !== "boolean") return { valid: false, message: "numbers must be a boolean" };
    out.numbers = p.numbers;
  }

  return { valid: true, data: out };
}

export interface ValidatedXpAwardInput {
  eventType: "game_completion" | "lesson_completion" | "typing_test";
  runId: string;
}

/**
 * Validates XP request.
 * CRITICAL SECURITY INVARIANT: Arbitrary client-selected amounts (e.g. { amount: 2000 })
 * are strictly forbidden. XP can only be earned through verified server events.
 */
export function validateXpAwardInput(
  data: unknown
): { valid: true; data: ValidatedXpAwardInput } | { valid: false; message: string } {
  if (typeof data !== "object" || data === null) {
    return { valid: false, message: "Payload must be a non-null object" };
  }

  const p = data as Record<string, unknown>;

  // Reject legacy client-chosen amount vulnerability
  if ("amount" in p) {
    return {
      valid: false,
      message: "Arbitrary XP granting is forbidden. XP is awarded authoritatively through game, lesson, and typing test completions.",
    };
  }

  if (typeof p.eventType !== "string" || !["game_completion", "lesson_completion", "typing_test"].includes(p.eventType)) {
    return { valid: false, message: "Invalid or missing eventType" };
  }

  if (!isValidUuid(p.runId)) {
    return { valid: false, message: "runId must be a valid UUID v4" };
  }

  return {
    valid: true,
    data: {
      eventType: p.eventType as ValidatedXpAwardInput["eventType"],
      runId: p.runId,
    },
  };
}

export interface ValidatedAchievementGrantInput {
  achievementId: string;
}

export function validateAchievementGrantInput(
  data: unknown
): { valid: true; data: ValidatedAchievementGrantInput } | { valid: false; message: string } {
  if (typeof data !== "object" || data === null) {
    return { valid: false, message: "Payload must be a non-null object" };
  }

  const p = data as Record<string, unknown>;

  if (typeof p.achievementId !== "string" || !VALID_ACHIEVEMENT_IDS.has(p.achievementId)) {
    return { valid: false, message: "Invalid or unknown achievementId" };
  }

  return { valid: true, data: { achievementId: p.achievementId } };
}
