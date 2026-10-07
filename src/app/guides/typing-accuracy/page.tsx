import type { Metadata } from "next";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { SourceList } from "@/components/content/source-list";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Typing Accuracy: What the Percentage Means & How to Read Your Score",
  description:
    "Understand what typing accuracy measures, how HeroTyping calculates it, why scores vary, and how to use practical benchmark bands without treating them as universal standards.",
  path: "/guides/typing-accuracy",
});

const PUBLISHED = "2026-10-05";
const UPDATED = "October 5, 2026";

const BENCHMARK_BANDS = [
  ["Below 90%", "Still building control. Use the score as a starting point, especially on a test long enough to expose repeated errors."],
  ["90–94%", "Developing accuracy. You may know the layout but lose precision when the pace, text, or punctuation becomes less familiar."],
  ["95–97%", "A solid working range for many practice runs. Look at the error pattern before deciding whether speed or a specific key needs attention."],
  ["98–99%", "Strong control on that particular test. Compare several similar runs before treating it as your normal baseline."],
  ["99%+", "Highly clean performance. On a short test, one or two characters can move the percentage noticeably, so check the sample size."],
];

const FAQ_ITEMS = [
  {
    question: "Is 90% typing accuracy good?",
    answer:
      "It depends on your stage and the purpose of the test. Ninety percent can be a useful early baseline, but it also means roughly one character in ten was scored as incorrect or missed. For a stable everyday target, use the benchmark bands as orientation and work toward a higher score on comparable tests rather than treating 90% as a universal pass mark.",
    plainAnswer:
      "90% can be a useful early baseline, but it means roughly one character in ten was incorrect or missed. Treat it as a starting point, not a universal pass mark.",
  },
  {
    question: "Does typing accuracy include missed characters?",
    answer:
      "In HeroTyping, yes. Accuracy uses correct, incorrect, and missed target characters in the denominator. A character you skipped still represents text that was not reproduced. An extra character is already counted as incorrect, so it is not added a second time as missed.",
    plainAnswer:
      "Yes. HeroTyping includes skipped target characters in the denominator, while an extra character is already counted as incorrect.",
  },
  {
    question: "Why is my accuracy different on two typing tests?",
    answer:
      "The tests may use different text, durations, punctuation, error rules, rounding, or accuracy formulas. Your focus and fatigue also change from run to run. Compare tests only when the scoring method and conditions are reasonably similar, and look at a short series instead of one result.",
    plainAnswer:
      "Text, duration, punctuation, scoring rules, rounding, focus, and fatigue can all change the result. Compare similar tests across several runs.",
  },
  {
    question: "Should I prioritize speed or typing accuracy?",
    answer:
      "Prioritize the fastest pace at which you can stay reliably accurate. A higher raw speed with many errors can produce less usable text than a slightly slower clean run, because corrections and missed characters consume time. Once accuracy is stable, increase speed in small steps and check whether the score holds.",
    plainAnswer:
      "Use the fastest pace at which accuracy stays reliable. A slightly slower clean run can produce more usable text than a faster error-filled one.",
  },
];

export default function TypingAccuracyPage() {
  const schema = buildArticleSchema({
    headline: "Typing Accuracy: What the Percentage Means & How to Read Your Score",
    description:
      "What typing accuracy measures, how HeroTyping calculates it, why scores vary, and how to interpret practical benchmark bands.",
    path: "/guides/typing-accuracy",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Typing Accuracy: What the Percentage Means"
        subtitle="A clear guide to the number behind your typing test — how it is calculated, why it moves, and what a result can actually tell you."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Typing Accuracy", path: "/guides/typing-accuracy" },
        ]}
        toc={[
          { id: "what-accuracy-means", label: "What typing accuracy means" },
          { id: "herotyping-formula", label: "HeroTyping's formula" },
          { id: "why-scores-vary", label: "Why scores vary" },
          { id: "benchmark-bands", label: "Practical benchmark bands" },
          { id: "read-your-result", label: "How to read your result" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Quick answer">
          <p>
            Typing accuracy is the share of target characters you reproduced correctly out of the
            characters counted by the test. In HeroTyping, the calculation is
            <code>correct / (correct + incorrect + missed) * 100</code>. The result is a useful
            measurement of clean output, but it is not a universal grade: text, test length, and
            the scoring rules all shape the percentage.
          </p>
        </Callout>

        <p>
          A typing test gives you more than one speed number. Accuracy answers a narrower question:
          how much of the target did you reproduce correctly? That makes it different from raw
          keystroke speed. Someone can move their fingers quickly and still produce a low-accuracy
          result if they miss keys, press the wrong keys, or skip characters while trying to keep
          pace.
        </p>
        <p>
          Because the result is a percentage, the same number can hide different amounts of work. A
          98% score on a 50-character sample and a 98% score on a 500-character sample are both
          useful, but the longer run gives you more evidence about whether the accuracy held. Read
          the percentage with the character count and the test duration whenever those details are
          available.
        </p>

        <h2 id="what-accuracy-means">What typing accuracy means</h2>
        <p>
          In plain language, accuracy is the proportion of scored characters that are correct. The
          denominator matters. If a test counted only the keys you pressed, skipping a target
          character could look harmless because the test never saw a keystroke for it. HeroTyping
          includes skipped target characters so that the percentage reflects the text you were
          expected to reproduce, not only the characters you happened to press.
        </p>
        <p>
          Accuracy also is not the same thing as whether a final document looks polished. A test
          can count an error immediately, count a correction as a keystroke, or distinguish between
          an extra character and a skipped one. Different products make different choices. Before
          comparing two percentages, check what each score counts and whether it is rounded.
        </p>
        <p>
          The most useful comparison is usually your own result against another run made with a
          similar prompt, duration, and scoring method. A percentage from a short familiar-word
          test and one from a longer passage with punctuation are measurements of different tasks.
        </p>

        <h2 id="herotyping-formula">HeroTyping&apos;s accuracy formula</h2>
        <p>
          HeroTyping&apos;s typing engine implements this formula:
        </p>
        <Callout label="The formula">
          <p className="font-mono text-sm text-foreground">
            Accuracy = (correct ÷ (correct + incorrect + missed)) × 100
          </p>
          <p>
            If the denominator is zero, the engine returns 100 rather than dividing by zero. For a
            normal completed test, the denominator is the complete scored character set.
          </p>
        </Callout>

        <figure aria-labelledby="accuracy-visual-caption" className="flex flex-col gap-3 rounded-xl border border-border bg-sub-alt/20 p-4 sm:p-5">
          <div
            role="img"
            aria-label="Accuracy breakdown: 238 correct, 7 incorrect, and 5 missed characters, for 95.2 percent accuracy"
            className="grid gap-2 sm:grid-cols-3"
          >
            <div className="rounded-lg border border-correct/30 bg-correct/10 p-3">
              <span className="block text-xs uppercase tracking-wide text-sub">Correct</span>
              <strong className="mt-1 block text-2xl text-correct">238</strong>
              <span className="text-xs text-sub">counts in the numerator</span>
            </div>
            <div className="rounded-lg border border-error/30 bg-error/10 p-3">
              <span className="block text-xs uppercase tracking-wide text-sub">Incorrect</span>
              <strong className="mt-1 block text-2xl text-error">7</strong>
              <span className="text-xs text-sub">wrong and extra keys</span>
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <span className="block text-xs uppercase tracking-wide text-sub">Missed</span>
              <strong className="mt-1 block text-2xl text-foreground">5</strong>
              <span className="text-xs text-sub">skipped target characters</span>
            </div>
          </div>
          <meter min={0} max={100} value={95.2} aria-label="Accuracy result: 95.2 percent" className="h-3 w-full accent-accent">
            95.2%
          </meter>
          <figcaption id="accuracy-visual-caption" className="text-xs text-sub/80">
            A semantic breakdown of a 250-character result: 238 ÷ (238 + 7 + 5) × 100 = 95.2%.
            Extra characters belong in <em>incorrect</em>; they are not counted again as missed.
          </figcaption>
        </figure>

        <h3>Worked example</h3>
        <p>
          Suppose a run contains <strong>238 correct</strong> characters, <strong>7 incorrect</strong>
          characters, and <strong>5 missed</strong> target characters. The denominator is 250:
           <code>238 ÷ 250 × 100 = 95.2%</code>. That score says the run was mostly clean, while the five missed characters still mattered even though no wrong key was pressed for them. If the run also had extra keys, those would increase the incorrect count rather than the missed count.
         </p>
         <p>
           This is the behavior implemented in <code>calculateAccuracy</code> in HeroTyping&apos;s
           typing engine. The result panel also exposes the character breakdown, which is more
           informative than the rounded percentage on its own: it lets you see whether a lower
           result came from wrong keys, skipped text, or both. For the surrounding WPM math, see{" "}
           <Link href="/guides/net-wpm-vs-gross-wpm">how WPM is calculated</Link>.
         </p>

        <h2 id="why-scores-vary">Why typing accuracy scores vary</h2>
        <p>
          A score is a measurement of one run, not a permanent label. Several variables can move it
          even when your underlying skill has not changed:
        </p>
        <ul>
          <li>
            <strong>Test length:</strong> a short burst may contain too few characters to reveal a
            recurring mistake. A longer run gives fatigue and more opportunities for errors to show.
          </li>
          <li>
            <strong>Text and character mix:</strong> familiar words are different from text with
            names, numbers, capitalization, symbols, or punctuation. A difficult passage can lower
            accuracy without representing a general regression.
          </li>
          <li>
            <strong>Scoring model:</strong> one site may include missed characters, round to a whole
            number, or treat corrected errors differently from another. The displayed percentage is
            only comparable when the definitions are comparable.
          </li>
          <li>
            <strong>Conditions:</strong> attention, posture, keyboard feel, fatigue, and the amount
            of time you have spent typing that day all affect a particular attempt.
          </li>
        </ul>
        <p>
          This is why a 97% result is not automatically better evidence than a 95% result. If the
          first came from a 15-second familiar-word sprint and the second came from a five-minute
          punctuation-heavy passage, they answer different questions. For a meaningful baseline,
          repeat the same duration and a similar kind of text, then compare the direction of the
          results over several attempts.
        </p>

        <h2 id="benchmark-bands">Practical typing accuracy benchmark bands</h2>
        <p>
          The bands below are an orientation tool for ordinary prose typing tests. They are not
          universal standards, employer requirements, or a grading scale. Your goal depends on your
          age, experience, task, test design, and whether you are learning a new keyboard layout.
        </p>
        <table className="w-full border-collapse text-left text-sm">
          <caption className="mb-2 text-left text-xs text-sub/80">
            Practical interpretation bands for a comparable typing test
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-2 pr-4 font-medium text-foreground">Accuracy</th>
              <th scope="col" className="py-2 font-medium text-foreground">How to read it</th>
            </tr>
          </thead>
          <tbody className="[&_tr]:border-b [&_tr]:border-border">
            {BENCHMARK_BANDS.map(([band, reading]) => (
              <tr key={band}>
                <th scope="row" className="py-2 pr-4 align-top font-medium text-foreground whitespace-nowrap">{band}</th>
                <td className="py-2">{reading}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          These bands deliberately overlap with different goals. A learner may reasonably celebrate
          moving from 82% to 91%, while a professional workflow may need a consistently cleaner
          result. Typing.com&apos;s guidance makes the same broader point from an educational angle:
          recommended minimums vary by grade level, and its college/adult guidance lists 98%+ as a
          recommended minimum rather than claiming that every typist has one identical requirement.
          That is useful context, not a rule that replaces the requirements of a particular course,
          job, or exam.
        </p>
        <p>
          Treat the number as a question: <em>what should I inspect next?</em> If the result is low
          across every type of text, review basic technique and pace. If it drops only on symbols,
          numbers, or certain letter combinations, the overall percentage is pointing toward a more
          specific problem.
        </p>

        <h2 id="read-your-result">Speed versus accuracy: how to read a test result</h2>
        <p>
          Read accuracy next to speed, not underneath it as a footnote. Raw WPM tells you how many
          characters were entered before the test applied its error treatment. Net WPM is closer to
          usable output because it credits correct characters. Accuracy tells you how cleanly the
          work was produced. Consistency, when available, shows whether you held that level instead
          of reaching it only in a burst.
        </p>
        <Callout label="A simple comparison">
          <p>
            Imagine one result at <strong>60 WPM and 98% accuracy</strong> and another at
            <strong>66 WPM and 91% accuracy</strong>. The second run is faster in raw movement, but
            its extra errors may require more correction and review. The first is the stronger
            accuracy-backed baseline for ordinary writing; the second is a signal to check whether
            speed pressure is outrunning control. It is not a universal verdict on either typist.
          </p>
        </Callout>
        <p>
          When you finish a test, read the result in this order:
        </p>
        <ol>
          <li>
            <strong>Check the conditions.</strong> Note the duration, text type, keyboard, and any
            unusual distraction. This tells you whether the result is comparable to your previous
            runs.
          </li>
          <li>
            <strong>Read accuracy with the character counts.</strong> A rounded 96% means more when
            you know whether it came from 96 out of 100 characters or 960 out of 1,000. Check for
            incorrect and missed characters instead of guessing from the percentage alone.
          </li>
          <li>
            <strong>Compare net and raw WPM.</strong> A wide gap suggests that hand speed and clean
            output are not yet aligned. The <Link href="/guides/net-wpm-vs-gross-wpm">WPM formula guide</Link>
            explains why the two numbers can differ.
          </li>
          <li>
            <strong>Look for a repeated pattern.</strong> If the same keys or combinations keep
            appearing in your mistakes, use the <Link href="/guides/how-to-find-your-weakest-typing-keys">weakest-keys guide</Link>
            rather than trying to infer the cause from the total score.
          </li>
          <li>
            <strong>Choose the right comparison.</strong> Use the <Link href="/guides/average-typing-speed">average typing speed guide</Link>
            for broad WPM context, or the <Link href="/guides/data-entry-typing-test">data-entry guide</Link>
            when a role has its own accuracy and speed requirements. Employer and exam rules always
            take priority over a general benchmark.
          </li>
        </ol>
        <p>
          To establish your own baseline, take the <Link href="/typing-test/1-minute">1-Minute Typing Test</Link> or standard <Link href="/">HeroTyping test</Link> under
          repeatable conditions and save a small set of results rather than chasing the highest
          single percentage. To train precision directly, use the dedicated <Link href="/practice/accuracy">Typing Accuracy Practice</Link> drill, or isolate error-prone letters in <Link href="/practice/weak-keys">Weak Keys Practice</Link>. If you want a step-by-step training system rather than an interpretation guide, continue to <Link href="/guides/how-to-improve-typing-accuracy">how to improve typing accuracy</Link>.
        </p>
        <p>
          The purpose of a benchmark is to make your next decision clearer. If accuracy is the
          limiting metric, lower the pace until clean repetitions are possible and use the repeated
          error pattern to choose practice. If accuracy is already stable but WPM is not moving,
          compare your result with the <Link href="/guides/average-typing-speed">average-speed context</Link>
          and work on fluency separately. Either way, measure progress under similar conditions.
        </p>

        <FaqSection items={FAQ_ITEMS} />

        <SourceList
          sources={[
            {
              label: "HeroTyping — How Is WPM Calculated? Formula, Net vs. Gross, Worked Examples",
              href: "/guides/net-wpm-vs-gross-wpm",
            },
            {
              label: "Typing.com — What is Good Accuracy When it Comes to Typing?",
              href: "https://www.typing.com/blog/good-accuracy-comes-typing/",
            },
            {
              label: "Typing.com Support — WPM / Averages Grade Level",
              href: "https://support.typing.com/en/articles/9045953",
            },
          ]}
        />

        <p className="text-xs text-sub/70">Last updated {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}
