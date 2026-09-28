"use client";

/**
 * Typing Survivor — horde survival driven by typing.
 *
 * Enemies are drawn to a canvas rather than the DOM. At wave ten there can be
 * a dozen of them moving every tick, and a node per enemy with a transform on
 * it forces style and layout work on every frame; the canvas does not. Their
 * words still render as DOM text so they stay selectable and legible.
 *
 * Positions are fractions of the arena, converted to pixels only at draw time,
 * so nothing breaks when the board shrinks on a phone.
 */

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Flame,
  Heart,
  Pause,
  Play,
  Shield,
  Skull,
  Swords,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import type { GameComponentProps } from "@/components/games/game-client";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { sound } from "@/lib/audio/game-sounds";
import { duck, playMusic, preload, resumeAudio, stopMusic } from "@/lib/audio/audio-bus";
import { FxSystem } from "@/lib/fx/particles";
import { awardXp,
  checkSiteAchievements, bumpStat, grantAchievement } from "@/lib/profile/player-profile";
import { recordGameResult, recordGameStart } from "@/lib/games/game-scores";
import { CHARACTERS } from "@/lib/games/survivor/content";
import { useSurvivor, type Enemy } from "@/lib/games/survivor/use-survivor";
import {
  GameStage,
  PauseOverlay,
  RuleCard,
  StartButton,
  StatTile,
} from "@/components/games/ui/game-chrome";
import { GameViewport } from "@/components/games/ui/game-viewport";
import { GAME_LIST } from "@/lib/games/game-types";
import { cn } from "@/lib/utils/cn";

const ACCENT = "#f97316";
const ART = {
  arena: "/games/typing-survivor/bg-waystation.webp",
  upgrade: "/games/typing-survivor/upgrade.webp",
  victory: "/games/typing-survivor/victory.webp",
  defeat: "/games/typing-survivor/defeat.webp",
};
const MUSIC = {
  menu: "/audio/music/survivor-menu.opus",
  combat: "/audio/music/survivor-combat.opus",
  boss: "/audio/music/survivor-boss.opus",
};

export default function TypingSurvivorGame({ definition }: GameComponentProps) {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fxRef = useRef<FxSystem | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const fx = useCallback(() => {
    fxRef.current ??= new FxSystem();
    return fxRef.current;
  }, []);

  const burst = useCallback(
    (e: Enemy, color: string, count: number) => {
      if (reducedMotion) return;
      const el = boardRef.current;
      if (!el) return;
      const { x, y } = placeEnemy(e, el.clientWidth, el.clientHeight);
      fx().burst(x, y, { count, color, speed: 200, life: 0.45, gravity: 180, shape: "spark" });
    },
    [fx, reducedMotion],
  );

  const game = useSurvivor(undefined, {
    onStrike: (e, damage, crit) => {
      sound(crit ? "crit-hit" : "key-correct", soundEnabled, { vary: 70, volume: crit ? 1 : 0.5 });
      burst(e, crit ? "#fde68a" : ACCENT, crit ? 18 : 8);
      const el = boardRef.current;
      if (el && !reducedMotion) {
        const { x, y } = placeEnemy(e, el.clientWidth, el.clientHeight);
        fx().floatText(x, y - 12, `${damage}`, crit ? "#fde68a" : "#fed7aa", crit ? 20 : 14);
      }
    },
    onKill: (e, damage, crit) => {
      sound("enemy-death", soundEnabled, { vary: 90 });
      burst(e, "#f87171", 22);
      if (crit && !reducedMotion) fx().shake(5);
      const el = boardRef.current;
      if (el && !reducedMotion) {
        const { x, y } = placeEnemy(e, el.clientWidth, el.clientHeight);
        fx().floatText(x, y - 14, `${damage}`, "#fca5a5", 18);
      }
    },
    onHit: (amount) => {
      sound("player-death", soundEnabled, { volume: 0.35 });
      if (!reducedMotion) {
        fx().shake(Math.min(12, 3 + amount * 0.3));
        fx().flash("#ef4444", 0.25);
      }
    },
    onLevel: () => {
      sound("level-up", soundEnabled);
      duck(0.45, 0.5);
    },
    onMiss: () => sound("key-wrong", soundEnabled),
    onPhase: (phase) => {
      if (phase === "playing") void playMusic(MUSIC.combat);
      else if (phase === "over" || phase === "won") void playMusic(null);
    },
  });

  const { state } = game;
  const bossPresent = useMemo(
    () => game.alive.some((e) => e.type.kind === "boss"),
    [game.alive],
  );

  useEffect(() => {
    preload([MUSIC.menu, MUSIC.combat]);
    return () => stopMusic();
  }, []);

  // Swap to the boss track when one is on the field.
  useEffect(() => {
    if (state.phase !== "playing") return;
    void playMusic(bossPresent ? MUSIC.boss : MUSIC.combat);
  }, [bossPresent, state.phase]);

  useEffect(() => {
    if (state.phase === "playing" && !game.paused) inputRef.current?.focus();
  }, [state.phase, game.paused]);

  // Canvas: enemies plus particles. rAF is right here because it only draws.
  useEffect(() => {
    const canvas = canvasRef.current;
    const board = boardRef.current;
    if (!canvas || !board) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (state.phase !== "playing") {
      const w = board.clientWidth;
      const h = board.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      fx().draw(ctx, w, h);
      return;
    }

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      if (typeof document !== "undefined" && document.hidden) {
        raf = requestAnimationFrame(loop);
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = board.clientWidth;
      const h = board.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      fx().update(dt);
      fx().draw(ctx, w, h);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [fx, state.phase]);

  // Bank the run once when it ends.
  const banked = useRef(false);
  useEffect(() => {
    if (state.phase !== "over" && state.phase !== "won") {
      banked.current = false;
      return;
    }
    if (banked.current) return;
    banked.current = true;
    recordGameResult("typing-survivor", {
      score: state.score,
      cleared: state.wave,
      bestCombo: state.bestCombo,
      survivedMs: 0,
    });
    bumpStat("typing-survivor", "runs");
    grantAchievement("typing-survivor:first-run");
    if (state.wave >= 5) grantAchievement("typing-survivor:wave-5");
    if (state.wave >= 10) grantAchievement("typing-survivor:wave-10");
    if (state.bestCombo >= 25) grantAchievement("typing-survivor:combo-25");
    if (state.phase === "won") {
      grantAchievement("typing-survivor:win");
      bumpStat("typing-survivor", "wins");
    }
    awardXp(Math.round(state.score / 10) + state.wave * 15);
    checkSiteAchievements(GAME_LIST.map((g) => g.id));
  }, [state.phase, state.wave, state.score, state.bestCombo]);

  const [isFocused, setIsFocused] = useState(true);

  // Restart on Enter / Space when game is over
  useEffect(() => {
    if (state.phase !== "over" && state.phase !== "won") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        game.reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.phase, game]);

  const handleStart = (id: string) => {
    recordGameStart("typing-survivor");
    resumeAudio();
    sound("select", soundEnabled);
    game.start(id);
    window.setTimeout(() => inputRef.current?.focus(), 30);
  };

  const background =
    state.phase === "over" ? ART.defeat : state.phase === "won" ? ART.victory : ART.arena;

  return (
    <GameViewport
      onFocusGame={() => inputRef.current?.focus()}
      isFocused={isFocused}
      isRunning={state.phase === "playing"}
      className="w-full max-w-3xl gap-3"
      style={{ ["--accent" as string]: ACCENT }}
    >
      {state.phase !== "select" && (
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-sub">
          <StatTile icon={<Heart size={13} />} label="Health" value={`${Math.ceil(state.hp)}/${state.maxHp}`} tone="error" />
          <StatTile icon={<Swords size={13} />} label="Wave" value={state.wave} tone="accent" />
          <StatTile icon={<Skull size={13} />} label="Kills" value={state.kills} />
          <StatTile icon={<Flame size={13} />} label="Combo" value={`x${state.combo}`} tone={state.combo > 4 ? "accent" : "default"} />
          <StatTile icon={<Zap size={13} />} label="Level" value={state.level} />
          <div className="ml-auto flex items-center gap-1">
            {state.phase === "playing" && (
              <button
                type="button"
                onClick={() => game.setPaused(!game.paused)}
                aria-label={game.paused ? "Resume" : "Pause"}
                className="-m-2 flex min-h-11 min-w-11 items-center justify-center p-2 text-sub/60 transition-colors hover:text-foreground sm:m-0 sm:min-h-0 sm:min-w-0 sm:p-0"
              >
                {game.paused ? <Play size={15} /> : <Pause size={15} />}
              </button>
            )}
            <button
              type="button"
              onClick={toggleSound}
              aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
              className="-m-2 flex min-h-11 min-w-11 items-center justify-center p-2 text-sub/60 transition-colors hover:text-foreground sm:m-0 sm:min-h-0 sm:min-w-0 sm:p-0"
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
          </div>
        </div>
      )}

      <GameStage
        art={background}
        danger={state.hp / Math.max(1, state.maxHp) < 0.3}
        className="[--board-h:var(--safe-board-height,clamp(320px,58dvh,500px))] cursor-pointer"
      >
        <div
          ref={boardRef}
          onClick={() => {
            if (state.phase === "playing") inputRef.current?.focus();
          }}
          className="relative h-full w-full"
        >
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 h-full w-full"
          />

          {state.banner && (
            <div
              role="status"
              aria-live="polite"
              className="pointer-events-none absolute inset-x-3 top-3 z-30 rounded-lg border border-accent/60 bg-background/90 px-3 py-2 text-center font-mono text-[11px] uppercase tracking-wider text-accent backdrop-blur-sm"
            >
              {state.banner}
            </div>
          )}

          {state.phase === "select" && (
            <div className="relative z-10 flex h-full flex-col gap-3 overflow-y-auto p-4">
              <h2 className="text-center font-mono text-sm uppercase tracking-widest text-accent">
                Choose your survivor
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CHARACTERS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleStart(c.id)}
                    className="group flex min-h-11 flex-col overflow-hidden rounded-lg border border-border text-left transition-colors hover:border-accent focus-visible:border-accent"
                  >
                    <div className="relative h-16 w-full sm:h-20">
                      <Image src={c.art} alt="" fill sizes="160px" className="object-cover object-top" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                    </div>
                    <div className="p-2">
                      <p className="font-mono text-xs font-semibold text-foreground">{c.name}</p>
                      <p className="font-mono text-[9px] uppercase tracking-wide text-accent">{c.identity}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <RuleCard icon={<Swords size={13} />} title="Type to strike" body="Every enemy carries a word. Longer words hit harder." />
                <RuleCard icon={<Zap size={13} />} title="Draft upgrades" body="Level up and choose. Your picks decide what good typing means." />
                <RuleCard icon={<Shield size={13} />} title="Survive" body="Enemies that reach you deal damage. A boss arrives every fifth wave." />
              </div>
            </div>
          )}

          {state.phase === "playing" && (
            <>
              {/* Targeting laser beam connecting player to locked enemy */}
              {state.lockedUid && (() => {
                const lockedEnemy = game.alive.find((e) => e.uid === state.lockedUid);
                if (!lockedEnemy) return null;
                const radius = 0.5 - 0.5 * lockedEnemy.progress;
                const rawTargetX = 50 + Math.cos(lockedEnemy.angle) * radius * 82;
                const rawTargetY = 50 + Math.sin(lockedEnemy.angle) * radius * 78;
                const targetX = Math.max(8, Math.min(92, rawTargetX));
                const targetY = Math.max(8, Math.min(92, rawTargetY));
                return (
                  <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full">
                    <defs>
                      <linearGradient id="survivorLaser" x1="50%" y1="50%" x2={`${targetX}%`} y2={`${targetY}%`}>
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#fde68a" stopOpacity="0.4" />
                      </linearGradient>
                    </defs>
                    <line
                      x1="50%"
                      y1="50%"
                      x2={`${targetX}%`}
                      y2={`${targetY}%`}
                      stroke="url(#survivorLaser)"
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                      className="animate-pulse"
                    />
                  </svg>
                );
              })()}

              {game.alive.map((e) => (
                <EnemySprite
                  key={e.uid}
                  enemy={e}
                  locked={e.uid === state.lockedUid}
                  onSelect={() => {
                    game.setTyped(e.word.slice(0, 1));
                    inputRef.current?.focus();
                  }}
                />
              ))}
              {/* The player sits at the centre; everything converges on it. */}
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 z-10 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-background"
                style={{ boxShadow: "0 0 18px -2px color-mix(in srgb, var(--accent) 80%, transparent)" }}
              />
              {game.paused && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/80 font-mono text-sm text-sub">
                  paused
                </div>
              )}

              {/* Lost focus prompt */}
              {!isFocused && !game.paused && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.focus();
                  }}
                  className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm transition-all"
                  aria-label="Tap to resume firing"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-accent animate-bounce">
                    <Swords size={24} />
                  </div>
                  <span className="font-mono text-sm font-semibold tracking-wide text-foreground">
                    Tap to resume firing
                  </span>
                  <span className="font-mono text-xs text-sub">Focus lost</span>
                </button>
              )}
            </>
          )}

          {state.phase === "draft" && (
            <div className="relative z-30 flex h-full flex-col justify-center gap-3 overflow-y-auto bg-background/85 p-4 backdrop-blur-sm">
              <h2 className="text-center font-mono text-sm uppercase tracking-widest text-accent">
                Level {state.level} — choose an upgrade
              </h2>
              <div className="grid gap-2 sm:grid-cols-3">
                {game.offerDefs.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => game.takeUpgrade(u.id)}
                    className="flex min-h-11 flex-col gap-1.5 rounded-lg border border-border bg-sub-alt/50 p-3 text-left transition-colors hover:border-accent"
                  >
                    <span className="font-mono text-xs font-bold text-foreground">{u.name}</span>
                    <span className="w-fit rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-accent">
                      {u.archetype}
                    </span>
                    <span className="text-[11px] leading-snug text-sub">{u.effect}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(state.phase === "over" || state.phase === "won") && (
            <div className="relative z-30 flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
              <p className="font-mono text-xl font-bold uppercase text-foreground arcade-glow">
                {state.phase === "won" ? "You survived" : `Wave ${state.wave}`}
              </p>
              <div className="grid w-full max-w-sm grid-cols-3 gap-2">
                <StatTile icon={<Skull size={13} />} label="Kills" value={state.kills} />
                <StatTile icon={<Flame size={13} />} label="Best combo" value={`x${state.bestCombo}`} tone="accent" />
                <StatTile icon={<Zap size={13} />} label="Level" value={state.level} />
              </div>
              {game.upgradeDefs.length > 0 && (
                <p className="max-w-sm font-mono text-[10px] uppercase tracking-wide text-sub">
                  {game.upgradeDefs.map((u) => u.name).join(" · ")}
                </p>
              )}
              <StartButton onClick={() => game.reset()} label="Run again" />
              <p className="font-mono text-[10px] text-sub">
                Press Space or Enter to restart
              </p>
            </div>
          )}

          {game.paused && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <PauseOverlay onResume={() => game.setPaused(false)} />
            </div>
          )}
        </div>
      </GameStage>

      {state.phase === "playing" && (
        <input
          ref={inputRef}
          value={state.typed}
          onChange={(e) => game.setTyped(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-label="Type an enemy's word"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full rounded-lg border border-border bg-sub-alt px-3 py-3 text-center font-mono text-base tracking-widest text-foreground outline-none focus:border-accent"
          placeholder="type an enemy…"
        />
      )}

      <p className="text-center text-xs text-sub">{definition.tagline}</p>
    </GameViewport>
  );
}

/**
 * Where an enemy sits, as pixels inside the arena.
 *
 * Kept as a free function so the canvas and the DOM labels agree exactly;
 * computing it twice in two places is how a label ends up drifting from the
 * sprite it belongs to.
 */
function placeEnemy(e: Enemy, w: number, h: number): { x: number; y: number } {
  const radius = 0.5 - 0.5 * e.progress;
  const rawX = w / 2 + Math.cos(e.angle) * radius * w * 0.82;
  const rawY = h / 2 + Math.sin(e.angle) * radius * h * 0.78;
  return {
    x: Math.max(w * 0.08, Math.min(w * 0.92, rawX)),
    y: Math.max(h * 0.08, Math.min(h * 0.92, rawY)),
  };
}

function EnemySprite({
  enemy,
  locked,
  onSelect,
}: {
  enemy: Enemy;
  locked: boolean;
  onSelect?: () => void;
}) {
  const radius = 0.5 - 0.5 * enemy.progress;
  const rawLeft = 50 + Math.cos(enemy.angle) * radius * 82;
  const rawTop = 50 + Math.sin(enemy.angle) * radius * 78;
  const left = Math.max(8, Math.min(92, rawLeft));
  const top = Math.max(8, Math.min(92, rawTop));
  const danger = enemy.progress > 0.72;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      className="absolute z-10 flex flex-col items-center gap-0.5 cursor-pointer select-none transition-transform hover:scale-105 active:scale-95"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className={cn(
          "relative h-8 w-8 overflow-hidden rounded-md border transition-all sm:h-11 sm:w-11",
          enemy.hitFlash > 0
            ? "border-warning ring-2 ring-warning/60"
            : locked
              ? "border-accent ring-2 ring-accent/60 shadow-lg shadow-accent/30 scale-105"
              : danger
                ? "border-error ring-1 ring-error/40"
                : "border-border/70",
        )}
      >
        <Image src={enemy.type.art} alt="" fill sizes="44px" className="object-cover" />
      </div>
      {/* The word is the interface. It gets a solid backing so it stays
          legible over whatever art it happens to be crossing. */}
      <span
        className={cn(
          "whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[10px] leading-none backdrop-blur-sm sm:text-xs shadow",
          locked ? "bg-accent/25 ring-1 ring-accent font-bold" : "bg-background/85",
          danger && !locked && "text-error",
        )}
      >
        {enemy.word.split("").map((ch, i) => (
          <span key={i} className={i < enemy.typed ? "text-accent font-bold" : undefined}>
            {ch}
          </span>
        ))}
      </span>
    </div>
  );
}
