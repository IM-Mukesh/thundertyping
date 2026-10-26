"use client";

import { useId, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Globe } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AVAILABLE_LOCALES, type Locale } from "@/lib/i18n/config";
import { getLanguageMetadata } from "@/lib/i18n/typing-language-metadata";
import { LanguageSelectorModal } from "@/components/typing-test/language-selector-modal";

export interface LanguageSelectorProps {
  language: Locale;
  onLanguageChange: (language: Locale) => void;
  disabled?: boolean;
  compact?: boolean;
}

/**
 * HeroTyping Language Selector
 *
 * Provides a sleek, premium trigger button that opens the centered
 * Language Command Center dialog. Strictly controls the language of the words
 * and quotes in the typing test without modifying the website's interface language.
 */
export function LanguageSelector({
  language,
  onLanguageChange,
  disabled = false,
  compact = false,
}: LanguageSelectorProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const triggerId = useId();

  const currentMeta = useMemo(() => {
    return getLanguageMetadata(language);
  }, [language]);

  const handleOpen = () => {
    if (disabled) return;
    setModalOpen(true);
  };

  const handleSelectLanguage = (nextLanguage: Locale) => {
    if (!disabled && AVAILABLE_LOCALES.includes(nextLanguage)) {
      onLanguageChange(nextLanguage);
    }
  };

  return (
    <>
      <button
        id={triggerId}
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        aria-label={`Typing language: ${currentMeta.name}. Open language command center.`}
        aria-expanded={modalOpen}
        aria-haspopup="dialog"
        className={cn(
          "group relative flex items-center transition-all duration-200 outline-none",
          "disabled:cursor-not-allowed disabled:opacity-40",
          compact
            ? "gap-1.5 rounded-lg border border-border/80 bg-sub-alt/40 px-2.5 py-1.5 text-xs text-foreground hover:border-border-accent hover:bg-sub-alt active:scale-95"
            : "gap-2 rounded-lg border border-border/70 bg-surface/70 px-3 py-1.5 text-xs text-sub shadow-sm hover:border-border-accent hover:bg-surface-elevated hover:text-foreground active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent",
        )}
      >
        <Globe
          size={compact ? 13 : 13}
          className="shrink-0 text-accent transition-transform duration-200 group-hover:rotate-12"
          aria-hidden="true"
        />

        <span className="font-mono text-xs font-medium text-foreground tracking-tight">
          {currentMeta.name}
        </span>

        {/* Typographic character badge preview */}
        <span
          className={cn(
            "rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold transition-colors",
            compact
              ? "bg-accent/10 text-accent text-[9px]"
              : "border border-accent/20 bg-accent/10 text-accent",
          )}
        >
          {currentMeta.characterBadge}
        </span>

        {compact ? (
          <ChevronRight size={12} className="text-sub/70 transition-transform duration-200 group-hover:translate-x-0.5" />
        ) : (
          <ChevronDown size={12} className="text-sub/70 transition-transform duration-200 group-hover:translate-y-0.5" />
        )}
      </button>

      <LanguageSelectorModal
        open={modalOpen}
        selectedLanguage={language}
        onSelectLanguage={handleSelectLanguage}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
