"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { AdSlot } from "@/components/layout/ad-slot";
import { SITE_NAME } from "@/lib/seo/constants";
import { useTestStatusStore } from "@/lib/typing-engine/test-status-store";

// Collapses once a test finishes so the results screen fits without a page
// scroll (the footer's own ad + link row was the single biggest contributor
// to results-page overflow). Renders on every route, but `isFinished` only
// ever flips true from the homepage's typing island, so this is a no-op
// everywhere else. Still "use client", but with no random/non-deterministic
// content the initial server HTML is identical either way — links stay
// crawlable on first paint.
export function SiteFooter() {
  const isFinished = useTestStatusStore((s) => s.isFinished);

  return (
    <AnimatePresence initial={false}>
      {!isFinished && (
        <motion.footer
          key="footer"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="mt-auto flex flex-col items-center gap-6 overflow-hidden px-6 py-10 sm:px-10"
        >
          <AdSlot id="footer-leaderboard" format="horizontal" />
          <div className="flex flex-col items-center gap-2 text-xs text-sub sm:flex-row sm:gap-6">
            <span>
              &copy; {new Date().getFullYear()} {SITE_NAME}
            </span>
            <Link href="/about" className="transition-colors hover:text-foreground">
              About
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
          </div>
        </motion.footer>
      )}
    </AnimatePresence>
  );
}
