import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PracticeClient } from "@/components/lessons/practice-client";
import { pageMetadata } from "@/lib/seo/metadata";
import { buildWebApplicationSchema } from "@/lib/seo/json-ld";

export const metadata: Metadata = pageMetadata({
  title: "Weak Keys Typing Practice — Targeted Keyboard Drills",
  description:
    "Target your most error-prone keyboard keys with adaptive typing drills on HeroTyping. Isolate difficult finger reaches and rebuild muscle memory with real-time feedback.",
  path: "/practice/weak-keys",
});

export default function WeakKeysPracticePage() {
  const appSchema = buildWebApplicationSchema();

  const breadcrumbs = [
    { name: "Practice", path: "/lessons/practice" },
    { name: "Weak Keys", path: "/practice/weak-keys" },
  ];

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-4 sm:px-8 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
        {/* Breadcrumb Navigation */}
        <div className="mb-4 w-full">
          <Breadcrumbs items={breadcrumbs} />
        </div>

        {/* Page Header (Above the fold) */}
        <header className="mb-6 flex w-full flex-col items-center text-center">
          <h1 className="font-display text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Weak Keys Typing Practice
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sub sm:text-base">
            Isolate and conquer the specific letters that cause typos and slow down your typing.
            Practice with real words and targeted reach patterns mapped directly to your keyboard.
          </p>
        </header>

        {/* Interactive Practice Tool */}
        <section aria-label="Weak Keys Typing Practice Drill" className="w-full">
          <PracticeClient defaultMode="weak-keys" />
        </section>

        {/* Explanatory & Educational Content */}
        <article className="mt-14 flex w-full flex-col gap-10 text-left">
          {/* Section: What are weak keys */}
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              Why Typing Mistakes Cluster on Specific Keys
            </h2>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              Typing errors are almost never evenly distributed across the keyboard. Instead, mistakes cluster
              around awkward physical reaches — typically the outer pinky columns (such as <code className="font-mono text-foreground">P</code>, <code className="font-mono text-foreground">Q</code>, or <code className="font-mono text-foreground">Z</code>),
              unfamiliar bottom-row curls (like <code className="font-mono text-foreground">B</code> or <code className="font-mono text-foreground">X</code>),
              or infrequent letter pairings.
            </p>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              When a weak key triggers a typo during normal typing, the entire rhythm halts: you stop, hit Backspace,
              re-orient your fingers, and resume. Eliminating error clusters on your worst two or three keys produces
              an immediate, noticeable leap in overall typing fluency.
            </p>
          </section>

          {/* Section: How HeroTyping detects weak keys */}
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              How HeroTyping Identifies Your Weak Keys
            </h2>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              HeroTyping does not rely on vague guesswork. We use a transparent, deterministic rolling-window
              algorithm that tracks your exact keystroke outcomes in real time:
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-sub-alt/20 p-4">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-accent">
                  Rolling 20-Attempt Window
                </span>
                <p className="mt-1 text-xs leading-relaxed text-sub">
                  Only your last 20 keystrokes for each key are retained in local storage. Once you master a previously
                  difficult key, old errors drop off automatically.
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-sub-alt/20 p-4">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-accent">
                  6-Attempt Minimum Threshold
                </span>
                <p className="mt-1 text-xs leading-relaxed text-sub">
                  A key is evaluated only after at least 6 recorded attempts. Sparse data is never treated as a weakness,
                  preventing false alarms on rarely typed letters.
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-sub-alt/20 p-4">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-accent">
                  90% Accuracy Threshold
                </span>
                <p className="mt-1 text-xs leading-relaxed text-sub">
                  Any qualified key with an accuracy below 90% is classified as weak, ordered worst-first so your
                  drills prioritize your greatest bottlenecks.
                </p>
              </div>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-sub sm:text-base">
              <strong className="text-foreground">Cold-Start Behavior:</strong> If you are a new visitor with no typing
              history on this browser yet, the drill starts with the home-row foundation (<code className="font-mono text-foreground">A, S, D, F, J, K, L, ;</code>).
              As you complete runs, your actual keystroke statistics dynamically take over.
            </p>
          </section>

          {/* Section: The anatomy of a weak key drill */}
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              The Anatomy of a Weak-Key Drill
            </h2>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              Typing chaotic nonsense strings like <code className="font-mono text-foreground">zzqxzqz</code> fails to build
              usable muscle memory because your brain does not encounter those patterns in real English. HeroTyping
              structures each 18-word drill using a scientifically sound balance:
            </p>
            <ul className="flex flex-col gap-2.5 text-sm text-sub sm:text-base">
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">&bull;</span>
                <span>
                  <strong className="text-foreground">60% Real Dictionary Words:</strong> Sourced from common English
                  vocabulary containing your specific target weak keys in natural phonetic contexts.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">&bull;</span>
                <span>
                  <strong className="text-foreground">40% Home-Row Anchor Patterns:</strong> Rhythmic sequences that pair
                  the target weak key with its base home-row anchor key (e.g., reaching from <code className="font-mono text-foreground">F</code> to <code className="font-mono text-foreground">R</code> and returning immediately to <code className="font-mono text-foreground">F</code>).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">&bull;</span>
                <span>
                  <strong className="text-foreground">Visual Keyboard Guidance:</strong> An interactive virtual keyboard
                  highlights the exact finger and hand responsible for each upcoming character so you never look down
                  at your physical keyboard.
                </span>
              </li>
            </ul>
          </section>

          {/* Section: Practical guidance */}
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              How to Practice for Maximum Retention
            </h2>
            <ul className="flex flex-col gap-2.5 text-sm text-sub sm:text-base">
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">&bull;</span>
                <span>
                  <strong className="text-foreground">Slow down to 75–80% of top speed:</strong> Rushing through weak-key
                  drills reinforces the very panic and erratic muscle firings you are trying to unlearn.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">&bull;</span>
                <span>
                  <strong className="text-foreground">Anchor to the home row:</strong> Ensure your fingers rest gently on
                  the guide bumps on <code className="font-mono text-foreground">F</code> and <code className="font-mono text-foreground">J</code>.
                  Every reach should originate from and return to the home position.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">&bull;</span>
                <span>
                  <strong className="text-foreground">Short, focused sessions:</strong> Spend 5 to 10 minutes drilling
                  weak keys before switching to timed benchmark tests or structured curriculum units.
                </span>
              </li>
            </ul>
          </section>

          {/* Section: Internal Linking */}
          <section className="flex flex-col gap-4 rounded-xl border border-border/80 bg-sub-alt/30 p-6">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              Related Training Tools &amp; Resources
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/guides/how-to-find-your-weakest-typing-keys"
                className="group flex flex-col rounded-lg border border-border bg-background p-4 transition-colors hover:border-accent"
              >
                <span className="font-display text-sm font-bold uppercase text-foreground group-hover:text-accent">
                  Diagnostic Guide: Find Weak Keys &rarr;
                </span>
                <span className="mt-1 text-xs text-sub">
                  Learn how to analyze error patterns and identify problematic finger reaches.
                </span>
              </Link>
              <Link
                href="/guides/touch-typing-finger-map"
                className="group flex flex-col rounded-lg border border-border bg-background p-4 transition-colors hover:border-accent"
              >
                <span className="font-display text-sm font-bold uppercase text-foreground group-hover:text-accent">
                  Touch Typing Finger Map &rarr;
                </span>
                <span className="mt-1 text-xs text-sub">
                  Reference which finger owns each key to eliminate cross-finger compensation errors.
                </span>
              </Link>
              <Link
                href="/practice/accuracy"
                className="group flex flex-col rounded-lg border border-border bg-background p-4 transition-colors hover:border-accent"
              >
                <span className="font-display text-sm font-bold uppercase text-foreground group-hover:text-accent">
                  Accuracy Training Lab &rarr;
                </span>
                <span className="mt-1 text-xs text-sub">
                  Broaden your focus to overall coordination and steady cadence across all letters.
                </span>
              </Link>
              <Link
                href="/typing-test/1-minute"
                className="group flex flex-col rounded-lg border border-border bg-background p-4 transition-colors hover:border-accent"
              >
                <span className="font-display text-sm font-bold uppercase text-foreground group-hover:text-accent">
                  1-Minute Typing Test &rarr;
                </span>
                <span className="mt-1 text-xs text-sub">
                  Check if your weak-key practice translated into higher benchmark speed and fewer typos.
                </span>
              </Link>
            </div>
          </section>

          {/* Section: Frequently Asked Questions */}
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              Frequently Asked Questions
            </h2>
            <div className="flex flex-col divide-y divide-border/60">
              <div className="py-4">
                <h3 className="font-medium text-foreground text-sm sm:text-base">
                  How many repetitions does it take to fix a weak key?
                </h3>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-sub">
                  Most typists notice significant improvement within 3 to 5 targeted practice sessions of 5–10 minutes
                  each. Because HeroTyping uses a rolling 20-attempt window, clean new repetitions will quickly push
                  old errors out of your diagnostic history.
                </p>
              </div>
              <div className="py-4">
                <h3 className="font-medium text-foreground text-sm sm:text-base">
                  Can I manually specify the keys I want to drill?
                </h3>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-sub">
                  Yes. You can pass specific keys in the URL, such as <code className="font-mono text-foreground">?keys=p,q,z</code>,
                  to force the generator to focus on those specific letters regardless of your history.
                </p>
              </div>
              <div className="py-4">
                <h3 className="font-medium text-foreground text-sm sm:text-base">
                  Why does the virtual keyboard highlight keys as I type?
                </h3>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-sub">
                  The virtual keyboard trains your eyes to look upward at the screen rather than downward at your hands,
                  which is the primary mechanical foundation of true touch typing.
                </p>
              </div>
              <div className="py-4">
                <h3 className="font-medium text-foreground text-sm sm:text-base">
                  Do my weak keys sync to my account?
                </h3>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-sub">
                  Key performance history is stored in your local browser profile so it responds instantly with zero
                  network latency during drills.
                </p>
              </div>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
