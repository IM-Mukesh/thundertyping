import { TYPING_LOCALES, type TypingLocale, type Locale } from "@/lib/i18n/config";

export const TYPING_LANGUAGE_STORAGE_KEY = "thundertyping-typing-language";

export interface TypingLanguageMetadata {
  readonly id: TypingLocale;
  readonly name: string;
  readonly englishName: string;
  readonly nativeName: string;
  readonly script: string;
  readonly scriptCategory: "Latin" | "Devanagari" | "Han";
  readonly characterBadge: string;
  readonly samplePhrase: string;
  readonly sampleSource?: string;
  readonly searchAliases: readonly string[];
  readonly features: readonly string[];
}

export const TYPING_LANGUAGE_METADATA: Record<TypingLocale, TypingLanguageMetadata> = {
  en: {
    id: "en",
    name: "English",
    englishName: "English",
    nativeName: "English",
    script: "Latin Script",
    scriptCategory: "Latin",
    characterBadge: "Aa",
    samplePhrase: "The quick brown fox jumps over the lazy dog.",
    searchAliases: [
      "english",
      "en",
      "us",
      "uk",
      "great britain",
      "united states",
      "inglés",
      "ingles",
      "anglais",
      "englisch",
      "latin",
    ],
    features: ["Words", "Quotes", "Vocabulary"],
  },
  es: {
    id: "es",
    name: "Español",
    englishName: "Spanish",
    nativeName: "Español",
    script: "Alfabeto Latino",
    scriptCategory: "Latin",
    characterBadge: "Ññ",
    samplePhrase: "La práctica hace al maestro.",
    sampleSource: "Dicho popular",
    searchAliases: [
      "spanish",
      "español",
      "espanol",
      "castellano",
      "spain",
      "españa",
      "espana",
      "mexico",
      "méxico",
      "latam",
      "es",
      "latin",
    ],
    features: ["Palabras", "Citas", "Vocabulario"],
  },
  hi: {
    id: "hi",
    name: "हिन्दी",
    englishName: "Hindi",
    nativeName: "हिन्दी",
    script: "देवनागरी (Devanagari)",
    scriptCategory: "Devanagari",
    characterBadge: "अ आ",
    samplePhrase: "जहाँ चाह, वहाँ राह।",
    sampleSource: "कहावत",
    searchAliases: [
      "hindi",
      "हिन्दी",
      "हिंदी",
      "hindustani",
      "devanagari",
      "देवनागरी",
      "inscript",
      "india",
      "bharat",
      "भारत",
      "hi",
    ],
    features: ["शब्द", "उद्धरण", "शब्दावली"],
  },
  de: {
    id: "de",
    name: "Deutsch",
    englishName: "German",
    nativeName: "Deutsch",
    script: "Lateinische Schrift",
    scriptCategory: "Latin",
    characterBadge: "Ää",
    samplePhrase: "Übung macht den Meister.",
    sampleSource: "Deutsches Sprichwort",
    searchAliases: [
      "german",
      "deutsch",
      "de",
      "germany",
      "deutschland",
      "österreich",
      "osterreich",
      "schweiz",
      "allemand",
      "latin",
    ],
    features: ["Wörter", "Zitate", "Wortschatz"],
  },
  "pt-BR": {
    id: "pt-BR",
    name: "Português (Brasil)",
    englishName: "Portuguese (Brazil)",
    nativeName: "Português (Brasil)",
    script: "Alfabeto Latino",
    scriptCategory: "Latin",
    characterBadge: "Ãã",
    samplePhrase: "A prática leva à perfeição.",
    sampleSource: "Ditado popular",
    searchAliases: [
      "portuguese",
      "português",
      "portugues",
      "brasil",
      "brazil",
      "pt",
      "pt-br",
      "pt_br",
      "portugal",
      "latin",
    ],
    features: ["Palavras", "Citações", "Vocabulário"],
  },
  zh: {
    id: "zh",
    name: "中文",
    englishName: "Chinese (Simplified)",
    nativeName: "中文 (简体)",
    script: "简体汉字 (Simplified Han)",
    scriptCategory: "Han",
    characterBadge: "汉字",
    samplePhrase: "千里之行，始于足下。",
    sampleSource: "《老子》",
    searchAliases: [
      "chinese",
      "中文",
      "汉语",
      "漢語",
      "普通话",
      "普通話",
      "mandarin",
      "simplified",
      "pinyin",
      "拼音",
      "china",
      "中国",
      "zh",
      "zhongwen",
      "han",
      "hanzi",
    ],
    features: ["常用词", "经典引言", "精选词汇"],
  },
};

export const TYPING_LANGUAGES_LIST: readonly TypingLanguageMetadata[] =
  TYPING_LOCALES.map((locale) => TYPING_LANGUAGE_METADATA[locale]);

/**
 * Normalizes a search query string by stripping diacritics and converting to lower case.
 * Does not mutate non-Latin scripts (Devanagari, Han characters remain intact).
 */
export function normalizeSearchString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * High-performance, client-side language search matching:
 * 1. Exact / raw substring matching across display name, native name, English name, script, and aliases.
 * 2. Accent-insensitive matching (e.g. "espanol" matches "Español", "portugues" matches "Português").
 * 3. Native Unicode matching for Hindi (हिन्दी / हिंदी) and Chinese (中文 / 汉字).
 */
export function filterTypingLanguages(
  query: string,
  list: readonly TypingLanguageMetadata[] = TYPING_LANGUAGES_LIST,
): TypingLanguageMetadata[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [...list];
  }

  const rawQuery = trimmed.toLowerCase();
  const normalizedQuery = normalizeSearchString(trimmed);

  return list.filter((item) => {
    // 1. Direct raw matching
    if (
      item.id.toLowerCase().includes(rawQuery) ||
      item.name.toLowerCase().includes(rawQuery) ||
      item.nativeName.toLowerCase().includes(rawQuery) ||
      item.englishName.toLowerCase().includes(rawQuery) ||
      item.script.toLowerCase().includes(rawQuery) ||
      item.characterBadge.toLowerCase().includes(rawQuery) ||
      item.samplePhrase.toLowerCase().includes(rawQuery) ||
      item.searchAliases.some((alias) => alias.toLowerCase().includes(rawQuery))
    ) {
      return true;
    }

    // 2. Normalized matching (handles Latin diacritics)
    if (
      normalizeSearchString(item.name).includes(normalizedQuery) ||
      normalizeSearchString(item.nativeName).includes(normalizedQuery) ||
      normalizeSearchString(item.englishName).includes(normalizedQuery) ||
      normalizeSearchString(item.script).includes(normalizedQuery) ||
      item.searchAliases.some((alias) => normalizeSearchString(alias).includes(normalizedQuery))
    ) {
      return true;
    }

    return false;
  });
}

export function getLanguageMetadata(locale: Locale): TypingLanguageMetadata {
  return TYPING_LANGUAGE_METADATA[locale] || TYPING_LANGUAGE_METADATA.en;
}
