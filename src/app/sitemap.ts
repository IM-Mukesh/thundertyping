import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/constants";
import { LESSON_LIST } from "@/lib/lessons/lesson-types";
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
  {
    path: "/guides/how-to-improve-typing-speed",
    priority: 0.6,
    changeFrequency: "monthly",
    lastModified: "2026-09-15",
  },
  {
    path: "/guides/average-typing-speed",
    priority: 0.6,
    changeFrequency: "monthly",
    lastModified: "2026-09-15",
  },
  { path: "/games", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-09-15" },
  {
    path: "/games/falling-words",
    priority: 0.7,
    changeFrequency: "monthly",
    lastModified: "2026-09-15",
  },
  { path: "/games/word-rain", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-09-15" },
  {
    path: "/games/word-blaster",
    priority: 0.7,
    changeFrequency: "monthly",
    lastModified: "2026-09-15",
  },
  {
    path: "/games/typing-grand-prix",
    priority: 0.7,
    changeFrequency: "monthly",
    lastModified: "2026-09-15",
  },
  {
    path: "/games/boss-battle",
    priority: 0.7,
    changeFrequency: "monthly",
    lastModified: "2026-09-15",
  },
  {
    path: "/games/combo-rush",
    priority: 0.7,
    changeFrequency: "monthly",
    lastModified: "2026-09-15",
  },
  { path: "/lessons", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-09-22" },
  // Generated rather than hand-listed like the games routes above, only
  // because all 17 launched on the same day with the same date -- if an
  // individual lesson's content is edited later, pull its entry out into the
  // routes array above by hand so its own date can move independently,
  // instead of bumping this whole block.
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
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, priority, changeFrequency, lastModified }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
