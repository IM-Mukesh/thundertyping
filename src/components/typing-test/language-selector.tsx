"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Single-entry on purpose: English is the only supported language right now
// (see PROGRESS.md). This is a real, working selector — not a decorative
// placeholder — so adding a second language later is just a second row here.
const LANGUAGES = [{ id: "english", label: "English" }] as const;

interface LanguageSelectorProps {
  compact?: boolean;
}

export function LanguageSelector({ compact }: LanguageSelectorProps) {
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
        className={cn(
          "flex items-center text-xs text-sub transition-colors hover:text-foreground",
          compact
            ? "h-10 w-10 items-center justify-center rounded-lg border border-border bg-sub-alt/30 hover:border-accent active:scale-95"
            : "min-h-11 gap-1.5 rounded-md px-2 py-1 sm:min-h-0",
        )}
      >
        <Globe size={compact ? 18 : 13} />
        {!compact && <span>English</span>}
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
              className={cn(
                "absolute z-50 flex w-36 flex-col gap-0.5 rounded-lg border border-border bg-background p-1.5 shadow-lg",
                compact ? "right-0 top-12" : "left-1/2 top-9 -translate-x-1/2",
              )}
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
