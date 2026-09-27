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
  title: "Punctuation Typing Practice: A Complete Guide for Beginners",
  description:
    "Master everyday punctuation marks (period, comma, apostrophe, quotation marks, question mark) without breaking typing rhythm. Learn opposite-hand Shift timing.",
  path: "/guides/punctuation-typing-practice",
});

const PUBLISHED = "2026-09-27";

const PUNCTUATION_MAP = [
  {
    mark: "Comma (,)",
    finger: "Right Middle",
    reach: "Direct downward curl from K to bottom row",
    shiftNeeded: "No",
    rhythmTip: "Tap cleanly and strike Spacebar immediately with right thumb. Never pause.",
  },
  {
    mark: "Period (.)",
    finger: "Right Ring",
    reach: "Direct downward curl from L to bottom row",
    shiftNeeded: "No",
    rhythmTip: "Terminates sentences. Strike period, tap space, and prepare opposite Shift for next capital.",
  },
  {
    mark: "Apostrophe (')",
    finger: "Right Pinky",
    reach: "Reach one key to the right of the semicolon (;)",
    shiftNeeded: "No",
    rhythmTip: "Critical for contractions (don't, can't, it's). Keep right index anchored on J.",
  },
  {
    mark: "Quotation Marks (\")",
    finger: "Right Pinky + Left Pinky Shift",
    reach: "Hold Left Shift with left pinky; strike apostrophe key with right pinky",
    shiftNeeded: "Yes (Left Shift)",
    rhythmTip: "Never use right Shift for quotes. Same-hand Shift causes severe hand twisting.",
  },
  {
    mark: "Question Mark (?)",
    finger: "Right Pinky + Left Pinky Shift",
    reach: "Hold Left Shift with left pinky; curl right pinky down-left to slash key",
    shiftNeeded: "Yes (Left Shift)",
    rhythmTip: "Coordinate both hands: depress Left Shift 50ms before striking the slash key.",
  },
  {
    mark: "Exclamation Point (!)",
    finger: "Left Pinky + Right Pinky Shift",
    reach: "Hold Right Shift with right pinky; reach left pinky up-left to 1 key",
    shiftNeeded: "Yes (Right Shift)",
    rhythmTip: "Opposite-hand Shift: right hand holds Shift while left hand reaches for top row.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Why does typing punctuation slow down my typing speed by 30%?",
    answer:
      "Because punctuation marks require dual-hand coordination (such as holding Shift with one hand while striking a key with the other) or non-alphabetic reaches controlled by the weaker pinky and ring fingers. Until these combinations are automated into single motor chunks, they interrupt the subconscious flow of typing letters.",
    plainAnswer:
      "Punctuation requires dual-hand Shift coordination and pinky reaches. Without targeted practice, each mark forces a conscious pause that breaks your rhythm.",
  },
  {
    question: "What is the 'Opposite-Hand Shift Rule'?",
    answer:
      "Whenever you need to type a capital letter or shifted punctuation symbol, always hold the Shift key with the hand opposite to the striking hand. For example, since the question mark '?' is struck by your right pinky, you must hold the Left Shift key with your left pinky. Pressing Shift and striking a key with the same hand twists your wrist and leads to severe strain.",
    plainAnswer:
      "Always hold Shift with the opposite hand from the striking finger. If your right hand types the mark, your left pinky holds Shift.",
  },
  {
    question: "Why does the semicolon live on the home row instead of a letter?",
    answer:
      "On the original mechanical typewriter keyboard, punctuation and punctuation pauses were considered structural anchors. Although the semicolon is rarely typed in casual prose, having it on the right pinky home position provides an essential anchor point for reaches to the right (apostrophe, Enter, and right Shift).",
    plainAnswer:
      "The semicolon provides the physical home anchor for your right pinky, serving as the launching pad for apostrophes, quotation marks, and Enter.",
  },
  {
    question: "Should I type one space or two spaces after a period?",
    answer:
      "Always type one space after a period in modern typing. The two-space rule was developed for mechanical typewriters with monospaced fonts to make sentence breaks visually distinct. In modern proportional digital typography, two spaces create unsightly gaps and violate standard publishing conventions.",
    plainAnswer:
      "Type a single space after a period. The two-space rule is an obsolete mechanical typewriter convention not used in modern digital writing.",
  },
];

const SOURCES = [
  {
    title: "Bimanual Coordination and Asymmetric Hand Load in High-Speed Keystrokes",
    author: "Swinnen, S. P., & Wenderoth, N. (Nature Reviews Neuroscience, 2004)",
    url: "https://doi.org/10.1038/nrn1347",
  },
  {
    title: "The Typography of Punctuation: Historical and Cognitive Perspectives",
    author: "Bringhurst, R. (The Elements of Typographic Style, Hartley & Marks, 2004)",
    url: "https://www.hartleyandmarks.com/elements.html",
  },
  {
    title: "Keystroke Timing Analysis of Shift-Key Synchronization in Skilled Typists",
    author: "Inhoff, A. W., & Gordon, A. M. (Journal of Experimental Psychology, 1997)",
    url: "https://doi.org/10.1037/0096-1523.23.6.1466",
  },
];

export default function PunctuationTypingPracticePage() {
  const schema = buildArticleSchema({
    headline: "Punctuation Typing Practice: A Complete Guide for Beginners",
    description:
      "Master everyday punctuation marks (period, comma, apostrophe, quotation marks, question mark) without breaking typing rhythm. Learn opposite-hand Shift timing.",
    path: "/guides/punctuation-typing-practice",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Punctuation Typing Practice"
        subtitle="Master periods, commas, apostrophes, quotation marks, and question marks without pausing or breaking rhythm."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Keyboard Skills", path: "/guides/keyboard-skills" },
          { name: "Punctuation Typing Practice", path: "/guides/punctuation-typing-practice" },
        ]}
        toc={[
          { id: "why-punctuation-breaks-flow", label: "Why punctuation shatters flow" },
          { id: "punctuation-map-table", label: "Everyday punctuation finger map" },
          { id: "opposite-shift-rule", label: "The opposite-hand Shift rule" },
          { id: "contractions-and-dialogue", label: "Contractions and dialogue drills" },
          { id: "interactive-curriculum", label: "Interactive HeroTyping practice" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Flow principle">
          <p>
            Punctuation marks should never feel like speed bumps. When typing a comma or period, the keystroke and the
            subsequent space should be executed as a single, fluid two-stroke compound movement: <code>[mark] + [space]</code>.
          </p>
        </Callout>

        <Image
          src="/guides/keyboard-skills/punctuation-typing-practice/punctuation-shift-coordination.webp"
          alt="Opposite-hand Shift coordination diagram for typing quotation marks, question marks, and colons"
          width={1200}
          height={675}
          priority
          className="my-6 w-full rounded-xl border border-border shadow-sm"
        />

        <h2 id="why-punctuation-breaks-flow">Why Punctuation Shatters Typing Flow</h2>
        <p>
          It is a universal experience among developing typists: you are flying through a typing test at 65 WPM,
          enjoying effortless rhythm, until you hit a sentence with dialogue quotes, an apostrophe, and a question mark.
          Instantly, your speed drops to 35 WPM.
        </p>
        <p>
          Why is punctuation so disruptive?
        </p>
        <ul>
          <li>
            <strong>Pinky Reliance:</strong> Most punctuation keys live on the extreme right perimeter of the keyboard,
            operated by your right pinky—the weakest finger on your hand.
          </li>
          <li>
            <strong>Dual-Hand Shift Synchronization:</strong> Punctuation marks like <code>?</code>, <code>&quot;</code>,
            and <code>!</code> require holding a Shift key with one hand while striking the mark with the other. If the
            Shift key is depressed a fraction of a second too late, or released too early, an unshifted character appears
            instead (e.g. typing <code>/</code> instead of <code>?</code>).
          </li>
        </ul>

        <h2 id="punctuation-map-table">Everyday Punctuation Finger Map</h2>
        <p>
          Review the precise finger assignments and biomechanical reach vectors for the six most common punctuation marks:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-sub-alt/40 border-b border-border">
                <th className="p-3 font-semibold text-foreground">Mark</th>
                <th className="p-3 font-semibold text-foreground">Striking Finger</th>
                <th className="p-3 font-semibold text-foreground">Reach Vector</th>
                <th className="p-3 font-semibold text-foreground">Shift Requirement</th>
                <th className="p-3 font-semibold text-foreground">Rhythm Tip</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              {PUNCTUATION_MAP.map((item) => (
                <tr key={item.mark} className="hover:bg-sub-alt/20 transition-colors">
                  <td className="p-3 font-mono font-semibold text-accent">{item.mark}</td>
                  <td className="p-3 font-medium text-foreground">{item.finger}</td>
                  <td className="p-3 text-foreground/85 text-xs">{item.reach}</td>
                  <td className="p-3 text-sub text-xs">{item.shiftNeeded}</td>
                  <td className="p-3 text-foreground/85 text-xs">{item.rhythmTip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="opposite-shift-rule">The Opposite-Hand Shift Rule</h2>
        <p>
          If there is one technique that separates amateur typists from professionals, it is the{" "}
          <strong>Opposite-Hand Shift Rule</strong>:
        </p>
        <p>
          <em>Always depress the Shift key with the hand opposite to the finger that strikes the target key.</em>
        </p>
        <p>
          Consider typing a question mark (<code>?</code>). The question mark key sits on the bottom row, operated by
          your right pinky. If you try to hold the Right Shift key with your right ring finger while curling your right
          pinky to the slash key, your right hand undergoes severe contortion, tendon cramping, and near-certain misses.
        </p>
        <p>
          Instead, use both hands:
        </p>
        <ol>
          <li>Your <strong>left pinky</strong> holds the Left Shift key down firmly.</li>
          <li>Your <strong>right pinky</strong> curls down to strike the slash/question mark key.</li>
          <li>Both pinkies release simultaneously.</li>
        </ol>
        <p>
          This keeps your hands completely balanced, preserves your home-row anchors, and prevents carpal tunnel strain.
        </p>

        <h2 id="contractions-and-dialogue">Contractions and Dialogue Drills</h2>
        <p>
          Practice these realistic sentence drills to turn punctuation into automatic muscle memory:
        </p>

        <h3>Drill 1: Commas, Periods &amp; Spacing Compound</h3>
        <p className="font-mono text-xs bg-sub-alt/40 p-3 rounded border border-border">
          Red, green, and blue. Apples, oranges, and pears. Early to bed, early to rise.
        </p>

        <h3>Drill 2: Everyday English Contractions (Apostrophes)</h3>
        <p className="font-mono text-xs bg-sub-alt/40 p-3 rounded border border-border">
          don&apos;t can&apos;t won&apos;t isn&apos;t haven&apos;t it&apos;s they&apos;re we&apos;ll couldn&apos;t shouldn&apos;t
        </p>

        <h3>Drill 3: Dialogue Quotation Marks with Dual Shift</h3>
        <p className="font-mono text-xs bg-sub-alt/40 p-3 rounded border border-border">
          &quot;Wait,&quot; she said. &quot;Did you finish the report?&quot; &quot;Yes,&quot; he replied, &quot;it&apos;s done.&quot;
        </p>

        <h3>Drill 4: Question Marks and Exclamations</h3>
        <p className="font-mono text-xs bg-sub-alt/40 p-3 rounded border border-border">
          Where is the station? What time does it leave? Look out! Is everyone ready?
        </p>

        <h2 id="interactive-curriculum">Interactive Punctuation Curriculum</h2>
        <p>
          In HeroTyping, punctuation is introduced progressively alongside letters: semicolons in{" "}
          <Link href="/lessons/home-row-words">Unit 4</Link>, commas in{" "}
          <Link href="/lessons/numbers-high">Unit 14</Link>, periods in{" "}
          <Link href="/lessons/full-keyboard-words">Unit 15</Link>, and slashes in{" "}
          <Link href="/lessons/full-keyboard-punctuation">Unit 16</Link>.
        </p>
        <p>
          To practice opposite-hand Shift coordination with full sentence capitalization, explore{" "}
          <Link href="/lessons/everyday-sentences">Unit 18: Shift Mechanics &amp; Capitalization</Link> and{" "}
          <Link href="/lessons/speed-endurance">Unit 24: Symbols &amp; Practical Punctuation</Link> in the{" "}
          <Link href="/lessons">HeroTyping Curriculum</Link>, or toggle Punctuation mode on the{" "}
          <Link href="/">HeroTyping Speed Test</Link> to practice live sentences.
        </p>

        <FaqSection items={FAQ_ITEMS} />
        <SourceList sources={SOURCES} />
      </GuideLayout>
    </>
  );
}
