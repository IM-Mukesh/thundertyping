import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { saveLessonProgress, LessonPrerequisiteError, LessonStepSequenceError } from "@/lib/server/lesson-progress";
import { validateLessonProgressInput } from "@/lib/server/validation";

describe("P1 Security: Lesson Progress Integrity & Curriculum Prerequisites", () => {
  const userId = "00000000-0000-4000-8000-000000000001";
  const originalFetch = globalThis.fetch;

  const inMemoryAttempts = new Map<string, Record<string, unknown>>();
  const inMemoryProgress = new Map<string, Record<string, unknown>>();

  beforeEach(() => {
    inMemoryAttempts.clear();
    inMemoryProgress.clear();

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || "GET";

      if (url.includes("/lesson_attempts")) {
        if (method === "GET") {
          const match = url.match(/id=eq\.([a-f0-9-]+)/);
          const id = match ? match[1] : null;
          const attempt = id ? inMemoryAttempts.get(id) : null;
          return new Response(JSON.stringify(attempt ? [attempt] : []), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (method === "POST") {
          const body = JSON.parse(String(init?.body || "{}"));
          inMemoryAttempts.set(body.id, body);
          return new Response(JSON.stringify([body]), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      if (url.includes("/lesson_progress")) {
        if (method === "GET") {
          const match = url.match(/lesson_id=eq\.([a-zA-Z0-9-]+)/);
          const lessonId = match ? match[1] : null;
          const progress = lessonId ? inMemoryProgress.get(`${userId}:${lessonId}`) : null;
          return new Response(JSON.stringify(progress ? [progress] : []), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (method === "POST" || method === "PATCH" || method === "PUT") {
          const body = JSON.parse(String(init?.body || "{}"));
          const key = `${userId}:${body.lesson_id || "home-row-left"}`;
          const updated = {
            ...inMemoryProgress.get(key),
            ...body,
            updated_at: new Date().toISOString(),
          };
          inMemoryProgress.set(key, updated);
          return new Response(JSON.stringify([updated]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      if (url.includes("/settlement_receipts")) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/player_streaks")) {
        return new Response(
          JSON.stringify([{ user_id: userId, total_xp: 50, updated_at: new Date().toISOString() }]),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (url.includes("/daily_stats")) {
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

  describe("Validation & Physical Keystroke Bounds", () => {
    it("rejects impossibly fast lesson attempt (<1000ms)", () => {
      const input = {
        runId: "11111111-1111-4111-8111-111111111111",
        lessonId: "home-row-left",
        completed: false,
        stars: 3,
        wpm: 45,
        accuracy: 95,
        attemptCount: 1,
        step: 1,
        totalSteps: 7,
        typedChars: 30,
        correctChars: 29,
        incorrectChars: 1,
        elapsedMs: 500, // < 1000ms is physically impossible
      };
      const res = validateLessonProgressInput(input);
      assert.equal(res.valid, false);
      assert.match(res.message, /elapsedMs must be at least 1000ms/);
    });

    it("rejects impossibly few typed characters (<5)", () => {
      const input = {
        runId: "22222222-2222-4222-8222-222222222222",
        lessonId: "home-row-left",
        completed: false,
        stars: 3,
        wpm: 45,
        accuracy: 95,
        attemptCount: 1,
        step: 1,
        totalSteps: 7,
        typedChars: 2, // < 5 is invalid
        correctChars: 2,
        incorrectChars: 0,
        elapsedMs: 2000,
      };
      const res = validateLessonProgressInput(input);
      assert.equal(res.valid, false);
      assert.match(res.message, /typedChars must be at least 5/);
    });

    it("rejects impossible typing speed (>40 CPS)", () => {
      const input = {
        runId: "33333333-3333-4333-8333-333333333333",
        lessonId: "home-row-left",
        completed: false,
        stars: 3,
        wpm: 45,
        accuracy: 95,
        attemptCount: 1,
        step: 1,
        totalSteps: 7,
        typedChars: 100,
        correctChars: 98,
        incorrectChars: 2,
        elapsedMs: 1500, // 100 chars in 1.5s = 66.7 CPS (>40 CPS)
      };
      const res = validateLessonProgressInput(input);
      assert.equal(res.valid, false);
      assert.match(res.message, /Typing speed exceeds maximum possible human keystroke rate/);
    });
  });

  describe("Curriculum Prerequisite & Step Ordering Invariants", () => {
    it("rejects attempting an advanced lesson when previous curriculum lesson is not completed", async () => {
      const input = {
        runId: "44444444-4444-4444-8444-444444444444",
        lessonId: "graduation",
        completed: false,
        stars: 3,
        wpm: 45,
        accuracy: 95,
        attemptCount: 1,
        step: 1,
        totalSteps: 7,
        typedChars: 35,
        correctChars: 34,
        incorrectChars: 1,
        elapsedMs: 15000,
      };
      const validation = validateLessonProgressInput(input);
      assert.equal(validation.valid, true);

      // Must reject because user has not completed previous lesson
      await assert.rejects(
        () => saveLessonProgress(userId, validation.data),
        (err: Error) => {
          assert.ok(err instanceof LessonPrerequisiteError);
          assert.match(err.message, /Curriculum prerequisite not met/);
          return true;
        }
      );
    });

    it("rejects skipping steps within a lesson (attempting step 5 when step 1 is not passed)", async () => {
      const input = {
        runId: "55555555-5555-4555-8555-555555555555",
        lessonId: "home-row-left", // Lesson 1 (no curriculum prerequisite)
        completed: false,
        stars: 3,
        wpm: 45,
        accuracy: 95,
        attemptCount: 1,
        step: 5, // Jumping straight to step 5 without completing steps 1-4!
        totalSteps: 7,
        typedChars: 35,
        correctChars: 34,
        incorrectChars: 1,
        elapsedMs: 15000,
      };
      const validation = validateLessonProgressInput(input);
      assert.equal(validation.valid, true);

      // Must reject step skipping
      await assert.rejects(
        () => saveLessonProgress(userId, validation.data),
        (err: Error) => {
          assert.ok(err instanceof LessonStepSequenceError);
          assert.match(err.message, /Step prerequisite not met/);
          return true;
        }
      );
    });

    it("guest-imported progress does not award verified cloud XP", async () => {
      const input = {
        runId: "66666666-6666-4666-8666-666666666666",
        lessonId: "home-row-left",
        completed: false,
        stars: 3,
        wpm: 45,
        accuracy: 95,
        attemptCount: 1,
        step: 1,
        totalSteps: 7,
        typedChars: 35,
        correctChars: 34,
        incorrectChars: 1,
        elapsedMs: 15000,
        isGuestImport: true, // Marked as imported guest progress
      };
      const validation = validateLessonProgressInput(input);
      assert.equal(validation.valid, true);
      assert.equal(validation.data.isGuestImport, true);

      const saved = await saveLessonProgress(userId, validation.data);
      assert.equal(saved.earnedXp, 0, "Guest-imported progress must NOT award cloud XP");
      assert.equal(saved.verified, false);
      assert.equal(saved.trustTier, "imported");
    });

    it("guest-imported progress cannot bypass curriculum prerequisites", async () => {
      const input = {
        runId: "77777777-7777-4777-8777-777777777777",
        lessonId: "home-row-right", // Lesson 2 (requires Lesson 1)
        completed: false,
        stars: 3,
        wpm: 45,
        accuracy: 95,
        attemptCount: 1,
        step: 1,
        totalSteps: 7,
        typedChars: 35,
        correctChars: 34,
        incorrectChars: 1,
        elapsedMs: 15000,
        isGuestImport: true,
      };
      const validation = validateLessonProgressInput(input);
      assert.equal(validation.valid, true);

      // Must reject because Lesson 1 was never completed in the DB
      await assert.rejects(
        () => saveLessonProgress(userId, validation.data),
        (err: Error) => {
          assert.ok(err instanceof LessonPrerequisiteError);
          assert.match(err.message, /Curriculum prerequisite not met/);
          return true;
        }
      );
    });

    it("repeated guest imports do not duplicate attempts or grant rewards", async () => {
      const runId = "88888888-8888-4888-8888-888888888888";
      const input = {
        runId,
        lessonId: "home-row-left",
        completed: false,
        stars: 3,
        wpm: 45,
        accuracy: 95,
        attemptCount: 1,
        step: 1,
        totalSteps: 7,
        typedChars: 35,
        correctChars: 34,
        incorrectChars: 1,
        elapsedMs: 15000,
        isGuestImport: true,
      };
      const validation = validateLessonProgressInput(input);
      assert.equal(validation.valid, true);

      const first = await saveLessonProgress(userId, validation.data);
      assert.equal(first.earnedXp, 0);

      // Second identical import
      const second = await saveLessonProgress(userId, validation.data);
      assert.equal(second.idempotent, true, "Duplicate import must be idempotent");
      assert.equal(second.earnedXp, 0);
    });
  });
});
