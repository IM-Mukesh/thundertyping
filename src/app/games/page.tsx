import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass, Keyboard, Sparkles, Zap } from "lucide-react";
import { GAME_LIST } from "@/lib/games/game-types";
import { getArt, getGameArt, getHubHeroArt } from "@/lib/games/game-art-assets";
import { GameHubFilters } from "@/components/games/game-hub-filters";
import { PlayerSummary } from "@/components/games/player-summary";
import { AdSlot } from "@/components/layout/ad-slot";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Typing Games — Free Online Typing Games",
  description:
    "Free typing games that build real speed and accuracy -- cast spells as a mage, survive an endless horde, or race your own ghost. No sign-up required.",
  path: "/games",
});

// The page scrolls normally. It was briefly a fixed-height shell with an
// internally-scrolling list; that hid content behind a second scrollbar and
// left nowhere to put ad slots, so it was reverted.

export default function GamesHubPage() {
  const hubHero = getHubHeroArt();
  // getArt takes plain strings, unlike getGameArt which is keyed to GameId.
  // Resolves public/games/hub-footer.webp when it exists.
  const footerArt = getArt("hub", "footer");
  // Resolves public/games/games-cta-banner.webp when it exists.
  const ctaArt = getArt("games", "cta-banner");
  const featured = GAME_LIST.find((g) => g.featured) ?? GAME_LIST[0];

  // Art is resolved on the server -- getGameArt reads the filesystem at build
  // time -- and handed to the client grid as a plain map.
  const art: Record<string, string | null> = Object.fromEntries(
    GAME_LIST.map((g) => [g.id, getGameArt(g.id, "cover") ?? getGameArt(g.id, "hero")]),
  );
  // Only the four new games have a cut-out sprite; the older six render
  // without the character layer rather than with a placeholder.
  const characters: Record<string, string | null> = Object.fromEntries(
    GAME_LIST.map((g) => [g.id, getArt(g.id, "char-fg")]),
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
              // Decorative: 70% opacity under two gradient overlays, so the
              // artefacts are invisible and this stops being the heaviest
              // asset on the page.
              quality={45}
              className="object-cover opacity-70"
              // The hero section is shorter (relative to its width) than
              // this artwork, so `cover` crops roughly 14% off both left and
              // right edges. This artwork's subject sits right-of-center, so
              // an object-center crop kept the visually rich part (subject +
              // portal) hugging the right edge and cropped mostly-empty sky
              // off the left -- leaving a flat, unfilled-looking left two
              // thirds. Biasing the crop window rightward keeps more of the
              // subject in frame instead.
              style={{ objectPosition: "72% 42%" }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
          <div className="absolute inset-0 arcade-grid opacity-25" />
        </div>

        {/* Floating pull-quote over the art. Purely atmospheric copy (not a
            claim about anything measurable), so it carries no data and needs
            no source -- unlike PlayerSummary below it, which only ever shows
            real, locally-tracked numbers. Hidden below lg: the art itself is
            de-emphasized on narrow screens and there's no room to float
            anything over it without colliding with the stats row. */}
        <blockquote className="pointer-events-none absolute bottom-10 right-10 z-10 hidden max-w-xs rounded-xl border border-border/60 bg-background/70 px-5 py-4 text-right backdrop-blur-sm lg:block">
          <p className="font-display text-sm italic leading-snug text-foreground">
            &ldquo;Every keystroke makes you stronger.&rdquo;
          </p>
          <footer className="mt-2 font-display text-[10px] uppercase tracking-[0.3em] text-accent">
            — HeroTyping
          </footer>
        </blockquote>

        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-6 py-14 sm:px-10 sm:py-20">
          <span className="flex w-fit items-center gap-2 rounded-full border border-accent/40 bg-accent/5 px-3.5 py-1.5 font-display text-[10px] font-medium uppercase tracking-[0.3em] text-accent">
            <Zap size={12} aria-hidden="true" />
            Games
          </span>

          <h1 className="max-w-3xl font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            A universe of
            <br />
            <span className="text-accent text-glow">typing games</span>
          </h1>

          <p className="font-display text-[11px] font-medium uppercase tracking-[0.35em] text-sub sm:text-xs">
            Type. Play. Level up. Be legendary.
          </p>

          <p className="max-w-xl text-sm leading-relaxed text-sub sm:text-base">
            Turn your typing practice into an adventure. Explore different
            worlds, battle enemies, race against time and build real typing
            skills — all while having fun.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/games/${featured.id}`}
              className="btn-chevron flex h-12 items-center gap-2 bg-accent px-8 font-display text-xs font-bold uppercase tracking-[0.16em] text-background transition-[filter] duration-200 hover:brightness-110"
              style={{
                filter:
                  "drop-shadow(0 0 18px color-mix(in srgb, var(--accent) 70%, transparent))",
              }}
            >
              Start playing
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link
              href="/"
              className="flex h-12 items-center gap-2 rounded-lg border border-border px-6 font-display text-xs uppercase tracking-[0.14em] text-sub transition-colors hover:border-accent hover:text-foreground"
            >
              <Keyboard size={14} aria-hidden="true" />
              Take a speed test
            </Link>
          </div>

          {/* Real numbers only. There is no backend and no user accounts, so a
              global player count here would be invented -- two of these four
              are static site facts (game/mode counts), the other two are the
              player's own figures, read as zeroes until they play. */}
          <PlayerSummary />
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-10">
        <div className="mb-10 mt-2">
          <AdSlot id="games-hub-leaderboard" format="horizontal" />
        </div>

        <h2 id="all-games" className="sr-only scroll-mt-24">All typing games</h2>
        <GameHubFilters games={[...GAME_LIST]} art={art} characters={characters} />

        {/* Promo strip pointing back at the grid above. Text lives in the
            gradient's dark two-thirds by design -- the art is anchored left,
            same crop logic as the hero -- so it reads at any viewport without
            the copy ever sitting on top of the busiest part of the image. */}
        <section className="relative mt-16 overflow-hidden rounded-2xl border border-accent/25">
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-sub-alt/40">
            {ctaArt && (
              <Image
                src={ctaArt}
                alt=""
                fill
                sizes="100vw"
                quality={60}
                className="object-cover object-left opacity-70"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/85 to-background" />
          </div>
          <div className="flex flex-col items-start gap-4 px-6 py-10 sm:px-10 sm:py-12 md:flex-row md:items-center md:justify-between">
            {/* A directional gradient alone wasn't reliable here -- the
                generated art's subject sits wider/more central than a plain
                left-edge silhouette, so it could still show through under the
                copy at some viewport widths. A solid backdrop behind the text
                itself guarantees contrast regardless of what any future
                replacement image looks like. */}
            <div className="max-w-xl rounded-xl bg-background/80 p-4 backdrop-blur-sm sm:p-5">
              <span className="mb-3 flex w-fit items-center gap-2 rounded-full border border-accent/40 bg-background/70 px-3 py-1 font-display text-[10px] font-medium uppercase tracking-[0.3em] text-accent">
                <Compass size={12} aria-hidden="true" />
                Not sure where to start?
              </span>
              <h2 className="mb-2 font-display text-2xl font-extrabold uppercase leading-tight tracking-tight text-foreground sm:text-3xl">
                Find your perfect game
              </h2>
              <p className="text-sm leading-relaxed text-sub sm:text-base">
                Quick games for focus. Epic games for progress. Every game
                improves your typing.
              </p>
            </div>
            <Link
              href="#all-games"
              className="btn-chevron flex h-12 shrink-0 items-center gap-2 bg-accent px-8 font-display text-xs font-bold uppercase tracking-[0.16em] text-background transition-[filter] duration-200 hover:brightness-110"
              style={{
                filter:
                  "drop-shadow(0 0 18px color-mix(in srgb, var(--accent) 70%, transparent))",
              }}
            >
              Explore games
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* Mission briefing rather than an article box: corner ticks, a rule
            under the heading and a HUD label, so it reads as part of the same
            interface as the cards instead of a essay pasted underneath them. */}
        <section className="neon-corners relative mt-20 overflow-hidden rounded-2xl border border-accent/25 bg-sub-alt/15 p-6 sm:p-9">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, var(--accent) 0 1px, transparent 1px 64px)",
            }}
          />
          <p className="relative mb-2 font-display text-[10px] uppercase tracking-[0.35em] text-accent">
            Briefing
          </p>
          <h2 className="relative mb-4 flex items-center gap-2 font-display text-xl font-extrabold uppercase tracking-tight text-foreground sm:text-2xl">
            <Sparkles size={17} className="text-accent" aria-hidden="true" />
            Why these are not just typing tests
          </h2>
          <div
            aria-hidden="true"
            className="relative mb-5 h-px w-full"
            style={{
              background:
                "linear-gradient(to right, color-mix(in srgb, var(--accent) 70%, transparent), transparent)",
            }}
          />
          <div className="relative grid gap-5 text-sm leading-relaxed text-sub sm:grid-cols-2">
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
      </div>

      {/* No ad slot here -- SiteFooter (every page) already renders one
          right below this, and stacking a second right above it is the exact
          duplicate-ad-slot mistake already fixed once on content-page.tsx. */}

      {/* Footer band. Falls back to a plain rule when the art is absent, so a
          missing file is a quieter page rather than a broken one. */}
      <div className="relative mt-16 w-full overflow-hidden">
        {footerArt && (
          <div aria-hidden="true" className="relative h-32 w-full sm:h-44">
            <Image src={footerArt} alt="" fill sizes="100vw" quality={45} className="object-cover object-bottom opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
          </div>
        )}
        <p className="mx-auto max-w-3xl px-6 pb-2 text-center font-display text-[10px] uppercase tracking-[0.3em] text-sub">
          Improve · Have fun · Be legendary
        </p>
      </div>
    </div>
  );
}
