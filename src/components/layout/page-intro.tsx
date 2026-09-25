"use client";

import Link from "next/link";
import { useIsTestRunning } from "@/lib/typing-engine/test-status-store";
import { cn } from "@/lib/utils/cn";

// Renders on the server like any other client component (no random or
// non-deterministic content, so there's no hydration-mismatch risk) — the
// h1/subtitle stay in the initial HTML for SEO.
// While typing (isRunning), it smoothly fades to opacity-0 without collapsing
// height, preventing any layout shift or vertical jitter.
// When test finishes (results screen) or is idle, it stays fully visible.
export function PageIntro() {
  const isRunning = useIsTestRunning();

  return (
    <div
      data-running={isRunning}
      aria-hidden={isRunning}
      className={cn(
        "w-full max-w-2xl transition-opacity duration-300 ease-in-out",
        isRunning ? "opacity-0 pointer-events-none" : "opacity-100",
      )}
    >
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
  );
}
