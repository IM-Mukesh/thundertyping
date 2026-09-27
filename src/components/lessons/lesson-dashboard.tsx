"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  Sparkles,
  Target,
} from "lucide-react";
import {
  LESSON_LIST,
  LESSON_STAGES,
  LESSON_TIERS,
  type LessonId,
  type LessonTier,
} from "@/lib/lessons/lesson-types";
import { isLessonUnlocked, useLessonProgressStore } from "@/lib/lessons/lesson-progress-store";
import { useKeyPerformanceStore, getKeyStats } from "@/lib/lessons/key-performance-store";
import { getWeakKeys } from "@/lib/lessons/key-performance";
import { LessonStatsBar } from "@/components/lessons/lesson-stats-bar";
import { LessonUnitRow } from "@/components/lessons/lesson-unit-row";
import { TodaysTrainingCard } from "@/components/lessons/todays-training-card";
import { LessonPlacementModal } from "@/components/lessons/lesson-placement-modal";
import { cn } from "@/lib/utils/cn";

export function LessonDashboard() {
  const units = useLessonProgressStore((s) => s.units);
  const keys = useKeyPerformanceStore((s) => s.keys);
  const [selectedTier, setSelectedTier] = useState<LessonTier | "all">("all");
  const [placementOpen, setPlacementOpen] = useState(false);

  // Overall journey metrics
  const completedCount = useMemo(() => {
    return LESSON_LIST.filter((l) => units[l.id]?.completed).length;
  }, [units]);

  const inProgressUnit = useMemo(() => {
    return LESSON_LIST.find((l) => {
      const p = units[l.id];
      return p && !p.completed && p.currentStep > 0;
    });
  }, [units]);

  const nextRecommendedUnit = useMemo(() => {
    return inProgressUnit ?? LESSON_LIST.find((l) => !units[l.id]?.completed) ?? LESSON_LIST[0];
  }, [inProgressUnit, units]);

  const isNewUser = completedCount === 0 && !inProgressUnit;
  const journeyProgressPct = Math.round((completedCount / LESSON_LIST.length) * 100);

  // Weak keys for adaptive focus
  const weakKeys = useMemo(() => {
    const stats = getKeyStats(keys);
    return getWeakKeys(stats, { minAttempts: 8, accuracyThreshold: 90 });
  }, [keys]);

  // Stage grouping for the curriculum roadmap
  const stages = useMemo(() => {
    return LESSON_STAGES.map((stageDef, index) => {
      const stageUnits = LESSON_LIST.filter((l) => l.stage === stageDef.id);
      const stageCompleted = stageUnits.filter((l) => units[l.id]?.completed).length;
      const isCurrentStage = stageUnits.some((l) => l.id === nextRecommendedUnit.id);
      const isStageCompleted = stageCompleted === stageUnits.length && stageUnits.length > 0;
      const tier = stageUnits[0]?.tier ?? "beginner";

      // Collect keys taught in this stage
      const stageKeys: string[] = [];
      for (const u of stageUnits) {
        for (const k of u.newKeys) {
          if (!stageKeys.includes(k)) stageKeys.push(k);
        }
      }

      return {
        id: stageDef.id,
        number: String(index + 1).padStart(2, "0"),
        label: stageDef.label,
        tier,
        units: stageUnits,
        keys: stageKeys,
        completedCount: stageCompleted,
        totalCount: stageUnits.length,
        progressPct: stageUnits.length > 0 ? Math.round((stageCompleted / stageUnits.length) * 100) : 0,
        isCurrent: isCurrentStage,
        isCompleted: isStageCompleted,
      };
    });
  }, [units, nextRecommendedUnit]);

  return (
    <div className="flex w-full flex-col gap-10">
      {/* 1. HERO & ORIENTATION */}
      {isNewUser ? (
        <section className="relative overflow-hidden rounded-2xl border border-accent/40 bg-sub-alt/20 p-6 sm:p-10 text-center sm:text-left">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex max-w-xl flex-col gap-3">
              <span className="flex w-fit items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-accent mx-auto sm:mx-0">
                <Sparkles size={12} aria-hidden="true" />
                Step-by-step touch typing
              </span>
              <h1 className="font-display text-2xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
                Start your typing journey
              </h1>
              <p className="text-sm leading-relaxed text-sub">
                Build finger discipline step-by-step from the home row to full-speed typing.
                Interactive hands and on-screen keyboard guide every reach—no experience needed.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:shrink-0 sm:items-end">
              <Link
                href={`/lessons/${LESSON_LIST[0].id}`}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-8 font-display text-xs font-bold uppercase tracking-wider text-background transition-[filter] duration-200 hover:brightness-110 shadow-lg shadow-accent/10"
              >
                Start from Home Row
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={() => setPlacementOpen(true)}
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-sub-alt/40 px-5 font-display text-xs font-semibold text-sub transition-colors hover:border-accent hover:text-foreground"
              >
                <Compass size={13} aria-hidden="true" />
                Find my starting point
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-2xl border border-border bg-sub-alt/20 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-accent">
                  <Sparkles size={11} aria-hidden="true" /> Welcome back
                </span>
                <span className="font-mono text-xs text-sub">
                  {completedCount} of {LESSON_LIST.length} lessons complete ({journeyProgressPct}%)
                </span>
              </div>

              <div>
                <span className="font-display text-[11px] font-bold uppercase tracking-wider text-sub">
                  Recommended next step
                </span>
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
                  {nextRecommendedUnit.name}
                </h2>
                <p className="mt-1 line-clamp-1 max-w-xl text-xs text-sub">
                  {nextRecommendedUnit.instructions[0]}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-3 max-w-md">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-sub-alt border border-border/50">
                  <div
                    className="h-full bg-accent transition-[width] duration-300"
                    style={{ width: `${journeyProgressPct}%` }}
                  />
                </div>
                <span className="font-mono text-xs font-bold text-foreground">{journeyProgressPct}%</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
              <Link
                href={`/lessons/${nextRecommendedUnit.id}`}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-8 font-display text-xs font-bold uppercase tracking-wider text-background transition-[filter] hover:brightness-110 shadow-lg shadow-accent/10"
              >
                {inProgressUnit ? "Resume Lesson" : "Continue Lesson"}
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPlacementOpen(true)}
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-sub-alt/40 px-4 font-display text-xs font-semibold text-sub transition-colors hover:border-accent hover:text-foreground"
                >
                  <Compass size={13} aria-hidden="true" />
                  Placement test
                </button>
                {weakKeys.length > 0 && (
                  <Link
                    href="/lessons/practice"
                    className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-sub-alt/40 px-4 font-display text-xs font-semibold text-sub transition-colors hover:border-accent hover:text-foreground"
                  >
                    <Target size={13} aria-hidden="true" />
                    Practice weak keys
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. ADAPTIVE COACH & TODAY'S TRAINING */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <TodaysTrainingCard />

        {weakKeys.length > 0 ? (
          <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-sub-alt/20 p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-accent">
                <Target size={14} aria-hidden="true" /> Your focus keys
              </span>
              <span className="font-mono text-[11px] text-sub">Based on recent attempts</span>
            </div>

            <p className="text-xs text-sub">
              Your recent lesson attempts show occasional missed strikes on these keys. A short targeted
              warm-up will tighten your finger returns.
            </p>

            <div className="flex flex-wrap gap-2">
              {weakKeys.slice(0, 6).map((k) => (
                <span
                  key={k}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1 font-mono text-xs font-bold text-foreground"
                >
                  <span className="text-accent">{k.toUpperCase()}</span>
                </span>
              ))}
            </div>

            <Link
              href="/lessons/practice"
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/10 text-xs font-bold text-accent transition-colors hover:bg-accent/20"
            >
              Start weak key drill
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-sub-alt/20 p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-accent">
                <Award size={14} aria-hidden="true" /> Lesson milestones
              </span>
              <span className="font-mono text-[11px] text-sub">Curriculum status</span>
            </div>

            <p className="text-xs leading-relaxed text-sub">
              The HeroTyping curriculum spans 28 units across three progressive tiers.
              Complete Beginner to master the full keyboard, Intermediate for sentence cadence, and Advanced for endurance.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 text-center">
              {LESSON_TIERS.map((t) => {
                const tierUnits = LESSON_LIST.filter((l) => l.tier === t.id);
                const count = tierUnits.filter((l) => units[l.id]?.completed).length;
                return (
                  <div key={t.id} className="rounded-lg bg-background/50 p-2">
                    <div className="font-mono text-sm font-bold text-foreground">
                      {count}/{tierUnits.length}
                    </div>
                    <div className="font-display text-[9px] uppercase tracking-wider text-sub">
                      {t.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. AGGREGATE STATS OVERVIEW */}
      <LessonStatsBar />

      {/* 4. CURRICULUM ROADMAP */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
          <div>
            <h2 className="font-display text-xl font-black uppercase tracking-tight text-foreground sm:text-2xl">
              Curriculum Roadmap
            </h2>
            <p className="text-xs text-sub">
              28 structured lessons across 8 foundational stages.
            </p>
          </div>

          {/* Tier Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setSelectedTier("all")}
              className={cn(
                "rounded-lg px-3 py-1.5 transition-colors",
                selectedTier === "all"
                  ? "bg-accent text-background"
                  : "border border-border bg-sub-alt/30 text-sub hover:border-accent hover:text-foreground",
              )}
            >
              All Stages (28)
            </button>
            {LESSON_TIERS.map((t) => {
              const count = LESSON_LIST.filter((l) => l.tier === t.id).length;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTier(t.id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 transition-colors",
                    selectedTier === t.id
                      ? "bg-accent text-background"
                      : "border border-border bg-sub-alt/30 text-sub hover:border-accent hover:text-foreground",
                  )}
                >
                  {t.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Stages List */}
        <div className="flex flex-col gap-8">
          {stages.map((stage) => {
            const isVisible = selectedTier === "all" || stage.tier === selectedTier;

            return (
              <div
                key={stage.id}
                className={cn("flex flex-col gap-4", !isVisible && "hidden")}
              >
                {/* Stage Header Card */}
                <div
                  className={cn(
                    "flex flex-col gap-3 rounded-xl border p-4 sm:p-5 transition-colors",
                    stage.isCurrent
                      ? "border-accent/60 bg-accent/5 ring-1 ring-accent/20"
                      : stage.isCompleted
                        ? "border-border/80 bg-sub-alt/10"
                        : "border-border bg-sub-alt/20",
                  )}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-accent">{stage.number}</span>
                      <h3 className="font-display text-base font-bold uppercase tracking-tight text-foreground sm:text-lg">
                        {stage.label}
                      </h3>
                      {stage.isCompleted ? (
                        <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-wider text-accent">
                          <CheckCircle2 size={11} aria-hidden="true" /> Complete
                        </span>
                      ) : stage.isCurrent ? (
                        <span className="rounded-full bg-accent text-background px-2.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-wider">
                          Current Stage
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-sub">
                      {stage.keys.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1 font-mono text-[10px]">
                          <span>Keys:</span>
                          <span className="text-foreground uppercase">{stage.keys.join(" ")}</span>
                        </div>
                      )}
                      <span className="font-mono text-[11px]">
                        {stage.completedCount} / {stage.totalCount} completed
                      </span>
                    </div>
                  </div>

                  {/* Stage Progress Bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-sub-alt">
                    <div
                      className={cn(
                        "h-full transition-[width] duration-300",
                        stage.isCompleted ? "bg-accent" : "bg-accent/80",
                      )}
                      style={{ width: `${stage.progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Stage Lessons Grid */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {stage.units.map((unit) => {
                    const unlocked = isLessonUnlocked(unit.id, units);
                    const isCurrent = unit.id === nextRecommendedUnit.id;
                    const lockedReason = unlocked ? undefined : lockedReasonFor(unit.id);

                    return (
                      <LessonUnitRow
                        key={unit.id}
                        unit={unit}
                        position={unit.order}
                        unlocked={unlocked}
                        isCurrent={isCurrent}
                        progress={units[unit.id]}
                        lockedReason={lockedReason}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Placement Modal */}
      <LessonPlacementModal open={placementOpen} onClose={() => setPlacementOpen(false)} />
    </div>
  );
}

function lockedReasonFor(unitId: LessonId): string {
  const index = LESSON_LIST.findIndex((l) => l.id === unitId);
  const previous = index > 0 ? LESSON_LIST[index - 1] : undefined;
  return previous ? `Complete "${previous.name}" first to unlock this unit` : "Complete the previous unit first";
}
