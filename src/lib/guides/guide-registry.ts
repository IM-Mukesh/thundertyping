import type { GuideCategory, GuideCategoryMeta, GuideEntry } from "./guide-types";
import { GAME_LIST } from "@/lib/games/game-types";

export const GUIDE_CATEGORIES: Record<GuideCategory, GuideCategoryMeta> = {
  "typing-basics": {
    id: "typing-basics",
    name: "Typing Basics",
    slug: "typing-basics",
    path: "/guides/typing-basics",
    title: "Typing Basics — Finger Placement, Home Row & Posture",
    description:
      "Master touch typing from the ground up: proper home row finger placement, blind typing without looking, ergonomic posture, and foundational muscle memory.",
    shortDescription: "Home row placement, blind typing technique, and ergonomic posture foundations.",
    recommendedOrderDescription:
      "Start with touch typing fundamentals, explore the interactive finger map, break the look-down habit, and align your posture.",
    productRoute: "/lessons",
    productLabel: "Start Beginner Lessons",
  },
  "typing-practice": {
    id: "typing-practice",
    name: "Typing Practice",
    slug: "typing-practice",
    path: "/guides/typing-practice",
    title: "Typing Practice — Targeted Drills, Routines & Warmups",
    description:
      "Deliberate practice frameworks, physical hand warmups, classroom curricula, and structured drills designed to build automaticity without burning out.",
    shortDescription: "Daily practice routines, physical stretches, and structured drills.",
    recommendedOrderDescription:
      "Learn daily beginner practice routines, perform tendon-glide stretches, practice English word pools, and integrate structured curricula.",
    productRoute: "/lessons/practice",
    productLabel: "Try Weak-Key Practice",
  },
  "improve-your-typing": {
    id: "improve-your-typing",
    name: "Improve Your Typing",
    slug: "improve-your-typing",
    path: "/guides/improve-your-typing",
    title: "Improve Your Typing — Speed, Accuracy & Plateau Breaking",
    description:
      "Diagnostic speed protocols, motor learning frameworks, accuracy stabilization, and proven methods to push past performance plateaus from 40 to 100+ WPM.",
    shortDescription: "Speed progression, accuracy stabilization, and plateau diagnostics.",
    recommendedOrderDescription:
      "Benchmark your baseline WPM, stabilize 96%+ accuracy, build speed ladders, and diagnose speed plateaus.",
    productRoute: "/",
    productLabel: "Take a Speed Test",
  },
  "typing-tests-tools": {
    id: "typing-tests-tools",
    name: "Typing Tests & Tools",
    slug: "typing-tests-tools",
    path: "/guides/typing-tests-tools",
    title: "Typing Tests & Tools — Metrics, Formulas & Calculators",
    description:
      "Measurement formulas (Gross vs. Net WPM, CPM, KPH), interactive live converters, test duration science, and professional data-entry standards.",
    shortDescription: "Measurement formulas, live converters, and test duration guides.",
    recommendedOrderDescription:
      "Understand Net vs. Gross WPM, convert live between WPM and KPH, select the optimal test duration, and prepare for data entry exams.",
    productRoute: "/guides/wpm-cpm-kph-calculator",
    productLabel: "Open Live Calculator",
  },
  "keyboard-skills": {
    id: "keyboard-skills",
    name: "Keyboard Skills",
    slug: "keyboard-skills",
    path: "/guides/keyboard-skills",
    title: "Keyboard Skills — Number Row, Layouts & Hardware",
    description:
      "Advanced finger independence, mastering top-row numbers and punctuation blind, mechanical switch selection, and alternative layout comparisons.",
    shortDescription: "Blind number typing, mechanical switch selection, and layout comparisons.",
    recommendedOrderDescription:
      "Master blind top-row number reaching, compare QWERTY vs. Dvorak vs. Colemak, and optimize your mechanical switches.",
    productRoute: "/lessons/building-speed",
    productLabel: "Practice Number Row",
  },
  "typing-work-study": {
    id: "typing-work-study",
    name: "Typing for Work & Study",
    slug: "typing-work-study",
    path: "/guides/typing-work-study",
    title: "Typing for Work & Study — Coding, Dispatch, Accessibility & Careers",
    description:
      "Specialized typing workflows for software engineers, 911 dispatchers (CritiCall), one-handed typists, and neurodivergent learners (dyslexia & dysgraphia).",
    shortDescription: "Coding syntax, emergency dispatch tests, and accessible typing methods.",
    recommendedOrderDescription:
      "Explore specialized programming workflows, public safety CritiCall benchmarks, multisensory touch typing, and adaptive one-handed layouts.",
    productRoute: "/games",
    productLabel: "Play Skill Games",
  },
};

export const GUIDE_REGISTRY: GuideEntry[] = [
  // 1. Typing Basics
  {
    slug: "how-to-touch-type",
    href: "/guides/how-to-touch-type",
    title: "How to Touch Type",
    description:
      "The complete finger-to-key map, home row anchor principles, a practice progression that doesn't skip steps, and a realistic timeline from zero to automaticity.",
    category: "typing-basics",
    primaryTopic: "Touch Typing Fundamentals",
    intent: "practical",
    readingTimeMinutes: 7,
    featured: true,
    recommendedSequenceOrder: 1,
    relatedGuides: [
      "touch-typing-finger-map",
      "how-to-type-without-looking-at-the-keyboard",
      "proper-typing-posture-and-ergonomics",
    ],
    relatedProductRoute: "/lessons",
    relatedProductLabel: "Start Lesson 1: Home Row Left",
    heroImage: "/guides/shared/home-row-finger-placement.webp",
    articleImages: [
      "/guides/shared/home-row-finger-placement.webp",
      "/guides/shared/keyboard-finger-zones-map.webp",
    ],
    publishedAt: "2026-09-14",
    updatedAt: "2026-09-24",
  },
  {
    slug: "touch-typing-finger-map",
    href: "/guides/touch-typing-finger-map",
    title: "Touch-Typing Finger Map",
    description:
      "An interactive, hover-or-tap chart of every key and the finger that owns it, plus Shift key rules, reach vectors, and the top number row.",
    category: "typing-basics",
    primaryTopic: "Finger Placement & Keyboard Anatomy",
    intent: "tool",
    readingTimeMinutes: 5,
    featured: false,
    recommendedSequenceOrder: 2,
    relatedGuides: [
      "how-to-touch-type",
      "how-to-type-without-looking-at-the-keyboard",
      "how-to-type-top-row-without-looking",
    ],
    relatedProductRoute: "/lessons",
    relatedProductLabel: "Practice with Interactive Keyboard",
    heroImage: "/guides/shared/keyboard-finger-zones-map.webp",
    articleImages: [
      "/guides/shared/home-row-finger-placement.webp",
      "/guides/shared/keyboard-finger-zones-map.webp",
    ],
    publishedAt: "2026-09-14",
    updatedAt: "2026-09-25",
  },
  {
    slug: "how-to-type-without-looking-at-the-keyboard",
    href: "/guides/how-to-type-without-looking-at-the-keyboard",
    title: "How to Type Without Looking at the Keyboard",
    description:
      "A day-by-day protocol for breaking the glance habit — tactical error handling, tactile homing bump techniques, and muscle memory reinforcement.",
    category: "typing-basics",
    primaryTopic: "Blind Typing Technique",
    intent: "practical",
    readingTimeMinutes: 6,
    featured: false,
    recommendedSequenceOrder: 3,
    relatedGuides: [
      "how-to-touch-type",
      "touch-typing-roadmap-for-beginners",
      "how-many-minutes-a-day-to-practice-typing",
    ],
    relatedProductRoute: "/lessons",
    relatedProductLabel: "Train on Screen Without Looking",
    publishedAt: "2026-09-14",
    updatedAt: "2026-09-24",
  },
  {
    slug: "proper-typing-posture-and-ergonomics",
    href: "/guides/proper-typing-posture-and-ergonomics",
    title: "Proper Typing Posture & Ergonomics",
    description:
      "A complete desk setup guide: 90-degree elbow angles, neutral wrists, monitor eye line distance, and preventing carpal tunnel and repetitive strain injury.",
    category: "typing-basics",
    primaryTopic: "Ergonomics & Desk Setup",
    intent: "informational",
    readingTimeMinutes: 8,
    featured: false,
    recommendedSequenceOrder: 4,
    relatedGuides: [
      "typing-stretches-and-hand-warmups",
      "one-handed-typing-guide",
      "how-to-touch-type",
    ],
    relatedProductRoute: "/lessons",
    relatedProductLabel: "Practice with Good Posture",
    heroImage: "/guides/typing-basics/proper-typing-posture-and-ergonomics/proper-typing-posture-and-ergonomics.webp",
    articleImages: [
      "/guides/typing-basics/proper-typing-posture-and-ergonomics/proper-typing-posture-and-ergonomics.webp",
    ],
    publishedAt: "2026-09-26",
    updatedAt: "2026-09-26",
  },

  // 2. Typing Practice
  {
    slug: "typing-practice-for-beginners",
    href: "/guides/typing-practice-for-beginners",
    title: "Typing Practice for Beginners",
    description:
      "A real curriculum: exercises by category, routines from 5 to 30 minutes, structured warmups, and what to practice at each stage of learning.",
    category: "typing-practice",
    primaryTopic: "Beginner Practice Routines",
    intent: "practical",
    readingTimeMinutes: 7,
    featured: true,
    recommendedSequenceOrder: 1,
    relatedGuides: [
      "home-row-typing-practice",
      "how-to-type-without-looking-at-the-keyboard",
      "typing-resources-for-teachers",
    ],
    relatedProductRoute: "/lessons",
    relatedProductLabel: "Try Today's 10-Minute Training",
    publishedAt: "2026-09-14",
    updatedAt: "2026-09-24",
  },
  {
    slug: "typing-stretches-and-hand-warmups",
    href: "/guides/typing-stretches-and-hand-warmups",
    title: "8 Essential Typing Stretches & Hand Warmups",
    description:
      "Physical therapist-recommended tendon glides, prayer stretches, and mobility exercises to relieve wrist stiffness, warm up tendons, and prevent RSI.",
    category: "typing-practice",
    primaryTopic: "Hand Mobility & Physical Warmups",
    intent: "practical",
    readingTimeMinutes: 6,
    featured: false,
    recommendedSequenceOrder: 2,
    relatedGuides: [
      "proper-typing-posture-and-ergonomics",
      "how-to-structure-typing-practice-session",
      "best-keyboard-switches-for-typing",
    ],
    relatedProductRoute: "/lessons/practice",
    relatedProductLabel: "Warm Up with Weak-Key Drills",
    heroImage: "/guides/typing-practice/typing-stretches-and-hand-warmups/typing-stretches-and-hand-warmups.webp",
    articleImages: [
      "/guides/typing-practice/typing-stretches-and-hand-warmups/typing-stretches-and-hand-warmups.webp",
    ],
    publishedAt: "2026-09-26",
    updatedAt: "2026-09-26",
  },
  {
    slug: "english-typing-test-and-practice",
    href: "/guides/english-typing-test-and-practice",
    title: "English Typing Test & Practice",
    description:
      "What English typing tests measure, why word frequency pools alter test scores, and how to practice natural prose, literature, and news passages.",
    category: "typing-practice",
    primaryTopic: "Prose Practice & Passages",
    intent: "practical",
    readingTimeMinutes: 6,
    featured: false,
    recommendedSequenceOrder: 3,
    relatedGuides: [
      "typing-test-vs-typing-practice",
      "vocabulary-typing-practice",
      "typing-practice-for-beginners",
    ],
    relatedProductRoute: "/vocabulary",
    relatedProductLabel: "Practice Daily Vocabulary",
    publishedAt: "2026-09-14",
    updatedAt: "2026-09-24",
  },
  {
    slug: "typing-resources-for-teachers",
    href: "/guides/typing-resources-for-teachers",
    title: "Free Typing Resources for Teachers",
    description:
      "A 9-stage classroom framework across 28 structured units, pacing options from bell-ringers to lab blocks, and objective formative assessment.",
    category: "typing-practice",
    primaryTopic: "Classroom & Educational Curriculum",
    intent: "career",
    readingTimeMinutes: 8,
    featured: false,
    recommendedSequenceOrder: 4,
    relatedGuides: [
      "touch-typing-for-dyslexia-and-dysgraphia",
      "touch-typing-lesson-order",
      "typing-speed-by-age",
      "how-many-minutes-a-day-to-practice-typing",
    ],
    relatedProductRoute: "/lessons",
    relatedProductLabel: "Explore 28 Curriculum Units",
    publishedAt: "2026-09-14",
    updatedAt: "2026-09-24",
  },

  // 3. Improve Your Typing
  {
    slug: "how-to-improve-typing-speed",
    href: "/guides/how-to-improve-typing-speed",
    title: "How to Improve Your Typing Speed",
    description:
      "A complete training system: fix accuracy first, isolate weak keys, drill letter transitions, and climb steadily from 30 WPM to 100+.",
    category: "improve-your-typing",
    primaryTopic: "Speed Progression & Method",
    intent: "practical",
    readingTimeMinutes: 9,
    featured: true,
    recommendedSequenceOrder: 1,
    relatedGuides: [
      "how-to-improve-typing-accuracy",
      "typing-accuracy",
      "how-to-break-a-typing-speed-plateau",
      "how-to-improve-typing-consistency",
    ],
    relatedProductRoute: "/",
    relatedProductLabel: "Test Your Current WPM",
    heroImage: "/guides/improve-your-typing/how-to-improve-typing-speed/wpm-progression-ladder.webp",
    articleImages: [
      "/guides/improve-your-typing/how-to-improve-typing-speed/wpm-progression-ladder.webp",
    ],
    publishedAt: "2026-09-14",
    updatedAt: "2026-09-24",
  },
  {
    slug: "how-to-improve-typing-accuracy",
    href: "/guides/how-to-improve-typing-accuracy",
    title: "How to Improve Typing Accuracy",
    description:
      "Why accuracy drops under speed pressure, the motor feedback loop, error-containment strategies, and practical accuracy targets by skill stage.",
    category: "improve-your-typing",
    primaryTopic: "Accuracy Stabilization",
    intent: "practical",
    readingTimeMinutes: 7,
    featured: false,
    recommendedSequenceOrder: 2,
    relatedGuides: [
      "how-to-improve-typing-speed",
      "typing-accuracy",
      "why-wpm-is-high-accuracy-is-low",
      "typing-practice-for-weak-keys",
    ],
    relatedProductRoute: "/lessons/practice",
    relatedProductLabel: "Target Your Weakest Keys",
    heroImage: "/guides/improve-your-typing/how-to-improve-typing-accuracy/accuracy-improvement-loop.webp",
    articleImages: [
      "/guides/improve-your-typing/how-to-improve-typing-accuracy/accuracy-improvement-loop.webp",
    ],
    publishedAt: "2026-09-14",
    updatedAt: "2026-09-24",
  },
  {
    slug: "typing-accuracy",
    href: "/guides/typing-accuracy",
    title: "Typing Accuracy: What the Percentage Means",
    description:
      "Understand the accuracy percentage, HeroTyping's correct/incorrect/missed formula, practical benchmark bands, and how to read speed beside quality.",
    category: "improve-your-typing",
    primaryTopic: "Accuracy Measurement & Benchmarks",
    intent: "benchmark",
    readingTimeMinutes: 8,
    featured: false,
    recommendedSequenceOrder: 3,
    relatedGuides: [
      "how-to-improve-typing-accuracy",
      "net-wpm-vs-gross-wpm",
      "how-to-find-your-weakest-typing-keys",
      "average-typing-speed",
    ],
    relatedProductRoute: "/",
    relatedProductLabel: "Test WPM & Accuracy",
    publishedAt: "2026-10-05",
    updatedAt: "2026-10-05",
  },
  {
    slug: "how-to-break-a-typing-speed-plateau",
    href: "/guides/how-to-break-a-typing-speed-plateau",
    title: "How to Break a Typing Speed Plateau",
    description:
      "Stuck at 50, 70, or 90 WPM? Motor automaticity protocols, sub-vocalizing elimination, word-burst training, and overcoming neurological ceilings.",
    category: "improve-your-typing",
    primaryTopic: "Plateau Breaking & Motor Learning",
    intent: "practical",
    readingTimeMinutes: 11,
    featured: false,
    recommendedSequenceOrder: 4,
    relatedGuides: [
      "how-to-improve-typing-speed",
      "how-to-find-your-weakest-typing-keys",
      "qwerty-vs-dvorak-vs-colemak",
      "fix-burst-and-stall-typing-pace-caret",
    ],
    relatedProductRoute: "/games",
    relatedProductLabel: "Break Plateaus with Speed Games",
    heroImage: "/guides/improve-your-typing/how-to-break-a-typing-speed-plateau/how-to-break-a-typing-speed-plateau.webp",
    articleImages: [
      "/guides/improve-your-typing/how-to-break-a-typing-speed-plateau/how-to-break-a-typing-speed-plateau.webp",
    ],
    publishedAt: "2026-09-26",
    updatedAt: "2026-09-26",
  },
  {
    slug: "average-typing-speed",
    href: "/guides/average-typing-speed",
    title: "Average Typing Speed: What Is a Good WPM?",
    description:
      "Honest WPM benchmarks by skill level and context, with age and job context, accuracy caveats, and a real typing test.",
    category: "improve-your-typing",
    primaryTopic: "Typing Benchmarks & Standards",
    intent: "benchmark",
    readingTimeMinutes: 8,
    featured: false,
    recommendedSequenceOrder: 5,
    relatedGuides: [
      "net-wpm-vs-gross-wpm",
      "wpm-cpm-kph-calculator",
      "911-dispatcher-typing-test",
      "typing-speed-by-age",
      "typing-accuracy",
      "how-to-set-a-typing-speed-goal",
    ],
    relatedProductRoute: "/",
    relatedProductLabel: "Benchmark Your Speed Now",
    publishedAt: "2026-09-14",
    updatedAt: "2026-10-05",
  },
  {
    slug: "typing-speed-by-age",
    href: "/guides/typing-speed-by-age",
    title: "Typing Speed by Age: Grade-Level Benchmarks With Context",
    description:
      "Transparent grade-level typing guidance, accuracy expectations, and fair ways to measure progress without treating age as destiny.",
    category: "improve-your-typing",
    primaryTopic: "Age & Grade-Level Benchmarks",
    intent: "benchmark",
    readingTimeMinutes: 8,
    featured: false,
    recommendedSequenceOrder: 6,
    relatedGuides: [
      "average-typing-speed",
      "typing-accuracy",
      "typing-resources-for-teachers",
      "typing-practice-for-beginners",
    ],
    relatedProductRoute: "/",
    relatedProductLabel: "Take a Baseline Test",
    publishedAt: "2026-10-05",
    updatedAt: "2026-10-05",
  },

  // 4. Typing Tests & Tools
  {
    slug: "net-wpm-vs-gross-wpm",
    href: "/guides/net-wpm-vs-gross-wpm",
    title: "How Is WPM Calculated?",
    description:
      "The exact five-character formula, Gross WPM vs. Net WPM, error penalties, and why two typing testing platforms can score the identical run differently.",
    category: "typing-tests-tools",
    primaryTopic: "Scoring Formulas & WPM Parity",
    intent: "informational",
    readingTimeMinutes: 6,
    featured: true,
    recommendedSequenceOrder: 1,
    relatedGuides: [
      "wpm-cpm-kph-calculator",
      "average-typing-speed",
      "typing-accuracy",
      "why-wpm-is-high-accuracy-is-low",
      "beat-your-personal-best-typing-speed",
    ],
    relatedProductRoute: "/",
    relatedProductLabel: "Test with Standard Parity Scoring",
    heroImage: "/guides/typing-tests-tools/net-wpm-vs-gross-wpm/wpm-formula-gross-vs-net.webp",
    articleImages: [
      "/guides/typing-tests-tools/net-wpm-vs-gross-wpm/wpm-formula-gross-vs-net.webp",
    ],
    publishedAt: "2026-09-14",
    updatedAt: "2026-09-24",
  },
  {
    slug: "wpm-cpm-kph-calculator",
    href: "/guides/wpm-cpm-kph-calculator",
    title: "WPM, CPM & KPH Calculator",
    description:
      "Interactive live conversion calculator between Words Per Minute, Characters Per Minute, and Keystrokes Per Hour — with mathematical formulas demonstrated.",
    category: "typing-tests-tools",
    primaryTopic: "Live Conversion Calculator",
    intent: "tool",
    readingTimeMinutes: 4,
    featured: false,
    recommendedSequenceOrder: 2,
    relatedGuides: [
      "net-wpm-vs-gross-wpm",
      "average-typing-speed",
      "data-entry-typing-test",
    ],
    relatedProductRoute: "/guides/wpm-cpm-kph-calculator",
    relatedProductLabel: "Use the Interactive Calculator",
    publishedAt: "2026-09-14",
    updatedAt: "2026-09-25",
  },
  {
    slug: "typing-test-duration-guide",
    href: "/guides/typing-test-duration-guide",
    title: "Which Typing Test Duration Should You Use?",
    description:
      "How 15-second burst tests, 60-second industry standards, and 5-minute endurance exams measure completely different neurological and muscular capacities.",
    category: "typing-tests-tools",
    primaryTopic: "Test Duration Science",
    intent: "informational",
    readingTimeMinutes: 6,
    featured: false,
    recommendedSequenceOrder: 3,
    relatedGuides: [
      "typing-test-vs-typing-practice",
      "net-wpm-vs-gross-wpm",
      "typing-games-vs-typing-tests",
    ],
    relatedProductRoute: "/",
    relatedProductLabel: "Take a 60-Second Test",
    heroImage: "/guides/typing-tests-tools/typing-test-duration-guide/typing-test-duration-comparison.webp",
    articleImages: [
      "/guides/typing-tests-tools/typing-test-duration-guide/typing-test-duration-comparison.webp",
    ],
    publishedAt: "2026-09-14",
    updatedAt: "2026-09-24",
  },
  {
    slug: "data-entry-typing-test",
    href: "/guides/data-entry-typing-test",
    title: "Data Entry Typing Test",
    description:
      "What employment data entry tests evaluate, how KPH relates to Net WPM, 10-key numeric keypad benchmarks, and practical pre-interview preparation.",
    category: "typing-tests-tools",
    primaryTopic: "Data Entry & Employment Testing",
    intent: "career",
    readingTimeMinutes: 7,
    featured: false,
    recommendedSequenceOrder: 4,
    relatedGuides: [
      "911-dispatcher-typing-test",
      "wpm-cpm-kph-calculator",
      "number-row-typing-practice",
    ],
    relatedProductRoute: "/lessons/building-speed",
    relatedProductLabel: "Practice Number Entry Drills",
    publishedAt: "2026-09-14",
    updatedAt: "2026-09-24",
  },

  // 5. Keyboard Skills
  {
    slug: "how-to-type-numbers-and-symbols-without-looking",
    href: "/guides/how-to-type-numbers-and-symbols-without-looking",
    title: "How to Type Numbers & Symbols Blind",
    description:
      "Conquer the top number row with tactile anchor fingers, diagonal reach vectors, and the opposite-hand Shift rule for punctuation symbols.",
    category: "keyboard-skills",
    primaryTopic: "Top Row Numbers & Punctuation",
    intent: "practical",
    readingTimeMinutes: 8,
    featured: true,
    recommendedSequenceOrder: 1,
    relatedGuides: [
      "number-row-typing-practice",
      "practice-typing-numbers-and-symbols-without-looking",
      "typing-for-programmers",
    ],
    relatedProductRoute: "/lessons/building-speed",
    relatedProductLabel: "Practice Number Lessons",
    heroImage: "/guides/keyboard-skills/how-to-type-numbers-and-symbols-without-looking/how-to-type-numbers-and-symbols-without-looking.webp",
    articleImages: [
      "/guides/keyboard-skills/how-to-type-numbers-and-symbols-without-looking/how-to-type-numbers-and-symbols-without-looking.webp",
    ],
    publishedAt: "2026-09-26",
    updatedAt: "2026-09-26",
  },
  {
    slug: "qwerty-vs-dvorak-vs-colemak",
    href: "/guides/qwerty-vs-dvorak-vs-colemak",
    title: "QWERTY vs. Dvorak vs. Colemak",
    description:
      "Finger travel distance, same-finger bigram penalties, home row dwell time, and real data on which keyboard layout is actually fastest or most ergonomic.",
    category: "keyboard-skills",
    primaryTopic: "Alternative Keyboard Layouts",
    intent: "informational",
    readingTimeMinutes: 9,
    featured: false,
    recommendedSequenceOrder: 2,
    relatedGuides: [
      "best-keyboard-switches-for-typing",
      "how-to-break-a-typing-speed-plateau",
      "typing-for-programmers",
    ],
    relatedProductRoute: "/lessons",
    relatedProductLabel: "Master QWERTY Foundations",
    heroImage: "/guides/keyboard-skills/qwerty-vs-dvorak-vs-colemak/qwerty-vs-dvorak-vs-colemak.webp",
    articleImages: [
      "/guides/keyboard-skills/qwerty-vs-dvorak-vs-colemak/qwerty-vs-dvorak-vs-colemak.webp",
    ],
    publishedAt: "2026-09-26",
    updatedAt: "2026-09-26",
  },
  {
    slug: "best-keyboard-switches-for-typing",
    href: "/guides/best-keyboard-switches-for-typing",
    title: "Best Keyboard Switches for Typing",
    description:
      "Linear vs. tactile vs. clicky compared: actuation force curves, pre-travel distance, bottoming-out fatigue, and choosing switches for maximum typing speed.",
    category: "keyboard-skills",
    primaryTopic: "Mechanical Switches & Hardware",
    intent: "informational",
    readingTimeMinutes: 8,
    featured: false,
    recommendedSequenceOrder: 3,
    relatedGuides: [
      "qwerty-vs-dvorak-vs-colemak",
      "typing-stretches-and-hand-warmups",
      "one-handed-typing-guide",
    ],
    relatedProductRoute: "/",
    relatedProductLabel: "Test Your Switches Live",
    heroImage: "/guides/keyboard-skills/best-keyboard-switches-for-typing/best-keyboard-switches-for-typing.webp",
    articleImages: [
      "/guides/keyboard-skills/best-keyboard-switches-for-typing/best-keyboard-switches-for-typing.webp",
    ],
    publishedAt: "2026-09-26",
    updatedAt: "2026-09-26",
  },

  // 6. Typing for Work & Study
  {
    slug: "typing-for-programmers",
    href: "/guides/typing-for-programmers",
    title: "Typing for Programmers",
    description:
      "Master brackets, braces, and logic operators blind, configure Caps Lock to Ctrl/Escape, understand Vim navigation, and eliminate syntax typing friction.",
    category: "typing-work-study",
    primaryTopic: "Coding Syntax & Developer Typing",
    intent: "career",
    readingTimeMinutes: 8,
    featured: true,
    recommendedSequenceOrder: 1,
    relatedGuides: [
      "punctuation-typing-practice",
      "practice-typing-numbers-and-symbols-without-looking",
      "best-keyboard-switches-for-typing",
    ],
    relatedProductRoute: "/lessons/numbers-and-symbols-mastery",
    relatedProductLabel: "Drill Symbol & Syntax Mastery",
    heroImage: "/guides/typing-work-study/typing-for-programmers/typing-for-programmers.webp",
    articleImages: [
      "/guides/typing-work-study/typing-for-programmers/typing-for-programmers.webp",
    ],
    publishedAt: "2026-09-26",
    updatedAt: "2026-09-26",
  },
  {
    slug: "911-dispatcher-typing-test",
    href: "/guides/911-dispatcher-typing-test",
    title: "911 Dispatcher Typing Test & CritiCall Prep",
    description:
      "Passing benchmarks, audio-to-CAD transcription, alphanumeric rapid entry, and how to train for emergency communication public safety examinations.",
    category: "typing-work-study",
    primaryTopic: "Emergency Dispatch & CritiCall Prep",
    intent: "career",
    readingTimeMinutes: 8,
    featured: false,
    recommendedSequenceOrder: 2,
    relatedGuides: [
      "data-entry-typing-test",
      "average-typing-speed",
      "typing-test-duration-guide",
    ],
    relatedProductRoute: "/lessons/precision-under-pressure",
    relatedProductLabel: "Practice High-Pressure Drills",
    heroImage: "/guides/typing-work-study/911-dispatcher-typing-test/911-dispatcher-typing-test.webp",
    articleImages: [
      "/guides/typing-work-study/911-dispatcher-typing-test/911-dispatcher-typing-test.webp",
    ],
    publishedAt: "2026-09-26",
    updatedAt: "2026-09-26",
  },
  {
    slug: "touch-typing-for-dyslexia-and-dysgraphia",
    href: "/guides/touch-typing-for-dyslexia-and-dysgraphia",
    title: "Typing for Dyslexia and Dysgraphia",
    description:
      "How multisensory touch typing and finger motor memory liberate neurodivergent learners from handwriting fatigue, spelling blocks, and cognitive overload.",
    category: "typing-work-study",
    primaryTopic: "Neurodiversity & Accessibility",
    intent: "informational",
    readingTimeMinutes: 7,
    featured: false,
    recommendedSequenceOrder: 3,
    relatedGuides: [
      "typing-resources-for-teachers",
      "one-handed-typing-guide",
      "touch-typing-roadmap-for-beginners",
    ],
    relatedProductRoute: "/lessons",
    relatedProductLabel: "Learn with Multisensory Feedback",
    heroImage: "/guides/typing-work-study/touch-typing-for-dyslexia-and-dysgraphia/touch-typing-for-dyslexia-and-dysgraphia.webp",
    articleImages: [
      "/guides/typing-work-study/touch-typing-for-dyslexia-and-dysgraphia/touch-typing-for-dyslexia-and-dysgraphia.webp",
    ],
    publishedAt: "2026-09-26",
    updatedAt: "2026-09-26",
  },
  {
    slug: "one-handed-typing-guide",
    href: "/guides/one-handed-typing-guide",
    title: "One-Handed Typing Guide",
    description:
      "Adaptive layouts, Half-QWERTY mirror typing principles, and radial touch zones for stroke recovery, amputees, and unilateral hand injury.",
    category: "typing-work-study",
    primaryTopic: "One-Handed Adaptive Typing",
    intent: "practical",
    readingTimeMinutes: 8,
    featured: false,
    recommendedSequenceOrder: 4,
    relatedGuides: [
      "touch-typing-for-dyslexia-and-dysgraphia",
      "proper-typing-posture-and-ergonomics",
      "qwerty-vs-dvorak-vs-colemak",
    ],
    relatedProductRoute: "/lessons",
    relatedProductLabel: "Train Single-Handed Drills",
    heroImage: "/guides/typing-work-study/one-handed-typing-guide/one-handed-typing-guide.webp",
    articleImages: [
      "/guides/typing-work-study/one-handed-typing-guide/one-handed-typing-guide.webp",
    ],
    publishedAt: "2026-09-26",
    updatedAt: "2026-09-26",
  },

  // -------------------------------------------------------------
  // THE 20 FLAGSHIP GUIDES (Priorities 01 - 20)
  // -------------------------------------------------------------
  {
    slug: "how-to-find-your-weakest-typing-keys",
    href: "/guides/how-to-find-your-weakest-typing-keys",
    title: "How to Find Your Weakest Typing Keys",
    description:
      "A diagnostic system for identifying which keyboard keys cause systematic speed and accuracy drops — distinguishing statistical error clusters from random typos.",
    category: "improve-your-typing",
    primaryTopic: "Weak-Key Diagnosis",
    intent: "practical",
    readingTimeMinutes: 7,
    featured: true,
    recommendedSequenceOrder: 5,
    relatedGuides: [
      "typing-practice-for-weak-keys",
      "typing-practice-for-difficult-keys",
      "how-to-use-typing-test-results-to-improve",
    ],
    relatedProductRoute: "/lessons/practice",
    relatedProductLabel: "Diagnose Weak Keys on HeroTyping",
    heroImage: "/guides/improve-your-typing/how-to-find-your-weakest-typing-keys/weak-key-diagnostic-heatmap.webp",

    articleImages: [

      "/guides/improve-your-typing/how-to-find-your-weakest-typing-keys/weak-key-diagnostic-heatmap.webp",

    ],

    expectedHeroImage: "/guides/improve-your-typing/how-to-find-your-weakest-typing-keys/weak-key-diagnostic-heatmap.webp",
    publishedAt: "2026-09-27",
    updatedAt: "2026-09-27",
  },
  {
    slug: "typing-practice-for-weak-keys",
    href: "/guides/typing-practice-for-weak-keys",
    title: "Typing Practice for Weak Keys: How to Fix the Keys Slowing You Down",
    description:
      "How to fix identified weak keys through progressive overload: moving from isolated keys to anchor bigrams, embedded vocabulary, and full-speed prose.",
    category: "typing-practice",
    primaryTopic: "Targeted Weak-Key Remediation",
    intent: "practical",
    readingTimeMinutes: 8,
    featured: true,
    recommendedSequenceOrder: 5,
    relatedGuides: [
      "how-to-find-your-weakest-typing-keys",
      "typing-practice-for-difficult-keys",
      "how-to-improve-typing-accuracy",
    ],
    relatedProductRoute: "/lessons/practice",
    relatedProductLabel: "Start Weak-Key Practice Drill",
    heroImage: "/guides/typing-practice/typing-practice-for-weak-keys/weak-key-drill-progression.webp",

    articleImages: [

      "/guides/typing-practice/typing-practice-for-weak-keys/weak-key-drill-progression.webp",

    ],

    expectedHeroImage: "/guides/typing-practice/typing-practice-for-weak-keys/weak-key-drill-progression.webp",
    publishedAt: "2026-09-27",
    updatedAt: "2026-09-27",
  },
  {
    slug: "touch-typing-lesson-order",
    href: "/guides/touch-typing-lesson-order",
    title: "Touch Typing Lesson Order: What to Learn First and Next",
    description:
      "The biomechanical and cognitive rationale behind keyboard curriculum sequencing: why home-row anchors precede vertical reaches, and when to introduce numbers.",
    category: "typing-basics",
    primaryTopic: "Curriculum Sequencing",
    intent: "informational",
    readingTimeMinutes: 8,
    featured: false,
    recommendedSequenceOrder: 5,
    relatedGuides: [
      "touch-typing-roadmap-for-beginners",
      "touch-typing-finger-map",
      "typing-resources-for-teachers",
    ],
    relatedProductRoute: "/lessons",
    relatedProductLabel: "Explore 28-Lesson Curriculum",
    heroImage: "/guides/typing-basics/touch-typing-lesson-order/touch-typing-curriculum-flow.webp",

    articleImages: [

      "/guides/typing-basics/touch-typing-lesson-order/touch-typing-curriculum-flow.webp",

    ],

    expectedHeroImage: "/guides/typing-basics/touch-typing-lesson-order/touch-typing-curriculum-flow.webp",
    publishedAt: "2026-09-27",
    updatedAt: "2026-09-27",
  },
  {
    slug: "touch-typing-roadmap-for-beginners",
    href: "/guides/touch-typing-roadmap-for-beginners",
    title: "A Complete Touch-Typing Roadmap for Beginners",
    description:
      "A complete milestone journey from zero touch-typing experience to 60+ WPM: weekly training schedules, cognitive plateaus, and measuring real progress.",
    category: "typing-basics",
    primaryTopic: "Beginner Milestone Roadmap",
    intent: "practical",
    readingTimeMinutes: 9,
    featured: true,
    recommendedSequenceOrder: 6,
    relatedGuides: [
      "how-to-touch-type",
      "touch-typing-lesson-order",
      "how-to-structure-typing-practice-session",
    ],
    relatedProductRoute: "/lessons",
    relatedProductLabel: "Take Starting Point Placement",
    heroImage: "/guides/typing-basics/touch-typing-roadmap-for-beginners/beginner-touch-typing-timeline.webp",

    articleImages: [

      "/guides/typing-basics/touch-typing-roadmap-for-beginners/beginner-touch-typing-timeline.webp",

    ],

    expectedHeroImage: "/guides/typing-basics/touch-typing-roadmap-for-beginners/beginner-touch-typing-timeline.webp",
    publishedAt: "2026-09-27",
    updatedAt: "2026-09-27",
  },
  {
    slug: "home-row-typing-practice",
    href: "/guides/home-row-typing-practice",
    title: "Home Row Typing Practice: ASDF JKL; Exercises for Beginners",
    description:
      "Master the foundation of touch typing: tactile F/J nubs, resting hand position, finger independence drills, and transitioning from letters to real words.",
    category: "typing-basics",
    primaryTopic: "Home Row Drills & Anchors",
    intent: "practical",
    readingTimeMinutes: 7,
    featured: false,
    recommendedSequenceOrder: 7,
    relatedGuides: [
      "typing-practice-for-beginners",
      "how-to-type-without-looking-at-the-keyboard",
      "bottom-row-typing-practice",
    ],
    relatedProductRoute: "/lessons/home-row-left",
    relatedProductLabel: "Practice Home Row Lesson 1",
    heroImage: "/guides/typing-basics/home-row-typing-practice/home-row-asdf-jkl-guide.webp",

    articleImages: [

      "/guides/typing-basics/home-row-typing-practice/home-row-asdf-jkl-guide.webp",

    ],

    expectedHeroImage: "/guides/typing-basics/home-row-typing-practice/home-row-asdf-jkl-guide.webp",
    publishedAt: "2026-09-27",
    updatedAt: "2026-09-27",
  },
  {
    slug: "how-to-type-top-row-without-looking",
    href: "/guides/how-to-type-top-row-without-looking",
    title: "How to Type the Top Row Without Looking at the Keyboard",
    description:
      "Reach mechanics for QWERTYUIOP: upward diagonal vectors, keeping home-row anchors steady, avoiding wrist lifting, and common top-row error traps.",
    category: "keyboard-skills",
    primaryTopic: "Top-Row Reach Vectors",
    intent: "practical",
    readingTimeMinutes: 7,
    featured: false,
    recommendedSequenceOrder: 4,
    relatedGuides: [
      "bottom-row-typing-practice",
      "number-row-typing-practice",
      "touch-typing-finger-map",
    ],
    relatedProductRoute: "/lessons/top-row-combined",
    relatedProductLabel: "Drill Top-Row Lessons",
    heroImage: "/guides/keyboard-skills/how-to-type-top-row-without-looking/top-row-reach-vectors.webp",

    articleImages: [

      "/guides/keyboard-skills/how-to-type-top-row-without-looking/top-row-reach-vectors.webp",

    ],

    expectedHeroImage: "/guides/keyboard-skills/how-to-type-top-row-without-looking/top-row-reach-vectors.webp",
    publishedAt: "2026-09-27",
    updatedAt: "2026-09-27",
  },
  {
    slug: "bottom-row-typing-practice",
    href: "/guides/bottom-row-typing-practice",
    title: "Bottom Row Typing Practice: Z X C V B N M",
    description:
      "Overcoming the hardest row: finger flexion curls, wrist clearance, the B and N reach divide, and building automaticity for bottom-row letter combinations.",
    category: "keyboard-skills",
    primaryTopic: "Bottom-Row Finger Flexion",
    intent: "practical",
    readingTimeMinutes: 7,
    featured: false,
    recommendedSequenceOrder: 5,
    relatedGuides: [
      "how-to-type-top-row-without-looking",
      "home-row-typing-practice",
      "touch-typing-finger-map",
    ],
    relatedProductRoute: "/lessons/numbers-low",
    relatedProductLabel: "Drill Bottom-Row Lessons",
    heroImage: "/guides/keyboard-skills/bottom-row-typing-practice/bottom-row-flexion-mechanics.webp",

    articleImages: [

      "/guides/keyboard-skills/bottom-row-typing-practice/bottom-row-flexion-mechanics.webp",

    ],

    expectedHeroImage: "/guides/keyboard-skills/bottom-row-typing-practice/bottom-row-flexion-mechanics.webp",
    publishedAt: "2026-09-27",
    updatedAt: "2026-09-27",
  },
  {
    slug: "number-row-typing-practice",
    href: "/guides/number-row-typing-practice",
    title: "Number Row Typing Practice: Learn 1–0 Without Looking",
    description:
      "Conquer the top number row (1–0) without looking down: two-row reach distance, anchor fingers, digit splits between 5 and 6, and real-world number drills.",
    category: "keyboard-skills",
    primaryTopic: "Top Number Row 1–0",
    intent: "practical",
    readingTimeMinutes: 8,
    featured: false,
    recommendedSequenceOrder: 6,
    relatedGuides: [
      "how-to-type-numbers-and-symbols-without-looking",
      "how-to-type-top-row-without-looking",
      "data-entry-typing-test",
    ],
    relatedProductRoute: "/lessons/building-speed",
    relatedProductLabel: "Practice Number Row Lessons",
    heroImage: "/guides/keyboard-skills/number-row-typing-practice/number-row-reaches-guide.webp",

    articleImages: [

      "/guides/keyboard-skills/number-row-typing-practice/number-row-reaches-guide.webp",

    ],

    expectedHeroImage: "/guides/keyboard-skills/number-row-typing-practice/number-row-reaches-guide.webp",
    publishedAt: "2026-09-27",
    updatedAt: "2026-09-27",
  },
  {
    slug: "punctuation-typing-practice",
    href: "/guides/punctuation-typing-practice",
    title: "Punctuation Typing Practice: A Complete Guide for Beginners",
    description:
      "Master sentence punctuation without losing speed: opposite-hand Shift synchronization, semicolon home positioning, apostrophes, quotation marks, and commas.",
    category: "keyboard-skills",
    primaryTopic: "Punctuation & Shift Coordination",
    intent: "practical",
    readingTimeMinutes: 8,
    featured: false,
    recommendedSequenceOrder: 7,
    relatedGuides: [
      "typing-practice-for-difficult-keys",
      "practice-typing-numbers-and-symbols-without-looking",
      "custom-text-typing-test",
    ],
    relatedProductRoute: "/lessons/everyday-sentences",
    relatedProductLabel: "Practice Shift & Punctuation",
    heroImage: "/guides/keyboard-skills/punctuation-typing-practice/punctuation-shift-coordination.webp",

    articleImages: [

      "/guides/keyboard-skills/punctuation-typing-practice/punctuation-shift-coordination.webp",

    ],

    expectedHeroImage: "/guides/keyboard-skills/punctuation-typing-practice/punctuation-shift-coordination.webp",
    publishedAt: "2026-09-27",
    updatedAt: "2026-09-27",
  },
  {
    slug: "how-to-use-typing-test-results-to-improve",
    href: "/guides/how-to-use-typing-test-results-to-improve",
    title: "How to Use Your Typing Test Results to Improve",
    description:
      "Convert raw WPM and accuracy numbers into actionable training data: the 4-step diagnostic loop, spotting speed-accuracy trade-offs, and choosing drills.",
    category: "typing-tests-tools",
    primaryTopic: "Diagnostic Improvement Loop",
    intent: "practical",
    readingTimeMinutes: 7,
    featured: false,
    recommendedSequenceOrder: 5,
    relatedGuides: [
      "how-to-find-your-weakest-typing-keys",
      "how-to-structure-typing-practice-session",
      "how-to-improve-typing-consistency",
    ],
    relatedProductRoute: "/",
    relatedProductLabel: "Take Diagnostic Typing Test",
    heroImage: "/guides/typing-tests-tools/how-to-use-typing-test-results-to-improve/typing-test-improvement-loop.webp",

    articleImages: [

      "/guides/typing-tests-tools/how-to-use-typing-test-results-to-improve/typing-test-improvement-loop.webp",

    ],

    expectedHeroImage: "/guides/typing-tests-tools/how-to-use-typing-test-results-to-improve/typing-test-improvement-loop.webp",
    publishedAt: "2026-09-27",
    updatedAt: "2026-09-27",
  },
  {
    slug: "why-wpm-is-high-accuracy-is-low",
    href: "/guides/why-wpm-is-high-accuracy-is-low",
    title: "Why Your WPM Is High but Your Accuracy Is Low",
    description:
      "Why raw speed and accuracy can diverge, how corrections affect a test, and practical ways to adjust your pace without a universal accuracy cutoff.",
    category: "improve-your-typing",
    primaryTopic: "Accuracy-Speed Decoupling",
    intent: "practical",
    readingTimeMinutes: 8,
    featured: false,
    recommendedSequenceOrder: 6,
    relatedGuides: [
      "how-to-improve-typing-accuracy",
      "how-to-improve-typing-consistency",
      "net-wpm-vs-gross-wpm",
    ],
    relatedProductRoute: "/lessons",
    relatedProductLabel: "Practice Accuracy in Lessons",
    heroImage: "/guides/improve-your-typing/why-wpm-is-high-accuracy-is-low/error-backspace-penalty-chart.webp",

    articleImages: [

      "/guides/improve-your-typing/why-wpm-is-high-accuracy-is-low/error-backspace-penalty-chart.webp",

    ],

    expectedHeroImage: "/guides/improve-your-typing/why-wpm-is-high-accuracy-is-low/error-backspace-penalty-chart.webp",
    publishedAt: "2026-09-27",
    updatedAt: "2026-10-05",
  },
  {
    slug: "how-to-improve-typing-consistency",
    href: "/guides/how-to-improve-typing-consistency",
    title: "How to Improve Typing Consistency, Not Just Peak WPM",
    description:
      "Why burst-and-stall typing yields lower net output than steady pacing: inter-key interval variance, look-ahead buffering, and developing a metronomic rhythm.",
    category: "improve-your-typing",
    primaryTopic: "Pacing & Rhythm Consistency",
    intent: "practical",
    readingTimeMinutes: 8,
    featured: false,
    recommendedSequenceOrder: 7,
    relatedGuides: [
      "how-to-improve-typing-speed",
      "why-wpm-is-high-accuracy-is-low",
      "how-to-use-typing-test-results-to-improve",
      "fix-burst-and-stall-typing-pace-caret",
    ],
    relatedProductRoute: "/",
    relatedProductLabel: "Measure Consistency in Test",
    heroImage: "/guides/improve-your-typing/how-to-improve-typing-consistency/typing-consistency-waveform.webp",

    articleImages: [

      "/guides/improve-your-typing/how-to-improve-typing-consistency/typing-consistency-waveform.webp",

    ],

    expectedHeroImage: "/guides/improve-your-typing/how-to-improve-typing-consistency/typing-consistency-waveform.webp",
    publishedAt: "2026-09-27",
    updatedAt: "2026-09-27",
  },
  {
    slug: "improve-typing-speed-with-ghost-caret",
    href: "/guides/improve-typing-speed-with-ghost-caret",
    title: "Improve Your Typing Speed With a Ghost Caret",
    description:
      "What a pace caret (ghost caret) is, how it's different from your real cursor, and how to use it on a free typing speed test to improve faster than practicing blind.",
    category: "improve-your-typing",
    primaryTopic: "Pace Caret & Real-Time Feedback",
    intent: "practical",
    readingTimeMinutes: 6,
    featured: true,
    recommendedSequenceOrder: 8,
    relatedGuides: [
      "beat-your-personal-best-typing-speed",
      "fix-burst-and-stall-typing-pace-caret",
      "how-to-set-a-typing-speed-goal",
    ],
    relatedProductRoute: "/",
    relatedProductLabel: "Try the Pace Caret",
    heroImage: "/guides/improve-your-typing/improve-typing-speed-with-ghost-caret/pace-caret-hero.webp",
    articleImages: ["/guides/improve-your-typing/improve-typing-speed-with-ghost-caret/pace-caret-hero.webp"],
    expectedHeroImage: "/guides/improve-your-typing/improve-typing-speed-with-ghost-caret/pace-caret-hero.webp",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
  },
  {
    slug: "beat-your-personal-best-typing-speed",
    href: "/guides/beat-your-personal-best-typing-speed",
    title: "Beat Your Personal Best Typing Speed",
    description:
      "How to actually beat your typing speed PB instead of hoping it happens: a step-by-step method using HeroTyping's pace caret to race your own best score.",
    category: "improve-your-typing",
    primaryTopic: "Personal Best Training",
    intent: "practical",
    readingTimeMinutes: 6,
    featured: false,
    recommendedSequenceOrder: 9,
    relatedGuides: [
      "improve-typing-speed-with-ghost-caret",
      "net-wpm-vs-gross-wpm",
      "how-to-set-a-typing-speed-goal",
    ],
    relatedProductRoute: "/",
    relatedProductLabel: "Race Your Personal Best",
    heroImage: "/guides/improve-your-typing/beat-your-personal-best-typing-speed/race-your-pb-hero.webp",
    articleImages: ["/guides/improve-your-typing/beat-your-personal-best-typing-speed/race-your-pb-hero.webp"],
    expectedHeroImage: "/guides/improve-your-typing/beat-your-personal-best-typing-speed/race-your-pb-hero.webp",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
  },
  {
    slug: "fix-burst-and-stall-typing-pace-caret",
    href: "/guides/fix-burst-and-stall-typing-pace-caret",
    title: "Why Your Typing Speed Stalls (and How to Fix It)",
    description:
      "Stuck at the same WPM for weeks? Burst-and-stall typing is usually the cause. Here's the math behind why it plateaus speed, and a pace-caret routine that fixes it.",
    category: "improve-your-typing",
    primaryTopic: "Pacing-Driven Plateau Fix",
    intent: "practical",
    readingTimeMinutes: 7,
    featured: false,
    recommendedSequenceOrder: 10,
    relatedGuides: [
      "how-to-break-a-typing-speed-plateau",
      "how-to-improve-typing-consistency",
      "improve-typing-speed-with-ghost-caret",
    ],
    relatedProductRoute: "/",
    relatedProductLabel: "Practice With a Pace Target",
    heroImage: "/guides/improve-your-typing/fix-burst-and-stall-typing-pace-caret/burst-and-stall-waveform.webp",
    articleImages: ["/guides/improve-your-typing/fix-burst-and-stall-typing-pace-caret/burst-and-stall-waveform.webp"],
    expectedHeroImage: "/guides/improve-your-typing/fix-burst-and-stall-typing-pace-caret/burst-and-stall-waveform.webp",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
  },
  {
    slug: "how-to-set-a-typing-speed-goal",
    href: "/guides/how-to-set-a-typing-speed-goal",
    title: "How to Set a Typing Speed Goal",
    description:
      "Have a target WPM in mind but no plan for reaching it? Here's how to turn a typing speed goal into a staged training routine using HeroTyping's custom pace caret.",
    category: "improve-your-typing",
    primaryTopic: "Goal Setting & Staged Training",
    intent: "practical",
    readingTimeMinutes: 7,
    featured: false,
    recommendedSequenceOrder: 11,
    relatedGuides: [
      "average-typing-speed",
      "beat-your-personal-best-typing-speed",
      "fix-burst-and-stall-typing-pace-caret",
    ],
    relatedProductRoute: "/",
    relatedProductLabel: "Set a Custom Pace Target",
    heroImage: "/guides/improve-your-typing/how-to-set-a-typing-speed-goal/typing-speed-goal-staircase.webp",
    articleImages: ["/guides/improve-your-typing/how-to-set-a-typing-speed-goal/typing-speed-goal-staircase.webp"],
    expectedHeroImage: "/guides/improve-your-typing/how-to-set-a-typing-speed-goal/typing-speed-goal-staircase.webp",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
  },
  {
    slug: "typing-test-vs-typing-race",
    href: "/guides/typing-test-vs-typing-race",
    title: "Typing Test vs. Typing Race",
    description:
      "Multiplayer typing races, plain timed tests, and pace-caret practice compared honestly -- what each is actually good for, and which builds real typing speed fastest.",
    category: "improve-your-typing",
    primaryTopic: "Practice Method Comparison",
    intent: "informational",
    readingTimeMinutes: 7,
    featured: false,
    recommendedSequenceOrder: 12,
    relatedGuides: [
      "improve-typing-speed-with-ghost-caret",
      "fix-burst-and-stall-typing-pace-caret",
      "typing-games-vs-typing-tests",
    ],
    relatedProductRoute: "/",
    relatedProductLabel: "Try HeroTyping Free",
    heroImage: "/guides/improve-your-typing/typing-test-vs-typing-race/three-practice-methods-hero.webp",
    articleImages: ["/guides/improve-your-typing/typing-test-vs-typing-race/three-practice-methods-hero.webp"],
    expectedHeroImage: "/guides/improve-your-typing/typing-test-vs-typing-race/three-practice-methods-hero.webp",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
  },
  {
    slug: "how-many-minutes-a-day-to-practice-typing",
    href: "/guides/how-many-minutes-a-day-to-practice-typing",
    title: "How Many Minutes a Day Should You Practice Typing?",
    description:
      "The motor learning science of practice duration: why 15 minutes of daily distributed training outperforms weekend marathon cramming by over 200%.",
    category: "typing-practice",
    primaryTopic: "Daily Practice Duration & Fatigue",
    intent: "informational",
    readingTimeMinutes: 7,
    featured: false,
    recommendedSequenceOrder: 6,
    relatedGuides: [
      "how-to-structure-typing-practice-session",
      "typing-practice-for-beginners",
      "how-to-break-a-typing-speed-plateau",
    ],
    relatedProductRoute: "/lessons",
    relatedProductLabel: "Complete Today's 10-Minute Drill",
    heroImage: "/guides/typing-practice/how-many-minutes-a-day-to-practice-typing/daily-practice-duration-comparison.webp",

    articleImages: [

      "/guides/typing-practice/how-many-minutes-a-day-to-practice-typing/daily-practice-duration-comparison.webp",

    ],

    expectedHeroImage: "/guides/typing-practice/how-many-minutes-a-day-to-practice-typing/daily-practice-duration-comparison.webp",
    publishedAt: "2026-09-27",
    updatedAt: "2026-09-27",
  },
  {
    slug: "how-to-structure-typing-practice-session",
    href: "/guides/how-to-structure-typing-practice-session",
    title: "How to Structure a Typing Practice Session",
    description:
      "A 4-phase training architecture for typing sessions: physical tendon warmup, precision anchoring, targeted weak-key remediation, and timed benchmark testing.",
    category: "typing-practice",
    primaryTopic: "4-Phase Practice Framework",
    intent: "practical",
    readingTimeMinutes: 8,
    featured: false,
    recommendedSequenceOrder: 7,
    relatedGuides: [
      "how-many-minutes-a-day-to-practice-typing",
      "typing-stretches-and-hand-warmups",
      "how-to-use-typing-test-results-to-improve",
    ],
    relatedProductRoute: "/lessons",
    relatedProductLabel: "Open Guided Lessons",
    heroImage: "/guides/typing-practice/how-to-structure-typing-practice-session/practice-session-block-architecture.webp",

    articleImages: [

      "/guides/typing-practice/how-to-structure-typing-practice-session/practice-session-block-architecture.webp",

    ],

    expectedHeroImage: "/guides/typing-practice/how-to-structure-typing-practice-session/practice-session-block-architecture.webp",
    publishedAt: "2026-09-27",
    updatedAt: "2026-09-27",
  },
  {
    slug: "custom-text-typing-test",
    href: "/guides/custom-text-typing-test",
    title: "Custom Text Typing Test: Practice With Your Own Text",
    description:
      "How to train on domain-specific vocabulary: pasting coding files, legal briefs, medical terminology, and speech transcripts into custom typing practice.",
    category: "typing-tests-tools",
    primaryTopic: "Domain-Specific Custom Text",
    intent: "tool",
    readingTimeMinutes: 6,
    featured: false,
    recommendedSequenceOrder: 6,
    relatedGuides: [
      "vocabulary-typing-practice",
      "typing-for-programmers",
      "data-entry-typing-test",
    ],
    relatedProductRoute: "/",
    relatedProductLabel: "Try Custom Mode on HeroTyping",
    heroImage: "/guides/typing-tests-tools/custom-text-typing-test/custom-text-typing-workflow.webp",

    articleImages: [

      "/guides/typing-tests-tools/custom-text-typing-test/custom-text-typing-workflow.webp",

    ],

    expectedHeroImage: "/guides/typing-tests-tools/custom-text-typing-test/custom-text-typing-workflow.webp",
    publishedAt: "2026-09-27",
    updatedAt: "2026-09-27",
  },
  {
    slug: "typing-test-vs-typing-practice",
    href: "/guides/typing-test-vs-typing-practice",
    title: "Typing Test vs Typing Practice: What's the Difference?",
    description:
      "Why repeatedly taking tests is not practicing: understanding evaluation versus skill acquisition, avoiding test burnout, and the 80/20 training rule.",
    category: "typing-practice",
    primaryTopic: "Evaluation vs. Deliberate Skill",
    intent: "informational",
    readingTimeMinutes: 7,
    featured: false,
    recommendedSequenceOrder: 8,
    relatedGuides: [
      "typing-games-vs-typing-tests",
      "english-typing-test-and-practice",
      "typing-test-duration-guide",
    ],
    relatedProductRoute: "/lessons",
    relatedProductLabel: "Start Deliberate Lessons",
    heroImage: "/guides/typing-practice/typing-test-vs-typing-practice/test-vs-practice-comparison.webp",

    articleImages: [

      "/guides/typing-practice/typing-test-vs-typing-practice/test-vs-practice-comparison.webp",

    ],

    expectedHeroImage: "/guides/typing-practice/typing-test-vs-typing-practice/test-vs-practice-comparison.webp",
    publishedAt: "2026-09-27",
    updatedAt: "2026-09-27",
  },
  {
    slug: "typing-games-vs-typing-tests",
    href: "/guides/typing-games-vs-typing-tests",
    title: "Typing Games vs Typing Tests: Which Should You Use?",
    description:
      "The role of arcade typing in building reflexes: stress inoculation, reaction velocity, maintaining combos under pressure, and when to use formal tests.",
    category: "typing-practice",
    primaryTopic: "Gamified Stress Inoculation vs Benchmarks",
    intent: "informational",
    readingTimeMinutes: 8,
    featured: false,
    recommendedSequenceOrder: 9,
    relatedGuides: [
      "typing-test-vs-typing-practice",
      "vocabulary-typing-practice",
      "typing-test-duration-guide",
      "typing-test-vs-typing-race",
    ],
    relatedProductRoute: "/games",
    relatedProductLabel: `Explore ${GAME_LIST.length} Arcade Typing Games`,
    heroImage: "/guides/typing-practice/typing-games-vs-typing-tests/arcade-games-vs-timed-tests.webp",

    articleImages: [

      "/guides/typing-practice/typing-games-vs-typing-tests/arcade-games-vs-timed-tests.webp",

    ],

    expectedHeroImage: "/guides/typing-practice/typing-games-vs-typing-tests/arcade-games-vs-timed-tests.webp",
    publishedAt: "2026-09-27",
    updatedAt: "2026-09-27",
  },
  {
    slug: "vocabulary-typing-practice",
    href: "/guides/vocabulary-typing-practice",
    title: "Vocabulary Typing Practice: Learn Words While You Type",
    description:
      "Dual-benefit practice: how typing literature and vocabulary with definitions and speech pronunciation builds orthographic spelling automaticity.",
    category: "typing-practice",
    primaryTopic: "Lexical & Spelling Automaticity",
    intent: "practical",
    readingTimeMinutes: 7,
    featured: false,
    recommendedSequenceOrder: 10,
    relatedGuides: [
      "custom-text-typing-test",
      "english-typing-test-and-practice",
      "typing-games-vs-typing-tests",
    ],
    relatedProductRoute: "/vocabulary",
    relatedProductLabel: "Practice 1,300 Daily Words",
    heroImage: "/guides/typing-practice/vocabulary-typing-practice/vocabulary-orthographic-mapping.webp",

    articleImages: [

      "/guides/typing-practice/vocabulary-typing-practice/vocabulary-orthographic-mapping.webp",

    ],

    expectedHeroImage: "/guides/typing-practice/vocabulary-typing-practice/vocabulary-orthographic-mapping.webp",
    publishedAt: "2026-09-27",
    updatedAt: "2026-09-27",
  },
  {
    slug: "practice-typing-numbers-and-symbols-without-looking",
    href: "/guides/practice-typing-numbers-and-symbols-without-looking",
    title: "How to Practice Typing Numbers and Symbols Without Looking",
    description:
      "Master real-world alphanumeric sequences: currency figures, dates, formulas, and code syntax without glancing down, using dual Shift keys and anchor fingers.",
    category: "keyboard-skills",
    primaryTopic: "Advanced Mixed Alphanumerics",
    intent: "practical",
    readingTimeMinutes: 9,
    featured: true,
    recommendedSequenceOrder: 8,
    relatedGuides: [
      "how-to-type-numbers-and-symbols-without-looking",
      "punctuation-typing-practice",
      "number-row-typing-practice",
    ],
    relatedProductRoute: "/lessons/numbers-and-symbols-mastery",
    relatedProductLabel: "Master Number & Symbol Drills",
    heroImage: "/guides/keyboard-skills/practice-typing-numbers-and-symbols-without-looking/mixed-numeric-symbol-patterns.webp",

    articleImages: [

      "/guides/keyboard-skills/practice-typing-numbers-and-symbols-without-looking/mixed-numeric-symbol-patterns.webp",

    ],

    expectedHeroImage: "/guides/keyboard-skills/practice-typing-numbers-and-symbols-without-looking/mixed-numeric-symbol-patterns.webp",
    publishedAt: "2026-09-27",
    updatedAt: "2026-09-27",
  },
  {
    slug: "typing-practice-for-difficult-keys",
    href: "/guides/typing-practice-for-difficult-keys",
    title: "Typing Practice for Difficult Keyboard Keys and Finger Reaches",
    description:
      "Biomechanical remediation for awkward keys: Q, Z, X, P, semicolon, and brackets — pinky independence, avoiding wrist twist, and targeted transition drills.",
    category: "keyboard-skills",
    primaryTopic: "Peripheral Keys & Pinky Reaches",
    intent: "practical",
    readingTimeMinutes: 8,
    featured: false,
    recommendedSequenceOrder: 9,
    relatedGuides: [
      "typing-practice-for-weak-keys",
      "how-to-find-your-weakest-typing-keys",
      "punctuation-typing-practice",
    ],
    relatedProductRoute: "/lessons/practice",
    relatedProductLabel: "Practice Peripheral Keys",
    heroImage: "/guides/keyboard-skills/typing-practice-for-difficult-keys/difficult-reaches-finger-mechanics.webp",

    articleImages: [

      "/guides/keyboard-skills/typing-practice-for-difficult-keys/difficult-reaches-finger-mechanics.webp",

    ],

    expectedHeroImage: "/guides/keyboard-skills/typing-practice-for-difficult-keys/difficult-reaches-finger-mechanics.webp",
    publishedAt: "2026-09-27",
    updatedAt: "2026-09-27",
  },
];

export function getAllGuides(): GuideEntry[] {
  return GUIDE_REGISTRY;
}

export function getGuidesByCategory(category: GuideCategory): GuideEntry[] {
  return GUIDE_REGISTRY.filter((guide) => guide.category === category).sort(
    (a, b) => (a.recommendedSequenceOrder ?? 99) - (b.recommendedSequenceOrder ?? 99)
  );
}

export function getGuideBySlug(slug: string): GuideEntry | undefined {
  return GUIDE_REGISTRY.find((guide) => guide.slug === slug);
}

export function getCategoryMeta(category: GuideCategory): GuideCategoryMeta {
  return GUIDE_CATEGORIES[category];
}

export function getRelatedGuides(slug: string): GuideEntry[] {
  const guide = getGuideBySlug(slug);
  if (!guide) return [];
  return guide.relatedGuides
    .map((s) => getGuideBySlug(s))
    .filter((g): g is GuideEntry => g !== undefined);
}
