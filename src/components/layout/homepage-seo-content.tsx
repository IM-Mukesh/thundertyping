import Link from "next/link";
import { Timer, Gauge, Award, Keyboard, BookOpen, Target, HelpCircle } from "lucide-react";

export const HOMEPAGE_FAQ_ITEMS = [
  {
    question: "What is the difference between Net WPM and Raw WPM?",
    answer:
      "Raw WPM (Gross WPM) measures your total typing output speed regardless of mistakes. Net WPM deducts uncorrected errors from your gross word total. If you type 70 Raw WPM but leave 4 uncorrected errors in a 1-minute test, your Net WPM is 66. Net WPM is the true metric used in professional evaluations and typing benchmarks because uncorrected errors require costly editing in real-world writing.",
  },
  {
    question: "What is a good typing speed for adults?",
    answer:
      "According to keystroke research across 168,000 volunteers, the global average typing speed is approximately 52 WPM. Speeds between 40 and 55 WPM are typical for casual office and computer work. Speeds between 65 and 80 WPM qualify for high-productivity technical, editorial, and administrative roles, while 90+ WPM places you in the top 5% of typists worldwide.",
  },
  {
    question: "How does the HeroTyping test calculate words per minute?",
    answer:
      "HeroTyping uses the international standard definition: one word equals exactly 5 keystrokes (including letters, punctuation, and spaces). Your Net WPM is calculated with high precision as: ((Total Keystrokes Attempted / 5) - Uncorrected Errors) / Time in Minutes. Every key event is timestamped to the millisecond using browser performance APIs.",
  },
  {
    question: "What does the Consistency percentage score mean?",
    answer:
      "Consistency measures how uniform your typing cadence was throughout the duration of the test. A score of 85%+ indicates a steady, rhythmic flow where keystrokes occur at even intervals. A score below 65% indicates a 'burst-and-stall' pattern where you sprinted through familiar words but paused abruptly on complex digraphs or punctuation.",
  },
  {
    question: "How fast should I type for administrative, technical, and data entry jobs?",
    answer:
      "Most corporate and administrative positions require a minimum threshold of 45 to 55 Net WPM with 95%+ accuracy. High-throughput data entry, transcription, paralegal, and medical documentation roles typically require 65 to 80 Net WPM with 98%+ accuracy. Professional emergency dispatchers and court reporters often exceed 85 to 100+ WPM.",
  },
  {
    question: "Why is my typing accuracy low even when my speed is high?",
    answer:
      "Low accuracy at high speeds is usually caused by rushing ahead of motor certainty—pressing keys before fingers are anchored on the correct row. When you make an error, backspacing and re-typing costs double the time of typing carefully. The proven solution is deliberate slowing: practice at 80% of your top speed until accuracy exceeds 98%, then gradually allow your speed to increase naturally.",
  },
  {
    question: "Is HeroTyping free and do I need to register an account?",
    answer:
      "HeroTyping is 100% free with no mandatory account creation or subscription walls. All timed tests, 28 structured touch typing lessons, 9 arcade typing games, vocabulary exercises, and practice tools work instantly as a guest, saving your personal bests and history directly in your browser.",
  },
];

export function HomepageSeoContent() {
  return (
    <article className="mt-12 flex w-full max-w-4xl flex-col gap-12 text-left">
      {/* Standard Timers & Durations */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-accent" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
            Standardized Typing Test Durations
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-sub">
          Whether you want a quick reflex warm-up or need extended endurance assessment,
          HeroTyping offers dedicated timed tests engineered for distinct training goals. Choose a duration to match
          your practice schedule and track your Words Per Minute (WPM) progress over time:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 my-2">
          <Link
            href="/typing-test/30-seconds"
            className="p-3.5 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground">30-Second Typing Test</div>
            <div className="text-xs text-sub mt-1">
              Sprint format designed to isolate raw burst velocity, finger reflex response, and immediate muscle memory without onset of hand fatigue.
            </div>
          </Link>
          <Link
            href="/typing-test/1-minute"
            className="p-3.5 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground">1-Minute Typing Test</div>
            <div className="text-xs text-sub mt-1">
              The universal standard evaluation benchmark used worldwide for measuring baseline keyboarding fluency and tracking daily speed gains.
            </div>
          </Link>
          <Link
            href="/typing-test/3-minute"
            className="p-3.5 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground">3-Minute Typing Test</div>
            <div className="text-xs text-sub mt-1">
              Intermediate-duration test evaluating steady cadence consistency, real-time error recovery, and typing rhythm under sustained pacing.
            </div>
          </Link>
          <Link
            href="/typing-test/5-minute"
            className="p-3.5 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground">5-Minute Typing Test</div>
            <div className="text-xs text-sub mt-1">
              Extended endurance trial testing mental stamina, postural discipline, and physical fatigue resistance for rigorous typing evaluations.
            </div>
          </Link>
          <Link
            href="/typing-test/custom-text"
            className="p-3.5 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block sm:col-span-2 lg:col-span-2"
          >
            <div className="text-sm font-semibold text-foreground">Custom Text Typing Test</div>
            <div className="text-xs text-sub mt-1">
              Paste your own text, source code, legal transcripts, or study notes to practice realistic typing in your specific field or discipline.
            </div>
          </Link>
        </div>
      </section>

      {/* Scoring Telemetry & Metrics */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-accent" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
            Zero-Lag Keystroke Scoring &amp; Telemetry
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-sub">
          Unlike online typing tests that rely on periodic input polling or laggy form handlers, HeroTyping&apos;s
          engine is built on high-resolution browser performance timestamps. Every keystroke event is registered down to the
          millisecond, capturing four fundamental telemetry dimensions to provide actionable diagnostics:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border bg-sub-alt/20">
            <h3 className="text-sm font-semibold text-foreground">Net WPM (Words Per Minute)</h3>
            <p className="mt-1 text-xs text-sub leading-relaxed">
              Standardized net speed: total typed characters divided by 5, minus uncorrected errors, divided by test duration in minutes.
              Net WPM represents your true usable typing throughput.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-sub-alt/20">
            <h3 className="text-sm font-semibold text-foreground">Raw WPM (Gross Velocity)</h3>
            <p className="mt-1 text-xs text-sub leading-relaxed">
              Total keystroke production velocity before factoring in mistakes. Comparing Raw WPM against Net WPM indicates
              the exact speed penalty you pay for typos and erratic fingers.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-sub-alt/20">
            <h3 className="text-sm font-semibold text-foreground">Accuracy Percentage</h3>
            <p className="mt-1 text-xs text-sub leading-relaxed">
              The proportion of correct keystrokes out of total keypresses. Elite typists prioritize 96% to 98%+ accuracy,
              because backspacing and correcting errors costs double the time of typing carefully.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-sub-alt/20">
            <h3 className="text-sm font-semibold text-foreground">Cadence Consistency</h3>
            <p className="mt-1 text-xs text-sub leading-relaxed">
              Statistical variance across inter-keystroke intervals (IKIs). A steady metronomic flow prevents finger fatigue,
              builds subconscious muscle memory, and eliminates the dreaded speed plateau.
            </p>
          </div>
        </div>
      </section>

      {/* Typing Speed Benchmarks */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-accent" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
            Typing Speed Benchmarks (WPM Percentiles)
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-sub">
          How fast is fast? Large-scale keystroke research (including the seminal CHI 2018 study analyzing 168,000 volunteers
          and 136 million keystrokes on TypingMaster) documented an overall global average of approximately 52 WPM for transcription.
          Use the benchmark table below to calibrate your current tier and set realistic practice goals:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-sub-alt/40 border-b border-border">
                <th className="p-3 font-semibold text-foreground text-sm">Skill Tier</th>
                <th className="p-3 font-semibold text-foreground text-sm">Net WPM</th>
                <th className="p-3 font-semibold text-foreground text-sm">Accuracy</th>
                <th className="p-3 font-semibold text-foreground text-sm">Typing Technique</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border text-xs sm:text-sm">
              <tr className="hover:bg-sub-alt/20">
                <td className="p-3 font-medium text-foreground">Beginner</td>
                <td className="p-3 text-sub">20 – 35 WPM</td>
                <td className="p-3 text-sub">85% – 92%</td>
                <td className="p-3 text-sub">Visual hunt-and-peck with 2 to 4 fingers. Frequent glances down at keyboard keys.</td>
              </tr>
              <tr className="hover:bg-sub-alt/20">
                <td className="p-3 font-medium text-foreground">Average</td>
                <td className="p-3 text-sub">40 – 55 WPM</td>
                <td className="p-3 text-sub">93% – 96%</td>
                <td className="p-3 text-sub">Standard everyday typist (~52 WPM global mean). Hybrid technique with partial touch typing.</td>
              </tr>
              <tr className="hover:bg-sub-alt/20">
                <td className="p-3 font-medium text-foreground">Proficient</td>
                <td className="p-3 text-sub">60 – 75 WPM</td>
                <td className="p-3 text-sub">96% – 98%</td>
                <td className="p-3 text-sub">Full 10-finger touch typing. Smooth word chording with home row discipline.</td>
              </tr>
              <tr className="hover:bg-sub-alt/20">
                <td className="p-3 font-medium text-foreground">Advanced</td>
                <td className="p-3 text-sub">80 – 95 WPM</td>
                <td className="p-3 text-sub">98%+</td>
                <td className="p-3 text-sub">Professional transcription speed. Eyes locked 2–3 words ahead of the cursor.</td>
              </tr>
              <tr className="hover:bg-sub-alt/20">
                <td className="p-3 font-medium text-foreground">Top 1% Elite</td>
                <td className="p-3 text-accent font-semibold">100 – 120+ WPM</td>
                <td className="p-3 text-sub">99%+</td>
                <td className="p-3 text-sub">Exceptional motor automaticity. Subconscious motor chunking matching conversational speech.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Deliberate Practice vs. Mindless Testing */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-accent" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
            Deliberate Practice vs. Mindless Testing
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-sub">
          Repeatedly taking standard typing tests measures your speed, but it rarely accelerates it. Plateauing at 50 or 60 WPM
          is a common consequence of mindless repetition. To break through speed barriers, cognitive motor science prescribes
          deliberate practice: diagnosing specific error patterns, targeting slow finger reaches, and progressing through the three
          classic stages of motor learning:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-1">
          <div className="p-3.5 rounded-xl border border-border bg-sub-alt/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-accent">1. Cognitive Stage</h3>
            <p className="text-xs text-sub mt-1 leading-relaxed">
              Consciously mapping key positions using home row tactile nubs (F and J) without glancing at the physical keyboard.
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-border bg-sub-alt/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-accent">2. Associative Stage</h3>
            <p className="text-xs text-sub mt-1 leading-relaxed">
              Transitioning from single-character keystrokes into fluid multi-letter chords (digraphs like <em>th</em>, <em>sh</em>, <em>ing</em>).
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-border bg-sub-alt/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-accent">3. Autonomous Stage</h3>
            <p className="text-xs text-sub mt-1 leading-relaxed">
              Reaching effortless automaticity where thoughts and visual words translate directly into finger movements at 80+ WPM.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <Link
            href="/lessons"
            className="p-4 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground">28 Interactive Touch-Typing Lessons</div>
            <div className="text-xs text-sub mt-1">
              Curriculum progression from home row anchor keys (ASDF JKL;) up through top row, bottom row, numbers, and punctuation.
            </div>
          </Link>
          <Link
            href="/practice/weak-keys"
            className="p-4 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground">Weak-Key Practice Lab</div>
            <div className="text-xs text-sub mt-1">
              Targeted drills isolating sluggish pinky reaches, ring-finger curls, and high-error key pairings identified during your tests.
            </div>
          </Link>
          <Link
            href="/practice/accuracy"
            className="p-4 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground">High-Accuracy Practice Mode</div>
            <div className="text-xs text-sub mt-1">
              Calibrate precision with strict error penalties. Slow down intentionally to build pristine motor memory before ramping up speed.
            </div>
          </Link>
          <Link
            href="/games"
            className="p-4 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground">9 Retro Arcade Typing Games</div>
            <div className="text-xs text-sub mt-1">
              Develop stress tolerance and rapid reaction reflexes with engaging games like Ghost Racer, Type Before Death, and Word Blaster.
            </div>
          </Link>
          <Link
            href="/vocabulary"
            className="p-4 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground">1,300-Word Adaptive Vocabulary Trainer</div>
            <div className="text-xs text-sub mt-1">
              Master rich multi-syllable vocabulary across Easy, Medium, and Hard tiers with integrated definitions and pronunciation audio.
            </div>
          </Link>
          <div className="p-4 rounded-xl border border-border bg-sub-alt/20 flex flex-col justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">Touch Typing Educational Guides</div>
              <p className="text-xs text-sub mt-1">
                Explore in-depth tutorials on keyboard mechanics, finger placement, and habit formation:
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Link href="/guides/touch-typing-finger-map" className="text-accent underline underline-offset-2 hover:text-foreground">
                Finger Map
              </Link>
              <span className="text-sub">•</span>
              <Link href="/guides/how-to-touch-type" className="text-accent underline underline-offset-2 hover:text-foreground">
                How to Touch Type
              </Link>
              <span className="text-sub">•</span>
              <Link href="/guides/typing-practice-for-beginners" className="text-accent underline underline-offset-2 hover:text-foreground">
                Beginner Practice
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="flex flex-col gap-4 border-t border-border pt-8">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-accent" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
            Frequently Asked Questions About Typing Speed
          </h2>
        </div>
        <dl className="flex flex-col gap-6">
          {HOMEPAGE_FAQ_ITEMS.map((item) => (
            <div key={item.question} className="flex flex-col gap-1.5">
              <dt className="text-sm font-semibold text-foreground sm:text-base">{item.question}</dt>
              <dd className="text-xs leading-relaxed text-sub sm:text-sm">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </article>
  );
}

