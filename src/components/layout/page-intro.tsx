"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useTestStatusStore } from "@/lib/typing-engine/test-status-store";

// Statically renders on the server like any other client component (no
// random/non-deterministic content, so no hydration-mismatch risk) — the
// h1/subtitle stay in the initial HTML for SEO, then collapse client-side
// once a test finishes so the results screen isn't crowded by page chrome.
export function PageIntro() {
  const isFinished = useTestStatusStore((s) => s.isFinished);

  return (
    <AnimatePresence initial={false}>
      {!isFinished && (
        <motion.div
          key="intro"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="flex w-full max-w-2xl flex-col items-center gap-3 overflow-hidden text-center"
        >
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
