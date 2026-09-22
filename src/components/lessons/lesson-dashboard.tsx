"use client";

import { useMemo, useState } from "react";
import { LESSON_LIST, type LessonId, type LessonTier } from "@/lib/lessons/lesson-types";
import { isLessonUnlocked, useLessonProgressStore } from "@/lib/lessons/lesson-progress-store";
import { LessonStatsBar } from "@/components/lessons/lesson-stats-bar";
import { LessonSidebar } from "@/components/lessons/lesson-sidebar";
import { LessonUnitRow } from "@/components/lessons/lesson-unit-row";

/** The dashboard body: stats bar, tier sidebar and the unit list for whichever tier is selected. Filtering happens client-side over a list the server already rendered, so every unit is in the initial HTML and stays indexable. */
export function LessonDashboard() {
  const [activeTier, setActiveTier] = useState<LessonTier>("beginner");
  const units = useLessonProgressStore((s) => s.units);

  const tierUnits = useMemo(() => LESSON_LIST.filter((l) => l.tier === activeTier), [activeTier]);

  return (
    <div className="flex w-full flex-col gap-6">
      <LessonStatsBar />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <LessonSidebar activeTier={activeTier} onSelect={setActiveTier} />

        <div className="flex min-w-0 flex-1 flex-col gap-3">
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
