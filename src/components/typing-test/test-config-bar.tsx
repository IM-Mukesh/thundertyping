"use client";

import { useState, type ReactNode } from "react";
import { AtSign, Hash, Clock, Type, Quote as QuoteIcon, Wrench, Pencil } from "lucide-react";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import {
  TIME_DURATIONS,
  WORD_COUNTS,
  QUOTE_LENGTHS,
  MIN_CUSTOM_TIME_DURATION,
  MAX_CUSTOM_TIME_DURATION,
  type TestMode,
} from "@/lib/typing-engine/engine-types";
import { cn } from "@/lib/utils/cn";

// Text-only for now, per request -- flip back to true to restore the icons.
// The icon is still passed through everywhere below, just not rendered, so
// this is the only line that needs to change to bring them back.
const SHOW_ICONS = false;

const MODES: { id: TestMode; label: string; icon: ReactNode }[] = [
  { id: "time", label: "Time", icon: <Clock size={14} /> },
  { id: "words", label: "Words", icon: <Type size={14} /> },
  { id: "quote", label: "Quote", icon: <QuoteIcon size={14} /> },
  { id: "custom", label: "Custom", icon: <Wrench size={14} /> },
];

interface TestConfigBarProps {
  onOpenCustomText: () => void;
}

export function TestConfigBar({ onOpenCustomText }: TestConfigBarProps) {
  const mode = useSettingsStore((s) => s.mode);
  const timeDuration = useSettingsStore((s) => s.timeDuration);
  const wordCount = useSettingsStore((s) => s.wordCount);
  const quoteLength = useSettingsStore((s) => s.quoteLength);
  const punctuation = useSettingsStore((s) => s.punctuation);
  const numbers = useSettingsStore((s) => s.numbers);
  const setMode = useSettingsStore((s) => s.setMode);
  const setTimeDuration = useSettingsStore((s) => s.setTimeDuration);
  const setWordCount = useSettingsStore((s) => s.setWordCount);
  const setQuoteLength = useSettingsStore((s) => s.setQuoteLength);
  const togglePunctuation = useSettingsStore((s) => s.togglePunctuation);
  const toggleNumbers = useSettingsStore((s) => s.toggleNumbers);

  const showTextToggles = mode === "time" || mode === "words";

  // One row, split left/right, rather than the mode pills stacked above the
  // mode-specific options on a second row -- the two groups are different
  // kinds of choice (what to type vs. how much of it), so left/right reads
  // as two controls rather than a sequence to read top-to-bottom.
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-2 py-2 text-sm sm:justify-between sm:px-4 sm:py-3">
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-4">
        {showTextToggles && (
          <>
            <Pill active={punctuation} onClick={togglePunctuation} ariaLabel="Punctuation" icon={<AtSign size={14} />}>
              punctuation
            </Pill>
            <Pill active={numbers} onClick={toggleNumbers} ariaLabel="Numbers" icon={<Hash size={14} />}>
              numbers
            </Pill>
            <span className="h-4 w-px bg-border" aria-hidden="true" />
          </>
        )}
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

      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-4">
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
            className="text-xs text-sub underline decoration-dotted hover:text-foreground"
          >
            Edit custom text
          </button>
        )}
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
      className="flex min-h-11 min-w-11 items-center justify-center rounded px-2 py-1 text-sub transition-colors hover:text-foreground sm:min-h-0 sm:min-w-0"
    >
      <Pencil size={16} />
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
        "flex min-h-11 items-center justify-center gap-1 rounded px-1.5 py-1 sm:gap-1.5 sm:px-2.5",
        "font-mono text-[11px] lowercase tracking-wide transition-colors",
        "pointer-fine:min-h-9",
        active ? "text-accent" : "text-sub hover:text-foreground",
      )}
    >
      {SHOW_ICONS && icon}
      {children}
    </button>
  );
}
