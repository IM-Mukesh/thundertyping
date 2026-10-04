"use client";

/**
 * Card Battle — a deckbuilder you play by typing card names.
 *
 * Card art is drawn as SVG rather than generated: forty individual
 * illustrations would weigh more than the rest of the site's art combined and
 * could not stay stylistically consistent. A shape grammar — rune ring, type
 * glyph, rarity frame — recolours from `--accent`, so it is uniform by
 * construction and works in every theme.
 *
 * Mobile is the hard case here, because a hand of cards is wide. The hand
 * scrolls horizontally rather than shrinking cards below readable size.
 */

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Coins,
  Heart,
  Pause,
  Play,
  Shield,
  Sparkles,
  Swords,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import type { GameComponentProps } from "@/components/games/game-client";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { sound } from "@/lib/audio/game-sounds";
import { duck, playMusic, preload, resumeAudio, stopMusic } from "@/lib/audio/audio-bus";
import { awardXp,
  checkSiteAchievements, bumpStat, grantAchievement } from "@/lib/profile/player-profile";
import { recordGameResult, recordGameStart } from "@/lib/games/game-scores";
import { STARTER_DECKS } from "@/lib/games/cards/cards";
import { STATUS_META, STATUS_ORDER, faceOf, type CardDef, type Statuses } from "@/lib/games/cards/model";
import { useCardBattle, type EnemyState } from "@/lib/games/cards/use-card-battle";
import { CardSigil } from "@/components/games/ui/card-sigil";
import { GameStage, PauseOverlay, RuleCard, StartButton, StatTile } from "@/components/games/ui/game-chrome";
import { GameViewport } from "@/components/games/ui/game-viewport";
import { GAME_LIST } from "@/lib/games/game-types";
import { isGameRestartShortcut } from "@/lib/games/input-controls";
import { cn } from "@/lib/utils/cn";

const ACCENT = "#dc2626";
const MUSIC = {
  combat: "/audio/music/cards-combat.opus",
  boss: "/audio/music/cards-boss.opus",
  menu: "/audio/music/hub-menu.opus",
};

export default function CardBattleGame({ definition }: GameComponentProps) {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const game = useCardBattle(undefined, {
    onPlay: (card) => {
      sound("card-play", soundEnabled, { vary: 60 });
      if (card.type === "attack") duck(0.6, 0.3);
    },
    onDamage: (amount, toEnemy) => {
      if (toEnemy) sound(amount >= 15 ? "crit-hit" : "key-correct", soundEnabled, { vary: 50 });
      else sound("player-death", soundEnabled, { volume: 0.3 });
    },
    onKill: () => sound("enemy-death", soundEnabled, { vary: 70 }),
    onMiss: () => sound("key-wrong", soundEnabled),
    onPhase: (phase) => {
      if (phase === "combat") void playMusic(MUSIC.combat);
      else if (phase === "victory" || phase === "defeat") void playMusic(null);
    },
  });

  const { state } = game;
  const isBoss = game.encounter?.kind === "boss";

  useEffect(() => {
    preload([MUSIC.combat]);
    return () => stopMusic();
  }, []);

  useEffect(() => {
    if (state.phase !== "combat") return;
    void playMusic(isBoss ? MUSIC.boss : MUSIC.combat);
  }, [isBoss, state.phase]);

  useEffect(() => {
    if (state.phase === "combat" && !game.paused) inputRef.current?.focus();
  }, [state.phase, state.turn, game.paused]);

  const banked = useRef(false);
  useEffect(() => {
    if (state.phase !== "victory" && state.phase !== "defeat") {
      banked.current = false;
      return;
    }
    if (banked.current) return;
    banked.current = true;
    recordGameResult("card-battle", {
      score: state.score,
      cleared: state.node,
      bestCombo: 0,
      survivedMs: Math.round(state.elapsedMs),
    });
    bumpStat("card-battle", "runs");
    grantAchievement("card-battle:first-run");
    if (state.node >= 3) grantAchievement("card-battle:first-boss");
    if (state.deck.length >= 20) grantAchievement("card-battle:big-deck");
    if (state.phase === "victory") {
      grantAchievement("card-battle:win");
      bumpStat("card-battle", "wins");
    }
    awardXp(Math.round(state.score / 5) + state.node * 30);
    checkSiteAchievements(GAME_LIST.map((g) => g.id));
  }, [state.phase, state.node, state.score, state.deck.length, state.elapsedMs]);

  const handleStart = useCallback(
    (deckId: string) => {
      recordGameStart("card-battle");
      resumeAudio();
      sound("select", soundEnabled);
      game.start(deckId);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    },
    [game, soundEnabled],
  );

  const [isFocused, setIsFocused] = useState(true);

  // Restart on Enter / Space when game is over
  useEffect(() => {
    if (state.phase !== "victory" && state.phase !== "defeat") return;
    const onKey = (e: KeyboardEvent) => {
      if (isGameRestartShortcut(e)) {
        e.preventDefault();
        game.reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.phase, game]);

  return (
    <GameViewport
      onFocusGame={() => inputRef.current?.focus()}
      isFocused={isFocused}
      isRunning={state.phase === "combat" && !game.paused}
      className="w-full max-w-3xl gap-3"
      style={{ ["--accent" as string]: ACCENT }}
    >
      {state.phase !== "select" && (
        <div className="flex flex-wrap items-center gap-2">
          <StatTile icon={<Heart size={13} />} label="Health" value={`${state.hp}/${state.maxHp}`} tone="error" />
          <StatTile icon={<Shield size={13} />} label="Block" value={state.block} tone={state.block > 0 ? "good" : "default"} />
          <StatTile icon={<Zap size={13} />} label="Energy" value={`${state.energy}/${state.maxEnergy}`} tone="accent" />
          <StatTile icon={<Coins size={13} />} label="Gold" value={state.gold} />
          <StatTile icon={<Swords size={13} />} label="Fight" value={`${state.node + 1}/9`} />
          {(state.phase === "combat" || state.phase === "reward") && (
            <button
              type="button"
              onClick={() => game.setPaused(!game.paused)}
              aria-label={game.paused ? "Resume" : "Pause"}
              className="flex min-h-11 min-w-11 items-center justify-center text-sub hover:text-foreground"
            >
              {game.paused ? <Play size={15} /> : <Pause size={15} />}
            </button>
          )}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
            className="-m-2 ml-auto flex min-h-11 min-w-11 items-center justify-center p-2 text-sub/60 transition-colors hover:text-foreground sm:m-0 sm:ml-auto sm:min-h-0 sm:min-w-0 sm:p-0"
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      )}

      <GameStage
        art={game.encounter?.background}
        danger={state.hp / Math.max(1, state.maxHp) < 0.3}
        className="[--board-h:var(--safe-board-height,clamp(360px,64dvh,540px))] cursor-pointer"
      >
        <div
          onClick={() => {
            if (state.phase === "combat") inputRef.current?.focus();
          }}
          className="relative h-full w-full"
        >
          {state.banner && (
            <div
              role="status"
              aria-live="polite"
              className="pointer-events-none absolute inset-x-3 top-3 z-40 rounded-lg border border-accent/60 bg-background/90 px-3 py-2 text-center font-mono text-[11px] uppercase tracking-wider text-accent backdrop-blur-sm"
            >
              {state.banner}
            </div>
          )}

          {state.phase === "select" && (
            <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
              <h2 className="text-center font-mono text-sm uppercase tracking-widest text-accent">
                Choose a deck
              </h2>
              <div className="grid gap-2 sm:grid-cols-3">
                {STARTER_DECKS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleStart(d.id)}
                    className="flex min-h-11 flex-col gap-1 rounded-lg border border-border bg-sub-alt/40 p-3 text-left transition-colors hover:border-accent"
                  >
                    <span className="font-mono text-xs font-bold text-foreground">{d.name}</span>
                    <span className="text-[11px] leading-snug text-sub">{d.blurb}</span>
                  </button>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <RuleCard icon={<Swords size={13} />} title="Type to play" body="Every card has a word. Type it to play the card." />
                <RuleCard icon={<Zap size={13} />} title="Spend energy" body="Cards cost energy. End your turn when it runs out." />
                <RuleCard icon={<Sparkles size={13} />} title="Build combos" body="Weak cards win together. Blight, double it, then rupture." />
              </div>
            </div>
          )}

          {state.phase === "combat" && (
            <div className="flex h-full flex-col justify-between gap-2 p-3">
              <div className="flex items-start justify-center gap-2 sm:gap-4">
                {game.aliveEnemies.map((e) => (
                  <EnemyCard
                    key={e.uid}
                    enemy={e}
                    focused={e.uid === state.focus}
                    onFocus={() => game.setFocus(e.uid)}
                  />
                ))}
              </div>

              {(state.minions.length > 0 || hasAnyStatus(state.statuses)) && (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <StatusRow statuses={state.statuses} />
                  {state.minions.map((m) => (
                    <span key={m.uid} className="rounded border border-accent/40 px-1.5 py-0.5 font-mono text-[10px] text-accent">
                      {m.name} {m.turns}t
                    </span>
                  ))}
                </div>
              )}

              {/* Hand cards with smooth scroll and touch swipe protection */}
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {game.handDefs.map(({ inst, def, face }) =>
                  def && face ? (
                    <HandCard
                      key={inst.uid}
                      def={def}
                      upgraded={inst.upgraded}
                      text={face.text}
                      cost={face.cost}
                      typed={state.typed}
                      affordable={state.energy >= face.cost || state.nextFree}
                      onClick={() => game.playCard(inst.uid)}
                    />
                  ) : null,
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-sub">
                  Draw {state.draw.length} · Discard {state.discard.length}
                </span>
                <span className="hidden font-mono text-[10px] text-sub/70 sm:inline">
                  (Tap card or type keyword)
                </span>
                <button
                  type="button"
                  onClick={game.endTurn}
                  className="ml-auto min-h-11 rounded-lg border border-accent bg-accent/10 px-4 font-mono text-xs uppercase tracking-wider text-accent transition-colors hover:bg-accent hover:text-background sm:min-h-9"
                >
                  End turn
                </button>
              </div>

              {/* Lost focus alert */}
              {!isFocused && !game.paused && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.focus();
                  }}
                  className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm transition-all"
                  aria-label="Tap to resume combat"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-accent animate-bounce">
                    <Swords size={24} />
                  </div>
                  <span className="font-mono text-sm font-semibold tracking-wide text-foreground">
                    Tap to resume typing
                  </span>
                  <span className="font-mono text-xs text-sub">Or tap cards directly to play</span>
                </button>
              )}
            </div>
          )}

          {state.phase === "reward" && (
            <div className="flex h-full flex-col justify-center gap-3 overflow-y-auto p-4">
              <h2 className="text-center font-mono text-sm uppercase tracking-widest text-accent">
                Add a card
              </h2>
              <div className="grid gap-2 sm:grid-cols-3">
                {game.offerDefs.map((def) => (
                  <button
                    key={def.id}
                    type="button"
                    onClick={() => game.takeReward(def.id)}
                    className="flex min-h-11 flex-col gap-1.5 rounded-lg border border-border bg-sub-alt/40 p-3 text-left transition-colors hover:border-accent"
                  >
                    <span className="flex items-center gap-2">
                      <CardSigil type={def.type} rarity={def.rarity} size={26} />
                      <span className="font-mono text-xs font-bold text-foreground">{def.name}</span>
                    </span>
                    <span className="font-mono text-[10px] text-accent">type: {def.word}</span>
                    <span className="text-[11px] leading-snug text-sub">{faceOf(def, false).text}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => game.takeReward(null)}
                className="mx-auto min-h-11 px-4 font-mono text-xs text-sub underline decoration-dotted hover:text-foreground"
              >
                skip — a smaller deck draws its combo more often
              </button>
            </div>
          )}

          {(state.phase === "victory" || state.phase === "defeat") && (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
              <p className="font-mono text-xl font-bold uppercase text-foreground arcade-glow">
                {state.phase === "victory" ? "The house rises" : "The curtain falls"}
              </p>
              <div className="grid w-full max-w-sm grid-cols-3 gap-2">
                <StatTile icon={<Swords size={13} />} label="Fights won" value={state.node} />
                <StatTile icon={<Sparkles size={13} />} label="Deck size" value={state.deck.length} tone="accent" />
                <StatTile icon={<Coins size={13} />} label="Score" value={state.score} />
              </div>
              <StartButton onClick={() => game.reset()} label="New run" />
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

      {state.phase === "combat" && (
        <input
          ref={inputRef}
          value={state.typed}
          disabled={game.paused}
          onChange={(e) => game.setTyped(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-label="Type a card name"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full rounded-lg border border-border bg-sub-alt px-3 py-3 text-center font-mono text-base tracking-widest text-foreground outline-none focus:border-accent"
          placeholder="type a card…"
        />
      )}

      <p className="text-center text-xs text-sub">{definition.tagline}</p>
    </GameViewport>
  );
}

function hasAnyStatus(s: Statuses): boolean {
  return STATUS_ORDER.some((k) => s[k] > 0);
}

function StatusRow({ statuses }: { statuses: Statuses }) {
  return (
    <>
      {STATUS_ORDER.filter((k) => statuses[k] > 0).map((k) => (
        <span
          key={k}
          title={STATUS_META[k].description}
          className="rounded border border-border bg-background/70 px-1.5 py-0.5 font-mono text-[10px] text-sub"
        >
          {/* Glyph plus name plus number, never a bare coloured dot: a status
              the player cannot name is one they cannot play around. */}
          {STATUS_META[k].glyph} {STATUS_META[k].name} {statuses[k]}
        </span>
      ))}
    </>
  );
}

function EnemyCard({
  enemy,
  focused,
  onFocus,
}: {
  enemy: EnemyState;
  focused: boolean;
  onFocus: () => void;
}) {
  const pct = (enemy.hp / Math.max(1, enemy.maxHp)) * 100;
  return (
    <button
      type="button"
      onClick={onFocus}
      aria-pressed={focused}
      className="flex w-24 min-w-0 flex-col items-center gap-1 sm:w-32"
    >
      {/* The intent is the single most important thing on screen: it is what
          the player is planning against. Text, not an icon alone. */}
      <span className="w-full truncate rounded border border-error/50 bg-error/10 px-1 py-0.5 text-center font-mono text-[9px] text-error">
        {enemy.intent.label}
        {enemy.intent.damage
          ? ` ${enemy.intent.damage}${enemy.intent.hits && enemy.intent.hits > 1 ? `x${enemy.intent.hits}` : ""}`
          : ""}
      </span>
      <div
        className={cn(
          "relative h-16 w-16 overflow-hidden rounded-lg border transition-colors sm:h-20 sm:w-20",
          enemy.hitFlash > 0 ? "border-warning" : focused ? "border-accent ring-2 ring-accent/50 shadow-md shadow-accent/20" : "border-border",
        )}
      >
        <Image src={enemy.def.art} alt={enemy.def.name} fill sizes="80px" className="object-cover" />
      </div>
      <span className="w-full truncate text-center font-mono text-[9px] text-sub">
        {enemy.def.name}
      </span>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-sub-alt" aria-label={`${enemy.def.name} health`}>
        <div className="h-full bg-error transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[9px] tabular-nums text-sub">
        {enemy.hp}
        {enemy.block > 0 && <span className="text-cyan-300"> +{enemy.block}</span>}
      </span>
      {hasAnyStatus(enemy.statuses) && (
        <div className="flex flex-wrap justify-center gap-0.5">
          <StatusRow statuses={enemy.statuses} />
        </div>
      )}
    </button>
  );
}

function HandCard({
  def,
  upgraded,
  text,
  cost,
  typed,
  affordable,
  onClick,
}: {
  def: CardDef;
  upgraded: boolean;
  text: string;
  cost: number;
  typed: string;
  affordable: boolean;
  onClick: () => void;
}) {
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const matching = typed.length > 0 && def.word.startsWith(typed);

  return (
    <button
      type="button"
      onPointerDown={(e) => {
        pointerStart.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => {
        if (pointerStart.current) {
          const dx = Math.abs(e.clientX - pointerStart.current.x);
          pointerStart.current = null;
          if (dx > 12) return;
        }
        onClick();
      }}
      className={cn(
        "flex w-28 min-[400px]:w-32 shrink-0 flex-col gap-1 rounded-lg border p-2 text-left transition-all sm:w-36 select-none",
        matching
          ? "-translate-y-1.5 border-accent bg-accent/15 ring-2 ring-accent shadow-md shadow-accent/20"
          : affordable
            ? "border-border bg-sub-alt/60 hover:border-accent/60 active:scale-95"
            : "border-border/50 bg-sub-alt/20 opacity-55",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <CardSigil type={def.type} rarity={def.rarity} size={22} />
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent font-mono text-[10px] font-bold text-background shadow">
          {cost}
        </span>
      </div>
      <span className="truncate font-mono text-[11px] font-bold text-foreground">
        {def.name}
        {upgraded && <span className="text-accent">+</span>}
      </span>
      <span className="font-mono text-[10px] leading-none">
        {def.word.split("").map((ch, i) => (
          <span key={i} className={matching && i < typed.length ? "text-accent font-bold" : "text-sub"}>
            {ch}
          </span>
        ))}
      </span>
      <span className="text-[9px] leading-snug text-sub">{text}</span>
    </button>
  );
}
