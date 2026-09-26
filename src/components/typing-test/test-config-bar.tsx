"use client";

import { useState, useRef, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { AtSign, Hash, Clock, Type, Quote as QuoteIcon, Wrench, Pencil, BookOpen } from "lucide-react";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import {
  TIME_DURATIONS,
  WORD_COUNTS,
  QUOTE_LENGTHS,
  MIN_CUSTOM_TIME_DURATION,
  MAX_CUSTOM_TIME_DURATION,
  type TestMode,
} from "@/lib/typing-engine/engine-types";
import { VOCAB_DIFFICULTIES, type VocabDifficulty } from "@/lib/vocabulary/vocabulary-words";
import { cn } from "@/lib/utils/cn";

const VOCAB_DIFFICULTY_LABEL: Record<VocabDifficulty, string> = {
  easy: "easy",
  medium: "medium",
  hard: "hard",
};

// Text-only for now, per request -- flip back to true to restore the icons.
// The icon is still passed through everywhere below, just not rendered, so
// this is the only line that needs to change to bring them back.
const SHOW_ICONS = false;

const MODES: { id: TestMode; label: string; icon: ReactNode }[] = [
  { id: "time", label: "Time", icon: <Clock size={14} /> },
  { id: "words", label: "Words", icon: <Type size={14} /> },
  { id: "quote", label: "Quote", icon: <QuoteIcon size={14} /> },
  { id: "custom", label: "Custom", icon: <Wrench size={14} /> },
  { id: "vocabulary", label: "Vocabulary", icon: <BookOpen size={14} /> },
];

interface TestConfigBarProps {
  onOpenCustomText: () => void;
}

export function TestConfigBar({ onOpenCustomText }: TestConfigBarProps) {
  const mode = useSettingsStore((s) => s.mode);
  const timeDuration = useSettingsStore((s) => s.timeDuration);
  const wordCount = useSettingsStore((s) => s.wordCount);
  const quoteLength = useSettingsStore((s) => s.quoteLength);
  const vocabDifficulty = useSettingsStore((s) => s.vocabDifficulty);
  const punctuation = useSettingsStore((s) => s.punctuation);
  const numbers = useSettingsStore((s) => s.numbers);
  const setMode = useSettingsStore((s) => s.setMode);
  const setTimeDuration = useSettingsStore((s) => s.setTimeDuration);
  const setWordCount = useSettingsStore((s) => s.setWordCount);
  const setQuoteLength = useSettingsStore((s) => s.setQuoteLength);
  const setVocabDifficulty = useSettingsStore((s) => s.setVocabDifficulty);
  const togglePunctuation = useSettingsStore((s) => s.togglePunctuation);
  const toggleNumbers = useSettingsStore((s) => s.toggleNumbers);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, mode]);

  const maskStyle = useMemo(() => {
    if (!canScrollLeft && !canScrollRight) return undefined;
    if (canScrollLeft && canScrollRight) {
      return {
        maskImage: "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
      };
    }
    if (canScrollLeft) {
      return {
        maskImage: "linear-gradient(to right, transparent, black 24px, black 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 24px, black 100%)",
      };
    }
    return {
      maskImage: "linear-gradient(to left, transparent, black 24px, black 100%)",
      WebkitMaskImage: "linear-gradient(to left, transparent, black 24px, black 100%)",
    };
  }, [canScrollLeft, canScrollRight]);

  const showTextToggles = mode === "time" || mode === "words";

  // Divided into 3 distinct parts for larger screens (laptops, monitors, large devices):
  // Part 1: Modifiers (punctuation, numbers)
  // Divider: |
  // Part 2: Modes (time, words, quote, custom, vocabulary)
  // Divider: |
  // Part 3: Options (15s, 30s, 1m, 2m, edit icon / word counts / etc.)
  return (
    <div className="theme-transition w-full max-w-4xl mx-auto rounded-xl bg-sub-alt/40 border border-border/60 px-3 py-1.5 sm:px-4 sm:py-2 shadow-xs backdrop-blur-xs">
      <div
        ref={scrollRef}
        style={maskStyle}
        className="flex items-center justify-between text-sm overflow-x-auto scrollbar-none transition-all duration-150"
      >
        {/* Part 1: Modifiers (punctuation, numbers) */}
        <div className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 shrink-0 min-h-9">
          {showTextToggles ? (
            <>
              <Pill active={punctuation} onClick={togglePunctuation} ariaLabel="Punctuation" icon={<AtSign size={14} />}>
                punctuation
              </Pill>
              <Pill active={numbers} onClick={toggleNumbers} ariaLabel="Numbers" icon={<Hash size={14} />}>
                numbers
              </Pill>
            </>
          ) : (
            <span className="text-xs text-sub/40 font-mono select-none px-2">—</span>
          )}
        </div>

        {/* Divider 1 */}
        <div className="h-4 w-px bg-border/80 shrink-0 mx-2 lg:mx-3 select-none" aria-hidden="true" />

        {/* Part 2: Modes (time, words, quote, custom, vocabulary) */}
        <div className="shrink-0 flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-2.5 min-h-9">
          {MODES.map((m) => (
            <Pill
              key={m.id}
              active={mode === m.id}
              onClick={() => (m.id === "custom" ? onOpenCustomText() : setMode(m.id))}
              ariaLabel={m.label}
              icon={m.icon}
            >
              {m.label.toLowerCase()}
            </Pill>
          ))}
        </div>

        {/* Divider 2 */}
        <div className="h-4 w-px bg-border/80 shrink-0 mx-2 lg:mx-3 select-none" aria-hidden="true" />

        {/* Part 3: Mode Options (15s, 30s, 1m, 2m, edit icon / word counts / quote lengths / etc.) */}
        <div className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 shrink-0 min-h-9">
          {mode === "time" && (
            <>
              {TIME_DURATIONS.map((d) => (
                <Pill
                  key={d}
                  active={timeDuration === d}
                  onClick={() => setTimeDuration(d)}
                  ariaLabel={formatDuration(d)}
                >
                  {formatDuration(d)}
                </Pill>
              ))}
              <CustomDurationInput
                value={timeDuration}
                isCustom={!TIME_DURATIONS.includes(timeDuration)}
                onApply={setTimeDuration}
              />
            </>
          )}

          {mode === "words" &&
            WORD_COUNTS.map((w) => (
              <Pill key={w} active={wordCount === w} onClick={() => setWordCount(w)} ariaLabel={String(w)}>
                {w}
              </Pill>
            ))}

          {mode === "quote" &&
            QUOTE_LENGTHS.map((l) => (
              <Pill key={l} active={quoteLength === l} onClick={() => setQuoteLength(l)} ariaLabel={l}>
                {l}
              </Pill>
            ))}

          {mode === "custom" && (
            <button
              type="button"
              onClick={onOpenCustomText}
              className="text-xs font-mono text-sub hover:text-accent transition-colors underline decoration-dotted"
            >
              edit custom text
            </button>
          )}

          {mode === "vocabulary" && (
            <>
              {VOCAB_DIFFICULTIES.map((d) => (
                <Pill
                  key={d}
                  active={vocabDifficulty === d}
                  onClick={() => setVocabDifficulty(d)}
                  ariaLabel={VOCAB_DIFFICULTY_LABEL[d]}
                >
                  {VOCAB_DIFFICULTY_LABEL[d]}
                </Pill>
              ))}
              <span className="h-4 w-px bg-border/80 shrink-0 mx-1" aria-hidden="true" />
              {WORD_COUNTS.map((w) => (
                <Pill key={w} active={wordCount === w} onClick={() => setWordCount(w)} ariaLabel={String(w)}>
                  {w}
                </Pill>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function clampDuration(n: number): number {
  return Math.min(MAX_CUSTOM_TIME_DURATION, Math.max(MIN_CUSTOM_TIME_DURATION, Math.round(n)));
}

// Durations over a minute render as "1m 13s" / "2h 3m 14s" rather than a raw
// second count — the range now runs up to 24h, where e.g. "72540" would
// otherwise be unreadable. Trailing zero units are dropped ("2m" not
// "2m 0s"), but a zero unit sandwiched between two nonzero ones is kept
// ("1h 0m 5s") so the magnitude of the middle unit stays unambiguous.
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

// A custom time duration, tucked behind a pencil icon so it doesn't sit as a
// permanently-visible bare input among the preset pills. Clicking it (or the
// active-value pill, once a custom duration is set) reveals a real number
// input; Enter/blur commits and clamps, Escape cancels back to the icon.
function CustomDurationInput({
  value,
  isCustom,
  onApply,
}: {
  value: number;
  isCustom: boolean;
  onApply: (seconds: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = () => {
    const parsed = Number(draft);
    if (draft.trim() !== "" && Number.isFinite(parsed)) onApply(clampDuration(parsed));
    setDraft("");
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        type="number"
        inputMode="numeric"
        min={MIN_CUSTOM_TIME_DURATION}
        max={MAX_CUSTOM_TIME_DURATION}
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
            (e.target as HTMLInputElement).blur();
          } else if (e.key === "Escape") {
            e.preventDefault();
            setDraft("");
            setEditing(false);
          }
        }}
        placeholder="sec"
        aria-label="Custom time duration in seconds"
        className="w-20 rounded bg-transparent px-1 py-1 text-center text-sub placeholder:text-sub/50 focus:text-foreground focus:outline-none"
      />
    );
  }

  if (isCustom) {
    return (
      <Pill
        active
        onClick={() => {
          setDraft(String(value));
          setEditing(true);
        }}
        ariaLabel={`Custom duration: ${formatDuration(value)}`}
      >
        {formatDuration(value)}
      </Pill>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      aria-label="Set a custom duration"
      title="Set a custom duration"
      className="flex min-h-8 sm:min-h-9 items-center justify-center rounded px-2 py-1 text-sub transition-colors hover:text-foreground shrink-0"
    >
      <Pencil size={14} />
    </button>
  );
}

function Pill({
  active,
  onClick,
  children,
  ariaLabel,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  ariaLabel: string;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        // Touch-sized by default; compact only for a fine pointer.
        //
        // This used to shrink at `sm:`, which asks about viewport width when
        // the real question is what is doing the pointing. A tablet is wide
        // AND touch, so it got 24px targets -- barely half the 44px minimum,
        // on a device driven entirely by fingers. `pointer-fine` asks the
        // right question and leaves phones and tablets alike at 44px.
        //
        // gap-1 rather than gap-2 because the label sits tight to its icon:
        // the pair has to read as one control, not an icon next to a word.
        "flex min-h-8 sm:min-h-9 items-center justify-center gap-1 rounded px-2 py-1 sm:gap-1.5 sm:px-2.5",
        "font-mono text-[11px] lowercase tracking-wide transition-colors shrink-0",
        "pointer-fine:min-h-9",
        active ? "text-accent font-semibold" : "text-sub hover:text-foreground",
      )}
    >
      {SHOW_ICONS && icon}
      {children}
    </button>
  );
}
