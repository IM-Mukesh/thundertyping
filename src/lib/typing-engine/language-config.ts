/**
 * Configuration for language-specific typing engine rules.
 * Supports Unicode normalization, word generation, and keyboard mappings.
 */
export interface TypingLanguageConfig {
  code: string;
  name: string;
  
  /**
   * Allowed characters for typing in this language (e.g. including ñ for Spanish,
   * ü, ö, ä, ß for German, etc).
   */
  alphabet: string;
  
  /** Punctuation marks native to the language. */
  punctuation: string[];
  
  /** Words for random generation if offline or fallback. Database is primary. */
  defaultWordPool?: string[];
  
  /** How to normalize characters (e.g., stripping accents for certain modes if needed) */
  normalizeChar: (char: string) => string;
}

export const LANGUAGE_CONFIGS: Record<string, TypingLanguageConfig> = {
  en: {
    code: "en",
    name: "English",
    alphabet: "abcdefghijklmnopqrstuvwxyz",
    punctuation: [",", ".", "!", "?", ";", ":"],
    normalizeChar: (c) => c,
  },
  es: {
    code: "es",
    name: "Spanish",
    alphabet: "abcdefghijklmnopqrstuvwxyzñáéíóúü",
    punctuation: [",", ".", "!", "?", "¡", "¿", ";", ":"],
    normalizeChar: (c) => c,
  },
  "pt-BR": {
    code: "pt-BR",
    name: "Portuguese (Brazil)",
    alphabet: "abcdefghijklmnopqrstuvwxyzáéíóúâêôãõç",
    punctuation: [",", ".", "!", "?", ";", ":"],
    normalizeChar: (c) => c,
  },
  de: {
    code: "de",
    name: "German",
    alphabet: "abcdefghijklmnopqrstuvwxyzäöüß",
    punctuation: [",", ".", "!", "?", ";", ":"],
    normalizeChar: (c) => c,
  }
};

/**
 * Returns the typing configuration for a given language code.
 * Falls back to English if not found.
 */
export function getTypingConfig(languageCode: string): TypingLanguageConfig {
  return LANGUAGE_CONFIGS[languageCode] || LANGUAGE_CONFIGS["en"];
}
