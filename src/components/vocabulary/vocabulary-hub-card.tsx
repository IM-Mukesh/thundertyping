"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { parseVocabProgress, vocabProgressKey } from "@/lib/vocabulary/vocabulary-progress";
import { getStorageItem } from "@/lib/persistence/storage";
import type { VocabDifficulty } from "@/lib/vocabulary/vocabulary-words";

// A score only changes by playing a round, which means leaving this page and
// coming back — nothing to subscribe to while the hub is open.
const noopSubscribe = () => () => {};

const META: Record<VocabDifficulty, { label: string; blurb: string }> = {
  easy: { label: "Easy", blurb: "Everyday words worth knowing cold." },
  medium: { label: "Medium", blurb: "Sharper, more precise everyday vocabulary." },
  hard: { label: "Hard", blurb: "Advanced words for serious readers and writers." },
};

interface VocabularyHubCardProps {
  difficulty: VocabDifficulty;
  wordCount: number;
}

export function VocabularyHubCard({ difficulty, wordCount }: VocabularyHubCardProps) {
  // useSyncExternalStore rather than a mount effect: it returns null for the
  // server snapshot and the real value for the client one, so React
  // reconciles the difference itself instead of a hydration mismatch (or the
  // setState-in-effect lint rule) — same pattern as GameBestBadge.
  const raw = useSyncExternalStore(
    noopSubscribe,
    () => getStorageItem(vocabProgressKey()),
    () => null,
  );
  const mastered = useMemo(() => parseVocabProgress(raw)[difficulty].mastered.length, [raw, difficulty]);

  return (
    <Link
      href={`/vocabulary/${difficulty}`}
      className="arcade-edge-hover group flex flex-col gap-3 rounded-2xl border border-border bg-sub-alt/20 p-6 transition-colors hover:border-accent"
    >
      <span className="w-fit rounded-full border border-accent/40 bg-accent/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
        {META[difficulty].label}
      </span>
      <p className="text-sm text-sub">{META[difficulty].blurb}</p>
      <div className="flex items-center justify-between font-mono text-xs text-sub">
        <span>{wordCount} words</span>
        <span>{mastered} mastered</span>
      </div>
      <span className="mt-2 flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-accent">
        Start
        <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
