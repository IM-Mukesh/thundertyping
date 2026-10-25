"use client";

import { useSyncExternalStore } from "react";

// Reactive client-side store for game catalogue search and filtering.
// Provides reactive query state between the catalogue toolbar and the card grids
// across responsive desktop and mobile viewports.
// Session-only: resets on full reload or when leaving the catalogue.

const STATE_KEY = "__herotyping_game_search__";
const CHANGE_EVENT = "herotyping:game-search-change";

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

export function clearGameSearchQuery(): void {
  setGameSearchQuery("");
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
