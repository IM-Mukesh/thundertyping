"use client";

import Link from "next/link";
import { useIsTestFinished } from "@/lib/typing-engine/test-status-store";
import { cn } from "@/lib/utils/cn";

// Renders on the server like any other client component (no random or
// non-deterministic content, so there's no hydration-mismatch risk) — the
// h1/subtitle stay in the initial HTML for SEO, then collapse client-side
// once a test finishes so the results screen isn't crowded by page chrome.
//
// The collapse is a pure-CSS grid-template-rows 1fr -> 0fr transition rather
// than an AnimatePresence height animation. Two reasons: it matches how the
// config bar and language selector already hide (a plain CSS transition), and
// it doesn't depend on JS animation frames, so it still collapses correctly
// in environments where requestAnimationFrame is throttled or never fires
// (a backgrounded/hidden tab, a headless pane, reduced-motion setups).
// AnimatePresence is rAF-driven: with no frames it never starts its exit,
// never finishes it, and therefore never unmounts the child at all.
export function PageIntro() {
  const isFinished = useIsTestFinished();

  return (
    <div
      data-finished={isFinished}
      aria-hidden={isFinished}
      className={cn(
        "grid w-full max-w-2xl transition-all duration-300 ease-in-out",
        isFinished ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
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
