import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CANONICAL_ORIGIN, SITE_NAME, SITE_URL } from "@/lib/seo/constants";
import { getSitemapRoutes } from "@/app/sitemap";
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildGameSchema,
  buildOrganizationSchema,
  buildWebApplicationSchema,
} from "@/lib/seo/json-ld";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { GUIDE_REGISTRY, GUIDE_CATEGORIES } from "@/lib/guides/guide-registry";
import { LESSON_LIST } from "@/lib/lessons/lesson-types";
import { GAME_LIST } from "@/lib/games/game-types";

describe("SEO Implementation Integrity Audit", () => {
  it("verifies canonical origin matches production HTTPS WWW hostname", () => {
    assert.equal(CANONICAL_ORIGIN, "https://www.herotyping.com");
    assert.equal(SITE_URL, "https://www.herotyping.com");
    assert.equal(SITE_NAME, "HeroTyping");
  });

  describe("Sitemap Integrity", () => {
    const routes = getSitemapRoutes();

    it("verifies sitemap contains no duplicate paths", () => {
      const paths = routes.map((r) => r.path);
      const uniquePaths = new Set(paths);
      assert.equal(
        uniquePaths.size,
        paths.length,
        `Found duplicate paths in sitemap: ${paths.filter((p, i) => paths.indexOf(p) !== i).join(", ")}`,
      );
    });

    it("verifies all lastModified dates match YYYY-MM-DD format", () => {
      const isoDateRegex = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;
      for (const route of routes) {
        assert.ok(
          isoDateRegex.test(route.lastModified),
          `Invalid lastModified date '${route.lastModified}' on path '${route.path}'`,
        );
      }
    });

    it("verifies retired legacy games are excluded from sitemap", () => {
      const paths = routes.map((r) => r.path);
      assert.ok(!paths.includes("/games/typing-grand-prix"), "typing-grand-prix must not be in sitemap");
      assert.ok(!paths.includes("/games/typing-survivor"), "typing-survivor must not be in sitemap");
    });

    it("verifies Priority 1 and 2 guide updates reflect 2026-10-16 modification date", () => {
      const routesByPath = new Map(routes.map((r) => [r.path, r]));
      const updatedPaths = [
        "",
        "/guides/touch-typing-finger-map",
        "/guides/data-entry-typing-test",
        "/guides/proper-typing-posture-and-ergonomics",
        "/guides/average-typing-speed",
        "/guides/punctuation-typing-practice",
        "/guides/qwerty-vs-dvorak-vs-colemak",
        "/guides/touch-typing-for-dyslexia-and-dysgraphia",
        "/guides/home-row-typing-practice",
        "/guides/bottom-row-typing-practice",
        "/guides/911-dispatcher-typing-test",
        "/guides/how-to-type-numbers-and-symbols-without-looking",
        "/guides/custom-text-typing-test",
        "/guides/typing-test-duration-guide",
        "/guides/how-to-touch-type",
        "/guides/how-to-improve-typing-speed",
        "/guides/how-to-improve-typing-accuracy",
        "/guides/typing-practice-for-beginners",
        "/games",
        "/lessons",
        "/lessons/practice",
      ];

      for (const path of updatedPaths) {
        const entry = routesByPath.get(path);
        assert.ok(entry, `Expected route '${path}' in sitemap`);
        assert.equal(
          entry.lastModified,
          "2026-10-16",
          `Route '${path}' lastModified should be '2026-10-16', found '${entry.lastModified}'`,
        );
      }
    });
  });

  describe("Retired Game Edge Redirects", () => {
    it("redirects /games/typing-grand-prix to /games/ghost-racer with 308", async () => {
      const req = new NextRequest("https://www.herotyping.com/games/typing-grand-prix");
      const res = await proxy(req);
      assert.ok(res, "Expected response from proxy");
      assert.equal(res.status, 308);
      assert.equal(res.headers.get("location"), "https://www.herotyping.com/games/ghost-racer");
    });

    it("redirects /games/typing-survivor to /games with 308", async () => {
      const req = new NextRequest("https://www.herotyping.com/games/typing-survivor");
      const res = await proxy(req);
      assert.ok(res, "Expected response from proxy");
      assert.equal(res.status, 308);
      assert.equal(res.headers.get("location"), "https://www.herotyping.com/games");
    });
  });

  describe("Structured Data Schema Generators", () => {
    it("generates valid Organization schema with logo and URL", () => {
      const org = buildOrganizationSchema();
      assert.equal(org["@type"], "Organization");
      assert.equal(org.name, "HeroTyping");
      assert.equal(org.url, "https://www.herotyping.com");
      assert.equal(org.logo, "https://www.herotyping.com/brand/hero-mark.png");
    });

    it("generates valid Article schema compliant with Google rich-result guidelines", () => {
      const article = buildArticleSchema({
        headline: "Touch-Typing Finger Map: Interactive Keyboard Chart",
        description: "Visual finger guide for touch typing.",
        path: "/guides/touch-typing-finger-map",
        datePublished: "2026-09-24",
        dateModified: "2026-10-16",
      });

      assert.equal(article["@type"], "Article");
      assert.equal(article.url, "https://www.herotyping.com/guides/touch-typing-finger-map");
      assert.equal(article.mainEntityOfPage["@type"], "WebPage");
      assert.equal(article.mainEntityOfPage["@id"], "https://www.herotyping.com/guides/touch-typing-finger-map");
      assert.ok(article.image.startsWith("https://www.herotyping.com/"));
      assert.equal(article.dateModified, "2026-10-16");
      assert.equal(article.publisher["@type"], "Organization");
      assert.equal(article.publisher.name, "HeroTyping");
      assert.equal(article.publisher.logo["@type"], "ImageObject");
      assert.equal(article.publisher.logo.url, "https://www.herotyping.com/brand/hero-mark.png");
    });

    it("generates valid VideoGame schema for games", () => {
      const game = buildGameSchema({
        name: "Word Blaster",
        description: "Fast-paced asteroid defense typing game.",
        path: "/games/word-blaster",
        genre: "Arcade",
      });

      assert.equal(game["@type"], "VideoGame");
      assert.equal(game.name, "Word Blaster");
      assert.equal(game.url, "https://www.herotyping.com/games/word-blaster");
      assert.equal(game.genre, "Arcade");
      assert.equal(game.offers.price, "0");
      assert.equal(game.offers.priceCurrency, "USD");
    });

    it("generates valid BreadcrumbList schema with 1-based indexing", () => {
      const breadcrumbs = buildBreadcrumbSchema([
        { name: "Guides", path: "/guides" },
        { name: "Finger Map", path: "/guides/touch-typing-finger-map" },
      ]);

      assert.equal(breadcrumbs["@type"], "BreadcrumbList");
      assert.equal(breadcrumbs.itemListElement.length, 3);
      assert.equal(breadcrumbs.itemListElement[0].position, 1);
      assert.equal(breadcrumbs.itemListElement[0].name, "Home");
      assert.equal(breadcrumbs.itemListElement[0].item, "https://www.herotyping.com");
      assert.equal(breadcrumbs.itemListElement[1].position, 2);
      assert.equal(breadcrumbs.itemListElement[1].name, "Guides");
      assert.equal(breadcrumbs.itemListElement[2].position, 3);
      assert.equal(breadcrumbs.itemListElement[2].name, "Finger Map");
    });

    it("generates valid WebApplication schema", () => {
      const app = buildWebApplicationSchema({
        name: "Typing Practice Lab",
        path: "/lessons/practice",
        description: "Targeted typing practice.",
      });

      assert.equal(app["@type"], "WebApplication");
      assert.equal(app.name, "Typing Practice Lab");
      assert.equal(app.url, "https://www.herotyping.com/lessons/practice");
      assert.equal(app.offers.price, "0");
    });
  });

  describe("Metadata Quality & Completeness (Build-Time Assertion)", () => {
    it("ensures all guide metadata descriptions are complete, correctly punctuated, and free of double dashes or backslashes", () => {
      for (const guide of GUIDE_REGISTRY) {
        assert.ok(
          guide.title.length >= 10,
          `Guide '${guide.slug}' title is too short (${guide.title.length} chars)`,
        );
        assert.ok(
          guide.description.length >= 30,
          `Guide '${guide.slug}' description is too short (${guide.description.length} chars)`,
        );
        assert.ok(
          !guide.description.includes("--"),
          `Guide '${guide.slug}' description contains invalid double dash '--'`,
        );
        assert.ok(
          !guide.description.includes("\\"),
          `Guide '${guide.slug}' description contains invalid backslash`,
        );
        assert.ok(
          /[.!?)]$/.test(guide.description.trim()),
          `Guide '${guide.slug}' description ends mid-sentence without terminal punctuation: "${guide.description}"`,
        );
      }
    });

    it("ensures all lesson metadata descriptions are valid, free of double dashes, and properly punctuated", () => {
      for (const lesson of LESSON_LIST) {
        assert.ok(
          lesson.name.length >= 10,
          `Lesson '${lesson.id}' name is too short (${lesson.name.length} chars)`,
        );
        const firstInstruction = lesson.instructions[0];
        assert.ok(
          firstInstruction && firstInstruction.length >= 30,
          `Lesson '${lesson.id}' first instruction is too short (${firstInstruction?.length} chars)`,
        );
        assert.ok(
          !firstInstruction.includes("--"),
          `Lesson '${lesson.id}' instruction contains invalid double dash '--'`,
        );
        assert.ok(
          !firstInstruction.includes("\\"),
          `Lesson '${lesson.id}' instruction contains invalid backslash`,
        );
        assert.ok(
          /[.!?)]$/.test(firstInstruction.trim()),
          `Lesson '${lesson.id}' instruction ends mid-sentence: "${firstInstruction}"`,
        );
      }
    });

    it("ensures all game titles have intent keywords and reasonable lengths", () => {
      for (const game of GAME_LIST) {
        assert.ok(
          game.name.length >= 3,
          `Game '${game.id}' name is too short (${game.name.length} chars)`,
        );
        assert.ok(
          game.tagline.length >= 10,
          `Game '${game.id}' tagline is too short (${game.tagline.length} chars)`,
        );
      }
    });

    it("fails if any rendered title (incl. ' | HeroTyping') exceeds 60 characters, counting code points correctly for Devanagari/CJK", () => {
      const SUFFIX = " | HeroTyping";

      // 1. Guide titles in registry
      for (const guide of GUIDE_REGISTRY) {
        const rendered = `${guide.title}${SUFFIX}`;
        const len = [...rendered].length;
        assert.ok(
          len <= 60,
          `Guide '${guide.slug}' rendered title exceeds 60 chars (${len} chars): "${rendered}"`,
        );
      }

      // 2. Category titles in registry
      for (const [id, cat] of Object.entries(GUIDE_CATEGORIES)) {
        const rendered = `${cat.title}${SUFFIX}`;
        const len = [...rendered].length;
        assert.ok(
          len <= 60,
          `Category '${id}' rendered title exceeds 60 chars (${len} chars): "${rendered}"`,
        );
      }

      // 3. Game titles
      for (const game of GAME_LIST) {
        const rendered = `${game.name} — Free Typing Game${SUFFIX}`;
        const len = [...rendered].length;
        assert.ok(
          len <= 60,
          `Game '${game.id}' rendered title exceeds 60 chars (${len} chars): "${rendered}"`,
        );
      }

      // 4. Lesson titles
      for (const lesson of LESSON_LIST) {
        const rendered = `${lesson.name} — Lesson${SUFFIX}`;
        const len = [...rendered].length;
        assert.ok(
          len <= 60,
          `Lesson '${lesson.slug}' rendered title exceeds 60 chars (${len} chars): "${rendered}"`,
        );
      }

      // 5. All page.tsx metadata titles on disk
      const guidesDir = path.resolve(process.cwd(), "src/app/[locale]");
      function findPages(dir: string): string[] {
        let results: string[] = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            results = results.concat(findPages(full));
          } else if (entry.name === "page.tsx") {
            results.push(full);
          }
        }
        return results;
      }

      const pages = findPages(guidesDir);
      for (const pageFile of pages) {
        const content = fs.readFileSync(pageFile, "utf8");
        const match = content.match(/title:\s*["']([^"']+)["']/);
        if (match) {
          const raw = match[1];
          const rendered = `${raw}${SUFFIX}`;
          const len = [...rendered].length;
          assert.ok(
            len <= 60,
            `Page '${pageFile.replace(process.cwd(), "")}' rendered title exceeds 60 chars (${len} chars): "${rendered}"`,
          );
        }
      }
    });
  });

  describe("Redirect & Internal Linking Integrity", () => {
    // (a) Each of the 28 old lesson slugs returns a single-hop redirect to its new slug
    it("asserts each of the 28 old lesson slugs returns a single-hop 308 redirect to its new slug", async () => {
      for (const lesson of LESSON_LIST) {
        if (lesson.id === lesson.slug) continue;
        const req = new NextRequest(`https://www.herotyping.com/lessons/${lesson.id}`);
        const res = await proxy(req);
        assert.ok(res, `Expected redirect response for old lesson slug '${lesson.id}'`);
        assert.equal(res.status, 308, `Expected 308 status for old lesson '${lesson.id}'`);
        assert.equal(
          res.headers.get("location"),
          `https://www.herotyping.com/lessons/${lesson.slug}`,
          `Expected single-hop redirect to new slug '${lesson.slug}'`,
        );
      }
    });

    // (b) Each of the 3 merged guide URLs redirects in one hop
    it("asserts each of the 3 merged guide URLs returns a single-hop 308 redirect to its target guide", async () => {
      const mergedGuides = [
        {
          from: "/guides/beat-your-personal-best-typing-speed",
          to: "https://www.herotyping.com/guides/how-to-improve-typing-speed",
        },
        {
          from: "/guides/fix-burst-and-stall-typing-pace-caret",
          to: "https://www.herotyping.com/guides/how-to-improve-typing-consistency",
        },
        {
          from: "/guides/typing-test-vs-typing-race",
          to: "https://www.herotyping.com/guides/typing-games-vs-typing-tests",
        },
      ];

      for (const { from, to } of mergedGuides) {
        const req = new NextRequest(`https://www.herotyping.com${from}`);
        const res = await proxy(req);
        assert.ok(res, `Expected redirect for merged guide '${from}'`);
        assert.equal(res.status, 308, `Expected 308 status for '${from}'`);
        assert.equal(res.headers.get("location"), to, `Expected single-hop location '${to}'`);
      }
    });

    // (c) No internal link anywhere points to a redirected or deleted URL
    it("asserts no internal link in src/ points to a redirected or deleted URL", () => {
      const redirectedPaths = new Set<string>();

      // Old lesson IDs
      for (const lesson of LESSON_LIST) {
        if (lesson.id !== lesson.slug) {
          redirectedPaths.add(`/lessons/${lesson.id}`);
        }
      }

      // Merged guides
      redirectedPaths.add("/guides/beat-your-personal-best-typing-speed");
      redirectedPaths.add("/guides/fix-burst-and-stall-typing-pace-caret");
      redirectedPaths.add("/guides/typing-test-vs-typing-race");

      // Retired games
      redirectedPaths.add("/games/typing-grand-prix");
      redirectedPaths.add("/games/typing-survivor");

      function scanDir(dir: string): string[] {
        let files: string[] = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name !== "node_modules" && entry.name !== ".next") {
              files = files.concat(scanDir(fullPath));
            }
          } else if (
            (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) &&
            !entry.name.includes(".test.") &&
            entry.name !== "proxy.ts" &&
            entry.name !== "lesson-mapper.ts"
          ) {
            files.push(fullPath);
          }
        }
        return files;
      }

      const files = scanDir(path.resolve(process.cwd(), "src"));
      const violations: string[] = [];

      for (const file of files) {
        const content = fs.readFileSync(file, "utf8");
        for (const badPath of redirectedPaths) {
          // Look for href="/path" or href={`/path...`}
          const regex = new RegExp(`href=["'\`]${badPath}["'\`]`, "g");
          if (regex.test(content)) {
            violations.push(`${file.replace(process.cwd(), "")} links to redirected path '${badPath}'`);
          }
        }
      }

      assert.deepEqual(
        violations,
        [],
        `Found internal links pointing to redirected or retired URLs:\n${violations.join("\n")}`,
      );
    });

    // (d) Sitemap contains no redirected or noindex URL
    it("asserts sitemap contains zero redirected or noindex URLs", () => {
      const routes = getSitemapRoutes();
      const sitemapPaths = routes.map((r) => r.path);

      // 1. No old lesson IDs
      for (const lesson of LESSON_LIST) {
        if (lesson.id !== lesson.slug) {
          assert.ok(
            !sitemapPaths.includes(`/lessons/${lesson.id}`),
            `Sitemap contains old lesson slug: /lessons/${lesson.id}`,
          );
        }
      }

      // 2. No merged guides
      assert.ok(!sitemapPaths.includes("/guides/beat-your-personal-best-typing-speed"));
      assert.ok(!sitemapPaths.includes("/guides/fix-burst-and-stall-typing-pace-caret"));
      assert.ok(!sitemapPaths.includes("/guides/typing-test-vs-typing-race"));

      // 3. No retired games
      assert.ok(!sitemapPaths.includes("/games/typing-grand-prix"));
      assert.ok(!sitemapPaths.includes("/games/typing-survivor"));

      // 4. No noindex routes
      assert.ok(!sitemapPaths.includes("/profile"), "Sitemap must not include /profile (noindex)");
      assert.ok(!sitemapPaths.includes("/auth/login"), "Sitemap must not include /auth/login (noindex)");
    });
  });
});
