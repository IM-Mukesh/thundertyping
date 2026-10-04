"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { TestStatus } from "@/lib/typing-engine/engine-types";
import { splitOnCommit } from "@/lib/typing-engine/input-commit";
import { focusInputDuringGesture } from "@/lib/typing-engine/input-focus";

interface HiddenInputProps {
  value: string;
  status: TestStatus;
  disabled?: boolean;
  onChange: (value: string) => void;
  onCompositionPreview?: (value: string | null) => void;
  resetKey?: string | number;
  onCommitWord: () => void;
  onRestart: () => void;
  onEscape: () => void;
  onFocusChange: (focused: boolean) => void;
  focusToken: number;
}

interface CompositionDraft {
  value: string;
  resetKey: HiddenInputProps["resetKey"];
}

interface InputEcho {
  raw: string;
  value: string;
}

function isCompositionInput(event: InputEvent) {
  return event.isComposing || event.type === "compositionend" ||
    event.inputType?.includes("Composition");
}

export function HiddenInput({
  value,
  status,
  disabled = false,
  onChange,
  onCompositionPreview,
  resetKey,
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
  const hasCompositionStartRef = useRef(false);
  const cancelledCompositionRef = useRef(false);
  const acceptsInputRef = useRef(true);
  const echoRef = useRef<InputEcho | null>(null);
  const [draft, setDraft] = useState<CompositionDraft | null>(null);
  const previousScopeRef = useRef({ resetKey, isDisabled, status });

  function clearComposition() {
    cancelledCompositionRef.current ||= isComposingRef.current;
    isComposingRef.current = false;
    hasCompositionStartRef.current = false;
    echoRef.current = null;
    setDraft(null);
    onCompositionPreview?.(null);
  }

  function updateDraft(raw: string) {
    setDraft({ value: raw, resetKey });
    onCompositionPreview?.(raw);
  }

  function applyInput(raw: string, expectEcho = false) {
    const next = splitOnCommit(raw);
    // Some keyboards deliver the final input again after compositionend,
    // including the old word without its space after we've cleared the field.
    echoRef.current = expectEcho || next.commit
      ? { raw, value: next.value }
      : null;
    onChange(next.value);
    if (next.commit) onCommitWord();
  }

  useLayoutEffect(() => {
    const previous = previousScopeRef.current;
    previousScopeRef.current = { resetKey, isDisabled, status };
    if (
      resetKey === previous.resetKey &&
      !(isDisabled && !previous.isDisabled) &&
      !(status === "idle" && previous.status !== "idle")
    ) return;

    cancelledCompositionRef.current ||= isComposingRef.current;
    isComposingRef.current = false;
    hasCompositionStartRef.current = false;
    echoRef.current = null;
    // Reset the browser-owned edit session before paint when its engine scope
    // changes, even if the committed value was already empty before restarting.
    setDraft(null);
    onCompositionPreview?.(null);
  }, [resetKey, isDisabled, status, onCompositionPreview]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    // React's onBeforeInput can be synthesized from textInput/compositionend;
    // listen to the real beforeinput too, including deletions on mobile. A new
    // edit ends echo suppression so a later identical word is never swallowed.
    const beforeInput = (event: InputEvent) => {
      if (isCompositionInput(event)) return;
      echoRef.current = null;
      cancelledCompositionRef.current = false;
    };
    input.addEventListener("beforeinput", beforeInput);
    return () => input.removeEventListener("beforeinput", beforeInput);
  }, []);

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
    // A pointer/touch handler may already have focused the input during the
    // gesture. Do not issue a second focus from this later effect.
    if (inputRef.current && inputRef.current !== document.activeElement) {
      inputRef.current.focus();
    }
  }, [focusToken, isDisabled]);

  return (
    <>
      <span id="typing-test-input-instructions" className="sr-only">
        Type to test speed. Press Tab to restart, Shift+Tab to navigate controls, or Escape to unfocus.
      </span>
      <input
        ref={inputRef}
        value={!isDisabled && draft?.resetKey === resetKey ? (draft?.value ?? value) : value}
        disabled={isDisabled}
        onPointerDown={(e) => {
          // Mobile browsers only permit the virtual keyboard to open when
          // focus happens inside the pointer gesture. The focusToken effect
          // below intentionally remains as a desktop/programmatic fallback,
          // but is too late to be the only mobile path.
          if (e.button === 0) {
            focusInputDuringGesture(inputRef.current, isDisabled);
          }
        }}
        // Older iOS versions may expose touch events without Pointer Events.
        // Keep this fallback on the input itself so the call is still part of
        // the user's direct gesture rather than a later React effect.
        onTouchStart={() => {
          focusInputDuringGesture(inputRef.current, isDisabled);
        }}
        onChange={(e) => {
          if (isDisabled || !acceptsInputRef.current || cancelledCompositionRef.current) return;
          const raw = e.target.value;
          const native = e.nativeEvent as InputEvent;
          const echo = echoRef.current;
          echoRef.current = null;
          if (echo && (raw === echo.raw || raw === echo.value)) return;
          if (native.isComposing || isComposingRef.current) {
            // A native composing input can arrive without React observing a
            // compositionstart. In that case the first non-composing change
            // is also our fallback end event.
            if (native.isComposing || hasCompositionStartRef.current) {
              isComposingRef.current = true;
              echoRef.current = null;
              updateDraft(raw);
              return;
            }
            isComposingRef.current = false;
            setDraft(null);
            onCompositionPreview?.(null);
          }

          // A space reaching the value means a mobile keyboard delivered it
          // without a usable keydown; see splitOnCommit for why.
          applyInput(raw);
        }}
        onBeforeInput={(e) => {
          const native = e.nativeEvent as InputEvent;
          if (isCompositionInput(native)) return;
          const echo = echoRef.current;
          // Legacy textInput can represent the composition's final echo rather
          // than a new edit; the native beforeinput listener above disambiguates
          // actual edits on current mobile browsers.
          if (native.type === "textInput" && echo &&
            (native.data === echo.raw || native.data === echo.value)) return;
          echoRef.current = null;
          cancelledCompositionRef.current = false;
        }}
        onCompositionStart={(e) => {
          if (isDisabled || !acceptsInputRef.current) return;
          isComposingRef.current = true;
          hasCompositionStartRef.current = true;
          cancelledCompositionRef.current = false;
          echoRef.current = null;
          updateDraft(e.currentTarget.value);
        }}
        onCompositionEnd={(e) => {
          if (isDisabled || !acceptsInputRef.current) return;
          const raw = e.currentTarget.value;
          if (cancelledCompositionRef.current) {
            cancelledCompositionRef.current = false;
            echoRef.current = { raw, value: splitOnCommit(raw).value };
            return;
          }
          if (!isComposingRef.current) return;
          isComposingRef.current = false;
          hasCompositionStartRef.current = false;
          setDraft(null);
          onCompositionPreview?.(null);
          // The actual field, including an empty value after cancellation or
          // deletion, is authoritative. Never resurrect the previous draft.
          applyInput(raw, true);
        }}
        onFocus={() => {
          acceptsInputRef.current = true;
          cancelledCompositionRef.current = false;
          echoRef.current = null;
          onFocusChange(true);
        }}
        onBlur={() => {
          acceptsInputRef.current = false;
          clearComposition();
          onFocusChange(false);
        }}
        onPaste={(e) => e.preventDefault()}
        onSelect={(e) => {
          if (isComposingRef.current || (e.nativeEvent as InputEvent).isComposing) return;
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
          if (
            isComposingRef.current || e.nativeEvent.isComposing ||
            e.nativeEvent.keyCode === 229 || e.key === "Process"
          ) return;

          if (e.key.length === 1 || e.key === "Backspace" || e.key === "Delete") {
            echoRef.current = null;
            cancelledCompositionRef.current = false;
          }

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
            clearComposition();
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
