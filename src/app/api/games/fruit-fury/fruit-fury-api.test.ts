import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as handleStart } from "@/app/api/games/fruit-fury/start/route";
import { POST as handleWave } from "@/app/api/games/fruit-fury/wave/route";
import { TEST_MODE_STORE, FRUIT_FURY_RUN_TTL_MS } from "@/lib/server/fruit-fury-state";

describe("Fruit Fury Server API Routes — Hardening & Abuse Controls", () => {
  beforeEach(() => {
    TEST_MODE_STORE.enabled = true;
    TEST_MODE_STORE.runs.clear();
  });

  function makeRequest(path: string, body?: unknown, headers: Record<string, string> = {}) {
    const origin = headers.origin || "https://www.herotyping.com";
    const init = {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin,
        "x-forwarded-host": "www.herotyping.com",
        "cf-connecting-ip": "127.0.0.1",
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    };
    return new NextRequest(`https://www.herotyping.com${path}`, init);
  }

  describe("POST /api/games/fruit-fury/start", () => {
    it("rejects untrusted cross-origin requests with 403", async () => {
      const req = makeRequest("/api/games/fruit-fury/start", undefined, {
        origin: "https://evil-attacker.com",
      });
      const res = await handleStart(req);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.error, "Invalid request origin");
    });

    it("initializes a valid run for trusted origin", async () => {
      const req = makeRequest("/api/games/fruit-fury/start");
      const res = await handleStart(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.ok(json.runId);
      assert.equal(json.chunkIndex, 0);
      assert.equal(json.fruits.length, 15);
      assert.ok(json.token);
    });

    it("enforces rate limiting on excessive start requests", async () => {
      const ip = "192.0.2.42";
      let lastRes: Response | null = null;
      for (let i = 0; i < 18; i++) {
        const req = makeRequest("/api/games/fruit-fury/start", undefined, {
          "cf-connecting-ip": ip,
        });
        lastRes = await handleStart(req);
      }
      assert.ok(lastRes);
      assert.equal(lastRes.status, 429);
      const json = await lastRes.json();
      assert.ok(json.error.includes("Too many run initialization requests"));
    });
  });

  describe("POST /api/games/fruit-fury/wave", () => {
    it("rejects untrusted cross-origin requests with 403", async () => {
      const req = makeRequest(
        "/api/games/fruit-fury/wave",
        { runId: "invalid", token: "tok", events: [] },
        { origin: "https://phishing-site.example" }
      );
      const res = await handleWave(req);
      assert.equal(res.status, 403);
    });

    it("rejects malformed payloads with missing fields or invalid types", async () => {
      const req = makeRequest("/api/games/fruit-fury/wave", {
        runId: "not-a-uuid",
        token: "short",
        events: "not-an-array",
      });
      const res = await handleWave(req);
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.error, "Invalid payload");
    });

    it("processes a legitimate wave with valid events successfully", async () => {
      const startReq = makeRequest("/api/games/fruit-fury/start");
      const startRes = await handleStart(startReq);
      const startData = await startRes.json();

      const events = startData.fruits.map((f: string, i: number) => ({
        t: 1000 + i * 1000,
        type: f === "bomb" ? "miss" : "slice",
        fruitType: f,
      }));

      const waveReq = makeRequest("/api/games/fruit-fury/wave", {
        runId: startData.runId,
        token: startData.token,
        events,
      });

      const waveRes = await handleWave(waveReq);
      assert.equal(waveRes.status, 200);
      const waveData = await waveRes.json();
      assert.equal(waveData.chunkIndex, 1);
      assert.equal(waveData.status, "active");
    });

    it("rejects wave requests for an expired run with 410", async () => {
      const startReq = makeRequest("/api/games/fruit-fury/start");
      const startRes = await handleStart(startReq);
      const startData = await startRes.json();

      // Backdate the run state in TEST_MODE_STORE past TTL
      const state = TEST_MODE_STORE.runs.get(startData.runId);
      assert.ok(state);
      state.last_chunk_issued_at = new Date(Date.now() - (FRUIT_FURY_RUN_TTL_MS + 60000)).toISOString();
      state.created_at = state.last_chunk_issued_at;

      const events = startData.fruits.map((f: string, i: number) => ({
        t: 1000 + i * 1000,
        type: f === "bomb" ? "miss" : "slice",
        fruitType: f,
      }));

      const waveReq = makeRequest("/api/games/fruit-fury/wave", {
        runId: startData.runId,
        token: startData.token,
        events,
      });

      const waveRes = await handleWave(waveReq);
      assert.equal(waveRes.status, 410);
      const json = await waveRes.json();
      assert.equal(json.error, "Run has expired");
    });
  });
});
