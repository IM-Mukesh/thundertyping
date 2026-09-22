import { ENGLISH_WORDS } from "@/data/words/english-1k";
import { generateWords } from "@/lib/typing-engine/word-generator";
import type { LessonContentSpec, LessonDefinition } from "@/lib/lessons/lesson-types";

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
 * Real dictionary words built entirely from already-learned keys. Only
 * viable once enough letters are known -- falls back to buildDrillLine when
 * too few words qualify, rather than returning a suspiciously short or
 * repetitive line.
 */
export function buildReviewText(allowedKeys: string[], wordCount: number): string {
  const allowed = new Set(allowedKeys.map((k) => k.toLowerCase()));
  const candidates = ENGLISH_WORDS.filter((word) => [...word].every((c) => allowed.has(c)));
  if (candidates.length < MIN_REVIEW_CANDIDATES) {
    return buildDrillLine(allowedKeys, wordCount);
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
      text = buildDrillLine(content.allowedKeys, content.wordCount);
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

export interface SubLessonSpec {
  /** 1-based position within the unit. */
  step: number;
  content: LessonContentSpec;
  minAccuracy: number;
}

// How far into a unit's steps a wordCount ramp reaches full size, and how
// small the very first step starts relative to it. Kept as named constants
// rather than inlined so the ramp's shape is a single place to tune.
const MIN_WORD_COUNT_FRACTION = 0.4;
const MIN_WORD_COUNT_FLOOR = 4;
/** Numbers, when a graduation unit asks for them, only appear once a run is at least this far scaled -- an early sub-lesson shouldn't throw digits in before the sentence rhythm itself is comfortable. */
const NUMBERS_INTRODUCED_AT = 0.5;

function scaleContent(content: LessonContentSpec, progress: number, isFirstStep: boolean): LessonContentSpec {
  const wordCount = Math.max(
    MIN_WORD_COUNT_FLOOR,
    Math.round(content.wordCount * (MIN_WORD_COUNT_FRACTION + (1 - MIN_WORD_COUNT_FRACTION) * progress)),
  );

  // A "review" unit's first step warms up as a plain drill over the same
  // keys -- real words are the point of the unit, but starting cold on full
  // words is a bigger jump than starting cold on a drill line was.
  if (content.kind === "review" && isFirstStep) {
    return { kind: "drill", allowedKeys: content.allowedKeys, wordCount };
  }

  if (content.kind === "graduation") {
    return { ...content, wordCount, numbers: content.numbers ? progress >= NUMBERS_INTRODUCED_AT : false };
  }

  return { ...content, wordCount };
}

/**
 * Expands one unit's "full difficulty" content spec into `subLessonCount`
 * graduated steps, word count ramping from a short warmup to the unit's full
 * length. Pure and deterministic in shape (only the generated *text* is
 * random, produced later per-attempt by buildTextForContent) -- so this is
 * safe to call from a dashboard row just to show step counts, not only from
 * the drill itself.
 */
export function buildSubLessons(unit: LessonDefinition): SubLessonSpec[] {
  const n = Math.max(1, unit.subLessonCount);
  const steps: SubLessonSpec[] = [];
  for (let i = 0; i < n; i++) {
    const progress = n <= 1 ? 1 : i / (n - 1);
    steps.push({
      step: i + 1,
      content: scaleContent(unit.content, progress, i === 0),
      minAccuracy: unit.minAccuracy,
    });
  }
  return steps;
}
