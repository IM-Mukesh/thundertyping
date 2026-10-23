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
  /** Next target from the real lesson engine. */
  nextKey: string | null;
  /** Changes on each attempted keystroke so the active finger can give brief feedback. */
  keyPressToken?: number;
}

type KeyDef = (typeof KEY_ROWS)[number][number];

interface KeyVisual {
  id: string;
  key: string;
  label: string;
  finger: FingerId | null;
  x: number;
  y: number;
  w: number;
  h: number;
  homeRow?: boolean;
  kind?: "shift-left" | "shift-right" | "space";
}

const NUMBER_CENTERS = [198, 260, 322, 384, 446, 508, 570, 632, 694, 756];
const TOP_CENTERS = [186, 251, 316, 381, 446, 511, 576, 641, 706, 771];
const HOME_CENTERS = [210, 275, 340, 405, 470, 535, 600, 665, 730, 795];
const BOTTOM_CENTERS = [235, 296, 357, 418, 479, 540, 601, 662, 723, 784];

function letterLabel(key: string) {
  return key.length === 1 && key >= "a" && key <= "z" ? key.toUpperCase() : key;
}

function rowVisuals(
  keys: KeyDef[],
  centers: number[],
  y: number,
  width: number,
  height: number,
): KeyVisual[] {
  return keys.map((key, index) => ({
    id: key.key,
    key: key.key,
    label: letterLabel(key.key),
    finger: key.finger,
    homeRow: key.homeRow,
    x: centers[index] - width / 2,
    y,
    w: width,
    h: height,
  }));
}

/*
 * One shared coordinate system is intentional: keyboard keycaps, finger tips,
 * palms and the expected-key highlight scale together. That prevents the hands
 * drifting away from the keys as the lesson changes size.
 */
const VISUAL_KEYS: KeyVisual[] = [
  { id: "grave", key: String.fromCharCode(96), label: "~", finger: "left-pinky", x: 108, y: 20, w: 44, h: 32 },
  ...rowVisuals(KEY_ROWS[0], NUMBER_CENTERS, 20, 46, 32),
  { id: "minus", key: "-", label: "-", finger: "right-pinky", x: 790, y: 20, w: 40, h: 32 },
  { id: "equals", key: "=", label: "=", finger: "right-pinky", x: 832, y: 20, w: 40, h: 32 },
  { id: "backspace", key: "backspace", label: "Backspace", finger: "right-pinky", x: 877, y: 20, w: 76, h: 32 },

  { id: "tab", key: "tab", label: "Tab", finger: "left-pinky", x: 54, y: 58, w: 80, h: 32 },
  ...rowVisuals(KEY_ROWS[1], TOP_CENTERS, 58, 46, 32),
  { id: "bracket-open", key: "[", label: "[", finger: "right-pinky", x: 805, y: 58, w: 40, h: 32 },
  { id: "bracket-close", key: "]", label: "]", finger: "right-pinky", x: 849, y: 58, w: 40, h: 32 },
  { id: "backslash", key: String.fromCharCode(92), label: String.fromCharCode(92), finger: "right-pinky", x: 893, y: 58, w: 40, h: 32 },

  { id: "caps-lock", key: "caps-lock", label: "Caps", finger: "left-pinky", x: 48, y: 96, w: 108, h: 32 },
  ...rowVisuals(KEY_ROWS[2], HOME_CENTERS, 96, 46, 32),
  { id: "enter", key: "enter", label: "Enter", finger: "right-pinky", x: 844, y: 96, w: 104, h: 32 },

  { id: "shift-left", key: "left-shift", label: "Shift", finger: "left-pinky", x: 46, y: 134, w: 126, h: 32, kind: "shift-left" },
  ...rowVisuals(KEY_ROWS[3], BOTTOM_CENTERS, 134, 45, 32),
  { id: "shift-right", key: "right-shift", label: "Shift", finger: "right-pinky", x: 828, y: 134, w: 126, h: 32, kind: "shift-right" },

  { id: "space", key: SPACE_KEY.key, label: "Space", finger: "thumb", x: 374, y: 174, w: 252, h: 32, kind: "space" },
];

const HOME_FINGER_BASES: { finger: FingerId; x: number; side: "left" | "right" }[] = [
  { finger: "left-pinky", x: 210, side: "left" },
  { finger: "left-ring", x: 275, side: "left" },
  { finger: "left-middle", x: 340, side: "left" },
  { finger: "left-index", x: 405, side: "left" },
  { finger: "right-index", x: 405, side: "right" },
  { finger: "right-middle", x: 340, side: "right" },
  { finger: "right-ring", x: 275, side: "right" },
  { finger: "right-pinky", x: 210, side: "right" },
];

function fingerPath(tipX: number, tipY: number, baseX: number, baseY: number, width: number) {
  const half = width / 2;
  return [
    "M", baseX - 18, baseY,
    "C", baseX - 25, baseY - 34, tipX - half - 5, tipY + 55, tipX - half, tipY + 15,
    "Q", tipX, tipY - 6, tipX + half, tipY + 15,
    "C", tipX + half + 5, tipY + 55, baseX + 25, baseY - 34, baseX + 18, baseY,
    "Z",
  ].join(" ");
}

function palmPath() {
  return [
    "M 184 360",
    "C 188 331 193 305 205 282",
    "C 214 264 229 252 247 250",
    "C 269 247 289 256 310 262",
    "C 329 267 350 265 369 263",
    "C 392 260 414 271 430 290",
    "C 444 307 452 333 458 360",
    "Z",
  ].join(" ");
}

function thumbPath(tipX: number, baseX: number) {
  return [
    "M", baseX - 12, 309,
    "C", baseX - 3, 291, tipX - 42, 268, tipX - 18, 249,
    "C", tipX - 8, 241, tipX + 7, 246, tipX + 12, 257,
    "C", tipX + 18, 275, baseX + 18, 303, baseX + 10, 317,
    "Z",
  ].join(" ");
}

function activeKeyFor(keys: KeyVisual[], key: string | null) {
  return key ? keys.find((item) => item.key === key) ?? null : null;
}

export function VirtualKeyboard({ nextKey, keyPressToken = 0 }: VirtualKeyboardProps) {
  const activePhysicalKey = physicalKeyFor(nextKey);
  const activeKey = activeKeyFor(VISUAL_KEYS, activePhysicalKey);
  const mappedFinger = fingerForKey(nextKey);
  const activeFinger = mappedFinger ?? activeKey?.finger ?? null;
  const requiredShift = shiftKeyFor(nextKey);
  const shiftFinger: FingerId | null =
    requiredShift === "left-shift"
      ? "left-pinky"
      : requiredShift === "right-shift"
        ? "right-pinky"
        : null;

  let guidanceLabel = "Rest your fingers lightly on the home row";
  if (nextKey) {
    if (requiredShift && shiftFinger) {
      const shiftSide = requiredShift === "left-shift" ? "Left" : "Right";
      guidanceLabel =
        "Hold " +
        shiftSide +
        " Shift (" +
        FINGER_LABELS[shiftFinger] +
        ") + " +
        nextKey.toUpperCase() +
        (activeFinger ? " (" + FINGER_LABELS[activeFinger] + ")" : "");
    } else if (activeFinger) {
      const keyName = nextKey === " " ? "Space" : nextKey.toUpperCase();
      guidanceLabel = FINGER_LABELS[activeFinger] + " · Press " + keyName;
    }
  }

  const targetPoints: Partial<Record<FingerId, { x: number; y: number }>> = {};
  if (activeFinger && activeKey) {
    targetPoints[activeFinger] = {
      x: activeKey.x + activeKey.w / 2,
      y: activeKey.y + activeKey.h / 2,
    };
  }
  if (shiftFinger && requiredShift) {
    const shiftKind = requiredShift === "left-shift" ? "shift-left" : "shift-right";
    const shiftVisual = VISUAL_KEYS.find((item) => item.kind === shiftKind);
    if (shiftVisual) {
      targetPoints[shiftFinger] = {
        x: shiftVisual.x + shiftVisual.w / 2,
        y: shiftVisual.y + shiftVisual.h / 2,
      };
    }
  }

  const isVisualKeyActive = (key: KeyVisual) =>
    key.key === activePhysicalKey ||
    (key.kind === "shift-left" && requiredShift === "left-shift") ||
    (key.kind === "shift-right" && requiredShift === "right-shift");

  return (
    <section className="mx-auto flex w-full min-w-0 flex-col items-center gap-1.5 select-none" aria-label="Touch typing finger guide">
      <div
        className="mx-auto hidden w-full max-w-[980px] min-[560px]:block"
        style={{ width: "min(100%, calc(min(44dvh, 315px) * 2.777778))" }}
      >
        <svg
          viewBox="0 0 1000 360"
          className="block h-auto w-full overflow-visible"
          role="img"
          aria-label="Virtual QWERTY keyboard with translucent hands. The expected key and its assigned finger are highlighted."
        >
          <defs>
            <linearGradient id="hero-hand-surface" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0.045" />
            </linearGradient>
          </defs>

          <rect
            x="38"
            y="7"
            width="924"
            height="226"
            rx="20"
            fill="var(--sub-alt)"
            stroke="var(--border)"
            strokeWidth="1.5"
          />

          {VISUAL_KEYS.map((key) => {
            const color = key.finger ? FINGER_VAR[key.finger] : "var(--border)";
            return (
              <rect
                key={key.id}
                x={key.x}
                y={key.y}
                width={key.w}
                height={key.h}
                rx={key.w > 75 ? 7 : 6}
                fill={"color-mix(in srgb, " + color + " 11%, var(--sub-alt))"}
                stroke={"color-mix(in srgb, " + color + " 38%, var(--border))"}
                strokeWidth="1.15"
              />
            );
          })}

          {VISUAL_KEYS.filter(isVisualKeyActive).map((key) => (
            <rect
              key={"active-" + key.id}
              x={key.x}
              y={key.y}
              width={key.w}
              height={key.h}
              rx={key.w > 75 ? 7 : 6}
              fill="var(--accent)"
              fillOpacity="0.94"
              stroke="var(--accent)"
              strokeWidth="2"
              style={{ filter: "drop-shadow(0 0 5px var(--accent))" }}
            />
          ))}

          <g aria-hidden="true">
            <path d={palmPath()} fill="url(#hero-hand-surface)" stroke="var(--foreground)" strokeOpacity="0.24" strokeWidth="1.5" />
            <path d={palmPath()} transform="translate(1000 0) scale(-1 1)" fill="url(#hero-hand-surface)" stroke="var(--foreground)" strokeOpacity="0.24" strokeWidth="1.5" />
            <path d="M 192 345 Q 320 329 446 347 L 452 360 L 184 360 Z" fill="var(--sub-alt)" fillOpacity="0.68" stroke="var(--border)" strokeWidth="1.2" />
            <path d="M 192 345 Q 320 329 446 347 L 452 360 L 184 360 Z" transform="translate(1000 0) scale(-1 1)" fill="var(--sub-alt)" fillOpacity="0.68" stroke="var(--border)" strokeWidth="1.2" />
          </g>

          <g aria-hidden="true">
            {HOME_FINGER_BASES.map(({ finger, x, side }) => {
              const active = finger === activeFinger || finger === shiftFinger;
              const target = targetPoints[finger];
              const actualTargetX = target?.x ?? (side === "left" ? x : 1000 - x);
              const localTargetX = side === "left" ? actualTargetX : 1000 - actualTargetX;
              const targetY = target?.y ?? 112;
              const color = FINGER_VAR[finger];
              const groupKey = active ? finger + "-" + keyPressToken : finger;
              return (
                <g
                  key={groupKey}
                  transform={side === "right" ? "translate(1000 0) scale(-1 1)" : undefined}
                  className={active && keyPressToken > 0 ? "hero-lesson-finger-tap" : undefined}
                >
                  <path
                    d={fingerPath(localTargetX, targetY, x, 268, 31)}
                    fill={color}
                    fillOpacity={active ? 0.29 : 0.15}
                    stroke={color}
                    strokeOpacity={active ? 0.95 : 0.56}
                    strokeWidth={active ? 2.2 : 1.35}
                    strokeLinejoin="round"
                    style={active ? { filter: "drop-shadow(0 0 5px " + color + ")" } : undefined}
                  />
                  {active && (
                    <ellipse
                      cx={localTargetX}
                      cy={targetY + 8}
                      rx="11"
                      ry="5"
                      fill="var(--accent)"
                      fillOpacity="0.5"
                      stroke="var(--accent)"
                      strokeWidth="1.2"
                    />
                  )}
                </g>
              );
            })}

            {[{ side: "left" as const }, { side: "right" as const }].map(({ side }) => {
              const active = activeFinger === "thumb";
              const thumbX = active ? 480 : 438;
              const color = FINGER_VAR.thumb;
              return (
                <g
                  key={"thumb-" + side + (active ? "-" + keyPressToken : "")}
                  transform={side === "right" ? "translate(1000 0) scale(-1 1)" : undefined}
                  className={active && keyPressToken > 0 ? "hero-lesson-finger-tap" : undefined}
                >
                  <path
                    d={thumbPath(thumbX, 415)}
                    fill={color}
                    fillOpacity={active ? 0.28 : 0.15}
                    stroke={color}
                    strokeOpacity={active ? 0.95 : 0.6}
                    strokeWidth={active ? 2.2 : 1.35}
                    strokeLinejoin="round"
                    style={active ? { filter: "drop-shadow(0 0 5px " + color + ")" } : undefined}
                  />
                </g>
              );
            })}
          </g>

          {VISUAL_KEYS.map((key) => {
            const isActive = isVisualKeyActive(key);
            const longLabel = key.label.length > 7;
            const fontSize = longLabel ? 10.5 : key.label.length > 4 ? 12 : 14;
            return (
              <g key={"label-" + key.id} pointerEvents="none">
                <text
                  x={key.x + key.w / 2}
                  y={key.y + key.h / 2 + 0.5}
                  fill={isActive ? "var(--background)" : "var(--foreground)"}
                  opacity={isActive ? 1 : 0.88}
                  fontSize={fontSize}
                  fontWeight={isActive ? 750 : 550}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {key.label}
                </text>
                {key.homeRow && (
                  <line
                    x1={key.x + key.w / 2 - 6}
                    x2={key.x + key.w / 2 + 6}
                    y1={key.y + key.h - 5}
                    y2={key.y + key.h - 5}
                    stroke={isActive ? "var(--background)" : "var(--sub)"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-border bg-sub-alt/20 px-3 py-4 text-center min-[560px]:hidden">
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-accent/50 bg-accent/10 px-3 py-1.5 font-mono text-lg font-bold text-accent">
            {nextKey === " " ? "SPACE" : nextKey?.toUpperCase() ?? "—"}
          </span>
          <span className="text-xs text-sub">{guidanceLabel}</span>
        </div>
        <p className="text-[10px] text-sub">Full finger and keyboard guide is optimized for wider screens.</p>
      </div>

      <div
        className={cn(
          "hidden min-h-5 items-center justify-center gap-2 px-2 text-center font-mono text-[10px] font-medium text-sub sm:text-[11px] min-[560px]:flex",
          requiredShift && "text-foreground",
        )}
        aria-live="polite"
      >
        <span
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: activeFinger ? FINGER_VAR[activeFinger] : "var(--accent)" }}
          aria-hidden="true"
        />
        <span>{guidanceLabel}</span>
      </div>
    </section>
  );
}
