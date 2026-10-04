"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/** Monotonic active time; simulation steps remain independent of render cadence. */
export function activeTimeDelta(last: number | null, now: number): number {
  return last === null ? 0 : Math.max(0, now - last);
}

/**
 * Commands run once, in the event/timer handler, against the latest snapshot.
 * React receives values, never a functional updater containing RNG, callbacks,
 * or a deferred second command. The ref also serializes batched input events.
 */
export function createGameSession<S extends { phase: string; elapsedMs: number }>(
  initial: S,
  activePhase: string,
  now: () => number = () => performance.now(),
  hidden: () => boolean = () => typeof document !== "undefined" && document.hidden,
) {
  const current = { current: initial };
  let paused = false;
  let last: number | null = initial.phase === activePhase ? now() : null;
  let snapshot = { state: initial, paused };
  const listeners = new Set<() => void>();
  const publish = () => {
    snapshot = { state: current.current, paused };
    for (const listener of listeners) listener();
  };
  const measure = () => {
    const time = now();
    const s = current.current;
    if (!paused && s.phase === activePhase) {
      current.current = { ...s, elapsedMs: s.elapsedMs + activeTimeDelta(last, time) };
      last = time;
    } else last = null;
    return current.current;
  };

  const update = (transition: (prev: S) => S) => {
    if (paused || hidden()) return;
    const next = transition(measure());
    current.current = next;
    last = next.phase === activePhase ? last ?? now() : null;
    publish();
  };

  const replace = (next: S) => {
    current.current = next;
    paused = hidden();
    last = !paused && next.phase === activePhase ? now() : null;
    publish();
  };

  const setPaused = (value: boolean) => {
    if (!value && hidden()) return;
    if (value === paused) return;
    measure();
    paused = value;
    last = !value && current.current.phase === activePhase ? now() : null;
    publish();
  };

  const pauseWhenHidden = () => {
    if (hidden() && !["select", "victory", "defeat", "over", "won"].includes(current.current.phase)) {
      setPaused(true);
    }
  };

  return {
    current, update, replace, setPaused, pauseWhenHidden,
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}

export function useGameSession<S extends { phase: string; elapsedMs: number }>(
  initial: () => S,
  activePhase: string,
) {
  const [session] = useState(() => createGameSession(initial(), activePhase));
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);

  useEffect(() => {
    document.addEventListener("visibilitychange", session.pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", session.pauseWhenHidden);
  }, [session]);

  return { ...session, ...snapshot };
}
