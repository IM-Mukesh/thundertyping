// The standard touch-typing finger map, used by both the keyboard grid and
// the hand diagram in virtual-keyboard.tsx so a key and its finger always
// agree about who's responsible for it.

export type FingerId =
  | "left-pinky"
  | "left-ring"
  | "left-middle"
  | "left-index"
  | "right-index"
  | "right-middle"
  | "right-ring"
  | "right-pinky"
  | "thumb";

export const FINGER_LABELS: Record<FingerId, string> = {
  "left-pinky": "Left pinky",
  "left-ring": "Left ring finger",
  "left-middle": "Left middle finger",
  "left-index": "Left index finger",
  "right-index": "Right index finger",
  "right-middle": "Right middle finger",
  "right-ring": "Right ring finger",
  "right-pinky": "Right pinky",
  thumb: "Either thumb",
};

interface KeyboardKey {
  key: string;
  finger: FingerId;
  /** F and J carry the physical "home row bump" real keyboards use for orientation by touch. */
  homeRow?: boolean;
}

export const NUMBER_ROW: KeyboardKey[] = [
  { key: "1", finger: "left-pinky" },
  { key: "2", finger: "left-ring" },
  { key: "3", finger: "left-middle" },
  { key: "4", finger: "left-index" },
  { key: "5", finger: "left-index" },
  { key: "6", finger: "right-index" },
  { key: "7", finger: "right-index" },
  { key: "8", finger: "right-middle" },
  { key: "9", finger: "right-ring" },
  { key: "0", finger: "right-pinky" },
];

export const TOP_ROW: KeyboardKey[] = [
  { key: "q", finger: "left-pinky" },
  { key: "w", finger: "left-ring" },
  { key: "e", finger: "left-middle" },
  { key: "r", finger: "left-index" },
  { key: "t", finger: "left-index" },
  { key: "y", finger: "right-index" },
  { key: "u", finger: "right-index" },
  { key: "i", finger: "right-middle" },
  { key: "o", finger: "right-ring" },
  { key: "p", finger: "right-pinky" },
];

export const HOME_ROW: KeyboardKey[] = [
  { key: "a", finger: "left-pinky" },
  { key: "s", finger: "left-ring" },
  { key: "d", finger: "left-middle" },
  { key: "f", finger: "left-index", homeRow: true },
  { key: "g", finger: "left-index" },
  { key: "h", finger: "right-index" },
  { key: "j", finger: "right-index", homeRow: true },
  { key: "k", finger: "right-middle" },
  { key: "l", finger: "right-ring" },
  { key: ";", finger: "right-pinky" },
];

export const BOTTOM_ROW: KeyboardKey[] = [
  { key: "z", finger: "left-pinky" },
  { key: "x", finger: "left-ring" },
  { key: "c", finger: "left-middle" },
  { key: "v", finger: "left-index" },
  { key: "b", finger: "left-index" },
  { key: "n", finger: "right-index" },
  { key: "m", finger: "right-index" },
  { key: ",", finger: "right-middle" },
  { key: ".", finger: "right-ring" },
  { key: "/", finger: "right-pinky" },
];

export const SPACE_KEY: KeyboardKey = { key: " ", finger: "thumb" };

export const KEY_ROWS: KeyboardKey[][] = [NUMBER_ROW, TOP_ROW, HOME_ROW, BOTTOM_ROW];

const KEY_FINGER_MAP: Record<string, FingerId> = Object.fromEntries(
  [...KEY_ROWS.flat(), SPACE_KEY].map((k) => [k.key, k.finger]),
);

// Punctuation the word generator can inject (see PUNCTUATION_MARKS in
// word-generator.ts) that isn't its own physical key -- it's Shift plus a
// key already on the grid. Without this, any Intermediate/Advanced lesson
// (or the two Beginner ones with punctuation) that generates a "!", "?" or
// ":" made the keyboard go completely blank -- no key lit, no finger lit,
// label falling back to "Get ready" -- exactly when guidance mattered most.
// Mapped to the physical key you'd actually hold Shift and press.
const SHIFTED_SYMBOL_TO_BASE_KEY: Record<string, string> = {
  "!": "1",
  "?": "/",
  ":": ";",
};

/** The physical key someone actually presses (with Shift, for a symbol) to type `key`. Used to decide which grid key lights up, not just which finger. */
export function physicalKeyFor(key: string | null): string | null {
  if (!key) return null;
  const lower = key.toLowerCase();
  return SHIFTED_SYMBOL_TO_BASE_KEY[lower] ?? lower;
}

export function fingerForKey(key: string | null): FingerId | null {
  const physical = physicalKeyFor(key);
  return physical ? (KEY_FINGER_MAP[physical] ?? null) : null;
}
