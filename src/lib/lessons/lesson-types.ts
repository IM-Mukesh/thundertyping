// The shared contract every lesson unit satisfies -- mirrors game-types.ts's
// pattern (a closed id union, one definition object per item, a manually
// ordered list the dashboard/route/sitemap all derive from).
//
// To add a unit: add its id here, add a definition in LESSON_DEFINITIONS,
// and add it to LESSON_LIST in the order it should be taken. Nothing else
// needs to change -- the dashboard, the /lessons/[lessonId] route and the
// unlock-gating logic all derive from LESSON_LIST.
//
// Three tiers (LessonTier) group units for the dashboard sidebar. Stage
// (LessonStage) is a finer-grained label within a tier, shown as a
// breadcrumb/section header -- it's cosmetic, tier is what drives navigation
// and gating order.

export type LessonTier = "beginner" | "intermediate" | "advanced";

export const LESSON_TIERS: { id: LessonTier; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

export type LessonStage =
  | "home-row"
  | "top-row"
  | "bottom-row"
  | "numbers"
  | "review"
  | "graduation"
  | "intermediate-practice"
  | "advanced-practice";

export const LESSON_STAGES: { id: LessonStage; label: string }[] = [
  { id: "home-row", label: "Home Row" },
  { id: "top-row", label: "Top Row" },
  { id: "bottom-row", label: "Bottom Row" },
  { id: "numbers", label: "Numbers" },
  { id: "review", label: "Full Keyboard" },
  { id: "graduation", label: "Graduation" },
  { id: "intermediate-practice", label: "Sentences & Style" },
  { id: "advanced-practice", label: "Speed & Precision" },
];

export type LessonId =
  | "home-row-left"
  | "home-row-right"
  | "home-row-combined"
  | "home-row-words"
  | "top-row-left"
  | "top-row-right"
  | "top-row-combined"
  | "top-row-words"
  | "bottom-row-left"
  | "bottom-row-right"
  | "bottom-row-combined"
  | "bottom-row-words"
  | "numbers-low"
  | "numbers-high"
  | "full-keyboard-words"
  | "full-keyboard-punctuation"
  | "graduation"
  | "everyday-sentences"
  | "building-speed"
  | "numbers-and-words"
  | "longer-passages"
  | "mixed-practice"
  | "intermediate-checkpoint"
  | "speed-endurance"
  | "precision-under-pressure"
  | "long-form-typing"
  | "numbers-and-symbols-mastery"
  | "final-challenge";

// A unit's content is generated, not hand-typed, so the curriculum stays
// cheap to extend -- see lesson-content.ts for how each kind is built, and
// buildSubLessons for how one spec becomes `subLessonCount` graduated steps.
export type LessonContentSpec =
  | { kind: "drill"; allowedKeys: string[]; wordCount: number }
  | { kind: "review"; allowedKeys: string[]; wordCount: number }
  | { kind: "graduation"; wordCount: number; numbers?: boolean };

export interface LessonDefinition {
  id: LessonId;
  tier: LessonTier;
  stage: LessonStage;
  /** Position in the track -- LESSON_LIST is the source of truth for order and gating, this is only for display. */
  order: number;
  name: string;
  /** Keys this unit introduces for the first time. Empty once new-key introduction gives way to combined/review/sentence practice. */
  newKeys: string[];
  /** Short, genuinely unit-specific copy -- avoids the templated-page thin-content pattern the SEO guardrail warns against. */
  instructions: string[];
  /** 0-100. A sub-lesson must meet this to pass and advance to the next one. */
  minAccuracy: number;
  /** The "full difficulty" content spec -- buildSubLessons scales wordCount down for earlier steps within the unit. */
  content: LessonContentSpec;
  /** How many sub-lesson steps this unit runs before it's considered complete. See buildSubLessons in lesson-content.ts. */
  subLessonCount: number;
  /** The single absolute-last unit: its complete screen points at the main test and the games hub instead of "next unit". */
  isGraduation?: boolean;
}

const HOME_LEFT = ["a", "s", "d", "f"];
const HOME_RIGHT = ["j", "k", "l", ";"];
const HOME_ALL = [...HOME_LEFT, ...HOME_RIGHT];
const TOP_LEFT = ["q", "w", "e", "r", "t"];
const TOP_RIGHT = ["y", "u", "i", "o", "p"];
const TOP_ALL = [...TOP_LEFT, ...TOP_RIGHT];
const HOME_AND_TOP = [...HOME_ALL, ...TOP_ALL];
const BOTTOM_LEFT = ["z", "x", "c", "v", "b"];
const BOTTOM_RIGHT = ["n", "m", ",", ".", "/"];
const BOTTOM_ALL = [...BOTTOM_LEFT, ...BOTTOM_RIGHT];
const ALL_KEYS = [...HOME_AND_TOP, ...BOTTOM_ALL];
const NUMBERS_LOW = ["1", "2", "3", "4", "5"];
const NUMBERS_HIGH = ["6", "7", "8", "9", "0"];

export const LESSON_DEFINITIONS: Record<LessonId, LessonDefinition> = {
  "home-row-left": {
    id: "home-row-left",
    tier: "beginner",
    stage: "home-row",
    order: 1,
    name: "Home Row: Left Hand",
    newKeys: HOME_LEFT,
    instructions: [
      "Rest your left index, middle, ring and pinky fingers on F, D, S and A. Don't look down -- feel for the small bump on the F key, that's how you find home row by touch alone.",
      "Press each key with the finger it belongs to and return to the same resting spot every time.",
    ],
    minAccuracy: 90,
    content: { kind: "drill", allowedKeys: HOME_LEFT, wordCount: 12 },
    subLessonCount: 7,
  },
  "home-row-right": {
    id: "home-row-right",
    tier: "beginner",
    stage: "home-row",
    order: 2,
    name: "Home Row: Right Hand",
    newKeys: HOME_RIGHT,
    instructions: [
      "Now the right hand: index on J (feel for its bump), middle on K, ring on L, pinky on the semicolon.",
      "Same rule as before -- one finger per key, and back to rest after every press.",
    ],
    minAccuracy: 90,
    content: { kind: "drill", allowedKeys: HOME_RIGHT, wordCount: 12 },
    subLessonCount: 7,
  },
  "home-row-combined": {
    id: "home-row-combined",
    tier: "beginner",
    stage: "home-row",
    order: 3,
    name: "Home Row: Both Hands",
    newKeys: [],
    instructions: [
      "Both hands stay on home row for this one. The jump between hands is where beginners usually slow down -- let your eyes stay on the screen, not your fingers.",
    ],
    minAccuracy: 90,
    content: { kind: "drill", allowedKeys: HOME_ALL, wordCount: 14 },
    subLessonCount: 4,
  },
  "home-row-words": {
    id: "home-row-words",
    tier: "beginner",
    stage: "home-row",
    order: 4,
    name: "Home Row: Real Words",
    newKeys: [],
    instructions: [
      "Every word here is a real English word built entirely from home-row letters -- your first taste of typing something you'd actually write.",
    ],
    minAccuracy: 88,
    content: { kind: "review", allowedKeys: HOME_ALL, wordCount: 10 },
    subLessonCount: 5,
  },
  "top-row-left": {
    id: "top-row-left",
    tier: "beginner",
    stage: "top-row",
    order: 5,
    name: "Top Row: Left Hand",
    newKeys: TOP_LEFT,
    instructions: [
      "Q, W, E, R and T sit one row above home row, each reached by the same finger that owns its home-row key below it -- R and T both stretch from your index finger.",
    ],
    minAccuracy: 88,
    content: { kind: "drill", allowedKeys: [...HOME_ALL, ...TOP_LEFT], wordCount: 14 },
    subLessonCount: 8,
  },
  "top-row-right": {
    id: "top-row-right",
    tier: "beginner",
    stage: "top-row",
    order: 6,
    name: "Top Row: Right Hand",
    newKeys: TOP_RIGHT,
    instructions: [
      "Y and U stretch up from your right index finger, I from middle, O from ring, P from pinky -- the mirror image of the left hand's reach.",
    ],
    minAccuracy: 88,
    content: { kind: "drill", allowedKeys: [...HOME_ALL, ...TOP_ALL], wordCount: 14 },
    subLessonCount: 8,
  },
  "top-row-combined": {
    id: "top-row-combined",
    tier: "beginner",
    stage: "top-row",
    order: 7,
    name: "Top Row: Both Hands",
    newKeys: [],
    instructions: [
      "Home row and top row together now. Notice your fingers returning to the home-row bump between reaches -- that return is the habit that makes touch typing fast.",
    ],
    minAccuracy: 87,
    content: { kind: "drill", allowedKeys: HOME_AND_TOP, wordCount: 16 },
    subLessonCount: 4,
  },
  "top-row-words": {
    id: "top-row-words",
    tier: "beginner",
    stage: "top-row",
    order: 8,
    name: "Top Row: Real Words",
    newKeys: [],
    instructions: [
      "With eighteen letters learned, real words start to open up -- this set draws from the actual dictionary the main typing test uses.",
    ],
    minAccuracy: 87,
    content: { kind: "review", allowedKeys: HOME_AND_TOP, wordCount: 12 },
    subLessonCount: 5,
  },
  "bottom-row-left": {
    id: "bottom-row-left",
    tier: "beginner",
    stage: "bottom-row",
    order: 9,
    name: "Bottom Row: Left Hand",
    newKeys: BOTTOM_LEFT,
    instructions: [
      "Z, X, C, V and B are the last left-hand reach, one row below home row -- B is the widest stretch on the keyboard for your index finger, so take it slow.",
    ],
    minAccuracy: 86,
    content: { kind: "drill", allowedKeys: [...HOME_AND_TOP, ...BOTTOM_LEFT], wordCount: 14 },
    subLessonCount: 8,
  },
  "bottom-row-right": {
    id: "bottom-row-right",
    tier: "beginner",
    stage: "bottom-row",
    order: 10,
    name: "Bottom Row: Right Hand",
    newKeys: BOTTOM_RIGHT,
    instructions: [
      "N and M reach down from your right index finger, then comma, period and slash from middle, ring and pinky -- the last new keys in the alphabet.",
    ],
    minAccuracy: 86,
    content: { kind: "drill", allowedKeys: [...HOME_AND_TOP, ...BOTTOM_ALL], wordCount: 14 },
    subLessonCount: 8,
  },
  "bottom-row-combined": {
    id: "bottom-row-combined",
    tier: "beginner",
    stage: "bottom-row",
    order: 11,
    name: "Full Alphabet Drill",
    newKeys: [],
    instructions: [
      "Every letter key is now in play. This is the widest reach your hands will ever need to make -- if it feels slow, that's expected on the first pass.",
    ],
    minAccuracy: 85,
    content: { kind: "drill", allowedKeys: ALL_KEYS, wordCount: 16 },
    subLessonCount: 4,
  },
  "bottom-row-words": {
    id: "bottom-row-words",
    tier: "beginner",
    stage: "bottom-row",
    order: 12,
    name: "Full Alphabet: Real Words",
    newKeys: [],
    instructions: [
      "The full alphabet unlocks almost the entire word list -- this is the first unit that reads like an ordinary sentence rather than a drill.",
    ],
    minAccuracy: 85,
    content: { kind: "review", allowedKeys: ALL_KEYS, wordCount: 14 },
    subLessonCount: 5,
  },
  "numbers-low": {
    id: "numbers-low",
    tier: "beginner",
    stage: "numbers",
    order: 13,
    name: "Numbers: 1 to 5",
    newKeys: NUMBERS_LOW,
    instructions: [
      "The number row sits above the top row, reached by stretching the same fingers upward again -- 1 and 2 from your left pinky and ring, up through 5 from your left index.",
    ],
    minAccuracy: 85,
    content: { kind: "drill", allowedKeys: NUMBERS_LOW, wordCount: 10 },
    subLessonCount: 8,
  },
  "numbers-high": {
    id: "numbers-high",
    tier: "beginner",
    stage: "numbers",
    order: 14,
    name: "Numbers: 6 to 0",
    newKeys: NUMBERS_HIGH,
    instructions: [
      "6 through 0 mirror the left hand's reach on the right. Once these are comfortable you can type any number without glancing at the row.",
    ],
    minAccuracy: 85,
    content: { kind: "drill", allowedKeys: [...NUMBERS_LOW, ...NUMBERS_HIGH], wordCount: 12 },
    subLessonCount: 8,
  },
  "full-keyboard-words": {
    id: "full-keyboard-words",
    tier: "beginner",
    stage: "review",
    order: 15,
    name: "Full Keyboard: Words",
    newKeys: [],
    instructions: [
      "Every letter and number you've learned, mixed together in real words -- a checkpoint before punctuation joins the mix.",
    ],
    minAccuracy: 85,
    content: { kind: "review", allowedKeys: ALL_KEYS, wordCount: 16 },
    subLessonCount: 5,
  },
  "full-keyboard-punctuation": {
    id: "full-keyboard-punctuation",
    tier: "beginner",
    stage: "review",
    order: 16,
    name: "Full Keyboard: Punctuation",
    newKeys: [],
    instructions: [
      "Capital letters and punctuation, drawn from the same generator the main typing test uses -- this is what ordinary writing actually looks like.",
    ],
    minAccuracy: 82,
    content: { kind: "graduation", wordCount: 20 },
    subLessonCount: 7,
  },
  graduation: {
    id: "graduation",
    tier: "beginner",
    stage: "graduation",
    order: 17,
    name: "Beginner Checkpoint",
    newKeys: [],
    instructions: [
      "One passage, the full keyboard and real punctuation, no training wheels. Clear this and the whole keyboard is yours -- Intermediate is next, building real sentences and speed.",
    ],
    minAccuracy: 80,
    content: { kind: "graduation", wordCount: 30 },
    subLessonCount: 10,
  },
  "everyday-sentences": {
    id: "everyday-sentences",
    tier: "intermediate",
    stage: "intermediate-practice",
    order: 18,
    name: "Everyday Sentences",
    newKeys: [],
    instructions: [
      "Full sentences now, capital letters and all -- the keyboard part is done, this tier is about rhythm across real prose instead of isolated words.",
    ],
    minAccuracy: 85,
    content: { kind: "graduation", wordCount: 20 },
    subLessonCount: 6,
  },
  "building-speed": {
    id: "building-speed",
    tier: "intermediate",
    stage: "intermediate-practice",
    order: 19,
    name: "Building Speed",
    newKeys: [],
    instructions: [
      "Same kind of text, more of it per run. Longer passages punish a hesitant rhythm more than a short one does -- that's the point.",
    ],
    minAccuracy: 85,
    content: { kind: "graduation", wordCount: 25 },
    subLessonCount: 6,
  },
  "numbers-and-words": {
    id: "numbers-and-words",
    tier: "intermediate",
    stage: "intermediate-practice",
    order: 20,
    name: "Numbers & Words",
    newKeys: [],
    instructions: [
      "Digits mixed into ordinary sentences -- the number row stops being a separate skill here and starts being part of normal typing, the way it actually gets used.",
    ],
    minAccuracy: 83,
    content: { kind: "graduation", wordCount: 20, numbers: true },
    subLessonCount: 6,
  },
  "longer-passages": {
    id: "longer-passages",
    tier: "intermediate",
    stage: "intermediate-practice",
    order: 21,
    name: "Longer Passages",
    newKeys: [],
    instructions: [
      "A full paragraph's worth per run. This is where a shaky hand position starts to show -- if your accuracy drops here, it's a posture problem more often than a speed one.",
    ],
    minAccuracy: 85,
    content: { kind: "graduation", wordCount: 30 },
    subLessonCount: 7,
  },
  "mixed-practice": {
    id: "mixed-practice",
    tier: "intermediate",
    stage: "intermediate-practice",
    order: 22,
    name: "Mixed Practice",
    newKeys: [],
    instructions: [
      "Punctuation and numbers together, at length -- everything Intermediate has taught, combined into one run instead of practiced in isolation.",
    ],
    minAccuracy: 85,
    content: { kind: "graduation", wordCount: 30, numbers: true },
    subLessonCount: 7,
  },
  "intermediate-checkpoint": {
    id: "intermediate-checkpoint",
    tier: "intermediate",
    stage: "intermediate-practice",
    order: 23,
    name: "Intermediate Checkpoint",
    newKeys: [],
    instructions: [
      "The longest run yet, mixed punctuation and numbers, no easing in. Clear this and Advanced unlocks -- speed and precision under real pressure.",
    ],
    minAccuracy: 87,
    content: { kind: "graduation", wordCount: 35, numbers: true },
    subLessonCount: 9,
  },
  "speed-endurance": {
    id: "speed-endurance",
    tier: "advanced",
    stage: "advanced-practice",
    order: 24,
    name: "Speed Endurance",
    newKeys: [],
    instructions: [
      "Long, sustained runs -- the goal here isn't a faster peak, it's holding your pace without it decaying over the length of the passage.",
    ],
    minAccuracy: 88,
    content: { kind: "graduation", wordCount: 40 },
    subLessonCount: 7,
  },
  "precision-under-pressure": {
    id: "precision-under-pressure",
    tier: "advanced",
    stage: "advanced-practice",
    order: 25,
    name: "Precision Under Pressure",
    newKeys: [],
    instructions: [
      "Shorter runs, a much higher accuracy bar. This one is about control, not endurance -- slow down if that's what it takes to clear it clean.",
    ],
    minAccuracy: 92,
    content: { kind: "graduation", wordCount: 25, numbers: true },
    subLessonCount: 7,
  },
  "long-form-typing": {
    id: "long-form-typing",
    tier: "advanced",
    stage: "advanced-practice",
    order: 26,
    name: "Long-Form Typing",
    newKeys: [],
    instructions: [
      "The longest passages in the whole track. This is closer to what typing actually looks like outside a lesson -- an email, a document, a real page of text.",
    ],
    minAccuracy: 88,
    content: { kind: "graduation", wordCount: 50 },
    subLessonCount: 8,
  },
  "numbers-and-symbols-mastery": {
    id: "numbers-and-symbols-mastery",
    tier: "advanced",
    stage: "advanced-practice",
    order: 27,
    name: "Numbers & Symbols Mastery",
    newKeys: [],
    instructions: [
      "Heavy on digits and punctuation together -- the combination that trips up even a fast typist, because it breaks the rhythm a plain word gives you.",
    ],
    minAccuracy: 90,
    content: { kind: "graduation", wordCount: 30, numbers: true },
    subLessonCount: 8,
  },
  "final-challenge": {
    id: "final-challenge",
    tier: "advanced",
    stage: "advanced-practice",
    order: 28,
    name: "Final Challenge",
    newKeys: [],
    instructions: [
      "Everything the track has taught, at full length and full difficulty. Clear this and you're done -- take the real typing test next and see where you actually land.",
    ],
    minAccuracy: 90,
    content: { kind: "graduation", wordCount: 50, numbers: true },
    subLessonCount: 11,
    isGraduation: true,
  },
};

export const LESSON_LIST: LessonDefinition[] = [
  LESSON_DEFINITIONS["home-row-left"],
  LESSON_DEFINITIONS["home-row-right"],
  LESSON_DEFINITIONS["home-row-combined"],
  LESSON_DEFINITIONS["home-row-words"],
  LESSON_DEFINITIONS["top-row-left"],
  LESSON_DEFINITIONS["top-row-right"],
  LESSON_DEFINITIONS["top-row-combined"],
  LESSON_DEFINITIONS["top-row-words"],
  LESSON_DEFINITIONS["bottom-row-left"],
  LESSON_DEFINITIONS["bottom-row-right"],
  LESSON_DEFINITIONS["bottom-row-combined"],
  LESSON_DEFINITIONS["bottom-row-words"],
  LESSON_DEFINITIONS["numbers-low"],
  LESSON_DEFINITIONS["numbers-high"],
  LESSON_DEFINITIONS["full-keyboard-words"],
  LESSON_DEFINITIONS["full-keyboard-punctuation"],
  LESSON_DEFINITIONS["graduation"],
  LESSON_DEFINITIONS["everyday-sentences"],
  LESSON_DEFINITIONS["building-speed"],
  LESSON_DEFINITIONS["numbers-and-words"],
  LESSON_DEFINITIONS["longer-passages"],
  LESSON_DEFINITIONS["mixed-practice"],
  LESSON_DEFINITIONS["intermediate-checkpoint"],
  LESSON_DEFINITIONS["speed-endurance"],
  LESSON_DEFINITIONS["precision-under-pressure"],
  LESSON_DEFINITIONS["long-form-typing"],
  LESSON_DEFINITIONS["numbers-and-symbols-mastery"],
  LESSON_DEFINITIONS["final-challenge"],
];
