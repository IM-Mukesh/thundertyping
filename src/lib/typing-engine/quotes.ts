import { ENGLISH_QUOTES, type Quote } from "@/data/quotes/english-quotes";
import type { QuoteLength } from "@/lib/typing-engine/engine-types";

export function pickRandomQuote(length: QuoteLength): Quote {
  const pool = ENGLISH_QUOTES.filter((q) => q.length === length);
  const source = pool.length > 0 ? pool : ENGLISH_QUOTES;
  return source[Math.floor(Math.random() * source.length)];
}
