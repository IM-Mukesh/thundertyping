"use client";

import { motion } from "motion/react";
import { RotateCcw } from "lucide-react";
import type { TestState } from "@/lib/typing-engine/engine-types";
import {
  calculateAccuracy,
  calculateConsistency,
  calculateNetWpm,
  calculateRawWpm,
  round,
} from "@/lib/typing-engine/stats";
import { AdSlot } from "@/components/layout/ad-slot";

interface ResultsPanelProps {
  state: TestState;
  isNewBest: boolean;
  onRestart: () => void;
}

export function ResultsPanel({ state, isNewBest, onRestart }: ResultsPanelProps) {
  const { correctKeystrokes, incorrectKeystrokes, elapsedMs, wpmSamples, charTally } = state;
  const netWpm = round(calculateNetWpm(correctKeystrokes, elapsedMs));
  const rawWpm = round(calculateRawWpm(correctKeystrokes, incorrectKeystrokes, elapsedMs));
  const accuracy = round(calculateAccuracy(correctKeystrokes, incorrectKeystrokes));
  const consistency = round(calculateConsistency(wpmSamples));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex w-full max-w-2xl flex-col items-center gap-8"
    >
      <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-4">
        <Stat label="wpm" value={netWpm} highlight />
        <Stat label="accuracy" value={`${accuracy}%`} />
        <Stat label="raw" value={rawWpm} />
        <Stat label="consistency" value={`${consistency}%`} />
      </div>

      {isNewBest && (
        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          New personal best
        </span>
      )}

      <div className="flex flex-wrap justify-center gap-6 font-mono text-sm text-sub">
        <span className="text-correct">{charTally.correct} correct</span>
        <span className="text-error">{charTally.incorrect} incorrect</span>
        <span>{charTally.extra} extra</span>
        <span>{charTally.missed} missed</span>
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-sub transition-colors hover:text-foreground"
      >
        <RotateCcw size={16} />
        Restart
        <kbd className="text-xs opacity-60">Tab</kbd>
      </button>

      <AdSlot id="results-rectangle" format="rectangle" />
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
