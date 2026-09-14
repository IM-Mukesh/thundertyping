"use client";

import dynamic from "next/dynamic";
import type { GameDefinition } from "@/lib/games/game-types";

// Same reasoning as the typing test's client wrapper: word spawning is
// randomized, so server-rendering the board would guarantee a hydration
// mismatch. The surrounding page copy (h1, rules, related links) stays
// server-rendered so the route is still worth indexing.
const FallingWordsGame = dynamic(
  () => import("@/components/games/falling-words-game").then((m) => m.FallingWordsGame),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[480px] w-full max-w-3xl items-center justify-center text-sub">
        Loading game…
      </div>
    ),
  },
);

export function GameClient({ definition }: { definition: GameDefinition }) {
  return <FallingWordsGame definition={definition} />;
}
