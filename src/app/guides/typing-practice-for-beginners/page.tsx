import type { Metadata } from "next";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Typing Practice for Beginners: A Real Curriculum",
  description:
    "A structured typing practice curriculum for beginners: exercises by category, routines from 5 to 30 minutes, and what to practice at each skill stage.",
  path: "/guides/typing-practice-for-beginners",
});

const PUBLISHED = "2026-09-24";
const UPDATED = "2026-09-24";

const ROUTINES = [
  { minutes: "5 minutes", plan: "One home-row drill, then one short accuracy-focused test. For days with no time for more." },
  { minutes: "10 minutes", plan: "One key-location or bigram drill, one normal test, one look at which words caused hesitation." },
  { minutes: "15 minutes", plan: "Warm-up drill, two tests at a comfortable pace, then a weak-key or vocabulary drill targeting a specific pattern." },
  { minutes: "20 minutes", plan: "Warm-up, three tests with a short break between, then a longer (2-minute) test for consistency." },
  { minutes: "30 minutes", plan: "Full loop: warm-up, weak-key drill, several timed tests, one longer endurance test, then a quick review of what still felt hard." },
];

const STAGES = [
  {
    range: "Under 20 WPM",
    practice:
      "Pure key-location drills — home row first, then the rest of the keyboard, one row at a time. Skip full sentences entirely until the finger map is solid; typing sentences too early reinforces looking down.",
  },
  {
    range: "20–40 WPM",
    practice:
      "Short, common words and simple sentences, still slower than feels natural, prioritizing zero-look and high accuracy over speed. This is the stage to build the base habits that everything later depends on.",
  },
  {
    range: "40–60 WPM",
    practice:
      "Normal-length tests plus targeted drills on whichever specific letter combinations keep causing hesitation — comfortable words are no longer useful practice on their own.",
  },
  {
    range: "60–80 WPM",
    practice:
      "Longer tests (2–5 minutes) to expose fatigue-driven slowdowns, unfamiliar vocabulary to prevent coasting on memorized text, and close attention to consistency rather than peak speed.",
  },
  {
    range: "80+ WPM",
    practice:
      "Sustained full-length tests, varied and less-familiar text, and small technique refinements — gains here are slow and incremental, not dramatic.",
  },
];

const FAQ_ITEMS = [
  {
    question: "What should a complete beginner practice first?",
    answer:
      "Home row key location — nothing else. Skipping straight to words or sentences before the eight home-row keys are automatic is the most common reason self-taught typing plateaus early. A slow, boring session finding A S D F / J K L ; by feel is more valuable at this stage than any full-sentence typing test.",
    plainAnswer:
      "Home row key location, before anything else — skipping to words or sentences too early is the most common reason self-taught typing plateaus.",
  },
  {
    question: "How often should a beginner practice?",
    answer:
      "Short daily sessions (10–20 minutes) build the motor-memory habits typing depends on far more reliably than longer, infrequent ones. A tired hour once a week reinforces fatigue-driven mistakes almost as much as it reinforces correct movement.",
    plainAnswer:
      "Short daily sessions of 10–20 minutes build motor memory more reliably than longer, infrequent sessions.",
  },
  {
    question: "Is it better to practice with real words or random letters?",
    answer:
      "Both have a role. Random or synthetic letter combinations are useful early for drilling specific weak keys without the distraction of meaning; real words and sentences are what actually transfers to everyday typing, and should make up most practice once the basic finger map is solid.",
    plainAnswer:
      "Both have a role — synthetic drills for isolating weak keys early on, real words and sentences for everyday transfer once the basics are solid.",
  },
];

export default function TypingPracticeForBeginnersPage() {
  const schema = buildArticleSchema({
    headline: "Typing Practice for Beginners: A Real Curriculum",
    description:
      "A structured typing practice curriculum for beginners, with routines by time available and practice by skill stage.",
    path: "/guides/typing-practice-for-beginners",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Typing Practice for Beginners"
        subtitle="A real curriculum, not a list of tips — what to practice, in what order, for how long."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Typing Practice for Beginners", path: "/guides/typing-practice-for-beginners" },
        ]}
        toc={[
          { id: "exercises", label: "Exercises by category" },
          { id: "routines", label: "Routines by time available" },
          { id: "stages", label: "What to practice at each stage" },
          { id: "where", label: "Where to do this on HeroTyping" },
        ]}
        hasFaq
      >
        <Callout label="Quick answer">
          <p>
            Beginner typing practice works best in this order: home row key location, then the
            full finger map one row at a time, then short common words, then full sentences —
            each stage in short (10–20 minute) daily sessions rather than long occasional ones.
            Skipping ahead to sentences before the finger map is solid is the most common mistake.
          </p>
        </Callout>

        <p>
          &ldquo;Just practice more&rdquo; isn&apos;t useful advice — practicing the wrong thing
          for your current stage wastes time and can reinforce bad habits. What follows is a
          structured curriculum: exercises by category, routines sized to however much time you
          actually have, and what to prioritize at each skill level.
        </p>

        <h2 id="exercises">Exercises by category</h2>
        <ul>
          <li>
            <strong>Home row.</strong> A S D F / J K L ;, in every order, until finding them
            requires no thought at all. This is the foundation everything else builds on.
          </li>
          <li>
            <strong>Individual fingers.</strong> Isolate one finger&apos;s column of keys (for
            example, left pinky: Q A Z) and repeat it alone before combining with the rest of the
            hand.
          </li>
          <li>
            <strong>Letter combinations (bigrams and trigrams).</strong> Certain two- and
            three-letter combinations — &ldquo;th,&rdquo; &ldquo;ing,&rdquo; &ldquo;tion&rdquo; —
            appear constantly in English and are worth drilling directly rather than hoping they
            improve through general practice.
          </li>
          <li>
            <strong>Common words.</strong> A small set of words (&ldquo;the,&rdquo;
            &ldquo;and,&rdquo; &ldquo;you,&rdquo; &ldquo;that&rdquo;) make up a large share of
            everyday English and are worth being fast and automatic on specifically.
          </li>
          <li>
            <strong>Short sentences, then paragraphs.</strong> Once individual words are solid,
            combine them — sentence-level practice adds rhythm, spacing, and capitalization on top
            of the finger movements you&apos;ve already built.
          </li>
          <li>
            <strong>Accuracy drills.</strong> Deliberately slow, low-error sessions where the goal
            is a clean run, not a fast one.
          </li>
          <li>
            <strong>Speed drills.</strong> Short bursts at a pace slightly above comfortable, used
            sparingly and only once accuracy is already solid at your current pace.
          </li>
          <li>
            <strong>Endurance.</strong> Longer tests (2–5 minutes) that reveal whether your pace
            holds up once initial focus fades — a different skill from short-burst speed.
          </li>
        </ul>

        <h2 id="routines">Practice routines by time available</h2>
        <div className="flex flex-col gap-3">
          {ROUTINES.map((row) => (
            <div key={row.minutes} className="theme-transition rounded-xl border border-border bg-sub-alt/20 p-4">
              <p className="text-sm font-medium text-foreground">{row.minutes}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">{row.plan}</p>
            </div>
          ))}
        </div>

        <h2 id="stages">What to practice at each stage</h2>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-4 font-medium text-foreground">Current speed</th>
              <th className="py-2 font-medium text-foreground">What to focus on</th>
            </tr>
          </thead>
          <tbody className="[&_tr]:border-b [&_tr]:border-border">
            {STAGES.map((row) => (
              <tr key={row.range}>
                <td className="py-2 pr-4 whitespace-nowrap font-medium text-foreground">{row.range}</td>
                <td className="py-2">{row.practice}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 id="where">Where to actually do this on HeroTyping</h2>
        <p>
          <Link href="/lessons">Structured lessons</Link> run the home-row-to-sentences progression
          in order automatically, with an on-screen keyboard and hand diagram. Once the basics are
          solid, <Link href="/vocabulary">vocabulary practice</Link> supplies unfamiliar words that
          prevent coasting on memorized text, and <Link href="/games">typing games</Link> keep
          longer practice sessions from feeling like a drill. When you want a clean measurement of
          where you stand, <Link href="/">take a typing test</Link> under consistent conditions.
        </p>

        <FaqSection items={FAQ_ITEMS} />

        <p className="text-xs text-sub/70">Last updated {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}
