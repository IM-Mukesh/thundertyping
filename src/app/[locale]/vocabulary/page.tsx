import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { VOCAB_DIFFICULTIES, VOCAB_WORDS } from "@/lib/vocabulary/vocabulary-words";
import { VocabularyHubCard } from "@/components/vocabulary/vocabulary-hub-card";
import { AdSlot } from "@/components/layout/ad-slot";
import { localizedPageMetadata } from "@/lib/seo/metadata";
import { buildDefinedTermSetSchema } from "@/lib/seo/json-ld";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return localizedPageMetadata({
    locale,
    title: "Vocabulary Typing Test — Practice by Difficulty",
    description:
      "Build real vocabulary while you type. 1,300 curated words with definitions across Easy (650), Medium (390), and Hard (260) tiers. Free, no sign-up required.",
    path: "/vocabulary",
  });
}

export default async function VocabularyHubPage({ params }: { params?: Promise<{ locale: string }> }) {
  const resolvedParams = params ? await params : undefined;
  const locale = resolvedParams?.locale ?? "en";
  const totalWords = VOCAB_DIFFICULTIES.reduce((sum, d) => sum + VOCAB_WORDS[d].length, 0);

  // Take 4 sample terms from each tier for schema and initial server-rendered HTML
  const sampleTerms = VOCAB_DIFFICULTIES.flatMap((diff) =>
    VOCAB_WORDS[diff].slice(0, 4).map((item) => ({
      name: item.word,
      description: item.definition,
    })),
  );

  const schema = buildDefinedTermSetSchema({
    name: "HeroTyping Curated Vocabulary Dictionary",
    description: "1,300 curated English vocabulary words with parts of speech and definitions, organized into Easy, Medium, and Hard practice tiers.",
    path: locale === "en" ? "/vocabulary" : `/${locale}/vocabulary`,
    terms: sampleTerms,
  });

  return (
    <div className="relative flex flex-1 flex-col items-center px-4 pb-16 pt-5 sm:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 py-10 text-center sm:py-16">
        <span className="flex w-fit items-center gap-2 rounded-full border border-accent/40 bg-accent/5 px-3.5 py-1.5 font-display text-[10px] font-medium uppercase tracking-[0.3em] text-accent">
          <BookOpen size={12} aria-hidden="true" />
          Curated Dictionary
        </span>

        <h1 className="font-display text-3xl font-black uppercase leading-[0.95] tracking-tight text-foreground sm:text-5xl">
          Type your way to{" "}
          <br />
          <span className="text-accent text-glow">a bigger vocabulary</span>
        </h1>

        <p className="max-w-xl text-sm leading-relaxed text-sub sm:text-base">
          Every round pairs a real definition with the word it describes — read it,
          type it, keep it. Exactly {totalWords} words across three tiers (650 Easy, 390 Medium, 260 Hard). Every word
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

        {/* Server-Rendered Sample Word Previews */}
        <div className="mt-16 flex flex-col gap-8 rounded-2xl border border-border-subtle bg-surface/85 p-6 sm:p-8 backdrop-blur-xs shadow-xs">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              Curated Vocabulary Previews by Difficulty
            </h2>
            <p className="text-xs text-sub sm:text-sm">
              Explore sample words, grammatical parts of speech, and dictionary definitions included across each tier:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VOCAB_DIFFICULTIES.map((tier) => (
              <div key={tier} className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-accent">
                    {tier} Tier ({VOCAB_WORDS[tier].length} words)
                  </span>
                  <Link
                    href={locale === "en" ? `/vocabulary/${tier}` : `/${locale}/vocabulary/${tier}`}
                    className="text-[11px] text-sub underline hover:text-foreground"
                  >
                    Practice →
                  </Link>
                </div>
                <div className="flex flex-col gap-2.5">
                  {VOCAB_WORDS[tier].slice(0, 4).map(({ word, pos, definition }) => (
                    <div key={word} className="flex flex-col text-xs leading-relaxed">
                      <div className="flex items-baseline gap-1.5 font-semibold text-foreground">
                        <span>{word}</span>
                        <span className="font-mono text-[10px] text-sub font-normal">{pos}</span>
                      </div>
                      <p className="text-[11px] text-sub/90">{definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
