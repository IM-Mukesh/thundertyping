import fs from "node:fs";
import path from "node:path";
import type { GameId } from "@/lib/games/game-types";

// Server-only, and evaluated at build time during static generation.
//
// Artwork is picked up by convention rather than by editing code: drop a file
// into public/games/ named after the game id (or "hero" for the arcade
// backdrop) and the next build uses it. Nothing is found, and the pages fall
// back to the drawn, theme-aware SVG in game-cover-art.tsx — so a missing or
// not-yet-created file is a normal state, never a broken image.

const PUBLIC_GAMES_DIR = path.join(process.cwd(), "public", "games");

// webp first so a smaller file wins when several formats are present.
const EXTENSIONS = ["webp", "avif", "jpg", "jpeg", "png"];

function findAsset(basename: string): string | null {
  for (const ext of EXTENSIONS) {
    const file = `${basename}.${ext}`;
    if (fs.existsSync(path.join(PUBLIC_GAMES_DIR, file))) {
      return `/games/${file}`;
    }
  }
  return null;
}

/** Cover art for one game's card and its page backdrop. */
export function getGameCover(gameId: GameId): string | null {
  return findAsset(gameId);
}

/** Wide backdrop for the /games hub. */
export function getGamesHero(): string | null {
  return findAsset("hero");
}
