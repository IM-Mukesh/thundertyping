import { getCurrentUserId } from "@/lib/auth/current-user";
import { getStorageItem, setStorageItem } from "@/lib/persistence/storage";

export interface GhostSample { t: number; i: number }

export interface GhostRun {
  version: 3;
  id: string;
  textKey: string;
  ownerId: string | null;
  totalChars: number;
  name: string;
  samples: GhostSample[];
  durationMs: number;
  wpm: number;
  accuracy: number;
  recordedAt: string;
}

// Older recordings lack exact content/rules and ownership. Do not import them.
export const GHOST_STORAGE_KEY = "thundertyping:ghost:v3:index";
export const MAX_GHOST_SAMPLES = 2048;
export const MAX_GHOST_COURSES = 24;
export const MAX_GHOSTS_PER_COURSE = 3;
export const MAX_GHOST_STORAGE_BYTES = 512_000;
const MAX_CHARS = 4096;
const MAX_DURATION_MS = 86_400_000;

function integerIn(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;
}

function finiteIn(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

/** Validate before playback: sorted bounded timestamps, legal positions, full finish. */
export function isValidGhostRun(value: unknown): value is GhostRun {
  if (!value || typeof value !== "object") return false;
  const run = value as Partial<GhostRun>;
  if (run.version !== 3 || typeof run.id !== "string" || !run.id || run.id.length > 100 ||
      typeof run.textKey !== "string" || !/^ghost:v3:[\w:-]{1,160}:r[\da-f]+:t[\da-f]+-[\da-f]+$/.test(run.textKey) ||
      !(run.ownerId === null || (typeof run.ownerId === "string" && run.ownerId.length > 0 && run.ownerId.length <= 128)) ||
      typeof run.name !== "string" || run.name.length > 80 ||
      !integerIn(run.totalChars, 1, MAX_CHARS) || !integerIn(run.durationMs, 1, MAX_DURATION_MS) ||
      !finiteIn(run.wpm, 0, MAX_CHARS * 12_000) || !finiteIn(run.accuracy, 0, 100) ||
      typeof run.recordedAt !== "string" || run.recordedAt.length > 40 || !Number.isFinite(Date.parse(run.recordedAt)) ||
      !Array.isArray(run.samples) || run.samples.length < 2 || run.samples.length > MAX_GHOST_SAMPLES) return false;

  let lastTime = -1;
  for (const sample of run.samples) {
    if (!sample || typeof sample !== "object" || !integerIn(sample.t, 0, run.durationMs) ||
        !integerIn(sample.i, 0, run.totalChars) || sample.t <= lastTime) return false;
    lastTime = sample.t;
  }
  const first = run.samples[0];
  const last = run.samples[run.samples.length - 1];
  return first.t === 0 && first.i === 0 && last.i === run.totalChars && last.t === run.durationMs &&
    Math.abs(run.wpm - (run.totalChars * 12_000 / run.durationMs)) <= 1;
}

function cleanRun(run: GhostRun): GhostRun {
  return {
    version: 3, id: run.id, textKey: run.textKey, ownerId: run.ownerId, totalChars: run.totalChars,
    name: run.name, samples: run.samples.map(({ t, i }) => ({ t, i })), durationMs: run.durationMs,
    wpm: run.wpm, accuracy: run.accuracy, recordedAt: run.recordedAt,
  };
}

function readRuns(): GhostRun[] {
  const raw = getStorageItem(GHOST_STORAGE_KEY);
  if (!raw || raw.length > MAX_GHOST_STORAGE_BYTES) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || value.length > MAX_GHOST_COURSES * MAX_GHOSTS_PER_COURSE) return [];
    return value.filter(isValidGhostRun).map(cleanRun);
  } catch { return []; }
}

/** Keep the PB synchronously, so a rematch cannot pick a stale asynchronous load. */
export function personalBestFor(current: GhostRun | null, candidate: GhostRun): GhostRun {
  if (!current || current.ownerId !== candidate.ownerId || current.textKey !== candidate.textKey || current.totalChars !== candidate.totalChars) return candidate;
  return candidate.durationMs < current.durationMs ? candidate : current;
}

export function readBestGhost(textKey: string, totalChars: number, ownerId = getCurrentUserId()): GhostRun | null {
  return readRuns().filter((run) => run.ownerId === ownerId && run.textKey === textKey && run.totalChars === totalChars)
    .reduce<GhostRun | null>((best, run) => personalBestFor(best, run), null);
}

export function ghostForRematch(textKey: string, totalChars: number, ownerId: string | null, latest: GhostRun | null, stored: GhostRun | null, pacerWpm: number): GhostRun {
  const matches = (run: GhostRun | null) => run?.ownerId === ownerId && run.textKey === textKey && run.totalChars === totalChars;
  const memory = matches(latest) ? latest : null;
  const best = stored && matches(stored) ? personalBestFor(memory, stored) : memory;
  return best ?? pacerGhost(textKey, totalChars, pacerWpm);
}

/** One active-time source drives both the HUD and recorder, including pauses. */
export class GhostRecorder {
  private samples: GhostSample[] = [];
  private startedAt = 0;
  private pausedAt: number | null = null;
  private lastIndex = 0;
  private running = false;
  private finished = false;

  start(now = performance.now()): void {
    this.samples = [{ t: 0, i: 0 }];
    this.startedAt = now;
    this.pausedAt = null;
    this.lastIndex = 0;
    this.running = true;
    this.finished = false;
  }

  elapsed(now = performance.now()): number {
    if (!this.running) return 0;
    if (this.finished) return this.samples[this.samples.length - 1]?.t ?? 0;
    return Math.max(0, Math.round((this.pausedAt ?? now) - this.startedAt));
  }

  pause(now = performance.now()): void {
    if (this.running && !this.finished && this.pausedAt === null) this.pausedAt = now;
  }

  resume(now = performance.now()): void {
    if (this.pausedAt === null) return;
    this.startedAt += Math.max(0, now - this.pausedAt);
    this.pausedAt = null;
  }

  mark(index: number, now = performance.now()): void {
    if (!this.running || this.finished || this.pausedAt !== null || index === this.lastIndex || !integerIn(index, 0, MAX_CHARS)) return;
    this.lastIndex = index;
    const last = this.samples[this.samples.length - 1];
    const t = Math.max(1, last.t, this.elapsed(now));
    if (last.t === t) this.samples[this.samples.length - 1] = { t, i: index };
    else this.samples.push({ t, i: index });
    // Long correction-heavy runs stay bounded; keep the origin and latest sample.
    if (this.samples.length > MAX_GHOST_SAMPLES) {
      this.samples = this.samples.filter((_, i, all) => i % 2 === 0 || i === all.length - 1);
    }
  }

  finish(meta: { textKey: string; ownerId: string | null; totalChars: number; name: string; accuracy: number }, now = performance.now()): GhostRun | null {
    if (!this.running || this.finished || this.pausedAt !== null || this.lastIndex !== meta.totalChars) return null;
    const durationMs = Math.max(1, this.elapsed(now));
    const last = this.samples[this.samples.length - 1];
    // A final sample uses the actual finish event time, not the next UI tick.
    if (last.t < durationMs) {
      if (this.samples.length === MAX_GHOST_SAMPLES) this.samples.splice(1, 1);
      this.samples.push({ t: durationMs, i: this.lastIndex });
    }
    this.finished = true;
    return {
      version: 3,
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
      ...meta,
      samples: this.samples.map((sample) => ({ ...sample })),
      durationMs,
      wpm: Math.round(meta.totalChars * 12_000 / durationMs),
      recordedAt: new Date().toISOString(),
    };
  }
}

export function ghostIndexAt(ghost: GhostRun, elapsedMs: number): number {
  const samples = ghost.samples;
  if (samples.length === 0 || !Number.isFinite(elapsedMs)) return 0;
  if (elapsedMs <= samples[0].t) return samples[0].i;
  const last = samples[samples.length - 1];
  if (elapsedMs >= last.t) return last.i;
  let lo = 0;
  let hi = samples.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].t <= elapsedMs) lo = mid;
    else hi = mid;
  }
  const a = samples[lo];
  const b = samples[hi];
  return a.i + ((elapsedMs - a.t) / (b.t - a.t)) * (b.i - a.i);
}

/** The first completed run is kept at any speed, even when the pacer wins. */
export function pacerGhost(textKey: string, totalChars: number, wpm = 45): GhostRun {
  const durationMs = Math.max(1, Math.round((totalChars * 12_000) / Math.max(1, wpm)));
  return { version: 3, id: `pacer-${wpm}`, textKey, ownerId: null, totalChars,
    name: `${wpm} WPM pacer`, samples: [{ t: 0, i: 0 }, { t: durationMs, i: totalChars }],
    durationMs, wpm, accuracy: 100, recordedAt: new Date(0).toISOString() };
}

export function isPacer(ghost: GhostRun): boolean { return ghost.id.startsWith("pacer-"); }

export interface GhostStore {
  list(textKey: string): Promise<GhostRun[]>;
  best(textKey: string, totalChars: number): Promise<GhostRun | null>;
  save(run: GhostRun): Promise<boolean>;
  clear(textKey?: string): Promise<void>;
}

export const localGhostStore: GhostStore = {
  async list(textKey) {
    const ownerId = getCurrentUserId();
    return readRuns().filter((run) => run.ownerId === ownerId && run.textKey === textKey);
  },
  async best(textKey, totalChars) { return readBestGhost(textKey, totalChars); },
  async save(run) {
    if (!isValidGhostRun(run) || isPacer(run) || run.ownerId !== getCurrentUserId()) return false;
    const existing = readRuns();
    const courseId = (r: GhostRun) => JSON.stringify([r.ownerId, r.textKey]);
    const id = courseId(run);
    const course = [cleanRun(run), ...existing.filter((r) => courseId(r) === id && r.id !== run.id)]
      .sort((a, b) => a.durationMs - b.durationMs || a.recordedAt.localeCompare(b.recordedAt))
      .slice(0, MAX_GHOSTS_PER_COURSE);
    const other = existing.filter((r) => courseId(r) !== id)
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
    const courseIds = new Set([id]);
    const counts = new Map<string, number>([[id, course.length]]);
    const bounded = [...course];
    for (const r of other) {
      const otherId = courseId(r);
      if (!courseIds.has(otherId) && courseIds.size >= MAX_GHOST_COURSES) continue;
      if ((counts.get(otherId) ?? 0) >= MAX_GHOSTS_PER_COURSE) continue;
      courseIds.add(otherId);
      counts.set(otherId, (counts.get(otherId) ?? 0) + 1);
      bounded.push(r);
    }
    let serialized = JSON.stringify(bounded);
    while (serialized.length > MAX_GHOST_STORAGE_BYTES && bounded.length > 1) {
      bounded.pop();
      serialized = JSON.stringify(bounded);
    }
    setStorageItem(GHOST_STORAGE_KEY, serialized);
    return getStorageItem(GHOST_STORAGE_KEY) === serialized;
  },
  async clear(textKey) {
    const ownerId = getCurrentUserId();
    setStorageItem(GHOST_STORAGE_KEY, JSON.stringify(readRuns().filter((run) =>
      run.ownerId !== ownerId || (textKey !== undefined && run.textKey !== textKey))));
  },
};

export const RANKS = [
  { id: "bronze", name: "Bronze", minWpm: 0, art: "/games/ghost-racer/rank-bronze.webp" },
  { id: "silver", name: "Silver", minWpm: 45, art: "/games/ghost-racer/rank-silver.webp" },
  { id: "gold", name: "Gold", minWpm: 70, art: "/games/ghost-racer/rank-gold.webp" },
  { id: "legend", name: "Legend", minWpm: 100, art: "/games/ghost-racer/rank-legend.webp" },
] as const;

export function rankFor(wpm: number) {
  return [...RANKS].reverse().find((rank) => wpm >= rank.minWpm) ?? RANKS[0];
}
