"use client";

import { useSyncExternalStore } from "react";

// Signals "a test just finished" to page-level siblings of the typing island
// (PageIntro's h1/subtitle, SiteFooter) so the results screen isn't crowded
// by page chrome.
//
// The state deliberately lives on `window`, NOT in a module-level variable.
// `TypingTest` is loaded through next/dynamic({ ssr: false }), and the bundler
// emits this module into BOTH the lazy chunk and the shared client chunk —
// verified directly in build output, where `setFinished` appeared in two
// separate files under .next/static/chunks. Any module-level singleton (a
// zustand `create()`, a `createContext()`, a plain `let`) therefore becomes
// two independent instances: the writer inside the lazy chunk updates one,
// the readers in the shared chunk subscribe to the other, and the signal
// silently never arrives. That was a real, shipped bug — the config bar hid
// correctly (it uses TypingTest's own local state) while the h1 and footer
// stayed put, leaving the results screen scrolling by ~600px.
//
// Anchoring the value to a single window-scoped object makes duplication
// harmless: every copy of this module reads and writes the exact same place.
// Prefer this pattern (or the window-event bus in reset-bus.ts) over a
// module singleton for ANY state shared across that dynamic-import boundary.

const STATE_KEY = "__thundertyping_test_status__";
const CHANGE_EVENT = "thundertyping:test-status-change";

interface TestStatusState {
  isFinished: boolean;
}

type WindowWithState = Window & { [STATE_KEY]?: TestStatusState };

function getState(): TestStatusState {
  if (typeof window === "undefined") return { isFinished: false };
  const w = window as WindowWithState;
  w[STATE_KEY] ??= { isFinished: false };
  return w[STATE_KEY];
}

export function setTestFinished(isFinished: boolean): void {
  if (typeof window === "undefined") return;
  const state = getState();
  if (state.isFinished === isFinished) return;
  state.isFinished = isFinished;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(CHANGE_EVENT, onStoreChange);
}

// Returns a primitive, so React's snapshot identity check compares by value
// and can't loop.
function getSnapshot(): boolean {
  return getState().isFinished;
}

// A test can never be "finished" in server-rendered HTML — the engine only
// exists client-side — so the server snapshot is always false. This keeps the
// h1/footer present in the initial HTML for crawlers.
function getServerSnapshot(): boolean {
  return false;
}

export function useIsTestFinished(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
