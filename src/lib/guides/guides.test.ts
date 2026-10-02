import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  GUIDE_CATEGORIES,
  GUIDE_REGISTRY,
  getAllGuides,
  getCategoryMeta,
  getGuideBySlug,
  getGuidesByCategory,
  getRelatedGuides,
} from "@/lib/guides/guide-registry";
import type { GuideCategory } from "@/lib/guides/guide-types";

describe("Guide Content Architecture & Registry", () => {
  const categories: GuideCategory[] = [
    "typing-basics",
    "typing-practice",
    "improve-your-typing",
    "typing-tests-tools",
    "keyboard-skills",
    "typing-work-study",
  ];

  it("contains exactly the six defined content categories", () => {
    const definedCategories = Object.keys(GUIDE_CATEGORIES);
    assert.equal(definedCategories.length, 6);
    for (const cat of categories) {
      assert.ok(GUIDE_CATEGORIES[cat], `Missing category: ${cat}`);
      assert.equal(GUIDE_CATEGORIES[cat].path, `/guides/${cat}`);
      assert.ok(GUIDE_CATEGORIES[cat].name.length > 0);
      assert.ok(GUIDE_CATEGORIES[cat].description.length > 0);
      assert.ok(GUIDE_CATEGORIES[cat].productRoute.startsWith("/"));
    }
  });

  it("registers exactly 48 unique, valid guides", () => {
    const guides = getAllGuides();
    assert.equal(guides.length, 48);

    const slugSet = new Set<string>();
    for (const guide of guides) {
      assert.ok(!slugSet.has(guide.slug), `Duplicate guide slug: ${guide.slug}`);
      slugSet.add(guide.slug);

      assert.match(guide.slug, /^[a-z0-9-]+$/);
      assert.equal(guide.href, `/guides/${guide.slug}`);
      assert.ok(guide.title.length > 0);
      assert.ok(guide.description.length > 0);
      assert.ok(guide.primaryTopic.length > 0);
      assert.ok(guide.readingTimeMinutes >= 3);
      assert.ok(categories.includes(guide.category), `Invalid category for ${guide.slug}: ${guide.category}`);
    }
  });

  it("maps every guide to exactly one primary category, with healthy distribution across all six", () => {
    for (const cat of categories) {
      const catGuides = getGuidesByCategory(cat);
      assert.ok(catGuides.length >= 3, `Category ${cat} should have at least 3 guides, found ${catGuides.length}`);
      for (const guide of catGuides) {
        assert.equal(guide.category, cat);
      }
    }
  });

  it("all relatedGuide references point to valid, registered guide slugs", () => {
    for (const guide of GUIDE_REGISTRY) {
      assert.ok(Array.isArray(guide.relatedGuides));
      for (const relatedSlug of guide.relatedGuides) {
        const found = getGuideBySlug(relatedSlug);
        assert.ok(found, `Guide "${guide.slug}" references nonexistent related guide "${relatedSlug}"`);
      }
    }
  });

  it("getRelatedGuides helper resolves full GuideEntry objects", () => {
    const related = getRelatedGuides("how-to-touch-type");
    assert.ok(related.length > 0);
    assert.ok(related.some((g) => g.slug === "touch-typing-finger-map"));
  });

  it("getCategoryMeta retrieves correct category metadata", () => {
    const meta = getCategoryMeta("typing-basics");
    assert.equal(meta.id, "typing-basics");
    assert.equal(meta.name, "Typing Basics");
    assert.equal(meta.path, "/guides/typing-basics");
  });

  it("all images declared in guide registry exist on disk in the public directory", () => {
    const publicDir = path.resolve(process.cwd(), "public");

    for (const guide of GUIDE_REGISTRY) {
      if (guide.heroImage) {
        const filePath = path.join(publicDir, guide.heroImage.replace(/^\//, ""));
        assert.ok(
          fs.existsSync(filePath),
          `Guide "${guide.slug}" heroImage not found on disk: ${filePath}`
        );
      }

      if (guide.articleImages) {
        for (const imgPath of guide.articleImages) {
          const filePath = path.join(publicDir, imgPath.replace(/^\//, ""));
          assert.ok(
            fs.existsSync(filePath),
            `Guide "${guide.slug}" articleImage not found on disk: ${filePath}`
          );
        }
      }
    }
  });

  it("no orphan flat image files exist in public/guides root directory", () => {
    const guidesDir = path.resolve(process.cwd(), "public", "guides");
    const entries = fs.readdirSync(guidesDir, { withFileTypes: true });
    const directFiles = entries.filter((e) => e.isFile());

    assert.equal(
      directFiles.length,
      0,
      `Expected 0 direct flat files in public/guides/, found: ${directFiles.map((f) => f.name).join(", ")}`
    );
  });
});
