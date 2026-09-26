"use client";

import { useMemo, useState } from "react";
import { HandDiagram } from "@/components/lessons/virtual-keyboard";
import {
  FINGER_LABELS,
  FINGER_VAR,
  KEY_ROWS,
  SPACE_KEY,
  fingerForKey,
  physicalKeyFor,
  type FingerId,
} from "@/lib/lessons/keyboard-layout";
import { cn } from "@/lib/utils/cn";

const LEGEND_ORDER: FingerId[] = [
  "left-pinky",
  "left-ring",
  "left-middle",
  "left-index",
  "thumb",
  "right-index",
  "right-middle",
  "right-ring",
  "right-pinky",
];

/**
 * The reference version of the drill's next-key keyboard: every key is
 * colored by finger *permanently* (not just the active one), and hovering,
 * focusing, or tapping any key -- or clicking a finger in the legend --
 * drives the same hand diagram the lesson drill uses. Two highlight modes
 * share one `effectiveFinger`: a hovered/focused key always wins (single-key
 * feedback); a clicked legend swatch "pins" that finger and highlights every
 * key it owns, until something else takes focus or it's clicked again.
 */
export function FingerMapExplorer() {
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [pinnedFinger, setPinnedFinger] = useState<FingerId | null>(null);

  const hoverFinger = hoverKey ? fingerForKey(hoverKey) : null;
  const effectiveFinger = hoverFinger ?? pinnedFinger;

  const highlightedKeys = useMemo(() => {
    if (hoverKey) return new Set([physicalKeyFor(hoverKey)]);
    if (pinnedFinger) {
      const keys = [...KEY_ROWS.flat(), SPACE_KEY].filter((k) => k.finger === pinnedFinger).map((k) => k.key);
      return new Set(keys);
    }
    return new Set<string | null>();
  }, [hoverKey, pinnedFinger]);

  const label = hoverKey
    ? `${hoverKey === " " ? "Space" : hoverKey.toUpperCase()} — ${FINGER_LABELS[hoverFinger!]}`
    : pinnedFinger
      ? FINGER_LABELS[pinnedFinger]
      : "Hover, tap, or click a finger below to see which keys it owns.";

  return (
    <div className="theme-transition flex w-full max-w-full flex-col items-center gap-4 sm:gap-5 rounded-2xl border border-accent/25 bg-sub-alt/15 p-2.5 sm:p-7 overflow-hidden">
      <HandDiagram activeFinger={effectiveFinger} />

      <div className="flex w-full max-w-full flex-col items-center gap-0.5 sm:gap-1.5 py-1">
        {KEY_ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-0.5 sm:gap-1.5">
            {row.map((k) => (
              <ExplorerKey
                key={k.key}
                keyDef={k}
                active={highlightedKeys.has(k.key)}
                onHover={() => setHoverKey(k.key)}
                onLeave={() => setHoverKey(null)}
              />
            ))}
          </div>
        ))}
        <div className="flex justify-center pt-0.5 sm:pt-1">
          <ExplorerKey
            keyDef={SPACE_KEY}
            active={highlightedKeys.has(" ")}
            onHover={() => setHoverKey(" ")}
            onLeave={() => setHoverKey(null)}
            wide
          />
        </div>
      </div>

      <p className="min-h-5 text-center text-sm font-medium text-foreground" aria-live="polite">
        {label}
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {LEGEND_ORDER.map((finger) => (
          <button
            key={finger}
            type="button"
            onClick={() => setPinnedFinger((current) => (current === finger ? null : finger))}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
              pinnedFinger === finger ? "border-transparent text-background" : "border-border text-sub hover:text-foreground",
            )}
            style={pinnedFinger === finger ? { backgroundColor: FINGER_VAR[finger] } : undefined}
          >
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: FINGER_VAR[finger] }}
            />
            {FINGER_LABELS[finger]}
          </button>
        ))}
      </div>
    </div>
  );
}

function ExplorerKey({
  keyDef,
  active,
  onHover,
  onLeave,
  wide,
}: {
  keyDef: { key: string; finger: FingerId; homeRow?: boolean };
  active: boolean;
  onHover: () => void;
  onLeave: () => void;
  wide?: boolean;
}) {
  const color = FINGER_VAR[keyDef.finger];
  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      onTouchStart={onHover}
      aria-label={`${keyDef.key === " " ? "Space bar" : keyDef.key} — ${FINGER_LABELS[keyDef.finger]}`}
      className={cn(
        "relative flex items-center justify-center rounded border font-mono uppercase transition-all duration-150 sm:rounded-md",
        wide
          ? "h-7 w-28 min-[360px]:w-32 min-[400px]:w-36 sm:h-9 sm:w-40 text-[9px] sm:text-[11px]"
          : "h-7 w-[23px] text-[8px] min-[360px]:w-[25px] min-[360px]:text-[9px] min-[400px]:w-7 sm:h-9 sm:w-9 sm:text-[11px]",
        active ? "scale-110 border-transparent text-background z-10" : "border-border/60 text-sub",
      )}
      style={{
        backgroundColor: active ? color : `color-mix(in srgb, ${color} 22%, transparent)`,
        boxShadow: active ? `0 0 16px -2px ${color}` : undefined,
      }}
    >
      {keyDef.key === " " ? "space" : keyDef.key}
      {keyDef.homeRow && (
        <span
          className="absolute bottom-0.5 sm:bottom-1.5 h-0.5 w-2 sm:w-3 rounded-full"
          style={{ backgroundColor: active ? "var(--background)" : "var(--sub)" }}
        />
      )}
    </button>
  );
}
