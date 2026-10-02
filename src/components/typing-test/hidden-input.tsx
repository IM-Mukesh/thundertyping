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
  // Tracks the last `focusToken` this effect actually saw, so a touch device
  // can tell "the caller just asked for focus" apart from "disabled merely
  // turned false again" (e.g. closing the Custom Text modal, which leaves
  // focusToken untouched on touch on purpose -- see its onClose). Without
  // this, `isDisabled` flipping false->true->false re-ran the effect with the
  // same already-nonzero token and popped the keyboard anyway.
  const lastFocusTokenRef = useRef(focusToken);
  // While an IME composition is in progress (e.g. typing Pinyin/Romaji),
  // the browser uses Space/Enter to pick a candidate, not to commit a word,
  // and fires a synthetic onChange with the in-progress composition text.
  // Without this guard those keys would commit a half-composed word and the
  // composition text itself would get scored as if it were final input.
  const isComposingRef = useRef(false);

  useEffect(() => {
    const tokenChanged = focusToken !== lastFocusTokenRef.current;
    lastFocusTokenRef.current = focusToken;
    if (isDisabled) return;
    const isTouch =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;
    // On touch devices, only focus in response to an explicit token bump (a
    // real tap) -- never as a side effect of `disabled` turning false again.
    if (isTouch && !tokenChanged) return;
    inputRef.current?.focus();
  }, [focusToken, isDisabled]);

  return (
    <>
      <span id="typing-test-input-instructions" className="sr-only">
        Type to test speed. Press Tab to restart, Shift+Tab to navigate controls, or Escape to unfocus.
      </span>
      <input
        ref={inputRef}
        value={value}
        disabled={isDisabled}
        onChange={(e) => {
          // Mid-composition, the value is provisional candidate text, not
          // what the user will actually end up with -- let onCompositionEnd
          // apply the final result instead of scoring every intermediate guess.
          if (isComposingRef.current) return;
          // A space reaching the value means a mobile keyboard delivered it
          // without a usable keydown; see splitOnCommit for why.
          const { value, commit } = splitOnCommit(e.target.value);
          onChange(value);
          if (commit) onCommitWord();
        }}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={(e) => {
          isComposingRef.current = false;
          const { value, commit } = splitOnCommit(e.currentTarget.value);
          onChange(value);
          if (commit) onCommitWord();
        }}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        onPaste={(e) => e.preventDefault()}
        onSelect={(e) => {
          // The cursor is always logically at the end of what's been typed --
          // same convention every typing test uses, and the only thing that
          // keeps the rendered caret (word-stream.tsx, which always draws it
          // at `typed.length`) honest. Without this, arrow keys/Home/End/a
          // mouse click inside the input could move the real edit point
          // somewhere the visible caret doesn't show, so what the user sees
          // as "where I'm about to type" stops matching where the next
          // keystroke actually lands.
          const el = e.currentTarget;
          const end = el.value.length;
          if (el.selectionStart !== end || el.selectionEnd !== end) {
            el.setSelectionRange(end, end);
          }
        }}
        onKeyDown={(e) => {
          // Let the IME handle every key while composing -- Space/Enter there
          // pick a candidate, they don't mean "commit the word".
          if (isComposingRef.current || e.key === "Process") return;

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

          // Keep the cursor pinned to the end -- see onSelect above.
          if (
            e.key === "ArrowLeft" ||
            e.key === "ArrowRight" ||
            e.key === "Home" ||
            e.key === "End"
          ) {
            e.preventDefault();
            return;
          }

          if (e.key === " ") {
            e.preventDefault();
            onCommitWord();
          } else if (e.key === "Tab") {
            // Shift+Tab lets keyboard-only users navigate backward to the config bar & header
            if (e.shiftKey) {
              return;
            }
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
        aria-describedby="typing-test-input-instructions"
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        style={{ fontSize: 16 }}
      />
    </>
  );
}
