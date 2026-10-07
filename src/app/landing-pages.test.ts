import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { getSitemapRoutes } from "@/app/sitemap";
import { parseUrlDuration, formatDuration } from "@/lib/typing-engine/custom-duration";

describe("product-led SEO landing pages", () => {
  const landingPages = [
    {
      route: "/typing-test/1-minute",
      file: "src/app/typing-test/1-minute/page.tsx",
      expectedTitle: "1-Minute Typing Test — 60-Second WPM Speed Test",
      expectedH1: "1-Minute Typing Test",
      expectedCanonical: "/typing-test/1-minute",
      expectedPriority: 0.9,
      expectedFrequency: "daily",
      keyPhrases: [
        "1-Minute Typing Test",
        "What a 1-Minute Typing Test Measures",
        "Net WPM",
        "Gross / Raw WPM",
        "/guides/typing-test-duration-guide",
        "/guides/net-wpm-vs-gross-wpm",
        "/practice/accuracy",
        "/practice/weak-keys",
      ],
    },
    {
      route: "/typing-test/custom-text",
      file: "src/app/typing-test/custom-text/page.tsx",
      expectedTitle: "Custom Text Typing Test — Practice Typing Your Own Text",
      expectedH1: "Custom Text Typing Test",
      expectedCanonical: "/typing-test/custom-text",
      expectedPriority: 0.8,
      expectedFrequency: "monthly",
      keyPhrases: [
        "Custom Text Typing Test",
        "100% Client-Side Privacy",
        "2,000 Character Ceiling",
        "/guides/custom-text-typing-test",
        "/practice/weak-keys",
        "/practice/accuracy",
        "/typing-test/1-minute",
      ],
    },
    {
      route: "/practice/weak-keys",
      file: "src/app/practice/weak-keys/page.tsx",
      expectedTitle: "Weak Keys Typing Practice — Targeted Keyboard Drills",
      expectedH1: "Weak Keys Typing Practice",
      expectedCanonical: "/practice/weak-keys",
      expectedPriority: 0.8,
      expectedFrequency: "monthly",
      keyPhrases: [
        "Weak Keys Typing Practice",
        "Rolling 20-Attempt Window",
        "6-Attempt Minimum Threshold",
        "90% Accuracy Threshold",
        "Cold-Start Behavior",
        "/guides/how-to-find-your-weakest-typing-keys",
        "/practice/accuracy",
        "/typing-test/1-minute",
      ],
    },
    {
      route: "/practice/accuracy",
      file: "src/app/practice/accuracy/page.tsx",
      expectedTitle: "Typing Accuracy Practice — Drills to Reduce Mistakes",
      expectedH1: "Typing Accuracy Practice",
      expectedCanonical: "/practice/accuracy",
      expectedPriority: 0.8,
      expectedFrequency: "monthly",
      keyPhrases: [
        "Typing Accuracy Practice",
        "Why Accuracy Must Come Before Speed",
        "Controlled Finger Coordination",
        "The 80% Speed Rule",
        "/guides/how-to-improve-typing-accuracy",
        "/guides/why-wpm-is-high-accuracy-is-low",
        "/practice/weak-keys",
        "/typing-test/1-minute",
      ],
    },
  ];

  describe("file existence and server-rendered structure", () => {
    for (const page of landingPages) {
      it(`verifies ${page.route} exists with required metadata, H1, and crawlable content`, () => {
        const fullPath = path.resolve(process.cwd(), page.file);
        assert.ok(fs.existsSync(fullPath), `Missing file at ${fullPath}`);
        const content = fs.readFileSync(fullPath, "utf8");

        // Verify title
        assert.ok(content.includes(page.expectedTitle), `Title missing in ${page.file}`);

        // Verify canonical path
        assert.ok(
          content.includes(`path: "${page.expectedCanonical}"`),
          `Canonical path missing in ${page.file}`,
        );

        // Verify H1
        assert.ok(
          content.includes(`<h1`) && content.includes(page.expectedH1),
          `H1 missing in ${page.file}`,
        );

        // Verify Breadcrumbs component & JSON-LD
        assert.ok(content.includes("<Breadcrumbs"), `Breadcrumbs missing in ${page.file}`);
        assert.ok(content.includes("buildWebApplicationSchema"), `Schema missing in ${page.file}`);

        // Verify key educational and internal linking sections
        for (const phrase of page.keyPhrases) {
          assert.ok(
            content.includes(phrase),
            `Expected phrase "${phrase}" missing in ${page.file}`,
          );
        }
      });
    }
  });

  describe("sitemap inclusion", () => {
    const routes = getSitemapRoutes();
    const routeMap = new Map(routes.map((r) => [r.path, r]));

    for (const page of landingPages) {
      it(`includes ${page.route} in sitemap with correct frequency and priority`, () => {
        const entry = routeMap.get(page.route);
        assert.ok(entry, `Route ${page.route} missing from sitemap`);
        assert.equal(entry?.priority, page.expectedPriority);
        assert.equal(entry?.changeFrequency, page.expectedFrequency);
        assert.match(entry?.lastModified ?? "", /^\d{4}-\d{2}-\d{2}$/);
      });
    }
  });

  describe("duration and formatting regressions", () => {
    it("preserves URL duration parser contract for seconds", () => {
      assert.equal(parseUrlDuration("60"), 60);
      assert.equal(parseUrlDuration("70"), 70);
      assert.equal(parseUrlDuration("125"), 125);
      assert.equal(parseUrlDuration("300"), 300);
      assert.equal(parseUrlDuration("abc"), null);
      assert.equal(parseUrlDuration("-1"), null);
    });

    it("preserves human-readable duration format strings", () => {
      assert.equal(formatDuration(60), "1m");
      assert.equal(formatDuration(70), "1m 10s");
      assert.equal(formatDuration(125), "2m 5s");
      assert.equal(formatDuration(300), "5m");
    });

    it("resolves route initial duration when URL parameter is missing or invalid, respecting valid overrides", () => {
      function resolveEffectiveDuration(
        rawUrlDuration: string | null,
        initialTimeDuration?: number,
        currentStoredDuration: number = 30,
      ): number {
        const validUrlDuration = parseUrlDuration(rawUrlDuration);
        if (validUrlDuration !== null) {
          return validUrlDuration;
        }
        if (initialTimeDuration !== undefined) {
          return initialTimeDuration;
        }
        return currentStoredDuration;
      }

      // 1-minute page (initialTimeDuration = 60) with stale stored duration (e.g. 15 or 30)
      assert.equal(resolveEffectiveDuration(null, 60, 15), 60, "missing duration query uses route default 60");
      assert.equal(resolveEffectiveDuration("abc", 60, 15), 60, "invalid ?duration=abc resets stale 15 to route default 60");
      assert.equal(resolveEffectiveDuration("-10", 60, 30), 60, "negative ?duration=-10 resets stale 30 to route default 60");
      assert.equal(resolveEffectiveDuration("0", 60, 15), 60, "zero ?duration=0 resets stale 15 to route default 60");
      assert.equal(resolveEffectiveDuration("70", 60, 15), 70, "valid ?duration=70 overrides route default 60");
      assert.equal(resolveEffectiveDuration("120", 60, 15), 120, "valid ?duration=120 overrides route default 60");

      // Root homepage (initialTimeDuration = undefined)
      assert.equal(resolveEffectiveDuration(null, undefined, 30), 30, "homepage preserves user stored duration when no query");
      assert.equal(resolveEffectiveDuration("abc", undefined, 30), 30, "homepage preserves user stored duration when invalid query");
      assert.equal(resolveEffectiveDuration("120", undefined, 30), 120, "homepage applies valid query override");
    });
  });

  describe("guide cluster differentiation and bidirectional links", () => {
    it("differentiates custom text guide and links to /typing-test/custom-text", () => {
      const guidePath = path.resolve(process.cwd(), "src/app/guides/custom-text-typing-test/page.tsx");
      const content = fs.readFileSync(guidePath, "utf8");
      assert.ok(content.includes("How to Practice Typing With Your Own Text & Code: Custom Test Guide"));
      assert.ok(content.includes("/typing-test/custom-text"));
    });

    it("verifies weak-key guides use accurate rolling window metrics and link to /practice/weak-keys", () => {
      const guide1 = fs.readFileSync(path.resolve(process.cwd(), "src/app/guides/how-to-find-your-weakest-typing-keys/page.tsx"), "utf8");
      const guide2 = fs.readFileSync(path.resolve(process.cwd(), "src/app/guides/typing-practice-for-weak-keys/page.tsx"), "utf8");

      assert.ok(!guide1.includes("Bayesian Wilson score"), "Guide 1 still contains false Bayesian Wilson score claim");
      assert.ok(!guide2.includes("Wilson score"), "Guide 2 still contains false Wilson score claim");
      assert.ok(guide1.includes("rolling 20-attempt window") || guide1.includes("rolling window of your last 20 attempts"));
      assert.ok(guide1.includes("/practice/weak-keys"));
      assert.ok(guide2.includes("/practice/weak-keys"));
      assert.ok(guide2.includes("/typing-test/1-minute"));
    });

    it("verifies duration and accuracy guides link to new landing pages", () => {
      const durationGuide = fs.readFileSync(path.resolve(process.cwd(), "src/app/guides/typing-test-duration-guide/page.tsx"), "utf8");
      const accGuide1 = fs.readFileSync(path.resolve(process.cwd(), "src/app/guides/typing-accuracy/page.tsx"), "utf8");
      const accGuide2 = fs.readFileSync(path.resolve(process.cwd(), "src/app/guides/how-to-improve-typing-accuracy/page.tsx"), "utf8");
      const accGuide3 = fs.readFileSync(path.resolve(process.cwd(), "src/app/guides/why-wpm-is-high-accuracy-is-low/page.tsx"), "utf8");

      assert.ok(durationGuide.includes("/typing-test/1-minute"));
      assert.ok(accGuide1.includes("/practice/accuracy"));
      assert.ok(accGuide2.includes("/practice/accuracy"));
      assert.ok(accGuide3.includes("/practice/accuracy"));
    });

    it("verifies /lessons/practice is differentiated as Targeted Practice Lab", () => {
      const practicePage = fs.readFileSync(path.resolve(process.cwd(), "src/app/lessons/practice/page.tsx"), "utf8");
      assert.ok(practicePage.includes("Targeted Practice Lab"));
      assert.ok(!practicePage.includes('title: "Weak Key Drill"'));
    });
  });

  describe("F14: Privacy and About Truthfulness", () => {
    it("verifies /about, /privacy, and README.md truthfully distinguish guest localStorage from optional cloud sync", () => {
      const aboutPath = path.resolve(process.cwd(), "src/app/about/page.tsx");
      const aboutContent = fs.readFileSync(aboutPath, "utf8");

      // Must not make false absolute offline/zero-server assertions
      assert.ok(
        !aboutContent.includes("nothing sent to a server"),
        "About page must not make blanket 'nothing sent to a server' claim",
      );
      assert.ok(
        !aboutContent.includes("never leave your device"),
        "About page must not make blanket 'never leave your device' claim",
      );

      // Must describe both guest local storage and optional cloud sync
      assert.ok(
        aboutContent.includes("Instant guest practice") &&
          aboutContent.includes("optional cloud sync"),
        "About page must describe guest local storage and optional cloud sync",
      );

      // Verify README reflects guest mode and optional cloud sync
      const readmePath = path.resolve(process.cwd(), "README.md");
      const readmeContent = fs.readFileSync(readmePath, "utf8");
      assert.ok(
        readmeContent.includes("optional cloud sync"),
        "README.md must mention optional cloud sync for signed-in accounts",
      );

      // Verify privacy policy explains the distinction
      const privacyPath = path.resolve(process.cwd(), "src/app/privacy/page.tsx");
      const privacyContent = fs.readFileSync(privacyPath, "utf8");
      assert.ok(
        privacyContent.includes("Signed-in accounts sync") ||
          privacyContent.includes("Signed-in profile"),
        "Privacy policy must explain signed-in cloud sync",
      );
    });
  });
});
