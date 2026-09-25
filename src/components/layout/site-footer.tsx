"use client";

import Link from "next/link";
import { AdSlot } from "@/components/layout/ad-slot";
import { SITE_NAME } from "@/lib/seo/constants";
import { useIsTestFinished, useIsTestRunning } from "@/lib/typing-engine/test-status-store";
import { cn } from "@/lib/utils/cn";

// Collapses once a test finishes so the results screen fits without a page
// scroll — the footer's ad slot plus link row was the single biggest
// contributor to results-page overflow.
// While a test is running, it smoothly fades to opacity-0 without collapsing height
// so there is zero layout jump or scrolling disruption during typing.
export function SiteFooter() {
  const isFinished = useIsTestFinished();
  const isRunning = useIsTestRunning();

  return (
    <div
      data-finished={isFinished}
      data-running={isRunning}
      aria-hidden={isFinished || isRunning}
      className={cn(
        "mt-auto grid transition-all duration-300 ease-in-out",
        isFinished
          ? "grid-rows-[0fr] opacity-0 pointer-events-none"
          : isRunning
            ? "grid-rows-[1fr] opacity-0 pointer-events-none"
            : "grid-rows-[1fr] opacity-100",
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <footer className="flex flex-col items-center gap-6 px-6 py-10 sm:px-10">
          <AdSlot id="footer-leaderboard" format="horizontal" />
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-sub sm:gap-6 text-center">
            <span>
              &copy; {new Date().getFullYear()} {SITE_NAME}
            </span>
            <Link href="/about" className="py-1 transition-colors hover:text-foreground">
              About
            </Link>
            <Link href="/games" className="py-1 transition-colors hover:text-foreground">
              Games
            </Link>
            <Link href="/lessons" className="py-1 transition-colors hover:text-foreground">
              Lessons
            </Link>
            <Link href="/vocabulary" className="py-1 transition-colors hover:text-foreground">
              Vocabulary
            </Link>
            <Link
              href="/achievements"
              className="py-1 transition-colors hover:text-foreground"
            >
              Achievements
            </Link>
            <Link
              href="/guides"
              className="py-1 transition-colors hover:text-foreground"
            >
              Guides
            </Link>
            <Link href="/privacy" className="py-1 transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="py-1 transition-colors hover:text-foreground">
              Terms
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
