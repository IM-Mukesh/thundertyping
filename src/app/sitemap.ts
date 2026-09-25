import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/constants";
import { LESSON_LIST } from "@/lib/lessons/lesson-types";
import { GAME_LIST } from "@/lib/games/game-types";
import { VOCAB_DIFFICULTIES } from "@/lib/vocabulary/vocabulary-words";

// Each route's lastModified is the date its content was actually last
// changed, set by hand at edit time — not `new Date()` evaluated per
// request, which would falsely tell crawlers every page changed on every
// crawl. Bump a route's date only when you actually change that page.
const routes: {
  path: string;
  priority: number;
  changeFrequency: "daily" | "monthly";
  lastModified: string;
}[] = [
  { path: "", priority: 1, changeFrequency: "daily", lastModified: "2026-09-15" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly", lastModified: "2026-09-14" },
  { path: "/privacy", priority: 0.3, changeFrequency: "monthly", lastModified: "2026-09-14" },
  { path: "/terms", priority: 0.3, changeFrequency: "monthly", lastModified: "2026-09-14" },
  { path: "/guides", priority: 0.6, changeFrequency: "monthly", lastModified: "2026-09-24" },
  {
    path: "/guides/how-to-improve-typing-speed",
    priority: 0.6,
    changeFrequency: "monthly",
    lastModified: "2026-09-24",
  },
  {
    path: "/guides/average-typing-speed",
    priority: 0.6,
    changeFrequency: "monthly",
    lastModified: "2026-09-24",
  },
  {
    path: "/guides/how-to-touch-type",
    priority: 0.6,
    changeFrequency: "monthly",
    lastModified: "2026-09-24",
  },
  {
    path: "/guides/net-wpm-vs-gross-wpm",
    priority: 0.6,
    changeFrequency: "monthly",
    lastModified: "2026-09-24",
  },
  {
    path: "/guides/how-to-type-without-looking-at-the-keyboard",
    priority: 0.6,
    changeFrequency: "monthly",
    lastModified: "2026-09-24",
  },
  {
    path: "/guides/typing-practice-for-beginners",
    priority: 0.6,
    changeFrequency: "monthly",
    lastModified: "2026-09-24",
  },
  {
    path: "/guides/how-to-improve-typing-accuracy",
    priority: 0.6,
    changeFrequency: "monthly",
    lastModified: "2026-09-24",
  },
  {
    path: "/guides/english-typing-test-and-practice",
    priority: 0.6,
    changeFrequency: "monthly",
    lastModified: "2026-09-24",
  },
  {
    path: "/guides/typing-test-duration-guide",
    priority: 0.6,
    changeFrequency: "monthly",
    lastModified: "2026-09-24",
  },
  {
    path: "/guides/data-entry-typing-test",
    priority: 0.6,
    changeFrequency: "monthly",
    lastModified: "2026-09-24",
  },
  {
    path: "/guides/wpm-cpm-kph-calculator",
    priority: 0.7,
    changeFrequency: "monthly",
    lastModified: "2026-09-25",
  },
  {
    path: "/guides/touch-typing-finger-map",
    priority: 0.7,
    changeFrequency: "monthly",
    lastModified: "2026-09-25",
  },
  {
    path: "/guides/typing-resources-for-teachers",
    priority: 0.6,
    changeFrequency: "monthly",
    lastModified: "2026-09-25",
  },
  { path: "/games", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-09-15" },
  // Generated from GAME_LIST rather than hand-listed -- a hand-maintained
  // copy of this list previously drifted out of sync and silently dropped 4
  // of 10 live game routes from the sitemap. Bump a specific game's date by
  // pulling it out into its own entry if its content changes independently.
  ...GAME_LIST.map((game) => ({
    path: `/games/${game.id}`,
    priority: 0.7,
    changeFrequency: "monthly" as const,
    lastModified: "2026-09-15",
  })),
  { path: "/lessons", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-09-22" },
  { path: "/lessons/practice", priority: 0.4, changeFrequency: "monthly", lastModified: "2026-09-24" },
  // Generated rather than hand-listed -- LESSON_LIST is the single source of
  // truth for the curriculum, so this can never drift the way the
  // hand-maintained games list once did. If an individual lesson's content
  // is edited later, pull its entry out into the routes array above by hand
  // so its own date can move independently, instead of bumping this whole
  // block.
  ...LESSON_LIST.map((lesson) => ({
    path: `/lessons/${lesson.id}`,
    priority: 0.6,
    changeFrequency: "monthly" as const,
    lastModified: "2026-09-22",
  })),
  { path: "/vocabulary", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-09-23" },
  ...VOCAB_DIFFICULTIES.map((difficulty) => ({
    path: `/vocabulary/${difficulty}`,
    priority: 0.6,
    changeFrequency: "monthly" as const,
    lastModified: "2026-09-23",
  })),
  { path: "/achievements", priority: 0.5, changeFrequency: "monthly", lastModified: "2026-09-24" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, priority, changeFrequency, lastModified }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
