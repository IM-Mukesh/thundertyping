"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { GameDefinition, GameId } from "@/lib/games/game-types";

// Every game is loaded with ssr:false for the same reason the typing test is:
// word spawning is randomised, so server-rendering a board would guarantee a
// hydration mismatch. The surrounding page copy (h1, rules, related links)
// stays server-rendered, so the route is still worth indexing.

export interface GameComponentProps {
  definition: GameDefinition;
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
const GAME_COMPONENTS: Record<GameId, ComponentType<GameComponentProps>> = {
  "falling-words": lazyGame(() =>
    import("@/components/games/falling-words-game").then((m) => ({ default: m.FallingWordsGame })),
  ),
  "word-rain": lazyGame(() =>
    import("@/components/games/falling-words-game").then((m) => ({ default: m.FallingWordsGame })),
  ),
};

export function GameClient({ definition }: { definition: GameDefinition }) {
  const Game = GAME_COMPONENTS[definition.id];
  if (!Game) return null;
  return <Game definition={definition} />;
}
