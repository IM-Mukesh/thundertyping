"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface CustomTextModalProps {
  open: boolean;
  initialValue: string;
  onSubmit: (text: string) => void;
  onClose: () => void;
}

export function CustomTextModal({ open, initialValue, onSubmit, onClose }: CustomTextModalProps) {
  const [draft, setDraft] = useState(initialValue);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setDraft(initialValue);
  }

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
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-lg flex-col gap-3 rounded-lg border border-border bg-background p-5"
          >
            <h2 className="text-sm font-semibold text-foreground">Custom text</h2>
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              placeholder="Paste or type the text you want to practice with..."
              className="resize-none rounded-md border border-border bg-sub-alt p-3 text-sm text-foreground outline-none focus:border-accent"
            />
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
