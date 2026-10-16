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
  { id: "review", label: "Full Keyboard" },
  { id: "intermediate-practice", label: "Sentences & Style" },
  { id: "numbers", label: "Numbers" },
  { id: "advanced-practice", label: "Speed & Precision" },
  { id: "graduation", label: "Graduation" },
];

export type LessonId = string;

// A unit's content is generated, not hand-typed, so the curriculum stays
// cheap to extend -- see lesson-content.ts for how each kind is built, and
// buildSubLessons for how one spec becomes `subLessonCount` graduated steps.
export type DrillStyle =
  | "random"
  | "warmup"
  | "pattern"
  | "accuracy"
  | "discover-1"
  | "discover-2"
  | "pair-mix"
  | "alternation"
  | "integration"
  | "challenge"
  | "checkpoint";

export type LessonContentSpec =
  | { kind: "drill"; allowedKeys: string[]; wordCount: number; style?: DrillStyle; focusKeys?: string[] }
  | { kind: "review"; allowedKeys: string[]; wordCount: number }
  | { kind: "database_steps"; wordCount: number; steps: { targetText: string; practiceType: string }[] }
  | { kind: "exact_text"; wordCount: number; text: string; allowedKeys: string[] }
  | { kind: "graduation"; wordCount: number; numbers?: boolean; advancedMode?: "prose" | "code" | "numbers-symbols" };

export interface LessonDefinition {
  id: LessonId;
  slug: string;
  tier: LessonTier;
  stage: LessonStage;
  /** Position in the track -- LESSON_LIST is the source of truth for order and gating, this is only for display. */
  order: number;
  name: string;
  /** Keys this unit introduces for the first time. Maximum 2 new alphanumeric keys per unit. */
  newKeys: string[];
  /** Short, genuinely unit-specific copy -- avoids the templated-page thin-content pattern the SEO guardrail warns against. */
  instructions: string[];
  /** 0-100. A sub-lesson must meet this to pass and advance to the next one. Forgiving ~75% for initial key learning. */
  minAccuracy: number;
  /** The "full difficulty" content spec -- buildSubLessons scales wordCount down for earlier steps within the unit. */
  content: LessonContentSpec;
  /** How many sub-lesson steps this unit runs before it's considered complete. See buildSubLessons in lesson-content.ts. */
  subLessonCount: number;
  /** The single absolute-last unit: its complete screen points at the main test and the games hub instead of "next unit". */
  isGraduation?: boolean;
}

// Cumulative key sets guaranteeing each new lesson reinforces ALL prior keys:
const KEYS_1 = ["f", "j"];
const KEYS_2 = [...KEYS_1, "d", "k"];
const KEYS_3 = [...KEYS_2, "s", "l"];
const KEYS_4 = [...KEYS_3, "a", ";"];
const KEYS_5 = [...KEYS_4, "g", "h"]; // All 10 home row keys
const HOME_ROW_ALL = [...KEYS_5];

const KEYS_7 = [...HOME_ROW_ALL, "e", "i"];
const KEYS_8 = [...KEYS_7, "r", "u"];
const KEYS_9 = [...KEYS_8, "t", "y"];
const KEYS_10 = [...KEYS_9, "w", "o"];
const KEYS_11 = [...KEYS_10, "q", "p"];
const HOME_AND_TOP_ALL = [...KEYS_11];

const KEYS_13 = [...HOME_AND_TOP_ALL, "v", "m"];
const KEYS_14 = [...KEYS_13, "c", ","];
const KEYS_15 = [...KEYS_14, "x", "."];
const KEYS_16 = [...KEYS_15, "z", "/"];
const KEYS_17 = [...KEYS_16, "b", "n"]; // All 26 letters of alphabet + 4 punctuation marks
const ALPHABET_AND_BASIC_PUNCT = [...KEYS_17];

const NUMBERS_PAIRS_1 = [...ALPHABET_AND_BASIC_PUNCT, "4", "7"];
const NUMBERS_PAIRS_2 = [...NUMBERS_PAIRS_1, "3", "8"];
const NUMBERS_PAIRS_3 = [...NUMBERS_PAIRS_2, "2", "9"];
const NUMBERS_PAIRS_4 = [...NUMBERS_PAIRS_3, "1", "0"];
const NUMBERS_PAIRS_5 = [...NUMBERS_PAIRS_4, "5", "6"];
const ALL_KEYS_AND_NUMBERS = [...NUMBERS_PAIRS_5];

export const LESSON_DEFINITIONS: Record<LessonId, LessonDefinition> = {
  "home-row-left": {
    id: "home-row-left",
    slug: "home-row-f-j",
    tier: "beginner",
    stage: "home-row",
    order: 1,
    name: "Home Row: F & J Anchors",
    newKeys: ["f", "j"],
    instructions: [
      "Feel the small tactile bumps on the F and J keys; these are your home-row anchors. Your left index finger rests on F, and your right index finger rests on J.",
      "Keep both hands relaxed. Tap the spacebar with your thumb to advance between words. Return your index fingers to F and J after every stroke.",
    ],
    minAccuracy: 75,
    content: { kind: "drill", allowedKeys: KEYS_1, wordCount: 12 },
    subLessonCount: 7,
  },
  "home-row-right": {
    id: "home-row-right",
    slug: "home-row-d-k",
    tier: "beginner",
    stage: "home-row",
    order: 2,
    name: "Home Row: D & K Middle Fingers",
    newKeys: ["d", "k"],
    instructions: [
      "Your left middle finger rests on D; your right middle finger rests on K. Notice how your index fingers stay anchored on F and J.",
      "Strike D and K with a clean vertical tap without lifting your entire hand from the keyboard.",
    ],
    minAccuracy: 75,
    content: { kind: "drill", allowedKeys: KEYS_2, wordCount: 12 },
    subLessonCount: 7,
  },
  "home-row-combined": {
    id: "home-row-combined",
    slug: "home-row-s-l",
    tier: "beginner",
    stage: "home-row",
    order: 3,
    name: "Home Row: S & L Ring Fingers",
    newKeys: ["s", "l"],
    instructions: [
      "Your left ring finger owns S; your right ring finger owns L. Ring fingers take patience — focus on gentle, deliberate taps.",
      "Keep all other fingers hovering lightly in their home positions. Notice your hands alternating rhythmically between left and right.",
    ],
    minAccuracy: 75,
    content: { kind: "drill", allowedKeys: KEYS_3, wordCount: 14 },
    subLessonCount: 7,
  },
  "home-row-words": {
    id: "home-row-words",
    slug: "home-row-a-semicolon",
    tier: "beginner",
    stage: "home-row",
    order: 4,
    name: "Home Row: A & Semicolon Pinkies",
    newKeys: ["a", ";"],
    instructions: [
      "Your left pinky strikes A; your right pinky strikes the semicolon ;. Semicolon is a fundamental home-row anchor key.",
      "Keep your wrists steady and level. Do not twist your hands to reach the outer keys -- let the pinkies flex naturally.",
    ],
    minAccuracy: 75,
    content: { kind: "drill", allowedKeys: KEYS_4, wordCount: 14 },
    subLessonCount: 7,
  },
  "top-row-left": {
    id: "top-row-left",
    slug: "home-row-g-h",
    tier: "beginner",
    stage: "home-row",
    order: 5,
    name: "Home Row: G & H Center Reaches",
    newKeys: ["g", "h"],
    instructions: [
      "G stretches inward from your left index finger; H stretches inward from your right index finger.",
      "Always snap immediately back to your F and J anchor bumps after typing G or H to maintain touch orientation.",
    ],
    minAccuracy: 78,
    content: { kind: "drill", allowedKeys: KEYS_5, wordCount: 14 },
    subLessonCount: 7,
  },
  "top-row-right": {
    id: "top-row-right",
    slug: "home-row-mastery",
    tier: "beginner",
    stage: "home-row",
    order: 6,
    name: "Consolidation: Home Row Mastery",
    newKeys: [],
    instructions: [
      "All ten home-row keys are now unlocked. No new keys here — this consolidation unit reinforces smooth transitions.",
      "Practice real English words formed entirely from home row: 'all', 'fall', 'salad', 'flask', 'glad', and 'dash'.",
    ],
    minAccuracy: 82,
    content: { kind: "review", allowedKeys: HOME_ROW_ALL, wordCount: 14 },
    subLessonCount: 6,
  },
  "top-row-combined": {
    id: "top-row-combined",
    slug: "top-row-e-i",
    tier: "beginner",
    stage: "top-row",
    order: 7,
    name: "Top Row: E & I Vowels",
    newKeys: ["e", "i"],
    instructions: [
      "E reaches up from your left middle finger (D); I reaches up from your right middle finger (K). Two of the most common letters in English!",
      "Reach up, strike cleanly, and immediately return your middle fingers back to D and K.",
    ],
    minAccuracy: 78,
    content: { kind: "drill", allowedKeys: KEYS_7, wordCount: 14 },
    subLessonCount: 7,
  },
  "top-row-words": {
    id: "top-row-words",
    slug: "top-row-r-u",
    tier: "beginner",
    stage: "top-row",
    order: 8,
    name: "Top Row: R & U Index Reaches",
    newKeys: ["r", "u"],
    instructions: [
      "R stretches upward from F (left index); U stretches upward from J (right index).",
      "Because F and J are your home bumps, keeping your hands anchored makes the reach to R and U second nature.",
    ],
    minAccuracy: 78,
    content: { kind: "drill", allowedKeys: KEYS_8, wordCount: 14 },
    subLessonCount: 7,
  },
  "bottom-row-left": {
    id: "bottom-row-left",
    slug: "top-row-t-y",
    tier: "beginner",
    stage: "top-row",
    order: 9,
    name: "Top Row: T & Y Upper Center",
    newKeys: ["t", "y"],
    instructions: [
      "T reaches up and inward from F (left index); Y reaches up and inward from J (right index).",
      "These are the widest diagonal reaches for your index fingers on the upper deck. Take them smoothly and return home.",
    ],
    minAccuracy: 78,
    content: { kind: "drill", allowedKeys: KEYS_9, wordCount: 14 },
    subLessonCount: 7,
  },
  "bottom-row-right": {
    id: "bottom-row-right",
    slug: "top-row-w-o",
    tier: "beginner",
    stage: "top-row",
    order: 10,
    name: "Top Row: W & O Ring Reaches",
    newKeys: ["w", "o"],
    instructions: [
      "W reaches upward from S (left ring); O reaches upward from L (right ring).",
      "Maintain a light touch. Let your ring fingers extend upward without floating your entire hand off the keyboard.",
    ],
    minAccuracy: 78,
    content: { kind: "drill", allowedKeys: KEYS_10, wordCount: 14 },
    subLessonCount: 7,
  },
  "bottom-row-combined": {
    id: "bottom-row-combined",
    slug: "top-row-q-p",
    tier: "beginner",
    stage: "top-row",
    order: 11,
    name: "Top Row: Q & P Outer Pinkies",
    newKeys: ["q", "p"],
    instructions: [
      "Q reaches up from A (left pinky); P reaches up from semicolon ; (right pinky).",
      "Completes all ten letters of the top row. Keep wrists level and strike with precision.",
    ],
    minAccuracy: 78,
    content: { kind: "drill", allowedKeys: KEYS_11, wordCount: 14 },
    subLessonCount: 7,
  },
  "bottom-row-words": {
    id: "bottom-row-words",
    slug: "top-and-home-row-mastery",
    tier: "beginner",
    stage: "top-row",
    order: 12,
    name: "Consolidation: Top & Home Rows",
    newKeys: [],
    instructions: [
      "Twenty keys now unlocked! Consolidate both rows across hundreds of real English words and natural bigrams.",
      "Notice your hands establishing an effortless flow between the upper deck and the home row anchors.",
    ],
    minAccuracy: 82,
    content: { kind: "review", allowedKeys: HOME_AND_TOP_ALL, wordCount: 16 },
    subLessonCount: 6,
  },
  "numbers-low": {
    id: "numbers-low",
    slug: "bottom-row-v-m",
    tier: "beginner",
    stage: "bottom-row",
    order: 13,
    name: "Bottom Row: V & M Index Curls",
    newKeys: ["v", "m"],
    instructions: [
      "V curls downward from left index (F); M curls downward from right index (J).",
      "Curl your index finger beneath the home row to tap V and M, then relax straight back to home position.",
    ],
    minAccuracy: 78,
    content: { kind: "drill", allowedKeys: KEYS_13, wordCount: 14 },
    subLessonCount: 7,
  },
  "numbers-high": {
    id: "numbers-high",
    slug: "bottom-row-c-comma",
    tier: "beginner",
    stage: "bottom-row",
    order: 14,
    name: "Bottom Row: C & Comma",
    newKeys: ["c", ","],
    instructions: [
      "C curls down from left middle (D); comma , curls down from right middle (K).",
      "Comma is essential for sentence structure. Practice smooth pauses without breaking finger cadence.",
    ],
    minAccuracy: 78,
    content: { kind: "drill", allowedKeys: KEYS_14, wordCount: 14 },
    subLessonCount: 7,
  },
  "full-keyboard-words": {
    id: "full-keyboard-words",
    slug: "bottom-row-x-period",
    tier: "beginner",
    stage: "bottom-row",
    order: 15,
    name: "Bottom Row: X & Period",
    newKeys: ["x", "."],
    instructions: [
      "X curls down from left ring (S); period . curls down from right ring (L).",
      "Mastering the period key unlocks sentence endings. Strike cleanly with your right ring finger.",
    ],
    minAccuracy: 78,
    content: { kind: "drill", allowedKeys: KEYS_15, wordCount: 14 },
    subLessonCount: 7,
  },
  "full-keyboard-punctuation": {
    id: "full-keyboard-punctuation",
    slug: "bottom-row-z-slash",
    tier: "beginner",
    stage: "bottom-row",
    order: 16,
    name: "Bottom Row: Z & Slash",
    newKeys: ["z", "/"],
    instructions: [
      "Z curls down from left pinky (A); slash / curls down from right pinky (semicolon ;).",
      "Keep finger movements gentle and controlled -- pinkies curl downward with a relaxed wrist.",
    ],
    minAccuracy: 78,
    content: { kind: "drill", allowedKeys: KEYS_16, wordCount: 14 },
    subLessonCount: 7,
  },
  graduation: {
    id: "graduation",
    slug: "alphabet-complete-b-n",
    tier: "beginner",
    stage: "review",
    order: 17,
    name: "Alphabet Complete: B & N",
    newKeys: ["b", "n"],
    instructions: [
      "B stretches down-inward from left index (F); N stretches down-inward from right index (J).",
      "With B and N, all 26 letters of the English alphabet are unlocked! You have completed foundational key acquisition.",
    ],
    minAccuracy: 80,
    content: { kind: "drill", allowedKeys: KEYS_17, wordCount: 16 },
    subLessonCount: 7,
  },
  "everyday-sentences": {
    id: "everyday-sentences",
    slug: "shift-key-capitalization",
    tier: "intermediate",
    stage: "intermediate-practice",
    order: 18,
    name: "Shift Mechanics & Capitalization",
    newKeys: [],
    instructions: [
      "Opposite-hand Shift rule: hold Right Shift when typing left-hand letters; hold Left Shift for right-hand letters.",
      "Type real, capitalized sentences with periods and commas. Experience the full cadence of natural English prose.",
    ],
    minAccuracy: 84,
    content: { kind: "graduation", wordCount: 20, advancedMode: "prose" },
    subLessonCount: 6,
  },
  "building-speed": {
    id: "building-speed",
    slug: "number-row-4-7",
    tier: "intermediate",
    stage: "numbers",
    order: 19,
    name: "Number Row: 4 & 7",
    newKeys: ["4", "7"],
    instructions: [
      "4 reaches two rows up from left index (past R); 7 reaches two rows up from right index (past U).",
      "Keep your other fingers anchored on home row so you never lose your place when reaching into the number row.",
    ],
    minAccuracy: 80,
    content: { kind: "drill", allowedKeys: NUMBERS_PAIRS_1, wordCount: 14 },
    subLessonCount: 7,
  },
  "numbers-and-words": {
    id: "numbers-and-words",
    slug: "number-row-3-8",
    tier: "intermediate",
    stage: "numbers",
    order: 20,
    name: "Number Row: 3 & 8",
    newKeys: ["3", "8"],
    instructions: [
      "3 reaches up from left middle (past E); 8 reaches up from right middle (past I).",
      "Straight vertical reach. Return immediately to D and K after striking.",
    ],
    minAccuracy: 80,
    content: { kind: "drill", allowedKeys: NUMBERS_PAIRS_2, wordCount: 14 },
    subLessonCount: 7,
  },
  "longer-passages": {
    id: "longer-passages",
    slug: "number-row-2-9",
    tier: "intermediate",
    stage: "numbers",
    order: 21,
    name: "Number Row: 2 & 9",
    newKeys: ["2", "9"],
    instructions: [
      "2 reaches up from left ring (past W); 9 reaches up from right ring (past O).",
      "Ring fingers require calm, deliberate movement. Keep your touch light and steady.",
    ],
    minAccuracy: 80,
    content: { kind: "drill", allowedKeys: NUMBERS_PAIRS_3, wordCount: 14 },
    subLessonCount: 7,
  },
  "mixed-practice": {
    id: "mixed-practice",
    slug: "number-row-1-0",
    tier: "intermediate",
    stage: "numbers",
    order: 22,
    name: "Number Row: 1 & 0",
    newKeys: ["1", "0"],
    instructions: [
      "1 reaches up from left pinky (past Q); 0 reaches up from right pinky (past P).",
      "Corner reaches on the top-left and top-right of your keyboard.",
    ],
    minAccuracy: 80,
    content: { kind: "drill", allowedKeys: NUMBERS_PAIRS_4, wordCount: 14 },
    subLessonCount: 7,
  },
  "intermediate-checkpoint": {
    id: "intermediate-checkpoint",
    slug: "number-row-5-6",
    tier: "intermediate",
    stage: "numbers",
    order: 23,
    name: "Numbers Complete: 5 & 6",
    newKeys: ["5", "6"],
    instructions: [
      "5 and 6 complete the entire number row! Practice mixed addresses, phone numbers, quantities, and dates.",
      "Clear this checkpoint to complete Intermediate numbers and unlock Advanced mastery.",
    ],
    minAccuracy: 82,
    content: { kind: "drill", allowedKeys: ALL_KEYS_AND_NUMBERS, wordCount: 16 },
    subLessonCount: 7,
  },
  "speed-endurance": {
    id: "speed-endurance",
    slug: "symbols-and-punctuation",
    tier: "advanced",
    stage: "advanced-practice",
    order: 24,
    name: "Symbols & Practical Punctuation",
    newKeys: [],
    instructions: [
      "Practice exclamation points !, question marks ?, apostrophes ', quotes \", colons :, and hyphens -.",
      "Condition reflex memory for quotes, contractions, and compound terms without hesitating on Shift.",
    ],
    minAccuracy: 88,
    content: { kind: "graduation", wordCount: 25, numbers: true, advancedMode: "numbers-symbols" },
    subLessonCount: 7,
  },
  "precision-under-pressure": {
    id: "precision-under-pressure",
    slug: "typing-flow-and-cadence",
    tier: "advanced",
    stage: "advanced-practice",
    order: 25,
    name: "High-Frequency Flow & Cadence",
    newKeys: [],
    instructions: [
      "Zero-latency typing across the top 200 English bigrams and trigrams. Eliminate hesitation between syllables.",
      "Focus on consistency -- a smooth, unbroken rhythm produces higher net speed than bursts of rushing.",
    ],
    minAccuracy: 92,
    content: { kind: "graduation", wordCount: 25, numbers: true },
    subLessonCount: 7,
  },
  "long-form-typing": {
    id: "long-form-typing",
    slug: "paragraph-typing-stamina",
    tier: "advanced",
    stage: "advanced-practice",
    order: 26,
    name: "Natural Prose & Paragraph Stamina",
    newKeys: [],
    instructions: [
      "Multi-paragraph continuous typing. Condition physical stamina, zero wrist fatigue, and relaxed breathing.",
      "This is what real-world professional typing feels like -- sustained, effortless output across complete passages.",
    ],
    minAccuracy: 90,
    content: { kind: "graduation", wordCount: 35, advancedMode: "prose" },
    subLessonCount: 8,
  },
  "numbers-and-symbols-mastery": {
    id: "numbers-and-symbols-mastery",
    slug: "code-syntax-and-brackets",
    tier: "advanced",
    stage: "advanced-practice",
    order: 27,
    name: "Code Syntax & Technical Formats",
    newKeys: [],
    instructions: [
      "Brackets {} [] (), operators += == != =>, camelCase, snake_case, and variable syntax.",
      "Purpose-built for software engineers, data analysts, and technical professionals.",
    ],
    minAccuracy: 90,
    content: { kind: "graduation", wordCount: 30, numbers: true, advancedMode: "code" },
    subLessonCount: 8,
  },
  "final-challenge": {
    id: "final-challenge",
    slug: "touch-typing-graduation",
    tier: "advanced",
    stage: "graduation",
    order: 28,
    name: "Touch-Typing Graduation Assessment",
    newKeys: [],
    instructions: [
      "The comprehensive touch-typing evaluation. Full alphabet, numbers, punctuation, and mixed syntax under pressure.",
      "Achieve 3 or more stars to earn your Touch-Typing Academy Master Certification!",
    ],
    minAccuracy: 92,
    content: { kind: "graduation", wordCount: 45, numbers: true },
    subLessonCount: 10,
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

export const LESSON_SLUG_MAP: Record<LessonId, string> = {
  "home-row-left": "home-row-f-j",
  "home-row-right": "home-row-d-k",
  "home-row-combined": "home-row-s-l",
  "home-row-words": "home-row-a-semicolon",
  "top-row-left": "home-row-g-h",
  "top-row-right": "home-row-mastery",
  "top-row-combined": "top-row-e-i",
  "top-row-words": "top-row-r-u",
  "bottom-row-left": "top-row-t-y",
  "bottom-row-right": "top-row-w-o",
  "bottom-row-combined": "top-row-q-p",
  "bottom-row-words": "top-and-home-row-mastery",
  "numbers-low": "bottom-row-v-m",
  "numbers-high": "bottom-row-c-comma",
  "full-keyboard-words": "bottom-row-x-period",
  "full-keyboard-punctuation": "bottom-row-z-slash",
  "graduation": "alphabet-complete-b-n",
  "everyday-sentences": "shift-key-capitalization",
  "building-speed": "number-row-4-7",
  "numbers-and-words": "number-row-3-8",
  "longer-passages": "number-row-2-9",
  "mixed-practice": "number-row-1-0",
  "intermediate-checkpoint": "number-row-5-6",
  "speed-endurance": "symbols-and-punctuation",
  "precision-under-pressure": "typing-flow-and-cadence",
  "long-form-typing": "paragraph-typing-stamina",
  "numbers-and-symbols-mastery": "code-syntax-and-brackets",
  "final-challenge": "touch-typing-graduation",
};

export const LESSON_ID_BY_SLUG: Record<string, LessonId> = {
  "home-row-f-j": "home-row-left",
  "home-row-d-k": "home-row-right",
  "home-row-s-l": "home-row-combined",
  "home-row-a-semicolon": "home-row-words",
  "home-row-g-h": "top-row-left",
  "home-row-mastery": "top-row-right",
  "top-row-e-i": "top-row-combined",
  "top-row-r-u": "top-row-words",
  "top-row-t-y": "bottom-row-left",
  "top-row-w-o": "bottom-row-right",
  "top-row-q-p": "bottom-row-combined",
  "top-and-home-row-mastery": "bottom-row-words",
  "bottom-row-v-m": "numbers-low",
  "bottom-row-c-comma": "numbers-high",
  "bottom-row-x-period": "full-keyboard-words",
  "bottom-row-z-slash": "full-keyboard-punctuation",
  "alphabet-complete-b-n": "graduation",
  "shift-key-capitalization": "everyday-sentences",
  "number-row-4-7": "building-speed",
  "number-row-3-8": "numbers-and-words",
  "number-row-2-9": "longer-passages",
  "number-row-1-0": "mixed-practice",
  "number-row-5-6": "intermediate-checkpoint",
  "symbols-and-punctuation": "speed-endurance",
  "typing-flow-and-cadence": "precision-under-pressure",
  "paragraph-typing-stamina": "long-form-typing",
  "code-syntax-and-brackets": "numbers-and-symbols-mastery",
  "touch-typing-graduation": "final-challenge",
};
