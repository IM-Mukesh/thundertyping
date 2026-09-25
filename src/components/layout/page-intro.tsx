"use client";

import Link from "next/link";
import { useIsTestFinished, useIsTestRunning } from "@/lib/typing-engine/test-status-store";
import { cn } from "@/lib/utils/cn";

// Renders on the server like any other client component (no random or
// non-deterministic content, so there's no hydration-mismatch risk) — the
// h1/subtitle stay in the initial HTML for SEO.
// While typing (isRunning), it smoothly fades to opacity-0 without collapsing
// height, preventing any layout shift or vertical jitter.
// Once the test finishes (isFinished), it collapses 1fr -> 0fr so the results
// screen fits comfortably without extra page scroll.
export function PageIntro() {
  const isFinished = useIsTestFinished();
  const isRunning = useIsTestRunning();

  return (
    <div
      data-finished={isFinished}
      data-running={isRunning}
      aria-hidden={isFinished || isRunning}
      className={cn(
        "grid w-full max-w-2xl transition-all duration-300 ease-in-out",
        isFinished
          ? "grid-rows-[0fr] opacity-0 pointer-events-none"
          : isRunning
            ? "grid-rows-[1fr] opacity-0 pointer-events-none"
            : "grid-rows-[1fr] opacity-100",
      )}
    >
      {/* min-h-0 + overflow-hidden is what lets the 1fr -> 0fr row actually
          clip its content instead of overflowing at its natural height. */}
      <div className="min-h-0 overflow-hidden">
        {/* Hidden on phones, not deleted.
            A phone screen is mostly keyboard once typing starts, and this
            block pushed the words down into what little was left. But the h1
            is the page's main ranking signal and organic search is the point
            of the site, so it stays in the HTML and stays available to screen
            readers -- `sr-only` costs no layout space, while `display: none`
            would cost the SEO. It returns as a normal heading from sm: up. */}
        <div className="sr-only flex flex-col items-center gap-3 text-center sm:not-sr-only">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Free Online Typing Speed Test
          </h1>
          <p className="text-sm text-sub sm:text-base">
            Measure your words per minute and accuracy. No sign-up required.{" "}
            <Link
              href="/guides/how-to-improve-typing-speed"
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              Want to type faster?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
