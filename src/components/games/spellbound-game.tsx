"use client";

/**
 * Spellbound — a typing roguelite.
 *
 * Layout notes that matter on a phone: the board height is a CSS variable so it
 * shrinks with the viewport rather than being a fixed pixel box, and every
 * position inside it is a percentage. An earlier game here computed lane
 * positions in pixels against a fixed 440px board and clipped its words off the
 * edge on any narrow screen; nothing in this file uses a pixel offset for
 * anything the player has to read.
 */

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, Pause, Play, Sparkles, Volume2, VolumeX, Zap } from "lucide-react";
import type { GameComponentProps } from "@/components/games/game-client";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { sound } from "@/lib/audio/game-sounds";
import { duck, playMusic, preload, resumeAudio, stopMusic } from "@/lib/audio/audio-bus";
import { FxSystem } from "@/lib/fx/particles";
import {
  awardXp,
  checkSiteAchievements,
  bumpStat,
  grantAchievement,
  grantUnlock,
  hasUnlock,
} from "@/lib/profile/player-profile";
import { recordGameResult } from "@/lib/games/game-scores";
import {
  ACHIEVEMENTS,
  ART,
  MUSIC,
  SPELLS,
  UNLOCKS,
  relicById,
} from "@/lib/games/spellbound/content";
import {
  CHARACTERS,
  useSpellbound,
  type EnemyState,
} from "@/lib/games/spellbound/use-spellbound";
import { GAME_LIST } from "@/lib/games/game-types";
import { cn } from "@/lib/utils/cn";

const ACCENT = "#a855f7";

export default function SpellboundGame({ definition }: GameComponentProps) {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fxRef = useRef<FxSystem | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
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

  const burstAt = useCallback(
    (fraction: number, color: string, count: number) => {
      if (reducedMotion) return;
      const el = boardRef.current;
      if (!el) return;
      fx().burst(el.clientWidth * fraction, el.clientHeight * 0.42, {
        count,
        color,
        speed: 170,
        life: 0.5,
        gravity: 260,
        shape: "spark",
      });
    },
    [fx, reducedMotion],
  );

  const game = useSpellbound(undefined, {
    onCast: ({ spell, damage, crit }) => {
      sound(crit ? "crit-hit" : "key-correct", soundEnabled, { vary: 60 });
      if (crit) {
        duck(0.5, 0.4);
        if (!reducedMotion) fx().shake(7);
      }
      burstAt(0.35, crit ? "#fde68a" : ACCENT, crit ? 26 : 12);
      const el = boardRef.current;
      if (el && !reducedMotion) {
        fx().floatText(
          el.clientWidth * 0.35,
          el.clientHeight * 0.33,
          crit ? `${damage}!` : `${damage}`,
          crit ? "#fde68a" : "#e9d5ff",
          crit ? 26 : 18,
        );
      }
      if (spell.band === "long") {
        queueMicrotask(() => grantAchievement(ACHIEVEMENTS.longCast));
      }
    },
    onEnemyKilled: () => {
      sound("enemy-death", soundEnabled, { vary: 80 });
      burstAt(0.62, "#f87171", 18);
    },
    onPlayerHit: (amount) => {
      sound("player-death", soundEnabled, { volume: 0.4 });
      if (!reducedMotion) {
        fx().shake(Math.min(12, 3 + amount * 0.4));
        fx().flash("#ef4444", 0.28);
      }
    },
    onMiss: () => sound("key-wrong", soundEnabled),
  });

  const { state } = game;

  // Music & sound effects driven by state transitions
  useEffect(() => {
    if (state.phase === "combat") {
      void playMusic(state.roomKind === "boss" ? MUSIC.boss : MUSIC.combat);
    } else if (state.phase === "victory") {
      void playMusic(null);
      sound("new-record", soundEnabled);
    } else if (state.phase === "defeat") {
      void playMusic(null);
    }
  }, [state.phase, state.roomKind, soundEnabled]);

  // Preload only this game's audio, on mount, so the first cast is not silent
  // while a file downloads.
  useEffect(() => {
    preload([MUSIC.menu, MUSIC.combat]);
    return () => stopMusic();
  }, []);

  // Particle canvas. rAF is correct *here* -- it only draws, and a hidden pane
  // has nothing to draw. The game clock is a setInterval in the engine and
  // keeps running regardless.
  useEffect(() => {
    const canvas = canvasRef.current;
    const board = boardRef.current;
    if (!canvas || !board) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
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

  // Keep focus on the hidden input whenever a fight is live.
  useEffect(() => {
    if (state.phase === "combat" && !game.paused) inputRef.current?.focus();
  }, [state.phase, game.paused, state.room, state.floor]);

  // Record the run once, on the transition into an end state.
  const bankedRef = useRef(false);
  useEffect(() => {
    if (state.phase !== "victory" && state.phase !== "defeat") {
      bankedRef.current = false;
      return;
    }
    if (bankedRef.current) return;
    bankedRef.current = true;

    recordGameResult("spellbound", {
      score: state.score,
      cleared: state.floor,
      bestCombo: 0,
      survivedMs: 0,
    });

    bumpStat("spellbound", "runs");
    grantAchievement(ACHIEVEMENTS.firstRun);
    if (state.floor >= 2) grantAchievement(ACHIEVEMENTS.firstBoss);
    if (state.relics.length >= 6) grantAchievement(ACHIEVEMENTS.hoarder);
    if (state.cleanFloor) grantAchievement(ACHIEVEMENTS.flawlessFloor);
    if (state.phase === "victory") {
      grantAchievement(ACHIEVEMENTS.win);
      bumpStat("spellbound", "wins");
    }
    awardXp(Math.round(state.score / 8) + state.floor * 25);
    checkSiteAchievements(GAME_LIST.map((g) => g.id));

    // Unlocks are earned by depth, so a new character is a visible reward for
    // getting further rather than an arbitrary grind.
    if (state.floor >= 2) grantUnlock(UNLOCKS.rogueMage);
    if (state.floor >= 3) grantUnlock(UNLOCKS.chronomancer);
    if (state.phase === "victory") grantUnlock(UNLOCKS.voidMage);
  }, [state.phase, state.floor, state.score, state.relics.length, state.cleanFloor]);

  const handleStart = (characterId: string) => {
    resumeAudio();
    sound("select", soundEnabled);
    game.start(characterId);
    window.setTimeout(() => inputRef.current?.focus(), 30);
  };

  const [isFocused, setIsFocused] = useState(true);

  // Restart on Enter / Space when game is over
  useEffect(() => {
    if (state.phase !== "victory" && state.phase !== "defeat") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        game.reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.phase, game]);

  const background =
    state.phase === "shop"
      ? ART.bgShop
      : state.phase === "event"
        ? ART.bgEvent
        : state.phase === "reward"
          ? ART.bgTreasure
          : ART.bgDungeon;

  return (
    <div
      className="flex w-full max-w-3xl flex-col gap-3"
      style={{ ["--accent" as string]: ACCENT }}
    >
      <Hud game={game} soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <div
        ref={boardRef}
        onClick={() => {
          if (state.phase === "combat") inputRef.current?.focus();
        }}
        className="relative w-full overflow-hidden rounded-xl border border-border bg-background [--board-h:clamp(340px,58dvh,480px)] sm:[--board-h:440px] arcade-scanlines cursor-pointer"
        style={{ height: "var(--board-h)" }}
      >
        <Image
          src={background}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />

        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 h-full w-full"
        />

        {state.phase === "select" && (
          <CharacterSelect onPick={handleStart} />
        )}
        {state.phase === "combat" && (
          <Combat
            game={game}
            onSlotClick={(word) => {
              game.setTyped(word);
              inputRef.current?.focus();
            }}
          />
        )}
        {state.phase === "reward" && <Reward game={game} />}
        {state.phase === "shop" && <Shop game={game} />}
        {state.phase === "event" && <EventRoom game={game} />}
        {(state.phase === "victory" || state.phase === "defeat") && (
          <RunEnd game={game} onAgain={() => game.reset()} />
        )}

        {/* Lost focus prompt */}
        {state.phase === "combat" && !isFocused && !game.paused && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.focus();
            }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm transition-all"
            aria-label="Tap to resume casting spells"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-accent animate-bounce">
              <Sparkles size={24} />
            </div>
            <span className="font-mono text-sm font-semibold tracking-wide text-foreground">
              Tap to resume casting
            </span>
            <span className="font-mono text-xs text-sub">Focus lost</span>
          </button>
        )}
      </div>

      {state.phase === "combat" && (
        <>
          <input
            ref={inputRef}
            value={state.typed}
            onChange={(e) => game.setTyped(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-label="Type a spell"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            // 16px minimum or iOS zooms the whole page on focus.
            className="w-full rounded-lg border border-border bg-sub-alt px-3 py-3 text-center font-mono text-base tracking-widest text-foreground outline-none focus:border-accent"
            placeholder="type a spell…"
          />
          <p className="text-center text-xs text-sub">
            {definition.tagline}
          </p>
        </>
      )}
    </div>
  );
}

type Game = ReturnType<typeof useSpellbound>;

function Hud({
  game,
  soundEnabled,
  onToggleSound,
}: {
  game: Game;
  soundEnabled: boolean;
  onToggleSound: () => void;
}) {
  const { state } = game;
  if (state.phase === "select") return null;
  const hpPct = (state.hp / Math.max(1, state.maxHp)) * 100;
  const manaPct = (state.mana / Math.max(1, state.maxMana)) * 100;

  return (
    <div className="flex flex-col gap-1.5 font-mono text-xs text-sub sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
      {/* Primary stats row on mobile */}
      <div className="flex items-center justify-between gap-2 sm:contents">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Heart size={13} className="text-error" aria-hidden="true" />
            <span className="tabular-nums text-foreground">
              {Math.ceil(state.hp)}/{state.maxHp}
            </span>
          </span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-sub-alt sm:w-20" aria-hidden="true">
            <div className="h-full bg-error transition-[width]" style={{ width: `${hpPct}%` }} />
          </div>

          <span className="flex items-center gap-1">
            <Zap size={13} className="text-accent" aria-hidden="true" />
            <span className="tabular-nums text-foreground">{Math.floor(state.mana)}</span>
          </span>
          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-sub-alt sm:w-16" aria-hidden="true">
            <div className="h-full bg-accent transition-[width]" style={{ width: `${manaPct}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-1 sm:order-last sm:ml-auto">
          {state.relics.length > 0 && (
            <span className="flex items-center gap-1" title="Relics">
              <Sparkles size={12} aria-hidden="true" />
              <span className="tabular-nums">{state.relics.length}</span>
            </span>
          )}
          {state.phase === "combat" && (
            <button
              type="button"
              onClick={() => game.setPaused(!game.paused)}
              aria-label={game.paused ? "Resume" : "Pause"}
              className="flex min-h-8 min-w-8 items-center justify-center p-1 text-sub/60 transition-colors hover:text-foreground sm:min-h-0 sm:min-w-0 sm:p-0"
            >
              {game.paused ? <Play size={15} /> : <Pause size={15} />}
            </button>
          )}
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
            className="flex min-h-8 min-w-8 items-center justify-center p-1 text-sub/60 transition-colors hover:text-foreground sm:min-h-0 sm:min-w-0 sm:p-0"
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>

      {/* Secondary stats row on mobile */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:contents sm:text-xs">
        {state.shield > 0 && (
          <span className="tabular-nums text-cyan-300">shield {Math.round(state.shield)}</span>
        )}
        <span className="tabular-nums">
          fl {state.floor} · rm {state.room + 1}/{state.map.length}
        </span>
        <span className="tabular-nums text-accent">{state.score}</span>
        {state.combo > 1 && (
          <span className="tabular-nums text-warning">×{state.combo}</span>
        )}
        <span className="tabular-nums">{state.gold}g</span>
      </div>
    </div>
  );
}

function CharacterSelect({ onPick }: { onPick: (id: string) => void }) {
  return (
    <div className="relative z-10 flex h-full flex-col overflow-y-auto p-4">
      <h2 className="mb-3 text-center font-mono text-sm uppercase tracking-widest text-accent">
        Choose your mage
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CHARACTERS.map((c) => {
          const locked = c.unlock !== null && !hasUnlock(c.unlock);
          return (
            <button
              key={c.id}
              type="button"
              disabled={locked}
              onClick={() => onPick(c.id)}
              className={cn(
                "group relative flex min-h-11 flex-col overflow-hidden rounded-lg border border-border text-left transition-colors",
                locked
                  ? "cursor-not-allowed opacity-45"
                  : "hover:border-accent focus-visible:border-accent",
              )}
            >
              <div className="relative h-20 w-full">
                <Image
                  src={c.art}
                  alt=""
                  fill
                  sizes="180px"
                  className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
              </div>
              <div className="p-2">
                <p className="font-mono text-xs font-semibold text-foreground">
                  {c.name}
                </p>
                <p className="mt-0.5 text-[10px] leading-tight text-sub">
                  {locked ? c.unlockHint : c.passiveName}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Combat({ game, onSlotClick }: { game: Game; onSlotClick?: (word: string) => void }) {
  const { state } = game;
  return (
    <div className="relative z-10 flex h-full flex-col justify-between p-3">
      {/* enemies */}
      <div className="flex items-start justify-center gap-2 sm:gap-4">
        {state.enemies
          .filter((e) => e.hp > 0)
          .map((e) => (
            <EnemyCard
              key={e.uid}
              enemy={e}
              isTargeted={state.hexTargetUid === e.uid}
            />
          ))}
      </div>

      {/* Mechanic banner. Positioned between enemies and spell slots so it never hides enemy bars */}
      {state.telegraph && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute inset-x-3 top-20 z-30 rounded-lg border border-accent/60 bg-background/95 px-3 py-2 text-center font-mono text-[11px] uppercase tracking-wider text-accent shadow-lg backdrop-blur-sm sm:top-24"
        >
          {state.telegraph}
        </div>
      )}

      {game.paused && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 font-mono text-sm text-sub">
          paused
        </div>
      )}

      {/* spell slots */}
      <div className="grid grid-cols-2 gap-2">
        {state.slots.map((slot, i) => {
          const spell = SPELLS[slot.spellId];
          const sealed = slot.sealed > 0;
          const locked = slot.cooldown > 0 || sealed;
          const matches = !locked && slot.word.startsWith(state.typed) && state.typed.length > 0;
          return (
            <button
              key={`${slot.spellId}-${i}`}
              type="button"
              disabled={locked}
              onClick={() => onSlotClick?.(slot.word)}
              className={cn(
                "relative overflow-hidden rounded-lg border px-2 py-1.5 text-left transition-colors",
                sealed
                  ? "border-error/50 bg-error/5 opacity-70"
                  : locked
                  ? "border-border/50 bg-sub-alt/30 opacity-50"
                  : matches
                    ? "border-accent bg-accent/10 ring-1 ring-accent"
                    : "border-border bg-sub-alt/40 hover:border-accent/60",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate font-mono text-[10px] uppercase tracking-wide text-sub">
                  {sealed ? "sealed" : spell.name}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-accent">
                  {sealed ? `${Math.ceil(slot.sealed / 1000)}s` : spell.mana}
                </span>
              </div>
              <p
                className={cn(
                  "font-mono tracking-tight",
                  slot.word.length > 9
                    ? "text-xs sm:text-base"
                    : slot.word.length > 6
                      ? "text-sm sm:text-lg"
                      : "text-base sm:text-xl",
                )}
              >
                {slot.word.split("").map((ch, j) => (
                  <span
                    key={j}
                    className={
                      matches && j < state.typed.length
                        ? "text-accent font-bold"
                        : "text-foreground"
                    }
                  >
                    {ch}
                  </span>
                ))}
              </p>
              {locked && (
                <div
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 h-1 bg-accent/70 transition-[width]"
                  style={{
                    width: `${(slot.cooldown / Math.max(1, spell.cooldownMs)) * 100}%`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EnemyCard({ enemy, isTargeted }: { enemy: EnemyState; isTargeted?: boolean }) {
  const hpPct = (enemy.hp / Math.max(1, enemy.maxHp)) * 100;
  const windPct =
    100 - (enemy.windup / Math.max(1, enemy.def.windupMs)) * 100;
  return (
    <div className={cn("flex w-20 flex-col items-center gap-1 transition-all sm:w-28", isTargeted && "scale-105")}>
      <div
        className={cn(
          "relative h-16 w-16 overflow-hidden rounded-lg border transition-colors sm:h-24 sm:w-24",
          enemy.hitFlash > 0
            ? "border-warning ring-2 ring-warning/60"
            : isTargeted
              ? "border-accent ring-2 ring-accent/60 shadow-lg shadow-accent/20"
              : "border-border",
        )}
      >
        <Image
          src={enemy.def.art}
          alt={enemy.def.name}
          fill
          sizes="96px"
          className={cn(
            "object-cover transition-opacity",
            enemy.hitFlash > 0 && "opacity-60",
          )}
        />
      </div>
      <p className="w-full truncate text-center font-mono text-[9px] text-sub">
        {enemy.def.name}
      </p>
      <div className="h-1 w-full overflow-hidden rounded-full bg-sub-alt" aria-hidden="true">
        <div className="h-full bg-error" style={{ width: `${hpPct}%` }} />
      </div>
      {/* Wind-up charge progress bar */}
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-sub-alt"
        role="progressbar"
        aria-valuenow={Math.round(windPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${enemy.def.name} attack charge`}
      >
        <div className="h-full bg-warning transition-[width]" style={{ width: `${windPct}%` }} />
      </div>
    </div>
  );
}

function Reward({ game }: { game: Game }) {
  const { state } = game;
  const relics = state.offer.relics;
  return (
    <div className="relative z-10 flex h-full flex-col overflow-y-auto p-4">
      <h2 className="mb-3 text-center font-mono text-sm uppercase tracking-widest text-accent">
        {relics.length > 0 ? "Choose a relic" : "Choose a spell"}
      </h2>
      <div className="grid gap-2 sm:grid-cols-3">
        {(relics.length > 0 ? relics : state.offer.spells).map((id) => {
          const relic = relics.length > 0 ? relicById(id) : null;
          const spell = relics.length > 0 ? null : SPELLS[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() =>
                game.takeReward(relic ? "relic" : "spell", id)
              }
              className="flex min-h-11 flex-col gap-1 rounded-lg border border-border bg-sub-alt/40 p-3 text-left transition-colors hover:border-accent"
            >
              <span className="font-mono text-xs font-semibold text-foreground">
                {relic?.name ?? spell?.name}
              </span>
              <span className="text-[11px] leading-snug text-sub">
                {relic?.effect ?? spell?.desc}
              </span>
              {relic?.cursed && (
                <span className="font-mono text-[10px] uppercase text-error">
                  cursed
                </span>
              )}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => game.takeReward("skip")}
        className="mx-auto mt-3 min-h-11 px-4 font-mono text-xs text-sub underline decoration-dotted hover:text-foreground"
      >
        skip
      </button>
    </div>
  );
}

function Shop({ game }: { game: Game }) {
  const { state } = game;
  return (
    <div className="relative z-10 flex h-full flex-col overflow-y-auto p-4">
      <h2 className="mb-1 text-center font-mono text-sm uppercase tracking-widest text-accent">
        Curiosity shop
      </h2>
      <p className="mb-3 text-center font-mono text-xs text-sub">{state.gold} gold</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {state.offer.relics.map((id) => {
          const relic = relicById(id);
          if (!relic) return null;
          const afford = state.gold >= relic.price;
          return (
            <button
              key={id}
              type="button"
              disabled={!afford}
              onClick={() => game.buy("relic", id, relic.price)}
              className={cn(
                "flex min-h-11 flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
                afford
                  ? "border-border bg-sub-alt/40 hover:border-accent"
                  : "cursor-not-allowed border-border/50 opacity-45",
              )}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-foreground">
                  {relic.name}
                </span>
                <span className="font-mono text-xs text-accent">{relic.price}g</span>
              </span>
              <span className="text-[11px] leading-snug text-sub">{relic.effect}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={game.leaveShop}
        className="mx-auto mt-4 min-h-11 rounded-lg border border-accent/50 px-5 font-mono text-xs text-accent transition-colors hover:bg-accent hover:text-background"
      >
        leave
      </button>
    </div>
  );
}

function EventRoom({ game }: { game: Game }) {
  const ev = game.state.event;
  if (!ev) return null;
  return (
    <div className="relative z-10 flex h-full flex-col overflow-y-auto p-4">
      <h2 className="mb-1 text-center font-mono text-sm uppercase tracking-widest text-accent">
        {ev.title}
      </h2>
      <p className="mx-auto mb-4 max-w-md text-center text-xs leading-relaxed text-sub">
        {ev.body}
      </p>
      <div className="mx-auto flex w-full max-w-md flex-col gap-2">
        {ev.options.map((opt, i) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => game.chooseEvent(i)}
            className="flex min-h-11 flex-col rounded-lg border border-border bg-sub-alt/40 p-3 text-left transition-colors hover:border-accent"
          >
            <span className="font-mono text-xs font-semibold text-foreground">
              {opt.label}
            </span>
            <span className="text-[11px] text-sub">{opt.detail}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RunEnd({ game, onAgain }: { game: Game; onAgain: () => void }) {
  const { state } = game;
  const won = state.phase === "victory";
  return (
    <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
      <Image
        src={won ? ART.victory : ART.defeat}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 768px"
        className="object-cover opacity-25"
      />
      <div className="relative flex flex-col items-center gap-2">
        <p className="font-mono text-lg font-bold text-foreground">
          {won ? "The Void King falls" : "Your spellbook closes"}
        </p>
        <p className="font-mono text-xs text-sub">
          floor {state.floor} · {state.score} points · best combo ×{state.bestCombo}
        </p>
        <p className="font-mono text-xs text-sub">
          {state.castCount} spells cast · {state.relics.length} relics
        </p>
        <button
          type="button"
          onClick={onAgain}
          className="mt-2 min-h-11 rounded-lg border border-accent px-5 font-mono text-xs uppercase tracking-wider text-accent transition-colors hover:bg-accent hover:text-background"
        >
          run again
        </button>
        <p className="font-mono text-[10px] text-sub">
          Press Space or Enter to restart
        </p>
      </div>
    </div>
  );
}
