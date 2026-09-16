"use client";

/**
 * The shared in-game UI kit.
 *
 * Built from the Boss Battle reference: a full-bleed art backdrop, a boss bar
 * with phase pips across the top, small labelled stat panels down each side, a
 * large centred word, and a queue of what is coming next.
 *
 * It stays inside the page rather than taking over the viewport. The game route
 * carries two ad slots and the indexable prose that makes it rank, and a
 * full-screen takeover would cost both across ten pages. The board gets the
 * immersive treatment; the page keeps its job.
 *
 * Everything is driven by the `--accent` variable the route already sets per
 * game, so the same components read red for Boss Battle, violet for Spellbound
 * and cyan for Ghost Racer with no per-game styling.
 */

import Image from "next/image";
import type { ReactNode } from "react";
import { AlertTriangle, Play } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** The art backdrop plus scanlines every board sits on. */
export function GameStage({
  art,
  children,
  className,
  danger,
}: {
  art?: string | null;
  children: ReactNode;
  className?: string;
  /** Pulls a red wash over the stage, for low health or an incoming hit. */
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-border arcade-scanlines",
        "[--board-h:400px] sm:[--board-h:500px]",
        className,
      )}
      style={{ height: "var(--board-h)" }}
    >
      {art && (
        <Image
          src={art}
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover opacity-40"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-300",
          danger ? "opacity-100" : "opacity-0",
        )}
        style={{
          background:
            "radial-gradient(120% 90% at 50% 100%, color-mix(in srgb, var(--error) 35%, transparent), transparent 70%)",
        }}
      />
      <div className="relative z-10 flex h-full flex-col">{children}</div>
    </div>
  );
}

/**
 * A labelled stat tile. Value first, label under it — at a glance the player
 * reads the number, and the label is only there the first time.
 */
export function StatTile({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon?: ReactNode;
  label: string;
  value: string | number;
  tone?: "default" | "accent" | "error" | "good";
}) {
  const toneClass =
    tone === "accent"
      ? "text-accent"
      : tone === "error"
        ? "text-error"
        : tone === "good"
          ? "text-correct"
          : "text-foreground";
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/70 px-2.5 py-1.5 backdrop-blur-sm">
      {icon && <span className={cn("shrink-0", toneClass)}>{icon}</span>}
      <div className="min-w-0">
        <p className={cn("font-mono text-sm font-bold tabular-nums leading-none", toneClass)}>
          {value}
        </p>
        <p className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-wider text-sub">
          {label}
        </p>
      </div>
    </div>
  );
}

/**
 * A health bar with optional phase pips.
 *
 * The percentage is rendered as text as well as width: a bar alone encodes the
 * single most important number in the fight as nothing but a length, which is
 * unreadable to anyone who cannot distinguish the fill from the track.
 */
export function HealthBar({
  label,
  current,
  max,
  phases,
  phase,
  tone = "error",
  compact,
}: {
  label: string;
  current: number;
  max: number;
  phases?: number;
  phase?: number;
  tone?: "error" | "accent" | "good";
  compact?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (current / Math.max(1, max)) * 100));
  const fill =
    tone === "accent" ? "bg-accent" : tone === "good" ? "bg-correct" : "bg-error";

  return (
    <div className="flex w-full items-center gap-2">
      {!compact && (
        <span className="shrink-0 truncate font-mono text-[10px] uppercase tracking-wider text-foreground sm:text-xs">
          {label}
        </span>
      )}
      <div
        className="h-2.5 flex-1 overflow-hidden rounded-full border border-border/60 bg-sub-alt"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn("h-full transition-[width] duration-200", fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 font-mono text-[10px] tabular-nums text-sub sm:text-xs">
        {Math.round(pct)}%
      </span>
      {phases && phases > 1 && (
        <span className="hidden shrink-0 items-center gap-1 sm:flex" aria-label={`Phase ${(phase ?? 0) + 1} of ${phases}`}>
          {Array.from({ length: phases }, (_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                i <= (phase ?? 0) ? "bg-accent" : "bg-sub-alt",
              )}
            />
          ))}
        </span>
      )}
    </div>
  );
}

/**
 * The big centred word.
 *
 * Correct characters take the accent, the pending remainder stays muted, and a
 * wrong character is marked with an underline as well as colour so the mistake
 * is not signalled by hue alone.
 */
export function WordDisplay({
  word,
  typed,
  shake,
}: {
  word: string;
  typed: string;
  shake?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-md items-center justify-center rounded-xl border-2 bg-background/80 px-4 py-4 backdrop-blur-sm transition-colors",
        shake ? "border-error" : "border-accent/50",
      )}
    >
      <p className="font-mono text-2xl tracking-[0.2em] sm:text-4xl">
        {word.split("").map((ch, i) => {
          const done = i < typed.length;
          const wrong = done && typed[i] !== ch;
          return (
            <span
              key={i}
              className={cn(
                wrong
                  ? "text-error underline decoration-error decoration-2 underline-offset-4"
                  : done
                    ? "text-accent"
                    : "text-sub",
              )}
            >
              {ch}
            </span>
          );
        })}
      </p>
    </div>
  );
}

/** The queue of upcoming words, as in the reference's UP NEXT strip. */
export function UpNext({ words }: { words: string[] }) {
  if (words.length === 0) return null;
  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-sub">
        Up next
      </span>
      <ul className="flex min-w-0 gap-1.5">
        {words.slice(0, 4).map((w, i) => (
          <li
            key={`${w}-${i}`}
            className="truncate rounded-md border border-border/60 bg-background/60 px-2 py-1 font-mono text-[10px] text-sub sm:text-xs"
          >
            {w}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The flashing incoming-attack warning. */
export function IncomingWarning({ show, text = "Incoming attack" }: { show: boolean; text?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-1.5 rounded-lg border border-error bg-error/15 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-error transition-opacity duration-200 sm:text-xs",
        show ? "opacity-100 motion-safe:animate-pulse" : "pointer-events-none opacity-0",
      )}
    >
      <AlertTriangle size={13} aria-hidden="true" />
      {show ? text : ""}
    </div>
  );
}

/** The large chevron start button from the reference. */
export function StartButton({
  onClick,
  label = "Start",
  disabled,
}: {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex min-h-12 w-full max-w-sm items-center justify-center gap-2.5 rounded-xl bg-accent px-6 font-mono text-sm font-bold uppercase tracking-[0.15em] text-background transition-all",
        disabled ? "cursor-not-allowed opacity-50" : "hover:scale-[1.02]",
      )}
      style={
        disabled
          ? undefined
          : {
              boxShadow:
                "0 0 30px -4px color-mix(in srgb, var(--accent) 80%, transparent)",
            }
      }
    >
      <Play size={16} aria-hidden="true" />
      {label}
    </button>
  );
}

/** One of the three "how it works" cards on a start screen. */
export function RuleCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-background/70 p-3 backdrop-blur-sm">
      <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">
        <span className="text-accent">{icon}</span>
        {title}
      </span>
      <p className="text-[11px] leading-snug text-sub">{body}</p>
    </div>
  );
}
