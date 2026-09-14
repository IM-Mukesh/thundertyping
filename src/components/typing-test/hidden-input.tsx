"use client";

import { useEffect, useRef } from "react";
import type { TestStatus } from "@/lib/typing-engine/engine-types";

interface HiddenInputProps {
  value: string;
  status: TestStatus;
  onChange: (value: string) => void;
  onCommitWord: () => void;
  onRestart: () => void;
  onEscape: () => void;
  focusToken: number;
}

export function HiddenInput({
  value,
  status,
  onChange,
  onCommitWord,
  onRestart,
  onEscape,
  focusToken,
}: HiddenInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status !== "finished") inputRef.current?.focus();
  }, [focusToken, status]);

  return (
    <input
      ref={inputRef}
      value={value}
      disabled={status === "finished"}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === " ") {
          e.preventDefault();
          onCommitWord();
        } else if (e.key === "Tab") {
          e.preventDefault();
          onRestart();
        } else if (e.key === "Escape") {
          e.preventDefault();
          onEscape();
          (e.target as HTMLInputElement).blur();
        }
      }}
      autoComplete="off"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      aria-label="Typing test input"
      className="absolute inset-0 h-full w-full cursor-text opacity-0"
      style={{ fontSize: 16 }}
    />
  );
}
