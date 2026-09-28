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
import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  XCircle,
} from "lucide-react";
import type { GameDefinition } from "@/lib/games/game-types";
import type { GameBest } from "@/lib/games/game-scores";
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
          // Decorative board backdrop at 40% opacity under a gradient.
          quality={45}
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
    <div className="theme-transition flex items-center gap-2 rounded-lg border border-border/70 bg-background/70 px-2.5 py-1.5 backdrop-blur-sm">
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
        className="theme-transition h-2.5 flex-1 overflow-hidden rounded-full border border-border/60 bg-sub-alt"
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
    <div className="theme-transition flex flex-col gap-1.5 rounded-xl border border-border bg-background/70 p-3 backdrop-blur-sm">
      <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">
        <span className="text-accent">{icon}</span>
        {title}
      </span>
      <p className="text-[11px] leading-snug text-sub">{body}</p>
    </div>
  );
}

/** Standard responsive arcade action button with focus ring and touch target. */
export function ArcadeButton({
  onClick,
  children,
  variant = "primary",
  size = "md",
  disabled,
  className,
}: {
  onClick: () => void;
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}) {
  const base =
    "flex items-center justify-center gap-2 rounded-xl font-mono font-bold uppercase tracking-wider transition-all select-none active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";

  const sizeClass =
    size === "sm"
      ? "min-h-9 px-3.5 py-1.5 text-xs"
      : size === "lg"
        ? "min-h-12 px-6 py-3 text-sm tracking-[0.14em]"
        : "min-h-11 px-5 py-2.5 text-xs tracking-wider";

  const variantClass =
    variant === "primary"
      ? "bg-accent text-background shadow-lg hover:brightness-110"
      : variant === "danger"
        ? "bg-error text-background shadow-lg hover:brightness-110"
        : "border border-border/80 bg-background/80 text-foreground hover:border-accent/60 hover:text-accent";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(base, sizeClass, variantClass, className)}
    >
      {children}
    </button>
  );
}

/** Visual countdown overlay: 3 -> 2 -> 1 -> GO! */
export function CountdownOverlay({
  count,
}: {
  count: number | string;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
      <div className="flex flex-col items-center gap-2 animate-in zoom-in-75 duration-200">
        <span className="font-mono text-6xl sm:text-8xl font-black text-accent arcade-glow drop-shadow-2xl">
          {count}
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-sub">
          Get ready
        </span>
      </div>
    </div>
  );
}

/** Standard pause screen with resume and sound toggles. */
export function PauseOverlay({
  onResume,
  onRestart,
  soundEnabled,
  onToggleSound,
}: {
  onResume: () => void;
  onRestart?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-background/90 p-6 backdrop-blur-md">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
          Game Paused
        </span>
        <p className="mt-1 font-mono text-xs text-sub">
          Take a breath. Your progress and timer are frozen.
        </p>
      </div>

      <div className="flex flex-col w-full max-w-xs gap-3">
        <ArcadeButton onClick={onResume} size="lg">
          <Play size={16} aria-hidden="true" />
          Resume Run
          <span className="ml-auto rounded bg-background/20 px-1.5 py-0.5 text-[9px] text-background">
            Space ␣
          </span>
        </ArcadeButton>

        {onRestart && (
          <ArcadeButton onClick={onRestart} variant="secondary">
            <RotateCcw size={14} aria-hidden="true" />
            Restart
          </ArcadeButton>
        )}

        {onToggleSound && (
          <button
            type="button"
            onClick={onToggleSound}
            className="flex items-center justify-center gap-2 py-2 font-mono text-xs text-sub hover:text-foreground transition-colors"
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            Sound: {soundEnabled ? "On" : "Muted"}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Universal Game Onboarding / Start Card.
 * Uses progressive disclosure: objective first, controls, optional mode pills, and collapsible rules.
 */
export function UniversalStartCard({
  definition,
  best,
  onStart,
  soundEnabled,
  onToggleSound,
  children,
}: {
  definition: GameDefinition;
  best: GameBest | null;
  onStart: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  children?: ReactNode;
}) {
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="flex w-full max-w-md flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-200">
      {/* Title & Tagline */}
      <div className="flex flex-col items-center gap-1">
        <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-accent">
          {definition.category} Arcade
        </span>
        <h2 className="mt-1 font-mono text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground arcade-glow">
          {definition.name}
        </h2>
        <p className="text-xs sm:text-sm text-sub max-w-sm leading-relaxed">
          {definition.tagline}
        </p>
      </div>

      {/* Personal best banner if available */}
      {best && best.score > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-1 font-mono text-xs text-accent">
          <Trophy size={13} aria-hidden="true" />
          <span>
            Personal Best:{" "}
            <strong>
              {definition.scoreBy === "time" ? `${best.score}s` : best.score.toLocaleString()}
            </strong>
          </span>
          {best.bestCombo > 1 && (
            <span className="text-[10px] text-sub">· {best.bestCombo}x max combo</span>
          )}
        </div>
      )}

      {/* Custom game options (difficulty / mode pills) */}
      {children && <div className="w-full">{children}</div>}

      {/* Primary Action Button */}
      <div className="w-full flex flex-col items-center gap-2">
        <ArcadeButton onClick={onStart} size="lg" className="w-full max-w-sm">
          <Play size={16} aria-hidden="true" />
          Start Game
          <span className="ml-auto rounded bg-background/25 px-1.5 py-0.5 text-[9px] text-background">
            Enter ↵
          </span>
        </ArcadeButton>

        <div className="flex items-center justify-between w-full max-w-sm px-1 text-[11px] text-sub">
          <span className="font-mono">Controls: Touch-typing</span>
          {onToggleSound && (
            <button
              type="button"
              onClick={onToggleSound}
              className="flex items-center gap-1 hover:text-foreground transition-colors font-mono"
            >
              {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
              {soundEnabled ? "Sound ON" : "Sound OFF"}
            </button>
          )}
        </div>
      </div>

      {/* Progressive disclosure: Rules expander */}
      <div className="w-full max-w-sm border-t border-border/60 pt-2 text-left">
        <button
          type="button"
          onClick={() => setShowRules((prev) => !prev)}
          className="flex w-full items-center justify-between py-1 font-mono text-xs text-sub hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <HelpCircle size={13} />
            How to play
          </span>
          {showRules ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showRules && (
          <ul className="mt-2 space-y-1.5 rounded-lg border border-border/60 bg-background/70 p-3 text-xs text-sub">
            {definition.rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Universal Polished Results Card.
 * Celebrates personal bests, breaks down performance, and provides clear action hierarchy.
 */
export function UniversalResultCard({
  definition,
  headline,
  isNewBest,
  best,
  previousBestScore,
  stats,
  victory,
  reason,
  onRestart,
  children,
}: {
  definition: GameDefinition;
  headline: string | number;
  isNewBest: boolean;
  best: GameBest | null;
  previousBestScore?: number;
  stats: { label: string; value: string | number; sub?: string }[];
  victory?: boolean;
  reason?: string;
  onRestart: () => void;
  children?: ReactNode;
}) {
  const isTimeScored = definition.scoreBy === "time";
  const numHeadline = typeof headline === "number" ? headline : parseInt(`${headline}`.replace(/,/g, ""), 10) || 0;
  const pbDelta =
    isNewBest && previousBestScore && previousBestScore > 0
      ? numHeadline - previousBestScore
      : null;

  return (
    <div className="flex w-full max-w-md flex-col items-center text-center gap-3.5 animate-in fade-in zoom-in-95 duration-200">
      {/* Result Status Banner */}
      <div className="flex flex-col items-center gap-1">
        {isNewBest ? (
          <div className="flex items-center gap-1.5 rounded-full border border-accent bg-accent/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent arcade-pulse">
            <Sparkles size={13} aria-hidden="true" />
            New Personal Best!
          </div>
        ) : victory ? (
          <div className="flex items-center gap-1.5 rounded-full border border-correct bg-correct/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-correct">
            <CheckCircle2 size={13} aria-hidden="true" />
            Victory!
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full border border-error/70 bg-error/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-error">
            <XCircle size={13} aria-hidden="true" />
            Run Complete
          </div>
        )}

        <h3 className="font-mono text-3xl sm:text-4xl font-black tabular-nums tracking-tight text-foreground arcade-glow mt-1">
          {headline}
          {isTimeScored && <span className="text-xl text-sub font-normal">s</span>}
        </h3>

        {reason && <p className="font-mono text-xs text-sub">{reason}</p>}

        {pbDelta !== null && pbDelta > 0 && (
          <p className="font-mono text-[11px] text-accent font-semibold">
            +{isTimeScored ? `${pbDelta}s` : pbDelta.toLocaleString()} vs previous best
          </p>
        )}
        {!isNewBest && best && best.score > 0 && (
          <p className="font-mono text-[11px] text-sub">
            Best: {isTimeScored ? `${best.score}s` : best.score.toLocaleString()}
          </p>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
        {stats.map((s, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center justify-center rounded-xl border border-border/80 bg-background/80 p-2.5 backdrop-blur-sm"
          >
            <span className="font-mono text-base sm:text-lg font-bold tabular-nums text-foreground">
              {s.value}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-sub">
              {s.label}
            </span>
            {s.sub && (
              <span className="font-mono text-[8px] text-accent/80 mt-0.5">
                {s.sub}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Custom result slots (e.g. deck breakdown, racer splits) */}
      {children}

      {/* Action Buttons */}
      <div className="flex flex-col w-full gap-2 mt-1">
        <ArcadeButton onClick={onRestart} size="lg" className="w-full">
          <RotateCcw size={15} aria-hidden="true" />
          Play Again
          <span className="ml-auto rounded bg-background/25 px-1.5 py-0.5 text-[9px] text-background">
            Enter ↵
          </span>
        </ArcadeButton>

        <Link
          href="/games"
          className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-sub-alt/40 font-mono text-xs uppercase tracking-wider text-sub transition-colors hover:border-accent hover:text-foreground"
        >
          <ArrowLeft size={13} aria-hidden="true" />
          Back to Arcade
        </Link>
      </div>
    </div>
  );
}
