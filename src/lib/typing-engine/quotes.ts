import { ENGLISH_QUOTES, type Quote } from "@/data/quotes/english-quotes";
import type { QuoteLength } from "@/lib/typing-engine/engine-types";

export function pickRandomQuote(length: QuoteLength, customPool?: { id: string; text: string; source: string; length: QuoteLength }[]): Quote {
  const pool = customPool && customPool.length > 0 ? customPool : ENGLISH_QUOTES;
  const filtered = pool.filter((q) => q.length === length);
  const source = filtered.length > 0 ? filtered : pool;
  return source[Math.floor(Math.random() * source.length)];
}
