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
    },
    home: {
      title: "Free Online Typing Speed Test",
      subtitle: "Measure your words per minute and accuracy.",
      description: "Test and improve your typing speed with free 1-minute to 5-minute WPM tests, structured touch-typing lessons, and arcade games. No sign-up required.",
      guestNote: "No sign-up required.",
      wantToTypeFaster: "Want to type faster?",
    },
    footer: {
      about: "About",
      achievements: "Achievements",
      guides: "Guides",
      privacy: "Privacy",
      terms: "Terms"
    },
    test: {
      wpm: "wpm",
      accuracy: "accuracy",
      mistakes: "mistakes",
      restart: "restart",
      share: "Share"
    },
    lesson: {
      previous: "Previous Lesson",
      next: "Next Lesson",
      technique: "Technique Guidance",
      aggregateSpeed: "Aggregate speed",
      consistency: "Consistency"
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
    },
    home: {
      title: "Prueba de Velocidad de Escritura Gratis",
      subtitle: "Mide tus palabras por minuto y precisión.",
      description: "Pon a prueba y mejora tu velocidad de mecanografía con tests de PPM gratis de 1 a 5 minutos, lecciones guiadas y juegos arcade. Sin registro previo.",
      guestNote: "No es necesario registrarse.",
      wantToTypeFaster: "¿Quieres escribir más rápido?",
    },
    footer: {
      about: "Acerca de",
      achievements: "Logros",
      guides: "Guías",
      privacy: "Privacidad",
      terms: "Términos"
    },
    test: {
      wpm: "ppm",
      accuracy: "precisión",
      mistakes: "errores",
      restart: "reiniciar",
      share: "Compartir"
    },
    lesson: {
      previous: "Lección Anterior",
      next: "Siguiente Lección",
      technique: "Guía de Técnica",
      aggregateSpeed: "Velocidad media",
      consistency: "Consistencia"
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
    },
    home: {
      title: "Teste de Velocidade de Digitação Grátis",
      subtitle: "Meça suas palavras por minuto e precisão.",
      description: "Teste e melhore sua velocidade de digitação com testes gratuitos de 1 a 5 minutos, lições estruturadas e jogos arcade. Sem necessidade de cadastro.",
      guestNote: "Não é necessário cadastro.",
      wantToTypeFaster: "Quer digitar mais rápido?",
    },
    footer: {
      about: "Sobre",
      achievements: "Conquistas",
      guides: "Guias",
      privacy: "Privacidade",
      terms: "Termos"
    },
    test: {
      wpm: "ppm",
      accuracy: "precisão",
      mistakes: "erros",
      restart: "reiniciar",
      share: "Compartilhar"
    },
    lesson: {
      previous: "Lição Anterior",
      next: "Próxima Lição",
      technique: "Guia de Técnica",
      aggregateSpeed: "Velocidade média",
      consistency: "Consistência"
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
    },
    home: {
      title: "Kostenloser Online-Tipptest",
      subtitle: "Messen Sie Ihre Wörter pro Minute und Genauigkeit.",
      description: "Testen und verbessern Sie Ihre Tippgeschwindigkeit mit kostenlosen 1- bis 5-Minuten-WPM-Tests, strukturierten Lektionen und Arcade-Spielen. Ohne Anmeldung.",
      guestNote: "Keine Anmeldung erforderlich.",
      wantToTypeFaster: "Möchten Sie schneller tippen?",
    },
    footer: {
      about: "Über uns",
      achievements: "Erfolge",
      guides: "Leitfäden",
      privacy: "Datenschutz",
      terms: "Bedingungen"
    },
    test: {
      wpm: "wpm",
      accuracy: "Genauigkeit",
      mistakes: "Fehler",
      restart: "Neustart",
      share: "Teilen"
    },
    lesson: {
      previous: "Vorherige Lektion",
      next: "Nächste Lektion",
      technique: "Technik-Anleitung",
      aggregateSpeed: "Gesamtgeschwindigkeit",
      consistency: "Beständigkeit"
    }
  }
} as const;

export type Locale = keyof typeof uiDictionaries;

export function getDictionary(locale: string) {
  return uiDictionaries[locale as Locale] || uiDictionaries.en;
}
