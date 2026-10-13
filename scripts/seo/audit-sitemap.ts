import sitemap from "../../src/app/sitemap";
import { SITE_URL } from "../../src/lib/seo/constants";

export interface SitemapAuditResult {
  totalUrls: number;
  uniqueLocs: number;
  duplicateLocs: string[];
  localeCounts: Record<string, number>;
  routeFamilyCounts: Record<string, number>;
  hreflangCounts: {
    urlsWithHreflang: number;
    urlsWithoutHreflang: number;
  };
  reciprocalChecks: {
    passed: boolean;
    errors: string[];
  };
  urlFormatChecks: {
    passed: boolean;
    errors: string[];
  };
}

export function auditSitemapData(): SitemapAuditResult {
  const entries = sitemap();
  const totalUrls = entries.length;
  const locs = entries.map((e) => e.url);
  const seen = new Set<string>();
  const duplicateLocs: string[] = [];

  for (const loc of locs) {
    if (seen.has(loc)) {
      duplicateLocs.push(loc);
    }
    seen.add(loc);
  }

  // Locale distribution
  const localeCounts: Record<string, number> = {
    en: 0,
    es: 0,
    "pt-BR": 0,
    de: 0,
  };

  for (const loc of locs) {
    if (loc.includes("/es/") || loc.endsWith("/es")) {
      localeCounts.es++;
    } else if (loc.includes("/pt-BR/") || loc.endsWith("/pt-BR")) {
      localeCounts["pt-BR"]++;
    } else if (loc.includes("/de/") || loc.endsWith("/de")) {
      localeCounts.de++;
    } else {
      localeCounts.en++;
    }
  }

  // Route Family breakdown
  const routeFamilyCounts: Record<string, number> = {
    "Homepage (Localized)": 0,
    "Guides Hub & Index": 0,
    "Guide Category Hubs": 0,
    "Individual Guides": 0,
    "Typing Test Drills": 0,
    "Practice Drills": 0,
    "Games Hub": 0,
    "Type Before Death (Localized Game)": 0,
    "Other Playable Games": 0,
    "Lessons Hub": 0,
    "Lesson Practice Page": 0,
    "Individual Lessons (Curriculum)": 0,
    "Vocabulary Hub": 0,
    "Vocabulary Tiers": 0,
    "Achievements Hub": 0,
    "Legal & Site Pages (about, privacy, terms)": 0,
  };

  for (const entry of entries) {
    const url = entry.url;
    // Strip origin and locale prefix to get base path
    let path = url.replace(SITE_URL, "");
    if (path.startsWith("/es")) path = path.replace("/es", "");
    if (path.startsWith("/pt-BR")) path = path.replace("/pt-BR", "");
    if (path.startsWith("/de")) path = path.replace("/de", "");

    if (path === "" || path === "/") {
      routeFamilyCounts["Homepage (Localized)"]++;
    } else if (path === "/guides") {
      routeFamilyCounts["Guides Hub & Index"]++;
    } else if (
      path.startsWith("/guides/") &&
      ["typing-basics", "typing-practice", "improve-your-typing", "typing-tests-tools", "keyboard-skills", "typing-work-study"].includes(
        path.replace("/guides/", "")
      )
    ) {
      routeFamilyCounts["Guide Category Hubs"]++;
    } else if (path.startsWith("/guides/")) {
      routeFamilyCounts["Individual Guides"]++;
    } else if (path.startsWith("/typing-test/")) {
      routeFamilyCounts["Typing Test Drills"]++;
    } else if (path.startsWith("/practice/")) {
      routeFamilyCounts["Practice Drills"]++;
    } else if (path === "/games") {
      routeFamilyCounts["Games Hub"]++;
    } else if (path === "/games/type-before-death") {
      routeFamilyCounts["Type Before Death (Localized Game)"]++;
    } else if (path.startsWith("/games/")) {
      routeFamilyCounts["Other Playable Games"]++;
    } else if (path === "/lessons") {
      routeFamilyCounts["Lessons Hub"]++;
    } else if (path === "/lessons/practice") {
      routeFamilyCounts["Lesson Practice Page"]++;
    } else if (path.startsWith("/lessons/")) {
      routeFamilyCounts["Individual Lessons (Curriculum)"]++;
    } else if (path === "/vocabulary") {
      routeFamilyCounts["Vocabulary Hub"]++;
    } else if (path.startsWith("/vocabulary/")) {
      routeFamilyCounts["Vocabulary Tiers"]++;
    } else if (path === "/achievements") {
      routeFamilyCounts["Achievements Hub"]++;
    } else if (["/about", "/privacy", "/terms"].includes(path)) {
      routeFamilyCounts["Legal & Site Pages (about, privacy, terms)"]++;
    }
  }

  // Hreflang analysis
  let urlsWithHreflang = 0;
  let urlsWithoutHreflang = 0;
  const reciprocalErrors: string[] = [];

  for (const entry of entries) {
    if (entry.alternates && entry.alternates.languages) {
      urlsWithHreflang++;
      const langs = entry.alternates.languages as Record<string, string | undefined>;
      // Must contain en, es, pt-BR, de, and x-default
      for (const reqLang of ["en", "es", "pt-BR", "de", "x-default"]) {
        if (!langs[reqLang]) {
          reciprocalErrors.push(`${entry.url} missing hreflang for ${reqLang}`);
        }
      }
      // Lowercase pt-br must NEVER appear
      if ("pt-br" in langs) {
        reciprocalErrors.push(`${entry.url} contains illegal lowercase pt-br key`);
      }
    } else {
      urlsWithoutHreflang++;
    }
  }

  // URL formatting checks (host, scheme, double slashes, trailing slashes)
  const formatErrors: string[] = [];
  for (const loc of locs) {
    if (!loc.startsWith("https://www.herotyping.com")) {
      formatErrors.push(`Invalid host or scheme: ${loc}`);
    }
    // Check for double slash in path (excluding https://)
    const pathPart = loc.replace("https://", "");
    if (pathPart.includes("//")) {
      formatErrors.push(`Double slash detected in path: ${loc}`);
    }
    // Check for non-canonical lowercase pt-br in URL
    if (loc.includes("/pt-br/") || loc.endsWith("/pt-br")) {
      formatErrors.push(`Lowercase /pt-br detected: ${loc}`);
    }
    // Check trailing slash (except homepage root is prefix-less)
    if (loc !== "https://www.herotyping.com" && loc.endsWith("/")) {
      formatErrors.push(`Trailing slash detected: ${loc}`);
    }
  }

  return {
    totalUrls,
    uniqueLocs: seen.size,
    duplicateLocs,
    localeCounts,
    routeFamilyCounts,
    hreflangCounts: {
      urlsWithHreflang,
      urlsWithoutHreflang,
    },
    reciprocalChecks: {
      passed: reciprocalErrors.length === 0,
      errors: reciprocalErrors,
    },
    urlFormatChecks: {
      passed: formatErrors.length === 0,
      errors: formatErrors,
    },
  };
}

// Run when executed directly
const result = auditSitemapData();
console.log(JSON.stringify(result, null, 2));
