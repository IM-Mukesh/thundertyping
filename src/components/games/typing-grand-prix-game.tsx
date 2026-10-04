"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  Crosshair,
  Flag,
  Flame,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { GAME_LIST, type GameDefinition } from "@/lib/games/game-types";
import { awardXp, bumpStat, checkSiteAchievements } from "@/lib/profile/player-profile";
import {
  LEAD_IN_BEAT_MS,
  MUSIC,
  OPPONENT_COUNT,
  OPPONENT_IDENTITY,
  RACE_WORD_COUNT,
  TICK_MS,
  livePosition,
  raceAccuracy,
  raceStandings,
  scoredChars,
  useTypingGrandPrix,
  type GrandPrixState,
} from "@/lib/games/use-typing-grand-prix";
import { recordGameResult, recordGameStart, type GameBest } from "@/lib/games/game-scores";
import { useGameBest } from "@/lib/games/use-game-best";
import { playSound } from "@/lib/games/game-audio";
import { sound } from "@/lib/audio/game-sounds";
import { duck, playMusic, preload, stopMusic } from "@/lib/audio/audio-bus";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { calculateLiveWpm, calculateNetWpm, round } from "@/lib/typing-engine/stats";
import { cn } from "@/lib/utils/cn";
import { GameViewport } from "@/components/games/ui/game-viewport";
import { PauseOverlay } from "@/components/games/ui/game-chrome";

const LANE_COUNT = OPPONENT_COUNT + 1;
/** 3 even segments of the word list, presented as "laps" — a real, honest
 *  read of wordIndex/RACE_WORD_COUNT, not a second progress system. */
const LAP_COUNT = 3;
const VISIBLE_WORDS = 9;
/** How long a popup (overtake/overtaken/milestone) stays up. */
const POPUP_MS = 1600;

// The track art's road recedes toward a vanishing point rather than running
// flat, so cars are placed in true perspective — lerped between a "horizon"
// anchor (small, near the vanishing point) and a "near" anchor (full size,
// spread into lanes) — instead of just sliding up the image. That perspective
// is what keeps a rival grounded on the road instead of floating over it.
const HORIZON_Y = 34;
const NEAR_Y = 62;
const HORIZON_X = 55;
const NEAR_LANE_X = [20, 50, 84];
const HORIZON_SCALE = 0.22;
/** Fan angles (degrees) for the road's forward-motion streak lines. */
const STREAK_ANGLES = [-26, -15, -5, 5, 15, 26];

const ORDINALS = ["1st", "2nd", "3rd", "4th"];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** WPM performance bands for the speedometer glow — cosmetic only. */
function speedTier(wpm: number): string {
  if (wpm >= 100) return "text-error";
  if (wpm >= 80) return "text-accent";
  if (wpm >= 60) return "text-correct";
  return "text-foreground";
}

interface TypingGrandPrixGameProps {
  definition: GameDefinition;
  art?: Record<string, string | null>;
}

export function TypingGrandPrixGame({ definition, art }: TypingGrandPrixGameProps) {
  const bgArt = art?.cover ?? art?.hero ?? null;
  const playerCarArt = art?.["car-player"] ?? null;
  const rivalArt = [art?.["car-shadow"] ?? null, art?.["car-blaze"] ?? null, art?.["car-nova"] ?? null];

  const { state, start, pause, resume, setTyped, commitWord } = useTypingGrandPrix(definition);
  const inputRef = useRef<HTMLInputElement>(null);

  const best = useGameBest(definition.id);
  const [isNewBest, setIsNewBest] = useState(false);

  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);

  const position = livePosition(state);
  const now = state.elapsedMs;
  const boostActive = state.boostMs > 0;
  const overtakeFlash = state.lastOvertakeMs !== null && now - state.lastOvertakeMs < POPUP_MS;
  const overtakenFlash = state.lastOvertakenMs !== null && now - state.lastOvertakenMs < POPUP_MS;

  const lap = Math.min(LAP_COUNT, Math.floor(state.wordIndex / (RACE_WORD_COUNT / LAP_COUNT)) + 1);
  const isFinalLap = lap === LAP_COUNT;

  // ---- music -------------------------------------------------------------

  useEffect(() => {
    preload([MUSIC.race, MUSIC.finalLap]);
  }, []);

  const musicKeyRef = useRef<"race" | "final" | null>(null);
  useEffect(() => {
    if (state.status !== "running") return;
    const key = isFinalLap ? "final" : "race";
    if (musicKeyRef.current === key) return;
    musicKeyRef.current = key;
    void playMusic(key === "final" ? MUSIC.finalLap : MUSIC.race);
  }, [state.status, isFinalLap]);

  useEffect(() => {
    if (state.status === "over" || state.status === "paused") {
      musicKeyRef.current = null;
      stopMusic();
    }
  }, [state.status]);

  useEffect(() => () => stopMusic(), []);

  // ---- audio ---------------------------------------------------------------

  const prevRef = useRef({
    correct: 0,
    incorrect: 0,
    wordIndex: 0,
    position: LANE_COUNT,
    combo: 0,
    boostActive: false,
    overtakeMs: null as number | null,
    lap: 1,
  });
  useEffect(() => {
    const prev = prevRef.current;
    if (state.correctKeystrokes > prev.correct) playSound("key", soundEnabled);
    if (state.incorrectKeystrokes > prev.incorrect) {
      playSound("typo", soundEnabled);
      sound("tire-screech", soundEnabled, { volume: 0.6 });
    }
    if (state.wordIndex > prev.wordIndex) {
      playSound("clear", soundEnabled);
      sound("engine-accel", soundEnabled, { vary: 50 });
    }
    if (state.combo > prev.combo && state.combo > 0 && state.combo % 5 === 0) {
      sound("combo-milestone", soundEnabled);
    }
    if (state.lastOvertakeMs !== null && state.lastOvertakeMs !== prev.overtakeMs) {
      sound("overtake", soundEnabled);
      duck(0.5, 0.5);
    }
    // Losing a place deliberately gets no sound — a jeer every time a rival
    // edges ahead would be relentless over a whole race.
    if (!prev.boostActive && boostActive) {
      sound("boost-whoosh", soundEnabled);
      playSound("nitro", soundEnabled);
    }
    if (lap > prev.lap) sound("final-lap-alarm", soundEnabled);

    prevRef.current = {
      correct: state.correctKeystrokes,
      incorrect: state.incorrectKeystrokes,
      wordIndex: state.wordIndex,
      position,
      combo: state.combo,
      boostActive,
      overtakeMs: state.lastOvertakeMs,
      lap,
    };
  }, [state, position, soundEnabled, boostActive, lap]);

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
      cleared: state.wordIndex,
      bestCombo: state.bestCombo,
      survivedMs: Math.round(state.elapsedMs),
      wpm: round(calculateNetWpm(scoredChars(state), state.elapsedMs)),
      accuracy: round(raceAccuracy(state)),
    }, state.dnf ? "dnf" : state.place === 1 ? "won" : "finished");
    setIsNewBest(newBest);
    playSound("over", soundEnabled);
    sound(state.place === 1 ? "race-victory" : "race-defeat", soundEnabled);
    if (newBest) sound("new-record", soundEnabled);
    bumpStat(definition.id, "runs");
    awardXp(Math.round(state.score / 10) + (state.place === 1 ? 40 : 10));
    checkSiteAchievements(GAME_LIST.map((g) => g.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const [isFocused, setIsFocused] = useState(true);

  const handleStart = useCallback(() => {
    recordGameStart(definition.id);
    setIsNewBest(false);
    playSound("start", soundEnabled);
    sound("race-start", soundEnabled);
    start();
  }, [start, soundEnabled, definition.id]);

  const accuracy = round(raceAccuracy(state));
  const liveWpm = round(calculateLiveWpm(scoredChars(state), state.elapsedMs));
  const finalWpm = round(calculateNetWpm(scoredChars(state), state.elapsedMs));
  const isPlaying = state.status === "running";
  const inLeadIn = isPlaying && state.leadInMs > 0;
  const countdown = Math.max(1, Math.ceil(state.leadInMs / LEAD_IN_BEAT_MS));
  const charsToFinish = Math.max(0, Math.round((1 - state.playerProgress) * state.totalChars));

  const prevCountdownRef = useRef<number | null>(null);
  useEffect(() => {
    if (inLeadIn && countdown !== prevCountdownRef.current) {
      prevCountdownRef.current = countdown;
      playSound("countdown", soundEnabled);
    } else if (state.status === "running" && state.leadInMs === 0 && prevCountdownRef.current !== null) {
      prevCountdownRef.current = null;
      playSound("countdown-go", soundEnabled);
    }
  }, [inLeadIn, countdown, soundEnabled, state.status, state.leadInMs]);

  useEffect(() => {
    if (state.status !== "running" && state.status !== "paused") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (state.status === "running") pause();
        else resume();
      } else if (state.status === "paused" && (event.key === " " || event.key === "Enter")) {
        if (event.target instanceof HTMLElement && event.target.closest("button, a, input, select, textarea")) return;
        event.preventDefault();
        resume();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.status, pause, resume]);

  useEffect(() => {
    if (state.status === "running" && !inLeadIn) {
      focusInput();
    }
  }, [state.status, inLeadIn, focusInput]);

  useEffect(() => {
    if (state.status !== "over") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || (e.target instanceof HTMLElement && e.target.closest("button, a, input, select, textarea"))) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.status, handleStart]);

  const standings = raceStandings(state).map((racer) => ({
    ...racer,
    name: racer.isPlayer ? "You" : OPPONENT_IDENTITY[racer.id]?.name ?? `Rival ${racer.id + 1}`,
  }));

  return (
    <GameViewport
      onFocusGame={focusInput}
      isFocused={isFocused}
      isRunning={isPlaying}
      className="w-full max-w-5xl gap-3"
    >
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-border bg-background"
        style={{ height: "var(--safe-board-height, clamp(340px, 64dvh, 720px))" }}
      >
        {bgArt && (
          <Image
            src={bgArt}
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1100px"
            quality={45}
            className="object-cover opacity-80"
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 arcade-scanlines opacity-25" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/15 to-background/55"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/55 via-transparent to-transparent"
        />

        {/* ---------------------------------------------------------- HUD */}
        <div className="relative z-10 flex h-full flex-col p-3 sm:p-5">
          {/* Top row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-sub backdrop-blur-sm">
                  <Flag size={11} className="text-accent" aria-hidden="true" />
                  Lap {lap} / {LAP_COUNT}
                </span>
                <span className="flex items-center gap-1 rounded-md border border-border/60 bg-background/70 px-2 py-1 font-mono text-[10px] font-bold text-accent sm:hidden">
                  <Gauge size={10} className={speedTier(liveWpm)} />
                  {Math.round(liveWpm * 2.6)} <span className="text-[8px] font-normal text-sub">km/h</span>
                </span>
              </div>
              <span
                className="flex items-center gap-1.5 font-mono text-lg font-bold tabular-nums text-accent arcade-glow sm:text-xl"
                aria-label={state.dnf ? "Did not finish" : `Position ${position} of ${LANE_COUNT}`}
              >
                <Trophy size={15} className="text-accent/70" aria-hidden="true" />
                {state.dnf ? "DNF" : ORDINALS[position - 1] ?? `${position}th`}
              </span>
            </div>

            <div className="hidden flex-col items-center gap-1 sm:flex">
              <div
                className="h-1.5 w-56 overflow-hidden rounded-full bg-sub-alt/70"
                role="progressbar"
                aria-label="Race progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(state.playerProgress * 100)}
              >
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-150"
                  style={{ width: `${state.playerProgress * 100}%` }}
                />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-sub">
                {charsToFinish} chars to finish
              </span>
            </div>

            <div className="flex flex-col items-end gap-1 font-mono text-xs text-sub">
              <div className="flex items-center gap-3 rounded-md border border-border/60 bg-background/70 px-2.5 py-1 backdrop-blur-sm">
                <Stat icon={<Timer size={12} />} value={`${(state.elapsedMs / 1000).toFixed(1)}s`} label="Time" />
                <Stat
                  icon={<Gauge size={12} className={speedTier(liveWpm)} />}
                  value={liveWpm}
                  label={`${liveWpm} words per minute`}
                />
                <Stat icon={<Crosshair size={12} />} value={`${accuracy}%`} label={`${accuracy} percent accuracy`} />
                <span className="flex items-center gap-1 font-bold text-accent" aria-label={`Score ${state.score}`}>
                  <Trophy size={12} />
                  {state.score.toLocaleString()}
                </span>
              </div>
              {isPlaying && (
                <button type="button" onClick={pause} className="flex min-h-11 items-center gap-1 px-2" aria-label="Pause race">
                  <Pause size={13} /> Pause
                </button>
              )}
              <button
                type="button"
                onClick={toggleSound}
                aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
                title={soundEnabled ? "Mute sound" : "Unmute sound"}
                className="-m-2 flex min-h-11 min-w-11 items-center justify-center p-2 text-sub/60 transition-colors hover:text-foreground sm:m-0 sm:min-h-0 sm:min-w-0 sm:p-0"
              >
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>
            </div>
          </div>

          {/* Standings, right edge */}
          <div className="pointer-events-none absolute right-3 top-20 hidden w-36 flex-col gap-1 sm:right-5 sm:flex">
            {standings.map((s, i) => (
              <div
                key={s.id}
                className={cn(
                  "flex items-center justify-between rounded-md border px-2 py-1 font-mono text-[10px] backdrop-blur-sm",
                  s.isPlayer ? "border-accent bg-accent/10 text-accent" : "border-border/50 bg-background/60 text-sub",
                )}
              >
                <span className="flex items-center gap-1">
                  <span className="tabular-nums">{i + 1}</span>
                  {s.isPlayer ? "You" : s.name}
                </span>
                {!s.isPlayer && (
                  <span className="tabular-nums opacity-80">
                    {Math.round((s.progress - state.playerProgress) * state.totalChars)}c
                  </span>
                )}
              </div>
            ))}
          </div>

          {isFinalLap && isPlaying && !inLeadIn && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-error bg-background/85 px-4 py-1 font-mono text-xs font-bold uppercase tracking-[0.3em] text-error arcade-glow"
            >
              Final Lap
            </div>
          )}

          {/* ------------------------------------------------------ Track --- */}
          <div className="relative flex-1 overflow-hidden">
            <RoadStreaks wpm={liveWpm} active={isPlaying && !inLeadIn} />

            {/* Rival cars, grounded on the road in real perspective — lerped
                between the horizon (far) and near-lane anchors by how close
                each rival's real progress is to the player's. */}
            {state.opponents.map((o, i) => {
              const identity = OPPONENT_IDENTITY[i];
              const carArt = rivalArt[i];
              const delta = o.progress - state.playerProgress;
              const closeness = clamp01(0.5 - delta * 2.2);
              const topPct = lerp(HORIZON_Y, NEAR_Y, closeness);
              const xPct = lerp(HORIZON_X, NEAR_LANE_X[i] ?? 50, closeness);
              const scale = lerp(HORIZON_SCALE, 1, closeness);
              const spawnFade = closeness < 0.05 ? closeness / 0.05 : 1;
              const width = 150 * scale;
              return (
                <div
                  key={o.id}
                  className="absolute flex flex-col items-center gap-1 transition-[top,left] duration-150 ease-linear"
                  style={{
                    left: `${xPct}%`,
                    top: `${topPct}%`,
                    width,
                    opacity: spawnFade,
                    zIndex: 10 + Math.round(closeness * 19),
                    transitionDuration: `${TICK_MS * 3}ms`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <span
                    className="rounded-full border border-border/60 bg-background/70 px-1.5 py-0.5 font-mono uppercase tracking-wider text-sub backdrop-blur-sm"
                    style={{ fontSize: Math.max(7, 9 * scale) }}
                  >
                    {identity?.name ?? `Rival ${i + 1}`}
                  </span>
                  {carArt ? (
                    <div className="relative aspect-[3/2] w-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.4)]">
                      <div
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 mx-auto w-[62%] rounded-[50%] bg-black/50 blur-[3px]"
                        style={{ height: "16%", opacity: 0.3 + closeness * 0.4 }}
                      />
                      <Image src={carArt} alt="" fill sizes="160px" className="relative object-contain" />
                    </div>
                  ) : (
                    <div className="h-6 w-full rounded bg-sub-alt" />
                  )}
                </div>
              );
            })}

            {/* Player car — always anchored bottom-center; the camera follows you. */}
            <div
              className={cn(
                "absolute bottom-[6%] left-1/2 z-30 flex w-[42%] max-w-[280px] -translate-x-1/2 flex-col items-center transition-transform",
                overtakeFlash && "scale-[1.03]",
              )}
            >
              {playerCarArt ? (
                <div
                  className={cn(
                    "relative aspect-[3/2] w-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.5)] transition-[filter]",
                    boostActive && "brightness-125",
                  )}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 mx-auto h-[16%] w-[66%] rounded-[50%] bg-black/60 blur-[4px]"
                  />
                  <Image src={playerCarArt} alt="" fill priority sizes="360px" className="relative object-contain" />
                  {boostActive && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-1/2 opacity-70 blur-md"
                      style={{ background: "radial-gradient(60% 100% at 50% 100%, var(--accent), transparent 70%)" }}
                    />
                  )}
                </div>
              ) : (
                <div className="h-10 w-full rounded bg-accent/60" />
              )}
            </div>

            {/* Overtake / overtaken popups — real transitions only. */}
            {overtakeFlash && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 flex flex-col items-center gap-0.5 rounded-lg border border-accent bg-background/85 px-4 py-2 text-center font-mono arcade-glow"
              >
                <span className="flex items-center gap-1 text-sm font-bold uppercase tracking-widest text-accent">
                  <ChevronUp size={16} /> Overtake
                </span>
              </div>
            )}
            {overtakenFlash && !overtakeFlash && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 flex items-center gap-1 rounded-lg border border-error/60 bg-background/85 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-error"
              >
                <ChevronDown size={14} /> Position lost
              </div>
            )}

            {/* Speedometer, bottom-right of the track area. */}
            <div className="pointer-events-none absolute bottom-0 right-0 hidden flex-col items-center rounded-xl border border-border/60 bg-background/75 px-4 py-2.5 backdrop-blur-sm sm:flex">
              <span className={cn("font-mono text-3xl font-bold tabular-nums transition-colors", speedTier(liveWpm))}>
                {Math.round(liveWpm * 2.6)}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-sub">km/h</span>
            </div>

            {/* Boost + combo, bottom-left of the track area. */}
            <div className="pointer-events-none absolute bottom-0 left-0 flex flex-col gap-1.5 rounded-xl border border-border/60 bg-background/75 px-3 py-2.5 backdrop-blur-sm">
              <span className="font-mono text-[9px] uppercase tracking-wider text-sub">Score Boost · 1.6× points</span>
              <div className="flex items-center gap-1.5">
                <Zap size={11} className={cn(boostActive ? "text-accent" : "text-sub/60")} aria-hidden="true" />
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-sub-alt/70">
                  <div
                    className={cn("h-full rounded-full transition-[width]", boostActive ? "bg-accent arcade-pulse" : "bg-accent/70")}
                    style={{ width: `${boostActive ? 100 : state.boost}%`, transitionDuration: "150ms" }}
                  />
                </div>
                {boostActive && (
                  <span className="font-mono text-[9px] font-bold text-accent">{Math.ceil(state.boostMs / 1000)}s</span>
                )}
              </div>
              <span
                className={cn(
                  "flex items-center gap-1 font-mono text-xs font-bold tabular-nums transition-opacity",
                  state.combo > 1 ? "text-accent opacity-100" : "opacity-0",
                )}
              >
                <Flame size={11} />
                {state.combo}x
              </span>
            </div>
          </div>

          {/* ------------------------------------------------------- Console --- */}
          <WordStrip state={state} dimmed={!isPlaying || inLeadIn} />
        </div>

        {inLeadIn && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-background/55 backdrop-blur-[2px]">
            <span
              className="font-mono text-7xl font-semibold tabular-nums text-accent arcade-glow"
              aria-label={`Starting in ${countdown}`}
            >
              {countdown}
            </span>
          </div>
        )}

        {/* Lost focus alert */}
        {isPlaying && !inLeadIn && !isFocused && (
          <button
            type="button"
            onClick={focusInput}
            className="absolute inset-x-6 top-1/2 z-20 flex -translate-y-1/2 items-center justify-center gap-2 rounded-xl border border-accent bg-background/95 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-accent arcade-pulse shadow-xl backdrop-blur-md transition-transform hover:scale-105"
          >
            <Zap size={14} className="animate-bounce" />
            Tap to resume steering
          </button>
        )}

        {!isPlaying && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/90 p-6 backdrop-blur-sm">
            {state.status === "idle" && (
              <StartCard definition={definition} best={best} carArt={playerCarArt} onStart={handleStart} />
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
              <ResultCard
                place={state.place ?? LANE_COUNT}
                dnf={state.dnf}
                score={state.score}
                wpm={finalWpm}
                accuracy={accuracy}
                bestCombo={state.bestCombo}
                elapsedMs={state.elapsedMs}
                isNewBest={isNewBest}
                best={best}
                resultArt={state.place === 1 ? (art?.victory ?? null) : (art?.defeat ?? null)}
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
              setTyped(value.slice(0, value.indexOf(" ")));
              commitWord();
              return;
            }
            setTyped(value);
          }}
          onPaste={(e) => e.preventDefault()}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            pause();
          }}
          onKeyDown={(e) => {
            if (e.key === " ") {
              e.preventDefault();
              commitWord();
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
          className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px opacity-0"
          style={{ fontSize: 16 }}
        />
      </div>
    </GameViewport>
  );
}

/**
 * A fan of streaks racing out from the road's vanishing point toward the
 * camera — the only thing that reads as "the road is actually moving"
 * against a single static backdrop image. Speed is real, not decorative
 * filler: it's driven by the player's own live WPM, so typing faster
 * visibly speeds the road up.
 */
function RoadStreaks({ wpm, active }: { wpm: number; active: boolean }) {
  const duration = Math.max(0.5, Math.min(2.2, 2.4 - wpm / 55));
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 transition-opacity duration-500"
      style={{ opacity: active ? 1 : 0 }}
    >
      {STREAK_ANGLES.map((angle, i) => (
        <span
          key={angle}
          className="absolute"
          style={{
            left: `${HORIZON_X}%`,
            top: `${HORIZON_Y}%`,
            transform: `rotate(${angle}deg)`,
            transformOrigin: "top center",
          }}
        >
          <span
            className="gp-road-streak absolute rounded-full"
            style={{
              width: 2,
              height: 40,
              background: "linear-gradient(to bottom, color-mix(in srgb, var(--accent) 70%, transparent), transparent)",
              animationDuration: `${duration}s`,
              animationDelay: `${-(i / STREAK_ANGLES.length) * duration}s`,
            }}
          />
        </span>
      ))}
    </div>
  );
}

function WordStrip({ state, dimmed }: { state: GrandPrixState; dimmed: boolean }) {
  const active = state.words[state.wordIndex];
  const upcoming = state.words.slice(state.wordIndex + 1, state.wordIndex + VISIBLE_WORDS);

  return (
    <div
      className={cn(
        "relative mt-2 flex flex-col gap-1 rounded-xl border border-border bg-background/80 px-4 py-2.5 backdrop-blur-sm transition-opacity",
        dimmed && "opacity-45",
      )}
    >
      <p className="text-center font-mono text-[9px] uppercase tracking-[0.3em] text-sub">Type to accelerate</p>
      <div
        className="flex h-9 items-baseline gap-3 overflow-hidden whitespace-nowrap font-mono text-base min-[400px]:text-lg sm:text-2xl leading-none"
        style={{
          maskImage: "linear-gradient(to right, black 80%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, black 80%, transparent 100%)",
        }}
      >
        {active !== undefined && <ActiveWord target={active} typed={state.typed} />}
        {upcoming.map((word, i) => (
          <span key={`${state.wordIndex}-${i}`} className="text-sub/70">
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}

function ActiveWord({ target, typed }: { target: string; typed: string }) {
  const length = Math.max(target.length, typed.length);
  const nodes: ReactNode[] = [];

  for (let i = 0; i <= length; i++) {
    if (i === typed.length) {
      nodes.push(
        <span
          key="caret"
          aria-hidden="true"
          className="inline-block w-[2px] self-center bg-caret"
          style={{ height: "1.15em" }}
        />,
      );
    }
    if (i === length) break;

    const isExtra = i >= target.length;
    const char = isExtra ? typed[i] : target[i];
    const className = isExtra
      ? "text-error/70"
      : i >= typed.length
        ? "text-sub"
        : typed[i] === target[i]
          ? "text-correct"
          : "text-error underline decoration-error decoration-2 underline-offset-4";

    nodes.push(
      <span key={i} className={cn("char-instant", className)}>
        {char}
      </span>,
    );
  }

  return <span className="inline-flex items-baseline">{nodes}</span>;
}

function Stat({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) {
  return (
    <span className="flex items-center gap-1 tabular-nums" aria-label={label}>
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
  carArt,
  onStart,
}: {
  definition: GameDefinition;
  best: GameBest | null;
  carArt: string | null;
  onStart: () => void;
}) {
  return (
    <div className="flex max-w-sm flex-col items-center gap-4 text-center">
      {carArt && (
        <div className="relative aspect-[3/2] w-56">
          <Image src={carArt} alt="" fill sizes="240px" className="object-contain" />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground arcade-glow-soft">
          {definition.name}
        </h2>
        <p className="text-sm text-sub">{definition.tagline}</p>
      </div>

      <div className="flex items-center gap-5 font-mono text-[11px] uppercase tracking-wider text-sub">
        <span className="flex items-center gap-1.5">
          <Flag size={12} />
          {RACE_WORD_COUNT}
        </span>
        <span className="flex items-center gap-1.5">
          <Trophy size={12} />
          {OPPONENT_COUNT} rivals
        </span>
        {best && (
          <span className="flex items-center gap-1.5 text-accent">
            <Trophy size={12} />
            {best.score.toLocaleString()}
          </span>
        )}
      </div>

      <ArcadeButton onClick={onStart}>
        <Play size={15} />
        Start
      </ArcadeButton>

      <p className="font-mono text-[11px] uppercase tracking-wider text-sub/70">
        Space commits each word. Skips mean DNF. Clean streaks build Score Boost; Escape pauses.
      </p>
    </div>
  );
}

function ResultCard({
  place,
  dnf,
  score,
  wpm,
  accuracy,
  bestCombo,
  elapsedMs,
  isNewBest,
  best,
  resultArt,
  onRestart,
}: {
  place: number;
  dnf: boolean;
  score: number;
  wpm: number;
  accuracy: number;
  bestCombo: number;
  elapsedMs: number;
  isNewBest: boolean;
  best: GameBest | null;
  resultArt: string | null;
  onRestart: () => void;
}) {
  const seconds = (elapsedMs / 1000).toFixed(1);
  const won = !dnf && place === 1;

  return (
    <div
      className="relative flex w-full max-w-md flex-col items-center gap-3 overflow-hidden rounded-2xl border border-border p-6 text-center"
      role="status"
      aria-live="polite"
    >
      {resultArt && (
        <>
          <Image src={resultArt} alt="" fill sizes="448px" quality={45} className="object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/45" />
        </>
      )}

      <div className="relative z-10 flex flex-col items-center gap-3">
        {isNewBest ? (
          <span className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-accent arcade-pulse">
            <Trophy size={12} />
            New best
          </span>
        ) : (
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-sub">
            {dnf ? "Course incomplete" : won ? "Race won" : "Race over"}
          </span>
        )}

        <span
          className={cn(
            "font-mono text-6xl font-semibold tabular-nums",
            won ? "text-accent arcade-glow" : "text-foreground arcade-glow-soft",
          )}
          aria-label={dnf ? "Did not finish" : `Finished ${ORDINALS[place - 1] ?? `${place}th`}`}
        >
          {dnf ? "DNF" : ORDINALS[place - 1] ?? `${place}th`}
        </span>

        <span className="flex items-center gap-1.5 font-mono text-2xl font-semibold tabular-nums text-accent">
          <Trophy size={16} className="text-accent/70" aria-hidden="true" />
          {score.toLocaleString()}
        </span>

        <div className="grid grid-cols-3 gap-x-5 gap-y-2 font-mono text-xs tabular-nums text-sub">
          <ResultStat icon={<Gauge size={12} />} value={wpm} label={`${wpm} words per minute`} />
          <ResultStat icon={<Crosshair size={12} />} value={`${accuracy}%`} label={`${accuracy} percent accuracy`} />
          <ResultStat icon={<Zap size={12} />} value={`${bestCombo}x`} label={`Best combo ${bestCombo}`} />
          <ResultStat icon={<Timer size={12} />} value={`${seconds}s`} label={`${seconds} seconds`} />
          {best && !isNewBest && (
            <ResultStat icon={<Trophy size={12} />} value={best.score.toLocaleString()} label={`Best ${best.score}`} />
          )}
        </div>

        {dnf && <p className="max-w-xs text-xs text-sub">Skipped or incorrect characters left the course incomplete. Word points kept; no finish bonus.</p>}
        {!dnf && <p className="max-w-xs text-xs text-sub">Equal finish times go to the rival.</p>}

        <ArcadeButton onClick={onRestart}>
          <RotateCcw size={15} />
          Race again
        </ArcadeButton>

        <p className="font-mono text-[10px] uppercase tracking-wider text-sub/70">
          Press <kbd className="rounded border border-border bg-sub-alt/40 px-1 py-0.5 font-mono text-[9px] text-foreground">Enter</kbd> or <kbd className="rounded border border-border bg-sub-alt/40 px-1 py-0.5 font-mono text-[9px] text-foreground">Space</kbd> to race again
        </p>
      </div>
    </div>
  );
}

function ResultStat({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) {
  return (
    <span className="flex items-center justify-center gap-1.5" aria-label={`${label}: ${value}`}>
      <span className="text-sub/60" aria-hidden="true">
        {icon}
      </span>
      {typeof value === "number" ? value.toLocaleString() : value}
    </span>
  );
}
