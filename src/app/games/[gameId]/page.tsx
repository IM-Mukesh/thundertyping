import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { GAME_DEFINITIONS, GAME_LIST, type GameId } from "@/lib/games/game-types";
import { getGameArt } from "@/lib/games/game-art-assets";
import { GameClient } from "@/components/games/game-client";
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
    <div className="relative flex flex-1 flex-col items-center overflow-hidden px-6 pb-16 pt-6 sm:px-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {heroArt && (
          <>
            <Image
              src={heroArt}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-30"
              style={{
                maskImage: "linear-gradient(to bottom, black 0%, transparent 72%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 72%)",
              }}
            />
            {/* The board sits on top of this, so the scrim keeps the falling
                words readable no matter how busy the artwork behind them is. */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
          </>
        )}
        <div className="absolute inset-0 arcade-haze" />
      </div>

      {/* Deliberately sparse above the board — the game itself is the page.
          The heading stays an h1 for SEO but is sized as a label, and the
          long-form copy lives far below, out of the way while playing. */}
      <div className="flex w-full max-w-3xl items-center justify-between gap-4">
        <Link
          href="/games"
          className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-sub transition-colors hover:text-foreground"
        >
          <ArrowLeft size={13} />
          Arcade
        </Link>
        <h1 className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
          {game.name}
        </h1>
        <span aria-hidden="true" className="w-16" />
      </div>

      <div className="mt-5 flex w-full justify-center">
        <GameClient definition={game} />
      </div>

      {/* Below the board, never beside or above it — an ad next to an active
          game area is both a distraction and an accidental-click risk. */}
      <div className="mt-12 w-full max-w-3xl">
        <AdSlot id={`game-${game.id}-below-board`} format="horizontal" />
      </div>

      {characterArt && (
        <div className="mt-14 flex w-full max-w-3xl flex-col items-center gap-4 sm:flex-row sm:items-end">
          <div className="relative h-56 w-full shrink-0 overflow-hidden rounded-2xl border border-border sm:h-64 sm:w-64">
            <Image
              src={characterArt}
              alt={`${game.name} character art`}
              fill
              sizes="(max-width: 640px) 100vw, 256px"
              className="object-cover"
            />
          </div>
          <p className="text-sm leading-relaxed text-sub">
            <span className="font-mono uppercase tracking-wider text-accent">{game.name}</span>
            <br />
            {game.tagline}
          </p>
        </div>
      )}

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
