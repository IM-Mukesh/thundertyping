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
  title: "QWERTY vs Dvorak vs Colemak: Which Keyboard Layout Is Fastest?",
  description:
    "An honest data-driven comparison of QWERTY, Dvorak, and Colemak: home row finger travel, same-finger bigrams, learning curve, ergonomics, and real WPM limits.",
  path: "/guides/qwerty-vs-dvorak-vs-colemak",
});

const PUBLISHED = "2026-09-26";
const UPDATED = "2026-09-26";

const LAYOUT_COMPARISON = [
  {
    metric: "Home Row Keystrokes (%)",
    qwerty: "32%",
    dvorak: "70%",
    colemak: "74%",
    analysis: "Colemak keeps nearly three-quarters of all keystrokes directly on the resting home row.",
  },
  {
    metric: "Top Row Keystrokes (%)",
    qwerty: "52%",
    dvorak: "22%",
    colemak: "18%",
    analysis: "QWERTY forces fingers to constantly hurdle upward toward the top row for vowels and consonants.",
  },
  {
    metric: "Same-Finger Bigram (SFB) Rate",
    qwerty: "4.8% to 6.2%",
    dvorak: "2.6%",
    colemak: "1.6%",
    analysis: "SFBs force the same finger to hit two successive keys (e.g. 'ed' or 'un'). Colemak slashes this by ~70%.",
  },
  {
    metric: "Relative Finger Travel Distance",
    qwerty: "100% (Baseline ~16 mi/day)",
    dvorak: "62% (~10 mi/day)",
    colemak: "50% (~8 mi/day)",
    analysis: "Colemak halves total physical finger travel distance compared to standard QWERTY typing.",
  },
  {
    metric: "Preserved Shortcut Keys (Ctrl+Z,X,C,V)",
    qwerty: "100% (Native)",
    dvorak: "0% (Scattered across keyboard)",
    colemak: "100% (Preserved in bottom-left)",
    analysis: "Colemak preserves standard operating system shortcuts; Dvorak relocates them inconveniently.",
  },
  {
    metric: "Keys Changed from QWERTY",
    qwerty: "0 (Baseline)",
    dvorak: "31 keys moved",
    colemak: "17 keys moved",
    analysis: "Colemak is drastically easier to learn because it alters only 17 character positions.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Will switching from QWERTY to Dvorak or Colemak make me faster?",
    answer:
      "Not necessarily in terms of top-end speed records. World-record typing speeds exceeding 150–200 WPM have been set on both QWERTY and alternative layouts. However, alternative layouts make high speeds feel far more effortless, reduce finger fatigue dramatically during multi-hour workdays, and eliminate awkward finger gymnastics.",
    plainAnswer:
      "Not automatically faster in peak speed, but significantly more comfortable and less tiring. Elite speeds (150+ WPM) exist on both QWERTY and Colemak.",
  },
  {
    question: "Which layout is easier to learn: Dvorak or Colemak?",
    answer:
      "Colemak is universally considered much easier to learn. While Dvorak rearranges 31 keys and scatters essential shortcuts like Ctrl+Z, X, C, and V, Colemak moves only 17 keys and leaves the entire bottom-left shortcut cluster untouched.",
    plainAnswer:
      "Colemak is far easier. It changes only 17 keys and keeps standard shortcuts (Undo, Cut, Copy, Paste) in their familiar locations, whereas Dvorak shuffles 31 keys.",
  },
  {
    question: "How long does it take to learn Colemak or Dvorak?",
    answer:
      "Most typists reach 30–40 WPM within 2 to 4 weeks of dedicated 30-minute daily practice. Regaining your prior QWERTY baseline (e.g., 70–90 WPM) typically takes 6 to 10 weeks of full immersion.",
    plainAnswer:
      "Expect 2 to 4 weeks to become functional (30–40 WPM) and 6 to 10 weeks of daily practice to match your former QWERTY speed.",
  },
  {
    question: "Will learning Colemak ruin my ability to type on QWERTY keyboards?",
    answer:
      "In the first few weeks of transition, your brain will feel conflicted. However, once both layouts are deeply ingrained, many typists become fully bilingual—comfortably typing Colemak on their personal mechanical keyboard while typing QWERTY on laptops or shared workstations.",
    plainAnswer:
      "You may experience temporary confusion during the learning phase, but with ongoing occasional practice, you can maintain fluency on both layouts.",
  },
];

export default function QwertyVsDvorakVsColemakPage() {
  const schema = buildArticleSchema({
    headline: "QWERTY vs Dvorak vs Colemak: Which Keyboard Layout Is Fastest?",
    description:
      "An honest data-driven comparison of QWERTY, Dvorak, and Colemak: home row finger travel, same-finger bigrams, learning curve, ergonomics, and real WPM limits.",
    path: "/guides/qwerty-vs-dvorak-vs-colemak",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <GuideLayout
        title="QWERTY vs. Dvorak vs. Colemak: Which Layout Is Actually Fastest?"
        subtitle="Finger travel, same-finger bigrams, hand alternation, and ergonomics: real data on whether switching layouts is worth the pain."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          {
            name: "QWERTY vs Dvorak vs Colemak",
            path: "/guides/qwerty-vs-dvorak-vs-colemak",
          },
        ]}
        toc={[
          { id: "hero-image", label: "The three layouts" },
          { id: "qwerty-legacy", label: "The QWERTY historical trap" },
          { id: "data-comparison", label: "Hard data: Finger travel & bigrams" },
          { id: "dvorak-breakdown", label: "Dvorak: Hand alternation & rhythm" },
          { id: "colemak-breakdown", label: "Colemak: Modern ergonomic king" },
          { id: "does-speed-increase", label: "Does it actually make you faster?" },
          { id: "how-to-switch", label: "How to switch without pain" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="The Honest Verdict">
          <p>
            If your only goal is setting a single-sentence peak sprint record, <strong>QWERTY is not holding you back</strong>;
            the world&apos;s fastest typists routinely exceed 180+ WPM on QWERTY. But if your goal is{" "}
            <strong>effortless typing comfort, eliminating finger strain, and halving daily physical finger travel</strong>,
            switching to <strong>Colemak</strong> is one of the most rewarding ergonomic upgrades a keyboard worker can make.
          </p>
        </Callout>

        <h2 id="hero-image">The three layouts</h2>
        <Image
          src="/guides/qwerty-vs-dvorak-vs-colemak.webp"
          alt="Comparative render of QWERTY, Dvorak, and Colemak keyboard layouts showing home row finger travel heatmaps"
          width={1200}
          height={675}
          className="mx-auto rounded-xl border border-border"
          priority
        />
        <p>
          Every day, billions of people type on a layout designed in the 1870s for mechanical typewriters.
          The QWERTY layout was engineered primarily to prevent physical metal typebars from colliding and
          jamming—not for human hand anatomy or typing velocity.
        </p>
        <p>
          In the modern era of low-friction mechanical switches and touch typing, two major alternatives—
          <strong>Dvorak Simplified Keyboard</strong> and <strong>Colemak</strong>—claim to solve QWERTY&apos;s
          biomechanical flaws. But how do they actually measure up against real keystroke data?
        </p>

        <h2 id="qwerty-legacy">The QWERTY historical trap</h2>
        <p>
          Designed by Christopher Latham Sholes in 1873, QWERTY deliberately separated common English digraphs
          (such as &ldquo;th&rdquo; and &ldquo;st&rdquo;) to opposite sides of the typewriter basket so the mechanical
          arms wouldn&apos;t strike at the same moment.
        </p>
        <p>
          The consequence for modern typists is severe:
        </p>
        <ul>
          <li>
            Only <strong>32%</strong> of all keystrokes in English prose land on the home row (A-S-D-F J-K-L-;).
          </li>
          <li>
            Fingers are forced to hurdle up to the top row (52% of keystrokes) and drop down into the bottom row constantly.
          </li>
          <li>
            High-frequency keys are unevenly loaded onto the weaker left hand (57% left hand vs. 43% right hand).
          </li>
        </ul>

        <h2 id="data-comparison">Hard data: Finger travel &amp; same-finger bigrams</h2>
        <p>
          Computer simulation and keystroke telemetry reveal massive ergonomic differences across the three layouts:
        </p>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-4 font-medium text-foreground">Ergonomic Metric</th>
              <th className="py-2 pr-4 font-medium text-foreground">QWERTY</th>
              <th className="py-2 pr-4 font-medium text-foreground">Dvorak</th>
              <th className="py-2 pr-4 font-medium text-foreground">Colemak</th>
              <th className="py-2 font-medium text-foreground">Why It Matters</th>
            </tr>
          </thead>
          <tbody className="[&_tr]:border-b [&_tr]:border-border">
            {LAYOUT_COMPARISON.map((row) => (
              <tr key={row.metric}>
                <td className="py-2 pr-4 font-medium text-foreground">{row.metric}</td>
                <td className="py-2 pr-4 text-sub">{row.qwerty}</td>
                <td className="py-2 pr-4">{row.dvorak}</td>
                <td className="py-2 pr-4 font-medium text-accent">{row.colemak}</td>
                <td className="py-2 text-xs">{row.analysis}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 id="dvorak-breakdown">Dvorak: Hand alternation &amp; rhythmic typing</h2>
        <p>
          Patented in 1936 by Dr. August Dvorak and William Dealey, the Dvorak layout was the first serious
          attempt to apply scientific ergonomics to keyboard design.
        </p>
        <p>
          <strong>Dvorak&apos;s Design Philosophy:</strong> Place all vowels on the left home row (A-O-E-U-I)
          and the most frequent consonants on the right home row (D-H-T-N-S). This creates a rhythmic,
          drum-roll sensation where typing alternates back and forth between left and right hands for almost
          every syllable.
        </p>
        <p>
          <strong>The Drawbacks:</strong> Dvorak changes almost every key on the board (31 modifications).
          Crucially, essential operating system shortcuts like Ctrl+Z, Ctrl+X, Ctrl+C, and Ctrl+V are scattered
          across distant keys, frustrating developers and productivity workers.
        </p>

        <h2 id="colemak-breakdown">Colemak: The modern ergonomic champion</h2>
        <p>
          Released in 2006 by Shai Coleman, Colemak was designed specifically for computer users who want
          maximum ergonomic efficiency with minimal transition friction.
        </p>
        <p>
          <strong>Why Colemak Outperforms:</strong>
        </p>
        <ul>
          <li>
            <strong>Finger Rolls over Alternation:</strong> Instead of bouncing back and forth between hands
            like Dvorak, Colemak optimizes for inward rolling motions (like fingers casually tapping a desk:
            pinky to ring to middle to index). Rolls are naturally faster and require less conscious coordination.
          </li>
          <li>
            <strong>Untouched Shortcut Cluster:</strong> The bottom-left row keys (Z, X, C, V) remain in their
            exact QWERTY positions.
          </li>
          <li>
            <strong>Lowest Same-Finger Bigram Rate:</strong> With an SFB rate of only 1.6%, you almost never
            have to hit two consecutive keys with the same finger.
          </li>
        </ul>

        <h2 id="does-speed-increase">Does switching layouts actually make you faster?</h2>
        <p>
          If you check competitive leaderboards on <Link href="/">typing tests</Link>, you will notice that
          the top 100 typists feature a mix of QWERTY, Colemak, and Dvorak typists.
        </p>
        <p>
          Switching layouts will <strong>not</strong> magically double your typing speed from 50 to 100 WPM.
          Speed is fundamentally governed by motor chunking and eye-hand lookahead, not just key placement.
        </p>
        <p>
          What an ergonomic layout <em>does</em> deliver is:
        </p>
        <ol>
          <li>
            <strong>Dramatically Reduced Strain:</strong> Halving finger travel prevents carpal fatigue and
            tendon aches during 8-hour coding or writing sessions.
          </li>
          <li>
            <strong>Effortless Endurance:</strong> Typing 80 WPM on Colemak feels physically relaxed, whereas
            80 WPM on QWERTY feels like a frantic finger hurdle race.
          </li>
          <li>
            <strong>Fewer Finger Collisions:</strong> The near-elimination of same-finger bigrams makes typing
            fluid and uninterrupted.
          </li>
        </ol>

        <h2 id="how-to-switch">How to switch without destroying your productivity</h2>
        <p>
          The most painful part of adopting Colemak or Dvorak is the &ldquo;cold turkey&rdquo; productivity drop.
          If your job requires writing emails or code, typing at 12 WPM for two weeks is unacceptable.
        </p>
        <p>
          Follow this practical adoption protocol:
        </p>
        <ul>
          <li>
            <strong>The Dual-Setup Rule:</strong> Keep your work computer on QWERTY during business hours.
            Dedicate 20 to 30 minutes every evening to practicing Colemak on our{" "}
            <Link href="/lessons">touch typing lessons</Link>.
          </li>
          <li>
            <strong>Use the Tarmak Transition:</strong> If jumping directly to 17 new keys feels overwhelming,
            use the Tarmak layout steps, which introduce 3 to 4 key changes at a time over several weeks.
          </li>
          <li>
            <strong>The 40 WPM Milestone:</strong> Do not make Colemak your primary daily layout until you
            can comfortably hit 40 WPM with 96%+ accuracy. Once you reach 40 WPM, make the switch permanent.
          </li>
        </ul>

        <FaqSection items={FAQ_ITEMS} />

        <SourceList
          sources={[
            {
              label: "CarpalX — Quantitative Keyboard Layout Ergonomic Model & Bigram Frequency Evaluation",
              href: "http://mkweb.bcgsc.ca/carpalx/",
            },
            {
              label: "Colemak Official Community — Ergonomic Design Principles & Transition Studies",
              href: "https://colemak.com/",
            },
            {
              label: "Dvorak, August — Typewriting Behavior: Psychology Applied to Teaching and Learning Typewriting (American Book Company)",
              href: "https://archive.org/details/typewritingbehav00dvor",
            },
          ]}
        />

        <p className="text-xs text-sub/70">Last updated {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}
