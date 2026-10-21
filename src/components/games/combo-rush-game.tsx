"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Crosshair,
  Flame,
  Gauge,
  Play,
  RotateCcw,
  SkipForward,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { GAME_LIST, type GameDefinition } from "@/lib/games/game-types";
import { awardXp, bumpStat, checkSiteAchievements } from "@/lib/profile/player-profile";
import {
  comboMultiplier,
  LOW_TIME_MS,
  MAX_TIME_MS,
  OVERDRIVE_CHARGE_MAX,
  OVERDRIVE_MS,
  START_TIME_MS,
  TICK_MS,
  getRushTier,
  useComboRush,
} from "@/lib/games/use-combo-rush";
import { recordGameResult, recordGameStart, type GameBest } from "@/lib/games/game-scores";
import { useGameBest } from "@/lib/games/use-game-best";
import { isGameRestartShortcut } from "@/lib/games/input-controls";
import { playSound } from "@/lib/games/game-audio";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { calculateAccuracy, round } from "@/lib/typing-engine/stats";
import { cn } from "@/lib/utils/cn";
import { GameViewport } from "@/components/games/ui/game-viewport";
import { PauseOverlay } from "@/components/games/ui/game-chrome";

/** Fixed so the board never resizes as words of different lengths come up. */

/**
 * Component-local keyframes. Two reasons they live here rather than in
 * `globals.css`: they are useless to anything else on the site, and the
 * arcade layer in that file is shared styling that several games depend on.
 * Every colour still comes from the theme — these only move and fade.
 *
 * `cr-gain` ends at 0.35 opacity rather than 0 on purpose. The global
 * reduced-motion rule collapses every animation to 0.001ms, so an animation
 * fading to nothing would make the "+1.2s" award invisible for exactly the
 * users who most need a static, readable signal; ending part-way leaves it
 * legible for the 700ms it is mounted.
 */
const COMBO_RUSH_CSS = `
@keyframes cr-gain {
  0% { opacity: 0; transform: translateY(6px) scale(0.92); }
  18% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0.35; transform: translateY(-24px) scale(1); }
}
.cr-gain { animation: cr-gain 700ms ease-out forwards; }

@keyframes cr-urgent {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
.cr-urgent { animation: cr-urgent 620ms ease-in-out infinite; }

@keyframes cr-spark {
  0%, 100% { opacity: 0.25; transform: scale(0.8); }
  50% { opacity: 0.9; transform: scale(1.15); }
}
.cr-spark { animation: cr-spark 2.8s ease-in-out infinite; }

@keyframes cr-beam {
  0%, 100% { opacity: 0.08; transform: translateX(-8%) rotate(18deg); }
  50% { opacity: 0.22; transform: translateX(8%) rotate(18deg); }
}
.cr-beam { animation: cr-beam 8s ease-in-out infinite; transform-origin: 50% 0; }

@keyframes cr-orbit {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}
.cr-orbit { animation: cr-orbit 24s linear infinite; }

@keyframes cr-caret {
  0%, 45% { opacity: 1; }
  46%, 100% { opacity: 0.25; }
}
.cr-caret { animation: cr-caret 1.1s steps(1, end) infinite; }

@keyframes cr-error {
  0% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
  100% { transform: translateX(0); }
}
.cr-error { animation: cr-error 260ms ease-out; }

.cr-word-lock {
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent),
    0 0 0 1px color-mix(in srgb, var(--accent) 18%, transparent),
    0 0 34px -14px color-mix(in srgb, var(--accent) 90%, transparent);
}

.cr-tier-fill {
  background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 55%, transparent), var(--accent));
  box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 70%, transparent);
}

.cr-rail-mark {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--background) 75%, transparent);
}
`;

/** The public tier milestones already defined by the Combo Rush engine. */
const RUSH_TIER_STEPS = [
  { threshold: 0, tier: "normal", label: "Warmup", shortLabel: "WARM", tone: "text-sub" },
  { threshold: 5, tier: "bronze", label: "Bronze", shortLabel: "BRZ", tone: "text-emerald-400" },
  { threshold: 10, tier: "silver", label: "Silver", shortLabel: "SIL", tone: "text-cyan-400" },
  { threshold: 15, tier: "gold", label: "Gold", shortLabel: "GLD", tone: "text-amber-400" },
  { threshold: 25, tier: "hyper", label: "Hyper", shortLabel: "HYP", tone: "text-purple-400" },
] as const;

const ATMOSPHERE_PARTICLES = [
  { left: "8%", top: "20%", size: 2, delay: "-0.8s" },
  { left: "17%", top: "64%", size: 3, delay: "-2.1s" },
  { left: "29%", top: "14%", size: 2, delay: "-1.4s" },
  { left: "42%", top: "76%", size: 2, delay: "-2.6s" },
  { left: "57%", top: "11%", size: 3, delay: "-0.3s" },
  { left: "68%", top: "68%", size: 2, delay: "-1.8s" },
  { left: "79%", top: "25%", size: 2, delay: "-2.9s" },
  { left: "91%", top: "57%", size: 3, delay: "-1.1s" },
] as const;

interface ComboRushGameProps {
  definition: GameDefinition;
}

export function ComboRushGame({ definition }: ComboRushGameProps) {
  // `start` rebuilds the initial state itself, so "Play again" reuses it
  // rather than needing a separate reset.
  const { state, start, pause, resume, setTyped, skip } = useComboRush(definition);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lazy initialiser rather than a mount effect: this component only ever
  // renders client-side (its wrapper is next/dynamic with ssr:false), so
  // localStorage is guaranteed available and there is no server pass to
  // reconcile.
  const best = useGameBest(definition.id);
  const [isNewBest, setIsNewBest] = useState(false);

  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);

  // Sounds are driven off state transitions rather than fired inline from
  // handlers, so every path that changes the run — a keystroke, a skip, the
  // clock hitting zero on a tick — gets audio without each one remembering.
  const prevRef = useRef({ correct: 0, incorrect: 0, cleared: 0, skipped: 0, combo: 0, tier: "normal", overdriveActivations: 0 });
  useEffect(() => {
    const prev = prevRef.current;
    const s = state;
    const currentTier = getRushTier(s.combo);

    if (s.correctKeystrokes > prev.correct) playSound("key", soundEnabled);
    if (s.incorrectKeystrokes > prev.incorrect) playSound("typo", soundEnabled);
    if (s.cleared > prev.cleared) playSound("clear", soundEnabled);
    if (s.skipped > prev.skipped) playSound("miss", soundEnabled);
    if (s.combo > prev.combo && s.combo > 0 && s.combo % 5 === 0) playSound("combo", soundEnabled);
    if (currentTier.tier !== prev.tier && currentTier.tier !== "normal") playSound("powerup", soundEnabled);
    if (s.overdriveActivations > prev.overdriveActivations) playSound("nitro", soundEnabled);

    prevRef.current = {
      correct: s.correctKeystrokes,
      incorrect: s.incorrectKeystrokes,
      cleared: s.cleared,
      skipped: s.skipped,
      combo: s.combo,
      tier: currentTier.tier,
      overdriveActivations: s.overdriveActivations,
    };
  }, [state, soundEnabled]);

  const focusInput = useCallback(() => inputRef.current?.focus(), []);
  useEffect(() => {
    if (state.status === "running") focusInput();
  }, [state.status, focusInput]);

  const recordedRef = useRef(false);
  useEffect(() => {
    if (state.status !== "over") {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current) return;
    recordedRef.current = true;

    const { isNewBest: newBest } = recordGameResult(definition.id, {
      score: state.score,
      cleared: state.cleared,
      bestCombo: state.bestCombo,
      survivedMs: state.elapsedMs,
    });
    setIsNewBest(newBest);
    playSound("over", soundEnabled);
    // Every game must feed the cross-game profile, or "play every game"
    // (site:all-games) can never be earned no matter how much is played.
    bumpStat(definition.id, "runs");
    awardXp(Math.round(state.score / 10) + state.cleared * 3);
    checkSiteAchievements(GAME_LIST.map((g) => g.id));
    // settle the run once, on the transition into "over"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const handleStart = useCallback(() => {
    recordGameStart(definition.id);
    setIsNewBest(false);
    // Also the user gesture that unlocks the audio context, so the first
    // keystroke of a run is already audible.
    playSound("start", soundEnabled);
    start();
    focusInput();
  }, [start, focusInput, soundEnabled, definition.id]);

  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    if (state.status !== "over") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (isGameRestartShortcut(e)) {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.status, handleStart]);

  const accuracy = round(calculateAccuracy(state.correctKeystrokes, state.incorrectKeystrokes));
  const seconds = Math.round(state.elapsedMs / 1000);
  const isPlaying = state.status === "running";

  const isLow = state.timeLeftMs <= LOW_TIME_MS;
  const timePercent = Math.max(0, Math.min(100, (state.timeLeftMs / MAX_TIME_MS) * 100));

  // Both flashes are derived from game time rather than held in component
  // state, so they age out on the engine's existing tick and freeze with a
  // pause. Exactly one node can be mounted for the award flash at a time.
  const gain =
    state.lastGain && state.lastGain.untilMs > state.elapsedMs ? state.lastGain : null;
  const mistakeFlash = state.mistakeUntilMs > state.elapsedMs;

  const word = state.queue[0] ?? "";
  const done = word.slice(0, state.typed.length);
  const next = word.slice(state.typed.length, state.typed.length + 1);
  const rest = word.slice(state.typed.length + 1);
  const upcoming = state.queue.slice(1);
  const multiplier = comboMultiplier(state.combo);

  const tierInfo = getRushTier(state.combo);
  const tierIndex = Math.max(0, RUSH_TIER_STEPS.findIndex((step) => step.tier === tierInfo.tier));
  const tierStep = RUSH_TIER_STEPS[tierIndex];
  const nextTier = RUSH_TIER_STEPS[tierIndex + 1];
  const tierProgress = nextTier
    ? Math.max(0, Math.min(1, (state.combo - tierStep.threshold) / (nextTier.threshold - tierStep.threshold)))
    : 1;
  const wordsToNextTier = nextTier ? Math.max(0, nextTier.threshold - state.combo) : 0;
  const rushProgress = Math.max(0, Math.min(100, (state.combo / RUSH_TIER_STEPS[RUSH_TIER_STEPS.length - 1].threshold) * 100));
  const overdriveActive = state.overdriveMs > 0;
  const overdrivePercent = overdriveActive
    ? Math.max(0, Math.min(100, (state.overdriveMs / OVERDRIVE_MS) * 100))
    : Math.max(0, Math.min(100, (state.overdriveCharge / OVERDRIVE_CHARGE_MAX) * 100));

  return (
    <GameViewport
      onPause={pause}
      onFocusGame={focusInput}
      isFocused={isFocused}
      isRunning={isPlaying}
      className="w-full max-w-4xl gap-3"
    >
      <style>{COMBO_RUSH_CSS}</style>

      <div className="flex w-full flex-col gap-2.5 font-mono">
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-stretch">
          <div className="order-2 flex min-w-0 flex-col justify-center rounded-xl border border-border/70 bg-sub-alt/30 px-3 py-2.5 sm:order-1 sm:px-4">
            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-sub">
              <Target size={12} className="text-accent" aria-hidden="true" />
              Score
            </span>
            <span className="mt-0.5 truncate text-2xl font-semibold tabular-nums text-accent arcade-glow sm:text-3xl" aria-label={`Score ${state.score}`}>
              {state.score.toLocaleString()}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-sub/80">{state.cleared} words cleared</span>
          </div>

          <div className={cn(
            "order-1 col-span-2 flex min-w-0 flex-col items-center rounded-xl border bg-background/70 px-4 py-2.5 backdrop-blur-sm sm:order-2 sm:col-span-1 sm:min-w-[190px] sm:px-6",
            isLow && isPlaying ? "border-error/80 shadow-[0_0_24px_-8px_color-mix(in_srgb,var(--error)_80%,transparent)]" : "border-accent/45 arcade-edge",
          )}>
            <span className={cn("flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em]", isLow ? "text-error" : "text-sub")}>
              <Timer size={12} aria-hidden="true" />
              Time remaining
            </span>
            <span
              className={cn("mt-0.5 text-4xl font-semibold tabular-nums tracking-tight transition-colors sm:text-5xl", isLow ? "text-error cr-urgent" : "text-accent arcade-glow")}
              aria-label={`${(state.timeLeftMs / 1000).toFixed(1)} seconds left`}
            >
              {(state.timeLeftMs / 1000).toFixed(1)}<span className="ml-1 text-base font-normal text-sub">s</span>
            </span>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sub-alt" role="progressbar" aria-label="Time remaining" aria-valuenow={Math.round(timePercent)} aria-valuemin={0} aria-valuemax={100}>
              <div
                className={cn("h-full rounded-full", isLow ? "bg-error shadow-[0_0_10px_color-mix(in_srgb,var(--error)_70%,transparent)]" : "bg-accent shadow-[0_0_10px_color-mix(in_srgb,var(--accent)_70%,transparent)]")}
                style={{
                  width: `${timePercent}%`,
                  transitionProperty: "width, background-color",
                  transitionTimingFunction: "linear",
                  transitionDuration: `${TICK_MS}ms`,
                }}
              />
            </div>
          </div>

          <div className={cn(
            "order-3 flex min-w-0 flex-col justify-center rounded-xl border px-3 py-2.5 sm:order-3 sm:px-4",
            tierInfo.tier === "normal" ? "border-border/70 bg-sub-alt/30" : cn("bg-background/60", tierInfo.color),
          )}>
            <span className="flex items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-[0.22em] text-sub">
              <span className="flex items-center gap-1.5"><Zap size={12} className="text-accent" aria-hidden="true" /> Combo</span>
              <span className="truncate text-[8px] tracking-[0.15em]">{tierInfo.name}</span>
            </span>
            <span className="mt-0.5 flex items-baseline gap-1.5 text-2xl font-semibold tabular-nums text-accent arcade-glow sm:text-3xl" aria-label={`Combo ${state.combo}`}>
              {state.combo}<span className="text-[10px] font-normal uppercase tracking-wider text-sub">streak</span>
            </span>
            <span className="text-[9px] uppercase tracking-wider text-sub/80">&times;{multiplier.toFixed(2)} score + time</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-1 text-xs text-sub sm:px-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <Stat icon={<Crosshair size={13} />} value={`${accuracy}%`} label={`${accuracy} percent accuracy`} />
            <Stat icon={<Gauge size={13} />} value={state.skipped} label={`${state.skipped} words skipped`} />
            <span className="hidden text-[10px] uppercase tracking-wider text-sub/70 sm:inline">Clean keystrokes {state.correctKeystrokes.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            {isPlaying && isLow && (
              <span role="status" aria-live="polite" className="flex items-center gap-1 rounded-full border border-error/70 bg-error/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-error cr-urgent">
                <AlertTriangle size={11} aria-hidden="true" /> Clock critical
              </span>
            )}
            <button
              type="button"
              onClick={toggleSound}
              aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
              title={soundEnabled ? "Mute sound" : "Unmute sound"}
              className="-m-2 flex min-h-11 min-w-11 items-center justify-center p-2 text-sub/70 transition-colors hover:text-foreground sm:m-0 sm:min-h-0 sm:min-w-0 sm:p-0"
            >
              {soundEnabled ? <Volume2 size={15} aria-hidden="true" /> : <VolumeX size={15} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <RushTrack combo={state.combo} tierInfo={tierInfo} rushProgress={rushProgress} tierProgress={tierProgress} nextTier={nextTier} wordsToNextTier={wordsToNextTier} />
        <OverdriveMeter
          active={overdriveActive}
          charge={state.overdriveCharge}
          remainingMs={state.overdriveMs}
          percent={overdrivePercent}
          activations={state.overdriveActivations}
        />
      </div>

      <div
        onClick={focusInput}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border bg-background arcade-edge arcade-scanlines [--board-h:clamp(360px,60dvh,500px)] sm:[--board-h:clamp(430px,66dvh,570px)]",
          isLow && isPlaying ? "border-error/80" : "border-border",
          mistakeFlash && "cr-error border-error/80",
        )}
        style={{ height: "var(--safe-board-height, var(--board-h))" }}
      >
        <div aria-hidden="true" className="absolute inset-0 arcade-haze" />
        <div aria-hidden="true" className="absolute inset-0 arcade-grid opacity-35" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-[14%] top-0 h-[82%] w-[44%] -skew-x-12 bg-gradient-to-b from-accent/20 via-accent/5 to-transparent blur-2xl cr-beam" />
        <div aria-hidden="true" className="cr-orbit pointer-events-none absolute left-1/2 top-[38%] h-[72%] w-[64%] rounded-[50%] border border-accent/10" />
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[38%] h-[42%] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/10 shadow-[0_0_55px_-20px_color-mix(in_srgb,var(--accent)_90%,transparent)]" />
        {ATMOSPHERE_PARTICLES.map((particle, index) => (
          <span
            key={index}
            aria-hidden="true"
            className="cr-spark pointer-events-none absolute rounded-full bg-accent"
            style={{ left: particle.left, top: particle.top, width: particle.size, height: particle.size, animationDelay: particle.delay }}
          />
        ))}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-[18%] h-px bg-accent/20 shadow-[0_0_18px_color-mix(in_srgb,var(--accent)_70%,transparent)]" />
        {/* The danger wash fills in as the clock empties, so the board itself
            reads as the threat rather than just the number. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: isLow && isPlaying ? 1 : 0,
            background: "radial-gradient(90% 70% at 50% 100%, color-mix(in srgb, var(--error) 24%, transparent), transparent 72%)",
          }}
        />

        <div className="relative z-10 flex h-full flex-col px-4 pb-4 pt-4 sm:px-7 sm:pb-6 sm:pt-5">
          <div className="flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.22em] text-sub/80">
            <span className="flex items-center gap-1.5"><Flame size={12} className="text-accent" aria-hidden="true" /> Live rush</span>
            <span className={cn("rounded-full border px-2 py-0.5 font-bold", overdriveActive ? "border-purple-400/70 bg-purple-400/10 text-purple-300" : isLow ? "border-error/70 bg-error/10 text-error" : "border-accent/30 bg-accent/5 text-accent")}>
              {overdriveActive ? `Overdrive · ${(state.overdriveMs / 1000).toFixed(1)}s` : isLow ? "Critical clock" : `${tierInfo.name} tier`}
            </span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 sm:gap-7">
            <div className={cn("relative flex w-full max-w-2xl flex-col items-center gap-3 rounded-2xl border border-accent/20 bg-background/55 px-4 py-5 backdrop-blur-[2px] sm:px-8 sm:py-7", mistakeFlash && "border-error/60 bg-error/5")}>
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-sub">Type the signal</span>
              <span
                className={cn("cr-word-lock relative max-w-full break-keep rounded-xl bg-background/65 px-4 py-3 text-center font-mono text-3xl tracking-tight sm:px-7 sm:py-4 sm:text-5xl", mistakeFlash && "border-error/50 text-error")}
                aria-label={word ? `Type ${word}. ${state.typed.length} of ${word.length} characters complete` : undefined}
              >
                {mistakeFlash ? (
                  <span className="text-error underline decoration-error decoration-2 underline-offset-8">{word}</span>
                ) : (
                  <>
                    <span className="text-accent arcade-glow">{done}</span>
                    {next && (
                      <span className="relative inline-flex text-foreground">
                        <span className="border-b-2 border-accent text-foreground">{next}</span>
                        <span aria-hidden="true" className="cr-caret absolute -left-1.5 -top-1 h-[calc(100%+0.5rem)] w-0.5 rounded-full bg-accent" />
                      </span>
                    )}
                    <span className="text-foreground/80">{rest}</span>
                  </>
                )}
                {gain && (
                  <span
                    key={gain.seq}
                    aria-hidden="true"
                    className="cr-gain pointer-events-none absolute -right-2 -top-8 whitespace-nowrap font-mono text-sm font-semibold tabular-nums text-accent arcade-glow sm:-right-12 sm:-top-5 sm:text-base"
                  >
                    +{(gain.ms / 1000).toFixed(1)}s
                  </span>
                )}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-sub/75">{state.typed.length}/{word.length} characters locked</span>

              {mistakeFlash && (
                <span role="status" aria-live="polite" className="flex items-center gap-1.5 rounded-full border border-error/70 bg-error/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-error">
                  <AlertTriangle size={12} aria-hidden="true" /> Rush interrupted · combo reset
                </span>
              )}
            </div>

            {/* Look-ahead cards establish rhythm while keeping the active word dominant. */}
            <div className="w-full max-w-2xl" aria-label={upcoming.length > 0 ? `Upcoming words: ${upcoming.join(", ")}` : undefined}>
              <div className="mb-2 flex items-center justify-between font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-sub">
                <span className="flex items-center gap-1.5"><Sparkles size={11} className="text-accent" aria-hidden="true" /> Up next</span>
                <span>{upcoming.length} queued</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-3 sm:gap-2" aria-hidden="true">
                {upcoming.slice(0, 3).map((queued, i) => (
                  <div key={`${queued}-${i}`} className={cn("flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 font-mono text-xs sm:text-sm", i === 0 ? "border-accent/55 bg-accent/10 text-foreground" : "border-border/70 bg-background/45 text-sub/75")}>
                    <span className={cn("text-[9px] font-bold", i === 0 ? "text-accent" : "text-sub/50")}>{String(i + 1).padStart(2, "0")}</span>
                    <span className="truncate">{queued}</span>
                  </div>
                ))}
                {upcoming.length === 0 && <span className="col-span-full text-center font-mono text-xs text-sub/60">Refilling queue…</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.16em] text-sub/70">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-accent arcade-pulse" /> Keep the chain alive</span>
            <span className="hidden sm:inline">Space <span className="text-sub/50">/</span> skip word <span className="ml-2 text-sub/50">Esc</span> pause</span>
          </div>
        </div>

        {/* Mobile touch Skip button */}
        {isPlaying && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              skip();
              focusInput();
            }}
            className="absolute bottom-3 right-3 z-20 flex items-center gap-1 rounded-lg border border-border/70 bg-background/85 px-2.5 py-1 font-mono text-xs text-sub shadow-lg backdrop-blur-sm transition-colors hover:text-foreground active:scale-95 sm:hidden"
            aria-label="Skip current word"
          >
            <SkipForward size={12} />
            Skip
          </button>
        )}

        {/* Lost focus alert */}
        {isPlaying && !isFocused && (
          <button
            type="button"
            onClick={focusInput}
            className="absolute inset-x-6 top-1/2 z-30 flex -translate-y-1/2 items-center justify-center gap-2 rounded-xl border border-accent bg-background/95 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-accent arcade-pulse shadow-xl backdrop-blur-md transition-transform hover:scale-105"
          >
            <Zap size={14} className="animate-bounce" />
            Tap to resume rush
          </button>
        )}

        {!isPlaying && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm sm:p-6">
            {state.status === "idle" && (
              <StartCard definition={definition} best={best} onStart={handleStart} />
            )}
            {state.status === "paused" && (
              <PauseOverlay
                onResume={() => {
                  resume();
                  focusInput();
                }}
              />
            )}
            {state.status === "over" && (
              <GameOverCard
                score={state.score}
                cleared={state.cleared}
                skipped={state.skipped}
                overdriveActivations={state.overdriveActivations}
                bestCombo={state.bestCombo}
                accuracy={accuracy}
                seconds={seconds}
                isNewBest={isNewBest}
                best={best}
                onRestart={handleStart}
              />
            )}
          </div>
        )}

        <input
          ref={inputRef}
          value={state.typed}
          onChange={(e) => {
            const value = e.target.value;
            if (value.includes(" ")) {
              setTyped(value.slice(0, value.indexOf(" ")).toLowerCase());
              skip();
              return;
            }
            setTyped(value.toLowerCase());
          }}
          onPaste={(e) => e.preventDefault()}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            // Space never commits a word here — a word clears the instant it
            // is complete — so it is free to mean "skip this one".
            if (e.key === " ") {
              e.preventDefault();
              skip();
            }
            if (e.key === "Tab" && state.status === "over") {
              e.preventDefault();
              handleStart();
            }
          }}
          disabled={!isPlaying}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          enterKeyHint="go"
          data-gramm="false"
          aria-label={`${definition.name} typing input`}
          className="absolute inset-0 h-full w-full cursor-text opacity-0"
          style={{ fontSize: 16 }}
        />
      </div>
    </GameViewport>
  );
}

function RushTrack({
  combo,
  tierInfo,
  rushProgress,
  tierProgress,
  nextTier,
  wordsToNextTier,
}: {
  combo: number;
  tierInfo: ReturnType<typeof getRushTier>;
  rushProgress: number;
  tierProgress: number;
  nextTier: (typeof RUSH_TIER_STEPS)[number] | undefined;
  wordsToNextTier: number;
}) {
  const nextLabel = nextTier
    ? `${wordsToNextTier} ${wordsToNextTier === 1 ? "word" : "words"} to ${nextTier.label}`
    : "Hyper tier maxed";

  return (
    <section className="w-full rounded-xl border border-border/70 bg-sub-alt/25 px-3 py-2.5 sm:px-4" aria-label={`Rush tier progression. ${nextLabel}`}>
      <div className="flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.2em]">
        <span className="flex items-center gap-1.5 font-bold text-sub"><Flame size={12} className="text-accent" aria-hidden="true" /> Rush progression</span>
        <span className={cn("truncate font-bold", tierInfo.tier === "normal" ? "text-sub" : tierInfo.color.split(" ")[0])}>
          {nextLabel} <span className="ml-1 text-sub/60">· {tierInfo.multiplier.toFixed(2)}x</span>
        </span>
      </div>

      <div
        className="relative mt-2 h-2 overflow-visible rounded-full bg-sub-alt"
        role="progressbar"
        aria-label="Rush tier progression"
        aria-valuenow={Math.min(combo, RUSH_TIER_STEPS[RUSH_TIER_STEPS.length - 1].threshold)}
        aria-valuemin={0}
        aria-valuemax={RUSH_TIER_STEPS[RUSH_TIER_STEPS.length - 1].threshold}
        aria-valuetext={nextLabel}
      >
        <div className="cr-tier-fill h-full rounded-full transition-[width] duration-200" style={{ width: `${rushProgress}%` }} />
        {RUSH_TIER_STEPS.map((step) => {
          const reached = combo >= step.threshold;
          const left = (step.threshold / RUSH_TIER_STEPS[RUSH_TIER_STEPS.length - 1].threshold) * 100;
          return (
            <span
              key={step.tier}
              aria-hidden="true"
              className={cn("cr-rail-mark absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border", reached ? "border-accent bg-accent" : "border-border bg-sub-alt")}
              style={{ left: `${left}%` }}
            />
          );
        })}
      </div>

      <div className="mt-2 grid grid-cols-5 gap-1 font-mono text-[8px] uppercase tracking-[0.12em] text-sub/75">
        {RUSH_TIER_STEPS.map((step) => {
          const reached = combo >= step.threshold;
          const active = tierInfo.tier === step.tier;
          return (
            <span key={step.tier} className={cn("flex min-w-0 flex-col items-center gap-0.5 text-center", reached && step.tone, active && "font-bold") }>
              <span className="truncate">{step.shortLabel}</span>
              <span className={cn("tabular-nums", reached ? "text-foreground/80" : "text-sub/50")}>{step.threshold}</span>
            </span>
          );
        })}
      </div>

      {nextTier && (
        <div className="mt-2 flex items-center gap-2" aria-hidden="true">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-sub-alt">
            <div className="h-full rounded-full bg-accent/75 transition-[width] duration-200" style={{ width: `${tierProgress * 100}%` }} />
          </div>
          <span className="font-mono text-[8px] uppercase tracking-wider text-sub/65">next tier</span>
        </div>
      )}
    </section>
  );
}

function OverdriveMeter({
  active,
  charge,
  remainingMs,
  percent,
  activations,
}: {
  active: boolean;
  charge: number;
  remainingMs: number;
  percent: number;
  activations: number;
}) {
  const value = active ? Math.round(remainingMs / 10) / 10 : Math.round(charge);
  const valueText = active ? `${(remainingMs / 1000).toFixed(1)} seconds remaining` : `${Math.round(charge)} percent charged`;

  return (
    <section
      className={cn(
        "w-full rounded-xl border px-3 py-2 sm:px-4",
        active
          ? "border-purple-400/60 bg-purple-400/10 shadow-[0_0_24px_-14px_color-mix(in_srgb,#c084fc_90%,transparent)]"
          : "border-border/70 bg-sub-alt/20",
      )}
      aria-label={active ? `Overdrive active. ${valueText}.` : `Overdrive charge. ${valueText}.`}
    >
      <div className="flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.2em]">
        <span className={cn("flex items-center gap-1.5 font-bold", active ? "text-purple-300" : "text-sub")}>
          <Sparkles size={12} className={active ? "text-purple-300" : "text-accent"} aria-hidden="true" />
          {active ? "Overdrive active" : "Overdrive charge"}
        </span>
        <span className={cn("tabular-nums", active ? "text-purple-200" : "text-sub/80")}>
          {active ? `${(remainingMs / 1000).toFixed(1)}s · 1.5× score` : `${Math.round(charge)}%`}
        </span>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sub-alt"
        role="progressbar"
        aria-label={active ? "Overdrive time remaining" : "Overdrive charge"}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={active ? OVERDRIVE_MS / 1000 : 100}
        aria-valuetext={valueText}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-200", active ? "bg-purple-300 shadow-[0_0_12px_color-mix(in_srgb,#c084fc_80%,transparent)]" : "bg-accent/80")}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 font-mono text-[8px] uppercase tracking-wider text-sub/65">
        <span>{active ? "Clock drain halved" : charge >= OVERDRIVE_CHARGE_MAX ? "Ready to ignite" : "Five clean clears to ignite"}</span>
        {activations > 0 && <span>{activations} ignition{activations === 1 ? "" : "s"}</span>}
      </div>
    </section>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) {
  return (
    <span className="flex items-center gap-1.5 tabular-nums" aria-label={label}>
      <span className="text-sub/60" aria-hidden="true">
        {icon}
      </span>
      {value}
    </span>
  );
}

function ArcadeButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-mono text-sm font-semibold uppercase tracking-wider text-background transition-transform hover:scale-105"
    >
      {children}
    </button>
  );
}

function StartCard({
  definition,
  best,
  onStart,
}: {
  definition: GameDefinition;
  best: GameBest | null;
  onStart: () => void;
}) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-accent">
          <Flame size={11} aria-hidden="true" /> Time attack arcade
        </span>
        <h2 className="font-mono text-2xl font-black uppercase tracking-tight text-foreground arcade-glow-soft sm:text-3xl">
          {definition.name}
        </h2>
        <p className="max-w-sm text-xs leading-relaxed text-sub sm:text-sm">{definition.tagline}</p>
      </div>

      <div className="grid w-full max-w-sm grid-cols-3 gap-1.5 font-mono">
        <StartMetric icon={<Timer size={13} />} label="Open clock" value={`${Math.round(START_TIME_MS / 1000)}s`} tone="error" />
        <StartMetric icon={<Flame size={13} />} label="Rush tiers" value={`${RUSH_TIER_STEPS.length}`} tone="accent" />
        <StartMetric icon={<Trophy size={13} />} label="Best score" value={best ? best.score.toLocaleString() : "—"} tone="accent" />
      </div>

      <ArcadeButton onClick={onStart}>
        <Play size={15} />
        Start rush
      </ArcadeButton>

      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-sub">
        <span className="text-accent">Clear</span> words to buy time
        <span aria-hidden="true">·</span>
        <span className="text-purple-300">Clean clears charge Overdrive</span>
        <span aria-hidden="true">·</span>
        <SkipForward size={11} aria-hidden="true" /> space skips
      </p>
    </div>
  );
}

function StartMetric({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "accent" | "error";
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 rounded-lg border border-border/70 bg-background/60 px-2 py-2">
      <span className={cn("flex items-center gap-1 font-mono text-base font-bold tabular-nums", tone === "error" ? "text-error" : "text-accent")}>
        {icon}
        {value}
      </span>
      <span className="truncate font-mono text-[8px] uppercase tracking-wider text-sub">{label}</span>
    </div>
  );
}

function GameOverCard({
  score,
  cleared,
  skipped,
  overdriveActivations,
  bestCombo,
  accuracy,
  seconds,
  isNewBest,
  best,
  onRestart,
}: {
  score: number;
  cleared: number;
  skipped: number;
  overdriveActivations: number;
  bestCombo: number;
  accuracy: number;
  seconds: number;
  isNewBest: boolean;
  best: GameBest | null;
  onRestart: () => void;
}) {
  const peakTier = getRushTier(bestCombo);
  const peakStep = RUSH_TIER_STEPS.find((step) => step.tier === peakTier.tier) ?? RUSH_TIER_STEPS[0];
  const peakProgress = Math.min(100, (bestCombo / RUSH_TIER_STEPS[RUSH_TIER_STEPS.length - 1].threshold) * 100);
  const peakTrackValue = Math.min(bestCombo, RUSH_TIER_STEPS[RUSH_TIER_STEPS.length - 1].threshold);

  return (
    <div
      className="no-scrollbar flex max-h-full w-full max-w-md flex-col items-center gap-3 overflow-y-auto p-1 text-center"
      role="status"
      aria-live="polite"
    >
      {isNewBest ? (
        <span className="flex items-center gap-1.5 rounded-full border border-accent/50 bg-accent/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent arcade-pulse">
          <Trophy size={12} aria-hidden="true" />
          New personal best
        </span>
      ) : (
        <span className="flex items-center gap-1.5 rounded-full border border-error/40 bg-error/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-error">
          <Timer size={12} aria-hidden="true" /> Time up
        </span>
      )}

      <div className="flex flex-col items-center gap-0.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-sub">Final score</span>
        <span className="font-mono text-5xl font-black tabular-nums text-accent arcade-glow sm:text-6xl">
          {score.toLocaleString()}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-sub">
          {cleared > 0 ? `${peakTier.name} tier reached · ${peakTier.multiplier.toFixed(2)}x peak payout` : "Warmup run · build your first streak"}
        </span>
      </div>

      <div className="grid w-full grid-cols-2 gap-1.5 sm:grid-cols-3">
        <ResultMetric icon={<Target size={13} />} value={cleared} label="Words cleared" ariaLabel={`${cleared} words cleared`} />
        <ResultMetric icon={<Zap size={13} />} value={`${bestCombo}`} label="Peak combo" ariaLabel={`Best combo ${bestCombo}`} />
        <ResultMetric icon={<Crosshair size={13} />} value={`${accuracy}%`} label="Accuracy" ariaLabel={`${accuracy} percent accuracy`} />
        <ResultMetric icon={<Timer size={13} />} value={`${seconds}s`} label="Survived" ariaLabel={`${seconds} seconds survived`} />
        <ResultMetric icon={<Gauge size={13} />} value={skipped} label="Skipped" ariaLabel={`${skipped} words skipped`} />
        <ResultMetric icon={<Flame size={13} />} value={peakStep.shortLabel} label="Rush peak" ariaLabel={`Peak rush tier ${peakTier.name}`} />
        <ResultMetric icon={<Sparkles size={13} />} value={overdriveActivations} label="Overdrives" ariaLabel={`${overdriveActivations} Overdrive activations`} />
      </div>

      <div className="w-full rounded-xl border border-border/70 bg-background/55 px-3 py-2 text-left backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-wider text-sub">
          <span>Rush climb</span>
          <span className={cn("font-bold", peakTier.tier === "normal" ? "text-sub" : peakTier.color.split(" ")[0])}>{bestCombo >= 25 ? `${bestCombo} combo · max tier` : `${peakTrackValue}/25 combo`}</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sub-alt" role="progressbar" aria-label="Peak Rush tier progress" aria-valuenow={peakTrackValue} aria-valuemin={0} aria-valuemax={25}>
          <div className="cr-tier-fill h-full rounded-full" style={{ width: `${peakProgress}%` }} />
        </div>
        <p className="mt-1.5 font-mono text-[9px] leading-relaxed text-sub">{cleared > 0 ? `You kept the clock alive for ${seconds} seconds, converted ${cleared} clean clears, and ignited Overdrive ${overdriveActivations} time${overdriveActivations === 1 ? "" : "s"}.` : "Start with a clean word to turn the clock into your score multiplier."}</p>
      </div>

      {best && !isNewBest && (
        <span
          className="flex items-center gap-1.5 font-mono text-xs tabular-nums text-accent/80"
          aria-label={`Your best ${best.score}`}
        >
          <Trophy size={12} aria-hidden="true" />
          Personal best&nbsp;{best.score.toLocaleString()}
        </span>
      )}

      <ArcadeButton onClick={onRestart}>
        <RotateCcw size={15} aria-hidden="true" />
        Play again
      </ArcadeButton>

      <p className="font-mono text-[10px] uppercase tracking-wider text-sub">
        Press <kbd className="rounded border border-border bg-sub-alt/40 px-1 py-0.5 font-mono text-[9px] text-foreground">Enter</kbd> or <kbd className="rounded border border-border bg-sub-alt/40 px-1 py-0.5 font-mono text-[9px] text-foreground">Space</kbd> to play again
      </p>
    </div>
  );
}

function ResultMetric({
  icon,
  value,
  label,
  ariaLabel,
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
  ariaLabel: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center rounded-lg border border-border/70 bg-background/60 px-2 py-2" aria-label={ariaLabel}>
      <span className="flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums text-foreground">
        <span className="text-accent" aria-hidden="true">{icon}</span>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
      <span className="truncate font-mono text-[8px] uppercase tracking-wider text-sub">{label}</span>
    </div>
  );
}
