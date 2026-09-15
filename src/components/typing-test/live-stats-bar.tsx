"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { TestState } from "@/lib/typing-engine/engine-types";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { calculateLiveWpm, round } from "@/lib/typing-engine/stats";
import { cn } from "@/lib/utils/cn";

interface LiveStatsBarProps {
  state: TestState;
}

export function LiveStatsBar({ state }: LiveStatsBarProps) {
  const { config, elapsedMs, correctKeystrokes, activeWordIndex, words } = state;
  const liveSpeed = useSettingsStore((s) => s.liveSpeed);
  const liveWpm = round(calculateLiveWpm(correctKeystrokes, elapsedMs));

  const primary =
    config.mode === "time"
      ? String(Math.max(0, Math.ceil((config.timeDuration * 1000 - elapsedMs) / 1000)))
      : `${Math.min(activeWordIndex + 1, words.length)}/${words.length}`;

  return (
    <div className="flex items-center justify-center gap-5 font-mono" aria-live="polite">
      {/* The countdown/progress keeps the large flip treatment: it steps once
          per second (or once per word), so the animation reads as a clock
          rather than as flicker, and it's information you act on. */}
      <FlipNumber value={primary} className="text-4xl text-accent sm:text-5xl" />

      {/* Live WPM is opt-in and deliberately understated when shown — small,
          dim, and NOT flipped. The flip animation is what makes a
          several-times-a-second number steal attention from the words being
          read, so the opt-in version drops it entirely. */}
      {liveSpeed && (
        <span className="flex items-baseline gap-1 text-sm tabular-nums text-sub" aria-label={`${liveWpm} words per minute`}>
          {liveWpm}
          <span className="text-xs">wpm</span>
        </span>
      )}
    </div>
  );
}

// Each character sits in its own fixed-width slot and flips like a page on a
// split-flap display when its value changes. A perspective on the slot gives
// the rotateX transform real depth instead of a flat squash.
function FlipNumber({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn("inline-flex", className)}>
      {value.split("").map((char, i) => (
        <FlipChar key={i} char={char} />
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
      style={{ width: char === "/" ? "0.45em" : "0.65em", perspective: "240px" }}
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
          style={{ transformOrigin: "50% 50%", backfaceVisibility: "hidden" }}
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
        style={{ transformOrigin: "50% 50%", backfaceVisibility: "hidden" }}
      >
        {char}
      </motion.span>
    </span>
  );
}
