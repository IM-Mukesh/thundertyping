import { ImageResponse } from "next/og";
import {
  GAME_DEFINITIONS,
  GAME_LIST,
  getPublicGameDefinition,
  type GameId,
} from "@/lib/games/game-types";
import { ogImageElement } from "@/lib/seo/og-image";
import { notFound } from "next/navigation";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return GAME_LIST.map((game) => ({ gameId: game.id }));
}

function isRetiredGameId(gameId: string): boolean {
  return Object.prototype.hasOwnProperty.call(GAME_DEFINITIONS, gameId)
    && GAME_DEFINITIONS[gameId as GameId].retired === true;
}

export default async function Image({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const game = getPublicGameDefinition(gameId);
  if (!game && isRetiredGameId(gameId)) notFound();

  return new ImageResponse(
    ogImageElement({
      eyebrow: game?.id === "type-before-death" ? "Zombie Typing Game" : "Free Typing Game",
      title: game?.id === "type-before-death" ? "TYPE BEFORE DEATH" : game?.name ?? "HeroTyping",
      subtitle: game?.tagline ?? "Free typing games that build real speed and accuracy.",
    }),
    { ...size },
  );
}
