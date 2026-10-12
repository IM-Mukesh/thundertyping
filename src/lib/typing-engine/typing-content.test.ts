import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AVAILABLE_LOCALES,
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_NAMES,
  TYPING_LOCALES,
  isValidLocale,
  isValidTypingLocale,
} from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getTypingConfig } from "@/lib/typing-engine/language-config";
import { generateWords } from "@/lib/typing-engine/word-generator";
import type { LocalizedContent } from "@/lib/typing-engine/engine-types";
import {
  getBundledTypingContent,
  isAvailableTypingLanguage,
  isLocalizedTypingContent,
} from "@/lib/typing-engine/typing-content";

const VALID_LOCALIZED_CONTENT: LocalizedContent = {
  commonWords: ["straße", "über", "größe"],
  vocab: {
    easy: [{ word: "hallo", pos: "interjection", definition: "greeting" }],
    medium: [{ word: "freund", pos: "noun", definition: "friend" }],
    hard: [{ word: "zuverlässig", pos: "adjective", definition: "reliable" }],
  },
  quotes: [{ id: "de-1", text: "Übung macht den Meister.", source: "Sprichwort", length: "short" }],
};

describe("multilingual locale and config behavior", () => {
  it("distinguishes valid locales from currently available typing languages", () => {
    assert.deepEqual(LOCALES, ["en", "es", "pt-BR", "de"]);
    assert.deepEqual(TYPING_LOCALES, ["en", "es", "hi", "de", "pt-BR", "zh"]);
    assert.deepEqual(AVAILABLE_LOCALES, TYPING_LOCALES);
    assert.equal(DEFAULT_LOCALE, "en");
    assert.equal(LOCALE_NAMES.zh, "中文");

    assert.equal(isValidLocale("de"), true);
    assert.equal(isValidLocale("pt-BR"), true);
    assert.equal(isValidLocale("fr"), false);
    assert.equal(isValidLocale(""), false);
    assert.equal(isValidLocale("hi"), false);
    assert.equal(isValidLocale("zh"), false);

    assert.equal(isAvailableTypingLanguage("de"), true);
    assert.equal(isAvailableTypingLanguage("es"), true);
    assert.equal(isAvailableTypingLanguage("hi"), true);
    assert.equal(isAvailableTypingLanguage("pt-BR"), true);
    assert.equal(isAvailableTypingLanguage("zh"), true);
    assert.equal(isAvailableTypingLanguage("fr"), false);
    assert.equal(isValidTypingLocale("hi"), true);
    assert.equal(isValidTypingLocale("zh"), true);
  });

  it("uses localized UI copy and falls back to English for unknown dictionary/config keys", () => {
    assert.equal(getDictionary("de").nav.lessons, "Lektionen");
    assert.notEqual(getDictionary("de").home.title, getDictionary("en").home.title);
    assert.strictEqual(getDictionary("not-a-locale"), getDictionary("en"));

    assert.equal(getTypingConfig("de").code, "de");
    assert.ok(getTypingConfig("de").alphabet.includes("ä"));
    assert.equal(getTypingConfig("hi").code, "hi");
    assert.ok(getTypingConfig("hi").alphabet.includes("क"));
    assert.equal(getTypingConfig("zh").code, "zh");
    assert.ok(getTypingConfig("zh").alphabet.includes("中"));
    assert.ok(getTypingConfig("zh").punctuation.includes("。"));
    assert.strictEqual(getTypingConfig("not-a-language"), getTypingConfig("en"));
  });
});

describe("localized typing content", () => {
  it("generates words from the supplied localized common-word pool", (context) => {
    let randomIndex = 0;
    context.mock.method(Math, "random", () => [0, 0.5, 0.99][randomIndex++ % 3]);

    const localizedWords = generateWords(9, {
      punctuation: false,
      numbers: false,
      languageCode: "de",
      customWordPool: VALID_LOCALIZED_CONTENT.commonWords,
    });

    assert.deepEqual(localizedWords, [
      "straße", "über", "größe",
      "straße", "über", "größe",
      "straße", "über", "größe",
    ]);
  });

  it("accepts a complete localized payload and rejects malformed content", () => {
    assert.equal(isLocalizedTypingContent(VALID_LOCALIZED_CONTENT), true);

    const malformed: unknown[] = [
      null,
      { ...VALID_LOCALIZED_CONTENT, commonWords: [] },
      {
        ...VALID_LOCALIZED_CONTENT,
        vocab: { ...VALID_LOCALIZED_CONTENT.vocab, medium: [] },
      },
      {
        ...VALID_LOCALIZED_CONTENT,
        vocab: {
          ...VALID_LOCALIZED_CONTENT.vocab,
          hard: [{ word: "zuverlässig", pos: "adjective", definition: 42 }],
        },
      },
      {
        ...VALID_LOCALIZED_CONTENT,
        quotes: [{ ...VALID_LOCALIZED_CONTENT.quotes[0], text: "   " }],
      },
      {
        ...VALID_LOCALIZED_CONTENT,
        quotes: [{ ...VALID_LOCALIZED_CONTENT.quotes[0], length: "invalid" }],
      },
    ];

    for (const value of malformed) assert.equal(isLocalizedTypingContent(value), false);
  });

  it("uses every bundled pack without a remote content request", () => {
    for (const language of AVAILABLE_LOCALES) {
      assert.ok(getBundledTypingContent(language), `Missing local pack for ${language}`);
    }
  });

  it("provides a complete offline pack for every selectable typing language", () => {
    for (const language of AVAILABLE_LOCALES) {
      const content = getBundledTypingContent(language);
      assert.ok(content, `Missing bundled content for ${language}`);
      assert.equal(isLocalizedTypingContent(content), true, `Invalid bundled content for ${language}`);
      for (const length of ["short", "medium", "long"] as const) {
        assert.ok(
          content.quotes.some((quote) => quote.length === length),
          `Missing ${length} quote for ${language}`,
        );
      }
      const words = generateWords(6, {
        punctuation: false,
        numbers: false,
        languageCode: language,
        customWordPool: content.commonWords,
      });
      assert.equal(words.length, 6);
      assert.ok(words.every((word) => content.commonWords.includes(word)));
    }
  });
});
