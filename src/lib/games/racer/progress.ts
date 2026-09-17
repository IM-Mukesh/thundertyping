/**
 * How far down the track a racer actually is.
 *
 * A ghost is replayed as a position in the race text, so the player's position
 * has to be one too. Using the raw keystroke count instead meant holding the
 * spacebar crossed the line: 400 spaces and nothing else won the race and saved
 * itself as the next ghost. The only honest definition is how much of the text
 * has genuinely been reproduced, so a wrong character stops the car until it is
 * corrected.
 */
export function racePositionOf(typed: string, text: string): number {
  let i = 0;
  while (i < typed.length && i < text.length && typed[i] === text[i]) i += 1;
  return i;
}

/**
 * Start index of the word the car is standing on.
 *
 * Anchored to the car's position rather than to the spaces in the buffer: the
 * buffer may hold one uncorrected wrong character, and deriving the word from
 * it would drift the display away from where the car actually is.
 */
export function wordStartAt(text: string, position: number): number {
  return text.lastIndexOf(" ", Math.max(0, position - 1)) + 1;
}
