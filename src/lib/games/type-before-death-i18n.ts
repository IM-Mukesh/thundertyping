/**
 * Comprehensive internationalization for Type Before Death (3D Zombie Typing Game).
 * Provides authentic, full-text localized SEO blocks, FAQs, and schema data
 * across English (en), Spanish (es), Brazilian Portuguese (pt-BR), and German (de).
 */

export interface TypeBeforeDeathFaqItem {
  question: string;
  answer: string;
}

export interface TypeBeforeDeathContent {
  title: string;
  socialTitle: string;
  description: string;
  schemaGenre: string;
  headings: {
    howItWorks: string;
    combat: string;
    enemies: string;
    modes: string;
    improveSpeed: string;
    faq: string;
    exploreMore: string;
  };
  paragraphs: {
    howItWorks: string;
    combat: string;
    enemies: string;
    modesStory: string;
    modesEndless: string;
    modesDaily: string;
    improveSpeed: string;
    exploreMore: string;
  };
  faq: TypeBeforeDeathFaqItem[];
}

export const TYPE_BEFORE_DEATH_I18N: Record<string, TypeBeforeDeathContent> = {
  en: {
    title: "Zombie Typing Game – Type Before Death",
    socialTitle: "Zombie Typing Game – Type Before Death | HeroTyping",
    description: "Play Type Before Death, a 3D zombie typing game where your typing speed and accuracy keep you alive. Type fast, build combos, defeat bosses, and survive the outbreak.",
    schemaGenre: "Action typing survival game",
    headings: {
      howItWorks: "How Type Before Death works",
      combat: "How typing controls combat",
      enemies: "Enemy types and boss battles",
      modes: "Game modes and daily challenge",
      improveSpeed: "How to improve your typing speed for survival",
      faq: "Frequently asked questions",
      exploreMore: "Ready for another typing game?",
    },
    paragraphs: {
      howItWorks: "Type Before Death is a 3D zombie typing game built around a simple survival promise: your keyboard is the weapon. Read the word above a threat, type its letters, and your defender fires inside an abandoned city. The interactive battle is client-side, while this guide keeps the rules and typing practice advice available to search engines and screen readers.",
      combat: "Start with a visible first letter to lock the most urgent matching enemy. Every correct character advances the weapon prefix. Completing a word creates an attack, with longer words delivering more damage. A clean run of words builds combo and energy; repeated mistakes break the streak, add heat and can cause a short weapon jam. Your WPM therefore changes how many threats you can answer before the barricade is reached, while accuracy decides how consistently you access the strongest damage.",
      enemies: "Walkers teach the opening rhythm. Runners accelerate, brutes absorb long-word pressure, spitters attack from range, bombers punish a late response, and stalkers reveal themselves from the mist. Swarms test reaction speed; mutants regenerate; elites enrage when damaged. Three escalating waves lead to a commander with three health phases and a faster charged strike. The campaign includes six brief missions, while Endless introduces boss events without a final wave.",
      modesStory: "Story: clear missions, choose between field upgrades and unlock the next safehouse route.",
      modesEndless: "Endless: survive rising waves and periodic commanders until your health and barricade can no longer hold.",
      modesDaily: "Daily: every player receives the same UTC seed, mission and normal difficulty for a fair daily score comparison. The page shows real personal data only; it does not invent a global rank.",
      improveSpeed: "Choose the safest correct target before chasing a longer word, keep your eyes on the next character, and let heat cool instead of forcing a panic burst. If your accuracy is unstable, use the free typing speed test for measured practice, then reinforce weak keys in HeroTyping lessons. The typing speed guide explains posture, rhythm and deliberate accuracy practice.",
      exploreMore: "Explore the HeroTyping arcade, or practice accuracy before taking on the next outbreak.",
    },
    faq: [
      {
        question: "What is Type Before Death?",
        answer: "Type Before Death is a free browser zombie typing survival game. Players type enemy words to fire, protect a barricade, build combo and defeat commanders.",
      },
      {
        question: "How does typing speed affect the game?",
        answer: "Higher WPM lets you complete more attack words before enemies reach the defense line. Speed improves pressure handling, while accuracy preserves combo and precision damage.",
      },
      {
        question: "Can I play Type Before Death without an account?",
        answer: "Yes. The core game and personal progress work for guests on the device. Signed-in players automatically sync scores and unlock cloud achievements to their HeroTyping account.",
      },
    ],
  },
  es: {
    title: "Juego de Mecanografía Zombie – Type Before Death",
    socialTitle: "Juego de Mecanografía Zombie – Type Before Death | HeroTyping",
    description: "Juega a Type Before Death, un juego 3D de mecanografía zombie donde tu velocidad de escritura y precisión te mantienen con vida. Escribe rápido, crea combos y sobrevive al brote.",
    schemaGenre: "Juego de acción y mecanografía de supervivencia",
    headings: {
      howItWorks: "Cómo funciona Type Before Death",
      combat: "Cómo la mecanografía controla el combate",
      enemies: "Tipos de enemigos y batallas contra jefes",
      modes: "Modos de juego y desafío diario",
      improveSpeed: "Cómo mejorar tu velocidad de escritura para sobrevivir",
      faq: "Preguntas frecuentes",
      exploreMore: "¿Listo para otro juego de mecanografía?",
    },
    paragraphs: {
      howItWorks: "Type Before Death es un juego de mecanografía zombie en 3D basado en una promesa de supervivencia: tu teclado es el arma. Lee la palabra sobre la amenaza, escribe sus letras y tu defensor disparará en una ciudad abandonada. La batalla interactiva se ejecuta en el navegador, ofreciendo práctica de velocidad divertida y exigente.",
      combat: "Comienza con la primera letra visible para apuntar al enemigo más urgente. Cada carácter correcto avanza el disparo. Completar una palabra genera un ataque, y las palabras más largas infligen más daño. Escribir sin errores acumula combo y energía; los fallos repetidos rompen la racha y pueden atascar el arma temporalmente. Tus palabras por minuto (PPM) determinan cuántos zombis puedes detener antes de que alcancen la barricada.",
      enemies: "Los caminantes marcan el ritmo inicial. Los corredores aceleran, los brutos absorben palabras largas, los escupidores atacan a distancia y los bombarderos castigan las respuestas tardías. Tres oleadas intensas culminan en un comandante con tres fases de vida y ataques cargados. La campaña ofrece misiones de rescate, mientras que el modo Infinito desafía tu resistencia continua.",
      modesStory: "Historia: completa misiones, elige mejoras de campo y desbloquea rutas hacia refugios seguros.",
      modesEndless: "Infinito: sobrevive a oleadas crecientes y jefes periódicos hasta que la barricada no pueda resistir más.",
      modesDaily: "Diario: todos los jugadores comparten la misma semilla diaria UTC para una competencia justa y transparente.",
      improveSpeed: "Elige el objetivo más seguro antes de buscar palabras complejas, mantén la vista en el siguiente carácter y no te apresures si te equivocas. Si tu precisión decae, utiliza nuestra prueba de velocidad de escritura gratuita o practica teclas difíciles en las lecciones.",
      exploreMore: "Explora la sala de juegos de HeroTyping o perfecciona tu precisión antes de la siguiente oleada.",
    },
    faq: [
      {
        question: "¿Qué es Type Before Death?",
        answer: "Type Before Death es un juego gratuito para navegador de mecanografía y supervivencia contra zombis. Escribe palabras para disparar, defender tu barricada y vencer a los jefes.",
      },
      {
        question: "¿Cómo influye la velocidad de escritura en el juego?",
        answer: "Una mayor velocidad en PPM te permite abatir más enemigos antes de que lleguen a tu defensa. La precisión asegura daño crítico constante y evita el sobrecalentamiento del arma.",
      },
      {
        question: "¿Puedo jugar a Type Before Death sin una cuenta?",
        answer: "Sí. El juego completo y el progreso local funcionan para invitados en el dispositivo. Al iniciar sesión, sincronizas automáticamente tus puntuaciones y logros en la nube.",
      },
    ],
  },
  "pt-BR": {
    title: "Jogo de Digitação Zumbi – Type Before Death",
    socialTitle: "Jogo de Digitação Zumbi – Type Before Death | HeroTyping",
    description: "Jogue Type Before Death, um jogo 3D de digitação e sobrevivência zumbi onde sua velocidade e precisão mantêm você vivo. Digite rápido, faça combos e derrote chefes.",
    schemaGenre: "Jogo de ação e digitação de sobrevivência",
    headings: {
      howItWorks: "Como funciona o Type Before Death",
      combat: "Como a digitação controla o combate",
      enemies: "Tipos de inimigos e batalhas contra chefes",
      modes: "Modos de jogo e desafio diário",
      improveSpeed: "Como aumentar sua velocidade de digitação para sobreviver",
      faq: "Perguntas frequentes",
      exploreMore: "Pronto para outro jogo de digitação?",
    },
    paragraphs: {
      howItWorks: "Type Before Death é um jogo de digitação 3D com temática zumbi construído sob uma premissa clara: seu teclado é sua arma. Leia a palavra sobre o inimigo, digite cada letra e seu personagem disparará contra os invasores na cidade deserta. O jogo une prática deliberada de digitação com ação ágil.",
      combat: "Digite a primeira letra para travar a mira na ameaça mais próxima. Cada caractere correto avança o disparo da arma. Palavras completas disparam ataques letais, com palavras longas causando dano massivo. Sequências perfeitas geram combos de energia; erros consecutivos quebram o ritmo e podem travar a arma por instantes.",
      enemies: "Zumbis comuns ensinam o ritmo inicial. Corredores aceleram o combate, brutos exigem palavras extensas e cuspidores atacam à distância. Três ondas crescentes levam a um confronto com o comandante mutante. O modo História guia você por rotas de fuga, enquanto o modo Infinito testa seus limites absolutos.",
      modesStory: "História: conclua missões táticas, selecione melhorias e avance entre zonas seguras.",
      modesEndless: "Infinito: resista a ondas contínuas de zumbis até que sua barricada e energia se esgotem.",
      modesDaily: "Diário: semente diária idêntica para todos os jogadores competirem de forma justa.",
      improveSpeed: "Mantenha os olhos focados no próximo caractere, priorize precisão sobre velocidade bruta e controle a respiração. Se sua precisão oscilar, pratique no teste de digitação gratuito e treine teclas fracas em nossas lições.",
      exploreMore: "Explore o fliperama HeroTyping ou refine sua precisão antes da próxima invasão zumbi.",
    },
    faq: [
      {
        question: "O que é o Type Before Death?",
        answer: "Type Before Death é um jogo online gratuito de digitação e sobrevivência contra zumbis. Digite palavras para atirar, proteger sua barricada e derrotar comandantes.",
      },
      {
        question: "Como a velocidade de digitação afeta a jogabilidade?",
        answer: "Uma taxa maior de PPM permite eliminar inimigos antes que alcancem a linha de defesa. A precisão preserva bônus de combo e garante dano máximo contínuo.",
      },
      {
        question: "Posso jogar Type Before Death sem cadastro?",
        answer: "Sim. O jogo e o progresso local funcionam para convidados diretamente no navegador. Ao fazer login, suas pontuações e conquistas são salvas na nuvem.",
      },
    ],
  },
  de: {
    title: "Zombie-Tippspiel – Type Before Death",
    socialTitle: "Zombie-Tippspiel – Type Before Death | HeroTyping",
    description: "Spielen Sie Type Before Death, ein 3D-Zombie-Tippspiel, bei dem Ihre Tippgeschwindigkeit und Genauigkeit Sie am Leben halten. Tippen Sie schnell und überleben Sie den Ausbruch.",
    schemaGenre: "Action-Tipp-Überlebensspiel",
    headings: {
      howItWorks: "So funktioniert Type Before Death",
      combat: "Wie das Tippen den Kampf steuert",
      enemies: "Gegnertypen und Bosskämpfe",
      modes: "Spielmodi und tägliche Herausforderung",
      improveSpeed: "So steigern Sie Ihre Tippgeschwindigkeit fürs Überleben",
      faq: "Häufig gestellte Fragen",
      exploreMore: "Bereit für ein weiteres Tippspiel?",
    },
    paragraphs: {
      howItWorks: "Type Before Death ist ein 3D-Zombie-Tippspiel, bei dem Ihre Tastatur zur Waffe wird. Lesen Sie das Wort über der Bedrohung, tippen Sie die Buchstaben und Ihr Verteidiger feuert in einer verlassenen Stadt. Das Spiel kombiniert intensives Überlebenstraining mit effektiver Tastaturpraxis.",
      combat: "Tippen Sie den ersten Buchstaben, um das dringendste Ziel anzuvisieren. Jeder richtige Anschlag treibt die Waffe voran. Vollständige Wörter lösen Schüsse aus, wobei längere Wörter mehr Schaden anrichten. Fehlerfreie Serien bauen Combos und Energie auf; Tippfehler unterbrechen die Serie und können zu Ladehemmungen führen.",
      enemies: "Normale Zombies lehren den Anfangsrhythmus. Schnelle Läufer beschleunigen das Geschehen, Kolosse erfordern lange Wörter und Spucker greifen aus der Ferne an. Drei eskalierende Wellen führen zum Kampf gegen den Zombie-Kommandanten.",
      modesStory: "Story: Missionen abschließen, Feld-Upgrades wählen und sichere Routen freischalten.",
      modesEndless: "Endlos: Überleben Sie endlose Wellen, bis Ihre Barrikade bricht.",
      modesDaily: "Täglich: Ein täglicher Seed für faire Punktevergleiche unter allen Spielern.",
      improveSpeed: "Konzentrieren Sie sich auf das nächste Zeichen, bleiben Sie ruhig und forcieren Sie keine Hektik. Nutzen Sie den kostenlosen Online-Tipptest oder trainieren Sie schwache Tasten in unseren Lektionen.",
      exploreMore: "Entdecken Sie die HeroTyping-Arcade oder trainieren Sie Ihre Genauigkeit vor dem nächsten Ausbruch.",
    },
    faq: [
      {
        question: "Was ist Type Before Death?",
        answer: "Type Before Death ist ein kostenloses Browser-Zombie-Tippspiel. Tippen Sie Wörter ab, um zu schießen, Ihre Barrikade zu verteidigen und Bosse zu besiegen.",
      },
      {
        question: "Wie beeinflusst die Tippgeschwindigkeit das Spiel?",
        answer: "Eine höhere WPM-Zahl ermöglicht es Ihnen, mehr Feinde abzuwehren, bevor sie die Barrikade erreichen. Hohe Präzision sichert kritischen Schaden.",
      },
      {
        question: "Kann ich Type Before Death ohne Konto spielen?",
        answer: "Ja. Das Hauptspiel und persönliche Rekorde stehen Gästen ohne Anmeldung zur Verfügung. Nach der Anmeldung werden Highscores und Erfolge in der Cloud synchronisiert.",
      },
    ],
  },
};

export function getTypeBeforeDeathContent(locale?: string): TypeBeforeDeathContent {
  if (locale && Object.prototype.hasOwnProperty.call(TYPE_BEFORE_DEATH_I18N, locale)) {
    return TYPE_BEFORE_DEATH_I18N[locale];
  }
  return TYPE_BEFORE_DEATH_I18N.en;
}
