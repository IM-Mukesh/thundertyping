import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/constants";
import { LESSON_LIST } from "@/lib/lessons/lesson-types";
import { PLAYABLE_GAME_LIST } from "@/lib/games/game-types";
import { VOCAB_DIFFICULTIES } from "@/lib/vocabulary/vocabulary-words";

export interface SitemapRouteEntry {
  path: string;
  priority: number;
  changeFrequency: "daily" | "monthly";
  lastModified: string;
}

// Each route's lastModified is the date its content was actually last
// changed, set by hand at edit time — not `new Date()` evaluated per
// request, which would falsely tell crawlers every page changed on every
// crawl. Bump a route's date only when you actually change that page.
export function getSitemapRoutes(): SitemapRouteEntry[] {
  return [
    { path: "", priority: 1, changeFrequency: "daily", lastModified: "2026-09-26" },
    { path: "/about", priority: 0.5, changeFrequency: "monthly", lastModified: "2026-09-14" },
    { path: "/privacy", priority: 0.3, changeFrequency: "monthly", lastModified: "2026-09-26" },
    { path: "/terms", priority: 0.3, changeFrequency: "monthly", lastModified: "2026-09-14" },
    { path: "/guides", priority: 0.8, changeFrequency: "daily", lastModified: "2026-09-26" },
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
    {
      path: "/guides/proper-typing-posture-and-ergonomics",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-26",
    },
    {
      path: "/guides/typing-stretches-and-hand-warmups",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-26",
    },
    {
      path: "/guides/how-to-break-a-typing-speed-plateau",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-26",
    },
    {
      path: "/guides/qwerty-vs-dvorak-vs-colemak",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-26",
    },
    {
      path: "/guides/best-keyboard-switches-for-typing",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-26",
    },
    {
      path: "/guides/911-dispatcher-typing-test",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-26",
    },
    {
      path: "/guides/touch-typing-for-dyslexia-and-dysgraphia",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-26",
    },
    {
      path: "/guides/typing-for-programmers",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-26",
    },
    {
      path: "/guides/one-handed-typing-guide",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-26",
    },
    {
      path: "/guides/how-to-type-numbers-and-symbols-without-looking",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-26",
    },
    { path: "/games", priority: 0.8, changeFrequency: "daily", lastModified: "2026-09-26" },
    // Only genuinely playable, indexable games enter the sitemap. Upcoming / in-development
    // games are excluded generically via PLAYABLE_GAME_LIST.
    ...PLAYABLE_GAME_LIST.map((game) => ({
      path: `/games/${game.id}`,
      priority: game.id === "fruit-fury" ? 0.8 : 0.7,
      changeFrequency: "monthly" as const,
      lastModified: game.id === "fruit-fury" ? "2026-09-26" : "2026-09-15",
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
}

export default function sitemap(): MetadataRoute.Sitemap {
  return getSitemapRoutes().map(({ path, priority, changeFrequency, lastModified }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
