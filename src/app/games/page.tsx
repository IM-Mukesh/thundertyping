import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart, Play, Timer, Zap } from "lucide-react";
import { GAME_LIST, type GameDefinition } from "@/lib/games/game-types";
import { getGameArt, getHubHeroArt } from "@/lib/games/game-art-assets";
import { GameCoverArt } from "@/components/games/game-cover-art";
import { GameBestBadge } from "@/components/games/game-best-badge";
import { AdSlot } from "@/components/layout/ad-slot";

export const metadata: Metadata = {
  title: "Typing Games",
  description:
    "Free typing games that build real speed and accuracy — shoot down words, race the clock, fight a boss, or survive an accelerating word rain. No sign-up required.",
  alternates: { canonical: "/games" },
};

// The page deliberately scrolls normally. It was briefly a fixed-height shell
// with an internally-scrolling list; that hid content behind a second
// scrollbar and left nowhere to put ad slots, so it was reverted.

export default function GamesHubPage() {
  const hubHero = getHubHeroArt();
  const [featured, ...rest] = GAME_LIST;

  return (
    <div className="relative flex flex-1 flex-col items-center px-6 pb-16 pt-10 sm:px-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 arcade-haze" />
        <div
          className="absolute inset-x-0 top-0 h-[420px] arcade-grid opacity-60"
          style={{
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />
      </div>

      <header className="flex w-full max-w-6xl flex-col items-center gap-4 text-center">
        <span className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.25em] text-accent">
          <Zap size={12} />
          Arcade
        </span>
        <h1 className="font-mono text-4xl font-bold tracking-tight text-foreground arcade-glow-soft sm:text-6xl">
          Typing Games
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-sub sm:text-base">
          Practice that doesn&apos;t feel like practice. Every game draws from the same word list
          as the main test, so the speed you build here is the speed you&apos;ll measure there.
        </p>
      </header>

      <FeaturedGame game={featured} hubHero={hubHero} />

      {/* Premium slot: directly under the featured banner, above the grid —
          a natural content break rather than an interruption. */}
      <div className="mt-12 w-full max-w-6xl">
        <AdSlot id="games-hub-leaderboard" format="horizontal" />
      </div>

      <div className="mt-12 grid w-full max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      <div className="mt-14 w-full max-w-6xl">
        <AdSlot id="games-hub-footer" format="horizontal" />
      </div>

      <p className="mt-14 max-w-xl text-center text-sm text-sub">
        Prefer to measure rather than play?{" "}
        <Link href="/" className="text-accent underline underline-offset-2">
          Take the typing speed test
        </Link>
        , or read{" "}
        <Link
          href="/guides/how-to-improve-typing-speed"
          className="text-accent underline underline-offset-2"
        >
          how to improve your typing speed
        </Link>
        .
      </p>
    </div>
  );
}

/** Large banner for the first game — the page's focal point. */
function FeaturedGame({ game, hubHero }: { game: GameDefinition; hubHero: string | null }) {
  const art = hubHero ?? getGameArt(game.id, "hero");

  return (
    <Link
      href={`/games/${game.id}`}
      className="group relative mt-10 flex min-h-[340px] w-full max-w-6xl flex-col justify-end overflow-hidden rounded-3xl border border-border bg-background transition-all duration-300 arcade-edge-hover hover:border-accent/50 sm:min-h-[420px]"
    >
      <div aria-hidden="true" className="absolute inset-0">
        {art ? (
          <Image
            src={art}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <GameCoverArt
            gameId={game.id}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        )}
        {/* Weighted to the left so the copy sits on solid ground while the
            right half of the artwork stays visible. */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/30 to-transparent" />
      </div>

      <span aria-hidden="true" className="absolute left-5 top-5 h-6 w-6 border-l-2 border-t-2 border-accent/50 transition-colors duration-300 group-hover:border-accent" />
      <span aria-hidden="true" className="absolute right-5 top-5 h-6 w-6 border-r-2 border-t-2 border-accent/50 transition-colors duration-300 group-hover:border-accent" />

      <div className="relative flex max-w-xl flex-col gap-3 p-7 sm:p-10">
        <span className="flex w-fit items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
          Featured
        </span>
        <h2 className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {game.name}
        </h2>
        <p className="text-sm leading-relaxed text-sub sm:text-base">{game.tagline}</p>

        <div className="mt-1 flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-mono text-sm font-semibold uppercase tracking-wider text-background transition-transform duration-300 group-hover:scale-105">
            <Play size={14} />
            Play now
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
          <GameMeta game={game} />
          <GameBestBadge definition={game} />
        </div>
      </div>
    </Link>
  );
}

function GameCard({ game }: { game: GameDefinition }) {
  const cover = getGameArt(game.id, "cover");

  return (
    <Link
      href={`/games/${game.id}`}
      className="group relative flex h-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all duration-300 arcade-edge-hover hover:-translate-y-1.5 hover:border-accent/50"
    >
      <div className="relative h-[56%] overflow-hidden">
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            loading="eager"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        ) : (
          <GameCoverArt
            gameId={game.id}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/70 to-transparent"
        />
        <span aria-hidden="true" className="absolute left-4 top-4 h-5 w-5 border-l-2 border-t-2 border-accent/50 transition-colors duration-300 group-hover:border-accent" />
        <span aria-hidden="true" className="absolute right-4 top-4 h-5 w-5 border-r-2 border-t-2 border-accent/50 transition-colors duration-300 group-hover:border-accent" />
        <div className="absolute right-4 top-4 translate-y-8">
          <GameBestBadge definition={game} />
        </div>
      </div>

      <div className="relative -mt-6 flex flex-1 flex-col gap-2.5 px-6 pb-6">
        <h2 className="font-mono text-xl font-bold tracking-tight text-foreground transition-colors duration-300 group-hover:text-accent">
          {game.name}
        </h2>
        <p className="text-sm leading-relaxed text-sub">{game.tagline}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <GameMeta game={game} />
          <span className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-accent transition-all duration-300 group-hover:bg-accent group-hover:text-background">
            <Play size={11} />
            Play
          </span>
        </div>
      </div>
    </Link>
  );
}

function GameMeta({ game }: { game: GameDefinition }) {
  return (
    <div className="flex items-center gap-3.5 font-mono text-[11px] uppercase tracking-wider text-sub/80">
      <span className="flex items-center gap-1.5">
        <Heart size={12} className="text-error" />
        {game.lives} {game.lives === 1 ? "life" : "lives"}
      </span>
      <span className="flex items-center gap-1.5">
        <Timer size={12} />
        {game.scoreBy === "time" ? "survival" : "score attack"}
      </span>
    </div>
  );
}
