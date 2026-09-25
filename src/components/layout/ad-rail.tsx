"use client";

import { AdSlot } from "@/components/layout/ad-slot";
import { useIsTestRunning } from "@/lib/typing-engine/test-status-store";
import { cn } from "@/lib/utils/cn";

/**
 * A persistent ad column beside an active typing surface -- home, a lesson,
 * a game -- rather than only below the content.
 * Fades out smoothly while typing is running to maintain zero distraction.
 */
export function AdRail({ id }: { id: string }) {
  const isRunning = useIsTestRunning();

  return (
    <aside
      aria-label="Advertisement"
      className={cn(
        "sticky top-24 w-[280px] transition-opacity duration-300 ease-in-out",
        isRunning ? "opacity-0 pointer-events-none" : "opacity-100",
      )}
    >
      <AdSlot id={id} format="vertical" />
    </aside>
  );
}
