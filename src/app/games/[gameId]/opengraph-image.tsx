import { ImageResponse } from "next/og";
import { GAME_DEFINITIONS, GAME_LIST, type GameId } from "@/lib/games/game-types";
import { ogImageElement } from "@/lib/seo/og-image";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return GAME_LIST.map((game) => ({ gameId: game.id }));
}

function getGame(gameId: string) {
  return Object.prototype.hasOwnProperty.call(GAME_DEFINITIONS, gameId)
    ? GAME_DEFINITIONS[gameId as GameId]
    : null;
}

export default async function Image({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const game = getGame(gameId);

  return new ImageResponse(
    ogImageElement({
      eyebrow: "Free Typing Game",
      title: game?.name ?? "HeroTyping",
      subtitle: game?.tagline ?? "Free typing games that build real speed and accuracy.",
    }),
    { ...size },
  );
}
