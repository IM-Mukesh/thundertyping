import type { FingerId } from "@/lib/lessons/keyboard-layout";

export type PracticeMode =
  | "weak-keys"
  | "transitions"
  | "finger"
  | "accuracy"
  | "speed"
  | "coding";

export const VALID_PRACTICE_MODES: readonly PracticeMode[] = [
  "weak-keys",
  "transitions",
  "finger",
  "accuracy",
  "speed",
  "coding",
] as const;

export const VALID_PRACTICE_FINGERS: readonly FingerId[] = [
  "left-pinky",
  "left-ring",
  "left-middle",
  "left-index",
  "right-index",
  "right-middle",
  "right-ring",
  "right-pinky",
] as const;

export function isValidPracticeMode(value: unknown): value is PracticeMode {
  return typeof value === "string" && (VALID_PRACTICE_MODES as readonly string[]).includes(value);
}

export function isValidPracticeFinger(value: unknown): value is FingerId {
  return typeof value === "string" && (VALID_PRACTICE_FINGERS as readonly string[]).includes(value);
}

export function parsePracticeMode(
  raw: string | null | undefined,
  fallback: PracticeMode = "weak-keys",
): PracticeMode {
  if (isValidPracticeMode(raw)) {
    return raw;
  }
  return fallback;
}

export function parsePracticeFinger(
  raw: string | null | undefined,
  fallback: FingerId = "left-pinky",
): FingerId {
  if (isValidPracticeFinger(raw)) {
    return raw;
  }
  return fallback;
}

export function parseKeyList(raw: string | null | undefined): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length === 1 && s !== " ");
}

export function parsePairList(raw: string | null | undefined): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length === 2 && !s.includes(" "));
}
