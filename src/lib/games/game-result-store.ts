import type { GameId } from "@/lib/games/game-types";
import { cloudRecordToBest, isMetric, isUuid, normalizeGameRun, parseCloudGameRecord, parseGameAcknowledgement, parseGameBest,
  parseGameScorePayload, readGameApiResponse, type GameBest, type GameRun, type GameScorePayload } from "@/lib/games/game-result-contract";

const BEST_PREFIX = "thundertyping-game-best";
const OUTBOX_PREFIX = "herotyping:game-outbox:v1";
export const GAME_OUTBOX_LIMIT = 32;
export const gameBestKey = (gameId: GameId, variant = "") => `${BEST_PREFIX}:${gameId}${variant ? `:variant:${variant}` : ""}`;
export const gameOutboxKey = (ownerId: string) => `${OUTBOX_PREFIX}:${ownerId}`;
const cacheKey = (gameId: GameId, variant = "") => `${gameId}:${variant}`;

interface PendingRun { payload: GameScorePayload; createdAt: number }
interface StartedRun {
  runId: string;
  ownerId: string | null;
  generation: number;
  variant: string;
  result?: { isNewBest: boolean; best: GameBest };
  pending?: PendingRun;
}
export interface GameSaveState {
  status: "idle" | "saving" | "saved" | "failed";
  message: string;
  pending: number;
  canRetry: boolean;
}
interface Dependencies {
  userId(): string | null;
  generation(): number;
  uuid(): string;
  now(): number;
  get(key: string): string | null;
  /** Must throw if durable storage is unavailable. */
  set(key: string, value: string): void;
  fetch(input: string, init?: RequestInit): Promise<Response>;
  notify(): void;
  xp(total: number): void;
}

/** Outbox entries are account-owned, bounded, and retried only by explicit action. */
export class GameResultStore {
  private readonly deps: Dependencies;
  private readonly starts = new Map<GameId, StartedRun>();
  private readonly bests = new Map<string, GameBest>();
  private readonly volatile = new Map<string, PendingRun>();
  private readonly inFlight = new Map<string, Promise<void>>();
  private readonly states = new Map<GameId, GameSaveState>();
  private readonly acknowledgedIds = new Set<string>();
  private primedOwner: string | null = null;
  private primeInFlight: Promise<void> | null = null;
  private acknowledgedXp = 0;

  constructor(deps: Dependencies) { this.deps = deps; }

  identityChanged(): void {
    // Keep start-time ownership and pending requests; never rebind a live run.
    this.bests.clear(); this.states.clear(); this.primedOwner = null; this.primeInFlight = null;
    this.acknowledgedXp = 0;
    this.deps.notify();
  }

  private pending(ownerId: string): PendingRun[] {
    const entries = new Map<string, PendingRun>();
    const raw = this.deps.get(gameOutboxKey(ownerId));
    if (raw && raw.length <= 64_000) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) for (const item of parsed.slice(0, GAME_OUTBOX_LIMIT)) {
          try {
            const payload = parseGameScorePayload(item.payload);
            if (payload.ownerId === ownerId && isMetric(item.createdAt)) entries.set(payload.runId, { payload, createdAt: item.createdAt });
          } catch { /* Corrupt entries cannot become requests. */ }
        }
      } catch { /* Corrupt storage is not gameplay evidence. */ }
    }
    for (const [id, entry] of this.volatile) if (entry.payload.ownerId === ownerId) entries.set(id, entry);
    return [...entries.values()].filter((entry) => !this.acknowledgedIds.has(entry.payload.runId));
  }

  private persist(ownerId: string, entries: PendingRun[]): boolean {
    try {
      const raw = JSON.stringify(entries);
      this.deps.set(gameOutboxKey(ownerId), raw);
      return this.deps.get(gameOutboxKey(ownerId)) === raw;
    } catch { return false; }
  }

  private enqueue(entry: PendingRun): { durable: boolean; queued: boolean } {
    const entries = this.pending(entry.payload.ownerId);
    if (!entries.some((item) => item.payload.runId === entry.payload.runId)) {
      if (entries.length >= GAME_OUTBOX_LIMIT) return { durable: false, queued: false };
      entries.push(entry);
    }
    const durable = this.persist(entry.payload.ownerId, entries);
    if (!durable && !this.volatile.has(entry.payload.runId) && this.volatile.size >= GAME_OUTBOX_LIMIT) return { durable: false, queued: false };
    if (!durable) this.volatile.set(entry.payload.runId, entry);
    return { durable, queued: true };
  }

  getBest(gameId: GameId, variant = ""): GameBest | null {
    return this.deps.userId() ? this.bests.get(cacheKey(gameId, variant)) ?? null : parseGameBest(this.deps.get(gameBestKey(gameId, variant)));
  }

  start(gameId: GameId, variant = ""): void {
    this.starts.set(gameId, { runId: this.deps.uuid(), ownerId: this.deps.userId(), generation: this.deps.generation(), variant });
    this.states.delete(gameId);
    this.deps.notify();
  }

  record(gameId: GameId, rawRun: GameRun): { isNewBest: boolean; best: GameBest } {
    let started = this.starts.get(gameId);
    const candidate: GameBest = { ...rawRun, achievedAt: this.deps.now() };
    const existing = this.getBest(gameId, rawRun.variant);
    const rejected = { isNewBest: false, best: existing ?? candidate };
    if (started?.result) return started.ownerId === this.deps.userId() ? started.result : rejected;
    let run: GameRun;
    try { run = normalizeGameRun(rawRun); }
    catch (error) { this.fail(gameId, error instanceof Error ? error.message : "Invalid game result", false); return rejected; }
    if (!started) {
      if (this.deps.userId()) { this.fail(gameId, "This run has no start-time account binding. Start a new run to save.", false); return rejected; }
      this.start(gameId, run.variant);
      started = this.starts.get(gameId)!;
    }
    if (started.variant !== (run.variant ?? "")) { this.fail(gameId, "Run settings changed before saving. Start a new run with these settings.", false); return rejected; }
    const best: GameBest = { ...run, achievedAt: candidate.achievedAt };
    if (!started.ownerId) {
      const guestBest = parseGameBest(this.deps.get(gameBestKey(gameId, run.variant)));
      const isNewBest = !guestBest || run.score > guestBest.score;
      try {
        if (isNewBest) this.deps.set(gameBestKey(gameId, run.variant), JSON.stringify(best));
        if (!this.deps.userId()) this.states.set(gameId, { status: "saved", message: "Saved on this device", pending: 0, canRetry: false });
      } catch {
        this.fail(gameId, "Device storage is unavailable; this result could not be saved.", false);
        return rejected;
      }
      started.result = { isNewBest, best: isNewBest ? best : guestBest! };
      this.deps.notify();
      return this.deps.userId() === null ? started.result : rejected;
    }
    if (!isUuid(started.runId)) { this.fail(gameId, "A secure run ID could not be created. Start a new run to save.", false); return rejected; }
    const entry: PendingRun = { createdAt: best.achievedAt, payload: {
      ...run, runId: started.runId, ownerId: started.ownerId, gameId,
      variant: run.variant ?? "", wpm: run.wpm ?? null, accuracy: run.accuracy ?? null,
    } };
    started.pending = entry;
    // Synchronous callers receive a preview, never an optimistic cloud-best claim.
    started.result = { isNewBest: false, best: started.ownerId === this.deps.userId() ? existing ?? best : best };
    const queued = this.enqueue(entry);
    if (!queued.queued) this.fail(gameId, "The pending-save queue is full. Keep this page open and retry earlier saves before retrying this result.", true);
    else if (started.ownerId !== this.deps.userId() || started.generation !== this.deps.generation()) {
      this.fail(gameId, "Account changed during this run. Sign in to the starting account and retry there.", started.ownerId === this.deps.userId());
    } else { void this.send(entry, queued.durable); }
    return started.ownerId === this.deps.userId() ? started.result : rejected;
  }

  private fail(gameId: GameId, message: string, canRetry: boolean): void {
    this.states.set(gameId, { status: "failed", message, pending: 0, canRetry }); this.deps.notify();
  }

  state(gameId: GameId): GameSaveState {
    const owner = this.deps.userId();
    const entries = owner ? this.pending(owner).filter((entry) => entry.payload.gameId === gameId) : [];
    const saving = entries.some((entry) => this.inFlight.has(entry.payload.runId));
    const state = this.states.get(gameId);
    if (saving) return { status: "saving", message: "Saving to your account…", pending: entries.length, canRetry: false };
    if (entries.length) return { status: "failed", message: state?.status === "failed" ? state.message : "A result is waiting to be saved to this account.", pending: entries.length, canRetry: true };
    return state ?? { status: "idle", message: "", pending: 0, canRetry: false };
  }

  async retry(gameId: GameId): Promise<void> {
    const owner = this.deps.userId();
    const generation = this.deps.generation();
    if (!owner) return;
    for (const entry of this.pending(owner).filter((item) => item.payload.gameId === gameId)) {
      if (this.deps.userId() !== owner || this.deps.generation() !== generation) return;
      await this.send(entry, this.persist(owner, this.pending(owner)));
    }
    const leftover = this.starts.get(gameId)?.pending;
    if (leftover?.payload.ownerId === owner && this.deps.userId() === owner && this.deps.generation() === generation && !this.pending(owner).some((item) => item.payload.runId === leftover.payload.runId)) {
      const queued = this.enqueue(leftover);
      if (queued.queued) await this.send(leftover, queued.durable);
    }
  }

  private send(entry: PendingRun, durable: boolean): Promise<void> {
    const payload = entry.payload;
    const pending = this.inFlight.get(payload.runId);
    if (pending) return pending;
    if (payload.ownerId !== this.deps.userId()) return Promise.resolve();
    const generation = this.deps.generation();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    const task = Promise.resolve().then(async () => {
      try {
        if (payload.ownerId !== this.deps.userId() || generation !== this.deps.generation()) return;
        const data = await readGameApiResponse(await this.deps.fetch("/api/games/scores", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: controller.signal,
        }));
        const ack = parseGameAcknowledgement(data, payload);
        this.acknowledgedIds.add(payload.runId);
        if (this.acknowledgedIds.size > GAME_OUTBOX_LIMIT * 2) this.acknowledgedIds.delete(this.acknowledgedIds.values().next().value!);
        this.volatile.delete(payload.runId);
        this.persist(payload.ownerId, this.pending(payload.ownerId).filter((item) => item.payload.runId !== payload.runId));
        const started = this.starts.get(payload.gameId);
        if (started?.runId === payload.runId) delete started.pending;
        if (generation === this.deps.generation() && payload.ownerId === this.deps.userId()) {
          this.mergeBest(payload.gameId, payload.variant, cloudRecordToBest(ack.best));
          this.acknowledgedXp = Math.max(this.acknowledgedXp, ack.totalXp);
          this.deps.xp(this.acknowledgedXp);
          this.states.set(payload.gameId, { status: "saved", message: ack.isNewBest ? "Saved to your account · New personal best!" : "Saved to your account", pending: 0, canRetry: false });
        }
      } catch (error) {
        if (generation === this.deps.generation() && payload.ownerId === this.deps.userId()) {
          this.fail(payload.gameId, `${error instanceof Error ? error.message : "Could not save this result"}${durable ? "" : " Keep this page open: device storage is unavailable."}`, true);
        }
      } finally {
        clearTimeout(timer); this.inFlight.delete(payload.runId); this.deps.notify();
      }
    });
    this.inFlight.set(payload.runId, task); this.deps.notify();
    return task;
  }

  private mergeBest(gameId: GameId, variant: string, best: GameBest): void {
    const key = cacheKey(gameId, variant);
    const existing = this.bests.get(key);
    if (!existing || best.score > existing.score) this.bests.set(key, best);
  }

  prime(owner: string): Promise<void> {
    if (owner !== this.deps.userId()) return Promise.resolve();
    if (this.primedOwner === owner) return this.primeInFlight ?? Promise.resolve();
    const generation = this.deps.generation();
    this.primedOwner = owner;
    this.primeInFlight = (async () => {
      try {
        const data = await readGameApiResponse(await this.deps.fetch("/api/games/scores", { headers: { "X-Game-Owner": owner }, cache: "no-store" }));
        if (!Array.isArray(data)) throw new Error("Invalid game bests response");
        const rows = data.map((row) => parseCloudGameRecord(row, owner));
        if (generation === this.deps.generation() && owner === this.deps.userId()) {
          for (const row of rows) this.mergeBest(row.game_id, row.variant, cloudRecordToBest(row));
          this.deps.notify();
        }
      } catch {
        if (generation === this.deps.generation()) this.primedOwner = null;
      } finally { if (generation === this.deps.generation()) this.primeInFlight = null; }
    })();
    return this.primeInFlight;
  }
}
