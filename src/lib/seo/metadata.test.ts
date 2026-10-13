
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pageMetadata, truncateAtWord } from "@/lib/seo/metadata";

describe("pageMetadata", () => {
  

  for (const path of ["/", "/guides", "/guides/typing-accuracy"]) {
    it(`uses the canonical path for Open Graph at ${path}`, () => {
      const title = "Page-specific title";
      const description = "Page-specific description.";

      assert.deepEqual(pageMetadata({ title, description, path }), {
        title,
        description,
        alternates: { canonical: path },
        openGraph: { title, description, url: path, images: [{ url: "/opengraph-image" }] },
        twitter: { title, description, images: ["/opengraph-image"] },
      });
    });
  }

  it("keeps noindex rules while setting the page-specific Open Graph URL", () => {
    const title = "Profile";
    const description = "Your typing profile.";
    const robots = { index: false, follow: true };

    assert.deepEqual(pageMetadata({ title, description, path: "/profile", robots }), {
      title,
      description,
      alternates: { canonical: "/profile" },
      openGraph: { title, description, url: "/profile", images: [{ url: "/opengraph-image" }] },
      twitter: { title, description, images: ["/opengraph-image"] },
      robots,
    });
  });
});

describe("truncateAtWord", () => {
  it("returns the text unchanged when it's already short enough", () => {
    assert.equal(truncateAtWord("short text", 100), "short text");
  });

  it("cuts at the last full word, never mid-word", () => {
    const text = "how long a word takes to cast depends on its length";
    const result = truncateAtWord(text, 28);
    assert.ok(!result.endsWith("t"), `should not end mid-word: "${result}"`);
    assert.equal(result, "how long a word takes to");
  });

  it("never exceeds maxLength", () => {
    const text = "a".repeat(50);
    assert.ok(truncateAtWord(text, 20).length <= 20);
  });

  it("falls back to a hard cut only when there's no space to break on", () => {
    const text = "supercalifragilisticexpialidocious";
    assert.equal(truncateAtWord(text, 10), text.slice(0, 10));
  });
});

import { getSitemapRoutes } from "@/app/sitemap";
import { GUIDE_CATEGORIES, GUIDE_REGISTRY } from "@/lib/guides/guide-registry";

describe("sitemap integrity", () => {
  const routes = getSitemapRoutes();

  it("contains the main guides hub and all 6 category hubs", () => {
    const paths = new Set(routes.map((r) => r.path));
    assert.ok(paths.has("/guides"), "sitemap must include /guides");

    for (const catId of Object.keys(GUIDE_CATEGORIES)) {
      assert.ok(
        paths.has(`/guides/${catId}`),
        `sitemap must include category hub /guides/${catId}`
      );
    }
  });

  it("contains every guide entry in GUIDE_REGISTRY", () => {
    const paths = new Set(routes.map((r) => r.path));
    for (const guide of GUIDE_REGISTRY) {
      assert.ok(
        paths.has(`/guides/${guide.slug}`),
        `sitemap must include guide /guides/${guide.slug}`
      );
    }
  });

  it("has zero duplicate paths", () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const r of routes) {
      if (seen.has(r.path)) {
        duplicates.push(r.path);
      }
      seen.add(r.path);
    }
    assert.deepEqual(duplicates, [], "sitemap must have zero duplicate paths");
  });

  it("has clean path formatting (no http, no localhost, no trailing slashes, no query/hash)", () => {
    for (const r of routes) {
      assert.ok(!r.path.includes("http"), `path must not include http: ${r.path}`);
      assert.ok(!r.path.includes("localhost"), `path must not include localhost: ${r.path}`);
      assert.ok(!r.path.includes("?"), `path must not include query params: ${r.path}`);
      assert.ok(!r.path.includes("#"), `path must not include hash fragments: ${r.path}`);
      if (r.path !== "") {
        assert.ok(!r.path.endsWith("/"), `path must not have trailing slash: ${r.path}`);
        assert.ok(r.path.startsWith("/"), `path must start with slash: ${r.path}`);
      }
    }
  });

  it("uses valid ISO YYYY-MM-DD dates for lastModified", () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const r of routes) {
      assert.match(
        r.lastModified,
        dateRegex,
        `lastModified must be YYYY-MM-DD: ${r.path} has ${r.lastModified}`
      );
    }
  });
});

import { SITE_URL } from "@/lib/seo/constants";
import sitemap from "@/app/sitemap";

describe("Canonical URL Safety & Localized Hreflang", () => {
  it("never emits apex herotyping.com URLs anywhere in canonical generation", async () => {
    assert.equal(SITE_URL, "https://www.herotyping.com");
    assert.ok(!SITE_URL.startsWith("https://herotyping.com"));

    const urls = await sitemap();
    for (const urlObj of urls) {
      assert.ok(!urlObj.url.startsWith("https://herotyping.com"), "Sitemap must use www: " + urlObj.url);
      assert.ok(urlObj.url.startsWith("https://www.herotyping.com"), "Sitemap must start with www: " + urlObj.url);

      // Verify all hreflang targets
      if (urlObj.alternates && urlObj.alternates.languages) {
        for (const [lang, langUrl] of Object.entries(urlObj.alternates.languages)) {
          if (langUrl) {
            assert.ok(!langUrl.startsWith("https://herotyping.com"), `hreflang for ${lang} must use www: ${langUrl}`);
            assert.ok(langUrl.startsWith("https://www.herotyping.com"), `hreflang for ${lang} must start with www: ${langUrl}`);
          }
        }
      }
    }
  });

  it("strictly enforces canonical /pt-BR casing and rejects /pt-br in sitemap hreflang", async () => {
    const urls = await sitemap();
    for (const urlObj of urls) {
      if (urlObj.alternates && urlObj.alternates.languages) {
        assert.ok(!("pt-br" in urlObj.alternates.languages), "hreflang must use pt-BR, not lowercase pt-br");
        if (urlObj.alternates.languages["pt-BR"]) {
          const ptUrl = urlObj.alternates.languages["pt-BR"];
          assert.ok(ptUrl.includes("/pt-BR"), `Portuguese alternate URL must use /pt-BR casing: ${ptUrl}`);
          assert.ok(!ptUrl.includes("/pt-br/"), `Portuguese alternate URL must not use /pt-br/ casing: ${ptUrl}`);
        }
      }
    }
  });

  it("verifies localized routes have their own distinct <url> entries with full reciprocal alternates", async () => {
    const urls = await sitemap();
    const locMap = new Map(urls.map((u) => [u.url, u]));

    // Check homepage has all 4 localized entries
    const homeLocs = [
      "https://www.herotyping.com",
      "https://www.herotyping.com/es",
      "https://www.herotyping.com/pt-BR",
      "https://www.herotyping.com/de",
    ];

    for (const loc of homeLocs) {
      assert.ok(locMap.has(loc), `sitemap must include distinct <url> entry for ${loc}`);
      const entry = locMap.get(loc)!;
      assert.ok(entry.alternates?.languages, `entry ${loc} must have alternates.languages`);
      assert.equal(entry.alternates.languages.en, "https://www.herotyping.com");
      assert.equal(entry.alternates.languages.es, "https://www.herotyping.com/es");
      assert.equal(entry.alternates.languages["pt-BR"], "https://www.herotyping.com/pt-BR");
      assert.equal(entry.alternates.languages.de, "https://www.herotyping.com/de");
      assert.equal(entry.alternates.languages["x-default"], "https://www.herotyping.com");
    }
  });

  it("verifies exact sitemap inventory counts and per-locale distribution", async () => {
    const urls = await sitemap();
    assert.equal(urls.length, 121, "Sitemap should emit exactly 121 <url> entries");

    // Verify all URLs are unique
    const uniqueUrls = new Set(urls.map((u) => u.url));
    assert.equal(uniqueUrls.size, 121, "All 121 sitemap URLs must be unique");

    // Verify locale distribution
    const enUrls = urls.filter((u) => !u.url.includes("/es/") && !u.url.endsWith("/es") && !u.url.includes("/pt-BR/") && !u.url.endsWith("/pt-BR") && !u.url.includes("/de/") && !u.url.endsWith("/de"));
    const esUrls = urls.filter((u) => u.url.includes("/es/") || u.url.endsWith("/es"));
    const ptUrls = urls.filter((u) => u.url.includes("/pt-BR/") || u.url.endsWith("/pt-BR"));
    const deUrls = urls.filter((u) => u.url.includes("/de/") || u.url.endsWith("/de"));

    assert.equal(enUrls.length, 115, "English entries count must be 115 (2 localized + 113 canonical guides/site)");
    assert.equal(esUrls.length, 2, "Spanish entries count must be exactly 2 genuinely localized apps");
    assert.equal(ptUrls.length, 2, "Portuguese entries count must be exactly 2 genuinely localized apps");
    assert.equal(deUrls.length, 2, "German entries count must be exactly 2 genuinely localized apps");
  });

  it("verifies isLocalizedRoute contract distinguishes genuinely localized routes from English-only copy", async () => {
    const { isLocalizedRoute } = await import("@/app/sitemap");
    // Localized routes with complete translations
    assert.equal(isLocalizedRoute(""), true, "Home is localized");
    assert.equal(isLocalizedRoute("/games/type-before-death"), true, "type-before-death game is localized");

    // English-only routes (untranslated copy prevents duplicate-content penalties)
    assert.equal(isLocalizedRoute("/typing-test/1-minute"), false, "1-minute test copy is English-only");
    assert.equal(isLocalizedRoute("/typing-test/custom-text"), false, "custom-text copy is English-only");
    assert.equal(isLocalizedRoute("/practice/accuracy"), false, "accuracy drill copy is English-only");
    assert.equal(isLocalizedRoute("/practice/weak-keys"), false, "weak-keys drill copy is English-only");
    assert.equal(isLocalizedRoute("/games"), false, "games hub copy is English-only");
    assert.equal(isLocalizedRoute("/games/fruit-fury"), false, "fruit-fury is English-only");
    assert.equal(isLocalizedRoute("/lessons"), false, "lessons hub copy is English-only");
    assert.equal(isLocalizedRoute("/lessons/home-row-left"), false, "individual lessons are English-only");
    assert.equal(isLocalizedRoute("/vocabulary"), false, "vocabulary hub is English-only");
    assert.equal(isLocalizedRoute("/vocabulary/easy"), false, "individual vocab tiers are English-only");
    assert.equal(isLocalizedRoute("/achievements"), false, "achievements hub is English-only");
    assert.equal(isLocalizedRoute("/guides/how-to-improve-typing-speed"), false, "guides are English-only");
    assert.equal(isLocalizedRoute("/about"), false, "about is English-only");
    assert.equal(isLocalizedRoute("/privacy"), false, "privacy is English-only");
    assert.equal(isLocalizedRoute("/terms"), false, "terms is English-only");
  });

  it("omits foreign hreflang alternates on English-only guides to prevent misleading crawlers", async () => {
    const urls = await sitemap();
    const guideEntries = urls.filter((u) => u.url.includes("/guides/"));
    assert.ok(guideEntries.length >= 55, "sitemap should include all guide entries");

    for (const g of guideEntries) {
      // English-only guides should not advertise es, pt-BR, or de translations
      assert.equal(g.alternates, undefined, `English-only guide ${g.url} should not have foreign alternates`);
    }
  });
});

import { localizedPageMetadata } from "@/lib/seo/metadata";

describe("localizedPageMetadata", () => {
  it("generates prefix-less canonical for default English locale", () => {
    const metaEn = localizedPageMetadata({
      locale: "en",
      title: "Test",
      description: "Test desc",
      path: "/practice/accuracy",
    });
    assert.deepEqual(metaEn.alternates, { canonical: "/practice/accuracy" });
    assert.equal(metaEn.openGraph?.url, "/practice/accuracy");
  });

  it("generates locale-prefixed canonical for genuinely localized routes (e.g. /games/type-before-death)", () => {
    const metaEs = localizedPageMetadata({
      locale: "es",
      title: "Test",
      description: "Test desc",
      path: "/games/type-before-death",
    });
    assert.deepEqual(metaEs.alternates, { canonical: "/es/games/type-before-death" });
    assert.equal(metaEs.openGraph?.url, "/es/games/type-before-death");

    const metaPt = localizedPageMetadata({
      locale: "pt-BR",
      title: "Test",
      description: "Test desc",
      path: "/games/type-before-death",
    });
    assert.deepEqual(metaPt.alternates, { canonical: "/pt-BR/games/type-before-death" });
    assert.equal(metaPt.openGraph?.url, "/pt-BR/games/type-before-death");

    const metaDe = localizedPageMetadata({
      locale: "de",
      title: "Test",
      description: "Test desc",
      path: "/games/type-before-death",
    });
    assert.deepEqual(metaDe.alternates, { canonical: "/de/games/type-before-death" });
    assert.equal(metaDe.openGraph?.url, "/de/games/type-before-death");
  });

  it("enforces canonical English URL for non-localized routes even if passed a non-English locale", () => {
    for (const locale of ["es", "pt-BR", "de"]) {
      const meta = localizedPageMetadata({
        locale,
        title: "Test",
        description: "Test desc",
        path: "/practice/accuracy",
      });
      assert.deepEqual(meta.alternates, { canonical: "/practice/accuracy" });
      assert.equal(meta.openGraph?.url, "/practice/accuracy");
    }
  });
});

import robots from "@/app/robots";
import { normalizeSiteUrl, CANONICAL_ORIGIN } from "@/lib/seo/constants";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { trackEvent } from "@/lib/analytics";

describe("robots.txt configuration", () => {
  it("allows crawling of /profile and /auth/login so noindex headers can be seen", () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;
    assert.ok(rules, "robots must define rules");
    assert.equal(rules.userAgent, "*");
    assert.equal(rules.allow, "/");

    const disallow = Array.isArray(rules.disallow)
      ? rules.disallow
      : rules.disallow
      ? [rules.disallow]
      : [];

    // Confirms profile and auth/login are NOT blocked in robots.txt
    assert.ok(!disallow.includes("/profile"), "/profile must not be disallowed");
    assert.ok(!disallow.includes("/auth/login"), "/auth/login must not be disallowed");
    assert.ok(!disallow.includes("/en/profile"), "/en/profile must not be disallowed");
    assert.ok(!disallow.includes("/en/auth/login"), "/en/auth/login must not be disallowed");

    // Confirms dev/internal endpoints ARE disallowed
    assert.ok(disallow.includes("/debug"), "/debug should be disallowed");
    assert.ok(disallow.includes("/api/"), "/api/ should be disallowed");

    assert.equal(config.sitemap, "https://www.herotyping.com/sitemap.xml");
  });
});

describe("normalizeSiteUrl", () => {
  it("normalizes apex domain to canonical www origin", () => {
    assert.equal(normalizeSiteUrl("https://herotyping.com"), CANONICAL_ORIGIN);
    assert.equal(normalizeSiteUrl("http://herotyping.com"), CANONICAL_ORIGIN);
  });

  it("strips trailing slashes cleanly", () => {
    assert.equal(normalizeSiteUrl("https://www.herotyping.com/"), CANONICAL_ORIGIN);
    assert.equal(normalizeSiteUrl("https://www.herotyping.com///"), CANONICAL_ORIGIN);
  });

  it("handles empty or missing input by falling back to CANONICAL_ORIGIN", () => {
    assert.equal(normalizeSiteUrl(""), CANONICAL_ORIGIN);
    assert.equal(normalizeSiteUrl(undefined), CANONICAL_ORIGIN);
  });
});

describe("buildArticleSchema", () => {
  it("includes dateModified when specified", () => {
    const schema = buildArticleSchema({
      headline: "Test Headline",
      description: "Test Description",
      path: "/guides/test",
      datePublished: "2026-09-15",
      dateModified: "2026-10-12",
    });

    assert.equal(schema.datePublished, "2026-09-15");
    assert.equal(schema.dateModified, "2026-10-12");
  });

  it("falls back dateModified to datePublished when not provided", () => {
    const schema = buildArticleSchema({
      headline: "Test Headline",
      description: "Test Description",
      path: "/guides/test",
      datePublished: "2026-09-15",
    });

    assert.equal(schema.datePublished, "2026-09-15");
    assert.equal(schema.dateModified, "2026-09-15");
  });
});

describe("Sitemap Game lastModified freshness", () => {
  it("ensures game URLs do not use stale generic 2026-09-15 dates", () => {
    const routes = getSitemapRoutes();
    const gameRoutes = routes.filter((r) => r.path.startsWith("/games/"));
    assert.ok(gameRoutes.length >= 9, "must have at least 9 games in sitemap");

    for (const g of gameRoutes) {
      assert.notEqual(
        g.lastModified,
        "2026-09-15",
        `Game ${g.path} should have truthful commit-based lastModified date, not generic 2026-09-15`
      );
    }
  });
});

describe("Analytics Event Tracking", () => {
  it("safely accepts newly added funnel and retention events without throwing", () => {
    assert.doesNotThrow(() => {
      trackEvent("results_action_clicked", {
        action: "restart",
        wpm: 65,
        accuracy: 98,
      });
      trackEvent("auth_started", {
        method: "google",
        source: "login_form",
      });
      trackEvent("login_completed", {
        method: "google",
      });
      trackEvent("signup_started", {
        source: "login_form",
      });
      trackEvent("signup_completed", {
        method: "google",
      });
    });
  });
});

import { buildWebApplicationSchema, buildBreadcrumbSchema } from "@/lib/seo/json-ld";
import { getTypeBeforeDeathContent } from "@/lib/games/type-before-death-i18n";

describe("Localized JSON-LD Schemas", () => {
  it("emits localized canonical URL in buildWebApplicationSchema", () => {
    const enSchema = buildWebApplicationSchema({ path: "/practice/accuracy" });
    assert.equal(enSchema.url, "https://www.herotyping.com/practice/accuracy");

    const esSchema = buildWebApplicationSchema({ path: "/es/practice/accuracy" });
    assert.equal(esSchema.url, "https://www.herotyping.com/es/practice/accuracy");

    const ptSchema = buildWebApplicationSchema({ path: "/pt-BR/typing-test/1-minute" });
    assert.equal(ptSchema.url, "https://www.herotyping.com/pt-BR/typing-test/1-minute");
  });

  it("emits localized breadcrumb paths and schema URLs when locale is specified", () => {
    const esCrumbSchema = buildBreadcrumbSchema(
      [
        { name: "Juegos", path: "/games" },
        { name: "Type Before Death", path: "/games/type-before-death" },
      ],
      "es"
    );

    const items = esCrumbSchema.itemListElement;
    assert.equal(items.length, 3);
    assert.equal(items[0].item, "https://www.herotyping.com/es");
    assert.equal(items[1].item, "https://www.herotyping.com/es/games");
    assert.equal(items[2].item, "https://www.herotyping.com/es/games/type-before-death");
  });
});

describe("Type Before Death Multi-Language Content", () => {
  it("provides complete authentic translations across en, es, pt-BR, de", () => {
    const en = getTypeBeforeDeathContent("en");
    const es = getTypeBeforeDeathContent("es");
    const pt = getTypeBeforeDeathContent("pt-BR");
    const de = getTypeBeforeDeathContent("de");

    assert.equal(en.title, "Zombie Typing Game – Type Before Death");
    assert.equal(es.title, "Juego de Mecanografía Zombie – Type Before Death");
    assert.equal(pt.title, "Jogo de Digitação Zumbi – Type Before Death");
    assert.equal(de.title, "Zombie-Tippspiel – Type Before Death");

    // All locales have 3 FAQ items
    assert.equal(en.faq.length, 3);
    assert.equal(es.faq.length, 3);
    assert.equal(pt.faq.length, 3);
    assert.equal(de.faq.length, 3);

    // Verify non-empty localized text
    assert.ok(es.headings.howItWorks.length > 0);
    assert.ok(pt.headings.howItWorks.length > 0);
    assert.ok(de.headings.howItWorks.length > 0);
  });
});
