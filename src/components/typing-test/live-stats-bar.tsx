"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { TestState } from "@/lib/typing-engine/engine-types";
import { formatCountdown } from "@/lib/typing-engine/format-countdown";
import { cn } from "@/lib/utils/cn";

interface LiveStatsBarProps {
  state: TestState;
}

export function LiveStatsBar({ state }: LiveStatsBarProps) {
  const { config, elapsedMs, activeWordIndex, words } = state;

  const primary =
    config.mode === "time"
      ? formatCountdown(Math.max(0, Math.ceil((config.timeDuration * 1000 - elapsedMs) / 1000)))
      : `${Math.min(activeWordIndex + 1, words.length)}/${words.length}`;

  return (
    // No aria-live here on purpose: this updates roughly once a second for
    // the whole test (or once per word), and a live region on it read the
    // countdown aloud continuously for a screen-reader user -- talking over
    // everything else and making the test unusable with assistive tech. A
    // typist isn't listening for a running countdown any more than a sighted
    // one is meant to stare at it; the number that matters gets announced
    // once, on the results screen, when the test actually ends.
    <div className="flex items-center justify-start font-mono">
      {/* The countdown/progress keeps the large flip treatment: it steps once
          per second (or once per word), so the animation reads as a clock
          rather than as flicker, and it's information you act on. */}
      <FlipNumber value={primary} className="text-3xl text-accent sm:text-4xl" />
    </div>
  );
}

// Each character sits in its own fixed-width slot and flips like a page on a
// split-flap display when its value changes. A perspective on the slot gives
// the rotateX transform real depth instead of a flat squash.
function FlipNumber({ value, className }: { value: string; className?: string }) {
  const len = value.length;
  return (
    <span className={cn("inline-flex", className)}>
      {value.split("").map((char, i) => (
        <FlipChar key={len - 1 - i} char={char} />
      ))}
    </span>
  );
}

const FLIP_DURATION_S = 0.28;

// Manages its own exit lifecycle with an explicit timer instead of handing a
// rapidly-rekeyed child to AnimatePresence: under fast successive value
// changes (this ticks alongside the live timer/WPM), AnimatePresence's
// automatic post-exit unmount didn't reliably fire, leaving invisible
// mid-rotation ghost elements stacking up in the DOM indefinitely. This
// version caps it at exactly one exiting element at a time, force-cleared
// after the transition duration no matter how fast new values arrive.
function FlipChar({ char }: { char: string }) {
  const [prevChar, setPrevChar] = useState<string | null>(null);
  const currentRef = useRef(char);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (currentRef.current === char) return;
    setPrevChar(currentRef.current);
    currentRef.current = char;
    clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => setPrevChar(null), FLIP_DURATION_S * 1000);
    return () => clearTimeout(clearTimer.current);
  }, [char]);

  return (
    <span
      className="relative inline-block text-center tabular-nums"
      style={{
        width: char === "/" || char === ":" ? "0.45em" : char === "s" ? "0.55em" : "0.65em",
        perspective: "240px",
        transformStyle: "preserve-3d",
        WebkitTransformStyle: "preserve-3d",
      }}
    >
      <span aria-hidden="true" className="invisible">
        {char}
      </span>
      {prevChar !== null && (
        <motion.span
          initial={{ rotateX: 0, opacity: 1 }}
          animate={{ rotateX: 100, opacity: 0 }}
          transition={{ duration: FLIP_DURATION_S, ease: "easeInOut" }}
          className="absolute inset-0"
          style={{
            transformOrigin: "50% 50%",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {prevChar}
        </motion.span>
      )}
      <motion.span
        key={char}
        initial={{ rotateX: -100, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ duration: FLIP_DURATION_S, ease: "easeInOut" }}
        className="absolute inset-0"
        style={{
            transformOrigin: "50% 50%",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
        }}
      >
        {char}
      </motion.span>
    </span>
  );
}
