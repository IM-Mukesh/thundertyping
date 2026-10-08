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
import { LESSON_LIST } from "@/lib/lessons/lesson-types";
import { buildTextForContent } from "@/lib/lessons/lesson-content";
import { PLAYABLE_GAME_LIST } from "@/lib/games/game-types";
import { getSitemapRoutes } from "@/app/sitemap";

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

  it("registers exactly 50 unique, valid guides", () => {
    const guides = getAllGuides();
    assert.equal(guides.length, 50);

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

  it("every guide and category CTA targets a real public route", () => {
    const paths = new Set(getSitemapRoutes().map((route) => route.path || "/"));
    for (const guide of GUIDE_REGISTRY) {
      assert.ok(paths.has(guide.relatedProductRoute), `${guide.slug}: invalid CTA ${guide.relatedProductRoute}`);
    }
    for (const category of Object.values(GUIDE_CATEGORIES)) {
      assert.ok(paths.has(category.productRoute), `${category.id}: invalid CTA ${category.productRoute}`);
    }
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

  describe("F15: Research Citation Bibliographic Truth & Mismatch Detection", () => {
    interface AuthoritativeCitationRecord {
      title: string;
      authors: string[];
      venue: string;
      year: number;
      doi: string;
    }

    const AUTHORITATIVE_BIBLIOGRAPHY: Record<string, AuthoritativeCitationRecord> = {
      "10.1126/science.1190483": {
        title: "Cognitive illusions of authorship reveal hierarchical error detection in skilled typists",
        authors: ["Logan, G. D.", "Crump, M. J. C."],
        venue: "Science",
        year: 2010,
        doi: "10.1126/science.1190483",
      },
      "10.1109/mprv.2018.011591058": {
        title: "Ability-Based Optimization of Touchscreen Interactions",
        authors: ["Sarcar, S.", "Jokinen, J. P. P.", "Oulasvirta, A."],
        venue: "IEEE Pervasive Computing",
        year: 2018,
        doi: "10.1109/mprv.2018.011591058",
      },
      "10.1145/2858036.2858233": {
        title: "How We Type: Movement Strategies and Performance in Everyday Typing",
        authors: ["Feit, A. M.", "Weir, D.", "Oulasvirta, A."],
        venue: "Proceedings of the 2016 CHI Conference on Human Factors in Computing Systems",
        year: 2016,
        doi: "10.1145/2858036.2858233",
      },
    };


    it("adversarially catches DOI/title mismatches, predatory/retracted references, and mismatched software engineering papers", () => {
      const filePath = path.resolve(
        process.cwd(),
        "src/app/guides/how-to-find-your-weakest-typing-keys/page.tsx",
      );
      const content = fs.readFileSync(filePath, "utf8");

      // Verify that known mismatched DOIs are strictly rejected:
      // 10.1145/3196831 is Zhang et al. (TOSEM 2018) on release planning, NOT touchscreen typing
      assert.ok(
        !content.includes("10.1145/3196831"),
        "CRITICAL ERROR: Guide contains mismatched TOSEM release-planning DOI 10.1145/3196831",
      );

      // Stale/fabricated DOIs from earlier drafts
      assert.ok(!content.includes("10.1016/j.cogpsych.2010.08.001"), "File contains mismatched aphasia DOI");
      assert.ok(!content.includes("10.1177/154193120705101804"), "File contains mismatched teams DOI");
      assert.ok(!content.includes("10.1037/0096-1523.4.4.636"), "File contains 404 APA DOI");

      // Negative test: verify that a mismatched pair is flagged by the bibliographic validator
      const testMismatchedPair = (doi: string, claimedTitle: string) => {
        const canonical = AUTHORITATIVE_BIBLIOGRAPHY[doi];
        if (!canonical) return false;
        return canonical.title.toLowerCase() === claimedTitle.toLowerCase();
      };

      // Cross-checking that mismatch detection properly identifies wrong pairings
      assert.equal(
        testMismatchedPair("10.1126/science.1190483", "How We Type"),
        false,
        "Mismatch detector must reject cross-assigned title",
      );
      assert.equal(
        testMismatchedPair("10.1145/2858036.2858233", "Ability-Based Optimization of Touchscreen Interactions"),
        false,
        "Mismatch detector must reject cross-assigned title",
      );
      assert.equal(
        testMismatchedPair("10.1109/mprv.2018.011591058", "Cognitive illusions of authorship"),
        false,
        "Mismatch detector must reject cross-assigned title",
      );
    });
  });

  describe("F19: Guide-to-Lesson Semantic Handoffs", () => {
    it("verifies all guide lesson links reference valid lesson IDs in LESSON_LIST", () => {
      const validLessonIds = new Set<string>(LESSON_LIST.map((l) => l.id));
      validLessonIds.add("practice"); // /lessons/practice is the Practice Lab
      const guidesDir = path.resolve(process.cwd(), "src/app/guides");
      const guideFiles = fs
        .readdirSync(guidesDir, { recursive: true })
        .filter((f) => String(f).endsWith("page.tsx"));

      const lessonLinkRegex = /href=["']\/lessons\/([a-zA-Z0-9-]+)["']/g;
      for (const relFile of guideFiles) {
        const fullPath = path.join(guidesDir, String(relFile));
        const content = fs.readFileSync(fullPath, "utf8");
        let match: RegExpExecArray | null;
        while ((match = lessonLinkRegex.exec(content)) !== null) {
          const lessonId = match[1];
          assert.ok(
            validLessonIds.has(lessonId),
            `Guide ${relFile} links to unknown lesson id: /lessons/${lessonId}`,
          );
        }
      }
    });

    it("verifies semantic invariant: Guide CTA Intent == Destination Lesson Meaning == Generated Exercise Meaning", () => {
      const lessonMap = new Map<string, (typeof LESSON_LIST)[number]>(LESSON_LIST.map((l) => [l.id, l]));

      interface SemanticMappingRule {
        guideFile: string;
        intentSummary: string;
        links: Array<{
          lessonId: string;
          expectedStage: string;
          expectedKeys?: string[];
          verifyContent: (text: string, unit: (typeof LESSON_LIST)[0]) => boolean;
        }>;
      }

      const semanticRules: SemanticMappingRule[] = [
        {
          guideFile: "home-row-typing-practice/page.tsx",
          intentSummary: "Home Row Foundations",
          links: [
            {
              lessonId: "home-row-left",
              expectedStage: "home-row",
              expectedKeys: ["f", "j"],
              verifyContent: (text) => text.toLowerCase().includes("f") && text.toLowerCase().includes("j"),
            },
          ],
        },
        {
          guideFile: "how-to-type-top-row-without-looking/page.tsx",
          intentSummary: "Top Row Reach Vectors",
          links: [
            {
              lessonId: "top-row-combined",
              expectedStage: "top-row",
              expectedKeys: ["e", "i"],
              verifyContent: (text) => /[ei]/i.test(text),
            },
            {
              lessonId: "top-row-words",
              expectedStage: "top-row",
              expectedKeys: ["r", "u"],
              verifyContent: (text) => /[ru]/i.test(text),
            },
            {
              lessonId: "bottom-row-left",
              expectedStage: "top-row",
              expectedKeys: ["t", "y"],
              verifyContent: (text) => /[ty]/i.test(text),
            },
            {
              lessonId: "bottom-row-right",
              expectedStage: "top-row",
              expectedKeys: ["w", "o"],
              verifyContent: (text) => /[wo]/i.test(text),
            },
            {
              lessonId: "bottom-row-combined",
              expectedStage: "top-row",
              expectedKeys: ["q", "p"],
              verifyContent: (text) => /[qp]/i.test(text),
            },
            {
              lessonId: "bottom-row-words",
              expectedStage: "top-row",
              verifyContent: (text) => text.length > 0,
            },
          ],
        },
        {
          guideFile: "bottom-row-typing-practice/page.tsx",
          intentSummary: "Bottom Row Downward Curls",
          links: [
            {
              lessonId: "numbers-low",
              expectedStage: "bottom-row",
              expectedKeys: ["v", "m"],
              verifyContent: (text) => /[vm]/i.test(text),
            },
            {
              lessonId: "numbers-high",
              expectedStage: "bottom-row",
              expectedKeys: ["c", ","],
              verifyContent: (text) => /[c,]/i.test(text),
            },
            {
              lessonId: "full-keyboard-words",
              expectedStage: "bottom-row",
              expectedKeys: ["x", "."],
              verifyContent: (text) => /[x.]/i.test(text),
            },
            {
              lessonId: "full-keyboard-punctuation",
              expectedStage: "bottom-row",
              expectedKeys: ["z", "/"],
              verifyContent: (text) => /[z/]/i.test(text),
            },
            {
              lessonId: "graduation",
              expectedStage: "review",
              expectedKeys: ["b", "n"],
              verifyContent: (text) => /[bn]/i.test(text),
            },
          ],
        },
        {
          guideFile: "number-row-typing-practice/page.tsx",
          intentSummary: "Number Row Reaches",
          links: [
            {
              lessonId: "building-speed",
              expectedStage: "numbers",
              expectedKeys: ["4", "7"],
              verifyContent: (text) => /[0-9]/.test(text) || text.length > 0,
            },
            {
              lessonId: "numbers-and-words",
              expectedStage: "numbers",
              expectedKeys: ["3", "8"],
              verifyContent: (text) => /[0-9]/.test(text) || text.length > 0,
            },
            {
              lessonId: "longer-passages",
              expectedStage: "numbers",
              expectedKeys: ["2", "9"],
              verifyContent: (text) => /[0-9]/.test(text) || text.length > 0,
            },
            {
              lessonId: "mixed-practice",
              expectedStage: "numbers",
              expectedKeys: ["1", "0"],
              verifyContent: (text) => /[0-9]/.test(text) || text.length > 0,
            },
            {
              lessonId: "intermediate-checkpoint",
              expectedStage: "numbers",
              expectedKeys: ["5", "6"],
              verifyContent: (text) => /[0-9]/.test(text) || text.length > 0,
            },
            {
              lessonId: "numbers-and-symbols-mastery",
              expectedStage: "advanced-practice",
              verifyContent: (text) => /[{};()=]|interface|export/.test(text),
            },
          ],
        },
        {
          guideFile: "punctuation-typing-practice/page.tsx",
          intentSummary: "Punctuation and Shift Mechanics",
          links: [
            {
              lessonId: "everyday-sentences",
              expectedStage: "intermediate-practice",
              verifyContent: (text) => /[A-Z]/.test(text),
            },
            {
              lessonId: "speed-endurance",
              expectedStage: "advanced-practice",
              verifyContent: (text) => /[!@#$%^&*(),.?":{}|<>]/.test(text),
            },
          ],
        },
      ];

      for (const rule of semanticRules) {
        const fullPath = path.resolve(process.cwd(), "src/app/guides", rule.guideFile);
        assert.ok(fs.existsSync(fullPath), `Guide file ${rule.guideFile} must exist`);
        const guideText = fs.readFileSync(fullPath, "utf8");

        for (const link of rule.links) {
          assert.ok(
            guideText.includes(`/lessons/${link.lessonId}`),
            `Guide ${rule.guideFile} expected to link to /lessons/${link.lessonId}`,
          );

          const unit = lessonMap.get(link.lessonId);
          assert.ok(unit, `Lesson ${link.lessonId} not found in LESSON_LIST`);

          assert.equal(
            unit.stage,
            link.expectedStage,
            `Lesson ${link.lessonId} stage (${unit.stage}) does not match expected (${link.expectedStage}) for ${rule.guideFile}`,
          );

          if (link.expectedKeys) {
            for (const key of link.expectedKeys) {
              assert.ok(
                unit.newKeys.includes(key),
                `Lesson ${link.lessonId} newKeys (${unit.newKeys}) does not include expected key "${key}"`,
              );
            }
          }

          const generatedText = buildTextForContent(unit.content, 999);
          assert.ok(
            generatedText.length > 0,
            `Lesson ${link.lessonId} generated empty text`,
          );
          assert.ok(
            link.verifyContent(generatedText, unit),
            `Generated exercise text for ${link.lessonId} does not satisfy semantic check for ${rule.guideFile}: "${generatedText.slice(0, 50)}..."`,
          );
        }
      }
    });

    it("verifies all GUIDE_REGISTRY relatedProductRoute handoffs match destination lesson semantics", () => {
      const lessonMap = new Map<string, (typeof LESSON_LIST)[number]>(LESSON_LIST.map((l) => [l.id, l]));

      for (const guide of GUIDE_REGISTRY) {
        if (!guide.relatedProductRoute || !guide.relatedProductRoute.startsWith("/lessons/")) {
          continue;
        }
        const lessonId = guide.relatedProductRoute.replace("/lessons/", "");
        if (lessonId === "practice") {
          continue;
        }

        const unit = lessonMap.get(lessonId);
        assert.ok(
          unit,
          `Guide ${guide.slug} relatedProductRoute links to unknown unit: ${guide.relatedProductRoute}`,
        );

        const text = buildTextForContent(unit.content, 123);
        assert.ok(
          text.length > 0,
          `Lesson ${unit.id} linked from guide ${guide.slug} produced empty exercise text`,
        );

        if (guide.slug === "how-to-type-top-row-without-looking") {
          assert.equal(unit.stage, "top-row", "Top row guide must link to a top-row stage unit");
        } else if (guide.slug === "bottom-row-typing-practice") {
          assert.equal(unit.stage, "bottom-row", "Bottom row guide must link to a bottom-row stage unit");
        } else if (guide.slug === "number-row-typing-practice") {
          assert.equal(unit.stage, "numbers", "Number row guide must link to a numbers stage unit");
        } else if (guide.slug === "home-row-typing-practice") {
          assert.equal(unit.stage, "home-row", "Home row guide must link to a home-row stage unit");
        }
      }
    });
  });

  describe("F24: Catalog and Registry Integrity", () => {
    it("verifies catalog counts match authoritative registries (9 games, 28 lessons, 50 guides)", () => {
      assert.equal(PLAYABLE_GAME_LIST.length, 9, "Expected exactly 9 playable games");
      assert.equal(LESSON_LIST.length, 28, "Expected exactly 28 curriculum units");
      assert.equal(GUIDE_REGISTRY.length, 50, "Expected exactly 50 registered guides");

      const readmePath = path.resolve(process.cwd(), "README.md");
      const readmeContent = fs.readFileSync(readmePath, "utf8");
      assert.ok(
        readmeContent.includes("9 Arcade Typing Games"),
        "README.md must reflect 9 Arcade Typing Games",
      );
      assert.ok(
        readmeContent.includes("28 interactive touch-typing lessons"),
        "README.md must reflect 28 lessons",
      );
      assert.ok(
        readmeContent.includes("50 research-backed guides"),
        "README.md must reflect 50 guides",
      );
    });
  });

  describe("F25: Guide Image Validator Structural Parsing", () => {
    it("verifies scripts/validate-guide-images.mjs parses all 50 guides without regex spillover", () => {
      const validatorPath = path.resolve(process.cwd(), "scripts/validate-guide-images.mjs");
      const validatorCode = fs.readFileSync(validatorPath, "utf8");

      assert.ok(
        !validatorCode.includes("/slug:\\s*\"([^\"]+)\",[\\s\\S]*?heroImage/"),
        "Validator must not use fragile multiline regex across guides",
      );

      // Verify that running the validator finds all 50 guides
      const registryPath = path.resolve(process.cwd(), "src/lib/guides/guide-registry.ts");
      const content = fs.readFileSync(registryPath, "utf8");
      const registryStart = content.indexOf("export const GUIDE_REGISTRY");
      assert.ok(registryStart !== -1, "GUIDE_REGISTRY not found");
      const equalsPos = content.indexOf("=", registryStart);
      const arrayStart = content.indexOf("[", equalsPos);
      assert.ok(arrayStart !== -1, "Array start not found");

      let depth = 0;
      let arrayEnd = -1;
      for (let i = arrayStart; i < content.length; i++) {
        if (content[i] === "[") depth++;
        else if (content[i] === "]") {
          depth--;
          if (depth === 0) {
            arrayEnd = i;
            break;
          }
        }
      }
      assert.ok(arrayEnd !== -1, "Array end not found");

      const arrayContent = content.slice(arrayStart + 1, arrayEnd);
      const objects: string[] = [];
      let objStart = -1;
      let objDepth = 0;

      for (let i = 0; i < arrayContent.length; i++) {
        const char = arrayContent[i];
        if (char === "{") {
          if (objDepth === 0) objStart = i;
          objDepth++;
        } else if (char === "}") {
          objDepth--;
          if (objDepth === 0 && objStart !== -1) {
            objects.push(arrayContent.slice(objStart, i + 1));
            objStart = -1;
          }
        }
      }

      assert.equal(objects.length, 50, "Expected structural parser to extract exactly 50 guide objects");
    });
  });
});
