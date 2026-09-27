import Link from "next/link";
import { ShieldCheck, Target, Cpu } from "lucide-react";

/**
 * Editorial and crawlable indexable content for the HeroTyping homepage.
 * Provides transparent, concise product benefits: standardized 5-character WPM
 * metrics, structured learning beyond the test, and a client-side privacy architecture.
 */
export function HomepageSeoContent() {
  return (
    <section
      aria-labelledby="why-herotyping-heading"
      className="mx-auto mt-6 w-full max-w-5xl border-t border-border/60 pt-8 pb-4 text-sub"
    >
      <div className="flex flex-col gap-6">
        {/* Main Heading & Intro */}
        <div className="text-center">
          <h2
            id="why-herotyping-heading"
            className="text-base font-semibold tracking-tight text-foreground sm:text-lg"
          >
            Why HeroTyping?
          </h2>
          <p className="mx-auto mt-2 max-w-3xl text-xs leading-relaxed text-foreground/80 sm:text-sm">
            HeroTyping combines a free typing speed test with structured lessons, targeted practice,
            vocabulary training, games, and detailed performance metrics—all without requiring an
            account.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Pillar 1: Standardized Scoring */}
          <div className="rounded-xl border border-border bg-sub-alt/15 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-accent" aria-hidden="true" />
              <h3 className="text-xs font-semibold text-foreground sm:text-sm">
                Standardized Scoring
              </h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-foreground/75">
              HeroTyping uses the standard 5-character WPM convention, where 5 keystrokes count as
              one word. Results include Gross WPM, Net WPM, accuracy, and consistency so you can track
              both speed and precision. Learn more in our{" "}
              <Link
                href="/guides/net-wpm-vs-gross-wpm"
                className="text-accent underline underline-offset-2"
              >
                WPM calculation guide
              </Link>
              .
            </p>
          </div>

          {/* Pillar 2: Train Beyond the Test */}
          <div className="rounded-xl border border-border bg-sub-alt/15 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-accent" aria-hidden="true" />
              <h3 className="text-xs font-semibold text-foreground sm:text-sm">
                Train Beyond the Test
              </h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-foreground/75">
              Improve through our{" "}
              <Link href="/lessons" className="text-accent underline underline-offset-2">
                28-unit lesson curriculum
              </Link>
              , targeted{" "}
              <Link
                href="/lessons/practice"
                className="text-accent underline underline-offset-2"
              >
                weak-key practice
              </Link>
              ,{" "}
              <Link href="/vocabulary" className="text-accent underline underline-offset-2">
                vocabulary practice
              </Link>
              , and{" "}
              <Link href="/games" className="text-accent underline underline-offset-2">
                typing games
              </Link>
              .
            </p>
          </div>

          {/* Pillar 3: Private by Design */}
          <div className="rounded-xl border border-border bg-sub-alt/15 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-accent" aria-hidden="true" />
              <h3 className="text-xs font-semibold text-foreground sm:text-sm">
                Private by Design
              </h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-foreground/75">
              No account is required. Your personal typing history and achievements are designed to
              stay in your browser, while site analytics may collect aggregate usage data. See our{" "}
              <Link href="/privacy" className="text-accent underline underline-offset-2">
                Privacy Policy
              </Link>{" "}
              for details.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
