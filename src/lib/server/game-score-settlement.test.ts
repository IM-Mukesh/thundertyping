import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { settleGameResult, GameSettlementUnavailable, GameRunConflict } from "@/lib/server/game-score-settlement";
import { parseGameScorePayload } from "@/lib/games/game-result-contract";

const OWNER = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const payload = parseGameScorePayload({ ownerId: OWNER, runId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  gameId: "fruit-fury", variant: "keyboard:easy:home", score: 120, cleared: 2, bestCombo: 2,
  survivedMs: 12.6, wpm: 123.4, accuracy: 98.5 });
const record = { id: payload.runId, user_id: OWNER, game_id: payload.gameId, variant: payload.variant,
  score: payload.score, cleared: payload.cleared, best_combo: payload.bestCombo, survived_ms: payload.survivedMs,
  wpm: payload.wpm, accuracy: payload.accuracy, created_at: "2026-10-04T00:00:00.000Z" };
const ack = { record, best: record, totalXp: 20, earnedXp: 20, isNewBest: true, idempotent: false };

describe("atomic game settlement adapter", () => {
  it("passes one owner-bound run to the RPC and preserves the acknowledged result", async () => {
    let calls = 0;
    const result = await settleGameResult(OWNER, payload, async (args) => {
      calls++;
      assert.deepEqual(args, { p_user_id: OWNER, p_run_id: payload.runId, p_game_id: payload.gameId,
        p_variant: payload.variant, p_score: 120, p_cleared: 2, p_best_combo: 2, p_survived_ms: 13,
        p_wpm: 123.4, p_accuracy: 98.5 });
      return { data: ack, error: null };
    });
    assert.equal(calls, 1);
    assert.deepEqual(result, ack);
  });
  it("rejects changed identity before any database access", async () => {
    let calls = 0;
    await assert.rejects(settleGameResult("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", payload, async () => {
      calls++; return { data: ack, error: null };
    }), /GAME_OWNER_CHANGED/);
    assert.equal(calls, 0);
  });
  it("fails explicitly on an absent migration and does not attempt fallback or retry", async () => {
    let calls = 0;
    await assert.rejects(settleGameResult(OWNER, payload, async () => {
      calls++; return { data: null, error: { code: "PGRST202", message: "Missing RPC" } };
    }), GameSettlementUnavailable);
    assert.equal(calls, 1);
  });
  it("reports conflicting reused UUIDs and rejects false duplicate rewards in acknowledgements", async () => {
    await assert.rejects(settleGameResult(OWNER, payload, async () => ({ data: null,
      error: { code: "23505", message: "Run ID conflict" } })), GameRunConflict);
    await assert.rejects(settleGameResult(OWNER, payload, async () => ({ data: { ...ack, idempotent: true }, error: null })), /acknowledgement/);
    const repeated = await settleGameResult(OWNER, payload, async () => ({ data: { ...ack, earnedXp: 0, isNewBest: false, idempotent: true }, error: null }));
    assert.equal(repeated.earnedXp, 0);
    assert.equal(repeated.idempotent, true);
  });
  it("refuses an acknowledgement for another account, variant or measurement", async () => {
    for (const changed of [{ user_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }, { variant: "touch:easy:home" }, { survived_ms: 1000 }]) {
      await assert.rejects(settleGameResult(OWNER, payload, async () => ({ data: { ...ack, record: { ...record, ...changed } }, error: null })));
    }
  });
});
