import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { saveTypingResult } from "@/lib/server/typing-results";
import { validateTypingResultInput } from "@/lib/server/validation";
import {
  issueTypingRunChallenge,
  clearTypingRunChallenges,
} from "@/lib/server/typing-proof";
import { _clearDurableChallengeMemoryForTesting } from "@/lib/server/durable-challenge";

describe("P1 Security: Typing Test Result Integrity & Conservative Progression Boundary", () => {
  const userId = "00000000-0000-4000-8000-000000000001";
  const otherUserId = "00000000-0000-4000-8000-000000000002";
  const originalFetch = globalThis.fetch;
  const recordedRunIds = new Set<string>();

  beforeEach(() => {
    clearTypingRunChallenges();
    _clearDurableChallengeMemoryForTesting();
    recordedRunIds.clear();

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/rpc/rate_limit_increment")) {
        return new Response(JSON.stringify([{ count: 1, reset_at: new Date().toISOString() }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/rpc/settle_typing_run")) {
        const body = JSON.parse(String(init?.body || "{}"));
        const runId = body.p_run_id;

        const isDuplicate = recordedRunIds.has(runId);
        recordedRunIds.add(runId);

        const record = {
          id: runId,
          user_id: body.p_user_id,
          mode: body.p_mode,
          duration: body.p_duration,
          wpm: body.p_wpm,
          accuracy: body.p_accuracy,
          correct_chars: body.p_correct_chars,
          incorrect_chars: body.p_incorrect_chars,
          missed_chars: body.p_missed_chars,
          extra_chars: body.p_extra_chars,
          param: body.p_param,
          punctuation: body.p_punctuation,
          numbers: body.p_numbers,
          language_code: body.p_language_code,
          created_at: new Date().toISOString(),
        };

        const responseData = {
          record,
          earnedXp: isDuplicate ? 0 : body.p_earned_xp,
          totalXp: 150 + (isDuplicate ? 0 : body.p_earned_xp),
          idempotent: isDuplicate,
        };

        return new Response(JSON.stringify(responseData), {
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

  describe("Validation Bounds & Anomaly Detection", () => {
    it("rejects impossible typing speed (>40 characters per second)", () => {
      const input = {
        mode: "time",
        duration: 5,
        wpm: 120,
        accuracy: 100,
        correctChars: 500,
        scoringChars: 500,
        incorrectChars: 0,
        runId: "11111111-1111-4111-8111-111111111111",
      };
      const res = validateTypingResultInput(input);
      assert.equal(res.valid, false);
      assert.match(res.message, /exceeds maximum possible human keystroke rate/);
    });

    it("rejects inconsistent claimed WPM vs scoring characters and duration", () => {
      const input = {
        mode: "time",
        duration: 60,
        wpm: 85,
        accuracy: 98,
        correctChars: 100,
        scoringChars: 100,
        incorrectChars: 2,
        runId: "22222222-2222-4222-8222-222222222222",
      };
      const res = validateTypingResultInput(input);
      assert.equal(res.valid, false);
      assert.match(res.message, /Claimed WPM.*does not match scoring characters/);
    });

    it("rejects inconsistent accuracy vs character counts", () => {
      const input = {
        mode: "time",
        duration: 60,
        wpm: 10,
        accuracy: 99,
        correctChars: 50,
        scoringChars: 50,
        incorrectChars: 50,
        runId: "33333333-3333-4333-8333-333333333333",
      };
      const res = validateTypingResultInput(input);
      assert.equal(res.valid, false);
      assert.match(res.message, /Claimed accuracy.*does not match character counts/);
    });

    it("rejects invalid duration (0s or negative or >7200s)", () => {
      const inputZero = {
        mode: "time",
        duration: 0,
        wpm: 50,
        accuracy: 100,
        correctChars: 50,
        runId: "44444444-4444-4444-8444-444444444444",
      };
      const resZero = validateTypingResultInput(inputZero);
      assert.equal(resZero.valid, false);

      const inputHuge = {
        mode: "time",
        duration: 10000,
        wpm: 50,
        accuracy: 100,
        correctChars: 50,
        runId: "44444444-4444-4444-8444-444444444444",
      };
      const resHuge = validateTypingResultInput(inputHuge);
      assert.equal(resHuge.valid, false);
    });
  });

  describe("Timing Challenges & Conservative Trust Policy", () => {
    it("marks submissions without server challenge as self_reported with 0 cloud XP", async () => {
      const input = {
        mode: "time",
        duration: 60,
        wpm: 40,
        accuracy: 100,
        correctChars: 200,
        scoringChars: 200,
        incorrectChars: 0,
        runId: "55555555-5555-4555-8555-555555555555",
      };
      const validation = validateTypingResultInput(input);
      assert.equal(validation.valid, true);

      const saved = await saveTypingResult(userId, validation.data);
      assert.equal(saved.verified, false);
      assert.equal(saved.trustTier, "self_reported");
      assert.equal(saved.earnedXp, 0, "Unverified typing tests must earn 0 cloud XP");
    });

    it("enforces conservative trust: waiting full challenge duration verifies timing, but NEVER awards trusted cloud XP", async () => {
      const runId = "66666666-6666-4666-8666-666666666666";
      const challenge = issueTypingRunChallenge(runId, "time", "1", userId);

      const input = {
        mode: "time",
        duration: 1,
        wpm: 60,
        accuracy: 100,
        correctChars: 5,
        scoringChars: 5,
        incorrectChars: 0,
        runId,
        challengeToken: challenge.token,
      };
      const validation = validateTypingResultInput(input);
      assert.equal(validation.valid, true);

      // Wait for server elapsed duration
      await new Promise((r) => setTimeout(r, 900));

      const saved = await saveTypingResult(userId, validation.data);
      assert.equal(saved.timingVerified, true, "Timing token verifies wall-clock elapsed time");
      assert.equal(saved.trustTier, "timing_verified");
      assert.equal(saved.verified, false, "Timing token alone NEVER implies proof of genuine keystrokes");
      assert.equal(saved.earnedXp, 0, "Typing tests without keystroke proof MUST award 0 cloud XP");
    });

    it("rejects premature submission where server wall-clock time is far shorter than claimed duration", async () => {
      const runId = "77777777-7777-4777-8777-777777777777";
      const challenge = issueTypingRunChallenge(runId, "time", "60", userId);

      const input = {
        mode: "time",
        duration: 60,
        wpm: 50,
        accuracy: 100,
        correctChars: 250,
        scoringChars: 250,
        incorrectChars: 0,
        runId,
        challengeToken: challenge.token,
      };
      const validation = validateTypingResultInput(input);
      assert.equal(validation.valid, true);

      const saved = await saveTypingResult(userId, validation.data);
      assert.equal(saved.timingVerified, false, "Instantaneous submission claiming 60s must fail verification");
      assert.equal(saved.trustTier, "self_reported");
      assert.equal(saved.earnedXp, 0);
    });

    it("rejects token issued for another user (ownership enforcement)", async () => {
      const runId = "88888888-8888-4888-8888-888888888888";
      // Issued for otherUserId
      const challenge = issueTypingRunChallenge(runId, "time", "1", otherUserId);

      const input = {
        mode: "time",
        duration: 1,
        wpm: 60,
        accuracy: 100,
        correctChars: 5,
        scoringChars: 5,
        incorrectChars: 0,
        runId,
        challengeToken: challenge.token,
      };
      const validation = validateTypingResultInput(input);
      assert.equal(validation.valid, true);

      // Submitted by userId (mismatch!)
      const saved = await saveTypingResult(userId, validation.data);
      assert.equal(saved.timingVerified, false, "Token issued to another user must be rejected");
      assert.equal(saved.trustTier, "self_reported");
    });

    it("rejects tampered or fabricated token signature", async () => {
      const runId = "99999999-9999-4999-8999-999999999999";
      const challenge = issueTypingRunChallenge(runId, "time", "1", userId);

      // Tamper signature
      const tamperedToken = challenge.token.slice(0, -6) + "abcdef";

      const input = {
        mode: "time",
        duration: 1,
        wpm: 60,
        accuracy: 100,
        correctChars: 5,
        scoringChars: 5,
        incorrectChars: 0,
        runId,
        challengeToken: tamperedToken,
      };
      const validation = validateTypingResultInput(input);
      assert.equal(validation.valid, true);

      const saved = await saveTypingResult(userId, validation.data);
      assert.equal(saved.timingVerified, false);
      assert.equal(saved.trustTier, "self_reported");
    });

    it("rejects replay of consumed challenge token", async () => {
      const runId1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
      const challenge = issueTypingRunChallenge(runId1, "time", "1", userId);

      await new Promise((r) => setTimeout(r, 900));

      const input1 = {
        mode: "time",
        duration: 1,
        wpm: 60,
        accuracy: 100,
        correctChars: 5,
        scoringChars: 5,
        incorrectChars: 0,
        runId: runId1,
        challengeToken: challenge.token,
      };
      const val1 = validateTypingResultInput(input1);
      assert.equal(val1.valid, true);
      if (!val1.valid) return;
      const firstSave = await saveTypingResult(userId, val1.data);
      assert.equal(firstSave.timingVerified, true);

      // Now attempt to reuse the exact same token for a new run
      const runId2 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
      const input2 = {
        ...input1,
        runId: runId2,
      };
      const val2 = validateTypingResultInput(input2);
      assert.equal(val2.valid, true);
      if (!val2.valid) return;
      const replaySave = await saveTypingResult(userId, val2.data);
      assert.equal(replaySave.timingVerified, false, "Consumed token cannot be reused for another run");
      assert.equal(replaySave.trustTier, "self_reported");
    });

    it("enforces replay idempotency on duplicate runId", async () => {
      const runId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
      const input = {
        mode: "time",
        duration: 30,
        wpm: 40,
        accuracy: 100,
        correctChars: 100,
        scoringChars: 100,
        incorrectChars: 0,
        runId,
      };
      const validation = validateTypingResultInput(input);
      assert.equal(validation.valid, true);

      const first = await saveTypingResult(userId, validation.data);
      assert.ok(first.result);

      const second = await saveTypingResult(userId, validation.data);
      assert.equal(second.idempotent, true);
      assert.equal(second.earnedXp, 0);
    });
  });
});
