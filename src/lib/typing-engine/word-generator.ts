import { ENGLISH_WORDS } from "@/data/words/english-1k";

export const PUNCTUATION_MARKS = [",", ".", "!", "?", ";", ":"];

// ENGLISH_WORDS is ordered most- to least-frequent (it's a trimmed Dolch/Fry
// list), so the first N words ARE the common subset -- no separate word list
// to maintain. 200 mirrors Monkeytype's default "english" list size, which is
// the comparison point this was built against.
export const COMMON_WORD_COUNT = 200;
export type WordDifficulty = "common" | "all";
export const WORD_DIFFICULTIES: WordDifficulty[] = ["common", "all"];

function wordPool(difficulty: WordDifficulty | undefined): readonly string[] {
  return difficulty === "common" ? ENGLISH_WORDS.slice(0, COMMON_WORD_COUNT) : ENGLISH_WORDS;
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
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function randomNumberToken(): string {
  const digits = Math.random() < 0.8 ? 1 + randomInt(2) : 3 + randomInt(2);
  // The leading digit of a multi-digit token must not be 0 -- "07"/"003" are
  // not how anyone writes a number to be typed. A lone single-digit token can
  // still legitimately be "0".
  let token = String(digits > 1 ? 1 + randomInt(9) : randomInt(10));
  for (let i = 1; i < digits; i++) token += randomInt(10);
  return token;
}

export interface WordGenerationOptions {
  punctuation: boolean;
  numbers: boolean;
  // Omitted (games, lessons) means "all" -- the full pool, unchanged from
  // before this option existed.
  wordDifficulty?: WordDifficulty;
}

export function generateWords(count: number, options: WordGenerationOptions): string[] {
  const pool = wordPool(options.wordDifficulty);
  const words: string[] = [];
  let previous: string | undefined;
  let sentenceStart = true;

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

      if (Math.random() < 0.12) {
        const mark = Math.random() < 0.7 ? "," : PUNCTUATION_MARKS[randomInt(PUNCTUATION_MARKS.length)];
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
