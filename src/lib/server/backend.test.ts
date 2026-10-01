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
import { apiSuccess, apiError } from "@/lib/server/errors";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";

describe("Backend Validation Engine", () => {
  describe("validateTypingResultInput", () => {
    it("accepts valid typing result payload", () => {
      const input = {
        mode: "time",
        duration: 60,
        wpm: 85.5,
        rawWpm: 92.1,
        accuracy: 98.4,
        consistency: 91.2,
        correctChars: 420,
        incorrectChars: 5,
        extraChars: 0,
        missedChars: 2,
        param: "60",
        punctuation: true,
        numbers: false,
      };

      const result = validateTypingResultInput(input);
      assert.equal(result.valid, true);
      if (result.valid) {
        assert.equal(result.data.mode, "time");
        assert.equal(result.data.duration, 60);
        assert.equal(result.data.wpm, 85.5);
        assert.equal(result.data.accuracy, 98.4);
        assert.equal(result.data.punctuation, true);
        assert.equal(result.data.numbers, false);
      }
    });

    it("rejects invalid modes", () => {
      const input = {
        mode: "cheating_mode",
        duration: 30,
        wpm: 60,
        accuracy: 95,
      };
      const result = validateTypingResultInput(input);
      assert.equal(result.valid, false);
    });

    it("rejects absurd or negative WPM", () => {
      assert.equal(validateTypingResultInput({ mode: "time", duration: 30, wpm: 450, accuracy: 90 }).valid, false);
      assert.equal(validateTypingResultInput({ mode: "time", duration: 30, wpm: -10, accuracy: 90 }).valid, false);
    });

    it("rejects negative or excessive duration", () => {
      assert.equal(validateTypingResultInput({ mode: "time", duration: 0, wpm: 70, accuracy: 90 }).valid, false);
      assert.equal(validateTypingResultInput({ mode: "time", duration: 10000, wpm: 70, accuracy: 90 }).valid, false);
    });

    it("rejects accuracy above 100", () => {
      const result = validateTypingResultInput({ mode: "time", duration: 30, wpm: 60, accuracy: 105 });
      assert.equal(result.valid, false);
    });
  });

  describe("validateLessonProgressInput", () => {
    it("accepts valid lesson progress with known lesson ID", () => {
      const input = {
        lessonId: "home-row-left",
        completed: true,
        stars: 3,
        wpm: 45,
        accuracy: 98,
        attemptCount: 2,
      };

      const result = validateLessonProgressInput(input);
      assert.equal(result.valid, true);
      if (result.valid) {
        assert.equal(result.data.lessonId, "home-row-left");
        assert.equal(result.data.stars, 3);
        assert.equal(result.data.completed, true);
      }
    });

    it("rejects non-existent lesson IDs", () => {
      const input = {
        lessonId: "fake-lesson-999",
        completed: true,
        stars: 3,
        wpm: 40,
        accuracy: 95,
      };
      const result = validateLessonProgressInput(input);
      assert.equal(result.valid, false);
    });

    it("rejects stars greater than 5 or non-integers", () => {
      assert.equal(validateLessonProgressInput({ lessonId: "home-row-1", stars: 6, wpm: 40, accuracy: 95 }).valid, false);
      assert.equal(validateLessonProgressInput({ lessonId: "home-row-1", stars: 3.5, wpm: 40, accuracy: 95 }).valid, false);
    });
  });

  describe("validateGameScoreInput", () => {
    it("accepts valid score for a registered game", () => {
      const input = {
        gameId: "word-rain",
        score: 12500,
        cleared: 35,
        bestCombo: 12,
        survivedMs: 75000,
        wpm: 55,
        accuracy: 96,
      };

      const result = validateGameScoreInput(input);
      assert.equal(result.valid, true);
      if (result.valid) {
        assert.equal(result.data.gameId, "word-rain");
        assert.equal(result.data.score, 12500);
        assert.equal(result.data.cleared, 35);
      }
    });

    it("rejects invalid game ID or negative score", () => {
      assert.equal(validateGameScoreInput({ gameId: "not-a-game", score: 500 }).valid, false);
      assert.equal(validateGameScoreInput({ gameId: "word-rain", score: -50 }).valid, false);
    });

    it("rejects excessive runaway score exploitation", () => {
      assert.equal(validateGameScoreInput({ gameId: "word-rain", score: 100_000_000 }).valid, false);
    });
  });

  describe("validateProfileUpdateInput", () => {
    it("accepts clean alphanumeric username and display name", () => {
      const input = {
        displayName: "Typing Hero",
        username: "hero_typist_42",
      };

      const result = validateProfileUpdateInput(input);
      assert.equal(result.valid, true);
      if (result.valid) {
        assert.equal(result.data.displayName, "Typing Hero");
        assert.equal(result.data.username, "hero_typist_42");
      }
    });

    it("rejects invalid username formats", () => {
      // Too short
      assert.equal(validateProfileUpdateInput({ username: "ab" }).valid, false);
      // Disallowed special chars
      assert.equal(validateProfileUpdateInput({ username: "bad@user!" }).valid, false);
      // Too long (>24 chars)
      assert.equal(validateProfileUpdateInput({ username: "a_very_long_username_exceeding_twenty_four" }).valid, false);
    });

    it("rejects empty displayName", () => {
      assert.equal(validateProfileUpdateInput({ displayName: "   " }).valid, false);
    });
  });

  describe("validatePreferencesInput", () => {
    it("accepts valid preferences dictionary", () => {
      const input = {
        theme: "cyberpunk",
        soundEnabled: true,
        soundVolume: 0.75,
        defaultTestMode: "time",
        defaultTestDuration: 60,
        punctuation: true,
      };

      const result = validatePreferencesInput(input);
      assert.equal(result.valid, true);
      if (result.valid) {
        assert.equal(result.data.theme, "cyberpunk");
        assert.equal(result.data.soundVolume, 0.75);
        assert.equal(result.data.punctuation, true);
      }
    });

    it("rejects sound volume out of 0..1 range", () => {
      assert.equal(validatePreferencesInput({ soundVolume: 1.5 }).valid, false);
      assert.equal(validatePreferencesInput({ soundVolume: -0.2 }).valid, false);
    });
  });
});

describe("API Response Envelopes", () => {
  it("formats success responses correctly", async () => {
    const res = apiSuccess({ hello: "world" }, 201);
    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.deepEqual(json.data, { hello: "world" });
  });

  it("formats error responses with proper status and error codes", async () => {
    const res = apiError("UNAUTHORIZED", "Authentication required", 401);
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.code, "UNAUTHORIZED");
    assert.equal(json.error.message, "Authentication required");
  });
});

describe("Supabase Browser Client", () => {
  it("initializes without throwing in non-browser test environment", () => {
    const client = getSupabaseBrowserClient();
    assert.ok(client);
    assert.ok(client.auth);
  });
});

describe("Privileged Supabase Server Client", () => {
  it("initializes without throwing in test environment", () => {
    const admin = createAdminClient();
    assert.ok(admin);
    assert.ok(admin.auth);
  });

  it("prioritizes SUPABASE_SECRET_KEY over legacy keys", () => {
    const originalSecret = process.env.SUPABASE_SECRET_KEY;
    const originalServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
      process.env.SUPABASE_SECRET_KEY = "sb_secret_test_key_model_primary";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "legacy_service_role_secondary";

      const admin = createAdminClient();
      assert.ok(admin);
    } finally {
      process.env.SUPABASE_SECRET_KEY = originalSecret;
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRole;
    }
  });

  it("enforces that SUPABASE_SECRET_KEY is never prefixed with NEXT_PUBLIC_", () => {
    const secretKeyName = "SUPABASE_SECRET_KEY";
    assert.equal(secretKeyName.startsWith("NEXT_PUBLIC_"), false);
  });

  it("throws a descriptive error when no secret key is configured", () => {
    const env = process.env as Record<string, string | undefined>;
    const originalSecret = env.SUPABASE_SECRET_KEY;
    const originalService = env.SUPABASE_SERVICE_ROLE_KEY;

    try {
      delete env.SUPABASE_SECRET_KEY;
      delete env.SUPABASE_SERVICE_ROLE_KEY;

      assert.throws(
        () => createAdminClient(),
        /Missing Supabase admin key: SUPABASE_SECRET_KEY is not configured/
      );
    } finally {
      if (originalSecret !== undefined) env.SUPABASE_SECRET_KEY = originalSecret;
      if (originalService !== undefined) env.SUPABASE_SERVICE_ROLE_KEY = originalService;
    }
  });

  it("throws a descriptive error when NEXT_PUBLIC_SUPABASE_URL is missing in admin client", () => {
    const env = process.env as Record<string, string | undefined>;
    const originalUrl = env.NEXT_PUBLIC_SUPABASE_URL;

    try {
      delete env.NEXT_PUBLIC_SUPABASE_URL;

      assert.throws(
        () => createAdminClient(),
        /Missing Supabase admin URL: NEXT_PUBLIC_SUPABASE_URL is not defined/
      );
    } finally {
      if (originalUrl !== undefined) env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    }
  });

  it("throws a descriptive error when NEXT_PUBLIC_SUPABASE_URL is missing in browser client", () => {
    const env = process.env as Record<string, string | undefined>;
    const originalUrl = env.NEXT_PUBLIC_SUPABASE_URL;

    try {
      delete env.NEXT_PUBLIC_SUPABASE_URL;

      assert.throws(
        () => getSupabaseBrowserClient(),
        /Missing Supabase browser environment variable: NEXT_PUBLIC_SUPABASE_URL is not defined/
      );
    } finally {
      if (originalUrl !== undefined) env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    }
  });
});

describe("validateXpAwardInput", () => {
  it("accepts a positive integer amount", () => {
    const result = validateXpAwardInput({ amount: 50 });
    assert.equal(result.valid, true);
    if (result.valid) assert.equal(result.data.amount, 50);
  });

  it("rejects zero, negative, non-integer, and absurdly large amounts", () => {
    assert.equal(validateXpAwardInput({ amount: 0 }).valid, false);
    assert.equal(validateXpAwardInput({ amount: -5 }).valid, false);
    assert.equal(validateXpAwardInput({ amount: 12.5 }).valid, false);
    assert.equal(validateXpAwardInput({ amount: 5000 }).valid, false);
  });

  it("rejects a missing or malformed payload", () => {
    assert.equal(validateXpAwardInput(null).valid, false);
    assert.equal(validateXpAwardInput({}).valid, false);
    assert.equal(validateXpAwardInput({ amount: "50" }).valid, false);
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

