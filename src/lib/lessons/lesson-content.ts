import { ENGLISH_WORDS } from "@/data/words/english-1k";
import { generateWords } from "@/lib/typing-engine/word-generator";
import type { DrillStyle, LessonContentSpec, LessonDefinition } from "@/lib/lessons/lesson-types";

// Custom mode caps at 2000 chars in the engine itself (see engine-types.ts) --
// lessons stay well under that, but the cap is enforced here too so a future
// lesson with a large wordCount can't silently exceed it.
const MAX_LESSON_CHARS = 2000;
const MIN_REVIEW_CANDIDATES = 8;

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function randomFrom<T>(items: T[]): T {
  return items[randomInt(items.length)];
}

/**
 * A synthetic pseudo-word sampled from the allowed key set. Real dictionary
 * words don't exist within an early lesson's tiny key set (e.g. `a s d f`),
 * so the first lessons drill letter combinations directly -- the same
 * approach every touch-typing course uses for its opening exercises.
 */
export function buildDrillLine(allowedKeys: string[], wordCount: number): string {
  const keys = allowedKeys.filter((k) => k.trim().length > 0);
  if (keys.length === 0) return "";
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const length = 2 + randomInt(3); // 2-4 characters
    let word = "";
    for (let j = 0; j < length; j++) word += randomFrom(keys);
    words.push(word);
  }
  return words.join(" ");
}

/**
 * Warm-up drill lines focusing on repeated single-key taps and short micro-bursts
 * (e.g. "aaa fff ddd sss", "aa ff dd ss"). Ideal for opening steps to anchor
 * finger placement before moving into alternating patterns.
 */
export function buildWarmupLine(allowedKeys: string[], wordCount: number): string {
  const keys = allowedKeys.filter((k) => k.trim().length > 0);
  if (keys.length === 0) return "";
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const key = randomFrom(keys);
    const repeat = 2 + randomInt(2); // 2-3 of the same character
    words.push(key.repeat(repeat));
  }
  return words.join(" ");
}

/**
 * Pattern practice drill lines emphasizing rhythmic alternating pairs and mirror
 * sequences (e.g. "as sa as sa", "df fd df fd", "jkl lkj").
 * Builds mechanical finger coordination rather than random letter noise.
 */
export function buildPatternLine(allowedKeys: string[], wordCount: number): string {
  const keys = allowedKeys.filter((k) => k.trim().length > 0);
  if (keys.length === 0) return "";
  if (keys.length === 1) return buildWarmupLine(keys, wordCount);

  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const k1 = randomFrom(keys);
    let k2 = randomFrom(keys);
    while (k2 === k1 && keys.length > 1) {
      k2 = randomFrom(keys);
    }
    const patternType = randomInt(3);
    if (patternType === 0) {
      words.push(`${k1}${k2}${k1}`);
    } else if (patternType === 1) {
      words.push(`${k1}${k2}${k2}${k1}`);
    } else {
      words.push(`${k1}${k2}${k1}${k2}`);
    }
  }
  return words.join(" ");
}

/**
 * Accuracy drill lines: 3-4 character sequences with alternating fingers,
 * forcing clean returns to the home row resting position.
 */
export function buildAccuracyLine(allowedKeys: string[], wordCount: number): string {
  const keys = allowedKeys.filter((k) => k.trim().length > 0);
  if (keys.length === 0) return "";
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const length = 3 + randomInt(2); // 3-4 characters
    let word = "";
    let lastChar = "";
    for (let j = 0; j < length; j++) {
      let char = randomFrom(keys);
      // Avoid 3 identical characters in a row for controlled precision
      if (char === lastChar && keys.length > 1) {
        char = randomFrom(keys);
      }
      word += char;
      lastChar = char;
    }
    words.push(word);
  }
  return words.join(" ");
}

/**
 * Real dictionary words built entirely from already-learned keys. Only
 * viable once enough letters are known -- falls back to buildDrillLine when
 * too few words qualify, rather than returning a suspiciously short or
 * repetitive line.
 */
export function buildReviewText(allowedKeys: string[], wordCount: number): string {
  const allowed = new Set(allowedKeys.map((k) => k.toLowerCase()));
  const candidates = ENGLISH_WORDS.filter((word) => [...word].every((c) => allowed.has(c)));
  if (candidates.length < MIN_REVIEW_CANDIDATES) {
    return buildPatternLine(allowedKeys, wordCount);
  }

  const words: string[] = [];
  let previous: string | undefined;
  for (let i = 0; i < wordCount; i++) {
    let word: string;
    do {
      word = randomFrom(candidates);
    } while (word === previous && candidates.length > 1);
    previous = word;
    words.push(word);
  }
  return words.join(" ");
}

/** The later tiers reuse the same generator the real typing test uses, now that every key has been taught. */
export function buildGraduationText(wordCount: number, options: { numbers?: boolean } = {}): string {
  return generateWords(wordCount, { punctuation: true, numbers: options.numbers ?? false }).join(" ");
}

/** Builds the actual text for one content spec -- shared by buildLessonText and each sub-lesson step. */
export function buildTextForContent(content: LessonContentSpec): string {
  let text: string;
  switch (content.kind) {
    case "drill":
      if (content.style === "warmup") {
        text = buildWarmupLine(content.allowedKeys, content.wordCount);
      } else if (content.style === "pattern") {
        text = buildPatternLine(content.allowedKeys, content.wordCount);
      } else if (content.style === "accuracy") {
        text = buildAccuracyLine(content.allowedKeys, content.wordCount);
      } else {
        text = buildDrillLine(content.allowedKeys, content.wordCount);
      }
      break;
    case "review":
      text = buildReviewText(content.allowedKeys, content.wordCount);
      break;
    case "graduation":
      text = buildGraduationText(content.wordCount, { numbers: content.numbers });
      break;
  }
  return text.length > MAX_LESSON_CHARS ? text.slice(0, MAX_LESSON_CHARS).trim() : text;
}

export function buildLessonText(definition: LessonDefinition): string {
  return buildTextForContent(definition.content);
}

export type SubLessonPhase =
  | "warmup"
  | "patterns"
  | "accuracy"
  | "words"
  | "mixed"
  | "rhythm"
  | "checkpoint";

export interface SubLessonSpec {
  /** 1-based position within the unit. */
  step: number;
  content: LessonContentSpec;
  minAccuracy: number;
  phase: SubLessonPhase;
  title: string;
  description: string;
  objective: string;
}

// How far into a unit's steps a wordCount ramp reaches full size, and how
// small the very first step starts relative to it. Kept as named constants
// rather than inlined so the ramp's shape is a single place to tune.
const MIN_WORD_COUNT_FRACTION = 0.4;
const MIN_WORD_COUNT_FLOOR = 4;
/** Numbers, when a graduation unit asks for them, only appear once a run is at least this far scaled -- an early sub-lesson shouldn't throw digits in before the sentence rhythm itself is comfortable. */
const NUMBERS_INTRODUCED_AT = 0.5;

function getStepPedagogy(
  unit: LessonDefinition,
  stepIndex: number,
  totalSteps: number,
): { phase: SubLessonPhase; title: string; description: string; objective: string; style?: DrillStyle } {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  const keySummary = unit.newKeys.length > 0 ? unit.newKeys.map((k) => k.toUpperCase()).join(", ") : "target keys";

  if (isLast) {
    return {
      phase: "checkpoint",
      title: "Unit Checkpoint",
      description: "Full-length evaluation testing accuracy and rhythm across the full unit passage.",
      objective: `Score ${unit.minAccuracy}%+ accuracy to complete this unit.`,
      style: "random",
    };
  }

  if (isFirst) {
    return {
      phase: "warmup",
      title: "Key Warm-up",
      description: unit.newKeys.length > 0
        ? `Focus on newly introduced keys (${keySummary}) without looking down.`
        : "Warm up your fingers on the baseline key positions.",
      objective: `Build muscle memory and tactile confidence for ${keySummary}.`,
      style: "warmup",
    };
  }

  // Intermediate steps
  if (totalSteps <= 4) {
    if (stepIndex === 1) {
      return {
        phase: "patterns",
        title: "Pattern Practice",
        description: "Practice alternating finger pairs and smooth key transitions.",
        objective: "Maintain smooth cadence on adjacent and cross-hand pairs.",
        style: "pattern",
      };
    }
    return {
      phase: "accuracy",
      title: "Controlled Accuracy",
      description: "Longer sequences requiring clean finger returns to the home position.",
      objective: "Emphasize clean keystrokes without rushing.",
      style: "accuracy",
    };
  }

  // 5 to 11 steps
  const progressRatio = stepIndex / (totalSteps - 1);
  if (progressRatio <= 0.3) {
    return {
      phase: "patterns",
      title: "Pattern Practice",
      description: "Rhythmic key combinations and finger coordination drills.",
      objective: "Keep your hands anchored on home row while reaching.",
      style: "pattern",
    };
  }
  if (progressRatio <= 0.55) {
    return {
      phase: "accuracy",
      title: "Controlled Accuracy",
      description: "Precision-focused drills with zero tolerance for rushed keystrokes.",
      objective: `Hit ${unit.minAccuracy}%+ with steady, deliberate finger movement.`,
      style: "accuracy",
    };
  }
  if (progressRatio <= 0.8) {
    return {
      phase: unit.content.kind === "drill" ? "mixed" : "words",
      title: unit.content.kind === "drill" ? "Mixed Combinations" : "Vocabulary Flow",
      description: unit.content.kind === "drill"
        ? "Blended character streams combining new reaches with home row anchors."
        : "Real words and natural sequences testing real-world typing rhythm.",
      objective: "Transition smoothly between words without breaking typing cadence.",
      style: "random",
    };
  }
  return {
    phase: "rhythm",
    title: "Speed & Endurance",
    description: "Longer sustained typing runs preparing for the final checkpoint.",
    objective: "Maintain consistent typing pace across the full sequence.",
    style: "random",
  };
}

function scaleContent(
  content: LessonContentSpec,
  progress: number,
  isFirstStep: boolean,
  style?: DrillStyle,
): LessonContentSpec {
  const wordCount = Math.max(
    MIN_WORD_COUNT_FLOOR,
    Math.round(content.wordCount * (MIN_WORD_COUNT_FRACTION + (1 - MIN_WORD_COUNT_FRACTION) * progress)),
  );

  // A "review" unit's first step warms up as a plain drill over the same
  // keys -- real words are the point of the unit, but starting cold on full
  // words is a bigger jump than starting cold on a drill line was.
  if (content.kind === "review" && isFirstStep) {
    return { kind: "drill", allowedKeys: content.allowedKeys, wordCount, style: "warmup" };
  }

  if (content.kind === "graduation") {
    return { ...content, wordCount, numbers: content.numbers ? progress >= NUMBERS_INTRODUCED_AT : false };
  }

  if (content.kind === "drill") {
    return { ...content, wordCount, style };
  }

  return { ...content, wordCount };
}

/**
 * Expands one unit's "full difficulty" content spec into `subLessonCount`
 * graduated steps with pedagogical progression (Warm-up -> Patterns -> Accuracy -> Words -> Checkpoint).
 * Pure and deterministic in shape (only the generated *text* is
 * random, produced later per-attempt by buildTextForContent) -- safe to call
 * from a dashboard row or preview.
 */
export function buildSubLessons(unit: LessonDefinition): SubLessonSpec[] {
  const n = Math.max(1, unit.subLessonCount);
  const steps: SubLessonSpec[] = [];
  for (let i = 0; i < n; i++) {
    const progress = n <= 1 ? 1 : i / (n - 1);
    const pedagogy = getStepPedagogy(unit, i, n);
    steps.push({
      step: i + 1,
      content: scaleContent(unit.content, progress, i === 0, pedagogy.style),
      minAccuracy: unit.minAccuracy,
      phase: pedagogy.phase,
      title: pedagogy.title,
      description: pedagogy.description,
      objective: pedagogy.objective,
    });
  }
  return steps;
}
