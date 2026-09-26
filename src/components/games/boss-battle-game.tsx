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
  Shield,
  ShieldCheck,
  Skull,
  Swords,
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
import { sound } from "@/lib/audio/game-sounds";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { calculateAccuracy, round } from "@/lib/typing-engine/stats";
import { cn } from "@/lib/utils/cn";

/** Charge fraction past which the telegraph reads as imminent. */
const DANGER_FROM = 0.72;

/** How long the heartbeat repeats while on the last life. */
const HEARTBEAT_MS = 900;

/** Each phase's name and boss-art role, index-aligned with `PHASES` in the
 *  engine (phase is 1-based, so index with `phase - 1`). */
const PHASE_INFO = [
  { name: "Awakened", art: "boss-phase1" },
  { name: "Core Exposed", art: "boss-phase2" },
  { name: "Enraged", art: "boss-phase3" },
] as const;

interface BossBattleGameProps {
  definition: GameDefinition;
  /** Resolved art URLs (see game-client.tsx). Every piece has a CSS/icon
   *  fallback, so a missing file is a quieter board, never a broken one. */
  art?: Record<string, string | null>;
}

export function BossBattleGame({ definition, art }: BossBattleGameProps) {
  const bgArt = art?.["bg-arena"] ?? art?.hero ?? null;
  const playerArt = art?.["char-fg"] ?? null;
  const attackArt = art?.["player-attack"] ?? null;
  const victoryArt = art?.["victory-v2"] ?? art?.victory ?? null;
  const defeatArt = art?.defeat ?? null;
  const characterArt = art?.character ?? null;

  // `start` rebuilds the initial state, so "Play again" needs it rather than a
  // separate reset.
  const { state, start, resume, setTyped } = useBossBattle(definition);
  const inputRef = useRef<HTMLInputElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Lazy initialiser rather than a mount effect: this component only ever
  // renders client-side (its wrapper is next/dynamic with ssr:false), so
  // localStorage is guaranteed available and there is no server pass to
  // reconcile.
  const [best, setBest] = useState<GameBest | null>(() => getGameBest(definition.id));
  const [isNewBest, setIsNewBest] = useState(false);

  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);

  const bossArt = art?.[PHASE_INFO[Math.min(state.phase, PHASE_COUNT) - 1].art] ?? null;

  // ---- audio -----------------------------------------------------------

  // Driven off state transitions rather than fired inline from handlers, so
  // every path that changes the fight — a keystroke, an attack landing on
  // the tick, a phase break — gets sound without each call site remembering
  // to play it. The lightweight synth layer (playSound) and the sampled
  // layer (sound) are deliberately both played on the big moments: the synth
  // gives instant, zero-latency texture, the sample gives it real weight.
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
    if (s.cleared > prev.cleared) {
      playSound("clear", soundEnabled);
      sound("sword-hit", soundEnabled, { vary: 60 });
    }
    if (s.hitsTaken > prev.hitsTaken) {
      playSound("miss", soundEnabled);
      sound("player-hurt", soundEnabled);
    }
    if (s.blocked > prev.blocked) {
      playSound("combo", soundEnabled);
      sound("shield-block", soundEnabled);
    }
    if (s.phase > prev.phase) {
      playSound("start", soundEnabled);
      sound("bb-phase-transition", soundEnabled);
      sound("boss-roar", soundEnabled, { volume: 0.8 });
    }
    // Milestone only — a chime on every single hit would be exhausting.
    if (s.combo > prev.combo && s.combo > 0 && s.combo % 5 === 0) {
      sound("bb-combo-rising", soundEnabled);
    }

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

  // A tense heartbeat while down to the last life. Re-triggered as a short
  // one-shot on an interval rather than looped as a single audio file, so
  // there's no seam to get right — each beat is just an independent playback
  // of the recorded double-thump.
  useEffect(() => {
    const danger = state.status === "running" && state.lives === 1;
    if (!danger) return;
    sound("bb-heartbeat", soundEnabled);
    const id = setInterval(() => sound("bb-heartbeat", soundEnabled), HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [state.status, state.lives, soundEnabled]);

  // ---- lifecycle ---------------------------------------------------------

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
    playSound(state.outcome === "victory" ? "combo" : "over", soundEnabled);
    sound(state.outcome === "victory" ? "bb-victory-fanfare" : "bb-defeat-stinger", soundEnabled);
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

  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    if (state.status !== "over") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.status, handleStart]);

  const accuracy = round(calculateAccuracy(state.correctKeystrokes, state.incorrectKeystrokes));
  const isPlaying = state.status === "running";
  const { chargeMs: chargeDuration, requiredClears } = phaseTuning(state.phase);
  const chargeRatio = Math.min(1, state.chargeMs / chargeDuration);
  const quotaMet = state.clearsThisCharge >= requiredClears;
  const imminent = !quotaMet && chargeRatio >= DANGER_FROM;
  const hpPercent = Math.max(0, Math.round((state.bossHp / BOSS_MAX_HP) * 100));
  const secondsToImpact = Math.max(0, (chargeDuration - state.chargeMs) / 1000);
  const inDanger = isPlaying && state.lives === 1;
  const phaseInfo = PHASE_INFO[Math.min(state.phase, PHASE_COUNT) - 1];

  return (
    <div className="flex w-full max-w-5xl flex-col gap-3">
      <div
        ref={boardRef}
        onClick={focusInput}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border border-border bg-background transition-transform",
          state.phaseFlashMs > 0 && "boss-shake",
        )}
        style={{ height: "clamp(340px, 68dvh, 760px)", maxHeight: "min(760px, 86vh)" }}
      >
        {/* Battlefield backdrop. */}
        {bgArt && (
          <Image
            src={bgArt}
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1100px"
            quality={45}
            className="object-cover opacity-70"
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 arcade-scanlines opacity-40" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/50"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/70 via-transparent to-transparent"
        />

        {/* Player-hit danger wash — the whole board floods red when an
            attack lands, same explicit-timer treatment as before (a number
            that freezes with the run beats an exit animation that has to
            unmount to finish). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 arcade-danger transition-opacity duration-300"
          style={{ opacity: state.playerHitMs > 0 ? 1 : 0 }}
        />
        {/* A slow red pulse while on the last life — danger is ambient, not
            just a one-off flash. */}
        {inDanger && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 arcade-pulse"
            style={{
              background:
                "radial-gradient(120% 100% at 50% 100%, color-mix(in srgb, var(--error) 25%, transparent), transparent 65%)",
            }}
          />
        )}

        {/* ---------------------------------------------------------- HUD */}
        <div className="relative z-10 flex h-full flex-col p-3 sm:p-5">
          {/* Top row: objective + lives (left), boss name + HP (center), score + combo (right). */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-sub sm:text-[11px]">
                <Swords size={12} className="text-error" aria-hidden="true" />
                Boss Battle
              </span>
              <span
                className="flex items-center gap-1"
                aria-label={`${state.lives} ${state.lives === 1 ? "life" : "lives"} remaining`}
              >
                {Array.from({ length: definition.lives }, (_, i) => (
                  <Heart
                    key={i}
                    size={16}
                    className={cn("transition-colors", i < state.lives ? "text-error" : "text-sub/25")}
                    fill={i < state.lives ? "currentColor" : "none"}
                  />
                ))}
              </span>
              <Stat icon={<Crosshair size={12} />} value={`${accuracy}%`} label={`${accuracy} percent accuracy`} />
            </div>

            <div className="hidden w-full max-w-md flex-col gap-1.5 pt-0.5 sm:flex">
              <BossHealth hpPercent={hpPercent} phase={state.phase} phaseName={phaseInfo.name} flashing={state.bossHitMs > 0} />
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <span
                className="font-mono text-2xl font-bold tabular-nums text-accent arcade-glow sm:text-3xl"
                aria-label={`Score ${state.score}`}
              >
                {state.score.toLocaleString()}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 font-mono text-sm font-semibold tabular-nums transition-opacity",
                  state.combo > 1 ? "text-accent opacity-100" : "opacity-0",
                )}
                aria-label={state.combo > 1 ? `Combo ${state.combo}` : undefined}
              >
                <Zap size={13} />
                {state.combo}x
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

          {/* Mobile-only compact HP bar (the centred one above is hidden below sm:). */}
          <div className="mt-2 sm:hidden">
            <BossHealth hpPercent={hpPercent} phase={state.phase} phaseName={phaseInfo.name} flashing={state.bossHitMs > 0} compact />
          </div>

          {/* Phase pips, right edge — a quiet "map" of the fight. */}
          <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-2.5 sm:right-5 sm:flex">
            {PHASE_INFO.map((p, i) => {
              const n = i + 1;
              const reached = state.phase > n || (state.phase === n && state.bossHp <= 0);
              const active = state.phase === n && state.bossHp > 0;
              return (
                <div key={p.name} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-mono text-[9px] uppercase tracking-wider transition-colors",
                      active ? "text-accent" : reached ? "text-sub" : "text-sub/40",
                    )}
                  >
                    {p.name}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-2 w-2 rounded-full border transition-colors",
                      active
                        ? "border-accent bg-accent arcade-glow"
                        : reached
                          ? "border-sub bg-sub"
                          : "border-sub/40 bg-transparent",
                    )}
                  />
                </div>
              );
            })}
          </div>

          {/* --------------------------------------------------- Arena --- */}
          <div className="relative flex flex-1 items-end justify-between gap-2 py-2">
            {/* Player, lower-left. */}
            <div className="relative flex h-full w-[26%] max-w-[220px] items-end justify-start sm:w-[30%]">
              {playerArt ? (
                <div
                  className={cn(
                    "relative h-[85%] w-full transition-transform duration-150",
                    state.playerHitMs > 0 && "translate-x-[-4px]",
                  )}
                >
                  <Image src={playerArt} alt="" fill sizes="320px" className="object-contain object-bottom" />
                  {/* Attack flash: the player's own swing, timed to the same
                      instant a hit lands on the boss. */}
                  {attackArt && state.bossHitMs > 0 && (
                    <div className="absolute inset-0 origin-bottom-left scale-110 opacity-90">
                      <Image src={attackArt} alt="" fill sizes="320px" className="object-contain" />
                    </div>
                  )}
                </div>
              ) : (
                <Shield size={64} className="mb-4 text-accent" aria-hidden="true" />
              )}
            </div>

            {/* Boss, upper-right of the arena. */}
            <div className="relative flex h-full w-[44%] max-w-[420px] items-start justify-end sm:w-[52%]">
              {bossArt ? (
                <div
                  className={cn(
                    "relative h-[92%] w-full transition-transform duration-100",
                    !state.bossHitMs && "arcade-breathe",
                    state.bossHitMs > 0 && "translate-x-[5px] scale-[0.98]",
                  )}
                >
                  <Image
                    src={bossArt}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 768px) 60vw, 480px"
                    className={cn(
                       "object-contain object-top transition-[filter] duration-150",
                      state.bossHitMs > 0 && "brightness-150",
                    )}
                  />
                  {state.bossHitMs > 0 && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 mix-blend-screen"
                      style={{
                        background:
                          "radial-gradient(50% 50% at 50% 40%, color-mix(in srgb, var(--accent) 55%, transparent), transparent 70%)",
                      }}
                    />
                  )}
                </div>
              ) : (
                <Skull
                  size={92}
                  strokeWidth={1.5}
                  aria-label={`Boss at ${hpPercent} percent health, phase ${state.phase} of ${PHASE_COUNT}`}
                  className={cn(
                    "mt-6 transition-[transform,color] duration-150",
                    state.bossHitMs > 0
                      ? "text-accent arcade-glow"
                      : state.phase >= 3
                        ? "text-error"
                        : state.phase === 2
                          ? "text-error/75"
                          : "text-sub",
                  )}
                />
              )}

              {/* Attack telegraph ring, anchored on the boss. */}
              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute bottom-[10%] right-[18%] aspect-square w-[22%] min-w-[70px] max-w-[130px] rounded-full border-2 transition-[transform,opacity] ease-linear",
                  quotaMet ? "border-accent shadow-[0_0_12px_rgba(var(--accent-rgb),0.5)]" : "border-error shadow-[0_0_12px_rgba(239,68,68,0.5)]",
                )}
                style={{
                  transitionDuration: `${TICK_MS}ms`,
                  transform: `translate(50%, 50%) scale(${1.5 - 0.5 * chargeRatio})`,
                  opacity: isPlaying ? 0.35 + 0.65 * chargeRatio : 0,
                }}
              />
            </div>

            {/* Damage number — real per-hit value, floats up and fades. */}
            {state.bossHitMs > 0 && state.lastHitDamage > 0 && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-[30%] top-[18%] font-mono text-xl font-bold tabular-nums text-accent arcade-glow sm:text-2xl"
              >
                −{state.lastHitDamage}
              </span>
            )}

            {/* Block confirmation. */}
            <ShieldCheck
              aria-hidden="true"
              size={48}
              className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 text-accent arcade-glow transition-opacity duration-200"
              style={{ opacity: state.blockMs > 0 ? 1 : 0 }}
            />
          </div>

          {/* ------------------------------------------------ Console --- */}
          <div className="flex flex-col items-center gap-2.5">
            <div className="flex w-full max-w-lg items-center gap-3">
              <span
                className="flex items-center gap-1"
                aria-label={`${state.clearsThisCharge} of ${requiredClears} words needed to block the attack`}
              >
                {Array.from({ length: requiredClears }, (_, i) => (
                  <Shield
                    key={i}
                    size={14}
                    className={cn("transition-colors", i < state.clearsThisCharge ? "text-accent" : "text-sub/30")}
                    fill={i < state.clearsThisCharge ? "currentColor" : "none"}
                  />
                ))}
              </span>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-sub-alt">
                <div
                  className={cn("h-full rounded-full transition-[width] ease-linear", quotaMet ? "bg-accent" : "bg-error")}
                  style={{ transitionDuration: `${TICK_MS}ms`, width: `${chargeRatio * 100}%` }}
                />
              </div>
              <span
                className={cn("w-9 text-right font-mono text-[11px] tabular-nums transition-colors", imminent ? "text-error" : "text-sub")}
                aria-label={`${secondsToImpact.toFixed(1)} seconds until the next attack`}
              >
                {secondsToImpact.toFixed(1)}
              </span>
            </div>

            <div className="w-full max-w-lg rounded-xl border border-border bg-background/80 px-5 py-3 backdrop-blur-sm">
              <p className="mb-1 text-center font-mono text-[9px] uppercase tracking-[0.3em] text-sub">
                {state.word ? "Type to attack" : ""}
              </p>
              <div
                className="text-center font-mono text-2xl font-semibold tracking-tight sm:text-3xl"
                aria-label={state.word ? `Type ${state.word}` : undefined}
              >
                <span className="text-accent arcade-glow">{state.word.slice(0, state.typed.length)}</span>
                <span className={cn(imminent ? "text-error/90" : "text-foreground")}>
                  {state.word.slice(state.typed.length)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Phase break — the whole board states the new phase, loudly. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-background/80 transition-opacity duration-300"
          style={{ opacity: state.phaseFlashMs > 0 ? 1 : 0 }}
        >
          <Flame size={40} className="text-error arcade-glow" />
          <span className="font-mono text-sm uppercase tracking-[0.35em] text-sub">
            Phase {state.phase} of {PHASE_COUNT}
          </span>
          <span className="font-mono text-4xl font-bold uppercase tracking-tight text-foreground arcade-glow sm:text-6xl">
            {phaseInfo.name}
          </span>
        </div>

        {/* Lost focus alert */}
        {isPlaying && !isFocused && (
          <button
            type="button"
            onClick={focusInput}
            className="absolute inset-x-6 top-1/2 z-20 flex -translate-y-1/2 items-center justify-center gap-2 rounded-xl border border-accent bg-background/95 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-accent arcade-pulse shadow-xl backdrop-blur-md transition-transform hover:scale-105"
          >
            <Zap size={14} className="animate-bounce" />
            Tap to resume combat
          </button>
        )}

        {!isPlaying && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/90 p-6 backdrop-blur-sm">
            {state.status === "idle" && (
              <StartCard definition={definition} best={best} characterArt={characterArt} onStart={handleStart} />
            )}
            {state.status === "paused" && (
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="font-mono text-lg font-semibold uppercase tracking-[0.2em] text-foreground">Paused</p>
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
                resultArt={state.outcome === "victory" ? victoryArt : defeatArt}
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
            setTyped(e.target.value.replace(/ /g, "").toLowerCase());
          }}
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
  phase,
  phaseName,
  flashing,
  compact,
}: {
  hpPercent: number;
  phase: number;
  phaseName: string;
  flashing: boolean;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.15em] text-sub sm:text-[11px]">
        <span className="truncate text-foreground">{phaseName}</span>
        <span className="flex items-center gap-1" aria-label={`Phase ${phase} of ${PHASE_COUNT}`}>
          {Array.from({ length: PHASE_COUNT }, (_, i) => (
            <Flame key={i} size={11} className={cn("transition-colors", i < phase ? "text-error" : "text-sub/25")} fill={i < phase ? "currentColor" : "none"} />
          ))}
        </span>
      </div>
      <div
        className={cn("relative w-full overflow-hidden rounded-full bg-sub-alt/70", compact ? "h-2" : "h-2.5")}
        role="progressbar"
        aria-label="Boss health"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={hpPercent}
      >
        <div
          className={cn("h-full rounded-full transition-[width,background-color] ease-linear", flashing ? "bg-accent" : "bg-error")}
          style={{ transitionDuration: `${TICK_MS * 2}ms`, width: `${hpPercent}%` }}
        />
        {[66, 33].map((mark) => (
          <span key={mark} aria-hidden="true" className="absolute inset-y-0 w-px bg-background/80" style={{ left: `${mark}%` }} />
        ))}
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) {
  return (
    <span className="flex items-center gap-1.5 font-mono text-xs tabular-nums text-sub" aria-label={label}>
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
  characterArt,
  onStart,
}: {
  definition: GameDefinition;
  best: GameBest | null;
  characterArt: string | null;
  onStart: () => void;
}) {
  return (
    <div className="flex max-w-sm flex-col items-center gap-4 text-center">
      {characterArt && (
        <div className="relative h-32 w-44 overflow-hidden rounded-xl border border-border sm:h-40 sm:w-56">
          <Image src={characterArt} alt="" fill sizes="220px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
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
          <Heart size={12} className="text-error" />
          {definition.lives} {definition.lives === 1 ? "life" : "lives"}
        </span>
        <span className="flex items-center gap-1.5">
          <Flame size={12} className="text-accent" />
          {PHASE_COUNT} phases
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
        Type to attack — fill the shields before the bar fills
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
  resultArt,
  onRestart,
}: {
  state: BossBattleState;
  accuracy: number;
  hpPercent: number;
  isNewBest: boolean;
  best: GameBest | null;
  resultArt: string | null;
  onRestart: () => void;
}) {
  const won = state.outcome === "victory";

  return (
    <div
      className="relative flex w-full max-w-md flex-col items-center gap-4 overflow-hidden rounded-2xl border border-border p-6 text-center"
      role="status"
      aria-live="polite"
    >
      {resultArt && (
        <>
          <Image src={resultArt} alt="" fill sizes="448px" quality={45} className="object-cover opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
        </>
      )}

      <div className="relative z-10 flex flex-col items-center gap-4">
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
          <span className="flex items-center gap-1.5 font-mono text-xs tabular-nums text-accent/80" aria-label={`Best score ${best.score}`}>
            <Trophy size={12} />
            {best.score.toLocaleString()}
          </span>
        )}

        <ArcadeButton onClick={onRestart}>
          <RotateCcw size={15} />
          Play again
        </ArcadeButton>

        <p className="font-mono text-[10px] uppercase tracking-wider text-sub/70">
          Press <kbd className="rounded border border-border bg-sub-alt/40 px-1 py-0.5 font-mono text-[9px] text-foreground">Enter</kbd> or <kbd className="rounded border border-border bg-sub-alt/40 px-1 py-0.5 font-mono text-[9px] text-foreground">Space</kbd> to battle again
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
