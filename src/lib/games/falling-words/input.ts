export interface SkyfallKeyboardEvent {
  key: string;
  repeat?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  isComposing?: boolean;
}

/** One physical letter or a game/navigation control; native shortcuts stay native. */
export function skyfallKeyboardKey(event: SkyfallKeyboardEvent): string | null {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return null;
  if (event.key === "Backspace" || event.key === "Escape" || event.key === "Tab") return event.key;
  return /^[a-zA-Z]$/.test(event.key) ? event.key.toLowerCase() : null;
}

/**
 * A controlled mobile input may submit only a single appended ASCII letter or
 * remove its final character. Input metadata also rejects one-character paste,
 * composition and replacement events, which cannot be detected from a diff alone.
 */
export function skyfallTextInput(typed: string, nextValue: string, inputType?: string): string | null {
  if (typeof typed !== "string" || typeof nextValue !== "string" || !/^[a-z]*$/.test(typed)) return null;
  const unspecified = inputType === undefined || inputType === "";
  if (nextValue.length === typed.length + 1 && nextValue.startsWith(typed)) {
    if (!unspecified && inputType !== "insertText") return null;
    const letter = nextValue.slice(-1);
    return /^[a-zA-Z]$/.test(letter) ? letter.toLowerCase() : null;
  }
  if (nextValue.length === typed.length - 1 && typed.startsWith(nextValue)) {
    return unspecified || inputType === "deleteContentBackward" || inputType === "deleteContentForward" ? "Backspace" : null;
  }
  return null;
}
