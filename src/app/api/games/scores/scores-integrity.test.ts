import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { saveGameScore } from "@/lib/server/game-scores";
import {
  issueGameRunChallenge,
  deriveDeterministicWordsForChallenge,
  clearServerRunChallenges,
  clearVerifiedGameRunProofs,
  type GameplayEvidence,
} from "@/lib/server/game-proof";
import { _clearDurableChallengeMemoryForTesting } from "@/lib/server/durable-challenge";
import type { ValidatedGameScoreInput } from "@/lib/server/validation";

describe("P1 Security: Game Score Progression Boundary & Adversarial Integrity", () => {
  const userId = "00000000-0000-4000-8000-000000000001";
  const otherUserId = "00000000-0000-4000-8000-000000000002";
  const originalFetch = globalThis.fetch;
  const settledRunIds = new Set<string>();

  beforeEach(() => {
    clearServerRunChallenges();
    clearVerifiedGameRunProofs();
    _clearDurableChallengeMemoryForTesting();
    settledRunIds.clear();

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/rpc/rate_limit_increment")) {
        return new Response(JSON.stringify([{ count: 1, reset_at: new Date().toISOString() }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/rpc/settle_game_run")) {
        const body = JSON.parse(String(init?.body || "{}"));
        const runId = body.p_run_id;
        const isDuplicate = settledRunIds.has(runId);
        settledRunIds.add(runId);

        const record = {
          id: runId,
          user_id: body.p_user_id,
          game_id: body.p_game_id,
          variant: body.p_variant,
          score: body.p_score,
          cleared: body.p_cleared,
          best_combo: body.p_best_combo,
          survived_ms: body.p_survived_ms,
          wpm: body.p_wpm,
          accuracy: body.p_accuracy,
          created_at: new Date().toISOString(),
        };
        const ack = {
          record,
          best: record,
          totalXp: isDuplicate ? 100 : 150,
          earnedXp: isDuplicate ? 0 : 50,
          isNewBest: !isDuplicate,
          idempotent: isDuplicate,
        };
        return new Response(JSON.stringify(ack), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/player_streaks")) {
        return new Response(JSON.stringify([{ user_id: userId, total_xp: 100 }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/game_scores")) {
        const match = url.match(/id=eq\.([a-f0-9-]+)/);
        const runId = match ? match[1] : null;
        if (runId && settledRunIds.has(runId)) {
          return new Response(
            JSON.stringify([
              {
                id: runId,
                user_id: userId,
                game_id: "type-before-death",
                variant: "campaign:normal:mission-0:rifle:scout",
                score: 1600,
              },
            ]),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/achievements")) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("classifies client-reported metrics without server challenge as unverified with 0 earned XP", async () => {
    const unverifiedInput: ValidatedGameScoreInput = {
      runId: "11111111-1111-4111-8111-111111111111",
      ownerId: userId,
      gameId: "ghost-racer",
      variant: "default",
      score: 99999,
      cleared: 50,
      bestCombo: 50,
      survivedMs: 60000,
      wpm: 120,
      accuracy: 100,
    };

    const ack = await saveGameScore(userId, unverifiedInput);
    assert.equal(ack.verified, false);
    assert.equal(ack.trustTier, "self_reported");
    assert.equal(ack.earnedXp, 0);
    assert.equal(ack.isNewBest, false);
    assert.equal(ack.record.score, 99999);
  });

  it("rejects forged Type Before Death run without server challenge (0 XP, unverified)", async () => {
    const forgedRun: ValidatedGameScoreInput = {
      runId: "22222222-2222-4222-8222-222222222222",
      ownerId: userId,
      gameId: "type-before-death",
      variant: "campaign:normal:mission-0:rifle:scout",
      score: 2500,
      cleared: 35,
      bestCombo: 30,
      survivedMs: 50000,
      wpm: 110,
      accuracy: 95,
      evidence: {
        runId: "22222222-2222-4222-8222-222222222222",
        seed: "attacker-chosen-seed",
        bossDefeated: true,
        wordsCompleted: ["the", "quick", "brown", "fox"],
      },
    };

    const ack = await saveGameScore(userId, forgedRun);
    assert.equal(ack.verified, false);
    assert.equal(ack.trustTier, "self_reported");
    assert.equal(ack.earnedXp, 0);
  });

  it("rejects Type Before Death run with tampered seed or forged transcript (0 XP, unverified)", async () => {
    const runId = "33333333-3333-4333-8333-333333333333";
    const challenge = issueGameRunChallenge("type-before-death", runId, { mode: "campaign", mission: 0, userId });

    const tamperedInput: ValidatedGameScoreInput = {
      runId,
      ownerId: userId,
      gameId: "type-before-death",
      variant: "campaign:normal:mission-0:rifle:scout",
      score: 2000,
      cleared: 30,
      bestCombo: 25,
      survivedMs: 50000,
      wpm: 105,
      accuracy: 90,
      evidence: {
        runId,
        challengeToken: challenge.token,
        seed: challenge.seed,
        mission: 0,
        bossDefeated: true,
        wordsCompleted: ["fabricated1", "fabricated2", "fabricated3"],
        totalKeysTyped: 200,
        elapsedMs: 50000,
      },
    };

    const ack = await saveGameScore(userId, tamperedInput);
    assert.equal(ack.verified, false);
    assert.equal(ack.trustTier, "self_reported");
    assert.equal(ack.earnedXp, 0);
  });

  it("rejects challenge token issued to a different user (ownership check)", async () => {
    const runId = "33333333-4444-4444-8444-444444444444";
    // Token issued to otherUserId
    const challenge = issueGameRunChallenge("type-before-death", runId, { mode: "campaign", mission: 0, userId: otherUserId });
    const deterministicWords = deriveDeterministicWordsForChallenge(challenge.seed, challenge.mission);

    const stolenInput: ValidatedGameScoreInput = {
      runId,
      ownerId: userId,
      gameId: "type-before-death",
      variant: "campaign:normal:mission-0:rifle:scout",
      score: 1600,
      cleared: 30,
      bestCombo: 25,
      survivedMs: 50000,
      wpm: 105,
      accuracy: 90,
      evidence: {
        runId,
        challengeToken: challenge.token,
        seed: challenge.seed,
        mission: challenge.mission,
        wordsCompleted: deterministicWords.slice(0, 32),
        totalKeysTyped: 260,
        elapsedMs: 50000,
      },
    };

    // Submitted by userId (mismatch!)
    const ack = await saveGameScore(userId, stolenInput);
    assert.equal(ack.verified, false, "Token issued to another user must be rejected");
    assert.equal(ack.earnedXp, 0);
  });

  it("rejects challenge token with tampered cryptographic signature", async () => {
    const runId = "33333333-5555-4555-8555-555555555555";
    const challenge = issueGameRunChallenge("type-before-death", runId, { mode: "campaign", mission: 0, userId });
    const deterministicWords = deriveDeterministicWordsForChallenge(challenge.seed, challenge.mission);

    const tamperedToken = challenge.token.slice(0, -6) + "badbad";

    const tamperedInput: ValidatedGameScoreInput = {
      runId,
      ownerId: userId,
      gameId: "type-before-death",
      variant: "campaign:normal:mission-0:rifle:scout",
      score: 1600,
      cleared: 30,
      bestCombo: 25,
      survivedMs: 50000,
      wpm: 105,
      accuracy: 90,
      evidence: {
        runId,
        challengeToken: tamperedToken,
        seed: challenge.seed,
        mission: challenge.mission,
        wordsCompleted: deterministicWords.slice(0, 32),
        totalKeysTyped: 260,
        elapsedMs: 50000,
      },
    };

    const ack = await saveGameScore(userId, tamperedInput);
    assert.equal(ack.verified, false, "Tampered HMAC signature must fail verification");
    assert.equal(ack.earnedXp, 0);
  });

  it("verifies authentic Type Before Death challenge + deterministic transcript and awards proof", async () => {
    const runId = "44444444-4444-4444-8444-444444444444";
    const challenge = issueGameRunChallenge("type-before-death", runId, { mode: "campaign", mission: 0, userId });
    const deterministicWords = deriveDeterministicWordsForChallenge(challenge.seed, challenge.mission);

    const validEvidence: GameplayEvidence = {
      runId,
      challengeToken: challenge.token,
      seed: challenge.seed,
      mission: challenge.mission,
      difficulty: "normal",
      wordsCompleted: deterministicWords.slice(0, 32),
      totalKeysTyped: 260,
      elapsedMs: 50000,
      bossDefeated: true,
      overdriveActivations: 1,
      outputChars: 260,
    };

    const validInput: ValidatedGameScoreInput = {
      runId,
      ownerId: userId,
      gameId: "type-before-death",
      variant: "campaign:normal:mission-0:rifle:scout",
      score: 1600,
      cleared: 30,
      bestCombo: 25,
      survivedMs: 50000,
      wpm: 105,
      accuracy: 90,
      evidence: validEvidence,
    };

    const ack = await saveGameScore(userId, validInput);
    assert.equal(ack.verified, true);
    assert.equal(ack.trustTier, "verified");
    assert.ok(ack.earnedXp > 0, "Verified run must earn cloud XP");
    assert.equal(ack.record.id, runId);

    // Replay check: challenge must be consumed; repeating with same challenge fails verification
    const replayedInput: ValidatedGameScoreInput = {
      ...validInput,
      runId: "55555555-5555-4555-8555-555555555555",
      evidence: {
        ...validEvidence,
        runId: "55555555-5555-4555-8555-555555555555",
      },
    };
    const replayAck = await saveGameScore(userId, replayedInput);
    assert.equal(replayAck.verified, false, "Consumed challenge cannot be reused for a different run");
    assert.equal(replayAck.earnedXp, 0);
  });

  it("handles legitimate idempotent retry of the same settled run without re-awarding XP", async () => {
    const runId = "66666666-7777-4777-8777-777777777777";
    const challenge = issueGameRunChallenge("type-before-death", runId, { mode: "campaign", mission: 0, userId });
    const deterministicWords = deriveDeterministicWordsForChallenge(challenge.seed, challenge.mission);

    const input: ValidatedGameScoreInput = {
      runId,
      ownerId: userId,
      gameId: "type-before-death",
      variant: "campaign:normal:mission-0:rifle:scout",
      score: 1600,
      cleared: 30,
      bestCombo: 25,
      survivedMs: 50000,
      wpm: 105,
      accuracy: 90,
      evidence: {
        runId,
        challengeToken: challenge.token,
        seed: challenge.seed,
        mission: challenge.mission,
        wordsCompleted: deterministicWords.slice(0, 32),
        totalKeysTyped: 260,
        elapsedMs: 50000,
      },
    };

    const first = await saveGameScore(userId, input);
    assert.equal(first.verified, true);

    const retry = await saveGameScore(userId, input);
    assert.equal(retry.idempotent, true, "Retried request must report idempotent");
    assert.equal(retry.earnedXp, 0, "Retried request must not duplicate XP");
  });

  it("rejects Fruit Fury without valid chunk evidence", async () => {
    const fruitFuryInput: ValidatedGameScoreInput = {
      runId: "66666666-6666-4666-8666-666666666666",
      ownerId: userId,
      gameId: "fruit-fury",
      variant: "classic",
      score: 50000,
      cleared: 100,
      bestCombo: 50,
      survivedMs: 60000,
      wpm: null,
      accuracy: null,
      evidence: {},
    };

    const ack = await saveGameScore(userId, fruitFuryInput);
    assert.equal(ack.verified, false);
    assert.equal(ack.trustTier, "self_reported");
    assert.equal(ack.earnedXp, 0);
  });
});
