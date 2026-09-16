"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { BarChart3, Clock, Play, Trophy } from "lucide-react";
import type { GameDefinition } from "@/lib/games/game-types";
import { gameBestKey, parseGameBest } from "@/lib/games/game-scores";
import { getStorageItem } from "@/lib/persistence/storage";
import { cn } from "@/lib/utils/cn";

/**
 * A game card on the hub, built to the reference design.
 *
 * Each card owns its own `--accent`, so the neon frame, title glow and play
 * button are that game's colour with no per-game styling. Hover state is scoped
 * to `group/card` on the article itself and nothing is keyed off the grid, so
 * hovering one card leaves the other nine completely untouched.
 *
 * No player counts. There is no backend and no accounts behind this site, so a
 * "12.4K players" figure would be invented; the card shows the player's own
 * best instead, which is real.
 */

/** Cross-tab only: same-tab writes happen on a different route entirely. */
function subscribeStorage(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}

interface GameHubCardProps {
  game: GameDefinition;
  art: string | null;
  priority?: boolean;
}

export function GameHubCard({ game, art, priority }: GameHubCardProps) {
  const raw = useSyncExternalStore(
    subscribeStorage,
    () => getStorageItem(gameBestKey(game.id)),
    () => null,
  );
  const best = useMemo(() => parseGameBest(raw), [raw]);

  const bestLabel = best
    ? game.scoreBy === "time"
      ? `${best.score}s`
      : best.score.toLocaleString()
    : "—";

  return (
    <article
      className={cn(
        "group/card relative isolate flex flex-col overflow-hidden rounded-2xl bg-background",
        "neon-frame transition-[transform,box-shadow] duration-300 ease-out",
        "hover:-translate-y-1.5 hover:neon-frame-strong",
        "focus-within:-translate-y-1.5 focus-within:neon-frame-strong",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
      )}
      style={
        {
          "--accent": game.accent,
          "--color-accent": game.accent,
          background:
            "linear-gradient(170deg, color-mix(in srgb, var(--accent) 10%, var(--background)) 0%, var(--background) 60%)",
        } as React.CSSProperties
      }
    >
      {game.featured && (
        <span className="absolute left-3 top-3 z-30 rounded bg-accent px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-background">
          Featured
        </span>
      )}

      {/* ART — 16:10 keeps the card short. A taller crop was the main reason
          the previous version towered over the reference. */}
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden">
        {art ? (
          <Image
            src={art}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover/card:scale-[1.06] motion-reduce:transform-none"
          />
        ) : (
          <div className="h-full w-full bg-sub-alt" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: "color-mix(in srgb, var(--accent) 70%, transparent)" }}
        />
      </div>

      <div className="relative flex flex-1 flex-col gap-2 p-3.5">
        <div>
          <h3 className="font-display text-base font-extrabold uppercase leading-none tracking-tight text-foreground transition-colors duration-300 group-hover/card:text-accent group-hover/card:text-glow sm:text-lg">
            {game.name}
          </h3>
          <p className="mt-1 font-display text-[10px] font-medium uppercase tracking-[0.18em] text-accent">
            {game.tagline}
          </p>
        </div>

        <p className="line-clamp-2 text-[12px] leading-snug text-sub">{game.pitch}</p>

        <ul className="flex flex-wrap gap-1">
          {game.tags.slice(0, 3).map((tag) => (
            <li
              key={tag}
              className="rounded bg-sub-alt px-1.5 py-0.5 font-display text-[9px] uppercase tracking-wider text-sub"
            >
              {tag}
            </li>
          ))}
        </ul>

        {/* Two real numbers plus the player's own best. No invented totals. */}
        <dl className="grid grid-cols-3 gap-1.5 border-t border-border/60 pt-2">
          <Metric icon={<Clock size={11} />} label="Per run" value={game.duration} />
          <Metric icon={<BarChart3 size={11} />} label="Replay" value={game.replayability} />
          <Metric icon={<Trophy size={11} />} label="Your best" value={bestLabel} />
        </dl>

        {/* Expands on hover, for this card only. grid-rows rather than a height
            animation, so it needs no measurement and no rAF. */}
        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-hover/card:grid-rows-[1fr] group-focus-within/card:grid-rows-[1fr] motion-reduce:transition-none">
          <div className="min-h-0 overflow-hidden">
            {game.highlights && (
              <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-1">
                {game.highlights.slice(0, 6).map((h) => (
                  <li
                    key={h}
                    className="flex items-center gap-1 font-display text-[9px] uppercase tracking-wide text-sub"
                  >
                    <span aria-hidden="true" className="text-accent">
                      ▸
                    </span>
                    <span className="truncate">{h}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <Link
          href={`/games/${game.id}`}
          className={cn(
            "btn-chevron mt-auto flex h-11 items-center justify-center gap-2",
            "bg-accent font-display text-[11px] font-bold uppercase tracking-[0.16em] text-background",
            "transition-[filter,transform] duration-200 hover:brightness-110 motion-reduce:transition-none",
          )}
          style={{
            filter:
              "drop-shadow(0 0 14px color-mix(in srgb, var(--accent) 70%, transparent))",
          }}
        >
          <Play size={12} aria-hidden="true" />
          Play now
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="shrink-0 text-accent">{icon}</span>
      <div className="min-w-0">
        <dd className="truncate font-display text-[10px] font-bold text-foreground">
          {value}
        </dd>
        <dt className="truncate font-display text-[8px] uppercase tracking-wider text-sub">
          {label}
        </dt>
      </div>
    </div>
  );
}
