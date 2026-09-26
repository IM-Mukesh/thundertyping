"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface CustomTextModalProps {
  open: boolean;
  initialValue: string;
  onSubmit: (text: string) => void;
  onClose: () => void;
}

// Keeps the rendered word-stream (one DOM node per word) bounded even if
// someone pastes something enormous — generous enough for any real practice
// paragraph (roughly 300-400 words).
const MAX_CUSTOM_TEXT_LENGTH = 2000;

interface CustomTextDialogContentProps {
  initialValue: string;
  onSubmit: (text: string) => void;
  onClose: () => void;
}

function CustomTextDialogContent({ initialValue, onSubmit, onClose }: CustomTextDialogContentProps) {
  const [draft, setDraft] = useState(initialValue);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const previous = (document.activeElement as HTMLElement) ?? null;
    const frame = requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
    return () => {
      cancelAnimationFrame(frame);
      previous?.focus();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'textarea, button:not(:disabled), [href], input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // If focus somehow ends up outside the dialog while open, recapture it
      if (!dialog.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
        return;
      }

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-lg flex-col gap-3 rounded-lg border border-border bg-background p-5"
      >
        <h2 id={titleId} className="text-sm font-semibold text-foreground">
          Custom text
        </h2>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_CUSTOM_TEXT_LENGTH))}
          maxLength={MAX_CUSTOM_TEXT_LENGTH}
          rows={6}
          aria-label="Custom text to practice with"
          placeholder="Paste or type the text you want to practice with..."
          className="resize-none rounded-md border border-border bg-sub-alt p-3 text-sm text-foreground outline-none focus:border-accent focus-visible:ring-1 focus-visible:ring-accent"
        />
        <p className="-mt-1 text-right text-xs text-sub">
          {draft.length}/{MAX_CUSTOM_TEXT_LENGTH}
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-sub hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={draft.trim().length === 0}
            onClick={() => {
              onSubmit(draft.trim());
              onClose();
            }}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-background disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Use this text
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function CustomTextModal({ open, initialValue, onSubmit, onClose }: CustomTextModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <CustomTextDialogContent
          initialValue={initialValue}
          onSubmit={onSubmit}
          onClose={onClose}
        />
      )}
    </AnimatePresence>
  );
}
