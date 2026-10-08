import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { TypingTestClient } from "@/components/typing-test/typing-test-client";
import { pageMetadata } from "@/lib/seo/metadata";
import { buildWebApplicationSchema } from "@/lib/seo/json-ld";

export const metadata: Metadata = pageMetadata({
  title: "Custom Text Typing Test — Practice Typing Your Own Text",
  description:
    "Practice typing any custom text, document, or code snippet. Paste up to 2,000 characters and practice with real-time feedback on HeroTyping. 100% private in your browser.",
  path: "/typing-test/custom-text",
});

export default function CustomTextTypingTestPage() {
  const appSchema = buildWebApplicationSchema();

  const breadcrumbs = [
    { name: "Typing Test", path: "/" },
    { name: "Custom Text", path: "/typing-test/custom-text" },
  ];

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-4 sm:px-8 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
        {/* Breadcrumb Navigation */}
        <div className="mb-4 w-full">
          <Breadcrumbs items={breadcrumbs} />
        </div>

        {/* Page Header (Above the fold) */}
        <header className="mb-6 flex w-full flex-col items-center text-center">
          <h1 className="font-display text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Custom Text Typing Test
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sub sm:text-base">
            Practice typing your own words, excerpts, or code.
            Paste or enter custom text into the prompt to begin with instant keystroke feedback.
          </p>
        </header>

        {/* Interactive Custom Text Typing Test */}
        <section aria-label="Custom Text Typing Test Tool" className="w-full">
          <TypingTestClient initialMode="custom" autoOpenCustomModal={true} />
        </section>

        {/* Explanatory & Educational Content */}
        <article className="mt-14 flex w-full flex-col gap-10 text-left">
          {/* Section: How it works */}
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              How Custom Text Typing Works
            </h2>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              Standard typing tests rely on randomized frequency dictionaries or famous literature quotes.
              While effective for general benchmarking, standard lists do not prepare you for specialized
              vocabulary, programming syntax, technical jargon, or specific material you write every day.
            </p>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              HeroTyping&rsquo;s custom text mode lets you paste or write any passage up to 2,000 characters
              (roughly 300 to 400 words). The engine parses your passage into discrete target words while preserving
              capitalization, numbers, and punctuation. The test automatically completes when you successfully finish
              the final word.
            </p>
          </section>

          {/* Section: High-value use cases */}
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              High-Impact Use Cases for Custom Text Practice
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-sub-alt/20 p-4">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-accent">
                  Programmers &amp; Developers
                </span>
                <p className="mt-1.5 text-xs leading-relaxed text-sub">
                  Paste boilerplate code, regular expressions, SQL queries, or JSON schemas. Practicing brackets,
                  semicolons, and camelCase identifiers builds physical fluidity where standard tests fail.
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-sub-alt/20 p-4">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-accent">
                  Students &amp; Academics
                </span>
                <p className="mt-1.5 text-xs leading-relaxed text-sub">
                  Practice typing textbook definitions, research summaries, or study notes. Combining active
                  recall with mechanical touch typing accelerates memorization before exams.
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-sub-alt/20 p-4">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-accent">
                  Medical &amp; Legal Transcriptionists
                </span>
                <p className="mt-1.5 text-xs leading-relaxed text-sub">
                  Rehearse complex terminology, pharmaceutical names, and formal legal clauses. Muscle memory
                  developed on specialized phrasing directly boosts on-the-job turnaround time.
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-sub-alt/20 p-4">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-accent">
                  Writers &amp; Public Speakers
                </span>
                <p className="mt-1.5 text-xs leading-relaxed text-sub">
                  Load your own manuscript paragraphs, presentation scripts, or speeches. Typing your own prose
                  helps you internalize rhythm and catch awkward phrasing before publication.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Privacy and Data Handling */}
          <section className="flex flex-col gap-3 rounded-xl border border-border/80 bg-sub-alt/30 p-6">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              100% Client-Side Privacy
            </h2>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              Whatever text you paste into HeroTyping remains strictly in your browser&rsquo;s memory. Your custom
              passages are never transmitted to a server, never logged in a remote database, and never used to train
              machine learning models.
            </p>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              Because custom texts vary arbitrarily in vocabulary and length, HeroTyping intentionally does not record
              global personal bests (PBs) or cloud synchronization for custom runs. This keeps your competitive
              ranking metrics clean while allowing you complete freedom to practice sensitive notes, work drafts, or
              code snippets in complete confidence.
            </p>
          </section>

          {/* Section: Input Guidelines */}
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              Formatting Guidelines for Best Results
            </h2>
            <ul className="flex flex-col gap-2.5 text-sm text-sub sm:text-base">
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">&bull;</span>
                <span>
                  <strong className="text-foreground">2,000 Character Ceiling:</strong> The custom text input accepts
                  up to 2,000 characters. If a pasted passage exceeds this limit, HeroTyping cleanly trims it at the
                  nearest previous word boundary rather than cutting a word mid-letter.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">&bull;</span>
                <span>
                  <strong className="text-foreground">Whitespace Normalization:</strong> Multiple contiguous spaces,
                  tabs, and line breaks are treated as standard single word separators so you can focus on fluid typing
                  rather than formatting quirks.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">&bull;</span>
                <span>
                  <strong className="text-foreground">Standard Keyboard Characters:</strong> Use standard ASCII letters,
                  numerals, and common punctuation. Non-keyboard Unicode symbols or unsupported diacritics will require
                  copying or complex composition that interrupts typing flow.
                </span>
              </li>
            </ul>
          </section>

          {/* Section: Next steps & Internal Links */}
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              Transitioning from Custom Text to Targeted Training
            </h2>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              Custom text practice is ideal for domain-specific vocabulary. When you notice persistent errors on
              certain reaches while typing your text, shift into our dedicated practice labs:
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/guides/custom-text-typing-test"
                className="group flex flex-col rounded-lg border border-border bg-background p-4 transition-colors hover:border-accent"
              >
                <span className="font-display text-sm font-bold uppercase text-foreground group-hover:text-accent">
                  Custom Text Practice Guide &rarr;
                </span>
                <span className="mt-1 text-xs text-sub">
                  Read our full guide on structuring daily custom text drills and document practice.
                </span>
              </Link>
              <Link
                href="/practice/weak-keys"
                className="group flex flex-col rounded-lg border border-border bg-background p-4 transition-colors hover:border-accent"
              >
                <span className="font-display text-sm font-bold uppercase text-foreground group-hover:text-accent">
                  Weak-Key Practice Drills &rarr;
                </span>
                <span className="mt-1 text-xs text-sub">
                  Isolate problematic letters that slowed down your custom document run.
                </span>
              </Link>
              <Link
                href="/practice/accuracy"
                className="group flex flex-col rounded-lg border border-border bg-background p-4 transition-colors hover:border-accent"
              >
                <span className="font-display text-sm font-bold uppercase text-foreground group-hover:text-accent">
                  Accuracy Focus Lab &rarr;
                </span>
                <span className="mt-1 text-xs text-sub">
                  Develop consistent 98%+ precision before returning to rapid text entry.
                </span>
              </Link>
              <Link
                href="/typing-test/1-minute"
                className="group flex flex-col rounded-lg border border-border bg-background p-4 transition-colors hover:border-accent"
              >
                <span className="font-display text-sm font-bold uppercase text-foreground group-hover:text-accent">
                  1-Minute Timed Benchmark &rarr;
                </span>
                <span className="mt-1 text-xs text-sub">
                  Benchmark your overall typing speed on a standardized 60-second assessment.
                </span>
              </Link>
            </div>
          </section>

          {/* Section: Frequently Asked Questions */}
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              Frequently Asked Questions
            </h2>
            <div className="flex flex-col divide-y divide-border/60">
              <div className="py-4">
                <h3 className="font-medium text-foreground text-sm sm:text-base">
                  How do I edit or replace the custom text I pasted?
                </h3>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-sub">
                  You can click &ldquo;Custom&rdquo; in the configuration bar or select the wrench icon indicator
                  above the word stream at any time to reopen the modal, paste new material, or adjust your passage.
                </p>
              </div>
              <div className="py-4">
                <h3 className="font-medium text-foreground text-sm sm:text-base">
                  Is there a minimum length for custom text?
                </h3>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-sub">
                  There is no rigid minimum, but passages of at least 30 to 50 words provide a meaningful rhythm.
                  If you submit an empty box, HeroTyping defaults to a standard pangram sentence as a safe fallback.
                </p>
              </div>
              <div className="py-4">
                <h3 className="font-medium text-foreground text-sm sm:text-base">
                  Does custom text track a timer or word count?
                </h3>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-sub">
                  Custom mode operates as a completed passage test: the timer measures how many seconds you take to
                  type the entire text, and your WPM is calculated upon typing the final character.
                </p>
              </div>
              <div className="py-4">
                <h3 className="font-medium text-foreground text-sm sm:text-base">
                  Will my pasted text be saved if I refresh the page?
                </h3>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-sub">
                  For security and privacy, custom text is held in active memory and is not stored in your permanent
                  browser storage or database. Refreshing the browser resets the text.
                </p>
              </div>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
