"use client";

import { useRef, useState } from "react";
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleToggle = () => {
    setOpen((prev) => {
      const willOpen = !prev;
      if (willOpen) {
        requestAnimationFrame(() => {
          itemRefs.current[0]?.focus();
        });
      }
      return willOpen;
    });
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = itemRefs.current.findIndex((el) => el === document.activeElement);
    const total = LANGUAGES.length;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = currentIndex >= 0 ? (currentIndex + 1) % total : 0;
      itemRefs.current[next]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = currentIndex >= 0 ? (currentIndex - 1 + total) % total : total - 1;
      itemRefs.current[next]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      itemRefs.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      itemRefs.current[total - 1]?.focus();
    }
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
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
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
            />
            <motion.div
              role="menu"
              aria-label="Language"
              onKeyDown={handleMenuKeyDown}
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className={cn(
                "absolute z-50 flex w-36 flex-col gap-0.5 rounded-lg border border-border bg-background p-1.5 shadow-lg",
                compact ? "right-0 top-12" : "left-1/2 top-9 -translate-x-1/2",
              )}
            >
              {LANGUAGES.map((lang, idx) => (
                <button
                  key={lang.id}
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  type="button"
                  role="menuitemradio"
                  aria-checked="true"
                  onClick={() => {
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-sub-alt focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
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
