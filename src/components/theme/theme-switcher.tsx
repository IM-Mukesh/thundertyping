"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Palette, Sparkles, X } from "lucide-react";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import {
  THEMES,
  THEME_CATEGORIES,
  type ThemeCategory,
  type ThemeDefinition,
  type ThemeId,
} from "@/components/theme/themes";
import { cn } from "@/lib/utils/cn";

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ThemeCategory>("All");
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const headerId = useId();

  const activeThemeDef = THEMES.find((t) => t.id === theme) || THEMES[0];

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: THEMES.length };
    for (const t of THEMES) {
      counts[t.category] = (counts[t.category] ?? 0) + 1;
    }
    return counts;
  }, []);

  const filteredThemes =
    selectedCategory === "All"
      ? THEMES
      : THEMES.filter((t) => t.category === selectedCategory);

  const handleToggle = () => {
    setOpen((prev) => {
      const willOpen = !prev;
      if (willOpen) {
        requestAnimationFrame(() => {
          const activeEl = itemRefs.current.get(theme);
          if (activeEl) {
            activeEl.focus();
          } else {
            const firstId = filteredThemes[0]?.id;
            if (firstId) itemRefs.current.get(firstId)?.focus();
          }
        });
      }
      return willOpen;
    });
  };

  const handleClose = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  // Keyboard navigation inside theme matrix
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
      return;
    }

    const currentThemeIds = filteredThemes.map((t) => t.id);
    const activeIndex = currentThemeIds.findIndex(
      (id) => itemRefs.current.get(id) === document.activeElement,
    );

    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const nextIdx = activeIndex >= 0 ? (activeIndex + 1) % currentThemeIds.length : 0;
      itemRefs.current.get(currentThemeIds[nextIdx])?.focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const nextIdx =
        activeIndex >= 0
          ? (activeIndex - 1 + currentThemeIds.length) % currentThemeIds.length
          : currentThemeIds.length - 1;
      itemRefs.current.get(currentThemeIds[nextIdx])?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      if (currentThemeIds.length > 0) {
        itemRefs.current.get(currentThemeIds[0])?.focus();
      }
    } else if (e.key === "End") {
      e.preventDefault();
      if (currentThemeIds.length > 0) {
        itemRefs.current.get(currentThemeIds[currentThemeIds.length - 1])?.focus();
      }
    }
  };

  // Close when clicking outside on desktop
  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-label={`Change theme. Current: ${activeThemeDef.label}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="group relative flex h-10 items-center gap-2 rounded-lg border border-border-subtle bg-surface px-2.5 text-sub transition-all duration-200 hover:border-border-accent hover:bg-surface-elevated hover:text-foreground sm:h-9"
      >
        <span
          className="h-3 w-3 rounded-full border shadow-sm transition-transform duration-200 group-hover:scale-110"
          style={{
            backgroundColor: activeThemeDef.swatch.background,
            borderColor: activeThemeDef.swatch.accent,
            boxShadow: `0 0 8px ${activeThemeDef.swatch.accent}66`,
          }}
          aria-hidden="true"
        />
        <Palette size={16} className="text-sub group-hover:text-accent transition-colors" />
        <span className="hidden font-mono text-xs font-medium tracking-tight sm:inline">
          {activeThemeDef.label}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden"
              onClick={handleClose}
              aria-hidden="true"
            />

            {/* Gallery Popover / Dialog */}
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={headerId}
              onKeyDown={handleKeyDown}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "fixed inset-x-3 bottom-3 top-auto z-50 max-h-[82vh] overflow-hidden rounded-2xl border border-border-accent bg-surface p-4 shadow-2xl backdrop-blur-xl sm:absolute sm:inset-auto sm:right-0 sm:top-12 sm:w-[480px] sm:max-h-[580px] sm:rounded-xl sm:p-4 sm:shadow-2xl",
              )}
            >
              {/* Header */}
              <div className="mb-3 flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-subtle text-accent">
                    <Sparkles size={15} />
                  </div>
                  <div>
                    <h2
                      id={headerId}
                      className="font-display text-sm font-semibold tracking-wider text-foreground uppercase"
                    >
                      Theme Matrix
                    </h2>
                    <p className="font-mono text-[11px] text-sub">
                      Active: <span className="text-accent font-medium">{activeThemeDef.label}</span> •{" "}
                      {THEMES.length} Presets
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close theme gallery"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-sub transition-colors hover:bg-surface-elevated hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Theme categories">
                {THEME_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium tracking-tight transition-all duration-150 flex items-center gap-1",
                        isSelected
                          ? "bg-accent text-background font-semibold shadow-sm"
                          : "bg-surface-elevated text-sub hover:bg-surface-hover hover:text-foreground",
                      )}
                    >
                      <span>{cat}</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        ({categoryCounts[cat] ?? 0})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Themes Grid */}
              <div
                className="grid max-h-[50vh] sm:max-h-[420px] grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto pr-1 no-scrollbar"
                role="radiogroup"
                aria-label="Theme selection"
              >
                {filteredThemes.map((t: ThemeDefinition) => {
                  const isActive = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      ref={(el) => {
                        if (el) itemRefs.current.set(t.id, el);
                        else itemRefs.current.delete(t.id);
                      }}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => {
                        setTheme(t.id as ThemeId);
                      }}
                      className={cn(
                        "group relative flex flex-col justify-between rounded-xl border p-2.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                        isActive
                          ? "border-accent bg-surface-elevated shadow-md"
                          : "border-border-subtle bg-surface hover:border-border hover:bg-surface-hover",
                      )}
                    >
                      {/* Top row: Label & Checkmark */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-sans text-xs font-semibold text-foreground group-hover:text-accent transition-colors">
                            {t.label}
                          </span>
                          <span className="rounded bg-surface-elevated px-1.5 py-0.2 text-[9px] font-mono text-sub">
                            {t.category}
                          </span>
                        </div>
                        {isActive && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-background">
                            <Check size={11} strokeWidth={3} />
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="mb-2 text-[11px] leading-tight text-sub line-clamp-1">
                        {t.description}
                      </p>

                      {/* Swatch Strip */}
                      <div
                        className="flex h-5 w-full items-center gap-1 rounded-md px-1.5 border border-border-subtle"
                        style={{ backgroundColor: t.swatch.background }}
                      >
                        {/* Background dot */}
                        <div
                          className="h-2.5 w-2.5 rounded-full border border-white/20"
                          style={{ backgroundColor: t.swatch.background }}
                          title="Background"
                        />
                        {/* Surface pill */}
                        <div
                          className="h-2.5 w-4 rounded-sm border border-white/10"
                          style={{ backgroundColor: t.swatch.surface }}
                          title="Surface"
                        />
                        {/* Accent pill */}
                        <div
                          className="h-2.5 w-5 rounded-sm"
                          style={{ backgroundColor: t.swatch.accent }}
                          title="Primary Accent"
                        />
                        {/* Secondary accent (if any) */}
                        {t.swatch.secondary && (
                          <div
                            className="h-2.5 w-3 rounded-sm"
                            style={{ backgroundColor: t.swatch.secondary }}
                            title="Secondary Accent"
                          />
                        )}
                        {/* Text dot */}
                        <div
                          className="ml-auto h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: t.swatch.text }}
                          title="Foreground Text"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer hint */}
              <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-2.5 font-mono text-[10px] text-sub">
                <span>Navigate: ↑ ↓ ← →</span>
                <span>ESC to close</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
