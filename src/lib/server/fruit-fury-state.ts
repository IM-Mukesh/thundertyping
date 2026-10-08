import { randomUUID, randomBytes, createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRng } from "@/lib/lessons/content-generator";

export interface FruitFuryRunState {
  run_id: string;
  user_id: string | null;
  master_seed: string;
  current_chunk: number;
  expected_token_hash: string;
  score: number;
  combo: number;
  max_combo: number;
  cleared: number;
  lives: number;
  survived_ms: number;
  fever_gauge: number;
  is_fever_active: boolean;
  fever_time_remaining: number;
  is_frozen_active: boolean;
  frozen_time_remaining: number;
  last_slice_time: number;
  status: "active" | "completed" | "expired";
  updated_at?: string;
  created_at: string;
  last_chunk_issued_at: string;
}

export const CHUNK_SIZE = 15;

export function deriveFruitSequence(seed: string, count: number, offset: number): string[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  const rng = createRng(h);
  for(let i=0; i<offset; i++) rng(); 

  const sequence: string[] = [];
  const pool = ["apple", "banana", "orange", "watermelon", "kiwi", "strawberry", "dragonfruit"];
  
  for (let i = 0; i < count; i++) {
    const r = rng();
    if (r < 0.05) sequence.push("golden");
    else if (r < 0.1) sequence.push("frozen");
    else if (r < 0.25) sequence.push("bomb");
    else sequence.push(pool[Math.floor(rng() * 7)]!);
  }
  return sequence;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

// Global toggle for test environment where docker/postgres is unavailable
export const TEST_MODE_STORE = {
  enabled: process.env.NODE_ENV === "test",
  runs: new Map<string, FruitFuryRunState>()
};

export async function createRunState(userId?: string): Promise<{ runId: string; chunkIndex: number; fruits: string[]; token: string }> {
  const runId = randomUUID();
  const masterSeed = randomUUID();
  const token = generateSecureToken();
  const tokenHash = hashToken(token);
  const now = new Date().toISOString();

  const state: FruitFuryRunState = {
    run_id: runId, user_id: userId || null, master_seed: masterSeed, current_chunk: 0,
    expected_token_hash: tokenHash, score: 0, combo: 0, max_combo: 0, cleared: 0, lives: 3,
    survived_ms: 0, fever_gauge: 0, is_fever_active: false, fever_time_remaining: 0,
    is_frozen_active: false, frozen_time_remaining: 0, last_slice_time: 0,
    status: "active", created_at: now, last_chunk_issued_at: now
  };

  if (TEST_MODE_STORE.enabled) {
    TEST_MODE_STORE.runs.set(runId, { ...state });
  } else {
    const supabase = createAdminClient();
    const { error } = await supabase.from("fruit_fury_runs").insert([state] as unknown as any /* eslint-disable-line @typescript-eslint/no-explicit-any */);
    if (error) throw new Error("Failed to initialize run state");
  }

  return {
    runId,
    chunkIndex: 0,
    fruits: deriveFruitSequence(masterSeed, CHUNK_SIZE, 0),
    token
  };
}

export async function getActiveRunState(runId: string, providedToken: string): Promise<FruitFuryRunState> {
  const expectedHash = hashToken(providedToken);
  
  if (TEST_MODE_STORE.enabled) {
    const state = TEST_MODE_STORE.runs.get(runId);
    if (!state || state.status !== "active" || state.expected_token_hash !== expectedHash) {
      throw new Error("Invalid or replayed token");
    }
    return { ...state };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("fruit_fury_runs" as /* eslint-disable-line @typescript-eslint/no-explicit-any */ any)
    .select("*")
    .eq("run_id", runId)
    .eq("expected_token_hash", expectedHash)
    .eq("status", "active")
    .single();

  if (error || !data) throw new Error("Invalid or replayed token");
  return data as unknown as FruitFuryRunState;
}

export async function atomicUpdateRunState(
  originalHash: string,
  newState: FruitFuryRunState,
  newToken: string | null
): Promise<boolean> {
  const nextHash = newToken ? hashToken(newToken) : newState.expected_token_hash;
  newState.expected_token_hash = nextHash;
  newState.updated_at = new Date().toISOString();

  if (TEST_MODE_STORE.enabled) {
    const current = TEST_MODE_STORE.runs.get(newState.run_id);
    if (!current || current.expected_token_hash !== originalHash || current.status !== "active") {
      return false; // OCC failed
    }
    TEST_MODE_STORE.runs.set(newState.run_id, { ...newState });
    return true;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("fruit_fury_runs" as /* eslint-disable-line @typescript-eslint/no-explicit-any */ any)
    .update(newState)
    .eq("run_id", newState.run_id)
    .eq("expected_token_hash", originalHash)
    .eq("status", "active")
    .select("run_id");

  if (error) throw error;
  return data && data.length > 0;
}
