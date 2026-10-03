"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Compass,
  Download,
  RotateCcw,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";
import {
  LESSON_LIST,
  LESSON_STAGES,
  LESSON_TIERS,
  type LessonTier,
} from "@/lib/lessons/lesson-types";
import {
  isLessonUnlocked,
  useLessonProgressStore,
  type LearnerGoal,
} from "@/lib/lessons/lesson-progress-store";
import { useKeyPerformanceStore, getKeyStats } from "@/lib/lessons/key-performance-store";
import { evaluateDetailedMastery } from "@/lib/lessons/mastery-engine";
import { LessonStatsBar } from "@/components/lessons/lesson-stats-bar";
import { LessonUnitRow } from "@/components/lessons/lesson-unit-row";
import { TodaysTrainingCard } from "@/components/lessons/todays-training-card";
import { LessonPlacementModal } from "@/components/lessons/lesson-placement-modal";
import { cn } from "@/lib/utils/cn";

const GOAL_OPTIONS: { id: LearnerGoal; label: string; desc: string }[] = [
  { id: "touch-typing", label: "Touch Typing", desc: "Build anchor discipline without looking down" },
  { id: "accuracy", label: "Precision First", desc: "Target 98%+ clean muscle memory" },
  { id: "speed-40", label: "40 WPM Sprint", desc: "Develop natural typing flow" },
  { id: "speed-60", label: "60 WPM Fluency", desc: "Comfortable professional cadence" },
  { id: "speed-80", label: "80+ WPM Elite", desc: "High-speed endurance and precision" },
  { id: "coding", label: "Developer Syntax", desc: "Master brackets, symbols, and code flow" },
];

export function LessonDashboard() {
  const units = useLessonProgressStore((s) => s.units);
  const learnerGoal = useLessonProgressStore((s) => s.learnerGoal);
  const setLearnerGoal = useLessonProgressStore((s) => s.setLearnerGoal);
  const exportProgress = useLessonProgressStore((s) => s.exportProgress);
  const importProgress = useLessonProgressStore((s) => s.importProgress);
  const resetProgress = useLessonProgressStore((s) => s.resetProgress);

  const keys = useKeyPerformanceStore((s) => s.keys);
  const transitions = useKeyPerformanceStore((s) => s.transitions);
  const keyStatsUpdatedAt = useKeyPerformanceStore((s) => s.lastUpdated);

  const [selectedTier, setSelectedTier] = useState<LessonTier | "all">("all");
  const [placementOpen, setPlacementOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Key records and transition stats for mastery analysis
  const keyRecords = useMemo(() => {
    const stats = getKeyStats(keys);
    const recs: Record<string, { attempts: number; errors: number; lastPracticedAt: number }> = {};
    for (const [k, s] of Object.entries(stats)) {
      recs[k] = { attempts: s.attempts, errors: s.errors, lastPracticedAt: keyStatsUpdatedAt };
    }
    return recs;
  }, [keys, keyStatsUpdatedAt]);

  const transitionStats = useMemo(() => {
    const out: Record<string, { attempts: number; errors: number }> = {};
    for (const [pair, bools] of Object.entries(transitions)) {
      const attempts = bools.length;
      const errors = bools.filter((b) => !b).length;
      out[pair] = { attempts, errors };
    }
    return out;
  }, [transitions]);

  const mastery = useMemo(() => {
    return evaluateDetailedMastery(keyRecords, transitionStats);
  }, [keyRecords, transitionStats]);

  // Stage grouping for curriculum roadmap
  const stages = useMemo(() => {
    return LESSON_STAGES.map((stageDef, index) => {
      const stageUnits = LESSON_LIST.filter((l) => l.stage === stageDef.id);
      const stageCompleted = stageUnits.filter((l) => units[l.id]?.completed).length;
      const isCurrentStage = stageUnits.some((l) => l.id === nextRecommendedUnit.id);
      const isStageCompleted = stageCompleted === stageUnits.length && stageUnits.length > 0;
      const tier = stageUnits[0]?.tier ?? "beginner";

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

  function handleExport() {
    const json = exportProgress();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `herotyping-lessons-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const ok = importProgress(text);
        if (ok) {
          alert("Progress restored successfully!");
        } else {
          alert("Could not restore file: format unrecognized.");
        }
      }
    };
    reader.readAsText(file);
  }

  function handleReset() {
    if (confirm("Reset all lesson progress? Your typing history and completed units will be cleared.")) {
      resetProgress();
    }
  }

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
                <Link
                  href="/lessons/practice"
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-sub-alt/40 px-4 font-display text-xs font-semibold text-sub transition-colors hover:border-accent hover:text-foreground"
                >
                  <Target size={13} aria-hidden="true" />
                  Practice Lab
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. LEARNER GOAL SELECTOR */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-border/80 bg-sub-alt/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-display text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
            <Target size={14} aria-hidden="true" /> Training Goal Focus
          </span>
          <span className="font-mono text-[11px] text-sub">Customizes daily recommendations & challenges</span>
        </div>
        <div className="flex flex-wrap gap-1.5 font-display text-xs font-semibold">
          {GOAL_OPTIONS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setLearnerGoal(g.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 transition-colors",
                learnerGoal === g.id
                  ? "bg-accent font-bold text-background shadow-sm"
                  : "border border-border/80 bg-background/50 text-sub hover:border-accent hover:text-foreground",
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. ADAPTIVE COACH & SKILL HEALTH */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <TodaysTrainingCard />

        {/* Skill Health Card */}
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-sub-alt/20 p-5">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <span className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-accent">
              <Activity size={14} aria-hidden="true" /> Keyboard Skill Health
            </span>
            <span className="font-mono text-[11px] text-sub">
              {mastery.overallMasteryScore}% Mastery Score
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="rounded-lg bg-background/60 p-2.5">
              <div className="text-lg font-bold text-correct">
                {Object.values(mastery.keys).filter((k) => k.level === "mastered").length}
              </div>
              <div className="text-[10px] text-sub uppercase font-sans">Mastered</div>
            </div>
            <div className="rounded-lg bg-background/60 p-2.5">
              <div className="text-lg font-bold text-foreground">
                {Object.values(mastery.keys).filter((k) => k.level === "developing").length}
              </div>
              <div className="text-[10px] text-sub uppercase font-sans">Developing</div>
            </div>
            <div className="rounded-lg bg-background/60 p-2.5">
              <div className="text-lg font-bold text-error">
                {Object.values(mastery.keys).filter((k) => k.level === "struggling").length}
              </div>
              <div className="text-[10px] text-sub uppercase font-sans">Struggling</div>
            </div>
          </div>

          {mastery.weakestKeys.length > 0 ? (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] text-sub font-mono">Keys needing reinforcement:</span>
              <div className="flex flex-wrap gap-1.5">
                {mastery.weakestKeys.slice(0, 8).map((k) => (
                  <span
                    key={k}
                    className="rounded border border-error/40 bg-error/10 px-2 py-0.5 font-mono text-xs font-bold text-error"
                  >
                    {k === " " ? "SPACE" : k.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-sub leading-relaxed">
              No severe key bottlenecks detected. Maintain steady rhythm and finger anchors.
            </p>
          )}

          <div className="flex items-center justify-between border-t border-border/40 pt-3">
            <span className="font-mono text-[11px] text-sub">
              Hand Acc: L {Math.round(mastery.hands.left.accuracy)}% &middot; R {Math.round(mastery.hands.right.accuracy)}%
            </span>
            <Link
              href="/lessons/practice"
              className="flex items-center gap-1.5 text-xs font-bold text-accent transition-colors hover:underline"
            >
              Open Practice Lab
              <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. AGGREGATE STATS OVERVIEW */}
      <LessonStatsBar />

      {/* 5. CURRICULUM ROADMAP */}
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
                        <span className="rounded-full bg-accent px-2.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-wider text-background">
                          Active Stage
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-sub">
                        {stage.completedCount} of {stage.totalCount} completed
                      </span>
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-sub-alt border border-border/50">
                        <div
                          className="h-full bg-accent transition-[width] duration-300"
                          style={{ width: `${stage.progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {stage.keys.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                      <span className="font-display text-[10px] uppercase font-semibold text-sub">Focus Keys:</span>
                      {stage.keys.map((k) => (
                        <span
                          key={k}
                          className="rounded border border-border/70 bg-background/80 px-2 py-0.5 font-mono text-[11px] font-bold text-foreground"
                        >
                          {k === " " ? "space" : k.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Units List */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {stage.units.map((unit) => {
                    const unlocked = isLessonUnlocked(unit.id, units);
                    const isCurrent = unit.id === nextRecommendedUnit.id;
                    const progress = units[unit.id];

                    return (
                      <LessonUnitRow
                        key={unit.id}
                        unit={unit}
                        position={unit.order}
                        unlocked={unlocked}
                        isCurrent={isCurrent}
                        progress={progress}
                        lockedReason="Complete previous unit to unlock"
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. DATA & PRIVACY MANAGEMENT */}
      <section className="flex flex-col gap-3 rounded-xl border border-border/60 bg-sub-alt/10 p-4 text-xs text-sub">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
              Learning Data & Privacy
            </span>
            <p className="mt-0.5 text-[11px] text-sub">
              HeroTyping stores all lesson progress and key metrics locally in your browser.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-[11px] hover:border-accent hover:text-foreground"
            >
              <Download size={12} aria-hidden="true" /> Export Data
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-[11px] hover:border-accent hover:text-foreground"
            >
              <Upload size={12} aria-hidden="true" /> Restore Data
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileImport}
            />
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-[11px] text-error/80 hover:border-error hover:text-error"
            >
              <RotateCcw size={12} aria-hidden="true" /> Reset
            </button>
          </div>
        </div>
      </section>

      {/* Placement Modal */}
      <LessonPlacementModal
        open={placementOpen}
        onClose={() => setPlacementOpen(false)}
      />
    </div>
  );
}
