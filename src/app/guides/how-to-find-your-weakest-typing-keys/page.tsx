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
  title: "How to Find Your Weakest Typing Keys: Error Logs and Accuracy Diagnostics",
  description:
    "Identify which keys hurt your typing speed and accuracy. Learn how to diagnose weak keys using error logs, attempt thresholds, and mistype patterns.",
  path: "/guides/how-to-find-your-weakest-typing-keys",
});

const PUBLISHED = "2026-09-27";

const ERROR_PATTERNS = [
  {
    category: "Adjacent Slip",
    example: "Pressing 'E' instead of 'R', or 'K' instead of 'L'",
    rootCause: "Finger reach angle drift or resting too close to key borders.",
    diagnosticTest: "Type isolated bigrams at 50% speed. If errors vanish, it is a pacing issue, not finger confusion.",
  },
  {
    category: "Symmetrical Hand Mirroring",
    example: "Pressing 'D' (left middle) when aiming for 'K' (right middle)",
    rootCause: "Cognitive cross-talk between cerebral hemispheres during speed surges.",
    diagnosticTest: "Slow down by 15 WPM. If mirroring stops, your motor planning is outpacing your visual buffer.",
  },
  {
    category: "Pinky Weakness / Underextension",
    example: "Missing 'P', 'Q', 'Z', or ';', or hitting the key edge weakly",
    rootCause: "Extensor digiti minimi muscle fatigue and insufficient anchor stability.",
    diagnosticTest: "Check wrist angle. Floating wrists or excessive elbow flare usually starves pinky reach.",
  },
  {
    category: "Shift Key Timing Misalignment",
    example: "Typing 'tHe' or missing capitalization completely",
    rootCause: "Releasing the opposite Shift key before depressing the target letter.",
    diagnosticTest: "Examine capitalized sentence runs. If errors cluster on capital letters, it is dual-hand coordination.",
  },
];

const FAQ_ITEMS = [
  {
    question: "How many typing attempts do I need before a key is statistically 'weak'?",
    answer:
      "A key needs at least 6 recorded attempts in real words before accuracy numbers become statistically meaningful. Missing a key once out of two attempts gives an apparent 50% error rate, but that single slip is statistical noise. HeroTyping's practice engine tracks a rolling window of your last 20 attempts per key, requiring at least 6 attempts and an accuracy rate below 90% before classifying any key as actively struggling.",
    plainAnswer:
      "A key requires at least 6 recorded attempts within a rolling 20-keystroke window and an accuracy below 90% to be flagged as struggling.",
  },
  {
    question: "Why do I keep mistyping common letters like 'E' and 'T'?",
    answer:
      "High-frequency letters like 'E', 'T', and 'A' appear in hundreds of different word contexts and consonant blends. You make more gross errors on them simply because you type them ten times more often than 'Z' or 'X'. To evaluate whether 'E' is truly weak, calculate your percentage error rate rather than raw error count.",
    plainAnswer:
      "High-frequency letters naturally accumulate higher raw error counts. Evaluate your percentage accuracy on that key rather than the total number of mistakes.",
  },
  {
    question: "Can keyboard hardware cause false weak keys?",
    answer:
      "Yes. Key chatter (switch contact bouncing causing duplicate letters) or stiff, off-axis friction on mechanical switches can register artificial errors. If you suspect hardware, test the suspect key in a plain text editor with slow, repeated strikes. If duplicates or missed activations occur without rapid typing, the physical switch or stabilizer may need cleaning or replacement.",
    plainAnswer:
      "Key chatter or stiff switches can trigger artificial mistakes. Test the key in a simple text editor with slow single taps to confirm the switch fires cleanly.",
  },
  {
    question: "Should I diagnose weak keys on 15-second bursts or 2-minute tests?",
    answer:
      "Use 1-minute to 2-minute typing tests or full paragraphs for diagnosis. 15-second sprints measure adrenaline and warm-up bursts; they don't give enough keystroke volume across the full alphabet to uncover underlying biomechanical friction or fatigue patterns.",
    plainAnswer:
      "Diagnose with 1- to 2-minute tests. Short 15-second sprints lack the keystroke volume and stamina demand needed to reveal true motor weaknesses.",
  },
];

const SOURCES = [
  {
    title: "Motor Skill Learning and Keystroke Dynamics in Touch Typing",
    author: "Logan, G. D., & Crump, M. J. (Cognitive Psychology, 2011)",
    url: "https://doi.org/10.1016/j.cogpsych.2010.08.001",
  },
  {
    title: "Error Detection and Correction Mechanisms in Skilled Typists",
    author: "Rabbitt, P. (Journal of Experimental Psychology, 1978)",
    url: "https://doi.org/10.1037/0096-1523.4.4.636",
  },
  {
    title: "Biomechanical Analysis of Finger Trajectories on Standard QWERTY Layouts",
    author: "Rempel, D., et al. (Human Factors and Ergonomics Society, 2007)",
    url: "https://doi.org/10.1177/154193120705101804",
  },
];

export default function HowToFindYourWeakestTypingKeysPage() {
  const schema = buildArticleSchema({
    headline: "How to Find Your Weakest Typing Keys: Error Logs and Accuracy Diagnostics",
    description:
      "Identify which keys hurt your typing speed and accuracy. Learn how to diagnose weak keys using error logs, attempt thresholds, and mistype patterns.",
    path: "/guides/how-to-find-your-weakest-typing-keys",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="How to Find Your Weakest Typing Keys"
        subtitle="Stop guessing why your typing stumbles. Here is how to diagnose specific problem keys with error logs and statistical thresholds."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Improve Your Typing", path: "/guides/improve-your-typing" },
          { name: "How to Find Your Weakest Typing Keys", path: "/guides/how-to-find-your-weakest-typing-keys" },
        ]}
        toc={[
          { id: "why-diagnostics-matter", label: "Why diagnosis beats guessing" },
          { id: "statistical-sample-size", label: "Statistical sample size" },
          { id: "four-error-categories", label: "Four common error patterns" },
          { id: "analyzing-error-logs", label: "Analyzing your error log" },
          { id: "from-diagnosis-to-practice", label: "From diagnosis to targeted practice" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Diagnostic rule">
          <p>
            Never classify a key as weak based on an isolated mistake. A genuine weak key shows a repeatable
            accuracy rate under 90% across at least 6 verified attempts within natural words. Fixing two
            diagnosed weak keys routinely yields a bigger WPM leap than 50 random typing tests.
          </p>
        </Callout>

        <Image
          src="/guides/improve-your-typing/how-to-find-your-weakest-typing-keys/weak-key-diagnostic-heatmap.webp"
          alt="Keyboard diagnostic heatmap showing keys with low accuracy highlighted in amber and red against high-accuracy green keys"
          width={1200}
          height={675}
          priority
          className="my-6 w-full rounded-xl border border-border shadow-sm"
        />

        <h2 id="why-diagnostics-matter">Why Diagnosis Beats Blind Practice</h2>
        <p>
          Most typists who hit a speed plateau react by typing more tests. When they stumble on a test,
          they blame general fatigue, nerve tension, or bad luck. But typing breakdowns are rarely general;
          they are almost always localized to two or three specific keys whose neural pathways are slower or
          less consistent than the rest of your fingers.
        </p>
        <p>
          Consider what happens during a 60 WPM test. You type roughly five characters every second. When your
          fingers hit a fluent sequence like <code>the</code>, <code>and</code>, or <code>ing</code>, you move
          in a smooth ballistic rhythm. But when your hand approaches a key with uncertain spatial memory—such as
          the letter <code>B</code>, <code>P</code>, or a punctuation mark like <code>;</code>—your brain pauses
          for 150 to 300 milliseconds to confirm the finger coordinate.
        </p>
        <p>
          That micro-pause shatters your cadence, ruins your{" "}
          <Link href="/guides/how-to-improve-typing-consistency">typing consistency</Link>, and frequently produces
          an adjacent-key misstrike. Finding those specific bottleneck keys is the single highest-leverage
          intervention in keyboard training.
        </p>

        <h2 id="statistical-sample-size">The Statistical Threshold: Sample Size Matters</h2>
        <p>
          A common mistake when analyzing typing statistics is over-indexing on rare letters. If you take a short
          test and type the letter <code>Z</code> once, but accidentally strike <code>X</code>, your error report
          will show <code>Z</code> at a dismal 0% accuracy.
        </p>
        <p>
          Does this mean <code>Z</code> is your primary bottleneck? Almost certainly not. In standard English prose,
          <code>Z</code> accounts for less than 0.1% of all letters. Spending 20 minutes drilling <code>Z</code> while
          ignoring an 88% accuracy rate on <code>O</code> (which accounts for over 7% of English characters) will
          produce zero noticeable improvement on your everyday typing speed.
        </p>

        <p>
          To separate true motor weaknesses from random statistical noise, apply these three criteria:
        </p>

        <ul>
          <li>
            <strong>Minimum attempt threshold:</strong> Only evaluate keys with at least 6 recorded attempts during
            practice or lesson sessions.
          </li>
          <li>
            <strong>Accuracy threshold:</strong> HeroTyping classifies a key as actively struggling when its accuracy
            falls below 90% across a rolling 20-attempt window.
          </li>
          <li>
            <strong>Lexical frequency weight:</strong> Prioritize fixing vowels and high-frequency consonants
            (<code>E, T, A, O, I, N, S, R</code>) before troubleshooting low-frequency fringe keys.
          </li>
        </ul>

        <h2 id="four-error-categories">The Four Major Error Patterns</h2>
        <p>
          When you miss a key, the exact nature of the mistype tells you why the mistake happened. Review the table
          below to categorize your diagnostic patterns:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-sub-alt/40 border-b border-border">
                <th className="p-3 font-semibold text-foreground">Pattern Category</th>
                <th className="p-3 font-semibold text-foreground">Typical Example</th>
                <th className="p-3 font-semibold text-foreground">Biomechanical Root Cause</th>
                <th className="p-3 font-semibold text-foreground">Diagnostic Drill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ERROR_PATTERNS.map((pattern) => (
                <tr key={pattern.category} className="hover:bg-sub-alt/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{pattern.category}</td>
                  <td className="p-3 text-sub">{pattern.example}</td>
                  <td className="p-3 text-foreground/85">{pattern.rootCause}</td>
                  <td className="p-3 text-foreground/85">{pattern.diagnosticTest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="analyzing-error-logs">Analyzing Your Error Logs Step by Step</h2>
        <p>
          To diagnose your weak keys systematically, follow this 4-step diagnostic protocol:
        </p>

        <ol>
          <li>
            <strong>Take a controlled 2-minute baseline test:</strong> Open the standard{" "}
            <Link href="/">HeroTyping Speed Test</Link> and select a 60-second or 120-second duration. Do not sprint
            at your maximum chaotic speed; type at a comfortable, natural pace.
          </li>
          <li>
            <strong>Examine the post-test error breakdown:</strong> Check which characters registered red strikes. Note
            whether the errors were misses, late backspaces, or extra insertions.
          </li>
          <li>
            <strong>Check the HeroTyping Key Performance Tracker:</strong> When you practice in{" "}
            <Link href="/lessons">HeroTyping Lessons</Link> or tests, the performance tracker continuously tallies
            your per-key results across a rolling 20-attempt buffer. If a key falls below 90% accuracy with 6+ attempts,
            the platform flags it in your dashboard as an active weak key and schedules it for review.
          </li>
          <li>
            <strong>Inspect adjacent anchor stability:</strong> When you miss a key like <code>U</code>, check whether
            your right index finger drifted off its home anchor bump on <code>J</code>. An unstable anchor almost always
            corrupts the reaches above and below it.
          </li>
        </ol>

        <h2 id="from-diagnosis-to-practice">From Diagnosis to Targeted Practice</h2>
        <p>
          Once you have identified your 2 or 3 weakest keys, do not continue taking generic speed tests. Generic tests
          dilute your practice time across 26 letters, giving your problem keys only occasional exposure.
        </p>
        <p>
          Instead, switch immediately to targeted remediation. Read our comprehensive guide on{" "}
          <Link href="/guides/typing-practice-for-weak-keys">Typing Practice for Weak Keys</Link> to learn the bigram
          embedding method, or jump directly into the interactive{" "}
          <Link href="/practice/weak-keys">Weak Keys Typing Practice</Link> tool (or the broader{" "}
          <Link href="/lessons/practice">Practice Lab</Link>) to generate custom drills built specifically around your
          diagnosed problem letters.
        </p>

        <FaqSection items={FAQ_ITEMS} />
        <SourceList sources={SOURCES} />
      </GuideLayout>
    </>
  );
}
