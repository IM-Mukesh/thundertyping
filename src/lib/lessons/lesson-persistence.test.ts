import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import { setCurrentUserId, getCurrentUserId } from "@/lib/auth/current-user";
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

  it("cross-device convergence: device A and device B converge on the authoritative cloud state", async () => {
    const testUserId = "cross-device-user-999";
    const cloudDatabase = new Map<string, Record<string, unknown>>();

    // Cloud backend mock representing Supabase
    globalThis.fetch = async (url, init) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/lessons/progress")) {
        if (init?.method === "POST") {
          const body = JSON.parse(String(init.body));
          const existing = cloudDatabase.get(body.lessonId) || {};
          const updated = {
            lesson_id: body.lessonId,
            user_id: testUserId,
            completed: Boolean(existing.completed || body.completed),
            current_step: Math.max(Number(existing.current_step || 0), Number(body.step || 0)),
            stars: Math.max(Number(existing.stars || 0), Number(body.stars || 0)),
            best_wpm: Math.max(Number(existing.best_wpm || 0), Number(body.wpm || 0)),
            best_accuracy: Math.max(Number(existing.best_accuracy || 0), Number(body.accuracy || 0)),
            pass_count: (Number(existing.pass_count || 0)) + 1,
            attempt_count: (Number(existing.attempt_count || 0)) + 1,
            typed_chars: (Number(existing.typed_chars || 0)) + Number(body.typedChars || 0),
            correct_chars: (Number(existing.correct_chars || 0)) + Number(body.correctChars || 0),
            incorrect_chars: (Number(existing.incorrect_chars || 0)) + Number(body.incorrectChars || 0),
            total_time_ms: (Number(existing.total_time_ms || 0)) + Number(body.elapsedMs || 0),
          };
          cloudDatabase.set(body.lessonId, updated);
          return { ok: true, status: 200, json: async () => ({ success: true, data: { totalXp: 120 } }) } as Response;
        }

        // GET: Return all rows in cloud database
        const rows = Array.from(cloudDatabase.values());
        return { ok: true, status: 200, json: async () => ({ success: true, data: rows }) } as Response;
      }
      return { ok: true, status: 200, json: async () => ({ success: true }) } as Response;
    };

    // --- SIMULATE DEVICE A (Desktop) ---
    setCurrentUserId(testUserId);
    useLessonProgressStore.getState().resetProgress();

    // 1. Desktop completes 4 steps of home-row-f-j (lessonId: home-row-left)
    for (let step = 1; step <= 4; step++) {
      const outcome = useLessonProgressStore.getState().recordAttempt("home-row-left", {
        step,
        totalSteps: 7,
        accuracy: 97,
        wpm: 45,
        typedChars: 60,
        correctChars: 58,
        incorrectChars: 2,
        elapsedMs: 14000,
        minAccuracy: 60,
        stars: 4,
      });
      await outcome.savePromise;
    }

    // Confirm Device A shows 4 steps
    assert.equal(useLessonProgressStore.getState().units["home-row-left"]?.currentStep, 4);
    assert.equal(useLessonProgressStore.getState().units["home-row-left"]?.bestWpm, 45);

    // Save Device A's storage snapshot
    const deviceAStorage = window.localStorage.getItem(getAccountStorageKey(testUserId));

    // Confirm Cloud Database has 4 steps
    const cloudRecord = cloudDatabase.get("home-row-left");
    assert.ok(cloudRecord);
    assert.equal(cloudRecord.current_step, 4);
    assert.equal(cloudRecord.best_wpm, 45);

    // --- SIMULATE DEVICE B (Mobile) ---
    // Clear in-memory store and simulate fresh mobile browser profile
    useLessonProgressStore.getState().resetProgress();
    window.localStorage.clear();

    // 2. Device B logs into same account and calls primeCloudLessonProgress
    await primeCloudLessonProgress({ force: true });

    // Confirm Device B converges to 4 steps from cloud!
    const deviceBUnits = useLessonProgressStore.getState().units;
    assert.equal(deviceBUnits["home-row-left"]?.currentStep, 4);
    assert.equal(deviceBUnits["home-row-left"]?.bestWpm, 45);
    assert.equal(deviceBUnits["home-row-left"]?.bestStars, 4);

    // 3. Device B completes step 5
    const step5Outcome = useLessonProgressStore.getState().recordAttempt("home-row-left", {
      step: 5,
      totalSteps: 7,
      accuracy: 98,
      wpm: 48,
      typedChars: 65,
      correctChars: 64,
      incorrectChars: 1,
      elapsedMs: 13000,
      minAccuracy: 60,
      stars: 5,
    });
    await step5Outcome.savePromise;

    // Confirm Device B now has step 5
    assert.equal(useLessonProgressStore.getState().units["home-row-left"]?.currentStep, 5);
    assert.equal(cloudDatabase.get("home-row-left")?.current_step, 5);

    // --- SWITCH BACK TO DEVICE A ---
    // Restore Device A's local storage (which only had step 4)
    if (deviceAStorage) {
      window.localStorage.setItem(getAccountStorageKey(testUserId), deviceAStorage);
    }
    useLessonProgressStore.getState().resetProgress();

    // Device A reloads / re-hydrates from cloud
    await primeCloudLessonProgress({ force: true });

    // Confirm Device A now seamlessly updates to step 5!
    assert.equal(useLessonProgressStore.getState().units["home-row-left"]?.currentStep, 5);
    assert.equal(useLessonProgressStore.getState().units["home-row-left"]?.bestStars, 5);
    assert.equal(useLessonProgressStore.getState().units["home-row-left"]?.bestWpm, 48);

    // --- SIMULATE OFFLINE / FAILED POST ---
    globalThis.fetch = async () => {
      throw new Error("Simulated network outage");
    };

    // Completing step 6 while offline
    const offlineOutcome = useLessonProgressStore.getState().recordAttempt("home-row-left", {
      step: 6,
      totalSteps: 7,
      accuracy: 96,
      wpm: 50,
      typedChars: 70,
      correctChars: 68,
      incorrectChars: 2,
      elapsedMs: 12000,
      minAccuracy: 60,
      stars: 4,
    });
    await offlineOutcome.savePromise;

    // Local progress is NOT lost: step 6 is in units and pending in outbox
    assert.equal(useLessonProgressStore.getState().units["home-row-left"]?.currentStep, 6);
    const outbox = getLessonOutbox(testUserId);
    assert.equal(outbox.length, 1);
    assert.equal(outbox[0].step, 6);
  });

  it("safe recovery: unsynced local progress that is ahead of cloud is reconciled and synced, not discarded", async () => {
    const testUserId = "reconcile-user-123";
    const cloudDatabase = new Map<string, Record<string, unknown>>();

    globalThis.fetch = async (url, init) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/lessons/progress")) {
        if (init?.method === "POST") {
          const body = JSON.parse(String(init.body));
          cloudDatabase.set(body.lessonId, {
            lesson_id: body.lessonId,
            user_id: testUserId,
            completed: body.completed,
            current_step: body.step,
            stars: body.stars,
            best_wpm: body.wpm,
            best_accuracy: body.accuracy,
            pass_count: 1,
          });
          return { ok: true, status: 200, json: async () => ({ success: true, data: { totalXp: 150 } }) } as Response;
        }

        // GET: Return cloud records
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: Array.from(cloudDatabase.values()) }),
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({ success: true }) } as Response;
    };

    setCurrentUserId(testUserId);
    useLessonProgressStore.getState().resetProgress();

    // Simulate Laptop having 4/7 steps locally in store snapshot, while cloud is empty (due to past 500 error)
    useLessonProgressStore.setState({
      units: {
        "home-row-left": {
          completed: false,
          currentStep: 4,
          passCount: 4,
          avgAccuracy: 97,
          avgWpm: 45,
          totalTimeMs: 45000,
          completedAt: 0,
          bestWpm: 45,
          bestAccuracy: 97,
          attemptsCount: 4,
          lastAttemptAt: Date.now(),
          bestStars: 4,
          latestStars: 4,
        },
      },
    });

    // Cloud is initially completely empty
    assert.equal(cloudDatabase.size, 0);

    // Call primeCloudLessonProgress
    await primeCloudLessonProgress({ force: true });

    // 1. Cloud was updated with the 4 steps via reconciliation!
    const syncedCloud = cloudDatabase.get("home-row-left");
    assert.ok(syncedCloud, "Unsynced progress must be reconciled to cloud");
    assert.equal(syncedCloud.current_step, 4);
    assert.equal(syncedCloud.best_wpm, 45);

    // 2. Laptop store preserves 4 steps
    assert.equal(useLessonProgressStore.getState().units["home-row-left"]?.currentStep, 4);
  });

  it("Case B: empty account migrates guest data, then clears guest storage so subsequent account receives none", async () => {
    const user1 = "empty-account-user-1";
    const user2 = "empty-account-user-2";
    const cloudDatabase1 = new Map<string, unknown>();
    const cloudDatabase2 = new Map<string, unknown>();

    globalThis.fetch = async (url, init) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/lessons/progress")) {
        const activeUser = getCurrentUserId();
        if (init?.method === "POST") {
          const body = JSON.parse(String(init.body));
          const dbRow = {
            lesson_id: body.lessonId,
            user_id: activeUser,
            completed: body.completed,
            current_step: body.step,
            stars: body.stars,
            best_wpm: body.wpm,
            best_accuracy: body.accuracy,
            pass_count: 1,
          };
          if (activeUser === user1) {
            cloudDatabase1.set(body.lessonId, dbRow);
          } else if (activeUser === user2) {
            cloudDatabase2.set(body.lessonId, dbRow);
          }
          return { ok: true, status: 200, json: async () => ({ success: true, data: { totalXp: 100 } }) } as Response;
        }
        // GET returns target user's cloud DB
        const targetDb = activeUser === user2 ? cloudDatabase2 : cloudDatabase1;
        return { ok: true, status: 200, json: async () => ({ success: true, data: Array.from(targetDb.values()) }) } as Response;
      }
      return { ok: true, status: 200, json: async () => ({ success: true }) } as Response;
    };

    // 1. Guest practices home-row-left
    setCurrentUserId(null);
    useLessonProgressStore.getState().recordAttempt("home-row-left", {
      step: 1,
      totalSteps: 1,
      accuracy: 95,
      wpm: 40,
      typedChars: 50,
      correctChars: 48,
      incorrectChars: 2,
      elapsedMs: 15000,
      minAccuracy: 60,
      stars: 4,
    });
    assert.equal(useLessonProgressStore.getState().units["home-row-left"]?.bestStars, 4);

    // 2. User 1 signs in (empty cloud)
    setCurrentUserId(user1);
    await primeCloudLessonProgress({ force: true });

    // User 1 receives the migrated guest data and saves to cloud
    assert.equal(useLessonProgressStore.getState().units["home-row-left"]?.bestStars, 4);
    assert.equal(cloudDatabase1.size, 1);

    // Guest storage was cleared and archived
    assert.equal(window.localStorage.getItem("thundertyping-lesson-progress"), null);
    assert.ok(window.localStorage.getItem("thundertyping-lesson-progress:archive"));

    // 3. User 1 signs out
    setCurrentUserId(null);
    restoreLocalLessonProgress();
    assert.deepEqual(useLessonProgressStore.getState().units, {});

    // 4. User 2 signs in on the same browser (empty cloud)
    setCurrentUserId(user2);
    await primeCloudLessonProgress({ force: true });

    // User 2 has ZERO lessons (never receives the already-migrated guest progress!)
    assert.deepEqual(useLessonProgressStore.getState().units, {});
    assert.equal(cloudDatabase2.size, 0);
  });

  it("Case C: account with existing cloud progress does not overwrite with guest data automatically; provides explicit merge / dismiss", async () => {
    const testUserId = "case-c-user-existing";
    const cloudRows = [
      {
        lesson_id: "home-row-left",
        completed: true,
        current_step: 7,
        stars: 5,
        best_wpm: 75,
        best_accuracy: 100,
        pass_count: 5,
      },
    ];

    let postCount = 0;
    globalThis.fetch = async (url, init) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/lessons/progress")) {
        if (init?.method === "POST") {
          postCount++;
          return { ok: true, status: 200, json: async () => ({ success: true, data: { totalXp: 150 } }) } as Response;
        }
        return { ok: true, status: 200, json: async () => ({ success: true, data: cloudRows }) } as Response;
      }
      return { ok: true, status: 200, json: async () => ({ success: true }) } as Response;
    };

    // 1. Guest has home-row-right (3 stars) in local storage
    setCurrentUserId(null);
    useLessonProgressStore.getState().recordAttempt("home-row-right", {
      step: 1,
      totalSteps: 1,
      accuracy: 90,
      wpm: 35,
      typedChars: 50,
      correctChars: 45,
      incorrectChars: 5,
      elapsedMs: 15000,
      minAccuracy: 60,
      stars: 3,
    });

    // 2. User signs in with existing account (has home-row-left 5 stars in cloud)
    setCurrentUserId(testUserId);
    await primeCloudLessonProgress({ force: true });

    // Confirmed cloud progress is the authoritative baseline
    const units = useLessonProgressStore.getState().units;
    assert.equal(units["home-row-left"]?.bestStars, 5);
    assert.equal(units["home-row-left"]?.completed, true);
    // Guest progress was NOT automatically merged or sent to cloud!
    assert.equal(units["home-row-right"], undefined);
    assert.equal(postCount, 0);

    // Guest import banner is available with 1 unmerged lesson
    const banner = useLessonProgressStore.getState().guestImportAvailable;
    assert.ok(banner);
    assert.equal(banner.count, 1);
    assert.deepEqual(banner.lessons, ["home-row-right"]);

    // 3. User chooses explicit merge
    await useLessonProgressStore.getState().mergeGuestProgress?.();

    // Now merged: home-row-right is present, home-row-left remains 5 stars (not downgraded)
    const mergedUnits = useLessonProgressStore.getState().units;
    assert.equal(mergedUnits["home-row-left"]?.bestStars, 5);
    assert.equal(mergedUnits["home-row-right"]?.bestStars, 3);
    assert.equal(postCount, 1);
    assert.equal(useLessonProgressStore.getState().guestImportAvailable, null);
  });

  it("Case D: cloud outage preserves cached units and does NOT migrate guest data", async () => {
    const testUserId = "case-d-user";

    // 1. Account has cached unit in localStorage
    const accountKey = getAccountStorageKey(testUserId);
    window.localStorage.setItem(
      accountKey,
      JSON.stringify({
        state: {
          version: 2,
          units: {
            "home-row-left": {
              completed: true,
              currentStep: 7,
              passCount: 2,
              avgAccuracy: 95,
              avgWpm: 50,
              totalTimeMs: 20000,
              completedAt: Date.now(),
              bestWpm: 50,
              bestAccuracy: 95,
              attemptsCount: 2,
              bestStars: 5,
            },
          },
          totals: { typedChars: 100, correctChars: 95, incorrectChars: 5, timeMs: 20000 },
        },
      })
    );

    // Guest also has guest units
    window.localStorage.setItem(
      "thundertyping-lesson-progress",
      JSON.stringify({
        state: {
          version: 2,
          units: {
            "top-row-left": {
              completed: true,
              currentStep: 7,
              passCount: 1,
              avgAccuracy: 90,
              avgWpm: 30,
              totalTimeMs: 15000,
              completedAt: Date.now(),
              bestStars: 3,
            },
          },
        },
      })
    );

    // Cloud fails with 500
    globalThis.fetch = async () => {
      return { ok: false, status: 500, json: async () => ({ error: "Internal Server Error" }) } as Response;
    };

    setCurrentUserId(testUserId);
    await primeCloudLessonProgress({ force: true });

    // Cache is NOT wiped
    assert.equal(useLessonProgressStore.getState().units["home-row-left"]?.bestStars, 5);
    // Guest data was NOT migrated
    assert.equal(useLessonProgressStore.getState().units["top-row-left"], undefined);
    assert.ok(window.localStorage.getItem("thundertyping-lesson-progress"));
    // Status reflects error
    assert.equal(useLessonProgressStore.getState().syncStatus, "error");
    assert.equal(useLessonProgressStore.getState().lifecycleStatus, "sync-error");
  });
});
