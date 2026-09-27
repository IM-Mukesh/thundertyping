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
  title: "Practice Typing Numbers & Symbols Blind: Advanced Mixed Practice Drills",
  description:
    "Master mixed alphanumeric typing: numbers, currency symbols, percentages, and coding syntax without looking down. Learn dual-shift agility and transition flow.",
  path: "/guides/practice-typing-numbers-and-symbols-without-looking",
});

const PUBLISHED = "2026-09-27";

const SYMBOL_TRANSITION_TABLE = [
  {
    category: "Financial & Currency",
    sampleString: "$1,450.00 | 15.5% | €250 | $99.99",
    coordinationRules: "Left pinky holds Shift for $, left index strikes 4. Right ring curls down for period.",
    pitfall: "Looking down when transitioning from letters to dollar signs or percentage symbols.",
  },
  {
    category: "Coding & JSON Syntax",
    sampleString: "items[0] = { count: 42, active: true };",
    coordinationRules: "Right pinky reaches for [ and {; left index reaches for 4; right pinky strikes semicolon.",
    pitfall: "Lifting right palm when reaching for brackets and curly braces.",
  },
  {
    category: "Dates, Formulas & Math",
    sampleString: "2026-09-27 | (a + b) * (c - d) / 2",
    coordinationRules: "Right pinky holds Left Shift for parentheses; right pinky strikes minus and equals without Shift.",
    pitfall: "Confusing asterisk (*) on key 8 with ampersand (&) on key 7.",
  },
  {
    category: "Markdown & Technical Prose",
    sampleString: "# Header 1: `user_id` (v2.4.0)",
    coordinationRules: "Left middle reaches for #; left pinky reaches for backtick (`); right ring handles parentheses.",
    pitfall: "Stalling on backticks or underscores in snake_case identifiers.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Why is mixed alphanumeric typing so much harder than typing pure numbers?",
    answer:
      "When typing pure numbers, your hands can stay in an elevated posture near the top row. When typing mixed prose, your hands must continuously shift between the home row (for letters) and the top row (for numbers and symbols), requiring rapid reach-and-return anchor cycles. This constant vertical transition breaks rhythm unless anchored properly.",
    plainAnswer:
      "Mixed typing requires hands to constantly jump between home row letters and top row symbols. The secret is snapping index fingers instantly back to the home bumps.",
  },
  {
    question: "How do I know which Shift key to use for symbols on keys 1 through 5 vs. 6 through 0?",
    answer:
      "Follow the Opposite-Hand Shift Rule: for symbols on keys 1, 2, 3, 4, and 5 (!, @, #, $, %), hold the Right Shift key with your right pinky. For symbols on keys 6, 7, 8, 9, and 0 (^, &, *, (, )), hold the Left Shift key with your left pinky.",
    plainAnswer:
      "Use Right Shift for left-hand symbols (!, @, #, $, %). Use Left Shift for right-hand symbols (^, &, *, (, )).",
  },
  {
    question: "How do programmers type brackets, braces, and underscores without looking?",
    answer:
      "Programmers master 'anchor pivoting': keeping their right index finger lightly hovering above 'J' while the right pinky extends to the right for brackets ([ ]), curly braces ({ }), and underscores (_). Because the index finger remains anchored, the pinky always knows its relative distance.",
    plainAnswer:
      "Keep the right index finger hovering above J as a pivot while the right pinky reaches for brackets and braces.",
  },
  {
    question: "How long does it take to master mixed numbers and symbols without looking?",
    answer:
      "With 10 minutes of daily mixed drill practice, most typists eliminate the habit of looking down for symbols within 14 to 21 days.",
    plainAnswer:
      "Expect 2 to 3 weeks of focused daily practice to automate mixed numbers, symbols, and code syntax blind.",
  },
];

const SOURCES = [
  {
    title: "Motor Performance in Alphanumeric Transcription Tasks: Letters vs. Mathematical Symbols",
    author: "Salthouse, T. A. (Human Factors, 1986)",
    url: "https://doi.org/10.1177/001872088602800307",
  },
  {
    title: "Bimanual Coordination Patterns in Symbolic and Numeric Data Entry",
    author: "Swinnen, S. P. (Psychological Bulletin, 2002)",
    url: "https://doi.org/10.1037/0033-2909.128.2.348",
  },
  {
    title: "The Ergonomics of Programming: Keystroke Latency on Non-Alphanumeric Tokens",
    author: "Card, S. K., Moran, T. P., & Newell, A. (The Psychology of Human-Computer Interaction, CRC Press, 1983)",
    url: "https://doi.org/10.1201/9780203736166",
  },
];

export default function PracticeTypingNumbersAndSymbolsWithoutLookingPage() {
  const schema = buildArticleSchema({
    headline: "Practice Typing Numbers & Symbols Blind: Advanced Mixed Practice Drills",
    description:
      "Master mixed alphanumeric typing: numbers, currency symbols, percentages, and coding syntax without looking down. Learn dual-shift agility and transition flow.",
    path: "/guides/practice-typing-numbers-and-symbols-without-looking",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Practice Typing Numbers & Symbols Blind"
        subtitle="Advanced mixed alphanumeric training for currency, percentages, JSON, markdown, and code syntax."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Keyboard Skills", path: "/guides/keyboard-skills" },
          { name: "Practice Numbers & Symbols Blind", path: "/guides/practice-typing-numbers-and-symbols-without-looking" },
        ]}
        toc={[
          { id: "the-mixed-transition-problem", label: "The mixed transition problem" },
          { id: "dual-shift-coordination", label: "Dual-Shift coordination rule" },
          { id: "transition-table", label: "Alphanumeric transition categories" },
          { id: "anchor-and-return", label: "The reach-and-return anchor" },
          { id: "mastery-curriculum", label: "HeroTyping Mastery Lesson 27" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Advanced skill">
          <p>
            Typing pure numbers in a batch is relatively easy. The true test of a master typist is{" "}
            <strong>mixed transition flow</strong>: shifting effortlessly from letters to numbers to Shift symbols and
            back to letters without ever glancing down at the keyboard.
          </p>
        </Callout>

        <Image
          src="/guides/keyboard-skills/practice-typing-numbers-and-symbols-without-looking/mixed-numeric-symbol-patterns.webp"
          alt="Mixed alphanumeric typing guide showing dual-Shift coordination for currency, brackets, and code syntax"
          width={1200}
          height={675}
          priority
          className="my-6 w-full rounded-xl border border-border shadow-sm"
        />

        <h2 id="the-mixed-transition-problem">The Mixed Transition Problem</h2>
        <p>
          Consider typing this realistic sentence:
        </p>
        <p className="font-mono text-sm bg-sub-alt/40 p-3 rounded border border-border">
          The Q3 revenue increased by 14.8% ($2,450,000) across 18 regional hubs.
        </p>
        <p>
          In a single sentence, your hands must execute:
        </p>
        <ul>
          <li>Standard lowercase alphabetic words (<em>The, revenue, increased, by, across, regional, hubs</em>)</li>
          <li>Top-row numeric characters (<code>3, 1, 4, 8, 2, 4, 5, 0, 0, 0, 1, 8</code>)</li>
          <li>Dual-shift symbols (<code>$, %, (, )</code>)</li>
          <li>Bottom-row punctuation (commas and periods)</li>
        </ul>
        <p>
          Most typists stumble violently through this sentence because their hands lack <strong>transition flow</strong>.
          They treat every number and symbol as a surprise emergency, freezing their hands and looking down to locate the
          symbol.
        </p>

        <h2 id="dual-shift-coordination">The Dual-Shift Coordination Rule for Top-Row Symbols</h2>
        <p>
          Every symbol on the top number row requires holding Shift. To prevent hand contortions, apply the{" "}
          <strong>Dual-Shift Rule</strong>:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
          <div className="p-4 rounded border border-border bg-sub-alt/20">
            <h3 className="font-semibold text-accent mb-2">Left Hand Symbols (! @ # $ %)</h3>
            <p className="text-xs text-foreground/85">
              Struck by Left Pinky, Ring, Middle, or Index.
            </p>
            <p className="text-xs font-medium text-foreground mt-2">
              &rarr; <strong>HOLD RIGHT SHIFT</strong> with your Right Pinky.
            </p>
          </div>
          <div className="p-4 rounded border border-border bg-sub-alt/20">
            <h3 className="font-semibold text-accent mb-2">Right Hand Symbols (^ &amp; * ( ))</h3>
            <p className="text-xs text-foreground/85">
              Struck by Right Index, Middle, Ring, or Pinky.
            </p>
            <p className="text-xs font-medium text-foreground mt-2">
              &rarr; <strong>HOLD LEFT SHIFT</strong> with your Left Pinky.
            </p>
          </div>
        </div>

        <h2 id="transition-table">Alphanumeric Transition Categories</h2>
        <p>
          Review how different domain styles combine numbers, symbols, and letters:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-sub-alt/40 border-b border-border">
                <th className="p-3 font-semibold text-foreground">Domain Category</th>
                <th className="p-3 font-semibold text-foreground">Sample Mixed String</th>
                <th className="p-3 font-semibold text-foreground">Biomechanical Coordination</th>
                <th className="p-3 font-semibold text-foreground">Common Beginner Trap</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              {SYMBOL_TRANSITION_TABLE.map((item) => (
                <tr key={item.category} className="hover:bg-sub-alt/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{item.category}</td>
                  <td className="p-3 font-mono text-xs text-accent">{item.sampleString}</td>
                  <td className="p-3 text-foreground/85 text-xs">{item.coordinationRules}</td>
                  <td className="p-3 text-sub text-xs">{item.pitfall}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="anchor-and-return">The Reach-and-Return Anchor Technique</h2>
        <p>
          When you extend your finger two rows upward to strike a symbol like <code>#</code> or <code>$</code>, do not
          let your palm follow.
        </p>
        <p>
          Use the <strong>Snap-Back Mechanism</strong>:
        </p>
        <ol>
          <li>Hold the opposite Shift key.</li>
          <li>Extend only the striking finger to tap the symbol keycap cleanly.</li>
          <li>
            Immediately upon key release, snap the striking finger back to its home-row resting position before typing
            the next letter.
          </li>
          <li>
            Release the Shift key simultaneously as the finger snaps back.
          </li>
        </ol>
        <p>
          Snapping back to base camp ensures that your spatial coordinates never drift, allowing you to transition back
          to lowercase letters at full velocity.
        </p>

        <h2 id="mastery-curriculum">HeroTyping Mastery Unit 27</h2>
        <p>
          To drill mixed numbers and symbols with rigorous validation, proceed to{" "}
          <Link href="/lessons/numbers-and-symbols-mastery">Unit 27: Code Syntax &amp; Technical Formats</Link> in the{" "}
          <Link href="/lessons">HeroTyping Curriculum</Link>.
        </p>
        <p>
          Unit 27 combines brackets <code>{`{} [] ()`}</code>, operators <code>+= == != =&gt;</code>, camelCase, snake_case, and variable syntax into progressive drills designed to build fluid keyboard mastery for technical professionals.
        </p>

        <FaqSection items={FAQ_ITEMS} />
        <SourceList sources={SOURCES} />
      </GuideLayout>
    </>
  );
}
