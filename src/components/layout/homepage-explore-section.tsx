"use client";

import { useIsTestRunning } from "@/lib/typing-engine/test-status-store";
import { HomepageFeatureNav } from "@/components/layout/homepage-feature-nav";
import { cn } from "@/lib/utils/cn";

/**
 * Wraps the feature navigation (Lessons, Games, Vocabulary, Guides) below the
 * typing test. The longer "Why HeroTyping?" pitch that used to live here
 * moved to /about -- it's still indexable and linked from the footer, it
 * just no longer competes with the test for space on every single visit.
 *
 * - While typing (isRunning): Smoothly fades to opacity-0 without collapsing
 *   height, eliminating visual distraction while guaranteeing zero layout shift.
 * - While idle or displaying results: Fully visible and interactive.
 */
export function HomepageExploreSection() {
  const isRunning = useIsTestRunning();

  return (
    <div
      data-running={isRunning}
      aria-hidden={isRunning || undefined}
      inert={isRunning ? true : undefined}
      className={cn(
        "flex w-full flex-col items-center gap-3 transition-opacity duration-300 ease-in-out",
        isRunning ? "opacity-0 pointer-events-none" : "opacity-100",
      )}
    >
      <HomepageFeatureNav />
    </div>
  );
}
