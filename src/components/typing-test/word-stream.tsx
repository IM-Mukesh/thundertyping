"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import type { CharState, WordState } from "@/lib/typing-engine/engine-types";
import { cn } from "@/lib/utils/cn";

// Starting guess only. The real pitch is measured from the laid-out words on
// every recalc, because a hardcoded one cannot be right at more than one
// breakpoint: the stream is text-2xl on phones and text-3xl from sm: up, which
// are 32px and 38px apart respectively.
//
// This constant has been wrong three times now (48, then 32, then 38, each a
// leftover from an earlier font/size combo). The last of those was correct on
// desktop and 6px too large on every phone, so `round(offsetTop / 38)` picked
// the wrong line as the test went on and scrolled the active word out of the
// visible window -- the typing surface silently stopped following the typist.
// Measuring instead of guessing ends that class of bug for good.
const LINE_HEIGHT_FALLBACK = 38;
const VISIBLE_LINES = 3;

/**
 * The real distance between wrapped lines, read off the DOM.
 *
 * Uses the median gap between distinct row offsets rather than the first gap,
 * because the caret is 1.2em tall and inflates whichever line it is sitting on.
 */
function measureLinePitch(container: HTMLElement): number {
  const tops = [...new Set(Array.from(container.children, (c) => (c as HTMLElement).offsetTop))].sort(
    (a, b) => a - b,
  );
  // Two distinct row offsets are enough for a real gap -- the median logic
  // below already tolerates a single delta (length-1 arrays just return
  // their only element). Requiring three tops meant any text short enough to
  // wrap onto just two lines (the common case) never measured at all and
  // silently rode the hardcoded fallback -- exactly the kind of wrongness
  // this function exists to avoid.
  if (tops.length < 2) return LINE_HEIGHT_FALLBACK;
  const deltas = tops.slice(1).map((t, i) => t - tops[i]).filter((d) => d > 0);
  if (deltas.length === 0) return LINE_HEIGHT_FALLBACK;
  deltas.sort((a, b) => a - b);
  const pitch = deltas[Math.floor(deltas.length / 2)];

  // A measurement is only trustworthy if the container has a sane layout.
  // Measured in a zero-width container -- mid-mount, inside a hidden tab, or a
  // display:none ancestor -- every word wraps onto its own line and the gaps
  // come back several times too large, which would size the typing window at
  // hundreds of pixels. Anything outside one to three times the font size is
  // not a line gap, so fall back rather than trust it.
  const fontSize = parseFloat(getComputedStyle(container).fontSize) || 0;
  if (fontSize <= 0) return LINE_HEIGHT_FALLBACK;
  if (pitch < fontSize || pitch > fontSize * 3) return LINE_HEIGHT_FALLBACK;
  return pitch;
}

interface WordStreamProps {
  wordStates: WordState[];
  activeWordIndex: number;
}

export function WordStream({ wordStates, activeWordIndex }: WordStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeWordElRef = useRef<HTMLSpanElement | null>(null);
  const [offset, setOffset] = useState(0);
  const [linePitch, setLinePitch] = useState(LINE_HEIGHT_FALLBACK);

  useLayoutEffect(() => {
    const recalc = () => {
      const el = activeWordElRef.current;
      const container = containerRef.current;
      if (!el || !container) return;
      const pitch = measureLinePitch(container);
      setLinePitch(pitch);
      const currentLine = Math.round(el.offsetTop / pitch);
      const targetLine = Math.max(0, currentLine - 1);
      setOffset(targetLine * pitch);
    };
    recalc();

    // Self-hosted fonts (next/font) resolve fast, but a late swap could still
    // shift line height slightly before the observer below has anything to
    // react to — re-measure once fonts are actually ready.
    document.fonts?.ready?.then(recalc).catch(() => {});

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(recalc);
    observer.observe(container);
    return () => observer.disconnect();
  }, [activeWordIndex]);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: linePitch * VISIBLE_LINES }}>
      <div
        ref={containerRef}
        className="flex flex-wrap gap-x-3 gap-y-2 font-mono text-2xl font-normal leading-none transition-transform duration-150 ease-out sm:text-3xl"
        style={{ transform: `translateY(-${offset}px)` }}
      >
        {wordStates.map((word, index) => (
          <Word
            key={index}
            word={word}
            isActive={index === activeWordIndex}
            registerRef={index === activeWordIndex ? (el) => (activeWordElRef.current = el) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function Word({
  word,
  isActive,
  registerRef,
}: {
  word: WordState;
  isActive: boolean;
  registerRef?: (el: HTMLSpanElement | null) => void;
}) {
  const target = word.target;
  const renderLength = Math.max(target.length, word.chars.length);
  const caretIndex = word.typed.length;
  const nodes: ReactNode[] = [];

  for (let i = 0; i <= renderLength; i++) {
    if (isActive && i === caretIndex) {
      nodes.push(<Caret key="caret" />);
    }
    if (i === renderLength) break;

    const state: CharState = word.chars[i] ?? "pending";
    const char = i < target.length ? target[i] : word.typed[i];
    nodes.push(
      <span key={i} className={cn("char-instant", charClass(state))}>
        {char}
      </span>,
    );
  }

  return (
    <span ref={registerRef} className="inline-flex max-w-full flex-wrap break-all">
      {nodes}
    </span>
  );
}

function Caret() {
  return (
    <motion.span
      layoutId="typing-caret"
      transition={{ type: "spring", stiffness: 500, damping: 32 }}
      className="relative inline-flex items-center w-0 self-center pointer-events-none"
      style={{ height: "1.2em" }}
    >
      <span className="absolute left-0 -ml-[1px] w-[2px] h-full bg-caret rounded-full" />
    </motion.span>
  );
}

function charClass(state: CharState): string {
  switch (state) {
    case "correct":
      return "text-correct";
    case "incorrect":
      return "text-error underline decoration-error decoration-2 underline-offset-4";
    case "extra":
      return "text-error/70";
    // Skipped: clearly red so it reads as a mistake, but dimmer than a
    // mistyped character and underlined with a gap, so the two are still
    // distinguishable at a glance.
    case "missed":
      return "text-error/75 underline decoration-error/60 decoration-dotted decoration-2 underline-offset-4";
    case "pending":
    default:
      return "text-sub";
  }
}
