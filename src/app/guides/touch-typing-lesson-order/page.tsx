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
    "The pedagogical curriculum order for learning to touch type: why small symmetrical key pairs come first, how consolidation units work, and how HeroTyping sequences all 28 units.",
  path: "/guides/touch-typing-lesson-order",
});

const PUBLISHED = "2026-09-27";
const UPDATED = "2026-09-28";

interface CurriculumStage {
  stage: string;
  units: string;
  keys: string;
  pedagogicalRationale: string;
}

const CURRICULUM_STAGES: CurriculumStage[] = [
  {
    stage: "Stage 1: Home-Row Anchors & Symmetrical Pairs",
    units: "Units 1–5",
    keys: "F & J, D & K, S & L, A & ;, G & H",
    pedagogicalRationale:
      "Begins with the raised tactile bumps on F and J, establishing fixed physical reference points. Expands outward symmetrically across both hands so neither hand is neglected, introducing semicolon (;) as the right pinky home position.",
  },
  {
    stage: "Stage 2: First Consolidation — Home Row Mastery",
    units: "Unit 6",
    keys: "All 10 Home-Row Keys (A S D F G H J K L ;)",
    pedagogicalRationale:
      "Introduces zero new keys. Instead, students practice real English words (all, fall, salad, flask, glad, dash) to solidify home-row transitions before reaching to other rows.",
  },
  {
    stage: "Stage 3: Top-Row Vowel & Consonant Reaches",
    units: "Units 7–11",
    keys: "E & I, R & U, T & Y, W & O, Q & P",
    pedagogicalRationale:
      "E and I are introduced first because they are the two most common vowels in English. Reaches are paired symmetrically between left and right hands, preserving home anchor contact throughout.",
  },
  {
    stage: "Stage 4: Upper-Deck & Home Consolidation",
    units: "Unit 12",
    keys: "All 20 Home & Top Keys",
    pedagogicalRationale:
      "Consolidates two full rows across natural words and common bigrams (th, er, on, re), eliminating hesitation when moving vertically between home and top rows.",
  },
  {
    stage: "Stage 5: Bottom-Row Downward Curls",
    units: "Units 13–16",
    keys: "V & M, C & comma, X & period, Z & slash",
    pedagogicalRationale:
      "Downward finger curling requires delicate wrist clearance. Introduced only after upward reaches are automated, pairing basic punctuation (comma, period, slash) alongside consonants.",
  },
  {
    stage: "Stage 6: Alphabet Complete Checkpoint",
    units: "Unit 17",
    keys: "B & N (All 26 letters unlocked)",
    pedagogicalRationale:
      "B and N represent the longest inward reaching stretches on the bottom deck. Unlocking them completes all 26 letters of the English alphabet, marking the end of the Beginner Tier.",
  },
  {
    stage: "Stage 7: Shift Mechanics & Natural Sentences",
    units: "Unit 18",
    keys: "Dual Shift keys + Full Capitalization",
    pedagogicalRationale:
      "Enforces the opposite-hand Shift rule (Left Shift for right-hand letters, Right Shift for left-hand letters) to prevent hand twisting while typing capitalized English prose.",
  },
  {
    stage: "Stage 8: Number Row Paired Reaches",
    units: "Units 19–23",
    keys: "4 & 7, 3 & 8, 2 & 9, 1 & 0, 5 & 6",
    pedagogicalRationale:
      "Two-row vertical reaches require absolute anchor stability. Keys are taught in symmetrical pairs from the center index reaches outward, culminating in Unit 23's numbers checkpoint.",
  },
  {
    stage: "Stage 9: Advanced Practical Syntax & Graduation",
    units: "Units 24–28",
    keys: "Symbols (! ? ' \" : -), Bigrams, Stamina, Code Syntax",
    pedagogicalRationale:
      "Transitions students from raw key acquisition to professional real-world stamina, technical code syntax ({ } [ ] = =>), and the comprehensive graduation assessment.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Why does HeroTyping introduce keys two at a time rather than an entire row at once?",
    answer:
      "Learning an entire row of eight to ten keys at once overwhelms working memory. When students try to memorize multiple new keys simultaneously, they cannot attribute errors to a specific finger and instinctively look down. Introducing a maximum of two keys per unit ensures immediate repetition, crystal-clear feedback, and zero cognitive overload.",
    plainAnswer:
      "Two keys at a time prevents working memory overload, allows immediate high-frequency practice, and makes errors easy to identify and fix.",
  },
  {
    question: "Why is semicolon (;) taught as a home-row key rather than punctuation?",
    answer:
      "On standard ANSI QWERTY keyboards, the right pinky naturally rests on the semicolon key in home position. Learning where your pinky sits physically is distinct from learning how to punctuate complex sentences. Semicolon is taught in Unit 4 strictly as the physical anchor for the right pinky.",
    plainAnswer:
      "Semicolon is where the right pinky rests on the home row. It is learned early for physical finger placement, not sentence grammar.",
  },
  {
    question: "Why does the top row come before the bottom row?",
    answer:
      "Extending fingers upward to the top row is biomechanically more natural than curling them tightly downward toward the palm. In addition, the top row contains four high-frequency vowels (E, U, I, O) and major consonants (R, T). Combining top-row letters with home-row keys unlocks thousands of real English words immediately.",
    plainAnswer:
      "Extending fingers upward is biomechanically easier than curling them downward, and the top row contains essential vowels like E, I, O, and U.",
  },
  {
    question: "What accuracy score do I need to advance to the next lesson?",
    answer:
      "In HeroTyping, the universal pass threshold is 60% accuracy (which awards 3 stars). Scoring below 60% awards 1 or 2 stars and gently requires a retry with targeted finger tips. Reaching 88%+ awards 4 stars, while 94%+ with 25+ WPM awards 5 stars. You do not need 100% perfection to move forward, but you must demonstrate controlled finger paths.",
    plainAnswer:
      "You need 60% accuracy (3+ stars) to advance. Below 60% requires a retry with feedback. Aim for 88%+ to earn 4 or 5 stars.",
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
      "The pedagogical curriculum order for learning to touch type: why small symmetrical key pairs come first, how consolidation units work, and how HeroTyping sequences all 28 units.",
    path: "/guides/touch-typing-lesson-order",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Touch Typing Lesson Order"
        subtitle="The pedagogical rationale behind HeroTyping's 28-unit sequence: small key pairs, symmetrical hand balance, and periodic consolidation."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Typing Basics", path: "/guides/typing-basics" },
          { name: "Touch Typing Lesson Order", path: "/guides/touch-typing-lesson-order" },
        ]}
        toc={[
          { id: "sequencing-science", label: "The science of curriculum sequence" },
          { id: "small-key-rule", label: "The two-key maximum rule" },
          { id: "nine-stages", label: "The 9 curriculum stages" },
          { id: "consolidation-units", label: "Why consolidation stops matter" },
          { id: "progression-rules", label: "When to advance: star ratings" },
          { id: "three-tiers", label: "The 3 skill tiers in HeroTyping" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Core curriculum design">
          <p>
            Never try to memorize an entire keyboard row in one sitting. Motor skill acquisition requires sequential
            chunking: master tactile index anchors first (F and J), expand outward in symmetrical pairs, consolidate
            learned keys through real words, and only introduce number rows and complex punctuation once the alphabetic
            map is completely automated.
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

        <h2 id="sequencing-science">The Science of Curriculum Sequencing</h2>
        <p>
          Learning to touch type is not simply memorizing where 26 letters sit on plastic keycaps. It is the gradual
          encoding of an unconscious sensorimotor map in your motor cortex.
        </p>
        <p>
          When beginners attempt to practice by typing full paragraphs immediately, working memory is overwhelmed.
          The brain must simultaneously decide which hand to move, which finger to extend, how far to reach, and whether
          to press Shift. Under this cognitive strain, learners instinctively look down at the keyboard and revert to
          hunting and pecking with two fingers.
        </p>
        <p>
          A well-structured curriculum prevents this regression by strictly constraining variables. Each step introduces
          a manageable tactile challenge, allowing new finger reaches to anchor onto previously solidified muscle memory.
        </p>

        <h2 id="small-key-rule">The Two-Key Maximum Rule: Why Small Groups Win</h2>
        <p>
          Traditional keyboarding curricula frequently introduced four to eight keys simultaneously (such as teaching
          all left-hand home-row keys <code>A S D F</code> in a single lesson, followed by <code>J K L ;</code> in the next).
        </p>
        <p>
          HeroTyping intentionally abandons the old &quot;row-by-row&quot; batch model in favor of <strong>symmetrical
          two-key pairings</strong>:
        </p>
        <ul>
          <li><strong>Unit 1:</strong> <code>F</code> (left index) and <code>J</code> (right index) — the tactile anchor bumps.</li>
          <li><strong>Unit 2:</strong> <code>D</code> (left middle) and <code>K</code> (right middle).</li>
          <li><strong>Unit 3:</strong> <code>S</code> (left ring) and <code>L</code> (right ring).</li>
          <li><strong>Unit 4:</strong> <code>A</code> (left pinky) and <code>;</code> (right pinky).</li>
          <li><strong>Unit 5:</strong> <code>G</code> (left index reach) and <code>H</code> (right index reach).</li>
        </ul>
        <p>
          Introducing keys in balanced pairs across both hands trains bilateral hand coordination from day one. Neither
          hand is left dormant, and students immediately experience natural left-right hand alternation.
        </p>

        <h2 id="nine-stages">The 9 Curriculum Stages in HeroTyping</h2>
        <p>
          Here is how the complete 28-unit journey is structured:
        </p>

        <div className="overflow-x-auto my-4">
          <table className="w-full text-left border-collapse border border-border text-sm">
            <thead>
              <tr className="bg-sub-alt/40 border-b border-border">
                <th className="p-3 font-semibold text-foreground">Stage</th>
                <th className="p-3 font-semibold text-foreground">Units</th>
                <th className="p-3 font-semibold text-foreground">Keys Covered</th>
                <th className="p-3 font-semibold text-foreground">Pedagogical Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {CURRICULUM_STAGES.map((s) => (
                <tr key={s.stage} className="hover:bg-sub-alt/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{s.stage}</td>
                  <td className="p-3 font-mono text-xs text-accent whitespace-nowrap">{s.units}</td>
                  <td className="p-3 font-mono text-xs text-sub">{s.keys}</td>
                  <td className="p-3 text-xs leading-relaxed text-foreground/85">{s.pedagogicalRationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="consolidation-units">Why Periodic Consolidation Units Matter</h2>
        <p>
          Learning motor patterns requires consolidation stops. If a curriculum only adds new keys without structured
          review, previously introduced keys fade from working memory.
        </p>
        <p>
          HeroTyping embeds four dedicated consolidation checkpoints:
        </p>
        <ul>
          <li>
            <strong>Unit 6 (Home Row Mastery):</strong> Zero new keys. Students practice real English words formed entirely
            from the 10 home keys (such as <em>ask, dad, fall, salad, flask, glad, dash</em>).
          </li>
          <li>
            <strong>Unit 12 (Top &amp; Home Rows):</strong> Consolidates 20 keys across natural bigrams (th, er, on, re)
            before introducing bottom-row finger curls.
          </li>
          <li>
            <strong>Unit 17 (Alphabet Complete):</strong> Unlocks B and N, verifying full 26-letter alphabetic mastery.
          </li>
          <li>
            <strong>Unit 23 (Numbers Checkpoint):</strong> Unlocks 5 and 6, solidifying two-row vertical reaching across
            the entire numeric deck.
          </li>
        </ul>

        <h2 id="progression-rules">When to Advance: Star Ratings &amp; The 60% Gate</h2>
        <p>
          Earlier typing tools often enforced rigid 90% or 95% pass walls that frustrated beginners and caused sudden,
          jarring restarts after a few errors.
        </p>
        <p>
          HeroTyping uses a clear, transparent progression rule:
        </p>
        <ul>
          <li>
            <strong>60% Accuracy Minimum (3+ Stars):</strong> You must achieve at least 60% accuracy to unlock the next
            lesson step. This ensures you have acquired basic finger orientation without penalizing early exploration.
          </li>
          <li>
            <strong>Under 60% Accuracy (1–2 Stars):</strong> The lesson modal pauses calmly (no surprise restarts) and
            displays an honest summary of your mistakes, highlighting which specific keys slipped and offering finger
            placement tips before you retry.
          </li>
          <li>
            <strong>4 Stars (88%+ Accuracy):</strong> Reflects strong, controlled rhythm.
          </li>
          <li>
            <strong>5 Stars (94%+ Accuracy &amp; 25+ WPM):</strong> Represents mastery-level speed and precision (or 98%+
            accuracy in beginner drills).
          </li>
        </ul>

        <h2 id="three-tiers">The 3 Skill Tiers in HeroTyping</h2>
        <p>
          To provide clear progression milestones, the 28 units are divided into three natural skill tiers:
        </p>
        <ul>
          <li>
            <strong>Beginner Tier (Units 1–17):</strong> Focuses on foundational tactile anchors, home-row pairs, top-row
            reaches, bottom-row curls, and alphabet completion (B &amp; N).
          </li>
          <li>
            <strong>Intermediate Tier (Units 18–23):</strong> Introduces opposite-hand Shift mechanics, sentence
            capitalization, and paired reaches across the number row (1–0).
          </li>
          <li>
            <strong>Advanced Tier (Units 24–28):</strong> Challenges your skills with practical symbols (! ? &apos; &quot; : -),
            high-frequency bigrams, paragraph stamina, developer code syntax, and the final graduation assessment.
          </li>
        </ul>

        <p>
          Ready to begin? Visit the complete <Link href="/lessons">HeroTyping Lessons Dashboard</Link> to start with
          Unit 1 (Home Row: F &amp; J Anchors), or take the diagnostic placement test to skip directly to your current skill level.
        </p>

        <FaqSection items={FAQ_ITEMS} />
        <SourceList sources={SOURCES} />

        <p className="text-xs text-sub/70">Last updated {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}
