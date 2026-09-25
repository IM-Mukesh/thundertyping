"use client";

import { useEffect, useRef } from "react";
import type { TestStatus } from "@/lib/typing-engine/engine-types";
import { splitOnCommit } from "@/lib/typing-engine/input-commit";

interface HiddenInputProps {
  value: string;
  status: TestStatus;
  disabled?: boolean;
  onChange: (value: string) => void;
  onCommitWord: () => void;
  onRestart: () => void;
  onEscape: () => void;
  onFocusChange: (focused: boolean) => void;
  focusToken: number;
}

export function HiddenInput({
  value,
  status,
  disabled = false,
  onChange,
  onCommitWord,
  onRestart,
  onEscape,
  onFocusChange,
  focusToken,
}: HiddenInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isDisabled = status === "finished" || disabled;

  useEffect(() => {
    if (isDisabled) return;
    const isTouch =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;
    // On touch devices, never auto-focus on initial mount when token is 0
    if (isTouch && focusToken === 0) return;
    inputRef.current?.focus();
  }, [focusToken, isDisabled]);

  return (
    <input
      ref={inputRef}
      value={value}
      disabled={isDisabled}
      onChange={(e) => {
        // A space reaching the value means a mobile keyboard delivered it
        // without a usable keydown; see splitOnCommit for why.
        const { value, commit } = splitOnCommit(e.target.value);
        onChange(value);
        if (commit) onCommitWord();
      }}
      onFocus={() => onFocusChange(true)}
      onBlur={() => onFocusChange(false)}
      onPaste={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        // Space, Tab and Escape are commands, not text. Holding one down
        // makes the OS repeat the keydown, and a command must fire once per
        // press however long it is held -- a held Tab would otherwise restart
        // the test dozens of times a second.
        //
        // Printable keys are deliberately NOT guarded here: they are handled
        // through onChange, and a held letter genuinely does type that letter
        // repeatedly, exactly as it would in any text field.
        if (e.repeat && (e.key === " " || e.key === "Tab" || e.key === "Escape")) {
          e.preventDefault();
          return;
        }

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
      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      style={{ fontSize: 16 }}
    />
  );
}
