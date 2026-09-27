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
  title: "Touch Typing Lesson Order: What to Learn First, Next, and Why",
  description:
    "The scientifically proven curriculum order for learning to touch type: why home row comes first, when to introduce numbers and symbols, and how to structure your learning.",
  path: "/guides/touch-typing-lesson-order",
});

const PUBLISHED = "2026-09-27";

const CURRICULUM_PHASES = [
  {
    phase: "Phase 1: Home Row Foundation",
    keys: "A, S, D, F, J, K, L, ;",
    cognitiveGoal: "Establish tactile indexing on F and J bumps. Eliminate looking down at the keyboard.",
    typicalDuration: "Days 1–5 (3 to 5 hours total)",
    heroLessonRef: "Lessons 1–4 (Home Row Left, Right, Combined, Words)",
  },
  {
    phase: "Phase 2: Top Row Expansion",
    keys: "Q, W, E, R, T, Y, U, I, O, P",
    cognitiveGoal: "Learn upward diagonal reaches while preserving home-row anchor contact.",
    typicalDuration: "Days 6–12 (4 to 6 hours total)",
    heroLessonRef: "Lessons 5–8 (Top Row Left, Right, Combined, Words)",
  },
  {
    phase: "Phase 3: Bottom Row & Full Alphabet",
    keys: "Z, X, C, V, B, N, M",
    cognitiveGoal: "Master downward finger curling without planting wrists on the desk surface.",
    typicalDuration: "Days 13–20 (5 to 7 hours total)",
    heroLessonRef: "Lessons 9–12 & Beginner Checkpoint (Lesson 17)",
  },
  {
    phase: "Phase 4: Numeric Row & Common Punctuation",
    keys: "1–0, Period, Comma, Apostrophe, Question Mark",
    cognitiveGoal: "Extend spatial map to two-row reaches and coordinate opposite-hand Shift keystrokes.",
    typicalDuration: "Days 21–30 (6 to 8 hours total)",
    heroLessonRef: "Lessons 13–16 (Numbers, Punctuation)",
  },
  {
    phase: "Phase 5: Speed, Endurance & Code Mastery",
    keys: "All alphanumeric + shift symbols (!@#$%^&*()_+) and syntax",
    cognitiveGoal: "Sub-word chunking, rapid word flow, and fatigue resistance during long sessions.",
    typicalDuration: "Day 31+ (Ongoing maintenance)",
    heroLessonRef: "Lessons 18–28 (Speed, Endurance, Checkpoints, Final Challenge)",
  },
];

const FAQ_ITEMS = [
  {
    question: "Why should I learn the home row before anything else?",
    answer:
      "The home row is your keyboard anchor. The tactile bumps on 'F' and 'J' give your hands a fixed physical reference point in space. Without an established home-row resting position, your hands float across the keyboard, forcing your eyes to constantly look down to locate each key.",
    plainAnswer:
      "Home row keys provide the physical reference coordinates for every other key reach. Without mastering them first, blind touch typing is impossible.",
  },
  {
    question: "Should I learn letters and numbers at the same time?",
    answer:
      "No. Introducing numbers too early creates severe cognitive overload. The number row is two full rows above the home row and requires long reaches. You must automate the 26 alphabetic keys until blind typing is effortless before introducing numbers and Shift symbols.",
    plainAnswer:
      "No. Master the alphabet first. Reaching for the number row requires stable anchor discipline that only develops after alphabetic keys are automated.",
  },
  {
    question: "Why does the top row usually come before the bottom row?",
    answer:
      "Bioméchanically, extending fingers upward into the top row is more natural for human hand anatomy than curling fingers tightly backward into the palm for the bottom row. Furthermore, top-row vowels ('E', 'I', 'O', 'U') and consonants ('T', 'R') account for over 45% of English letters, allowing beginners to construct real words immediately.",
    plainAnswer:
      "Extending fingers upward is biomechanically easier than curling them downward, and the top row contains essential vowels like E, I, O, and U.",
  },
  {
    question: "How long should I stay on each curriculum phase?",
    answer:
      "Do not advance to the next row until you achieve at least 95% accuracy on your current row's exercises. Speed does not matter initially—whether you type at 15 WPM or 35 WPM, flawless accuracy and zero glances at the keyboard are the true criteria for advancing.",
    plainAnswer:
      "Advance only when you maintain 95%+ accuracy without glancing down. Speed will develop naturally once finger accuracy is locked in.",
  },
];

const SOURCES = [
  {
    title: "Cognitive Load Theory and the Acquisition of Complex Perceptual-Motor Skills",
    author: "Sweller, J., van Merriënboer, J. J., & Paas, F. (Educational Psychology Review, 1998)",
    url: "https://doi.org/10.1023/A:1022193728205",
  },
  {
    title: "Cortical Representation of Hand and Finger Movements in Skilled Typists",
    author: "Karni, A., et al. (Nature, 1995)",
    url: "https://doi.org/10.1038/377155a0",
  },
  {
    title: "Curriculum Design in Psychomotor Education: A Taxonomic Approach",
    author: "Singer, R. N. (Journal of Physical Education, Recreation & Dance, 1980)",
    url: "https://doi.org/10.1080/07303084.1980.10629731",
  },
];

export default function TouchTypingLessonOrderPage() {
  const schema = buildArticleSchema({
    headline: "Touch Typing Lesson Order: What to Learn First, Next, and Why",
    description:
      "The scientifically proven curriculum order for learning to touch type: why home row comes first, when to introduce numbers and symbols, and how to structure your learning.",
    path: "/guides/touch-typing-lesson-order",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Touch Typing Lesson Order"
        subtitle="The optimal curriculum sequence for learning to touch type without cognitive overload or bad habits."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Typing Basics", path: "/guides/typing-basics" },
          { name: "Touch Typing Lesson Order", path: "/guides/touch-typing-lesson-order" },
        ]}
        toc={[
          { id: "the-science-of-sequencing", label: "The science of curriculum sequence" },
          { id: "five-curriculum-phases", label: "The five curriculum phases" },
          { id: "why-order-matters", label: "Why random order fails" },
          { id: "milestone-progression", label: "When to advance: accuracy gates" },
          { id: "herotyping-curriculum", label: "The HeroTyping 28-lesson path" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Curriculum principle">
          <p>
            Never attempt to learn the entire keyboard simultaneously. Motor skill acquisition requires sequential
            chunking: master the home-row anchors first, expand upward to high-frequency top vowels, master downward
            curls, and only then introduce the cognitive demand of numbers and Shift symbols.
          </p>
        </Callout>

        <Image
          src="/guides/typing-basics/touch-typing-lesson-order/touch-typing-curriculum-flow.webp"
          alt="Touch typing curriculum progression flowchart showing Home Row, Top Row, Bottom Row, Numbers, and Speed Endurance"
          width={1200}
          height={675}
          priority
          className="my-6 w-full rounded-xl border border-border shadow-sm"
        />

        <h2 id="the-science-of-sequencing">The Science of Curriculum Sequencing</h2>
        <p>
          Learning to touch type is not merely memorizing where 26 letters live on a piece of plastic. It is the
          construction of an unconscious sensorimotor map inside your brain&apos;s motor cortex.
        </p>
        <p>
          When beginners try to learn by typing general paragraphs immediately, their working memory is flooded.
          They must decide which hand to use, which finger to extend, how far to reach, and whether to hold Shift—all
          while trying to read text on a screen. Under this cognitive overload, the brain instinctively reverts to what
          feels easiest: looking down at the keyboard and hunting with two index fingers.
        </p>
        <p>
          A well-designed typing curriculum prevents this regression by strictly limiting new variables. You master
          one row at a time, anchoring new finger reaches onto previously solidified tactile coordinates.
        </p>

        <h2 id="five-curriculum-phases">The Five Progressive Curriculum Phases</h2>
        <p>
          Every competent typist follows an identifiable progression from physical anchoring to unconscious flow.
          Here is how the standard curriculum is broken down:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-sub-alt/40 border-b border-border">
                <th className="p-3 font-semibold text-foreground">Curriculum Phase</th>
                <th className="p-3 font-semibold text-foreground">Keys Covered</th>
                <th className="p-3 font-semibold text-foreground">Core Biomechanical Goal</th>
                <th className="p-3 font-semibold text-foreground">HeroTyping Curriculum</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              {CURRICULUM_PHASES.map((p) => (
                <tr key={p.phase} className="hover:bg-sub-alt/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{p.phase}</td>
                  <td className="p-3 font-mono text-xs text-sub">{p.keys}</td>
                  <td className="p-3 text-foreground/85">{p.cognitiveGoal}</td>
                  <td className="p-3 text-accent">{p.heroLessonRef}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="why-order-matters">Why Alternative Orders Fail</h2>
        <p>
          Learners frequently ask whether they can start with the top row because &quot;QWERTY starts at the top,&quot;
          or whether they should learn all vowels first. Educational research consistently shows these alternative
          approaches fail for two distinct biomechanical reasons:
        </p>

        <ul>
          <li>
            <strong>Loss of Tactile Homing:</strong> Only two keys on the standard keyboard have raised tactile bumps:
            <code>F</code> and <code>J</code>. Both live on the home row. If you start with any other row, your hands
            have zero tactile feedback to re-center themselves after striking a key, forcing you to look down.
          </li>
          <li>
            <strong>Cortical Representation:</strong> In human neuroanatomy, your index and middle fingers have far
            larger motor representations in the brain than your ring and pinky fingers. Starting with index-finger
            anchors (<code>F</code> and <code>J</code>) builds immediate success, whereas starting with pinky reaches
            (<code>Q</code>, <code>P</code>, <code>Z</code>) triggers early hand fatigue and frustration.
          </li>
        </ul>

        <h2 id="milestone-progression">When to Advance: The 95% Accuracy Gate</h2>
        <p>
          The single most common mistake in learning to type is rushing ahead to new lessons before your previous
          keys are automated.
        </p>
        <p>
          Use this simple rule: <strong>Do not advance to a new lesson until you pass the current one with at least
          95% accuracy across three consecutive runs.</strong>
        </p>
        <p>
          If your accuracy on the home row is 88%, advancing to the top row does not teach you the top row—it merely
          compounds your home-row uncertainty. Speed is completely irrelevant during the first three phases. A learner
          who types at 18 WPM with 99% accuracy will surpass a learner who types at 35 WPM with 85% accuracy within
          three weeks.
        </p>

        <h2 id="herotyping-curriculum">The HeroTyping 28-Lesson Structured Path</h2>
        <p>
          To make this curriculum effortless to follow, HeroTyping organizes keyboard learning into a cohesive,
          28-lesson progression structured across three natural skill tiers:
        </p>

        <ul>
          <li>
            <strong>Beginner Tier (Lessons 1–17):</strong> Covers the Home Row (1–4), Top Row (5–8), Bottom Row (9–12),
            Numbers Low/High (13–14), Full Keyboard Words (15), Punctuation (16), and the culminating Beginner
            Checkpoint (Lesson 17).
          </li>
          <li>
            <strong>Intermediate Tier (Lessons 18–23):</strong> Focuses on everyday sentences, rhythm building, mixed
            alphanumeric practice, longer paragraphs, and the Intermediate Checkpoint (Lesson 23).
          </li>
          <li>
            <strong>Advanced Tier (Lessons 24–28):</strong> Challenges your speed endurance, high-pressure precision,
            long-form typing, advanced numbers and symbols mastery, and the Final Graduation Challenge (Lesson 28).
          </li>
        </ul>

        <p>
          Ready to begin? Visit the complete <Link href="/lessons">HeroTyping Lessons Dashboard</Link> to start with
          Lesson 1, or take the skill placement test to jump in at your current competency level.
        </p>

        <FaqSection items={FAQ_ITEMS} />
        <SourceList sources={SOURCES} />
      </GuideLayout>
    </>
  );
}
