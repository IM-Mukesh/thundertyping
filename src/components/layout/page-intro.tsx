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
export function PageIntro({ dict }: { dict: { title: string; subtitle: string; guestNote: string; wantToTypeFaster: string } }) {
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
        {/* Visible on mobile and desktop while idle; fades away cleanly when typing starts */}
        <div className="flex flex-col items-center gap-1.5 text-center sm:gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {dict.title}
          </h1>
          <p className="text-xs text-sub sm:text-base">
            {dict.subtitle}{" "}
            {isGuest && `${dict.guestNote} `}
            <Link
              href="/guides/how-to-improve-typing-speed"
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {dict.wantToTypeFaster}
            </Link>
          </p>
        </div>
      </div>
  );
}
