"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Gauge, GraduationCap, Sparkles, Target } from "lucide-react";
import { useLessonProgressStore } from "@/lib/lessons/lesson-progress-store";
import { useKeyPerformanceStore, getKeyStats } from "@/lib/lessons/key-performance-store";
import { getTodaysTraining, type TrainingAction, type TrainingActionType } from "@/lib/lessons/today-training";
import { getVocabProgress } from "@/lib/vocabulary/vocabulary-progress";
import { LESSON_LIST } from "@/lib/lessons/lesson-types";

const ICON: Record<TrainingActionType, React.ReactNode> = {
  "weak-key-drill": <Target size={16} aria-hidden="true" />,
  "continue-lesson": <GraduationCap size={16} aria-hidden="true" />,
  "vocabulary-review": <BookOpen size={16} aria-hidden="true" />,
  "speed-challenge": <Gauge size={16} aria-hidden="true" />,
};

/**
 * Deterministic daily recommendations built from real stored progress
 * (lesson-progress-store, key-performance-store, vocabulary-progress).
 */
export function TodaysTrainingCard() {
  const units = useLessonProgressStore((s) => s.units);
  const keys = useKeyPerformanceStore((s) => s.keys);

  const hasProgress = useMemo(() => {
    return Object.values(units).some((u) => u && (u.completed || u.currentStep > 0));
  }, [units]);

  const actions = useMemo(() => {
    return getTodaysTraining({
      units,
      keyStats: getKeyStats(keys),
      vocabProgress: getVocabProgress(),
    });
  }, [units, keys]);

  const totalMinutes = actions.reduce((sum, a) => sum + a.estimatedMinutes, 0);
  const primary = actions[0];

  if (!hasProgress) {
    return (
      <div className="theme-transition flex w-full flex-col justify-between gap-4 rounded-xl border border-accent/40 bg-accent/5 p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-accent">
            <Sparkles size={14} aria-hidden="true" /> Your first session
          </h2>
          <span className="font-mono text-[11px] text-sub">~3 min</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="text-sm font-bold text-foreground">
            1. Home Row: Left Hand
          </div>
          <p className="text-xs text-sub">
            Learn A S D F finger anchors. Feel for the F bump to touch type without looking.
          </p>
        </div>

        <Link
          href={`/lessons/${LESSON_LIST[0].id}`}
          className="flex h-11 items-center justify-center gap-2 rounded-lg bg-accent px-5 font-display text-xs font-bold uppercase tracking-wider text-background transition-[filter] hover:brightness-110 shadow-sm"
        >
          Start first lesson
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className="theme-transition flex w-full flex-col justify-between gap-4 rounded-xl border border-border bg-sub-alt/20 p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-accent">
          <GraduationCap size={14} aria-hidden="true" /> Today&apos;s training
        </h2>
        <span className="font-mono text-[11px] text-sub">~{totalMinutes} min</span>
      </div>

      <div className="flex flex-col gap-2">
        {actions.map((action, i) => (
          <ActionRow key={action.type + i} action={action} />
        ))}
      </div>

      {primary && (
        <Link
          href={primary.href}
          className="flex h-11 items-center justify-center gap-2 rounded-lg bg-accent px-5 font-display text-xs font-bold uppercase tracking-wider text-background transition-[filter] hover:brightness-110 shadow-sm"
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
      className="flex items-center gap-3 rounded-lg border border-border/80 bg-background/50 px-3 py-2.5 transition-colors hover:border-accent hover:bg-sub-alt/20"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
        {ICON[action.type]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-bold text-foreground">{action.label}</div>
        <div className="truncate text-[11px] text-sub">{action.detail}</div>
      </div>
      <span className="shrink-0 font-mono text-[10px] text-sub">{action.estimatedMinutes}m</span>
    </Link>
  );
}
