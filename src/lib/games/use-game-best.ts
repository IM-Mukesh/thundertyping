"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { GameId } from "@/lib/games/game-types";
import { parseGameBest, readGameBestRaw, subscribeGameBests } from "@/lib/games/game-scores";

/** Only confirmed persistence is a personal best, including after account changes. */
export function useGameBest(gameId: GameId, variant?: string) {
  const raw = useSyncExternalStore(subscribeGameBests, () => readGameBestRaw(gameId, variant), () => null);
  return useMemo(() => parseGameBest(raw), [raw]);
}
