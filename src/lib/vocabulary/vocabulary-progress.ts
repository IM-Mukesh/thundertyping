import { getStorageItem, setStorageItem } from "@/lib/persistence/storage";
import { accountStorageKey } from "@/lib/auth/current-user";
import type { VocabDifficulty } from "@/lib/vocabulary/vocabulary-words";
import type { VocabWordResult } from "@/lib/vocabulary/use-vocabulary-test";

// Plain localStorage functions, not a zustand store — progress here is read
// once per page load (a hub card's mastered count, a results screen) rather
// than subscribed to reactively from many places at once, so this follows
// game-scores.ts's pattern rather than lesson-progress-store.ts's.

// Left unrenamed on the HeroTyping rebrand -- every existing player's
// vocabulary progress is saved under this name, and renaming it would orphan
// it.
const KEY = "thundertyping-vocabulary-progress";

/** Exposed so a component can key `useSyncExternalStore` off the raw storage
 *  string (a stable primitive) instead of setting state from a mount effect. */
export function vocabProgressKey(): string {
  return accountStorageKey(KEY);
}

export interface VocabDifficultyProgress {
  /** Words typed with zero incorrect keystrokes at least once. */
  mastered: string[];
  bestWpm: number;
  bestAccuracy: number;
  sessionsCompleted: number;
}

export type VocabProgress = Record<VocabDifficulty, VocabDifficultyProgress>;

function emptyDifficultyProgress(): VocabDifficultyProgress {
  return { mastered: [], bestWpm: 0, bestAccuracy: 0, sessionsCompleted: 0 };
}

function emptyProgress(): VocabProgress {
  return { easy: emptyDifficultyProgress(), medium: emptyDifficultyProgress(), hard: emptyDifficultyProgress() };
}

function isValidDifficultyProgress(value: unknown): value is VocabDifficultyProgress {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<VocabDifficultyProgress>;
  return (
    Array.isArray(v.mastered) &&
    v.mastered.length <= 10000 &&
    v.mastered.every((w) => typeof w === "string" && w.length <= 100) &&
    typeof v.bestWpm === "number" && Number.isFinite(v.bestWpm) && v.bestWpm >= 0 && v.bestWpm <= 400 &&
    typeof v.bestAccuracy === "number" && Number.isFinite(v.bestAccuracy) && v.bestAccuracy >= 0 && v.bestAccuracy <= 100 &&
    typeof v.sessionsCompleted === "number" && Number.isSafeInteger(v.sessionsCompleted) && v.sessionsCompleted >= 0
  );
}

export function isValidVocabProgress(value: unknown): value is VocabProgress {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<VocabProgress>;
  return (
    isValidDifficultyProgress(v.easy) && isValidDifficultyProgress(v.medium) && isValidDifficultyProgress(v.hard)
  );
}

export function parseVocabProgress(raw: string | null): VocabProgress {
  if (!raw || raw.length > 1_000_000) return emptyProgress();
  try {
    const parsed: unknown = JSON.parse(raw);
    return isValidVocabProgress(parsed) ? parsed : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function getVocabProgress(): VocabProgress {
  return parseVocabProgress(getStorageItem(vocabProgressKey()));
}

export interface RecordVocabSessionResult {
  newlyMastered: number;
  isNewBest: boolean;
  progress: VocabProgress;
}

export function recordVocabSession(
  difficulty: VocabDifficulty,
  results: VocabWordResult[],
  wpm: number,
  accuracy: number,
): RecordVocabSessionResult {
  const progress = getVocabProgress();
  const tier = progress[difficulty];
  const masteredSet = new Set(tier.mastered);

  let newlyMastered = 0;
  for (const result of results) {
    if (result.correct && !masteredSet.has(result.word)) {
      masteredSet.add(result.word);
      newlyMastered++;
    }
  }

  const isNewBest = wpm > tier.bestWpm;
  const updatedTier: VocabDifficultyProgress = {
    mastered: [...masteredSet],
    bestWpm: Math.max(tier.bestWpm, wpm),
    bestAccuracy: Math.max(tier.bestAccuracy, accuracy),
    sessionsCompleted: tier.sessionsCompleted + 1,
  };
  const next: VocabProgress = { ...progress, [difficulty]: updatedTier };
  setStorageItem(vocabProgressKey(), JSON.stringify(next));
  return { newlyMastered, isNewBest, progress: next };
}
