import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, Play, Timer, Zap } from "lucide-react";
import { GAME_LIST } from "@/lib/games/game-types";
import { getGameCover, getGamesHero } from "@/lib/games/game-art-assets";
import { GameCoverArt } from "@/components/games/game-cover-art";
import { GameBestBadge } from "@/components/games/game-best-badge";

export const metadata: Metadata = {
  title: "Typing Games",
  description:
    "Free typing games that build real speed and accuracy — clear falling words before they hit the floor, or survive as long as you can in an accelerating word rain. No sign-up required.",
  alternates: { canonical: "/games" },
};

export default function GamesHubPage() {
  const hero = getGamesHero();

  return (
    <div className="relative flex flex-1 flex-col items-center overflow-hidden px-6 pb-20 pt-12 sm:px-10">
      {/* Backdrop: optional hero art beneath a horizon wash and drifting grid,
          each masked so it fades out well before the content and never costs
          text contrast. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {hero && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-55"
              style={{
                maskImage: "linear-gradient(to bottom, black 0%, transparent 80%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 80%)",
              }}
            />
            {/* Guarantees heading contrast regardless of how bright or busy the
                artwork is, so the art can be vivid without the copy on top of
                it having to fight for legibility. */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
          </>
        )}
        <div className="absolute inset-0 arcade-haze" />
        <div
          className="absolute inset-x-0 top-0 h-[420px] arcade-grid opacity-70"
          style={{
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />
      </div>

      <header className="flex w-full max-w-5xl flex-col items-center gap-4 text-center">
        <span className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.25em] text-accent">
          <Zap size={12} />
          Arcade
        </span>
        <h1 className="font-mono text-4xl font-bold tracking-tight text-foreground arcade-glow-soft sm:text-6xl">
          Typing Games
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-sub sm:text-base">
          Practice that doesn&apos;t feel like practice. Same word list as the main test — the
          speed you build here is the speed you&apos;ll measure there.
        </p>
      </header>

      <div className="mt-12 grid w-full max-w-5xl gap-6 sm:grid-cols-2">
        {GAME_LIST.map((game) => {
          const cover = getGameCover(game.id) ?? game.coverImage ?? null;
          return (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className="group relative flex h-[400px] flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all duration-300 arcade-edge-hover hover:-translate-y-1.5 hover:border-accent/50"
            >
              {/* Art gets the majority of the card. The earlier version scrimmed
                  the whole card, which left roughly 1% of the artwork visible. */}
              <div className="relative h-[58%] overflow-hidden">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                ) : (
                  <GameCoverArt
                    gameId={game.id}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                )}
                {/* Fade only across the seam, so the art stays legible above it. */}
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
                <h2 className="font-mono text-2xl font-bold tracking-tight text-foreground transition-colors duration-300 group-hover:text-accent">
                  {game.name}
                </h2>
                <p className="text-sm leading-relaxed text-sub">{game.tagline}</p>

                <div className="mt-auto flex items-center justify-between gap-4 pt-3">
                  <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-wider text-sub/80">
                    <span className="flex items-center gap-1.5">
                      <Heart size={12} className="text-error" />
                      {game.lives} {game.lives === 1 ? "life" : "lives"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Timer size={12} />
                      {game.scoreBy === "time" ? "survival" : "score attack"}
                    </span>
                  </div>

                  <span className="flex items-center gap-2 rounded-lg bg-accent/10 px-3.5 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-accent transition-all duration-300 group-hover:bg-accent group-hover:text-background">
                    <Play size={12} />
                    Play
                    <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
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
