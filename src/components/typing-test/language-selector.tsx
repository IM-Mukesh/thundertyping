"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AVAILABLE_LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n/config";

interface LanguageSelectorProps {
  language: Locale;
  onLanguageChange: (language: Locale) => void;
  disabled?: boolean;
  compact?: boolean;
}

// This control intentionally owns no route or persistence side effects. The
// homepage typing test supplies its local value and applies the selected
// content to the engine only when the test is idle.
export function LanguageSelector({ language, onLanguageChange, disabled = false, compact }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Partial<Record<Locale, HTMLButtonElement | null>>>({});

  const handleToggle = () => {
    if (disabled) return;
    setOpen((prev) => {
      const willOpen = !prev;
      if (willOpen) {
        requestAnimationFrame(() => {
          const current = AVAILABLE_LOCALES.includes(language) ? language : AVAILABLE_LOCALES[0];
          itemRefs.current[current]?.focus();
        });
      }
      return willOpen;
    });
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = AVAILABLE_LOCALES.findIndex((locale) => itemRefs.current[locale] === document.activeElement);
    const total = AVAILABLE_LOCALES.length;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = currentIndex >= 0 ? (currentIndex + 1) % total : 0;
      itemRefs.current[AVAILABLE_LOCALES[next]]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = currentIndex >= 0 ? (currentIndex - 1 + total) % total : total - 1;
      itemRefs.current[AVAILABLE_LOCALES[next]]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      itemRefs.current[AVAILABLE_LOCALES[0]]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      itemRefs.current[AVAILABLE_LOCALES[total - 1]]?.focus();
    }
  };

  const switchLanguage = (locale: Locale) => {
    setOpen(false);
    triggerRef.current?.focus();
    if (!disabled && locale !== language && AVAILABLE_LOCALES.includes(locale)) {
      onLanguageChange(locale);
    }
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-label={`Typing language: ${LOCALE_NAMES[language]}`}
        aria-expanded={open && !disabled}
        aria-haspopup="true"
        className={cn(
          "flex items-center text-xs text-sub transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
          compact
            ? "h-10 w-10 items-center justify-center rounded-lg border border-border bg-sub-alt/30 hover:border-accent active:scale-95"
            : "min-h-11 gap-1.5 rounded-md px-2 py-1 sm:min-h-0",
        )}
      >
        <Globe size={compact ? 18 : 13} />
        {!compact && <span>{LOCALE_NAMES[language]}</span>}
      </button>

      <AnimatePresence>
        {open && !disabled && (
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
              aria-label="Typing language"
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
              {AVAILABLE_LOCALES.map((locale) => (
                <button
                  key={locale}
                  ref={(el) => {
                    itemRefs.current[locale] = el;
                  }}
                  type="button"
                  role="menuitemradio"
                  aria-checked={locale === language}
                  onClick={() => switchLanguage(locale)}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-sub-alt focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                >
                  {LOCALE_NAMES[locale]}
                  {locale === language && <Check size={14} className="ml-auto shrink-0" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
