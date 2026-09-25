import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { SourceList } from "@/components/content/source-list";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/lib/seo/constants";

export const metadata: Metadata = pageMetadata({
  title: "How to Improve Typing Speed: The Complete Training System",
  description:
    "A step-by-step system for typing faster: fix accuracy first, find your weak keys, drill them, and track real progress from 20 WPM to 100+.",
  path: "/guides/how-to-improve-typing-speed",
});

const PUBLISHED = "2026-09-15";
const UPDATED = "2026-09-24";

const LADDER = [
  {
    range: "20 → 30 WPM",
    focus: "Home row automaticity",
    detail:
      "The bottleneck is almost never speed at this stage — it's still looking for keys. Stop timing yourself and spend sessions on pure key-location drills until A S D F J K L ; stop requiring thought.",
  },
  {
    range: "30 → 40 WPM",
    focus: "Full-keyboard reach without looking down",
    detail:
      "Extend the same no-look discipline to every row, not just home row. This is where most self-taught typists still glance down for numbers, punctuation, or less-common letters like Q, X, and Z.",
  },
  {
    range: "40 → 50 WPM",
    focus: "Eliminating hesitation on specific letter pairs",
    detail:
      "You know every key; the slowdown is now specific bigrams and trigrams (certain two- and three-letter combinations) that make you pause. Identify which ones and drill them directly rather than retyping full paragraphs hoping they improve on their own.",
  },
  {
    range: "50 → 60 WPM",
    focus: "Rhythm and reduced backspacing",
    detail:
      "Gains here come less from raw finger speed and more from smoother, more even pacing and fewer stop-and-fix interruptions. Watch your consistency score, not just WPM.",
  },
  {
    range: "60 → 80 WPM",
    focus: "Sustained accuracy under longer tests",
    detail:
      "Many typists can burst to 70–80 WPM for 15 seconds but sustain far less over a full minute or two. The work shifts to holding your pace for the whole test, not producing a higher peak.",
  },
  {
    range: "80 → 100+ WPM",
    focus: "Diminishing returns, real gains get smaller and slower",
    detail:
      "This range is genuinely difficult and progress is measured in weeks, not sessions. Small technique refinements (reduced finger travel, better anticipation of the next word) matter more than volume of practice.",
  },
];

const SCHEDULE = [
  {
    level: "Under 40 WPM",
    daily: "15–20 min",
    focus: "Home-row and full-keyboard key-location drills, low pressure, accuracy only",
  },
  {
    level: "40–60 WPM",
    daily: "15–20 min",
    focus: "Weak-key drills from your own results, plus normal-length tests at a pace you can hold near 100% accuracy",
  },
  {
    level: "60–80 WPM",
    daily: "10–15 min",
    focus: "Consistency-focused sessions; longer tests (2–5 min) to expose fatigue-driven slowdowns",
  },
  {
    level: "80+ WPM",
    daily: "10–15 min, most days",
    focus: "Sustained tests at full length; technique refinement over volume",
  },
];

const FAQ_ITEMS = [
  {
    question: "How can I type faster without making more mistakes?",
    answer:
      "Slow down on purpose for a few sessions. Speed built on top of low accuracy just adds more corrections, which cost more time than the extra speed saves. Practice at a pace where you can hold close to 100% accuracy, and let your WPM rise from there — it reliably does within a few sessions.",
    plainAnswer:
      "Slow down on purpose for a few sessions. Practice at a pace where you can hold close to 100% accuracy, and WPM reliably rises from there within a few sessions.",
  },
  {
    question: "How long does it take to noticeably improve typing speed?",
    answer:
      "With focused daily practice (15–20 minutes), most typists see a measurable jump within two to three weeks. Going from a comfortable plateau to a meaningfully higher one — say 40 to 55 WPM — more typically takes four to eight weeks of consistent practice, not a single weekend.",
    plainAnswer:
      "With focused daily practice, most typists see a measurable jump within two to three weeks; a meaningful plateau shift typically takes four to eight weeks.",
  },
  {
    question: "Is it worth relearning touch typing if I already type fast with a few fingers?",
    answer:
      "Usually yes, if you're serious about pushing past your current ceiling. A non-standard finger system can plateau at a respectable speed, but it caps out lower than a full ten-finger system because more keys require moving your whole hand instead of one finger. It also feels like a step backward for the first week or two before it pays off.",
    plainAnswer:
      "Usually yes if you want to push past your current ceiling — a non-standard finger system caps out lower because more keys require whole-hand movement instead of a single finger.",
  },
  {
    question: "Why did my WPM suddenly drop after weeks of improvement?",
    answer:
      "This is almost always fatigue, distraction, or unfamiliar text (new punctuation, numbers, or vocabulary), not a real skill regression. Check your accuracy and consistency scores for that session before assuming you've lost ground — a single bad test is noise, not a trend.",
    plainAnswer:
      "This is almost always fatigue, distraction, or unfamiliar text rather than a real skill regression — check accuracy and consistency before assuming you've lost ground.",
  },
];

export default function HowToImproveTypingSpeedPage() {
  const schema = buildArticleSchema({
    headline: "How to Improve Typing Speed: The Complete Training System",
    description:
      "A step-by-step system for typing faster: fix accuracy first, find your weak keys, drill them, and track real progress from 20 WPM to 100+.",
    path: "/guides/how-to-improve-typing-speed",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <GuideLayout
        title="How to Improve Your Typing Speed"
        subtitle="A practical training system, not generic advice — fix accuracy, find your weak keys, drill them, retest."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "How to Improve Your Typing Speed", path: "/guides/how-to-improve-typing-speed" },
        ]}
        toc={[
          { id: "improvement-loop", label: "The improvement loop" },
          { id: "fix-accuracy", label: "Fix accuracy before speed" },
          { id: "ten-fingers", label: "Use all ten fingers" },
          { id: "ladder", label: "The WPM progression ladder" },
          { id: "how-much", label: "How much and how often" },
          { id: "habits", label: "Habits that cap your speed" },
          { id: "put-into-practice", label: "Put it into practice" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Quick answer">
          <p>
            Typing speed improves fastest by fixing accuracy first, then technique, then practice
            structure — in that order. Most self-taught typists plateau not because they can&apos;t
            move their fingers faster, but because they&apos;re still looking at the keyboard,
            correcting mistakes mid-word, or practicing text that&apos;s already easy for them
            instead of their actual weak points.
          </p>
        </Callout>

        <p>
          Typing speed is a motor skill, not a talent. Almost everyone who types daily for work
          already has a stable ceiling somewhere between 30 and 60 WPM, and almost everyone can
          push past it with a few weeks of deliberate practice. The system below is what actually
          moves that ceiling — not &ldquo;practice more,&rdquo; but a repeatable loop you run
          every session.
        </p>

        <h2 id="improvement-loop">The improvement loop</h2>
        <p>
          Run this loop instead of just repeating tests. Each step feeds the next one with real
          data instead of guesswork.
        </p>
        <ol>
          <li>
            <strong>Take a baseline test.</strong> <Link href="/">Run a normal-length typing test</Link>{" "}
            at your usual pace. This is your starting number for both WPM and accuracy — you need
            it before you can measure anything.
          </li>
          <li>
            <strong>Identify your weak keys.</strong> Notice which specific letters or combinations
            you mistype repeatedly, not just your overall accuracy percentage. A single stubborn
            bigram (like &ldquo;ie&rdquo; or &ldquo;tion&rdquo;) can quietly cap an otherwise solid
            typist.
          </li>
          <li>
            <strong>Train weak combinations directly.</strong> Don&apos;t just retype full
            paragraphs and hope the weak spot improves incidentally.{" "}
            <Link href="/lessons">Targeted lesson drills</Link> and unfamiliar vocabulary from{" "}
            <Link href="/vocabulary">vocabulary practice</Link> both force exactly this kind of
            deliberate exposure, rather than letting you coast on words you already type well.
          </li>
          <li>
            <strong>Retest.</strong> Run the same test type again. Comparing like-for-like (same
            duration, similar text type) is the only fair way to see if the drilling actually
            worked.
          </li>
          <li>
            <strong>Track accuracy, not just WPM.</strong> A higher WPM with lower accuracy isn&apos;t
            progress — it&apos;s a trade you haven&apos;t paid for yet. Watch both numbers together.
          </li>
          <li>
            <strong>Repeat.</strong> This loop, run consistently, is what actually moves your
            baseline — a single great test is a fluke; a rising baseline across a week of tests is
            real progress.
          </li>
        </ol>

        <h2 id="fix-accuracy">Fix accuracy before you chase speed</h2>
        <p>
          This is the single biggest lever, and it&apos;s counterintuitive: slowing down on
          purpose is usually the fastest way to get faster. Every corrected mistake costs a
          backspace, a re-type, and a broken rhythm — three penalties for one error. A typist who
          runs at 90% accuracy and 60 WPM is almost always slower in practice than one who runs at
          99% accuracy and 50 WPM, once correction time is counted.
        </p>
        <p>
          Concretely: for your next few sessions, stop trying to beat your best WPM. Instead, aim
          for a session where you make close to zero mistakes, even if it feels slow. Speed
          reliably follows accuracy within a few sessions; it rarely works the other way around.
          {SITE_NAME} tracks accuracy and consistency separately from WPM on every results screen
          specifically so you can watch this trade-off instead of guessing at it. See{" "}
          <Link href="/guides/how-to-improve-typing-accuracy">how to improve typing accuracy</Link>{" "}
          for the full accuracy-specific system.
        </p>

        <h2 id="ten-fingers">Use all ten fingers, and keep them home</h2>
        <p>
          If you currently hunt-and-peck or type with a personal four-or-six-finger system, this
          is the highest-ceiling fix available, even though it feels like a regression for the
          first few days. The standard layout: left fingers rest on <code>A S D F</code>, right
          fingers on <code>J K L ;</code>, both thumbs on the space bar. Every other key is
          reached by moving one finger out from its home position and back — not by moving your
          whole hand.
        </p>
        <p>
          The reason this matters for speed specifically (not just for typing without looking):
          keeping fingers on home row means every keystroke is a short, consistent motion instead
          of a hand repositioning. Repositioning is what actually costs time, far more than the
          keystroke itself. If home row still isn&apos;t automatic yet,{" "}
          <Link href="/lessons">structured typing lessons</Link> walk through finger placement key
          by key, with an on-screen hand diagram, before moving on to full sentences — or see{" "}
          <Link href="/guides/how-to-touch-type">how to touch type</Link> for the full finger map
          and practice order in one place.
        </p>

        <h2 id="ladder">The WPM progression ladder</h2>
        <p>
          What actually limits you changes as you get faster — the fix for 25 WPM is not the fix
          for 75 WPM. These ranges are practical stages, not strict thresholds; most typists move
          through them out of order or in overlapping bursts.
        </p>
        <Image
          src="/guides/wpm-progression-ladder.webp"
          alt="Ladder diagram of typing speed progression stages from 20 to 100+ WPM, with the focus area for each stage"
          width={1086}
          height={1448}
          className="mx-auto max-w-sm rounded-xl border border-border sm:max-w-md"
        />
        <div className="flex flex-col gap-3">
          {LADDER.map((step) => (
            <div key={step.range} className="rounded-xl border border-border bg-sub-alt/20 p-4">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                {step.range}
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">{step.focus}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">{step.detail}</p>
            </div>
          ))}
        </div>

        <h2 id="how-much">How much and how often to practice</h2>
        <p>
          Fifteen focused minutes a day beats one exhausted hour once a week. Typing speed gains
          come from your fingers building consistent, low-error motor patterns, and that kind of
          learning degrades once you&apos;re tired or distracted — you end up practicing your
          mistakes as much as your correct movements. If your accuracy is dropping mid-session,
          that&apos;s the signal to stop, not push through.
        </p>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-4 font-medium text-foreground">Current level</th>
              <th className="py-2 pr-4 font-medium text-foreground">Daily practice</th>
              <th className="py-2 font-medium text-foreground">What to focus on</th>
            </tr>
          </thead>
          <tbody className="[&_tr]:border-b [&_tr]:border-border">
            {SCHEDULE.map((row) => (
              <tr key={row.level}>
                <td className="py-2 pr-4">{row.level}</td>
                <td className="py-2 pr-4 whitespace-nowrap">{row.daily}</td>
                <td className="py-2">{row.focus}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 id="habits">Common habits that quietly cap your speed</h2>
        <ul>
          <li>
            <strong>Looking at the keyboard.</strong> Every glance down and back up costs more
            time than the keystroke it was checking. If you can&apos;t type a sentence without
            looking, see{" "}
            <Link href="/guides/how-to-type-without-looking-at-the-keyboard">
              how to type without looking at the keyboard
            </Link>{" "}
            — technique work will pay off faster than more speed drills.
          </li>
          <li>
            <strong>Over-correcting minor mistakes.</strong> Backspacing to fix a single wrong
            character mid-word, rather than finishing the word and moving on, adds up. Some
            typists find it faster overall to accept a mistake and correct it as part of normal
            proofreading, rather than interrupting flow for every slip.
          </li>
          <li>
            <strong>Tensed hands and wrists.</strong> Speed comes from small, relaxed, repeated
            motions. Gripping the keyboard or hovering fingers tensely above the keys adds
            fatigue and, over a long session, actually slows you down.
          </li>
          <li>
            <strong>Practicing only on easy text.</strong> If every practice session uses common
            words you already type fluently, you&apos;re not training your weak points. Mixing in
            punctuation, numbers, or unfamiliar text (quotes, custom text) surfaces exactly the
            patterns that are currently limiting you. <Link href="/vocabulary">Vocabulary practice</Link>{" "}
            is a good source of unfamiliar words that still have real definitions behind them.
          </li>
        </ul>

        <h2 id="put-into-practice">Put it into practice</h2>
        <p>
          Start with a short test focused purely on accuracy, then check your consistency score
          before your WPM. <Link href="/">Open the typing test</Link> and try a words-mode test
          at a pace where you can stay near 100% accuracy — that&apos;s the pace worth building
          speed from. Curious where your result actually stands? See{" "}
          <Link href="/guides/average-typing-speed">what is a good typing speed</Link> for
          honest benchmarks instead of a single made-up number. Once accuracy feels automatic,{" "}
          <Link href="/games">typing games</Link> are a low-friction way to keep logging practice
          time without it feeling like a drill.
        </p>

        <FaqSection items={FAQ_ITEMS} />

        <SourceList
          sources={[
            {
              label:
                "Dhakal, Feit, Kristensson & Oulasvirta — \"Observations on Typing from 136 Million Keystrokes on a Website\" (Aalto University / CHI 2018)",
              href: "https://userinterfaces.aalto.fi/136Mkeystrokes/",
            },
          ]}
        />

        <p className="text-xs text-sub/70">Last updated {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}
