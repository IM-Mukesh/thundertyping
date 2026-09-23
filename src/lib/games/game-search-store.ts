"use client";

import { useSyncExternalStore } from "react";

// Bridges the header's search input to the game grid's filtering. They are
// siblings (header lives in the root layout, the grid lives in the /games
// page), not parent/child, so there is no prop path between them — this is
// the same window-anchored pattern as test-status-store.ts, chosen for
// consistency even though neither side of this one crosses a next/dynamic
// ssr:false boundary today. Session-only: the query resets on a full reload,
// matching "search" rather than "a saved filter".

const STATE_KEY = "__thundertyping_game_search__";
const CHANGE_EVENT = "thundertyping:game-search-change";

interface GameSearchState {
  query: string;
}

type WindowWithState = Window & { [STATE_KEY]?: GameSearchState };

function getState(): GameSearchState {
  if (typeof window === "undefined") return { query: "" };
  const w = window as WindowWithState;
  w[STATE_KEY] ??= { query: "" };
  return w[STATE_KEY];
}

export function setGameSearchQuery(query: string): void {
  if (typeof window === "undefined") return;
  const state = getState();
  if (state.query === query) return;
  state.query = query;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(CHANGE_EVENT, onStoreChange);
}

function getSnapshot(): string {
  return getState().query;
}

// The grid's initial server render must show every game unfiltered — the
// query can only ever exist client-side.
function getServerSnapshot(): string {
  return "";
}

export function useGameSearchQuery(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
