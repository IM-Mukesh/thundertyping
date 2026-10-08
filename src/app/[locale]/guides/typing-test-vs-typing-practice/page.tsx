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
  title: "Typing Test vs Typing Practice: What's the Difference and When to Use Each",
  description:
    "Discover the critical difference between typing tests (evaluative measurement) and typing practice (deliberate skill acquisition). Learn the optimal 80/20 training ratio.",
  path: "/guides/typing-test-vs-typing-practice",
});

const PUBLISHED = "2026-09-27";

const COMPARISON_MATRIX = [
  {
    dimension: "Core Purpose",
    typingTest: "Measurement & Evaluation: Records current speed, accuracy, and error rates under time pressure.",
    typingPractice: "Skill Acquisition & Correction: Remaps neural pathways, expands keyboard reach, and corrects specific errors.",
  },
  {
    dimension: "Cognitive State",
    typingTest: "High evaluative pressure, competitive anxiety, reliance on existing motor habits (good and bad).",
    typingPractice: "Low pressure, experimental, deliberate focus on finger micro-mechanics and posture.",
  },
  {
    dimension: "Speed Target",
    typingTest: "Maximum comfortable velocity (aiming for peak WPM without collapsing accuracy).",
    typingPractice: "Deliberately slow pace (50%–70% of peak speed) to ensure flawless 98%+ accuracy.",
  },
  {
    dimension: "Error Handling",
    typingTest: "Speed-penalty correction or skipping under running timer.",
    typingPractice: "Instant stop on mistake, diagnostic root-cause analysis, and slow deliberate retyping.",
  },
  {
    dimension: "Optimal Weekly Share",
    typingTest: "20% of total keyboard training time (e.g. 3–5 minutes per day).",
    typingPractice: "80% of total keyboard training time (e.g. 12–15 minutes per day).",
  },
];

const FAQ_ITEMS = [
  {
    question: "Why can't I improve my typing speed just by taking 50 typing tests a day?",
    answer:
      "Because a typing test only measures your current ability; it doesn't teach your fingers new habits. Taking 50 tests a day is like stepping on a bathroom scale 50 times hoping to lose weight. To improve, you must step off the scale and lift weights—which in typing means doing structured drills, fixing weak keys, and learning proper finger geometry.",
    plainAnswer:
      "Tests only evaluate what you already know. True improvement comes from deliberate practice: drilling weak keys, expanding finger reach, and perfecting rhythm.",
  },
  {
    question: "When should I take a typing test during my practice session?",
    answer:
      "Take one diagnostic test at the beginning of your session (after a 2-minute physical warmup) to establish a baseline, and take one final test at the end to evaluate progress. The middle 80% of your session should be devoted entirely to deliberate practice drills.",
    plainAnswer:
      "Take one test at the beginning as a benchmark and one at the end. Spend the vast majority of your session doing targeted practice.",
  },
  {
    question: "What is the biggest trap when doing typing practice?",
    answer:
      "The biggest trap is practicing too fast. Many typists treat practice drills like mini speed tests, rushing through them and making mistakes. Practice must be conducted at a deliberately relaxed, slow tempo where 98%+ accuracy is guaranteed.",
    plainAnswer:
      "Rushing through practice is the biggest mistake. Practice must be slow and accurate to imprint proper neuromuscular memory.",
  },
  {
    question: "How do I know when my practice is actually paying off in real speed?",
    answer:
      "Track your weekly rolling average Net WPM on 60-second tests. When your deliberate practice succeeds, you will notice that typing feels effortless, your consistency percentage rises above 80%, and your error count drops to 1 or 2 per minute.",
    plainAnswer:
      "Watch your 7-day average WPM and error rates. When practice works, typing feels effortless and consistency percentages climb steadily.",
  },
];

const SOURCES: never[] = [];

export default function TypingTestVsTypingPracticePage() {
  const schema = buildArticleSchema({
    headline: "Typing Test vs Typing Practice: What's the Difference and When to Use Each",
    description:
      "Discover the critical difference between typing tests (evaluative measurement) and typing practice (deliberate skill acquisition). Learn the optimal 80/20 training ratio.",
    path: "/guides/typing-test-vs-typing-practice",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Typing Test vs Typing Practice"
        subtitle="Why taking endless speed tests causes plateaus, and how to harness the 80/20 rule of deliberate practice."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Typing Practice", path: "/guides/typing-practice" },
          { name: "Test vs Practice", path: "/guides/typing-test-vs-typing-practice" },
        ]}
        toc={[
          { id: "the-fundamental-difference", label: "The fundamental distinction" },
          { id: "comparison-matrix", label: "Side-by-side comparison" },
          { id: "the-test-farming-plateau", label: "Why testing causes plateaus" },
          { id: "the-80-20-ratio", label: "The 80/20 training ratio" },
          { id: "how-to-balance-in-herotyping", label: "Balancing both in HeroTyping" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Core principle">
          <p>
            A <strong>typing test</strong> evaluates your current performance under pressure. A <strong>practice session</strong>{" "}
            builds new neural connections and repairs mechanical flaws. If 90% of your keyboard time is spent taking tests,
            you will plateau within weeks. Apply the 80/20 rule: 80% deliberate practice, 20% testing.
          </p>
        </Callout>

        <Image
          src="/guides/typing-practice/typing-test-vs-typing-practice/test-vs-practice-comparison.webp"
          alt="Side-by-side comparison diagram illustrating the difference between evaluative testing and deliberate skill practice"
          width={1200}
          height={675}
          priority
          className="my-6 w-full rounded-xl border border-border shadow-sm"
        />

        <h2 id="the-fundamental-difference">The Fundamental Distinction</h2>
        <p>
          In the world of keyboard training, the words <em>testing</em> and <em>practicing</em> are frequently treated
          as synonyms. People say: <em>&quot;I practiced typing for 20 minutes today,&quot;</em> when what they actually
          did was take twenty consecutive 60-second speed tests.
        </p>
        <p>
          This confusion is the number one cause of long-term speed plateaus.
        </p>
        <p>
          In sports science, an athlete does not prepare for a marathon by running a full marathon every single morning.
          A sprinter does not prepare for an Olympic final by doing thirty 100-meter sprints back to back. Instead, they
          spend 80% of their time on deliberate sub-skills: mobility drills, strength training, cadence intervals, and
          technique refinement. The race itself is merely the evaluative event.
        </p>
        <p>
          Typing follows similar skill-building patterns. Testing measures your existing capacity; deliberate practice
          builds new capacity.
        </p>

        <h2 id="comparison-matrix">Side-by-Side Comparison Matrix</h2>
        <p>
          Review how typing tests and typing practice differ across every critical dimension:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-sub-alt/40 border-b border-border">
                <th className="p-3 font-semibold text-foreground">Dimension</th>
                <th className="p-3 font-semibold text-foreground">Typing Test</th>
                <th className="p-3 font-semibold text-foreground">Typing Practice</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              {COMPARISON_MATRIX.map((item) => (
                <tr key={item.dimension} className="hover:bg-sub-alt/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{item.dimension}</td>
                  <td className="p-3 text-sub text-xs">{item.typingTest}</td>
                  <td className="p-3 text-foreground/85 text-xs">{item.typingPractice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="the-test-farming-plateau">Why Endless Testing Causes Plateaus</h2>
        <p>
          When you take a typing test, a timer counts down on the screen. The presence of the clock immediately triggers
          mild autonomic arousal: your heart rate elevates, your forearm muscles tense slightly, and your brain prioritizes
          speed over exploration.
        </p>
        <p>
          Under this stress, your nervous system automatically defaults to its most ingrained motor pathways. If you have
          a bad habit—such as pecking the <code>B</code> key with your right hand or flying your wrists off the home row—the
          stress of a test forces you to use that bad habit because it feels familiar in the moment.
        </p>
        <p>
          By taking test after test, you literally rehearse and solidify your existing technical limitations. You cannot
          fix a motor flaw while under the pressure of the clock that created the flaw in the first place.
        </p>

        <h2 id="the-80-20-ratio">The 80/20 Training Ratio</h2>
        <p>
          To achieve consistent, compounding WPM gains, structure your training around the <strong>80/20 Rule</strong>:
        </p>
        <ul>
          <li>
            <strong>80% Deliberate Practice (12–15 Minutes):</strong> Spend this time on un-timed or slow-tempo
            activities: working through the <Link href="/lessons">Curriculum Lessons</Link>, drilling diagnosed{" "}
            <Link href="/lessons/practice">Weak Keys</Link>, practicing difficult rows, or typing domain-specific syntax
            in Custom Mode.
          </li>
          <li>
            <strong>20% Evaluative Testing (3 Minutes):</strong> Dedicate this time to one or two 60-second runs on the{" "}
            <Link href="/">Speed Test</Link> to measure progress, benchmark consistency, and uncover new diagnostic error
            patterns.
          </li>
        </ul>

        <h2 id="how-to-balance-in-herotyping">Balancing Both in HeroTyping</h2>
        <p>
          HeroTyping is intentionally designed to provide both halves of this equation in one place:
        </p>
        <ol>
          <li>
            <strong>For Practice:</strong> Work through the <Link href="/lessons">28-unit, 3-tier Curriculum</Link> and the adaptive{" "}
            <Link href="/lessons/practice">Practice Lab</Link> to systematically build clean motor memory without timer pressure.
          </li>
          <li>
            <strong>For Testing:</strong> Use the <Link href="/">HeroTyping Speed Test</Link> to evaluate your Net WPM,
            accuracy, and consistency metrics under realistic conditions.
          </li>
        </ol>

        <FaqSection items={FAQ_ITEMS} />
        <SourceList sources={SOURCES} />
      </GuideLayout>
    </>
  );
}
