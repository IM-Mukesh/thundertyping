"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Crosshair,
  Play,
  RotateCcw,
  SkipForward,
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
  START_TIME_MS,
  TICK_MS,
  useComboRush,
} from "@/lib/games/use-combo-rush";
import { getGameBest, recordGameResult, type GameBest } from "@/lib/games/game-scores";
import { playSound } from "@/lib/games/game-audio";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { calculateAccuracy, round } from "@/lib/typing-engine/stats";
import { cn } from "@/lib/utils/cn";

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
`;

interface ComboRushGameProps {
  definition: GameDefinition;
}

export function ComboRushGame({ definition }: ComboRushGameProps) {
  // `start` rebuilds the initial state itself, so "Play again" reuses it
  // rather than needing a separate reset.
  const { state, start, resume, setTyped, skip } = useComboRush(definition);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lazy initialiser rather than a mount effect: this component only ever
  // renders client-side (its wrapper is next/dynamic with ssr:false), so
  // localStorage is guaranteed available and there is no server pass to
  // reconcile.
  const [best, setBest] = useState<GameBest | null>(() => getGameBest(definition.id));
  const [isNewBest, setIsNewBest] = useState(false);

  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);

  // Sounds are driven off state transitions rather than fired inline from
  // handlers, so every path that changes the run — a keystroke, a skip, the
  // clock hitting zero on a tick — gets audio without each one remembering.
  const prevRef = useRef({ correct: 0, incorrect: 0, cleared: 0, skipped: 0, combo: 0 });
  useEffect(() => {
    const prev = prevRef.current;
    const s = state;

    if (s.correctKeystrokes > prev.correct) playSound("key", soundEnabled);
    if (s.incorrectKeystrokes > prev.incorrect) playSound("typo", soundEnabled);
    if (s.cleared > prev.cleared) playSound("clear", soundEnabled);
    if (s.skipped > prev.skipped) playSound("miss", soundEnabled);
    // Milestone only — a chime on every clear would be exhausting at this pace.
    if (s.combo > prev.combo && s.combo > 0 && s.combo % 5 === 0) playSound("combo", soundEnabled);

    prevRef.current = {
      correct: s.correctKeystrokes,
      incorrect: s.incorrectKeystrokes,
      cleared: s.cleared,
      skipped: s.skipped,
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

    const { isNewBest: newBest, best: stored } = recordGameResult(definition.id, {
      score: state.score,
      cleared: state.cleared,
      bestCombo: state.bestCombo,
      survivedMs: state.elapsedMs,
    });
    setIsNewBest(newBest);
    setBest(stored);
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
    setIsNewBest(false);
    // Also the user gesture that unlocks the audio context, so the first
    // keystroke of a run is already audible.
    playSound("start", soundEnabled);
    start();
    focusInput();
  }, [start, focusInput, soundEnabled]);

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

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <style>{COMBO_RUSH_CSS}</style>

      {/*
        In-play chrome is numbers and icons only — no word labels. Everything
        is still announced through aria-label, so dropping the visible text
        costs nothing for screen readers.
      */}
      <div className="flex items-center justify-between gap-4 font-mono">
        <span
          className="text-3xl font-semibold tabular-nums text-accent arcade-glow sm:text-4xl"
          aria-label={`Score ${state.score}`}
        >
          {state.score.toLocaleString()}
        </span>

        <div className="flex items-center gap-4 text-sm text-sub">
          <Stat icon={<Target size={13} />} value={state.cleared} label={`${state.cleared} words cleared`} />
          <Stat icon={<Crosshair size={13} />} value={`${accuracy}%`} label={`${accuracy} percent accuracy`} />

          <span
            className={cn(
              "flex w-20 items-center justify-end gap-1 tabular-nums transition-opacity",
              state.combo > 0 ? "text-accent opacity-100" : "opacity-0",
            )}
            aria-label={
              state.combo > 0
                ? `Combo ${state.combo}, time and score multiplied by ${multiplier.toFixed(2)}`
                : undefined
            }
          >
            <Zap size={13} />
            {state.combo}
            <span className="text-accent/70">&times;{multiplier.toFixed(2)}</span>
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
        className="relative w-full overflow-hidden rounded-2xl border border-border bg-background arcade-edge arcade-scanlines [--board-h:320px] sm:[--board-h:400px]"
        style={{ height: "var(--board-h)" }}
      >
        <div aria-hidden="true" className="absolute inset-0 arcade-haze" />
        <div aria-hidden="true" className="absolute inset-0 arcade-grid opacity-40" />
        {/* The danger wash fills in as the clock empties, so the board itself
            reads as the threat rather than just the number. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 arcade-danger transition-opacity duration-300"
          style={{ opacity: isLow && isPlaying ? 1 : 0 }}
        />

        <div className="relative flex h-full flex-col items-center justify-center gap-9 px-6">
          {/* The clock is the whole game, so it is the largest thing here. */}
          <div className="flex w-full max-w-sm flex-col items-center gap-2.5">
            <div className="relative flex items-center gap-2.5">
              <Timer
                size={22}
                aria-hidden="true"
                className={cn("transition-colors", isLow ? "text-error" : "text-accent")}
              />
              <span
                className={cn(
                  "font-mono text-5xl font-semibold tabular-nums transition-colors sm:text-6xl",
                  isLow ? "text-error cr-urgent" : "text-accent arcade-glow",
                )}
                aria-label={`${(state.timeLeftMs / 1000).toFixed(1)} seconds left`}
              >
                {(state.timeLeftMs / 1000).toFixed(1)}
              </span>

              {gain && (
                // Keyed on the award so a new clear restarts the animation, and
                // plain conditional rendering so React removes the node the
                // moment it expires. No AnimatePresence: it has been observed
                // in this project leaking nodes it never unmounts when a key
                // changes faster than its transition.
                <span
                  key={gain.seq}
                  aria-hidden="true"
                  className="cr-gain pointer-events-none absolute left-full top-2 ml-3 whitespace-nowrap font-mono text-lg font-semibold tabular-nums text-accent arcade-glow"
                >
                  +{(gain.ms / 1000).toFixed(1)}s
                </span>
              )}
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-sub-alt">
              <div
                className={cn("h-full rounded-full", isLow ? "bg-error" : "bg-accent")}
                style={{
                  width: `${timePercent}%`,
                  // Matched to the engine tick so 20 stepped updates a second
                  // read as a continuously draining bar.
                  transitionProperty: "width, background-color",
                  transitionTimingFunction: "linear",
                  transitionDuration: `${TICK_MS}ms`,
                }}
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-5">
            <span
              className="font-mono text-4xl tracking-tight sm:text-5xl"
              aria-label={word ? `Type ${word}` : undefined}
            >
              {mistakeFlash ? (
                <span className="text-error">{word}</span>
              ) : (
                <>
                  <span className="text-accent arcade-glow">{done}</span>
                  <span className="border-b-2 border-accent/50 text-foreground">{next}</span>
                  <span className="text-foreground">{rest}</span>
                </>
              )}
            </span>

            {/* Look-ahead: enough to set a rhythm, not enough to read a page. */}
            <div className="flex items-center gap-4 font-mono text-base" aria-hidden="true">
              {upcoming.map((queued, i) => (
                <span key={i} className={i === 0 ? "text-sub" : "text-sub/50"}>
                  {queued}
                </span>
              ))}
            </div>
          </div>
        </div>

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
                score={state.score}
                cleared={state.cleared}
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
            // onKeyDown below normally swallows the space before it reaches
            // the value, so this branch is the fallback for input that
            // arrives without a matching keydown at all -- IME composition
            // and predictive-text acceptance on mobile keyboards, which
            // report keydown as keyCode 229 / key "Unidentified" rather than
            // a real space. Previously that meant "space skips" (advertised
            // on this game's own start screen) silently did nothing there:
            // the space just landed in the buffer, failed to match any
            // word, and scored as a wrong keystroke instead of a skip.
            if (value.includes(" ")) {
              setTyped(value.slice(0, value.indexOf(" ")).toLowerCase());
              skip();
              return;
            }
            setTyped(value.toLowerCase());
          }}
          onPaste={(e) => e.preventDefault()}
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
          <Timer size={12} className="text-error" />
          {Math.round(START_TIME_MS / 1000)}s
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

      <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-sub/70">
        Every word buys time
        <span aria-hidden="true">&middot;</span>
        <SkipForward size={11} />
        space skips
      </p>
    </div>
  );
}

function GameOverCard({
  score,
  cleared,
  bestCombo,
  accuracy,
  seconds,
  isNewBest,
  best,
  onRestart,
}: {
  score: number;
  cleared: number;
  bestCombo: number;
  accuracy: number;
  seconds: number;
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
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-sub">Time up</span>
      )}

      <span className="font-mono text-5xl font-semibold tabular-nums text-accent arcade-glow">
        {score.toLocaleString()}
      </span>

      <div className="flex items-center gap-5 font-mono text-xs tabular-nums text-sub">
        <span className="flex items-center gap-1.5" aria-label={`${cleared} words cleared`}>
          <Target size={12} className="text-sub/60" />
          {cleared}
        </span>
        <span className="flex items-center gap-1.5" aria-label={`Best combo ${bestCombo}`}>
          <Zap size={12} className="text-sub/60" />
          {bestCombo}
        </span>
        <span className="flex items-center gap-1.5" aria-label={`${accuracy} percent accuracy`}>
          <Crosshair size={12} className="text-sub/60" />
          {accuracy}%
        </span>
        <span className="flex items-center gap-1.5" aria-label={`${seconds} seconds survived`}>
          <Timer size={12} className="text-sub/60" />
          {seconds}s
        </span>
      </div>

      {best && !isNewBest && (
        <span
          className="flex items-center gap-1.5 font-mono text-xs tabular-nums text-accent/80"
          aria-label={`Your best ${best.score}`}
        >
          <Trophy size={12} />
          {best.score.toLocaleString()}
        </span>
      )}

      <ArcadeButton onClick={onRestart}>
        <RotateCcw size={15} />
        Play again
      </ArcadeButton>
    </div>
  );
}
