"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AtSign,
  BookOpen,
  Clock,
  Hash,
  Pencil,
  Quote as QuoteIcon,
  SlidersHorizontal,
  Type,
  Volume2,
  VolumeX,
  Wrench,
  X,
} from "lucide-react";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import {
  TIME_DURATIONS,
  WORD_COUNTS,
  QUOTE_LENGTHS,
  MIN_CUSTOM_TIME_DURATION,
  MAX_CUSTOM_TIME_DURATION,
  type TestMode,
} from "@/lib/typing-engine/engine-types";
import {
  VOCAB_DIFFICULTIES,
  type VocabDifficulty,
} from "@/lib/vocabulary/vocabulary-words";
import { cn } from "@/lib/utils/cn";

const VOCAB_DIFFICULTY_LABEL: Record<VocabDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const MODES: { id: TestMode; label: string; icon: typeof Clock }[] = [
  { id: "time", label: "Time", icon: Clock },
  { id: "words", label: "Words", icon: Type },
  { id: "quote", label: "Quote", icon: QuoteIcon },
  { id: "custom", label: "Custom", icon: Wrench },
  { id: "vocabulary", label: "Vocabulary", icon: BookOpen },
];

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    if (s > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${h}h ${m}m`;
    return `${h}h`;
  }
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  return `${s}s`;
}

interface MobileTestSettingsModalProps {
  open: boolean;
  onClose: () => void;
  onOpenCustomText: () => void;
}

export function MobileTestSettingsModal({
  open,
  onClose,
  onOpenCustomText,
}: MobileTestSettingsModalProps) {
  const mode = useSettingsStore((s) => s.mode);
  const timeDuration = useSettingsStore((s) => s.timeDuration);
  const wordCount = useSettingsStore((s) => s.wordCount);
  const quoteLength = useSettingsStore((s) => s.quoteLength);
  const vocabDifficulty = useSettingsStore((s) => s.vocabDifficulty);
  const punctuation = useSettingsStore((s) => s.punctuation);
  const numbers = useSettingsStore((s) => s.numbers);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);

  const setMode = useSettingsStore((s) => s.setMode);
  const setTimeDuration = useSettingsStore((s) => s.setTimeDuration);
  const setWordCount = useSettingsStore((s) => s.setWordCount);
  const setQuoteLength = useSettingsStore((s) => s.setQuoteLength);
  const setVocabDifficulty = useSettingsStore((s) => s.setVocabDifficulty);
  const togglePunctuation = useSettingsStore((s) => s.togglePunctuation);
  const toggleNumbers = useSettingsStore((s) => s.toggleNumbers);

  const [customEditing, setCustomEditing] = useState(false);
  const [customDraft, setCustomDraft] = useState("");

  const showTextToggles = mode === "time" || mode === "words";

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const commitCustomDuration = () => {
    const parsed = Number(customDraft);
    if (customDraft.trim() !== "" && Number.isFinite(parsed)) {
      const clamped = Math.min(
        MAX_CUSTOM_TIME_DURATION,
        Math.max(MIN_CUSTOM_TIME_DURATION, Math.round(parsed)),
      );
      setTimeDuration(clamped);
    }
    setCustomDraft("");
    setCustomEditing(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Test Settings"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative z-10 flex max-h-[85vh] w-full max-w-sm flex-col rounded-2xl border border-border bg-background p-5 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3.5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={17} className="text-accent" />
                <span className="font-display text-sm font-extrabold uppercase tracking-wide text-foreground">
                  Test Settings
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close settings"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-sub transition-colors hover:bg-sub-alt hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Settings Body */}
            <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-4 no-scrollbar">
              {/* Mode Selection */}
              <div>
                <span className="font-display text-[10px] font-bold uppercase tracking-widest text-sub">
                  Mode
                </span>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {MODES.map((m) => {
                    const active = mode === m.id;
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          if (m.id === "custom") {
                            onClose();
                            onOpenCustomText();
                          } else {
                            setMode(m.id);
                          }
                        }}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-3 py-2.5 font-display text-xs font-semibold uppercase tracking-wider transition-colors",
                          active
                            ? "border-accent bg-accent/15 text-accent"
                            : "border-border/70 bg-sub-alt/30 text-sub hover:border-border hover:text-foreground",
                        )}
                      >
                        <Icon size={14} className={active ? "text-accent" : "text-sub"} />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mode Specific Options */}
              {mode === "time" && (
                <div>
                  <span className="font-display text-[10px] font-bold uppercase tracking-widest text-sub">
                    Duration
                  </span>
                  <div className="mt-2 grid grid-cols-4 gap-1.5">
                    {TIME_DURATIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setTimeDuration(d)}
                        className={cn(
                          "rounded-lg border py-2 font-mono text-xs font-medium transition-colors",
                          timeDuration === d
                            ? "border-accent bg-accent/15 text-accent font-bold"
                            : "border-border/70 bg-sub-alt/30 text-sub hover:border-border hover:text-foreground",
                        )}
                      >
                        {formatDuration(d)}
                      </button>
                    ))}
                  </div>

                  {/* Custom duration row */}
                  <div className="mt-2 flex items-center gap-2">
                    {customEditing ? (
                      <div className="flex w-full items-center gap-2">
                        <input
                          type="number"
                          inputMode="numeric"
                          min={MIN_CUSTOM_TIME_DURATION}
                          max={MAX_CUSTOM_TIME_DURATION}
                          value={customDraft}
                          autoFocus
                          onChange={(e) => setCustomDraft(e.target.value)}
                          onBlur={commitCustomDuration}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              commitCustomDuration();
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              setCustomEditing(false);
                            }
                          }}
                          placeholder="Seconds"
                          aria-label="Custom duration in seconds"
                          className="flex-1 rounded-lg border border-accent bg-sub-alt/40 px-3 py-1.5 font-mono text-xs text-foreground outline-none"
                        />
                        <button
                          type="button"
                          onClick={commitCustomDuration}
                          className="rounded-lg bg-accent px-3 py-1.5 font-display text-xs font-bold text-accent-foreground"
                        >
                          Set
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomDraft(String(timeDuration));
                          setCustomEditing(true);
                        }}
                        className={cn(
                          "flex w-full items-center justify-center gap-1.5 rounded-lg border py-1.5 font-mono text-xs transition-colors",
                          !TIME_DURATIONS.includes(timeDuration)
                            ? "border-accent bg-accent/15 text-accent font-bold"
                            : "border-border/70 bg-sub-alt/30 text-sub hover:border-border hover:text-foreground",
                        )}
                      >
                        <Pencil size={12} />
                        <span>
                          {!TIME_DURATIONS.includes(timeDuration)
                            ? `Custom: ${formatDuration(timeDuration)}`
                            : "Custom duration"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {mode === "words" && (
                <div>
                  <span className="font-display text-[10px] font-bold uppercase tracking-widest text-sub">
                    Word Count
                  </span>
                  <div className="mt-2 grid grid-cols-4 gap-1.5">
                    {WORD_COUNTS.map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setWordCount(w)}
                        className={cn(
                          "rounded-lg border py-2 font-mono text-xs font-medium transition-colors",
                          wordCount === w
                            ? "border-accent bg-accent/15 text-accent font-bold"
                            : "border-border/70 bg-sub-alt/30 text-sub hover:border-border hover:text-foreground",
                        )}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode === "quote" && (
                <div>
                  <span className="font-display text-[10px] font-bold uppercase tracking-widest text-sub">
                    Quote Length
                  </span>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {QUOTE_LENGTHS.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setQuoteLength(l)}
                        className={cn(
                          "rounded-lg border py-2 font-mono text-xs font-medium uppercase transition-colors",
                          quoteLength === l
                            ? "border-accent bg-accent/15 text-accent font-bold"
                            : "border-border/70 bg-sub-alt/30 text-sub hover:border-border hover:text-foreground",
                        )}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode === "vocabulary" && (
                <div>
                  <span className="font-display text-[10px] font-bold uppercase tracking-widest text-sub">
                    Vocabulary Difficulty
                  </span>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {VOCAB_DIFFICULTIES.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setVocabDifficulty(d)}
                        className={cn(
                          "rounded-lg border py-2 font-mono text-xs font-medium transition-colors",
                          vocabDifficulty === d
                            ? "border-accent bg-accent/15 text-accent font-bold"
                            : "border-border/70 bg-sub-alt/30 text-sub hover:border-border hover:text-foreground",
                        )}
                      >
                        {VOCAB_DIFFICULTY_LABEL[d]}
                      </button>
                    ))}
                  </div>

                  <span className="mt-3 block font-display text-[10px] font-bold uppercase tracking-widest text-sub">
                    Word Count
                  </span>
                  <div className="mt-2 grid grid-cols-4 gap-1.5">
                    {WORD_COUNTS.map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setWordCount(w)}
                        className={cn(
                          "rounded-lg border py-2 font-mono text-xs font-medium transition-colors",
                          wordCount === w
                            ? "border-accent bg-accent/15 text-accent font-bold"
                            : "border-border/70 bg-sub-alt/30 text-sub hover:border-border hover:text-foreground",
                        )}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode === "custom" && (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCustomText();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent bg-accent/15 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-accent transition-colors hover:bg-accent/25"
                  >
                    <Pencil size={14} />
                    <span>Edit Custom Text</span>
                  </button>
                </div>
              )}

              {/* Text Modifiers (Punctuation & Numbers) */}
              {showTextToggles && (
                <div>
                  <span className="font-display text-[10px] font-bold uppercase tracking-widest text-sub">
                    Text Modifiers
                  </span>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={togglePunctuation}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border py-2.5 font-mono text-xs transition-colors",
                        punctuation
                          ? "border-accent bg-accent/15 text-accent font-bold"
                          : "border-border/70 bg-sub-alt/30 text-sub hover:border-border hover:text-foreground",
                      )}
                    >
                      <AtSign size={14} />
                      <span>Punctuation</span>
                    </button>
                    <button
                      type="button"
                      onClick={toggleNumbers}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border py-2.5 font-mono text-xs transition-colors",
                        numbers
                          ? "border-accent bg-accent/15 text-accent font-bold"
                          : "border-border/70 bg-sub-alt/30 text-sub hover:border-border hover:text-foreground",
                      )}
                    >
                      <Hash size={14} />
                      <span>Numbers</span>
                    </button>
                  </div>
                </div>
              )}
              {/* Audio Feedback */}
              <div>
                <span className="font-display text-[10px] font-bold uppercase tracking-widest text-sub">
                  Audio Feedback
                </span>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={toggleSound}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 font-mono text-xs transition-colors",
                      soundEnabled
                        ? "border-accent bg-accent/15 text-accent font-bold"
                        : "border-border/70 bg-sub-alt/30 text-sub hover:border-border hover:text-foreground",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                      <span>Typing Sounds</span>
                    </span>
                    <span className="font-sans text-[11px]">{soundEnabled ? "Enabled" : "Muted"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border pt-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-accent py-2.5 font-display text-xs font-bold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
