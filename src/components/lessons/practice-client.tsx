"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const PracticeDrill = dynamic(
  () => import("@/components/lessons/practice-drill").then((m) => ({ default: m.PracticeDrill })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-full max-w-3xl items-center justify-center text-sub">Loading practice lab…</div>
    ),
  },
);

export function PracticeClient() {
  return (
    <Suspense fallback={<div className="flex h-[420px] w-full max-w-3xl items-center justify-center text-sub">Loading practice lab…</div>}>
      <PracticeDrill />
    </Suspense>
  );
}
