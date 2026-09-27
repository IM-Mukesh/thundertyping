import Link from "next/link";
import { ShieldCheck, Target, Cpu } from "lucide-react";

/**
 * Editorial and crawlable indexable content for the HeroTyping homepage.
 * Provides transparent explanations of typing metrics (Gross vs. Net WPM),
 * our 28-lesson tactile curriculum, weak-key diagnostic training, and our
 * zero-signup, client-side privacy architecture.
 */
export function HomepageSeoContent() {
  return (
    <section
      aria-labelledby="homepage-overview-heading"
      className="mx-auto mt-6 w-full max-w-5xl border-t border-border/60 pt-8 pb-4 text-sub"
    >
      <div className="flex flex-col gap-6">
        {/* Main Heading & Intro */}
        <div className="text-center">
          <h2
            id="homepage-overview-heading"
            className="text-base font-semibold tracking-tight text-foreground sm:text-lg"
          >
            Deliberate Keyboard Mastery — Fast, Private, and Accurate
          </h2>
          <p className="mx-auto mt-2 max-w-3xl text-xs leading-relaxed text-foreground/80 sm:text-sm">
            HeroTyping is a modern touch-typing platform built around cognitive science, mechanical
            accuracy, and strict standardization. Whether you are aiming to break your first 40 WPM
            plateau, benchmark for a professional transcription exam, or master developer syntax, our
            tools train finger automaticity without friction or visual clutter.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Pillar 1: Standardized Metrics */}
          <div className="rounded-xl border border-border bg-sub-alt/15 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-accent" aria-hidden="true" />
              <h3 className="text-xs font-semibold text-foreground sm:text-sm">
                Standardized Scoring Metrics
              </h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-foreground/75">
              Unlike casual typing tests that count arbitrary words, HeroTyping follows the
              international <strong>5-character standard</strong> (1 word = 5 keystrokes including
              spaces and punctuation). We report true <strong>Gross WPM</strong>, error-penalized{" "}
              <strong>Net WPM</strong>, keystroke accuracy %, and statistical consistency so your
              scores reflect real typing capacity. Learn more in our{" "}
              <Link href="/guides/net-wpm-vs-gross-wpm" className="text-accent underline underline-offset-2">
                WPM calculation guide
              </Link>
              .
            </p>
          </div>

          {/* Pillar 2: 4 Practice Modes */}
          <div className="rounded-xl border border-border bg-sub-alt/15 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-accent" aria-hidden="true" />
              <h3 className="text-xs font-semibold text-foreground sm:text-sm">
                4 Purpose-Built Learning Modes
              </h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-foreground/75">
              Build automaticity from every angle: progress through our{" "}
              <Link href="/lessons" className="text-accent underline underline-offset-2">
                28-unit lesson curriculum
              </Link>{" "}
              from home row to symbols, target your slowest letter transitions with{" "}
              <Link href="/lessons/practice" className="text-accent underline underline-offset-2">
                weak-key drills
              </Link>
              , practice prose via{" "}
              <Link href="/vocabulary" className="text-accent underline underline-offset-2">
                curated vocabulary
              </Link>
              , or reinforce muscle memory under pressure with arcade{" "}
              <Link href="/games" className="text-accent underline underline-offset-2">
                typing games
              </Link>
              .
            </p>
          </div>

          {/* Pillar 3: Zero-Signup Privacy */}
          <div className="rounded-xl border border-border bg-sub-alt/15 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-accent" aria-hidden="true" />
              <h3 className="text-xs font-semibold text-foreground sm:text-sm">
                Private &amp; Browser-Native
              </h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-foreground/75">
              No accounts, no paywalls, and no mandatory user profiling. All your test runs, accuracy
              heatmaps, and unlocked achievements are saved securely in your browser&apos;s local
              storage. Your keystrokes and practice text never leave your device, ensuring safe and
              compliant practice for classrooms, workplaces, and private training.
            </p>
          </div>
        </div>

        {/* Quick Navigation Footnote */}
        <div className="text-center text-xs text-sub">
          <span>Looking for reference benchmarks? Check </span>
          <Link href="/guides/average-typing-speed" className="text-accent underline underline-offset-2">
            What is a Good Typing Speed?
          </Link>
          <span> or explore all 6 pillars in our </span>
          <Link href="/guides" className="text-accent underline underline-offset-2">
            Typing Guides Content Hub
          </Link>
          .
        </div>
      </div>
    </section>
  );
}
