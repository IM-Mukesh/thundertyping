import type { WordState } from "@/lib/typing-engine/engine-types";
import {
  fingerForKey,
  handForKey,
  classifyTransition,
  type FingerId,
  type TransitionType,
} from "@/lib/lessons/keyboard-layout";

export interface KeyRecord {
  attempts: number;
  errors: number;
  lastPracticedAt: number;
}

export type SkillMasteryLevel = "new" | "struggling" | "developing" | "mastered" | "stale";

export interface KeyMastery {
  key: string;
  finger: FingerId | null;
  hand: "left" | "right" | "thumb" | null;
  attempts: number;
  errors: number;
  accuracy: number;
  /** Wilson score 95% lower bound for statistical confidence in the accuracy estimate */
  confidenceAccuracy: number;
  level: SkillMasteryLevel;
}

export interface FingerPerformance {
  finger: FingerId;
  hand: "left" | "right" | "thumb";
  attempts: number;
  errors: number;
  accuracy: number;
  weakestKeys: string[];
}

export interface TransitionStat {
  pair: string; // e.g. "th", "er", "ed"
  attempts: number;
  errors: number;
  errorRate: number;
  type: TransitionType;
}

export interface DetailedMasteryProfile {
  keys: Record<string, KeyMastery>;
  fingers: Record<FingerId, FingerPerformance>;
  hands: {
    left: { attempts: number; errors: number; accuracy: number };
    right: { attempts: number; errors: number; accuracy: number };
  };
  transitions: TransitionStat[];
  weakestKeys: string[];
  weakestFingers: FingerId[];
  weakestTransitions: string[];
  overallMasteryScore: number; // 0-100
}

/**
 * Wilson score interval lower bound for a Bernoulli trial.
 * Prevents 1 failure in 2 attempts (50%) from looking worse than 30 failures in 100 attempts (70%).
 */
export function calculateWilsonLowerBound(correct: number, total: number, z: number = 1.96): number {
  if (total <= 0) return 0;
  const p = correct / total;
  const z2 = z * z;
  const numerator = p + z2 / (2 * total) - z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total);
  const denominator = 1 + z2 / total;
  return Math.max(0, Math.min(1, numerator / denominator));
}

/**
 * Extracts per-keystroke key and transition outcomes from completed word states.
 */
export function extractAttemptOutcomes(wordStates: readonly WordState[]): {
  keyOutcomes: Record<string, { correct: number; errors: number }>;
  transitionOutcomes: Record<string, { correct: number; errors: number }>;
} {
  const keyOutcomes: Record<string, { correct: number; errors: number }> = {};
  const transitionOutcomes: Record<string, { correct: number; errors: number }> = {};

  for (const word of wordStates) {
    let prevChar: string | null = null;

    for (let i = 0; i < word.target.length; i++) {
      const targetChar = word.target[i].toLowerCase();
      const state = word.chars[i];
      if (state !== "correct" && state !== "incorrect" && state !== "missed") continue;

      const isCorrect = state === "correct";

      // Key outcome
      if (!keyOutcomes[targetChar]) {
        keyOutcomes[targetChar] = { correct: 0, errors: 0 };
      }
      if (isCorrect) {
        keyOutcomes[targetChar].correct++;
      } else {
        keyOutcomes[targetChar].errors++;
      }

      // Transition outcome (if we have a valid previous character)
      if (prevChar && prevChar.trim() && targetChar.trim()) {
        const pair = `${prevChar}${targetChar}`;
        if (!transitionOutcomes[pair]) {
          transitionOutcomes[pair] = { correct: 0, errors: 0 };
        }
        if (isCorrect) {
          transitionOutcomes[pair].correct++;
        } else {
          transitionOutcomes[pair].errors++;
        }
      }

      prevChar = targetChar;
    }
  }

  return { keyOutcomes, transitionOutcomes };
}

/**
 * Evaluates comprehensive mastery across all keys, fingers, hands, and transitions.
 */
export function evaluateDetailedMastery(
  keyRecords: Readonly<Record<string, KeyRecord>>,
  transitionRecords: Readonly<Record<string, { attempts: number; errors: number }>> = {},
  now: number = Date.now(),
): DetailedMasteryProfile {
  const keys: Record<string, KeyMastery> = {};
  const fingerAccumulators: Record<FingerId, { attempts: number; errors: number; keys: Record<string, { attempts: number; errors: number }> }> = {
    "left-pinky": { attempts: 0, errors: 0, keys: {} },
    "left-ring": { attempts: 0, errors: 0, keys: {} },
    "left-middle": { attempts: 0, errors: 0, keys: {} },
    "left-index": { attempts: 0, errors: 0, keys: {} },
    "right-index": { attempts: 0, errors: 0, keys: {} },
    "right-middle": { attempts: 0, errors: 0, keys: {} },
    "right-ring": { attempts: 0, errors: 0, keys: {} },
    "right-pinky": { attempts: 0, errors: 0, keys: {} },
    thumb: { attempts: 0, errors: 0, keys: {} },
  };

  const handAccumulators = {
    left: { attempts: 0, errors: 0 },
    right: { attempts: 0, errors: 0 },
  };

  let totalMasteryWeights = 0;
  let accumulatedMastery = 0;

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  for (const [key, record] of Object.entries(keyRecords)) {
    const attempts = Math.max(0, record.attempts);
    const errors = Math.max(0, Math.min(attempts, record.errors));
    const correct = attempts - errors;
    const accuracy = attempts > 0 ? (correct / attempts) * 100 : 0;
    const confidenceAccuracy = attempts > 0 ? calculateWilsonLowerBound(correct, attempts) * 100 : 0;

    const finger = fingerForKey(key);
    const hand = handForKey(key);

    let level: SkillMasteryLevel = "new";
    if (attempts < 8) {
      level = "new";
    } else if (accuracy < 88) {
      level = "struggling";
    } else if (accuracy < 95 || attempts < 15) {
      level = "developing";
    } else {
      const isStale = now - record.lastPracticedAt > SEVEN_DAYS_MS;
      level = isStale ? "stale" : "mastered";
    }

    keys[key] = {
      key,
      finger,
      hand,
      attempts,
      errors,
      accuracy: Math.round(accuracy * 10) / 10,
      confidenceAccuracy: Math.round(confidenceAccuracy * 10) / 10,
      level,
    };

    if (finger) {
      const fAcc = fingerAccumulators[finger];
      fAcc.attempts += attempts;
      fAcc.errors += errors;
      fAcc.keys[key] = { attempts, errors };
    }

    if (hand === "left" || hand === "right") {
      handAccumulators[hand].attempts += attempts;
      handAccumulators[hand].errors += errors;
    }

    if (attempts >= 5) {
      totalMasteryWeights++;
      if (level === "mastered") accumulatedMastery += 1;
      else if (level === "stale") accumulatedMastery += 0.8;
      else if (level === "developing") accumulatedMastery += 0.5;
      else accumulatedMastery += 0.1;
    }
  }

  // Compile fingers
  const fingers: Record<FingerId, FingerPerformance> = {} as Record<FingerId, FingerPerformance>;
  for (const [fId, acc] of Object.entries(fingerAccumulators)) {
    const fingerId = fId as FingerId;
    const hand = fingerId.startsWith("left") ? "left" : fingerId === "thumb" ? "thumb" : "right";
    const attempts = acc.attempts;
    const errors = acc.errors;
    const accuracy = attempts > 0 ? ((attempts - errors) / attempts) * 100 : 100;

    // Find weakest keys for this finger
    const weakestKeys = Object.entries(acc.keys)
      .filter(([, s]) => s.attempts >= 3)
      .map(([k, s]) => ({ key: k, acc: ((s.attempts - s.errors) / s.attempts) * 100 }))
      .sort((a, b) => a.acc - b.acc)
      .slice(0, 2)
      .map((k) => k.key);

    fingers[fingerId] = {
      finger: fingerId,
      hand,
      attempts,
      errors,
      accuracy: Math.round(accuracy * 10) / 10,
      weakestKeys,
    };
  }

  // Compile transitions
  const transitions: TransitionStat[] = Object.entries(transitionRecords)
    .filter(([, s]) => s.attempts >= 4)
    .map(([pair, s]) => {
      const attempts = s.attempts;
      const errors = s.errors;
      const errorRate = attempts > 0 ? (errors / attempts) * 100 : 0;
      return {
        pair,
        attempts,
        errors,
        errorRate: Math.round(errorRate * 10) / 10,
        type: classifyTransition(pair[0], pair[1]),
      };
    })
    .sort((a, b) => b.errorRate - a.errorRate);

  // Derive ranked weaknesses
  const weakestKeys = Object.values(keys)
    .filter((k) => k.attempts >= 6 && k.accuracy < 92)
    .sort((a, b) => a.confidenceAccuracy - b.confidenceAccuracy)
    .map((k) => k.key);

  const weakestFingers = (Object.values(fingers) as FingerPerformance[])
    .filter((f) => f.attempts >= 10 && f.accuracy < 92)
    .sort((a, b) => a.accuracy - b.accuracy)
    .map((f) => f.finger);

  const weakestTransitions = transitions
    .filter((t) => t.errorRate >= 15)
    .slice(0, 5)
    .map((t) => t.pair);

  const overallMasteryScore =
    totalMasteryWeights > 0 ? Math.round((accumulatedMastery / totalMasteryWeights) * 100) : 0;

  return {
    keys,
    fingers,
    hands: {
      left: {
        attempts: handAccumulators.left.attempts,
        errors: handAccumulators.left.errors,
        accuracy:
          handAccumulators.left.attempts > 0
            ? Math.round(
                ((handAccumulators.left.attempts - handAccumulators.left.errors) /
                  handAccumulators.left.attempts) *
                  1000
              ) / 10
            : 100,
      },
      right: {
        attempts: handAccumulators.right.attempts,
        errors: handAccumulators.right.errors,
        accuracy:
          handAccumulators.right.attempts > 0
            ? Math.round(
                ((handAccumulators.right.attempts - handAccumulators.right.errors) /
                  handAccumulators.right.attempts) *
                  1000
              ) / 10
            : 100,
      },
    },
    transitions,
    weakestKeys,
    weakestFingers,
    weakestTransitions,
    overallMasteryScore,
  };
}
