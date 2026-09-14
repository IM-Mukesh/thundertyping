"use client";

import dynamic from "next/dynamic";

// The engine's initial word list is randomized (Math.random()), which would
// differ between the server-rendered HTML and the client's first render and
// cause a hydration mismatch — so this subtree only ever renders client-side.
const TypingTest = dynamic(() => import("@/components/typing-test/typing-test").then((m) => m.TypingTest), {
  ssr: false,
  loading: () => (
    <div className="flex h-[260px] w-full items-center justify-center text-sub">Loading typing test…</div>
  ),
});

export { TypingTest as TypingTestClient };
