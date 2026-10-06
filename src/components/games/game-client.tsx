"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { GameDefinition, GameId } from "@/lib/games/game-types";
import { GameSaveStatus } from "@/components/games/ui/game-save-status";

// Every game is loaded with ssr:false for the same reason the typing test is:
// word spawning is randomised, so server-rendering a board would guarantee a
// hydration mismatch. The surrounding page copy (h1, rules, related links)
// stays server-rendered, so the route is still worth indexing.

export interface GameComponentProps {
  definition: GameDefinition;
  /**
   * Resolved art URLs, keyed by role (e.g. "hero", "boss-dreadnought"). Art
   * resolution (`game-art-assets.ts`) reads the filesystem and can only run
   * server-side, so the page resolves whatever a game needs and hands the
   * plain strings down — a game with nothing special to render just ignores
   * this prop, which is why it's optional rather than every game needing an
   * empty object.
   */
  art?: Record<string, string | null>;
}

function lazyGame(load: () => Promise<{ default: ComponentType<GameComponentProps> }>) {
  return dynamic(load, {
    ssr: false,
    loading: () => (
      <div className="flex h-[480px] w-full max-w-3xl items-center justify-center text-sub">
        Loading game…
      </div>
    ),
  });
}

/**
 * Maps a game id to its component.
 *
 * **To add a game, add one line here** and the /games/[gameId] route picks it
 * up — no other file in this directory needs to change. Each entry is its own
 * dynamic import, so a player only downloads the game they actually opened
 * rather than every game on the site.
 *
 * Games sharing an engine can point at the same component (Falling Words and
 * Word Rain both render the falling-words board and differ only by tuning);
 * a game with its own mechanic points at its own.
 */
const GAME_COMPONENTS: Partial<Record<GameId, ComponentType<GameComponentProps>>> = {
  "rakshasa-war": lazyGame(() => import("@/components/games/rakshasa-war-game")),
  "falling-words": lazyGame(() =>
    import("@/components/games/falling-words-game").then((m) => ({ default: m.FallingWordsGame })),
  ),
  "word-rain": lazyGame(() =>
    import("@/components/games/word-rain-game").then((m) => ({ default: m.WordRainGame })),
  ),
  "word-blaster": lazyGame(() =>
    import("@/components/games/word-blaster-game").then((m) => ({ default: m.WordBlasterGame })),
  ),
  "boss-battle": lazyGame(() =>
    import("@/components/games/boss-battle-game").then((m) => ({ default: m.BossBattleGame })),
  ),
  "combo-rush": lazyGame(() =>
    import("@/components/games/combo-rush-game").then((m) => ({ default: m.ComboRushGame })),
  ),
  spellbound: lazyGame(() => import("@/components/games/spellbound-game")),
  "ghost-racer": lazyGame(() => import("@/components/games/ghost-racer-game")),
  "card-battle": lazyGame(() => import("@/components/games/card-battle-game")),
  "fruit-fury": lazyGame(() => import("@/components/games/fruit-fury-game")),
};

export function GameClient({
  definition,
  art,
}: {
  definition: GameDefinition;
  art?: Record<string, string | null>;
}) {
  const Game = GAME_COMPONENTS[definition.id];
  if (!Game) return null;
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Game definition={definition} art={art} />
      <GameSaveStatus gameId={definition.id} />
    </div>
  );
}
