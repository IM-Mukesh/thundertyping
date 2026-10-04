"use client";

import { useSyncExternalStore } from "react";
import type { GameId } from "@/lib/games/game-types";
import { readGameSaveStateRaw, retryGameSaves, subscribeGameBests, type GameSaveState } from "@/lib/games/game-scores";

const serverSnapshot = () => "";

export function GameSaveStatus({ gameId }: { gameId: GameId }) {
  const raw = useSyncExternalStore(subscribeGameBests, () => readGameSaveStateRaw(gameId), serverSnapshot);
  const state: GameSaveState | null = raw ? JSON.parse(raw) : null;
  if (!state || state.status === "idle") return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 px-3 py-2 text-xs text-sub" role="status" aria-live="polite">
      <span>{state.message}{state.pending > 1 ? ` (${state.pending} pending)` : ""}</span>
      {state.canRetry && (
        <button type="button" onClick={() => void retryGameSaves(gameId)} className="min-h-11 rounded border border-current px-3 py-1 font-semibold text-accent hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2">
          Retry save
        </button>
      )}
    </div>
  );
}
