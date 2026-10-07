# HEROTYPING PART 1: CORE DATA INTEGRITY ACCEPTANCE REPORT
**Date**: October 7, 2026  
**Repository**: `IM-Mukesh/thundertyping`  
**Scope**: Core Data Integrity, Account Progress, and Persistence Hardening (Findings F01–F06)  
**Status**: Part 1 Approved & Verified

---

## EXECUTIVE SUMMARY & STATUS DECLARATIONS

- **`F01 VERIFIED`** — Canonical Cloud Typing WPM Contract
- **`F02 VERIFIED`** — Lesson Substep vs Whole-Unit Completion Boundary
- **`F03 VERIFIED LOCALLY / PRODUCTION DB NOT VERIFIED`** — Resumable Idempotent Settlement Architecture
- **`F04 VERIFIED`** — Exact Cloud Lesson Restoration Mapping
- **`F05 VERIFIED`** — True All-Time Personal Bests Calculation
- **`F06 VERIFIED`** — Required Durable Replay Identity & Conflict Rejection
- **`Production DB NOT VERIFIED`** — Production database migration unapplied
- **`Part 2 not started`** — Scoped work for Part 2 strictly deferred
- **`Part 3 not started`** — Scoped work for Part 3 strictly deferred

All 6 core integrity findings have been resolved, contracts codified, and verified across unit, integration, validation, and build test suites. Part 1 is complete. The production Supabase database migration remains unapplied and is explicitly marked as not verified against live production.

---

## 1. FINDING-BY-FINDING VERIFICATION

### F01: CANONICAL CLOUD TYPING WPM CONTRACT
- **Status**: `F01 VERIFIED`
- **Authoritative Contract**:
  The authoritative Net WPM metric across browser display, API payload validation, database persistence, and cloud history restoration is strictly derived from **`scoringChars`**:
  $$\text{Net WPM} = \frac{\text{scoringChars} / 5}{\text{durationSeconds} / 60}$$
  where `scoringChars` represents characters in error-free words + clean prefixes of active words upon timer expiration (matching Monkeytype parity).
- **Resolution**:
  - `src/lib/contracts/data-integrity.ts`: Codified `deriveAuthoritativeNetWpm(scoringChars, durationSec)`.
  - `src/lib/server/validation.ts`: Replaced deprecated `totalChars` derivation with `scoringChars` validation. Enforced strict numeric equivalence between client reported WPM and server derived Net WPM ($\pm 1.5$ tolerance for timing drift, while preserving server derivation as authoritative).
  - `src/lib/server/typing-results.ts`: Persists `scoring_chars` and enforces authoritative derivation.
  - `src/app/api/typing-results/route.ts`: Validates and propagates `scoringChars`.
- **Regression Tests**:
  - Audit reproduction: `duration = 60s`, `scoringChars = 6`, `correctChars = 10` produces strictly `1.2 WPM` (never inflated to `2.0 WPM`).
  - Partial failed words (`scoringChars = 0`, `correctChars = 100`) produces `0 Net WPM` on both browser and server with zero divergence.
  - Backspace-heavy typing preserves exact mathematical identity between browser `calculateNetWpm` and server `deriveAuthoritativeNetWpm`.

---

### F02: LESSON SUBSTEP VS WHOLE-UNIT COMPLETION
- **Status**: `F02 VERIFIED`
- **Audit Problem**: Submitting a passing substep (e.g. step 1 of 7) previously marked the entire unit as completed (`completed: true`) and awarded unit-level completion rewards prematurely.
- **Authoritative Lesson Threshold Review**:
  - **Forensic Evidence**: Pre-Part-1 server validation in `src/lib/server/validation.ts:254` evaluated lesson progression using `calculateLessonPass(p.accuracy)`:
    ```typescript
    export function calculateLessonPass(accuracy: number): boolean {
      return accuracy >= 60;
    }
    ```
    This was confirmed by `PROGRESS.md`: *"Built 1-5 star rating system with exact 60% minimum pass threshold"*.
  - The `minAccuracy = 75` in `src/lib/lessons/lesson-types.ts` was non-authoritative drill copy/pedagogy text, previously scheduled for visible wording alignment in F27 (Part 2).
  - **Resolution**: As required, the deliberate pre-Part-1 authoritative 60% progression baseline has been strictly restored via `calculateLessonPass(accuracy)` in `src/lib/contracts/data-integrity.ts:62-64`. Wording alignment remains deferred to F27 in Part 2.
- **Completion Invariants**:
  - A substep passes if `calculateLessonPass(accuracy)` is true (accuracy $\ge 60\%$).
  - Whole-unit completion strictly requires:
    1. The substep itself passed (`substepPassed: true`), AND
    2. The current step has reached or exceeded the authoritative curriculum total steps (`step >= lesson.subLessonCount`).
  - Client-supplied `totalSteps` is overridden by server-side authoritative curriculum metadata (`lesson.subLessonCount`).
- **Regression Tests**:
  - Passing step 1 of 7 with 90% accuracy yields `substepPassed: true`, but `unitCompleted: false`.
  - Passing step 7 of 7 with 60% accuracy yields `substepPassed: true` and `unitCompleted: true`.
  - Boundary check: 59% accuracy fails (`substepPassed: false`, `unitCompleted: false`), while 60% accuracy passes (`substepPassed: true`).

---

### F03: ATOMIC / RESUMABLE SETTLEMENT & IDEMPOTENCY
- **Status**: `F03 VERIFIED LOCALLY / PRODUCTION DB NOT VERIFIED`
- **Settlement Architecture**:
  - Dual-phase architecture:
    1. **Pre-Migration Compatibility Layer**: In-memory `settlement_receipts` map provides process-local resilience; primary row presence check (`existingRun`/`existingAttempt`) prevents row duplication across server restarts even before migration.
    2. **Post-Migration Persistent Layer**: PostgreSQL `settlement_receipts` table with composite primary key `(user_id, event_type, run_id)` guarantees multi-instance, cross-process durable settlement.
- **Database Identity Model**:
  - Standardized on **Composite Identity** `(user_id, event_type, run_id)` across application code, tests, and migration.
  - Fully isolates distinct event domains (`typing_test`, `lesson_progress`, `game_score`) so a user sharing a `runId` across different event types cannot collide or block settlement.
- **Resumable Settlement**:
  - If a submission fails during aggregate update or reward grant, replaying with the same `runId` detects the existing receipt / primary row, skips duplicate primary insertion, and safely resumes from the failed stage.
  - Multi-retry submissions converge idempotently with 0 duplicate XP or statistics.
- **Production Status**:
  - Durable `settlement_receipts` behavior is verified in automated unit/integration tests and database migration scripts.
  - **Production database durability remains explicitly NOT VERIFIED** because the SQL migration has NOT been executed against the production Supabase database.

---

### F04: EXACT CLOUD LESSON RESTORATION MAPPING
- **Status**: `F04 VERIFIED`
- **Audit Problem**: Cloud lesson progress restoration mapped `best_wpm` into `avgWpm`, `best_accuracy` into `avgAccuracy`, and `pass_count` into `attemptsCount`, corrupting historical account progress.
- **Resolution**:
  - `src/lib/contracts/data-integrity.ts`: Codified `mapCloudLessonRowToUnitProgress` with strict 1:1 field mappings:
    - `pass_count` $\rightarrow$ `passCount`
    - `attempt_count` $\rightarrow$ `attemptsCount`
    - `avg_accuracy` $\rightarrow$ `avgAccuracy`
    - `best_accuracy` $\rightarrow$ `bestAccuracy`
    - `avg_wpm` $\rightarrow$ `avgWpm`
    - `best_wpm` $\rightarrow$ `bestWpm`
  - Graceful fallback for legacy database rows where averages were null: safely falls back to best without mutating or corrupting distinct fields.
  - `src/lib/lessons/lesson-progress-store.ts`: Updated `loadLessonProgress()` to use authoritative mapping contract.
- **Regression Tests**:
  - Verified with deliberately distinct values across all fields (passes=3 vs attempts=7, avgWpm=42.5 vs bestWpm=68.2, avgAcc=85.1 vs bestAcc=97.4) confirming zero cross-field substitution.

---

### F05: TRUE ALL-TIME PERSONAL BESTS & VOCABULARY PB DIMENSION
- **Status**: `F05 VERIFIED`
- **Audit Problem**: Signed personal bests were previously reconstructed from only the latest 100 historical results, causing older all-time personal bests to vanish when active users completed subsequent tests. Fallback `LIMIT 500` was also vulnerable to being crowded out by bursts in a single preset (e.g. 15s).
- **Vocabulary PB Dimension Forensic Trace**:
  - **Client Typing-Test Mode**: `mode === "vocabulary"` in `TestMode` (`src/lib/typing-engine/engine-types.ts`).
  - **Vocabulary Selection**: The UI presents difficulty pills for `VOCAB_DIFFICULTIES = ["easy", "medium", "hard"]` (`src/components/typing-test/test-config-bar.tsx`). Modifiers like punctuation/numbers toggles are hidden for vocabulary (`showTextToggles = mode === "time" || mode === "words"`).
  - **Result Persistence Columns**: In `src/lib/persistence/results-store.ts`, `paramForConfig(config)` evaluates:
    ```typescript
    case "vocabulary":
      return config.vocabDifficulty;
    ```
    This value (`"easy" | "medium" | "hard"`) is transmitted via the API payload and persisted directly in the `param` column of the `typing_results` table.
  - **PB Bucket Construction**: `pbKey` constructs separate keys per difficulty tier:
    - `thundertyping-pb:vocabulary:easy:0:0`
    - `thundertyping-pb:vocabulary:medium:0:0`
    - `thundertyping-pb:vocabulary:hard:0:0`
    Vocabulary PB is **NOT** a unified bucket; each tier maintains an isolated, independent personal best.
  - **Restoration into Client**: `primeCloudPersonalBests` loads cloud records into `cloudBestCache` partitioned by `param` (`easy`, `medium`, `hard`). When typing, `getPersonalBest("vocabulary", "easy", false, false)` reads the exact matching difficulty tier.
  - **Bucket Specification**: `STANDARD_TRACKABLE_PB_BUCKETS` in `src/lib/contracts/data-integrity.ts` strictly reflects this three-tier separation:
    - `{ mode: "vocabulary", param: "easy", punctuation: false, numbers: false }`
    - `{ mode: "vocabulary", param: "medium", punctuation: false, numbers: false }`
    - `{ mode: "vocabulary", param: "hard", punctuation: false, numbers: false }`
- **Fallback & RPC Guarantees**:
  - **PostgreSQL RPC**: `get_typing_bests(p_user_id)` uses `DISTINCT ON (mode, param, punctuation, numbers)` across the entire historical record.
  - **Pre-Migration Fallback**: `getTypingPersonalBests` executes dedicated `LIMIT 1 ORDER BY wpm DESC` queries across every bucket in `STANDARD_TRACKABLE_PB_BUCKETS` plus custom durations, mathematically preventing 15s attempt volume from shadowing other modes.
- **Regression Tests**:
  - `REGRESSION F05: Vocabulary personal best dimension — proves separate easy/medium/hard buckets, NOT unified bucket` proves distinct keys, no tier overwriting, and exact contract adherence.
  - 1,000 high-speed 15s tests cannot crowd out 60s, words, quote, or vocabulary bests.

---

### F06: REQUIRED DURABLE REPLAY IDENTITY & CONFLICT REJECTION
- **Status**: `F06 VERIFIED`
- **Audit Problem**: `runId` was optional in typing results and lesson progress payloads, allowing anonymous replays and preventing deterministic deduplication. Conflicting payloads reusing the same `runId` were not rejected.
- **Resolution**:
  - `src/lib/server/validation.ts`: Enforced `runId` as a strictly required UUID v4 string across both `validateTypingResultInput` and `validateLessonProgressInput`. Submissions missing `runId` or containing invalid UUIDs are rejected with `400 Bad Request`.
  - `src/lib/server/settlement.ts`: Implemented `assertTypingPayloadMatch` and `assertLessonPayloadMatch`. If a client re-submits an existing `runId` with conflicting payload metrics (e.g. altered WPM or accuracy), the server rejects it immediately with `RunConflictError` (`409 Conflict`).
- **Regression Tests**:
  - Rejection of payloads missing `runId` or with malformed UUIDs.
  - Rejection with `RunConflictError` on conflicting payload re-use.
  - Safe idempotent replay when payload exactly matches previous submission.

---

## 2. GAME SCORE SCOPE VERIFICATION

- **Verification Question**: Did the inclusion of `game_score` in the settlement migration or type definitions alter game scoring, rewards, achievements, or gameplay behavior?
- **Finding**: **NO**.
  - A full diff against `HEAD` across `src/components/games/`, `src/lib/games/`, and `src/app/api/games/` confirms zero gameplay, scoring algorithms, rewards, or achievements were modified.
  - The sole diff in games is in `src/components/games/falling-words/controller.test.ts` where the test harness random seed was stabilized to eliminate a pseudo-random word collision race condition during concurrent test runs.
  - `game_score` in `settlement_receipts` is generic schema-level forward compatibility only.

---

## 3. FINAL AUTHORITATIVE TEST EXECUTION COUNTS

All commands executed in the final single verification run on October 7, 2026:

| Verification Gate | Exact Repository Command | Authoritative Result | Details |
|---|---|---|---|
| **Dedicated Integrity Suite** | `node --experimental-strip-types --test --import ./scripts/test-setup.mjs src/lib/server/data-integrity.test.ts` | **38 / 38 PASS (Exit 0)** | 7 suites, 0 failed, 38 passed in 699ms |
| **Full Repository Test Suite** | `npm test` | **746 / 746 PASS (Exit 0)** | 146 suites, 0 failed, 746 passed in 16.6s (unrestricted concurrency) |
| **Linter** | `npm run lint` | **PASS (Exit 0)** | 0 ESLint errors |
| **Type Check** | `npm run typecheck` | **PASS (Exit 0)** | 0 TypeScript errors |
| **Git Diff Check** | `git diff --check` | **PASS (Exit 0)** | 0 whitespace or conflict errors |
| **Production Build** | `npm run build` | **PASS (Exit 0)** | 169 / 169 routes compiled successfully |

---

## 4. PART 1 FINAL SIGN-OFF

- Part 1 is **COMPLETE & APPROVED**.
- **0 production database migrations** have been executed (`Production DB NOT VERIFIED`).
- Part 2 and Part 3 have **NOT** been started.
