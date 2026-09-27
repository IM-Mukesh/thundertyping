"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Flame,
  Heart,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
  Pause,
  AlertTriangle,
  Snowflake,
} from "lucide-react";
import type { GameComponentProps } from "@/components/games/game-client";
import { useFruitFury } from "@/lib/games/fruit-fury/use-fruit-fury";
import {
  DIFFICULTY_CONFIGS,
  GameDifficulty,
  TypingMode,
  TYPING_MODES,
} from "@/lib/games/fruit-fury/fruit-fury-types";
import { getGameBest, recordGameResult, recordGameStart, type GameBest } from "@/lib/games/game-scores";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import {
  awardXp,
  bumpStat,
  checkSiteAchievements,
  grantAchievement,
} from "@/lib/profile/player-profile";
import { GAME_LIST } from "@/lib/games/game-types";
import { cn } from "@/lib/utils/cn";

export default function FruitFuryGame({ definition }: GameComponentProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>("medium");
  const [selectedTypingMode, setSelectedTypingMode] = useState<TypingMode>("all");
  const [sliceMode, setSliceMode] = useState<"touch" | "type">(() => {
    if (typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)) {
      return "touch";
    }
    return "type";
  });

  const {
    state,
    canvasRef,
    startGame,
    togglePause,
    handleKeyInput,
    handleCanvasClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    setSoundEnabled,
  } = useFruitFury(selectedDifficulty, selectedTypingMode);

  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);

  useEffect(() => {
    setSoundEnabled(soundEnabled);
  }, [soundEnabled, setSoundEnabled]);

  const [bestScore, setBestScore] = useState<GameBest | null>(() => getGameBest(definition.id));
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const recordedGameOverRef = useRef(false);

  // Focus hidden input when running in type mode
  useEffect(() => {
    if (state.status === "running" && sliceMode === "type") {
      inputRef.current?.focus();
    }
  }, [state.status, sliceMode]);

  const handleStartGame = useCallback(
    (diff: GameDifficulty, mode: TypingMode) => {
      recordGameStart(definition.id);
      startGame(diff, mode);
    },
    [definition.id, startGame],
  );

  // Global keydown handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;

      if (state.status === "running") {
        if (e.key === "Escape" || e.key === "Tab") {
          e.preventDefault();
          togglePause();
          return;
        }

        if (e.key.length === 1 && /^[a-zA-Z0-9]$/.test(e.key)) {
          e.preventDefault();
          handleKeyInput(e.key);
        }
      } else if (state.status === "idle" || state.status === "over") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleStartGame(selectedDifficulty, selectedTypingMode);
        }
      } else if (state.status === "paused") {
        if (e.key === " " || e.key === "Escape") {
          e.preventDefault();
          togglePause();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.status, handleKeyInput, togglePause, handleStartGame, selectedDifficulty, selectedTypingMode]);

  // Handle Game Over persistence, stats, achievements
  useEffect(() => {
    if (state.status !== "over") {
      recordedGameOverRef.current = false;
      return;
    }

    if (recordedGameOverRef.current) return;
    recordedGameOverRef.current = true;

    // 1. Record best score
    const { isNewBest, best } = recordGameResult(definition.id, {
      score: state.score,
      cleared: state.fruitsCleared,
      bestCombo: state.maxCombo,
      survivedMs: state.elapsedMs,
    });
    setBestScore(best);
    setIsNewRecord(isNewBest);

    // 2. Award XP
    const earnedXp = Math.max(20, Math.round(state.score / 10) + state.fruitsCleared * 5);
    awardXp(earnedXp);

    // 3. Bump stats
    bumpStat("fruit-fury", "runs", 1);
    bumpStat("fruit-fury", "fruitsSliced", state.fruitsCleared);
    bumpStat("fruit-fury", "bombsAvoided", state.bombsAvoided);
    bumpStat("fruit-fury", "highScore", state.score);

    // 4. Grant Achievements
    const newUnlocked: string[] = [];

    if (state.fruitsCleared >= 1 && grantAchievement("fruit-fury:first-slice")) {
      newUnlocked.push("First Splash");
    }
    if (state.maxCombo >= 10 && grantAchievement("fruit-fury:combo-10")) {
      newUnlocked.push("Blade Master");
    }
    if (state.isFeverActive && grantAchievement("fruit-fury:fever")) {
      newUnlocked.push("Fever Frenzy");
    }
    if (state.bombsAvoided >= 10 && grantAchievement("fruit-fury:bomb-dodger")) {
      newUnlocked.push("Defusal Expert");
    }
    if (state.level >= 5 && grantAchievement("fruit-fury:level-5")) {
      newUnlocked.push("High Velocity");
    }
    if (state.score >= 10000 && grantAchievement("fruit-fury:score-10000")) {
      newUnlocked.push("Fruit Overlord");
    }

    // Check site-wide achievements
    checkSiteAchievements(GAME_LIST.map((g) => g.id));
    setUnlockedAchievements(newUnlocked);
  }, [state, definition.id]);

  // Calculated Stats
  const accuracy = useMemo(() => {
    if (state.totalTyped === 0) return 100;
    return Math.round((state.correctTyped / state.totalTyped) * 100);
  }, [state.correctTyped, state.totalTyped]);

  const wpm = useMemo(() => {
    const minutes = Math.max(0.1, state.elapsedMs / 60000);
    return Math.round(state.correctTyped / 5 / minutes);
  }, [state.correctTyped, state.elapsedMs]);

  return (
    <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center select-none font-sans">
      {/* Hidden input for virtual keyboard support on touch devices */}
      <input
        ref={inputRef}
        type="text"
        className="pointer-events-none absolute -top-96 h-0 w-0 opacity-0"
        aria-hidden="true"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
        onChange={(e) => {
          const val = e.target.value;
          if (val.length > 0) {
            handleKeyInput(val[val.length - 1]!);
            e.target.value = "";
          }
        }}
      />

      {/* Main Arcade Frame */}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border-2 bg-stone-950 shadow-2xl transition-all duration-300",
          state.isFeverActive
            ? "border-rose-500 shadow-rose-950/70 ring-4 ring-rose-500/30"
            : state.isFrozenActive
              ? "border-sky-400 shadow-sky-950/70 ring-4 ring-sky-400/30"
              : "border-stone-800 shadow-black/90",
        )}
      >
        {/* Top In-Game HUD Bar */}
        <div className="absolute top-0 right-0 left-0 z-20 flex items-center justify-between border-b border-white/10 bg-stone-950/85 px-3 py-2 sm:px-4 sm:py-2.5 backdrop-blur-md">
          {/* Left: Score & Level */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div>
              <div className="text-[9px] sm:text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                Score
              </div>
              <div className="text-lg font-black tracking-tight text-white tabular-nums sm:text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                {state.score.toLocaleString()}
              </div>
            </div>

            <div className="hidden border-l border-white/10 pl-3 sm:block sm:pl-4">
              <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                Level
              </div>
              <div className="text-lg font-black text-emerald-400 tabular-nums sm:text-xl drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
                {state.level}
              </div>
            </div>

            <div className="hidden border-l border-white/10 pl-3 md:block sm:pl-4">
              <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                Mode
              </div>
              <div className="text-xs font-black text-rose-300 tracking-wide uppercase truncate max-w-[110px]">
                {TYPING_MODES[state.typingMode]?.label || "All Keys"}
              </div>
            </div>
          </div>

          {/* Center: Fever Meter */}
          <div className="flex max-w-[130px] flex-1 flex-col items-center px-1 sm:max-w-xs sm:px-2">
            <div className="flex w-full items-center justify-between text-[10px] sm:text-[11px] font-black tracking-wider">
              <span
                className={cn(
                  "flex items-center gap-1 uppercase transition-colors truncate",
                  state.isFeverActive
                    ? "animate-pulse text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]"
                    : state.feverGauge >= 100
                      ? "text-amber-400"
                      : "text-stone-400",
                )}
              >
                <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current shrink-0" />
                <span className="truncate">{state.isFeverActive ? "2X FEVER!" : "Fever"}</span>
              </span>
              <span className="text-stone-300 tabular-nums pl-1">
                {state.isFeverActive
                  ? `${Math.ceil(state.feverTimeRemaining / 1000)}s`
                  : `${Math.round(state.feverGauge)}%`}
              </span>
            </div>

            <div className="mt-0.5 sm:mt-1 h-2 sm:h-2.5 w-full overflow-hidden rounded-full bg-stone-900 border border-white/10 p-0.5">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-150",
                  state.isFeverActive
                    ? "bg-gradient-to-r from-amber-400 via-rose-500 to-purple-500 shadow-[0_0_14px_rgba(244,63,94,0.9)] animate-pulse"
                    : "bg-gradient-to-r from-emerald-500 to-teal-400",
                )}
                style={{
                  width: `${state.isFeverActive ? (state.feverTimeRemaining / 8000) * 100 : state.feverGauge}%`,
                }}
              />
            </div>
          </div>

          {/* Right: Lives & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Lives Hearts */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {[0, 1, 2].map((i) => (
                <Heart
                  key={i}
                  className={cn(
                    "h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200",
                    i < state.lives
                      ? "fill-rose-500 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] scale-100"
                      : "fill-stone-900 text-stone-800 scale-90",
                  )}
                />
              ))}
            </div>

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-white/10 bg-stone-900 text-stone-300 transition-colors hover:bg-stone-800 hover:text-white"
              title={soundEnabled ? "Mute audio" : "Enable audio"}
              aria-label={soundEnabled ? "Mute audio" : "Enable audio"}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            </button>

            {/* Pause Button */}
            {state.status === "running" && (
              <button
                type="button"
                onClick={togglePause}
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-white/10 bg-stone-900 text-stone-300 transition-colors hover:bg-stone-800 hover:text-white"
                title="Pause game"
                aria-label="Pause game"
              >
                <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Combo & Freeze Badges */}
        <div className="pointer-events-none absolute top-14 sm:top-16 right-3 sm:right-4 z-20 flex flex-col items-end gap-1.5 sm:gap-2">
          {state.combo >= 2 && (
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 sm:px-3.5 sm:py-1 text-[11px] sm:text-xs font-black shadow-lg backdrop-blur-md transition-all duration-200 animate-bounce",
                state.combo >= 10
                  ? "border-rose-500 bg-rose-950/85 text-rose-300 shadow-rose-900/60"
                  : state.combo >= 5
                    ? "border-amber-500 bg-amber-950/85 text-amber-300 shadow-amber-900/60"
                    : "border-sky-500 bg-sky-950/85 text-sky-300 shadow-sky-900/60",
              )}
            >
              <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
              <span>{state.combo}X COMBO</span>
            </div>
          )}

          {state.isFrozenActive && (
            <div className="flex items-center gap-1.5 rounded-full border border-sky-400 bg-sky-950/85 px-2.5 py-0.5 sm:px-3.5 sm:py-1 text-[11px] sm:text-xs font-black text-sky-300 shadow-lg shadow-sky-900/60 backdrop-blur-md">
              <Snowflake className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
              <span>FREEZE: {Math.ceil(state.frozenTimeRemaining / 1000)}s</span>
            </div>
          )}
        </div>

        {/* HTML5 Canvas Surface */}
        <div
          className="relative w-full cursor-crosshair overflow-hidden touch-none"
          style={{ height: "clamp(340px, 60dvh, 640px)" }}
          onClick={(e) => {
            handleCanvasClick(e.clientX, e.clientY);
            if (sliceMode === "type") inputRef.current?.focus();
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            if (touch) {
              handleTouchStart(touch.clientX, touch.clientY);
              if (sliceMode === "type") inputRef.current?.focus();
            }
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            if (touch) {
              handleTouchMove(touch.clientX, touch.clientY);
            }
          }}
          onTouchEnd={handleTouchEnd}
        >
          <canvas
            ref={canvasRef}
            className="h-full w-full block"
          />

          {/* Pause Overlay */}
          {state.status === "paused" && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-stone-950/85 backdrop-blur-md p-4">
              <div className="rounded-2xl border border-white/10 bg-stone-900/95 p-6 sm:p-8 text-center shadow-2xl max-w-sm">
                <div className="mb-2 text-2xl font-black tracking-tight text-white uppercase">
                  Game Paused
                </div>
                <p className="mb-5 text-sm text-stone-400">Tap Resume or press Space to continue slicing</p>
                <button
                  type="button"
                  onClick={togglePause}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-6 py-3 font-bold text-white shadow-lg shadow-rose-500/30 transition hover:scale-105 active:scale-95"
                >
                  <Play className="h-5 w-5 fill-current" />
                  Resume Slicing
                </button>
              </div>
            </div>
          )}

          {/* Start Screen Modal with Character Mascot */}
          {state.status === "idle" && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-start sm:justify-center overflow-y-auto bg-stone-950/92 p-3 sm:p-6 backdrop-blur-md">
              <div className="my-auto flex w-full max-w-lg flex-col items-center text-center py-2 sm:py-3">
                {/* Hero Mascot & Title */}
                <div className="relative mb-2 flex items-center justify-center gap-3 sm:gap-4">
                  <div className="relative h-12 w-12 sm:h-16 sm:w-16 overflow-hidden rounded-2xl border-2 border-rose-500/50 shadow-xl shadow-rose-950/50 shrink-0">
                    <Image
                      src="/games/fruit-fury/character.jpg"
                      alt="Red Panda Ninja Master"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  <div className="text-left">
                    <div className="text-2xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-400 to-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]">
                      FRUIT FURY
                    </div>
                    <div className="text-[10px] sm:text-xs font-bold tracking-widest text-stone-300 uppercase">
                      Zen Blade Typing Arcade
                    </div>
                  </div>
                </div>

                <p className="mb-2 sm:mb-3 text-xs sm:text-sm font-medium text-stone-300 max-w-md">
                  Type letters or swipe to slice flying fruits in mid-air. Defuse fatal bombs and unleash the Fever Mode frenzy!
                </p>

                {/* Control Style Toggle */}
                <div className="mb-2 sm:mb-3 flex w-full flex-col gap-1">
                  <div className="text-[10px] sm:text-[11px] font-bold tracking-widest text-stone-400 uppercase">
                    Control Style
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSliceMode("type")}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border p-2 transition-all",
                        sliceMode === "type"
                          ? "border-rose-500 bg-rose-500/20 text-rose-200 shadow-md ring-2 ring-rose-500/30"
                          : "border-stone-800 bg-stone-900/60 text-stone-400 hover:text-stone-200",
                      )}
                    >
                      <span className="text-xs sm:text-sm font-bold">⌨️ Keyboard Typing</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSliceMode("touch")}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border p-2 transition-all",
                        sliceMode === "touch"
                          ? "border-rose-500 bg-rose-500/20 text-rose-200 shadow-md ring-2 ring-rose-500/30"
                          : "border-stone-800 bg-stone-900/60 text-stone-400 hover:text-stone-200",
                      )}
                    >
                      <span className="text-xs sm:text-sm font-bold">⚔️ Touch Blade (Swipe)</span>
                    </button>
                  </div>
                </div>

                {/* Difficulty Selector */}
                <div className="mb-2 sm:mb-3 flex w-full flex-col gap-1">
                  <div className="text-[10px] sm:text-[11px] font-bold tracking-widest text-stone-400 uppercase">
                    Select Difficulty
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(["easy", "medium", "hard"] as GameDifficulty[]).map((diff) => {
                      const cfg = DIFFICULTY_CONFIGS[diff];
                      const active = selectedDifficulty === diff;
                      return (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setSelectedDifficulty(diff)}
                          className={cn(
                            "flex flex-col items-center justify-center rounded-xl border p-2 transition-all",
                            active
                              ? "border-rose-500 bg-rose-500/20 text-rose-200 shadow-md shadow-rose-950/60 ring-2 ring-rose-500/30"
                              : "border-stone-800 bg-stone-900/60 text-stone-400 hover:border-stone-700 hover:text-stone-200",
                          )}
                        >
                          <span className="text-xs sm:text-sm font-black">{cfg.label}</span>
                          <span className="mt-0.5 text-[9px] sm:text-[10px] text-stone-400 font-normal">
                            {diff === "easy"
                              ? "Beginner Arcs"
                              : diff === "medium"
                                ? "Arcade Waves"
                                : "Fierce Reflex"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Typing Practice Mode Selector */}
                <div className="mb-2 sm:mb-3 flex w-full flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold tracking-widest text-stone-400 uppercase">
                    <span>Practice Keyboard Rows</span>
                    <span className="text-rose-400 font-semibold lowercase">
                      {TYPING_MODES[selectedTypingMode].label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
                    {(Object.keys(TYPING_MODES) as TypingMode[]).map((mode) => {
                      const m = TYPING_MODES[mode];
                      const active = selectedTypingMode === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setSelectedTypingMode(mode)}
                          className={cn(
                            "flex flex-col items-center justify-center rounded-xl border p-1.5 sm:p-2 transition-all text-center",
                            active
                              ? "border-rose-500 bg-rose-500/20 text-rose-200 shadow-md shadow-rose-950/60 ring-2 ring-rose-500/30"
                              : "border-stone-800 bg-stone-900/60 text-stone-400 hover:border-stone-700 hover:text-stone-200",
                          )}
                        >
                          <span className="text-[11px] sm:text-xs font-black truncate max-w-full">
                            {m.label}
                          </span>
                          <span className="mt-0.5 text-[8px] sm:text-[9px] text-stone-400 font-mono tracking-tight truncate max-w-full">
                            {mode === "all"
                              ? "A–Z All"
                              : mode === "home"
                                ? "ASDF JKL"
                                : mode === "top"
                                  ? "QWERTY"
                                  : mode === "bottom"
                                    ? "ZXCVBN"
                                    : "0–9 Num"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Rules Pills */}
                <div className="mb-2 sm:mb-3 grid w-full grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2 text-left text-xs">
                  <div className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-900/50 p-1.5 sm:p-2">
                    <span className="text-base sm:text-xl">🍉</span>
                    <div>
                      <div className="font-bold text-white text-[11px] sm:text-xs">Slice Keys</div>
                      <div className="text-[9px] sm:text-[10px] text-stone-400">Type or tap fruit</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-rose-950/80 bg-rose-950/30 p-1.5 sm:p-2">
                    <span className="text-base sm:text-xl">💣</span>
                    <div>
                      <div className="font-bold text-rose-400 text-[11px] sm:text-xs">Fatal Bomb</div>
                      <div className="text-[9px] sm:text-[10px] text-rose-300">Instant Game Over!</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-900/50 p-1.5 sm:p-2">
                    <span className="text-base sm:text-xl">🔥</span>
                    <div>
                      <div className="font-bold text-amber-400 text-[11px] sm:text-xs">Fever 2X</div>
                      <div className="text-[9px] sm:text-[10px] text-stone-400">Score shower</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-900/50 p-1.5 sm:p-2">
                    <span className="text-base sm:text-xl">🌟</span>
                    <div>
                      <div className="font-bold text-sky-400 text-[11px] sm:text-xs">Specials</div>
                      <div className="text-[9px] sm:text-[10px] text-stone-400">Gold & Freeze</div>
                    </div>
                  </div>
                </div>

                {/* Personal Best Snapshot */}
                {bestScore && (
                  <div className="mb-2 sm:mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-stone-900/60 px-3 py-1 text-[11px] sm:text-xs text-stone-300">
                    <Trophy className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>
                      High Score:{" "}
                      <strong className="text-white">{bestScore.score.toLocaleString()}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Best Combo: <strong className="text-white">{bestScore.bestCombo}x</strong>
                    </span>
                  </div>
                )}

                {/* Start Button */}
                <button
                  type="button"
                  onClick={() => handleStartGame(selectedDifficulty, selectedTypingMode)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 px-7 py-2.5 sm:px-9 sm:py-3 text-sm sm:text-base font-black tracking-wide text-white shadow-xl shadow-rose-500/30 transition-all hover:scale-105 active:scale-95"
                >
                  <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                  <span>START SLICING</span>
                  <span className="hidden sm:inline font-bold text-xs text-rose-200 opacity-90">(SPACE)</span>
                </button>
              </div>
            </div>
          )}

          {/* Game Over Screen Modal with Victory/Defeat Backdrop */}
          {state.status === "over" && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-start sm:justify-center overflow-y-auto bg-stone-950/92 p-3 sm:p-6 backdrop-blur-md">
              {/* Cinematic Background Art */}
              <div className="pointer-events-none absolute inset-0 opacity-25">
                <Image
                  src={
                    isNewRecord
                      ? "/games/fruit-fury/victory.jpg"
                      : "/games/fruit-fury/defeat.jpg"
                  }
                  alt=""
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-stone-950/70" />
              </div>

              <div className="relative z-10 my-auto flex max-w-md flex-col items-center text-center py-2 sm:py-4">
                {/* Reason Title */}
                {state.gameOverReason === "bombed" ? (
                  <div className="mb-2 flex flex-col items-center">
                    <div className="mb-1.5 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-rose-950/90 border border-rose-500 text-rose-500 shadow-xl shadow-rose-950/70 animate-bounce">
                      <AlertTriangle className="h-5 w-5 sm:h-7 sm:w-7" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-rose-500 uppercase drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                      BOMB DETONATED!
                    </span>
                    <span className="text-[11px] sm:text-xs font-semibold text-rose-300">
                      You sliced an explosive bomb! Instant detonation.
                    </span>
                  </div>
                ) : (
                  <div className="mb-2 flex flex-col items-center">
                    <div className="mb-1.5 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-stone-900 border border-stone-700 text-stone-400 shadow-xl">
                      <Heart className="h-5 w-5 sm:h-7 sm:w-7 text-rose-500 fill-rose-500/20" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                      OUT OF LIVES!
                    </span>
                    <span className="text-[11px] sm:text-xs font-semibold text-stone-400">
                      Three fruits slipped past the bottom edge.
                    </span>
                  </div>
                )}

                {/* Score & Record Callout */}
                <div className="my-2 sm:my-3">
                  <div className="text-[10px] sm:text-xs font-bold tracking-widest text-stone-400 uppercase">
                    Final Score
                  </div>
                  <div className="text-3xl font-black tracking-tight text-white tabular-nums sm:text-5xl drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                    {state.score.toLocaleString()}
                  </div>
                  {isNewRecord && (
                    <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-amber-400 bg-amber-400/15 px-3 py-0.5 text-xs font-bold text-amber-300 animate-pulse">
                      <Sparkles className="h-3.5 w-3.5" />
                      NEW PERSONAL RECORD!
                    </div>
                  )}

                  <div className="mt-1.5 flex items-center justify-center gap-2 text-[10px] sm:text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                    <span className="text-stone-300">{TYPING_MODES[state.typingMode]?.label || "All Keys"} Mode</span>
                    <span>•</span>
                    <span className="text-rose-400">{DIFFICULTY_CONFIGS[state.difficulty].label}</span>
                  </div>
                </div>

                {/* Stat Cards Grid */}
                <div className="mb-3 sm:mb-5 grid w-full grid-cols-3 gap-1.5 sm:gap-2 text-center text-xs">
                  <div className="rounded-xl border border-stone-800 bg-stone-900/70 p-2 sm:p-2.5 backdrop-blur-sm">
                    <div className="text-[9px] sm:text-[10px] text-stone-400 uppercase font-semibold">Fruits Sliced</div>
                    <div className="mt-0.5 text-sm sm:text-base font-black text-emerald-400">
                      {state.fruitsCleared}
                    </div>
                  </div>
                  <div className="rounded-xl border border-stone-800 bg-stone-900/70 p-2 sm:p-2.5 backdrop-blur-sm">
                    <div className="text-[9px] sm:text-[10px] text-stone-400 uppercase font-semibold">Max Combo</div>
                    <div className="mt-0.5 text-sm sm:text-base font-black text-amber-400">
                      {state.maxCombo}x
                    </div>
                  </div>
                  <div className="rounded-xl border border-stone-800 bg-stone-900/70 p-2 sm:p-2.5 backdrop-blur-sm">
                    <div className="text-[9px] sm:text-[10px] text-stone-400 uppercase font-semibold">Level Reached</div>
                    <div className="mt-0.5 text-sm sm:text-base font-black text-purple-400">{state.level}</div>
                  </div>
                  <div className="rounded-xl border border-stone-800 bg-stone-900/70 p-2 sm:p-2.5 backdrop-blur-sm">
                    <div className="text-[9px] sm:text-[10px] text-stone-400 uppercase font-semibold">Accuracy</div>
                    <div className="mt-0.5 text-sm sm:text-base font-black text-white">{accuracy}%</div>
                  </div>
                  <div className="rounded-xl border border-stone-800 bg-stone-900/70 p-2 sm:p-2.5 backdrop-blur-sm">
                    <div className="text-[9px] sm:text-[10px] text-stone-400 uppercase font-semibold">Speed (WPM)</div>
                    <div className="mt-0.5 text-sm sm:text-base font-black text-white">{wpm}</div>
                  </div>
                  <div className="rounded-xl border border-stone-800 bg-stone-900/70 p-2 sm:p-2.5 backdrop-blur-sm">
                    <div className="text-[9px] sm:text-[10px] text-stone-400 uppercase font-semibold">Bombs Avoided</div>
                    <div className="mt-0.5 text-sm sm:text-base font-black text-rose-400">
                      {state.bombsAvoided}
                    </div>
                  </div>
                </div>

                {/* Achievement Toast */}
                {unlockedAchievements.length > 0 && (
                  <div className="mb-3 sm:mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-amber-400/40 bg-amber-950/40 px-3 py-1.5 text-xs text-amber-200">
                    <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>Unlocked: {unlockedAchievements.join(", ")}!</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex w-full items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleStartGame(selectedDifficulty, selectedTypingMode)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 py-2.5 sm:py-3 text-sm font-black text-white shadow-lg shadow-rose-500/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>PLAY AGAIN</span>
                    <span className="hidden sm:inline font-bold text-xs text-rose-200 opacity-90">(SPACE)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
