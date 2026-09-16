"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { ArrowRight, BarChart3, Clock, Play, Sparkles, Trophy } from "lucide-react";
import type { GameDefinition } from "@/lib/games/game-types";
import { gameBestKey, parseGameBest } from "@/lib/games/game-scores";
import { getStorageItem } from "@/lib/persistence/storage";
import { cn } from "@/lib/utils/cn";

/**
 * A game card on the hub.
 *
 * Expands on hover to show the pitch, feature list and the player's own best —
 * the card is the whole pitch, so the hub does not need a wall of prose beneath
 * it. On touch there is no hover, so the expanded content is always present in
 * the DOM and simply laid out differently; this also keeps it indexable rather
 * than hidden behind an interaction a crawler never performs.
 *
 * Deliberately shows the player's OWN numbers and never invented global ones.
 * There is no backend behind this site yet, so a "12.4K players" figure would
 * be fabricated — and a fake player count is exactly the sort of thing that
 * sinks an AdSense review.
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
  // localStorage is client-only, so the card renders its "not played" state on
  // the server and fills in after mount; reading during render desyncs
  // hydration. The snapshot is the raw string because a parsed record would be
  // a new object every call and loop the store forever.
  const raw = useSyncExternalStore(
    subscribeStorage,
    () => getStorageItem(gameBestKey(game.id)),
    () => null,
  );
  const best = useMemo(() => parseGameBest(raw), [raw]);

  const scoreLabel = best
    ? game.scoreBy === "time"
      ? `${best.score}s best`
      : `${best.score.toLocaleString()} best`
    : "Not played yet";

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300",
        // The accent edge is on at rest, not only on hover. In the reference
        // design each card is lit in its own colour -- that is what makes the
        // grid read as four worlds rather than four grey boxes -- and the
        // utility is built on color-mix against --accent, so it stays correct
        // in all five site themes.
        "arcade-edge arcade-edge-hover hover:-translate-y-1.5 focus-within:-translate-y-1.5",
      )}
      style={
        {
          "--accent": game.accent,
          "--color-accent": game.accent,
          // A whisper of the accent in the card surface. Flat --background made
          // every card identical below the artwork.
          background:
            "linear-gradient(160deg, color-mix(in srgb, var(--accent) 7%, var(--background)) 0%, var(--background) 55%)",
        } as React.CSSProperties
      }
    >
      {game.featured && (
        <span className="absolute left-3 top-3 z-20 rounded-md bg-accent px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-background">
          Featured
        </span>
      )}

      <div className="relative aspect-[16/11] w-full overflow-hidden">
        {art ? (
          <Image
            src={art}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-sub-alt" />
        )}
        {/* Only enough scrim to seat the title; the reference art is bright and
            a heavy gradient was washing it out. */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <div className="relative flex flex-1 flex-col gap-2.5 p-4">
        <div>
          <h3 className="font-mono text-xl font-bold uppercase tracking-tight text-foreground transition-colors group-hover:text-accent group-hover:arcade-glow sm:text-2xl">
            {game.name}
          </h3>
          <p className="font-mono text-[11px] uppercase tracking-wider text-accent/90">
            {game.tagline}
          </p>
        </div>

        <p className="text-[13px] leading-snug text-sub">{game.pitch}</p>

        <ul className="flex flex-wrap gap-1.5">
          {game.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-md bg-sub-alt px-2 py-0.5 font-mono text-[10px] text-sub"
            >
              {tag}
            </li>
          ))}
        </ul>

        <dl className="grid grid-cols-3 gap-2 border-t border-border/70 pt-3">
          {[
            { Icon: Trophy, label: "Your best", value: scoreLabel },
            { Icon: Clock, label: "Per run", value: game.duration },
            { Icon: BarChart3, label: "Replay", value: game.replayability },
          ].map(({ Icon, label, value }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon size={13} className="shrink-0 text-accent" aria-hidden="true" />
              <div className="min-w-0">
                <dd className="truncate font-mono text-[11px] font-semibold text-foreground">
                  {value}
                </dd>
                <dt className="truncate font-mono text-[9px] uppercase tracking-wide text-sub">
                  {label}
                </dt>
              </div>
            </div>
          ))}
        </dl>

        {/* Expanded detail. Uses a grid-rows collapse rather than height
            animation so it needs no JS measurement and no rAF -- animations
            driven by rAF do not run when the pane is not being painted, which
            has bitten this project before. */}
        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr] motion-reduce:transition-none">
          <div className="min-h-0 overflow-hidden">
            {game.highlights && (
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
                {game.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-center gap-1.5 font-mono text-[10px] text-sub"
                  >
                    <Sparkles size={10} className="shrink-0 text-accent" aria-hidden="true" />
                    <span className="truncate">{h}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <Link
          href={`/games/${game.id}`}
          className="mt-auto flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent font-mono text-sm font-bold uppercase tracking-wider text-background transition-all hover:scale-[1.02]"
          style={{
            boxShadow:
              "0 0 22px -4px color-mix(in srgb, var(--accent) 75%, transparent)",
          }}
        >
          <Play size={14} aria-hidden="true" />
          Play now
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
