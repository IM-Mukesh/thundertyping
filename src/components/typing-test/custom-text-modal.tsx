"use client";

import { useEffect, useId, useState } from "react";
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

export function CustomTextModal({ open, initialValue, onSubmit, onClose }: CustomTextModalProps) {
  const [draft, setDraft] = useState(initialValue);
  const [prevOpen, setPrevOpen] = useState(open);
  const titleId = useId();

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setDraft(initialValue);
  }

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
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
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_CUSTOM_TEXT_LENGTH))}
              maxLength={MAX_CUSTOM_TEXT_LENGTH}
              rows={6}
              aria-label="Custom text to practice with"
              placeholder="Paste or type the text you want to practice with..."
              className="resize-none rounded-md border border-border bg-sub-alt p-3 text-sm text-foreground outline-none focus:border-accent"
            />
            <p className="-mt-1 text-right text-xs text-sub">
              {draft.length}/{MAX_CUSTOM_TEXT_LENGTH}
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-sub hover:text-foreground">
                Cancel
              </button>
              <button
                type="button"
                disabled={draft.trim().length === 0}
                onClick={() => {
                  onSubmit(draft.trim());
                  onClose();
                }}
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-background disabled:opacity-40"
              >
                Use this text
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
