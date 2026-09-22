"use client";

import {
  FINGER_LABELS,
  KEY_ROWS,
  SPACE_KEY,
  fingerForKey,
  type FingerId,
} from "@/lib/lessons/keyboard-layout";
import { cn } from "@/lib/utils/cn";

// The lesson drill's next-key guide: a QWERTY grid tinted by finger, plus a
// two-hand diagram that lights up the same finger the active key belongs to.
// Both read off one `nextKey` prop and one FINGER_VAR color map, so the grid
// and the hands can never disagree about which finger is responsible for a
// key -- see keyboard-layout.ts for the shared finger assignments.
//
// The hands are abstract geometric shapes (palm + four finger bars + a
// rotated thumb), not illustrated artwork, deliberately -- see the comment on
// game-cover-art.tsx for why: every color here derives from a CSS variable,
// so it re-themes for free and costs nothing to load, where baked art can
// only ever match one theme.

const FINGER_VAR: Record<FingerId, string> = {
  "left-pinky": "var(--finger-left-pinky)",
  "left-ring": "var(--finger-left-ring)",
  "left-middle": "var(--finger-left-middle)",
  "left-index": "var(--finger-left-index)",
  "right-index": "var(--finger-right-index)",
  "right-middle": "var(--finger-right-middle)",
  "right-ring": "var(--finger-right-ring)",
  "right-pinky": "var(--finger-right-pinky)",
  thumb: "var(--finger-thumb)",
};

interface VirtualKeyboardProps {
  /** The next character the typist needs to press, lowercase, or `null` before the drill starts / after it finishes. */
  nextKey: string | null;
}

export function VirtualKeyboard({ nextKey }: VirtualKeyboardProps) {
  const normalizedKey = nextKey?.toLowerCase() ?? null;
  const activeFinger = fingerForKey(normalizedKey);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <HandDiagram activeFinger={activeFinger} />

      <div className="flex flex-col gap-1.5">
        {KEY_ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-1.5">
            {row.map((k) => (
              <Key key={k.key} keyDef={k} active={normalizedKey === k.key} />
            ))}
          </div>
        ))}
        <div className="flex justify-center pt-1">
          <Key keyDef={SPACE_KEY} active={normalizedKey === " "} wide />
        </div>
      </div>

      <p className="text-center text-xs text-sub" aria-live="polite">
        {activeFinger ? FINGER_LABELS[activeFinger] : "Get ready"}
      </p>
    </div>
  );
}

function Key({
  keyDef,
  active,
  wide,
}: {
  keyDef: { key: string; finger: FingerId; homeRow?: boolean };
  active: boolean;
  wide?: boolean;
}) {
  const color = FINGER_VAR[keyDef.finger];
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex items-center justify-center rounded-md border font-mono text-[11px] uppercase transition-all duration-150",
        wide ? "h-8 w-40" : "h-8 w-8",
        active ? "scale-110 border-transparent text-background" : "border-border/60 text-sub",
      )}
      style={{
        backgroundColor: active ? color : `color-mix(in srgb, ${color} 16%, transparent)`,
        boxShadow: active ? `0 0 16px -2px ${color}` : undefined,
      }}
    >
      {keyDef.key === " " ? "space" : keyDef.key}
      {keyDef.homeRow && (
        <span
          className="absolute bottom-1 h-0.5 w-3 rounded-full"
          style={{ backgroundColor: active ? "var(--background)" : "var(--sub)" }}
        />
      )}
    </div>
  );
}

type HandSide = "left" | "right";

const HAND_FINGER_LAYOUT: Record<HandSide, { finger: FingerId; x: number; height: number }[]> = {
  left: [
    { finger: "left-pinky", x: 8, height: 34 },
    { finger: "left-ring", x: 30, height: 48 },
    { finger: "left-middle", x: 52, height: 56 },
    { finger: "left-index", x: 74, height: 48 },
  ],
  right: [
    { finger: "right-index", x: 8, height: 48 },
    { finger: "right-middle", x: 30, height: 56 },
    { finger: "right-ring", x: 52, height: 48 },
    { finger: "right-pinky", x: 74, height: 34 },
  ],
};

function HandDiagram({ activeFinger }: { activeFinger: FingerId | null }) {
  return (
    <div className="flex items-end gap-10">
      <Hand side="left" activeFinger={activeFinger} />
      <Hand side="right" activeFinger={activeFinger} />
    </div>
  );
}

function Hand({ side, activeFinger }: { side: HandSide; activeFinger: FingerId | null }) {
  const fingers = HAND_FINGER_LAYOUT[side];
  // The thumb sits on the inner edge of each hand (near the keyboard's
  // center gap), angled toward the spacebar.
  const thumbX = side === "left" ? 82 : 4;
  const thumbActive = activeFinger === "thumb";
  const thumbColor = FINGER_VAR.thumb;

  return (
    <svg viewBox="0 0 96 118" className="h-24 w-20 sm:h-28 sm:w-24">
      <rect
        x="2"
        y="72"
        width="92"
        height="40"
        rx="20"
        fill="color-mix(in srgb, var(--foreground) 8%, transparent)"
        stroke="var(--border)"
      />
      <rect
        x={thumbX}
        y="86"
        width="18"
        height="24"
        rx="9"
        transform={`rotate(${side === "left" ? 35 : -35} ${thumbX + 9} 98)`}
        fill={thumbActive ? thumbColor : `color-mix(in srgb, ${thumbColor} 30%, transparent)`}
        style={thumbActive ? { filter: `drop-shadow(0 0 6px ${thumbColor})` } : undefined}
        className={thumbActive ? "arcade-pulse" : undefined}
      />
      {fingers.map(({ finger, x, height }) => {
        const active = finger === activeFinger;
        const color = FINGER_VAR[finger];
        return (
          <rect
            key={finger}
            x={x}
            y={82 - height}
            width="14"
            height={height + 10}
            rx="7"
            fill={active ? color : `color-mix(in srgb, ${color} 35%, transparent)`}
            style={active ? { filter: `drop-shadow(0 0 8px ${color})` } : undefined}
            className={active ? "arcade-pulse" : undefined}
          />
        );
      })}
    </svg>
  );
}
