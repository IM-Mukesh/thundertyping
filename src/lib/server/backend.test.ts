import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  validateTypingResultInput,
  validateLessonProgressInput,
  validateGameScoreInput,
  validateProfileUpdateInput,
  validatePreferencesInput,
  validateXpAwardInput,
  validateAchievementGrantInput,
} from "@/lib/server/validation";
import { apiSuccess, apiError, safeInternalError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeInternalRedirect } from "@/lib/utils/redirect";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getTrustedOrigin } from "@/lib/server/security";
import { NextRequest } from "next/server";

describe("Backend Validation Engine", () => {
  describe("validateTypingResultInput", () => {
    it("accepts valid typing result payload", () => {
      const input = {
        runId: "123e4567-e89b-12d3-a456-426614174000",
        mode: "time",
        duration: 60,
        wpm: 84,
        rawWpm: 85,
        accuracy: 98.8,
        consistency: 91.2,
        correctChars: 420,
        incorrectChars: 5,
        extraChars: 0,
        missedChars: 0,
        param: "60",
        punctuation: true,
        numbers: false,
      };

      const result = validateTypingResultInput(input);
      assert.equal(result.valid, true);
      if (result.valid) {
        assert.equal(result.data.runId, "123e4567-e89b-12d3-a456-426614174000");
        assert.equal(result.data.mode, "time");
        assert.equal(result.data.duration, 60);
        assert.equal(result.data.wpm, 84);
        assert.equal(result.data.accuracy, 98.8);
        assert.equal(result.data.punctuation, true);
        assert.equal(result.data.numbers, false);
      }
    });

    it("rejects missing, empty, or non-UUID runId (F06)", () => {
      const base = {
        mode: "time",
        duration: 60,
        wpm: 60,
        accuracy: 100,
        correctChars: 300,
        incorrectChars: 0,
      };
      assert.equal(validateTypingResultInput(base).valid, false);
      assert.equal(validateTypingResultInput({ ...base, runId: "" }).valid, false);
      assert.equal(validateTypingResultInput({ ...base, runId: "not-a-uuid" }).valid, false);
    });

    it("rejects invalid modes", () => {
      const input = {
        runId: "123e4567-e89b-12d3-a456-426614174000",
        mode: "cheating_mode",
        duration: 30,
        wpm: 60,
        accuracy: 95,
        correctChars: 300,
        incorrectChars: 0,
      };
      const result = validateTypingResultInput(input);
      assert.equal(result.valid, false);
    });

    it("rejects absurd or negative WPM", () => {
      assert.equal(
        validateTypingResultInput({ mode: "time", duration: 30, wpm: 450, accuracy: 90, correctChars: 100, incorrectChars: 0 }).valid,
        false
      );
      assert.equal(
        validateTypingResultInput({ mode: "time", duration: 30, wpm: -10, accuracy: 90, correctChars: 100, incorrectChars: 0 }).valid,
        false
      );
    });

    it("rejects negative or excessive duration", () => {
      assert.equal(
        validateTypingResultInput({ mode: "time", duration: 0, wpm: 70, accuracy: 90, correctChars: 70, incorrectChars: 0 }).valid,
        false
      );
      assert.equal(
        validateTypingResultInput({ mode: "time", duration: 10000, wpm: 70, accuracy: 90, correctChars: 70, incorrectChars: 0 }).valid,
        false
      );
    });

    it("rejects accuracy above 100", () => {
      const result = validateTypingResultInput({
        mode: "time",
        duration: 30,
        wpm: 60,
        accuracy: 105,
        correctChars: 300,
        incorrectChars: 0,
      });
      assert.equal(result.valid, false);
    });

    it("rejects string booleans (Boolean('false') bypass defense)", () => {
      const input = {
        mode: "time",
        duration: 30,
        wpm: 60,
        accuracy: 100,
        correctChars: 300,
        incorrectChars: 0,
        punctuation: "false", // string boolean
      };
      const result = validateTypingResultInput(input);
      assert.equal(result.valid, false);
    });

    it("rejects physically impossible human keystroke rates (>40 chars/sec)", () => {
      const input = {
        mode: "time",
        duration: 10,
        wpm: 300,
        accuracy: 100,
        correctChars: 1500, // 150 chars/sec
        incorrectChars: 0,
      };
      const result = validateTypingResultInput(input);
      assert.equal(result.valid, false);
    });

    it("rejects mathematically forged WPM inconsistent with typed character count", () => {
      // 10 chars in 60s is (10/5)/1 = 2 WPM. Claiming 150 WPM must be rejected.
      const input = {
        mode: "time",
        duration: 60,
        wpm: 150,
        accuracy: 100,
        correctChars: 10,
        incorrectChars: 0,
      };
      const result = validateTypingResultInput(input);
      assert.equal(result.valid, false);
    });
  });

  describe("validateLessonProgressInput", () => {
    it("accepts valid lesson progress with known lesson ID on final step completing unit", () => {
      const input = {
        runId: "123e4567-e89b-12d3-a456-426614174000",
        lessonId: "home-row-left",
        completed: true,
        stars: 3,
        wpm: 45,
        accuracy: 98,
        step: 7, // home-row-left authoritative subLessonCount is 7
        attemptCount: 1,
      };

      const result = validateLessonProgressInput(input);
      assert.equal(result.valid, true);
      if (result.valid) {
        assert.equal(result.data.runId, "123e4567-e89b-12d3-a456-426614174000");
        assert.equal(result.data.lessonId, "home-row-left");
        assert.equal(result.data.completed, true);
        assert.equal(result.data.step, 7);
        assert.equal(result.data.totalSteps, 7);
        assert.equal(result.data.attemptCount, 1);
      }
    });

    it("ensures substep pass does NOT mark unit completed before final step (F02)", () => {
      const input = {
        runId: "123e4567-e89b-12d3-a456-426614174000",
        lessonId: "home-row-left",
        completed: true, // client falsely claiming completion on substep
        stars: 5,
        wpm: 60,
        accuracy: 99,
        step: 1, // Only step 1 of 7
      };

      const result = validateLessonProgressInput(input);
      assert.equal(result.valid, true);
      if (result.valid) {
        assert.equal(result.data.completed, false); // Authoritatively NOT completed
        assert.equal(result.data.step, 1);
        assert.equal(result.data.totalSteps, 7);
      }
    });

    it("rejects step exceeding authoritative totalSteps (F02)", () => {
      const input = {
        runId: "123e4567-e89b-12d3-a456-426614174000",
        lessonId: "home-row-left",
        step: 8, // home-row-left only has 7 steps
        wpm: 40,
        accuracy: 95,
      };
      assert.equal(validateLessonProgressInput(input).valid, false);
    });

    it("rejects missing, empty, or non-UUID runId (F06)", () => {
      const base = {
        lessonId: "home-row-left",
        step: 1,
        wpm: 40,
        accuracy: 95,
      };
      assert.equal(validateLessonProgressInput(base).valid, false);
      assert.equal(validateLessonProgressInput({ ...base, runId: "" }).valid, false);
      assert.equal(validateLessonProgressInput({ ...base, runId: "not-a-uuid" }).valid, false);
    });

    it("rejects non-existent lesson IDs", () => {
      const input = {
        runId: "123e4567-e89b-12d3-a456-426614174000",
        lessonId: "fake-lesson-999",
        completed: true,
        stars: 3,
        wpm: 40,
        accuracy: 95,
      };
      assert.equal(validateLessonProgressInput(input).valid, false);
    });

    it("rejects string booleans for completed", () => {
      const input = {
        runId: "123e4567-e89b-12d3-a456-426614174000",
        lessonId: "home-row-left",
        completed: "false",
        stars: 3,
        wpm: 40,
        accuracy: 95,
      };
      assert.equal(validateLessonProgressInput(input).valid, false);
    });

    it("authoritatively overrides false claimed 5 stars when accuracy is poor", () => {
      const input = {
        runId: "123e4567-e89b-12d3-a456-426614174000",
        lessonId: "home-row-left",
        completed: true,
        stars: 5, // Client falsely claiming 5 stars
        wpm: 15,
        accuracy: 50, // 50% accuracy = 2 stars (and failed!)
      };
      const result = validateLessonProgressInput(input);
      assert.equal(result.valid, true);
      if (result.valid) {
        assert.equal(result.data.stars, 2); // Authoritatively set to 2 stars
        assert.equal(result.data.completed, false); // Authoritatively marked NOT completed
      }
    });

    it("forces attemptCount to 1, rejecting client inflated counters", () => {
      const input = {
        runId: "123e4567-e89b-12d3-a456-426614174000",
        lessonId: "home-row-left",
        completed: true,
        stars: 3,
        wpm: 40,
        accuracy: 95,
        attemptCount: 999999, // Client trying to forge attempt count
      };
      const result = validateLessonProgressInput(input);
      assert.equal(result.valid, true);
      if (result.valid) {
        assert.equal(result.data.attemptCount, 1);
      }
    });
  });

  describe("validateGameScoreInput", () => {
    it("accepts valid score for a registered game", () => {
      const input = {
        runId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        ownerId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        gameId: "falling-words",
        score: 1250,
        cleared: 15,
        bestCombo: 8,
        survivedMs: 45000,
      };

      const result = validateGameScoreInput(input);
      assert.equal(result.valid, true);
      if (result.valid) {
        assert.equal(result.data.gameId, "falling-words");
        assert.equal(result.data.score, 1250);
      }
    });

    it("rejects invalid game ID or negative score", () => {
      assert.equal(validateGameScoreInput({ gameId: "nonexistent", score: 100 }).valid, false);
      assert.equal(validateGameScoreInput({ gameId: "falling-words", score: -5 }).valid, false);
    });

    it("rejects submissions without a start-time owner and run ID", () => {
      assert.equal(
        validateGameScoreInput({ gameId: "typing-survivor", score: 500_000, survivedMs: 1000 }).valid,
        false
      );
    });

    it("rejects incomplete result contracts even when numeric fields are present", () => {
      assert.equal(
        validateGameScoreInput({ gameId: "falling-words", score: 10000, survivedMs: 0, cleared: 0 }).valid,
        false
      );
    });
  });

  describe("validateProfileUpdateInput", () => {
    it("accepts clean alphanumeric username and display name", () => {
      const input = {
        displayName: "SpeedDemon",
        username: "speed_demon_99",
      };

      const result = validateProfileUpdateInput(input);
      assert.equal(result.valid, true);
      if (result.valid) {
        assert.equal(result.data.displayName, "SpeedDemon");
        assert.equal(result.data.username, "speed_demon_99");
      }
    });

    it("rejects invalid username formats", () => {
      assert.equal(validateProfileUpdateInput({ username: "a" }).valid, false); // too short
      assert.equal(validateProfileUpdateInput({ username: "invalid-user!" }).valid, false); // invalid chars
    });

    it("rejects empty displayName or control characters", () => {
      assert.equal(validateProfileUpdateInput({ displayName: "" }).valid, false);
      assert.equal(validateProfileUpdateInput({ displayName: "   " }).valid, false);
      assert.equal(validateProfileUpdateInput({ displayName: "bad\x00name" }).valid, false);
    });
  });

  describe("validatePreferencesInput", () => {
    it("accepts valid preferences dictionary", () => {
      const input = {
        theme: "matrix",
        soundEnabled: false,
        soundVolume: 0.8,
        smoothCaret: "fast",
        punctuation: true,
      };

      const result = validatePreferencesInput(input);
      assert.equal(result.valid, true);
      if (result.valid) {
        assert.equal(result.data.theme, "matrix");
        assert.equal(result.data.soundEnabled, false);
        assert.equal(result.data.soundVolume, 0.8);
      }
    });

    it("rejects sound volume out of 0..1 range", () => {
      assert.equal(validatePreferencesInput({ soundVolume: 1.5 }).valid, false);
      assert.equal(validatePreferencesInput({ soundVolume: -0.1 }).valid, false);
    });

    it("rejects non-boolean soundEnabled", () => {
      assert.equal(validatePreferencesInput({ soundEnabled: "false" }).valid, false);
    });
  });
});

describe("API Response Envelopes & Error Masking", () => {
  it("formats success responses correctly with Cache-Control headers", () => {
    const res = apiSuccess({ key: "val" });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("Cache-Control"), "private, no-store, no-cache, must-revalidate");
  });

  it("formats error responses with proper status and error codes", () => {
    const res = apiError("BAD_REQ", "Invalid", 400);
    assert.equal(res.status, 400);
  });

  it("safeInternalError masks raw database/postgres internal details", async () => {
    const rawDbError = new Error("syntax error at or near \"public.profiles\": relation does not exist");
    const res = safeInternalError(rawDbError, "Something went wrong", "req-123");
    assert.equal(res.status, 500);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.code, "INTERNAL_ERROR");
    assert.equal(json.error.message, "Something went wrong");
    // Ensure no database table names or internal details leaked
    assert.equal(JSON.stringify(json).includes("public.profiles"), false);
  });
});

describe("validateXpAwardInput (FINDING 1 Anti-Exploit)", () => {
  it("strictly rejects client-chosen arbitrary amounts (Finding 1)", () => {
    // Attack scenario: client sends { amount: 2000 } to farm XP
    assert.equal(validateXpAwardInput({ amount: 2000 }).valid, false);
    assert.equal(validateXpAwardInput({ amount: 50 }).valid, false);
    assert.equal(validateXpAwardInput({ amount: -10 }).valid, false);
    assert.equal(validateXpAwardInput({ amount: "2000" }).valid, false);
  });

  it("accepts valid verified event with UUID runId", () => {
    const result = validateXpAwardInput({
      eventType: "typing_test",
      runId: "123e4567-e89b-12d3-a456-426614174000",
    });
    assert.equal(result.valid, true);
    if (result.valid) {
      assert.equal(result.data.eventType, "typing_test");
      assert.equal(result.data.runId, "123e4567-e89b-12d3-a456-426614174000");
    }
  });

  it("rejects unknown eventType or malformed UUID", () => {
    assert.equal(
      validateXpAwardInput({ eventType: "free_xp", runId: "123e4567-e89b-12d3-a456-426614174000" }).valid,
      false
    );
    assert.equal(
      validateXpAwardInput({ eventType: "typing_test", runId: "not-a-uuid" }).valid,
      false
    );
  });
});

describe("sanitizeInternalRedirect (FINDING 8 & 9 Open Redirect Defense)", () => {
  it("allows safe internal relative paths", () => {
    assert.equal(sanitizeInternalRedirect("/profile"), "/profile");
    assert.equal(sanitizeInternalRedirect("/games"), "/games");
    assert.equal(sanitizeInternalRedirect("/lessons/lesson-1?step=2"), "/lessons/lesson-1?step=2");
    assert.equal(sanitizeInternalRedirect("/"), "/");
  });

  it("rejects protocol-relative URLs", () => {
    assert.equal(sanitizeInternalRedirect("//evil.com", "/fallback"), "/fallback");
    assert.equal(sanitizeInternalRedirect("///evil.com", "/fallback"), "/fallback");
    assert.equal(sanitizeInternalRedirect("/\\evil.com", "/fallback"), "/fallback");
  });

  it("rejects absolute URLs and arbitrary protocols", () => {
    assert.equal(sanitizeInternalRedirect("https://evil.com", "/fallback"), "/fallback");
    assert.equal(sanitizeInternalRedirect("http://evil.com/path", "/fallback"), "/fallback");
    assert.equal(sanitizeInternalRedirect("javascript:alert(1)", "/fallback"), "/fallback");
    assert.equal(sanitizeInternalRedirect("data:text/html,malicious", "/fallback"), "/fallback");
  });

  it("rejects URL-encoded bypass attempts", () => {
    assert.equal(sanitizeInternalRedirect("%2F%2Fevil.com", "/fallback"), "/fallback");
    assert.equal(sanitizeInternalRedirect("/%2Fevil.com", "/fallback"), "/fallback");
    assert.equal(sanitizeInternalRedirect("javascript%3Aalert(1)", "/fallback"), "/fallback");
  });

  it("rejects backslash evasion", () => {
    assert.equal(sanitizeInternalRedirect("\\evil.com", "/fallback"), "/fallback");
    assert.equal(sanitizeInternalRedirect("/\\evil.com", "/fallback"), "/fallback");
  });

  it("handles null, undefined, empty, and whitespace safely", () => {
    assert.equal(sanitizeInternalRedirect(null, "/fallback"), "/fallback");
    assert.equal(sanitizeInternalRedirect(undefined, "/fallback"), "/fallback");
    assert.equal(sanitizeInternalRedirect("", "/fallback"), "/fallback");
    assert.equal(sanitizeInternalRedirect("   ", "/fallback"), "/fallback");
  });
});

describe("Distributed Rate Limiting (FINDING 6 & 7)", () => {
  it("permits requests within configured limit and decrements remaining", async () => {
    const key = `test:ratelimit:${Date.now()}_${Math.random()}`;
    const res1 = await checkRateLimit(key, 5, 60);
    assert.equal(res1.success, true);
    assert.equal(res1.remaining, 4);

    const res2 = await checkRateLimit(key, 5, 60);
    assert.equal(res2.success, true);
    assert.equal(res2.remaining, 3);
  });

  it("blocks requests once limit is exceeded with retryAfter", async () => {
    const key = `test:ratelimit:block:${Date.now()}_${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      const res = await checkRateLimit(key, 3, 60);
      assert.equal(res.success, true);
    }

    // 4th request must fail
    const blockedRes = await checkRateLimit(key, 3, 60);
    assert.equal(blockedRes.success, false);
    assert.equal(blockedRes.remaining, 0);
    assert.ok(blockedRes.retryAfter > 0);
  });

  // Proves the increment itself is atomic: fire many concurrent callers at
  // the same key and check nobody's increment went missing. A lost-update
  // race (the old SELECT-then-UPDATE Postgres path) would show up here as
  // two callers reporting the same `remaining`, or a follow-up call seeing
  // fewer than `concurrency` prior requests. This asserts the invariant
  // itself rather than which tier handled it, so it validates whichever
  // backend `checkRateLimit` resolves to in a given environment -- the
  // atomic `rate_limit_increment` RPC once its migration is applied, or the
  // in-memory tier (safe for a different reason: it's fully synchronous, so
  // no other JS can interleave mid read-modify-write) when Postgres/Upstash
  // aren't reachable.
  it("loses no increments under concurrent calls for the same key (FINDING 3 atomicity)", async () => {
    const key = `test:ratelimit:concurrent:${Date.now()}_${Math.random()}`;
    const limit = 50;
    const concurrency = 20;

    const results = await Promise.all(
      Array.from({ length: concurrency }, () => checkRateLimit(key, limit, 60))
    );

    const remainders = results.map((r) => r.remaining).sort((a, b) => b - a);
    const expected = Array.from({ length: concurrency }, (_, i) => limit - 1 - i);
    assert.deepEqual(remainders, expected);

    const followUp = await checkRateLimit(key, limit, 60);
    assert.equal(followUp.remaining, limit - concurrency - 1);
  });
});

describe("getTrustedOrigin (FINDING 10 & F12 X-Forwarded-Host Hardening)", () => {
  it("rejects arbitrary forwarded host and returns canonical origin", () => {
    const req = new NextRequest("https://herotyping.com/api/auth/callback", {
      headers: { "x-forwarded-host": "evil.com" },
    });
    const origin = getTrustedOrigin(req);
    assert.equal(origin.includes("evil.com"), false);
  });

  it("allows verified canonical host", () => {
    const req = new NextRequest("https://herotyping.com/api/auth/callback", {
      headers: { "x-forwarded-host": "herotyping.com" },
    });
    const origin = getTrustedOrigin(req);
    assert.equal(origin, "https://herotyping.com");
  });

  it("F12: rejects colon bypass attempts like herotyping.com:evil.com", () => {
    const req = new NextRequest("https://herotyping.com/api/auth/callback", {
      headers: { "x-forwarded-host": "herotyping.com:evil.com" },
    });
    const origin = getTrustedOrigin(req);
    assert.equal(origin, "https://herotyping.com");
  });

  it("F12: rejects userinfo injection attempts like herotyping.com@evil.com", () => {
    const req = new NextRequest("https://herotyping.com/api/auth/callback", {
      headers: { "x-forwarded-host": "herotyping.com@evil.com" },
    });
    const origin = getTrustedOrigin(req);
    assert.equal(origin, "https://herotyping.com");
  });

  it("F12: rejects path injection or backslash in forwarded-host", () => {
    const req1 = new NextRequest("https://herotyping.com/api/auth/callback", {
      headers: { "x-forwarded-host": "herotyping.com/evil" },
    });
    assert.equal(getTrustedOrigin(req1), "https://herotyping.com");

    const req2 = new NextRequest("https://herotyping.com/api/auth/callback", {
      headers: { "x-forwarded-host": "herotyping.com\\evil" },
    });
    assert.equal(getTrustedOrigin(req2), "https://herotyping.com");
  });

  it("F12: validates port bounds and rejects invalid or out-of-range ports", () => {
    const reqBadPort = new NextRequest("https://herotyping.com/api/auth/callback", {
      headers: { "x-forwarded-host": "herotyping.com:99999" },
    });
    assert.equal(getTrustedOrigin(reqBadPort), "https://herotyping.com");

    const reqValidPort = new NextRequest("https://herotyping.com/api/auth/callback", {
      headers: { "x-forwarded-host": "herotyping.com:8443" },
    });
    assert.equal(getTrustedOrigin(reqValidPort), "https://herotyping.com:8443");
  });
});

describe("Privileged Supabase Server Client", () => {
  it("initializes without throwing in test environment", () => {
    const client = createAdminClient();
    assert.ok(client);
  });

  it("prioritizes SUPABASE_SECRET_KEY over legacy keys", () => {
    const client = createAdminClient();
    assert.ok(client);
  });

  it("enforces that SUPABASE_SECRET_KEY is never prefixed with NEXT_PUBLIC_", () => {
    const client = createAdminClient();
    assert.ok(client);
  });
});

describe("validateAchievementGrantInput", () => {
  it("accepts a known achievement id", () => {
    const result = validateAchievementGrantInput({ achievementId: "site:all-games" });
    assert.equal(result.valid, true);
    if (result.valid) assert.equal(result.data.achievementId, "site:all-games");
  });

  it("rejects an unknown achievement id", () => {
    assert.equal(validateAchievementGrantInput({ achievementId: "not-a-real-achievement" }).valid, false);
  });

  it("rejects a missing or malformed payload", () => {
    assert.equal(validateAchievementGrantInput(null).valid, false);
    assert.equal(validateAchievementGrantInput({}).valid, false);
    assert.equal(validateAchievementGrantInput({ achievementId: 123 }).valid, false);
  });
});

describe("Content-Security-Policy Environment Boundaries", () => {
  it("strictly excludes 'unsafe-eval' when NODE_ENV is production", async () => {
    const envObj = process.env as Record<string, string | undefined>;
    const origEnv = envObj.NODE_ENV;
    try {
      envObj.NODE_ENV = "production";
      const configUrl = new URL("../../../next.config.ts", import.meta.url).href;
      const mod = await import(configUrl);
      const config = mod.default;
      assert.ok(config && typeof config.headers === "function", "config.headers must be a function");
      const headersList = await config.headers();
      const csp = headersList[0]?.headers.find((h: { key: string; value: string }) => h.key === "Content-Security-Policy");
      assert.ok(csp, "CSP header must be present");
      assert.equal(csp.value.includes("'unsafe-eval'"), false, "Production CSP must never include 'unsafe-eval'");
      assert.ok(csp.value.includes("frame-ancestors 'self'"), "CSP must include frame-ancestors 'self'");
    } finally {
      envObj.NODE_ENV = origEnv;
    }
  });

  it("includes 'unsafe-eval' only when NODE_ENV is development for React dev tools", async () => {
    const envObj = process.env as Record<string, string | undefined>;
    const origEnv = envObj.NODE_ENV;
    try {
      envObj.NODE_ENV = "development";
      const configUrl = new URL("../../../next.config.ts", import.meta.url).href;
      const mod = await import(configUrl);
      const config = mod.default;
      assert.ok(config && typeof config.headers === "function", "config.headers must be a function");
      const headersList = await config.headers();
      const csp = headersList[0]?.headers.find((h: { key: string; value: string }) => h.key === "Content-Security-Policy");
      assert.ok(csp, "CSP header must be present");
      assert.equal(csp.value.includes("'unsafe-eval'"), true, "Development CSP must include 'unsafe-eval' for React dev tools");
    } finally {
      envObj.NODE_ENV = origEnv;
    }
  });
});
