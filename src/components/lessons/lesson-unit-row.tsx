import Link from "next/link";
import { CheckCircle2, ChevronRight, Lock, Play, RotateCcw, Star } from "lucide-react";
import type { LessonDefinition } from "@/lib/lessons/lesson-types";
import type { UnitProgress } from "@/lib/lessons/lesson-progress-store";
import { round } from "@/lib/typing-engine/stats";
import { cn } from "@/lib/utils/cn";

interface LessonUnitRowProps {
  unit: LessonDefinition;
  position: number;
  unlocked: boolean;
  isCurrent?: boolean;
  progress?: UnitProgress;
  lockedReason?: string;
}

export function LessonUnitRow({
  unit,
  position,
  unlocked,
  isCurrent,
  progress,
  lockedReason,
}: LessonUnitRowProps) {
  const completed = progress?.completed ?? false;
  const inProgress = !completed && (progress?.currentStep ?? 0) > 0;
  const stepsDone = progress?.currentStep ?? 0;
  const progressPercent = Math.min(100, Math.round((stepsDone / unit.subLessonCount) * 100));
  const bestStars = progress?.bestStars ?? (completed ? 3 : 0);

  const content = (
    <div
      className={cn(
        "group relative flex flex-col justify-between gap-4 rounded-xl border p-4 sm:p-5 transition-all duration-200",
        unlocked
          ? "border-border bg-background/50 hover:border-accent/70 hover:bg-sub-alt/10 hover:shadow-md"
          : "border-border/40 bg-sub-alt/10 opacity-70 cursor-not-allowed",
        isCurrent && "border-accent ring-1 ring-accent/30 bg-accent/5",
        completed && "border-border/80 bg-background/70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold transition-colors",
              completed
                ? "bg-accent/15 text-accent border border-accent/30"
                : isCurrent
                  ? "bg-accent text-background"
                  : !unlocked
                    ? "bg-sub-alt text-sub/60 border border-border/40"
                    : "bg-sub-alt text-sub border border-border",
            )}
            aria-hidden="true"
          >
            {completed ? (
              <CheckCircle2 size={16} />
            ) : !unlocked ? (
              <Lock size={14} />
            ) : (
              String(position).padStart(2, "0")
            )}
          </div>

          <div className="flex min-w-0 flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-sm font-bold uppercase tracking-tight text-foreground sm:text-base group-hover:text-accent transition-colors">
                {unit.name}
              </h3>
              {isCurrent && (
                <span className="rounded-full bg-accent/20 px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-wider text-accent">
                  Up next
                </span>
              )}
              {bestStars > 0 && (
                <div className="flex items-center gap-0.5" aria-label={`${bestStars} of 5 stars earned`} title={`${bestStars}/5 stars`}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={11}
                      className={cn(
                        s <= bestStars
                          ? "fill-accent text-accent"
                          : "fill-border/40 text-border/60",
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            <p className="mt-1 line-clamp-1 text-xs text-sub">{unit.instructions[0]}</p>
          </div>
        </div>

        {unit.newKeys.length > 0 && (
          <div className="hidden min-[480px]:flex shrink-0 flex-wrap gap-1" aria-label="Introduced keys">
            {unit.newKeys.map((k) => (
              <span
                key={k}
                className="rounded border border-border/60 bg-sub-alt/50 px-1.5 py-0.5 font-mono text-[10px] uppercase text-sub"
              >
                {k === " " ? "space" : k}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-border/40 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-1.5 w-24 sm:w-32 overflow-hidden rounded-full bg-sub-alt">
            <div
              className={cn("h-full transition-[width] duration-300", completed ? "bg-accent" : "bg-accent/80")}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-sub">
            {stepsDone} / {unit.subLessonCount} steps
          </span>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
          {progress && progress.passCount > 0 ? (
            <div className="flex items-center gap-3 font-mono text-xs text-sub">
              <span>
                <strong className="font-bold text-foreground">{round(progress.avgWpm)}</strong>{" "}
                <span className="text-[10px]">WPM</span>
              </span>
              <span>
                <strong className="font-bold text-foreground">{round(progress.avgAccuracy)}%</strong>{" "}
                <span className="text-[10px]">ACC</span>
              </span>
            </div>
          ) : (
            <span className="font-mono text-[11px] text-sub">Target: {unit.minAccuracy}% acc</span>
          )}

          {unlocked ? (
            <span
              className={cn(
                "flex h-8 sm:h-9 items-center gap-1.5 rounded-lg px-3 sm:px-4 font-display text-[11px] font-bold uppercase tracking-wider transition-all",
                isCurrent
                  ? "bg-accent text-background hover:brightness-110"
                  : completed
                    ? "border border-border text-sub hover:border-accent hover:text-foreground"
                    : "border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20",
              )}
            >
              {completed ? (
                <>
                  <RotateCcw size={11} aria-hidden="true" /> Review
                </>
              ) : inProgress ? (
                <>
                  <Play size={11} aria-hidden="true" /> Resume
                </>
              ) : (
                <>
                  Start <ChevronRight size={12} aria-hidden="true" />
                </>
              )}
            </span>
          ) : (
            <span className="font-mono text-[11px] text-sub/70 flex items-center gap-1">
              <Lock size={12} aria-hidden="true" /> Locked
            </span>
          )}
        </div>
      </div>

      {!unlocked && lockedReason && (
        <div className="text-[11px] text-sub/70 italic border-t border-border/20 pt-1.5">
          {lockedReason}
        </div>
      )}
    </div>
  );

  if (!unlocked) {
    return (
      <div
        aria-disabled="true"
        aria-label={lockedReason ?? "Locked unit"}
        tabIndex={0}
        className="focus-visible:outline-2 focus-visible:outline-accent rounded-xl"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/lessons/${unit.id}`}
      className="block rounded-xl focus-visible:outline-2 focus-visible:outline-accent"
    >
      {content}
    </Link>
  );
}
