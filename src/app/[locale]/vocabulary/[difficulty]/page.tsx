import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VOCAB_DIFFICULTIES, VOCAB_WORDS, type VocabDifficulty } from "@/lib/vocabulary/vocabulary-words";
import { VocabularyTest } from "@/components/vocabulary/vocabulary-test";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { cn } from "@/lib/utils/cn";
import { buildDefinedTermSetSchema } from "@/lib/seo/json-ld";

const LABEL: Record<VocabDifficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

const BLURB: Record<VocabDifficulty, string> = {
  easy: "everyday words worth knowing cold — a good starting point if you're new to vocabulary practice.",
  medium: "sharper, more precise everyday vocabulary, once the easy tier feels comfortable.",
  hard: "advanced words for serious readers and writers who want their vocabulary to match their typing speed.",
};

function getDifficulty(value: string): VocabDifficulty | null {
  return (VOCAB_DIFFICULTIES as string[]).includes(value) ? (value as VocabDifficulty) : null;
}

export function generateStaticParams() {
  return VOCAB_DIFFICULTIES.map((difficulty) => ({ difficulty }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ difficulty: string, locale: string }> }): Promise<Metadata> {
  const { difficulty: raw, locale } = await params;
  const difficulty = getDifficulty(raw);
  if (!difficulty) {
    return {
      title: "Vocabulary Tier Not Found",
      robots: { index: false, follow: false },
    };
  }
  const title = `${LABEL[difficulty]} Vocabulary Typing Test`;
  const description = `Type ${VOCAB_WORDS[difficulty].length} ${LABEL[difficulty].toLowerCase()}-tier vocabulary words, each shown with a real definition, and build real vocabulary while you practice typing.`;
  const path = locale === "en" ? `/vocabulary/${difficulty}` : `/${locale}/vocabulary/${difficulty}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { 
      title, 
      description,
      url: path,
      images: [{ url: "/opengraph-image" }],
    },
    twitter: {
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function VocabularyDifficultyPage({
  params,
}: { params: Promise<{ difficulty: string, locale: string }> }) {
  const { difficulty: raw, locale } = await params;
  const difficulty = getDifficulty(raw);
  if (!difficulty) notFound();

  const words = VOCAB_WORDS[difficulty];
  const sampleWords = words.slice(0, 12);
  const path = locale === "en" ? `/vocabulary/${difficulty}` : `/${locale}/vocabulary/${difficulty}`;

  const schema = buildDefinedTermSetSchema({
    name: `${LABEL[difficulty]} Vocabulary Typing Dictionary`,
    description: `${words.length} curated ${LABEL[difficulty].toLowerCase()}-tier vocabulary words with real dictionary definitions.`,
    path,
    terms: sampleWords.map((item) => ({ name: item.word, description: item.definition })),
  });

  return (
    <div className="flex flex-1 flex-col items-center px-4 pb-16 pt-8 sm:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="mb-6 w-full max-w-2xl">
        <Breadcrumbs
          items={[
            { name: "Vocabulary", path: "/vocabulary" },
            { name: `${LABEL[difficulty]} Tier`, path: `/vocabulary/${difficulty}` },
          ]}
          locale={locale}
        />
      </div>

      <div className="mb-8 flex w-full max-w-2xl flex-col items-center gap-2 text-center">
        <h1 className="font-display text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
          {LABEL[difficulty]} Vocabulary Typing Test
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-sub">
          {words.length} {BLURB[difficulty]} Each round shows a real definition and part of speech —
          type the word it describes, and words you get right stay out of your way next time. Want more context first?
          Try the <Link href="/lessons" className="text-accent underline underline-offset-2">typing lessons</Link>, or
          jump into a <Link href="/" className="text-accent underline underline-offset-2">plain typing speed test</Link>.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {VOCAB_DIFFICULTIES.map((tier) => (
            <Link
              key={tier}
              href={`/vocabulary/${tier}`}
              aria-current={tier === difficulty ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors",
                tier === difficulty
                  ? "border-accent bg-accent/15 text-accent font-semibold"
                  : "border-border bg-sub-alt/30 text-sub hover:border-accent hover:text-foreground",
              )}
            >
              {LABEL[tier]} Tier ({VOCAB_WORDS[tier].length})
            </Link>
          ))}
        </div>
      </div>

      <VocabularyTest difficulty={difficulty} />

      {/* Server-Rendered Tier Word Sample List */}
      <div className="mt-14 w-full max-w-3xl rounded-2xl border border-border bg-sub-alt/10 p-6 sm:p-8">
        <div className="mb-5 flex flex-col gap-1">
          <h2 className="font-display text-base font-bold uppercase tracking-wider text-foreground sm:text-lg">
            Sample {LABEL[difficulty]} Tier Vocabulary &amp; Definitions
          </h2>
          <p className="text-xs text-sub">
            A preview of curated words from this tier&apos;s {words.length}-word pool:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sampleWords.map(({ word, pos, definition }) => (
            <div key={word} className="flex flex-col rounded-xl border border-border/70 bg-background/60 p-3.5">
              <div className="flex items-baseline gap-2 font-semibold text-foreground">
                <span className="font-mono text-sm text-accent">{word}</span>
                <span className="font-mono text-[10px] text-sub">{pos}</span>
              </div>
              <p className="mt-1 text-xs text-sub leading-relaxed">{definition}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
