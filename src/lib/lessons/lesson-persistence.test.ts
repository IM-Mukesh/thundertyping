import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import { setCurrentUserId } from "@/lib/auth/current-user";
import {
  useLessonProgressStore,
  getLessonOutbox,
  flushLessonOutbox,
  sendLessonOutboxItem,
  primeCloudLessonProgress,
  restoreLocalLessonProgress,
  getAccountStorageKey,
  type LessonOutboxItem,
} from "@/lib/lessons/lesson-progress-store";
import { normalizeLanguageCode } from "@/lib/i18n/config";

const originalFetch = globalThis.fetch;

describe("Lesson Progress Persistence & Outbox Synchronization", () => {
  beforeEach(() => {
    setCurrentUserId(null);
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
    useLessonProgressStore.getState().resetProgress();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    setCurrentUserId(null);
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it("normalizes language codes consistently across case variants", () => {
    assert.equal(normalizeLanguageCode("pt-br"), "pt-BR");
    assert.equal(normalizeLanguageCode("pt-BR"), "pt-BR");
    assert.equal(normalizeLanguageCode("pt_br"), "pt-BR");
    assert.equal(normalizeLanguageCode("ES"), "es");
    assert.equal(normalizeLanguageCode("de"), "de");
    assert.equal(normalizeLanguageCode(""), "en");
    assert.equal(normalizeLanguageCode(null), "en");
    assert.equal(normalizeLanguageCode(undefined), "en");
    assert.equal(normalizeLanguageCode("unknown"), "en");
  });

  it("guest attempt persists directly to guest localStorage key without outbox queue", () => {
    setCurrentUserId(null);
    const store = useLessonProgressStore.getState();

    const outcome = store.recordAttempt("home-row-left", {
      step: 1,
      totalSteps: 1,
      accuracy: 96,
      wpm: 45,
      typedChars: 50,
      correctChars: 48,
      incorrectChars: 2,
      elapsedMs: 12000,
      minAccuracy: 60,
      stars: 4,
    });

    assert.equal(outcome.passed, true);
    assert.equal(outcome.unitCompleted, true);

    const guestKey = getAccountStorageKey(null);
    assert.equal(guestKey, "thundertyping-lesson-progress");

    const raw = window.localStorage.getItem(guestKey);
    assert.ok(raw, "Guest localStorage must have stored progress");
    const parsed = JSON.parse(raw);
    const savedUnits = parsed.state?.units ?? parsed.units;
    assert.equal(savedUnits["home-row-left"]?.completed, true);
    assert.equal(savedUnits["home-row-left"]?.bestStars, 4);

    // Guest should have zero outbox items
    assert.equal(getLessonOutbox("guest").length, 0);
  });

  it("authenticated attempt stores snapshot in account-scoped key and enqueues to outbox", async () => {
    const userId = "test-user-persist-1";
    setCurrentUserId(userId);

    let fetchCalled = false;
    let fetchKeepalive = false;
    let requestPayload: unknown = null;

    globalThis.fetch = async (url, init) => {
      if (String(url).includes("/api/lessons/progress") && init?.method === "POST") {
        fetchCalled = true;
        fetchKeepalive = Boolean(init.keepalive);
        requestPayload = JSON.parse(String(init.body));
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { totalXp: 150 } }),
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({ success: true, data: [] }) } as Response;
    };

    const outcome = useLessonProgressStore.getState().recordAttempt("home-row-left", {
      step: 1,
      totalSteps: 1,
      accuracy: 98,
      wpm: 50,
      typedChars: 50,
      correctChars: 49,
      incorrectChars: 1,
      elapsedMs: 10000,
      minAccuracy: 60,
      stars: 5,
    });

    assert.equal(outcome.passed, true);
    assert.equal(outcome.unitCompleted, true);

    // Await save promise
    const saveResult = await outcome.savePromise;
    assert.equal(saveResult?.success, true);
    assert.equal(fetchCalled, true);
    assert.equal(fetchKeepalive, true, "fetch MUST specify keepalive: true so browser navigation does not abort it");

    // Check account-scoped snapshot
    const accountKey = getAccountStorageKey(userId);
    assert.equal(accountKey, `thundertyping-lesson-progress:account:${userId}`);
    const raw = window.localStorage.getItem(accountKey);
    assert.ok(raw);
    const parsed = JSON.parse(raw);
    assert.equal(parsed.state?.units["home-row-left"]?.completed, true);

    // Outbox should be drained after successful 200 response
    const remainingOutbox = getLessonOutbox(userId);
    assert.equal(remainingOutbox.length, 0);

    const payload = requestPayload as Record<string, unknown>;
    assert.equal(payload.lessonId, "home-row-left");
    assert.equal(payload.stars, 5);
    assert.equal(payload.completed, true);
  });

  it("offline or network failure leaves attempt in outbox; flushLessonOutbox retries upon reconnection", async () => {
    const userId = "test-user-offline-retry";
    setCurrentUserId(userId);

    let networkOnline = false;
    let postAttempts = 0;

    globalThis.fetch = async (url, init) => {
      if (String(url).includes("/api/lessons/progress") && init?.method === "POST") {
        postAttempts++;
        if (!networkOnline) {
          throw new Error("Failed to fetch (offline simulation)");
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { totalXp: 100 } }),
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({ success: true, data: [] }) } as Response;
    };

    // User completes a lesson while offline
    const outcome = useLessonProgressStore.getState().recordAttempt("home-row-left", {
      step: 1,
      totalSteps: 1,
      accuracy: 94,
      wpm: 40,
      typedChars: 50,
      correctChars: 47,
      incorrectChars: 3,
      elapsedMs: 12000,
      minAccuracy: 60,
      stars: 4,
    });

    await outcome.savePromise;
    assert.equal(postAttempts, 1);

    // Attempt remains in outbox because network failed
    const outboxAfterFailure = getLessonOutbox(userId);
    assert.equal(outboxAfterFailure.length, 1);
    assert.equal(outboxAfterFailure[0].lessonId, "home-row-left");

    // Account storage still has the completed lesson locally
    assert.equal(useLessonProgressStore.getState().units["home-row-left"]?.completed, true);

    // Network comes back online
    networkOnline = true;
    await flushLessonOutbox(userId);

    assert.equal(postAttempts, 2);
    // Outbox is now drained
    assert.equal(getLessonOutbox(userId).length, 0);
  });

  it("server 409 conflict / idempotent replay removes attempt from outbox safely", async () => {
    const userId = "test-user-conflict";
    setCurrentUserId(userId);

    const testItem: LessonOutboxItem = {
      runId: "11111111-2222-4333-8444-555555555555",
      lessonId: "home-row-left",
      languageCode: "en",
      completed: true,
      stars: 5,
      wpm: 50,
      accuracy: 98,
      attemptCount: 1,
      step: 1,
      totalSteps: 1,
      typedChars: 50,
      correctChars: 49,
      incorrectChars: 1,
      elapsedMs: 10000,
      createdAt: Date.now(),
      retryCount: 0,
      userId,
    };

    globalThis.fetch = async () => ({
      ok: false,
      status: 409,
      json: async () => ({ success: true, error: "Run ID already recorded", data: { idempotent: true } }),
    } as unknown as Response);

    const res = await sendLessonOutboxItem(testItem);
    assert.equal(res.success, true);
    assert.equal(res.idempotent, true);
  });

  it("primeCloudLessonProgress preserves cached units if cloud fetch fails (no blank slate wipe)", async () => {
    const userId = "test-user-resilient-hydration";
    setCurrentUserId(userId);

    // Seed local cache
    useLessonProgressStore.getState().replaceCloudUnits([{
      lesson_id: "home-row-left",
      completed: true,
      stars: 5,
      best_wpm: 50,
      best_accuracy: 98,
      pass_count: 1,
      attempt_count: 1,
      current_step: 1,
    }]);

    assert.equal(useLessonProgressStore.getState().units["home-row-left"]?.completed, true);

    // Network fails when loading cloud
    globalThis.fetch = async () => {
      throw new Error("503 Service Unavailable");
    };

    await primeCloudLessonProgress({ force: true });

    // Store must NOT be wiped to empty!
    const state = useLessonProgressStore.getState();
    assert.equal(state.units["home-row-left"]?.completed, true, "Progress must not be erased when cloud fetch fails");
    assert.equal(state.syncStatus, "error");
  });

  it("guest-to-authenticated transition migrates guest completed lessons to signed-in user", async () => {
    // 1. Guest completes lesson 1
    setCurrentUserId(null);
    useLessonProgressStore.getState().recordAttempt("home-row-left", {
      step: 1,
      totalSteps: 1,
      accuracy: 95,
      wpm: 40,
      typedChars: 50,
      correctChars: 48,
      incorrectChars: 2,
      elapsedMs: 11000,
      minAccuracy: 60,
      stars: 4,
    });

    assert.equal(useLessonProgressStore.getState().units["home-row-left"]?.completed, true);

    // 2. User signs in
    const newUserId = "brand-new-user-123";
    let postedPayload: Record<string, unknown> | null = null;

    globalThis.fetch = async (url, init) => {
      if (String(url).includes("/api/lessons/progress")) {
        if (init?.method === "POST") {
          postedPayload = JSON.parse(String(init.body));
          return { ok: true, status: 200, json: async () => ({ success: true, data: { totalXp: 90 } }) } as Response;
        }
        // Cloud returns empty for fresh user
        return { ok: true, status: 200, json: async () => ({ success: true, data: [] }) } as Response;
      }
      return { ok: true, status: 200, json: async () => ({ success: true }) } as Response;
    };

    setCurrentUserId(newUserId);
    await primeCloudLessonProgress({ force: true });

    // Verify guest lesson was synced to the newly signed-in user
    assert.ok(postedPayload, "Guest completed lesson should be sent to cloud upon sign in");
    const payload = postedPayload as Record<string, unknown>;
    assert.equal(payload.lessonId, "home-row-left");
    assert.equal(payload.completed, true);

    // The user's active units now include home-row-left
    const userUnits = useLessonProgressStore.getState().units;
    assert.equal(userUnits["home-row-left"]?.completed, true);
  });

  it("account isolation: user A, user B, and guest maintain distinct data stores", () => {
    // 1. Guest sets progress
    setCurrentUserId(null);
    useLessonProgressStore.getState().recordAttempt("home-row-left", {
      step: 1,
      totalSteps: 1,
      accuracy: 90,
      wpm: 30,
      typedChars: 50,
      correctChars: 45,
      incorrectChars: 5,
      elapsedMs: 15000,
      minAccuracy: 60,
      stars: 3,
    });
    assert.equal(useLessonProgressStore.getState().units["home-row-left"]?.bestStars, 3);

    // 2. User A signs in and has 5 stars
    setCurrentUserId("user-a");
    useLessonProgressStore.getState().replaceCloudUnits([{
      lesson_id: "home-row-left",
      completed: true,
      stars: 5,
      best_wpm: 60,
      best_accuracy: 99,
      current_step: 1,
    }]);
    assert.equal(useLessonProgressStore.getState().units["home-row-left"]?.bestStars, 5);

    // 3. User B signs in: initially empty / locked
    setCurrentUserId("user-b");
    useLessonProgressStore.getState().resetProgress();
    assert.equal(useLessonProgressStore.getState().units["home-row-left"], undefined);

    // User B completes home-row-right only
    useLessonProgressStore.getState().replaceCloudUnits([{
      lesson_id: "home-row-right",
      completed: true,
      stars: 4,
      best_wpm: 45,
      best_accuracy: 95,
      current_step: 1,
    }]);
    assert.equal(useLessonProgressStore.getState().units["home-row-left"], undefined);
    assert.equal(useLessonProgressStore.getState().units["home-row-right"]?.completed, true);

    // 4. Sign out back to guest
    setCurrentUserId(null);
    restoreLocalLessonProgress();

    // Guest progress is restored with its 3 stars, untouched by user A or B
    const guestUnits = useLessonProgressStore.getState().units;
    assert.equal(guestUnits["home-row-left"]?.bestStars, 3);
    assert.equal(guestUnits["home-row-right"], undefined);
  });
});
