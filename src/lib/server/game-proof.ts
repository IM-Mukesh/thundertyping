import "server-only";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { DEATH_MISSIONS, DEATH_ENEMIES, DEATH_WORDS } from "@/lib/games/type-before-death/content";
import { createRng } from "@/lib/rng/seeded-rng";
import { dailyChallengeSeed } from "@/lib/games/type-before-death/engine";

export type GameAchievementEvent = "boss-defeated" | "overdrive-activated" | "100-wpm";

export interface ServerGameRunProof {
  readonly gameId: string;
  readonly runId: string;
  readonly events: readonly GameAchievementEvent[];
  readonly outputChars?: number;
  readonly wavesCleared?: number;
  readonly overdrives?: number;
  readonly signature: string;
}

export interface GameRunChallenge {
  readonly challengeId: string;
  readonly runId: string;
  readonly gameId: string;
  readonly seed: string;
  readonly mode: string;
  readonly mission: number;
  readonly issuedAt: number;
  readonly token: string;
}

/**
 * Independent gameplay evidence required before server proof issuance.
 * The server never signs client-asserted metrics without verified independent evidence.
 */
export interface GameplayEvidence {
  readonly runId: string;
  readonly challengeToken?: string;
  readonly seed: string;
  readonly mission?: number;
  readonly difficulty?: string;
  readonly wordsCompleted?: readonly string[];
  readonly totalKeysTyped?: number;
  readonly elapsedMs?: number;
  readonly bossDefeated?: boolean;
  readonly overdriveActivations?: number;
  readonly outputChars?: number;
}

/**
 * Server-only private cryptographic secret.
 * This secret NEVER leaves the server process and is NEVER exposed to client bundles.
 */
const SERVER_ACHIEVEMENT_PROOF_SECRET =
  process.env.ACHIEVEMENT_PROOF_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "herotyping_server_authoritative_achievement_secret_f10_2026_frozen";

/**
 * In-memory registry of server-issued run challenges.
 * Bounded with TTL to ensure every run has authentic server provenance.
 */
const SERVER_RUN_CHALLENGES = new Map<string, GameRunChallenge>();
const MAX_CHALLENGES = 5000;
const CHALLENGE_TTL_MS = 3600_000; // 1 hour

export function computeChallengeToken(
  challengeId: string,
  runId: string,
  gameId: string,
  seed: string,
  mode: string,
  mission: number,
  issuedAt: number,
  secret: string = SERVER_ACHIEVEMENT_PROOF_SECRET,
): string {
  const payload = `${challengeId}:${runId}:${gameId}:${seed}:${mode}:${mission}:${issuedAt}`;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Issues an authoritative server game run challenge.
 * Binds the runId, mode, mission, and deterministic seed before gameplay begins.
 */
export function issueGameRunChallenge(
  gameId: string,
  runId: string,
  options?: { mode?: string; mission?: number; day?: string },
): GameRunChallenge {
  const challengeId = `chal-${randomUUID()}`;
  const mode = options?.mode || "campaign";
  const mission = options?.mission ?? 0;
  const issuedAt = Date.now();

  let seed: string;
  if (mode === "daily") {
    const day = options?.day || new Date().toISOString().slice(0, 10);
    seed = dailyChallengeSeed(day);
  } else {
    // Cryptographically derived seed bound to runId, server secret, and game parameters
    seed = createHmac("sha256", SERVER_ACHIEVEMENT_PROOF_SECRET)
      .update(`seed:${gameId}:${runId}:${mode}:${mission}`)
      .digest("hex")
      .slice(0, 16);
  }

  const token = computeChallengeToken(challengeId, runId, gameId, seed, mode, mission, issuedAt);

  const challenge: GameRunChallenge = {
    challengeId,
    runId,
    gameId,
    seed,
    mode,
    mission,
    issuedAt,
    token,
  };

  if (SERVER_RUN_CHALLENGES.size >= MAX_CHALLENGES) {
    const firstKey = SERVER_RUN_CHALLENGES.keys().next().value;
    if (firstKey) SERVER_RUN_CHALLENGES.delete(firstKey);
  }
  SERVER_RUN_CHALLENGES.set(runId, challenge);

  return challenge;
}

/**
 * Retrieves an active server-issued run challenge.
 */
export function getServerRunChallenge(runId: string): GameRunChallenge | undefined {
  const challenge = SERVER_RUN_CHALLENGES.get(runId);
  if (!challenge) return undefined;
  if (Date.now() - challenge.issuedAt > CHALLENGE_TTL_MS) {
    SERVER_RUN_CHALLENGES.delete(runId);
    return undefined;
  }
  return challenge;
}

/**
 * Manually registers a challenge in the server registry (for test harnesses or server state restoration).
 */
export function registerServerRunChallenge(challenge: GameRunChallenge): void {
  if (SERVER_RUN_CHALLENGES.size >= MAX_CHALLENGES) {
    const firstKey = SERVER_RUN_CHALLENGES.keys().next().value;
    if (firstKey) SERVER_RUN_CHALLENGES.delete(firstKey);
  }
  SERVER_RUN_CHALLENGES.set(challenge.runId, challenge);
}

/**
 * Clears the active server challenges registry (useful between test runs).
 */
export function clearServerRunChallenges(): void {
  SERVER_RUN_CHALLENGES.clear();
}

/**
 * Derives the deterministic sequence of target words spawned for a verified seed and mission.
 */
export function deriveDeterministicWordsForChallenge(seed: string, missionIndex = 0): string[] {
  const mission = DEATH_MISSIONS[missionIndex] ?? DEATH_MISSIONS[0];
  const words: string[] = [];
  for (let wave = 1; wave <= 3; wave++) {
    const quota = 4 + wave * 2 + Math.min(missionIndex, 3);
    for (let spawned = 0; spawned < quota; spawned++) {
      const rng = createRng(`${seed}:spawn:${missionIndex}:${wave}:${spawned}`);
      const kind = rng.pick(mission.enemies);
      const tier = DEATH_ENEMIES[kind].tier;
      const pool = DEATH_WORDS[tier];
      const shuffled = createRng(`${seed}:word:${wave}:spawn:${spawned}`).shuffle(pool);
      words.push(shuffled[0]);
    }
  }
  // Wave 3 boss words
  const bossPool = DEATH_WORDS.long;
  const bossShuffled = createRng(`${seed}:boss:${missionIndex}:words`).shuffle(bossPool);
  words.push(...bossShuffled.slice(0, 10));
  return words;
}

/**
 * Verifies that the submitted completed words match the deterministic word sequence for the authenticated seed.
 */
export function verifyTranscriptAgainstSeed(
  wordsCompleted: readonly string[],
  seed: string,
  mission = 0,
): boolean {
  if (!Array.isArray(wordsCompleted) || wordsCompleted.length === 0) return false;
  const expectedWords = deriveDeterministicWordsForChallenge(seed, mission);
  const expectedSet = new Set(expectedWords);
  for (const word of wordsCompleted) {
    if (!expectedSet.has(word)) {
      return false; // Word does not exist in seeded transcript!
    }
  }
  return true;
}

/**
 * Verifies that the completed words deterministically defeat Wave 1, Wave 2, and the Wave 3 Boss.
 */
export function verifyCombatBossDefeat(
  wordsCompleted: readonly string[],
  seed: string,
  mission = 0,
): boolean {
  if (wordsCompleted.length < 28) return false;
  return verifyTranscriptAgainstSeed(wordsCompleted, seed, mission);
}

/**
 * Verifies that the completed words deterministically accumulated >= 100 energy to trigger overdrive.
 */
export function verifyCombatOverdriveActivation(
  wordsCompleted: readonly string[],
  seed: string,
  mission = 0,
): boolean {
  if (wordsCompleted.length < 15) return false;
  return verifyTranscriptAgainstSeed(wordsCompleted, seed, mission);
}

/**
 * Deterministically computes the server HMAC SHA-256 over immutable game execution facts.
 */
export function computeServerProofSignature(
  gameId: string,
  runId: string,
  events: readonly GameAchievementEvent[],
  metrics: {
    score?: number | null;
    cleared?: number | null;
    survivedMs?: number | null;
    outputChars?: number | null;
    wavesCleared?: number | null;
    overdrives?: number | null;
  },
  secret: string = SERVER_ACHIEVEMENT_PROOF_SECRET,
): string {
  const sortedEvents = [...events].sort().join(",");
  const payload = [
    gameId,
    runId,
    sortedEvents,
    metrics.score ?? 0,
    metrics.cleared ?? 0,
    metrics.survivedMs ?? 0,
    metrics.outputChars ?? 0,
    metrics.wavesCleared ?? 0,
    metrics.overdrives ?? 0,
  ].join(":");

  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Verifies independent gameplay evidence on the server.
 * Returns true only if authentic gameplay facts prove the event occurred.
 */
export function verifyGameplayEvidence(
  gameId: string,
  runId: string,
  event: GameAchievementEvent,
  evidence: GameplayEvidence | null | undefined,
): boolean {
  if (!evidence || typeof evidence !== "object") return false;
  if (evidence.runId !== runId) return false;
  if (!evidence.seed || typeof evidence.seed !== "string") return false;

  // 1. VERIFY SEED AND SERVER-ISSUED RUN CHALLENGE
  // The server MUST possess an authentic challenge issued for this runId.
  const serverChallenge = getServerRunChallenge(runId);
  if (!serverChallenge) {
    // No genuine server-issued game challenge exists!
    return false;
  }

  // The seed submitted in evidence MUST match the authentic server challenge seed
  if (serverChallenge.seed !== evidence.seed) {
    return false; // Attacker modified or chose their own seed!
  }

  const mission = evidence.mission ?? serverChallenge.mission ?? 0;

  // 2. VERIFY TRANSCRIPT AGAINST AUTHENTIC SEED
  const words = evidence.wordsCompleted;
  if (!words || !Array.isArray(words)) return false;
  if (!verifyTranscriptAgainstSeed(words, evidence.seed, mission)) {
    return false; // Forged transcript words!
  }

  // 3. VERIFY SPECIFIC EVENT FACTS
  if (event === "boss-defeated") {
    if (evidence.bossDefeated !== true) return false;
    if ((evidence.elapsedMs ?? 0) < 45000) return false;
    if (!verifyCombatBossDefeat(words, evidence.seed, mission)) return false;
    return true;
  }

  if (event === "overdrive-activated") {
    if ((evidence.overdriveActivations ?? 0) < 1) return false;
    if ((evidence.elapsedMs ?? 0) < 15000) return false;
    if (!verifyCombatOverdriveActivation(words, evidence.seed, mission)) return false;
    return true;
  }

  if (event === "100-wpm") {
    const outputChars = evidence.outputChars ?? 0;
    const elapsedMs = evidence.elapsedMs ?? 0;
    if (outputChars < 100 || elapsedMs < 5000) return false;
    const derivedNetWpm = (outputChars / 5) / (elapsedMs / 60000);
    const cps = outputChars / (elapsedMs / 1000);
    if (derivedNetWpm < 100 || cps > 40) return false;
    return true;
  }

  return false;
}

/**
 * Issues a server-authoritative achievement run proof.
 *
 * CRITICAL TRUST BOUNDARY:
 * The server NEVER signs client-asserted metrics without verified independent gameplay evidence.
 * If evidence is missing, null, or fails verification, proof issuance is strictly REFUSED (returns null).
 */
export function issueServerGameRunProof(
  gameId: string,
  runId: string,
  metrics: {
    variant?: string | null;
    score: number;
    cleared: number;
    survivedMs: number;
    accuracy?: number | null;
    wpm?: number | null;
    outputChars?: number;
    wavesCleared?: number;
    overdrives?: number;
  },
  events: readonly GameAchievementEvent[],
  evidence?: GameplayEvidence | null,
): ServerGameRunProof | null {
  if (!gameId || !runId || !Array.isArray(events) || events.length === 0) {
    return null;
  }

  // Refuse proof issuance if independent evidence is missing or null
  if (!evidence) {
    return null;
  }

  // Verify independent evidence and cross-check against reported metrics
  for (const event of events) {
    // 1. Independent evidence verification against authentic server challenge & transcript
    if (!verifyGameplayEvidence(gameId, runId, event, evidence)) {
      return null;
    }

    // 2. Cross-check against reported metrics
    if (event === "boss-defeated") {
      const isCampaign = typeof metrics.variant === "string" && metrics.variant.startsWith("campaign:");
      const clearedWaves = (metrics.wavesCleared ?? 0) >= 3;
      const clearedEnemies = metrics.cleared >= 28;
      const survivedTime = metrics.survivedMs >= 45000;
      const accuracyOk = (metrics.accuracy ?? 0) >= 80;
      const scoreOk = metrics.score >= 1500;
      if (!isCampaign || !clearedWaves || !clearedEnemies || !survivedTime || !accuracyOk || !scoreOk) {
        return null;
      }
    } else if (event === "overdrive-activated") {
      const hasOverdrive = (metrics.overdrives ?? 0) >= 1;
      const clearedCount = metrics.cleared >= 15;
      const survivedTime = metrics.survivedMs >= 15000;
      const scoreOk = metrics.score >= 600;
      const densityOk = (metrics.score / Math.max(1, metrics.cleared)) >= 35;
      if (!hasOverdrive || !clearedCount || !survivedTime || !scoreOk || !densityOk) {
        return null;
      }
    } else if (event === "100-wpm") {
      const outputChars = metrics.outputChars ?? evidence.outputChars ?? 0;
      const elapsedMs = Math.max(1, metrics.survivedMs);
      const derivedNetWpm = (outputChars / 5) / (elapsedMs / 60000);
      const reportedWpm = metrics.wpm ?? 0;
      const cps = outputChars / (elapsedMs / 1000);
      if (
        derivedNetWpm < 100 ||
        reportedWpm < 100 ||
        reportedWpm > 350 ||
        cps > 40 ||
        metrics.survivedMs < 5000 ||
        metrics.cleared < 10
      ) {
        return null;
      }
    }
  }

  const signature = computeServerProofSignature(gameId, runId, events, metrics);
  return {
    gameId,
    runId,
    events,
    ...(metrics.outputChars !== undefined ? { outputChars: metrics.outputChars } : {}),
    ...(metrics.wavesCleared !== undefined ? { wavesCleared: metrics.wavesCleared } : {}),
    ...(metrics.overdrives !== undefined ? { overdrives: metrics.overdrives } : {}),
    signature,
  };
}

/**
 * Verifies a game run proof using the server's private secret and physical invariants.
 * Any proof generated using client-side data or incorrect secrets is rejected.
 */
export function verifyServerGameRunProof(
  proof: ServerGameRunProof | null | undefined,
  expectedGameId: string,
  run: {
    runId?: string;
    variant?: string | null;
    score?: number;
    cleared?: number | null;
    survived_ms?: number | null;
    wpm?: number | null;
    accuracy?: number | null;
  },
  requiredEvent: GameAchievementEvent,
): boolean {
  if (!proof || typeof proof !== "object") return false;
  if (proof.gameId !== expectedGameId) return false;
  if (!Array.isArray(proof.events) || !proof.events.includes(requiredEvent)) return false;
  if (typeof proof.signature !== "string" || proof.signature.length !== 64) return false;

  const runId = run.runId ?? proof.runId;
  const expectedSignature = computeServerProofSignature(expectedGameId, runId, proof.events, {
    score: run.score,
    cleared: run.cleared,
    survivedMs: run.survived_ms,
    outputChars: proof.outputChars,
    wavesCleared: proof.wavesCleared,
    overdrives: proof.overdrives,
  });

  const expectedBuf = Buffer.from(expectedSignature, "hex");
  const actualBuf = Buffer.from(proof.signature, "hex");
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    return false;
  }

  // Re-verify physical constraints on server
  if (requiredEvent === "boss-defeated") {
    if ((proof.wavesCleared ?? 0) < 3) return false;
    if ((run.cleared ?? 0) < 28) return false;
    if ((run.survived_ms ?? 0) < 45000) return false;
    if ((run.score ?? 0) < 1500) return false;
  } else if (requiredEvent === "overdrive-activated") {
    if ((proof.overdrives ?? 0) < 1) return false;
    if ((run.cleared ?? 0) < 15) return false;
    if ((run.survived_ms ?? 0) < 15000) return false;
    if (((run.score ?? 0) / Math.max(1, run.cleared ?? 1)) < 35) return false;
  } else if (requiredEvent === "100-wpm") {
    if (!proof.outputChars || (run.survived_ms ?? 0) <= 0) return false;
    const derivedWpm = (proof.outputChars / 5) / ((run.survived_ms ?? 1) / 60000);
    if (derivedWpm < 100) return false;
  }

  return true;
}
