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
  title: "Typing Practice for Weak Keys: How to Fix the Letters Slowing You Down",
  description:
    "A deliberate motor practice system for weak typing keys. Learn bigram anchoring, word embedding drills, and pacing protocols to fix problem letters permanently.",
  path: "/guides/typing-practice-for-weak-keys",
});

const PUBLISHED = "2026-09-27";

const BIGRAM_DRILL_TABLE = [
  {
    targetKey: "P (Right Pinky Top Reach)",
    troublesomeBigrams: "pl, pr, sp, mp, op, ep",
    embeddedWords: "play, crisp, jump, proper, apple, simple",
    sentenceDrill: "People prepare practical plans for simple projects.",
  },
  {
    targetKey: "B (Left Index Long Reach)",
    troublesomeBigrams: "bl, br, mb, ob, ab, be",
    embeddedWords: "blank, bright, timber, cable, about, better",
    sentenceDrill: "Brave brothers build bright boats by the blue bay.",
  },
  {
    targetKey: "X (Left Ring Down Reach)",
    troublesomeBigrams: "ex, ax, xt, xp, xc, ox",
    embeddedWords: "exact, toxic, next, expect, excel, oxygen",
    sentenceDrill: "Extra foxes examine the next complex text with care.",
  },
  {
    targetKey: "Q (Left Pinky Up-Left Stretch)",
    troublesomeBigrams: "qu, sq, eq",
    embeddedWords: "quick, square, equal, quiet, squad, equip",
    sentenceDrill: "The quick queen requested equal quiet across the squad.",
  },
  {
    targetKey: "; (Right Pinky Home Key)",
    troublesomeBigrams: ";[space], ;[newline]",
    embeddedWords: "list; item; code; data; output;",
    sentenceDrill: "Review each item; verify the data; confirm the outcome.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Why does typing the same weak letter over and over (like 'pppppppp') fail to work?",
    answer:
      "Typing a single key in isolation requires no spatial movement or contextual finger transitions. In real typing, you never press 'P' alone; you transition into it from another finger (such as 'S' or 'O') and transition out of it to the next key. True muscle memory lives in the transition between keys (bigrams and trigrams), not in the stationary key strike itself.",
    plainAnswer:
      "Isolated repetition removes the physical transitions between keys. Motor memory relies on moving to and from surrounding letters in real words.",
  },
  {
    question: "How slow should I type during weak-key drills?",
    answer:
      "Drop your speed by roughly 40% to 50% of your maximum WPM. If you normally type at 70 WPM, conduct your weak-key drills at 35 to 40 WPM. The purpose of the drill is to imprint a completely clean, effortless motor path into your cortex without hesitation or muscular tension.",
    plainAnswer:
      "Slow down to about half your peak speed. Slow, rhythmic repetition allows the brain to replace faulty movement habits with flawless motor trajectories.",
  },
  {
    question: "How long does it take to fix a stubborn weak key?",
    answer:
      "Most typists resolve a diagnosed weak key within 3 to 5 consecutive days of deliberate 10-minute daily practice. Because you are targeting a specific neural motor sequence rather than general typing, progress occurs remarkably fast once targeted bigrams are practiced.",
    plainAnswer:
      "With 10 minutes of daily targeted bigram and word drills, most problem keys stabilize at 95%+ accuracy within 3 to 5 days.",
  },
  {
    question: "When should I graduate a weak key back to regular typing?",
    answer:
      "Graduate the key when you can complete three consecutive drills containing the target key with at least 98% accuracy and zero hesitation pauses. In HeroTyping, the key performance tracker evaluates a rolling 20-attempt buffer. As you log clean repetitions, old errors cycle out, and once accuracy across 6+ attempts rises above 90%, the key graduates and is cleared from the struggling queue.",
    plainAnswer:
      "Retire the dedicated drill once you maintain 98%+ accuracy across three consecutive runs without hesitation pauses before striking the letter.",
  },
];

const SOURCES = [
  {
    title: "Contextual Interference Effects in Motor Skill Acquisition",
    author: "Magill, R. A., & Hall, K. G. (Perceptual and Motor Skills, 1990)",
    url: "https://doi.org/10.2466/pms.1990.70.3c.1243",
  },
  {
    title: "Deliberate Practice and the Acquisition of Expert Performance",
    author: "Ericsson, K. A., Krampe, R. T., & Tesch-Römer, C. (Psychological Review, 1993)",
    url: "https://doi.org/10.1037/0033-295X.100.3.363",
  },
  {
    title: "The Role of Sub-word Chunking and Bigram Frequency in Touch Typing",
    author: "Gentner, D. R. (Cognitive Science, 1983)",
    url: "https://doi.org/10.1207/s15516709cog0703_2",
  },
];

export default function TypingPracticeForWeakKeysPage() {
  const schema = buildArticleSchema({
    headline: "Typing Practice for Weak Keys: How to Fix the Letters Slowing You Down",
    description:
      "A deliberate motor practice system for weak typing keys. Learn bigram anchoring, word embedding drills, and pacing protocols to fix problem letters permanently.",
    path: "/guides/typing-practice-for-weak-keys",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Typing Practice for Weak Keys"
        subtitle="A proven, 3-tier training method to eliminate the bottleneck letters dragging down your speed and accuracy."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Typing Practice", path: "/guides/typing-practice" },
          { name: "Typing Practice for Weak Keys", path: "/guides/typing-practice-for-weak-keys" },
        ]}
        toc={[
          { id: "the-isolation-trap", label: "The repetitive isolation trap" },
          { id: "three-tier-method", label: "The 3-tier training method" },
          { id: "bigram-drill-templates", label: "Targeted bigram drill templates" },
          { id: "pacing-and-progression", label: "Pacing & progression rules" },
          { id: "practice-workflow", label: "Your daily 10-minute workflow" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Practice rule">
          <p>
            Do not drill problem letters by mashing them repeatedly in isolation. Muscle memory does not store
            keys in isolation; it stores transitions between letters. Practice your weak keys embedded inside
            high-frequency bigrams, real words, and natural sentences.
          </p>
        </Callout>

        <Image
          src="/guides/typing-practice/typing-practice-for-weak-keys/weak-key-drill-progression.webp"
          alt="Four-phase weak key remediation pathway from isolated key to bigrams, embedded words, and natural sentence flow"
          width={1200}
          height={675}
          priority
          className="my-6 w-full rounded-xl border border-border shadow-sm"
        />

        <h2 id="the-isolation-trap">The Repetitive Isolation Trap</h2>
        <p>
          When people realize they keep missing a letter like <code>P</code> or <code>B</code>, their first instinct
          is often to open a blank text document and type <code>p p p p p p p</code> twenty times. This feels
          productive, but it delivers virtually zero real-world transfer.
        </p>
        <p>
          In natural English typing, you never press a letter from a dead rest. Your hand is in continuous motion.
          When typing the word <em>simple</em>, your right pinky must strike <code>P</code> immediately after your
          right middle finger strikes <code>M</code>, and immediately before your right ring finger reaches for{" "}
          <code>L</code>. That three-finger coordinated sequence is what your nervous system must learn.
        </p>
        <p>
          If you haven&apos;t diagnosed which specific keys are failing yet, read our guide on{" "}
          <Link href="/guides/how-to-find-your-weakest-typing-keys">How to Find Your Weakest Typing Keys</Link> first.
          Once you have your two or three culprit keys, use the 3-tier method below.
        </p>

        <h2 id="three-tier-method">The 3-Tier Motor Learning Method</h2>
        <p>
          To permanently eliminate a weak key without breaking your overall typing rhythm, move through three
          progressive stages:
        </p>

        <ol>
          <li>
            <strong>Tier 1 — High-Frequency Bigrams (2 minutes):</strong> Drill the target key paired with the
            letters that most commonly precede and follow it. For <code>P</code>, practice <code>pl</code>,{" "}
            <code>pr</code>, <code>sp</code>, and <code>op</code>. This builds the spatial launch vector from adjacent
            fingers.
          </li>
          <li>
            <strong>Tier 2 — Embedded Word Stems (4 minutes):</strong> Type words where the target key appears in the
            initial, medial, and final positions. For example, drill <em>plan</em> (initial), <em>apple</em> (medial),
            and <em>crisp</em> (final).
          </li>
          <li>
            <strong>Tier 3 — Rhythmic Contextual Sentences (4 minutes):</strong> Integrate those words into coherent
            sentences typed with a steady, metronomic cadence at 60% of your maximum speed.
          </li>
        </ol>

        <h2 id="bigram-drill-templates">Targeted Bigram Drill Templates</h2>
        <p>
          The table below provides proven drill templates for the five keys that most frequently cause stumbles on
          standard keyboards:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-sub-alt/40 border-b border-border">
                <th className="p-3 font-semibold text-foreground">Target Key & Motion</th>
                <th className="p-3 font-semibold text-foreground">Core Bigrams</th>
                <th className="p-3 font-semibold text-foreground">Embedded Words</th>
                <th className="p-3 font-semibold text-foreground">Sentence Integration Drill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {BIGRAM_DRILL_TABLE.map((item) => (
                <tr key={item.targetKey} className="hover:bg-sub-alt/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{item.targetKey}</td>
                  <td className="p-3 font-mono text-xs text-sub">{item.troublesomeBigrams}</td>
                  <td className="p-3 text-foreground/85">{item.embeddedWords}</td>
                  <td className="p-3 text-foreground/85">{item.sentenceDrill}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="pacing-and-progression">Pacing & Progression Rules</h2>
        <p>
          When executing weak-key drills, adherence to speed discipline is paramount. The biggest failure mode is
          attempting to sprint through words containing your problem keys.
        </p>
        <ul>
          <li>
            <strong>Enforce the 98% accuracy ceiling:</strong> If you make an error on the target key during a drill
            line, stop immediately. You are typing too fast. Back up, drop your pace by 5 WPM, and retype the word
            cleanly.
          </li>
          <li>
            <strong>Preserve home-row anchors:</strong> When reaching for an upward or downward key, keep your inactive
            hand resting lightly on its home position. For example, when typing <code>B</code> with your left index
            finger, ensure your right hand remains stationed on <code>J-K-L-;</code>.
          </li>
          <li>
            <strong>Avoid physical tension:</strong> Stiffening your forearm or wrist when approaching a difficult key
            restricts tendon mobility. Relax your shoulders, keep your elbows at 90 degrees, and let the finger joints
            execute the strike.
          </li>
        </ul>

        <h2 id="practice-workflow">Your Daily 10-Minute Workflow in HeroTyping</h2>
        <p>
          You don&apos;t need to manually invent drill sentences every morning. HeroTyping features a dedicated,
          adaptive practice engine designed specifically for weak-key remediation:
        </p>

        <ol>
          <li>
            Go directly to the interactive <Link href="/practice/weak-keys">Weak Keys Typing Practice</Link> drill or the broader <Link href="/lessons/practice">HeroTyping Practice Lab</Link>.
          </li>
          <li>
            The engine reads your live mistake history from recent tests and curriculum exercises, automatically
            generating customized exercises centered on your exact problem keys across five modes (Focus Key, Trigram Flow, Common Words, Adaptive Sentences, and Real Sentences).
          </li>
          <li>
            Complete 3 focused sets. Watch your per-key mastery progress—once your target letter stabilizes above the
            90% accuracy threshold across your rolling 20-attempt window, the engine graduates the key to mastered status and updates your training queue.
          </li>
          <li>
            Finish your session with a standardized run on the <Link href="/typing-test/1-minute">1-Minute Typing Test</Link> to consolidate
            your newly reinforced motor patterns into general typing flow.
          </li>
        </ol>

        <FaqSection items={FAQ_ITEMS} />
        <SourceList sources={SOURCES} />
      </GuideLayout>
    </>
  );
}
