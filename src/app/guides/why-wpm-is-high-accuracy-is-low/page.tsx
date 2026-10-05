import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { SourceList } from "@/components/content/source-list";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Why Your WPM Is High but Accuracy Is Low: The Speed-First Trap",
  description:
    "Why fast typists struggle with low accuracy, the hidden backspace speed penalty, and how to reset your motor pacing to achieve true high-accuracy speed.",
  path: "/guides/why-wpm-is-high-accuracy-is-low",
});

const PUBLISHED = "2026-09-27";
const REVIEWED = "2026-10-05";

const BACKSPACE_PENALTY_BREAKDOWN = [
  {
    step: "1. Error Generation",
    timeCost: "Time to press the wrong key",
    keystrokeCost: "1 wrong keystroke registered",
    effect: "The incorrect letter is committed to the buffer.",
  },
  {
    step: "2. Visual Error Recognition",
    timeCost: "Varies with when the error is noticed",
    keystrokeCost: "Possible overrun keystrokes before stopping",
    effect: "You may continue typing before noticing the error on screen.",
  },
  {
    step: "3. Backspace Activation",
    timeCost: "Varies with the correction method",
    keystrokeCost: "One or more deletion actions",
    effect: "You remove the error and, if necessary, characters typed after it.",
  },
  {
    step: "4. Corrective Retyping",
    timeCost: "Varies with how much needs retyping",
    keystrokeCost: "Replacement characters",
    effect: "Re-reading the target word and re-striking the correct keys from a broken rhythm.",
  },
  {
    step: "TOTAL CUMULATIVE PENALTY",
    timeCost: "No fixed per-error duration",
    keystrokeCost: "Depends on the error and correction",
    effect: "Correction uses test time that could otherwise produce new text.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Why does typing fast feel easier than typing accurately?",
    answer:
      "A familiar pace can feel easier than deliberately slowing down to notice mistakes. If you focus only on the speedometer, errors and correction time are easy to overlook. Compare accuracy and completed correct text across several runs rather than judging a run by how fast it feels.",
    plainAnswer:
      "A familiar pace can feel easier than slowing down to notice mistakes. Compare accuracy and correct output, not just the sensation of speed.",
  },
  {
    question: "What is the minimum acceptable accuracy for real-world typing?",
    answer:
      "There is no universal professional accuracy cutoff. Employers and tests set their own requirements, and the consequences of errors depend on the task. A practice target such as 97% to 98% can help you track progress, but a typing-test percentage does not replace checking a finished document.",
    plainAnswer:
      "Requirements vary by employer, test, and task. Treat 97% to 98% as an optional practice target, not a universal professional standard.",
  },
  {
    question: "Should I disable the Backspace key during practice?",
    answer:
      "Practicing in 'Master Mode' or disabling backspacing occasionally is a powerful diagnostic tool. It forces you to feel the true consequence of every mistake and stops the habit of panic-spamming Backspace. However, once pacing is corrected, re-enable Backspace to practice clean, single-tap error correction.",
    plainAnswer:
      "Disabling backspace for a few practice runs is great for forcing deliberate pacing. Re-enable it once you learn not to mash backspace in a panic.",
  },
  {
    question: "How long does it take to fix a low-accuracy habit?",
    answer:
      "There is no guaranteed recovery timeline or percentage gain. Try a slower pace, note recurring errors, and compare several sessions using similar text difficulty and test settings. Increase speed gradually when accuracy becomes more consistent.",
    plainAnswer:
      "Progress varies. Track accuracy across comparable sessions and increase speed gradually as it becomes more consistent.",
  },
];

const SOURCES = [
  {
    title: "What makes a faster typist?",
    author: "University of Cambridge (2018), summary of Dhakal et al.’s typing study",
    url: "https://www.cam.ac.uk/research/news/what-makes-a-faster-typist",
  },
  {
    title: "Speed-accuracy tradeoff and information processing dynamics",
    author: "Wickelgren, W. A. (Acta Psychologica, 1977)",
    url: "https://doi.org/10.1016/0001-6918(77)90012-9",
  },
  {
    title: "Speed–accuracy trade-off in skilled typewriting: Decomposing the contributions of hierarchical control loops",
    author: "Yamaguchi, M., Crump, M. J. C., & Logan, G. D. (2013)",
    url: "https://doi.org/10.1037/a0030512",
  },
];

export default function WhyWpmIsHighAccuracyIsLowPage() {
  const schema = buildArticleSchema({
    headline: "Why Your WPM Is High but Accuracy Is Low: The Speed-First Trap",
    description:
      "Why fast typists struggle with low accuracy, the hidden backspace speed penalty, and how to reset your motor pacing to achieve true high-accuracy speed.",
    path: "/guides/why-wpm-is-high-accuracy-is-low",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Why Your WPM Is High but Your Accuracy Is Low"
        subtitle="Why fast typists get stuck in the speed-first trap—and how to adjust motor pacing."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Improve Your Typing", path: "/guides/improve-your-typing" },
          { name: "Why WPM Is High Accuracy Is Low", path: "/guides/why-wpm-is-high-accuracy-is-low" },
        ]}
        toc={[
          { id: "the-speed-first-trap", label: "The speed-first trap explained" },
          { id: "the-backspace-penalty", label: "The hidden backspace math" },
          { id: "the-96-percent-rule", label: "Choose an accuracy target" },
          { id: "motor-pacing-reset", label: "A motor pacing reset" },
          { id: "practice-in-herotyping", label: "How HeroTyping enforces accuracy" },
        ]}
        hasFaq
        hasSources
      >
        <p className="text-sm text-sub">Reviewed <time dateTime={REVIEWED}>October 5, 2026</time>.</p>
        <Callout label="Core reality">
          <p>
            An 85 raw WPM score with 89% accuracy does not tell you your net productive speed. The result depends on
            the test&apos;s scoring rules, which errors remain, and time spent correcting them. Compare{" "}
            <Link href="/guides/net-wpm-vs-gross-wpm">net WPM and gross WPM</Link> before judging your progress.
          </p>
        </Callout>

        <figure>
          <Image
            src="/guides/improve-your-typing/why-wpm-is-high-accuracy-is-low/error-backspace-penalty-chart.webp"
            alt="Illustration contrasting a steady 65 WPM pace with an 85 WPM raw pace interrupted by pauses, backspaces, and retyping"
            width={1200}
            height={675}
            priority
            className="my-6 w-full rounded-xl border border-border shadow-sm"
          />
          <figcaption className="text-sm text-sub">
            Illustration only: 65 and 85 WPM are hypothetical starting paces. The interrupted run assumes extra
            correction pauses; bar lengths are not measured time or a calculated net WPM result.
          </figcaption>
        </figure>

        <h2 id="the-speed-first-trap">The Speed-First Trap Explained</h2>
        <p>
          It is one of the most frustrating milestones in touch typing: you have spent months practicing, your fingers
          move like lightning, and your raw typing test speedometer flashes 85 or 90 WPM. Yet when the test ends, your
          accuracy report reads a dismal 88%, and your Net WPM drops like a stone.
        </p>
        <p>
          You have fallen into the <strong>Speed-First Trap</strong>.
        </p>
        <p>
          Typing speed and accuracy interact: pushing your pace can change how many mistakes you make and how you
          correct them. Research on skilled typewriting examines this speed–accuracy trade-off through hierarchical
          control processes, rather than a simple split between fast fingers and a separate accuracy system.
        </p>
        <p>
          When you repeatedly rush the same difficult reaches, recurring mistakes can become a practice habit.
          That is not permanent neural damage: use those errors as feedback about which movements need more deliberate practice.
        </p>

        <h2 id="the-backspace-penalty">The Hidden Backspace Math: Why Errors Destroy Speed</h2>
        <p>
          Most typists drastically underestimate the time cost of a typo. They assume an error costs a fraction of a
          second: &quot;I just hit backspace real quick and keep going.&quot;
        </p>
        <p>
          Cambridge&apos;s summary of a large 2018 typing study highlights that errors are costly to correct.
          The phases below illustrate how a backspace correction can interrupt typing; their timing and sequence vary.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-sub-alt/40 border-b border-border">
                <th className="p-3 font-semibold text-foreground">Phase of an Error</th>
                <th className="p-3 font-semibold text-foreground">Cognitive &amp; Motor Time Cost</th>
                <th className="p-3 font-semibold text-foreground">Physical Keystroke Penalty</th>
                <th className="p-3 font-semibold text-foreground">What Can Happen</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              {BACKSPACE_PENALTY_BREAKDOWN.map((item) => (
                <tr key={item.step} className="hover:bg-sub-alt/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{item.step}</td>
                  <td className="p-3 text-accent text-xs font-mono">{item.timeCost}</td>
                  <td className="p-3 text-sub text-xs">{item.keystrokeCost}</td>
                  <td className="p-3 text-foreground/85 text-xs">{item.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-2">
          There is no universal millisecond penalty per error. A quickly noticed typo and a mistake found several words
          later can require very different corrections. Test scores also handle corrected and uncorrected errors differently.
        </p>

        <h2 id="the-96-percent-rule">Choose an accuracy target, not a universal cutoff</h2>
        <p>
          The research cited here does not establish a universal <strong>96% accuracy law</strong>. Use an accuracy target
          as a practice aid, not a boundary between learning and harm:
        </p>
        <p className="italic bg-sub-alt/30 p-3 rounded border border-border">
          &quot;Choose a pace at which you can notice recurring errors, correct them deliberately, and track improvement.&quot;
        </p>
        <p>
          On a keystroke-only measure, 90% accuracy means one out of every ten recorded keystrokes was wrong; it does not
          mean 10% of practice time was wasted. HeroTyping also includes skipped characters in accuracy. See{" "}
          <Link href="/guides/typing-accuracy">how typing accuracy is measured</Link> before comparing scores.
        </p>
        <p>
          If your accuracy repeatedly falls below your chosen target, try a slower run and check whether the same errors
          become less frequent. Compare runs with similar text difficulty and test settings.
        </p>

        <h2 id="motor-pacing-reset">A Motor Pacing Reset</h2>
        <p>
          To work on the speed-first habit, try these pacing adjustments. They are practice suggestions, not a validated
          seven-day protocol or a promise of a particular accuracy gain. For a broader routine, see{" "}
          <Link href="/guides/how-to-improve-typing-accuracy">how to improve typing accuracy</Link>.
        </p>

        <ol>
          <li>
            <strong>Try a Lower Speed Cap:</strong> If your rushed peak speed is 80 WPM, you could try a 60 WPM run
            and compare the errors. Adjust that example target to a pace you can control.
          </li>
          <li>
            <strong>Adopt a Comfortable Cadence:</strong> Try a steady, self-paced rhythm rather than rushing easy words.
            An optional metronome can help you experiment with pacing, but there is no fixed BPM requirement and you can
            slow down for unfamiliar words.
          </li>
          <li>
            <strong>Zero Panic Backspacing:</strong> When an error occurs, pause for one full breath. Do not mash the
            Backspace key repeatedly. Remove the characters that need correction, then re-type deliberately.
          </li>
          <li>
            <strong>Set a Session Accuracy Target:</strong> You might aim for 98% on familiar text. If several comparable
            runs fall below your target, try a lower speed cap and review the keys causing errors.
          </li>
        </ol>

        <h2 id="practice-in-herotyping">How HeroTyping Enforces Accuracy</h2>
        <p>
          HeroTyping gives you several ways to compare speed with accuracy and practice recurring errors:
        </p>
        <ul>
          <li>
            <strong>Net WPM Scoring:</strong> On the <Link href="/">HeroTyping Speed Test</Link>, net WPM counts fully
            correct committed words and their following separators, plus an error-free prefix of the active word.
            Those characters are divided by five and by elapsed minutes. A committed word with an uncorrected error
            contributes nothing; there is no fixed WPM deduction per typo. Correcting a word can restore its net WPM
            contribution, but the original mistake stays in your accuracy history and correction takes time.
          </li>
          <li>
            <strong>Formative Star Ratings:</strong> In <Link href="/lessons">HeroTyping Lessons</Link>, every unit
            evaluates your run with a 1–5 star rating system. You must achieve at least 3 stars (a minimum 60% accuracy threshold)
            to unlock the next unit, while 4- and 5-star ratings depend on accuracy, pace, and the beginner setting.
          </li>
          <li>
            <strong>Targeted Practice Lab:</strong> When errors cluster on specific letters, key-level performance tracking
            identifies struggling keys and routes them into the <Link href="/lessons/practice">HeroTyping Practice Lab</Link> across
            five targeted modes to help you work on recurring mistakes.
          </li>
        </ul>

        <FaqSection items={FAQ_ITEMS} />
        <SourceList sources={SOURCES} />
      </GuideLayout>
    </>
  );
}
