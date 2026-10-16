import Link from "next/link";
import { Timer, Gauge, Award, Keyboard } from "lucide-react";

export const HOMEPAGE_FAQ_ITEMS = [
  {
    question: "What is the difference between Net WPM and Raw WPM?",
    answer:
      "Raw WPM (Gross WPM) measures your total typing speed regardless of mistakes. Net WPM deducts uncorrected errors from your gross word total. If you type 70 Raw WPM but leave 4 uncorrected errors in a 1-minute test, your Net WPM is 66. Net WPM is the standard metric used in professional typing tests.",
  },
  {
    question: "What is a good typing speed for adults?",
    answer:
      "According to keystroke research across 168,000 typists, the global average typing speed is approximately 52 WPM. Speeds between 40 and 55 WPM are typical for casual daily computer work. Speeds between 65 and 80 WPM are considered proficient for professional office roles, and 90+ WPM places you in the top 5% of typists.",
  },
  {
    question: "How does the HeroTyping test calculate words per minute?",
    answer:
      "HeroTyping uses the international standard definition: one word equals exactly 5 keystrokes (including letters, punctuation, and spaces). Your Net WPM is calculated as: ((Total Characters Attempted / 5) - Uncorrected Errors) / Time in Minutes.",
  },
  {
    question: "What does the Consistency percentage score mean?",
    answer:
      "Consistency measures how uniform your typing cadence was throughout the test. A score of 85%+ indicates a steady, metronomic flow. A score below 65% indicates a 'burst-and-stall' pattern where you sprinted through short words but paused abruptly on longer words or punctuation.",
  },
  {
    question: "Is HeroTyping free and do I need to register an account?",
    answer:
      "HeroTyping is 100% free with no mandatory account creation or subscription. All practice tests, 28 structured touch typing lessons, 9 arcade typing games, and vocabulary drills work instantly as a guest, saving your personal bests locally in your browser.",
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
          Whether you want a quick reflex warm-up or need extended endurance practice,
          HeroTyping offers dedicated timed tests engineered for distinct training goals:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-2">
          <Link
            href="/typing-test/30-seconds"
            className="p-3.5 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground">30-Second Test</div>
            <div className="text-xs text-sub mt-1">Isolate raw burst speed and reflex response without hand fatigue.</div>
          </Link>
          <Link
            href="/typing-test/1-minute"
            className="p-3.5 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground">1-Minute Test</div>
            <div className="text-xs text-sub mt-1">The global standard assessment benchmark for everyday progress evaluation.</div>
          </Link>
          <Link
            href="/typing-test/3-minute"
            className="p-3.5 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground">3-Minute Test</div>
            <div className="text-xs text-sub mt-1">Medium-duration test evaluating steady cadence and error recovery under pressure.</div>
          </Link>
          <Link
            href="/typing-test/5-minute"
            className="p-3.5 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground">5-Minute Test</div>
            <div className="text-xs text-sub mt-1">Extended duration test for sustained typing stamina, rhythm, and accuracy.</div>
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
          Unlike online typing tests that rely on periodic sampling or laggy browser inputs, HeroTyping&apos;s
          engine is built on high-resolution browser performance timestamps. Every keystroke is measured down to the
          millisecond, capturing four core telemetry dimensions:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border bg-sub-alt/20">
            <h3 className="text-sm font-semibold text-foreground">Net WPM (Words Per Minute)</h3>
            <p className="mt-1 text-xs text-sub leading-relaxed">
              Standard net speed: total typed characters divided by 5, minus uncorrected errors, divided by test minutes.
              Reflects true usable output.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-sub-alt/20">
            <h3 className="text-sm font-semibold text-foreground">Raw WPM (Gross Velocity)</h3>
            <p className="mt-1 text-xs text-sub leading-relaxed">
              Total keystroke production speed before mistake penalties. Comparing Raw WPM to Net WPM reveals exactly how
              much velocity you lose to typos.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-sub-alt/20">
            <h3 className="text-sm font-semibold text-foreground">Accuracy Percentage</h3>
            <p className="mt-1 text-xs text-sub leading-relaxed">
              The proportion of correct keystrokes out of total key events. High-performing typists maintain 96%–98%+ accuracy
              to eliminate costly backspacing.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-sub-alt/20">
            <h3 className="text-sm font-semibold text-foreground">Cadence Consistency</h3>
            <p className="mt-1 text-xs text-sub leading-relaxed">
              Statistical variance across inter-keystroke intervals. A steady metronomic cadence protects against fatigue and
              drastically reduces speed plateaus.
            </p>
          </div>
        </div>
      </section>

      {/* Typing Speed Benchmarks */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-accent" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
            Typing Speed Percentiles &amp; Skill Tiers
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-sub">
          How does your typing speed compare to global typists? Keystroke research benchmarks define these performance tiers:
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
                <td className="p-3 text-sub">Visual hunt-and-peck with 2 to 4 fingers. Regular glancing at keys.</td>
              </tr>
              <tr className="hover:bg-sub-alt/20">
                <td className="p-3 font-medium text-foreground">Average</td>
                <td className="p-3 text-sub">40 – 55 WPM</td>
                <td className="p-3 text-sub">93% – 96%</td>
                <td className="p-3 text-sub">Standard everyday typist (~52 WPM global mean). Hybrid touch technique.</td>
              </tr>
              <tr className="hover:bg-sub-alt/20">
                <td className="p-3 font-medium text-foreground">Proficient</td>
                <td className="p-3 text-sub">60 – 75 WPM</td>
                <td className="p-3 text-sub">96% – 98%</td>
                <td className="p-3 text-sub">Full 10-finger touch typing. Smooth word chording with rare glances down.</td>
              </tr>
              <tr className="hover:bg-sub-alt/20">
                <td className="p-3 font-medium text-foreground">Advanced</td>
                <td className="p-3 text-sub">80 – 95 WPM</td>
                <td className="p-3 text-sub">98%+</td>
                <td className="p-3 text-sub">Professional transcription speed. Eyes locked 2–3 words ahead of caret.</td>
              </tr>
              <tr className="hover:bg-sub-alt/20">
                <td className="p-3 font-medium text-foreground">Top 1% Elite</td>
                <td className="p-3 text-accent font-semibold">100 – 120+ WPM</td>
                <td className="p-3 text-sub">99%+</td>
                <td className="p-3 text-sub">Competitive keyboard mastery. Unconscious execution matching conversational speech.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Comprehensive Practice Platform */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Keyboard className="h-5 w-5 text-accent" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
            Beyond Testing: Complete Typing Mastery System
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-sub">
          Taking typing tests measures your speed, but deliberate practice is what increases it. HeroTyping features
          integrated tools to target every stage of motor learning:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/lessons"
            className="p-4 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground">28 Interactive Touch-Typing Lessons</div>
            <div className="text-xs text-sub mt-1">
              Curriculum from home row anchors up through top row, bottom row, numbers, and code syntax.
            </div>
          </Link>
          <Link
            href="/lessons/practice"
            className="p-4 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground">Weak-Key Practice Lab</div>
            <div className="text-xs text-sub mt-1">
              Targeted drills isolating awkward pinky reaches, ring-finger curls, and recurring typographical mistakes.
            </div>
          </Link>
          <Link
            href="/games"
            className="p-4 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground">9 Retro Arcade Typing Games</div>
            <div className="text-xs text-sub mt-1">
              Build speed under pressure in Ghost Racer, Type Before Death, Word Blaster, Falling Words, and Fruit Fury.
            </div>
          </Link>
          <Link
            href="/vocabulary"
            className="p-4 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground">1,300-Word Adaptive Vocabulary Trainer</div>
            <div className="text-xs text-sub mt-1">
              Expand vocabulary and typing speed simultaneously across Easy, Medium, and Hard tiers with audio definitions.
            </div>
          </Link>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="flex flex-col gap-4 border-t border-border pt-8">
        <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
          Frequently Asked Questions About Typing Speed
        </h2>
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
