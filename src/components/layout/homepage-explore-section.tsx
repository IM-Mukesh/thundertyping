"use client";

import { useIsTestRunning, useIsTestFinished } from "@/lib/typing-engine/test-status-store";
import { HomepageFeatureNav } from "@/components/layout/homepage-feature-nav";
import { HomepageSeoContent } from "@/components/layout/homepage-seo-content";
import { cn } from "@/lib/utils/cn";

/**
 * Wraps the feature navigation (Lessons, Games, Vocabulary, Guides) and the
 * SEO footnote below the typing test.
 *
 * - While typing (isRunning): Smoothly fades to opacity-0 without collapsing
 *   height, eliminating visual distraction while guaranteeing zero layout shift.
 * - Once test finishes (isFinished): Collapses 1fr -> 0fr alongside PageIntro and
 *   SiteFooter so the results screen fits cleanly without viewport overflow.
 * - When idle: Visible and interactive.
 */
export function HomepageExploreSection() {
  const isRunning = useIsTestRunning();
  const isFinished = useIsTestFinished();

  return (
    <div
      data-finished={isFinished}
      data-running={isRunning}
      aria-hidden={isFinished || isRunning}
      className={cn(
        "grid w-full transition-all duration-300 ease-in-out",
        isFinished
          ? "grid-rows-[0fr] opacity-0 pointer-events-none"
          : isRunning
            ? "grid-rows-[1fr] opacity-0 pointer-events-none"
            : "grid-rows-[1fr] opacity-100",
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="flex w-full flex-col items-center gap-3">
          <HomepageFeatureNav />
          <HomepageSeoContent />
        </div>
      </div>
    </div>
  );
}
