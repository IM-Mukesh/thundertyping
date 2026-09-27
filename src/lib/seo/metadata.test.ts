import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { truncateAtWord } from "@/lib/seo/metadata";

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

