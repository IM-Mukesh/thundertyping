"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Globe, Search, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Locale } from "@/lib/i18n/config";
import {
  filterTypingLanguages,
  getLanguageMetadata,
  TYPING_LANGUAGES_LIST,
  type TypingLanguageMetadata,
} from "@/lib/i18n/typing-language-metadata";

export interface LanguageSelectorModalProps {
  readonly open: boolean;
  readonly selectedLanguage: Locale;
  readonly onSelectLanguage: (language: Locale) => void;
  readonly onClose: () => void;
}

interface LanguageSelectorDialogContentProps {
  readonly selectedLanguage: Locale;
  readonly onSelectLanguage: (language: Locale) => void;
  readonly onClose: () => void;
}

function LanguageSelectorDialogContent({
  selectedLanguage,
  onSelectLanguage,
  onClose,
}: LanguageSelectorDialogContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const titleId = useId();
  const descriptionId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const cardRefs = useRef<Map<Locale, HTMLButtonElement>>(new Map());
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Filter languages in real time as the user types
  const filteredLanguages = useMemo(() => {
    return filterTypingLanguages(searchQuery, TYPING_LANGUAGES_LIST);
  }, [searchQuery]);

  const activeMeta = useMemo(() => {
    return getLanguageMetadata(selectedLanguage);
  }, [selectedLanguage]);

  // Capture trigger focus and lock background scrolling on mount
  useEffect(() => {
    triggerElementRef.current = (document.activeElement as HTMLElement) ?? null;

    // Prevent body scrolling while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus search input on open
    const timer = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });

    return () => {
      cancelAnimationFrame(timer);
      document.body.style.overflow = originalOverflow;
      triggerElementRef.current?.focus();
    };
  }, []);

  // Keyboard navigation inside the modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }

    // Grid arrow key navigation across cards
    const currentList = filteredLanguages.map((l) => l.id);
    const activeIndex = currentList.findIndex(
      (id) => cardRefs.current.get(id) === document.activeElement,
    );

    // Responsive column count for arrow key navigation (3-col desktop, 2-col tablet, 1-col mobile)
    const cols =
      typeof window !== "undefined" && window.innerWidth >= 1024
        ? 3
        : typeof window !== "undefined" && window.innerWidth >= 640
          ? 2
          : 1;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (document.activeElement === searchInputRef.current) {
        // Move from search to first card
        if (currentList.length > 0) {
          cardRefs.current.get(currentList[0])?.focus();
        }
      } else if (activeIndex >= 0) {
        // Move down by current column count, or wrap around
        const next =
          activeIndex + cols < currentList.length
            ? activeIndex + cols
            : (activeIndex + 1) % currentList.length;
        cardRefs.current.get(currentList[next])?.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < cols) {
        // Moving up from the top row returns focus to search input
        searchInputRef.current?.focus();
      } else if (activeIndex >= cols) {
        cardRefs.current.get(currentList[activeIndex - cols])?.focus();
      }
    } else if (e.key === "ArrowRight") {
      if (activeIndex >= 0) {
        e.preventDefault();
        const next = (activeIndex + 1) % currentList.length;
        cardRefs.current.get(currentList[next])?.focus();
      }
    } else if (e.key === "ArrowLeft") {
      if (activeIndex >= 0) {
        e.preventDefault();
        const prev = (activeIndex - 1 + currentList.length) % currentList.length;
        cardRefs.current.get(currentList[prev])?.focus();
      }
    } else if (e.key === "Tab") {
      // Focus trapping inside modal
      const modal = modalContainerRef.current;
      if (!modal) return;

      const focusable = modal.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const handleSelect = (lang: TypingLanguageMetadata) => {
    onSelectLanguage(lang.id);
    onClose();
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 sm:p-6"
      onKeyDown={handleKeyDown}
    >
      {/* Dimmed backdrop with subtle blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content / Command Center Panel */}
      <motion.div
        ref={modalContainerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative flex flex-col w-full max-h-[90vh] sm:max-h-[85vh] sm:max-w-[780px] lg:max-w-[820px]",
          "rounded-t-2xl sm:rounded-2xl border border-border-accent/60 bg-surface shadow-2xl",
          "overflow-hidden pb-safe",
        )}
      >
        {/* Subtle Gold / Accent Top Hairline Glow */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-accent to-transparent opacity-80" />

        {/* Mobile Drag Indicator */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-border/70" />
        </div>

        {/* Header Section */}
        <div className="px-5 pt-3 pb-3 sm:px-6 sm:pt-5 sm:pb-4 border-b border-border-subtle">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 font-display text-[10px] sm:text-xs font-bold uppercase tracking-widest text-accent">
                <Globe size={13} className="text-accent animate-pulse" />
                <span>LANGUAGE SYSTEM</span>
              </div>
              <h2
                id={titleId}
                className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground mt-0.5"
              >
                Choose Your Language
              </h2>
              <p
                id={descriptionId}
                className="text-xs sm:text-sm text-sub mt-0.5"
              >
                Find the language you want to practice and make every keystroke count.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center rounded border border-border/80 bg-sub-alt/60 px-1.5 py-0.5 font-mono text-[10px] text-sub">
                ESC
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close language selector"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-sub transition-colors hover:border-border hover:bg-surface-elevated hover:text-foreground active:scale-95"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Instant Search Field */}
          <div className="relative mt-3 sm:mt-4">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sub/70"
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search languages (e.g. Spanish, हिन्दी, 汉字, German)..."
              aria-label="Search supported typing languages"
              className={cn(
                "w-full rounded-xl border border-border-subtle bg-sub-alt/40 pl-10 pr-9 py-2 sm:py-2.5",
                "font-mono text-xs sm:text-sm text-foreground placeholder:text-sub/60",
                "transition-all duration-150 outline-none",
                "hover:border-border hover:bg-sub-alt/60",
                "focus:border-border-accent focus:bg-surface-elevated focus:ring-1 focus:ring-accent/40",
              )}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-sub transition-colors hover:bg-surface-elevated hover:text-foreground"
              >
                <X size={14} />
              </button>
            ) : (
              <span className="hidden sm:inline-block pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-sub/50">
                {filteredLanguages.length} available
              </span>
            )}
          </div>
        </div>

        {/* Language Selection Grid */}
        <div
          role="listbox"
          aria-label="Supported typing languages"
          className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4"
        >
          {filteredLanguages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {filteredLanguages.map((lang) => {
                const isSelected = lang.id === selectedLanguage;
                return (
                  <button
                    key={lang.id}
                    ref={(el) => {
                      if (el) {
                        cardRefs.current.set(lang.id, el);
                      } else {
                        cardRefs.current.delete(lang.id);
                      }
                    }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(lang)}
                    className={cn(
                      "group relative flex items-center justify-between p-3 sm:p-3.5 rounded-xl border text-left",
                      "transition-all duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      "min-h-[72px] sm:min-h-[76px]",
                      isSelected
                        ? "border-accent bg-accent-subtle/80 ring-1 ring-accent/60 shadow-md"
                        : "border-border-subtle bg-surface-elevated/30 hover:border-border-accent/80 hover:bg-surface-elevated/70 hover:shadow-sm",
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      {/* Typographic character badge */}
                      <div
                        className={cn(
                          "flex h-9 w-10 sm:h-10 sm:w-11 shrink-0 items-center justify-center rounded-lg border font-mono font-bold text-xs sm:text-sm tracking-tight transition-colors",
                          isSelected
                            ? "border-accent/40 bg-accent/15 text-accent shadow-sm"
                            : "border-border-subtle bg-sub-alt/60 text-sub group-hover:border-border group-hover:text-foreground",
                        )}
                        aria-hidden="true"
                      >
                        {lang.characterBadge}
                      </div>

                      {/* Language Name & Native script / English subtitle */}
                      <div className="min-w-0 truncate">
                        <span className="block font-display text-sm sm:text-base font-bold text-foreground tracking-tight truncate">
                          {lang.name}
                        </span>
                        <span className="block font-mono text-[11px] text-sub group-hover:text-foreground/80 truncate">
                          {lang.englishName !== lang.name ? lang.englishName : lang.script}
                        </span>
                      </div>
                    </div>

                    {/* Selected checkmark pill */}
                    <div
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-150",
                        isSelected
                          ? "bg-accent text-background shadow-sm"
                          : "border border-border-subtle text-transparent group-hover:border-sub group-hover:text-sub/40",
                      )}
                      aria-hidden="true"
                    >
                      <Check size={12} strokeWidth={isSelected ? 3 : 2} />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Empty Search Results State */
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border-subtle bg-sub-alt/40 text-sub">
                <Search size={22} className="opacity-60" />
              </div>
              <h3 className="font-display text-sm font-semibold text-foreground mt-3 uppercase tracking-wide">
                No matching languages
              </h3>
              <p className="text-xs text-sub mt-1 max-w-xs">
                We couldn&apos;t find any supported typing pack matching &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                className="mt-3 rounded-lg border border-border bg-sub-alt/60 px-3 py-1.5 font-mono text-xs text-accent transition-colors hover:border-accent hover:bg-sub-alt"
              >
                Clear search filter
              </button>
            </div>
          )}
        </div>

        {/* Bottom Status / Navigation Bar */}
        <div className="flex items-center justify-between border-t border-border-subtle bg-sub-alt/20 px-5 py-2.5 sm:px-6 sm:py-3 text-xs text-sub">
          <div className="flex items-center gap-1.5 min-w-0">
            <Sparkles size={12} className="text-accent shrink-0" />
            <span className="truncate">
              Active: <strong className="text-foreground">{activeMeta.name}</strong> ({activeMeta.characterBadge})
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 font-mono text-[10px] text-sub/60">
            <span>↑↓ navigate</span>
            <span>•</span>
            <span>Enter to select</span>
            <span>•</span>
            <span>ESC to close</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function LanguageSelectorModal({
  open,
  selectedLanguage,
  onSelectLanguage,
  onClose,
}: LanguageSelectorModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <LanguageSelectorDialogContent
          selectedLanguage={selectedLanguage}
          onSelectLanguage={onSelectLanguage}
          onClose={onClose}
        />
      )}
    </AnimatePresence>
  );
}
