"use client";

import Link from "next/link";
import { useTestStatus } from "@/lib/typing-engine/test-status-store";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils/cn";

// Renders on the server like any other client component (no random or
// non-deterministic content, so there's no hydration-mismatch risk) — the
// h1/subtitle stay in the initial HTML for SEO.
// Hidden while typing (no layout shift, opacity-only) AND on the results
// screen -- it's pitch copy for someone who hasn't started a test yet, not
// something to show above a result you just earned. Only visible when idle.
//
// Reads status via useTestStatus(), the window-scoped cross-chunk-safe hook
// (see test-status-store.ts) -- NOT a locally-derived isRunning check, which
// was the exact shape of a real shipped bug here: TypingTest is loaded via
// next/dynamic({ssr:false}), so a plain isRunning flag can silently diverge
// between the lazy chunk and this shared chunk.
export function PageIntro() {
  const status = useTestStatus();
  const hidden = status !== "idle";
  // isGuest defaults true (no user yet) while the session is still resolving,
  // so a signed-in visitor briefly sees the guest subtitle on first paint --
  // same tradeoff as the SEO-required server render below: correct within a
  // moment, never wrong in a way that breaks anything.
  const { isGuest } = useAuth();

  return (
    <div
      data-status={status}
      aria-hidden={hidden || undefined}
      inert={hidden ? true : undefined}
      className={cn(
        "w-full max-w-2xl transition-opacity duration-300 ease-in-out",
        hidden ? "opacity-0 pointer-events-none" : "opacity-100",
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
            Measure your words per minute and accuracy.{" "}
            {isGuest && "No sign-up required. "}
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
