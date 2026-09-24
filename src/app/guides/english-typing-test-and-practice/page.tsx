import type { Metadata } from "next";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/lib/seo/constants";

export const metadata: Metadata = pageMetadata({
  title: "English Typing Test & Practice: What It Measures, How to Improve",
  description:
    "What an English typing test actually measures, why results change between tests, and example beginner-to-advanced passages to practice with.",
  path: "/guides/english-typing-test-and-practice",
});

const PUBLISHED = "2026-09-24";
const UPDATED = "2026-09-24";

const EXAMPLES = [
  {
    level: "Beginner",
    note: "Short, common words, minimal punctuation.",
    text: "The sun was warm and the wind was soft. We sat by the lake and did not say a word for a long time.",
  },
  {
    level: "Intermediate",
    note: "Longer words, standard punctuation, one comma-linked clause.",
    text: "Even though the meeting ran late, everyone stayed focused, and by the time we finished, the plan finally felt complete instead of rushed.",
  },
  {
    level: "Advanced",
    note: "Mixed punctuation, numbers, and less-common vocabulary.",
    text: "By 2031, the committee's third proposal — revised twice, and still contentious — had accumulated 47 formal objections, none of which fundamentally challenged its underlying premise.",
  },
];

const FAQ_ITEMS = [
  {
    question: "What does an English typing test actually measure?",
    answer:
      "Your typing speed (WPM) and accuracy on standard English prose — how quickly and correctly you can transcribe text you're reading, not how quickly you can compose original writing. Composition speed is typically slower than transcription speed, since it includes thinking time a typing test doesn't measure.",
    plainAnswer:
      "Your typing speed (WPM) and accuracy on standard English prose — transcription speed, not composition speed.",
  },
  {
    question: "Why is my English typing test result different from my result on another site?",
    answer:
      "Text difficulty, test duration, and whether gross or net WPM is reported all change the number for the same underlying skill — see how WPM is calculated for the exact reasons. Comparing results across sites is rarely apples-to-apples unless both use the same test length and text type.",
    plainAnswer:
      "Text difficulty, test duration, and gross vs. net WPM all change the number for the same underlying skill.",
  },
  {
    question: "Does punctuation and capitalization make a typing test harder?",
    answer:
      "Yes, measurably. Capital letters require a Shift-key combination instead of a single keystroke, and punctuation is often on less-practiced keys than common letters — both add real hesitation for typists who haven't specifically practiced them, even at a high plain-text WPM.",
    plainAnswer:
      "Yes — capital letters need a Shift combination and punctuation sits on less-practiced keys, both adding hesitation even for otherwise fast typists.",
  },
];

export default function EnglishTypingTestPage() {
  const schema = buildArticleSchema({
    headline: "English Typing Test & Practice: What It Measures, How to Improve",
    description:
      "What an English typing test measures, why results vary between tests, and example passages by level.",
    path: "/guides/english-typing-test-and-practice",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="English Typing Test & Practice"
        subtitle="What the test actually measures, why your score moves between sites, and passages to practice with."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "English Typing Test & Practice", path: "/guides/english-typing-test-and-practice" },
        ]}
        toc={[
          { id: "what-it-measures", label: "What it measures" },
          { id: "duration", label: "Why test duration matters" },
          { id: "punctuation", label: "Punctuation and numbers" },
          { id: "examples", label: "Example passages by level" },
          { id: "practice-for-real", label: "Practice for real" },
        ]}
        hasFaq
      >
        <Callout label="Quick answer">
          <p>
            An English typing test measures how fast and accurately you can transcribe standard
            English prose — words per minute and accuracy, over a fixed duration. Results vary
            between sites mainly because of text difficulty, test length, and whether gross or net
            WPM is reported, not because your underlying skill changed.
          </p>
        </Callout>

        <p>
          &ldquo;English typing test&rdquo; usually means transcribing real prose — full words,
          normal punctuation, standard capitalization — as opposed to random-character or
          numeric-only tests used for some specialized assessments. It measures a specific,
          practical skill: how fast you can turn text you&apos;re reading into text you&apos;ve
          typed, correctly.
        </p>

        <h2 id="what-it-measures">What it measures</h2>
        <ul>
          <li>
            <strong>WPM (words per minute).</strong> Your typing speed, using the standard
            5-character &ldquo;word&rdquo; unit — see{" "}
            <Link href="/guides/net-wpm-vs-gross-wpm">how WPM is calculated</Link> for the full
            formula.
          </li>
          <li>
            <strong>Accuracy.</strong> The share of your keystrokes that were correct — the more
            reliable long-term signal of real skill, since a high WPM built on frequent errors
            doesn&apos;t reflect usable output.
          </li>
          <li>
            <strong>Consistency (where reported).</strong> How even your pace stayed across the
            whole test, rather than a single burst — {SITE_NAME} reports this alongside WPM and
            accuracy on every result.
          </li>
        </ul>

        <h2 id="duration">Why test duration matters for English tests specifically</h2>
        <p>
          Short tests (15–30 seconds) tend to read faster because fatigue and sustained
          concentration haven&apos;t had time to matter yet. Longer tests (2–5 minutes) are a
          better measure of the speed you can actually sustain while reading and typing real
          prose. See{" "}
          <Link href="/guides/typing-test-duration-guide">which test duration to use</Link> for a
          full breakdown by goal.
        </p>

        <h2 id="punctuation">Why punctuation and numbers change your result</h2>
        <p>
          Plain lowercase prose is the easiest text to type quickly, because it uses only the
          keys you practice most. Capital letters require a Shift-key combination rather than a
          single keystroke; punctuation often sits on less-practiced keys; numbers require a
          reach away from home row entirely. A test heavy in any of these will read slower than a
          plain-text test at the same underlying skill level — that&apos;s the text, not a change
          in your ability.
        </p>

        <h2 id="examples">Example passages by level</h2>
        <p>
          Short original examples to get a feel for the jump in difficulty between levels — not a
          substitute for a real, randomized typing test.
        </p>
        <div className="flex flex-col gap-3">
          {EXAMPLES.map((example) => (
            <div key={example.level} className="rounded-xl border border-border bg-sub-alt/20 p-4">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                {example.level}
              </p>
              <p className="mt-1 text-xs text-sub/80">{example.note}</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{example.text}</p>
            </div>
          ))}
        </div>

        <h2 id="practice-for-real">Practice for real, not just these examples</h2>
        <p>
          <Link href="/">HeroTyping&apos;s typing test</Link> uses real quotes, word-mode text, and
          your own custom text, at durations you choose — a broader, less predictable set of
          English text than any fixed set of practice paragraphs could offer. If punctuation and
          numbers specifically are your weak point, mixing in custom text with both is more useful
          than repeating plain-word tests. For difficulty that ramps in a structured way rather
          than randomly, <Link href="/lessons">typing lessons</Link> build up from single words to
          full punctuated sentences in order.
        </p>

        <FaqSection items={FAQ_ITEMS} />

        <p className="text-xs text-sub/70">Last updated {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}
