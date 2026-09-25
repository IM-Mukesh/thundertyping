"use client";

import { useSyncExternalStore } from "react";
import type { TestStatus } from "@/lib/typing-engine/engine-types";

// Signals typing test lifecycle states ("idle" | "running" | "finished") to
// page-level siblings of the typing island (PageIntro, SiteHeader, SiteFooter,
// feature nav cards, SEO sections) so a typist enters a clean, distraction-free
// Zen mode while typing and results aren't crowded by page chrome.
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

const STATE_KEY = "__herotyping_test_status__";
const CHANGE_EVENT = "herotyping:test-status-change";

interface TestStatusState {
  status: TestStatus;
  isRunning: boolean;
  isFinished: boolean;
}

type WindowWithState = Window & { [STATE_KEY]?: TestStatusState };

function getState(): TestStatusState {
  if (typeof window === "undefined") {
    return { status: "idle", isRunning: false, isFinished: false };
  }
  const w = window as WindowWithState;
  w[STATE_KEY] ??= { status: "idle", isRunning: false, isFinished: false };
  return w[STATE_KEY];
}

export function setTestStatus(status: TestStatus): void {
  if (typeof window === "undefined") return;
  const state = getState();
  const isRunning = status === "running";
  const isFinished = status === "finished";
  if (state.status === status && state.isRunning === isRunning && state.isFinished === isFinished) {
    return;
  }
  state.status = status;
  state.isRunning = isRunning;
  state.isFinished = isFinished;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function setTestFinished(isFinished: boolean): void {
  setTestStatus(isFinished ? "finished" : "idle");
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(CHANGE_EVENT, onStoreChange);
}

// Return primitives so React's snapshot identity check compares by value
// and never loops.
function getSnapshotRunning(): boolean {
  return getState().isRunning;
}

function getSnapshotFinished(): boolean {
  return getState().isFinished;
}

function getSnapshotStatus(): TestStatus {
  return getState().status;
}

function getServerSnapshotFalse(): boolean {
  return false;
}

function getServerSnapshotIdle(): TestStatus {
  return "idle";
}

export function useIsTestRunning(): boolean {
  return useSyncExternalStore(subscribe, getSnapshotRunning, getServerSnapshotFalse);
}

export function useIsTestFinished(): boolean {
  return useSyncExternalStore(subscribe, getSnapshotFinished, getServerSnapshotFalse);
}

export function useTestStatus(): TestStatus {
  return useSyncExternalStore(subscribe, getSnapshotStatus, getServerSnapshotIdle);
}
