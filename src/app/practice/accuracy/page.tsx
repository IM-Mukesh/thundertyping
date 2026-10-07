import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PracticeClient } from "@/components/lessons/practice-client";
import { pageMetadata } from "@/lib/seo/metadata";
import { buildWebApplicationSchema } from "@/lib/seo/json-ld";

export const metadata: Metadata = pageMetadata({
  title: "Typing Accuracy Practice — Drills to Reduce Mistakes",
  description:
    "Improve your typing accuracy with precision-focused drills on HeroTyping. Build clean finger coordination, eliminate frequent typos, and reach 98%+ accuracy.",
  path: "/practice/accuracy",
});

export default function AccuracyPracticePage() {
  const appSchema = buildWebApplicationSchema();

  const breadcrumbs = [
    { name: "Practice", path: "/lessons/practice" },
    { name: "Accuracy Focus", path: "/practice/accuracy" },
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
            Typing Accuracy Practice
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sub sm:text-base">
            Train your fingers to type cleanly without rushing.
            Controlled precision drills to eliminate constant backspacing and build dependable muscle memory.
          </p>
        </header>

        {/* Interactive Practice Tool */}
        <section aria-label="Accuracy Focus Practice Drill" className="w-full">
          <PracticeClient defaultMode="accuracy" />
        </section>

        {/* Explanatory & Educational Content */}
        <article className="mt-14 flex w-full flex-col gap-10 text-left">
          {/* Section: The speed-accuracy paradox */}
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              Why Accuracy Must Come Before Speed
            </h2>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              Many typists try to type faster by rapidly moving their fingers before their muscle memory has established
              clean coordinates for each key. This inevitably causes the &ldquo;burst and stall&rdquo; cycle: you sprint
              through a few easy words, hit a typo, pause in frustration, hammer Backspace multiple times, and re-enter
              the word.
            </p>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              A single typo typically costs at least 4 to 6 keystrokes in corrective friction — the mistake itself,
              the reaction delay, the backspaces, and the retyped characters. In a 60-second test, making just four
              or five typos can reduce your Net WPM by 15 to 25%. Speed is not a separate skill from accuracy; speed
              is the natural byproduct of effortless, mistake-free execution.
            </p>
          </section>

          {/* Section: How HeroTyping structures accuracy drills */}
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              How HeroTyping Structures Accuracy Drills
            </h2>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              Unlike ordinary tests that tempt you to race against a clock, HeroTyping&rsquo;s Accuracy Focus lab
              is specifically engineered to encourage deliberate, rhythmic keystrokes:
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-sub-alt/20 p-4">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-accent">
                  Short 3–4 Letter Sequences
                </span>
                <p className="mt-1 text-xs leading-relaxed text-sub">
                  Each word is limited to 3 or 4 characters, preventing cognitive overload and letting your hands
                  reset to home position after every word.
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-sub-alt/20 p-4">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-accent">
                  Controlled Finger Coordination
                </span>
                <p className="mt-1 text-xs leading-relaxed text-sub">
                  Sequences are generated across the full alphabet in rhythmic 3–4 letter segments with adjacent
                  duplicate character suppression, preventing finger stutter and promoting clean keystroke isolation.
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-sub-alt/20 p-4">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-accent">
                  Real-Time Keystroke Feedback
                </span>
                <p className="mt-1 text-xs leading-relaxed text-sub">
                  The virtual keyboard illuminates the precise finger assigned to the next character, helping you
                  verify your technique before pressing down.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Accuracy benchmarks */}
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              Understanding Accuracy Benchmarks
            </h2>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              When evaluating your accuracy scores on HeroTyping, use these realistic benchmarks as your guide:
            </p>
            <ul className="flex flex-col gap-2.5 text-sm text-sub sm:text-base">
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">&bull;</span>
                <span>
                  <strong className="text-foreground">Below 92%: High Friction.</strong> You are likely typing faster
                  than your muscle memory allows. Backspacing is consuming a large portion of your total output.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">&bull;</span>
                <span>
                  <strong className="text-foreground">95% to 97%: Healthy Practice Zone.</strong> An effective training
                  range where errors occur infrequently enough that rhythm remains intact while your fingers push
                  comfortable limits.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">&bull;</span>
                <span>
                  <strong className="text-foreground">98% to 100%: True Mastery.</strong> Keystrokes are confident and
                  automatic. Once you consistently hit 98% accuracy, your raw speed will naturally accelerate without extra effort.
                </span>
              </li>
            </ul>
            <p className="mt-1 text-sm leading-relaxed text-sub sm:text-base">
              For an in-depth look at why high raw speed with low accuracy sabotages progress, read our guide on{" "}
              <Link
                href="/guides/why-wpm-is-high-accuracy-is-low"
                className="font-medium text-accent hover:underline underline-offset-4"
              >
                why WPM is high but accuracy is low
              </Link>
              .
            </p>
          </section>

          {/* Section: The 80% Rule */}
          <section className="flex flex-col gap-3 rounded-xl border border-border/80 bg-sub-alt/30 p-6">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              The 80% Speed Rule for Precision Training
            </h2>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              The single most effective technique for improving typing accuracy is deliberately dialing back your
              speed to approximately 80% of your current maximum. If you normally type at 60 WPM, deliberately practice
              these accuracy drills at 45 to 50 WPM.
            </p>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              At 80% speed, your brain has sufficient cognitive runway to visually verify the upcoming character,
              select the correct finger, and cleanly execute the keystroke with zero hesitation. Practicing clean
              movements repeatedly encodes the correct neural pathways into physical muscle memory.
            </p>
          </section>

          {/* Section: Internal Linking */}
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              Complementary Training Modules
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/guides/how-to-improve-typing-accuracy"
                className="group flex flex-col rounded-lg border border-border bg-background p-4 transition-colors hover:border-accent"
              >
                <span className="font-display text-sm font-bold uppercase text-foreground group-hover:text-accent">
                  Complete Accuracy Guide &rarr;
                </span>
                <span className="mt-1 text-xs text-sub">
                  Explore practical exercises and ergonomic adjustments to stop making typos.
                </span>
              </Link>
              <Link
                href="/practice/weak-keys"
                className="group flex flex-col rounded-lg border border-border bg-background p-4 transition-colors hover:border-accent"
              >
                <span className="font-display text-sm font-bold uppercase text-foreground group-hover:text-accent">
                  Targeted Weak-Key Drills &rarr;
                </span>
                <span className="mt-1 text-xs text-sub">
                  If typos consistently occur on the same two or three keys, isolate those letters directly.
                </span>
              </Link>
              <Link
                href="/lessons"
                className="group flex flex-col rounded-lg border border-border bg-background p-4 transition-colors hover:border-accent"
              >
                <span className="font-display text-sm font-bold uppercase text-foreground group-hover:text-accent">
                  Touch Typing Curriculum &rarr;
                </span>
                <span className="mt-1 text-xs text-sub">
                  Reinforce fundamental finger-to-key associations starting with the home row.
                </span>
              </Link>
              <Link
                href="/typing-test/1-minute"
                className="group flex flex-col rounded-lg border border-border bg-background p-4 transition-colors hover:border-accent"
              >
                <span className="font-display text-sm font-bold uppercase text-foreground group-hover:text-accent">
                  1-Minute Benchmark Test &rarr;
                </span>
                <span className="mt-1 text-xs text-sub">
                  Test whether improved accuracy has boosted your overall Net WPM score.
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
                  Is it better to type slowly and accurately or fast with mistakes?
                </h3>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-sub">
                  Typing slowly and accurately is vastly superior for long-term improvement. Muscle memory does not
                  know the difference between good keystrokes and mistakes — it simply reinforces whatever you practice.
                  Practicing mistakes teaches your hands to make mistakes.
                </p>
              </div>
              <div className="py-4">
                <h3 className="font-medium text-foreground text-sm sm:text-base">
                  How does HeroTyping calculate accuracy percentage?
                </h3>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-sub">
                  Accuracy is calculated as <code className="font-mono text-foreground">(Correct Keystrokes / (Correct + Incorrect + Missed Characters)) &times; 100</code>.
                  Every typo and skipped letter directly counts against your accuracy percentage.
                </p>
              </div>
              <div className="py-4">
                <h3 className="font-medium text-foreground text-sm sm:text-base">
                  Why does my accuracy drop on longer tests?
                </h3>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-sub">
                  Accuracy drop on longer tests is typically caused by physical hand fatigue or loss of concentration.
                  Short 18-word precision drills help train sustained focus without inducing physical strain.
                </p>
              </div>
              <div className="py-4">
                <h3 className="font-medium text-foreground text-sm sm:text-base">
                  How often should I do accuracy practice?
                </h3>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-sub">
                  Practicing 5 to 10 minutes of accuracy drills at the start of every daily typing session is ideal.
                  It calibrates your fingers to touch position before you engage in high-speed tests or typing games.
                </p>
              </div>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
