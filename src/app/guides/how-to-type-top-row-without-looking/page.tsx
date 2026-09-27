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
  title: "How to Type the Top Row Without Looking at the Keyboard",
  description:
    "Master the QWERTY top row (QWERTYUIOP) without glancing at your hands. Learn upward diagonal reach vectors, finger anchoring, and muscle memory drills.",
  path: "/guides/how-to-type-top-row-without-looking",
});

const PUBLISHED = "2026-09-27";

const TOP_ROW_VECTORS = [
  {
    finger: "Left Pinky",
    homeKey: "A",
    topKey: "Q",
    vector: "Up-left diagonal (approx 15 degrees)",
    drillTip: "Keep left wrist straight; do not let hand swing outward to reach Q.",
  },
  {
    finger: "Left Ring",
    homeKey: "S",
    topKey: "W",
    vector: "Up-left diagonal straight upward past S",
    drillTip: "Ring finger extends cleanly while middle finger stays near D.",
  },
  {
    finger: "Left Middle",
    homeKey: "D",
    topKey: "E",
    vector: "Up-left diagonal extension",
    drillTip: "The letter 'E' is the most frequent letter in English. Strike firmly and return immediately to D.",
  },
  {
    finger: "Left Index",
    homeKey: "F (Anchor)",
    topKey: "R and T",
    vector: "R: Up-left extension; T: Up-right stretch",
    drillTip: "The reach from F to T is an extended diagonal. Retract immediately back to the F tactile bump.",
  },
  {
    finger: "Right Index",
    homeKey: "J (Anchor)",
    topKey: "U and Y",
    vector: "U: Up-left extension; Y: Extended up-left stretch",
    drillTip: "Reaching for Y is the longest index-finger leap on the top row. Never drag your whole palm across.",
  },
  {
    finger: "Right Middle",
    homeKey: "K",
    topKey: "I",
    vector: "Up-left diagonal straight past K",
    drillTip: "Very stable reach. Pair with left-hand E to drill common vowel combinations like 'ie' and 'ei'.",
  },
  {
    finger: "Right Ring",
    homeKey: "L",
    topKey: "O",
    vector: "Up-left diagonal extension",
    drillTip: "Keep palm level; avoid dipping wrist downward when ring finger extends to O.",
  },
  {
    finger: "Right Pinky",
    homeKey: ";",
    topKey: "P",
    vector: "Up-left diagonal extension",
    drillTip: "Pinky reaches up to P while ring finger stays anchored on L.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Why do my hands float away from the home row when I reach for the top row?",
    answer:
      "Hands float away when typists translate their entire arm or wrist toward the top row instead of extending just their finger joints. Keep your wrists hovering in a fixed position and allow your knuckle joints to uncurl upward. One finger should always maintain feather-light contact with its home key to keep your spatial orientation intact.",
    plainAnswer:
      "Floating occurs when moving your whole wrist instead of flexing finger knuckles. Keep your wrists stable and let finger joints extend upward while resting fingers maintain anchor contact.",
  },
  {
    question: "Why are the letters T and Y so difficult to hit accurately?",
    answer:
      "Because 'T' and 'Y' sit in the center column and require both an upward extension and a lateral stretch. Reaching for 'T' requires the left index finger to move up and right, while 'Y' requires the right index finger to move up and left. To master them, practice returning instantly to the 'F' and 'J' bumps after every strike.",
    plainAnswer:
      "T and Y require both vertical and lateral finger extension. Precision comes from snapping your index fingers immediately back to the home bumps on F and J.",
  },
  {
    question: "Should I learn all top-row letters at once or in small batches?",
    answer:
      "Learn them in three distinct batches: first vowels ('E', 'I', 'O', 'U'), second common consonants ('R', 'T'), and finally peripheral reaches ('Q', 'W', 'P', 'Y'). This allows you to form real words immediately without overwhelming your working memory.",
    plainAnswer:
      "Learn in small batches: master vowels first, then core index consonants (R, T, U, Y), and finish with outer keys (Q, W, P).",
  },
  {
    question: "How do I prevent my pinky from straining when reaching for P and Q?",
    answer:
      "Pinky strain is usually caused by anchored or planted wrists. If your wrists are glued to the desk, your pinkies have to hyperextend. Float your wrists slightly above the desk surface so your whole hand can pivot micro-fractions of a millimeter without straining tendon sheaths.",
    plainAnswer:
      "Float your wrists slightly above the desk surface so the hand can pivot naturally rather than forcing the pinky tendon to overstretch.",
  },
];

const SOURCES = [
  {
    title: "Kinematic Analysis of Hand and Finger Motions During Touch Typing",
    author: "Soechting, J. F., & Flanders, M. (Journal of Neurophysiology, 1997)",
    url: "https://doi.org/10.1152/jn.1997.78.2.904",
  },
  {
    title: "Motor Control and Spatial Coordinates in Keyboard Reaching Tasks",
    author: "Gordon, J., Ghilardi, M. F., & Ghez, C. (Experimental Brain Research, 1994)",
    url: "https://doi.org/10.1007/BF00241498",
  },
  {
    title: "Upper Extremity Posture and Tendon Excursion in Keyboard Operators",
    author: "Armstrong, T. J., et al. (Ergonomics, 1994)",
    url: "https://doi.org/10.1080/00140139408963737",
  },
];

export default function HowToTypeTopRowWithoutLookingPage() {
  const schema = buildArticleSchema({
    headline: "How to Type the Top Row Without Looking at the Keyboard",
    description:
      "Master the QWERTY top row (QWERTYUIOP) without glancing at your hands. Learn upward diagonal reach vectors, finger anchoring, and muscle memory drills.",
    path: "/guides/how-to-type-top-row-without-looking",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="How to Type the Top Row Without Looking"
        subtitle="Upward reach vectors, anchor preservation, and muscle memory exercises for QWERTYUIOP."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Keyboard Skills", path: "/guides/keyboard-skills" },
          { name: "How to Type Top Row Without Looking", path: "/guides/how-to-type-top-row-without-looking" },
        ]}
        toc={[
          { id: "top-row-geometry", label: "The geometry of top-row reaches" },
          { id: "reach-vectors-table", label: "Exact finger reach vectors" },
          { id: "the-anchor-rule", label: "The anchor-preservation rule" },
          { id: "common-vowel-combos", label: "Vowel coordination drills" },
          { id: "interactive-practice", label: "Interactive curriculum practice" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Core technique">
          <p>
            When reaching for the top row, do not slide your entire hand upward. Your wrists remain floating in their
            neutral home position; only the target finger extends diagonally up to strike the key, and it retracts
            back to the home row immediately after impact.
          </p>
        </Callout>

        <Image
          src="/guides/keyboard-skills/how-to-type-top-row-without-looking/top-row-reach-vectors.webp"
          alt="Top row reach vectors diagram showing 15-degree upward diagonal finger reaches from home row to QWERTYUIOP"
          width={1200}
          height={675}
          priority
          className="my-6 w-full rounded-xl border border-border shadow-sm"
        />

        <h2 id="top-row-geometry">The Geometry of Top-Row Reaches</h2>
        <p>
          On standard QWERTY keyboards, the keys are not arranged in a perfect square grid. Instead, each horizontal row
          is staggered slightly to the left or right—a mechanical legacy from 19th-century typewriters where metal typebars
          needed clearance to swing.
        </p>
        <p>
          Because of this physical stagger, extending your fingers straight forward from the home row will cause you to
          miss the top keys entirely. Every top-row reach requires an <strong>upward-left diagonal trajectory</strong>.
          Understanding this diagonal angle is the secret to striking top-row keys blind with pinpoint precision.
        </p>

        <h2 id="reach-vectors-table">Exact Finger Reach Vectors (QWERTYUIOP)</h2>
        <p>
          Review each finger&apos;s specific diagonal travel angle and common recovery tips:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-sub-alt/40 border-b border-border">
                <th className="p-3 font-semibold text-foreground">Finger</th>
                <th className="p-3 font-semibold text-foreground">Home &rarr; Top</th>
                <th className="p-3 font-semibold text-foreground">Diagonal Reach Vector</th>
                <th className="p-3 font-semibold text-foreground">Biomechanical Precision Tip</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              {TOP_ROW_VECTORS.map((v) => (
                <tr key={v.finger} className="hover:bg-sub-alt/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{v.finger}</td>
                  <td className="p-3 font-mono font-semibold text-accent">{v.homeKey} &rarr; {v.topKey}</td>
                  <td className="p-3 text-foreground/85">{v.vector}</td>
                  <td className="p-3 text-sub text-xs">{v.drillTip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="the-anchor-rule">The Anchor-Preservation Rule</h2>
        <p>
          The most common reason typists lose their place on the top row is the &quot;flying hand&quot; syndrome.
          When reaching for <code>E</code>, they lift their entire left hand into the air. With no fingers in contact
          with the keyboard, their spatial coordinate system vanishes, forcing them to look down at their fingers
          to find their way back.
        </p>
        <p>
          To eliminate this, enforce the <strong>Anchor-Preservation Rule</strong>:
        </p>
        <ul>
          <li>
            Whenever one finger extends upward to strike a top key, at least one other finger on that same hand must
            maintain light physical contact with its home key.
          </li>
          <li>
            When the left middle finger reaches up for <code>E</code>, the left index finger should stay lightly grounded
            on <code>F</code>.
          </li>
          <li>
            When the right ring finger reaches up for <code>O</code>, the right index finger stays grounded on <code>J</code>.
          </li>
        </ul>
        <p>
          This physical tether guarantees that your reaching finger can effortlessly snap back to base camp without
          visual searching.
        </p>

        <h2 id="common-vowel-combos">Vowel Coordination Drills</h2>
        <p>
          Four of the five English vowels live on the top row (<code>E, U, I, O</code>). Mastering these vowels combined
          with home-row anchors unlocks fluent typing for thousands of everyday words.
        </p>

        <h3>Drill 1: Left-Hand Top Extensions (E, R, T, W, Q)</h3>
        <p className="font-mono text-xs bg-sub-alt/40 p-3 rounded border border-border">
          frf ded sws aqa ftf frf ftf ded sws aqa wet red raw tree water
        </p>

        <h3>Drill 2: Right-Hand Top Extensions (U, I, O, P, Y)</h3>
        <p className="font-mono text-xs bg-sub-alt/40 p-3 rounded border border-border">
          juj kik lol ;p; jyj juj jyj kik lol ;p; you out lip pour you
        </p>

        <h3>Drill 3: Top-Row and Home-Row Mixed Words</h3>
        <p className="font-mono text-xs bg-sub-alt/40 p-3 rounded border border-border">
          there write quite point quiet power title outer reply route equip
        </p>

        <h2 id="interactive-practice">Interactive Curriculum Practice</h2>
        <p>
          HeroTyping teaches top-row reaches in progressive, symmetrical pairs rather than forcing all ten upper keys at once.
          To build clean reach vectors with real-time feedback, proceed through the dedicated top-row units in{" "}
          <Link href="/lessons">HeroTyping Lessons</Link>:
        </p>
        <ul>
          <li>
            <Link href="/lessons/top-row-combined">Unit 7: Top Row: E &amp; I Vowels</Link> — High-frequency vowel foundation.
          </li>
          <li>
            <Link href="/lessons/top-row-words">Unit 8: Top Row: R &amp; U Index Reaches</Link> — Upward index extensions from home anchors.
          </li>
          <li>
            <Link href="/lessons/bottom-row-left">Unit 9: Top Row: T &amp; Y Upper Center</Link> — Diagonal center reaches.
          </li>
          <li>
            <Link href="/lessons/bottom-row-right">Unit 10: Top Row: W &amp; O Ring Reaches</Link> — Ring finger extensions.
          </li>
          <li>
            <Link href="/lessons/bottom-row-combined">Unit 11: Top Row: Q &amp; P Outer Pinkies</Link> — Outer top-deck boundaries.
          </li>
          <li>
            <Link href="/lessons/bottom-row-words">Unit 12: Consolidation: Top &amp; Home Rows</Link> — 20 keys integrated across natural prose.
          </li>
        </ul>
        <p>
          Once your upward reaches feel automatic, proceed to our complementary guide on{" "}
          <Link href="/guides/bottom-row-typing-practice">bottom row typing practice</Link> to conquer downward curls (Z, X, C, V, B, N, M).
        </p>

        <FaqSection items={FAQ_ITEMS} />
        <SourceList sources={SOURCES} />
      </GuideLayout>
    </>
  );
}
