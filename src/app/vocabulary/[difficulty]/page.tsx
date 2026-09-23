import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { VOCAB_DIFFICULTIES, VOCAB_WORDS, type VocabDifficulty } from "@/lib/vocabulary/vocabulary-words";
import { VocabularyTest } from "@/components/vocabulary/vocabulary-test";

const LABEL: Record<VocabDifficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

function getDifficulty(value: string): VocabDifficulty | null {
  return (VOCAB_DIFFICULTIES as string[]).includes(value) ? (value as VocabDifficulty) : null;
}

export function generateStaticParams() {
  return VOCAB_DIFFICULTIES.map((difficulty) => ({ difficulty }));
}

export async function generateMetadata({
  params,
}: PageProps<"/vocabulary/[difficulty]">): Promise<Metadata> {
  const { difficulty: raw } = await params;
  const difficulty = getDifficulty(raw);
  if (!difficulty) return {};
  return {
    title: `${LABEL[difficulty]} Vocabulary Typing Test`,
    description: `Type ${VOCAB_WORDS[difficulty].length} ${LABEL[difficulty].toLowerCase()}-tier vocabulary words, each shown with a real definition, and build real vocabulary while you practice typing.`,
    alternates: { canonical: `/vocabulary/${difficulty}` },
  };
}

export default async function VocabularyDifficultyPage({
  params,
}: PageProps<"/vocabulary/[difficulty]">) {
  const { difficulty: raw } = await params;
  const difficulty = getDifficulty(raw);
  if (!difficulty) notFound();

  return (
    <div className="flex flex-1 flex-col items-center px-4 pb-16 pt-8 sm:px-8">
      <div className="mb-6 flex w-full max-w-2xl items-center justify-between">
        <Link
          href="/vocabulary"
          className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-sub transition-colors hover:text-foreground"
        >
          <ArrowLeft size={13} />
          All difficulties
        </Link>
      </div>

      <VocabularyTest difficulty={difficulty} />

      {/* No ad slot here — SiteFooter (every route) already renders one
          directly below this page's content. */}
    </div>
  );
}
