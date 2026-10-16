import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Clock, Gamepad2, Heart } from "lucide-react";
import {
  GAME_DEFINITIONS,
  GAME_LIST,
  getPublicGameDefinition,
  type GameId,
} from "@/lib/games/game-types";
import { getArt, getGameArt } from "@/lib/games/game-art-assets";
import { GameClient } from "@/components/games/game-client";
import { GameCoverArt } from "@/components/games/game-cover-art";
import { GameBestBadge } from "@/components/games/game-best-badge";
import { GameInfoPanel } from "@/components/games/game-info-panel";
import { AdSlot } from "@/components/layout/ad-slot";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { buildFaqSchema, buildGameSchema } from "@/lib/seo/json-ld";
import { getTypeBeforeDeathContent } from "@/lib/games/type-before-death-i18n";
import { GameSeoSection } from "@/components/games/game-seo-content";
import { SITE_URL } from "@/lib/seo/constants";

const GAME_META_DESCRIPTIONS: Record<string, string> = {
  "falling-words": "Play Falling Words free online. Destroy descending words before they hit the ground in HeroTyping's fast-paced arcade typing survival game.",
  "word-rain": "Play Word Rain free online. One life, relentless rain, and pure accuracy survival. Test how long you can last in this intense typing challenge.",
  "word-blaster": "Play Word Blaster free online. Defend your base against incoming asteroid lanes with rapid-fire keyboard accuracy in this arcade typing game.",
  "boss-battle": "Out-type the boss before it out-damages you. Test your keyboard speed and precision against escalating boss phases in this tactical typing game.",
  "combo-rush": "Play Combo Rush free online. Build massive combos, extend your survival timer with high-speed accuracy, and climb the leaderboard in real time.",
  "ghost-racer": "Race four neon rivals across a high-speed night circuit in Ghost Racer. Type accurately under pressure in HeroTyping's real-time racing game.",
  "fruit-fury": "Slice flying fruits with swift typing and avoid the bombs. Fruit Fury trains rapid single-letter recognition in an action-packed arcade game.",
  "rakshasa-war": "Play Typebound: The Last Dawn. Battle mythological enemies and conquer boss phases in HeroTyping's dark-fantasy typing combat arcade campaign.",
  "type-before-death": "Play Type Before Death online. Survive waves of cinematic zombie hordes with fast, accurate typing drills. Free browser survival typing game.",
};

export function generateStaticParams() {
  return GAME_LIST.map((game) => ({ gameId: game.id }));
}

function TypeBeforeDeathSeoContent({ locale }: { locale: string }) {
  const content = getTypeBeforeDeathContent(locale);
  const homeHref = locale === "en" ? "/" : `/${locale}`;
  const lessonsHref = locale === "en" ? "/lessons" : `/${locale}/lessons`;
  const gamesHref = locale === "en" ? "/games" : `/${locale}/games`;

  return (
    <section className="mt-16 w-full max-w-4xl border-t border-border pt-12 text-sub">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(content.faq)) }}
      />
      <div className="prose prose-invert max-w-none prose-headings:font-display prose-headings:uppercase prose-headings:tracking-tight prose-p:text-sm prose-p:leading-7 prose-li:text-sm prose-li:leading-7">
        <h2>{content.headings.howItWorks}</h2>
        <p>{content.paragraphs.howItWorks}</p>
        <h2>{content.headings.combat}</h2>
        <p>{content.paragraphs.combat}</p>
        <h2>{content.headings.enemies}</h2>
        <p>{content.paragraphs.enemies}</p>
        <h2>{content.headings.modes}</h2>
        <ul>
          <li><strong>{content.paragraphs.modesStory}</strong></li>
          <li><strong>{content.paragraphs.modesEndless}</strong></li>
          <li><strong>{content.paragraphs.modesDaily}</strong></li>
        </ul>
        <h2>{content.headings.improveSpeed}</h2>
        <p>
          {content.paragraphs.improveSpeed}{" "}
          <Link href={homeHref} className="text-accent underline underline-offset-2">
            {locale === "es" ? "prueba de velocidad de escritura" : locale === "pt-BR" ? "teste de digitação" : locale === "de" ? "Tipptest" : "typing speed test"}
          </Link>{" "}
          &middot;{" "}
          <Link href={lessonsHref} className="text-accent underline underline-offset-2">
            {locale === "es" ? "lecciones" : locale === "pt-BR" ? "lições" : locale === "de" ? "Lektionen" : "lessons"}
          </Link>{" "}
          &middot;{" "}
          <Link href="/guides/how-to-improve-typing-speed" className="text-accent underline underline-offset-2">
            {locale === "es" ? "guía de velocidad" : locale === "pt-BR" ? "guia de velocidade" : locale === "de" ? "Geschwindigkeitsleitfaden" : "typing speed guide"}
          </Link>.
        </p>
        <h2>{content.headings.faq}</h2>
        {content.faq.map((item) => (
          <div key={item.question} className="not-prose mb-5">
            <h3 className="font-display text-base font-bold uppercase text-foreground">{item.question}</h3>
            <p className="mt-1 text-sm leading-7">{item.answer}</p>
          </div>
        ))}
        <p className="not-prose text-xs text-sub/80">
          {content.headings.exploreMore}{" "}
          <Link href={gamesHref} className="text-accent underline underline-offset-2">
            {content.paragraphs.exploreMore}
          </Link>
        </p>
      </div>
    </section>
  );
}

function isRetiredGameId(gameId: string): boolean {
  return Object.prototype.hasOwnProperty.call(GAME_DEFINITIONS, gameId)
    && GAME_DEFINITIONS[gameId as GameId].retired === true;
}

export async function generateMetadata({ params }: { params: Promise<{ gameId: string, locale: string }> }): Promise<Metadata> {
  const { gameId, locale } = await params;
  const game = getPublicGameDefinition(gameId);
  if (!game) {
    if (isRetiredGameId(gameId)) notFound();
    return {
      title: "Game Not Found",
      robots: { index: false, follow: false },
    };
  }
  if (game.id === "type-before-death") {
    const content = getTypeBeforeDeathContent(locale);
    const canonicalPath = locale === "en" ? "/games/type-before-death" : `/${locale}/games/type-before-death`;
    return {
      title: content.title,
      description: content.description,
      alternates: { canonical: canonicalPath },
      openGraph: {
        title: content.socialTitle,
        description: content.description,
        url: canonicalPath,
        type: "website",
        images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: content.title }],
      },
      twitter: {
        card: "summary_large_image",
        title: content.socialTitle,
        description: content.description,
        images: [`${SITE_URL}/opengraph-image`],
      },
    };
  }
  const title = `${game.name} — Free Typing Game`;
  const description =
    GAME_META_DESCRIPTIONS[game.id] ||
    `${game.tagline} Play ${game.name} free online on HeroTyping.`;
  // Games without localized copy canonicalize to the primary English game route
  const canonicalPath = `/games/${game.id}`;
  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/opengraph-image`],
    },
    robots: game.upcoming ? { index: false, follow: true } : undefined,
  };
}

export default async function GamePage({ params }: { params: Promise<{ gameId: string, locale: string }> }) {
  const { gameId, locale } = await params;
  const game = getPublicGameDefinition(gameId);
  if (!game) notFound();

  const heroArt = getGameArt(game.id, "hero") ?? game.coverImage ?? null;
  const characterArt = getGameArt(game.id, "character");
  const others = GAME_LIST.filter((g) => g.id !== game.id);
  const immersiveRacer = game.id === "ghost-racer" || game.id === "rakshasa-war" || game.id === "falling-words" || game.id === "type-before-death";

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

  const tbdContent = game.id === "type-before-death" ? getTypeBeforeDeathContent(locale) : null;
  const gamePath = game.id === "type-before-death"
    ? (locale === "en" ? "/games/type-before-death" : `/${locale}/games/type-before-death`)
    : `/games/${game.id}`;

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

      {!game.upcoming && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              buildGameSchema({
                name: tbdContent ? tbdContent.title : game.name,
                description: tbdContent ? tbdContent.description : game.about[0],
                path: gamePath,
                genre: tbdContent ? tbdContent.schemaGenre : undefined,
              }),
            ),
          }}
        />
      )}

      {/* Primary Page Heading (H1) placed first in DOM to guarantee correct heading hierarchy */}
      <h1 className="sr-only">
        {game.id === "ghost-racer"
          ? "Ghost Racer — Neon Night Time Trial"
          : game.id === "type-before-death"
            ? "Type Before Death – Zombie Typing Game"
            : `${game.name} — Free Typing Game`}
      </h1>

      <div className={`flex w-full ${immersiveRacer ? "max-w-6xl" : "max-w-4xl"} items-center justify-between gap-4 pb-4`}>
        <Breadcrumbs
          items={[
            { name: "Games", path: "/games" },
            { name: game.name, path: `/games/${game.id}` },
          ]}
          locale={locale}
        />
        <div className="flex shrink-0 items-center gap-3">
          <GameBestBadge definition={game} />
          <GameInfoPanel game={game} others={others} />
        </div>
      </div>

      {/* MARQUEE — the artwork at full strength, with the character standing
          in it. This is where the game gets its personality; the board below
          stays clean so falling words are never fighting a background. */}
      {immersiveRacer ? null : <div className="relative w-full max-w-4xl overflow-hidden rounded-t-2xl border border-b-0 border-border">
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
            <div className="font-mono text-2xl font-bold tracking-tight text-foreground arcade-glow-soft sm:text-4xl" aria-hidden="true">
              {game.name}
            </div>
            <p className="text-sm leading-relaxed text-sub sm:text-base">{game.tagline}</p>
            <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-sub/80">
              <span className="flex items-center gap-1.5">
                <Heart size={12} className="text-error" />
                {game.lives} {game.lives === 1 ? "life" : "lives"}
              </span>
              <span className="flex items-center gap-1.5">
                <Gamepad2 size={12} />
                {game.scoreBy === "time" ? "survival" : game.scoreBy === "wpm" ? "speed race" : "score attack"}
              </span>
              {game.upcoming && (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/50 px-2.5 py-0.5 text-amber-300 font-bold">
                  <Clock size={11} />
                  Upcoming
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      }

      {/* CABINET — the board sits flush under the marquee so the two read as
          one unit rather than a banner with a stray panel beneath it. */}
      <div className={immersiveRacer ? "flex w-full max-w-6xl justify-center" : "theme-transition flex w-full max-w-4xl justify-center rounded-b-2xl border border-t-0 border-border bg-sub-alt/20 px-4 pb-12 pt-10 sm:px-8"}>
        {game.upcoming ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center max-w-lg">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-400 mb-5 shadow-lg shadow-amber-500/10 animate-pulse">
              <Clock size={32} />
            </div>
            <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300 mb-3">
              Upcoming Release
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground mb-3">
              {game.name} is in Development
            </h2>
            <p className="font-sans text-sm sm:text-base text-sub leading-relaxed mb-8">
              Spellbound is currently being re-engineered with balanced spell mechanics, legendary visual effects, and optimized mobile touch controls. Stay tuned for the upcoming release!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/games"
                className="btn-chevron flex h-11 items-center gap-2 bg-accent px-6 font-display text-xs font-bold uppercase tracking-[0.16em] text-background transition-all hover:brightness-110"
              >
                Explore All Games
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/games/fruit-fury"
                className="flex h-11 items-center gap-2 rounded-lg border border-border px-5 font-display text-xs uppercase tracking-[0.14em] text-sub transition-colors hover:border-accent hover:text-foreground"
              >
                Play Fruit Fury
              </Link>
            </div>
          </div>
        ) : (
          <GameClient definition={game} art={boardArt} />
        )}
      </div>

      {game.id === "type-before-death" ? (
        <TypeBeforeDeathSeoContent locale={locale} />
      ) : (
        <GameSeoSection gameId={game.id} locale={locale} />
      )}

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
                <div className="relative flex flex-col justify-end p-3">
                  {other.upcoming && (
                    <span className="mb-1 w-fit rounded border border-accent/40 bg-accent/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-accent">
                      Upcoming
                    </span>
                  )}
                  <span className="font-mono text-xs font-semibold leading-tight text-foreground transition-colors group-hover:text-accent">
                    {other.name}
                  </span>
                </div>
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
