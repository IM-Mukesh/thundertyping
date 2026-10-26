import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import ts from "typescript";
import {
  TYPING_LOCALES,
  LOCALES,
  DEFAULT_LOCALE,
  LOCALE_NAMES,
  type Locale,
} from "@/lib/i18n/config";
import {
  TYPING_LANGUAGE_METADATA,
  TYPING_LANGUAGES_LIST,
  TYPING_LANGUAGE_STORAGE_KEY,
  filterTypingLanguages,
  getLanguageMetadata,
  normalizeSearchString,
} from "@/lib/i18n/typing-language-metadata";
import { getBundledTypingContent } from "@/lib/typing-engine/typing-content";
import { cn } from "@/lib/utils/cn";

import { jsx } from "react/jsx-runtime";

const require = createRequire(import.meta.url);
type Element = ReactElement<Record<string, unknown>>;
type Component = (props: Record<string, unknown>) => ReactNode;

function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  if (typeof node.type === "function") {
    try {
      const rendered = (node.type as Component)(node.props);
      return [node, ...elements(rendered)];
    } catch {
      return [node];
    }
  }
  return [node, ...elements(node.props.children as ReactNode)];
}

function findElements(node: ReactNode, predicate: (element: Element) => boolean): Element[] {
  return elements(node).filter(predicate);
}

function loadComponent(file: string, name: string, dependencies: Record<string, unknown> = {}) {
  const hooks: unknown[] = [];
  let cursor = 0;
  const react = {
    useId: () => "lang-test-id",
    useEffect: () => {},
    useMemo: (factory: () => unknown) => factory(),
    useCallback: (callback: unknown) => callback,
    useRef: (initial: unknown) => {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = { current: initial };
      return hooks[index];
    },
    useState: (initial: unknown) => {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = initial;
      return [hooks[index], (next: unknown) => { hooks[index] = next; }];
    },
  };

  const motionMock = {
    AnimatePresence: ({ children }: { children?: ReactNode }) => children,
    motion: {
      div: (props: Record<string, unknown>) => {
        const { initial, animate, exit, transition, ...rest } = props;
        void initial; void animate; void exit; void transition;
        return jsx("div", rest);
      },
    },
  };

  const lucideMock = {
    Globe: (props: Record<string, unknown>) => jsx("svg", { ...props, "data-icon": "globe" }),
    ChevronDown: (props: Record<string, unknown>) => jsx("svg", { ...props, "data-icon": "chevron-down" }),
    ChevronRight: (props: Record<string, unknown>) => jsx("svg", { ...props, "data-icon": "chevron-right" }),
    Search: (props: Record<string, unknown>) => jsx("svg", { ...props, "data-icon": "search" }),
    Check: (props: Record<string, unknown>) => jsx("svg", { ...props, "data-icon": "check" }),
    X: (props: Record<string, unknown>) => jsx("svg", { ...props, "data-icon": "x" }),
    Sparkles: (props: Record<string, unknown>) => jsx("svg", { ...props, "data-icon": "sparkles" }),
  };

  const modules: Record<string, unknown> = {
    react,
    "motion/react": motionMock,
    "lucide-react": lucideMock,
    "@/lib/utils/cn": { cn },
    "@/lib/i18n/config": {
      TYPING_LOCALES,
      AVAILABLE_LOCALES: TYPING_LOCALES,
      DEFAULT_LOCALE,
      LOCALE_NAMES,
    },
    "@/lib/i18n/typing-language-metadata": {
      TYPING_LANGUAGE_METADATA,
      TYPING_LANGUAGES_LIST,
      TYPING_LANGUAGE_STORAGE_KEY,
      filterTypingLanguages,
      getLanguageMetadata,
      normalizeSearchString,
    },
    ...dependencies,
  };

  const exports: Record<string, Component> = {};
  const compiled = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: file,
  }).outputText;

  new Function("require", "exports", compiled)((id: string) => (id in modules ? modules[id] : require(id)), exports);
  return (props: Record<string, unknown>) => {
    cursor = 0;
    return exports[name](props);
  };
}

describe("HeroTyping Language Selector & Command Center System", () => {
  describe("Language Metadata & Authenticity Invariants", () => {
    it("provides complete metadata for all 6 authoritative typing locales", () => {
      assert.equal(TYPING_LOCALES.length, 6);
      assert.deepEqual(
        TYPING_LANGUAGES_LIST.map((l) => l.id),
        ["en", "es", "hi", "de", "pt-BR", "zh"],
      );

      for (const locale of TYPING_LOCALES) {
        const meta = TYPING_LANGUAGE_METADATA[locale];
        assert.ok(meta, `Missing metadata for locale: ${locale}`);
        assert.ok(meta.name.length > 0, `Empty name for ${locale}`);
        assert.ok(meta.englishName.length > 0, `Empty englishName for ${locale}`);
        assert.ok(meta.nativeName.length > 0, `Empty nativeName for ${locale}`);
        assert.ok(meta.script.length > 0, `Empty script for ${locale}`);
        assert.ok(meta.characterBadge.length > 0, `Empty characterBadge for ${locale}`);
        assert.ok(meta.samplePhrase.length > 0, `Empty samplePhrase for ${locale}`);
        assert.ok(meta.searchAliases.length > 0, `Empty searchAliases for ${locale}`);
        assert.ok(meta.features.length >= 3, `Features should include words, quotes, vocab for ${locale}`);
      }
    });

    it("verifies sample phrases match genuine phrases from local typing content packs", () => {
      for (const locale of TYPING_LOCALES) {
        const meta = TYPING_LANGUAGE_METADATA[locale];
        const content = getBundledTypingContent(locale);
        assert.ok(content, `Local pack must exist for ${locale}`);

        if (locale === "en") {
          // English uses verified classic sentence
          assert.equal(meta.samplePhrase, "The quick brown fox jumps over the lazy dog.");
        } else {
          // Non-English locales derive sample phrase directly from quote #1 in the pack
          const firstQuote = content.quotes[0]?.text;
          assert.ok(firstQuote, `Quote 1 must exist for ${locale}`);
          assert.equal(meta.samplePhrase, firstQuote);
        }
      }
    });

    it("keeps typing locales separate from website route locales to prevent interface mutations", () => {
      // Interface route locales are strictly ["en", "es", "pt-BR", "de"]
      assert.equal(LOCALES.length, 4);
      assert.ok(!LOCALES.includes("hi" as unknown as typeof LOCALES[number]));
      assert.ok(!LOCALES.includes("zh" as unknown as typeof LOCALES[number]));

      // Typing locales include hi and zh for test practice without changing route or website UI
      assert.equal(TYPING_LOCALES.length, 6);
      assert.ok(TYPING_LOCALES.includes("hi"));
      assert.ok(TYPING_LOCALES.includes("zh"));
    });
  });

  describe("Instant Client-Side Search & Unicode Matching", () => {
    it("returns all 6 languages when search query is empty or whitespace", () => {
      assert.equal(filterTypingLanguages("").length, 6);
      assert.equal(filterTypingLanguages("   ").length, 6);
    });

    it("searches accurately by English display name", () => {
      const spanishResults = filterTypingLanguages("Spanish");
      assert.equal(spanishResults.length, 1);
      assert.equal(spanishResults[0].id, "es");

      const germanResults = filterTypingLanguages("German");
      assert.equal(germanResults.length, 1);
      assert.equal(germanResults[0].id, "de");

      const chineseResults = filterTypingLanguages("Chinese");
      assert.equal(chineseResults.length, 1);
      assert.equal(chineseResults[0].id, "zh");

      const hindiResults = filterTypingLanguages("Hindi");
      assert.equal(hindiResults.length, 1);
      assert.equal(hindiResults[0].id, "hi");

      const portugueseResults = filterTypingLanguages("Portuguese");
      assert.equal(portugueseResults.length, 1);
      assert.equal(portugueseResults[0].id, "pt-BR");
    });

    it("searches accurately by native name and native script", () => {
      const es = filterTypingLanguages("Español");
      assert.equal(es.length, 1);
      assert.equal(es[0].id, "es");

      const hi = filterTypingLanguages("हिन्दी");
      assert.equal(hi.length, 1);
      assert.equal(hi[0].id, "hi");

      const de = filterTypingLanguages("Deutsch");
      assert.equal(de.length, 1);
      assert.equal(de[0].id, "de");

      const pt = filterTypingLanguages("Português");
      assert.equal(pt.length, 1);
      assert.equal(pt[0].id, "pt-BR");

      const zh = filterTypingLanguages("中文");
      assert.equal(zh.length, 1);
      assert.equal(zh[0].id, "zh");
    });

    it("handles accent-insensitive / diacritic-normalized Latin search queries", () => {
      // User types "espanol" without tilde
      const es = filterTypingLanguages("espanol");
      assert.equal(es.length, 1);
      assert.equal(es[0].id, "es");

      // User types "portugues" without circumflex
      const pt = filterTypingLanguages("portugues");
      assert.equal(pt.length, 1);
      assert.equal(pt[0].id, "pt-BR");

      // User types "osterreich" or "deutschland"
      const de = filterTypingLanguages("deutschland");
      assert.equal(de.length, 1);
      assert.equal(de[0].id, "de");
    });

    it("handles non-Latin Unicode characters and script queries", () => {
      // Devanagari query
      const hiDevanagari = filterTypingLanguages("देवनागरी");
      assert.equal(hiDevanagari.length, 1);
      assert.equal(hiDevanagari[0].id, "hi");

      // Alternate Hindi spelling "हिंदी" (bindu vs half-na)
      const hiBindu = filterTypingLanguages("हिंदी");
      assert.equal(hiBindu.length, 1);
      assert.equal(hiBindu[0].id, "hi");

      // Chinese Hanzi character "汉字"
      const zhHanzi = filterTypingLanguages("汉字");
      assert.equal(zhHanzi.length, 1);
      assert.equal(zhHanzi[0].id, "zh");

      // Chinese pinyin query
      const zhPinyin = filterTypingLanguages("pinyin");
      assert.equal(zhPinyin.length, 1);
      assert.equal(zhPinyin[0].id, "zh");
    });

    it("searches by language code or country keywords", () => {
      assert.equal(filterTypingLanguages("pt-br")[0]?.id, "pt-BR");
      assert.equal(filterTypingLanguages("brazil")[0]?.id, "pt-BR");
      assert.equal(filterTypingLanguages("mexico")[0]?.id, "es");
      assert.equal(filterTypingLanguages("bharat")[0]?.id, "hi");
      assert.equal(filterTypingLanguages("china")[0]?.id, "zh");
    });

    it("returns empty array for non-matching queries without errors", () => {
      const results = filterTypingLanguages("klingon-nonexistent");
      assert.equal(results.length, 0);
    });

    it("normalizes search strings safely", () => {
      assert.equal(normalizeSearchString("  ESPAnol  "), "espanol");
      assert.equal(normalizeSearchString("Português (Brasil)"), "portugues (brasil)");
      // Non-Latin characters are preserved
      assert.equal(normalizeSearchString("हिन्दी"), "हिन्दी");
      assert.equal(normalizeSearchString("中文"), "中文");
    });
  });

  describe("Typing Engine Integration & Persistence Safety", () => {
    it("uses the established localStorage key for typing language persistence", () => {
      assert.equal(TYPING_LANGUAGE_STORAGE_KEY, "thundertyping-typing-language");
    });

    it("safely retrieves metadata fallback for unknown language codes", () => {
      const fallback = getLanguageMetadata("unsupported-lang" as Locale);
      assert.equal(fallback.id, DEFAULT_LOCALE);
      assert.equal(fallback.name, "English");
    });

    it("ensures every selectable language has a valid LOCALE_NAMES mapping", () => {
      for (const locale of TYPING_LOCALES) {
        assert.ok(LOCALE_NAMES[locale], `LOCALE_NAMES must contain ${locale}`);
      }
    });

    it("ensures selecting every supported language provides non-empty common words", () => {
      for (const locale of TYPING_LOCALES) {
        const content = getBundledTypingContent(locale);
        assert.ok(content, `Local pack missing for ${locale}`);
        assert.ok(content.commonWords.length >= 50, `Expected at least 50 words for ${locale}`);
      }
    });
  });

  describe("LanguageSelector Component & Trigger Markup", () => {
    it("renders trigger button with accessible attributes and current language badge", () => {
      const LanguageSelector = loadComponent(
        "./language-selector.tsx",
        "LanguageSelector",
        {
          "@/components/typing-test/language-selector-modal": {
            LanguageSelectorModal: () => null,
          },
        },
      );

      const tree = LanguageSelector({
        language: "en",
        onLanguageChange: () => {},
        disabled: false,
      });

      const button = findElements(tree, (el) => el.type === "button")[0];
      assert.ok(button, "Trigger button must exist");
      assert.equal(button.props["aria-haspopup"], "dialog");
      assert.equal(button.props["aria-expanded"], false);
      assert.ok(String(button.props["aria-label"]).includes("English"));

      // Verify content elements: name and badge
      const textNodes = elements(button)
        .flatMap((el) => [el.props.children])
        .filter((c) => typeof c === "string");
      assert.ok(textNodes.includes("English"), "Renders language name");
      assert.ok(textNodes.includes("Aa"), "Renders character badge");
    });

    it("disables trigger when disabled prop is true", () => {
      const LanguageSelector = loadComponent(
        "./language-selector.tsx",
        "LanguageSelector",
        {
          "@/components/typing-test/language-selector-modal": {
            LanguageSelectorModal: () => null,
          },
        },
      );

      const tree = LanguageSelector({
        language: "es",
        onLanguageChange: () => {},
        disabled: true,
      });

      const button = findElements(tree, (el) => el.type === "button")[0];
      assert.equal(button.props.disabled, true);
    });

    it("supports compact mode for mobile settings rows", () => {
      const LanguageSelector = loadComponent(
        "./language-selector.tsx",
        "LanguageSelector",
        {
          "@/components/typing-test/language-selector-modal": {
            LanguageSelectorModal: () => null,
          },
        },
      );

      const tree = LanguageSelector({
        language: "hi",
        onLanguageChange: () => {},
        compact: true,
      });

      const button = findElements(tree, (el) => el.type === "button")[0];
      assert.ok(button, "Compact trigger button must exist");
      const svgs = findElements(button, (el) => el.type === "svg");
      const chevronRight = svgs.find((s) => s.props["data-icon"] === "chevron-right");
      assert.ok(chevronRight, "Compact mode renders chevron-right for navigation drilldown");
    });
  });

  describe("LanguageSelectorModal Dialog Accessibility & Structure", () => {
    it("renders centered dialog with full accessibility semantics and all 6 language options", () => {
      const LanguageSelectorModal = loadComponent(
        "./language-selector-modal.tsx",
        "LanguageSelectorModal",
      );

      let selectedLocale: Locale | null = null;
      let closed = false;

      const tree = LanguageSelectorModal({
        open: true,
        selectedLanguage: "en",
        onSelectLanguage: (loc: Locale) => {
          selectedLocale = loc;
        },
        onClose: () => {
          closed = true;
        },
      });

      const dialog = findElements(tree, (el) => el.props.role === "dialog")[0];
      assert.ok(dialog, "Dialog container must exist");
      assert.equal(dialog.props["aria-modal"], "true");
      assert.ok(dialog.props["aria-labelledby"]);
      assert.ok(dialog.props["aria-describedby"]);

      // Verify search input
      const input = findElements(dialog, (el) => el.type === "input")[0];
      assert.ok(input, "Search input must exist");
      assert.equal(input.props.type, "text");
      assert.ok(String(input.props.placeholder).includes("Spanish"));

      // Verify 6 language cards with role="option"
      const optionButtons = findElements(dialog, (el) => el.props.role === "option");
      assert.equal(optionButtons.length, 6);

      // Verify selected state
      const englishOption = optionButtons[0];
      assert.equal(englishOption.props["aria-selected"], true);

      const spanishOption = optionButtons[1];
      assert.equal(spanishOption.props["aria-selected"], false);

      // Trigger selection on Spanish
      const clickHandler = spanishOption.props.onClick as () => void;
      assert.equal(typeof clickHandler, "function");
      clickHandler();
      assert.equal(selectedLocale, "es");
      assert.equal(closed, true);
    });

    it("uses a compact 3-column desktop grid with streamlined cards", () => {
      const LanguageSelectorModal = loadComponent(
        "./language-selector-modal.tsx",
        "LanguageSelectorModal",
      );

      const tree = LanguageSelectorModal({
        open: true,
        selectedLanguage: "en",
        onSelectLanguage: () => {},
        onClose: () => {},
      });

      const dialog = findElements(tree, (el) => el.props.role === "dialog")[0];
      assert.ok(dialog);
      const dialogClass = String(dialog.props.className);
      assert.ok(dialogClass.includes("lg:max-w-[820px]"), "Dialog has 820px max width on desktop");

      // Verify grid classes
      const listbox = findElements(dialog, (el) => el.props.role === "listbox")[0];
      assert.ok(listbox);
      const grid = findElements(listbox, (el) => String(el.props.className).includes("grid"))[0];
      assert.ok(grid, "Grid container exists");
      const gridClass = String(grid.props.className);
      assert.ok(gridClass.includes("lg:grid-cols-3"), "Grid specifies 3 columns on desktop");
      assert.ok(gridClass.includes("sm:grid-cols-2"), "Grid specifies 2 columns on tablet");
      assert.ok(gridClass.includes("grid-cols-1"), "Grid specifies 1 column on mobile");

      // Verify compact card styling
      const optionButtons = findElements(dialog, (el) => el.props.role === "option");
      const firstCardClass = String(optionButtons[0].props.className);
      assert.ok(firstCardClass.includes("min-h-[72px]"), "Cards have compact min-height");
    });

    it("renders nothing when open is false", () => {
      const LanguageSelectorModal = loadComponent(
        "./language-selector-modal.tsx",
        "LanguageSelectorModal",
      );

      const tree = LanguageSelectorModal({
        open: false,
        selectedLanguage: "en",
        onSelectLanguage: () => {},
        onClose: () => {},
      });

      const dialogs = findElements(tree, (el) => el.props.role === "dialog");
      assert.equal(dialogs.length, 0);
    });
  });
});
