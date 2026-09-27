import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { SourceList } from "@/components/content/source-list";
import { FingerMapExplorer } from "@/components/tools/finger-map-explorer";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Touch-Typing Finger Map (Interactive Chart, Every Key)",
  description:
    "The complete finger-to-key chart for touch typing — hover or tap any key to see which finger owns it, plus home row, Shift, numbers, and why the system works.",
  path: "/guides/touch-typing-finger-map",
});

const PUBLISHED = "2026-09-25";
const UPDATED = "2026-09-25";

const FINGER_COLUMNS = [
  { finger: "Left pinky", keys: "1  Q  A  Z" },
  { finger: "Left ring", keys: "2  W  S  X" },
  { finger: "Left middle", keys: "3  E  D  C" },
  { finger: "Left index", keys: "4 5  R T  F G  V B" },
  { finger: "Right index", keys: "6 7  Y U  H J  N M" },
  { finger: "Right middle", keys: "8  I  K  ," },
  { finger: "Right ring", keys: "9  O  L  ." },
  { finger: "Right pinky", keys: "0  P  ;  /" },
  { finger: "Thumbs", keys: "Space bar" },
];

const MISTAKES = [
  {
    mistake: "Using one finger for a key that belongs to another",
    fix: "It feels faster in the moment and is the single biggest reason self-taught typists stall around 30–40 WPM — every keystroke stays a short, predictable reach only if the same finger always owns the same key.",
  },
  {
    mistake: "Not returning to home row after every reach",
    fix: "The resting position is what makes every subsequent reach predictable and short. Skipping it turns touch typing back into hunting, just with fewer eyes on the keyboard.",
  },
  {
    mistake: "Looking down to confirm before pressing",
    fix: "The glance costs more time than the keystroke it was checking, and it delays exactly the muscle memory the F/J bumps exist to build.",
  },
  {
    mistake: "Learning the whole keyboard before any one row is automatic",
    fix: "Home row first, fully automatic, before adding the top row; top row automatic before the bottom row. Skipping ahead means practicing on a foundation that isn't solid yet.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Which finger types the Shift key?",
    answer:
      "The pinky on the opposite hand from the letter you're capitalizing — right pinky (Shift) for a left-hand letter, left pinky (Shift) for a right-hand letter. This keeps one hand free to hold Shift while the other hand's normal finger reaches the letter, rather than contorting one hand to do both.",
    plainAnswer:
      "The opposite-hand pinky: right Shift for a left-hand letter, left Shift for a right-hand letter.",
  },
  {
    question: "Do the index fingers really cover more keys than the others?",
    answer:
      "Yes — each index finger owns two columns (for example, the left index covers both R/F/V and T/G/B) instead of one, because the middle of the keyboard has more letter columns than there are middle fingers to cover them. It's a genuine asymmetry in the standard system, not an error in a chart.",
    plainAnswer:
      "Yes — each index finger owns two columns instead of one, because the keyboard's middle has more columns than there are fingers to spare.",
  },
  {
    question: "Why do F and J have a small bump?",
    answer:
      "So your index fingers can find home row by touch alone, without looking down. It's a deliberate, physical anchor point — nearly every keyboard has it, and it's the single most useful physical feature for learning to type without looking.",
    plainAnswer: "So your index fingers can find home row by touch alone, without looking down.",
  },
  {
    question: "Should I memorize this chart before I start practicing?",
    answer:
      "No — memorizing a chart and building muscle memory are different processes, and the second one only happens through repetition at the keyboard. Use the interactive map above to check yourself occasionally, but spend most of your time actually typing, ideally through a structured, ordered progression rather than the whole keyboard at once.",
    plainAnswer:
      "No — muscle memory only builds through repetition at the keyboard, not by memorizing a chart. Use it to check yourself, not as the practice itself.",
  },
];

export default function TouchTypingFingerMapPage() {
  const schema = buildArticleSchema({
    headline: "Touch-Typing Finger Map (Interactive Chart, Every Key)",
    description:
      "The complete finger-to-key chart for touch typing, interactive, plus why the system works and how to practice it.",
    path: "/guides/touch-typing-finger-map",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Touch-Typing Finger Map"
        subtitle="Every key, every finger — hover, tap, or click a finger below to explore it."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Touch-Typing Finger Map", path: "/guides/touch-typing-finger-map" },
        ]}
        toc={[
          { id: "explorer", label: "Interactive finger map" },
          { id: "home-row", label: "Home row and the F/J bumps" },
          { id: "full-map", label: "The full finger-to-key list" },
          { id: "why-it-works", label: "Why this exact system" },
          { id: "shift", label: "Shift, numbers, and punctuation" },
          { id: "reference-images", label: "Printable reference" },
          { id: "practice", label: "How to actually learn it" },
          { id: "mistakes", label: "Common mistakes" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Quick answer">
          <p>
            Each finger owns a fixed column of keys radiating out from a home-row resting position
            (left hand: <code>A S D F</code>, right hand: <code>J K L ;</code>), and returns there
            after every reach. The index fingers cover two columns each rather than one, since the
            keyboard&apos;s middle has more letters than there are middle fingers. Explore the exact
            assignment below, or jump straight to the full list.
          </p>
        </Callout>

        <h2 id="explorer">Interactive finger map</h2>
        <p>
          Hover over a key with a mouse, tap it on a touchscreen, or tab to it with a keyboard —
          the hand diagram lights up the exact finger responsible. Click a finger in the legend to
          see every key it owns at once.
        </p>

        <FingerMapExplorer />

        <h2 id="home-row">Home row and the F/J bumps</h2>
        <p>
          Home row is the resting position every reach starts and ends at: left fingers on{" "}
          <code>A S D F</code>, right fingers on <code>J K L ;</code>, both thumbs on the space
          bar. On almost every physical keyboard, <code>F</code> and <code>J</code> carry a small
          raised bump — that&apos;s how your index fingers confirm home row by touch alone, without
          your eyes ever leaving the screen. Every other key on the board is one short reach away
          from a home-row key, then a return — never a full hand repositioning.
        </p>

        <h2 id="full-map">The full finger-to-key list</h2>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-4 font-medium text-foreground">Finger</th>
              <th className="py-2 font-medium text-foreground">Keys</th>
            </tr>
          </thead>
          <tbody className="[&_tr]:border-b [&_tr]:border-border">
            {FINGER_COLUMNS.map((row) => (
              <tr key={row.finger}>
                <td className="py-2 pr-4 font-medium text-foreground">{row.finger}</td>
                <td className="py-2 font-mono text-xs">{row.keys}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 id="why-it-works">Why this exact system</h2>
        <p>
          This isn&apos;t an arbitrary convention — it&apos;s built to minimize how far your hands
          travel across ordinary English text, and to offload key location to muscle memory
          instead of vision. A reach that&apos;s stored as a movement pattern, rather than a conscious
          look-find-decide-move sequence, executes faster and far more consistently. The specific
          home-row layout in use today traces back to court stenographer Frank McGurrin, who
          popularized typing without looking in 1888 and proved it was faster than hunt-and-peck
          in a public contest — the same home position he used is still the standard taught
          worldwide.
        </p>

        <h2 id="shift">Shift, numbers, and punctuation</h2>
        <p>
          <strong>Shift</strong> is typed with the pinky on the <em>opposite</em> hand from the
          letter being capitalized: right Shift for a left-hand letter, left Shift for a
          right-hand letter. This keeps one hand fully free to hold Shift while the other hand&apos;s
          normal finger reaches the letter it already owns — nothing about the letter&apos;s own
          finger assignment changes.
        </p>
        <p>
          <strong>Numbers</strong> extend the same column logic upward from the top row — each
          number is typed by the same finger as the letter directly below it (<code>1</code> and{" "}
          <code>Q</code> both belong to the left pinky, for example). <strong>Punctuation</strong>{" "}
          on the base layer (<code>, . / ;</code>) belongs to the right hand&apos;s outer fingers, in
          the same column pattern as the letters beside them; shifted punctuation (<code>! ? :</code>
          {" "}and similar) is typed the same way as a shifted letter — opposite-hand Shift, plus
          the key&apos;s normal finger.
        </p>

        <h2 id="reference-images">Printable reference</h2>
        <p>Two static reference charts, useful to print or pin up next to a keyboard.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <figure className="flex flex-col gap-2">
            <Image
              src="/guides/shared/home-row-finger-placement.webp"
              alt="Left and right hand finger placement on the QWERTY home row, with the F and J key bumps highlighted"
              width={1672}
              height={941}
              className="w-full rounded-xl border border-border"
            />
            <figcaption className="text-xs text-sub">Home row starting position.</figcaption>
          </figure>
          <figure className="flex flex-col gap-2">
            <Image
              src="/guides/shared/keyboard-finger-zones-map.webp"
              alt="Full QWERTY keyboard color-coded by which finger is responsible for each key"
              width={1672}
              height={941}
              className="w-full rounded-xl border border-border"
            />
            <figcaption className="text-xs text-sub">The complete finger-zone map.</figcaption>
          </figure>
        </div>

        <h2 id="practice">How to actually learn it</h2>
        <ol>
          <li>Index anchor keys first (<code>F</code> &amp; <code>J</code>) using tactile bump orientation.</li>
          <li>Home row radiating outward in symmetrical pairs (<code>D &amp; K</code>, <code>S &amp; L</code>, <code>A &amp; ;</code>, <code>G &amp; H</code>), followed by a consolidation review.</li>
          <li>Top row reaches paired symmetrically (<code>E &amp; I</code>, <code>R &amp; U</code>, <code>T &amp; Y</code>, <code>W &amp; O</code>, <code>Q &amp; P</code>) and consolidated.</li>
          <li>Bottom row downward curls paired symmetrically (<code>V &amp; M</code>, <code>C &amp; ,</code>, <code>X &amp; .</code>, <code>Z &amp; /</code>, <code>B &amp; N</code>) and consolidated.</li>
          <li>Capitalization (opposite-hand Shift), number row pairs, and punctuation/symbols across Intermediate and Advanced tiers.</li>
        </ol>
        <p>
          That&apos;s the exact 28-unit progression <Link href="/lessons">HeroTyping&apos;s typing lessons</Link> follow,
          introducing at most two new keys per unit with an interactive visual keyboard and tactile finger guide. For targeted drill sets across keyboard zones, explore our guides on{" "}
          <Link href="/guides/home-row-typing-practice">home row typing practice</Link> and{" "}
          <Link href="/guides/bottom-row-typing-practice">bottom row typing practice</Link>. For the day-by-day version
          of this plan, see{" "}
          <Link href="/guides/how-to-type-without-looking-at-the-keyboard">
            how to type without looking at the keyboard
          </Link>
          , or the full technique walkthrough at{" "}
          <Link href="/guides/how-to-touch-type">how to touch type</Link>.
        </p>

        <h2 id="mistakes">Common mistakes</h2>
        <div className="flex flex-col gap-3">
          {MISTAKES.map((row) => (
            <div key={row.mistake} className="theme-transition rounded-xl border border-border bg-sub-alt/20 p-4">
              <p className="text-sm font-medium text-foreground">{row.mistake}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">{row.fix}</p>
            </div>
          ))}
        </div>

        <p>
          Ready to put it into practice? <Link href="/lessons">Start with lesson one</Link>, or{" "}
          <Link href="/">take a typing test</Link> to see where you stand today.
        </p>

        <FaqSection items={FAQ_ITEMS} />

        <SourceList
          sources={[
            { label: "Wikipedia — Touch typing", href: "https://en.wikipedia.org/wiki/Touch_typing" },
          ]}
        />

        <p className="text-xs text-sub/70">Last updated {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}
