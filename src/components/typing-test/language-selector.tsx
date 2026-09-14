"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Globe } from "lucide-react";

// Single-entry on purpose: English is the only supported language right now
// (see PROGRESS.md). This is a real, working selector — not a decorative
// placeholder — so adding a second language later is just a second row here.
const LANGUAGES = [{ id: "english", label: "English" }] as const;

export function LanguageSelector() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Language: English"
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-sub transition-colors hover:text-foreground"
      >
        <Globe size={13} />
        English
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              role="menu"
              aria-label="Language"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute left-1/2 top-9 z-50 flex w-36 -translate-x-1/2 flex-col gap-0.5 rounded-lg border border-border bg-background p-1.5 shadow-lg"
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked="true"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-sub-alt"
                >
                  {lang.label}
                  <Check size={14} className="ml-auto shrink-0" />
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
