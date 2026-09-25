import Link from "next/link";
import { CheckCircle2, Lock, Play, RotateCcw } from "lucide-react";
import type { LessonDefinition } from "@/lib/lessons/lesson-types";
import type { UnitProgress } from "@/lib/lessons/lesson-progress-store";
import { round } from "@/lib/typing-engine/stats";
import { cn } from "@/lib/utils/cn";

interface LessonUnitRowProps {
  unit: LessonDefinition;
  position: number;
  unlocked: boolean;
  progress?: UnitProgress;
  /** Why this unit is locked, e.g. `Complete "Home Row: Left Hand" first` -- only used when `unlocked` is false. */
  lockedReason?: string;
}

export function LessonUnitRow({ unit, position, unlocked, progress, lockedReason }: LessonUnitRowProps) {
  const completed = progress?.completed ?? false;
  const inProgress = !completed && (progress?.currentStep ?? 0) > 0;
  const stepsDone = progress?.currentStep ?? 0;

  const row = (
    <div
      className={cn(
        "group/row flex flex-col gap-3 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center sm:gap-5 sm:p-5",
        unlocked ? "border-border hover:border-accent" : "border-border/50 opacity-60",
        completed && "border-accent/50",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-display text-sm font-bold",
          completed ? "border-accent bg-accent/15 text-accent" : "border-border text-sub",
        )}
        aria-hidden="true"
      >
        {completed ? <CheckCircle2 size={18} /> : !unlocked ? <Lock size={15} /> : position}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-sm font-bold uppercase tracking-tight text-foreground sm:text-base">
            {unit.name}
          </h3>
          {unit.newKeys.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {unit.newKeys.map((k) => (
                <span key={k} className="rounded bg-sub-alt px-1.5 py-0.5 font-mono text-[10px] uppercase text-sub">
                  {k === " " ? "space" : k}
                </span>
              ))}
            </div>
          )}
        </div>
        <p className="mt-1 line-clamp-1 text-xs text-sub">{unit.instructions[0]}</p>

        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-sub-alt">
            <div
              className="h-full bg-accent transition-[width] duration-300"
              style={{ width: `${(stepsDone / unit.subLessonCount) * 100}%` }}
            />
          </div>
          <span className="whitespace-nowrap font-mono text-[10px] text-sub">
            {stepsDone}/{unit.subLessonCount}
          </span>
        </div>
      </div>

      <div className="flex w-full sm:w-auto shrink-0 items-center justify-end sm:justify-start gap-4 sm:gap-6">
        <dl className="hidden gap-4 font-mono text-xs text-sub sm:flex">
          <div className="text-right">
            <dd className="font-bold text-foreground">{progress ? `${round(progress.avgWpm)}` : "—"}</dd>
            <dt className="text-[9px] uppercase tracking-wider">Avg wpm</dt>
          </div>
          <div className="text-right">
            <dd className="font-bold text-foreground">{progress ? `${round(progress.avgAccuracy)}%` : "—"}</dd>
            <dt className="text-[9px] uppercase tracking-wider">Avg acc</dt>
          </div>
        </dl>

        {unlocked && (
          <span
            className={cn(
              "flex h-9 w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg px-4 font-display text-[11px] font-bold uppercase tracking-wider",
              completed ? "border border-border text-sub group-hover/row:text-foreground" : "bg-accent text-background",
            )}
          >
            {completed ? <RotateCcw size={12} aria-hidden="true" /> : <Play size={12} aria-hidden="true" />}
            {completed ? "Restart" : inProgress ? "Resume" : "Start"}
          </span>
        )}
      </div>
    </div>
  );

  if (!unlocked) {
    return (
      <div
        aria-disabled="true"
        aria-label={lockedReason}
        tabIndex={0}
        className="group/locked relative cursor-not-allowed focus:outline-none"
      >
        {row}
        {lockedReason && (
          <div
            role="tooltip"
            className={cn(
              "pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-max max-w-64 -translate-x-1/2 rounded-lg border border-border bg-background px-3 py-2 text-center font-mono text-[11px] text-sub shadow-lg",
              "opacity-0 transition-opacity duration-150 group-hover/locked:opacity-100 group-focus-within/locked:opacity-100",
            )}
          >
            {lockedReason}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link href={`/lessons/${unit.id}`} className="block">
      {row}
    </Link>
  );
}
