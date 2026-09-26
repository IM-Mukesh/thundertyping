"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Palette } from "lucide-react";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { THEMES } from "@/components/theme/themes";
import { cn } from "@/lib/utils/cn";

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleToggle = () => {
    setOpen((prev) => {
      const willOpen = !prev;
      if (willOpen) {
        requestAnimationFrame(() => {
          const initialIndex = THEMES.findIndex((t) => t.id === theme);
          const targetIdx = initialIndex >= 0 ? initialIndex : 0;
          itemRefs.current[targetIdx]?.focus();
        });
      }
      return willOpen;
    });
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = itemRefs.current.findIndex((el) => el === document.activeElement);
    const total = THEMES.length;
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
        aria-label="Change theme"
        aria-expanded={open}
        aria-haspopup="true"
        className="flex h-11 w-11 items-center justify-center rounded-md text-sub transition-colors hover:bg-sub-alt hover:text-foreground sm:h-9 sm:w-9"
      >
        <Palette size={18} />
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
              aria-label="Theme"
              onKeyDown={handleMenuKeyDown}
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-11 z-50 flex w-40 flex-col gap-0.5 rounded-lg border border-border bg-background p-1.5 shadow-lg"
            >
              {THEMES.map((t, idx) => (
                <button
                  key={t.id}
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  type="button"
                  role="menuitemradio"
                  aria-checked={theme === t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-sub-alt focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
                    theme === t.id ? "text-foreground" : "text-sub",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 rounded-full border-2"
                    style={{ background: t.swatch.background, borderColor: t.swatch.accent }}
                  />
                  {t.label}
                  {theme === t.id && <Check size={14} className="ml-auto shrink-0" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
