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

/** CSS custom properties defined in globals.css -- shared by every consumer that colors a key or finger by which finger owns it, so the drill keyboard and any other finger-map visual can never disagree on a color. */
export const FINGER_VAR: Record<FingerId, string> = {
  "left-pinky": "var(--finger-left-pinky)",
  "left-ring": "var(--finger-left-ring)",
  "left-middle": "var(--finger-left-middle)",
  "left-index": "var(--finger-left-index)",
  "right-index": "var(--finger-right-index)",
  "right-middle": "var(--finger-right-middle)",
  "right-ring": "var(--finger-right-ring)",
  "right-pinky": "var(--finger-right-pinky)",
  thumb: "var(--finger-thumb)",
};

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

export const HOME_KEY_FOR_FINGER: Record<FingerId, string> = {
  "left-pinky": "a",
  "left-ring": "s",
  "left-middle": "d",
  "left-index": "f",
  "right-index": "j",
  "right-middle": "k",
  "right-ring": "l",
  "right-pinky": ";",
  thumb: " ",
};

/** Complete mapping of shifted characters on standard ANSI QWERTY to their unshifted base physical keys. */
export const SHIFTED_SYMBOL_TO_BASE_KEY: Record<string, string> = {
  "~": "`",
  "!": "1",
  "@": "2",
  "#": "3",
  "$": "4",
  "%": "5",
  "^": "6",
  "&": "7",
  "*": "8",
  "(": "9",
  ")": "0",
  "_": "-",
  "+": "=",
  "{": "[",
  "}": "]",
  "|": "\\",
  ":": ";",
  '"': "'",
  "<": ",",
  ">": ".",
  "?": "/",
};

/** Returns the hand that owns a given finger. */
export function handForFinger(finger: FingerId | null): "left" | "right" | "thumb" | null {
  if (!finger) return null;
  if (finger === "thumb") return "thumb";
  return finger.startsWith("left") ? "left" : "right";
}

/** Whether pressing `key` requires holding the Shift key (uppercase letters or shifted symbols). */
export function isShiftRequired(key: string | null): boolean {
  if (!key || key.length !== 1) return false;
  if (key in SHIFTED_SYMBOL_TO_BASE_KEY) return true;
  // Uppercase alphabet
  return key >= "A" && key <= "Z";
}

/** The physical key someone actually presses (with Shift, for a symbol) to type `key`. Used to decide which grid key lights up, not just which finger. */
export function physicalKeyFor(key: string | null): string | null {
  if (!key) return null;
  if (key in SHIFTED_SYMBOL_TO_BASE_KEY) {
    return SHIFTED_SYMBOL_TO_BASE_KEY[key];
  }
  return key.toLowerCase();
}

/** Returns the finger that physically presses `key`. */
export function fingerForKey(key: string | null): FingerId | null {
  const physical = physicalKeyFor(key);
  return physical ? (KEY_FINGER_MAP[physical] ?? null) : null;
}

/** Returns the hand that presses `key`. */
export function handForKey(key: string | null): "left" | "right" | "thumb" | null {
  const finger = fingerForKey(key);
  return handForFinger(finger);
}

/**
 * Standard touch-typing rule: when typing an uppercase letter or shifted symbol with one hand,
 * the OPPOSITE hand's pinky holds Shift.
 * Returns "left-shift" if right hand strikes the key, "right-shift" if left hand strikes, or null if no Shift needed.
 */
export function shiftKeyFor(key: string | null): "left-shift" | "right-shift" | null {
  if (!isShiftRequired(key)) return null;
  const targetHand = handForKey(key);
  if (targetHand === "left") return "right-shift";
  if (targetHand === "right") return "left-shift";
  return null;
}

export type TransitionType =
  | "identical"
  | "same-finger-hurdle"
  | "same-hand-adjacent"
  | "cross-hand-alternate"
  | "space-boundary";

/**
 * Categorizes the biomechanical difficulty of transitioning from key A to key B.
 * Used by the adaptive engine to detect and drill difficult finger patterns.
 */
export function classifyTransition(a: string, b: string): TransitionType {
  if (!a || !b) return "space-boundary";
  if (a === " " || b === " ") return "space-boundary";
  if (a.toLowerCase() === b.toLowerCase()) return "identical";

  const fingerA = fingerForKey(a);
  const fingerB = fingerForKey(b);
  if (!fingerA || !fingerB) return "space-boundary";

  const handA = handForFinger(fingerA);
  const handB = handForFinger(fingerB);

  if (handA !== handB) {
    return "cross-hand-alternate";
  }

  // Same hand
  if (fingerA === fingerB) {
    return "same-finger-hurdle"; // e.g. E to D, U to J, R to F
  }

  return "same-hand-adjacent"; // e.g. S to D, J to K
}
