export const LOCALES = ["en", "es", "pt-BR", "de"] as const;
export type RouteLocale = typeof LOCALES[number];

// Typing languages are deliberately separate from route locales. Hindi and
// Chinese are available in the homepage test, but do not have localized routes
// or UI dictionaries, so adding them to LOCALES would change URL routing.
export const TYPING_LOCALES = ["en", "es", "hi", "de", "pt-BR", "zh"] as const;
export type TypingLocale = typeof TYPING_LOCALES[number];

// Locale is also used by the homepage typing-language control. Keep the
// broader type there while route validation remains constrained to LOCALES.
export type Locale = TypingLocale;

export const AVAILABLE_LOCALES: readonly TypingLocale[] = TYPING_LOCALES;

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_NAMES: Record<TypingLocale, string> = {
  en: "English",
  es: "Español",
  hi: "हिन्दी",
  "pt-BR": "Português (Brasil)",
  de: "Deutsch",
  zh: "中文",
};

export function isValidLocale(locale: string): locale is RouteLocale {
  return LOCALES.includes(locale as RouteLocale);
}

export function isValidTypingLocale(locale: string): locale is TypingLocale {
  return TYPING_LOCALES.includes(locale as TypingLocale);
}
