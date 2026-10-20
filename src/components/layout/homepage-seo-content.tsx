import Link from "next/link";
import { Timer, Gauge, HelpCircle, Compass } from "lucide-react";

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

export function HomepageSeoContent() {
  return (
    <article className="mt-10 flex w-full max-w-4xl flex-col gap-10 text-left">
      {/* Dedicated Timed Test Durations */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-accent" aria-hidden="true" />
          <h2 className="font-display text-base font-bold uppercase tracking-wider text-foreground sm:text-lg">
            Timed Typing Tests
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-sub sm:text-sm">
          Select a standardized test duration to calibrate your typing speed, rhythm, and accuracy:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <Link
            href="/typing-test/30-seconds"
            className="p-3 rounded-lg border border-border bg-sub-alt/10 hover:border-accent hover:bg-sub-alt/20 transition-colors block text-center"
          >
            <div className="text-xs font-semibold text-foreground sm:text-sm">30 Seconds</div>
            <div className="text-[11px] text-sub mt-0.5">Sprint Reflexes</div>
          </Link>
          <Link
            href="/typing-test/1-minute"
            className="p-3 rounded-lg border border-border bg-sub-alt/10 hover:border-accent hover:bg-sub-alt/20 transition-colors block text-center"
          >
            <div className="text-xs font-semibold text-foreground sm:text-sm">1 Minute</div>
            <div className="text-[11px] text-sub mt-0.5">Standard Benchmark</div>
          </Link>
          <Link
            href="/typing-test/3-minute"
            className="p-3 rounded-lg border border-border bg-sub-alt/10 hover:border-accent hover:bg-sub-alt/20 transition-colors block text-center"
          >
            <div className="text-xs font-semibold text-foreground sm:text-sm">3 Minutes</div>
            <div className="text-[11px] text-sub mt-0.5">Pacing &amp; Cadence</div>
          </Link>
          <Link
            href="/typing-test/5-minute"
            className="p-3 rounded-lg border border-border bg-sub-alt/10 hover:border-accent hover:bg-sub-alt/20 transition-colors block text-center"
          >
            <div className="text-xs font-semibold text-foreground sm:text-sm">5 Minutes</div>
            <div className="text-[11px] text-sub mt-0.5">Keyboard Stamina</div>
          </Link>
          <Link
            href="/typing-test/custom-text"
            className="col-span-2 sm:col-span-1 p-3 rounded-lg border border-border bg-sub-alt/10 hover:border-accent hover:bg-sub-alt/20 transition-colors block text-center"
          >
            <div className="text-xs font-semibold text-foreground sm:text-sm">Custom Text</div>
            <div className="text-[11px] text-sub mt-0.5">Your Own Words</div>
          </Link>
        </div>
      </section>

      {/* Comprehensive Deliberate Practice System */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-accent" aria-hidden="true" />
          <h2 className="font-display text-base font-bold uppercase tracking-wider text-foreground sm:text-lg">
            Deliberate Practice &amp; Skill Building
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-sub sm:text-sm">
          Taking tests benchmarks your speed; deliberate practice accelerates it. Explore targeted training modes designed to break through speed plateaus:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/lessons"
            className="p-3.5 rounded-lg border border-border bg-sub-alt/10 hover:border-accent hover:bg-sub-alt/20 transition-colors block"
          >
            <div className="text-xs font-semibold text-foreground sm:text-sm">28 Step-by-Step Lessons</div>
            <div className="text-[11px] text-sub mt-1">
              Curriculum progression from home row anchor keys (ASDF JKL;) up through top row, bottom row, numbers, and symbols.
            </div>
          </Link>
          <Link
            href="/practice/weak-keys"
            className="p-3.5 rounded-lg border border-border bg-sub-alt/10 hover:border-accent hover:bg-sub-alt/20 transition-colors block"
          >
            <div className="text-xs font-semibold text-foreground sm:text-sm">Weak-Key &amp; Accuracy Labs</div>
            <div className="text-[11px] text-sub mt-1">
              Target awkward pinky reaches and error-prone key sequences identified during your live tests in our dedicated labs.
            </div>
          </Link>
          <Link
            href="/games"
            className="p-3.5 rounded-lg border border-border bg-sub-alt/10 hover:border-accent hover:bg-sub-alt/20 transition-colors block"
          >
            <div className="text-xs font-semibold text-foreground sm:text-sm">9 Retro Arcade Games</div>
            <div className="text-[11px] text-sub mt-1">
              Gamified speed drills including Ghost Racer, Type Before Death, Word Blaster, and Falling Words.
            </div>
          </Link>
          <Link
            href="/vocabulary"
            className="p-3.5 rounded-lg border border-border bg-sub-alt/10 hover:border-accent hover:bg-sub-alt/20 transition-colors block"
          >
            <div className="text-xs font-semibold text-foreground sm:text-sm">1,300-Word Vocabulary Trainer</div>
            <div className="text-[11px] text-sub mt-1">
              Expand vocabulary and finger dexterity simultaneously across Easy, Medium, and Hard tiers with definitions.
            </div>
          </Link>
        </div>
      </section>

      {/* Speed Benchmarks & Telemetry Summary */}
      <section className="flex flex-col gap-3 rounded-lg border border-border bg-sub-alt/10 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-accent" aria-hidden="true" />
          <h2 className="font-display text-base font-bold uppercase tracking-wider text-foreground sm:text-lg">
            Typing Speed Benchmarks &amp; Telemetry
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-sub sm:text-sm">
          In an empirical keystroke study by Dhakal et al. (Aalto University / University of Cambridge, ACM CHI 2018) analyzing 136 million keystrokes from 168,000 online volunteers on TypingMaster, the observed sample mean for sentence transcription was approximately <strong>52 WPM</strong>. While motivated online test-takers generally type faster than the broader population baseline (~35–40 WPM), this dataset provides one of the clearest empirical benchmarks available. HeroTyping captures key events client-side using high-resolution <code>window.performance.now()</code> timestamps and local React state updates, calculating Net WPM, Raw WPM, Accuracy, and Cadence Consistency without network roundtrips during active typing.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs">
          <Link
            href="/guides/average-typing-speed"
            className="text-accent underline underline-offset-2 hover:text-foreground font-medium"
          >
            View Full WPM Percentile Benchmarks &rarr;
          </Link>
          <Link
            href="/guides/net-wpm-vs-gross-wpm"
            className="text-accent underline underline-offset-2 hover:text-foreground font-medium"
          >
            Learn How WPM Is Calculated &rarr;
          </Link>
          <Link
            href="/guides/touch-typing-finger-map"
            className="text-accent underline underline-offset-2 hover:text-foreground font-medium"
          >
            Interactive Finger Placement Map &rarr;
          </Link>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="flex flex-col gap-4 border-t border-border pt-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-accent" aria-hidden="true" />
          <h2 className="font-display text-base font-bold uppercase tracking-wider text-foreground sm:text-lg">
            Frequently Asked Questions
          </h2>
        </div>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {HOMEPAGE_FAQ_ITEMS.map((item) => (
            <div key={item.question} className="flex flex-col gap-1 rounded-lg border border-border/60 bg-sub-alt/5 p-3.5">
              <dt className="text-xs font-semibold text-foreground sm:text-sm">{item.question}</dt>
              <dd className="text-xs leading-relaxed text-sub">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </article>
  );
}

