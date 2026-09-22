"use client";

import dynamic from "next/dynamic";
import type { LessonDefinition } from "@/lib/lessons/lesson-types";

// LessonDrill generates its content with Math.random() (via buildLessonText),
// same reason TypingTest and every game use ssr:false: server-rendering
// randomized content would guarantee a hydration mismatch against whatever
// the client generates a moment later.
const LessonDrill = dynamic(() => import("@/components/lessons/lesson-drill").then((m) => ({ default: m.LessonDrill })), {
  ssr: false,
  loading: () => <div className="flex h-[420px] w-full max-w-3xl items-center justify-center text-sub">Loading lesson…</div>,
});

export function LessonClient({ definition }: { definition: LessonDefinition }) {
  return <LessonDrill definition={definition} />;
}
