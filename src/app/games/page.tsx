import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Keyboard, Sparkles, Zap } from "lucide-react";
import { GAME_LIST } from "@/lib/games/game-types";
import { getGameArt, getHubHeroArt } from "@/lib/games/game-art-assets";
import { GameHubFilters } from "@/components/games/game-hub-filters";
import { PlayerSummary } from "@/components/games/player-summary";
import { AdSlot } from "@/components/layout/ad-slot";

export const metadata: Metadata = {
  title: "Typing Games",
  description:
    "Free typing games that build real speed and accuracy — cast spells as a typing mage, survive an endless horde, race a real player's ghost, or build a deck you play by typing. No sign-up required.",
  alternates: { canonical: "/games" },
};

// The page scrolls normally. It was briefly a fixed-height shell with an
// internally-scrolling list; that hid content behind a second scrollbar and
// left nowhere to put ad slots, so it was reverted.

export default function GamesHubPage() {
  const hubHero = getHubHeroArt();
  const featured = GAME_LIST.find((g) => g.featured) ?? GAME_LIST[0];

  // Art is resolved on the server -- getGameArt reads the filesystem at build
  // time -- and handed to the client grid as a plain map.
  const art: Record<string, string | null> = Object.fromEntries(
    GAME_LIST.map((g) => [g.id, getGameArt(g.id, "cover") ?? getGameArt(g.id, "hero")]),
  );

  return (
    <div className="relative flex flex-1 flex-col items-center pb-16">
      {/* HERO */}
      <section className="relative w-full overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          {hubHero && (
            <Image
              src={hubHero}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center opacity-50"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
          <div className="absolute inset-0 arcade-grid opacity-25" />
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-14 sm:px-10 sm:py-20">
          <span className="flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.25em] text-accent">
            <Zap size={12} aria-hidden="true" />
            Welcome to
          </span>

          <h1 className="max-w-2xl font-mono text-4xl font-bold uppercase leading-[1.05] tracking-tight text-foreground arcade-glow-soft sm:text-6xl">
            A universe of{" "}
            <span className="text-accent">typing games</span>
          </h1>

          <p className="font-mono text-xs uppercase tracking-[0.3em] text-sub">
            Type · Play · Level up
          </p>

          <p className="max-w-xl text-sm leading-relaxed text-sub sm:text-base">
            Ten games, one skill. Improve your typing while exploring worlds,
            battling enemies, racing rivals and building decks — every one of
            them driven entirely by what you type.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/games/${featured.id}`}
              className="flex min-h-11 items-center gap-2 rounded-lg bg-accent px-5 font-mono text-xs font-bold uppercase tracking-wider text-background transition-transform hover:scale-[1.03]"
            >
              Play {featured.name}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link
              href="/"
              className="flex min-h-11 items-center gap-2 rounded-lg border border-border px-5 font-mono text-xs uppercase tracking-wider text-sub transition-colors hover:border-accent hover:text-foreground"
            >
              <Keyboard size={14} aria-hidden="true" />
              Take the speed test
            </Link>
          </div>

          {/* Real numbers only. There is no backend and no user accounts, so a
              global player count here would be invented -- these are the
              player's own figures, and read as zeroes until they play. */}
          <PlayerSummary />
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
        <div className="mb-10 mt-2">
          <AdSlot id="games-hub-leaderboard" format="horizontal" />
        </div>

        <h2 className="sr-only">All typing games</h2>
        <GameHubFilters games={[...GAME_LIST]} art={art} />

        <section className="mt-16 rounded-2xl border border-border bg-sub-alt/20 p-6 sm:p-8">
          <h2 className="mb-3 flex items-center gap-2 font-mono text-lg font-bold tracking-tight text-foreground">
            <Sparkles size={16} className="text-accent" aria-hidden="true" />
            Why these are not just typing tests
          </h2>
          <div className="grid gap-4 text-sm leading-relaxed text-sub sm:grid-cols-2">
            <p>
              A typing test measures you. A game asks you to decide. In
              Spellbound the length of a word is how long the spell takes to
              cast, so every moment is a wager between a safe jab and a
              devastating one you might not finish in time. In Typing Survivor
              the upgrades you draft turn your typing into a particular kind of
              weapon, and the build you end up with changes what good typing
              even means.
            </p>
            <p>
              That difference is why they hold up to repeat play. Speed still
              matters, but so does reading the board, pacing yourself against a
              rival, and knowing when accuracy is worth more than pace. Every
              game here runs in the browser, needs no sign-up, and records your
              best locally so you can watch yourself improve.{" "}
              <Link
                href="/guides/how-to-improve-typing-speed"
                className="text-accent underline underline-offset-2"
              >
                How to improve your typing speed
              </Link>{" "}
              covers the technique side.
            </p>
          </div>
        </section>

        <div className="mt-14">
          <AdSlot id="games-hub-footer" format="horizontal" />
        </div>
      </div>
    </div>
  );
}
