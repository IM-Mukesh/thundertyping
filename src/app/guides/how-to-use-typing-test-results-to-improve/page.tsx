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
  title: "How to Use Typing Test Results to Improve: A Data-Driven Action Loop",
  description:
    "Stop taking typing tests blindly. Learn how to convert Net WPM, Raw WPM, accuracy, and consistency metrics into a targeted improvement routine.",
  path: "/guides/how-to-use-typing-test-results-to-improve",
});

const PUBLISHED = "2026-09-27";

const METRIC_DIAGNOSTICS = [
  {
    metricPattern: "High Raw WPM, Low Net WPM (Accuracy < 92%)",
    diagnosis: "Premature speed rushing. You are moving your hands faster than your brain can plan motor trajectories.",
    actionPlan: "Impose an artificial speed governor: slow down by 15 WPM until your accuracy holds 97%+ for 5 tests.",
  },
  {
    metricPattern: "High Accuracy (99%+), Low WPM (< 40 WPM)",
    diagnosis: "Excessive caution and over-verification. You are waiting to see each letter appear on screen before typing the next.",
    actionPlan: "Look-ahead drill: read 2 to 3 words ahead of the cursor. Force your fingers to flow without waiting for visual confirmation.",
  },
  {
    metricPattern: "High WPM, Low Consistency (< 60%)",
    diagnosis: "Burst-and-stall typing. You sprint through easy words (the, and) but hit brick walls on complex syllables or punctuation.",
    actionPlan: "Metronome practice: type to a steady 120–140 BPM beat. Smooth out velocity peaks to eliminate dead pauses.",
  },
  {
    metricPattern: "Errors Clustered in the Last 30 Seconds",
    diagnosis: "Cognitive or physical stamina fatigue. Your forearm extensor tendons or working memory are fatiguing under sustained load.",
    actionPlan: "Endurance intervals: switch from 60s tests to 2-minute and 5-minute endurance runs. Check desk and wrist ergonomics.",
  },
];

const FAQ_ITEMS = [
  {
    question: "How often should I take a typing test if I want to improve?",
    answer:
      "Take a formal diagnostic typing test only once or twice per practice session. The optimal ratio is 80% deliberate practice (drilling weak keys, lessons, and rhythm) and 20% evaluative testing. Taking 20 tests in a row tests your skill, but does not train new motor pathways.",
    plainAnswer:
      "Take only 1 or 2 tests per session. Dedicate 80% of your time to deliberate practice and 20% to testing.",
  },
  {
    question: "What is the difference between Net WPM and Raw WPM on HeroTyping?",
    answer:
      "Raw WPM (Gross WPM) measures total keystroke velocity, regardless of errors. Net WPM subtracts uncorrected errors, measuring true usable typing output. If your Raw WPM is 80 but your Net WPM is 55, you are losing 25 WPM of productive work to mistakes and backspacing. Read our guide on Net WPM vs Gross WPM for exact formulas.",
    plainAnswer:
      "Raw WPM measures raw speed including mistakes. Net WPM measures true usable speed with errors penalized. A wide gap means errors are destroying your productivity.",
  },
  {
    question: "What does the Consistency percentage on the result screen mean?",
    answer:
      "Consistency measures how evenly spaced your keystrokes were throughout the test. A consistency score of 85%+ means you maintained a uniform, metronomic cadence. A consistency score below 65% indicates a 'burst-and-stall' pattern where you sprinted through some words and ground to a complete halt on others.",
    plainAnswer:
      "Consistency measures typing rhythm. High consistency means a steady, predictable cadence. Low consistency means erratic bursts followed by sudden pauses.",
  },
  {
    question: "Why does my typing test score fluctuate by 15 WPM between attempts?",
    answer:
      "WPM fluctuations are driven by three factors: word difficulty variance (rare consonants vs common words), fatigue level, and emotional frustration. If you make an early error and panic, your subsequent rhythm collapses. Look at your 7-day rolling average rather than individual test peaks.",
    plainAnswer:
      "Daily score swings are normal due to text variance and fatigue. Track your 7-day rolling median rather than celebrating single lucky test runs.",
  },
];

const SOURCES = [
  {
    title: "Feedback and Knowledge of Results in Perceptual-Motor Skill Learning",
    author: "Salmoni, A. W., Schmidt, R. A., & Walter, C. B. (Psychological Bulletin, 1984)",
    url: "https://doi.org/10.1037/0033-2909.95.3.355",
  },
  {
    title: "Deliberate Practice and the Modifiability of Cognitive and Motor Performance",
    author: "Ericsson, K. A. (Medical Education, 2004)",
    url: "https://doi.org/10.1111/j.1365-2929.2004.02032.x",
  },
  {
    title: "Keystroke Timing Variability and Skill Progression in Typists",
    author: "Gentner, D. R. (Cognitive Science, 1983)",
    url: "https://doi.org/10.1207/s15516709cog0703_2",
  },
];

export default function HowToUseTypingTestResultsToImprovePage() {
  const schema = buildArticleSchema({
    headline: "How to Use Typing Test Results to Improve: A Data-Driven Action Loop",
    description:
      "Stop taking typing tests blindly. Learn how to convert Net WPM, Raw WPM, accuracy, and consistency metrics into a targeted improvement routine.",
    path: "/guides/how-to-use-typing-test-results-to-improve",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="How to Use Typing Test Results to Improve"
        subtitle="Transform raw WPM, accuracy, and consistency metrics from vanity numbers into a diagnostic feedback loop."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Typing Tests & Tools", path: "/guides/typing-tests-tools" },
          { name: "How to Use Typing Test Results to Improve", path: "/guides/how-to-use-typing-test-results-to-improve" },
        ]}
        toc={[
          { id: "the-test-farming-trap", label: "The test-farming trap" },
          { id: "the-four-step-loop", label: "The 4-step diagnostic loop" },
          { id: "interpreting-the-metrics", label: "Interpreting test metric patterns" },
          { id: "analyzing-keystroke-heatmaps", label: "Reading your error breakdowns" },
          { id: "actionable-next-steps", label: "Taking action in HeroTyping" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Diagnostic rule">
          <p>
            A typing test is a thermometer, not medicine. It tells you your current temperature, but it does not heal
            the illness. If you take 30 tests in a row without diagnosing and drilling your mistakes, you are simply
            rehearsing your existing flaws.
          </p>
        </Callout>

        <Image
          src="/guides/typing-tests-tools/how-to-use-typing-test-results-to-improve/typing-test-improvement-loop.webp"
          alt="Four-step diagnostic improvement loop converting typing test telemetry into targeted practice drills"
          width={1200}
          height={675}
          priority
          className="my-6 w-full rounded-xl border border-border shadow-sm"
        />

        <h2 id="the-test-farming-trap">The Test-Farming Trap</h2>
        <p>
          Every day, thousands of typists open a speed test, type for 60 seconds, score 58 WPM, grimace at the result,
          and immediately hit &quot;Restart.&quot; They do this 25 times until they hit a lucky test with easy words,
          score 67 WPM, smile, and close their browser.
        </p>
        <p>
          This common habit is known as <strong>test-farming</strong>. It treats typing tests as a slot machine, hoping
          for favorable random word sequences.
        </p>
        <p>
          The problem with test-farming is that testing only measures what you can already do. It places your nervous
          system under evaluative stress, which causes you to tense up and lean heavily on existing motor habits—including
          your worst ones. To actually increase your speed, you must convert testing into a diagnostic feedback mechanism.
        </p>

        <h2 id="the-four-step-loop">The 4-Step Diagnostic Action Loop</h2>
        <p>
          High-performance typists use a repeatable four-step loop that turns every test result into tangible skill gains:
        </p>

        <ol>
          <li>
            <strong>Step 1: The Diagnostic Test (2 minutes):</strong> Take a single, controlled 60- or 120-second test
            on the <Link href="/">HeroTyping Speed Test</Link>. Do not restart halfway through if you make a mistake;
            finish the run so the error is captured in your data log.
          </li>
          <li>
            <strong>Step 2: Error Pattern Isolation (1 minute):</strong> Look at the summary screen. Which specific
            words contained red letters? Did your consistency drop during a specific paragraph? What was the spread
            between your Raw WPM and Net WPM?
          </li>
          <li>
            <strong>Step 3: Targeted Remediation (10 minutes):</strong> Close the test screen. If you stumbled on
            reaches like <code>B</code> and <code>P</code>, launch the{" "}
            <Link href="/lessons/practice">HeroTyping Practice Lab</Link> to re-anchor those specific
            trajectories.
          </li>
          <li>
            <strong>Step 4: The Validation Retest (2 minutes):</strong> Return to the test. Verify whether your accuracy
            stabilized and whether the hesitation on your diagnosed bottleneck letters disappeared.
          </li>
        </ol>

        <h2 id="interpreting-the-metrics">Interpreting Test Metric Patterns</h2>
        <p>
          Your post-test dashboard contains four primary numbers: Net WPM, Raw WPM, Accuracy %, and Consistency %.
          The relationship between these numbers reveals your exact physiological bottleneck:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-sub-alt/40 border-b border-border">
                <th className="p-3 font-semibold text-foreground">Diagnostic Metric Pattern</th>
                <th className="p-3 font-semibold text-foreground">Underlying Root Cause</th>
                <th className="p-3 font-semibold text-foreground">Immediate Corrective Action Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              {METRIC_DIAGNOSTICS.map((item) => (
                <tr key={item.metricPattern} className="hover:bg-sub-alt/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{item.metricPattern}</td>
                  <td className="p-3 text-foreground/85 text-xs">{item.diagnosis}</td>
                  <td className="p-3 text-accent text-xs">{item.actionPlan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="analyzing-keystroke-heatmaps">Reading Your Error Breakdowns</h2>
        <p>
          Beyond raw numbers, examine the qualitative nature of your mistakes:
        </p>
        <ul>
          <li>
            <strong>Adjacent Key Slips:</strong> Typing <code>N</code> instead of <code>M</code> or <code>E</code>{" "}
            instead of <code>R</code> indicates that your finger angle is slightly off. Check whether your wrists are
            drifting outward (elbow flare).
          </li>
          <li>
            <strong>Late Backspaces:</strong> If you typed three characters past an error before noticing it, your
            visual feedback loop is delayed. Slow down your keystrokes to match your visual verification speed.
          </li>
          <li>
            <strong>Punctuation Stumbles:</strong> If your speed drops by 20 WPM whenever quotes or commas appear,
            schedule two sessions on our{" "}
            <Link href="/guides/punctuation-typing-practice">Punctuation Typing Practice</Link> guide.
          </li>
        </ul>

        <h2 id="actionable-next-steps">Taking Action in HeroTyping</h2>
        <p>
          Now that you know how to read your data, put the loop into practice today:
        </p>
        <ol>
          <li>
            Take a baseline test on the <Link href="/">HeroTyping Speed Test</Link>.
          </li>
          <li>
            If accuracy is under 95%, review <Link href="/guides/why-wpm-is-high-accuracy-is-low">Why WPM Is High but Accuracy Is Low</Link>.
          </li>
          <li>
            If consistency is under 70%, read <Link href="/guides/how-to-improve-typing-consistency">How to Improve Typing Consistency</Link>.
          </li>
          <li>
            If specific letters failed, jump straight into{" "}
            <Link href="/lessons/practice">Practice Lab Remediation Drills</Link>.
          </li>
        </ol>

        <FaqSection items={FAQ_ITEMS} />
        <SourceList sources={SOURCES} />
      </GuideLayout>
    </>
  );
}
