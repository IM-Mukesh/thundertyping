"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Crosshair,
  Flame,
  Gauge,
  Heart,
  Play,
  RotateCcw,
  Shield,
  ShieldCheck,
  Skull,
  Swords,
  Target,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { GAME_LIST, type GameDefinition } from "@/lib/games/game-types";
import { awardXp, bumpStat, checkSiteAchievements } from "@/lib/profile/player-profile";
import {
  BOSS_MAX_HP,
  PHASE_COUNT,
  TICK_MS,
  phaseTuning,
  useBossBattle,
  type BossBattleState,
} from "@/lib/games/use-boss-battle";
import { getGameBest, recordGameResult, type GameBest } from "@/lib/games/game-scores";
import { playSound } from "@/lib/games/game-audio";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { calculateAccuracy, round } from "@/lib/typing-engine/stats";
import { cn } from "@/lib/utils/cn";

// Matches the board height the other games use, so the route's reserved space
// and the loading placeholder stay right.
/** Charge fraction past which the telegraph reads as imminent. */
const DANGER_FROM = 0.72;

interface BossBattleGameProps {
  definition: GameDefinition;
}

export function BossBattleGame({ definition }: BossBattleGameProps) {
  // `start` rebuilds the initial state, so "Play again" needs it rather than a
  // separate reset.
  const { state, start, resume, setTyped } = useBossBattle(definition);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lazy initialiser rather than a mount effect: this component only ever
  // renders client-side (its wrapper is next/dynamic with ssr:false), so
  // localStorage is guaranteed available and there is no server pass to
  // reconcile.
  const [best, setBest] = useState<GameBest | null>(() => getGameBest(definition.id));
  const [isNewBest, setIsNewBest] = useState(false);

  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);

  // Audio is driven off state transitions rather than fired inline from
  // handlers, so every path that changes the fight — a keystroke, an attack
  // landing on the tick, a phase break — gets sound without each call site
  // remembering to play it. Every sound here already existed.
  const prevRef = useRef({
    correct: 0,
    incorrect: 0,
    cleared: 0,
    hitsTaken: 0,
    blocked: 0,
    combo: 0,
    phase: 1,
  });
  useEffect(() => {
    const prev = prevRef.current;
    const s = state;

    if (s.correctKeystrokes > prev.correct) playSound("key", soundEnabled);
    if (s.incorrectKeystrokes > prev.incorrect) playSound("typo", soundEnabled);
    if (s.cleared > prev.cleared) playSound("clear", soundEnabled);
    // An attack that landed is the harsh one; a blocked attack and a phase
    // break both reuse the two rising motifs.
    if (s.hitsTaken > prev.hitsTaken) playSound("miss", soundEnabled);
    if (s.blocked > prev.blocked) playSound("combo", soundEnabled);
    if (s.phase > prev.phase) playSound("start", soundEnabled);

    prevRef.current = {
      correct: s.correctKeystrokes,
      incorrect: s.incorrectKeystrokes,
      cleared: s.cleared,
      hitsTaken: s.hitsTaken,
      blocked: s.blocked,
      combo: s.combo,
      phase: s.phase,
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
    // A won fight gets the rising motif, a lost one the falling motif.
    playSound(state.outcome === "victory" ? "combo" : "over", soundEnabled);
    // Every game must feed the cross-game profile, or "play every game"
    // (site:all-games) can never be earned no matter how much is played.
    bumpStat(definition.id, "runs");
    awardXp(Math.round(state.score / 8) + (state.outcome === "victory" ? 40 : 10));
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
  const isPlaying = state.status === "running";
  const { chargeMs: chargeDuration, requiredClears } = phaseTuning(state.phase);
  const chargeRatio = Math.min(1, state.chargeMs / chargeDuration);
  const quotaMet = state.clearsThisCharge >= requiredClears;
  const imminent = !quotaMet && chargeRatio >= DANGER_FROM;
  const hpPercent = Math.max(0, Math.round((state.bossHp / BOSS_MAX_HP) * 100));
  const secondsToImpact = Math.max(0, (chargeDuration - state.chargeMs) / 1000);

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
          <Stat icon={<Target size={13} />} value={state.cleared} label={`${state.cleared} words landed`} />
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

        {/* The board floods when an attack lands. Driven by a countdown in
            game state rather than AnimatePresence: these fire several times a
            second, and a number that freezes with the run is more reliable
            than an exit animation that has to unmount to finish. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 arcade-danger transition-opacity duration-300"
          style={{ opacity: state.playerHitMs > 0 ? 1 : 0 }}
        />

        <div className="relative flex h-full flex-col gap-3 p-4 sm:p-5">
          <BossHealth
            hpPercent={hpPercent}
            hp={state.bossHp}
            phase={state.phase}
            flashing={state.bossHitMs > 0}
          />

          <div className="relative flex flex-1 items-center justify-center">
            {/* Telegraph: the ring closes in as the attack charges, so the
                threat is readable without looking away from the word. */}
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute rounded-full border-2 transition-[transform,opacity] ease-linear",
                quotaMet ? "border-accent" : "border-error",
              )}
              style={{
                width: 210,
                height: 210,
                transitionDuration: `${TICK_MS}ms`,
                transform: `scale(${1.5 - 0.5 * chargeRatio})`,
                opacity: isPlaying ? 0.2 + 0.6 * chargeRatio : 0,
              }}
            />

            <Skull
              size={92}
              strokeWidth={1.5}
              aria-label={`Boss at ${hpPercent} percent health, phase ${state.phase} of ${PHASE_COUNT}`}
              className={cn(
                "transition-[transform,color] duration-150",
                state.bossHitMs > 0
                  ? "text-accent arcade-glow"
                  : state.phase >= 3
                    ? "text-error"
                    : state.phase === 2
                      ? "text-error/75"
                      : "text-sub",
              )}
              style={{ transform: `scale(${state.bossHitMs > 0 ? 0.9 : 1})` }}
            />

            {/* Block confirmation — same explicit-timer treatment. */}
            <ShieldCheck
              aria-hidden="true"
              size={44}
              className="pointer-events-none absolute text-accent arcade-glow transition-opacity duration-200"
              style={{ opacity: state.blockMs > 0 ? 1 : 0 }}
            />

            {/* Phase break: the whole board states the new phase, loudly. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 bg-background/70 transition-opacity duration-300"
              style={{ opacity: state.phaseFlashMs > 0 ? 1 : 0 }}
            >
              <Flame size={34} className="text-accent arcade-glow" />
              <span className="font-mono text-6xl font-semibold tabular-nums text-accent arcade-glow">
                {state.phase}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            {/* Attack clock. The pips are the block quota: fill them before the
                bar does and the attack is parried. */}
            <div className="flex w-full max-w-md items-center gap-3">
              <span
                className="flex items-center gap-1"
                aria-label={`${state.clearsThisCharge} of ${requiredClears} words needed to block the attack`}
              >
                {Array.from({ length: requiredClears }, (_, i) => (
                  <Shield
                    key={i}
                    size={14}
                    className={cn(
                      "transition-colors",
                      i < state.clearsThisCharge ? "text-accent" : "text-sub/30",
                    )}
                    fill={i < state.clearsThisCharge ? "currentColor" : "none"}
                  />
                ))}
              </span>

              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-sub-alt">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] ease-linear",
                    quotaMet ? "bg-accent" : "bg-error",
                  )}
                  style={{
                    // Matches the engine tick, so stepped updates read as a
                    // continuously filling bar without a frame-rate loop.
                    transitionDuration: `${TICK_MS}ms`,
                    width: `${chargeRatio * 100}%`,
                  }}
                />
              </div>

              <span
                className={cn(
                  "w-9 text-right font-mono text-[11px] tabular-nums transition-colors",
                  imminent ? "text-error" : "text-sub",
                )}
                aria-label={`${secondsToImpact.toFixed(1)} seconds until the next attack`}
              >
                {secondsToImpact.toFixed(1)}
              </span>
            </div>

            <div
              className="font-mono text-3xl font-semibold tracking-tight sm:text-4xl"
              aria-label={state.word ? `Type ${state.word}` : undefined}
            >
              <span className="text-accent arcade-glow">{state.word.slice(0, state.typed.length)}</span>
              <span className={cn(imminent ? "text-error/90" : "text-foreground")}>
                {state.word.slice(state.typed.length)}
              </span>
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
              <ResultCard
                state={state}
                accuracy={accuracy}
                hpPercent={hpPercent}
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
            // A word here never legitimately contains a space, so any space
            // that lands in the value can only be a mobile keyboard's
            // autocomplete/predictive-text appending one on acceptance --
            // real on-device behavior the onKeyDown guard below can't catch,
            // since it arrives as part of an IME composition, not a keydown.
            // Previously that space made the buffer longer than the target
            // word, so `state.word.startsWith(value)` failed and a correctly
            // completed word was scored as a mistake and never cleared.
            setTyped(e.target.value.replace(/ /g, "").toLowerCase());
          }}
          onPaste={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            // Space never commits here — a word lands the instant it matches —
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

function BossHealth({
  hpPercent,
  hp,
  phase,
  flashing,
}: {
  hpPercent: number;
  hp: number;
  phase: number;
  flashing: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between font-mono text-[11px] tabular-nums">
        <span
          className="flex items-center gap-1"
          aria-label={`Phase ${phase} of ${PHASE_COUNT}`}
        >
          {Array.from({ length: PHASE_COUNT }, (_, i) => (
            <Flame
              key={i}
              size={13}
              className={cn("transition-colors", i < phase ? "text-accent" : "text-sub/25")}
              fill={i < phase ? "currentColor" : "none"}
            />
          ))}
        </span>
        <span className="flex items-center gap-1 text-sub" aria-hidden="true">
          <Skull size={12} className={cn("transition-colors", flashing ? "text-accent" : "text-error")} />
          {hp}
        </span>
      </div>

      <div
        className="relative h-3 w-full overflow-hidden rounded-full bg-sub-alt"
        role="progressbar"
        aria-label="Boss health"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={hpPercent}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width,background-color] ease-linear",
            flashing ? "bg-accent" : "bg-error",
          )}
          style={{ transitionDuration: `${TICK_MS * 2}ms`, width: `${hpPercent}%` }}
        />
        {/* Phase thresholds, so the next break is visible before it happens. */}
        {[66, 33].map((mark) => (
          <span
            key={mark}
            aria-hidden="true"
            className="absolute inset-y-0 w-px bg-background/80"
            style={{ left: `${mark}%` }}
          />
        ))}
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
        <span className="flex items-center gap-1.5">
          <Flame size={12} className="text-accent" />
          {PHASE_COUNT}
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
        Type to damage it — fill the shields before the bar fills
      </p>
    </div>
  );
}

function ResultCard({
  state,
  accuracy,
  hpPercent,
  isNewBest,
  best,
  onRestart,
}: {
  state: BossBattleState;
  accuracy: number;
  hpPercent: number;
  isNewBest: boolean;
  best: GameBest | null;
  onRestart: () => void;
}) {
  const won = state.outcome === "victory";

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
        <span
          className={cn(
            "flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.25em]",
            won ? "text-accent" : "text-sub",
          )}
        >
          {won ? <Trophy size={12} /> : <Skull size={12} />}
          {won ? "Victory" : "Defeated"}
        </span>
      )}

      <span className="font-mono text-5xl font-semibold tabular-nums text-accent arcade-glow">
        {state.score.toLocaleString()}
      </span>

      {/* What the score is made of, in the same icon language as the HUD. */}
      <div className="grid grid-cols-3 gap-x-5 gap-y-2 font-mono text-xs tabular-nums text-sub">
        <ResultStat icon={<Swords size={12} />} value={state.damageDealt} label="Damage dealt" />
        <ResultStat icon={<Flame size={12} />} value={state.phaseBonus} label="Phase bonus" />
        <ResultStat icon={<Gauge size={12} />} value={state.speedBonus} label="Speed bonus" />
        <ResultStat icon={<Crosshair size={12} />} value={`${accuracy}%`} label={`${accuracy} percent accuracy`} />
        <ResultStat icon={<Zap size={12} />} value={`${state.bestCombo}x`} label={`Best combo ${state.bestCombo}`} />
        <ResultStat
          icon={won ? <Heart size={12} /> : <Skull size={12} />}
          value={won ? state.victoryBonus : `${hpPercent}%`}
          label={won ? `Victory bonus ${state.victoryBonus}` : `Boss left on ${hpPercent} percent health`}
        />
      </div>

      {best && !isNewBest && (
        <span
          className="flex items-center gap-1.5 font-mono text-xs tabular-nums text-accent/80"
          aria-label={`Best score ${best.score}`}
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

function ResultStat({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <span className="flex items-center justify-center gap-1.5" aria-label={`${label}: ${value}`}>
      <span className="text-sub/60" aria-hidden="true">
        {icon}
      </span>
      {typeof value === "number" ? value.toLocaleString() : value}
    </span>
  );
}
