import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GameResultStore, GAME_OUTBOX_LIMIT, gameOutboxKey } from "@/lib/games/game-result-store";
import { normalizeGameDuration, parseCloudGameRecord, type GameScorePayload, type CloudGameRecord } from "@/lib/games/game-result-contract";
import { validateGameScoreInput } from "@/lib/server/validation";

const OWNER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OWNER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const RUN_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const RUN = { score: 200, cleared: 3, bestCombo: 2, survivedMs: 123.6 };

function row(payload: GameScorePayload): CloudGameRecord {
  return { id: payload.runId, user_id: payload.ownerId, game_id: payload.gameId, variant: payload.variant,
    score: payload.score, cleared: payload.cleared, best_combo: payload.bestCombo, survived_ms: payload.survivedMs,
    wpm: payload.wpm, accuracy: payload.accuracy, created_at: "2026-10-04T00:00:00.000Z" };
}
function acknowledgement(payload: GameScorePayload, extras: Record<string, unknown> = {}) {
  return Response.json({ success: true, data: { record: row(payload), best: row(payload), totalXp: 25,
    earnedXp: 25, isNewBest: true, idempotent: false, ...extras } });
}
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

function harness(storage = new Map<string, string>()) {
  let owner: string | null = OWNER_A;
  let generation = 1;
  let sequence = 0;
  const requests: GameScorePayload[] = [];
  const xp: number[] = [];
  let bestRows: CloudGameRecord[] = [];
  let respond: (payload: GameScorePayload) => Promise<Response> = async (payload) => acknowledgement(payload);
  const dependencies = {
    userId: () => owner, generation: () => generation,
    uuid: () => `00000000-0000-4000-8000-${(++sequence).toString().padStart(12, "0")}`,
    now: () => 1_791_072_000_000, get: (key: string) => storage.get(key) ?? null,
    set: (key: string, value: string) => { storage.set(key, value); },
    fetch: async (_url: string, init?: RequestInit) => {
      if (init?.method !== "POST") return Response.json({ success: true, data: bestRows });
      const payload = JSON.parse(String(init?.body)) as GameScorePayload;
      requests.push(payload);
      return respond(payload);
    },
    notify: () => {}, xp: (value: number) => { xp.push(value); },
  };
  let store = new GameResultStore(dependencies);
  return {
    get store() { return store; }, requests, xp, storage,
    respond(fn: typeof respond) { respond = fn; },
    bests(rows: CloudGameRecord[]) { bestRows = rows; },
    identity(next: string | null) { owner = next; generation++; store.identityChanged(); },
    refresh() { store = new GameResultStore(dependencies); },
  };
}

describe("game result contract", () => {
  it("preserves legacy rows with nullable optional counters", () => {
    const parsed = parseCloudGameRecord({ id: RUN_ID, user_id: OWNER_A, game_id: "card-battle", variant: "",
      score: 500, cleared: null, best_combo: null, survived_ms: null, wpm: null, accuracy: null,
      created_at: "2026-10-03T00:00:00.000Z" }, OWNER_A);
    assert.equal(parsed.score, 500);
    assert.equal(parsed.survived_ms, 0);
    assert.equal(parsed.cleared, 0);
  });
  it("normalizes real fractions and accepts short, zero and long runs without padded duration", () => {
    assert.equal(normalizeGameDuration(0), 0);
    assert.equal(normalizeGameDuration(0.4), 0);
    assert.equal(normalizeGameDuration(123.6), 124);
    for (const survivedMs of [0, 17.25, 999, 7_200_001, 3_000_000_000]) {
      const result = validateGameScoreInput({ ...RUN, gameId: "fruit-fury", runId: RUN_ID, ownerId: OWNER_A,
        score: 3_000_000_000, cleared: 2500, bestCombo: 300, survivedMs, wpm: 401.2, variant: "keyboard:easy:home" });
      assert.equal(result.valid, true);
      if (result.valid) assert.equal(result.data.survivedMs, Math.round(survivedMs));
    }
  });
  it("requires stable UUID and owner, rejects malformed numbers and preserves optional metrics", () => {
    const payload = { ...RUN, gameId: "ghost-racer", runId: RUN_ID, ownerId: OWNER_A, wpm: 88.8, accuracy: 99.25 };
    const result = validateGameScoreInput(payload);
    assert.equal(result.valid, true);
    if (result.valid) { assert.equal(result.data.wpm, 88.8); assert.equal(result.data.accuracy, 99.25); }
    for (const bad of [{ runId: undefined }, { runId: "fake" }, { ownerId: undefined }, { survivedMs: NaN },
      { survivedMs: -1 }, { survivedMs: Infinity }, { survivedMs: Number.MAX_SAFE_INTEGER + 1 }, { score: 1.5 },
      { accuracy: 101 }, { variant: "<script>" }]) assert.equal(validateGameScoreInput({ ...payload, ...bad }).valid, false);
  });
});

describe("account-owned game outbox", () => {
  it("does not announce a guest personal best if device storage rejects the write", () => {
    class FullStorage extends Map<string, string> {
      override set(): this { throw new Error("Quota exceeded"); }
    }
    const h = harness(new FullStorage());
    h.identity(null);
    h.store.start("falling-words");
    const result = h.store.record("falling-words", RUN);
    assert.equal(result.isNewBest, false);
    assert.equal(h.store.getBest("falling-words"), null);
    assert.equal(h.store.state("falling-words").status, "failed");
    assert.equal(h.requests.length, 0);
  });
  it("does not publish cloud best/XP until a matching acknowledgement; repeated writes reuse one run", async () => {
    const h = harness();
    let finish!: (response: Response) => void;
    h.respond(() => new Promise((resolve) => { finish = resolve; }));
    h.store.start("ghost-racer");
    const result = h.store.record("ghost-racer", { ...RUN, wpm: 80, accuracy: 95 });
    assert.equal(result.isNewBest, false);
    assert.equal(h.store.getBest("ghost-racer"), null);
    assert.equal(h.store.state("ghost-racer").status, "saving");
    assert.deepEqual(h.xp, []);
    h.store.record("ghost-racer", { ...RUN, score: 9999 });
    await flush();
    assert.equal(h.requests.length, 1);
    assert.equal(h.requests[0].survivedMs, 124);
    finish(acknowledgement(h.requests[0]));
    await flush();
    assert.equal(h.store.getBest("ghost-racer")?.score, 200);
    assert.equal(h.store.getBest("ghost-racer")?.wpm, 80);
    assert.equal(h.store.state("ghost-racer").status, "saved");
    await h.store.retry("ghost-racer");
    assert.equal(h.requests.length, 1);
    assert.deepEqual(h.xp, [25]);
  });

  for (const failure of ["http", "json", "logical", "wrong-run", "wrong-owner", "wrong-metrics", "network"] as const) {
    it(`retains ${failure} failure for explicit same-ID retry after refresh`, async () => {
      const h = harness();
      h.respond(async (payload) => {
        if (failure === "http") return Response.json({ success: true, data: {} }, { status: 503 });
        if (failure === "json") return new Response("not json", { status: 200 });
        if (failure === "logical") return Response.json({ success: false, error: { message: "Migration unavailable" } });
        if (failure === "wrong-run") return acknowledgement(payload, { record: { ...row(payload), id: RUN_ID } });
        if (failure === "wrong-owner") return acknowledgement(payload, { record: { ...row(payload), user_id: OWNER_B } });
        if (failure === "wrong-metrics") return acknowledgement(payload, { record: { ...row(payload), survived_ms: 1000 } });
        throw new Error("Offline");
      });
      h.store.start("word-rain"); h.store.record("word-rain", RUN);
      await flush();
      assert.equal(h.store.state("word-rain").status, "failed");
      assert.equal(h.store.getBest("word-rain"), null);
      assert.deepEqual(h.xp, []);
      const first = h.requests[0];
      h.refresh();
      assert.equal(h.requests.length, 1, "refresh never automatically replays uncertain requests");
      assert.equal(h.store.state("word-rain").canRetry, true);
      h.respond(async (payload) => acknowledgement(payload, { earnedXp: 0, isNewBest: false, idempotent: true }));
      await h.store.retry("word-rain");
      assert.equal(h.requests.length, 2);
      assert.deepEqual(h.requests[1], first);
      assert.equal(h.store.state("word-rain").status, "saved");
      assert.deepEqual(JSON.parse(h.storage.get(gameOutboxKey(OWNER_A))!), []);
    });
  }

  it("binds ownership at start and retries only under that account after relogin", async () => {
    const h = harness();
    h.store.start("card-battle");
    h.identity(OWNER_B);
    h.store.record("card-battle", RUN);
    await flush();
    await h.store.retry("card-battle");
    assert.equal(h.requests.length, 0);
    assert.equal(h.store.getBest("card-battle"), null);
    assert.equal(h.storage.has(gameOutboxKey(OWNER_B)), false);
    h.identity(null); h.identity(OWNER_A);
    assert.equal(h.requests.length, 0);
    assert.equal(h.store.state("card-battle").canRetry, true);
    await h.store.retry("card-battle");
    assert.equal(h.requests.length, 1);
    assert.equal(h.requests[0].ownerId, OWNER_A);
    assert.equal(h.store.state("card-battle").status, "saved");
  });

  it("does not apply an old account's late acknowledgement or expose its pending saves", async () => {
    const h = harness();
    let finish!: (response: Response) => void;
    h.respond(() => new Promise((resolve) => { finish = resolve; }));
    h.store.start("spellbound"); h.store.record("spellbound", RUN);
    await flush();
    h.identity(OWNER_B);
    assert.equal(h.store.state("spellbound").status, "idle");
    finish(acknowledgement(h.requests[0]));
    await flush();
    assert.equal(h.store.getBest("spellbound"), null);
    assert.equal(h.store.state("spellbound").status, "idle");
    assert.deepEqual(h.xp, []);
  });

  it("keeps guest runs guest-owned when sign-in occurs before completion", async () => {
    const h = harness(); h.identity(null);
    h.store.start("falling-words"); h.identity(OWNER_A);
    h.store.record("falling-words", RUN);
    await flush();
    assert.equal(h.requests.length, 0);
    assert.equal(h.store.getBest("falling-words"), null);
    h.identity(null);
    assert.equal(h.store.getBest("falling-words")?.score, RUN.score);
  });

  it("never retains another account's cached best in a run that started earlier", async () => {
    const h = harness();
    h.store.start("falling-words");
    h.identity(OWNER_B);
    const bestB = row({ ...RUN, survivedMs: 124, runId: RUN_ID, ownerId: OWNER_B,
      gameId: "falling-words", variant: "", wpm: null, accuracy: null, score: 9000 });
    h.bests([bestB]);
    await h.store.prime(OWNER_B);
    assert.equal(h.store.getBest("falling-words")?.score, 9000);
    h.store.record("falling-words", RUN);
    h.identity(OWNER_A);
    const repeated = h.store.record("falling-words", RUN);
    assert.equal(repeated.best.score, RUN.score);
    assert.equal(h.requests.length, 0);
  });

  it("separates Fruit variant bests and refuses a variant changed after start", async () => {
    const h = harness();
    for (const [variant, score] of [["keyboard:easy:home", 300], ["touch:hard:all", 50], ["keyboard:easy:home", 100]] as const) {
      h.store.start("fruit-fury", variant);
      h.store.record("fruit-fury", { ...RUN, variant, score });
      await flush();
    }
    assert.equal(h.store.getBest("fruit-fury", "keyboard:easy:home")?.score, 300);
    assert.equal(h.store.getBest("fruit-fury", "touch:hard:all")?.score, 50);
    assert.equal(h.store.getBest("fruit-fury"), null);
    h.store.start("fruit-fury", "keyboard:easy:home");
    h.store.record("fruit-fury", { ...RUN, variant: "touch:hard:all" });
    await flush();
    assert.equal(h.requests.length, 3);
    assert.equal(h.store.state("fruit-fury").status, "failed");
  });

  it("bounds pending storage without evicting earlier failed runs", async () => {
    const h = harness(); h.respond(async () => { throw new Error("Offline"); });
    for (let i = 0; i < GAME_OUTBOX_LIMIT + 1; i++) {
      h.store.start("combo-rush"); h.store.record("combo-rush", { ...RUN, score: i }); await flush();
    }
    const entries = JSON.parse(h.storage.get(gameOutboxKey(OWNER_A))!);
    assert.equal(entries.length, GAME_OUTBOX_LIMIT);
    assert.equal(entries[0].payload.score, 0);
    assert.equal(h.requests.length, GAME_OUTBOX_LIMIT);
    assert.match(h.store.state("combo-rush").message, /queue is full/);
    h.respond(async (payload) => acknowledgement(payload));
    await h.store.retry("combo-rush");
    assert.equal(h.requests.at(-1)?.score, GAME_OUTBOX_LIMIT);
    assert.equal(h.store.state("combo-rush").status, "saved");
  });
});
