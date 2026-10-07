import { MAX_CUSTOM_TIME_DURATION, MIN_CUSTOM_TIME_DURATION } from "@/lib/typing-engine/engine-types";

export const CUSTOM_DURATION_HINT = `${MIN_CUSTOM_TIME_DURATION}–${MAX_CUSTOM_TIME_DURATION} seconds`;
export const CUSTOM_DURATION_ERROR = `Enter whole seconds from ${MIN_CUSTOM_TIME_DURATION} to ${MAX_CUSTOM_TIME_DURATION}.`;

/** Reject invalid drafts rather than silently changing the requested duration. */
export function parseCustomDuration(draft: string): number | null {
  const trimmed = draft.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const seconds = Number(trimmed);
  return Number.isInteger(seconds) &&
    seconds >= MIN_CUSTOM_TIME_DURATION &&
    seconds <= MAX_CUSTOM_TIME_DURATION
    ? seconds
    : null;
}

/** Keep interior zero units (1h 0m 5s), but omit trailing zeros (2m). */
export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    if (s > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${h}h ${m}m`;
    return `${h}h`;
  }
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  return `${s}s`;
}

/**
 * Parses and validates an optional URL duration parameter in seconds.
 * Reuses parseCustomDuration to enforce integer and min/max constraints.
 * Returns valid seconds or null if missing, malformed, or out of range.
 */
export function parseUrlDuration(param: string | string[] | null | undefined): number | null {
  if (param === null || param === undefined) return null;
  const raw = Array.isArray(param) ? param[0] : param;
  if (typeof raw !== "string") return null;
  return parseCustomDuration(raw);
}

/**
 * Reads and validates an initial duration parameter from the browser URL search query, if available.
 * Returns valid whole seconds within supported custom duration range, or null if not in browser or missing/invalid.
 */
export function getInitialUrlDuration(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    return parseUrlDuration(params.get("duration"));
  } catch {
    return null;
  }
}

