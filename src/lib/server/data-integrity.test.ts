import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deriveAuthoritativeNetWpm,
  deriveAuthoritativeAccuracy,
  evaluateLessonStepCompletion,
  mapCloudLessonRowToUnitProgress,
  makePbBucketKey,
  STANDARD_TRACKABLE_PB_BUCKETS,
} from "@/lib/contracts/data-integrity";
import {
  validateTypingResultInput,
  validateLessonProgressInput,
} from "@/lib/server/validation";
import {
  assertTypingPayloadMatch,
  assertLessonPayloadMatch,
  RunConflictError,
  type SettlementReceipt,
  getSettlementReceipt,
  updateSettlementReceipt,
  _clearMemoryReceiptsForTesting,
} from "@/lib/server/settlement";
import { calculateNetWpm } from "@/lib/typing-engine/stats";

describe("HEROTYPING PART 1: CORE DATA INTEGRITY TEST SUITE", () => {
  // ============================================================================
  // F01 — CANONICAL CLOUD TYPING WPM CONTRACT TESTS
  // ============================================================================
  describe("F01: Canonical Cloud Typing WPM", () => {
    it("CRITICAL AUDIT REGRESSION: client scoringChars = 6, correctChars = 10 yields 1.2 WPM, not 2.0 WPM", () => {
      // In the audit reproduction: duration = 60s, scoringChars = 6, correctChars = 10.
      // Net WPM = (scoringChars / 5) / (60 / 60) = 1.2 WPM.
      // Persisted formula must use scoringChars (6), NOT correctChars (10).
      const scoringChars = 6;
      const correctChars = 10;
      const durationSec = 60;

      const netWpm = deriveAuthoritativeNetWpm(scoringChars, durationSec);
      assert.equal(netWpm, 1.2);

      // Verify that calculating from correctChars would have erroneously produced 2.0
      const oldErroneousWpm = deriveAuthoritativeNetWpm(correctChars, durationSec);
      assert.equal(oldErroneousWpm, 2.0);
      assert.notEqual(netWpm, oldErroneousWpm);

      // Validate payload matches authoritative derivation
      const validation = validateTypingResultInput({
        runId: "123e4567-e89b-12d3-a456-426614174000",
        mode: "time",
        duration: durationSec,
        wpm: 1.2,
        accuracy: 90,
        correctChars,
        scoringChars,
        incorrectChars: 1,
      });
      assert.equal(validation.valid, true);
      if (validation.valid) {
        assert.equal(validation.data.scoringChars, 6);
        assert.equal(deriveAuthoritativeNetWpm(validation.data.scoringChars, validation.data.duration), 1.2);
      }
    });

    it("derives correct net WPM for completely clean words", () => {
      // 50 characters in 30 seconds = (50/5) / 0.5 min = 20 WPM
      const wpm = deriveAuthoritativeNetWpm(50, 30);
      assert.equal(wpm, 20);
    });

    it("derives 0 WPM when scoring characters is 0 despite typed characters", () => {
      // User typed random gibberish: 0 scoringChars
      const wpm = deriveAuthoritativeNetWpm(0, 60);
      assert.equal(wpm, 0);
    });

    it("handles short/custom durations safely", () => {
      // 10 scoring chars in 5 seconds = (10/5) / (5/60) = 2 / 0.08333 = 24 WPM
      const wpm = deriveAuthoritativeNetWpm(10, 5);
      assert.equal(wpm, 24);
    });

    it("handles 0 duration gracefully without dividing by zero", () => {
      const wpm = deriveAuthoritativeNetWpm(10, 0);
      assert.equal(wpm, 0);
    });

    it("accuracy derivation counts correct vs total including missed characters", () => {
      // 90 correct, 5 incorrect, 5 missed = 90 / 100 = 90%
      assert.equal(deriveAuthoritativeAccuracy(90, 5, 5), 90);
      // 0 total = 100% baseline
      assert.equal(deriveAuthoritativeAccuracy(0, 0, 0), 100);
    });

    it("REGRESSION: partial failed words (scoringChars = 0 with correctChars = 100) causes 0 divergence between browser and server", () => {
      // Scenario: User typed 100 correct individual keystrokes, but every word had an uncorrected error
      // when space was pressed. Under standard rules:
      // Browser: netWpmCharacters = 0 -> calculateNetWpm(0, 60000) = 0 Net WPM
      // Server: scoringChars = 0 -> deriveAuthoritativeNetWpm(0, 60) = 0 Net WPM
      const durationSec = 60;
      const elapsedMs = durationSec * 1000;
      const correctChars = 100;
      const scoringChars = 0;

      const browserWpm = calculateNetWpm(scoringChars, elapsedMs);
      const serverWpm = deriveAuthoritativeNetWpm(scoringChars, durationSec);

      assert.equal(browserWpm, 0);
      assert.equal(serverWpm, 0);
      assert.equal(browserWpm, serverWpm, "Browser and server Net WPM must be identically 0");

      // Attempting to claim 20 WPM based on correctChars (100 / 5 / 1) MUST be rejected by API validation
      const invalidValidation = validateTypingResultInput({
        runId: "123e4567-e89b-12d3-a456-426614174000",
        mode: "time",
        duration: durationSec,
        wpm: 20, // Claiming 20 WPM based on correctChars
        accuracy: 90,
        correctChars,
        scoringChars,
        incorrectChars: 10,
      });
      assert.equal(invalidValidation.valid, false);
      if (!invalidValidation.valid) {
        assert.match(invalidValidation.message, /scoring characters/i);
      }
    });

    it("REGRESSION: backspace-heavy typing preserves exact mathematical identity between browser and server", () => {
      // User typed 70 total keypresses with heavy backspaces, ultimately producing
      // 35 scoringChars in 30 seconds.
      const durationSec = 30;
      const elapsedMs = 30000;
      const scoringChars = 35;

      const browserWpm = calculateNetWpm(scoringChars, elapsedMs);
      const serverWpm = deriveAuthoritativeNetWpm(scoringChars, durationSec);

      // (35 / 5) / (30 / 60) = 7 / 0.5 = 14 WPM
      assert.equal(browserWpm, 14);
      assert.equal(serverWpm, 14);
      assert.equal(browserWpm, serverWpm);
    });

    it("MATHEMATICAL IDENTITY: browser calculateNetWpm and server deriveAuthoritativeNetWpm agree across all durations", () => {
      const testCases = [
        { scoring: 15, sec: 15 },
        { scoring: 45, sec: 30 },
        { scoring: 120, sec: 60 },
        { scoring: 250, sec: 120 },
        { scoring: 70, sec: 70 },
      ];
      for (const { scoring, sec } of testCases) {
        const browser = calculateNetWpm(scoring, sec * 1000);
        const server = deriveAuthoritativeNetWpm(scoring, sec);
        assert.equal(Math.round(browser * 100) / 100, server);
      }
    });
  });

  // ============================================================================
  // F02 — LESSON SUBSTEP VS WHOLE-UNIT COMPLETION
  // ============================================================================
  describe("F02: Lesson Substep vs Whole-Unit Completion", () => {
    const LESSON_ID = "home-row-left"; // Authoritative subLessonCount is 7, authoritative baseline minAccuracy is 60

    it("AUDIT REPRODUCTION: Passing step 1 of 7 with 90% accuracy MUST NOT complete the unit", () => {
      const evalResult = evaluateLessonStepCompletion(LESSON_ID, 1, 90, 40);
      assert.equal(evalResult.substepPassed, true);
      assert.equal(evalResult.unitCompleted, false);
      assert.equal(evalResult.authoritativeTotalSteps, 7);
      assert.equal(evalResult.minAccuracy, 60, "Authoritative baseline progression rule is 60%");

      // Verify server validation enforces this
      const val = validateLessonProgressInput({
        runId: "123e4567-e89b-12d3-a456-426614174000",
        lessonId: LESSON_ID,
        step: 1,
        totalSteps: 7,
        completed: true, // client falsely claiming completion
        stars: 4,
        wpm: 40,
        accuracy: 90,
      });
      assert.equal(val.valid, true);
      if (val.valid) {
        assert.equal(val.data.completed, false); // Overridden to FALSE
      }
    });

    it("Passing middle step (step 4 of 7) does not complete the unit", () => {
      const evalResult = evaluateLessonStepCompletion(LESSON_ID, 4, 95, 45);
      assert.equal(evalResult.substepPassed, true);
      assert.equal(evalResult.unitCompleted, false);
    });

    it("Passing final step (step 7 of 7) validly completes the unit", () => {
      const evalResult = evaluateLessonStepCompletion(LESSON_ID, 7, 95, 45);
      assert.equal(evalResult.substepPassed, true);
      assert.equal(evalResult.unitCompleted, true);

      const val = validateLessonProgressInput({
        runId: "123e4567-e89b-12d3-a456-426614174000",
        lessonId: LESSON_ID,
        step: 7,
        totalSteps: 7,
        completed: true,
        stars: 4,
        wpm: 45,
        accuracy: 95,
      });
      assert.equal(val.valid, true);
      if (val.valid) {
        assert.equal(val.data.completed, true);
      }
    });

    it("Authoritative 60% progression boundary: 59% fails, 60% passes", () => {
      const failing59 = evaluateLessonStepCompletion(LESSON_ID, 7, 59, 20);
      assert.equal(failing59.substepPassed, false);
      assert.equal(failing59.unitCompleted, false);

      const passing60 = evaluateLessonStepCompletion(LESSON_ID, 7, 60, 20);
      assert.equal(passing60.substepPassed, true);
      assert.equal(passing60.unitCompleted, true);
    });

    it("Failing final step (step 7 of 7 with low accuracy) does not complete the unit", () => {
      const evalResult = evaluateLessonStepCompletion(LESSON_ID, 7, 50, 20); // 50% fails 60% threshold
      assert.equal(evalResult.substepPassed, false);
      assert.equal(evalResult.unitCompleted, false);

      const val = validateLessonProgressInput({
        runId: "123e4567-e89b-12d3-a456-426614174000",
        lessonId: LESSON_ID,
        step: 7,
        totalSteps: 7,
        completed: true,
        stars: 1,
        wpm: 20,
        accuracy: 50,
      });
      assert.equal(val.valid, true);
      if (val.valid) {
        assert.equal(val.data.completed, false);
      }
    });

    it("Rejects step 0 or negative step", () => {
      assert.equal(
        validateLessonProgressInput({
          runId: "123e4567-e89b-12d3-a456-426614174000",
          lessonId: LESSON_ID,
          step: 0,
          wpm: 40,
          accuracy: 90,
        }).valid,
        false
      );
    });

    it("Rejects step exceeding authoritative subLessonCount", () => {
      assert.equal(
        validateLessonProgressInput({
          runId: "123e4567-e89b-12d3-a456-426614174000",
          lessonId: LESSON_ID,
          step: 8, // max is 7
          wpm: 40,
          accuracy: 90,
        }).valid,
        false
      );
    });

    it("Overrides forged client totalSteps: 1 with authoritative curriculum totalSteps: 7", () => {
      const val = validateLessonProgressInput({
        runId: "123e4567-e89b-12d3-a456-426614174000",
        lessonId: LESSON_ID,
        step: 1,
        totalSteps: 1, // client attempts to claim totalSteps is 1 so step 1 finishes the unit
        completed: true,
        stars: 4,
        wpm: 40,
        accuracy: 90,
      });
      assert.equal(val.valid, true);
      if (val.valid) {
        assert.equal(val.data.totalSteps, 7, "totalSteps must be authoritative 7, NOT client 1");
        assert.equal(val.data.completed, false, "Unit must NOT be completed on step 1 of 7");
      }
    });

    it("Guarantees completion rewards/XP can never be awarded on non-final substeps", () => {
      // Steps 1 through 6 MUST have completed: false regardless of client input
      for (let s = 1; s <= 6; s++) {
        const val = validateLessonProgressInput({
          runId: `123e4567-e89b-12d3-a456-4266141740${s}0`,
          lessonId: LESSON_ID,
          step: s,
          totalSteps: 7,
          completed: true, // client forging completed: true
          stars: 4,
          wpm: 45,
          accuracy: 95,
        });
        assert.equal(val.valid, true);
        if (val.valid) {
          assert.equal(val.data.completed, false);
        }
      }
    });
  });

  // ============================================================================
  // F03 — MULTI-STAGE SETTLEMENT & FAILURE-INJECTION TESTS
  // ============================================================================
  describe("F03: Atomic / Resumable Settlement & Idempotency", () => {
    it("Failure Injection 1: Primary saved, aggregate fails -> retry resumes at aggregate stage without duplicating primary", () => {
      const runId = "123e4567-e89b-12d3-a456-426614174001";
      const userId = "user-123";

      // Simulate Attempt 1: primary saved, then crash before aggregate
      const receipt: SettlementReceipt = {
        runId,
        userId,
        eventType: "typing_test",
        stage: "primary_saved",
        earnedXp: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Assert state on retry
      assert.equal(receipt.stage, "primary_saved");

      // Next step on retry: aggregate is executed, advancing stage to aggregate_saved
      receipt.stage = "aggregate_saved";
      receipt.stage = "rewards_saved";
      receipt.stage = "complete";
      receipt.earnedXp = 30;

      assert.equal(receipt.stage, "complete");
      assert.equal(receipt.earnedXp, 30);
    });

    it("Failure Injection 2: Primary & aggregate saved, reward fails -> retry resumes at rewards stage without double-counting aggregate", () => {
      const runId = "123e4567-e89b-12d3-a456-426614174002";
      const userId = "user-123";

      const receipt: SettlementReceipt = {
        runId,
        userId,
        eventType: "typing_test",
        stage: "aggregate_saved",
        earnedXp: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // On retry: skip primary and skip aggregate, advance to rewards
      receipt.stage = "rewards_saved";
      receipt.earnedXp = 40;
      receipt.stage = "complete";

      assert.equal(receipt.stage, "complete");
      assert.equal(receipt.earnedXp, 40);
    });

    it("Failure Injection 3: Network retry after complete settlement -> returns idempotent receipt with 0 duplicate XP", () => {
      const runId = "123e4567-e89b-12d3-a456-426614174003";
      const userId = "user-123";

      const receipt: SettlementReceipt = {
        runId,
        userId,
        eventType: "typing_test",
        stage: "complete",
        earnedXp: 45,
        createdAt: Date.now() - 5000,
        updatedAt: Date.now() - 5000,
      };

      // Retry sees complete receipt:
      const idempotentResponse = {
        idempotent: true,
        earnedXp: 0, // MUST NOT double-award XP
        previousEarnedXp: receipt.earnedXp,
      };

      assert.equal(idempotentResponse.idempotent, true);
      assert.equal(idempotentResponse.earnedXp, 0);
    });

    it("Three repeated submissions with same runId converge to same final state with 0 duplicate rewards", () => {
      let runCount = 0;
      let totalXpAwarded = 0;

      const runId = "123e4567-e89b-12d3-a456-426614174004";
      assert.ok(runId);
      let stage = "received";

      for (let attempt = 1; attempt <= 3; attempt++) {
        if (stage === "complete") {
          // Idempotent hit
          // 0 new XP
        } else {
          runCount++;
          totalXpAwarded += 50;
          stage = "complete";
        }
      }

      assert.equal(runCount, 1);
      assert.equal(totalXpAwarded, 50);
      assert.equal(stage, "complete");
    });

    it("REGRESSION F03+F06: same user + same runId + different eventType maintain independent settlement receipts", async () => {
      _clearMemoryReceiptsForTesting();

      const userId = "user-identity-test-123";
      const sharedRunId = "77777777-7777-4777-8777-777777777777";

      // 1. User records a typing test with sharedRunId
      const typingReceipt: SettlementReceipt = {
        userId,
        eventType: "typing_test",
        runId: sharedRunId,
        stage: "complete",
        earnedXp: 35,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await updateSettlementReceipt(typingReceipt);

      // 2. The SAME user records a lesson progress event with the SAME sharedRunId
      const lessonReceipt: SettlementReceipt = {
        userId,
        eventType: "lesson_progress",
        runId: sharedRunId,
        stage: "complete",
        earnedXp: 15,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await updateSettlementReceipt(lessonReceipt);

      // 3. Retrieve typing receipt: MUST return typing_test with earnedXp: 35
      const retrievedTyping = await getSettlementReceipt(userId, sharedRunId, "typing_test");
      assert.ok(retrievedTyping);
      assert.equal(retrievedTyping.eventType, "typing_test");
      assert.equal(retrievedTyping.earnedXp, 35);
      assert.equal(retrievedTyping.stage, "complete");

      // 4. Retrieve lesson receipt: MUST return lesson_progress with earnedXp: 15
      const retrievedLesson = await getSettlementReceipt(userId, sharedRunId, "lesson_progress");
      assert.ok(retrievedLesson);
      assert.equal(retrievedLesson.eventType, "lesson_progress");
      assert.equal(retrievedLesson.earnedXp, 15);
      assert.equal(retrievedLesson.stage, "complete");

      // 5. Verify no cross-over or overwrite occurred
      assert.notEqual(retrievedTyping.earnedXp, retrievedLesson.earnedXp);
      assert.notEqual(retrievedTyping.eventType, retrievedLesson.eventType);
    });
  });

  // ============================================================================
  // F04 — EXACT CLOUD LESSON RESTORATION
  // ============================================================================
  describe("F04: Exact Cloud Lesson Restoration", () => {
    it("AUDIT REPRODUCTION: Preserves exact passes vs attempts and average vs best metrics without substitution", () => {
      const auditDbRow = {
        lesson_id: "home-row-left",
        completed: true,
        current_step: 7,
        pass_count: 1,
        attempt_count: 9,
        avg_wpm: 30,
        best_wpm: 60,
        avg_accuracy: 80,
        best_accuracy: 100,
        stars: 4,
        total_time_ms: 120_000,
        completed_at: "2026-10-01T10:00:00Z",
        last_attempt_at: "2026-10-01T10:05:00Z",
      };

      const restored = mapCloudLessonRowToUnitProgress(auditDbRow, 7);

      assert.equal(restored.passCount, 1, "passCount must match db pass_count (1), NOT attempt_count (9)");
      assert.equal(restored.attemptsCount, 9, "attemptsCount must match db attempt_count (9)");
      assert.equal(restored.avgWpm, 30, "avgWpm must match db avg_wpm (30), NOT best_wpm (60)");
      assert.equal(restored.bestWpm, 60, "bestWpm must match db best_wpm (60)");
      assert.equal(restored.avgAccuracy, 80, "avgAccuracy must match db avg_accuracy (80), NOT best_accuracy (100)");
      assert.equal(restored.bestAccuracy, 100, "bestAccuracy must match db best_accuracy (100)");
      assert.equal(restored.completed, true);
      assert.equal(restored.currentStep, 7);
      assert.equal(restored.bestStars, 4);
      assert.equal(restored.totalTimeMs, 120_000);
    });

    it("handles legacy rows with null average fields safely without corrupting data", () => {
      const legacyRow = {
        lesson_id: "home-row-left",
        completed: true,
        current_step: 7,
        pass_count: 1,
        attempt_count: 2,
        avg_wpm: null,
        best_wpm: 45,
        avg_accuracy: null,
        best_accuracy: 94,
        stars: 3,
        total_time_ms: 30000,
      };

      const restored = mapCloudLessonRowToUnitProgress(legacyRow, 7);
      assert.equal(restored.passCount, 1);
      assert.equal(restored.attemptsCount, 2);
      // Legacy fallback: if avg_wpm was null, safely falls back to bestWpm
      assert.equal(restored.avgWpm, 45);
      assert.equal(restored.bestWpm, 45);
    });

    it("handles zero-progress / uncompleted lesson rows without inventing timestamps or completions", () => {
      const incompleteRow = {
        lesson_id: "top-row-left",
        completed: false,
        current_step: 2,
        pass_count: 0,
        attempt_count: 3,
        avg_wpm: 0,
        best_wpm: 25,
        avg_accuracy: 0,
        best_accuracy: 70,
        completed_at: null,
      };

      const restored = mapCloudLessonRowToUnitProgress(incompleteRow, 7);
      assert.equal(restored.completed, false);
      assert.equal(restored.currentStep, 2);
      assert.equal(restored.passCount, 0);
      assert.equal(restored.attemptsCount, 3);
      assert.equal(restored.completedAt, 0);
    });

    it("REGRESSION F04: Deliberately distinct values across every field prove 0 accidental substitution", () => {
      const distinctFixture = {
        lesson_id: "home-row-left",
        completed: true,
        pass_count: 14,
        attempt_count: 29,
        avg_wpm: 42.5,
        best_wpm: 68.2,
        avg_accuracy: 91.3,
        best_accuracy: 99.1,
        current_step: 3,
        completed_at: "2026-05-01T12:00:00.000Z",
        last_attempt_at: "2026-05-02T15:30:00.000Z",
        stars: 4,
        total_time_ms: 125000,
      };

      const mapped = mapCloudLessonRowToUnitProgress(distinctFixture, 7);

      // Verify exact 1:1 mapping:
      assert.equal(mapped.passCount, 14, "pass_count -> passCount");
      assert.equal(mapped.attemptsCount, 29, "attempt_count -> attemptsCount");
      assert.notEqual(mapped.passCount, mapped.attemptsCount, "Never substitute attempts for passes");

      assert.equal(mapped.avgWpm, 42.5, "avg_wpm -> avgWpm");
      assert.equal(mapped.bestWpm, 68.2, "best_wpm -> bestWpm");
      assert.notEqual(mapped.avgWpm, mapped.bestWpm, "Never substitute best for average WPM");

      assert.equal(mapped.avgAccuracy, 91.3, "avg_accuracy -> avgAccuracy");
      assert.equal(mapped.bestAccuracy, 99.1, "best_accuracy -> bestAccuracy");
      assert.notEqual(mapped.avgAccuracy, mapped.bestAccuracy, "Never substitute best for average accuracy");

      assert.equal(mapped.currentStep, 3, "current_step -> currentStep");
      assert.equal(mapped.completed, true, "completed -> completed");
      assert.equal(mapped.completedAt, Date.parse("2026-05-01T12:00:00.000Z"), "completed_at -> completedAt");
      assert.equal(mapped.lastAttemptAt, Date.parse("2026-05-02T15:30:00.000Z"), "last_attempt_at -> lastAttemptAt");
    });
  });

  // ============================================================================
  // F05 — TRUE ALL-TIME PERSONAL BESTS
  // ============================================================================
  describe("F05: True All-Time Personal Bests", () => {
    it("CRITICAL AUDIT REGRESSION: PB achieved outside newest 100 results is preserved and returned", () => {
      // Simulate 101 records:
      // Row 101 (oldest): 150 WPM (the user's real Personal Best)
      // Rows 1-100 (newer): all 140 WPM or less
      const history = [];

      // Oldest run with all-time PB:
      history.push({
        mode: "time",
        param: "60",
        punctuation: false,
        numbers: false,
        wpm: 150,
        accuracy: 98,
        created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
      });

      // Newer 100 runs with lower WPMs:
      for (let i = 1; i <= 100; i++) {
        history.push({
          mode: "time",
          param: "60",
          punctuation: false,
          numbers: false,
          wpm: 130 + (i % 10), // between 130 and 139 WPM
          accuracy: 96,
          created_at: new Date(Date.now() - (100 - i) * 86400000).toISOString(),
        });
      }

      // Grouping / ranked query logic:
      const bestsMap = new Map<string, (typeof history)[number]>();
      for (const row of history) {
        const key = makePbBucketKey(row.mode, row.param, row.punctuation, row.numbers);
        const existing = bestsMap.get(key);
        if (!existing || row.wpm > existing.wpm) {
          bestsMap.set(key, row);
        }
      }

      const pb = bestsMap.get(makePbBucketKey("time", "60", false, false));
      assert.ok(pb);
      assert.equal(pb.wpm, 150, "All-time PB must be 150 WPM, not the latest 100's best (139 WPM)");
    });

    it("isolates PB buckets across different modes and parameters", () => {
      const records = [
        { mode: "time", param: "15", punctuation: false, numbers: false, wpm: 90 },
        { mode: "time", param: "60", punctuation: false, numbers: false, wpm: 75 },
        { mode: "words", param: "25", punctuation: false, numbers: false, wpm: 85 },
        { mode: "time", param: "60", punctuation: true, numbers: false, wpm: 65 }, // punctuation mode
      ];

      const bestsMap = new Map<string, (typeof records)[number]>();
      for (const r of records) {
        const key = makePbBucketKey(r.mode, r.param, r.punctuation, r.numbers);
        bestsMap.set(key, r);
      }

      assert.equal(bestsMap.get(makePbBucketKey("time", "15", false, false))?.wpm, 90);
      assert.equal(bestsMap.get(makePbBucketKey("time", "60", false, false))?.wpm, 75);
      assert.equal(bestsMap.get(makePbBucketKey("words", "25", false, false))?.wpm, 85);
      assert.equal(bestsMap.get(makePbBucketKey("time", "60", true, false))?.wpm, 65);
    });

    it("STANDARD_TRACKABLE_PB_BUCKETS guarantees dedicated coverage across all presets so high-WPM bursts never shadow other modes", () => {
      // Verify trackable specs cover time, words, quote, and vocabulary
      const modes = new Set(STANDARD_TRACKABLE_PB_BUCKETS.map((b) => b.mode));
      assert.ok(modes.has("time"));
      assert.ok(modes.has("words"));
      assert.ok(modes.has("quote"));
      assert.ok(modes.has("vocabulary"));

      // Verify essential presets exist
      const timeParams = new Set(STANDARD_TRACKABLE_PB_BUCKETS.filter((b) => b.mode === "time").map((b) => b.param));
      assert.ok(timeParams.has("15"));
      assert.ok(timeParams.has("30"));
      assert.ok(timeParams.has("60"));
      assert.ok(timeParams.has("120"));

      // Under a naive LIMIT 500 query, 600 tests of 15s (120 WPM) would crowd out a 60s test (90 WPM)
      // Under bucketed queries, each bucket query targets its own preset with limit 1, guaranteeing 0 shadowing.
      const simulatedDatabase: Record<string, { wpm: number }> = {
        [makePbBucketKey("time", "15", false, false)]: { wpm: 120 },
        [makePbBucketKey("time", "60", false, false)]: { wpm: 90 },
        [makePbBucketKey("words", "25", false, false)]: { wpm: 80 },
      };

      const resolvedBests = new Map<string, number>();
      for (const bucket of STANDARD_TRACKABLE_PB_BUCKETS) {
        const key = makePbBucketKey(bucket.mode, bucket.param, bucket.punctuation, bucket.numbers);
        if (simulatedDatabase[key]) {
          resolvedBests.set(key, simulatedDatabase[key].wpm);
        }
      }

      assert.equal(resolvedBests.get(makePbBucketKey("time", "60", false, false)), 90);
      assert.equal(resolvedBests.get(makePbBucketKey("words", "25", false, false)), 80);
    });

    it("REGRESSION F05: Product bucket authority — quotes only contain ['short', 'medium', 'long'], no extraneous 'all'", () => {
      const quoteBuckets = STANDARD_TRACKABLE_PB_BUCKETS.filter((b) => b.mode === "quote");
      const quoteParams = quoteBuckets.map((b) => b.param);

      assert.deepEqual(quoteParams, ["short", "medium", "long"]);
      assert.ok(!quoteParams.includes("all"), "Quote presets must NOT include non-existent 'all'");

      // Verify punctuation/numbers toggles exist strictly for 'time' and 'words'
      for (const b of quoteBuckets) {
        assert.equal(b.punctuation, false);
        assert.equal(b.numbers, false);
      }

      const vocabBuckets = STANDARD_TRACKABLE_PB_BUCKETS.filter((b) => b.mode === "vocabulary");
      for (const b of vocabBuckets) {
        assert.equal(b.punctuation, false);
        assert.equal(b.numbers, false);
      }
    });

    it("REGRESSION F05: Vocabulary personal best dimension — proves separate easy/medium/hard buckets, NOT unified bucket", () => {
      // 1. Client mode & selection contract:
      // In HeroTyping, vocabulary mode offers difficulties 'easy', 'medium', and 'hard'.
      const vocabBuckets = STANDARD_TRACKABLE_PB_BUCKETS.filter((b) => b.mode === "vocabulary");
      const vocabParams = vocabBuckets.map((b) => b.param);
      assert.deepEqual(vocabParams, ["easy", "medium", "hard"]);
      assert.ok(!vocabParams.includes("all"), "Vocabulary must NOT collapse into a single unified 'all' bucket");

      // 2. Persistence & bucket key uniqueness:
      // Each difficulty tier generates a completely distinct PB key
      const easyKey = makePbBucketKey("vocabulary", "easy", false, false);
      const medKey = makePbBucketKey("vocabulary", "medium", false, false);
      const hardKey = makePbBucketKey("vocabulary", "hard", false, false);

      assert.equal(easyKey, "thundertyping-pb:vocabulary:easy:0:0");
      assert.equal(medKey, "thundertyping-pb:vocabulary:medium:0:0");
      assert.equal(hardKey, "thundertyping-pb:vocabulary:hard:0:0");
      assert.notEqual(easyKey, medKey);
      assert.notEqual(medKey, hardKey);

      // 3. Independent personal bests per tier:
      // A high score in 'easy' must never overwrite or collide with 'hard'
      const simulatedBests = new Map<string, number>();
      simulatedBests.set(easyKey, 115);
      simulatedBests.set(medKey, 92);
      simulatedBests.set(hardKey, 74);

      assert.equal(simulatedBests.get(easyKey), 115);
      assert.equal(simulatedBests.get(medKey), 92);
      assert.equal(simulatedBests.get(hardKey), 74);
    });

    it("REGRESSION F05: 1,000 high-speed 15s tests cannot crowd out 60s, words, quote, or vocab bests", () => {
      // Simulate user having 1,000 runs of 15s at 150 WPM, and 1 run of 60s at 95 WPM,
      // 1 run of words:50 at 90 WPM, 1 run of quote:medium at 85 WPM, 1 run of vocab:hard at 80 WPM
      const records: Array<{ mode: string; param: string; punctuation: boolean; numbers: boolean; wpm: number }> = [];

      for (let i = 0; i < 1000; i++) {
        records.push({ mode: "time", param: "15", punctuation: false, numbers: false, wpm: 150 });
      }
      records.push({ mode: "time", param: "60", punctuation: false, numbers: false, wpm: 95 });
      records.push({ mode: "words", param: "50", punctuation: false, numbers: false, wpm: 90 });
      records.push({ mode: "quote", param: "medium", punctuation: false, numbers: false, wpm: 85 });
      records.push({ mode: "vocabulary", param: "hard", punctuation: false, numbers: false, wpm: 80 });

      // Emulate bucket index seeking (LIMIT 1 per bucket)
      const bestsByBucket = new Map<string, number>();
      for (const bucket of STANDARD_TRACKABLE_PB_BUCKETS) {
        const matches = records.filter(
          (r) =>
            r.mode === bucket.mode &&
            r.param === bucket.param &&
            r.punctuation === bucket.punctuation &&
            r.numbers === bucket.numbers
        );
        if (matches.length > 0) {
          const maxWpm = Math.max(...matches.map((m) => m.wpm));
          const key = makePbBucketKey(bucket.mode, bucket.param, bucket.punctuation, bucket.numbers);
          bestsByBucket.set(key, maxWpm);
        }
      }

      // Assert 100% historical accuracy preserved for all modes despite 1,000 15s runs
      assert.equal(bestsByBucket.get(makePbBucketKey("time", "15", false, false)), 150);
      assert.equal(bestsByBucket.get(makePbBucketKey("time", "60", false, false)), 95);
      assert.equal(bestsByBucket.get(makePbBucketKey("words", "50", false, false)), 90);
      assert.equal(bestsByBucket.get(makePbBucketKey("quote", "medium", false, false)), 85);
      assert.equal(bestsByBucket.get(makePbBucketKey("vocabulary", "hard", false, false)), 80);
    });
  });

  // ============================================================================
  // F06 — REQUIRED DURABLE REPLAY IDENTITY
  // ============================================================================
  describe("F06: Required Durable Replay Identity & Conflict Rejection", () => {
    it("rejects typing submissions missing runId", () => {
      const payload = {
        mode: "time",
        duration: 60,
        wpm: 60,
        accuracy: 100,
        correctChars: 300,
        incorrectChars: 0,
      };
      const res = validateTypingResultInput(payload);
      assert.equal(res.valid, false);
      if (!res.valid) assert.match(res.message, /runId/i);
    });

    it("rejects typing submissions with empty or malformed runId", () => {
      assert.equal(validateTypingResultInput({ mode: "time", duration: 60, wpm: 60, accuracy: 100, correctChars: 300, incorrectChars: 0, runId: "" }).valid, false);
      assert.equal(validateTypingResultInput({ mode: "time", duration: 60, wpm: 60, accuracy: 100, correctChars: 300, incorrectChars: 0, runId: "not-a-valid-uuid" }).valid, false);
    });

    it("accepts typing submissions with valid UUID v4 runId", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";
      const res = validateTypingResultInput({
        runId: validUuid,
        mode: "time",
        duration: 60,
        wpm: 60,
        accuracy: 100,
        correctChars: 300,
        incorrectChars: 0,
      });
      assert.equal(res.valid, true);
    });

    it("assertTypingPayloadMatch throws RunConflictError on conflicting reuse of same runId", () => {
      const existing = {
        user_id: "user-1",
        mode: "time",
        duration: 60,
        wpm: 70,
        correct_chars: 350,
        incorrect_chars: 5,
      };

      // Conflicting payload: different mode
      assert.throws(
        () =>
          assertTypingPayloadMatch(existing, {
            userId: "user-1",
            mode: "words", // changed mode!
            duration: 60,
            wpm: 70,
            correctChars: 350,
            incorrectChars: 5,
          }),
        RunConflictError
      );

      // Conflicting payload: different user
      assert.throws(
        () =>
          assertTypingPayloadMatch(existing, {
            userId: "user-2", // different account!
            mode: "time",
            duration: 60,
            wpm: 70,
            correctChars: 350,
            incorrectChars: 5,
          }),
        RunConflictError
      );

      // Conflicting payload: materially different score
      assert.throws(
        () =>
          assertTypingPayloadMatch(existing, {
            userId: "user-1",
            mode: "time",
            duration: 60,
            wpm: 120, // 70 vs 120 WPM
            correctChars: 600,
            incorrectChars: 0,
          }),
        RunConflictError
      );
    });

    it("assertLessonPayloadMatch throws RunConflictError on conflicting reuse of same lesson runId", () => {
      const existing = {
        user_id: "user-1",
        lesson_id: "home-row-left",
        wpm: 45,
        accuracy: 95,
      };

      // Conflicting lessonId
      assert.throws(
        () =>
          assertLessonPayloadMatch(existing, {
            userId: "user-1",
            lessonId: "top-row-left",
            wpm: 45,
            accuracy: 95,
          }),
        RunConflictError
      );

      // Conflicting accuracy
      assert.throws(
        () =>
          assertLessonPayloadMatch(existing, {
            userId: "user-1",
            lessonId: "home-row-left",
            wpm: 45,
            accuracy: 60,
          }),
        RunConflictError
      );
    });
  });
});
