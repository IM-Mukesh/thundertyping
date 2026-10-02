import { CHARS_PER_WORD } from "@/lib/typing-engine/stats";

export type PaceCaretMode = "off" | "pb" | "custom";
export const PACE_CARET_MODES: PaceCaretMode[] = ["off", "pb", "custom"];
export const MIN_PACE_CARET_WPM = 1;
export const MAX_PACE_CARET_WPM = 350;

export interface PaceCaretPosition {
  wordIndex: number;
  charIndex: number;
}

/**
 * Where a ghost typist holding a steady `targetWpm` would be after
 * `elapsedMs` of a real test -- a second, purely visual caret shown
 * alongside the real one so a typist can see whether they're ahead of or
 * behind a target pace (their own PB, or a custom number).
 *
 * Deliberately outside the engine/reducer: this never feeds scoring, only
 * rendering, so it reads `words`/`elapsedMs` but writes nothing back.
 *
 * Uses the exact same "space between words counts as a character" and
 * 5-char-per-word convention as calculateNetWpmCharacters, so a target of
 * "race your own PB" lines up with how that PB was actually computed.
 */
export function computePaceCaretPosition(
  words: readonly string[],
  elapsedMs: number,
  targetWpm: number,
): PaceCaretPosition | null {
  if (words.length === 0 || targetWpm <= 0 || elapsedMs <= 0) return null;

  const targetChars = targetWpm * CHARS_PER_WORD * (elapsedMs / 60000);
  let cumulative = 0;
  for (let i = 0; i < words.length; i++) {
    const isLastWord = i === words.length - 1;
    const wordTotal = words[i].length + (isLastWord ? 0 : 1); // +1 for the inter-word separator
    // On the last word there's nowhere further to go -- pin the ghost at
    // its end rather than reporting a position past the end of the list.
    if (isLastWord || cumulative + wordTotal > targetChars) {
      const charIndex = Math.max(0, Math.min(words[i].length, Math.round(targetChars - cumulative)));
      return { wordIndex: i, charIndex };
    }
    cumulative += wordTotal;
  }
  return null;
}
