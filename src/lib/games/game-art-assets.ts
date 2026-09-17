import fs from "node:fs";
import path from "node:path";
import type { GameId } from "@/lib/games/game-types";

// Server-only, evaluated at build time during static generation.
//
// Artwork is picked up by convention rather than by editing code: drop a file
// into public/games/ with the right name and the next build uses it. Nothing
// found means the drawn, theme-aware SVG in game-cover-art.tsx is used instead,
// so a missing file is a normal state and never a broken image.

const PUBLIC_GAMES_DIR = path.join(process.cwd(), "public", "games");

// webp first so the smaller file wins when several formats are present.
const EXTENSIONS = ["webp", "avif", "jpg", "jpeg", "png"];

/**
 * The distinct jobs artwork does. Each game can supply one image per role:
 *   <game-id>-cover      wide banner on the hub grid card
 *   <game-id>-hero       backdrop behind the game board on its own page
 *   <game-id>-character  the game's character/mascot, shown on the start card
 *   <game-id>-victory    shown on a win or a new personal best
 *   <game-id>-defeat     shown when a run ends badly
 */
export type GameArtRole = "cover" | "hero" | "character" | "victory" | "defeat";

/**
 * Every art file under public/games, listed once at module load.
 *
 * This used to probe with `fs.existsSync(path.join(DIR, someTemplateString))`
 * per candidate file. Turbopack cannot statically scope a path built from a
 * template, so it gave up and traced the ENTIRE project into the server
 * bundle -- every source file and the whole public folder -- and warned that
 * this "can slow down deployments or lead to failures when size limits are
 * exceeded". One read of a constant directory is statically scopeable, so the
 * tracer knows exactly what it is looking at.
 *
 * It is also simply less work: one directory read replaces up to five
 * existsSync syscalls per lookup, and there are hundreds of lookups across a
 * build.
 *
 * Read once, at build time. A newly dropped-in file needs a restart to be
 * seen, which matches what this module already promised -- artwork is picked
 * up by "the next build", not live.
 */
const ART_FILES: ReadonlySet<string> = (() => {
  try {
    const entries = fs.readdirSync(PUBLIC_GAMES_DIR, {
      recursive: true,
      encoding: "utf8",
    });
    // Normalise to forward slashes so lookups are platform-independent.
    return new Set(entries.map((entry) => entry.split(path.sep).join("/")));
  } catch {
    // No art directory at all is a normal state: every caller falls back to
    // the drawn SVG, so an empty set is the correct answer, not a crash.
    return new Set<string>();
  }
})();

function findAsset(basename: string): string | null {
  for (const ext of EXTENSIONS) {
    const file = `${basename}.${ext}`;
    if (ART_FILES.has(file)) {
      return `/games/${file}`;
    }
  }
  return null;
}

/**
 * Art for the newer games, which keep their files in a per-game folder rather
 * than as `<game-id>-<role>` in one flat directory.
 *
 * The flat scheme was fine for six games with five roles each. These four carry
 * 24 images apiece -- characters, enemies, elites, bosses, backgrounds, screens
 * -- so a flat directory would be 127 files deep and impossible to scan. Both
 * layouts are supported because the original six still use the flat one and
 * renaming them would break nothing but gain nothing either.
 */
function findNested(gameId: string, role: string): string | null {
  for (const ext of EXTENSIONS) {
    const rel = `${gameId}/${role}.${ext}`;
    if (ART_FILES.has(rel)) {
      return `/games/${rel}`;
    }
  }
  return null;
}

/**
 * Any art file for a game by its role name, e.g. "boss-iron-golem",
 * "bg-dungeon", "char-apprentice". Returns null when absent, which callers
 * must treat as a normal state and fall back from -- a missing file is never
 * a broken image.
 */
export function getArt(gameId: string, role: string): string | null {
  return findNested(gameId, role) ?? findAsset(`${gameId}-${role}`);
}

/**
 * Art for one game in one role.
 *
 * `cover` falls back to the bare `<game-id>` name so the original two images
 * (falling-words.webp, word-rain.webp) keep working without being renamed, and
 * `hero` falls back to the cover so a game only needs a second image when the
 * backdrop genuinely wants to differ from the card.
 */
export function getGameArt(gameId: GameId, role: GameArtRole): string | null {
  const nested = findNested(gameId, role);
  if (nested) return nested;
  const direct = findAsset(`${gameId}-${role}`);
  if (direct) return direct;
  if (role === "cover") return findAsset(gameId);
  if (role === "hero") return getGameArt(gameId, "cover");
  return null;
}

/** Wide backdrop for the featured banner at the top of the /games hub. */
export function getHubHeroArt(): string | null {
  return findAsset("hub-hero") ?? findAsset("hero");
}
