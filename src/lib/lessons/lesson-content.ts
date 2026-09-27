import { generateWords } from "@/lib/typing-engine/word-generator";
import type { DrillStyle, LessonContentSpec, LessonDefinition } from "@/lib/lessons/lesson-types";
import {
  generateAccuracyDrill,
  generateAlternationDrill,
  generatePairMixDrill,
  generatePatternDrill,
  generateSingleKeyDiscoveryDrill,
  generateVocabularyDrill,
  generateWarmupDrill,
} from "@/lib/lessons/content-generator";

// Custom mode caps at 2000 chars in the engine itself (see engine-types.ts) --
// lessons stay well under that, but the cap is enforced here too so a future
// lesson with a large wordCount can't silently exceed it.
const MAX_LESSON_CHARS = 2000;

/**
 * A synthetic pseudo-word sampled from the allowed key set. Real dictionary
 * words don't exist within an early lesson's tiny key set (e.g. `f j`),
 * so the first lessons drill letter combinations directly with deliberate finger coordination.
 */
export function buildDrillLine(allowedKeys: string[], wordCount: number, seed: number = 42): string {
  return generatePatternDrill(allowedKeys, wordCount, seed);
}

/**
 * Warm-up drill lines focusing on repeated single-key taps and short micro-bursts
 * (e.g. "aa ff dd ss"). Ideal for opening steps to anchor
 * finger placement before moving into alternating patterns.
 */
export function buildWarmupLine(allowedKeys: string[], wordCount: number, seed: number = 42): string {
  return generateWarmupDrill(allowedKeys, wordCount, seed);
}

/**
 * Pattern practice drill lines emphasizing rhythmic alternating pairs and mirror
 * sequences (e.g. "as sa as sa", "df fd df fd", "jkl lkj").
 * Builds mechanical finger coordination rather than random letter noise.
 */
export function buildPatternLine(allowedKeys: string[], wordCount: number, seed: number = 202): string {
  return generatePatternDrill(allowedKeys, wordCount, seed);
}

/**
 * Accuracy drill lines: 3-4 character sequences with alternating fingers,
 * forcing clean returns to the home row resting position.
 */
export function buildAccuracyLine(allowedKeys: string[], wordCount: number, seed: number = 101): string {
  return generateAccuracyDrill(allowedKeys, wordCount, seed);
}

/**
 * Real dictionary words built entirely from already-learned keys. Only
 * viable once enough letters are known -- falls back to pattern drill when
 * too few words qualify, rather than returning a suspiciously short or
 * repetitive line.
 */
export function buildReviewText(allowedKeys: string[], wordCount: number, seed: number = 303): string {
  return generateVocabularyDrill(allowedKeys, wordCount, seed);
}

/** The later tiers reuse the same generator the real typing test uses, now that every key has been taught. */
export function buildGraduationText(wordCount: number, options: { numbers?: boolean } = {}): string {
  return generateWords(wordCount, { punctuation: true, numbers: options.numbers ?? false }).join(" ");
}

/** Builds the actual text for one content spec -- shared by buildLessonText and each sub-lesson step. */
export function buildTextForContent(content: LessonContentSpec, seed?: number): string {
  let text: string;
  const actualSeed = seed ?? (content.wordCount * 17 + (content.kind.length * 31));
  switch (content.kind) {
    case "drill": {
      const k1 = (content.focusKeys && content.focusKeys.length >= 1)
        ? content.focusKeys[0]
        : (content.allowedKeys.length >= 2 ? content.allowedKeys[content.allowedKeys.length - 2] : content.allowedKeys[0]);
      const k2 = (content.focusKeys && content.focusKeys.length >= 2)
        ? content.focusKeys[1]
        : content.allowedKeys[content.allowedKeys.length - 1];

      if (content.style === "discover-1") {
        text = generateSingleKeyDiscoveryDrill(k1, content.wordCount, actualSeed);
      } else if (content.style === "discover-2") {
        text = generateSingleKeyDiscoveryDrill(k2, content.wordCount, actualSeed);
      } else if (content.style === "pair-mix") {
        text = generatePairMixDrill(k1, k2, content.wordCount, actualSeed);
      } else if (content.style === "alternation") {
        text = generateAlternationDrill(k1, k2, content.wordCount, actualSeed);
      } else if (content.style === "warmup") {
        text = buildWarmupLine(content.allowedKeys, content.wordCount, actualSeed);
      } else if (content.style === "pattern" || content.style === "integration") {
        text = buildPatternLine(content.allowedKeys, content.wordCount, actualSeed);
      } else if (content.style === "accuracy") {
        text = buildAccuracyLine(content.allowedKeys, content.wordCount, actualSeed);
      } else {
        text = buildDrillLine(content.allowedKeys, content.wordCount, actualSeed);
      }
      break;
    }
    case "review":
      text = buildReviewText(content.allowedKeys, content.wordCount, actualSeed);
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
): { phase: SubLessonPhase; title: string; description: string; objective: string; style?: DrillStyle; minAccuracy?: number } {
  // If unit introduces exactly 2 new keys and has 7 steps, use the 7-phase deliberate motor progression
  if (unit.newKeys.length === 2 && totalSteps === 7) {
    const k1 = unit.newKeys[0].toUpperCase();
    const k2 = unit.newKeys[1].toUpperCase();

    switch (stepIndex) {
      case 0:
        return {
          phase: "warmup",
          title: `Discover ${k1}`,
          description: `Focus on tactile feel and finger placement for ${k1}. Strike cleanly without looking at the keyboard.`,
          objective: `Tap ${k1} with relaxed, consistent touch (~75% accuracy to pass).`,
          style: "discover-1",
          minAccuracy: 75,
        };
      case 1:
        return {
          phase: "warmup",
          title: `Discover ${k2}`,
          description: `Focus on tactile feel and finger placement for ${k2}. Strike cleanly without looking at the keyboard.`,
          objective: `Tap ${k2} with relaxed, consistent touch (~75% accuracy to pass).`,
          style: "discover-2",
          minAccuracy: 75,
        };
      case 2:
        return {
          phase: "patterns",
          title: `Pair & Mix: ${k1} + ${k2}`,
          description: `Combine ${k1} and ${k2} in rhythmic blocks to build coordinated reflex between both hands.`,
          objective: `Balance finger strikes smoothly between both hands (78%+ accuracy).`,
          style: "pair-mix",
          minAccuracy: Math.min(78, unit.minAccuracy),
        };
      case 3:
        return {
          phase: "patterns",
          title: "Rapid Alternation",
          description: `Alternate strokes between ${k1} and ${k2} to train two-hand cadence and avoid hesitation.`,
          objective: `Maintain steady cadence without pausing on hand switches (80%+ accuracy).`,
          style: "alternation",
          minAccuracy: Math.min(80, unit.minAccuracy),
        };
      case 4:
        return {
          phase: "accuracy",
          title: "Prior Key Integration",
          description: `Combine ${k1} and ${k2} with all previously learned keys across the keyboard.`,
          objective: `Integrate new reaches into the established home-row baseline (80%+ accuracy).`,
          style: "integration",
          minAccuracy: Math.min(80, unit.minAccuracy),
        };
      case 5:
        return {
          phase: "mixed",
          title: "Flow Challenge",
          description: "Dynamic character patterns testing real-time recall under speed.",
          objective: "Maintain consistent typing rhythm without rushing (82%+ accuracy).",
          style: "random",
          minAccuracy: Math.min(82, unit.minAccuracy),
        };
      case 6:
      default:
        return {
          phase: "checkpoint",
          title: "Unit Checkpoint",
          description: "Full-length evaluation testing accuracy and rhythm across the full unit passage.",
          objective: `Score ${unit.minAccuracy}%+ accuracy to complete this unit and earn your stars.`,
          style: "random",
          minAccuracy: unit.minAccuracy,
        };
    }
  }

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
      minAccuracy: unit.minAccuracy,
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
      minAccuracy: Math.max(75, unit.minAccuracy - 4),
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
        minAccuracy: Math.max(76, unit.minAccuracy - 2),
      };
    }
    return {
      phase: "accuracy",
      title: "Controlled Accuracy",
      description: "Longer sequences requiring clean finger returns to the home position.",
      objective: "Emphasize clean keystrokes without rushing.",
      style: "accuracy",
      minAccuracy: unit.minAccuracy,
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
      minAccuracy: Math.max(76, unit.minAccuracy - 3),
    };
  }
  if (progressRatio <= 0.55) {
    return {
      phase: "accuracy",
      title: "Controlled Accuracy",
      description: "Precision-focused drills with zero tolerance for rushed keystrokes.",
      objective: `Hit ${unit.minAccuracy}%+ with steady, deliberate finger movement.`,
      style: "accuracy",
      minAccuracy: Math.max(78, unit.minAccuracy - 2),
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
      minAccuracy: Math.max(80, unit.minAccuracy - 1),
    };
  }
  return {
    phase: "rhythm",
    title: "Speed & Endurance",
    description: "Longer sustained typing runs preparing for the final checkpoint.",
    objective: "Maintain consistent typing pace across the full sequence.",
    style: "random",
    minAccuracy: unit.minAccuracy,
  };
}

function scaleContent(
  content: LessonContentSpec,
  progress: number,
  isFirstStep: boolean,
  style?: DrillStyle,
  focusKeys?: string[],
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
    return {
      ...content,
      wordCount,
      style,
      ...(focusKeys && focusKeys.length > 0 ? { focusKeys } : {}),
    };
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
      content: scaleContent(unit.content, progress, i === 0, pedagogy.style, unit.newKeys),
      minAccuracy: pedagogy.minAccuracy ?? unit.minAccuracy,
      phase: pedagogy.phase,
      title: pedagogy.title,
      description: pedagogy.description,
      objective: pedagogy.objective,
    });
  }
  return steps;
}
