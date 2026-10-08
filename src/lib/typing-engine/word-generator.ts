import { ENGLISH_WORDS } from "@/data/words/english-1k";
import { getTypingConfig } from "./language-config";

// ENGLISH_WORDS is ordered most- to least-frequent (it's a trimmed Dolch/Fry
// list), so the first N words ARE the common subset -- no separate word list
// to maintain. 200 mirrors Monkeytype's default "english" list size, which is
// the comparison point this was built against.
export const COMMON_WORD_COUNT = 200;
export type WordDifficulty = "common" | "all";
export const WORD_DIFFICULTIES: WordDifficulty[] = ["common", "all"];

function wordPool(difficulty: WordDifficulty | undefined, customPool?: readonly string[]): readonly string[] {
  const basePool = customPool || ENGLISH_WORDS;
  return difficulty === "common" ? basePool.slice(0, Math.min(COMMON_WORD_COUNT, basePool.length)) : basePool;
}

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function pickRandomWord(pool: readonly string[], exclude?: string): string {
  let word: string;
  do {
    word = pool[randomInt(pool.length)];
  } while (word === exclude && pool.length > 1);
  return word;
}

function capitalize(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function randomNumberToken(): string {
  const digits = Math.random() < 0.8 ? 1 + randomInt(2) : 3 + randomInt(2);
  let token = String(digits > 1 ? 1 + randomInt(9) : randomInt(10));
  for (let i = 1; i < digits; i++) token += randomInt(10);
  return token;
}

export interface WordGenerationOptions {
  punctuation: boolean;
  numbers: boolean;
  wordDifficulty?: WordDifficulty;
  languageCode?: string;
  customWordPool?: readonly string[];
}

export function generateWords(count: number, options: WordGenerationOptions): string[] {
  const pool = wordPool(options.wordDifficulty, options.customWordPool);
  const words: string[] = [];
  let previous: string | undefined;
  let sentenceStart = true;
  
  const config = getTypingConfig(options.languageCode || "en");
  const punctuationMarks = config.punctuation;

  if (!pool || pool.length === 0) {
    return Array(count).fill("error");
  }

  for (let i = 0; i < count; i++) {
    if (options.numbers && Math.random() < 0.12) {
      words.push(randomNumberToken());
      previous = undefined;
      continue;
    }

    let word = pickRandomWord(pool, previous);
    previous = word;

    if (options.punctuation) {
      if (sentenceStart) word = capitalize(word);

      if (Math.random() < 0.12 && punctuationMarks.length > 0) {
        const mark = Math.random() < 0.7 ? "," : punctuationMarks[randomInt(punctuationMarks.length)];
        word += mark;
        sentenceStart = mark === "." || mark === "!" || mark === "?";
      } else {
        sentenceStart = false;
      }
    }

    words.push(word);
  }

  return words;
}
