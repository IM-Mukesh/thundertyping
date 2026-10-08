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
import { truncateAtWord } from "@/lib/seo/metadata";

export function generateStaticParams() {
  return GAME_LIST.map((game) => ({ gameId: game.id }));
}

function TypeBeforeDeathSeoContent() {
  const faq = [
    { question: "What is Type Before Death?", answer: "Type Before Death is a free browser zombie typing survival game. Players type enemy words to fire, protect a barricade, build combo and defeat commanders." },
    { question: "How does typing speed affect the game?", answer: "Higher WPM lets you complete more attack words before enemies reach the defense line. Speed improves pressure handling, while accuracy preserves combo and precision damage." },
    { question: "Can I play Type Before Death without an account?", answer: "Yes. The core game and personal progress work for guests on the device. Signed-in players automatically sync scores and unlock cloud achievements to their HeroTyping account." },
  ];
  return <section className="mt-16 w-full max-w-4xl border-t border-border pt-12 text-sub">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(faq)) }} />
    <div className="prose prose-invert max-w-none prose-headings:font-display prose-headings:uppercase prose-headings:tracking-tight prose-p:text-sm prose-p:leading-7 prose-li:text-sm prose-li:leading-7">
      <h2>How Type Before Death works</h2>
      <p>Type Before Death is a 3D zombie typing game built around a simple survival promise: your keyboard is the weapon. Read the word above a threat, type its letters, and your defender fires inside an abandoned city. The interactive battle is client-side, while this guide keeps the rules and typing practice advice available to search engines and screen readers.</p>
      <h2>How typing controls combat</h2>
      <p>Start with a visible first letter to lock the most urgent matching enemy. Every correct character advances the weapon prefix. Completing a word creates an attack, with longer words delivering more damage. A clean run of words builds combo and energy; repeated mistakes break the streak, add heat and can cause a short weapon jam. Your WPM therefore changes how many threats you can answer before the barricade is reached, while accuracy decides how consistently you access the strongest damage.</p>
      <h2>Enemy types and boss battles</h2>
      <p>Walkers teach the opening rhythm. Runners accelerate, brutes absorb long-word pressure, spitters attack from range, bombers punish a late response, and stalkers reveal themselves from the mist. Swarms test reaction speed; mutants regenerate; elites enrage when damaged. Three escalating waves lead to a commander with three health phases and a faster charged strike. The campaign includes six brief missions, while Endless introduces boss events without a final wave.</p>
      <h2>Game modes and daily challenge</h2>
      <ul><li><strong>Story:</strong> clear missions, choose between field upgrades and unlock the next safehouse route.</li><li><strong>Endless:</strong> survive rising waves and periodic commanders until your health and barricade can no longer hold.</li><li><strong>Daily:</strong> every player receives the same UTC seed, mission and normal difficulty for a fair daily score comparison. The page shows real personal data only; it does not invent a global rank.</li></ul>
      <h2>How to improve your typing speed for survival</h2>
      <p>Choose the safest correct target before chasing a longer word, keep your eyes on the next character, and let heat cool instead of forcing a panic burst. If your accuracy is unstable, use the free <Link href="/">typing speed test</Link> for measured practice, then reinforce weak keys in <Link href="/lessons">HeroTyping lessons</Link>. The <Link href="/guides/how-to-improve-typing-speed">typing speed guide</Link> explains posture, rhythm and deliberate accuracy practice.</p>
      <h2>Frequently asked questions</h2>
      {faq.map((item) => <div key={item.question} className="not-prose mb-5"><h3 className="font-display text-base font-bold uppercase text-foreground">{item.question}</h3><p className="mt-1 text-sm leading-7">{item.answer}</p></div>)}
      <p className="not-prose text-xs text-sub/80">Ready for another typing game? Explore the <Link href="/games" className="text-accent underline underline-offset-2">HeroTyping arcade</Link>, or practice accuracy before taking on the next outbreak.</p>
    </div>
  </section>;
}

function isRetiredGameId(gameId: string): boolean {
  return Object.prototype.hasOwnProperty.call(GAME_DEFINITIONS, gameId)
    && GAME_DEFINITIONS[gameId as GameId].retired === true;
}

export async function generateMetadata({ params }: { params: Promise<{ gameId: string, locale: string }> }): Promise<Metadata> {
  const { gameId } = await params;
  const game = getPublicGameDefinition(gameId);
  if (!game) {
    if (isRetiredGameId(gameId)) notFound();
    return {};
  }
  if (game.id === "type-before-death") {
    const title = "Zombie Typing Game – Type Before Death";
    const socialTitle = "Zombie Typing Game – Type Before Death | HeroTyping";
    const description = "Play Type Before Death, a 3D zombie typing game where your typing speed and accuracy keep you alive. Type fast, build combos, defeat bosses, and survive the outbreak.";
    return {
      title,
      description,
      alternates: { canonical: "/games/type-before-death" },
      openGraph: { title: socialTitle, description, url: "/games/type-before-death", type: "website" },
      twitter: { title: socialTitle, description },
    };
  }
  const title = `${game.name} — Typing Game`;
  const description = `${game.tagline} ${truncateAtWord(game.about[0], 120)}`;
  return {
    title,
    description,
    alternates: { canonical: `/games/${game.id}` },
    openGraph: { title, description, url: `/games/${game.id}` },
    twitter: { title, description },
    robots: game.upcoming ? { index: false, follow: true } : undefined,
  };
}

export default async function GamePage({ params }: { params: Promise<{ gameId: string, locale: string }> }) {
  const { gameId } = await params;
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
                name: game.id === "type-before-death" ? "Type Before Death – Zombie Typing Game" : game.name,
                description: game.id === "type-before-death"
                  ? "A 3D zombie typing survival game where speed, accuracy and combos keep the city alive."
                  : game.about[0],
                path: `/games/${game.id}`,
                genre: game.id === "type-before-death" ? "Action typing survival game" : undefined,
              }),
            ),
          }}
        />
      )}

      <div className={`flex w-full ${immersiveRacer ? "max-w-6xl" : "max-w-4xl"} items-center justify-between gap-4 pb-4`}>
        <Breadcrumbs items={[{ name: "Games", path: "/games" }, { name: game.name, path: `/games/${game.id}` }]} />
        <div className="flex shrink-0 items-center gap-3">
          <GameBestBadge definition={game} />
          <GameInfoPanel game={game} others={others} />
        </div>
      </div>

      {/* MARQUEE — the artwork at full strength, with the character standing
          in it. This is where the game gets its personality; the board below
          stays clean so falling words are never fighting a background. */}
      {immersiveRacer ? <h1 className="sr-only">{game.id === "ghost-racer" ? "Ghost Racer — Neon Night Time Trial" : game.id === "type-before-death" ? "Type Before Death – Zombie Typing Game" : `${game.name} — ${game.tagline}`}</h1> : <div className="relative w-full max-w-4xl overflow-hidden rounded-t-2xl border border-b-0 border-border">
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

      {game.id === "type-before-death" && <TypeBeforeDeathSeoContent />}

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
