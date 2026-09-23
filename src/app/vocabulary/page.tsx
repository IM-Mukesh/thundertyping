import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { VOCAB_DIFFICULTIES, VOCAB_WORDS } from "@/lib/vocabulary/vocabulary-words";
import { VocabularyHubCard } from "@/components/vocabulary/vocabulary-hub-card";
import { AdSlot } from "@/components/layout/ad-slot";

export const metadata: Metadata = {
  title: "Vocabulary Typing Test",
  description:
    "Build real vocabulary while you type. Hundreds of words across Easy, Medium and Hard tiers, each shown with a real definition to learn as you practice. No sign-up required.",
  alternates: { canonical: "/vocabulary" },
};

export default function VocabularyHubPage() {
  const totalWords = VOCAB_DIFFICULTIES.reduce((sum, d) => sum + VOCAB_WORDS[d].length, 0);

  return (
    <div className="relative flex flex-1 flex-col items-center px-4 pb-16 pt-5 sm:px-8">
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 py-10 text-center sm:py-16">
        <span className="flex w-fit items-center gap-2 rounded-full border border-accent/40 bg-accent/5 px-3.5 py-1.5 font-display text-[10px] font-medium uppercase tracking-[0.3em] text-accent">
          <BookOpen size={12} aria-hidden="true" />
          New
        </span>

        <h1 className="font-display text-3xl font-black uppercase leading-[0.95] tracking-tight text-foreground sm:text-5xl">
          Type your way to
          <br />
          <span className="text-accent text-glow">a bigger vocabulary</span>
        </h1>

        <p className="max-w-xl text-sm leading-relaxed text-sub sm:text-base">
          Every round pairs a real definition with the word it describes — read it,
          type it, keep it. {totalWords} words across three tiers, and every word
          you type correctly is remembered, so future rounds put unfamiliar words
          in front of you first.
        </p>
      </section>

      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-10">
          <AdSlot id="vocabulary-hub-leaderboard" format="horizontal" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {VOCAB_DIFFICULTIES.map((difficulty) => (
            <VocabularyHubCard key={difficulty} difficulty={difficulty} wordCount={VOCAB_WORDS[difficulty].length} />
          ))}
        </div>
      </div>
    </div>
  );
}
