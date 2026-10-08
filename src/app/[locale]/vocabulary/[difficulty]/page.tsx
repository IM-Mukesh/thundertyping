import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VOCAB_DIFFICULTIES, VOCAB_WORDS, type VocabDifficulty } from "@/lib/vocabulary/vocabulary-words";
import { VocabularyTest } from "@/components/vocabulary/vocabulary-test";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { cn } from "@/lib/utils/cn";

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
  const { difficulty: raw } = await params;
  const difficulty = getDifficulty(raw);
  if (!difficulty) return {};
  const title = `${LABEL[difficulty]} Vocabulary Typing Test`;
  const description = `Type ${VOCAB_WORDS[difficulty].length} ${LABEL[difficulty].toLowerCase()}-tier vocabulary words, each shown with a real definition, and build real vocabulary while you practice typing.`;
  return {
    title,
    description,
    alternates: { canonical: `/vocabulary/${difficulty}` },
    openGraph: { 
      title, 
      description, 
      url: `/vocabulary/${difficulty}`,
      images: [{ url: "/opengraph-image" }]
    },
    twitter: { 
      title, 
      description,
      images: ["/opengraph-image"]
    },
  };
}

export default async function VocabularyDifficultyPage({
  params,
}: { params: Promise<{ difficulty: string, locale: string }> }) {
  const { difficulty: raw } = await params;
  const difficulty = getDifficulty(raw);
  if (!difficulty) notFound();

  return (
    <div className="flex flex-1 flex-col items-center px-4 pb-16 pt-8 sm:px-8">
      <div className="mb-6 w-full max-w-2xl">
        <Breadcrumbs
          items={[
            { name: "Vocabulary", path: "/vocabulary" },
            { name: `${LABEL[difficulty]} Tier`, path: `/vocabulary/${difficulty}` },
          ]}
        />
      </div>

      <div className="mb-8 flex w-full max-w-2xl flex-col items-center gap-2 text-center">
        <h1 className="font-display text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
          {LABEL[difficulty]} Vocabulary Typing Test
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-sub">
          {VOCAB_WORDS[difficulty].length} {BLURB[difficulty]} Each round shows a real definition and part of speech —
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
              {LABEL[tier]} Tier
            </Link>
          ))}
        </div>
      </div>

      <VocabularyTest difficulty={difficulty} />

      {/* No ad slot here — SiteFooter (every route) already renders one
          directly below this page's content. */}
    </div>
  );
}
