"use client";

import {
  FINGER_LABELS,
  FINGER_VAR,
  KEY_ROWS,
  SPACE_KEY,
  fingerForKey,
  physicalKeyFor,
  shiftKeyFor,
  type FingerId,
} from "@/lib/lessons/keyboard-layout";
import { cn } from "@/lib/utils/cn";

interface VirtualKeyboardProps {
  /** The next character the typist needs to press, lowercase or shifted, or `null` before/after drill. */
  nextKey: string | null;
}

export function VirtualKeyboard({ nextKey }: VirtualKeyboardProps) {
  const activePhysicalKey = physicalKeyFor(nextKey);
  const activeFinger = fingerForKey(nextKey);
  const requiredShift = shiftKeyFor(nextKey);
  const shiftFinger: FingerId | null =
    requiredShift === "left-shift"
      ? "left-pinky"
      : requiredShift === "right-shift"
        ? "right-pinky"
        : null;

  let guidanceLabel = "Get ready";
  if (nextKey) {
    if (requiredShift && shiftFinger) {
      const shiftSide = requiredShift === "left-shift" ? "Left" : "Right";
      guidanceLabel = `Hold ${shiftSide} Shift (${FINGER_LABELS[shiftFinger]}) + ${nextKey.toUpperCase()} (${activeFinger ? FINGER_LABELS[activeFinger] : ""})`;
    } else if (activeFinger) {
      const keyName = nextKey === " " ? "Space" : nextKey.toUpperCase();
      guidanceLabel = `${FINGER_LABELS[activeFinger]} — ${keyName}`;
    }
  }

  return (
    <div className="flex w-full max-w-full flex-col items-center gap-3 sm:gap-4 overflow-hidden select-none">
      <HandDiagram activeFinger={activeFinger} shiftFinger={shiftFinger} />

      <div className="flex w-full max-w-full flex-col items-center gap-1 sm:gap-1.5 py-1">
        {KEY_ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-0.5 sm:gap-1.5">
            {/* If bottom row (i === 3), show Left Shift before keys and Right Shift after */}
            {i === 3 && (
              <ShiftKey
                label="Shift"
                active={requiredShift === "left-shift"}
                finger="left-pinky"
                side="left"
              />
            )}
            {row.map((k) => (
              <Key key={k.key} keyDef={k} active={activePhysicalKey === k.key} />
            ))}
            {i === 3 && (
              <ShiftKey
                label="Shift"
                active={requiredShift === "right-shift"}
                finger="right-pinky"
                side="right"
              />
            )}
          </div>
        ))}

        <div className="flex justify-center pt-0.5 sm:pt-1">
          <Key keyDef={SPACE_KEY} active={activePhysicalKey === " "} wide />
        </div>
      </div>

      <div
        className="flex items-center gap-2 rounded-full border border-border/60 bg-sub-alt/40 px-3.5 py-1 text-center font-display text-[11px] font-semibold text-sub transition-colors"
        aria-live="polite"
      >
        {requiredShift && (
          <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
        )}
        <span>{guidanceLabel}</span>
      </div>
    </div>
  );
}

function ShiftKey({
  label,
  active,
  finger,
  side,
}: {
  label: string;
  active: boolean;
  finger: FingerId;
  side: "left" | "right";
}) {
  const color = FINGER_VAR[finger];
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative hidden sm:flex items-center justify-center rounded font-mono text-[9px] uppercase transition-all duration-150 sm:rounded-md border",
        "h-7 w-9 sm:h-8 sm:w-11 font-bold",
        active
          ? "scale-105 border-transparent text-background z-10 arcade-pulse"
          : "border-border/60 text-sub/60 bg-sub-alt/20",
      )}
      style={{
        backgroundColor: active ? color : undefined,
        boxShadow: active ? `0 0 16px -2px ${color}` : undefined,
      }}
      title={`${side === "left" ? "Left" : "Right"} Shift`}
    >
      {label}
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
        "relative flex items-center justify-center rounded font-mono uppercase transition-all duration-150 sm:rounded-md border",
        wide
          ? "h-7 w-32 text-[10px] min-[380px]:w-36 sm:h-8 sm:w-40 sm:text-[11px]"
          : "h-7 w-[23px] text-[9px] min-[360px]:w-[25px] min-[400px]:w-7 sm:h-8 sm:w-8 sm:text-[11px]",
        active ? "scale-110 border-transparent text-background z-10" : "border-border/60 text-sub",
      )}
      style={{
        backgroundColor: active ? color : `color-mix(in srgb, ${color} 16%, transparent)`,
        boxShadow: active ? `0 0 16px -2px ${color}` : undefined,
      }}
    >
      {keyDef.key === " " ? "space" : keyDef.key}
      {keyDef.homeRow && (
        <span
          className="absolute bottom-0.5 h-0.5 w-2 rounded-full sm:bottom-1 sm:w-3"
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

export function HandDiagram({
  activeFinger,
  shiftFinger,
}: {
  activeFinger: FingerId | null;
  shiftFinger?: FingerId | null;
}) {
  return (
    <div className="flex items-end gap-6 sm:gap-10">
      <Hand side="left" activeFinger={activeFinger} shiftFinger={shiftFinger} />
      <Hand side="right" activeFinger={activeFinger} shiftFinger={shiftFinger} />
    </div>
  );
}

function Hand({
  side,
  activeFinger,
  shiftFinger,
}: {
  side: HandSide;
  activeFinger: FingerId | null;
  shiftFinger?: FingerId | null;
}) {
  const fingers = HAND_FINGER_LAYOUT[side];
  const thumbX = side === "left" ? 82 : 4;
  const thumbActive = activeFinger === "thumb";
  const thumbColor = FINGER_VAR.thumb;

  return (
    <svg viewBox="0 0 96 118" className="h-20 w-16 sm:h-24 sm:w-20 transition-transform">
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
        const isTarget = finger === activeFinger;
        const isShift = finger === shiftFinger;
        const active = isTarget || isShift;
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
