"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  CloudLightning,
  CloudRain,
  Gauge,
  Heart,
  Volume2,
  VolumeX,
  Wind,
  Zap,
} from "lucide-react";
import type { GameComponentProps } from "@/components/games/game-client";
import {
  useWordRain,
  getStormPhase,
  STORM_PHASES,
  NEAR_MISS_THRESHOLD,
} from "@/lib/games/use-word-rain";
import { getGameBest, recordGameResult, recordGameStart, type GameBest } from "@/lib/games/game-scores";
import { awardXp, bumpStat, checkSiteAchievements } from "@/lib/profile/player-profile";
import { playSound } from "@/lib/games/game-audio";
import { sound } from "@/lib/audio/game-sounds";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { calculateAccuracy, calculateNetWpm, round } from "@/lib/typing-engine/stats";
import { GameViewport } from "@/components/games/ui/game-viewport";
import {
  UniversalStartCard,
  UniversalResultCard,
  PauseOverlay,
} from "@/components/games/ui/game-chrome";
import { cn } from "@/lib/utils/cn";

export function WordRainGame({ definition, art }: GameComponentProps) {
  const bgArt = art?.hero ?? art?.cover ?? "/games/word-rain.webp";

  const [laneCount, setLaneCount] = useState(5);
  useEffect(() => {
    const updateLanes = () => {
      setLaneCount(window.innerWidth < 640 ? 4 : 5);
    };
    updateLanes();
    window.addEventListener("resize", updateLanes);
    return () => window.removeEventListener("resize", updateLanes);
  }, []);

  const { state, start, resume, setTyped } = useWordRain(definition, { laneCount });
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(true);

  const [best, setBest] = useState<GameBest | null>(() => getGameBest(definition.id));
  const [isNewBest, setIsNewBest] = useState(false);

  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);

  const phase = getStormPhase(state.elapsedMs);
  const secondsSurvived = Math.floor(state.elapsedMs / 1000);
  const isPlaying = state.status === "running";

  const accuracy = round(calculateAccuracy(state.correctKeystrokes, state.incorrectKeystrokes));
  const wpm = round(calculateNetWpm(state.correctKeystrokes, Math.max(state.elapsedMs, 1000)));

  // ---- Audio reactions ----------------------------------------------------
  const prevRef = useRef({
    correct: 0,
    incorrect: 0,
    cleared: 0,
    combo: 0,
    phaseIndex: 0,
  });

  useEffect(() => {
    const prev = prevRef.current;
    const s = state;

    if (s.correctKeystrokes > prev.correct) playSound("key", soundEnabled);
    if (s.incorrectKeystrokes > prev.incorrect) playSound("typo", soundEnabled);
    if (s.cleared > prev.cleared) {
      playSound("clear", soundEnabled);
      sound("enemy-death", soundEnabled, { vary: 60 });
    }
    if (s.combo > prev.combo && s.combo > 0 && s.combo % 5 === 0) {
      playSound("combo", soundEnabled);
      sound("combo-milestone", soundEnabled);
    }
    if (s.currentPhaseIndex > prev.phaseIndex) {
      playSound("thunder", soundEnabled);
      sound("boss-spawn", soundEnabled, { volume: 0.4 });
    }

    prevRef.current = {
      correct: s.correctKeystrokes,
      incorrect: s.incorrectKeystrokes,
      cleared: s.cleared,
      combo: s.combo,
      phaseIndex: s.currentPhaseIndex,
    };
  }, [state, soundEnabled]);

  const focusInput = useCallback(() => inputRef.current?.focus(), []);
  useEffect(() => {
    if (state.status === "running") focusInput();
  }, [state.status, focusInput]);

  // ---- Result Settlement --------------------------------------------------
  const recordedRef = useRef(false);
  useEffect(() => {
    if (state.status !== "over") {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current) return;
    recordedRef.current = true;

    const headline = secondsSurvived;
    const { isNewBest: newBest, best: stored } = recordGameResult(definition.id, {
      score: headline,
      cleared: state.cleared,
      bestCombo: state.bestCombo,
      survivedMs: state.elapsedMs,
    });
    setIsNewBest(newBest);
    setBest(stored);
    playSound("over", soundEnabled);
    if (newBest) sound("new-record", soundEnabled);

    bumpStat(definition.id, "runs");
    awardXp(secondsSurvived * 4 + state.cleared * 2);
    checkSiteAchievements();
  }, [state.status, secondsSurvived, state.cleared, state.bestCombo, state.elapsedMs, definition.id, soundEnabled]);

  const handleStart = useCallback(() => {
    recordGameStart(definition.id);
    setIsNewBest(false);
    playSound("start", soundEnabled);
    start();
    focusInput();
  }, [start, focusInput, soundEnabled, definition.id]);

  useEffect(() => {
    if (state.status !== "over") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.status, handleStart]);

  return (
    <GameViewport
      onFocusGame={focusInput}
      isFocused={isFocused}
      isRunning={isPlaying}
      className="w-full max-w-4xl gap-3"
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border border-violet-500/40 bg-background arcade-edge transition-all duration-300",
          state.pressure > 75 && "border-error ring-2 ring-error/60 arcade-pulse",
        )}
        style={{
          height: "var(--safe-board-height, clamp(320px, 66dvh, 640px))",
        }}
      >
        {/* Background artwork */}
        {bgArt && (
          <Image
            src={bgArt}
            alt="Word Rain Storm Arena"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1000px"
            quality={45}
            className="object-cover opacity-45 saturate-125"
          />
        )}

        {/* Rain streaks atmospheric visual layer */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/30 via-background/20 to-background/80"
        />

        {/* Danger floor strip */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-dashed border-error/60 bg-gradient-to-t from-error/25 to-transparent transition-opacity"
          style={{ height: "14%", opacity: state.pressure > 60 ? 1 : 0.4 }}
        />

        {/* HUD Overlay */}
        <div className="relative z-10 flex h-full flex-col p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2 font-mono">
            {/* Survival Timer */}
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-2xl sm:text-3xl font-black tabular-nums text-violet-400 drop-shadow-md">
                <CloudRain size={22} className="animate-pulse" />
                {secondsSurvived}
                <span className="text-sm font-normal text-sub">s</span>
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-error">
                <Heart size={12} fill="currentColor" />
                1 Life · Pure Survival
              </span>
            </div>

            {/* Storm Phase Pill */}
            <div className="flex flex-col items-center gap-0.5 rounded-xl border border-violet-500/40 bg-background/85 px-3 py-1.5 backdrop-blur-md">
              <span className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-violet-300">
                <Wind size={13} />
                {phase.phase}
              </span>
              <span className="text-[9px] text-sub uppercase tracking-wider">
                Phase {state.currentPhaseIndex + 1} of {STORM_PHASES.length}
              </span>
            </div>

            {/* Stats and Sound Toggle */}
            <div className="flex flex-col items-end gap-1 font-mono text-xs text-sub">
              <span>{accuracy}% acc</span>
              <span>{wpm} wpm</span>
              <div className="flex items-center gap-2 mt-0.5">
                {state.combo > 1 && (
                  <span className="flex items-center gap-1 text-accent font-bold">
                    <Zap size={12} />
                    {state.combo}x
                  </span>
                )}
                <button
                  type="button"
                  onClick={toggleSound}
                  className="p-1 hover:text-foreground transition-colors"
                  aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
                >
                  {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                </button>
              </div>
            </div>
          </div>

          {/* Storm Pressure Bar */}
          <div className="mt-2.5 flex items-center gap-2">
            <Gauge size={12} className={state.pressure > 70 ? "text-error" : "text-sub/70"} />
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-sub-alt/60"
              role="progressbar"
              aria-label="Storm threat pressure"
              aria-valuenow={state.pressure}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-150",
                  state.pressure > 75 ? "bg-error animate-pulse" : "bg-violet-400",
                )}
                style={{ width: `${state.pressure}%` }}
              />
            </div>
            <span className="font-mono text-[9px] text-sub tabular-nums">
              {state.pressure}% Threat
            </span>
          </div>

          {/* Sky with falling rain words */}
          <div className="relative flex-1 mt-1">
            {state.words.map((word) => {
              const isDanger = word.progress >= NEAR_MISS_THRESHOLD;
              const isLocked = word.id === state.lockedId;
              const lanePct = ((word.lane + 0.5) / laneCount) * 100;
              const topPct = Math.min(88, Math.max(4, word.progress * 86));

              return (
                <div
                  key={word.id}
                  className={cn(
                    "absolute -translate-x-1/2 rounded-lg border px-2.5 py-1 font-mono transition-transform duration-75 select-none",
                    isLocked
                      ? "border-violet-400 bg-background/95 ring-2 ring-violet-400/50 shadow-lg scale-105 z-20"
                      : isDanger
                        ? "border-error/80 bg-background/90 text-error shadow-error/30 animate-pulse z-10"
                        : "border-border/70 bg-background/80 text-foreground",
                  )}
                  style={{
                    left: `${lanePct}%`,
                    top: `${topPct}%`,
                  }}
                >
                  <span className="text-xs sm:text-sm font-semibold tracking-wide">
                    {word.text.split("").map((ch, idx) => {
                      const typedMatch = isLocked && idx < state.typed.length;
                      return (
                        <span
                          key={idx}
                          className={cn(
                            typedMatch
                              ? "text-violet-400 font-bold"
                              : isDanger
                                ? "text-error"
                                : "text-foreground",
                          )}
                        >
                          {ch}
                        </span>
                      );
                    })}
                  </span>
                </div>
              );
            })}

            {/* Near-miss / destroy popups */}
            {state.destroyed.map((d) => (
              <div
                key={d.seq}
                className={cn(
                  "absolute -translate-x-1/2 font-mono text-xs font-bold animate-out fade-out zoom-out-90 duration-300 pointer-events-none",
                  d.isNearMiss ? "text-amber-400 font-black text-sm drop-shadow" : "text-violet-300",
                )}
                style={{
                  left: `${((d.lane + 0.5) / laneCount) * 100}%`,
                  top: `${d.progress * 86}%`,
                }}
              >
                {d.isNearMiss ? "⚡ NEAR MISS!" : "✓ SPLASH"}
              </div>
            ))}
          </div>
        </div>

        {/* Modal overlays */}
        {!isPlaying && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/90 p-4 sm:p-6 backdrop-blur-md">
            {state.status === "idle" && (
              <UniversalStartCard
                definition={definition}
                best={best}
                onStart={handleStart}
                soundEnabled={soundEnabled}
                onToggleSound={toggleSound}
              >
                <div className="flex flex-col items-center gap-1 rounded-xl border border-violet-500/30 bg-violet-950/20 p-2.5 text-xs text-sub">
                  <span className="font-mono font-bold text-violet-300 flex items-center gap-1.5">
                    <CloudLightning size={13} />
                    Weather Progression Active
                  </span>
                  <span>5 escalating storm phases: Mist → Drizzle → Downpour → Gale Force → Hurricane</span>
                </div>
              </UniversalStartCard>
            )}

            {state.status === "paused" && (
              <PauseOverlay
                onResume={resume}
                onRestart={handleStart}
                soundEnabled={soundEnabled}
                onToggleSound={toggleSound}
              />
            )}

            {state.status === "over" && (
              <UniversalResultCard
                definition={definition}
                headline={secondsSurvived}
                isNewBest={isNewBest}
                best={best}
                previousBestScore={best?.score}
                reason="The storm claimed a word! One life ends the run."
                stats={[
                  { label: "Survived", value: `${secondsSurvived}s` },
                  { label: "Storm Phase", value: phase.phase },
                  { label: "Words Cleared", value: state.cleared },
                  { label: "Accuracy", value: `${accuracy}%` },
                  { label: "Net Speed", value: `${wpm} WPM` },
                  { label: "Near-Misses", value: state.nearMisses, sub: "Clutch Saves" },
                ]}
                onRestart={handleStart}
              />
            )}
          </div>
        )}

        {/* Hidden Input for mobile & desktop */}
        <input
          ref={inputRef}
          value={state.typed}
          onChange={(e) => setTyped(e.target.value.toLowerCase())}
          onPaste={(e) => e.preventDefault()}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === " ") e.preventDefault();
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
          aria-label="Word Rain typing input"
          className="absolute inset-0 h-full w-full cursor-text opacity-0"
          style={{ fontSize: 16 }}
        />
      </div>
    </GameViewport>
  );
}
