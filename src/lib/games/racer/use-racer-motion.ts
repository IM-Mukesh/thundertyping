"use client";

import { useState, useSyncExternalStore } from "react";

const KEY = "herotyping:ghost-racer:motion";
const QUERY = "(prefers-reduced-motion: reduce)";
const EVENT = "ghost-racer-motion";

function snapshot(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored === "reduced" || stored === "full") return stored === "reduced";
  } catch { /* OS preference still works without storage. */ }
  return window.matchMedia(QUERY).matches;
}

function subscribe(notify: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", notify);
  window.addEventListener("storage", notify);
  window.addEventListener(EVENT, notify);
  return () => {
    query.removeEventListener("change", notify);
    window.removeEventListener("storage", notify);
    window.removeEventListener(EVENT, notify);
  };
}

export function useRacerMotion() {
  const preference = useSyncExternalStore(subscribe, snapshot, () => true);
  // A blocked/quota-limited browser must not break the control itself.
  const [fallback, setFallback] = useState<boolean | null>(null);
  const reducedMotion = fallback ?? preference;
  const toggleMotion = () => {
    const next = !reducedMotion;
    try {
      window.localStorage.setItem(KEY, next ? "reduced" : "full");
      setFallback(null);
      window.dispatchEvent(new Event(EVENT));
    } catch { setFallback(next); }
  };
  return { reducedMotion, toggleMotion };
}
