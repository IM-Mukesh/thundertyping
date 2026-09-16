"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Crosshair, Heart, Play, RotateCcw, Target, Trophy, Volume2, VolumeX, Zap } from "lucide-react";
import type { GameDefinition } from "@/lib/games/game-types";
import { LANE_COUNT, useFallingWords } from "@/lib/games/use-falling-words";
import { getGameBest, recordGameResult, type GameBest } from "@/lib/games/game-scores";
import { playSound } from "@/lib/games/game-audio";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { calculateAccuracy, round } from "@/lib/typing-engine/stats";
import { cn } from "@/lib/utils/cn";

// Board height is set in CSS (shorter on phones, where a keyboard eats half
// the screen) and every position below is a PERCENTAGE of it. Pixel maths tied
// the word positions to one fixed height, so the board could never be
// responsive without the words drifting away from the floor line.
const FLOOR_INSET_PCT = 10.5;

/** Words past this fraction are in the danger strip and get a warning colour. */
const DANGER_FROM = 0.74;
/**
 * How far in from each edge the outermost lane centres sit, as a percentage of
 * board width. Words are centred on their lane and can be wider than the lane
 * itself, so without this the first and last lanes clip on narrow screens.
 */
const LANE_INSET_PCT = 13;

interface FallingWordsGameProps {
  definition: GameDefinition;
}

export function FallingWordsGame({ definition }: FallingWordsGameProps) {
  // `start` already rebuilds the initial state, so "Play again" needs it
  // rather than a separate reset.
  const { state, start, resume, setTyped } = useFallingWords(definition);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lazy initialiser rather than a mount effect: this component only ever
  // renders client-side (its wrapper is next/dynamic with ssr:false), so
  // localStorage is guaranteed available and there's no server pass to
  // reconcile. One game per route, so re-reading on id change isn't a case.
  const [best, setBest] = useState<GameBest | null>(() => getGameBest(definition.id));
  const [isNewBest, setIsNewBest] = useState(false);

  // Reuses the existing persisted `soundEnabled` setting, which until now had
  // nothing wired to it, so the preference carries across games and sessions.
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);

  // Sounds are driven off state transitions rather than fired inline from
  // handlers, so every path that changes the game (a keystroke, a word landing
  // on the tick, an auto game-over) gets audio without each one remembering to
  // play it.
  const prevRef = useRef({ correct: 0, incorrect: 0, cleared: 0, missed: 0, combo: 0 });
  useEffect(() => {
    const prev = prevRef.current;
    const s = state;

    if (s.correctKeystrokes > prev.correct) playSound("key", soundEnabled);
    if (s.incorrectKeystrokes > prev.incorrect) playSound("typo", soundEnabled);
    if (s.cleared > prev.cleared) playSound("clear", soundEnabled);
    if (s.missed > prev.missed) playSound("miss", soundEnabled);
    // Milestone only — a chime on every single clear would be exhausting.
    if (s.combo > prev.combo && s.combo > 0 && s.combo % 5 === 0) playSound("combo", soundEnabled);

    prevRef.current = {
      correct: s.correctKeystrokes,
      incorrect: s.incorrectKeystrokes,
      cleared: s.cleared,
      missed: s.missed,
      combo: s.combo,
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
    // settle the run once, on the transition into "over"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const handleStart = useCallback(() => {
    setIsNewBest(false);
    // Also the user gesture that unlocks the audio context, so the first
    // keystroke of a run is already audible.
    playSound("start", soundEnabled);
    start();
    focusInput();
  }, [start, focusInput, soundEnabled]);

  const accuracy = round(calculateAccuracy(state.correctKeystrokes, state.incorrectKeystrokes));
  const seconds = Math.round(state.elapsedMs / 1000);
  const headline = definition.scoreBy === "time" ? `${seconds}` : state.score.toLocaleString();
  const isPlaying = state.status === "running";

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      {/*
        In-play chrome is numbers and icons only — no word labels. Everything
        here is still announced to screen readers through aria-label, so
        dropping the visible text costs nothing in accessibility.
      */}
      <div className="flex items-center justify-between gap-4 font-mono">
        <span
          className="text-3xl font-semibold tabular-nums text-accent arcade-glow sm:text-4xl"
          aria-label={definition.scoreBy === "time" ? `${seconds} seconds survived` : `Score ${state.score}`}
        >
          {headline}
          {definition.scoreBy === "time" && <span className="text-xl text-accent/70">s</span>}
        </span>

        <div className="flex items-center gap-4 text-sm text-sub">
          <Stat icon={<Target size={13} />} value={state.cleared} label={`${state.cleared} words cleared`} />
          <Stat icon={<Crosshair size={13} />} value={`${accuracy}%`} label={`${accuracy} percent accuracy`} />

          <span
            className={cn(
              "flex w-14 items-center justify-end gap-1 tabular-nums transition-opacity",
              state.combo > 1 ? "text-accent opacity-100" : "opacity-0",
            )}
            aria-label={state.combo > 1 ? `Combo ${state.combo}` : undefined}
          >
            <Zap size={13} />
            {state.combo}x
          </span>

          <span
            className="flex items-center gap-1"
            aria-label={`${state.lives} ${state.lives === 1 ? "life" : "lives"} remaining`}
          >
            {Array.from({ length: definition.lives }, (_, i) => (
              <Heart
                key={i}
                size={15}
                className={cn("transition-colors", i < state.lives ? "text-error" : "text-sub/25")}
                fill={i < state.lives ? "currentColor" : "none"}
              />
            ))}
          </span>

          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
            title={soundEnabled ? "Mute sound" : "Unmute sound"}
            className="-m-2 flex min-h-11 min-w-11 items-center justify-center p-2 text-sub/60 transition-colors hover:text-foreground sm:m-0 sm:min-h-0 sm:min-w-0 sm:p-0"
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>

      <div
        onClick={focusInput}
        className="relative w-full overflow-hidden rounded-2xl border border-border bg-background arcade-edge arcade-scanlines [--board-h:340px] sm:[--board-h:440px]"
        style={{ height: "var(--board-h)" }}
      >
        <div aria-hidden="true" className="absolute inset-0 arcade-haze" />
        <div aria-hidden="true" className="absolute inset-0 arcade-grid opacity-40" />

        {/* Danger strip: the closer a word gets, the more this reads as a threat. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 arcade-danger"
          style={{ height: `${FLOOR_INSET_PCT + 7}%` }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-error/50"
          style={{ top: `${100 - FLOOR_INSET_PCT + 5.5}%` }}
        />

        {state.words.map((word) => {
          const isTarget = word.id === state.lockedId;
          const matched = isTarget ? state.typed.length : 0;
          const inDanger = word.progress >= DANGER_FROM;
          return (
            <span
              key={word.id}
              className={cn(
                "absolute whitespace-nowrap font-mono text-lg tracking-tight transition-[top] ease-linear sm:text-2xl",
                isTarget
                  ? "text-foreground arcade-glow-soft"
                  : inDanger
                    ? "text-error/90"
                    : "text-sub",
              )}
              style={{
                // Matches the engine tick so stepped updates read as continuous
                // motion without running the loop at frame rate.
                transitionDuration: "50ms",
                top: `${word.progress * (100 - FLOOR_INSET_PCT)}%`,
                // Lanes are inset rather than spanning the full width. Words
                // are centred on their lane, so an outer-lane word used to
                // extend past the board edge and get clipped — a 58px word in
                // a 52px lane on a 309px phone board. Keeping lane centres
                // away from the edges leaves room for the widest words.
                left: `${LANE_INSET_PCT + (word.lane + 0.5) * ((100 - 2 * LANE_INSET_PCT) / LANE_COUNT)}%`,
                transform: "translateX(-50%)",
              }}
            >
              {matched > 0 && (
                <span className="text-accent arcade-glow">{word.text.slice(0, matched)}</span>
              )}
              {word.text.slice(matched)}
            </span>
          );
        })}

        {!isPlaying && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm">
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
          onChange={(e) => setTyped(e.target.value.toLowerCase())}
          onPaste={(e) => e.preventDefault()}
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
        Type a falling word to clear it
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
  isNewBest,
  best,
  onRestart,
}: {
  definition: GameDefinition;
  headline: string;
  cleared: number;
  bestCombo: number;
  accuracy: number;
  isNewBest: boolean;
  best: GameBest | null;
  onRestart: () => void;
}) {
  return (
    <div
      className="flex max-w-sm flex-col items-center gap-4 text-center"
      role="status"
      aria-live="polite"
    >
      {isNewBest ? (
        <span className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-accent arcade-pulse">
          <Trophy size={12} />
          New best
        </span>
      ) : (
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-sub">Run over</span>
      )}

      <div className="flex flex-col">
        <span className="font-mono text-5xl font-semibold tabular-nums text-accent arcade-glow">
          {headline}
          {definition.scoreBy === "time" && <span className="text-2xl text-accent/70">s</span>}
        </span>
      </div>

      <div className="flex items-center gap-5 font-mono text-xs tabular-nums text-sub">
        <span className="flex items-center gap-1.5">
          <Target size={12} className="text-sub/60" />
          {cleared}
        </span>
        <span className="flex items-center gap-1.5">
          <Zap size={12} className="text-sub/60" />
          {bestCombo}x
        </span>
        <span className="flex items-center gap-1.5">
          <Crosshair size={12} className="text-sub/60" />
          {accuracy}%
        </span>
        {best && !isNewBest && (
          <span className="flex items-center gap-1.5 text-accent/80">
            <Trophy size={12} />
            {definition.scoreBy === "time" ? `${best.score}s` : best.score.toLocaleString()}
          </span>
        )}
      </div>

      <ArcadeButton onClick={onRestart}>
        <RotateCcw size={15} />
        Play again
      </ArcadeButton>
    </div>
  );
}
