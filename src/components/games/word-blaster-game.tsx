"use client";

import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Crosshair,
  Heart,
  Play,
  RotateCcw,
  Skull,
  Triangle,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import type { GameDefinition } from "@/lib/games/game-types";
import { HIT_EFFECT_MS, LANE_COUNT, TICK_MS, useWordBlaster } from "@/lib/games/use-word-blaster";
import { getGameBest, recordGameResult, type GameBest } from "@/lib/games/game-scores";
import { playSound } from "@/lib/games/game-audio";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { calculateAccuracy, round } from "@/lib/typing-engine/stats";
import { cn } from "@/lib/utils/cn";

const BOARD_HEIGHT = 400;

/**
 * Horizontal geometry, in percent of the board width. Percentages rather than
 * pixels so nothing here depends on measuring the board — a measurement is
 * delivered by ResizeObserver, which (like requestAnimationFrame) doesn't fire
 * in a tab that isn't rendering. The one thing that genuinely needs pixels is
 * the turret's aim angle, and that is cosmetic if the measurement is stale.
 */
const BASE_X = 13;
const SPAWN_X = 94;
/** The barrel pivot sits just right of the wall it defends. */
const MUZZLE_X = BASE_X + 2.5;

/** Enemies past this fraction of the field get a warning colour. */
const DANGER_FROM = 0.72;

/**
 * Hit effects are aged off the engine's own interval rather than handed to
 * AnimatePresence, which has been observed in this project failing to unmount
 * rapidly re-keyed children and leaking DOM nodes — and kills here land several
 * times a second, which is precisely that case. The engine holds each hit for
 * HIT_EFFECT_MS; everything below is derived from how old a hit is, so the node
 * count is bounded by the engine's own cap and nothing can outlive the run.
 */
const TRACER_MS = 100;
const BREACH_FLASH_MS = 400;

/** Where an enemy sits across the field, 0 = spawn edge, 1 = base wall. */
function enemyX(progress: number): number {
  return SPAWN_X - progress * (SPAWN_X - BASE_X);
}

function laneY(lane: number): number {
  return ((lane + 0.5) / LANE_COUNT) * 100;
}

interface WordBlasterGameProps {
  definition: GameDefinition;
}

export function WordBlasterGame({ definition }: WordBlasterGameProps) {
  // `start` already rebuilds the initial state, so "Play again" needs it rather
  // than a separate reset.
  const { state, start, resume, setTyped } = useWordBlaster(definition);
  const inputRef = useRef<HTMLInputElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Lazy initialiser rather than a mount effect: this component only ever
  // renders client-side (its wrapper is next/dynamic with ssr:false), so
  // localStorage is guaranteed available and there's no server pass to
  // reconcile.
  const [best, setBest] = useState<GameBest | null>(() => getGameBest(definition.id));
  const [isNewBest, setIsNewBest] = useState(false);

  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);

  // ---- short-lived visual effects -----------------------------------------

  // Derived, not stored: the engine already holds each hit for HIT_EFFECT_MS
  // and expires it on the tick, so age is all the UI needs. Nothing to leak,
  // nothing to clean up between runs.
  const now = state.elapsedMs;
  const tracers = state.hits.filter((hit) => now - hit.bornMs < TRACER_MS);
  const isFiring = tracers.length > 0;
  const breachFlash = state.lastBreachMs !== null && now - state.lastBreachMs < BREACH_FLASH_MS;

  // ---- board geometry ------------------------------------------------------

  // Only the turret's aim angle needs real pixels — the field is much wider
  // than it is tall, so an angle computed in percentage space points visibly
  // wrong. Everything else is laid out in percentages and needs no measurement.
  // The width is set exclusively from the ResizeObserver callback (which fires
  // once on observe), so the default covers the frame before the first
  // measurement and a mis-aimed barrel is the worst case.
  const [boardWidth, setBoardWidth] = useState(720);
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const width = el.getBoundingClientRect().width;
      if (width > 0) setBoardWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const locked =
    state.lockedId === null ? null : (state.enemies.find((e) => e.id === state.lockedId) ?? null);
  // With nothing locked the turret tracks the leading threat — the same enemy
  // the engine would target on the next keystroke, so the barrel is an honest
  // preview of where the shot will go.
  const aimTarget =
    locked ??
    (state.enemies.length > 0
      ? state.enemies.reduce((a, b) => (b.progress > a.progress ? b : a))
      : null);

  let aimAngle = 0;
  if (aimTarget) {
    const dx = ((enemyX(aimTarget.progress) - MUZZLE_X) / 100) * boardWidth;
    const dy = ((laneY(aimTarget.lane) - 50) / 100) * BOARD_HEIGHT;
    // Clamped so an enemy level with or behind the muzzle can't swing the
    // barrel backwards through the base.
    aimAngle = Math.max(-72, Math.min(72, (Math.atan2(dy, Math.max(dx, 1)) * 180) / Math.PI));
  }

  // ---- audio ---------------------------------------------------------------

  // Driven off state transitions rather than fired inline from handlers, so
  // every path that changes the game (a keystroke, an enemy breaching on the
  // tick, an automatic game over) gets audio without each one remembering to.
  const prevRef = useRef({ correct: 0, incorrect: 0, destroyed: 0, breached: 0, combo: 0 });
  useEffect(() => {
    const prev = prevRef.current;
    const s = state;

    if (s.correctKeystrokes > prev.correct) playSound("key", soundEnabled);
    if (s.incorrectKeystrokes > prev.incorrect) playSound("typo", soundEnabled);
    if (s.destroyed > prev.destroyed) playSound("clear", soundEnabled);
    if (s.breached > prev.breached) playSound("miss", soundEnabled);
    // Milestone only — a chime on every single kill would be exhausting.
    if (s.combo > prev.combo && s.combo > 0 && s.combo % 5 === 0) playSound("combo", soundEnabled);

    prevRef.current = {
      correct: s.correctKeystrokes,
      incorrect: s.incorrectKeystrokes,
      destroyed: s.destroyed,
      breached: s.breached,
      combo: s.combo,
    };
  }, [state, soundEnabled]);

  // ---- lifecycle -----------------------------------------------------------

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
      cleared: state.destroyed,
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
          aria-label={`Score ${state.score}`}
        >
          {state.score.toLocaleString()}
        </span>

        <div className="flex items-center gap-4 text-sm text-sub">
          <Stat
            icon={<Skull size={13} />}
            value={state.destroyed}
            label={`${state.destroyed} enemies destroyed`}
          />
          <Stat
            icon={<Crosshair size={13} />}
            value={`${accuracy}%`}
            label={`${accuracy} percent accuracy`}
          />

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
        ref={boardRef}
        onClick={focusInput}
        className="relative w-full overflow-hidden rounded-2xl border border-border bg-background arcade-edge arcade-scanlines [--board-h:320px] sm:[--board-h:400px]"
        style={{ height: "var(--board-h)" }}
      >
        <div aria-hidden="true" className="absolute inset-0 arcade-haze" />
        <div aria-hidden="true" className="absolute inset-0 arcade-grid opacity-40" />

        {/* Lane separators, so a lane reads as a firing line rather than as
            arbitrary vertical space. */}
        {Array.from({ length: LANE_COUNT - 1 }, (_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 border-t border-border/50"
            style={{ top: `${((i + 1) / LANE_COUNT) * 100}%` }}
          />
        ))}

        {/* The zone behind the wall: intensity reads as threat, and it flares
            on a breach. Built with color-mix over the theme's --error rather
            than a fixed colour so it recolours with every theme. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 transition-opacity duration-200"
          style={{
            width: `${BASE_X + 14}%`,
            opacity: breachFlash ? 1 : 0.55,
            background:
              "linear-gradient(to right, color-mix(in srgb, var(--error) 30%, transparent) 0%, transparent 100%)",
          }}
        />

        {/* The wall an enemy must not reach. */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 w-0.5 transition-colors",
            breachFlash ? "bg-error" : "bg-accent/55",
          )}
          style={{ left: `${BASE_X}%` }}
        />

        {state.enemies.map((enemy) => {
          const isTarget = enemy.id === state.lockedId;
          const matched = isTarget ? state.typed.length : 0;
          const inDanger = enemy.progress >= DANGER_FROM;
          return (
            <span
              key={enemy.id}
              className={cn(
                "absolute flex items-center gap-1.5 whitespace-nowrap font-mono text-sm tracking-tight transition-[left,transform] ease-linear sm:text-xl",
                isTarget
                  ? "text-foreground arcade-glow-soft"
                  : inDanger
                    ? "text-error/90"
                    : "text-sub",
              )}
              style={{
                // Matches the engine tick so stepped updates read as continuous
                // motion without running the loop at frame rate.
                transitionDuration: `${TICK_MS}ms`,
                left: `${enemyX(enemy.progress)}%`,
                top: `${laneY(enemy.lane)}%`,
                // The horizontal anchor interpolates from the word's right edge
                // at spawn to its left edge at the wall, which is the only way
                // to get both ends right without knowing the text width here.
                //
                // Anchoring the left edge throughout (the original) parked the
                // text's left edge at SPAWN_X and let the rest run past the
                // board's overflow-hidden clip: the longest word overhung a
                // 320px-wide board by 52px and stayed partly cut off for the
                // first quarter of its approach. You cannot type a word you
                // cannot read, so that was a real difficulty bug, not cosmetic.
                // Right-anchoring throughout would fix spawn but push the text
                // through the wall before the breach registers.
                transform: `translate(${-100 * (1 - enemy.progress)}%, -50%)`,
              }}
            >
              {/* The nose of the craft, and the point that crosses the wall. */}
              <Triangle
                size={10}
                aria-hidden="true"
                className="-rotate-90 fill-current opacity-70"
              />
              <span>
                {matched > 0 && (
                  <span className="text-accent arcade-glow">{enemy.text.slice(0, matched)}</span>
                )}
                {enemy.text.slice(matched)}
              </span>
            </span>
          );
        })}

        {/*
          Lock-on beam and tracers. preserveAspectRatio="none" lets the whole
          overlay work in the same 0-100 percentage space the enemies use, and
          non-scaling-stroke keeps the line weight in real pixels so the
          non-uniform scale doesn't smear it.
        */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {isPlaying && aimTarget && (
            <line
              x1={MUZZLE_X}
              y1={50}
              x2={enemyX(aimTarget.progress)}
              y2={laneY(aimTarget.lane)}
              stroke="var(--accent)"
              strokeWidth={1}
              strokeDasharray="4 5"
              strokeOpacity={locked ? 0.55 : 0.18}
              vectorEffect="non-scaling-stroke"
            />
          )}
          {tracers.map((tracer) => (
            <line
              key={tracer.seq}
              x1={MUZZLE_X}
              y1={50}
              x2={enemyX(tracer.progress)}
              y2={laneY(tracer.lane)}
              stroke="var(--accent)"
              strokeWidth={2.5}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* The explosion. animate-ping is Tailwind's own keyframe (no custom CSS
            needed, so nothing has to be added to globals.css), run once over
            exactly the lifetime the engine gives the hit, with fill-mode
            forwards so it can't snap back to full opacity in the frame before
            the tick drops it. */}
        {state.hits.map((hit) => {
          const x = enemyX(hit.progress);
          const y = laneY(hit.lane);
          return (
            <Fragment key={hit.seq}>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute animate-ping rounded-full border-2 border-accent"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: 34,
                  height: 34,
                  marginLeft: -17,
                  marginTop: -17,
                  animationDuration: `${HIT_EFFECT_MS}ms`,
                  animationIterationCount: 1,
                  animationFillMode: "forwards",
                }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute animate-ping rounded-full bg-accent"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: 14,
                  height: 14,
                  marginLeft: -7,
                  marginTop: -7,
                  animationDuration: `${Math.round(HIT_EFFECT_MS * 0.55)}ms`,
                  animationIterationCount: 1,
                  animationFillMode: "forwards",
                }}
              />
            </Fragment>
          );
        })}

        {/* The turret: tracks the target it would shoot, recoils and flares on
            every kill. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute h-8 w-8 transition-transform duration-100 ease-out"
          style={{
            left: `${BASE_X}%`,
            top: "50%",
            transform: `translate(calc(-50% - ${isFiring ? 4 : 0}px), -50%)`,
          }}
        >
          <span
            className="absolute left-1/2 top-1/2 h-[5px] w-9 origin-left rounded-full bg-accent transition-transform duration-100 ease-out"
            style={{ transform: `translateY(-50%) rotate(${aimAngle}deg)` }}
          />
          {isFiring && (
            <span className="absolute -inset-2 rounded-full bg-accent/35 blur-[3px]" />
          )}
          <span
            className={cn(
              "absolute inset-0 rounded-full border-2 border-accent bg-background transition-transform duration-100",
              isFiring ? "scale-110" : "scale-100",
            )}
          />
          <span className="absolute inset-[7px] rounded-full bg-accent/75" />
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
                destroyed={state.destroyed}
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
            // Space never commits here — an enemy dies the instant its word
            // matches — so swallow it rather than letting it scroll the page.
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
            {best.score.toLocaleString()}
          </span>
        )}
      </div>

      <ArcadeButton onClick={onStart}>
        <Play size={15} />
        Start
      </ArcadeButton>

      <p className="font-mono text-[11px] uppercase tracking-wider text-sub/70">
        Type an enemy&apos;s word to shoot it down
      </p>
    </div>
  );
}

function GameOverCard({
  score,
  destroyed,
  bestCombo,
  accuracy,
  isNewBest,
  best,
  onRestart,
}: {
  score: number;
  destroyed: number;
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
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-sub">Base lost</span>
      )}

      <span className="font-mono text-5xl font-semibold tabular-nums text-accent arcade-glow">
        {score.toLocaleString()}
      </span>

      <div className="flex items-center gap-5 font-mono text-xs tabular-nums text-sub">
        <span className="flex items-center gap-1.5">
          <Skull size={12} className="text-sub/60" />
          {destroyed}
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
            {best.score.toLocaleString()}
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
