import { ENGLISH_WORDS } from "@/data/words/english-1k";

const PUNCTUATION_MARKS = [",", ".", "!", "?", ";", ":"];

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function pickRandomWord(exclude?: string): string {
  let word: string;
  do {
    word = ENGLISH_WORDS[randomInt(ENGLISH_WORDS.length)];
  } while (word === exclude && ENGLISH_WORDS.length > 1);
  return word;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function randomNumberToken(): string {
  const digits = Math.random() < 0.8 ? 1 + randomInt(2) : 3 + randomInt(2);
  let token = "";
  for (let i = 0; i < digits; i++) token += randomInt(10);
  return token;
}

export interface WordGenerationOptions {
  punctuation: boolean;
  numbers: boolean;
}

export function generateWords(count: number, options: WordGenerationOptions): string[] {
  const words: string[] = [];
  let previous: string | undefined;
  let sentenceStart = true;

  for (let i = 0; i < count; i++) {
    if (options.numbers && Math.random() < 0.12) {
      words.push(randomNumberToken());
      previous = undefined;
      continue;
    }

    let word = pickRandomWord(previous);
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
