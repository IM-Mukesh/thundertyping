"use client";

import { useId, useMemo, useState } from "react";
import {
  calculateFromTest,
  cpmToKph,
  cpmToWpm,
  kphToCpm,
  kphToWpm,
  round,
  wpmToCpm,
  wpmToKph,
} from "@/lib/tools/typing-calculator";
import { cn } from "@/lib/utils/cn";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent";
const labelClass = "font-mono text-[10px] uppercase tracking-wider text-sub";

function StatTile({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-sub-alt/20 px-4 py-4 text-center">
      <span className="font-display text-2xl font-black text-accent sm:text-3xl">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-sub">{unit}</span>}
      </span>
      <span className={labelClass}>{label}</span>
    </div>
  );
}

/**
 * The test-based calculator. Three raw inputs (time, characters, errors) --
 * the same three numbers a typing test itself measures -- drive every
 * derived figure live, so the relationship between them is visible rather
 * than five separate boxes that happen to agree.
 */
function FromTestCalculator() {
  const [minutes, setMinutes] = useState("1");
  const [seconds, setSeconds] = useState("0");
  const [charactersTyped, setCharactersTyped] = useState("250");
  const [errors, setErrors] = useState("5");
  const minutesId = useId();
  const secondsId = useId();
  const charsId = useId();
  const errorsId = useId();

  const result = useMemo(() => {
    const totalSeconds = (Number(minutes) || 0) * 60 + (Number(seconds) || 0);
    return calculateFromTest({
      charactersTyped: Number(charactersTyped) || 0,
      errors: Number(errors) || 0,
      seconds: totalSeconds,
    });
  }, [minutes, seconds, charactersTyped, errors]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={minutesId} className={labelClass}>
            Minutes
          </label>
          <input
            id={minutesId}
            type="number"
            inputMode="numeric"
            min={0}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={secondsId} className={labelClass}>
            Seconds
          </label>
          <input
            id={secondsId}
            type="number"
            inputMode="numeric"
            min={0}
            max={59}
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={charsId} className={labelClass}>
            Characters typed
          </label>
          <input
            id={charsId}
            type="number"
            inputMode="numeric"
            min={0}
            value={charactersTyped}
            onChange={(e) => setCharactersTyped(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={errorsId} className={labelClass}>
            Errors
          </label>
          <input
            id={errorsId}
            type="number"
            inputMode="numeric"
            min={0}
            value={errors}
            onChange={(e) => setErrors(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {result ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatTile label="Net WPM" value={round(result.netWpm).toLocaleString()} />
          <StatTile label="Gross WPM" value={round(result.grossWpm).toLocaleString()} />
          <StatTile label="CPM" value={round(result.cpm).toLocaleString()} />
          <StatTile label="KPH" value={round(result.kph).toLocaleString()} />
          <StatTile label="Accuracy" value={round(result.accuracy, 1).toString()} unit="%" />
        </div>
      ) : (
        <p className="text-sm text-sub">Enter a duration greater than zero to see your results.</p>
      )}
    </div>
  );
}

type ConvertField = "wpm" | "cpm" | "kph";

/**
 * The three units are a fixed linear chain (WPM -> CPM -> KPH), so editing
 * any one recomputes the other two immediately -- there's no "convert"
 * button because there's nothing to submit, just three views of one number.
 * Only the two *un-focused* fields are overwritten on each keystroke, so the
 * field actually being typed into never fights the caret.
 */
function QuickConvert() {
  const [wpm, setWpm] = useState("50");
  const [cpm, setCpm] = useState(String(wpmToCpm(50)));
  const [kph, setKph] = useState(String(wpmToKph(50)));
  const wpmId = useId();
  const cpmId = useId();
  const kphId = useId();

  function handleChange(field: ConvertField, raw: string) {
    if (field === "wpm") {
      setWpm(raw);
      const n = Number(raw);
      if (raw !== "" && !Number.isNaN(n)) {
        setCpm(String(round(wpmToCpm(n), 1)));
        setKph(String(round(wpmToKph(n), 0)));
      }
    } else if (field === "cpm") {
      setCpm(raw);
      const n = Number(raw);
      if (raw !== "" && !Number.isNaN(n)) {
        setWpm(String(round(cpmToWpm(n), 1)));
        setKph(String(round(cpmToKph(n), 0)));
      }
    } else {
      setKph(raw);
      const n = Number(raw);
      if (raw !== "" && !Number.isNaN(n)) {
        setWpm(String(round(kphToWpm(n), 1)));
        setCpm(String(round(kphToCpm(n), 1)));
      }
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={wpmId} className={labelClass}>
          WPM
        </label>
        <input
          id={wpmId}
          type="number"
          inputMode="decimal"
          value={wpm}
          onChange={(e) => handleChange("wpm", e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={cpmId} className={labelClass}>
          CPM
        </label>
        <input
          id={cpmId}
          type="number"
          inputMode="decimal"
          value={cpm}
          onChange={(e) => handleChange("cpm", e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={kphId} className={labelClass}>
          KPH
        </label>
        <input
          id={kphId}
          type="number"
          inputMode="decimal"
          value={kph}
          onChange={(e) => handleChange("kph", e.target.value)}
          className={inputClass}
        />
      </div>
    </div>
  );
}

const TABS = [
  { id: "test" as const, label: "Calculate from a test" },
  { id: "convert" as const, label: "Quick convert" },
];

export function TypingCalculator() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("test");

  return (
    <div className="rounded-2xl border border-accent/25 bg-sub-alt/15 p-5 sm:p-7">
      <div className="mb-5 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
              tab === t.id
                ? "bg-accent text-background"
                : "border border-border text-sub hover:border-accent hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "test" ? <FromTestCalculator /> : <QuickConvert />}
    </div>
  );
}
