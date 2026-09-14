import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, Timer, Zap } from "lucide-react";
import { GAME_LIST } from "@/lib/games/game-types";
import { getGameCover, getGamesHero } from "@/lib/games/game-art-assets";
import { GameCoverArt } from "@/components/games/game-cover-art";

export const metadata: Metadata = {
  title: "Typing Games",
  description:
    "Free typing games that build real speed and accuracy — clear falling words before they hit the floor, or survive as long as you can in an accelerating word rain. No sign-up required.",
  alternates: { canonical: "/games" },
};

export default function GamesHubPage() {
  const hero = getGamesHero();

  return (
    <div className="relative flex flex-1 flex-col items-center overflow-hidden px-6 pb-16 pt-10 sm:px-10">
      {/* Decorative backdrop: optional hero art under a horizon wash and a
          drifting grid, all masked so it fades out before reaching the copy
          and never costs text contrast. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-30"
            style={{
              maskImage: "linear-gradient(to bottom, black 0%, transparent 78%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 78%)",
            }}
          />
        )}
        <div className="absolute inset-0 arcade-haze" />
        <div
          className="absolute inset-x-0 top-0 h-[340px] arcade-grid opacity-70"
          style={{
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />
      </div>

      <div className="flex w-full max-w-4xl flex-col items-center gap-3 text-center">
        <span className="flex items-center gap-2 rounded-full border border-accent/30 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
          <Zap size={12} />
          Arcade
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground arcade-glow-soft sm:text-4xl">
          Typing Games
        </h1>
        <p className="max-w-xl text-sm text-sub sm:text-base">
          Practice that doesn&apos;t feel like practice. Same word list as the main test — the speed
          you build here is the speed you&apos;ll measure there.
        </p>
      </div>

      <div className="mt-10 grid w-full max-w-4xl gap-5 sm:grid-cols-2">
        {GAME_LIST.map((game) => {
          const cover = getGameCover(game.id) ?? game.coverImage ?? null;
          return (
          <Link
            key={game.id}
            href={`/games/${game.id}`}
            className="group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-border bg-sub-alt/40 transition-all duration-300 arcade-edge-hover hover:-translate-y-1 hover:border-accent/40"
          >
            <div aria-hidden="true" className="absolute inset-0">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt=""
                  className="h-full w-full object-cover opacity-45 transition-opacity duration-300 group-hover:opacity-65"
                />
              ) : (
                <GameCoverArt
                  gameId={game.id}
                  className="h-full w-full opacity-50 transition-opacity duration-300 group-hover:opacity-80"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-transparent" />
            </div>

            {/* Corner brackets — cheap, and they read instantly as "HUD". */}
            <span aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 border-l border-t border-accent/40 transition-colors group-hover:border-accent" />
            <span aria-hidden="true" className="absolute right-3 top-3 h-4 w-4 border-r border-t border-accent/40 transition-colors group-hover:border-accent" />

            <div className="relative flex flex-col gap-3 p-6 pt-24">
              <h2 className="font-mono text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-accent sm:text-2xl">
                {game.name}
              </h2>
              <p className="text-sm text-sub">{game.tagline}</p>

              <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-wider text-sub">
                <span className="flex items-center gap-1.5">
                  <Heart size={12} className="text-error" />
                  {game.lives} {game.lives === 1 ? "life" : "lives"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Timer size={12} />
                  {game.scoreBy === "time" ? "survival" : "score attack"}
                </span>
              </div>

              <span className="mt-1 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-accent">
                Play
                <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
          );
        })}
      </div>

      <p className="mt-10 max-w-xl text-center text-sm text-sub">
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
