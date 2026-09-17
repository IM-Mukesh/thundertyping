/**
 * Splits raw input-field text into "what belongs in the word" and "was a
 * commit requested".
 *
 * This exists because of mobile keyboards. Android's GBoard and other
 * IME-backed keyboards report composing input as keydown with keyCode 229 and
 * key "Unidentified", so a `key === " "` test never fires on a phone. The space
 * arrives inside the field's value instead, where it gets scored as a wrong
 * character against the target word and the test sticks on word one.
 *
 * A generated word never contains a space, so a space in the buffer can only
 * ever mean "commit this word".
 */
export interface CommitSplit {
  /** The text that should become the active word's buffer. */
  value: string;
  /** Whether the word should be committed after applying `value`. */
  commit: boolean;
}

export function splitOnCommit(raw: string): CommitSplit {
  const space = raw.indexOf(" ");
  if (space === -1) return { value: raw, commit: false };
  return { value: raw.slice(0, space), commit: true };
}
