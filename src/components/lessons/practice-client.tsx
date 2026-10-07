"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

import type { PracticeMode } from "@/components/lessons/practice-drill";

const PracticeDrill = dynamic(
  () => import("@/components/lessons/practice-drill").then((m) => ({ default: m.PracticeDrill })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-full max-w-3xl items-center justify-center text-sub">Loading practice lab…</div>
    ),
  },
);

export interface PracticeClientProps {
  defaultMode?: PracticeMode;
}

export function PracticeClient({ defaultMode }: PracticeClientProps = {}) {
  return (
    <Suspense fallback={<div className="flex h-[420px] w-full max-w-3xl items-center justify-center text-sub">Loading practice lab…</div>}>
      <PracticeDrill defaultMode={defaultMode} />
    </Suspense>
  );
}
