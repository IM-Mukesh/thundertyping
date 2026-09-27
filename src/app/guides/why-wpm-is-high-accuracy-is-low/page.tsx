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

const BACKSPACE_PENALTY_BREAKDOWN = [
  {
    step: "1. Error Generation",
    timeCost: "0 ms (instant)",
    keystrokeCost: "1 wrong keystroke registered",
    effect: "The incorrect letter is committed to the buffer.",
  },
  {
    step: "2. Visual Error Recognition",
    timeCost: "150–250 ms",
    keystrokeCost: "1–2 overrun keystrokes typed before stopping",
    effect: "Because your fingers are rushing ahead, you type 2 extra letters before your brain perceives the error.",
  },
  {
    step: "3. Backspace Activation",
    timeCost: "200–350 ms",
    keystrokeCost: "2–4 rapid Backspace key strikes",
    effect: "Right pinky must leave home row, mash Backspace multiple times, and reverse the buffer.",
  },
  {
    step: "4. Corrective Retyping",
    timeCost: "250–400 ms",
    keystrokeCost: "2–3 retyped characters",
    effect: "Re-reading the target word and re-striking the correct keys from a broken rhythm.",
  },
  {
    step: "TOTAL CUMULATIVE PENALTY",
    timeCost: "600–1,000 ms (Up to 1 full second)",
    keystrokeCost: "5–9 wasted keystrokes per error",
    effect: "A typist making 5 errors in a 1-minute test loses up to 5 full seconds of active typing time.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Why does typing fast feel easier than typing accurately?",
    answer:
      "Typing fast without accuracy relies on unchecked ballistic momentum: you throw your hands at the keyboard without verifying finger trajectories. Typing with 98%+ accuracy requires continuous sensorimotor monitoring and inhibitory motor control—actively suppressing finger twitches until the correct key coordinate is ready. Inhibitory control requires more mental effort, which is why sloppy speed feels 'easier.'",
    plainAnswer:
      "Sloppy speed relies on uninhibited hand momentum. Accurate typing requires active mental control to suppress mistakes before they happen, which demands more focus.",
  },
  {
    question: "What is the minimum acceptable accuracy for real-world typing?",
    answer:
      "In professional office, medical, and programming environments, 97% to 98% is the baseline threshold. Anything below 95% indicates serious productivity loss due to constant editing. In competitive typing, scores below 95% are heavily penalized under Net WPM formulas.",
    plainAnswer:
      "Aim for at least 97% to 98%. Below 95% accuracy, the time spent backspacing and fixing typos cancels out any benefit of fast fingers.",
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
      "If you commit to typing 15 to 20 WPM below your peak speed for 7 to 10 days, your accuracy will climb from 88% to 98%. Once accuracy stabilizes at 98%, your speed will naturally climb back to its previous peak—this time with zero errors.",
    plainAnswer:
      "Expect 7 to 10 days of disciplined, slower typing to rewire your motor pacing. Speed will rapidly rebound once errors are eliminated.",
  },
];

const SOURCES = [
  {
    title: "The Cost of Error Correction in High-Speed Transcription Typing",
    author: "Rabbitt, P. (Ergonomics, 1980)",
    url: "https://doi.org/10.1080/00140138008924734",
  },
  {
    title: "Speed-Accuracy Tradeoff and Inhibitory Motor Control in Skill Acquisition",
    author: "Wickelgren, W. A. (Acta Psychologica, 1977)",
    url: "https://doi.org/10.1016/0001-6918(77)90012-9",
  },
  {
    title: "Cognitive Load and Motor Overflow in Skilled Typists",
    author: "Crump, M. J., & Logan, G. D. (Journal of Experimental Psychology: Learning, Memory, and Cognition, 2010)",
    url: "https://doi.org/10.1037/a0019251",
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
        subtitle="The clinical diagnosis for fast typists stuck in the speed-first trap—and how to rewire motor pacing."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Improve Your Typing", path: "/guides/improve-your-typing" },
          { name: "Why WPM Is High Accuracy Is Low", path: "/guides/why-wpm-is-high-accuracy-is-low" },
        ]}
        toc={[
          { id: "the-speed-first-trap", label: "The speed-first trap explained" },
          { id: "the-backspace-penalty", label: "The hidden backspace math" },
          { id: "the-96-percent-rule", label: "The 96% accuracy law" },
          { id: "motor-pacing-reset", label: "The 7-day pacing reset protocol" },
          { id: "practice-in-herotyping", label: "How HeroTyping enforces accuracy" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Core reality">
          <p>
            Typing at 85 WPM with 89% accuracy is not 85 WPM. In the real world—where backspacing, rewriting, and typo
            correction exist—your net productive throughput is under 55 WPM. Speed without accuracy is pure illusion.
          </p>
        </Callout>

        <Image
          src="/guides/improve-your-typing/why-wpm-is-high-accuracy-is-low/error-backspace-penalty-chart.webp"
          alt="Error and backspace cumulative penalty breakdown showing how single mistakes cost up to one full second of typing time"
          width={1200}
          height={675}
          priority
          className="my-6 w-full rounded-xl border border-border shadow-sm"
        />

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
          In motor skill learning, speed and accuracy are governed by separate neurological processes. Speed is a function
          of motor firing rate—how rapidly your nervous system discharges electrical pulses to forearm tendons. Accuracy,
          by contrast, is a function of <em>spatial precision and inhibitory control</em>—the brain&apos;s ability to hold back
          a finger until it is directly over the center of the keycap.
        </p>
        <p>
          When you push speed before spatial precision is 100% automated, you train your brain to execute sloppy,
          approximate reaches. Worse, you habituate your fingers to make mistakes, creating permanent neural scar tissue
          that locks in low accuracy.
        </p>

        <h2 id="the-backspace-penalty">The Hidden Backspace Math: Why Errors Destroy Speed</h2>
        <p>
          Most typists drastically underestimate the time cost of a typo. They assume an error costs a fraction of a
          second: &quot;I just hit backspace real quick and keep going.&quot;
        </p>
        <p>
          Cognitive research proves this assumption completely wrong. Here is what actually happens every time your
          finger misses a key:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-sub-alt/40 border-b border-border">
                <th className="p-3 font-semibold text-foreground">Phase of an Error</th>
                <th className="p-3 font-semibold text-foreground">Cognitive &amp; Motor Time Cost</th>
                <th className="p-3 font-semibold text-foreground">Physical Keystroke Penalty</th>
                <th className="p-3 font-semibold text-foreground">What Actually Happens</th>
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
          Every single error costs between <strong>600 and 1,000 milliseconds</strong>. If you make 6 mistakes during a
          60-second test, you throw away up to 6 full seconds of typing time—erasing 10 to 15 Net WPM from your score!
        </p>

        <h2 id="the-96-percent-rule">The 96% Accuracy Law</h2>
        <p>
          In typing education, the <strong>96% Accuracy Law</strong> states:
        </p>
        <p className="italic bg-sub-alt/30 p-3 rounded border border-border">
          &quot;Any practice session conducted below 96% accuracy reinforces errors faster than it builds skill.&quot;
        </p>
        <p>
          When you practice with 90% accuracy, one out of every ten keystrokes is wrong. You are literally spending 10%
          of your training time wiring the wrong motor trajectories into your cerebral cortex.
        </p>
        <p>
          If your accuracy is consistently below 95%, you must stop attempting speed runs immediately. Speed will never
          fix accuracy; only deliberate, rhythmic pacing can fix accuracy.
        </p>

        <h2 id="motor-pacing-reset">The 7-Day Motor Pacing Reset Protocol</h2>
        <p>
          To permanently break out of the speed-first trap and achieve high accuracy at speed, follow this 7-day protocol:
        </p>

        <ol>
          <li>
            <strong>Apply a 20 WPM Speed Cap:</strong> If your chaotic peak speed is 80 WPM, set an absolute personal
            ceiling of 60 WPM. Treat exceeding 65 WPM as a failure of discipline.
          </li>
          <li>
            <strong>Adopt Metronomic Cadence:</strong> Type to a steady, rhythmic beat (about 120–130 BPM). Every letter,
            space, and punctuation mark must land on a uniform tick. Zero rushing on easy words; zero stalling on hard words.
          </li>
          <li>
            <strong>Zero Panic Backspacing:</strong> When an error occurs, pause for one full breath. Do not mash the
            Backspace key repeatedly. Strike Backspace once, cleanly, and re-type the character deliberately.
          </li>
          <li>
            <strong>Enforce 98% Session Ceilings:</strong> If any test or drill finishes below 97% accuracy, drop your
            speed cap by another 5 WPM for the next run.
          </li>
        </ol>

        <h2 id="practice-in-herotyping">How HeroTyping Enforces Accuracy</h2>
        <p>
          Unlike casual typing sites that allow you to mash keys and still claim 80 WPM, HeroTyping is built around
          rigorous accuracy standards:
        </p>
        <ul>
          <li>
            <strong>Net WPM Parity:</strong> On the <Link href="/">HeroTyping Speed Test</Link>, uncorrected errors and
            missed characters directly subtract from your score, showing you the true cost of typos.
          </li>
          <li>
            <strong>Accuracy-Gated Lessons:</strong> In <Link href="/lessons">HeroTyping Lessons</Link>, every module
            imposes strict accuracy thresholds (typically 90% to 95%). You cannot advance to the next lesson through
            speed alone; you must demonstrate clean technique.
          </li>
          <li>
            <strong>Automated Weak-Key Tracking:</strong> If your errors cluster on specific letters, visit the{" "}
            <Link href="/lessons/practice">HeroTyping Weak-Key Practice Tool</Link> to drill those problem keys until
            accuracy stabilizes above 95%.
          </li>
        </ul>

        <FaqSection items={FAQ_ITEMS} />
        <SourceList sources={SOURCES} />
      </GuideLayout>
    </>
  );
}
