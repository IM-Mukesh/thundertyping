"use client";

import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
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
import { GAME_LIST, type GameDefinition } from "@/lib/games/game-types";
import { awardXp, bumpStat, checkSiteAchievements } from "@/lib/profile/player-profile";
import {
  BOSS_TIME_PER_WORD_MS,
  HIT_EFFECT_MS,
  LANE_COUNT,
  TICK_MS,
  useWordBlaster,
} from "@/lib/games/use-word-blaster";
import { getGameBest, recordGameResult, type GameBest } from "@/lib/games/game-scores";
import { playSound } from "@/lib/games/game-audio";
import { sound } from "@/lib/audio/game-sounds";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { calculateAccuracy, round } from "@/lib/typing-engine/stats";
import { cn } from "@/lib/utils/cn";
import { HealthBar, IncomingWarning, WordDisplay } from "@/components/games/ui/game-chrome";

// Reference height for the turret's aim-angle trig only — the board's real
// height varies by breakpoint via the `--board-h` CSS var below, and this
// constant being slightly stale just points the barrel a few degrees off,
// same tolerance the original geometry comment already accepted.
const BOARD_HEIGHT = 620;

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
/** How long a damage-number popup stays on screen before it's aged out. */
const DAMAGE_POPUP_MS = 750;
/** How long the combo-milestone banner stays up after the triggering kill. */
const COMBO_BANNER_MS = 1100;

/** Where an enemy sits across the field, 0 = spawn edge, 1 = base wall. */
function enemyX(progress: number): number {
  return SPAWN_X - progress * (SPAWN_X - BASE_X);
}

function laneY(lane: number): number {
  return ((lane + 0.5) / LANE_COUNT) * 100;
}

interface WordBlasterGameProps {
  definition: GameDefinition;
  /** Resolved art URLs (see game-client.tsx) — every key is optional, and
   *  every piece of art below has a plain CSS/icon fallback so a missing
   *  file is a quieter board, never a broken one. */
  art?: Record<string, string | null>;
}

export function WordBlasterGame({ definition, art }: WordBlasterGameProps) {
  const heroArt = art?.hero ?? null;
  const gunnerArt = art?.["char-fg"] ?? null;
  const droneArt = art?.["enemy-drone"] ?? null;
  const heavyArt = art?.["enemy-heavy"] ?? null;
  const bossArt = art?.["boss-dreadnought"] ?? null;

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
  const bossTracerActive =
    state.lastBossHitMs !== null && now - state.lastBossHitMs < TRACER_MS;
  const isFiring = tracers.length > 0 || bossTracerActive;
  const breachFlash = state.lastBreachMs !== null && now - state.lastBreachMs < BREACH_FLASH_MS;
  const bossEscapeFlash =
    state.lastBossEscapeMs !== null && now - state.lastBossEscapeMs < BREACH_FLASH_MS;
  // A landed word should read as an impact on the boss itself, not just a
  // number in the corner — a brief flash/shake on the art, same idea as the
  // breach flash on the wall.
  const bossHitFlash =
    state.lastBossHitMs !== null && now - state.lastBossHitMs < BREACH_FLASH_MS;

  // Damage-number popups. Every value shown is a real amount the reducer
  // already computed (HitEffect.points / lastBossHitPoints) — never a
  // decorative placeholder, per the rule that a visual must correspond to
  // real state or not exist at all.
  const damagePopups = [
    ...state.hits
      .filter((hit) => now - hit.bornMs < DAMAGE_POPUP_MS)
      .map((hit) => ({
        key: `hit-${hit.seq}`,
        x: enemyX(hit.progress),
        y: laneY(hit.lane),
        points: hit.points,
        age: now - hit.bornMs,
      })),
    ...(state.lastBossHitMs !== null && now - state.lastBossHitMs < DAMAGE_POPUP_MS
      ? [
          {
            key: `boss-${state.lastBossHitMs}`,
            x: 78,
            y: 46,
            points: state.lastBossHitPoints,
            age: now - state.lastBossHitMs,
          },
        ]
      : []),
  ];

  // The combo banner reads the timestamp of whatever scoring event most
  // recently happened (a lane kill or a boss hit) rather than its own timer,
  // so it can never drift from the number it's celebrating.
  const lastScoreEventMs = Math.max(
    state.hits.length > 0 ? state.hits[state.hits.length - 1].bornMs : -Infinity,
    state.lastBossHitMs ?? -Infinity,
  );
  const showComboBanner =
    state.combo > 0 && state.combo % 5 === 0 && now - lastScoreEventMs < COMBO_BANNER_MS;

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
  // preview of where the shot will go. During a boss encounter it points at
  // the boss instead, since the lane field is empty by then anyway.
  const aimTarget =
    locked ??
    (state.enemies.length > 0
      ? state.enemies.reduce((a, b) => (b.progress > a.progress ? b : a))
      : null);

  let aimAngle = 0;
  if (state.boss) {
    const dx = ((78 - MUZZLE_X) / 100) * boardWidth;
    const dy = ((46 - 50) / 100) * BOARD_HEIGHT;
    aimAngle = (Math.atan2(dy, Math.max(dx, 1)) * 180) / Math.PI;
  } else if (aimTarget) {
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
  const prevRef = useRef({
    correct: 0,
    incorrect: 0,
    destroyed: 0,
    breached: 0,
    combo: 0,
    bossActive: false,
    bossesDefeated: 0,
    lastBossEscapeMs: null as number | null,
    lastBossHitMs: null as number | null,
  });
  useEffect(() => {
    const prev = prevRef.current;
    const s = state;

    if (s.correctKeystrokes > prev.correct) playSound("key", soundEnabled);
    if (s.incorrectKeystrokes > prev.incorrect) playSound("typo", soundEnabled);

    // A boss kill also increments `destroyed` — excluded here so it doesn't
    // double up with the boss-fanfare cue below.
    if (s.destroyed > prev.destroyed && s.bossesDefeated === prev.bossesDefeated) {
      playSound("clear", soundEnabled);
      sound("wb-explosion", soundEnabled);
      sound("turret-fire", soundEnabled, { volume: 0.7 });
    }
    if (s.breached > prev.breached) {
      playSound("miss", soundEnabled);
      sound("base-alarm", soundEnabled);
    }
    // Milestone only — a chime on every single kill would be exhausting.
    if (s.combo > prev.combo && s.combo > 0 && s.combo % 5 === 0) {
      playSound("combo", soundEnabled);
      sound("combo-milestone", soundEnabled);
    }

    if (!prev.bossActive && s.boss) sound("boss-intro", soundEnabled);
    if (s.bossesDefeated > prev.bossesDefeated) {
      sound("boss-fanfare", soundEnabled);
    } else if (s.lastBossHitMs !== null && s.lastBossHitMs !== prev.lastBossHitMs) {
      sound("boss-core-hit", soundEnabled);
    }
    if (s.lastBossEscapeMs !== null && s.lastBossEscapeMs !== prev.lastBossEscapeMs) {
      sound("base-alarm", soundEnabled);
    }

    prevRef.current = {
      correct: s.correctKeystrokes,
      incorrect: s.incorrectKeystrokes,
      destroyed: s.destroyed,
      breached: s.breached,
      combo: s.combo,
      bossActive: s.boss !== null,
      bossesDefeated: s.bossesDefeated,
      lastBossEscapeMs: s.lastBossEscapeMs,
      lastBossHitMs: s.lastBossHitMs,
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
    sound("wb-defeat", soundEnabled);
    // Every game must feed the cross-game profile, or "play every game"
    // (site:all-games) can never be earned no matter how much is played.
    bumpStat(definition.id, "runs");
    awardXp(Math.round(state.score / 10) + state.destroyed * 3);
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
  const boss = state.boss;
  const bossTimeLeftMs = boss ? boss.deadlineMs - now : 0;
  const bossTimeFraction = boss ? Math.max(0, Math.min(1, bossTimeLeftMs / BOSS_TIME_PER_WORD_MS)) : 0;

  return (
    <div className="flex w-full max-w-4xl flex-col gap-3">
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
        className="relative w-full overflow-hidden rounded-2xl border border-border bg-background arcade-edge arcade-scanlines [--board-h:clamp(320px,65vh,440px)] sm:[--board-h:clamp(360px,70vh,560px)] lg:[--board-h:clamp(400px,72vh,680px)]"
        style={{ height: "var(--board-h)" }}
      >
        {heroArt && (
          <Image
            src={heroArt}
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 900px"
            quality={55}
            className="object-cover opacity-45"
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 arcade-haze" />
        <div aria-hidden="true" className="absolute inset-0 arcade-grid opacity-30" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"
        />

        {/* Lane separators, so a lane reads as a firing line rather than as
            arbitrary vertical space. Hidden during a boss encounter, when the
            lane field is empty and the boss panel owns the board instead. */}
        {!boss &&
          Array.from({ length: LANE_COUNT - 1 }, (_, i) => (
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
            opacity: breachFlash || bossEscapeFlash ? 1 : 0.55,
            background:
              "linear-gradient(to right, color-mix(in srgb, var(--error) 30%, transparent) 0%, transparent 100%)",
          }}
        />

        {/* The wall an enemy must not reach. */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 w-0.5 transition-colors",
            breachFlash || bossEscapeFlash ? "bg-error" : "bg-accent/55",
          )}
          style={{ left: `${BASE_X}%` }}
        />

        {!boss &&
          state.enemies.map((enemy) => {
            const isTarget = enemy.id === state.lockedId;
            const matched = isTarget ? state.typed.length : 0;
            const inDanger = enemy.progress >= DANGER_FROM;
            const craftArt = enemy.id % 2 === 0 ? droneArt : (heavyArt ?? droneArt);
            return (
              <span
                key={enemy.id}
                className="absolute flex items-center gap-1.5 whitespace-nowrap transition-[left,transform] ease-linear"
                style={{
                  // Matches the engine tick so stepped updates read as continuous
                  // motion without running the loop at frame rate.
                  transitionDuration: `${TICK_MS}ms`,
                  left: `${enemyX(enemy.progress)}%`,
                  top: `${laneY(enemy.lane)}%`,
                  // The horizontal anchor interpolates from the word's right edge
                  // at spawn to its left edge at the wall, which is the only way
                  // to get both ends right without knowing the text width here.
                  transform: `translate(${-100 * (1 - enemy.progress)}%, -50%)`,
                }}
              >
                {craftArt ? (
                  <span className="relative -my-2 h-7 w-9 shrink-0 sm:h-9 sm:w-12" style={{ transform: "scaleX(-1)" }}>
                    <Image src={craftArt} alt="" fill sizes="48px" className="object-contain" />
                  </span>
                ) : (
                  <Triangle size={10} aria-hidden="true" className="-rotate-90 fill-current opacity-70" />
                )}
                {/* A word sitting directly over the environment art was
                    unreadable at low contrast, whatever colour it used — a
                    solid backdrop chip guarantees legibility regardless of
                    what's behind it, the same trick the boss's WordDisplay
                    already relies on. */}
                <span
                  className={cn(
                    "rounded-md border bg-background/80 px-1.5 py-0.5 font-mono text-sm font-semibold tracking-tight backdrop-blur-[1px] sm:text-lg",
                    isTarget
                      ? "border-accent text-accent arcade-glow"
                      : inDanger
                        ? "border-error/60 text-error"
                        : "border-border/60 text-foreground",
                  )}
                >
                  {matched > 0 && (
                    <span className="text-accent underline decoration-2 underline-offset-2">
                      {enemy.text.slice(0, matched)}
                    </span>
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
          {isPlaying && !boss && aimTarget && (
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
          {isPlaying && boss && (
            <line
              x1={MUZZLE_X}
              y1={50}
              x2={78}
              y2={46}
              stroke="var(--accent)"
              strokeWidth={1}
              strokeDasharray="4 5"
              strokeOpacity={0.4}
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
          {bossTracerActive && (
            <line
              x1={MUZZLE_X}
              y1={50}
              x2={78}
              y2={46}
              stroke="var(--accent)"
              strokeWidth={3}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
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

        {/* Damage numbers — real per-kill score, floating up and fading. Ages
            itself out the same way hit effects do: derived from elapsed time,
            nothing to unmount by hand. */}
        {damagePopups.map((popup) => {
          const t = popup.age / DAMAGE_POPUP_MS;
          return (
            <span
              key={popup.key}
              aria-hidden="true"
              className="pointer-events-none absolute font-mono text-sm font-bold tabular-nums text-accent arcade-glow sm:text-base"
              style={{
                left: `${popup.x}%`,
                top: `${popup.y}%`,
                transform: `translate(-50%, calc(-50% - ${t * 26}px))`,
                opacity: 1 - t,
              }}
            >
              +{popup.points}
            </span>
          );
        })}

        {/* Combo milestone banner — only ever shown alongside a real combo
            value already reflected in the stat row above, never a standalone
            decoration. */}
        {showComboBanner && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[18%] -translate-x-1/2 whitespace-nowrap rounded-full border border-accent bg-background/80 px-4 py-1.5 font-mono text-sm font-bold uppercase tracking-[0.2em] text-accent arcade-glow"
            style={{ opacity: 1 - (now - lastScoreEventMs) / COMBO_BANNER_MS }}
          >
            {state.combo}x combo
          </div>
        )}

        {/* The turret: the gunner cutout when art is available, tracking the
            target it would shoot and recoiling on every kill. Falls back to
            the original abstract circle-and-barrel when no art is provided. */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute transition-transform duration-100 ease-out",
            gunnerArt ? "h-24 w-24 sm:h-32 sm:w-32" : "h-8 w-8",
          )}
          style={{
            left: `${BASE_X}%`,
            top: "50%",
            transform: `translate(calc(-38% - ${isFiring ? 4 : 0}px), -50%)`,
          }}
        >
          {gunnerArt ? (
            <>
              <span
                className="absolute inset-0 origin-[38%_50%] transition-transform duration-100 ease-out"
                style={{ transform: `rotate(${aimAngle * 0.35}deg)` }}
              >
                <Image src={gunnerArt} alt="" fill sizes="128px" className="object-contain drop-shadow-[0_0_12px_rgba(0,0,0,0.5)]" />
              </span>
              {isFiring && (
                <span className="absolute right-0 top-1/2 h-6 w-6 -translate-y-1/2 translate-x-1/2 rounded-full bg-accent/50 blur-[4px]" />
              )}
            </>
          ) : (
            <>
              <span
                className="absolute left-1/2 top-1/2 h-[5px] w-9 origin-left rounded-full bg-accent transition-transform duration-100 ease-out"
                style={{ transform: `translateY(-50%) rotate(${aimAngle}deg)` }}
              />
              {isFiring && <span className="absolute -inset-2 rounded-full bg-accent/35 blur-[3px]" />}
              <span
                className={cn(
                  "absolute inset-0 rounded-full border-2 border-accent bg-background transition-transform duration-100",
                  isFiring ? "scale-110" : "scale-100",
                )}
              />
              <span className="absolute inset-[7px] rounded-full bg-accent/75" />
            </>
          )}
        </div>

        {/* Boss encounter — takes over the board while active. Reuses the
            shared HealthBar/WordDisplay/IncomingWarning from game-chrome.tsx
            (built for Boss Battle) rather than one-off components, proving the
            shared kit generalises to a second game. */}
        {boss && (
          <div
            className={cn(
              "absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-6",
              bossHitFlash && "boss-shake",
            )}
          >
            <div className="flex flex-col gap-2">
              <HealthBar
                label="Boss"
                current={boss.hp}
                max={boss.maxHp}
                phases={boss.maxHp}
                phase={boss.maxHp - boss.hp}
                tone="error"
              />
              <div
                className="h-1 w-full overflow-hidden rounded-full bg-sub-alt/60"
                role="progressbar"
                aria-label="Time remaining on this word"
                aria-valuenow={Math.round(bossTimeFraction * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={cn(
                    "h-full transition-[width] ease-linear",
                    bossTimeLeftMs < 1500 ? "bg-error" : "bg-accent",
                  )}
                  style={{
                    width: `${bossTimeFraction * 100}%`,
                    transitionDuration: `${TICK_MS}ms`,
                  }}
                />
              </div>
              <IncomingWarning show={bossTimeLeftMs < 1500} text="Target escaping!" />
            </div>

            {bossArt && (
              <div
                className={cn(
                  "pointer-events-none absolute right-[4%] top-1/2 h-[70%] w-[42%] -translate-y-1/2 opacity-90 transition-transform duration-100 sm:w-[38%]",
                  bossHitFlash ? "translate-x-[-6px]" : "translate-x-0",
                )}
              >
                <div className={cn("relative h-full w-full", !bossHitFlash && "arcade-breathe")}>
                  {/* Mirrored so the art's spire leans toward the turret
                      instead of away from it — the source image's default
                      orientation reads as facing up-right, not left. */}
                  <Image
                    src={bossArt}
                    alt=""
                    fill
                    sizes="480px"
                    className="object-contain"
                    style={{ transform: "scaleX(-1)" }}
                  />
                  {bossHitFlash && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-error/40 mix-blend-screen"
                      style={{ filter: "blur(12px)" }}
                    />
                  )}
                </div>
              </div>
            )}

            <div className="relative z-10">
              <WordDisplay word={boss.word} typed={state.typed} shake={false} />
            </div>
          </div>
        )}

        {!isPlaying && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm">
            {state.status === "idle" && (
              <StartCard definition={definition} best={best} charArt={gunnerArt} onStart={handleStart} />
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
                bossesDefeated={state.bossesDefeated}
                accuracy={accuracy}
                isNewBest={isNewBest}
                best={best}
                defeatArt={art?.defeat ?? null}
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
  charArt,
  onStart,
}: {
  definition: GameDefinition;
  best: GameBest | null;
  charArt: string | null;
  onStart: () => void;
}) {
  return (
    <div className="flex max-w-sm flex-col items-center gap-4 text-center">
      {charArt && (
        <div className="relative h-28 w-28 sm:h-36 sm:w-36">
          <Image src={charArt} alt="" fill sizes="144px" className="object-contain" />
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
        Type an enemy&apos;s word to shoot it down — survive the boss when it arrives
      </p>
    </div>
  );
}

function GameOverCard({
  score,
  destroyed,
  bestCombo,
  bossesDefeated,
  accuracy,
  isNewBest,
  best,
  defeatArt,
  onRestart,
}: {
  score: number;
  destroyed: number;
  bestCombo: number;
  bossesDefeated: number;
  accuracy: number;
  isNewBest: boolean;
  best: GameBest | null;
  defeatArt: string | null;
  onRestart: () => void;
}) {
  return (
    <div
      className="relative flex w-full max-w-sm flex-col items-center gap-4 overflow-hidden rounded-2xl border border-border p-6 text-center"
      role="status"
      aria-live="polite"
    >
      {defeatArt && (
        <>
          <Image src={defeatArt} alt="" fill sizes="384px" quality={60} className="object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/40" />
        </>
      )}

      <div className="relative z-10 flex flex-col items-center gap-4">
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

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 font-mono text-xs tabular-nums text-sub">
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
          {bossesDefeated > 0 && (
            <span className="flex items-center gap-1.5 text-accent">
              <Trophy size={12} />
              {bossesDefeated} {bossesDefeated === 1 ? "boss" : "bosses"}
            </span>
          )}
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
    </div>
  );
}
