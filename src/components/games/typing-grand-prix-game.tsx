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
  useTypingGrandPrix,
  type GrandPrixState,
} from "@/lib/games/use-typing-grand-prix";
import { getGameBest, recordGameResult, type GameBest } from "@/lib/games/game-scores";
import { playSound } from "@/lib/games/game-audio";
import { sound } from "@/lib/audio/game-sounds";
import { duck, playMusic, preload, stopMusic } from "@/lib/audio/audio-bus";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { calculateAccuracy, calculateLiveWpm, calculateNetWpm, round } from "@/lib/typing-engine/stats";
import { cn } from "@/lib/utils/cn";

const LANE_COUNT = OPPONENT_COUNT + 1;
/** 3 even segments of the word list, presented as "laps" — a real, honest
 *  read of wordIndex/RACE_WORD_COUNT, not a second progress system. */
const LAP_COUNT = 3;
const VISIBLE_WORDS = 9;
/** How long a popup (overtake/overtaken/milestone) stays up. */
const POPUP_MS = 1600;

const ORDINALS = ["1st", "2nd", "3rd", "4th"];

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

  const { state, start, resume, setTyped, commitWord } = useTypingGrandPrix(definition);
  const inputRef = useRef<HTMLInputElement>(null);

  const [best, setBest] = useState<GameBest | null>(() => getGameBest(definition.id));
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
    if (state.status === "over") {
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
    if (!prev.boostActive && boostActive) sound("boost-whoosh", soundEnabled);
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

    const { isNewBest: newBest, best: stored } = recordGameResult(definition.id, {
      score: state.score,
      cleared: state.wordIndex,
      bestCombo: state.bestCombo,
      survivedMs: state.elapsedMs,
    });
    setIsNewBest(newBest);
    setBest(stored);
    playSound("over", soundEnabled);
    sound(state.place === 1 ? "race-victory" : "race-defeat", soundEnabled);
    if (newBest) sound("new-record", soundEnabled);
    bumpStat(definition.id, "runs");
    awardXp(Math.round(state.score / 10) + (state.place === 1 ? 40 : 10));
    checkSiteAchievements(GAME_LIST.map((g) => g.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const handleStart = useCallback(() => {
    setIsNewBest(false);
    playSound("start", soundEnabled);
    sound("race-start", soundEnabled);
    start();
    focusInput();
  }, [start, focusInput, soundEnabled]);

  const accuracy = round(
    calculateAccuracy(state.correctKeystrokes, state.incorrectKeystrokes, state.missedChars),
  );
  const liveWpm = round(calculateLiveWpm(state.correctKeystrokes, state.elapsedMs));
  const finalWpm = round(calculateNetWpm(state.correctKeystrokes, state.elapsedMs));
  const isPlaying = state.status === "running";
  const inLeadIn = isPlaying && state.leadInMs > 0;
  const countdown = Math.max(1, Math.ceil(state.leadInMs / LEAD_IN_BEAT_MS));
  const charsToFinish = Math.max(0, Math.round((1 - state.playerProgress) * state.totalChars));

  const standings = [
    { id: -1, name: "You", isPlayer: true, progress: state.playerProgress },
    ...state.opponents.map((o, i) => ({ id: o.id, name: OPPONENT_IDENTITY[i]?.name ?? `Rival ${i + 1}`, isPlayer: false, progress: o.progress })),
  ].sort((a, b) => b.progress - a.progress);

  return (
    <div className="flex w-full max-w-5xl flex-col gap-3" onClick={focusInput}>
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-border bg-background"
        style={{ height: "clamp(480px, 80vh, 760px)" }}
      >
        {bgArt && (
          <Image
            src={bgArt}
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1100px"
            quality={62}
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
              <span className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-sub backdrop-blur-sm">
                <Flag size={11} className="text-accent" aria-hidden="true" />
                Lap {lap} / {LAP_COUNT}
              </span>
              <span
                className="flex items-center gap-1.5 font-mono text-lg font-bold tabular-nums text-accent arcade-glow sm:text-xl"
                aria-label={`Position ${position} of ${LANE_COUNT}`}
              >
                <Trophy size={15} className="text-accent/70" aria-hidden="true" />
                {ORDINALS[position - 1] ?? `${position}th`}
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
          <div className="relative flex-1">
            {/* Rival cars, positioned by real progress relative to the player. */}
            {state.opponents.map((o, i) => {
              const identity = OPPONENT_IDENTITY[i];
              const carArt = rivalArt[i];
              const delta = o.progress - state.playerProgress;
              const laneX = [24, 52, 78][i] ?? 50;
              const topPct = Math.max(8, Math.min(58, 30 - delta * 160));
              const scale = Math.max(0.5, Math.min(1.05, 1 - delta * 2.4));
              return (
                <div
                  key={o.id}
                  className="absolute flex flex-col items-center gap-1 transition-[top,left] duration-150 ease-linear"
                  style={{
                    left: `${laneX}%`,
                    top: `${topPct}%`,
                    width: 120 * scale,
                    transitionDuration: `${TICK_MS * 3}ms`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <span className="rounded-full border border-border/60 bg-background/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-sub backdrop-blur-sm">
                    {identity?.name ?? `Rival ${i + 1}`}
                  </span>
                  {carArt ? (
                    <div className="relative aspect-[3/2] w-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.4)]">
                      <Image src={carArt} alt="" fill sizes="160px" className="object-contain" />
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
                "absolute bottom-[6%] left-1/2 flex w-[42%] max-w-[280px] -translate-x-1/2 flex-col items-center transition-transform",
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
                  <Image src={playerCarArt} alt="" fill priority sizes="360px" className="object-contain" />
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

        {!isPlaying && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/90 p-6 backdrop-blur-sm">
            {state.status === "idle" && (
              <StartCard definition={definition} best={best} carArt={playerCarArt} onStart={handleStart} />
            )}
            {state.status === "paused" && (
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="font-mono text-lg font-semibold uppercase tracking-[0.2em] text-foreground">
                  Paused
                </p>
                <ArcadeButton
                  onClick={() => {
                    resume();
                    focusInput();
                  }}
                >
                  <Play size={15} />
                  Resume
                </ArcadeButton>
              </div>
            )}
            {state.status === "over" && (
              <ResultCard
                place={state.place ?? LANE_COUNT}
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
          aria-label={`${definition.name} typing input`}
          className="absolute inset-0 h-full w-full cursor-text opacity-0"
          style={{ fontSize: 16 }}
        />
      </div>
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
        className="flex h-9 items-baseline gap-3 overflow-hidden whitespace-nowrap font-mono text-xl leading-none sm:text-2xl"
        style={{
          maskImage: "linear-gradient(to right, black 72%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, black 72%, transparent 100%)",
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
        Space commits each word — clean streaks build Boost
      </p>
    </div>
  );
}

function ResultCard({
  place,
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
  const won = place === 1;

  return (
    <div
      className="relative flex w-full max-w-md flex-col items-center gap-3 overflow-hidden rounded-2xl border border-border p-6 text-center"
      role="status"
      aria-live="polite"
    >
      {resultArt && (
        <>
          <Image src={resultArt} alt="" fill sizes="448px" quality={65} className="object-cover opacity-50" />
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
            {won ? "Race won" : "Race over"}
          </span>
        )}

        <span
          className={cn(
            "font-mono text-6xl font-semibold tabular-nums",
            won ? "text-accent arcade-glow" : "text-foreground arcade-glow-soft",
          )}
          aria-label={`Finished ${ORDINALS[place - 1] ?? `${place}th`}`}
        >
          {ORDINALS[place - 1] ?? `${place}th`}
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

        {!won && <p className="max-w-xs text-xs italic text-sub">Can you take the lead?</p>}

        <ArcadeButton onClick={onRestart}>
          <RotateCcw size={15} />
          Race again
        </ArcadeButton>
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
