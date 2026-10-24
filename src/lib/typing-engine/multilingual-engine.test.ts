import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { getBundledTypingContent, isAvailableTypingLanguage } from "@/lib/typing-engine/typing-content";
import { segmentTypingPassage } from "@/lib/typing-engine/use-typing-engine";
import { calculateNetCpm, calculateRawCpm, calculateCommittedWordNetWpmChars, calculateNetWpm } from "@/lib/typing-engine/stats";
import { getSitemapRoutes } from "@/app/sitemap";

describe("Multilingual Content Packs & Engine Integrity", () => {
  const REQUIRED_LANGUAGES = ["en", "es", "de", "pt-BR", "hi", "zh"] as const;

  it("registers all required typing languages", () => {
    for (const lang of REQUIRED_LANGUAGES) {
      assert.ok(isAvailableTypingLanguage(lang), `Language ${lang} must be available`);
      assert.ok(getBundledTypingContent(lang), `Language ${lang} must have bundled typing content`);
    }
  });

  it("validates Hindi content pack volume, uniqueness, and vocabulary structure", () => {
    const hiPack = getBundledTypingContent("hi")!;
    assert.ok(hiPack.commonWords.length >= 100, `Hindi common words should have >= 100 words, got ${hiPack.commonWords.length}`);
    const uniqueCommon = new Set(hiPack.commonWords);
    assert.equal(uniqueCommon.size, hiPack.commonWords.length, "Hindi common words must all be unique");

    // Vocabulary tiers
    assert.ok(hiPack.vocab.easy.length >= 25, "Hindi easy vocab >= 25");
    assert.ok(hiPack.vocab.medium.length >= 25, "Hindi medium vocab >= 25");
    assert.ok(hiPack.vocab.hard.length >= 25, "Hindi hard vocab >= 25");

    for (const tier of ["easy", "medium", "hard"] as const) {
      for (const item of hiPack.vocab[tier]) {
        assert.ok(item.word && item.word.trim().length > 0, "Vocab item word must be non-empty");
        assert.ok(item.pos && item.pos.trim().length > 0, `Vocab item ${item.word} must have part of speech`);
        assert.ok(item.definition && item.definition.trim().length > 0, `Vocab item ${item.word} must have definition`);
      }
    }

    // Quotes
    assert.ok(hiPack.quotes.length >= 15, `Hindi quotes must have >= 15 entries, got ${hiPack.quotes.length}`);
    for (const quote of hiPack.quotes) {
      assert.ok(quote.text && quote.text.length > 10, "Quote text must be substantial");
      assert.ok(quote.source && quote.source.length > 0, "Quote source must be present");
      assert.ok(["short", "medium", "long"].includes(quote.length), "Quote length tier must be valid");
    }
  });

  it("validates Chinese content pack volume, uniqueness, and vocabulary structure", () => {
    const zhPack = getBundledTypingContent("zh")!;
    assert.ok(zhPack.commonWords.length >= 100, `Chinese common words should have >= 100 words, got ${zhPack.commonWords.length}`);
    const uniqueCommon = new Set(zhPack.commonWords);
    assert.equal(uniqueCommon.size, zhPack.commonWords.length, "Chinese common words must all be unique");

    // Vocabulary tiers
    assert.ok(zhPack.vocab.easy.length >= 25, "Chinese easy vocab >= 25");
    assert.ok(zhPack.vocab.medium.length >= 25, "Chinese medium vocab >= 25");
    assert.ok(zhPack.vocab.hard.length >= 25, "Chinese hard vocab >= 25");

    for (const tier of ["easy", "medium", "hard"] as const) {
      for (const item of zhPack.vocab[tier]) {
        assert.ok(item.word && item.word.trim().length > 0, "Vocab item word must be non-empty");
        assert.ok(item.pos && item.pos.trim().length > 0, `Vocab item ${item.word} must have part of speech`);
        assert.ok(item.definition && item.definition.trim().length > 0, `Vocab item ${item.word} must have definition`);
      }
    }

    // Quotes
    assert.ok(zhPack.quotes.length >= 15, `Chinese quotes must have >= 15 entries, got ${zhPack.quotes.length}`);
    for (const quote of zhPack.quotes) {
      assert.ok(quote.text && quote.text.length >= 4, "Quote text must be substantial");
      assert.ok(quote.source && quote.source.length > 0, "Quote source must be present");
      assert.ok(["short", "medium", "long"].includes(quote.length), "Quote length tier must be valid");
    }
  });

  it("validates Spanish, German, and Portuguese expanded packs", () => {
    for (const lang of ["es", "de", "pt-BR"] as const) {
      const pack = getBundledTypingContent(lang)!;
      assert.ok(pack.commonWords.length >= 60, `${lang} common words >= 60`);
      assert.ok(pack.vocab.easy.length >= 15, `${lang} easy vocab >= 15`);
      assert.ok(pack.vocab.medium.length >= 15, `${lang} medium vocab >= 15`);
      assert.ok(pack.vocab.hard.length >= 15, `${lang} hard vocab >= 15`);
      assert.ok(pack.quotes.length >= 10, `${lang} quotes >= 10`);
    }
  });
});

describe("Chinese Segmentation & Scoring Mechanics", () => {
  it("segments continuous Chinese quotes into lexical units using Intl.Segmenter", () => {
    const quote = "学而时习之，不亦说乎？有朋自远方来，不亦乐乎？";
    const segments = segmentTypingPassage(quote, "zh");
    // Should NOT be a single element array
    assert.ok(segments.length > 5, `Expected segmented tokens, got ${segments.length}`);
    // Should contain meaningful Chinese segments
    assert.ok(segments.includes("学") || segments.includes("学而"));
    assert.ok(segments.includes("，"));
    assert.ok(segments.includes("？"));
  });

  it("splits whitespace-separated languages naturally by spaces", () => {
    const english = "The quick brown fox jumps over the lazy dog";
    const hindi = "अभ्यास ही सफलता की सबसे बड़ी कुंजी है";
    assert.deepEqual(segmentTypingPassage(english, "en"), ["The", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog"]);
    assert.deepEqual(segmentTypingPassage(hindi, "hi"), ["अभ्यास", "ही", "सफलता", "की", "सबसे", "बड़ी", "कुंजी", "है"]);
  });

  it("computes CPM (Characters Per Minute) accurately for Chinese typing", () => {
    // 300 correct characters in 60 seconds (60,000 ms) = 300 CPM
    const netCpm = calculateNetCpm(300, 60000);
    assert.equal(netCpm, 300);

    // 150 correct characters in 30 seconds (30,000 ms) = 300 CPM
    const sprintCpm = calculateNetCpm(150, 30000);
    assert.equal(sprintCpm, 300);

    // 5-character WPM equivalence: 300 CPM = 60 WPM
    const equivalentWpm = calculateNetWpm(300, 60000);
    assert.equal(equivalentWpm, 60);
    assert.equal(netCpm, equivalentWpm * 5);
  });

  it("computes Raw CPM accurately including errors", () => {
    // 280 correct + 20 incorrect in 60 seconds = 300 Raw CPM
    const rawCpm = calculateRawCpm(280, 20, 60000);
    assert.equal(rawCpm, 300);
  });

  it("calculates committed word net chars for Chinese without artificial space separators", () => {
    const wordState = {
      target: "中国",
      typed: "中国",
      chars: ["correct" as const, "correct" as const],
    };
    // For non-last word in English, space separator adds 1 character credit (2 chars + 1 space = 3)
    const englishChars = calculateCommittedWordNetWpmChars(wordState, false, false);
    assert.equal(englishChars, 3);

    // For Chinese, no space separator is credited or expected (exactly 2 chars)
    const chineseChars = calculateCommittedWordNetWpmChars(wordState, false, true);
    assert.equal(chineseChars, 2);
  });
});

describe("Dedicated Landing Pages & Sitemap Registration", () => {
  it("includes /hindi-typing-test and /chinese-typing-test in sitemap as independent canonical routes", () => {
    const routes = getSitemapRoutes();
    const hindiRoute = routes.find((r) => r.path === "/hindi-typing-test");
    const chineseRoute = routes.find((r) => r.path === "/chinese-typing-test");

    assert.ok(hindiRoute, "/hindi-typing-test must be registered in sitemap");
    assert.equal(hindiRoute.priority, 0.9);
    assert.equal(hindiRoute.changeFrequency, "daily");

    assert.ok(chineseRoute, "/chinese-typing-test must be registered in sitemap");
    assert.equal(chineseRoute.priority, 0.9);
    assert.equal(chineseRoute.changeFrequency, "daily");
  });

  it("verifies /hindi-typing-test structure, metadata, H1 and schemas", () => {
    const filePath = path.resolve(process.cwd(), "src/app/[locale]/hindi-typing-test/page.tsx");
    assert.ok(fs.existsSync(filePath), "Hindi landing page file must exist");
    const content = fs.readFileSync(filePath, "utf8");

    assert.ok(content.includes("Hindi Typing Test (InScript & Mangal)"), "Page title must be defined");
    assert.ok(content.includes('canonicalUrl = `${SITE_URL}/hindi-typing-test`'), "Canonical URL must match route");
    assert.ok(content.includes("<h1") && content.includes("हिंदी टाइपिंग टेस्ट ऑनलाइन"), "H1 must exist in Hindi");
    assert.ok(content.includes("buildWebApplicationSchema"), "WebApplication schema must be generated");
    assert.ok(content.includes('inLanguage: "hi"'), "Schema must set inLanguage to hi");
    assert.ok(content.includes("buildFaqSchema"), "FAQ schema must be generated");
    assert.ok(content.includes('locale="hi"'), "TypingTestClient must have locale=hi");
    assert.ok(content.includes("/guides/hindi-typing-test-and-practice"), "Must link to Hindi guide");
  });

  it("verifies /chinese-typing-test structure, metadata, H1 and schemas", () => {
    const filePath = path.resolve(process.cwd(), "src/app/[locale]/chinese-typing-test/page.tsx");
    assert.ok(fs.existsSync(filePath), "Chinese landing page file must exist");
    const content = fs.readFileSync(filePath, "utf8");

    assert.ok(content.includes("Chinese Typing Test (拼音打字测试)"), "Page title must be defined");
    assert.ok(content.includes('canonicalUrl = `${SITE_URL}/chinese-typing-test`'), "Canonical URL must match route");
    assert.ok(content.includes("<h1") && content.includes("中文在线打字测速与练习"), "H1 must exist in Chinese");
    assert.ok(content.includes("buildWebApplicationSchema"), "WebApplication schema must be generated");
    assert.ok(content.includes('inLanguage: "zh-Hans"'), "Schema must set inLanguage to zh-Hans");
    assert.ok(content.includes("buildFaqSchema"), "FAQ schema must be generated");
    assert.ok(content.includes('locale="zh"'), "TypingTestClient must have locale=zh");
    assert.ok(content.includes("/guides/chinese-typing-test-and-practice"), "Must link to Chinese guide");
  });
});
