export const uiDictionaries = {
  en: {
    nav: {
      lessons: "Lessons",
      games: "Games",
      practice: "Practice",
      vocabulary: "Vocabulary",
    },
    header: {
      searchGames: "Search games...",
    }
  },
  es: {
    nav: {
      lessons: "Lecciones",
      games: "Juegos",
      practice: "Práctica",
      vocabulary: "Vocabulario",
    },
    header: {
      searchGames: "Buscar juegos...",
    }
  },
  "pt-BR": {
    nav: {
      lessons: "Lições",
      games: "Jogos",
      practice: "Prática",
      vocabulary: "Vocabulário",
    },
    header: {
      searchGames: "Buscar jogos...",
    }
  },
  de: {
    nav: {
      lessons: "Lektionen",
      games: "Spiele",
      practice: "Übung",
      vocabulary: "Wortschatz",
    },
    header: {
      searchGames: "Spiele suchen...",
    }
  }
} as const;

export type Locale = keyof typeof uiDictionaries;

export function getDictionary(locale: string) {
  return uiDictionaries[locale as Locale] || uiDictionaries.en;
}
