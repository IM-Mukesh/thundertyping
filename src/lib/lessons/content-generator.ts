import { ENGLISH_WORDS } from "@/data/words/english-1k";
import { generateWords } from "@/lib/typing-engine/word-generator";
import {
  fingerForKey,
  handForKey,
  HOME_KEY_FOR_FINGER,
  type FingerId,
} from "@/lib/lessons/keyboard-layout";

/**
 * Seeded PRNG using Mulberry32.
 * Produces deterministic, reproducible pseudo-random numbers in [0, 1).
 */
export function createRng(seed: number = 1337): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface GeneratorOptions {
  seed?: number;
  wordCount?: number;
  allowedKeys?: readonly string[];
  focusKeys?: readonly string[];
  focusTransitions?: readonly [string, string][];
  focusFingers?: readonly FingerId[];
  includePunctuation?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  capitalize?: boolean;
}

/** Top 50 most frequent English bigrams */
export const HIGH_FREQUENCY_BIGRAMS: readonly string[] = [
  "th", "he", "in", "er", "an", "re", "on", "at", "en", "nd",
  "ti", "es", "or", "te", "of", "ed", "is", "it", "al", "ar",
  "st", "to", "nt", "ng", "se", "ha", "as", "ou", "io", "le",
  "ve", "co", "me", "de", "hi", "ri", "ro", "ic", "ne", "ea",
  "ra", "ce", "li", "ch", "ll", "be", "ma", "si", "om", "ur",
];

/** Top 30 most frequent English trigrams */
export const HIGH_FREQUENCY_TRIGRAMS: readonly string[] = [
  "the", "and", "ing", "her", "hat", "his", "tha", "ere", "for", "ent",
  "ion", "ter", "was", "you", "ith", "ver", "all", "wit", "thi", "tio",
  "ate", "com", "ear", "ess", "pro", "sta", "res", "tin", "eve", "con",
];

/** Clean set of lowercase allowed characters */
function normalizeKeys(keys: readonly string[]): string[] {
  const set = new Set<string>();
  for (const k of keys) {
    if (k && k.trim().length > 0) {
      set.add(k.toLowerCase());
    }
  }
  return Array.from(set);
}

/**
 * Builds a warm-up drill line focused on tactile anchor taps and rhythmic repetitions.
 * E.g., for ["f", "j"]: "ff jj ff jj fff jjj fj jf"
 */
export function generateWarmupDrill(
  allowedKeys: readonly string[],
  wordCount: number = 10,
  seed: number = 42,
): string {
  const keys = normalizeKeys(allowedKeys);
  if (keys.length === 0) return "";
  const rng = createRng(seed);

  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const k1 = keys[Math.floor(rng() * keys.length)];
    const mode = i % 3;
    if (mode === 0) {
      // Double tap: "ff", "jj"
      words.push(`${k1}${k1}`);
    } else if (mode === 1) {
      // Triple tap: "fff", "ddd"
      words.push(`${k1}${k1}${k1}`);
    } else {
      // Micro transition: "fj", "dk"
      const k2 = keys[Math.floor(rng() * keys.length)];
      words.push(`${k1}${k2}`);
    }
  }
  const result = words.join(" ");
  return result.length < 10 ? words.concat(words).join(" ") : result;
}

/**
 * Phase A / B: Discovers a single new key with controlled motor repetitions.
 * Strictly guarantees >= 10 target characters (e.g. "ffff ffff fff fffff ffff").
 */
export function generateSingleKeyDiscoveryDrill(
  key: string,
  wordCount: number = 8,
  seed: number = 10,
): string {
  const cleanKey = key.toLowerCase();
  const rng = createRng(seed);
  const words: string[] = [];
  for (let i = 0; i < Math.max(4, wordCount); i++) {
    const len = 3 + Math.floor(rng() * 3); // 3, 4, or 5 repetitions
    words.push(cleanKey.repeat(len));
  }
  const result = words.join(" ");
  return result.length < 10 ? cleanKey.repeat(12) : result;
}

/**
 * Phase C: Pairs and mixes 2 new keys in isolated rhythmic blocks.
 * E.g., for ["f", "j"]: "ffff jjjj ffff jjjj ff jj ff jj"
 */
export function generatePairMixDrill(
  key1: string,
  key2: string,
  wordCount: number = 10,
  seed: number = 20,
): string {
  const k1 = key1.toLowerCase();
  const k2 = key2.toLowerCase();
  const rng = createRng(seed);
  const words: string[] = [];
  for (let i = 0; i < Math.max(6, wordCount); i++) {
    const target = i % 2 === 0 ? k1 : k2;
    const len = 3 + Math.floor(rng() * 2); // 3 or 4 repetitions
    words.push(target.repeat(len));
  }
  const result = words.join(" ");
  return result.length < 10 ? `${k1.repeat(4)} ${k2.repeat(4)} ${k1.repeat(4)}` : result;
}

/**
 * Phase D: Rhythmic hand alternation between 2 keys.
 * E.g., for ["f", "j"]: "fjfjfj jfjfjf fjfj jfjf"
 */
export function generateAlternationDrill(
  key1: string,
  key2: string,
  wordCount: number = 10,
  seed: number = 30,
): string {
  const k1 = key1.toLowerCase();
  const k2 = key2.toLowerCase();
  const rng = createRng(seed);
  const words: string[] = [];
  for (let i = 0; i < Math.max(6, wordCount); i++) {
    const startFirst = i % 2 === 0;
    const a = startFirst ? k1 : k2;
    const b = startFirst ? k2 : k1;
    const len = 4 + Math.floor(rng() * 3); // 4, 5, or 6 characters
    let w = "";
    for (let c = 0; c < len; c++) {
      w += c % 2 === 0 ? a : b;
    }
    words.push(w);
  }
  const result = words.join(" ");
  return result.length < 10 ? `${k1}${k2}${k1}${k2} ${k2}${k1}${k2}${k1}` : result;
}

/**
 * Builds home-row anchor reach drills.
 * Forces the typist to depart from home row to the target reach key, then immediately return to home.
 * E.g., for reach 'R' (left index): "frf frf"
 */
export function generateAnchorReachDrill(
  reachKeys: readonly string[],
  wordCount: number = 12,
  seed: number = 101,
): string {
  const keys = normalizeKeys(reachKeys);
  if (keys.length === 0) return "";
  const rng = createRng(seed);

  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const reachKey = keys[Math.floor(rng() * keys.length)];
    const finger = fingerForKey(reachKey);
    const homeKey = finger ? HOME_KEY_FOR_FINGER[finger] : "f";

    // Standard touch typing anchor exercise: home -> reach -> home
    const patternVariant = Math.floor(rng() * 3);
    if (patternVariant === 0) {
      words.push(`${homeKey}${reachKey}${homeKey}`);
    } else if (patternVariant === 1) {
      words.push(`${homeKey}${reachKey}${reachKey}${homeKey}`);
    } else {
      words.push(`${reachKey}${homeKey}${reachKey}`);
    }
  }
  return words.join(" ");
}

/**
 * Generates alternating-hand and smooth finger coordination patterns.
 * Avoids chaotic character soup by prioritizing natural bigrams and hand alternation.
 */
export function generatePatternDrill(
  allowedKeys: readonly string[],
  wordCount: number = 12,
  seed: number = 202,
): string {
  const keys = normalizeKeys(allowedKeys);
  if (keys.length === 0) return "";
  if (keys.length === 1) return generateWarmupDrill(keys, wordCount, seed);
  const rng = createRng(seed);

  const keySet = new Set(keys);
  // Find valid English bigrams that can be formed using allowed keys
  const validBigrams = HIGH_FREQUENCY_BIGRAMS.filter((bg) =>
    keySet.has(bg[0]) && keySet.has(bg[1])
  );

  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    if (validBigrams.length > 0 && rng() > 0.35) {
      const bg = validBigrams[Math.floor(rng() * validBigrams.length)];
      if (rng() > 0.5) {
        words.push(`${bg}${bg}`);
      } else {
        words.push(`${bg}${bg[0]}`);
      }
    } else {
      // Select two keys, preferring alternating hands
      const k1 = keys[Math.floor(rng() * keys.length)];
      let k2 = keys[Math.floor(rng() * keys.length)];
      // Attempt to pick opposite hand
      const hand1 = handForKey(k1);
      const oppositeKeys = keys.filter((k) => handForKey(k) !== hand1);
      if (oppositeKeys.length > 0 && rng() > 0.3) {
        k2 = oppositeKeys[Math.floor(rng() * oppositeKeys.length)];
      }

      const patternType = Math.floor(rng() * 4);
      if (patternType === 0) {
        words.push(`${k1}${k2}${k1}`);
      } else if (patternType === 1) {
        words.push(`${k1}${k2}${k2}${k1}`);
      } else if (patternType === 2) {
        words.push(`${k1}${k2}${k1}${k2}`);
      } else {
        words.push(`${k2}${k1}${k2}`);
      }
    }
  }

  // Flatten any internal spaces
  return words.join(" ").replace(/\s+/g, " ");
}

/**
 * Generates controlled accuracy drills: 3-4 character sequences requiring clean finger
 * coordination and steady return to home position without rushed keystrokes.
 */
export function generateAccuracyDrill(
  allowedKeys: readonly string[],
  wordCount: number = 12,
  seed: number = 101,
): string {
  const keys = normalizeKeys(allowedKeys);
  if (keys.length === 0) return "";
  if (keys.length === 1) return generateWarmupDrill(keys, wordCount, seed);
  const rng = createRng(seed);

  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const length = 3 + Math.floor(rng() * 2); // 3-4 characters
    let word = "";
    let lastChar = "";
    for (let j = 0; j < length; j++) {
      let char = keys[Math.floor(rng() * keys.length)];
      if (char === lastChar && keys.length > 1) {
        char = keys[Math.floor(rng() * keys.length)];
      }
      word += char;
      lastChar = char;
    }
    words.push(word);
  }
  return words.join(" ");
}

/**
 * Builds vocabulary text using real dictionary words that are strictly subset-compatible with allowedKeys.
 * Falls back gracefully to structured patterns if not enough dictionary words can be formed.
 */
export function generateVocabularyDrill(
  allowedKeys: readonly string[],
  wordCount: number = 15,
  seed: number = 303,
): string {
  const allowed = new Set(normalizeKeys(allowedKeys));
  const rng = createRng(seed);

  const candidates = ENGLISH_WORDS.filter(
    (w) => w.length >= 2 && [...w].every((char) => allowed.has(char))
  );

  // If fewer than 8 real words exist in the dictionary for this key set, supplement with pattern drills
  if (candidates.length < 8) {
    return generatePatternDrill(Array.from(allowed), wordCount, seed);
  }

  const words: string[] = [];
  let previous = "";
  for (let i = 0; i < wordCount; i++) {
    let word: string;
    let attempts = 0;
    do {
      word = candidates[Math.floor(rng() * candidates.length)];
      attempts++;
    } while (word === previous && candidates.length > 1 && attempts < 10);

    previous = word;
    words.push(word);
  }

  return words.join(" ");
}

/**
 * Generates targeted practice focusing on specific weak keys.
 * Blends the weak keys into context with anchor home row keys and real vocabulary.
 */
export function generateWeakKeyDrill(
  weakKeys: readonly string[],
  allAvailableKeys: readonly string[] = [],
  wordCount: number = 20,
  seed: number = 404,
): string {
  const weak = normalizeKeys(weakKeys);
  if (weak.length === 0) {
    return generateVocabularyDrill(
      allAvailableKeys.length > 0 ? allAvailableKeys : ["a", "s", "d", "f", "j", "k", "l", ";"],
      wordCount,
      seed,
    );
  }

  const rng = createRng(seed);
  const weakSet = new Set(weak);

  // Find English words that contain at least one weak key
  const availableSet = new Set(
    allAvailableKeys.length > 0
      ? normalizeKeys([...allAvailableKeys, ...weak])
      : [...weak, "a", "s", "d", "f", "j", "k", "l", "e", "i", "o", "u", "t", "r", "n", "m"]
  );

  const wordsWithWeakKeys = ENGLISH_WORDS.filter(
    (w) =>
      w.length >= 2 &&
      w.length <= 7 &&
      [...w].every((c) => availableSet.has(c)) &&
      [...w].some((c) => weakSet.has(c))
  );

  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    // 60% real words with the weak keys, 40% rhythmic isolation patterns
    if (wordsWithWeakKeys.length > 0 && rng() > 0.4) {
      words.push(wordsWithWeakKeys[Math.floor(rng() * wordsWithWeakKeys.length)]);
    } else {
      const wk = weak[Math.floor(rng() * weak.length)];
      const finger = fingerForKey(wk);
      const home = finger ? HOME_KEY_FOR_FINGER[finger] : "f";
      const variant = Math.floor(rng() * 3);
      if (variant === 0) words.push(`${wk}${wk}${home}${wk}`);
      else if (variant === 1) words.push(`${home}${wk}${home}`);
      else words.push(`${wk}${home}${wk}${home}`);
    }
  }

  return words.join(" ").replace(/\s+/g, " ");
}

/**
 * Generates drills specifically targeting difficult two-key transitions (digraphs).
 * E.g., if the user struggles with "ed" or "er" or "as":
 * constructs patterns like "ded ed ed red bed feed"
 */
export function generateTransitionDrill(
  transitions: readonly [string, string][],
  allAvailableKeys: readonly string[] = [],
  wordCount: number = 18,
  seed: number = 505,
): string {
  if (transitions.length === 0) {
    return generateVocabularyDrill(allAvailableKeys, wordCount, seed);
  }

  const rng = createRng(seed);
  const words: string[] = [];

  for (let i = 0; i < wordCount; i++) {
    const [c1, c2] = transitions[Math.floor(rng() * transitions.length)];
    const pair = `${c1}${c2}`;

    // Find words containing this pair if possible
    const matchingWords = ENGLISH_WORDS.filter(
      (w) => w.includes(pair) && (allAvailableKeys.length === 0 || [...w].every((c) => allAvailableKeys.includes(c)))
    );

    if (matchingWords.length > 0 && rng() > 0.35) {
      words.push(matchingWords[Math.floor(rng() * matchingWords.length)]);
    } else {
      // Isolation rhythm without embedded spaces
      const mode = Math.floor(rng() * 3);
      if (mode === 0) words.push(`${pair}${pair}`);
      else if (mode === 1) words.push(`${c1}${c2}${c1}${c2}`);
      else words.push(`${c1}${pair}${c2}`);
    }
  }

  return words.join(" ").replace(/\s+/g, " ");
}

/**
 * Generates finger-isolation drills for a specific weak finger (e.g. "left-pinky" or "right-ring").
 */
export function generateFingerIsolationDrill(
  targetFinger: FingerId,
  allAvailableKeys: readonly string[] = [],
  wordCount: number = 16,
  seed: number = 606,
): string {
  // Find all keys typed by this finger
  const fingerKeys = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "0",
    "q", "w", "e", "r", "t", "y", "u", "i", "o", "p",
    "a", "s", "d", "f", "g", "h", "j", "k", "l", ";",
    "z", "x", "c", "v", "b", "n", "m", ",", ".", "/",
  ].filter((k) => fingerForKey(k) === targetFinger);

  const homeKey = HOME_KEY_FOR_FINGER[targetFinger];
  const keys = allAvailableKeys.length > 0
    ? fingerKeys.filter((k) => allAvailableKeys.map((c) => c.toLowerCase()).includes(k))
    : fingerKeys;

  const activeKeys = keys.length > 0 ? keys : fingerKeys;
  const rng = createRng(seed);
  const words: string[] = [];

  for (let i = 0; i < wordCount; i++) {
    const k = activeKeys[Math.floor(rng() * activeKeys.length)];
    const v = Math.floor(rng() * 4);
    if (v === 0) words.push(`${homeKey}${k}${homeKey}`);
    else if (v === 1) words.push(`${k}${homeKey}${k}`);
    else if (v === 2) words.push(`${homeKey}${k}${k}${homeKey}`);
    else words.push(`${k}${k}${homeKey}`);
  }

  return words.join(" ");
}

/** Real-world prose samples for advanced graduation and natural prose stages */
export const NATURAL_PROSE_SAMPLES: readonly string[] = [
  "Touch typing is not merely about mechanical speed; it is the art of expressing your thoughts directly onto the screen without the cognitive barrier of searching for keys.",
  "When you master the home row anchors, your hands learn to navigate the entire keyboard with effortless spatial awareness and consistent cadence.",
  "Deliberate practice requires patience. Slowing down to stabilize accuracy at ninety-eight percent always builds a higher speed ceiling than rushing through errors.",
  "Consistent rhythm across all ten fingers eliminates physical fatigue and protects your wrists during extended hours of software development or writing.",
  "A quiet keyboard and steady keystrokes indicate muscle memory at work. Let your fingers rest gently on F and J before beginning each passage.",
  "Focus on clean returns to the resting position after every upward reach to the number row or downward reach to punctuation.",
];

/** Coding syntax samples for specialized technical practice */
export const CODE_SAMPLES: readonly string[] = [
  "const totalScore = scores.reduce((sum, item) => sum + item.score, 0);",
  "function calculateWpm(chars: number, ms: number): number { return Math.round((chars / 5) / (ms / 60000)); }",
  "if (accuracy >= 95 && wpm >= 60) { unlockNextMilestone(); return true; }",
  "export interface KeyPerformance { attempts: number; errors: number; accuracy: number; }",
  "const [state, setState] = useState<SessionState>({ ready: true, count: 0 });",
  "for (let i = 0; i < items.length; i++) { if (items[i].isValid()) count++; }",
];

/**
 * Builds graduation or real-world natural text.
 */
export function generateAdvancedText(
  mode: "prose" | "code" | "vocabulary" | "numbers-symbols",
  wordCount: number = 25,
  seed: number = 707,
): string {
  const rng = createRng(seed);

  if (mode === "prose") {
    const sample = NATURAL_PROSE_SAMPLES[Math.floor(rng() * NATURAL_PROSE_SAMPLES.length)];
    return sample;
  }

  if (mode === "code") {
    const sample = CODE_SAMPLES[Math.floor(rng() * CODE_SAMPLES.length)];
    return sample;
  }

  if (mode === "numbers-symbols") {
    // Mixed numeric data and symbols
    const tokens = [
      "Item #104", "costs $49.99", "with 15% discount", "ISBN: 978-0-13-468599-1",
      "Model: X-200", "speed = 88.5 mph", "Ratio: 16:9", "Temp: 72°F (22°C)",
      "Qty: 1,500 units", "Growth: +12.4%", "ID: 4092-B", "Target: 95%+",
    ];
    const picked: string[] = [];
    for (let i = 0; i < Math.min(wordCount, tokens.length); i++) {
      picked.push(tokens[i % tokens.length]);
    }
    return picked.join(" ");
  }

  // Default vocabulary with punctuation & numbers
  return generateWords(wordCount, { punctuation: true, numbers: false }).join(" ");
}
