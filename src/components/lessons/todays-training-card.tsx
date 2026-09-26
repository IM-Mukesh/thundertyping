"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Gauge, GraduationCap, Target } from "lucide-react";
import { useLessonProgressStore } from "@/lib/lessons/lesson-progress-store";
import { useKeyPerformanceStore, getKeyStats } from "@/lib/lessons/key-performance-store";
import { getTodaysTraining, type TrainingAction, type TrainingActionType } from "@/lib/lessons/today-training";
import { getVocabProgress } from "@/lib/vocabulary/vocabulary-progress";

const ICON: Record<TrainingActionType, React.ReactNode> = {
  "weak-key-drill": <Target size={16} />,
  "continue-lesson": <GraduationCap size={16} />,
  "vocabulary-review": <BookOpen size={16} />,
  "speed-challenge": <Gauge size={16} />,
};

/**
 * The single deterministic answer to "what should I do today?" -- built
 * from real stored progress (lesson-progress-store, key-performance-store,
 * vocabulary-progress), never fabricated. See today-training.ts for the
 * rule order.
 */
export function TodaysTrainingCard() {
  const units = useLessonProgressStore((s) => s.units);
  const keys = useKeyPerformanceStore((s) => s.keys);

  const actions = useMemo(() => {
    return getTodaysTraining({
      units,
      keyStats: getKeyStats(keys),
      // vocabulary progress is read once here, same one-shot pattern the
      // vocabulary hub card itself uses -- it isn't subscribed to
      // reactively, so it reflects whatever was true when this rendered.
      vocabProgress: getVocabProgress(),
    });
  }, [units, keys]);

  const totalMinutes = actions.reduce((sum, a) => sum + a.estimatedMinutes, 0);
  const primary = actions[0];

  return (
    <div className="theme-transition flex w-full flex-col gap-4 rounded-xl border border-accent/30 bg-sub-alt/30 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xs font-bold uppercase tracking-wider text-accent">Today&apos;s training</h2>
        <span className="font-mono text-[11px] text-sub">~{totalMinutes} min</span>
      </div>

      <div className="flex flex-col gap-2">
        {actions.map((action) => (
          <ActionRow key={action.type} action={action} />
        ))}
      </div>

      {primary && (
        <Link
          href={primary.href}
          className="flex h-11 items-center justify-center gap-2 rounded-lg bg-accent px-5 font-display text-xs font-bold uppercase tracking-wider text-background transition-[filter] hover:brightness-110"
        >
          Start today&apos;s training
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function ActionRow({ action }: { action: TrainingAction }) {
  return (
    <Link
      href={action.href}
      className="flex items-center gap-3 rounded-lg border border-border bg-background/40 px-3 py-2.5 transition-colors hover:border-accent"
    >
      <span className="text-accent">{ICON[action.type]}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{action.label}</div>
        <div className="truncate text-xs text-sub">{action.detail}</div>
      </div>
      <span className="shrink-0 font-mono text-[11px] text-sub">{action.estimatedMinutes} min</span>
    </Link>
  );
}
