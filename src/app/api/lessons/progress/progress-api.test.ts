import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/lessons/progress/route";
import { isPlaceholderSecretKey } from "@/lib/supabase/admin";

describe("Lesson Progress API Route & Persistence Hardening", () => {
  function makeRequest(
    method: "GET" | "POST",
    body?: unknown,
    headers: Record<string, string> = {}
  ) {
    const origin = headers.origin || "https://www.herotyping.com";
    return new NextRequest("https://www.herotyping.com/api/lessons/progress", {
      method,
      headers: {
        "content-type": "application/json",
        origin,
        "x-forwarded-host": "www.herotyping.com",
        "cf-connecting-ip": "127.0.0.1",
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  }

  describe("Admin client secret key detection", () => {
    it("identifies placeholder and invalid admin keys correctly", () => {
      assert.equal(isPlaceholderSecretKey(undefined), true);
      assert.equal(isPlaceholderSecretKey(""), true);
      assert.equal(isPlaceholderSecretKey("   "), true);
      assert.equal(isPlaceholderSecretKey("sb_secret_your-secret-key-here"), true);
      assert.equal(isPlaceholderSecretKey("sb_secret_your-actual-secret-key"), true);
      assert.equal(isPlaceholderSecretKey("your-placeholder-key"), true);
    });

    it("accepts valid and test placeholder keys", () => {
      assert.equal(isPlaceholderSecretKey("sb_secret_test_placeholder"), false);
      assert.equal(isPlaceholderSecretKey("sb_secret_live_production_key_1234567890"), false);
    });
  });

  describe("GET /api/lessons/progress", () => {
    it("returns 401 UNAUTHORIZED when no authenticated session is present", async () => {
      const res = await GET();
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.error.code, "UNAUTHORIZED");
    });
  });

  describe("POST /api/lessons/progress", () => {
    it("rejects untrusted cross-origin requests with 403", async () => {
      const req = makeRequest("POST", { lessonId: "home-row-f-j" }, {
        origin: "https://malicious-site.example.com",
      });
      const res = await POST(req);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.error.code, "FORBIDDEN");
    });

    it("rejects unauthenticated requests with 401 UNAUTHORIZED", async () => {
      const req = makeRequest("POST", {
        runId: "11111111-1111-4111-8111-111111111111",
        lessonId: "home-row-f-j",
        completed: true,
        stars: 3,
        wpm: 45,
        accuracy: 96,
        attemptCount: 1,
        step: 1,
        totalSteps: 5,
        typedChars: 50,
        correctChars: 48,
        incorrectChars: 2,
        elapsedMs: 12000,
      });
      const res = await POST(req);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.error.code, "UNAUTHORIZED");
    });
  });
});
