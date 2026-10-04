import { GAME_DEFINITIONS, type GameId } from "@/lib/games/game-types";

export interface GameBest {
  score: number;
  cleared: number;
  bestCombo: number;
  survivedMs: number;
  achievedAt: number;
  variant?: string;
  wpm?: number | null;
  accuracy?: number | null;
}

export type GameRun = Omit<GameBest, "achievedAt">;

/** These are client-reported measurements, not verified gameplay evidence. */
export interface GameScorePayload {
  runId: string;
  ownerId: string;
  gameId: GameId;
  variant: string;
  score: number;
  cleared: number;
  bestCombo: number;
  survivedMs: number;
  wpm: number | null;
  accuracy: number | null;
}

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const isGameId = (value: unknown): value is GameId =>
  typeof value === "string" && Object.hasOwn(GAME_DEFINITIONS, value);

export const isMetric = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER;

export function isGameVariant(value: unknown): value is string {
  return typeof value === "string" && (value === "" || (value.length <= 96 && /^[a-z0-9]+(?:[:-][a-z0-9]+)*$/.test(value)));
}

/** Round actual elapsed milliseconds once; never invent a minimum play time. */
export function normalizeGameDuration(value: unknown): number {
  if (!isMetric(value)) throw new Error("survivedMs must be a finite, non-negative duration");
  return Math.round(value);
}

export function normalizeGameRun(run: GameRun): GameRun {
  for (const field of ["score", "cleared", "bestCombo"] as const) {
    if (!isMetric(run[field]) || !Number.isSafeInteger(run[field])) throw new Error(`${field} must be a non-negative safe integer`);
  }
  if (!isGameVariant(run.variant ?? "")) throw new Error("Invalid game variant");
  if (run.wpm != null && !isMetric(run.wpm)) throw new Error("wpm must be a finite non-negative number");
  if (run.accuracy != null && (!isMetric(run.accuracy) || run.accuracy > 100)) throw new Error("accuracy must be between 0 and 100");
  return {
    score: run.score, cleared: run.cleared, bestCombo: run.bestCombo,
    survivedMs: normalizeGameDuration(run.survivedMs),
    ...(run.variant ? { variant: run.variant } : {}),
    ...(run.wpm != null ? { wpm: run.wpm } : {}),
    ...(run.accuracy != null ? { accuracy: run.accuracy } : {}),
  };
}

export function parseGameScorePayload(value: unknown): GameScorePayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Payload must be a non-null object");
  const p = value as Record<string, unknown>;
  if (!isUuid(p.runId)) throw new Error("runId must be a valid UUID");
  if (!isUuid(p.ownerId)) throw new Error("ownerId must identify the account that started this run");
  if (!isGameId(p.gameId)) throw new Error("Invalid or unknown gameId");
  const normalized = normalizeGameRun(p as unknown as GameRun);
  return { ...normalized, runId: p.runId, ownerId: p.ownerId, gameId: p.gameId,
    variant: normalized.variant ?? "", wpm: normalized.wpm ?? null, accuracy: normalized.accuracy ?? null };
}

export function parseGameBest(raw: string | null): GameBest | null {
  if (!raw || raw.length > 4096) return null;
  try {
    const parsed = JSON.parse(raw) as GameBest;
    if (!parsed || !isMetric(parsed.achievedAt)) return null;
    return { ...normalizeGameRun(parsed), achievedAt: parsed.achievedAt };
  } catch { return null; }
}

export interface CloudGameRecord {
  id: string;
  user_id: string;
  game_id: GameId;
  variant: string;
  score: number;
  cleared: number;
  best_combo: number;
  survived_ms: number;
  wpm: number | null;
  accuracy: number | null;
  created_at: string;
}

export function parseCloudGameRecord(value: unknown, ownerId: string): CloudGameRecord {
  if (!value || typeof value !== "object") throw new Error("Missing saved game record");
  const source = value as CloudGameRecord;
  // Older rows allow nullable optional counters. Preserve their records while
  // keeping newly acknowledged payloads subject to exact-value comparisons.
  const row: CloudGameRecord = { ...source, cleared: source.cleared ?? 0,
    best_combo: source.best_combo ?? 0, survived_ms: source.survived_ms ?? 0 };
  if (!isUuid(row.id) || row.user_id !== ownerId || !isGameId(row.game_id) || !isGameVariant(row.variant) ||
      typeof row.created_at !== "string" || !isMetric(Date.parse(row.created_at))) throw new Error("Invalid saved game record");
  normalizeGameRun({ score: row.score, cleared: row.cleared, bestCombo: row.best_combo, survivedMs: row.survived_ms,
    variant: row.variant, wpm: row.wpm, accuracy: row.accuracy });
  if (!Number.isSafeInteger(row.survived_ms)) throw new Error("Invalid saved duration");
  return row;
}

export function cloudRecordToBest(row: CloudGameRecord): GameBest {
  return { score: row.score, cleared: row.cleared, bestCombo: row.best_combo, survivedMs: row.survived_ms,
    achievedAt: Date.parse(row.created_at), ...(row.variant ? { variant: row.variant } : {}), wpm: row.wpm, accuracy: row.accuracy };
}

export interface GameAcknowledgement {
  record: CloudGameRecord;
  best: CloudGameRecord;
  totalXp: number;
  earnedXp: number;
  isNewBest: boolean;
  idempotent: boolean;
}

export function parseGameAcknowledgement(value: unknown, payload: GameScorePayload): GameAcknowledgement {
  if (!value || typeof value !== "object") throw new Error("Missing save acknowledgement");
  const ack = value as Record<string, unknown>;
  const record = parseCloudGameRecord(ack.record, payload.ownerId);
  const best = parseCloudGameRecord(ack.best, payload.ownerId);
  if (record.id !== payload.runId || record.game_id !== payload.gameId || record.variant !== payload.variant ||
      record.score !== payload.score || record.cleared !== payload.cleared || record.best_combo !== payload.bestCombo || record.survived_ms !== payload.survivedMs ||
      record.wpm !== payload.wpm || record.accuracy !== payload.accuracy || best.game_id !== payload.gameId || best.variant !== payload.variant || best.score < record.score ||
      !isMetric(ack.totalXp) || !Number.isSafeInteger(ack.totalXp) || !isMetric(ack.earnedXp) || !Number.isSafeInteger(ack.earnedXp) ||
      typeof ack.idempotent !== "boolean" || typeof ack.isNewBest !== "boolean" || (ack.idempotent && (ack.earnedXp !== 0 || ack.isNewBest))) {
    throw new Error("Save acknowledgement did not match this run");
  }
  return { record, best, totalXp: ack.totalXp, earnedXp: ack.earnedXp, isNewBest: ack.isNewBest, idempotent: ack.idempotent };
}

export async function readGameApiResponse(response: Response): Promise<unknown> {
  let json: { success?: unknown; data?: unknown; error?: { message?: unknown } };
  try { json = await response.json(); }
  catch { throw new Error(`Game save service returned invalid JSON (HTTP ${response.status})`); }
  if (!response.ok || json?.success !== true) {
    const message = typeof json?.error?.message === "string" ? json.error.message.slice(0, 240) : `Game request failed (HTTP ${response.status})`;
    throw new Error(message);
  }
  return json.data;
}
