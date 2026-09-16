/**
 * Ghost recording, playback and storage.
 *
 * A ghost is a real run's keystrokes with their original timing — the pause on
 * a hard word, the burst where the typist found their rhythm. That unevenness
 * is the whole point of the mode, so playback interpolates between recorded
 * samples and never smooths them into a constant pace. Racing a straight line
 * feels like racing a number; racing this feels like racing a person.
 *
 * Every read and write goes through the small interface at the bottom of this
 * file. Swapping localStorage for a server later means replacing one object,
 * not touching game code.
 */

import { getStorageItem, setStorageItem } from "@/lib/persistence/storage";

/** One sample: milliseconds since the run began, and characters completed. */
export interface GhostSample {
  t: number;
  i: number;
}

export interface GhostRun {
  id: string;
  /** Which text this was run against; a ghost only races its own text. */
  textKey: string;
  /** Display name for the racer. Local runs are "You". */
  name: string;
  samples: GhostSample[];
  durationMs: number;
  wpm: number;
  accuracy: number;
  recordedAt: string;
}

const KEY_PREFIX = "thundertyping:ghost:v1";
const INDEX_KEY = `${KEY_PREFIX}:index`;
/** Ghosts are small but not free; keep the most recent per text. */
const MAX_PER_TEXT = 5;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Corrupt local state is a normal condition, not an error: a hand-edited
    // or truncated entry must not break the race screen.
    return fallback;
  }
}

/**
 * Records keystroke progress during a run.
 *
 * Samples are only appended when the character index actually advances, so a
 * player holding a key or pausing costs nothing. A 60-second run at 80 WPM is
 * roughly 400 samples, which is a few KB of JSON.
 */
export class GhostRecorder {
  private samples: GhostSample[] = [];
  private startedAt = 0;
  private lastIndex = -1;

  start(now = performance.now()): void {
    this.samples = [{ t: 0, i: 0 }];
    this.startedAt = now;
    this.lastIndex = 0;
  }

  /** Call whenever the player's completed-character count changes. */
  mark(index: number, now = performance.now()): void {
    if (index === this.lastIndex) return;
    this.lastIndex = index;
    this.samples.push({ t: Math.round(now - this.startedAt), i: index });
  }

  finish(
    meta: { textKey: string; name: string; wpm: number; accuracy: number },
    now = performance.now(),
  ): GhostRun {
    const durationMs = Math.round(now - this.startedAt);
    return {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      textKey: meta.textKey,
      name: meta.name,
      samples: this.samples,
      durationMs,
      wpm: meta.wpm,
      accuracy: meta.accuracy,
      recordedAt: new Date().toISOString(),
    };
  }
}

/**
 * Where a ghost is at a given moment.
 *
 * Linear interpolation between the two surrounding samples. The result is
 * fractional on purpose: a ghost that jumped in whole characters would stutter
 * visibly at low WPM, where samples are hundreds of milliseconds apart.
 */
export function ghostIndexAt(ghost: GhostRun, elapsedMs: number): number {
  const s = ghost.samples;
  if (s.length === 0) return 0;
  if (elapsedMs <= s[0].t) return s[0].i;
  const last = s[s.length - 1];
  if (elapsedMs >= last.t) return last.i;

  // Binary search for the sample pair bracketing this time. A linear scan runs
  // every frame against hundreds of samples; this keeps playback cheap.
  let lo = 0;
  let hi = s.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (s[mid].t <= elapsedMs) lo = mid;
    else hi = mid;
  }
  const a = s[lo];
  const b = s[hi];
  const span = b.t - a.t;
  if (span <= 0) return b.i;
  return a.i + ((elapsedMs - a.t) / span) * (b.i - a.i);
}

/**
 * A synthetic ghost at a constant pace.
 *
 * Used only when nobody has raced this text yet, and the UI says so plainly
 * rather than passing it off as a real opponent. Fabricating a human-looking
 * ghost would be lying to the player about who they are racing.
 */
export function pacerGhost(
  textKey: string,
  totalChars: number,
  wpm: number,
): GhostRun {
  const durationMs = Math.round((totalChars / 5 / wpm) * 60_000);
  return {
    id: `pacer-${wpm}`,
    textKey,
    name: `${wpm} WPM pacer`,
    samples: [
      { t: 0, i: 0 },
      { t: durationMs, i: totalChars },
    ],
    durationMs,
    wpm,
    accuracy: 100,
    recordedAt: new Date(0).toISOString(),
  };
}

export function isPacer(ghost: GhostRun): boolean {
  return ghost.id.startsWith("pacer-");
}

/**
 * The storage seam.
 *
 * Deliberately narrow and all-async, so a server implementation drops in
 * without any caller learning about the change — even though the local one
 * resolves immediately.
 */
export interface GhostStore {
  list(textKey: string): Promise<GhostRun[]>;
  best(textKey: string): Promise<GhostRun | null>;
  save(run: GhostRun): Promise<void>;
  clear(textKey?: string): Promise<void>;
}

export const localGhostStore: GhostStore = {
  async list(textKey) {
    const all = safeParse<Record<string, GhostRun[]>>(
      getStorageItem(INDEX_KEY),
      {},
    );
    return all[textKey] ?? [];
  },

  async best(textKey) {
    const runs = await localGhostStore.list(textKey);
    if (runs.length === 0) return null;
    return runs.reduce((a, b) => (b.durationMs < a.durationMs ? b : a));
  },

  async save(run) {
    const all = safeParse<Record<string, GhostRun[]>>(
      getStorageItem(INDEX_KEY),
      {},
    );
    const list = [run, ...(all[run.textKey] ?? [])]
      // keep the fastest, not merely the newest: the slow runs are the ones
      // nobody wants to race again
      .sort((a, b) => a.durationMs - b.durationMs)
      .slice(0, MAX_PER_TEXT);
    all[run.textKey] = list;
    setStorageItem(INDEX_KEY, JSON.stringify(all));
  },

  async clear(textKey) {
    if (!textKey) {
      setStorageItem(INDEX_KEY, "{}");
      return;
    }
    const all = safeParse<Record<string, GhostRun[]>>(
      getStorageItem(INDEX_KEY),
      {},
    );
    delete all[textKey];
    setStorageItem(INDEX_KEY, JSON.stringify(all));
  },
};

/** Rank tiers, by WPM. Art exists for each under /games/ghost-racer/. */
export const RANKS = [
  { id: "bronze", name: "Bronze", minWpm: 0, art: "/games/ghost-racer/rank-bronze.webp" },
  { id: "silver", name: "Silver", minWpm: 45, art: "/games/ghost-racer/rank-silver.webp" },
  { id: "gold", name: "Gold", minWpm: 70, art: "/games/ghost-racer/rank-gold.webp" },
  { id: "legend", name: "Legend", minWpm: 100, art: "/games/ghost-racer/rank-legend.webp" },
] as const;

export function rankFor(wpm: number) {
  return [...RANKS].reverse().find((r) => wpm >= r.minWpm) ?? RANKS[0];
}
