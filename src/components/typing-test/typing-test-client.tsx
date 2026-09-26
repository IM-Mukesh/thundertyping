"use client";

import dynamic from "next/dynamic";

// The engine's initial word list is randomized (Math.random()), which would
// differ between the server-rendered HTML and the client's first render and
// cause a hydration mismatch — so this subtree only ever renders client-side.
const TypingTest = dynamic(() => import("@/components/typing-test/typing-test").then((m) => m.TypingTest), {
  ssr: false,
  loading: () => (
    <div className="flex w-full flex-col items-center gap-5 sm:gap-6 animate-pulse" aria-hidden="true">
      <div className="theme-transition h-10 w-full max-w-4xl rounded-xl bg-sub-alt/40 border border-border/40" />
      <div className="flex w-full flex-col gap-3 py-6 px-2">
        <div className="flex flex-wrap gap-3">
          <div className="h-7 w-20 rounded bg-sub-alt/50" />
          <div className="h-7 w-16 rounded bg-sub-alt/50" />
          <div className="h-7 w-24 rounded bg-sub-alt/50" />
          <div className="h-7 w-14 rounded bg-sub-alt/50" />
          <div className="h-7 w-28 rounded bg-sub-alt/50" />
          <div className="h-7 w-18 rounded bg-sub-alt/50" />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="h-7 w-24 rounded bg-sub-alt/30" />
          <div className="h-7 w-14 rounded bg-sub-alt/30" />
          <div className="h-7 w-32 rounded bg-sub-alt/30" />
          <div className="h-7 w-20 rounded bg-sub-alt/30" />
          <div className="h-7 w-16 rounded bg-sub-alt/30" />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="h-7 w-16 rounded bg-sub-alt/20" />
          <div className="h-7 w-28 rounded bg-sub-alt/20" />
          <div className="h-7 w-14 rounded bg-sub-alt/20" />
          <div className="h-7 w-22 rounded bg-sub-alt/20" />
        </div>
      </div>
    </div>
  ),
});

export { TypingTest as TypingTestClient };
