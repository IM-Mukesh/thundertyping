"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Palette } from "lucide-react";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { THEMES } from "@/components/theme/themes";
import { cn } from "@/lib/utils/cn";

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

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
        aria-label="Change theme"
        aria-expanded={open}
        aria-haspopup="true"
        className="flex h-9 w-9 items-center justify-center rounded-md text-sub transition-colors hover:bg-sub-alt hover:text-foreground"
      >
        <Palette size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              role="menu"
              aria-label="Theme"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-11 z-50 flex w-40 flex-col gap-0.5 rounded-lg border border-border bg-background p-1.5 shadow-lg"
            >
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={theme === t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-sub-alt",
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
