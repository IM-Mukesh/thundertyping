"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import type { CharState, WordState } from "@/lib/typing-engine/engine-types";

const LINE_HEIGHT = 48;
const VISIBLE_LINES = 3;

interface WordStreamProps {
  wordStates: WordState[];
  activeWordIndex: number;
}

export function WordStream({ wordStates, activeWordIndex }: WordStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeWordElRef = useRef<HTMLSpanElement | null>(null);
  const [offset, setOffset] = useState(0);

  useLayoutEffect(() => {
    const recalc = () => {
      const el = activeWordElRef.current;
      if (!el) return;
      const currentLine = Math.round(el.offsetTop / LINE_HEIGHT);
      const targetLine = Math.max(0, currentLine - 1);
      setOffset(targetLine * LINE_HEIGHT);
    };
    recalc();

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(recalc);
    observer.observe(container);
    return () => observer.disconnect();
  }, [activeWordIndex]);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: LINE_HEIGHT * VISIBLE_LINES }}>
      <div
        ref={containerRef}
        className="flex flex-wrap gap-x-3 gap-y-2 font-mono text-2xl leading-none transition-transform duration-150 ease-out sm:text-3xl"
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
      <span key={i} className={charClass(state)}>
        {char}
      </span>,
    );
  }

  return (
    <span ref={registerRef} className="inline-flex">
      {nodes}
    </span>
  );
}

function Caret() {
  return (
    <motion.span
      layoutId="typing-caret"
      transition={{ type: "spring", stiffness: 500, damping: 32 }}
      className="inline-block w-[2px] self-center bg-caret"
      style={{ height: "1.2em" }}
    />
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
    case "pending":
    default:
      return "text-sub";
  }
}
