"use client";

import dynamic from "next/dynamic";

// Same reason as LessonClient: content generation (buildDrillLine) uses
// Math.random(), so server-rendering it would guarantee a hydration
// mismatch against whatever the client generates a moment later.
const PracticeDrill = dynamic(
  () => import("@/components/lessons/practice-drill").then((m) => ({ default: m.PracticeDrill })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-full max-w-3xl items-center justify-center text-sub">Loading drill…</div>
    ),
  },
);

export function PracticeClient() {
  return <PracticeDrill />;
}
