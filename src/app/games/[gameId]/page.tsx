import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GAME_DEFINITIONS, GAME_LIST, type GameId } from "@/lib/games/game-types";
import { GameClient } from "@/components/games/game-client";

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

  const others = GAME_LIST.filter((g) => g.id !== game.id);

  return (
    <div className="flex flex-1 flex-col items-center px-6 pb-12 pt-8 sm:px-10">
      <div className="flex w-full max-w-3xl flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {game.name}
        </h1>
        <p className="text-sm text-sub sm:text-base">{game.tagline}</p>
      </div>

      <div className="mt-8 flex w-full justify-center">
        <GameClient definition={game} />
      </div>

      <div className="mt-12 flex w-full max-w-2xl flex-col gap-4 text-sm leading-relaxed text-sub">
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
    </div>
  );
}
