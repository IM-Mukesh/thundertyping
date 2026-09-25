"use client";

import { GraduationCap } from "lucide-react";
import { LESSON_LIST, LESSON_TIERS, type LessonTier } from "@/lib/lessons/lesson-types";
import { useLessonProgressStore } from "@/lib/lessons/lesson-progress-store";
import { cn } from "@/lib/utils/cn";

interface LessonSidebarProps {
  activeTier: LessonTier;
  onSelect: (tier: LessonTier) => void;
}

/** Vertical tier switcher on wide screens, a horizontal scrollable row below `lg:` -- same collapse pattern the old stage-filter tabs used, just re-oriented. */
export function LessonSidebar({ activeTier, onSelect }: LessonSidebarProps) {
  const units = useLessonProgressStore((s) => s.units);

  return (
    <nav
      aria-label="Lesson tiers"
      className="flex gap-2 overflow-x-auto pb-1 no-scrollbar lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible lg:pb-0"
    >
      {LESSON_TIERS.map((tier) => {
        const tierUnits = LESSON_LIST.filter((l) => l.tier === tier.id);
        const completed = tierUnits.filter((l) => units[l.id]?.completed).length;
        const active = tier.id === activeTier;
        return (
          <button
            key={tier.id}
            type="button"
            onClick={() => onSelect(tier.id)}
            aria-current={active ? "true" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 items-center justify-between gap-3 rounded-lg border px-4 text-left transition-colors lg:min-h-12",
              active
                ? "border-accent bg-accent/15 text-accent"
                : "border-border/60 bg-sub-alt/40 text-sub hover:border-accent/50 hover:text-foreground",
            )}
          >
            <span className="font-display text-xs font-bold uppercase tracking-wider">{tier.label}</span>
            <span
              className={cn(
                "whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[10px] tabular-nums",
                active ? "bg-accent/25 text-accent" : "bg-border/40 text-sub",
              )}
            >
              {completed}/{tierUnits.length}
            </span>
          </button>
        );
      })}

      <div className="hidden items-center gap-2 rounded-lg border border-dashed border-border/60 px-4 py-3 text-sub lg:flex">
        <GraduationCap size={14} aria-hidden="true" />
        <span className="text-[11px] leading-snug">Finish Advanced to graduate into the real typing test.</span>
      </div>
    </nav>
  );
}
