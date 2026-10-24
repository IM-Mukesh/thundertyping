"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Check, RotateCcw, Share2, Sparkles, Target } from "lucide-react";
import type { TestState } from "@/lib/typing-engine/engine-types";
import {
  calculateAccuracy,
  calculateConsistency,
  calculateNetCpm,
  calculateNetWpm,
  calculateRawCpm,
  calculateRawWpm,
  round,
} from "@/lib/typing-engine/stats";
import { AdSlot } from "@/components/layout/ad-slot";
import { ResultsGraph } from "@/components/typing-test/results-graph";
import { trackEvent } from "@/lib/analytics";

import { useParams } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";

interface ResultsPanelProps {
  state: TestState;
  isNewBest: boolean;
  onRestart: () => void;
}

export function ResultsPanel({ state, isNewBest, onRestart }: ResultsPanelProps) {
  const [copied, setCopied] = useState(false);
  const params = useParams();
  const locale = typeof params?.locale === 'string' ? params.locale : 'en';
  const dict = getDictionary(locale);

  const {
    correctKeystrokes,
    incorrectKeystrokes,
    netWpmCharacters,
    elapsedMs,
    wpmSamples,
    charTally,
    totalTyped,
    correctedErrors,
  } = state;
  const isChinese = state.config?.languageCode === "zh";
  const netWpm = round(calculateNetWpm(netWpmCharacters, elapsedMs));
  const rawWpm = round(calculateRawWpm(correctKeystrokes, incorrectKeystrokes, elapsedMs));
  const netCpm = isChinese ? round(calculateNetCpm(netWpmCharacters, elapsedMs)) : 0;
  const rawCpm = isChinese ? round(calculateRawCpm(correctKeystrokes, incorrectKeystrokes, elapsedMs)) : 0;
  const accuracy = round(calculateAccuracy(correctKeystrokes, incorrectKeystrokes, charTally.missed));
  const consistency = round(calculateConsistency(wpmSamples));

  const handleRestart = () => {
    trackEvent("results_action_clicked", {
      action: "restart",
      wpm: netWpm,
      cpm: isChinese ? netCpm : undefined,
      accuracy,
    });
    onRestart();
  };

  const handleShare = async () => {
    trackEvent("results_action_clicked", {
      action: "share",
      wpm: netWpm,
      cpm: isChinese ? netCpm : undefined,
      accuracy,
    });
    const speedText = isChinese ? `${netCpm} CPM (字/分)` : `${netWpm} WPM`;
    const shareText = `HeroTyping Speed Test: ${speedText} | ${accuracy}% Accuracy https://www.herotyping.com`;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fail silently if clipboard write is blocked
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      role="status"
      aria-live="polite"
      className="flex w-full max-w-2xl flex-col items-center gap-4"
    >
      <h2 className="sr-only">Results</h2>

      {isNewBest && (
        <span className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          <Sparkles size={13} />
          New personal best
        </span>
      )}

      <div className="grid w-full grid-cols-2 gap-5 sm:grid-cols-4">
        <Stat
          label={isChinese ? "cpm (字/分)" : (dict.test?.wpm || "wpm")}
          value={isChinese ? netCpm : netWpm}
          highlight
        />
        <Stat label={dict.test?.accuracy || "accuracy"} value={`${accuracy}%`} />
        <Stat label={isChinese ? "raw cpm" : "raw"} value={isChinese ? rawCpm : rawWpm} />
        <Stat label={dict.lesson?.consistency || "consistency"} value={`${consistency}%`} />
      </div>

      <ResultsGraph samples={wpmSamples} />

      {/*
        The character breakdown is the audit trail for the WPM above it: correct
        is the number the score is computed from, and the rest account for every
        other key that was pressed. If these do not add up, the score is wrong.
      */}
      <div className="w-full border-t border-border pt-4">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-mono text-sm text-sub">
          <span className="text-correct">{correctKeystrokes} correct</span>
          <span className="text-error">{incorrectKeystrokes} incorrect</span>
          <span>{charTally.extra} extra</span>
          <span>{charTally.missed} missed</span>
          <span title="Correct plus incorrect. Spaces between words count; backspace does not.">
            {totalTyped} typed
          </span>
          {correctedErrors > 0 && (
            <span title="Mistakes you deleted. They still count against accuracy.">
              {correctedErrors} corrected
            </span>
          )}
        </div>
        <p className="mt-2 text-center text-xs text-sub">
          {round(elapsedMs / 100) / 10}s elapsed &middot; the space between two
          words counts as a character
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleRestart}
          className="flex min-h-[44px] items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm text-sub transition-colors hover:border-accent/50 hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
        >
          <RotateCcw size={16} />
          {dict.test?.restart || "Restart"}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex min-h-[44px] items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm text-sub transition-colors hover:border-accent/50 hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
        >
          {copied ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
          {copied ? "Copied Score!" : "Share Result"}
        </button>
        <Link
          href="/practice/accuracy"
          onClick={() => trackEvent("results_action_clicked", { action: "accuracy", wpm: netWpm, accuracy })}
          className="flex min-h-[44px] items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm text-sub transition-colors hover:border-accent/50 hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Target size={16} />
          Accuracy Drill
        </Link>
      </div>

      <AdSlot placementId="results-rectangle" format="rectangle" />
    </motion.div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={highlight ? "text-4xl font-semibold text-accent" : "text-2xl font-semibold text-foreground"}>
        {value}
      </span>
      <span className="text-xs uppercase tracking-wide text-sub">{label}</span>
    </div>
  );
}
