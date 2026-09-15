import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Gamepad2, Heart } from "lucide-react";
import { GAME_DEFINITIONS, GAME_LIST, type GameId } from "@/lib/games/game-types";
import { getGameArt } from "@/lib/games/game-art-assets";
import { GameClient } from "@/components/games/game-client";
import { GameCoverArt } from "@/components/games/game-cover-art";
import { GameBestBadge } from "@/components/games/game-best-badge";
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

  return (
    <div className="relative flex flex-1 flex-col items-center px-4 pb-16 pt-5 sm:px-8">
      {/* A single soft accent glow behind the cabinet. The artwork used to be
          stretched across the whole page at low opacity, which muddied
          everything it sat behind — cyan art under a yellow accent haze went
          olive. The art now lives inside the marquee where it can be vivid. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]"
        style={{
          background:
            "radial-gradient(70% 55% at 50% 0%, color-mix(in srgb, var(--accent) 16%, transparent) 0%, transparent 70%)",
        }}
      />

      <div className="flex w-full max-w-4xl items-center justify-between gap-4 pb-4">
        <Link
          href="/games"
          className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-sub transition-colors hover:text-foreground"
        >
          <ArrowLeft size={13} />
          Arcade
        </Link>
        <GameBestBadge definition={game} />
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
        <GameClient definition={game} />
      </div>

      {/* Below the cabinet, never beside or above it — an ad next to an active
          game area is both a distraction and an accidental-click risk. */}
      <div className="mt-12 w-full max-w-3xl">
        <AdSlot id={`game-${game.id}-below-board`} format="horizontal" />
      </div>

      <div className="mt-16 flex w-full max-w-2xl flex-col gap-4 border-t border-border pt-10 text-sm leading-relaxed text-sub">
        <h2 className="text-lg font-semibold text-foreground">How to play {game.name} well</h2>
        {game.about.map((paragraph) => (
          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
        ))}
        <p>
          When you want a measured score instead of a run,{" "}
          <Link href="/" className="text-accent underline underline-offset-2">
            take the typing speed test
          </Link>
          . For technique rather than practice, read{" "}
          <Link
            href="/guides/how-to-improve-typing-speed"
            className="text-accent underline underline-offset-2"
          >
            how to improve your typing speed
          </Link>
          .
        </p>
        {others.length > 0 && (
          <p>
            Other games:{" "}
            {others.map((other, i) => (
              <span key={other.id}>
                {i > 0 && ", "}
                <Link
                  href={`/games/${other.id}`}
                  className="text-accent underline underline-offset-2"
                >
                  {other.name}
                </Link>
              </span>
            ))}
            .
          </p>
        )}
      </div>

      <div className="mt-14 w-full max-w-2xl">
        <AdSlot id={`game-${game.id}-after-prose`} format="rectangle" />
      </div>
    </div>
  );
}
