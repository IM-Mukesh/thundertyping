"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Trophy } from "lucide-react";
import { gameBestKey, parseGameBest } from "@/lib/games/game-scores";
import { getStorageItem } from "@/lib/persistence/storage";
import type { GameDefinition } from "@/lib/games/game-types";

// A score only changes by playing the game, which means leaving this page and
// coming back — so there's nothing to subscribe to while the hub is open.
const noopSubscribe = () => () => {};

/**
 * Personal best for one game, read on the client only.
 *
 * Deliberately `useSyncExternalStore` rather than a mount effect: it returns
 * null for the server snapshot and the real value for the client one, so React
 * reconciles the difference itself instead of producing a hydration mismatch
 * (or tripping the lint rule against setState-in-effect). The snapshot is the
 * raw localStorage *string* — a stable primitive — and parsing happens in a
 * memo, because returning a freshly parsed object per call would never compare
 * equal and would re-render forever.
 */
export function GameBestBadge({ definition }: { definition: GameDefinition }) {
  const raw = useSyncExternalStore(
    noopSubscribe,
    () => getStorageItem(gameBestKey(definition.id)),
    () => null,
  );
  const best = useMemo(() => parseGameBest(raw), [raw]);

  if (!best) return null;

  const value = definition.scoreBy === "time" ? `${best.score}s` : best.score.toLocaleString();

  return (
    <span
      className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-[11px] font-medium text-accent"
      aria-label={`Your best: ${value}`}
    >
      <Trophy size={11} />
      {value}
    </span>
  );
}
