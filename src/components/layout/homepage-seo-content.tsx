import Link from "next/link";
import { ChevronDown, Compass, Gauge, HelpCircle, Timer } from "lucide-react";

export const HOMEPAGE_FAQ_ITEMS = [
  {
    question: "What is the difference between Net WPM and Raw WPM?",
    answer:
      "Raw WPM (Gross WPM) measures your total typing output speed regardless of mistakes. Net WPM deducts uncorrected errors from your gross word total. If you type 70 Raw WPM but leave 4 uncorrected errors in a 1-minute test, your Net WPM is 66. Net WPM is the international benchmark metric used in professional evaluations because uncorrected errors require editing in real-world writing.",
  },
  {
    question: "What is a good typing speed for adults?",
    answer:
      "In a large-scale keystroke study by Dhakal et al. (ACM CHI 2018) examining 168,000 online test-takers, the observed mean sentence-copying speed was approximately 52 WPM. General office roles typically function comfortably around 40–55 WPM, while specialized data-entry or transcription roles often request 65–80+ WPM with 95–98%+ accuracy. In that online study cohort, 90+ WPM represented the top 5% of participants.",
  },
  {
    question: "How does HeroTyping calculate words per minute?",
    answer:
      "HeroTyping uses the international standard definition: one word equals exactly 5 keystrokes (including letters, punctuation, and spaces). Your Net WPM is calculated with millisecond precision as: ((Total Keystrokes Attempted / 5) - Uncorrected Errors) / Time in Minutes.",
  },
  {
    question: "Is HeroTyping free and do I need to register an account?",
    answer:
      "HeroTyping is 100% free with no mandatory account creation or subscription walls. All timed tests, 28 structured touch typing lessons, 9 arcade typing games, vocabulary exercises, and practice tools work instantly as a guest, saving your personal bests and history directly in your browser.",
  },
];

export const HOMEPAGE_FAQS_BY_LOCALE: Record<string, typeof HOMEPAGE_FAQ_ITEMS> = {
  en: HOMEPAGE_FAQ_ITEMS,
  es: [
    {
      question: "¿Cuál es la diferencia entre PPM Netas y PPM Brutas?",
      answer:
        "Las PPM Brutas miden la velocidad total de escritura sin importar los errores. Las PPM Netas descuentan los errores no corregidos de tu total. Si escribes a 70 PPM brutas pero dejas 4 errores en 1 minuto, tus PPM netas son 66. Es el estándar internacional para evaluaciones profesionales.",
    },
    {
      question: "¿Qué es una buena velocidad de mecanografía para adultos?",
      answer:
        "En un estudio a gran escala realizado por Dhakal et al. (ACM CHI 2018) con 168.000 participantes, la velocidad media observada fue de aproximadamente 52 PPM. Para trabajos de oficina, entre 40 y 55 PPM es adecuado, mientras que puestos especializados de transcripción suelen requerir más de 65 a 80 PPM con más del 95% de precisión.",
    },
    {
      question: "¿Cómo calcula HeroTyping las palabras por minuto?",
      answer:
        "HeroTyping utiliza la definición estándar internacional: una palabra equivale exactamente a 5 pulsaciones (incluyendo letras, números, signos y espacios). Las PPM netas se calculan con precisión de milisegundos: ((Pulsaciones totales / 5) - Errores) / Minutos.",
    },
    {
      question: "¿Es HeroTyping gratuito y necesito registrarme?",
      answer:
        "HeroTyping es 100% gratuito y no requiere registro ni suscripciones. Todas las pruebas contrarreloj, las 28 lecciones guiadas, los 9 juegos de mecanografía y el entrenador de vocabulario funcionan de inmediato como invitado, guardando tus marcas en tu navegador.",
    },
  ],
  "pt-BR": [
    {
      question: "Qual é a diferença entre PPM Líquidas e PPM Brutas?",
      answer:
        "As PPM Brutas medem o volume total de digitação independentemente dos erros. As PPM Líquidas deduzem os erros não corrigidos da sua contagem total. Se você digita a 70 PPM brutas com 4 erros em 1 minuto, suas PPM líquidas são 66. As PPM líquidas são o padrão internacional utilizado em avaliações profissionais.",
    },
    {
      question: "Qual é uma boa velocidade de digitação para adultos?",
      answer:
        "Em um estudo acadêmico com 168.000 pessoas conduzido por Dhakal et al. (ACM CHI 2018), a velocidade média observada foi de aproximadamente 52 PPM. Funções administrativas operam com conforto entre 40 e 55 PPM, enquanto posições que exigem digitação intensiva buscam 65 a 80+ PPM com mais de 95% de precisão.",
    },
    {
      question: "Como o HeroTyping calcula as palavras por minuto?",
      answer:
        "O HeroTyping utiliza a convenção padrão internacional: 1 palavra equivale a exatamente 5 toques de teclas (incluindo letras, pontuação e espaços). Sua pontuação é calculada com precisão de milissegundos: ((Toques totais / 5) - Erros) / Minutos.",
    },
    {
      question: "O HeroTyping é gratuito e preciso criar uma conta?",
      answer:
        "O HeroTyping é 100% gratuito, sem cadastro obrigatório ou paywalls. Todos os testes cronometrados, 28 lições de digitação, 9 jogos arcade e ferramentas de vocabulário funcionam instantaneamente como visitante, gravando seus recordes no navegador.",
    },
  ],
  de: [
    {
      question: "Was ist der Unterschied zwischen Netto-WPM und Brutto-WPM?",
      answer:
        "Brutto-WPM misst die gesamte Tippgeschwindigkeit ohne Abzug von Fehlern. Netto-WPM zieht unkorrigierte Fehler von der Gesamtzahl ab. Wenn Sie 70 Brutto-WPM tippen, aber 4 Fehler in einem 1-Minuten-Test unkorrigiert lassen, beträgt Ihr Netto-Ergebnis 66 WPM. Netto-WPM ist der internationale Standard für berufliche Tests.",
    },
    {
      question: "Was ist eine gute Tippgeschwindigkeit für Erwachsene?",
      answer:
        "In einer groß angelegten Tastenanschlagsstudie von Dhakal et al. (ACM CHI 2018) mit 168.000 Online-Teilnehmern lag der beobachtete Durchschnitt bei etwa 52 WPM. Für typische Büroarbeiten reichen 40 bis 55 WPM gut aus, während Datenerfassung oft 65 bis 80+ WPM bei über 95 % Genauigkeit voraussetzt.",
    },
    {
      question: "Wie berechnet HeroTyping Wörter pro Minute?",
      answer:
        "HeroTyping verwendet die internationale Standarddefinition: Ein Wort entspricht exakt 5 Tastenanschlägen (einschließlich Buchstaben, Satzzeichen und Leerzeichen). Die Netto-WPM werden millisekundengenau berechnet: ((Tastenanschläge gesamt / 5) - Fehler) / Zeit in Minuten.",
    },
    {
      question: "Ist HeroTyping kostenlos und muss ich ein Konto erstellen?",
      answer:
        "HeroTyping ist zu 100 % kostenlos und erfordert weder Registrierung noch Abonnements. Alle Zeittests, 28 strukturierte Lektionen, 9 Arcade-Tippspiele und der Wortschatz-Trainer funktionieren sofort als Gast und speichern Bestzeiten lokal in Ihrem Browser.",
    },
  ],
};

export function getHomepageFaqs(locale: string = "en") {
  return HOMEPAGE_FAQS_BY_LOCALE[locale] || HOMEPAGE_FAQ_ITEMS;
}

export function HomepageSeoContent({ locale = "en" }: { locale?: string } = {}) {
  const faqs = getHomepageFaqs(locale);
  const isEs = locale === "es";
  const isPt = locale === "pt-BR";
  const isDe = locale === "de";

  const titles = {
    timed: isEs ? "Pruebas de Mecanografía Contrarreloj" : isPt ? "Testes Cronometrados de Digitação" : isDe ? "Tipptests mit Zeitmessung" : "Timed Typing Tests",
    timedSubtitle: isEs
      ? "Selecciona una duración estandarizada para calibrar tu velocidad, ritmo y precisión:"
      : isPt
      ? "Selecione uma duração padronizada para calibrar sua velocidade, ritmo e precisão:"
      : isDe
      ? "Wählen Sie eine standardisierte Testdauer, um Tempo, Rhythmus und Präzision zu messen:"
      : "Select a standardized test duration to calibrate your typing speed, rhythm, and accuracy:",
    benchmarks: isEs ? "Métricas de Velocidad y Telemetría" : isPt ? "Métricas de Velocidade e Telemetria" : isDe ? "Geschwindigkeits-Benchmarks & Telemetrie" : "Typing Speed Benchmarks & Telemetry",
    faqs: isEs ? "Preguntas Frecuentes" : isPt ? "Perguntas Frequentes" : isDe ? "Häufig gestellte Fragen" : "Frequently Asked Questions",
  };
  return (
    <article className="pt-6 pb-4 flex w-full max-w-4xl mx-auto flex-col gap-8 sm:gap-10 text-left">
      {/* Section A: Timed Typing Tests */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
          <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-foreground">
            {titles.timed}
          </h2>
        </div>
        <p className="text-xs sm:text-[13px] leading-relaxed text-sub">
          {titles.timedSubtitle}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
          <Link
            href="/typing-test/30-seconds"
            className="group p-3 rounded-xl border border-border/70 bg-sub-alt/15 hover:border-accent hover:bg-sub-alt/25 transition-all block text-center shadow-xs"
          >
            <div className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors sm:text-sm">
              30 Seconds
            </div>
            <div className="text-[10px] sm:text-[11px] text-sub mt-0.5">
              Sprint Reflexes
            </div>
          </Link>
          <Link
            href="/typing-test/1-minute"
            className="group p-3 rounded-xl border border-border/70 bg-sub-alt/15 hover:border-accent hover:bg-sub-alt/25 transition-all block text-center shadow-xs"
          >
            <div className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors sm:text-sm">
              1 Minute
            </div>
            <div className="text-[10px] sm:text-[11px] text-sub mt-0.5">
              Standard Benchmark
            </div>
          </Link>
          <Link
            href="/typing-test/3-minute"
            className="group p-3 rounded-xl border border-border/70 bg-sub-alt/15 hover:border-accent hover:bg-sub-alt/25 transition-all block text-center shadow-xs"
          >
            <div className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors sm:text-sm">
              3 Minutes
            </div>
            <div className="text-[10px] sm:text-[11px] text-sub mt-0.5">
              Pacing &amp; Cadence
            </div>
          </Link>
          <Link
            href="/typing-test/5-minute"
            className="group p-3 rounded-xl border border-border/70 bg-sub-alt/15 hover:border-accent hover:bg-sub-alt/25 transition-all block text-center shadow-xs"
          >
            <div className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors sm:text-sm">
              5 Minutes
            </div>
            <div className="text-[10px] sm:text-[11px] text-sub mt-0.5">
              Keyboard Stamina
            </div>
          </Link>
          <Link
            href="/typing-test/custom-text"
            className="group col-span-2 sm:col-span-1 p-3 rounded-xl border border-border/70 bg-sub-alt/15 hover:border-accent hover:bg-sub-alt/25 transition-all block text-center shadow-xs"
          >
            <div className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors sm:text-sm">
              Custom Text
            </div>
            <div className="text-[10px] sm:text-[11px] text-sub mt-0.5">
              Your Own Words
            </div>
          </Link>
        </div>
      </section>

      {/* Section B: Deliberate Practice & Skill Building */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
          <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-foreground">
            Deliberate Practice &amp; Skill Building
          </h2>
        </div>
        <p className="text-xs sm:text-[13px] leading-relaxed text-sub">
          Taking tests benchmarks your speed; deliberate practice accelerates it. Explore targeted training modes designed to break through speed plateaus:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          <Link
            href="/lessons"
            className="group p-3.5 sm:p-4 rounded-xl border border-border/70 bg-sub-alt/15 hover:border-accent hover:bg-sub-alt/25 transition-all block shadow-xs"
          >
            <div className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors sm:text-sm">
              28 Step-by-Step Lessons
            </div>
            <div className="text-[11px] text-sub leading-relaxed mt-1">
              Curriculum progression from home row anchor keys (ASDF JKL;) up through top row, bottom row, numbers, and symbols.
            </div>
          </Link>
          <Link
            href="/practice/weak-keys"
            className="group p-3.5 sm:p-4 rounded-xl border border-border/70 bg-sub-alt/15 hover:border-accent hover:bg-sub-alt/25 transition-all block shadow-xs"
          >
            <div className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors sm:text-sm">
              Weak Keys Practice
            </div>
            <div className="text-[11px] text-sub leading-relaxed mt-1">
              Target awkward pinky reaches and error-prone key sequences identified during your live tests in our dedicated lab.
            </div>
          </Link>
          <Link
            href="/practice/accuracy"
            className="group p-3.5 sm:p-4 rounded-xl border border-border/70 bg-sub-alt/15 hover:border-accent hover:bg-sub-alt/25 transition-all block shadow-xs"
          >
            <div className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors sm:text-sm">
              Accuracy Training Lab
            </div>
            <div className="text-[11px] text-sub leading-relaxed mt-1">
              Stabilize 98%+ precision, eradicate burst-and-stall habits, and develop consistent typing cadence under pressure.
            </div>
          </Link>
          <Link
            href="/games"
            className="group p-3.5 sm:p-4 rounded-xl border border-border/70 bg-sub-alt/15 hover:border-accent hover:bg-sub-alt/25 transition-all block shadow-xs"
          >
            <div className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors sm:text-sm">
              9 Retro Arcade Games
            </div>
            <div className="text-[11px] text-sub leading-relaxed mt-1">
              Gamified speed drills including Ghost Racer, Type Before Death, Word Blaster, and Falling Words.
            </div>
          </Link>
          <Link
            href="/vocabulary"
            className="group p-3.5 sm:p-4 rounded-xl border border-border/70 bg-sub-alt/15 hover:border-accent hover:bg-sub-alt/25 transition-all block shadow-xs"
          >
            <div className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors sm:text-sm">
              1,300-Word Vocabulary Trainer
            </div>
            <div className="text-[11px] text-sub leading-relaxed mt-1">
              Expand vocabulary and finger dexterity simultaneously across Easy, Medium, and Hard tiers with definitions.
            </div>
          </Link>
          <Link
            href="/guides"
            className="group p-3.5 sm:p-4 rounded-xl border border-border/70 bg-sub-alt/15 hover:border-accent hover:bg-sub-alt/25 transition-all block shadow-xs"
          >
            <div className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors sm:text-sm">
              Curated Typing Guides
            </div>
            <div className="text-[11px] text-sub leading-relaxed mt-1">
              52 comprehensive tutorials covering touch typing mechanics, ergonomic posture, and WPM percentile formulas.
            </div>
          </Link>
        </div>
      </section>

      {/* Section C: Speed Benchmarks & Telemetry */}
      <section className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-sub-alt/15 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
          <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-foreground">
            Typing Speed Benchmarks &amp; Telemetry
          </h2>
        </div>
        <p className="text-xs sm:text-[13px] leading-relaxed text-sub">
          In an empirical keystroke study by Dhakal et al. (Aalto University / University of Cambridge, ACM CHI 2018) analyzing 136 million keystrokes from 168,000 online volunteers on TypingMaster, the observed sample mean for sentence transcription was approximately <strong>52 WPM</strong>. While motivated online test-takers generally type faster than the broader population baseline (~35–40 WPM), this dataset provides one of the clearest empirical benchmarks available. HeroTyping captures key events client-side using high-resolution <code>window.performance.now()</code> timestamps and local React state updates, calculating Net WPM, Raw WPM, Accuracy, and Cadence Consistency without network roundtrips during active typing.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs">
          <Link
            href="/guides/average-typing-speed"
            className="text-accent underline underline-offset-2 hover:text-foreground font-medium transition-colors"
          >
            View Full WPM Percentile Benchmarks &rarr;
          </Link>
          <Link
            href="/guides/net-wpm-vs-gross-wpm"
            className="text-accent underline underline-offset-2 hover:text-foreground font-medium transition-colors"
          >
            Learn How WPM Is Calculated &rarr;
          </Link>
          <Link
            href="/guides/touch-typing-finger-map"
            className="text-accent underline underline-offset-2 hover:text-foreground font-medium transition-colors"
          >
            Interactive Finger Placement Map &rarr;
          </Link>
        </div>
      </section>

      {/* Section D: Frequently Asked Questions */}
      <section className="flex flex-col gap-3 sm:gap-4 border-t border-border/60 pt-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
          <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-foreground">
            {titles.faqs}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          {faqs.map((item) => (
            <details
              key={item.question}
              className="group rounded-xl border border-border/70 bg-sub-alt/10 p-3.5 transition-colors open:bg-sub-alt/20 hover:border-border"
            >
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-xs sm:text-sm text-foreground list-none select-none">
                <span>{item.question}</span>
                <ChevronDown
                  size={14}
                  className="text-accent transition-transform duration-200 group-open:rotate-180 shrink-0 ml-2"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-sub pt-2 border-t border-border/40">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </article>
  );
}
