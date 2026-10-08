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
  title: "Bottom Row Typing Practice: Z X C V B N M Finger Placement and Drills",
  description:
    "Master the bottom row keys (ZXCVBNM) with proper downward curling mechanics. Learn finger reach angles, wrist clearance, and practice routines.",
  path: "/guides/bottom-row-typing-practice",
});

const PUBLISHED = "2026-09-27";

const BOTTOM_ROW_ASSIGNMENTS = [
  {
    finger: "Left Pinky",
    homeKey: "A",
    bottomKey: "Z",
    vector: "Down and slightly right",
    mechanics: "Curl the pinky joint tightly inward toward the palm. Avoid rotating the wrist outward.",
  },
  {
    finger: "Left Ring",
    homeKey: "S",
    bottomKey: "X",
    vector: "Down and slightly right",
    mechanics: "Curl the ring finger directly down. Maintain the middle finger close to D for stability.",
  },
  {
    finger: "Left Middle",
    homeKey: "D",
    bottomKey: "C",
    vector: "Down and slightly right",
    mechanics: "A strong, natural downward curl. One of the most frequently used bottom-row consonants.",
  },
  {
    finger: "Left Index",
    homeKey: "F (Anchor)",
    bottomKey: "V and B",
    vector: "V: Down-right curl; B: Extended down-right diagonal stretch",
    mechanics: "Left index owns both V and B. The reach to B is the widest diagonal reach on the bottom row.",
  },
  {
    finger: "Right Index",
    homeKey: "J (Anchor)",
    bottomKey: "N and M",
    vector: "N: Down-left diagonal stretch; M: Down-left direct curl",
    mechanics: "Right index owns N and M. Never allow the left hand to cross over and strike N.",
  },
  {
    finger: "Right Middle",
    homeKey: "K",
    bottomKey: ", (Comma)",
    vector: "Down-left direct curl",
    mechanics: "Extremely common in sentence flow. Needs sharp, rhythmic tap and instant return to K.",
  },
  {
    finger: "Right Ring",
    homeKey: "L",
    bottomKey: ". (Period)",
    vector: "Down-left direct curl",
    mechanics: "Direct downward curl past L. Used to terminate sentences and domain names.",
  },
  {
    finger: "Right Pinky",
    homeKey: ";",
    bottomKey: "/ (Slash / Question Mark)",
    vector: "Down-left curl",
    mechanics: "Controls forward slash and (with Shift) question mark. Keep right elbow stable.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Why does the bottom row feel so much harder to type than the top row?",
    answer:
      "Human hand biomechanics naturally favor extension (opening fingers upward) over tight flexion (curling fingers backward under the palm). Reaching downward compresses your finger tendons toward your palm. If your wrists are planted flat against your desk, this curl is physically obstructed, creating friction and strain.",
    plainAnswer:
      "Hand anatomy favors upward extension over backward curling. Reaching downward is difficult if wrists are glued to the desk—floating wrists make bottom-row typing effortless.",
  },
  {
    question: "Which hand should type the letter B?",
    answer:
      "In standard touch typing, the letter 'B' belongs exclusively to the left index finger reaching down and right from 'F'. Because 'B' sits centrally between the hands, many self-taught typists develop the bad habit of striking it with their right index finger. Break this habit early: left hand types 'B', right hand types 'N'.",
    plainAnswer:
      "The left index finger owns 'B' (reaching from F). The right index finger owns 'N' (reaching from J). Never cross hands across the central divide.",
  },
  {
    question: "How do I avoid hitting C when aiming for X?",
    answer:
      "Because the keyboard rows are staggered, beginners often reach straight down from 'S' and hit 'C' instead of 'X'. Remember that the bottom row staggers to the right relative to the home row: 'X' is reached by curling down and slightly right, while 'C' is reached from 'D'. Keep your middle finger anchored on 'D' as a reference guide.",
    plainAnswer:
      "The row stagger means X is reached by curling down-right from S. Keep your middle finger resting near D to maintain your spatial reference point.",
  },
  {
    question: "Should my palms rest on a wrist rest while typing bottom-row keys?",
    answer:
      "No. Wrist rests are designed for resting during pauses between typing bouts, not for anchoring your hands while active keystrokes occur. Resting your palms while typing down-row keys forces severe wrist dorsiflexion, pinching the median nerve in the carpal tunnel.",
    plainAnswer:
      "No. Float your hands while typing. Wrist rests should only be used to rest your palms during idle breaks between typing sessions.",
  },
];

const SOURCES: never[] = [];

export default function BottomRowTypingPracticePage() {
  const schema = buildArticleSchema({
    headline: "Bottom Row Typing Practice: Z X C V B N M Finger Placement and Drills",
    description:
      "Master the bottom row keys (ZXCVBNM) with proper downward curling mechanics. Learn finger reach angles, wrist clearance, and practice routines.",
    path: "/guides/bottom-row-typing-practice",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Bottom Row Typing Practice: ZXCVBNM"
        subtitle="Downward curling mechanics, wrist clearance, and finger assignments for the most challenging row on the keyboard."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Keyboard Skills", path: "/guides/keyboard-skills" },
          { name: "Bottom Row Typing Practice", path: "/guides/bottom-row-typing-practice" },
        ]}
        toc={[
          { id: "why-bottom-row-is-hard", label: "The biomechanical challenge" },
          { id: "finger-assignments-table", label: "Complete finger assignments" },
          { id: "the-b-and-n-divide", label: "The crucial B and N divide" },
          { id: "wrist-clearance-secret", label: "The wrist clearance secret" },
          { id: "targeted-drills", label: "Progressive practice drills" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Biomechanical rule">
          <p>
            Never collapse or plant your wrists when typing the bottom row. Curling your fingers downward into the palm
            requires vertical clearance. Keep your wrists floating 1 to 2 centimeters above the desk surface so your
            fingertips can curl cleanly under your knuckles.
          </p>
        </Callout>

        <Image
          src="/guides/keyboard-skills/bottom-row-typing-practice/bottom-row-flexion-mechanics.webp"
          alt="Bottom row finger flexion mechanics showing downward curls for ZXCVBNM and the central B and N divide"
          width={1200}
          height={675}
          priority
          className="my-6 w-full rounded-xl border border-border shadow-sm"
        />

        <h2 id="why-bottom-row-is-hard">The Biomechanical Challenge of the Bottom Row</h2>
        <p>
          Ask any group of typing students which row gave them the most trouble, and the unanimous answer is the bottom
          row: <code>Z, X, C, V, B, N, M</code>.
        </p>
        <p>
          There is a clear anatomical reason for this difficulty. Extending your fingers upward to the top row uses your
          forearm&apos;s extensor muscles, which open the hand into a broad, relaxed posture. Curling your fingers
          downward to the bottom row uses the deep flexor tendons, folding the fingertips backward toward your palm.
        </p>
        <p>
          If your wrists are resting flat on your desk or laptop chassis, your fingers literally run out of physical space
          to curl. Typists who plant their wrists end up bending their fingers at awkward sideways angles, causing
          frequent adjacent slips (like typing <code>C</code> instead of <code>V</code>) and rapid forearm fatigue.
        </p>

        <h2 id="finger-assignments-table">Complete Finger Assignments (ZXCVBNM)</h2>
        <p>
          Review each finger&apos;s downward trajectory from its resting home position:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-sub-alt/40 border-b border-border">
                <th className="p-3 font-semibold text-foreground">Finger</th>
                <th className="p-3 font-semibold text-foreground">Home &rarr; Bottom</th>
                <th className="p-3 font-semibold text-foreground">Trajectory Angle</th>
                <th className="p-3 font-semibold text-foreground">Biomechanical Mechanics</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              {BOTTOM_ROW_ASSIGNMENTS.map((item) => (
                <tr key={item.finger} className="hover:bg-sub-alt/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{item.finger}</td>
                  <td className="p-3 font-mono font-semibold text-accent">{item.homeKey} &rarr; {item.bottomKey}</td>
                  <td className="p-3 text-sub text-xs">{item.vector}</td>
                  <td className="p-3 text-foreground/85">{item.mechanics}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="the-b-and-n-divide">The Crucial B and N Divide</h2>
        <p>
          The center of the bottom row contains one of the most persistent bad habits in typing: the crossover reach
          between <code>B</code> and <code>N</code>.
        </p>
        <p>
          On standard QWERTY keyboards, the <code>B</code> key sits almost equidistant between the hands. Many
          self-taught typists strike <code>B</code> with their right hand, or alternate hands haphazardly depending on
          which word they are typing.
        </p>
        <p>
          This inconsistency destroys typing rhythm. Lock in this fundamental rule:
        </p>
        <ul>
          <li>
            <strong>The Left Index Finger ALWAYS owns B:</strong> It reaches down and diagonally right from the{" "}
            <code>F</code> anchor key.
          </li>
          <li>
            <strong>The Right Index Finger ALWAYS owns N:</strong> It reaches down and diagonally left from the{" "}
            <code>J</code> anchor key.
          </li>
        </ul>
        <p>
          Assigning strict hand ownership ensures that when typing common letter combinations like <em>nb</em>, <em>bn</em>,
          or words like <em>banana</em> and <em>combine</em>, both hands can execute fluid alternating strokes without
          crashing into each other.
        </p>

        <h2 id="wrist-clearance-secret">The Wrist Clearance Secret</h2>
        <p>
          To make bottom-row typing feel effortless rather than cramped, adopt the <strong>Arch Posture</strong>:
        </p>
        <ol>
          <li>Curve your fingers as if you are gently holding a tennis ball or ripe peach in each palm.</li>
          <li>
            Lift your wrists so that they float straight with your forearms—no downward sag, no backward bend.
          </li>
          <li>
            When striking <code>Z</code>, <code>X</code>, <code>C</code>, or <code>V</code>, let the finger curl down
            like a small hammer tapping the keycap squarely in the center.
          </li>
          <li>
            Immediately spring back to the home row. Never leave your fingers resting on the bottom row.
          </li>
        </ol>

        <h2 id="targeted-drills">Progressive Practice Drills</h2>
        <p>
          Work through these four drills in sequence to build unconscious bottom-row reflex:
        </p>

        <h3>Drill 1: Left-Hand Bottom Row Curls (Z, X, C, V, B)</h3>
        <p className="font-mono text-xs bg-sub-alt/40 p-3 rounded border border-border">
          aza sxs dcd fvf fbf fbf fvf dcd sxs aza cab vat box zoo verb
        </p>

        <h3>Drill 2: Right-Hand Bottom Row Curls (N, M, Comma, Period)</h3>
        <p className="font-mono text-xs bg-sub-alt/40 p-3 rounded border border-border">
          jnj jmj k,k l.l ;/; jnj jmj man men moon name nine fine line
        </p>

        <h3>Drill 3: The B and N Alternating Index Drill</h3>
        <p className="font-mono text-xs bg-sub-alt/40 p-3 rounded border border-border">
          bfb jnj bnb nbn ban nab bean bone barn bond bend blend cabin
        </p>

        <h3>Drill 4: Full Three-Row English Vocabulary</h3>
        <p className="font-mono text-xs bg-sub-alt/40 p-3 rounded border border-border">
          brave zinc exact voice never climb brown blank examine volume carbon
        </p>

        <h2 id="interactive-curriculum">Interactive Bottom-Row Curriculum</h2>
        <p>
          HeroTyping teaches downward curls in progressive, symmetrical pairs rather than throwing the entire bottom
          row at once. To practice with real-time feedback and mistake tracking, proceed through the dedicated bottom-row
          units in <Link href="/lessons">HeroTyping Lessons</Link>:
        </p>
        <ul>
          <li>
            <Link href="/lessons/numbers-low">Unit 13: Bottom Row: V &amp; M Index Curls</Link> — Downward index finger curls.
          </li>
          <li>
            <Link href="/lessons/numbers-high">Unit 14: Bottom Row: C &amp; Comma</Link> — Middle finger curls and comma placement.
          </li>
          <li>
            <Link href="/lessons/full-keyboard-words">Unit 15: Bottom Row: X &amp; Period</Link> — Ring finger curls and sentence periods.
          </li>
          <li>
            <Link href="/lessons/full-keyboard-punctuation">Unit 16: Bottom Row: Z &amp; Slash</Link> — Pinky curls and slash reach.
          </li>
          <li>
            <Link href="/lessons/graduation">Unit 17: Alphabet Complete: B &amp; N</Link> — Center reaches unlocking all 26 letters of the alphabet.
          </li>
        </ul>

        <FaqSection items={FAQ_ITEMS} />
        <SourceList sources={SOURCES} />
      </GuideLayout>
    </>
  );
}
