import { VOCAB_WORDS, type VocabDifficulty, type VocabWord } from "@/lib/vocabulary/vocabulary-words";

export const SESSION_WORD_COUNT = 20;

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Picks a round's words, unseen words first. Not real spaced repetition —
 * just the honest, simple version of it: a word already typed correctly at
 * least once gets pushed behind every word that hasn't, so a session
 * naturally surfaces new vocabulary before it starts repeating mastered
 * words, and only repeats once a whole tier has been mastered.
 */
export function pickSessionWords(
  difficulty: VocabDifficulty,
  masteredWords: ReadonlySet<string>,
  count: number = SESSION_WORD_COUNT,
): VocabWord[] {
  const pool = VOCAB_WORDS[difficulty];
  const unseen = shuffle(pool.filter((w) => !masteredWords.has(w.word)));
  const seen = shuffle(pool.filter((w) => masteredWords.has(w.word)));
  return [...unseen, ...seen].slice(0, Math.min(count, pool.length));
}

/**
 * Plain word strings for the main typing test's "vocabulary" mode — a
 * continuous word stream like "words" mode, just drawn from a difficulty
 * tier instead of the generic word list. No definitions here (that's the
 * dedicated /vocabulary test); this is the same test, different word source.
 */
export function pickPracticeWords(difficulty: VocabDifficulty, count: number): string[] {
  const pool = VOCAB_WORDS[difficulty];
  return shuffle(pool)
    .slice(0, Math.min(count, pool.length))
    .map((w) => w.word);
}
