import { COMBO_WINDOW_MS, FEVER_DURATION_MS, FROZEN_DURATION_MS, FRUIT_CONFIGS } from "@/lib/games/fruit-fury/fruit-fury-types";
import { CHUNK_SIZE, deriveFruitSequence, generateSecureToken, createRunState, getActiveRunState, atomicUpdateRunState } from "@/lib/server/fruit-fury-state";

export interface FruitFuryEvent {
  t: number;
  type: "slice" | "miss" | "bomb" | "drop";
  fruitType?: string;
}

export async function startFruitFuryRun(userId?: string) {
  return createRunState(userId);
}

export async function advanceFruitFuryChunk(runId: string, token: string, evidenceEvents: FruitFuryEvent[]) {
  // Load state and strictly authenticate the current token
  const state = await getActiveRunState(runId, token);
  const originalHash = state.expected_token_hash;

  if (!Array.isArray(evidenceEvents) || evidenceEvents.length > CHUNK_SIZE) {
     throw new Error("Invalid evidence payload");
  }

  const expectedFruits = deriveFruitSequence(state.master_seed, CHUNK_SIZE, state.current_chunk * CHUNK_SIZE);
  let fruitIndex = 0;
  
  for (const event of evidenceEvents) {
    if (state.lives <= 0) break;
    
    // Time validation
    if (typeof event.t !== "number" || event.t < state.survived_ms) throw new Error("Invalid event ordering");
    if (event.t - state.survived_ms > 60000) throw new Error("Impossible time jump");
    
    const deltaMs = event.t - state.survived_ms;
    state.survived_ms = event.t;
    
    state.fever_time_remaining = Math.max(0, state.fever_time_remaining - deltaMs);
    state.frozen_time_remaining = Math.max(0, state.frozen_time_remaining - deltaMs);
    state.is_fever_active = state.is_fever_active && state.fever_time_remaining > 0;
    state.is_frozen_active = state.is_frozen_active && state.frozen_time_remaining > 0;
    
    if (deltaMs > 0 && state.survived_ms - state.last_slice_time >= COMBO_WINDOW_MS) {
      state.combo = 0;
    }

    if (event.type === "slice") {
      if (!event.fruitType) throw new Error("Invalid fruit type");
      
      if (event.fruitType !== "bomb") {
        if (fruitIndex >= expectedFruits.length) throw new Error("Oversized transcript");
        const expected = expectedFruits[fruitIndex++];
        if (event.fruitType !== expected) {
          throw new Error(`Transcript forgery detected: expected ${expected}, got ${event.fruitType}`);
        }
      }
      
      // Calculate points
      const lowerType = event.fruitType.toLowerCase();
      const fruitConfig = Object.values(FRUIT_CONFIGS).find(c => c.type.toLowerCase() === lowerType);
      const baseScore = fruitConfig?.baseScore || 0;
      
      state.combo = state.combo > 0 && state.survived_ms - state.last_slice_time < COMBO_WINDOW_MS ? state.combo + 1 : 1;
      state.max_combo = Math.max(state.max_combo, state.combo);
      state.last_slice_time = state.survived_ms;
      
      const comboMultiplier = state.combo >= 10 ? 3 : state.combo >= 5 ? 2 : state.combo >= 3 ? 1.5 : 1;
      const points = Math.round(baseScore * comboMultiplier * (state.is_fever_active ? 2 : 1)) + (event.fruitType === "golden" ? 400 : 0);
      state.score += points;
      state.cleared += 1;
      
      state.fever_gauge = Math.min(100, state.fever_gauge + (event.fruitType === "golden" ? 25 : event.fruitType === "frozen" ? 0 : 6.5));
      if (state.fever_gauge >= 100 && !state.is_fever_active) {
        state.is_fever_active = true;
        state.fever_time_remaining = FEVER_DURATION_MS;
      }
      
      if (event.fruitType === "frozen") {
        state.is_frozen_active = true;
        state.frozen_time_remaining = FROZEN_DURATION_MS;
      }
    } else if (event.type === "drop" || event.type === "miss") {
      state.combo = 0;
      if (event.type === "drop") state.lives--;
      if (event.type === "miss") fruitIndex++; 
    } else if (event.type === "bomb") {
      state.combo = 0;
      state.lives = 0; 
    }
  }

  if (state.lives <= 0) {
    state.status = "completed";
    const success = await atomicUpdateRunState(originalHash, state, null);
    if (!success) throw new Error("Concurrent modification detected (run consumed)");
    
    return {
      status: "game_over",
      chunkIndex: state.current_chunk,
      fruits: [],
      token: "",
      stats: { score: state.score, combo: state.max_combo, lives: state.lives }
    };
  }

  state.current_chunk++;
  state.last_chunk_issued_at = new Date().toISOString();
  
  const newToken = generateSecureToken();
  const success = await atomicUpdateRunState(originalHash, state, newToken);
  if (!success) throw new Error("Concurrent modification detected (run consumed)");
  
  return {
    status: "active",
    chunkIndex: state.current_chunk,
    fruits: deriveFruitSequence(state.master_seed, CHUNK_SIZE, state.current_chunk * CHUNK_SIZE),
    token: newToken,
    stats: { score: state.score, combo: state.max_combo, lives: state.lives }
  };
}

export async function getFinalRunStats(runId: string, finalToken: string): Promise<{ score: number; cleared: number; bestCombo: number; survivedMs: number }> {
  // To finalize a run securely, the client must hold the current token!
  // It shouldn't be arbitrary finalizing.
  const state = await getActiveRunState(runId, finalToken);
  
  // Close it atomically
  state.status = "completed";
  const success = await atomicUpdateRunState(state.expected_token_hash, state, null);
  if (!success) throw new Error("Concurrent modification detected (already closed)");
  
  return {
    score: state.score,
    cleared: state.cleared,
    bestCombo: state.max_combo,
    survivedMs: Math.round(state.survived_ms)
  };
}

// Block old signature
export function evaluateFruitFuryRun(evidence: unknown, serverSeed?: string) {
  throw new Error("LEGACY OFFLINE EVALUATOR HAS BEEN REMOVED TO PREVENT FABRICATION ATTACKS.");
}
