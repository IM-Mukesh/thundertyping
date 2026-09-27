"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Gauge,
  GraduationCap,
  Sparkles,
  Target,
} from "lucide-react";
import { useLessonProgressStore, type LearnerGoal } from "@/lib/lessons/lesson-progress-store";
import { useKeyPerformanceStore, getKeyStats } from "@/lib/lessons/key-performance-store";
import {
  generateRecommendations,
  type PersonalizedRecommendation,
  type RecommendationType,
} from "@/lib/lessons/recommendation-engine";
import { LESSON_LIST } from "@/lib/lessons/lesson-types";

const ICON_MAP: Record<RecommendationType, React.ReactNode> = {
  "remediation-weak-key": <Target size={16} aria-hidden="true" />,
  "remediation-transition": <Sparkles size={16} aria-hidden="true" />,
  "remediation-finger": <Target size={16} aria-hidden="true" />,
  "continue-curriculum": <GraduationCap size={16} aria-hidden="true" />,
  "spaced-review": <Clock size={16} aria-hidden="true" />,
  "goal-challenge": <Gauge size={16} aria-hidden="true" />,
  "placement-assessment": <Sparkles size={16} aria-hidden="true" />,
};

const GOAL_LABELS: Record<LearnerGoal, string> = {
  "touch-typing": "Touch Typing Mastery",
  "accuracy": "High Accuracy (98%+)",
  "speed-40": "Reach 40 WPM",
  "speed-60": "Reach 60 WPM",
  "speed-80": "Reach 80 WPM",
  "coding": "Developer & Code Syntax",
};

/**
 * Adaptive daily coach using recommendation-engine with explainable rationale,
 * personalized pacing, and goal-directed guidance.
 */
export function TodaysTrainingCard() {
  const units = useLessonProgressStore((s) => s.units);
  const learnerGoal = useLessonProgressStore((s) => s.learnerGoal);
  const keys = useKeyPerformanceStore((s) => s.keys);
  const transitions = useKeyPerformanceStore((s) => s.transitions);

  const hasProgress = useMemo(() => {
    return Object.values(units).some((u) => u && (u.completed || u.currentStep > 0));
  }, [units]);

  // Aggregate average historical WPM from completed units
  const historicalWpm = useMemo(() => {
    const completed = Object.values(units).filter((u) => u && u.completed && u.bestWpm);
    if (completed.length === 0) return 30;
    const sum = completed.reduce((acc, u) => acc + (u.bestWpm || 30), 0);
    return Math.round(sum / completed.length);
  }, [units]);

  const transitionStats = useMemo(() => {
    const out: Record<string, { attempts: number; errors: number }> = {};
    for (const [pair, bools] of Object.entries(transitions)) {
      const attempts = bools.length;
      const errors = bools.filter((b) => !b).length;
      out[pair] = { attempts, errors };
    }
    return out;
  }, [transitions]);

  const recommendations: PersonalizedRecommendation[] = useMemo(() => {
    return generateRecommendations({
      units,
      learnerGoal,
      keyStats: getKeyStats(keys),
      transitions: transitionStats,
      userWpm: historicalWpm,
    });
  }, [units, learnerGoal, keys, transitionStats, historicalWpm]);

  const totalMinutes = recommendations.reduce(
    (sum: number, r: PersonalizedRecommendation) => sum + r.estimatedMinutes,
    0,
  );
  const primary = recommendations[0];

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
          <p className="text-xs text-sub leading-relaxed">
            Master the tactile anchor keys (A S D F). Feel the raised index bump on F to type without looking.
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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-accent">
            <GraduationCap size={15} aria-hidden="true" /> Today&apos;s adaptive training
          </h2>
          <span className="rounded-full border border-border bg-sub-alt/40 px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-wider text-sub">
            {GOAL_LABELS[learnerGoal]}
          </span>
        </div>
        <span className="font-mono text-[11px] text-sub">~{totalMinutes} min total</span>
      </div>

      {/* Primary Highlighted Action */}
      {primary && (
        <div className="flex flex-col gap-2 rounded-xl border border-accent/40 bg-accent/10 p-3.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-accent">
              {ICON_MAP[primary.type]} {primary.badge ?? "Recommended Next"}
            </span>
            <span className="font-mono text-[10px] text-sub">~{primary.estimatedMinutes} min</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">{primary.title}</h3>
            <p className="mt-0.5 text-xs text-sub leading-relaxed">{primary.detail}</p>
          </div>
          <p className="border-t border-accent/20 pt-1.5 text-[11px] italic text-sub/80">
            Why: {primary.rationale}
          </p>
        </div>
      )}

      {/* Secondary Recommendations */}
      {recommendations.slice(1, 3).length > 0 && (
        <div className="flex flex-col gap-2">
          {recommendations.slice(1, 3).map((rec, i) => (
            <RecommendationRow key={rec.type + i} rec={rec} />
          ))}
        </div>
      )}

      {primary && (
        <Link
          href={primary.href}
          className="flex h-11 items-center justify-center gap-2 rounded-lg bg-accent px-5 font-display text-xs font-bold uppercase tracking-wider text-background transition-[filter] hover:brightness-110 shadow-sm"
        >
          Start Today&apos;s Training
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function RecommendationRow({ rec }: { rec: PersonalizedRecommendation }) {
  return (
    <Link
      href={rec.href}
      className="flex items-center gap-3 rounded-lg border border-border/80 bg-background/50 px-3 py-2 transition-colors hover:border-accent hover:bg-sub-alt/20"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
        {ICON_MAP[rec.type]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-xs font-bold text-foreground">{rec.title}</div>
          {rec.badge && (
            <span className="shrink-0 rounded bg-sub-alt/40 px-1.5 py-0.2 font-display text-[9px] uppercase text-sub">
              {rec.badge}
            </span>
          )}
        </div>
        <div className="truncate text-[11px] text-sub">{rec.detail}</div>
      </div>
      <span className="shrink-0 font-mono text-[10px] text-sub">{rec.estimatedMinutes}m</span>
    </Link>
  );
}
