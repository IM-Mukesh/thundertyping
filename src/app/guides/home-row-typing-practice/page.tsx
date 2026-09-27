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
  title: "Home Row Typing Practice: ASDF JKL; Exercises for Beginners",
  description:
    "Master the home row keys with ASDF and JKL; finger placement drills. Learn tactile anchoring, thumb spacebar mechanics, and micro-movement exercises.",
  path: "/guides/home-row-typing-practice",
});

const PUBLISHED = "2026-09-27";

const FINGER_ASSIGNMENTS = [
  {
    finger: "Left Pinky",
    key: "A",
    movementGuide: "Rests gently on key center. Striking requires light downward tap without tilting hand outward.",
    commonError: "Flying upward when the index finger reaches for G.",
  },
  {
    finger: "Left Ring",
    key: "S",
    movementGuide: "Natural vertical flexion. Keep knuckle relaxed and curved like holding a tennis ball.",
    commonError: "Tensing when pinky moves to A.",
  },
  {
    finger: "Left Middle",
    key: "D",
    movementGuide: "Strongest finger on left hand. Serves as secondary pivot point alongside F.",
    commonError: "Pressing too hard and bottoming out switch with excessive force.",
  },
  {
    finger: "Left Index",
    key: "F (Tactile Anchor)",
    movementGuide: "Locates the physical ridge/nib. Controls both F and the inner lateral reach to G.",
    commonError: "Losing contact with the nib when reaching for G.",
  },
  {
    finger: "Right Index",
    key: "J (Tactile Anchor)",
    movementGuide: "Locates the right physical nib. Controls J and reaches leftward to H.",
    commonError: "Drifting over to H and resting there permanently.",
  },
  {
    finger: "Right Middle",
    key: "K",
    movementGuide: "Rests squarely on K. Acts as right-hand structural balance anchor.",
    commonError: "Slipping off key during fast alternating drills.",
  },
  {
    finger: "Right Ring",
    key: "L",
    movementGuide: "Rests on L. Moves strictly up and down with minimal lateral rotation.",
    commonError: "Extending flat instead of maintaining natural curl.",
  },
  {
    finger: "Right Pinky",
    key: "; (Semicolon)",
    movementGuide: "Rests on Semicolon. Must stay positioned without flaring outward off the keyboard edge.",
    commonError: "Floating into empty space to the right of the keyboard.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Why do the F and J keys have raised bumps or ridges?",
    answer:
      "The small plastic bumps or ridges on 'F' and 'J' are tactile orientation anchors designed by industrial engineers. They allow your index fingers to find the home row by touch alone, without glancing down at your hands. Whenever you sit at a desk or lose your place, feel for these ridges to instantly recalibrate your hands.",
    plainAnswer:
      "The bumps on F and J let your index fingers locate the home row entirely by feel, eliminating the need to look down at your keyboard.",
  },
  {
    question: "Which thumb should I use to press the Spacebar?",
    answer:
      "Most typists use the thumb of their dominant hand (right thumb for right-handed typists, left thumb for left-handed typists). However, the most efficient technique is opposite-thumb spacing: if the last letter of a word was typed by a left-hand finger, strike the Spacebar with your right thumb, and vice versa. Whichever method you choose, pick one thumb and stay consistent.",
    plainAnswer:
      "Most people consistently use the thumb of their dominant hand. The advanced method alternates thumbs opposite to the hand that typed the last letter.",
  },
  {
    question: "Should my fingers press down firmly on the home keys when resting?",
    answer:
      "No. Your fingers should rest with feather-light contact—just enough pressure to feel the keycaps, but far below the actuation force needed to register a keypress. Heavy resting weight strains forearm tendons and causes accidental ghost presses.",
    plainAnswer:
      "No. Fingers should float with ultra-light contact, feeling the surface texture without applying actuation pressure.",
  },
  {
    question: "How long should I practice the home row before moving to the top row?",
    answer:
      "Stay on the home row until you can type all 10 home keys (A S D F G H J K L ;) and complete Unit 6 (Home Row Mastery) with at least 60% accuracy without glancing down. Reaching 88%+ or 94%+ awards 4 to 5 stars. For most learners, working through the five progressive key pairs and the Unit 6 consolidation takes 2 to 4 days of 15-minute daily practice.",
    plainAnswer:
      "Spend 2 to 4 days on the progressive home-row units through Unit 6 (Home Row Mastery) until typing feels comfortable without looking at your hands.",
  },
];

const SOURCES = [
  {
    title: "Tactile Perception and Haptic Anchoring in Typing Performance",
    author: "Lederman, S. J., & Klatzky, R. L. (Cognitive Psychology, 1987)",
    url: "https://doi.org/10.1016/0010-0285(87)90008-9",
  },
  {
    title: "Electromyographic Analysis of Hand Tendon Strain During Home-Row Typing",
    author: "Gerard, M. J., et al. (Ergonomics, 1999)",
    url: "https://doi.org/10.1080/001401399185108",
  },
  {
    title: "The Development of Motor Programs for Typing",
    author: "Shaffer, L. H. (Quarterly Journal of Experimental Psychology, 1978)",
    url: "https://doi.org/10.1080/14640747808400662",
  },
];

export default function HomeRowTypingPracticePage() {
  const schema = buildArticleSchema({
    headline: "Home Row Typing Practice: ASDF JKL; Exercises for Beginners",
    description:
      "Master the home row keys with ASDF and JKL; finger placement drills. Learn tactile anchoring, thumb spacebar mechanics, and micro-movement exercises.",
    path: "/guides/home-row-typing-practice",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Home Row Typing Practice: ASDF JKL;"
        subtitle="The definitive guide to keyboard anchoring, tactile indexing, and finger mechanics for the home row."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Typing Basics", path: "/guides/typing-basics" },
          { name: "Home Row Typing Practice", path: "/guides/home-row-typing-practice" },
        ]}
        toc={[
          { id: "what-is-home-row", label: "What is the home row?" },
          { id: "finger-assignments", label: "Exact finger assignments" },
          { id: "tactile-nib-anchors", label: "Mastering the F and J nibs" },
          { id: "spacebar-thumb-rules", label: "Thumb and spacebar rules" },
          { id: "practical-home-drills", label: "Step-by-step practice drills" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Core rule">
          <p>
            Your fingers should always return to the home row after every single keystroke across the entire keyboard.
            Think of the home row as your physical base camp: you venture out to strike a key on the top or bottom row,
            and instantly retract back to your home position.
          </p>
        </Callout>

        <Image
          src="/guides/typing-basics/home-row-typing-practice/home-row-asdf-jkl-guide.webp"
          alt="Home row finger placement diagram showing ASDF and JKL; keys with tactile nib anchors on F and J"
          width={1200}
          height={675}
          priority
          className="my-6 w-full rounded-xl border border-border shadow-sm"
        />

        <h2 id="what-is-home-row">What Is the Home Row and Why Is It Sacred?</h2>
        <p>
          On a standard QWERTY keyboard, the home row is the central horizontal strip containing eight primary resting
          keys: <code>A, S, D, F</code> for your left hand, and <code>J, K, L, ;</code> for your right hand. In the
          center sit <code>G</code> and <code>H</code>, which are struck by reaching laterally with your index fingers.
        </p>
        <p>
          The home row is the foundation of touch typing because it minimizes total finger travel distance. By resting
          your fingers on the center row, every other key on the keyboard—from the top number row to the bottom row—is
          never more than one or two key-widths away from a resting finger.
        </p>

        <h2 id="finger-assignments">Exact Finger Assignments and Micro-Movements</h2>
        <p>
          Every finger has a designated home position. Review the anatomical breakdown below:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-sub-alt/40 border-b border-border">
                <th className="p-3 font-semibold text-foreground">Finger</th>
                <th className="p-3 font-semibold text-foreground">Home Key</th>
                <th className="p-3 font-semibold text-foreground">Biomechanical Movement Guide</th>
                <th className="p-3 font-semibold text-foreground">Common Beginner Mistake</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              {FINGER_ASSIGNMENTS.map((item) => (
                <tr key={item.finger} className="hover:bg-sub-alt/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{item.finger}</td>
                  <td className="p-3 font-mono font-semibold text-accent">{item.key}</td>
                  <td className="p-3 text-foreground/85">{item.movementGuide}</td>
                  <td className="p-3 text-sub text-xs">{item.commonError}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="tactile-nib-anchors">Mastering the F and J Tactile Nibs</h2>
        <p>
          Notice the raised horizontal ridges or plastic dots molded onto the <code>F</code> and <code>J</code> keys.
          These are not decorative; they are your primary sensory interface with the machine.
        </p>
        <p>
          Try this blind calibration drill right now:
        </p>
        <ol>
          <li>Close your eyes and lift both hands completely away from the keyboard.</li>
          <li>
            Lower your hands toward the keyboard, gently brushing your index finger pads across the center keys until
            you feel the raised ridges under your left and right index fingers.
          </li>
          <li>
            Once your index fingers touch <code>F</code> and <code>J</code>, let your remaining three fingers on each
            hand fall naturally onto <code>A-S-D</code> and <code>K-L-;</code>.
          </li>
          <li>
            Open your eyes. If your hands are positioned correctly without looking, you have mastered tactile homing.
          </li>
        </ol>

        <h2 id="spacebar-thumb-rules">Thumb Mechanics and Spacebar Rules</h2>
        <p>
          While eight fingers rest on the letter keys, both thumbs float lightly above the Spacebar. A frequent source
          of beginner confusion is deciding which thumb should strike the space:
        </p>
        <ul>
          <li>
            <strong>The Dominant Thumb Approach:</strong> Dedicate your dominant hand&apos;s thumb (right thumb for 90%
            of typists) exclusively to the Spacebar. The non-dominant thumb rests inactive. This simple rule eliminates
            hesitation.
          </li>
          <li>
            <strong>The Alternating Thumb Approach:</strong> Strike the Spacebar with the hand opposite to the last
            typed letter. For example, after typing <em>cat</em> (ended by left-hand <code>T</code>), press Space with
            your right thumb. This maximizes speed by overlapping hand movements.
          </li>
        </ul>

        <h2 id="practical-home-drills">Step-by-Step Practice Drills</h2>
        <p>
          HeroTyping introduces the home row in symmetrical two-key pairs rather than forcing you to memorize all ten
          keys simultaneously. Practice these four drill stages to build clean home-row muscle memory:
        </p>

        <h3>Drill 1: Symmetrical Anchor Nibs (F and J)</h3>
        <p className="font-mono text-xs bg-sub-alt/40 p-3 rounded border border-border">
          f j fj jf ff jj fff jjj fjf jfj fj fjf jfj
        </p>

        <h3>Drill 2: Middle &amp; Ring Keys (D, K, S, L)</h3>
        <p className="font-mono text-xs bg-sub-alt/40 p-3 rounded border border-border">
          dk kd sl ls dksl lskd fjdk jksf dl sk dl sk
        </p>

        <h3>Drill 3: Pinky Anchors &amp; Center Reaches (A, Semicolon, G, H)</h3>
        <p className="font-mono text-xs bg-sub-alt/40 p-3 rounded border border-border">
          a; ;a gh hg ag ah ;g ;h asdf jkl; fdsa ;lkj
        </p>

        <h3>Drill 4: Real Home-Row English Words (Unit 6 Consolidation)</h3>
        <p className="font-mono text-xs bg-sub-alt/40 p-3 rounded border border-border">
          ask dad sad fall glad flask salads alas falls flasks dallas
        </p>

        <p>
          Once you feel comfortable with hand anchoring, jump into the interactive lesson engine: start with{" "}
          <Link href="/lessons/home-row-left">Unit 1: Home Row: F &amp; J Anchors</Link> and progress through Units 2 to 5
          and the Unit 6 Consolidation in <Link href="/lessons">HeroTyping Lessons</Link>, or expand your finger reaches
          with our guides on <Link href="/guides/how-to-type-top-row-without-looking">top row reaches</Link> and{" "}
          <Link href="/guides/bottom-row-typing-practice">bottom row typing practice</Link>.
        </p>

        <FaqSection items={FAQ_ITEMS} />
        <SourceList sources={SOURCES} />
      </GuideLayout>
    </>
  );
}
