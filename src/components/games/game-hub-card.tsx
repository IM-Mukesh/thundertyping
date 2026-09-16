"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { BarChart3, Clock, Play, Trophy } from "lucide-react";
import type { GameDefinition } from "@/lib/games/game-types";
import { gameBestKey, parseGameBest } from "@/lib/games/game-scores";
import { getStorageItem } from "@/lib/persistence/storage";
import { cn } from "@/lib/utils/cn";

/**
 * A game card on the hub.
 *
 * Layered like a piece of key art rather than an image above a text block:
 *
 *   1  background scene            scale 1 -> 1.04
 *   2  readability gradient        static
 *   3  accent atmosphere           opacity 0 -> 1
 *   4  cut-out character           scale 1 -> 1.10, y 0 -> -10, parallax
 *   5  bottom scrim                static
 *   6  title + metadata            static, never moves
 *   7  chevron CTA                 brightens
 *
 * THE CARD'S HEIGHT NEVER CHANGES. An earlier version expanded a detail panel
 * with grid-template-rows, which grew the card by 42px, grew the grid row, and
 * pushed every row beneath it down by the same 42px -- measured. The detail
 * text now cross-fades against the description inside a fixed-height box, so
 * hovering is pure transform and opacity and the document never reflows.
 *
 * No player counts: there is no backend behind this site, so any such figure
 * would be invented. The third metric is the player's own best.
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
  character: string | null;
  priority?: boolean;
}

export function GameHubCard({
  game,
  art,
  character,
  priority,
}: GameHubCardProps) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

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

  // Pointer position as -0.5..0.5 of the card, springed so the parallax
  // trails the cursor slightly instead of snapping to it.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 150, damping: 20, mass: 0.4 };
  const sx = useSpring(px, spring);
  const sy = useSpring(py, spring);

  // Deliberately tiny. The brief asks for depth, not a 3D gimmick.
  const charX = useTransform(sx, [-0.5, 0.5], [6, -6]);
  const charY = useTransform(sy, [-0.5, 0.5], [4, -4]);
  const bgX = useTransform(sx, [-0.5, 0.5], [-3, 3]);

  const handleMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduced) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };

  const reset = () => {
    px.set(0);
    py.set(0);
    setHovered(false);
  };

  const active = hovered && !reduced;

  return (
    <motion.article
      ref={ref}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={reset}
      onPointerMove={handleMove}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={reset}
      className={cn(
        "group/card relative isolate flex h-[420px] flex-col rounded-2xl",
        // NOT overflow-hidden: the character rises out of the top of the card
        // on hover, so only the artwork box clips. The card keeps its rounded
        // corners through the background gradient and the neon frame.
        "neon-frame transition-[box-shadow,transform] duration-300 ease-out",
        // Transform-driven, so the document never reflows. Scale is tiny on
        // purpose: the brief asks for depth, not a zoom.
        "hover:scale-[1.015] focus-within:scale-[1.015] active:scale-[0.99]",
        "motion-reduce:transform-none motion-reduce:transition-none",
        // The card sets `isolate`, so the character's z-index is confined to
        // this card's stacking context. Without lifting the CARD above its
        // siblings, a later card in DOM order paints straight over the risen
        // figure. Done in CSS rather than from React state so the stacking is
        // correct on the very first frame of the hover, not one render later.
        "z-0 hover:z-30 focus-within:z-30",
        // Raised only while hovered, so the glow is never clipped by a
        // neighbour and nothing is permanently stacked above the grid.
        active && "neon-frame-strong",
      )}
      style={
        {
          "--accent": game.accent,
          "--color-accent": game.accent,
          background:
            "linear-gradient(170deg, color-mix(in srgb, var(--accent) 12%, var(--background)) 0%, var(--background) 62%)",
        } as React.CSSProperties
      }
    >
      {/* ---------------------------------------------------------- ART BOX */}
      <div className="relative h-[232px] w-full shrink-0 overflow-hidden rounded-t-2xl">
        {/* L1 background. Parallax and scale live on separate elements:
            motion silently drops animated transform keys when the same element
            also sets a transform through `style`, so one element cannot own
            both. */}
        {art && (
          <motion.div
            className="absolute inset-0"
            style={reduced ? undefined : { x: bgX }}
          >
            <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover/card:scale-[1.04] group-focus-within/card:scale-[1.04] motion-reduce:transform-none">
              <Image
                src={art}
                alt=""
                fill
                priority={priority}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
          </motion.div>
        )}

        {/* L2 readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" />

        {/* L3 accent atmosphere */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-400 group-hover/card:opacity-100 group-focus-within/card:opacity-100"
          style={{
            background:
              "radial-gradient(70% 60% at 50% 100%, color-mix(in srgb, var(--accent) 38%, transparent), transparent 70%)",
          }}
        />


        {/* L5 bottom scrim, above the character so the title is never lost
            behind a raised arm. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: "color-mix(in srgb, var(--accent) 70%, transparent)" }}
        />

        {game.featured && (
          <span className="absolute left-3 top-3 z-20 rounded bg-accent px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-background">
            Featured
          </span>
        )}
      </div>

      {/* L4 character — a SIBLING of the art box, not a child of it.

          Anchored so its feet rest on the art box's bottom edge, then scaled
          from that same origin. Because the card no longer clips, roughly a
          third of the figure rises above the frame on hover, which is what
          makes it read as stepping out of the scene rather than zooming inside
          a window.

          Three nested elements, each owning exactly one transform: centring on
          the outer div, parallax in the middle, the hover lift on the inner.
          Collapsing them onto one element makes motion drop the animated
          transform entirely -- measured, the character rendered and never
          moved. */}
      {character && (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute bottom-[188px] left-1/2 z-20 -translate-x-1/2",
            // Touch devices never fire hover, so the sprite would sit at its
            // small resting size permanently with no way to reveal it. It is
            // shown larger from the start there and the hover growth only
            // applies from sm: up, where a pointer exists to trigger it.
            "h-[190px] sm:h-[132px]",
          )}
        >
          <motion.div
            className="h-full"
            style={reduced ? undefined : { x: charX, y: charY }}
          >
            <div
              className={cn(
                "h-full origin-bottom opacity-95 transition-[transform,opacity] duration-500",
                "[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
                "sm:group-hover/card:scale-[2.5] sm:group-hover/card:opacity-100",
                "sm:group-focus-within/card:scale-[2.5] sm:group-focus-within/card:opacity-100",
                "motion-reduce:!scale-100 motion-reduce:transition-none",
              )}
            >
              <Image
                src={character}
                alt=""
                width={520}
                height={1200}
                sizes="(max-width: 640px) 200px, 340px"
                className="h-full w-auto object-contain object-bottom"
                style={{
                  filter: active
                    ? "drop-shadow(0 18px 34px color-mix(in srgb, var(--accent) 55%, transparent))"
                    : "drop-shadow(0 6px 14px rgba(0,0,0,0.55))",
                  transition: "filter 350ms ease",
                }}
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* ------------------------------------------------------ L6 CONTENT */}
      <div className="relative flex flex-1 flex-col gap-2 px-3.5 pb-3.5 pt-2.5">
        <h3 className="font-display text-base font-extrabold uppercase leading-none tracking-tight text-foreground transition-colors duration-300 group-hover/card:text-accent">
          {game.name}
        </h3>

        {/* Fixed-height copy box. Description and highlights cross-fade in the
            same space, so nothing below can move. */}
        <div className="relative h-[52px]">
          <p
            className={cn(
              "absolute inset-0 line-clamp-3 text-[12px] leading-snug text-sub transition-opacity duration-300",
              active ? "opacity-0" : "opacity-100",
            )}
          >
            {game.pitch}
          </p>
          <ul
            aria-hidden={!active}
            className={cn(
              "absolute inset-0 grid grid-cols-2 gap-x-2 gap-y-0.5 transition-opacity duration-300",
              active ? "opacity-100" : "opacity-0",
            )}
          >
            {game.highlights?.slice(0, 6).map((h) => (
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
        </div>

        <dl className="grid grid-cols-3 gap-1.5 border-t border-border/60 pt-2">
          <Metric icon={<Clock size={11} />} label="Per run" value={game.duration} />
          <Metric icon={<BarChart3 size={11} />} label="Replay" value={game.replayability} />
          <Metric icon={<Trophy size={11} />} label="Your best" value={bestLabel} />
        </dl>

        <Link
          href={`/games/${game.id}`}
          className={cn(
            "btn-chevron mt-auto flex h-11 items-center justify-center gap-2",
            "bg-accent font-display text-[11px] font-bold uppercase tracking-[0.16em] text-background",
            "transition-[filter] duration-200 hover:brightness-110",
          )}
          style={{
            filter: active
              ? "drop-shadow(0 0 20px color-mix(in srgb, var(--accent) 85%, transparent))"
              : "drop-shadow(0 0 12px color-mix(in srgb, var(--accent) 55%, transparent))",
          }}
        >
          <Play size={12} aria-hidden="true" />
          Play now
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </motion.article>
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
