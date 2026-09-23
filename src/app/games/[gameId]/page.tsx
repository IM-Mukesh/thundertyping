import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Gamepad2, Heart } from "lucide-react";
import { GAME_DEFINITIONS, GAME_LIST, type GameId } from "@/lib/games/game-types";
import { getArt, getGameArt } from "@/lib/games/game-art-assets";
import { GameClient } from "@/components/games/game-client";
import { GameCoverArt } from "@/components/games/game-cover-art";
import { GameBestBadge } from "@/components/games/game-best-badge";
import { GameInfoPanel } from "@/components/games/game-info-panel";
import { AdSlot } from "@/components/layout/ad-slot";

export function generateStaticParams() {
  return GAME_LIST.map((game) => ({ gameId: game.id }));
}

function getGame(gameId: string) {
  return Object.prototype.hasOwnProperty.call(GAME_DEFINITIONS, gameId)
    ? GAME_DEFINITIONS[gameId as GameId]
    : null;
}

export async function generateMetadata({ params }: PageProps<"/games/[gameId]">): Promise<Metadata> {
  const { gameId } = await params;
  const game = getGame(gameId);
  if (!game) return {};
  return {
    title: `${game.name} — Typing Game`,
    description: `${game.tagline} ${game.about[0].slice(0, 120)}`,
    alternates: { canonical: `/games/${game.id}` },
  };
}

export default async function GamePage({ params }: PageProps<"/games/[gameId]">) {
  const { gameId } = await params;
  const game = getGame(gameId);
  if (!game) notFound();

  const heroArt = getGameArt(game.id, "hero") ?? game.coverImage ?? null;
  const characterArt = getGameArt(game.id, "character");
  const others = GAME_LIST.filter((g) => g.id !== game.id);

  // A small, generic set of extra roles a game's own board can reach for
  // beyond the five fixed GameArtRole slots above — resolved here (server
  // only, filesystem-backed) and handed down as plain strings, since a game
  // component can't call getArt/getGameArt itself. Absent roles resolve to
  // null and cost nothing; this isn't specific to any one game.
  const boardArt: Record<string, string | null> = {
    hero: heroArt,
    cover: getGameArt(game.id, "cover"),
    victory: getGameArt(game.id, "victory"),
    defeat: getGameArt(game.id, "defeat"),
    "char-fg": getArt(game.id, "char-fg"),
    "enemy-drone": getArt(game.id, "enemy-drone"),
    "enemy-heavy": getArt(game.id, "enemy-heavy"),
    "boss-dreadnought": getArt(game.id, "boss-dreadnought"),
    "bg-arena": getArt(game.id, "bg-arena"),
    "boss-phase1": getArt(game.id, "boss-phase1"),
    "boss-phase2": getArt(game.id, "boss-phase2"),
    "boss-phase3": getArt(game.id, "boss-phase3"),
    "player-attack": getArt(game.id, "player-attack"),
    "victory-v2": getArt(game.id, "victory-v2"),
  };

  return (
    // Overriding the accent here re-skins everything downstream — board glow,
    // grid, score, buttons — because they all read these variables. Scoped to
    // this page so the rest of the site keeps the user's chosen theme.
    //
    // BOTH names are required. `--accent` is what this project's own CSS reads
    // (the arcade classes, color-mix calls). `--color-accent` is what Tailwind
    // utilities like `text-accent` compile against, and because globals.css
    // defines it as `--color-accent: var(--accent)` on :root, it resolves there
    // and is already a fixed colour by the time it reaches a descendant —
    // overriding only `--accent` would leave every Tailwind accent utility
    // still painting the site colour.
    <div
      className="relative flex flex-1 flex-col items-center px-4 pb-16 pt-5 sm:px-8"
      style={
        {
          "--accent": game.accent,
          "--caret": game.accent,
          "--color-accent": game.accent,
          "--color-caret": game.accent,
        } as CSSProperties
      }
    >
      {/* Depth behind the cabinet: the game's own art, heavily blurred and
          dimmed. Blurred specifically — at readable-detail strength it would
          compete with falling words, which is the one thing this page cannot
          afford. Blurred, it reads as atmosphere and colour instead. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px] overflow-hidden">
        {heroArt && (
          <Image
            src={heroArt}
            alt=""
            fill
            priority
            // Deliberately identical to the marquee's sizes and quality
            // below, because both render the same file. Matching them makes
            // the two <Image>s resolve to one optimizer URL, so this backdrop
            // is served from cache and costs nothing. Asking for its own
            // cheaper variant sounds thriftier but is strictly worse: it
            // downloads a second copy.
            sizes="(max-width: 896px) 100vw, 896px"
            className="scale-110 object-cover opacity-25 blur-2xl"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(75% 55% at 50% 0%, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 72%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      <div className="flex w-full max-w-4xl items-center justify-between gap-4 pb-4">
        <Link
          href="/games"
          className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-sub transition-colors hover:text-foreground"
        >
          <ArrowLeft size={13} />
          Arcade
        </Link>
        <div className="flex items-center gap-3">
          <GameBestBadge definition={game} />
          <GameInfoPanel game={game} others={others} />
        </div>
      </div>

      {/* MARQUEE — the artwork at full strength, with the character standing
          in it. This is where the game gets its personality; the board below
          stays clean so falling words are never fighting a background. */}
      <div className="relative w-full max-w-4xl overflow-hidden rounded-t-2xl border border-b-0 border-border">
        <div className="absolute inset-0">
          {heroArt ? (
            <Image
              src={heroArt}
              alt=""
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
          ) : (
            <GameCoverArt gameId={game.id} className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <span aria-hidden="true" className="absolute left-4 top-4 h-5 w-5 border-l-2 border-t-2 border-accent/60" />
        <span aria-hidden="true" className="absolute right-4 top-4 h-5 w-5 border-r-2 border-t-2 border-accent/60" />

        <div className="relative flex items-center gap-5 p-6 sm:gap-7 sm:p-8">
          {characterArt && (
            <div className="relative hidden h-32 w-24 shrink-0 overflow-hidden rounded-xl border border-accent/30 sm:block sm:h-40 sm:w-30">
              <Image
                src={characterArt}
                alt={`${game.name} character art`}
                fill
                // Sits in the marquee, above the fold — lazy would make the
                // character pop in after the page has already settled.
                loading="eager"
                sizes="120px"
                className="object-cover object-top"
              />
            </div>
          )}

          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground arcade-glow-soft sm:text-4xl">
              {game.name}
            </h1>
            <p className="text-sm leading-relaxed text-sub sm:text-base">{game.tagline}</p>
            <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-sub/80">
              <span className="flex items-center gap-1.5">
                <Heart size={12} className="text-error" />
                {game.lives} {game.lives === 1 ? "life" : "lives"}
              </span>
              <span className="flex items-center gap-1.5">
                <Gamepad2 size={12} />
                {game.scoreBy === "time" ? "survival" : "score attack"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CABINET — the board sits flush under the marquee so the two read as
          one unit rather than a banner with a stray panel beneath it. */}
      <div className="flex w-full max-w-4xl justify-center rounded-b-2xl border border-t-0 border-border bg-sub-alt/20 px-4 pb-6 pt-6 sm:px-8">
        <GameClient definition={game} art={boardArt} />
      </div>

      {/* Below the cabinet, never beside or above it — an ad next to an active
          game area is both a distraction and an accidental-click risk. */}
      <div className="mt-12 w-full max-w-3xl">
        <AdSlot id={`game-${game.id}-below-board`} format="horizontal" />
      </div>

      {/* Replaces the wall of prose that used to sit here. That copy now lives
          behind the info button (still in the DOM, so it stays indexable);
          this row keeps the page useful to scroll and gives the second ad slot
          something to sit after. */}
      <div className="mt-16 w-full max-w-4xl">
        <h2 className="mb-5 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-sub">
          More games
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {others.map((other) => {
            const art = getGameArt(other.id, "cover");
            return (
              <Link
                key={other.id}
                href={`/games/${other.id}`}
                className="group relative flex h-32 flex-col justify-end overflow-hidden rounded-xl border border-border bg-background transition-all duration-300 hover:-translate-y-1 hover:border-accent/50"
              >
                <div aria-hidden="true" className="absolute inset-0">
                  {art ? (
                    <Image
                      src={art}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 50vw, 20vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <GameCoverArt gameId={other.id} className="h-full w-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                </div>
                <span className="relative p-3 font-mono text-xs font-semibold leading-tight text-foreground transition-colors group-hover:text-accent">
                  {other.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-14 w-full max-w-2xl">
        <AdSlot id={`game-${game.id}-footer`} format="rectangle" />
      </div>
    </div>
  );
}
