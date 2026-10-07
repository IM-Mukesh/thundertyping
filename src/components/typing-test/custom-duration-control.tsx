"use client";

import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { Pencil } from "lucide-react";
import {
  CUSTOM_DURATION_ERROR,
  CUSTOM_DURATION_HINT,
  formatDuration,
  parseCustomDuration,
} from "@/lib/typing-engine/custom-duration";
import {
  MAX_CUSTOM_TIME_DURATION,
  MIN_CUSTOM_TIME_DURATION,
} from "@/lib/typing-engine/engine-types";
import { cn } from "@/lib/utils/cn";

interface CustomDurationControlProps {
  value: number;
  isCustom: boolean;
  onApply: (seconds: number) => void;
  className?: string;
}

function updateDialogViewport(dialog: HTMLDialogElement) {
  const viewport = window.visualViewport;
  dialog.style.setProperty("--duration-viewport-height", `${viewport?.height ?? window.innerHeight}px`);
  dialog.style.setProperty("--duration-viewport-width", `${viewport?.width ?? window.innerWidth}px`);
  dialog.style.setProperty("--duration-viewport-top", `${viewport?.offsetTop ?? 0}px`);
  dialog.style.setProperty("--duration-viewport-left", `${viewport?.offsetLeft ?? 0}px`);
}

function isOutsideDialog(event: MouseEvent<HTMLDialogElement>) {
  if (event.target !== event.currentTarget) return false;
  const bounds = event.currentTarget.getBoundingClientRect();
  return event.clientX < bounds.left || event.clientX > bounds.right ||
    event.clientY < bounds.top || event.clientY > bounds.bottom;
}

export function CustomDurationControl({
  value,
  isCustom,
  onApply,
  className,
}: CustomDurationControlProps) {
  const [open, setOpen] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const finishedRef = useRef(true);
  const pointerStartedOutsideRef = useRef(false);
  const id = useId();
  const dialogId = `${id}-dialog`;
  const inputId = `${id}-seconds`;
  const triggerLabel = isCustom
    ? `Custom time: ${formatDuration(value)} (${value} seconds)`
    : "Set custom time";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    const viewport = window.visualViewport;
    const update = () => updateDialogViewport(dialog);
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  const closeDialog = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    dialogRef.current?.close();
    setOpen(false);
    setInvalid(false);
    buttonRef.current?.focus({ preventScroll: true });
  };

  const commit = () => {
    if (finishedRef.current) return;
    const seconds = parseCustomDuration(inputRef.current?.value ?? "");
    if (seconds === null) {
      setInvalid(true);
      inputRef.current?.focus({ preventScroll: true });
      return;
    }
    closeDialog();
    onApply(seconds);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        title={triggerLabel}
        aria-haspopup="dialog"
        aria-pressed={isCustom}
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={(event) => {
          event.stopPropagation();
          const dialog = dialogRef.current;
          const input = inputRef.current;
          if (!dialog || !input || dialog.open) return;

          finishedRef.current = false;
          pointerStartedOutsideRef.current = false;
          input.value = String(value);
          setInvalid(false);
          updateDialogViewport(dialog);
          // Keep the closed dialog mounted so focus stays within this user
          // gesture (required for opening the keyboard on mobile Safari).
          dialog.showModal();
          setOpen(true);
          input.focus({ preventScroll: true });
        }}
        className={cn(
          "inline-flex h-11 flex-none items-center justify-center rounded transition-colors pointer-fine:h-9 focus-visible:outline-2 focus-visible:outline-accent",
          isCustom
            ? "min-w-11 gap-1 px-2 font-mono text-[11px] font-semibold lowercase tracking-wide text-accent bg-accent/15 sm:gap-1.5 sm:px-2.5 pointer-fine:min-w-9 pointer-fine:px-2"
            : "w-11 text-sub hover:bg-sub-alt hover:text-foreground pointer-fine:w-9",
          className,
        )}
      >
        <Pencil size={isCustom ? 12 : 14} aria-hidden="true" className="shrink-0" />
        {isCustom && (
          <span className="font-mono text-[11px] lowercase tracking-wide sm:text-xs">
            {formatDuration(value)}
          </span>
        )}
        <span className="sr-only">{triggerLabel}</span>
      </button>

      {/* The top layer escapes toolbar masks/overflow while DOM placement
          preserves inherited, scoped theme variables. */}
      <dialog
        ref={dialogRef}
        id={dialogId}
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        onCancel={(event) => {
          event.preventDefault();
          event.stopPropagation();
          closeDialog();
        }}
        onClose={(event) => {
          event.stopPropagation();
          // Ignore a queued close event if the control was already reopened.
          if (!event.currentTarget.open) closeDialog();
        }}
        onKeyDown={(event) => {
          // The mobile settings parent also listens for Escape on window.
          // Dialog keystrokes must not reach that listener or typing shortcuts.
          event.stopPropagation();
          if (event.key === "Escape") {
            event.preventDefault();
            closeDialog();
          } else if (event.key === "Enter" && event.nativeEvent.isComposing) {
            event.preventDefault();
          }
        }}
        onKeyUp={(event) => event.stopPropagation()}
        onPointerDown={(event) => {
          event.stopPropagation();
          pointerStartedOutsideRef.current = isOutsideDialog(event);
        }}
        onPointerCancel={() => { pointerStartedOutsideRef.current = false; }}
        onClick={(event) => {
          event.stopPropagation();
          if (pointerStartedOutsideRef.current && isOutsideDialog(event)) closeDialog();
          pointerStartedOutsideRef.current = false;
        }}
        className="fixed m-0 overflow-y-auto overscroll-contain rounded-xl border border-border bg-background p-0 text-left text-foreground shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-xs"
        style={{
          inset: "auto",
          top: "calc(var(--duration-viewport-top, 0px) + var(--duration-viewport-height, 100dvh) / 2)",
          left: "calc(var(--duration-viewport-left, 0px) + var(--duration-viewport-width, 100vw) / 2)",
          transform: "translate(-50%, -50%)",
          width: "min(20rem, calc(var(--duration-viewport-width, 100vw) - 2rem))",
          maxHeight: "calc(var(--duration-viewport-height, 100dvh) - 2rem)",
        }}
      >
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            commit();
          }}
          className="flex flex-col gap-3 p-4"
        >
          <h2 id={`${id}-title`} className="text-sm font-semibold">Custom time</h2>
          <div className="flex flex-col gap-2">
            <label htmlFor={inputId} className="text-sm text-sub">Duration in seconds</label>
            <input
              ref={inputRef}
              id={inputId}
              type="number"
              inputMode="numeric"
              enterKeyHint="done"
              min={MIN_CUSTOM_TIME_DURATION}
              max={MAX_CUSTOM_TIME_DURATION}
              step={1}
              defaultValue={value}
              onChange={() => { if (invalid) setInvalid(false); }}
              aria-label="Custom time in seconds"
              aria-invalid={invalid}
              aria-describedby={`${id}-hint${invalid ? ` ${id}-error` : ""}`}
              className={cn(
                "min-h-11 w-full rounded-lg border bg-sub-alt/40 px-3 py-2 font-mono text-base text-foreground focus:outline-2 focus:outline-accent",
                invalid ? "border-error" : "border-border",
              )}
            />
            <p id={`${id}-hint`} className="text-xs text-sub">{CUSTOM_DURATION_HINT}</p>
            {invalid && (
              <p id={`${id}-error`} className="text-xs text-error" role="alert">
                {CUSTOM_DURATION_ERROR}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeDialog}
              className="min-h-11 rounded-lg border border-border px-3 text-sm text-sub transition-colors hover:bg-sub-alt hover:text-foreground pointer-fine:min-h-9"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-11 rounded-lg bg-accent px-3 text-sm font-semibold text-background pointer-fine:min-h-9"
            >
              Set duration
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
