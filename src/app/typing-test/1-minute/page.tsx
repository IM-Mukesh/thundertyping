import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { TypingTestClient } from "@/components/typing-test/typing-test-client";
import { pageMetadata } from "@/lib/seo/metadata";
import { buildWebApplicationSchema } from "@/lib/seo/json-ld";

export const metadata: Metadata = pageMetadata({
  title: "1-Minute Typing Test — 60-Second WPM Speed Test",
  description:
    "Take a free 1-minute typing test on HeroTyping. Measure your Net WPM, raw speed, and accuracy over 60 seconds with instant, accurate keystroke scoring.",
  path: "/typing-test/1-minute",
});

export default function OneMinuteTypingTestPage() {
  const appSchema = buildWebApplicationSchema();

  const breadcrumbs = [
    { name: "Typing Test", path: "/" },
    { name: "1-Minute Typing Test", path: "/typing-test/1-minute" },
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
            1-Minute Typing Test
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sub sm:text-base">
            Test your typing speed and accuracy over a standardized 60-second window.
            Start typing whenever you are ready — the countdown begins automatically on your first keystroke.
          </p>
        </header>

        {/* Interactive Typing Test Tool */}
        <section aria-label="1-Minute Typing Test Tool" className="w-full">
          <TypingTestClient initialMode="time" initialTimeDuration={60} />
        </section>

        {/* Explanatory & Educational Content */}
        <article className="mt-14 flex w-full flex-col gap-10 text-left">
          {/* Section: What 1-minute measures */}
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              What a 1-Minute Typing Test Measures
            </h2>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              A 1-minute typing test measures how many standardized words you can accurately produce in 60 seconds.
              In touch typing, one &ldquo;word&rdquo; is standardized as exactly five keystrokes, including letters,
              spaces, and punctuation. This standard normalization ensures that typing a passage filled with long words
              produces a fair score compared to typing shorter, simpler vocabulary.
            </p>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              HeroTyping evaluates both your raw typing rate (Gross WPM) and your error-adjusted speed (Net WPM).
              Net WPM credits only correct keystrokes over the elapsed 60 seconds, meaning uncorrected errors directly
              reduce your final score. This mirrors professional typing assessments where accuracy and reliability
              matter just as much as pure finger velocity.
            </p>
          </section>

          {/* Section: Why 60 seconds */}
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              Why 60 Seconds is the Standard Assessment Window
            </h2>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              Shorter tests like 15 or 30 seconds capture rapid burst speed, but they often mask inconsistencies
              and fatigue. Conversely, longer tests of 3 or 5 minutes measure sustained muscular endurance, which can
              be physically draining for regular daily check-ins.
            </p>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              A 60-second test strikes the optimal balance: it gives your hands enough time to settle into a natural,
              sustainable rhythm, exposes pacing stalls and recurring finger-transition errors, yet remains brief
              enough to repeat multiple times in a practice session without fatigue. For deeper details on selecting
              appropriate test lengths, see our{" "}
              <Link
                href="/guides/typing-test-duration-guide"
                className="font-medium text-accent hover:underline underline-offset-4"
              >
                typing test duration guide
              </Link>
              .
            </p>
          </section>

          {/* Section: Scoring Methodology */}
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              How HeroTyping Calculates Your Score
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-sub-alt/20 p-4">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-accent">
                  Net WPM
                </span>
                <p className="mt-1 text-xs leading-relaxed text-sub">
                  Calculated as <code className="font-mono text-foreground">(Scoring Characters / 5) / Minutes</code>.
                  Each word only credits its characters (and space separator) toward your score if completed cleanly without uncorrected errors.
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-sub-alt/20 p-4">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-accent">
                  Gross / Raw WPM
                </span>
                <p className="mt-1 text-xs leading-relaxed text-sub">
                  Calculated from all keystrokes typed regardless of mistakes, showing your raw mechanical finger speed.
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-sub-alt/20 p-4">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-accent">
                  Accuracy Percentage
                </span>
                <p className="mt-1 text-xs leading-relaxed text-sub">
                  The percentage of correct keystrokes out of total keypresses and missed characters. 95% or higher
                  is recommended for steady progress.
                </p>
              </div>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-sub sm:text-base">
              Unlike typing tests that artificially inflate scores by crediting spaces on incomplete or mistyped words,
              HeroTyping strictly verifies that each word is cleanly completed before its separator counts toward Net WPM.
              Read our breakdown of{" "}
              <Link
                href="/guides/net-wpm-vs-gross-wpm"
                className="font-medium text-accent hover:underline underline-offset-4"
              >
                Net WPM vs. Gross WPM
              </Link>{" "}
              to learn how standard normalization protects scoring integrity.
            </p>
          </section>

          {/* Section: Tips for a representative score */}
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              How to Get an Accurate, Representative Result
            </h2>
            <ul className="flex flex-col gap-2.5 text-sm text-sub sm:text-base">
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">&bull;</span>
                <span>
                  <strong className="text-foreground">Warm up before testing:</strong> Run one or two short warm-up
                  runs to loosen your fingers before attempting a personal record. Cold muscles lead to erratic keystrokes.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">&bull;</span>
                <span>
                  <strong className="text-foreground">Maintain an even cadence:</strong> Typists who sprint and then
                  freeze upon encountering unfamiliar words score lower than typists who maintain a relaxed, continuous rhythm.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">&bull;</span>
                <span>
                  <strong className="text-foreground">Resist the restart habit:</strong> Completing the full 60 seconds
                  even after making an early typo provides genuine diagnostic feedback on your error recovery habits.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">&bull;</span>
                <span>
                  <strong className="text-foreground">Keep eyes on upcoming words:</strong> Train your eyes to read one
                  to two words ahead of what your fingers are currently typing to eliminate mid-word pauses.
                </span>
              </li>
            </ul>
          </section>

          {/* Section: What to do after your result */}
          <section className="flex flex-col gap-4 rounded-xl border border-border/80 bg-sub-alt/30 p-6">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              Next Steps Based on Your Results
            </h2>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              A typing test tells you where you stand today; targeted practice determines where you will be next week.
              Depending on what your 1-minute test reveals, choose the training tool best suited for your bottleneck:
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/practice/accuracy"
                className="group flex flex-col rounded-lg border border-border bg-background p-4 transition-colors hover:border-accent"
              >
                <span className="font-display text-sm font-bold uppercase text-foreground group-hover:text-accent">
                  Accuracy Focus Practice &rarr;
                </span>
                <span className="mt-1 text-xs text-sub">
                  If your accuracy fell below 95%, slow down and build rhythm with controlled coordination drills.
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
                  If specific reach errors cost you time, isolate your most problematic keyboard letters.
                </span>
              </Link>
              <Link
                href="/lessons"
                className="group flex flex-col rounded-lg border border-border bg-background p-4 transition-colors hover:border-accent"
              >
                <span className="font-display text-sm font-bold uppercase text-foreground group-hover:text-accent">
                  Full Curriculum Lessons &rarr;
                </span>
                <span className="mt-1 text-xs text-sub">
                  Learn proper home-row finger placement from the ground up across guided unit progressions.
                </span>
              </Link>
              <Link
                href="/games"
                className="group flex flex-col rounded-lg border border-border bg-background p-4 transition-colors hover:border-accent"
              >
                <span className="font-display text-sm font-bold uppercase text-foreground group-hover:text-accent">
                  Arcade Typing Games &rarr;
                </span>
                <span className="mt-1 text-xs text-sub">
                  Build reaction speed and high-pressure keyboard fluency in fast-paced arcade challenges.
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
                  What is an average typing speed on a 1-minute test?
                </h3>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-sub">
                  The global average typing speed for casual keyboard users is approximately 38 to 42 WPM.
                  Proficient touch typists typically average 55 to 70 WPM, while advanced transcriptionists and
                  competitive typists regularly exceed 80 to 100+ WPM with high accuracy.
                </p>
              </div>
              <div className="py-4">
                <h3 className="font-medium text-foreground text-sm sm:text-base">
                  Why does the timer start only when I press my first key?
                </h3>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-sub">
                  Starting the clock on the first keystroke ensures you are physically set and ready to begin,
                  preventing wasted seconds caused by page rendering or switching focus to the browser window.
                </p>
              </div>
              <div className="py-4">
                <h3 className="font-medium text-foreground text-sm sm:text-base">
                  Should I fix my typos with Backspace or keep typing?
                </h3>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-sub">
                  In Net WPM scoring, uncorrected errors reduce your final score, so correcting immediate mistakes
                  maintains accuracy. However, repeatedly hammering Backspace breaks rhythm. The best approach is
                  to type at a pace where errors happen rarely enough that quick corrections do not stall momentum.
                </p>
              </div>
              <div className="py-4">
                <h3 className="font-medium text-foreground text-sm sm:text-base">
                  Can I test custom durations like 2 minutes or 5 minutes?
                </h3>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-sub">
                  Yes. You can switch to any custom duration from 1 to 7,200 seconds using the custom time control
                  in the toolbar or by navigating with duration parameters such as{" "}
                  <Link href="/?duration=180" className="text-accent hover:underline">
                    ?duration=180
                  </Link>{" "}
                  for a 3-minute test.
                </p>
              </div>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
