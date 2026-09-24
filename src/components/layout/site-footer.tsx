"use client";

import Link from "next/link";
import { AdSlot } from "@/components/layout/ad-slot";
import { SITE_NAME } from "@/lib/seo/constants";
import { useIsTestFinished } from "@/lib/typing-engine/test-status-store";
import { cn } from "@/lib/utils/cn";

// Collapses once a test finishes so the results screen fits without a page
// scroll — the footer's ad slot plus link row was the single biggest
// contributor to results-page overflow. Renders on every route, but
// `isFinished` is only ever set from the homepage's typing island (and is
// cleared when that island unmounts), so this is inert everywhere else.
//
// Uses the same pure-CSS grid-template-rows collapse as PageIntro rather than
// an AnimatePresence height animation — see the note there for why.
export function SiteFooter() {
  const isFinished = useIsTestFinished();

  return (
    <div
      data-finished={isFinished}
      aria-hidden={isFinished}
      className={cn(
        "mt-auto grid transition-all duration-300 ease-in-out",
        isFinished ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <footer className="flex flex-col items-center gap-6 px-6 py-10 sm:px-10">
          <AdSlot id="footer-leaderboard" format="horizontal" />
          <div className="flex flex-col items-center gap-2 text-xs text-sub sm:flex-row sm:gap-6">
            <span>
              &copy; {new Date().getFullYear()} {SITE_NAME}
            </span>
            <Link href="/about" className="flex min-h-11 items-center transition-colors hover:text-foreground sm:min-h-0">
              About
            </Link>
            <Link href="/games" className="flex min-h-11 items-center transition-colors hover:text-foreground sm:min-h-0">
              Games
            </Link>
            <Link href="/lessons" className="flex min-h-11 items-center transition-colors hover:text-foreground sm:min-h-0">
              Lessons
            </Link>
            <Link href="/vocabulary" className="flex min-h-11 items-center transition-colors hover:text-foreground sm:min-h-0">
              Vocabulary
            </Link>
            <Link
              href="/achievements"
              className="flex min-h-11 items-center transition-colors hover:text-foreground sm:min-h-0"
            >
              Achievements
            </Link>
            <Link
              href="/guides"
              className="flex min-h-11 items-center transition-colors hover:text-foreground sm:min-h-0"
            >
              Guides
            </Link>
            <Link href="/privacy" className="flex min-h-11 items-center transition-colors hover:text-foreground sm:min-h-0">
              Privacy
            </Link>
            <Link href="/terms" className="flex min-h-11 items-center transition-colors hover:text-foreground sm:min-h-0">
              Terms
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
