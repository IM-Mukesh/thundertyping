import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/constants";
import { LESSON_LIST } from "@/lib/lessons/lesson-types";
import { PLAYABLE_GAME_LIST } from "@/lib/games/game-types";
import { VOCAB_DIFFICULTIES } from "@/lib/vocabulary/vocabulary-words";
import { LOCALES } from "@/lib/i18n/config";

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
    { path: "/typing-test/1-minute", priority: 0.9, changeFrequency: "daily", lastModified: "2026-10-07" },
    { path: "/typing-test/custom-text", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-10-07" },
    { path: "/practice/weak-keys", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-10-07" },
    { path: "/practice/accuracy", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-10-07" },
    { path: "/about", priority: 0.5, changeFrequency: "monthly", lastModified: "2026-09-27" },
    { path: "/privacy", priority: 0.3, changeFrequency: "monthly", lastModified: "2026-09-26" },
    { path: "/terms", priority: 0.3, changeFrequency: "monthly", lastModified: "2026-09-27" },
    { path: "/guides", priority: 0.8, changeFrequency: "daily", lastModified: "2026-09-27" },
    { path: "/guides/typing-basics", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-09-27" },
    { path: "/guides/typing-practice", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-09-27" },
    { path: "/guides/improve-your-typing", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-09-27" },
    { path: "/guides/typing-tests-tools", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-09-27" },
    { path: "/guides/keyboard-skills", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-09-27" },
    { path: "/guides/typing-work-study", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-09-27" },
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
      lastModified: "2026-10-05",
    },
    {
      path: "/guides/typing-speed-by-age",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-10-05",
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
      path: "/guides/typing-accuracy",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-10-05",
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
      lastModified: "2026-09-28",
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
    {
      path: "/guides/how-to-find-your-weakest-typing-keys",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-27",
    },
    {
      path: "/guides/typing-practice-for-weak-keys",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-27",
    },
    {
      path: "/guides/touch-typing-lesson-order",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-28",
    },
    {
      path: "/guides/touch-typing-roadmap-for-beginners",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-27",
    },
    {
      path: "/guides/home-row-typing-practice",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-27",
    },
    {
      path: "/guides/how-to-type-top-row-without-looking",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-27",
    },
    {
      path: "/guides/bottom-row-typing-practice",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-27",
    },
    {
      path: "/guides/number-row-typing-practice",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-27",
    },
    {
      path: "/guides/punctuation-typing-practice",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-27",
    },
    {
      path: "/guides/how-to-use-typing-test-results-to-improve",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-27",
    },
    {
      path: "/guides/why-wpm-is-high-accuracy-is-low",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-10-05",
    },
    {
      path: "/guides/how-to-improve-typing-consistency",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-27",
    },
    {
      path: "/guides/improve-typing-speed-with-ghost-caret",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-10-02",
    },
    {
      path: "/guides/beat-your-personal-best-typing-speed",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-10-02",
    },
    {
      path: "/guides/fix-burst-and-stall-typing-pace-caret",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-10-02",
    },
    {
      path: "/guides/how-to-set-a-typing-speed-goal",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-10-02",
    },
    {
      path: "/guides/typing-test-vs-typing-race",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-10-02",
    },
    {
      path: "/guides/how-many-minutes-a-day-to-practice-typing",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-27",
    },
    {
      path: "/guides/how-to-structure-typing-practice-session",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-27",
    },
    {
      path: "/guides/custom-text-typing-test",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-27",
    },
    {
      path: "/guides/typing-test-vs-typing-practice",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-27",
    },
    {
      path: "/guides/typing-games-vs-typing-tests",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-27",
    },
    {
      path: "/guides/vocabulary-typing-practice",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-27",
    },
    {
      path: "/guides/practice-typing-numbers-and-symbols-without-looking",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-27",
    },
    {
      path: "/guides/typing-practice-for-difficult-keys",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: "2026-09-27",
    },
    { path: "/games", priority: 0.8, changeFrequency: "daily", lastModified: "2026-09-26" },
    // Truthful last modified dates for playable games determined from git commit history.
    // Replaces the prior stale blanket 2026-09-15 placeholder.
    ...PLAYABLE_GAME_LIST.map((game) => {
      const gameLastModifiedMap: Record<string, string> = {
        "rakshasa-war": "2026-10-05",
        "type-before-death": "2026-10-08",
        "ghost-racer": "2026-10-04",
        "fruit-fury": "2026-10-04",
        "falling-words": "2026-10-07",
        "word-rain": "2026-10-08",
        "word-blaster": "2026-10-08",
        "boss-battle": "2026-10-08",
        "combo-rush": "2026-10-08",
      };
      return {
        path: `/games/${game.id}`,
        priority: game.id === "type-before-death" || game.id === "fruit-fury" ? 0.8 : 0.7,
        changeFrequency: "monthly" as const,
        lastModified: gameLastModifiedMap[game.id] ?? "2026-10-04",
      };
    }),
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

/**
 * Checks whether a route has genuine, fully localized UI and interactive content
 * in es, pt-BR, and de. Currently, only the Homepage ("") and the 3D survival game
 * ("/games/type-before-death") provide complete authentic translations across
 * titles, descriptions, H1/H2s, story/instructions, FAQs, schemas, and UI controls.
 * Routes with English-only articles, lesson curricula, vocabulary tiers, or drill prose
 * are kept English-only to prevent Google duplicate content penalties and invalid hreflang claims.
 */
export function isLocalizedRoute(path: string): boolean {
  if (path === "") return true; // Homepage
  if (path === "/games/type-before-death") return true; // Fully localized 3D zombie survival game
  return false;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = getSitemapRoutes();
  const includeDe = LOCALES.includes("de");
  const includeEs = LOCALES.includes("es");
  const includePt = LOCALES.includes("pt-BR");

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const { path, priority, changeFrequency, lastModified } of routes) {
    const englishUrl = `${SITE_URL}${path}`;

    if (!isLocalizedRoute(path)) {
      // English-only content (guides, about, privacy, terms).
      // Emit single canonical English entry without foreign hreflang alternates.
      sitemapEntries.push({
        url: englishUrl,
        lastModified,
        changeFrequency,
        priority,
      });
      continue;
    }

    // Genuinely localized routes:
    // Build reciprocal hreflang mapping containing all supported locales + x-default.
    const languages: Record<string, string> = {
      en: englishUrl,
      "x-default": englishUrl,
    };
    if (includeEs) languages.es = `${SITE_URL}/es${path}`;
    if (includePt) languages["pt-BR"] = `${SITE_URL}/pt-BR${path}`;
    if (includeDe) languages.de = `${SITE_URL}/de${path}`;

    // Google Localized Sitemaps: Each localized language version must have its own
    // <url> entry, each containing reciprocal links to all alternates (including itself).
    // 1. English (default prefix-less) entry
    sitemapEntries.push({
      url: englishUrl,
      lastModified,
      changeFrequency,
      priority,
      alternates: { languages },
    });

    // 2. Spanish entry
    if (includeEs) {
      sitemapEntries.push({
        url: `${SITE_URL}/es${path}`,
        lastModified,
        changeFrequency,
        priority,
        alternates: { languages },
      });
    }

    // 3. Brazilian Portuguese entry (canonical pt-BR)
    if (includePt) {
      sitemapEntries.push({
        url: `${SITE_URL}/pt-BR${path}`,
        lastModified,
        changeFrequency,
        priority,
        alternates: { languages },
      });
    }

    // 4. German entry
    if (includeDe) {
      sitemapEntries.push({
        url: `${SITE_URL}/de${path}`,
        lastModified,
        changeFrequency,
        priority,
        alternates: { languages },
      });
    }
  }

  return sitemapEntries;
}
