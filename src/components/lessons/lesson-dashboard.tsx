"use client";

import { useMemo, useState } from "react";
import { LESSON_LIST, LESSON_TIERS, type LessonId, type LessonTier } from "@/lib/lessons/lesson-types";
import { isLessonUnlocked, useLessonProgressStore } from "@/lib/lessons/lesson-progress-store";
import { LessonStatsBar } from "@/components/lessons/lesson-stats-bar";
import { LessonSidebar } from "@/components/lessons/lesson-sidebar";
import { LessonUnitRow } from "@/components/lessons/lesson-unit-row";
import { TodaysTrainingCard } from "@/components/lessons/todays-training-card";
import { cn } from "@/lib/utils/cn";

/**
 * The dashboard body: stats bar, tier sidebar and the unit list for whichever
 * tier is selected. Every tier's rows are always in the DOM -- switching
 * tiers toggles a `hidden` class, it never conditionally mounts/unmounts a
 * filtered array -- so all 29 lesson links are in the initial server HTML
 * and indexable, not just the default (beginner) tier's 17. Same
 * always-rendered-hide-with-CSS pattern GameInfoPanel and GameHubFilters
 * already use elsewhere in this codebase.
 */
export function LessonDashboard() {
  const [activeTier, setActiveTier] = useState<LessonTier>("beginner");
  const units = useLessonProgressStore((s) => s.units);

  const tierGroups = useMemo(
    () => LESSON_TIERS.map((tier) => ({ tier: tier.id, units: LESSON_LIST.filter((l) => l.tier === tier.id) })),
    [],
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <TodaysTrainingCard />
      <LessonStatsBar />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <LessonSidebar activeTier={activeTier} onSelect={setActiveTier} />

        <div className="min-w-0 flex-1">
          {tierGroups.map(({ tier, units: tierUnits }) => (
            <div key={tier} className={cn("flex flex-col gap-3", tier !== activeTier && "hidden")}>
              {tierUnits.map((unit, i) => {
                const unlocked = isLessonUnlocked(unit.id, units);
                return (
                  <LessonUnitRow
                    key={unit.id}
                    unit={unit}
                    position={i + 1}
                    unlocked={unlocked}
                    progress={units[unit.id]}
                    lockedReason={unlocked ? undefined : lockedReasonFor(unit.id)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A locked unit is always locked because the one immediately before it in LESSON_LIST hasn't been completed -- see isLessonUnlocked. Named here so the hover tooltip can say which one. */
function lockedReasonFor(unitId: LessonId): string {
  const index = LESSON_LIST.findIndex((l) => l.id === unitId);
  const previous = index > 0 ? LESSON_LIST[index - 1] : undefined;
  return previous ? `Complete "${previous.name}" first to unlock this unit` : "Complete the previous unit first";
}
