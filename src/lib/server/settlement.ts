import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type SettlementStage =
  | "received"
  | "primary_saved"
  | "aggregate_saved"
  | "rewards_saved"
  | "complete";

export interface SettlementReceipt {
  runId: string;
  userId: string;
  eventType: "typing_test" | "lesson_progress";
  stage: SettlementStage;
  earnedXp: number;
  createdAt: number;
  updatedAt: number;
}

export class RunConflictError extends Error {
  readonly status = 409;
  constructor(message = "Run ID conflicts with an existing result") {
    super(message);
    this.name = "RunConflictError";
  }
}

// In-memory settlement receipt registry for resilient recovery across multi-stage settlement
const memoryReceipts = new Map<string, SettlementReceipt>();
const MAX_MEMORY_RECEIPTS = 10_000;

function pruneMemoryReceiptsIfNecessary() {
  if (memoryReceipts.size > MAX_MEMORY_RECEIPTS) {
    const oldestAllowed = Date.now() - 24 * 60 * 60 * 1000;
    for (const [key, receipt] of memoryReceipts.entries()) {
      if (receipt.updatedAt < oldestAllowed) {
        memoryReceipts.delete(key);
      }
    }
  }
}

interface SettlementDbRow {
  run_id: string;
  user_id: string;
  event_type: "typing_test" | "lesson_progress";
  stage: SettlementStage;
  earned_xp?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface SupabaseWithReceipts {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: unknown) => {
        eq: (col: string, val: unknown) => {
          eq: (col: string, val: unknown) => {
            maybeSingle: () => Promise<{ data: SettlementDbRow | null; error: unknown }>;
          };
          maybeSingle: () => Promise<{ data: SettlementDbRow | null; error: unknown }>;
        };
      };
    };
    upsert: (values: SettlementDbRow, options?: { onConflict?: string }) => Promise<{ data: unknown; error: unknown }>;
  };
}

export function _clearMemoryReceiptsForTesting(): void {
  memoryReceipts.clear();
}

export async function getSettlementReceipt(
  userId: string,
  runId: string,
  eventType: "typing_test" | "lesson_progress"
): Promise<SettlementReceipt | null> {
  const memKey = `${userId}:${eventType}:${runId}`;
  const fromMem = memoryReceipts.get(memKey);
  if (fromMem) return fromMem;

  try {
    const supabase = createAdminClient();
    const dbClient = supabase as unknown as SupabaseWithReceipts;
    const { data, error } = await dbClient
      .from("settlement_receipts")
      .select("*")
      .eq("user_id", userId)
      .eq("run_id", runId)
      .eq("event_type", eventType)
      .maybeSingle();

    if (!error && data) {
      const receipt: SettlementReceipt = {
        runId: data.run_id,
        userId: data.user_id,
        eventType: data.event_type || eventType,
        stage: data.stage,
        earnedXp: Number(data.earned_xp ?? 0),
        createdAt: data.created_at ? Date.parse(data.created_at) : Date.now(),
        updatedAt: data.updated_at ? Date.parse(data.updated_at) : Date.now(),
      };
      memoryReceipts.set(memKey, receipt);
      return receipt;
    }
  } catch {
    // If settlement_receipts table is not yet in the DB, ignore and rely on memory
  }

  return null;
}

export async function updateSettlementReceipt(
  receipt: SettlementReceipt
): Promise<void> {
  receipt.updatedAt = Date.now();
  const memKey = `${receipt.userId}:${receipt.eventType}:${receipt.runId}`;
  memoryReceipts.set(memKey, receipt);
  pruneMemoryReceiptsIfNecessary();

  try {
    const supabase = createAdminClient();
    const dbClient = supabase as unknown as SupabaseWithReceipts;
    await dbClient.from("settlement_receipts").upsert(
      {
        user_id: receipt.userId,
        event_type: receipt.eventType,
        run_id: receipt.runId,
        stage: receipt.stage,
        earned_xp: receipt.earnedXp,
        updated_at: new Date(receipt.updatedAt).toISOString(),
      },
      { onConflict: "user_id,event_type,run_id" }
    );
  } catch {
    // Non-fatal if table not installed yet
  }
}

/**
 * Checks for conflicting reuse of the same run ID in typing results.
 * Throws RunConflictError if payload differs from the already stored run.
 */
export function assertTypingPayloadMatch(
  existing: {
    user_id: string;
    mode: string;
    duration: number;
    wpm: number;
    correct_chars: number;
    incorrect_chars: number;
  },
  incoming: {
    userId: string;
    mode: string;
    duration: number;
    wpm: number;
    correctChars: number;
    incorrectChars: number;
  }
): void {
  if (existing.user_id !== incoming.userId) {
    throw new RunConflictError("Run ID belongs to another user account");
  }
  if (
    existing.mode !== incoming.mode ||
    Math.abs(existing.duration - incoming.duration) > 0.1 ||
    existing.correct_chars !== incoming.correctChars ||
    existing.incorrect_chars !== incoming.incorrectChars ||
    Math.abs(existing.wpm - incoming.wpm) > 2.5
  ) {
    throw new RunConflictError("Run ID conflicts with an existing result with different metrics");
  }
}

/**
 * Checks for conflicting reuse of the same run ID in lesson attempts.
 * Throws RunConflictError if payload differs from the already stored attempt.
 */
export function assertLessonPayloadMatch(
  existing: {
    user_id: string;
    lesson_id: string;
    wpm: number;
    accuracy: number;
  },
  incoming: {
    userId: string;
    lessonId: string;
    wpm: number;
    accuracy: number;
  }
): void {
  if (existing.user_id !== incoming.userId) {
    throw new RunConflictError("Run ID belongs to another user account");
  }
  if (
    existing.lesson_id !== incoming.lessonId ||
    Math.abs(existing.wpm - incoming.wpm) > 2.5 ||
    Math.abs(existing.accuracy - incoming.accuracy) > 2.0
  ) {
    throw new RunConflictError("Run ID conflicts with an existing lesson attempt with different metrics");
  }
}
