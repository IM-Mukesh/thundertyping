"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import {
  Crosshair,
  Flame,
  Gauge,
  Heart,
  Play,
  RotateCcw,
  Target,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { GAME_LIST, type GameDefinition } from "@/lib/games/game-types";
import {
  DESTROY_EFFECT_MS,
  MISS_FLASH_MS,
  useFallingWords,
  type WordKind,
} from "@/lib/games/use-falling-words";
import { getGameBest, recordGameResult, recordGameStart, type GameBest } from "@/lib/games/game-scores";
import { awardXp, bumpStat, checkSiteAchievements } from "@/lib/profile/player-profile";
import { playSound } from "@/lib/games/game-audio";
import { sound } from "@/lib/audio/game-sounds";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { calculateAccuracy, calculateNetWpm, round } from "@/lib/typing-engine/stats";
import { cn } from "@/lib/utils/cn";

// Board height is a PERCENTAGE-based layout (see FLOOR_INSET_PCT etc below),
// so the real pixel height only needs to fit the viewport — clamp() instead
// of a fixed per-breakpoint value, so it scales to the window instead of
// overflowing a shorter laptop screen or looking small on a tall monitor.
const FLOOR_INSET_PCT = 10.5;
/** Keeps newly spawned words below the HUD row so text is never obscured. */
const TOP_INSET_PCT = 14;
const PLAYABLE_HEIGHT_PCT = 100 - FLOOR_INSET_PCT - TOP_INSET_PCT;

/** Words past this fraction are in the danger strip and get a warning colour. */
const DANGER_FROM = 0.74;
/**
 * How far in from each edge the outermost lane centres sit, as a percentage of
 * board width. Words are centred on their lane and can be wider than the lane
 * itself, so without this the first and last lanes clip on narrow screens.
 */
const LANE_INSET_PCT = 13;

/** WPM performance bands — purely a colour cue, never gates anything. */
function wpmBand(wpm: number): { label: string; className: string } {
  if (wpm >= 100) return { label: "Extreme", className: "text-error" };
  if (wpm >= 80) return { label: "Elite", className: "text-accent" };
  if (wpm >= 60) return { label: "Fast", className: "text-correct" };
  if (wpm >= 40) return { label: "Stable", className: "text-foreground" };
  return { label: "Warming up", className: "text-sub" };
}

const KIND_STYLES: Record<WordKind, { text: string; chip: string }> = {
  normal: { text: "text-foreground", chip: "border-border/60" },
  elite: { text: "text-error", chip: "border-error/70" },
  golden: { text: "text-accent", chip: "border-accent" },
};

/** Milestones are rare (seconds-to-minutes apart), so plain component state
 *  is fine here — the AnimatePresence-unmount pitfall this codebase has hit
 *  before only bites state that re-keys several times a second, which this
 *  never does. */
const TIME_MILESTONES_MS = [30_000, 60_000, 120_000, 180_000, 300_000, 600_000];
const CLEARED_MILESTONES = [100, 250, 500, 1000];
const SCORE_MILESTONES = [5000, 10_000, 25_000, 50_000];

function formatMs(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface FallingWordsGameProps {
  definition: GameDefinition;
  art?: Record<string, string | null>;
}

export function FallingWordsGame({ definition, art }: FallingWordsGameProps) {
  const bgArt = art?.hero ?? art?.cover ?? null;
  const playerArt = art?.["char-fg"] ?? null;

  const [laneCount, setLaneCount] = useState(6);
  useEffect(() => {
    const updateLanes = () => {
      setLaneCount(window.innerWidth < 640 ? 4 : 6);
    };
    updateLanes();
    window.addEventListener("resize", updateLanes);
    return () => window.removeEventListener("resize", updateLanes);
  }, []);

  // `start` already rebuilds the initial state, so "Play again" needs it
  // rather than a separate reset.
  const { state, start, resume, setTyped } = useFallingWords(definition, { laneCount });
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(true);

  const [best, setBest] = useState<GameBest | null>(() => getGameBest(definition.id));
  const [isNewBest, setIsNewBest] = useState(false);

  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);

  const now = state.elapsedMs;
  const missFlash = state.lastMissMs !== null && now - state.lastMissMs < MISS_FLASH_MS;
  const overdriveActive = state.overdriveMs > 0;
  const hasDangerWord = state.words.some((w) => w.progress >= DANGER_FROM);
  const urgentAlert = (state.lives === 1 || definition.id === "word-rain") && hasDangerWord;

  // ---- live performance ----------------------------------------------------

  const accuracy = round(calculateAccuracy(state.correctKeystrokes, state.incorrectKeystrokes));
  const wpm = round(calculateNetWpm(state.correctKeystrokes, Math.max(state.elapsedMs, 1000)));
  const band = wpmBand(wpm);

  // ---- milestones ------------------------------------------------------

  const [milestone, setMilestone] = useState<string | null>(null);
  const milestoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenTimeRef = useRef(new Set<number>());
  const seenClearedRef = useRef(new Set<number>());
  const seenScoreRef = useRef(new Set<number>());

  const announceMilestone = useCallback((text: string) => {
    setMilestone(text);
    if (milestoneTimerRef.current) clearTimeout(milestoneTimerRef.current);
    milestoneTimerRef.current = setTimeout(() => setMilestone(null), 2200);
    sound("chest-open", soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    if (state.status !== "running") return;
    for (const t of TIME_MILESTONES_MS) {
      if (state.elapsedMs >= t && !seenTimeRef.current.has(t)) {
        seenTimeRef.current.add(t);
        announceMilestone(`${formatMs(t)} survived`);
      }
    }
    for (const c of CLEARED_MILESTONES) {
      if (state.cleared >= c && !seenClearedRef.current.has(c)) {
        seenClearedRef.current.add(c);
        announceMilestone(`${c} targets destroyed`);
      }
    }
    for (const sc of SCORE_MILESTONES) {
      if (state.score >= sc && !seenScoreRef.current.has(sc)) {
        seenScoreRef.current.add(sc);
        announceMilestone(`${sc.toLocaleString()} score`);
      }
    }
  }, [state.status, state.elapsedMs, state.cleared, state.score, announceMilestone]);

  // ---- audio ----------------------------------------------------------

  const prevRef = useRef({
    correct: 0,
    incorrect: 0,
    cleared: 0,
    missed: 0,
    combo: 0,
    overdriveActive: false,
  });
  useEffect(() => {
    const prev = prevRef.current;
    const s = state;

    if (s.correctKeystrokes > prev.correct) playSound("key", soundEnabled);
    if (s.incorrectKeystrokes > prev.incorrect) playSound("typo", soundEnabled);
    if (s.cleared > prev.cleared) {
      playSound("clear", soundEnabled);
      sound("enemy-death", soundEnabled, { vary: 70 });
    }
    if (s.missed > prev.missed) {
      playSound("miss", soundEnabled);
      sound("player-hurt", soundEnabled, { volume: 0.5 });
    }
    // Milestone only — a chime on every single clear would be exhausting.
    if (s.combo > prev.combo && s.combo > 0 && s.combo % 5 === 0) {
      playSound("combo", soundEnabled);
      sound("combo-milestone", soundEnabled);
    }
    if (s.overdriveMs > 0 && !prev.overdriveActive) sound("level-up", soundEnabled);

    prevRef.current = {
      correct: s.correctKeystrokes,
      incorrect: s.incorrectKeystrokes,
      cleared: s.cleared,
      missed: s.missed,
      combo: s.combo,
      overdriveActive: s.overdriveMs > 0,
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

    const headline = definition.scoreBy === "time" ? Math.round(state.elapsedMs / 1000) : state.score;
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
    seenTimeRef.current.clear();
    seenClearedRef.current.clear();
    seenScoreRef.current.clear();
    // Also the user gesture that unlocks the audio context, so the first
    // keystroke of a run is already audible.
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

  const seconds = Math.round(state.elapsedMs / 1000);
  const headline = definition.scoreBy === "time" ? `${seconds}` : state.score.toLocaleString();
  const isPlaying = state.status === "running";

  return (
    <div className="flex w-full max-w-4xl flex-col gap-3">
      <div
        onClick={focusInput}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border border-border bg-background arcade-edge transition-all duration-300",
          overdriveActive && "border-accent ring-2 ring-accent/30",
          urgentAlert && "border-error ring-2 ring-error/60 arcade-pulse",
        )}
        style={{ height: "clamp(320px, 68dvh, 720px)", maxHeight: "min(720px, 86vh)" }}
      >
        {bgArt && (
          <Image
            src={bgArt}
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1000px"
            quality={45}
            className={cn("object-cover transition-[opacity,filter] duration-500", overdriveActive ? "opacity-90 saturate-150" : "opacity-55")}
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 arcade-scanlines opacity-30" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/25 to-background/55"
        />

        {/* Overdrive tint — a warm gold wash across the whole sky while it's active. */}
        {overdriveActive && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-opacity duration-500"
            style={{ background: "linear-gradient(to bottom, color-mix(in srgb, var(--accent) 18%, transparent), transparent 60%)" }}
          />
        )}

        {/* Impact flash — the ground floods red the instant something lands. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 arcade-danger transition-opacity duration-200"
          style={{ height: `${FLOOR_INSET_PCT + 7}%`, opacity: missFlash ? 1 : 0.5 }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-error/50"
          style={{ top: `${100 - FLOOR_INSET_PCT + 5.5}%` }}
        />

        {/* ---------------------------------------------------------- HUD */}
        <div className="relative z-10 flex h-full flex-col p-3 sm:p-4">
          {/* Top stat row — every value here is real game state. */}
          <div className="flex items-start justify-between gap-2 font-mono">
            <div className="flex flex-col gap-1">
              <span
                className="text-2xl font-bold tabular-nums text-accent arcade-glow sm:text-3xl"
                aria-label={definition.scoreBy === "time" ? `${seconds} seconds survived` : `Score ${state.score}`}
              >
                {headline}
                {definition.scoreBy === "time" && <span className="text-lg text-accent/70">s</span>}
              </span>
              <span
                className="flex items-center gap-1"
                aria-label={`${state.lives} ${state.lives === 1 ? "life" : "lives"} remaining`}
              >
                {Array.from({ length: definition.lives }, (_, i) => (
                  <Heart
                    key={i}
                    size={14}
                    className={cn("transition-colors", i < state.lives ? "text-error" : "text-sub/25")}
                    fill={i < state.lives ? "currentColor" : "none"}
                  />
                ))}
              </span>
            </div>

            {/* The performance panel — WPM is the headline metric here, never
                buried in a results screen. */}
            <div className="flex flex-col items-center gap-0.5 rounded-lg border border-border/60 bg-background/70 px-3 py-1.5 backdrop-blur-sm">
              <span className={cn("text-xl font-bold tabular-nums transition-colors sm:text-2xl", band.className)}>
                {wpm}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-sub">wpm · {band.label}</span>
            </div>

            <div className="flex flex-col items-end gap-1 text-xs text-sub">
              <Stat icon={<Crosshair size={12} />} value={`${accuracy}%`} label={`${accuracy} percent accuracy`} />
              <Stat icon={<Target size={12} />} value={state.cleared} label={`${state.cleared} targets destroyed`} />
              <span
                className={cn(
                  "flex items-center gap-1 font-semibold tabular-nums transition-opacity",
                  state.combo > 1 ? "text-accent opacity-100" : "opacity-0",
                )}
                aria-label={state.combo > 1 ? `Combo ${state.combo}` : undefined}
              >
                <Zap size={12} />
                {state.combo}x
              </span>
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

          {/* Fever / Overdrive meter. */}
          <div className="mt-2 flex items-center gap-2">
            <Flame size={12} className={cn(overdriveActive ? "text-accent" : "text-sub/60")} aria-hidden="true" />
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-sub-alt/70"
              role="progressbar"
              aria-label="Overdrive charge"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={overdriveActive ? 100 : Math.round(state.fever)}
            >
              <div
                className={cn("h-full rounded-full transition-[width]", overdriveActive ? "bg-accent arcade-pulse" : "bg-accent/70")}
                style={{ width: `${overdriveActive ? 100 : state.fever}%`, transitionDuration: "150ms" }}
              />
            </div>
            {overdriveActive && (
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent arcade-glow">
                Overdrive {Math.ceil(state.overdriveMs / 1000)}s
              </span>
            )}
          </div>

          {/* -------------------------------------------------------- Sky --- */}
          <div className="relative flex-1">
            {state.words.map((word) => {
              const isTarget = word.id === state.lockedId;
              const matched = isTarget ? state.typed.length : 0;
              const inDanger = word.progress >= DANGER_FROM;
              const kindStyle = KIND_STYLES[word.kind];
              return (
                <span
                  key={word.id}
                  className={cn(
                    "absolute whitespace-nowrap font-mono text-xs tracking-tight transition-[top] ease-linear sm:text-base md:text-lg",
                    "rounded-md border bg-background/85 px-1.5 py-0.5 shadow-sm backdrop-blur-[2px]",
                    // The border/glow says "this is locked in" — the text
                    // colour is reserved for "this character is typed",
                    // never for the word as a whole.
                    isTarget ? "border-accent ring-2 ring-accent/40 arcade-glow" : inDanger ? "border-error/70" : kindStyle.chip,
                    inDanger ? "text-error" : "text-foreground",
                    !isTarget && !inDanger && kindStyle.text,
                    word.kind === "golden" && !isTarget && "arcade-pulse",
                  )}
                  style={{
                    // Matches the engine tick so stepped updates read as
                    // continuous motion without running the loop at frame rate.
                    transitionDuration: "50ms",
                    top: `${TOP_INSET_PCT + word.progress * PLAYABLE_HEIGHT_PCT}%`,
                    left: `${LANE_INSET_PCT + (word.lane + 0.5) * ((100 - 2 * LANE_INSET_PCT) / laneCount)}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  {word.kind === "elite" && !isTarget && <Flame size={10} className="mr-1 inline text-error" aria-hidden="true" />}
                  {matched > 0 && (
                    <span className="text-accent font-semibold arcade-glow">{word.text.slice(0, matched)}</span>
                  )}
                  {word.text.slice(matched)}
                </span>
              );
            })}

            {/* Destroy bursts + real per-word score popups. */}
            {state.destroyed.map((hit) => {
              const t = (now - hit.bornMs) / DESTROY_EFFECT_MS;
              const y = TOP_INSET_PCT + hit.progress * PLAYABLE_HEIGHT_PCT;
              const x = LANE_INSET_PCT + (hit.lane + 0.5) * ((100 - 2 * LANE_INSET_PCT) / laneCount);
              const color = hit.kind === "golden" ? "var(--accent)" : hit.kind === "elite" ? "var(--error)" : "var(--correct)";
              return (
                <div key={hit.seq} aria-hidden="true" className="pointer-events-none absolute" style={{ left: `${x}%`, top: `${y}%` }}>
                  <span
                    className="absolute rounded-full border-2"
                    style={{
                      borderColor: color,
                      width: 30,
                      height: 30,
                      marginLeft: -15,
                      marginTop: -15,
                      opacity: 1 - t,
                      transform: `scale(${0.6 + t * 1.2})`,
                    }}
                  />
                  <span
                    className="absolute font-mono text-xs font-bold tabular-nums"
                    style={{
                      color,
                      transform: `translate(-50%, calc(-50% - ${t * 22}px))`,
                      opacity: 1 - t,
                    }}
                  >
                    +{hit.points}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone banner. */}
        {milestone && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[14%] z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-accent bg-background/85 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent arcade-glow"
          >
            Milestone — {milestone}
          </div>
        )}

        {/* Player, anchored to the defense line. */}
        {playerArt && (
          <div className="pointer-events-none absolute bottom-0 left-1/2 z-10 h-[22%] w-20 -translate-x-1/2 opacity-95 sm:w-28 md:w-32">
            <Image src={playerArt} alt="" fill sizes="160px" className="object-contain object-bottom" />
          </div>
        )}

        {/* Lost focus indicator */}
        {isPlaying && !isFocused && (
          <button
            type="button"
            onClick={focusInput}
            className="absolute inset-x-6 top-1/2 z-20 flex -translate-y-1/2 items-center justify-center gap-2 rounded-xl border border-accent bg-background/95 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-accent arcade-pulse shadow-xl backdrop-blur-md transition-transform hover:scale-105"
          >
            <Zap size={14} className="animate-bounce" />
            Tap to resume typing
          </button>
        )}

        {!isPlaying && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/90 p-6 backdrop-blur-sm">
            {state.status === "idle" && (
              <StartCard definition={definition} best={best} onStart={handleStart} />
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
              <GameOverCard
                definition={definition}
                headline={headline}
                cleared={state.cleared}
                bestCombo={state.bestCombo}
                accuracy={accuracy}
                wpm={wpm}
                survivedMs={state.elapsedMs}
                isNewBest={isNewBest}
                best={best}
                resultArt={isNewBest ? (art?.victory ?? null) : (art?.defeat ?? null)}
                onRestart={handleStart}
              />
            )}
          </div>
        )}

        <input
          ref={inputRef}
          value={state.typed}
          onChange={(e) => setTyped(e.target.value.toLowerCase())}
          onPaste={(e) => e.preventDefault()}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            // Space never commits here — a word clears the instant it matches —
            // so swallow it rather than letting it scroll the page.
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
          aria-label={`${definition.name} typing input`}
          className="absolute inset-0 h-full w-full cursor-text opacity-0"
          style={{ fontSize: 16 }}
        />
      </div>
    </div>
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
    <div className="flex max-w-sm flex-col items-center gap-5 text-center">
      <div className="flex flex-col gap-1.5">
        <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground arcade-glow-soft">
          {definition.name}
        </h2>
        <p className="text-sm text-sub">{definition.tagline}</p>
      </div>

      <div className="flex items-center gap-5 font-mono text-[11px] uppercase tracking-wider text-sub">
        <span className="flex items-center gap-1.5">
          <Heart size={12} className="text-error" />
          {definition.lives} {definition.lives === 1 ? "life" : "lives"}
        </span>
        {best && (
          <span className="flex items-center gap-1.5 text-accent">
            <Trophy size={12} />
            {definition.scoreBy === "time" ? `${best.score}s` : best.score.toLocaleString()}
          </span>
        )}
      </div>

      <ArcadeButton onClick={onStart}>
        <Play size={15} />
        Start
      </ArcadeButton>

      <p className="font-mono text-[11px] uppercase tracking-wider text-sub/70">
        Type a falling target to destroy it — gold and marked targets are worth more
      </p>
    </div>
  );
}

function GameOverCard({
  definition,
  headline,
  cleared,
  bestCombo,
  accuracy,
  wpm,
  survivedMs,
  isNewBest,
  best,
  resultArt,
  onRestart,
}: {
  definition: GameDefinition;
  headline: string;
  cleared: number;
  bestCombo: number;
  accuracy: number;
  wpm: number;
  survivedMs: number;
  isNewBest: boolean;
  best: GameBest | null;
  resultArt: string | null;
  onRestart: () => void;
}) {
  return (
    <div
      className="relative flex w-full max-w-md flex-col items-center gap-4 overflow-hidden rounded-2xl border border-border p-6 text-center"
      role="status"
      aria-live="polite"
    >
      {resultArt && (
        <>
          <Image src={resultArt} alt="" fill sizes="448px" quality={45} className="object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/45" />
        </>
      )}

      <div className="relative z-10 flex flex-col items-center gap-4">
        {isNewBest ? (
          <span className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-accent arcade-pulse">
            <Trophy size={12} />
            New personal best
          </span>
        ) : (
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-sub">Defense breached</span>
        )}

        <div className="flex flex-col">
          <span className="font-mono text-5xl font-semibold tabular-nums text-accent arcade-glow">
            {headline}
            {definition.scoreBy === "time" && <span className="text-2xl text-accent/70">s</span>}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-x-5 gap-y-2 font-mono text-xs tabular-nums text-sub">
          <ResultStat icon={<Gauge size={12} />} value={`${wpm}`} label={`${wpm} words per minute`} />
          <ResultStat icon={<Crosshair size={12} />} value={`${accuracy}%`} label={`${accuracy} percent accuracy`} />
          <ResultStat icon={<Zap size={12} />} value={`${bestCombo}x`} label={`Best combo ${bestCombo}`} />
          <ResultStat icon={<Target size={12} />} value={cleared} label={`${cleared} targets destroyed`} />
          <ResultStat icon={<Flame size={12} />} value={formatMs(survivedMs)} label={`Survived ${formatMs(survivedMs)}`} />
          {best && !isNewBest && (
            <ResultStat
              icon={<Trophy size={12} />}
              value={definition.scoreBy === "time" ? `${best.score}s` : best.score.toLocaleString()}
              label={`Best ${best.score}`}
            />
          )}
        </div>

        <p className="max-w-xs text-xs italic text-sub">Can you survive longer?</p>

        <ArcadeButton onClick={onRestart}>
          <RotateCcw size={15} />
          Play again
        </ArcadeButton>

        <p className="font-mono text-[10px] uppercase tracking-wider text-sub/70">
          Press <kbd className="rounded border border-border bg-sub-alt/40 px-1 py-0.5 font-mono text-[9px] text-foreground">Enter</kbd> or <kbd className="rounded border border-border bg-sub-alt/40 px-1 py-0.5 font-mono text-[9px] text-foreground">Space</kbd> to restart
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
