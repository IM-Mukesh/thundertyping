import "server-only";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { getAchievementProofSecret } from "@/lib/server/game-proof";
import {
  createSignedChallengeToken,
  parseAndVerifySignedToken,
  consumeDurableChallenge,
} from "@/lib/server/durable-challenge";

export interface TypingRunChallengePayload extends Record<string, unknown> {
  readonly v: 1;
  readonly cid: string;
  readonly uid?: string;
  readonly rid: string;
  readonly m: string;
  readonly p: string;
  readonly iat: number;
}

export interface TypingRunChallenge {
  readonly challengeId: string;
  readonly runId: string;
  readonly mode: string;
  readonly param: string;
  readonly issuedAt: number;
  readonly token: string;
}

const TYPING_RUN_CHALLENGES = new Map<string, TypingRunChallenge>();
const MAX_CHALLENGES = 5000;
const CHALLENGE_TTL_MS = 3600_000; // 1 hour

export function computeTypingChallengeToken(
  challengeId: string,
  runId: string,
  mode: string,
  param: string,
  issuedAt: number,
  secret?: string
): string {
  const signingSecret = secret ?? getAchievementProofSecret();
  const payload = `typing:${challengeId}:${runId}:${mode}:${param}:${issuedAt}`;
  return createHmac("sha256", signingSecret).update(payload).digest("hex");
}

export function issueTypingRunChallenge(
  runId: string,
  mode: string,
  param: string,
  userId?: string
): TypingRunChallenge {
  const challengeId = `type-chal-${randomUUID()}`;
  const issuedAt = Date.now();
  const secret = getAchievementProofSecret();

  const payload: TypingRunChallengePayload = {
    v: 1,
    cid: challengeId,
    uid: userId,
    rid: runId,
    m: mode,
    p: param,
    iat: issuedAt,
  };

  const token = createSignedChallengeToken(payload, secret);

  const challenge: TypingRunChallenge = {
    challengeId,
    runId,
    mode,
    param,
    issuedAt,
    token,
  };

  if (TYPING_RUN_CHALLENGES.size >= MAX_CHALLENGES) {
    const firstKey = TYPING_RUN_CHALLENGES.keys().next().value;
    if (firstKey) TYPING_RUN_CHALLENGES.delete(firstKey);
  }
  TYPING_RUN_CHALLENGES.set(runId, challenge);

  return challenge;
}

export function getTypingRunChallenge(runId: string): TypingRunChallenge | undefined {
  const challenge = TYPING_RUN_CHALLENGES.get(runId);
  if (!challenge) return undefined;
  if (Date.now() - challenge.issuedAt > CHALLENGE_TTL_MS) {
    TYPING_RUN_CHALLENGES.delete(runId);
    return undefined;
  }
  return challenge;
}

export function consumeTypingRunChallenge(runId: string): TypingRunChallenge | undefined {
  const challenge = getTypingRunChallenge(runId);
  if (challenge) {
    TYPING_RUN_CHALLENGES.delete(runId);
  }
  return challenge;
}

export function clearTypingRunChallenges(): void {
  TYPING_RUN_CHALLENGES.clear();
}

/**
 * Verifies that a typing run has authentic server provenance and wall-clock time consistency.
 * Consumes the challenge atomically and durably to prevent replay across serverless instances.
 *
 * Supported signatures:
 * - verifyTypingRunChallenge(userId, runId, durationSec, token)
 * - verifyTypingRunChallenge(runId, durationSec, token)
 */
export async function verifyTypingRunChallenge(
  arg1: string,
  arg2: string | number,
  arg3?: number | string,
  arg4?: string
): Promise<boolean> {
  const userId = typeof arg2 === "number" ? "" : arg1;
  const runId = typeof arg2 === "number" ? arg1 : (arg2 as string);
  const durationSec = typeof arg2 === "number" ? arg2 : (arg3 as number);
  const token = typeof arg2 === "number" ? (arg3 as string | undefined) : arg4;

  if (!runId || !token) return false;

  // 1. Stateless cryptographic token verification
  if (token.startsWith("v1.")) {
    const payload = parseAndVerifySignedToken<TypingRunChallengePayload>(token);
    if (!payload) return false;
    if (userId && payload.uid && payload.uid !== userId) return false;
    if (payload.rid !== runId) return false;
    if (Date.now() - payload.iat > CHALLENGE_TTL_MS) return false;
    if (payload.iat > Date.now() + 60_000) return false;

    // Wall-clock time check: client cannot claim duration before server elapsed time has passed
    const elapsedServerMs = Date.now() - payload.iat;
    const requiredMs = Math.max(500, durationSec * 1000 * 0.85); // 15% grace period for network jitter
    if (elapsedServerMs < requiredMs) {
      return false;
    }

    // Durable atomic single-use consumption across serverless instances
    const consumption = await consumeDurableChallenge(payload.cid, payload.uid ?? userId, runId, "typing");
    if (!consumption.success) {
      return false;
    }

    consumeTypingRunChallenge(runId);
    return true;
  }

  // 2. Fallback to in-memory challenge registry (for legacy tests/tokens)
  const challenge = getTypingRunChallenge(runId);
  if (!challenge) return false;

  const expectedToken = computeTypingChallengeToken(
    challenge.challengeId,
    challenge.runId,
    challenge.mode,
    challenge.param,
    challenge.issuedAt
  );

  const tokenBuf = Buffer.from(token, "hex");
  const expectedBuf = Buffer.from(expectedToken, "hex");
  if (tokenBuf.length !== expectedBuf.length || !timingSafeEqual(tokenBuf, expectedBuf)) {
    return false;
  }

  const elapsedServerMs = Date.now() - challenge.issuedAt;
  const requiredMs = Math.max(500, durationSec * 1000 * 0.85);
  if (elapsedServerMs < requiredMs) {
    return false;
  }

  const consumption = await consumeDurableChallenge(challenge.challengeId, userId, runId, "typing");
  if (!consumption.success) {
    return false;
  }

  consumeTypingRunChallenge(runId);
  return true;
}
