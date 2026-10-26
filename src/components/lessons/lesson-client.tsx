"use client";

import dynamic from "next/dynamic";
import type { LessonDefinition } from "@/lib/lessons/lesson-types";

// LessonDrill generates its content with Math.random() (via buildLessonText),
// same reason TypingTest and every game use ssr:false: server-rendering
// randomized content would guarantee a hydration mismatch against whatever
// the client generates a moment later.
function LessonSkeleton() {
  return (
    <div
      role="region"
      aria-label="Typing lesson interface"
      className="flex h-[420px] w-full max-w-3xl flex-col items-center justify-center rounded-2xl border border-border/60 bg-sub-alt/10 p-8"
    >
      <div className="w-full max-w-xl space-y-4 animate-pulse motion-reduce:animate-none">
        <div className="mx-auto h-4 w-32 rounded bg-sub-alt/40" />
        <div className="h-10 w-full rounded-xl bg-sub-alt/30" />
        <div className="h-24 w-full rounded-xl bg-sub-alt/20" />
        <div className="flex justify-between pt-2">
          <div className="h-4 w-20 rounded bg-sub-alt/30" />
          <div className="h-4 w-20 rounded bg-sub-alt/30" />
        </div>
      </div>
    </div>
  );
}

const LessonDrill = dynamic(() => import("@/components/lessons/lesson-drill").then((m) => ({ default: m.LessonDrill })), {
  ssr: false,
  loading: () => <LessonSkeleton />,
});

export function LessonClient({ definition }: { definition: LessonDefinition }) {
  return <LessonDrill definition={definition} />;
}
