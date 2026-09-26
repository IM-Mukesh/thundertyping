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
  title: "How to Touch Type: Complete Beginner's Guide (Finger Map + Plan)",
  description:
    "The full finger-to-key map, why touch typing works, a practice progression that builds it in order, and a realistic timeline from zero to automatic.",
  path: "/guides/how-to-touch-type",
});

const PUBLISHED = "2026-09-24";
const UPDATED = "2026-09-24";

const MILESTONES = [
  { stage: "First session", detail: "Home row (A S D F / J K L ;) located by feel, using the F/J bumps, without looking." },
  { stage: "~10–15 hours", detail: "Full finger map covered slowly and deliberately; typing without looking becomes possible, even if slow." },
  { stage: "2–4 weeks", detail: "Common words and short sentences flow without conscious finger-by-finger thought." },
  { stage: "2–3 months", detail: "Touch typing is fully automatic at a comfortable pace for most regular typists — the point where technique stops being the bottleneck." },
];

const CHECKLIST = [
  "Both feet flat, back straight, screen at eye level",
  "Wrists floating just above the desk, not resting on it while typing",
  "Fingers on home row (A S D F / J K L ;) before every session",
  "Eyes on the screen, not the keyboard, even when it's slower at first",
  "Same finger for the same key, every time, even when a shortcut feels faster",
  "Return to home row after every reach",
];

const FAQ_ITEMS = [
  {
    question: "How long does it take to learn touch typing?",
    answer:
      "Most learners can locate home row by feel within a single session, reach a slow but real 40 WPM within about 10–15 hours of deliberate practice, and feel fully automatic within two to three months of regular use. These are commonly cited ranges from typing-education sources, not a guarantee — consistency matters more than any fixed timeline.",
    plainAnswer:
      "Most learners reach a slow but real 40 WPM within about 10–15 hours of practice, and feel fully automatic within two to three months of regular use.",
  },
  {
    question: "Do I really need to use the 'correct' finger for every key?",
    answer:
      "Yes, especially early on. Using whichever finger feels fastest in the moment feels efficient today but locks in the exact habit — looking down, repositioning your hand — that touch typing is meant to eliminate. The standard finger map exists because it minimizes total hand travel across normal English text, not arbitrarily.",
    plainAnswer:
      "Yes, especially early on — an ad-hoc finger choice feels efficient in the moment but locks in the habits (looking down, hand repositioning) touch typing is meant to eliminate.",
  },
  {
    question: "Can adults learn touch typing, or is it easier for kids?",
    answer:
      "Adults learn touch typing just as effectively as children — it's a motor-skill habit built through repetition at any age, not a developmental window. The main difference is usually patience: adults already type functionally with bad habits, which makes the temporary slowdown of relearning feel like more of a step backward than it does for a true beginner.",
    plainAnswer:
      "Adults learn touch typing just as effectively as children — the main challenge is usually patience with the temporary slowdown of unlearning bad habits.",
  },
  {
    question: "What's the difference between touch typing and typing fast?",
    answer:
      "Touch typing is a technique — fixed fingers, fixed keys, no looking. Speed is an outcome that follows once the technique is automatic. Someone can type fast with a non-standard method and hit a real ceiling; someone can touch type slowly at first and still have a much higher ceiling once the habit is built.",
    plainAnswer:
      "Touch typing is a technique (fixed fingers, no looking); speed is the outcome that follows once that technique becomes automatic.",
  },
];

export default function HowToTouchTypePage() {
  const schema = buildArticleSchema({
    headline: "How to Touch Type: Complete Beginner's Guide",
    description:
      "The full finger-to-key map, why touch typing works, a practice progression, and a realistic timeline from zero to automatic.",
    path: "/guides/how-to-touch-type",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="How to Touch Type"
        subtitle="The finger map first, speed later — touch typing is a position habit, not a speed drill."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "How to Touch Type", path: "/guides/how-to-touch-type" },
        ]}
        toc={[
          { id: "why-it-works", label: "Why it works" },
          { id: "home-row", label: "Start with the home row" },
          { id: "finger-map", label: "The full finger map" },
          { id: "posture", label: "Posture and hand position" },
          { id: "progression", label: "A practice progression" },
          { id: "timeline", label: "A realistic timeline" },
          { id: "mistakes", label: "Common mistakes" },
          { id: "automatic", label: "Once it's automatic" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Quick answer">
          <p>
            Touch typing means one assigned finger per key, always returning to a fixed home-row
            resting position, typed without looking down. Learn it in order — home row first, then
            the full keyboard, then real words — and it typically becomes fully automatic within
            two to three months of regular practice, not overnight.
          </p>
        </Callout>

        <p>
          Touch typing means one thing specifically: every key has one assigned finger, and that
          finger reaches for it and returns to the same resting spot every time, without your eyes
          checking where your hands are. It isn&apos;t about speed at first — it&apos;s a
          positional habit, and like any habit it&apos;s built by repetition in a fixed order, not
          by trying to type a whole sentence correctly on day one.
        </p>

        <h2 id="why-it-works">Why it works</h2>
        <p>
          Home-row touch typing isn&apos;t arbitrary tradition — it&apos;s built around minimizing
          how far your hands travel across normal English text, and around offloading key location
          to muscle memory instead of vision. Once a reach is stored as a movement pattern rather
          than a conscious decision, it executes faster and more consistently than any amount of
          &ldquo;thinking fast&rdquo; can match, because it skips the look-find-decide-move chain
          entirely. The method itself dates back further than most people expect: touch typing
          without looking was popularized by court stenographer Frank McGurrin in 1888, who
          demonstrated it was faster than hunt-and-peck typing in a public contest — and the same
          home-row position he used is still the standard taught worldwide today.
        </p>

        <h2 id="home-row">Start with the home row</h2>
        <p>
          Rest your left index, middle, ring and pinky fingers on <code>F</code>, <code>D</code>,{" "}
          <code>S</code> and <code>A</code>. Rest your right index, middle, ring and pinky on{" "}
          <code>J</code>, <code>K</code>, <code>L</code> and <code>;</code>. Both thumbs sit on the
          space bar. On almost every physical keyboard, <code>F</code> and <code>J</code> have a
          small raised bump — that&apos;s how you find home row by touch alone, without looking
          down. Every other key is reached by moving one finger out from its home key and back,
          never by shifting your whole hand.
        </p>

        <Image
          src="/guides/home-row-finger-placement.webp"
          alt="Left and right hand finger placement on the QWERTY home row, with the F and J key bumps highlighted"
          width={1672}
          height={941}
          className="w-full rounded-xl border border-border"
        />

        <h2 id="finger-map">The full finger map</h2>
        <p>Each finger owns a fixed column of keys across all three main rows:</p>
        <ul>
          <li>
            <strong>Left pinky:</strong> <code>Q A Z</code>
          </li>
          <li>
            <strong>Left ring:</strong> <code>W S X</code>
          </li>
          <li>
            <strong>Left middle:</strong> <code>E D C</code>
          </li>
          <li>
            <strong>Left index:</strong> <code>R F V</code> and <code>T G B</code> (the index
            fingers each cover two columns, not one)
          </li>
          <li>
            <strong>Right index:</strong> <code>U J M</code> and <code>Y H N</code>
          </li>
          <li>
            <strong>Right middle:</strong> <code>I K ,</code>
          </li>
          <li>
            <strong>Right ring:</strong> <code>O L .</code>
          </li>
          <li>
            <strong>Right pinky:</strong> <code>P ; /</code>
          </li>
          <li>
            <strong>Thumbs:</strong> space bar
          </li>
        </ul>
        <p>
          This is the exact map HeroTyping&apos;s{" "}
          <Link href="/lessons">on-screen keyboard and hand diagram</Link> highlight live while you
          type, so you can check your hand against it in real time instead of memorizing a chart
          in isolation. For a hover-or-tap version of this exact map, see the{" "}
          <Link href="/guides/touch-typing-finger-map">interactive touch-typing finger map</Link>.
        </p>

        <Image
          src="/guides/keyboard-finger-zones-map.webp"
          alt="Full QWERTY keyboard color-coded by which finger is responsible for each key"
          width={1672}
          height={941}
          className="w-full rounded-xl border border-border"
        />

        <h2 id="posture">Posture and hand position</h2>
        <Callout label="Checklist">
          <ul className="list-disc pl-4">
            {CHECKLIST.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Callout>

        <h2 id="progression">A practice progression that doesn&apos;t skip steps</h2>
        <p>
          Trying to touch type a full sentence before your fingers know eight keys by feel is why
          most self-taught attempts stall. The order that actually works:
        </p>
        <ol>
          <li>Left hand home row alone (A S D F), until it&apos;s automatic</li>
          <li>Right hand home row alone (J K L ;), same standard</li>
          <li>Both hands combined on the home row</li>
          <li>Top row, then bottom row, each hand separately before combining</li>
          <li>Numbers, then real words, then full sentences with punctuation</li>
        </ol>
        <p>
          That&apos;s the exact sequence <Link href="/lessons">HeroTyping&apos;s typing lessons</Link>{" "}
          follow, with the finger diagram fading out as you stop needing it — guided practice
          first, then independent practice once a stage feels automatic rather than effortful. Once
          the full map is comfortable, deliberately practicing without glancing down at all is its
          own skill — see{" "}
          <Link href="/guides/how-to-type-without-looking-at-the-keyboard">
            how to type without looking at the keyboard
          </Link>{" "}
          for that specific transition.
        </p>

        <h2 id="timeline">A realistic timeline</h2>
        <p>
          These are commonly cited ranges from typing-education sources, not a promise — everyone
          progresses at a different rate depending on practice consistency, not raw talent.
        </p>
        <div className="flex flex-col gap-3">
          {MILESTONES.map((row) => (
            <div key={row.stage} className="theme-transition rounded-xl border border-border bg-sub-alt/20 p-4">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                {row.stage}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">{row.detail}</p>
            </div>
          ))}
        </div>

        <h2 id="mistakes">Common mistakes when you&apos;re learning</h2>
        <ul>
          <li>
            <strong>Looking down to check.</strong> Every glance costs more time than the
            keystroke it was checking, and it delays the muscle memory you&apos;re actually trying
            to build.
          </li>
          <li>
            <strong>Reaching with the wrong finger because it&apos;s faster right now.</strong> It
            feels faster in the moment and guarantees you&apos;ll still be looking at the keyboard
            in six months. Use the assigned finger even when it&apos;s slower at first.
          </li>
          <li>
            <strong>Not returning to home row.</strong> The resting position is what makes every
            subsequent reach predictable. Skipping it turns touch typing back into hunting.
          </li>
          <li>
            <strong>Jumping straight to speed drills.</strong> Speed is what accuracy turns into
            once a movement is automatic — it&apos;s not a separate skill to practice before the
            movement is solid.
          </li>
        </ul>

        <h2 id="automatic">Once it&apos;s automatic</h2>
        <p>
          You&apos;ll know touch typing has actually taken hold when you can type a sentence
          without thinking about where your fingers are at all. From there,{" "}
          <Link href="/guides/how-to-improve-typing-speed">how to improve your typing speed</Link>{" "}
          covers what actually raises your WPM once the positions themselves are no longer the
          bottleneck. Or just <Link href="/">take a typing test</Link> and see where you land.
        </p>

        <FaqSection items={FAQ_ITEMS} />

        <SourceList
          sources={[
            { label: "Wikipedia — Touch typing", href: "https://en.wikipedia.org/wiki/Touch_typing" },
            {
              label: "Read&Spell — How long does it take to learn to touch type?",
              href: "https://www.readandspell.com/how-long-does-it-take-to-learn-to-touch-type",
            },
          ]}
        />

        <p className="text-xs text-sub/70">Last updated {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}
