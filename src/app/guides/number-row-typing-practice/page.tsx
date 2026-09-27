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
  title: "Number Row Typing Practice: Learn 1–0 Without Looking at the Keyboard",
  description:
    "Master the top number row (1, 2, 3, 4, 5, 6, 7, 8, 9, 0) through blind touch typing. Learn anchor maintenance, two-row reach vectors, and practical number drills.",
  path: "/guides/number-row-typing-practice",
});

const PUBLISHED = "2026-09-27";

const NUMBER_ROW_MAP = [
  {
    finger: "Left Pinky",
    homeKey: "A",
    numberKey: "1",
    vector: "Up-left long diagonal reach past Q",
    mechanics: "Extend pinky while keeping remaining fingers hovering lightly above S-D-F.",
  },
  {
    finger: "Left Ring",
    homeKey: "S",
    numberKey: "2",
    vector: "Up-left direct diagonal past W",
    mechanics: "Maintain left index anchor on F to preserve spatial awareness.",
  },
  {
    finger: "Left Middle",
    homeKey: "D",
    numberKey: "3",
    vector: "Upward extension past E",
    mechanics: "Extremely stable reach due to middle finger length. Return immediately to D.",
  },
  {
    finger: "Left Index",
    homeKey: "F (Anchor)",
    numberKey: "4 and 5",
    vector: "4: Up-left past R; 5: Up-right stretch past T",
    mechanics: "Left index owns both 4 and 5. Return immediately to the F tactile bump.",
  },
  {
    finger: "Right Index",
    homeKey: "J (Anchor)",
    numberKey: "6 and 7",
    vector: "6: Up-left stretch past Y; 7: Up-left reach past U",
    mechanics: "Right index owns both 6 and 7. The reach to 6 is the single longest index reach on the keyboard.",
  },
  {
    finger: "Right Middle",
    homeKey: "K",
    numberKey: "8",
    vector: "Upward extension past I",
    mechanics: "Straight upward trajectory. Index stays anchored on J.",
  },
  {
    finger: "Right Ring",
    homeKey: "L",
    numberKey: "9",
    vector: "Up-left diagonal reach past O",
    mechanics: "Keep palm level to prevent twisting the wrist outward.",
  },
  {
    finger: "Right Pinky",
    homeKey: ";",
    numberKey: "0",
    vector: "Up-left long diagonal reach past P",
    mechanics: "Controls 0, minus (-), and equals (=). Return right hand to home position after striking.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Why do I always look down at the keyboard when typing numbers?",
    answer:
      "Because the number row is two full rows above your resting home position (separated by the entire QWERTY row). Moving fingers across two vertical rows without an anchor finger causes typists to lose their spatial coordinates, prompting an instinctive urge to glance down. Maintaining at least one finger anchored on the home row solves this immediately.",
    plainAnswer:
      "The number row is two rows above home position. Moving that distance without an anchor finger disorients your spatial map, causing you to look down.",
  },
  {
    question: "Which hand and finger types the number 6?",
    answer:
      "In standard touch typing, the number 6 belongs exclusively to the right index finger, reaching up and left from 'J'. Although 6 sits near the physical center of the keyboard, giving it to the right index finger balances finger load against the left index finger (which controls 4 and 5).",
    plainAnswer:
      "The right index finger owns 6 (reaching from J). The left index finger owns 4 and 5 (reaching from F).",
  },
  {
    question: "Should I use the top number row or the dedicated numeric keypad (Numpad)?",
    answer:
      "Use the top number row whenever typing mixed alphanumeric content: passwords, dates, postal codes, street addresses, and coding syntax. Use the ten-key Numpad only for pure, continuous accounting data entry (spreadsheets, invoice batches) where your left hand doesn't need to type letters.",
    plainAnswer:
      "Use the top number row for mixed text, passwords, and dates. Reserve the Numpad for bulk numeric data entry in spreadsheets.",
  },
  {
    question: "How long does it take to learn the number row blind?",
    answer:
      "With 10 minutes of focused anchor practice per day, most typists eliminate looking down for numbers within 7 to 10 days. Reaching full speed parity with your letter typing typically takes 3 to 4 weeks.",
    plainAnswer:
      "Expect 7 to 10 days of 10-minute daily drills to break the looking-down habit, and 3 to 4 weeks to build effortless speed.",
  },
];

const SOURCES = [
  {
    title: "Spatial Disorientation and Error Recovery in Long-Distance Keystrokes",
    author: "Salthouse, T. A. (Cognitive Science, 1984)",
    url: "https://doi.org/10.1207/s15516709cog0804_2",
  },
  {
    title: "Comparative Biomechanics of Numeric Entry: Top-Row vs. Keypad Configurations",
    author: "Peper, E., et al. (Applied Ergonomics, 2003)",
    url: "https://doi.org/10.1016/S0003-6870(03)00038-7",
  },
  {
    title: "Motor Chunking and Spatial Coding in Numeric Keystroke Sequences",
    author: "Verwey, W. B. (Psychological Research, 1999)",
    url: "https://doi.org/10.1007/s004260050042",
  },
];

export default function NumberRowTypingPracticePage() {
  const schema = buildArticleSchema({
    headline: "Number Row Typing Practice: Learn 1–0 Without Looking at the Keyboard",
    description:
      "Master the top number row (1, 2, 3, 4, 5, 6, 7, 8, 9, 0) through blind touch typing. Learn anchor maintenance, two-row reach vectors, and practical number drills.",
    path: "/guides/number-row-typing-practice",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Number Row Typing Practice: 1–0"
        subtitle="Master the top numeric row without looking down, using two-row anchor vectors and index-finger discipline."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Keyboard Skills", path: "/guides/keyboard-skills" },
          { name: "Number Row Typing Practice", path: "/guides/number-row-typing-practice" },
        ]}
        toc={[
          { id: "the-two-row-reach", label: "The two-row reach problem" },
          { id: "finger-assignments-table", label: "Number row finger map (1–0)" },
          { id: "the-center-split", label: "Splitting 5 and 6 correctly" },
          { id: "real-world-drills", label: "Dates, phone numbers & practical drills" },
          { id: "interactive-lessons", label: "Interactive HeroTyping lessons" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Anchor discipline">
          <p>
            The number row is twice as far from your home position as the top letter row. To type numbers blind,
            you must never lift your entire hand into the air. Keep your inactive fingers resting lightly on the home row
            to preserve your physical compass.
          </p>
        </Callout>

        <Image
          src="/guides/keyboard-skills/number-row-typing-practice/number-row-reaches-guide.webp"
          alt="Number row reach guide showing two-row vertical extensions for digits 1 through 0 and anchor finger discipline"
          width={1200}
          height={675}
          priority
          className="my-6 w-full rounded-xl border border-border shadow-sm"
        />

        <h2 id="the-two-row-reach">The Two-Row Reach Problem</h2>
        <p>
          Even people who type letters fluently at 80 WPM frequently drop to a complete halt whenever a number appears in
          their text. Their hands hover, their eyes dart down to the keyboard, they peck the number with one index finger,
          and then their eyes dart back up to find their place on the screen.
        </p>
        <p>
          This hesitation happens because the top number row requires a <strong>two-row vertical reach</strong>. When
          reaching for <code>3</code>, your middle finger must travel all the way past <code>E</code> to find the key.
          If your entire hand drifts forward during that reach, you lose tactile contact with the home row, and your
          fingers become hopelessly lost.
        </p>
        <p>
          The solution is simple: keep at least one finger anchored on the home row (especially your index fingers on{" "}
          <code>F</code> and <code>J</code>) whenever extending for any number.
        </p>

        <h2 id="finger-assignments-table">Complete Number Row Finger Map (1–0)</h2>
        <p>
          Every number key has a strict finger assignment that mirrors the letter row below it:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-sub-alt/40 border-b border-border">
                <th className="p-3 font-semibold text-foreground">Finger</th>
                <th className="p-3 font-semibold text-foreground">Home &rarr; Number</th>
                <th className="p-3 font-semibold text-foreground">Travel Vector</th>
                <th className="p-3 font-semibold text-foreground">Anchor &amp; Stability Tip</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              {NUMBER_ROW_MAP.map((item) => (
                <tr key={item.finger} className="hover:bg-sub-alt/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{item.finger}</td>
                  <td className="p-3 font-mono font-semibold text-accent">{item.homeKey} &rarr; {item.numberKey}</td>
                  <td className="p-3 text-sub text-xs">{item.vector}</td>
                  <td className="p-3 text-foreground/85">{item.mechanics}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="the-center-split">Splitting 5 and 6 Correctly</h2>
        <p>
          The most common point of confusion on the number row is the center boundary between <code>5</code> and <code>6</code>.
        </p>
        <ul>
          <li>
            <strong>Left Index Finger:</strong> Controls <code>4</code> and <code>5</code>. When reaching for <code>5</code>,
            extend upward and slightly right from <code>F</code>.
          </li>
          <li>
            <strong>Right Index Finger:</strong> Controls <code>6</code> and <code>7</code>. When reaching for <code>6</code>,
            extend upward and significantly left from <code>J</code>.
          </li>
        </ul>
        <p>
          Because the <code>6</code> key requires a long stretch to the left, many typists mistakenly strike it with
          their left hand. This creates severe finger collisions when typing common combinations like <code>56</code> or{" "}
          <code>65</code>. Practice the reach from <code>J</code> to <code>6</code> until your right index finger executes
          the diagonal stretch automatically.
        </p>

        <h2 id="real-world-drills">Dates, Phone Numbers & Practical Drills</h2>
        <p>
          Abstract number repetition like <code>12345 67890</code> builds basic geometry, but real-world fluency requires
          typing numbers embedded in realistic contexts:
        </p>

        <h3>Drill 1: Left-Hand Numbers (1, 2, 3, 4, 5)</h3>
        <p className="font-mono text-xs bg-sub-alt/40 p-3 rounded border border-border">
          a1a s2s d3d f4f f5f 12 23 34 45 54 43 32 21 142 531 245 135
        </p>

        <h3>Drill 2: Right-Hand Numbers (6, 7, 8, 9, 0)</h3>
        <p className="font-mono text-xs bg-sub-alt/40 p-3 rounded border border-border">
          j6j j7j k8k l9l ;0; 67 78 89 90 09 98 87 76 680 790 869 078
        </p>

        <h3>Drill 3: Calendar Dates &amp; Years</h3>
        <p className="font-mono text-xs bg-sub-alt/40 p-3 rounded border border-border">
          1984 1999 2001 2012 2024 2026 1776 1492 1066 1865 1945 2030
        </p>

        <h3>Drill 4: Phone Numbers &amp; Alphanumeric Mix</h3>
        <p className="font-mono text-xs bg-sub-alt/40 p-3 rounded border border-border">
          room 402 flight 718 gate 14 route 66 zip 90210 code 505 order 8821
        </p>

        <h2 id="interactive-lessons">Interactive HeroTyping Lessons</h2>
        <p>
          Ready to test your number-row accuracy? HeroTyping provides dedicated lessons designed to build this exact skill:
        </p>
        <ul>
          <li>
            <Link href="/lessons/numbers-low">Lesson 13: Numbers Low (1, 2, 3, 4, 5)</Link>
          </li>
          <li>
            <Link href="/lessons/numbers-high">Lesson 14: Numbers High (6, 7, 8, 9, 0)</Link>
          </li>
          <li>
            <Link href="/lessons/numbers-and-words">Lesson 20: Numbers and Words Integrated</Link>
          </li>
        </ul>

        <FaqSection items={FAQ_ITEMS} />
        <SourceList sources={SOURCES} />
      </GuideLayout>
    </>
  );
}
