"use client";

import Link from "next/link";
import { AdSlot } from "@/components/layout/ad-slot";
import { SITE_NAME } from "@/lib/seo/constants";
import { useIsTestRunning } from "@/lib/typing-engine/test-status-store";
import { cn } from "@/lib/utils/cn";

// While a test is running, it smoothly fades to opacity-0 without collapsing height
// so there is zero layout jump or scrolling disruption during typing.
// When displaying results or while idle, it stays fully visible.
export function SiteFooter({ locale = "en" }: { locale?: string }) {
  const isRunning = useIsTestRunning();

  return (
    <div
      data-running={isRunning}
      aria-hidden={isRunning || undefined}
      inert={isRunning ? true : undefined}
      className={cn(
        "mt-auto transition-opacity duration-300 ease-in-out",
        isRunning ? "opacity-0 pointer-events-none" : "opacity-100",
      )}
    >
      <footer className="flex flex-col items-center gap-6 px-6 py-10 sm:px-10">
          <AdSlot placementId="footer-leaderboard" format="horizontal" />
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
  );
}
