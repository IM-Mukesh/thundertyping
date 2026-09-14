"use client";

import { useState } from "react";
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

const MODES: { id: TestMode; label: string }[] = [
  { id: "time", label: "time" },
  { id: "words", label: "words" },
  { id: "quote", label: "quote" },
  { id: "custom", label: "custom" },
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

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg bg-sub-alt/50 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center justify-center gap-4">
        {showTextToggles && (
          <>
            <Pill active={punctuation} onClick={togglePunctuation} label="punctuation" />
            <Pill active={numbers} onClick={toggleNumbers} label="numbers" />
            <span className="h-4 w-px bg-border" aria-hidden="true" />
          </>
        )}
        {MODES.map((m) => (
          <Pill
            key={m.id}
            active={mode === m.id}
            onClick={() => (m.id === "custom" ? onOpenCustomText() : setMode(m.id))}
            label={m.label}
          />
        ))}
      </div>

      {mode === "time" && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {TIME_DURATIONS.map((d) => (
            <Pill key={d} active={timeDuration === d} onClick={() => setTimeDuration(d)} label={String(d)} />
          ))}
          <CustomDurationInput
            value={timeDuration}
            isCustom={!TIME_DURATIONS.includes(timeDuration)}
            onApply={setTimeDuration}
          />
        </div>
      )}

      {mode === "words" && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {WORD_COUNTS.map((w) => (
            <Pill key={w} active={wordCount === w} onClick={() => setWordCount(w)} label={String(w)} />
          ))}
        </div>
      )}

      {mode === "quote" && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {QUOTE_LENGTHS.map((l) => (
            <Pill key={l} active={quoteLength === l} onClick={() => setQuoteLength(l)} label={l} />
          ))}
        </div>
      )}

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
  );
}

function clampDuration(n: number): number {
  return Math.min(MAX_CUSTOM_TIME_DURATION, Math.max(MIN_CUSTOM_TIME_DURATION, Math.round(n)));
}

// A pill-styled numeric input for a custom time duration, sitting alongside
// the preset pills. Shows the active custom value once applied (as a Pill,
// like the presets) instead of leaving a stale number in the input.
function CustomDurationInput({
  value,
  isCustom,
  onApply,
}: {
  value: number;
  isCustom: boolean;
  onApply: (seconds: number) => void;
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const parsed = Number(draft);
    if (draft.trim() !== "" && Number.isFinite(parsed)) onApply(clampDuration(parsed));
    setDraft("");
  };

  if (isCustom && draft === "") {
    return <Pill active onClick={() => setDraft(String(value))} label={`${value}s`} />;
  }

  return (
    <input
      type="number"
      inputMode="numeric"
      min={MIN_CUSTOM_TIME_DURATION}
      max={MAX_CUSTOM_TIME_DURATION}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
          (e.target as HTMLInputElement).blur();
        }
      }}
      placeholder="custom"
      aria-label="Custom time duration in seconds"
      className="w-16 rounded bg-transparent px-1 py-1 text-center text-sub placeholder:text-sub/50 focus:text-foreground focus:outline-none"
    />
  );
}

function Pill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn("rounded px-2 py-1 transition-colors", active ? "text-accent" : "text-sub hover:text-foreground")}
    >
      {label}
    </button>
  );
}
