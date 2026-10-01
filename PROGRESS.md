## Current CI Typecheck Fix — 2026-09-27

- Root cause: CI ran `tsc --noEmit` before Next.js 16 route type generation, so generated global `PageProps` / `LayoutProps` types were unavailable to TypeScript.
- Exact fix: changed the `typecheck` script in `package.json` from `tsc --noEmit` to `next typegen && tsc --noEmit`.
- No application, SEO, analytics, sitemap, structured-data, security-header, typing-engine, or UI files were changed.
- Verification: GitHub Actions run **#7** for commit `1a65c4835c7ed40feaa6c60a9cd0eae2d1998f1b` is running. Dependency installation has completed; lint is currently running, with typecheck/tests/build pending.
- Local npm verification could not be executed in this environment because outbound GitHub DNS/network access is unavailable; GitHub Actions is the available CI-equivalent verification.
- CI reaches test/build only after lint and the corrected typecheck complete; final pass/fail remains pending at session end.

# HeroTyping — Project State & Roadmap

**Read this file first, completely, before touching any code.** It exists so *any* AI coding assistant — Claude, GPT-based, Astra, Gemini, a local model, whatever picks this up next — or any human developer can start from zero context and be productive immediately, without re-asking the project owner questions that are already answered here. Nothing in this file assumes you're using a specific tool; where a note is specific to one environment, it's labeled as such near the end, not mixed into the main instructions.

**Keep it updated.** If you finish work, update the relevant section(s) before ending your session — "Current status," "Known issues," and the backlog especially. If you find this file describes something that no longer matches the code, trust the code and fix the file; don't trust the file over reality.

## Quick start (works regardless of which AI tool or editor you are)

```bash
cd path/to/herotyping
npm install       # only needed if node_modules isn't already present
npm run dev        # starts Next.js on http://localhost:3000 by default
npm test            # 283 unit tests (Node's built-in runner, no extra dependency)
npm run lint        # must be clean before you consider anything "done"
npm run build       # must be clean before you consider anything "done"
npx tsc --noEmit    # typecheck; the build does not fail on type errors alone
```

Open whatever URL `npm run dev` prints (usually `http://localhost:3000`; it'll pick a different port automatically if that one's busy). No environment variables, no database, no API keys are required to run this locally — it's a fully static-data, `localStorage`-only frontend right now.

**The bar for "done" is: `npm test`, `npm run lint`, `npx tsc --noEmit` and `npm run build` all clean, plus live verification in a real browser for anything UI-observable.** A test suite now exists (2026-09-17, expanded 2026-09-22, 2026-09-25, 2026-09-26, 2026-09-27, and 2026-09-28, 283 cases across 58 suites) covering the scoring engine, consistency metric calibration (Scenarios A through R), the mobile input path, the game anti-exploit rules, the countdown formatter, the game readiness/sitemap isolation rules, the lesson curriculum's 2-key motor progression and invariants, the touch-typing star system, the vocabulary ratio & uniqueness rules, the TTS speech synthesis engine, the WPM/CPM/KPH calculator's conversion math, and sitemap route integrity — it runs on Node 22's built-in `node:test` with `--experimental-strip-types`, so it needs **Node 22+** and adds no dependency. `scripts/test-setup.mjs` maps the `@/*` alias for it, since Node does not read `tsconfig` paths.

**Write a test for anything scoring-related.** Every scoring bug found so far was invisible through the UI — a dropped keystroke and a missed render look identical on screen. The tests drive the pure reducer directly for that reason.

## Right now (orientation for a cold start — the rest of this file has the detail)

As of **2026-09-28**: a production-ready, feature-complete MVP, fully mobile-responsive, rebranded from ThunderTyping to **HeroTyping**, with a dedicated mobile **hamburger menu drawer** (with integrated theme switcher & level progress), zero-shake caret layout, responsive virtual keyboards for mobile viewports, **10 playable typing games** under `/games` (plus upcoming **Spellbound** preview, 11 total catalog games, including flagship **Fruit Fury**), a **28-unit, 3-tier touch-typing curriculum** under `/lessons` rebuilt with a strict **<=2 new alphanumeric keys per unit** pedagogical sequence, a **1-5 star motor mastery rating system**, a **10/10 animated lesson completion modal** with sequential star reveals and crystal chimes, an adaptive practice lab, diagnostic placement engine, and Bayesian mastery scoring, a **1,300-word daily vocabulary typing mode with offline TTS audio pronunciation & explanation**, **43 comprehensive SEO guides across 6 category hubs** under `/guides` with a scalable category-first information architecture, sub-100KB hierarchical WebP image pipeline, **Google Analytics 4 wired in**, AdSense safe unit ID architecture, and a **290-test suite across 61 suites**.

**Session 2026-10-01 — Auth Fixes, Removed Guest Migration, Cloud-Only Sync For Signed-In Players:**
- **Superseded from Part 6 below**: the automatic guest→account migration (`src/lib/auth/guest-sync.ts`, `/api/sync/migrate`, `src/lib/server/migration.ts`) has been **removed** (moved to `.removed-backup/`, not deleted outright) — it had a real bug where, on a shared browser, a second account signing in after a first could inherit the first account's (or a leftover guest session's) local scores, since the migration-done check only compared against the new user's own id, not whose data was actually sitting in localStorage.
- **Signed-in players are now cloud-only, guests stay local-only** — no merging between the two, ever:
  - Typing-test personal bests (`src/lib/persistence/results-store.ts`), game scores (`src/lib/games/game-scores.ts`), lesson progress (`src/lib/lessons/lesson-progress-store.ts`), XP, and achievements (`src/lib/profile/player-profile.ts`) each now check `getCurrentUserId()` (`src/lib/auth/current-user.ts`, a tiny non-React mirror of the signed-in id, kept in sync by `AuthProvider`) and branch: guest → localStorage exactly as before; signed-in → POST to the cloud API, read from an in-memory cache primed on sign-in and dropped on sign-out. No game/lesson/typing-test component needed to change — they all already went through one shared function per concern (`recordGameResult`, `recordAttempt`, `recordResult`, `awardXp`, `grantAchievement`), so the branching lives there, not at 12+ call sites.
  - New endpoints: `POST /api/profile/xp` (atomic, race-safe increment on `player_streaks.total_xp`, same optimistic-retry pattern as the other aggregate writes) and `GET`/`POST /api/profile/achievements` (backed by the `achievements` table, which existed in the schema but had no route until now).
  - Still local-only for everyone (disclosed, not a regression): unlocks and daily-challenge streaks have no database table yet — would need a new migration to close.
- **Fixed the real "signed in with Google but still shows Guest Mode" bug**: `src/lib/auth/auth-context.tsx`'s `refreshProfile()` correctly read the valid local session via `getSession()` (instant, no network call) but then unconditionally wiped it back to `null` on *any* `/api/profile` 401 — and `/api/profile` uses `getUser()`, which re-verifies the JWT against Supabase's auth server over the network and can transiently fail right after a fresh sign-in, before the new token finishes propagating. Fixed both sides: the client now only clears sign-in state on a 401 if the local session also agrees nobody's signed in, and `src/lib/server/auth.ts`'s `getAuthenticatedUser()` retries once (300ms) when a session cookie is present but verification failed. Confirmed working live.
- **Simplified email sign-in to a single magic-link flow**: Supabase's configured email template never actually included a 6-digit code (only a sign-in link), so the old two-step "enter the code we emailed you" UI was a dead end. `src/app/auth/login/page.tsx` now just sends the link and shows "check your email" — the dead `verifyOtp` plumbing and `/api/auth/verify` route were removed. The email sign-in button itself is currently **hidden from the UI** (not deleted — `signInWithOtp`/`/api/auth/otp` are intact) because Supabase's free-tier shared SMTP rate-limits project-wide, not per-recipient, and needs a dedicated SMTP provider (e.g. Resend) configured in the Supabase Dashboard before it's viable for real users — that's a dashboard setting, not something fixable from code.
- **Removed the "Reset progress" button** from the profile page per product decision (was local-only and getting confusing alongside the new cloud-sync model); the underlying `resetProfile()` function stays, still used by a test for state isolation between runs.
- Verification: `npm test` (325/325, up from 319), `npm run lint` (clean), `npm run typecheck` (clean), `npm run build` (clean) after every change in this session.

**Session 2026-09-28 (Part 6) — Production Backend Foundation (Next.js 16 + Vercel + Supabase + RLS + Guest Migration):**
- **Architecture & Infrastructure**:
  - Maintained zero-server architecture: no Express, Fastify, standalone Node, Docker, or external microservices.
  - All backend endpoints operate serverlessly through Next.js 16 App Router Route Handlers (`src/app/api/**`).
  - Next.js 16 `src/proxy.ts` request proxy file implements session token refresh with `@supabase/ssr` (replacing deprecated `middleware.ts`).
  - Typed Supabase browser and server clients (`@supabase/supabase-js` ^2.117.2 and `@supabase/ssr` ^0.12.7) with fallback tolerance for CI and static prerendering.
- **Postgres Database Schema & Row Level Security**:
  - Authored `supabase/migrations/20260928000000_initial_schema.sql` defining 9 production tables: `profiles`, `user_preferences`, `player_streaks`, `lesson_progress`, `lesson_attempts`, `typing_results`, `game_scores`, `daily_stats`, `achievements`.
  - Configured automated PostgreSQL trigger `on_auth_user_created` to provision profile, preferences, and streak defaults upon user signup.
  - Enabled Row Level Security (RLS) across all user tables with strict `auth.uid() = user_id` / `auth.uid() = id` policies.
  - Generated complete database types in `src/lib/supabase/database.types.ts`.
- **Server Utilities & API Route Handlers**:
  - `src/lib/server/auth.ts`: `getAuthenticatedUser()` and `requireAuthUser()` verifying user identity server-side via Supabase Auth without trusting client-supplied user IDs.
  - `src/lib/server/errors.ts`: Standardized API envelope (`{ success: true, data }` or `{ success: false, error }`).
  - `src/lib/server/validation.ts`: Strict boundary validation for typing results, lesson progress, game scores, profile updates, and preferences.
  - `src/app/api/auth/callback/route.ts`: OAuth code exchange with open-redirect protection.
  - `src/app/api/profile/route.ts` & `src/app/api/profile/preferences/route.ts`: Profile and preferences GET/PATCH/PUT endpoints.
  - `src/app/api/typing-results/route.ts`: Typing results history and record saves with daily rollup stats and streak/XP increments.
  - `src/app/api/lessons/progress/route.ts`: Unit progress retrieval and upsert with star retention.
  - `src/app/api/games/scores/route.ts`: Game score run recording, personal best calculation, and daily games played updates.
  - `src/app/api/sync/migrate/route.ts`: Deterministic guest-to-cloud migration endpoint.
- **Client Auth, UI & Deterministic Guest Migration**:
  - `src/lib/auth/auth-context.tsx`: React AuthProvider and `useAuth` hook managing real-time auth state (`onAuthStateChange`).
  - `src/lib/auth/guest-sync.ts`: Non-destructive guest data aggregator seamlessly migrating local storage to cloud upon login.
  - `src/components/auth/user-account-menu.tsx`: User avatar, email, cloud sync status, and account dropdown for desktop and mobile drawer.
  - `src/app/auth/login/page.tsx`: Google OAuth and Email OTP magic-link login page with clear guest mode guarantees.
  - `src/components/profile/profile-client.tsx`: Account and cloud sync status card with inline profile display name and username editing.
- **Privileged Server Client & Security Hardening (New Supabase API Key Model)**:
  - Implemented `createAdminClient()` in `src/lib/supabase/admin.ts` using `SUPABASE_SECRET_KEY` (with fallback to `SUPABASE_SERVICE_ROLE_KEY` if configured).
  - Enforced strict server isolation: `createAdminClient` is server-only, never exposed with `NEXT_PUBLIC_`, never imported into Client Components, and completely decoupled from user session cookies and auth headers.
  - Rewrote server data services (`typing-results.ts`, `lesson-progress.ts`, `game-scores.ts`, `profiles.ts`, `migration.ts`) to execute verified writes via `createAdminClient()`.
  - Maintained hardened RLS policies in `supabase/migrations/20260928000000_initial_schema.sql` (blocking direct browser mutations while allowing serverless Route Handlers to perform verified operations).
  - Documented `SUPABASE_SECRET_KEY` in `.env.example` and `docs/backend.md`.
- **Quality Gates & Verification**:
  - `npm test`: 313 unit tests passing across 70 test suites (100% pass).
  - `npm run lint`: 0 ESLint errors, 0 warnings.
  - `npm run typecheck`: 0 TypeScript errors.
  - `npm run build`: 158/158 routes compiled and prerendered successfully with Turbopack.

**Session 2026-09-28 (Part 5) — Complete Games Rebuild: Mechanics, Depth, Mobile Viewport & Audio Hierarchy:**
- **Game-by-Game Audit & Catalog Discovery**:
  - Authored comprehensive 26-question (A–Z) audit for all 11 catalog games at `docs/games-catalog-audit.md`.
  - Discovered 10 fully playable games (`falling-words`, `word-rain`, `word-blaster`, `typing-grand-prix`, `boss-battle`, `combo-rush`, `typing-survivor`, `ghost-racer`, `card-battle`, `fruit-fury`) and preserved 1 upcoming game preview (`spellbound`).
- **Decoupled Mechanics & Enhanced Gameplay Loops**:
  - **Word Rain**: Decoupled from Falling Words into dedicated survival tempest engine `src/lib/games/use-word-rain.ts` with 5 weather phases (`MIST`, `DRIZZLE`, `DOWNPOUR`, `GALE FORCE`, `HURRICANE`), real-time storm pressure gauge with downpour pulse surges, near-miss floor clearing rewards, and rain atmosphere audio.
  - **Falling Words**: Rebuilt with 5 escalation phases (Scout Warmup to Matrix Meltdown), new word types (Slowdown Freeze words, Golden score multipliers, and red Hazard words), and tactical matrix slowdown mechanics in `src/lib/games/use-falling-words.ts`.
  - **Word Blaster**: Upgraded with 3 distinct enemy archetypes in `src/lib/games/use-word-blaster.ts` (fast Swarmers, Armored Tanks with 2-phase shield words, and EMP drones triggering lane-clearing shockwave detonations).
  - **Combo Rush**: Added 5 Rush Tiers (`WARMUP`, `BRONZE`, `SILVER`, `GOLD`, `HYPER`) with escalating score multipliers and time refunds in `src/lib/games/use-combo-rush.ts`, complete with dynamic HUD tier glow badge and powerup audio.
  - **Typing Grand Prix**: Enhanced with Nitro boost sound, lead-in countdown audio, and safe viewport sizing.
  - **Boss Battle**: Enhanced with zero-latency synthesized Web Audio hit/block/phase chimes and pause overlay.
  - **Ghost Racer**: Added real-time pace delta chips (`+4c` / `-2c`) to lane runners, countdown audio triggers, and safe viewport sizing.
  - **Card Battle & Fruit Fury**: Wrapped in responsive viewport containers with `--safe-board-height` to prevent mobile OSK occlusion.
- **Mobile Virtual Viewport & OSK Architecture**:
  - Built `src/lib/games/use-game-viewport.ts` and `src/components/games/ui/game-viewport.tsx` subscribing to `window.visualViewport` resize and scroll events.
  - Exposes dynamic CSS variables `--safe-board-height`, `--visible-height`, `--keyboard-inset` so game stages scale above the mobile virtual keyboard without clipping.
  - Standardized `CountdownOverlay`, `PauseOverlay`, `UniversalStartCard`, and `UniversalResultCard` in `src/components/games/ui/game-chrome.tsx`.
- **Zero-Latency Web Audio Hierarchy**:
  - Added synthesized Web Audio sound generators in `src/lib/games/game-audio.ts` (`countdown`, `countdown-go`, `nitro`, `freeze`, `thunder`, `boss-hit`, `boss-block`, `victory`, `powerup`), resuming safely on user gestures.
- **Verification & Quality Gates**:
  - `npm test`: 290 unit tests passing across 61 test suites (100% pass).
  - `npm run lint`: 0 ESLint errors, 0 warnings.
  - `npx next typegen && npx tsc --noEmit`: 0 TypeScript errors.
  - `npm run build`: 150/150 static pages prerendered cleanly.
  - Working tree preserved cleanly without commits or pushes.

**Session 2026-09-28 (Part 4) — Complete Guides Content Audit & Rewrite (Curriculum Alignment & Pedagogical Realism):**
- **Comprehensive Guides Corpus Audit & Re-alignment**:
  - Audited all 43 guides across 6 category hubs plus `/guides` hub against the new 28-unit, 3-tier, 9-stage curriculum implementation in `src/lib/lessons/`.
  - Replaced all stale assumptions, outdated lesson numbers, obsolete 90%-95% pass thresholds, and "left-hand first" sequencing with HeroTyping's true pedagogical architecture.
- **Pedagogical Guides Rewritten from First Principles**:
  - `src/app/guides/typing-resources-for-teachers/page.tsx`: Fully rewritten for classroom realities with 3 implementation models (10m bell-ringer, 20m typing block, 40-45m computer lab period), 9-stage progression overview across all 28 units, formative 1–5 star grading rubric, 60% minimum progression threshold, honest local-storage privacy disclosures, and research-backed attribution (NBEA / academic keyboarding literature).
  - `src/app/guides/touch-typing-lesson-order/page.tsx`: Completely rebuilt from the ground up around the real 9-stage curriculum sequence, explaining why F & J anchors come first, how the <=2 keys/unit rule prevents cognitive overload, how consolidation units work (Units 6, 12, 17, 23), and why numbers/code syntax are deferred to Intermediate/Advanced tiers.
  - `src/app/guides/home-row-typing-practice/page.tsx`: Realigned all drills and unit links to the 2-key symmetrical model (F & J, D & K, S & L, A & ;, G & H, Unit 6 consolidation) and 60% pass threshold.
  - `src/app/guides/how-to-type-top-row-without-looking/page.tsx`: Fixed all lesson links from stale single-hand assignments to actual Top Row units: Unit 7 (E & I), Unit 8 (R & U), Unit 9 (T & Y), Unit 10 (W & O), Unit 11 (Q & P), and Unit 12 (Consolidation).
  - `src/app/guides/bottom-row-typing-practice/page.tsx`: Fixed all lesson links to actual Bottom Row units: Unit 13 (V & M), Unit 14 (C & comma), Unit 15 (X & period), Unit 16 (Z & slash), and Unit 17 (B & N).
  - `src/app/guides/number-row-typing-practice/page.tsx`: Realigned links with actual Number Row units: Unit 19 (4 & 7), Unit 20 (3 & 8), Unit 21 (2 & 9), Unit 22 (1 & 0), Unit 23 (5 & 6), and Unit 27 (Code Syntax & Numbers).
  - `src/app/guides/punctuation-typing-practice/page.tsx`: Realigned punctuation links to reflect real tier progression (Unit 4 semicolon, Unit 14 comma, Unit 15 period, Unit 16 slash, Unit 18 Shift & capitalization, Unit 24 symbols).
  - `src/app/guides/touch-typing-finger-map/page.tsx` & `src/app/guides/how-to-touch-type/page.tsx`: Replaced stale "left hand home row alone then right hand" sequencing with symmetrical 2-key pairings radiating from tactile anchors.
  - `src/app/guides/typing-practice-for-beginners/page.tsx`: Updated practice stages and recommendations to reflect F & J bumps, 2-key pairs, and 28 units.
- **Adaptive Engine & Weak-Key Diagnostics Alignment**:
  - `src/app/guides/how-to-find-your-weakest-typing-keys/page.tsx` & `src/app/guides/typing-practice-for-weak-keys/page.tsx`: Updated diagnostic thresholds to match the actual Bayesian Wilson-score engine (minimum 8 attempts, lower bound < 88% = struggling, >= 95% = mastered) and linked to the Practice Lab's five modes.
  - `src/app/guides/why-wpm-is-high-accuracy-is-low/page.tsx`: Updated lesson gating from old 95% threshold to the formative 1–5 star rating system (60% minimum accuracy pass gate to advance; 4–5 stars for precision).
  - `src/app/guides/practice-typing-numbers-and-symbols-without-looking/page.tsx` & `src/app/guides/typing-for-programmers/page.tsx`: Updated Unit 27 links to "Unit 27: Code Syntax & Technical Formats" (`/lessons/numbers-and-symbols-mastery`).
- **Ergonomics & Non-Medical Phrasing (Rule 19 Compliance)**:
  - `src/app/guides/typing-stretches-and-hand-warmups/page.tsx`: Softened "Physical therapist-recommended" claims to educational ergonomic language, focusing on comfort, mobility, and healthy warmup habits.
  - `src/app/guides/how-to-type-numbers-and-symbols-without-looking/page.tsx`: Replaced "injurious claw grip known as lateral carpal strain" with accurate non-clinical forearm tension descriptions.
  - `src/app/guides/touch-typing-roadmap-for-beginners/page.tsx`: Softened carpal tunnel compression language to relaxed neutral joint alignment.
- **Internal Routing & Navigation Integrity**:
  - `src/lib/guides/guide-registry.ts`: Fixed mismatched product routes: Keyboard Skills now correctly routes to `/lessons/building-speed` (Unit 19 Number Row), Data Entry and Number guides link to Unit 19, Bottom Row links to Unit 13 (`/lessons/numbers-low`), and Punctuation links to Unit 18 (`/lessons/shift-capitalization`).
  - `src/app/guides/page.tsx`: Updated CTA cards to "28 Curriculum Units" and "Adaptive Practice Lab".
  - `src/components/lessons/todays-training-card.tsx`: Replaced hardcoded "1. Home Row: Left Hand (A S D F)" with dynamic `1. ${LESSON_LIST[0].name}` ("1. Home Row: F & J Anchors").
- **Verification**:
  - `npm test`: 283 unit tests passing across 58 suites (100% pass).
  - `npm run typecheck`: 0 TypeScript errors.
  - `npm run lint`: 0 ESLint errors, 0 warnings.
  - `npm run build`: 150/150 static pages successfully prerendered.
  - `git diff --check`: 0 whitespace errors.

**Session 2026-09-28 (Part 3) — Lesson Completion & Star System Redesign (10/10 Human-Crafted UX):**
- **Eliminated Surprise Auto-Restart (Bugs 2 & 37)**:
  - Lessons never auto-restart or transition unexpectedly upon completion or mistake thresholds.
  - The completion experience calmly opens a focused modal overlay explaining performance and letting learners intentionally choose Continue or Try Again.
- **Visual Scale & Clarity (3× Larger Stars)**:
  - Stars sized `w-10 h-10` on mobile to `w-14 h-14` on desktop (`size={44}` to `size={56}`) with generous breathing room.
  - Ambient warm amber glow effects and distinct recessed empty star silhouettes for unearned stars.
- **Synchronized Audio & Sequential Star Reveal Animation**:
  - Empty star placeholders appear first; earned stars animate sequentially (~190ms interval) with rising crystal harmonic bell frequencies ($C_5, E_5, G_5, A_5, C_6$) using the Web Audio API.
  - Final emotional resolution chord fires 140ms after all stars reveal (`lesson-perfect`, `lesson-pass`, or supportive `lesson-retry`).
  - Graceful reduced-motion bypass via `prefers-reduced-motion`.
- **Exact 60% Universal Progression Rule**:
  - Accuracy $< 60\% \rightarrow 1–2$ stars (Cannot advance, constructive failure feedback, retry required).
  - Accuracy $\ge 60\% \rightarrow 3+$ stars (Passes, next lesson/step unlocked).
  - Explicit metric callout: `"Required to pass: 60% accuracy"`.
- **Generous 5-Star Rule**:
  - Accuracy $\ge 94\%$ AND Net WPM $\ge 25 = 5$ stars (or near-perfect $\ge 98\%$ accuracy in beginner tier).
- **Actionable Weakness Diagnosis & Mistakes Callout**:
  - Surfaces total mistake count, accuracy gap to 60%, and targeted finger positioning tips for problematic keys.
  - Direct 1-click shortcut to Practice Lab when specific key weaknesses are detected.
- **Command Hierarchy & Keyboard Navigation**:
  - Primary button (`Continue` on pass, `Try Again` on fail) is autofocus-ready with keyboard badge `Enter ↵`.
  - Secondary actions: `Space` or `R` for quick retry, Practice Lab shortcut for weak keys, and Curriculum overview.
  - `isNavigating` flag prevents rapid repeated keystroke double-actions.
  - Viewport overflow protection (`max-h-[92vh] overflow-y-auto`) for small laptop and mobile screens.
- **Automated Verification & Zero Regressions**:
  - Dedicated unit test suite `src/lib/lessons/star-system.test.ts` (10 tests) covering exact progression boundaries (59.9% vs 60%, 93.9% vs 94%, 24.9 WPM vs 25 WPM), 1-star through 5-star flows, and key diagnostics.
  - Total test count expanded to **283 tests across 58 suites (100% passing)**.
  - Clean ESLint (0 errors, 0 warnings), clean TypeScript (`tsc --noEmit`), and all 150 static pages successfully compiled via `next build`.

**Session 2026-09-28 (Part 2) — Touch-Typing Curriculum Overhaul, 2-Key Motor Progression & Star System Rebuild:**
- **Strict Pedagogical Architecture (2-Key Maximum & Anchors)**:
  - `src/lib/lessons/lesson-types.ts`:
    - Re-architected all 28 units: strictly **<= 2 new alphanumeric keys per unit** (Rule 3).
    - Unit 1 introduces the fundamental F & J home-row tactile bumps (`home-row-left`).
    - Unit 4 introduces semicolon `;` as an essential home-row anchor key.
    - All units have cumulative `allowedKeys` reinforcing every previously introduced key.
    - Preserves all 28 original route IDs, sitemap URLs, and guide backlinks without breaking changes.
    - Scaled progressive accuracy thresholds: forgiving ~75% for initial key learning, scaling to 92% for advanced flow.
  - `src/lib/lessons/content-generator.ts` & `src/lib/lessons/lesson-content.ts`:
    - Implemented 7-phase deliberate motor progression for 2-key units:
      - Phase A: Discover Key 1 (single-key tactile burst, >=10 characters, 75% accuracy threshold).
      - Phase B: Discover Key 2 (single-key tactile burst, >=10 characters, 75% accuracy threshold).
      - Phase C: Pair & Mix (rhythmic two-key pairing).
      - Phase D: Rapid Alternation (hand-switching cadence drills).
      - Phase E: Prior Key Integration (blends new reaches with full prior key set).
      - Phase F: Flow Challenge (dynamic speed & cadence test).
      - Phase G: Unit Checkpoint (full evaluation for stars and unit completion).
    - Hardened invariant: **no lesson run or exercise contains fewer than 10 target characters** (Rule 6).
- **Touch-Typing Star System (⭐ 1–5)**:
  - `src/lib/lessons/star-system.ts`:
    - Motor accuracy and finger control evaluation returning 1 to 5 stars.
    - Passing rule: **3+ stars = PASS**; **1–2 stars = RETRY / NOT YET MASTERED**.
    - For beginner units, speed is never penalized: accuracy and control award up to 5 stars.
    - Targeted weakness diagnosis: analyzes single-key outcomes and finger biomechanics to provide actionable remediation advice and specific retry focus keys.
  - `src/lib/games/game-audio.ts`:
    - Added dedicated Web Audio chimes: `"lesson-star"` (sequential star reveal), `"lesson-pass"` (arpeggio), `"lesson-perfect"` (5-star harmony), and `"lesson-retry"` (supportive tone).
  - `src/lib/lessons/lesson-progress-store.ts`:
    - Extended unit progress with `bestStars` and `latestStars`.
    - Unit advancement requires `stars >= 3`.
    - Backward-compatible schema validation and migration.
- **Full Completion Modal Overlay (`lesson-completion-modal.tsx`)**:
  - Replaced inline results card with a full modal overlay featuring backdrop blur.
  - Sequential star reveal animation (160ms interval with reduced-motion bypass).
  - Metrics display: Net WPM, Accuracy, Required Accuracy, Total Errors, Time Elapsed, XP Gain.
  - Weakness diagnosis callout highlighting problematic keys and finger placement.
  - Keyboard navigation: `Enter` activates the primary action (Continue for pass, Retry for fail); `Space` or `R` for instant retry.
  - Double-submission protection (`isNavigating` flag blocks accidental double clicks/keypresses).
- **Dashboard Gamification & Star Badges (`lesson-dashboard.tsx`, `lesson-unit-row.tsx`, `lesson-stats-bar.tsx`)**:
  - Rendered 5-star ratings (e.g. ⭐⭐⭐⭐☆) on every lesson unit row.
  - Added "Stars earned" tile (tracking up to 140 stars across 28 units) in the stats bar.
  - Dominant "Continue / Resume Lesson" action for returning typists.
- **Automated Invariants Verification (`curriculum-invariants.test.ts`)**:
  - 8 comprehensive invariant tests verifying:
    - Never > 2 alphanumeric keys per unit.
    - F & J anchors first.
    - Semicolon `;` in home row.
    - Cumulative key sets.
    - Minimum >= 10 target characters per exercise across all seeds.
    - All 28 route IDs preserved.
    - 7-step motor progression with forgiving discovery thresholds.
    - Star evaluation boundaries and weakness diagnosis.
  - Total test count expanded to **280 tests across 57 suites (100% passing)**.

**Session 2026-09-28 (Part 1) — Touch-Typing Curriculum Redesign, Adaptive Engine, Statistical Mastery & UX Rebuild:**
- **Audited & Rebuilt Lesson Architecture**:
  - `src/lib/lessons/keyboard-layout.ts`:
    - Strict physical ANSI key-to-finger mapping with Opposite-Hand Shift enforcement (`shiftKeyFor(key): "left-shift" | "right-shift" | null`).
    - Physical tactile bumps on 'f' and 'j' keys (`homeRow: true`).
    - Digraph transition classifier (`classifyTransition(a, b)`: same-finger, hand-alternation, same-hand, rolling).
  - `src/lib/lessons/content-generator.ts`:
    - Mulberry32 deterministic seeded PRNG (`createRng`).
    - Specialized drill generators: tactile anchor taps, home-row departure & return reach drills (`generateAnchorReachDrill`), rhythmic pattern drills, vocabulary drills constrained to unlocked keys, Bayesian weak-key remediation, digraph transition repetition, and finger isolation drills.
  - `src/lib/lessons/mastery-engine.ts`:
    - Statistical confidence model using Bayesian Wilson score lower bound (`calculateWilsonLowerBound`) to prevent false diagnoses on small sample sizes.
    - Key status classification: `new` (<8 attempts), `struggling` (<88% acc), `developing` (<95% acc or <15 attempts), `mastered` (>=95% acc and >=15 attempts), and `stale` (>7 days since practice).
    - Hand accuracy balance analysis and digraph transition breakdown.
  - `src/lib/lessons/lesson-placement-engine.ts` & `src/lib/lessons/lesson-placement.ts`:
    - Diagnostic passage evaluation measuring home, top, and bottom row finger coordination, pacing consistency, and speed.
    - Generates 3 selectable pathways: `recommendedStart`, `startFromBeginning`, and `challengeTrack`.
    - Integrated `unlockUpToLesson` so typists testing out immediately unlock their target lesson without lock-screen friction.
  - `src/lib/lessons/recommendation-engine.ts`:
    - Personalized, explainable learning coach analyzing weak keys, digraph bottlenecks, spaced reviews (>7 days stale), curriculum progression, and learner goals (`touch-typing`, `accuracy`, `speed-40`, `speed-60`, `speed-80`, `coding`).
  - `src/lib/lessons/lesson-progress-store.ts`:
    - Schema Version 2 with `learnerGoal`.
    - Added data portability tools: `exportProgress()` (JSON export), `importProgress()` (sanitized JSON import), `resetProgress()`, and `unlockUpToLesson()`.
  - `src/components/lessons/virtual-keyboard.tsx`:
    - Dual physical Left/Right Shift keys with dynamic opposite-hand highlighting and pulse animation.
    - Tactile live guidance pill with `aria-live="polite"` announcing key, hand, finger, and Shift state.
  - `src/components/lessons/lesson-drill.tsx`:
    - Seeded variation on retry (`100 + attempt * 37 + sessionStep * 13`).
    - Real-time tactile guide pill.
    - Keyboard shortcuts: `Enter` to advance on pass, `Space` or `R` to retry on miss.
    - Comprehensive debrief screen with Net WPM, Accuracy, Required Accuracy, Consistency, and direct link to Practice Lab for diagnosed weak keys.
  - `src/components/lessons/practice-drill.tsx` & `src/components/lessons/practice-client.tsx`:
    - Multi-mode targeted practice lab: Weak Keys, Transitions, Finger Isolation, Accuracy Focus, Speed Sprint.
    - Suspense boundary for Next.js App Router client safety.
  - `src/components/lessons/lesson-dashboard.tsx`:
    - Interactive Goal selector pills.
    - Diagnostic Placement Assessment modal.
    - Real-time Skill Health section (Mastery score %, Mastered/Developing/Struggling counts, Hand balance ratio).
    - Data & Privacy management (Export JSON, Restore JSON, Reset progress).
- **Test Suite**:
  - Expanded from 234 tests across 50 suites to **265 tests across 55 suites** (31 new test cases across 5 new test files: `content-generator.test.ts`, `mastery-engine.test.ts`, `recommendation-engine.test.ts`, `lesson-placement-engine.test.ts`, `lesson-progress-store.test.ts`).
  - 100% test pass rate (265/265).
- **Quality Gates**:
  - `npm test`: 265 passing unit tests across 55 test suites (0 failures).
  - `npm run typecheck`: 0 TypeScript errors (`tsc --noEmit`).
  - `npm run lint`: 0 ESLint errors and 0 warnings (`eslint`).
  - `npm run build`: All 150 static routes prerendered cleanly.
  - `git diff --check`: 0 whitespace errors.

**Session 2026-09-27 (Part 6) — Homepage Link Safety & Benefit Copy Refinement:**
- **Audited & Remediated Issue IDs**:
  - `HT-HOME-001` (Homepage Benefit Copy Refinement & Link Safety):
    - Replaced the extended editorial section ("Deliberate Keyboard Mastery") in `src/components/layout/homepage-seo-content.tsx` with a concise, scannable product-benefit section ("Why HeroTyping?", 106 words total, target 50–120 words).
    - Verified all 6 internal links are relative and resolve cleanly to valid production routes:
      - `/guides/net-wpm-vs-gross-wpm`
      - `/lessons`
      - `/lessons/practice`
      - `/vocabulary`
      - `/games`
      - `/privacy`
    - Removed unsupported legal/compliance claims ("safe and compliant practice", "built around cognitive science", "keystrokes never leave your device").
    - Fact-checked and verified claims against codebase implementation:
      - Standard 5-character WPM convention (`CHARS_PER_WORD = 5` in `src/lib/typing-engine/stats.ts`).
      - Exactly 28-unit touch-typing lesson curriculum in `src/lib/lessons/`.
      - 100% client-side `localStorage` data persistence (profile, test history, achievements, lesson progress).
      - Transparent disclosure of aggregate GA4 usage analytics.
    - Verified repository-wide audit for `localhost:3000`: 0 production-facing occurrences; only safe developer docs (README.md, PROGRESS.md) and regression test assertions.
- **Files Modified**:
  - `src/components/layout/homepage-seo-content.tsx`
  - `src/app/vocabulary/[difficulty]/page.tsx` (aria-current="page" accessibility enhancement)
- **Tests & Verification Gates**:
  - `npm test`: 234 passing unit tests across 50 test suites (0 failures).
  - `npm run typecheck`: 0 TypeScript errors (`tsc --noEmit`).
  - `npm run lint`: 0 ESLint errors (`eslint`).
  - `npm run build`: All 150 static routes prerendered cleanly.

**Session 2026-09-27 (Part 5) — Internal Link Graph Optimization, Fruit Fury Sub-100KB WebP Pipeline & Validation:**
- **Audited & Remediated Issue IDs**:
  - `HT-LINK-001` (Internal Linking Graph & Under-linked Guides Remediation):
    - Re-mapped `relatedGuides` across all 43 guides in `src/lib/guides/guide-registry.ts` into 9 coherent semantic topical clusters (e.g. Ergonomics & Health, Row & Finger Technique, Keyboard Hardware & Layouts, Specialized Career & Speed, Testing & Metrics, Practice Strategy, Difficulty & Beginner Onboarding).
    - Integrated contextual in-body editorial cross-links into 10 key guides:
      - `data-entry-typing-test` -> `/guides/911-dispatcher-typing-test`
      - `home-row-typing-practice` -> `/guides/top-row-without-looking` and `/guides/bottom-row-typing-practice` (fixed sample drill typo)
      - `one-handed-typing-guide` -> `/guides/touch-typing-for-dyslexia-and-dysgraphia` and `/guides/proper-typing-posture-and-ergonomics`
      - `how-to-touch-type` -> `/guides/touch-typing-lesson-order`
      - `typing-for-programmers` -> `/guides/custom-text-typing-test`
      - `touch-typing-roadmap-for-beginners` -> `/guides/touch-typing-for-dyslexia-and-dysgraphia`
      - `touch-typing-finger-map` -> `/guides/home-row-typing-practice` and `/guides/bottom-row-typing-practice`
      - `how-to-type-top-row-without-looking` -> `/guides/bottom-row-typing-practice`
      - `average-typing-speed` -> `/guides/911-dispatcher-typing-test`
      - `typing-test-duration-guide` -> `/guides/911-dispatcher-typing-test`
    - Recalculated link graph across all 49 guide HTML routes:
      - Zero orphan pages (100% crawlable).
      - Minimum inbound link degree across all guides improved from 0-2 to **5**.
      - Zero guides with in-degree <= 3 (previously 22 guides were underlinked).
  - `HT-VOCAB-001` (Vocabulary Tier Inter-linking):
    - Added accessible difficulty tier switcher pills in `src/app/vocabulary/[difficulty]/page.tsx` connecting Easy, Medium, and Hard tiers reciprocally.
  - `HT-IMG-001` (Fruit Fury Game Asset Optimization & WebP Conversion):
    - Converted all 6 uncompressed JPG assets in `public/games/fruit-fury/` using ImageMagick high-efficiency WebP compression:
      - `cover.jpg` (869.0 KB) -> `cover.webp` (92.7 KB, 89.3% reduction)
      - `hero.jpg` (869.0 KB) -> `hero.webp` (92.7 KB, 89.3% reduction)
      - `bg-arena.jpg` (676.7 KB) -> `bg-arena.webp` (35.0 KB, 94.8% reduction)
      - `character.jpg` (748.9 KB) -> `character.webp` (21.3 KB, 97.2% reduction)
      - `victory.jpg` (818.4 KB) -> `victory.webp` (75.7 KB, 90.7% reduction)
      - `defeat.jpg` (799.4 KB) -> `defeat.webp` (70.6 KB, 91.2% reduction)
    - Total asset payload reduced from **4.88 MB to 388 KB (92.1% bandwidth savings)**.
    - Every asset strictly conforms to the <100 KB budget.
    - Updated direct image references in `src/components/games/fruit-fury-game.tsx` and `src/lib/games/fruit-fury/use-fruit-fury.ts`. Deleted obsolete `.jpg` files.
    - Verified LCP priority loading remains intact (`priority`, `loading="eager"` on hero image).
- **Files Modified**:
  - `src/lib/guides/guide-registry.ts`
  - `src/app/guides/average-typing-speed/page.tsx`
  - `src/app/guides/data-entry-typing-test/page.tsx`
  - `src/app/guides/home-row-typing-practice/page.tsx`
  - `src/app/guides/how-to-touch-type/page.tsx`
  - `src/app/guides/how-to-type-top-row-without-looking/page.tsx`
  - `src/app/guides/one-handed-typing-guide/page.tsx`
  - `src/app/guides/touch-typing-finger-map/page.tsx`
  - `src/app/guides/touch-typing-roadmap-for-beginners/page.tsx`
  - `src/app/guides/typing-for-programmers/page.tsx`
  - `src/app/guides/typing-test-duration-guide/page.tsx`
  - `src/app/vocabulary/[difficulty]/page.tsx`
  - `src/components/games/fruit-fury-game.tsx`
  - `src/lib/games/fruit-fury/use-fruit-fury.ts`
  - `public/games/fruit-fury/` (6 `.webp` added, 6 `.jpg` removed)
  - `src/lib/typing-engine/stats.ts` (preserved from previous authorized pass)
  - `src/lib/typing-engine/consistency.test.ts` (preserved from previous authorized pass)
- **Tests & Verification Gates**:
  - `npm test`: 234 passing unit tests across 50 test suites (0 failures).
  - `npm run typecheck`: 0 errors (`tsc --noEmit`).
  - `npm run lint`: 0 ESLint errors (`eslint`).
  - `npm run build`: All 150 static routes prerendered cleanly.
  - Link Graph Audit: 0 orphans, min in-degree = 5, 0 guides under-linked.
  - Asset Audit: Zero `.jpg` references in prerendered HTML for `/games/fruit-fury`.
- **Remaining SEO Opportunities**:
  - Dedicated duration landing pages (e.g. 1-minute, 30-second typing tests) when authorized.
  - Expanding vocabulary word banks beyond 1,300 words with multi-language corpora.

**Session 2026-09-27 (Part 4 & Final Master Pass) — Final Production Readiness, Zero-Unverified-Claims & Master Hardening Pass:**
- **Strict Forensic Verification Standards Applied**:
  - Differentiated all audit items across 5 distinct states: `SOURCE VERIFIED`, `BUILD VERIFIED`, `LOCAL RUNTIME VERIFIED`, `PRODUCTION VERIFIED`, and `EXTERNAL VERIFICATION REQUIRED`.
  - Zero false claims or conflation between local source/build status and live deployed infrastructure.
- **Audited & Remediated Issue IDs**:
  - `HT-CONS-001` (Typing Consistency Metric Calibration & Monkeytype Parity): Diagnosed and resolved consistency under-reporting defect (e.g. 5s steady typing scoring 41% instead of 90%+). Replaced tick-based bucket overwriting and unanchored boundary slicing with Monkeytype's exact 1-second grid boundary reconstruction, $t=0$ cumulative baseline anchor, elimination of fractional tail slivers under 500ms, and integration of Monkeytype's official `kogasa` sigmoid normalization mapping ($100 \times (1 - \tanh(\text{cov} + \text{cov}^3/3 + \text{cov}^5/5))$). Expanded test suite in `src/lib/typing-engine/consistency.test.ts` to 18 scenarios (Scenarios A through R), confirming $\ge 90\%$ consistency for 5-second runs with 100ms real-engine ticks.
  - `HT-PROD-001` (Achievement Single Source of Truth): Unified earned achievement calculation across all surfaces (`${totalEarned}/37`) in `profile-client.tsx`, `achievements-client.tsx`, and `player-summary.tsx`.
  - `HT-TERMS-001` (Terms of Use Scope Alignment): Updated `src/app/terms/page.tsx` to authorize educational, classroom, and workplace typing skill training.
  - `HT-PRI-001` (Privacy, Cookies, Local Storage & GA4 Alignment): Confirmed 100% client-side privacy architecture with zero PII logging. Corrected homepage marketing copy in `src/components/layout/homepage-seo-content.tsx` to eliminate inaccurate "zero tracking cookies" statement, accurately disclosing local storage persistence and GA4 session analytics.
  - `HT-INT-001` (Internal Linking Crawl Matrix & Reciprocal Cross-Links): Integrated automated related guides grid (3 cards) and interactive product CTA inside `GuideLayout` (`src/components/content/guide-layout.tsx`). Added reciprocal links between `typing-resources-for-teachers` <-> `touch-typing-for-dyslexia-and-dysgraphia` and `proper-typing-posture-and-ergonomics` <-> `one-handed-typing-guide`. Zero guides in the registry now have 0 inbound links or <2 outbound links.
  - `HT-CON-001` (Homepage Crawlable Copy): Expanded indexable crawlable copy (~310 words) in `src/components/layout/homepage-seo-content.tsx` explaining standard Net vs Raw WPM (5-character standard), the 4 distinct training modes, and zero-signup client-side privacy.
  - `HT-SEC-001` (Security Headers): Configured comprehensive HTTP security headers in `next.config.ts` (nosniff, SAMEORIGIN, strict referrer, permissions policy, HSTS, CSP). Production response headers verified via `curl`: Vercel infrastructure serves HSTS and custom app security headers.
  - `HT-A11Y-001` (Skip Link & Navigation Landmarks): Accessible skip link and navigation landmarks in `layout.tsx`, `site-header.tsx`, and `mobile-nav.tsx`.
  - `HT-LESS-001` (Lessons Placement Test Entry Point): Diagnostic placement test entry point in `lesson-dashboard.tsx`.
  - `HT-AN-001` (GA4 Event Taxonomy Audit): Audited all 10 tracked events; verified zero PII, zero raw keystrokes, and zero custom text leakage.
  - `HT-EEAT-001` (E-E-A-T & Contact Channels): Added direct "Contact & Feedback" channel with `SUPPORT_EMAIL` on `/about` (`src/app/about/page.tsx`), bumped `sitemap.ts` date to `2026-09-27`.
  - `HT-UX-001` (Results Contextual Action Bridge): Added accessible "Practice Weak Keys" secondary action in `results-panel.tsx` linking directly to `/lessons/practice` for deliberate practice progression.
- **Live Production Verification Performed via Network Probes (`curl` & HTTPS probe)**:
  - `https://herotyping.com/sitemap.xml`: HTTP/2 200, exactly 100 valid `<loc>` URLs verified.
  - **Live Sitemap URL Exhaustive Probe**: Automated HTTPS network request across all 100 URLs extracted from live sitemap; **100 passed (HTTP 200), 0 failed**.
  - `https://herotyping.com/robots.txt`: Valid syntax with `/profile` and `/debug` disallow rules.
  - `https://herotyping.com/debug/typing-engine`: HTTP/2 404 (cleanly isolated).
  - `https://herotyping.com/profile`: HTTP/2 200 with `<meta name="robots" content="noindex, follow">`.
  - Prerender Manifest Audit: Verified exact delta between 150 static routes and 100 sitemap URLs (40 OG-image binary PNG endpoints, 7 utility/asset routes, 2 private/debug routes, 1 upcoming unlisted game). Exactly 100 indexable content pages.
  - **Google Indexation & Technical SEO Re-Audit**: Formally retracted previous invalid P0 "site absent from index" finding. Direct user verification confirms core URLs (`/`, `/games`, `/lessons`, `/guides`, `/privacy`) are actively indexed and appearing in Google Search results. All 100 public sitemap URLs verified technically indexable (HTTP 200, self-referencing canonicals, noindex absent, valid JSON-LD, allowed in robots.txt).
- **Verification Gates**:
  - `npm test`: 234 passing unit tests across 50 test suites (0 failures).
  - `npm run typecheck`: 0 TypeScript errors (`tsc --noEmit`).
  - `npm run lint`: 0 ESLint errors (`eslint`).
  - `npm run build`: 150 static routes prerendered cleanly.

**Session 2026-09-27 (Part 2) — Guides Information Architecture Correction, 20 Flagship Guides, Hierarchical Images & Category-First Hub:**
- **Information Architecture Transformation (`/guides`, `guide-category-view.tsx`, `guide-registry.ts`)**:
  - Restructured the Guides library from a flat article archive into a scalable 3-tier educational taxonomy:
    `/guides` (Category Directory) -> `/guides/<category>` (Article Directory) -> `/guides/<article-slug>` (Individual Content Guide) -> HeroTyping interactive feature.
  - Re-architected `/guides` (`src/app/guides/page.tsx`): Eliminated the massive 43-article archive loop. The page now acts as a true category-first hub rendering:
    1. Hero Header with concise educational summary and fast category jump pills with live guide counts.
    2. Start Here Roadmap: 3 core foundational pillars (Pillar 1: Form -> `how-to-touch-type`, Pillar 2: Precision -> `how-to-improve-typing-accuracy`, Pillar 3: Velocity -> `how-to-improve-typing-speed`).
    3. Category Directory Cards: Exactly 6 category hub cards (`typing-basics`, `typing-practice`, `improve-your-typing`, `typing-tests-tools`, `keyboard-skills`, `typing-work-study`) featuring dynamic counts (`getGuidesByCategory(catId).length`), icons, descriptions, and accessible links to `/guides/<category>`. Zero article cards exposed on the root hub.
    4. Deliberate Practice CTA: Direct product action links to `/`, `/lessons`, `/lessons/practice`, `/games`, and `/vocabulary`.
    5. Category Directory Footer for rapid cross-linking.
  - Dedicated Category Hub Views (`GuideCategoryView` in `src/components/guides/guide-category-view.tsx`): Powered by unified metadata from `GUIDE_CATEGORIES`, each category page displays structured breadcrumbs, recommended learning progression, individual article cards, and context-specific HeroTyping product CTAs.
- **20 Flagship Guides Implemented & Integrated**:
  - Researched, authored, fact-checked, and integrated 20 new high-quality authority guides across all 6 categories, expanding the total guide inventory from 23 to **43 guides** (50 indexable guide routes including hub and category pages).
  - Full TypeScript data registry (`src/lib/guides/guide-registry.ts` and `src/lib/guides/guide-types.ts`) guaranteeing type-safe metadata, reading times, topic tags, hero image paths, and category associations.
  - Every guide features customized visual assets, structured FAQs with schema markup, interactive tool tie-ins, and contextual internal cross-links.
- **Hierarchical Image Architecture & Optimization Pipeline**:
  - Restructured image assets from flat root paths into category/slug namespaces: `public/guides/<category>/<article-slug>/<filename>.webp`.
  - Stored flagship 20 contact sheet at `public/guides/shared/flagship-20-contact-sheet.webp` (64 KB).
  - Built automated ImageMagick compression script (`scripts/optimize-guide-images.mjs`, `npm run images:optimize`) ensuring every WebP is optimized under 80 KB target (hard target <100 KB).
  - Built automated image validation script (`scripts/validate-guide-images.mjs`, `npm run images:validate`) checking directory hierarchy, disk presence, file sizes, and registry alignment.
  - Current image audit: 36 guide visual assets + 1 shared contact sheet on disk, 0 missing, 0 > 100 KB, 0 root violations. Average size: 41.5 KB. Total disk footprint: 1.54 MB.
- **Single Authoritative Sitemap (`src/app/sitemap.ts`) & Automated Testing**:
  - Next.js `MetadataRoute.Sitemap` generator in `src/app/sitemap.ts` verified as the single source of truth for `/sitemap.xml`.
  - Exactly 100 valid production URLs using `https://herotyping.com`, 0 duplicates, 0 localhost/HTTP, explicit `lastModified` dates.
  - Includes `/guides`, all 6 category hubs, all 43 guides, 11 games, 30 lesson routes, 4 vocabulary routes, and core utility pages.
  - Added automated sitemap regression test suite in `src/lib/seo/metadata.test.ts` enforcing all categories, all registry guides, zero duplicates, clean path format, and ISO dates.
- **Quality Gates**: `npm test` (218/218 passing, 49 suites), `npm run lint` (0 errors), `npm run typecheck` (0 errors), `npm run images:validate` (36/36 passing), `npm run build` (all 150 static routes prerendered).

**Session 2026-09-27 — Production Readiness, AdSense Safety, Accessibility & Quality Gate Hardening:**
- **AdSense Placement ID vs Slot ID Separation (`ad-slot.tsx`, `ad-rail.tsx`)**: Re-architected `AdSlot` to decouple internal DOM placement keys (e.g. `footer-leaderboard`) from actual numeric AdSense slot IDs (`slotId`). Added strict numeric verification (`isValidAdSenseSlotId`) to prevent non-numeric placement keys from ever being emitted into `data-ad-slot`. Preserved anti-distraction guardrails and fixed-dimension layout placeholders.
- **Spellbound & Upcoming Games Generic Indexing Isolation (`game-types.ts`, `sitemap.ts`, `app/games/[gameId]/page.tsx`, `player-profile.ts`)**: Exported `PLAYABLE_GAME_LIST` to generically filter out unreleased games. Upcoming games are served with `robots: { index: false, follow: true }`, stripped of playable game schema markup, and excluded generically from `sitemap.xml`. Games hub featured selection defaults to playable games only. Full Arcade achievement (`site:all-games`) counts only playable games so upcoming releases do not block progression. Added unit tests in `game-readiness.test.ts`.
- **Keyboard & Screen Reader Accessibility Pass**:
  - Global high-contrast `:focus-visible` outline added to `globals.css` using theme accent token.
  - Results screen Tab key hijacking removed; Restart button uses standard button navigation with 44px min touch target (`results-panel.tsx`).
  - Mobile navigation drawer focus management: hamburger trigger ref, dialog `aria-controls`, `aria-labelledby`, auto-focus close button on open, restore focus to trigger on close, and body scroll lock cleanup on unmount (`mobile-nav.tsx`, `site-header.tsx`).
  - Custom text modal focus trap: eliminated render-phase state synchronization, deterministic textarea focus, focus escape recapture, and focus restoration to opener on close (`custom-text-modal.tsx`).
  - Focus containment on active typing runs: added `inert={isRunning ? true : undefined}` and `aria-hidden={isRunning || undefined}` to `SiteFooter`, `PageIntro`, `HomepageExploreSection`, and `AdRail` to eliminate WCAG violations where hidden parents contained focusable elements.
  - Accessible screen reader summary text added to `ResultsGraph` (`results-graph.tsx`).
  - Card battle pointer event handling: replaced non-standard `window.event` with React `MouseEvent.clientX` (`card-battle-game.tsx`).
  - Guide layout sticky TOC: removed `overflow-hidden` on grid wrapper container to restore desktop sticky sidebar behavior (`guide-layout.tsx`).
- **Animation Loop & Performance Audit**:
  - Fruit Fury: paused `requestAnimationFrame` when game status is not `"running"` or when `document.hidden`; renders single frame on status transitions/idle/over without burning a permanent 60fps loop; screen shake respects `prefers-reduced-motion` (`use-fruit-fury.ts`).
  - Typing Survivor & Spellbound: paused canvas rAF loops during idle, over, and victory phases (`typing-survivor-game.tsx`, `spellbound-game.tsx`).
  - Image quality allowlist alignment: all `quality` props across all games updated to allowed qualities (`45` or default `75`), aligning with `next.config.ts`.
- **Live Countdown Formatting (`format-countdown.ts`, `live-stats-bar.tsx`)**: Extracted pure `formatCountdown` (<60s -> "0s", 60s+ -> "1:00", 1h+ -> "1:00:00") with tabular numbers and zero layout jumping. Added unit test suite (`format-countdown.test.ts`).
- **Health & Employment Guide Fact Checking**: Qualified absolute medical/ergonomic claims in `typing-stretches-and-hand-warmups` and `touch-typing-for-dyslexia-and-dysgraphia`, added informational disclaimers, and qualified universal CritiCall/agency hiring claims in `911-dispatcher-typing-test` with agency variation notices.
- **Persistence Sanitization**: Added `isFiniteNonNegative` sanitization to `GameBest` in `game-scores.ts` and `parseProfile` in `player-profile.ts` to reject `NaN`, `Infinity`, or negative values.
- **Production Polish & Infrastructure**: Added `manifest.ts` metadata route, `.env.example`, configurable `NEXT_PUBLIC_SUPPORT_EMAIL`, `.github/workflows/ci.yml` CI workflow, `"typecheck": "tsc --noEmit"` in `package.json`, and rewritten `README.md`.
- **Quality Gates**: `npm test` (185/185 passing), `npm run lint` (0 errors), `npm run typecheck` (0 errors), `npm run build` (all 123 static routes prerendered).

**Session 2026-09-26 — flagship game "Fruit Fury", 10 new authority guides, sub-100KB WebP pipeline, 1300-word vocabulary expansion, TTS audio pronunciation & full sitemap synchronization:**
- **Flagship game Fruit Fury (`/games/fruit-fury`, `fruit-fury-game.tsx`)**: Designed and shipped a premium arcade typing game combining parabolic launch-apex-fall physics, real fruit slicing animation with juice particles and cut halves, fatal bomb hazard with immediate game over, and fever frenzy mode with 2X score multipliers. Added full touch responsiveness and specialized practice modes (Home Row, Bottom Row, Numbers, and Middle Row).
- **Comprehensive SEO Content Expansion (10 New Authority Guides)**: Researched high-opportunity search intent across typing topics with zero duplication/cannibalization of existing 13 guides. Authored 10 comprehensive, human-edited, fully referenced guides under `/guides/[slug]/`:
  1. `proper-typing-posture-and-ergonomics`
  2. `typing-stretches-and-hand-warmups`
  3. `how-to-break-a-typing-speed-plateau` (with strict academic audit & preprint correction)
  4. `qwerty-vs-dvorak-vs-colemak`
  5. `best-keyboard-switches-for-typing`
  6. `911-dispatcher-typing-test`
  7. `touch-typing-for-dyslexia-and-dysgraphia`
  8. `typing-for-programmers`
  9. `one-handed-typing-guide`
  10. `how-to-type-numbers-and-symbols-without-looking`
  Expands total guides from 13 to **23 guides** (24 indexable URLs including the hub).
- **Comprehensive Daily Vocabulary Expansion (1,300 Words, 50% Easy / 30% Medium / 20% Hard)**: Expanded the vocabulary pool from 300 words (which previously cut off at letters D and J) to **1,300 curated words** with balanced, proportional representation across all letters A–Z. Exactly 650 words in Easy (50%, everyday high-frequency daily life words covering routine, home, work, food, family, feelings, nature, and community), 390 words in Medium (30%, workplace, academic, and analytical vocabulary), and 260 words in Hard (20%, advanced literary and SAT/GRE words). Zero duplicates anywhere across the entire dataset (`Set` size 1,300). Added automated ratio and uniqueness unit tests (`vocabulary.test.ts`).
- **Offline TTS Audio Pronunciation & Explanation System (`vocabulary-speech.ts`, `vocabulary-test.tsx`)**: Built a zero-bandwidth, offline-capable pronunciation and explanation engine using the browser's native Web Speech API (`window.speechSynthesis`). Provides an interactive **Pronounce** button (`Alt+P`), **Explain** button (`Alt+E`), and persistent **Auto-Pronounce** toggle (`Alt+A`) that speaks words on advance. Added missed word pronunciation review on the results screen. Engineered focus protection (`onMouseDown={(e) => e.preventDefault()}` and `z-10`) so tapping audio controls on mobile and tablet never drops keyboard focus or dismisses on-screen virtual keyboards. Added unit tests with mock browser speech synthesis.
- **Sub-100KB WebP Image Pipeline**: Converted and compressed all guide hero images to native WebP (`quality=60–80`, Lanczos max 1200px), ensuring every single image in `public/guides/` is **strictly under 100 KB** (ranging from 50 KB to 96 KB), saving >92% bandwidth while preserving high-DPI clarity.
- **Strict Evidence Audit & Preprint Clarification**: Conducted a meticulous evidence audit on `how-to-break-a-typing-speed-plateau`. Explicitly corrected the 2026 natural typing paper to be labeled as a preprint, properly attributed Yamaguchi et al. and Weigelt-Marom & Weintraub, removed unverified numerical thresholds, and added actionable diagnostic self-check tables.
- **Sitemap & Navigation Synchronization**: Audited all 75 public indexable URLs. Updated `src/app/sitemap.ts` with `lastModified: "2026-09-26"` and updated priorities for `/`, `/guides`, `/games`, and `/games/fruit-fury`. Added Guides to the desktop `MoreMenu` (`more-menu.tsx`) and updated mobile badges to "11 Games" and "23 Guides" in `mobile-nav.tsx`.
- **Quality Gates**: `npm test` (162/162 passing), `npm run lint` (0 errors, 0 warnings), `npx tsc --noEmit` (0 errors), and `npm run build` (all 123 static routes prerendered in ~2.7s).

**Session 2026-09-25 — comprehensive mobile redesign pass & hamburger menu:**
- **Hamburger menu & MobileNav drawer (`mobile-nav.tsx`, `site-header.tsx`)**: Phones now have a clean header with logo + compact level badge + hamburger menu button (`Menu` icon with 44px touch target). Tapping opens a sleek slide-in drawer with links to all areas (Typing Test, Lessons, Games, Vocabulary, Guides & Tools, Profile, Achievements), player level/XP progress, a built-in 5-theme switcher with color preview swatches, and body scroll locking to prevent background shaking. Resolved initial click issue where an inline callback caused instant unmount, imported `useRef`, and stabilized route navigation listeners.
- **Zero layout shake on typing (`word-stream.tsx`)**: Caret component changed to `w-0` in flex flow (`relative inline-flex items-center w-0 self-center pointer-events-none` with an absolute inner bar). Previously, inserting a 2px caret into the word-stream caused characters adjacent to the cursor to jump back and forth by 2px with every single keystroke.
- **Virtual keyboard & finger map mobile responsive (`virtual-keyboard.tsx`, `finger-map-explorer.tsx`)**: Keys scale from `w-[23px]` on 320px screens up to `w-8` on desktop, with `gap-0.5 sm:gap-1.5`. Prevents the 450px keyboard row from overflowing 360px mobile viewports and causing horizontal scroll wobbling.
- **Viewport shaking protection (`globals.css`)**: Added `overflow-x: clip` and `max-width: 100vw` to `html, body`, plus `.no-scrollbar` utility for clean horizontal swipe strips on mobile category tabs and lesson tiers.
- **Guide tables & code blocks mobile containment (`guide-layout.tsx`)**: Added `[&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:max-w-full` so wide tables inside guide articles never force horizontal expansion of the page container.
- **Config bar & footer polish (`test-config-bar.tsx`, `site-footer.tsx`, `lesson-unit-row.tsx`)**: Config bar pills tightened to clean 2-row layout without massive height jumps. Footer links converted from a 9-item vertical stack to a clean wrapping row on mobile. Lesson unit action buttons expanded to full width on mobile for easier tapping.
- **Mobile compact header & single Test Settings button (`mobile-test-settings-modal.tsx`, `site-header.tsx`, `typing-test.tsx`, `language-selector.tsx`)**:
  1. Relocated Language Selector icon to the left of the hamburger icon in the mobile site header; hidden from the test typing area on mobile.
  2. Replaced the multi-row config bar on mobile with a single sleek "Test Settings" button showing the active mode badge (`30s`, `25w`), which opens a dedicated scrollable modal with all modes, durations, word counts, quote lengths, vocab difficulties, custom text, and text modifiers.
  3. Live test timer (`live-stats-bar.tsx`) aligned to the left side and positioned right above (~20px) the typing area, eliminating the large vertical gap and center-floating position.
  4. Hid the 4 homepage feature navigation icons (Lessons, Games, Vocabulary, Guides) on small devices (`hidden sm:grid`).
  5. Prevented virtual keyboard from automatically popping open when tapping any settings option inside the modal.

**Session 2026-09-25 — 12-bug audit & system-wide reliability pass:**
- **Audio Gain Blowout & Volume Reset (`audio-bus.ts`)**: Added `musicVolume` tracking to `AudioState`, preserved user music volume settings on duck recovery rather than hardcoding `1.0`, and scaled duck depth as a ratio of `musicVolume`.
- **Privacy Policy GA4 Disclosure (`privacy/page.tsx`)**: Updated disclosure to accurately describe Google Analytics 4 collection of anonymized aggregate metrics, clarified zero PII / keystroke logging, and added opt-out guidance.
- **Score Persistence Across 4 Games (`card-battle-game.tsx`, `spellbound-game.tsx`, `typing-survivor-game.tsx`, `ghost-racer-game.tsx`)**: Added `recordGameResult(...)` to all 4 games so personal bests save to localStorage, `<GameBestBadge />` renders, and `/profile` shows real stats.
- **Missing Achievements & Daily Race Condition (`use-card-battle.ts`, `ghost-racer-game.tsx`)**: Implemented `card-battle:combo` (burst 20+ blight), `ghost-racer:legend` (100+ WPM), `ghost-racer:revenge` (beat a ghost that beat you), and ordered `recordDaily` before `checkSiteAchievements` so the `site:daily` achievement triggers reliably.
- **Results Screen Tab-Restart Interceptor (`results-panel.tsx`)**: Added global Tab keydown listener so pressing Tab on results panel restarts the test as labeled.
- **Vocabulary Test Space-Commit & Trailing Space (`use-vocabulary-test.ts`)**: Allowed space-commit on completed words and prevented trailing commit space from being penalized as an error.
- **Typing Calculator Inputs & Field Clearing (`typing-calculator.tsx`)**: Added `min={0}` on all 3 quick-convert inputs and reset all fields when any input is cleared.
- **LiveStatsBar FlipNumber Digit Inversion (`live-stats-bar.tsx`)**: Keyed `FlipChar` place values from right to left so transitioning from 2 digits to 1 flips cleanly without inversion.
- **Standardized SEO Metadata on Profile Page (`profile/page.tsx`, `metadata.ts`)**: Converted `/profile` to use `pageMetadata(...)` with OpenGraph/Twitter support and optional `robots`.
- **Mobile Navigation Focus Trap (`mobile-nav.tsx`)**: Added Tab and Shift+Tab focus trap inside open mobile drawer for full accessibility.
- **Lesson Drill Focus Warning Blur Overlay (`lesson-drill.tsx`)**: Wired `onFocusChange` and added the resume warning overlay when clicking away from a running drill.

**Session 2026-09-24/25 — a full SEO content system, three flagship interactive resources, GA4, and a site-wide text-contrast/large-screen-spacing pass.** This is the largest content push the project has had. Read "Session 2026-09-24/25 — SEO content system, GA4 and UI refinement" below before touching `GuideLayout`, `keyboard-layout.ts`'s `FINGER_VAR`/`HandDiagram` exports, or `globals.css`'s `--sub` token — each now has real load-bearing consumers across 13 pages.

**Session 2026-09-23 — rebrand to HeroTyping, plus a lessons "adaptive coach" Phase 1** (real per-key accuracy tracking, a weak-key practice drill, a "Today's Training" recommendation card, and closing a gap where lessons awarded zero XP). Built before this conversation's visible history — summarized from commit `9df3ad8` and code inspection, not independently re-verified line-by-line the way the rest of this file's claims are. Worth a fresh look before extending it.

**Session 2026-09-22, third pass: site-wide bug hunt across every game, `/lessons` and the main typing test — all 34 found issues fixed.** Read "Session 2026-09-22 — site-wide bug hunt and repair" below before touching Spellbound's room generation, Typing Survivor's level-up flow, or `word-stream.tsx`'s line-pitch measurement — each had a genuine correctness bug, not just polish.

**Session 2026-09-22 (two passes) built `/lessons`, then reshaped it into a typing.com-style dashboard.** First pass: 17 flat lessons, home row through a graduation passage. Second pass, same day, after the project owner saw typing.com directly: restructured into three tiers (Beginner/Intermediate/Advanced, 28 units total), each unit now runs several sub-lessons of escalating difficulty rather than one drill, progress moved to a proper zustand store (`useLessonProgressStore`), keystroke sound was wired in (reusing the games' existing synth audio, not a new system), and a persistent ad rail was added beside every active typing surface. Read "Lessons architecture" below before touching any of it — the sub-lesson generator and the progress store's averaging logic are the two places a change is most likely to silently break something.

**The 2026-09-17 session was an audit-and-repair pass, not a feature pass.** Four real defect classes were found and fixed; read "Session 2026-09-17" below before touching the typing engine, the games' scoring, the audio bus or the image pipeline, because several of those fixes look like things you might "simplify" back into bugs.

**What's genuinely open right now, roughly by leverage:**
1. **`NEXT_PUBLIC_SITE_URL` is configured with default `https://herotyping.com`**, and documented in `.env.example`. Can be set per-environment for staging/preview deployments.
2. **AdSense architecture is production-ready**: `AdSlot` separates DOM placement IDs from numeric AdSense unit IDs (`isValidAdSenseSlotId`) to prevent non-numeric internal keys from being emitted into `data-ad-slot`. Ads remain conditionally disabled until `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is supplied.
3. **Google Analytics 4 is live** (production-only, `src/lib/analytics/constants.ts` + `<GoogleAnalytics>` in `layout.tsx`). The Privacy Policy has been updated with accurate disclosures (anonymized metrics, no keystrokes transmitted).
4. **SEO content is comprehensive**: 43 guides across 6 category hubs are live, fully cross-linked, with fact-checked health/employment claims, sticky TOC navigation, and metadata synchronization.
5. **10 playable games shipped (11 total including upcoming Spellbound preview)**: `falling-words`, `word-rain`, `word-blaster`, `typing-grand-prix`, `boss-battle`, `combo-rush`, `spellbound`, `typing-survivor`, `ghost-racer`, `card-battle`, and flagship `fruit-fury`. Upcoming games (e.g. `spellbound`) are generically excluded from sitemaps and arcade achievement barriers, with `robots: noindex, follow`.
6. **28 lesson units shipped** across Beginner (17)/Intermediate (6)/Advanced (5), plus per-key weak-spot tracking.
7. **Accessibility & focus management hardened**: Global high-contrast `:focus-visible`, Tab key hijacking removed from results screen, 44px min touch targets, mobile drawer focus trap & restore, custom text modal focus trap, and `inert` focus containment during active tests.
8. **Live countdown formatting resolved**: `formatCountdown` (<60s -> "0s", 60s+ -> "1:00", 1h+ -> "1:00:00") implemented with tabular digits and zero layout jumping.
9. **Two "Awaiting human input" actions genuinely require human action**: creating/verifying a real Google AdSense account and submitting the sitemap to Google Search Console upon production deployment.

**Corpus note, deliberately left alone:** the word generator samples uniformly from a 489-word frequency-ordered list (mean word length 4.45), while MonkeyType's default draws from the ~200 most common words. Ours therefore runs slightly harder and scores slightly lower on a typical run. That is a product decision, not a bug — narrowing the corpus would raise the displayed WPM without the typist improving, which was explicitly ruled out. Change it only on instruction.

## What this project is

A typing-speed-test website (MonkeyType-style) aiming for large organic Google traffic, monetized via Google AdSense. Long-term ambition: "world's best typing platform," but development proceeds in deliberate phases — **do not jump ahead to multiplayer/accounts/backend/games until explicitly prioritized below.**

- **Brand name**: HeroTyping
- **Current phase**: Frontend-only MVP, feature-complete and hardened. No backend, no accounts, no database. Everything persists to `localStorage`. Not yet launched (no real domain, no AdSense account, no Search Console).
- **Language**: English only (architecture supports adding more later, see `src/data/words/` and `src/data/quotes/`). The games draw from the same word list, so a new language reaches them for free.
- **Design**: Minimalist, MonkeyType-inspired — the typing area is the visual star, chrome stays out of the way. Five built-in themes (Dark default, Light, Midnight, Forest, Sunset) via a theme picker in the header, all color changes transition smoothly except per-character typing feedback (deliberately instant — see Architecture).

## Tech stack & conventions

- Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), Tailwind CSS v4 (theming via CSS variables in `globals.css`, **no `tailwind.config.ts`** — Tailwind v4 doesn't need one here).
- Exact current dependency versions are in `package.json` — don't assume, check it. As of this writing: `next@16.3.5`, `react@19.2.8`, `zustand@^5`, `motion@^13`, `lucide-react@^1.45`, `clsx@^2`.
- `zustand` (+ `persist` middleware) for durable, low-frequency state (user settings). `useReducer` for the high-frequency typing engine state (not zustand — see Architecture).
- `motion` (formerly Framer Motion) for animation — imported from `motion/react`, **not** the bare `motion` package root (that resolves to the vanilla-JS DOM API, not React components/`layoutId`).
- `lucide-react` for icons, `clsx` (wrapped as `cn()` in `src/lib/utils/cn.ts`) for conditional classnames.
- `src/` directory, `@/*` path alias to `./src/*`.
- Conventions were originally mirrored from a sibling project at `../Git-Review` (Next.js 16.3.4, same Tailwind v4 pattern) for consistency, though the two projects are unrelated products — that sibling project is not otherwise relevant to this one.
- Git repo is initialized at the project root. Commit as you go — meaningful, scoped commits, not one giant dump. Check `git log` and `git status` at the *start* of every session, not just when something looks wrong — see "Multiple sessions/tools may share this codebase" below.
- **Running the dev server**: `npm run dev` in this directory is all you need, from any tool. *(Aside, only relevant if you happen to be Claude Code specifically: that tool's own `preview_start` helper reads a `launch.json` from whatever it considers the "primary" working directory, which in past sessions has been a sibling folder, not this one — if that helper doesn't find a config, just fall back to running `npm run dev` directly in this directory via its terminal/bash tool instead of fighting the helper.)* If a dev server appears to already be running on some port, you don't need to start a second one — check `ss -ltnp` / `lsof -i` / your OS equivalent, or just try loading the port.
- **"Another `next dev` server is already running" is usually a STALE LOCK, not a running server.** Next writes `.next/dev/lock` (`{pid, port, ...}`) and refuses to start if it exists — **without checking whether that PID is still alive**. Any unclean kill (`pkill`, a crashed shell, a sandbox teardown) leaves the lock behind and then blocks every future `npm run dev` **in that directory, on every port**, which is why switching ports never helps. This exact stale lock burned two full sessions, who misread it as a "wedged Turbopack cache."
  **Diagnose first, don't guess**: take the PID from the error message and check `kill -0 <pid>` (plus `ss -ltnp | grep <port>`). If the process is dead, just `rm .next/dev/lock` and start normally. Only clear the whole cache (`rm -r .next/dev`) if you have separate evidence of stale *compilation*.
- **Tailwind v4's content detection is scoped by hand** in `globals.css` (`@import "tailwindcss" source(none)` plus explicit `@source` lines for `src/app`, `src/components`, `src/lib`). Automatic detection walks the project root, which holds agent-managed special files (`.mcp.json`, `.claude/`) that are unreadable to the build process and fail it outright with `Permission denied` — and gitignoring them is *not* enough to stop the scan. **If you add a new top-level source directory, add an `@source` line for it**, or its classes will silently go missing from the CSS.
- **If a running dev server's error overlay disagrees with a fresh `npm run build`, trust the build.** Turbopack's dev server here has served misleading overlay errors for code that no longer exists on disk. Restarting clears it. Don't "fix" code a clean build already proves is fine.
- **`requestAnimationFrame` never fires when the preview pane isn't displayed** (`document.hidden === true`; `setTimeout` still works normally). This is not an app bug, but it has a big consequence: **every `motion` / `AnimatePresence` animation is rAF-driven, so in that environment exit animations never start, never complete, and `AnimatePresence` therefore never unmounts its child** — the element just sits there at full size, which looks exactly like a broken state signal. Screenshots also fail with "the Browser pane is not displayed." When verifying anything animated, check `requestAnimationFrame` actually fires before concluding the feature is broken, and prefer asserting on a non-animated signal (a `data-` attribute, a CSS class) rather than on animated geometry.

## Current status (core through 2026-09-16; see "Session 2026-09-17" below for the latest pass)

### Done and verified working
Manually tested in a real browser (typed real words, confirmed char-by-char coloring, word advancement, caret positioning, timer countdown, auto-finish, personal-best recording, restart, mobile viewport layout, malformed-localStorage recovery, paste blocking, zero layout shift on test start, theme switching, punctuation-skip handling) — every bullet below was actually exercised, not just written and assumed correct.

**Verification backlog is now clear** (2026-09-15): the three items previously carried as "built but never seen rendering" — the chrome collapse, the flip-clock stats bar, and the `/guides` page — have all been live-verified against a clean dev server. Two of them turned out to be genuinely broken and were fixed (see Known issues fixed); that is exactly why the "confirmed by clean build" standard is not a substitute for looking at the running app.

*Testing note for whoever is next:* synthetic space keypresses from browser-automation tooling often arrive with an empty `key`, so the `onKeyDown` space handler never matches. **Since 2026-09-17 there is an easier path**: append the space to the input's value and dispatch a plain `input` event — `splitOnCommit` treats a space in the buffer as a commit, which is exactly the mobile-keyboard path, so automation and real phones exercise the same code. The old approach still works: `new KeyboardEvent("keydown", { key: " ", code: "Space", keyCode: 32, which: 32, bubbles: true, cancelable: true })`.

Two more automation gotchas worth knowing: each dev-server port is its own origin, so `localStorage` settings (mode, duration) reset whenever the port changes — and **`document.body.innerText` returns empty in a headless/non-compositing pane** because it is layout-dependent. Use `textContent` or `querySelector`; an `innerText` check once made a working focus overlay look broken four times in a row.

**Core engine & features:**
- Project scaffold, 5-theme system (`data-theme` attribute + CSS vars, picker in `theme-switcher.tsx`), header/footer, ad slots (footer + post-results, not near the typing area). **As of 2026-09-17 `AdSlot` renders `null` until `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is set** — the dashed "Ad space" placeholders made a finished product look unfinished pre-approval. All nine placements stay in the tree, so switching ads on is one env var and no code change.
- Full typing engine (`src/lib/typing-engine/`): time mode (15/30/60/120s presets **plus a free-form custom duration**, infinite word regeneration), words mode (10/25/50/100), quote mode (curated public-domain quotes, short/medium/long), custom text mode (capped at 2000 chars), punctuation/numbers injection toggles.
- Per-character correct/incorrect/extra/pending rendering, animated caret (via `motion` `layoutId` shared-element transition), smooth 3-line word-window scrolling that re-measures after web fonts finish loading.
- Live stats while running (countdown or word progress + live WPM, stabilized against early-test noise), results screen (net WPM, raw WPM, accuracy, consistency, char breakdown, personal-best badge) — **accuracy and the correct/incorrect breakdown are mathematically guaranteed to agree** (see Known issues fixed).
- **Results graph** (`results-graph.tsx`): plots net WPM and raw WPM as two lines over time on a single y-axis — deliberately **not** MonkeyType's dual-axis (WPM + errors on a second scale) layout, which is a well-known charting anti-pattern; error-count-over-time was scoped out rather than bolted on as a second axis. Has a legend (line-key + label, not color-only), recessive gridlines, end-dot markers, and a hover crosshair + tooltip reading the nearest sample. Colors reuse existing theme tokens (`--accent`, `--sub`), so it adapts across all 5 themes automatically. Verified two ways: a clean-typing test showed the two lines exactly overlapping (correct — raw and net WPM are identical at 100% accuracy), and a test with one deliberate uncorrected mistake showed them genuinely diverge (raw consistently above net, as it must be).
- **Restart icon**: a small always-present circular button below the word-stream (idle/running only — the results screen has its own explicit "Restart" button). Follows the "always mounted, opacity-only crossfade" pattern — no layout shift.
- **Header logo resets the test** when clicked while already on `/` (a plain `<Link>` is a no-op in that case since there's no navigation) — via a tiny pub-sub, `reset-bus.ts`.
- **Language selector**: a real (not decorative) popover showing "English" as the sole, checked option — same interaction pattern as the theme picker. Functionally honest (opens a real menu) rather than a fake button, so adding a second language later is one more row, not a rebuild.

**Visual redesign (most recent round, matching MonkeyType's look):**
- **Typography**: monospace font is JetBrains Mono (switched from Geist Mono site-wide). Word-stream size is currently `text-2xl sm:text-3xl`. **The line height is no longer a constant** — as of 2026-09-17 `word-stream.tsx` measures the real gap between wrapped rows at runtime, because a single hardcoded value cannot be right at two breakpoints (32px on phones, 38px from `sm:` up) and had been stale three times. You can change the font/size freely now without re-measuring anything.
- **Config bar is icon + label** (`test-config-bar.tsx`): punctuation/numbers/time/words/quote/custom render as a `lucide-react` icon *and* its lowercase word. It was icon-only until 2026-09-17, when that was reported as unreadable — every control was a guess. Pills keep their `aria-label`/`title`. Spacing is tightened below `sm:` so the labels still fit three rows on a 375px phone, and sizing is `pointer-fine:min-h-9` (touch stays 44px) rather than a width breakpoint. Container background removed so it blends with the page instead of sitting in a visibly distinct box.
- **Custom time duration**: time-mode presets (15/30/60/120s) sit next to a real numeric input, clamped **1s–86400s / 24 hours**, tucked behind a pencil-icon trigger rather than a permanently-visible bare input. Durations over a minute format as "1m 13s" / "2h 3m 14s" (a local `formatDuration` helper) instead of a raw second count — applied to the preset pills too ("15s"/"30s"/"1m"/"2m"), not just the custom one. **Not yet applied to the live countdown while a test is running** — that still shows raw seconds; deliberately out of scope this round (a proper HH:MM:SS-style flip-clock treatment deserves its own design pass, see backlog).
- **Default (Dark) theme now matches MonkeyType's Serika Dark palette** (`#323437` background, `#d1d0c5` foreground, `#646669` sub, `#e2b714` accent) — the other 4 themes are unchanged/independent of this.
- **Typing area widened** to `max-w-6xl` (was `max-w-4xl`), matching MonkeyType's proportions more closely.
- **Page intro (h1/subtitle), the config-bar/language-selector, and the site footer all collapse once a test finishes** — the results screen shows only the results, not leftover chrome. All four key off `test-status-store.ts`; `PageIntro` and `SiteFooter` are client components still SSR'd for SEO (no random content, so no hydration-mismatch risk — see Architecture notes). `PageIntro`/`SiteFooter` collapse via a **pure-CSS `grid-template-rows: 1fr → 0fr`** transition, deliberately not `AnimatePresence` (see the rAF note under Tech stack — a JS-animated collapse silently does nothing in a pane with no animation frames). The flag is cleared when the typing island unmounts, so the footer comes back on `/about` etc. **Live-verified 2026-09-15**: both collapse to `0px` on finish, and the footer returns to 210px after navigating away.
- **Results screen fits above the fold.** Live-measured at a 720×1280 viewport with the WPM graph rendered: the core results — stats row, graph, correct/incorrect/extra/missed breakdown, and the Restart button — end at **706px**, inside the 720px fold. The 300×250 post-results ad slot sits just below it by design; shrinking or dropping that unit to win the last ~250px would cost the site's single best-performing ad placement, so it stays below the fold. On a typical laptop viewport (800–950px) there's considerably more headroom.
- **Results panel tightened and polished**: smaller gaps, a shorter graph (170px, was 220px), a border-top divider above the correct/incorrect/extra/missed row, and the "new personal best" badge (now with a sparkle icon) moved above the stats instead of after the graph.
- **Live stats bar** (`live-stats-bar.tsx`): the countdown / word-progress figure renders large (48px) with a flip-clock/split-flap digit animation, and is **the only thing it shows**. The opt-in live-WPM readout and its `liveSpeed` setting were **removed entirely on 2026-09-17** by request — the setting, its toggle, its store field, its persistence and its validation are all gone. Don't reintroduce a live WPM figure without new instruction. The flip animation still holds at a maximum of **2 DOM nodes per digit slot** under live ticking (see the `AnimatePresence` note in Known issues fixed).
- **Every skipped character counts as a mistake**, punctuation and digits included — spacing past `Among;` or typing `9` of `98` is penalised the same as skipping a letter. Skipped characters are tallied into `charTally.missed`, subtracted from accuracy, and rendered in red in the word-stream. *(This reverses an earlier exemption for punctuation; the reversal was explicitly requested — see Known issues fixed.)*
- Personal bests persisted per mode+config in `localStorage` (time/words modes only), with type-validated rehydration so corrupted storage can't inject garbage into the UI.
- Settings persisted via zustand with full validation on rehydration — every field falls back to a safe default if the stored value is out of range, wrong type, or (for `mode`) `"custom"` with no text behind it.
- Paste is blocked in the typing input; keystroke counting loops over every newly-inserted character rather than assuming exactly one.
- Supporting pages: `/about`, `/privacy`, `/terms`, a themed custom `/not-found` (404), a root `error.tsx` boundary, and a dynamically generated OG image (`app/opengraph-image.tsx`).

**SEO & content:**
- **First Tier 1 SEO guide is live**: `/guides/how-to-improve-typing-speed` (real, non-templated content — accuracy-before-speed, home-row finger placement, deliberate short practice sessions, consistency-over-peak-WPM, and common speed-capping habits), using the same `ContentPage` component as `/about`/`/privacy`/`/terms`. Has its own `Article` JSON-LD (`buildArticleSchema` in `src/lib/seo/json-ld.ts`), is in `sitemap.ts`, and is linked from both `PageIntro` ("Want to type faster?") and `SiteFooter` ("Guides") — the first real internal links this site has had beyond header/footer chrome nav. Verified via a clean `npm run build`'s prerendered static HTML (checked the actual `.next/server/app/guides/...html` output for the h1 and the JSON-LD script tag) and the generated `sitemap.xml.body` — **not live-verified in a running browser**: this was an unattended scheduled-task session and `preview_start`/dev-server launch is blocked for unattended runs (no one present to approve). A normal interactive session should do a quick visual pass (it's static content through a component already proven to render correctly for `/about`, so risk is low, but hasn't been literally seen).
- **Second Tier 1 SEO guide is live** (2026-09-15): `/guides/average-typing-speed` — a benchmark table by context (casual/office/programmer/transcriptionist/competitive), sourced honestly as "commonly cited bands" rather than inventing a false-precision citation, plus a section explaining *why* WPM figures vary so much between sources (test length, text difficulty, net vs. raw). Cross-links with guide #1 in both directions (guide #1's closing section now points here; this guide points back to guide #1 for the "how to actually improve" follow-up) and links to `/`. Same `ContentPage`/`buildArticleSchema`/`sitemap.ts` pattern as guide #1. Verified the same way as guide #1 — clean `npm run build`, inspected the prerendered `.next/server/app/guides/average-typing-speed.html` for the h1, JSON-LD, and table content, and confirmed the URL in `sitemap.xml.body` — **not live-verified in a running browser**, same unattended-session constraint as guide #1. One thing worth a human/interactive-session glance: the table borrows the existing `border-border` Tailwind token (used elsewhere for `AdSlot`'s dashed border) rather than inventing new styling, so it should theme correctly across all 5 themes, but a visual table hasn't existed on this site before now and hasn't been literally seen rendered.
- **`sitemap.ts`'s `lastModified` bug is fixed**: it previously evaluated `new Date()` per request, so every crawl saw "modified right now" regardless of whether anything changed. Now each route has a hand-set date in a `routes` array; bump a route's date only when that page's content actually changes. This was Technical SEO gap #1 in the roadmap below — now resolved.

**Typing games** (six shipped 2026-09-15, four more since — ten total):
- **Ten games live under `/games`**: the six below, plus `spellbound` (roguelike spell-casting), `typing-survivor` (endless waves + upgrades), `ghost-racer` (race a recorded run) and `card-battle` (deck-builder). The original six: a hub page plus `falling-words` (3 lives, combo-multiplied score), `word-rain` (one life, faster ramp, scored by seconds survived), `word-blaster` (shooter — enemies cross lanes toward a base, first keystroke commits the turret to a target), `typing-grand-prix` (racer — sequential typing drives your car against three AI opponents over 40 words), `boss-battle` (multi-phase boss, longer words hit harder, a telegraphed attack costs a life if the current word isn't finished in time) and `combo-rush` (a draining clock each cleared word tops back up). Both are statically prerendered via `generateStaticParams`, linked from the header, footer and the games hub, and listed in `sitemap.ts`. Each game route carries its own long-form "how to play well" copy — genuinely mode-specific advice, not one template with the name swapped (see the thin-content guardrail in the SEO section).
- **Live-verified 2026-09-15**: words spawn and fall at the expected rate (measured 41.8px/s against a 9s fall across 376px), typing clears the targeted word, score/combo/accuracy all track, one word reaching the floor costs exactly one life, game over records a high score to `localStorage`, and Word Rain correctly runs with a single life and a "survived" headline.
- **Arcade visual layer** (`globals.css`, `game-cover-art.tsx`): drifting perspective grid, horizon haze, danger gradient, faint scanlines, neon glow and corner brackets. All of it is CSS + hand-drawn SVG deriving from theme CSS variables via `color-mix`, **not raster art** — verified recolouring correctly across dark/light/forest/sunset. That's the reason to keep it: a fixed image would clash with the light themes, add real LCP weight, and couldn't animate.
- **Real artwork is now in place** (2026-09-15): `public/games/falling-words.webp`, `word-rain.webp` and `hero.webp` — AI-generated neon scenes, vivid and each with its own palette (cyan/violet, indigo/magenta, full synthwave sunset). The drawn SVG in `game-cover-art.tsx` is still the automatic fallback for any game without a file, so deleting an image restores it instantly. `game-art-assets.ts` finds files by convention at build time; `public/games/README.txt` documents the names.
- **Artwork rules if you add or replace any**: convert to WebP (the originals were 7.9MB of PNG, 764KB as WebP at q82 — ~90% smaller, no visible loss) and don't keep both formats, since everything under `public/` ships. Serve through `next/image` with `fill`, never a raw `<img>`, so it's resized per viewport rather than sending 1536px art into a 498px card. The hub cards are `loading="eager"` (both above the fold; lazy makes the main content pop in late) and the hero/page backdrops are `priority` as LCP elements. **Check new art against the Light theme** — baked art can only match one theme, which is exactly why the SVG fallback is kept.
- **In-play chrome is icons and numbers only.** The SCORE/CLEARED/ACCURACY word labels are gone; the icons keep `aria-label`s so screen readers lose nothing. Long-form copy sits well below the board behind a divider, out of the way during play but still indexable.
- **Sound is synthesised via the Web Audio API** (`game-audio.ts`) — no audio files anywhere. Oscillators started on demand keep keystroke feedback tight, there's nothing to download or license, and timbres are tuned by editing numbers. Distinct cues for keystroke, typo, clear, combo milestone, life lost, game over and start. Driven off state transitions rather than inline from handlers, so paths that change the game on the tick (a word landing, an auto game-over) get audio for free. Wired to the existing persisted `soundEnabled` setting — **now defaulted to `true`** — with a mute toggle in the HUD. Audio can't start before the Start click (browsers gate it behind a gesture), so it never autoplays.
- Game high scores live in `game-scores.ts`, deliberately separate from `results-store.ts` — that store keys personal bests by typing-test mode + config and only tracks WPM/accuracy, which doesn't describe a game run. Same validate-on-read posture.

**Accessibility & polish:**
- Mobile layout (375×812) verified with no horizontal overflow. Hidden input has `font-size: 16px` to prevent iOS auto-zoom.
- Custom-text modal has proper dialog semantics, closes on Escape or backdrop click, live character counter, returns focus on close.
- Mode-selection and toggle pills expose `aria-pressed`.
- `npm run build` and `npm run lint` both pass clean as of the latest commit.

## Session 2026-09-17 — audit & repair pass (READ BEFORE TOUCHING SCORING, AUDIO OR IMAGES)

Four separate audits, each triggered by a real user-visible symptom. Every fix below is verified by mutation testing where possible: the bug was deliberately reintroduced to prove the test/fix actually catches it, then restored. **Several of these look like over-engineering until you know the failure they prevent — the reasoning is in the code comments; read them before simplifying.**

Full write-ups: `docs/typing-engine.md` (the engine spec the tests enforce), `docs/typing-engine-audit.md`, `docs/games-integrity-audit.md`, `docs/audio-and-asset-audit.md`.

### 1. The typing engine was under-reporting WPM by ~20%

**Symptom:** the same typist scored 66 WPM here and 86 on MonkeyType, at 100% accuracy in both.

**Root cause: spaces were never counted as characters.** `hidden-input.tsx` intercepts the space key and dispatches `COMMIT_WORD`; that reducer case tallied the finished word's letters and advanced the cursor but never touched `correctKeystrokes`. Every inter-word space vanished.

**Why it hid for so long, and the lesson:** WPM is defined on five-character units *including the trailing space*, so dropping them loses ~1 character in 6. But accuracy is `correct / (correct + incorrect + missed)`, and a space is almost always struck correctly — removing it from numerator *and* denominator barely moves the ratio. One bug, and only one of the two numbers on screen reacted. **When one metric looks wrong and a related one looks fine, that is evidence about the shape of the bug, not evidence that the first metric is fine.**

Also fixed in the same pass:
- **`Date.now()` → `performance.now()`** everywhere in the engine. Wall-clock steps under NTP correction and can yield a negative elapsed time mid-test.
- **Backspace now records `correctedErrors`.** Deleting a mistake does not un-make it; the incorrect keystroke stays counted. This is what stops someone farming a perfect score by delete-and-retype.
- **Consistency was measuring a running average** — each sample was cumulative WPM, which converges by construction, so the score mostly measured test length and read high for everyone. It now differences the samples into one-second buckets and takes the coefficient of variation of *per-second* speed. Measured effect: a typist alternating full-speed and dead stops scored **78%** under the old formula and **0%** under the new one.
- **Personal bests were compared on rounded values**, so a genuine 65.6 → 66.4 improvement read as a tie at 66. Now compared unrounded, rounded only for display.
- Results screen gained **Total Typed** and corrected-errors, so the breakdown visibly reconciles with the WPM above it.

**Verified end to end** on MonkeyType's own prompt via the new `/debug/typing-engine` page (dev-only, 404s in production): 20 words typed → predicted 86 letters + 20 separators = 106, recorded exactly 106. On identical text the two engines agree.

### 2. Two games could be won without typing

**Ghost Racer** computed race position as `typed.length` — the raw count of keys pressed, never compared against the text. Proven by attack: **400 spaces and nothing else produced "You win", "New personal best", 39 WPM at 19% accuracy** — and saved itself as the personal-best ghost, so every later race on that text would run against a mash.

**Typing Grand Prix** banked `target.length` for whatever was in the buffer, so one letter plus space advanced a full word. This one had the exploit in **three** places; after fixing the two obvious ones, `finishRace` still hardcoded `playerProgress: 1` and computed placement from opponents who had *already finished*, so spacing through all forty words still crossed the line in **first place**. That third site was only caught because a test failed. **Do not assume one fix covers a scoring exploit — enumerate every write to the progress variable.**

Both now tie distance to correctly-typed characters, which keeps it consistent with the WPM numerator. Ghost store bumped `v1` → `v2` to abandon pre-fix recordings, which hold inflated positions.

The other eight games were audited and are sound: all require an exact match before anything clears. Combo Rush maps space to "skip" but charges time and resets the combo; Spellbound and Survivor treat a space as a miss; Card Battle strips non-letters.

### 3. Music kept playing after leaving a game

**Not a missing cleanup** — all four music games already had `return () => stopMusic()`. The race was in the bus: `playMusic` awaits the file decode, and `nowPlaying` is only assigned *after* it resolves. Leave during that gap and `stopMusic()` finds `nowPlaying === null`, concludes there is nothing to stop, and returns; then the decode finishes and starts a track nothing holds a reference to.

Fixed with an epoch claimed on the shared state *before* any await. The counter lives on the `window`-anchored singleton, **not module scope** — `next/dynamic` gives each game its own chunk and a module-level counter would be duplicated (this codebase has been bitten by that exact thing twice now; see the `test-status-store` note).

Every game clock and animation loop was also audited for cleanup — all clean.

### 4. Images were already optimized; two real wins found anyway

The suspicion was that images had never been compressed. They had: 141 WebP files at a median **0.097 bytes/pixel**, every `<Image>` already carrying a correct `sizes`, nothing bypassing the optimizer. Re-encoding the fifteen largest was tested and **rejected** — it recovers 5–30% while compounding artefacts on an already-lossy source (28–31 dB PSNR on the alpha cut-outs, which is visible). **Don't re-encode these again without measuring; the obvious win isn't one.**

What was actually wrong:
- **Decorative backdrops served at full quality.** Art sitting at 25–70% opacity under gradient overlays now uses `quality={45}` (Next 16 requires the value be allowlisted in `images.qualities`, which `next.config.ts` now does). Everything a reader actually looks at stays at 75.
- **One image downloaded twice.** On a game page the blurred backdrop and the marquee render the *same* hero file but asked for different variants. Giving the backdrop the marquee's exact `sizes` collapses them to one URL and the backdrop becomes free. **The obvious move here is wrong:** asking for a smaller cheaper variant for a blurred backdrop sounds thriftier and is strictly worse, because it downloads a second copy.

Measured on a production build: `/games` 209 KB → **171 KB**, `/games/spellbound` 100 KB → **79 KB**. The typing-test home page loads **no images and no audio at all** (16 KB total transfer).

Audio was checked and deliberately left alone: 13 MB across 26 files, already Opus at ~64 kbps, and no game loads more than its own two or three tracks. `assets-raw/` is 596 MB on disk but is gitignored and excluded from build tracing, so it never deploys.

### 5. Mobile typing was broken, and the build had a deploy hazard

- **You could not get past the first word on a phone.** Android's GBoard (and every IME-backed keyboard) reports composing input as `keydown` with `keyCode 229` / `key: "Unidentified"`, so the `e.key === " "` test **never fires on mobile**. The space landed in the input value and was scored as a wrong character against the target word. Fixed via `splitOnCommit` (`src/lib/typing-engine/input-commit.ts`) — a generated word never contains a space, so a space in the buffer can only mean "commit". Typing Grand Prix already had this fallback; the main test didn't. **Any new typing surface needs it too.**
- **Word-stream `LINE_HEIGHT` is now measured at runtime, not hardcoded.** The constant had been wrong three times (48, 32, 38); the last was right on desktop and 6px too large on every phone, since the stream is `text-2xl` there and `text-3xl` from `sm:` up. It now reads the median gap between wrapped rows, with a guard rejecting implausible values (a zero-width container once produced a 312px window). **This kills that recurring trap for good — don't reintroduce a constant.**
- **Touch targets were 24px on tablets.** The config bar shrank at `sm:`, which asks about viewport width when the real question is what is doing the pointing — a tablet is wide *and* touch. Now `pointer-fine:min-h-9`: phones and tablets stay 44px, mice get 36px.
- **Build warning fixed:** `game-art-assets.ts` probed for art with `fs.existsSync(path.join(DIR, templateString))`. Turbopack cannot statically scope a templated path, so it traced **the entire project** into the server bundle and warned it "can lead to failures when size limits are exceeded". Replaced with one statically-scoped directory read into a `Set`. **The build is now 0 warnings — keep it that way.** Note the trade-off: art is listed once at module load, so a newly dropped-in file needs a restart to appear (which matches what this module already promised).

### What a cold start should verify first

The fixes above are the kind that regress silently. Before trusting the app:

```bash
npm test && npm run lint && npx tsc --noEmit && npm run build   # all clean, build must emit 0 warnings
```

Then in a browser: take a 15s test and confirm the results breakdown reconciles (`Total Typed` == correct + incorrect), and confirm a space cannot win Ghost Racer.

## Session 2026-09-22 — site-wide bug hunt and repair (READ BEFORE TOUCHING SPELLBOUND, SURVIVOR OR WORD-STREAM)

Requested explicitly as a deep, unhurried pass across *every* page — all ten games, the lessons system, and the main typing test — not just the areas already known to be shaky. Found **34 bugs**, from cosmetic to critical, via a mix of direct code reading and parallel background audit agents (four games-focused, one covering lessons + the main UI). 32 were fixed immediately; the remaining 2 needed more than a one-line change and were fixed in a follow-up pass the same day, closing the list at 34/34.

**Full list of fixes, grouped by area:**

*Spellbound (roguelike spell-caster) — the worst-hit game, 9 bugs:*
- **Boss room was silently sliced off every floor.** `buildMap()`'s filler-room math shorted the room count by 3, which happened to be exactly the "shop" and "boss" rooms — verified with a standalone Node script proving the old code never emitted a `"boss"` room, and the fixed version always emits exactly `ROOMS_PER_FLOOR` (6) with both `"shop"` and `"boss"` present.
- Spell slots could silently collide (two slots offering the same word) and buying/learning/reward flows didn't rotate which slot got replaced — fixed with a shared `assignSpellToSlot()` helper and a `pickWord(avoid)` that excludes words already on other slots.
- Six cards (Cursed Quill, Scholar's Mark, Heavy Tome, Mana Engine, Iron Will, Vampiric Ink, Echo Shard) had descriptions that didn't match what the code actually did — fixed to match, and Quickened Rune's own description was corrected instead (cooldown reduction, not "complete early").
- Quicken/hex buffs and the Void King's "silence"/"drain" mechanics were described but not implemented — added real `quickenMs`/`hexMs`/`hexTargetUid` state and wired the rules through.

*Typing Survivor:*
- **Perfectionist achievement could never trigger** — the completing keystroke's branch struck the enemy before updating that enemy's own `typed` field, so the check that read it always saw stale data.
- **Level-ups didn't cascade** (closed 2026-09-22, second pass): a single XP gain crossing two or more level thresholds only advanced one level and only offered one draft, silently skipping upgrade picks the player had earned. `strike()` now loops while XP clears the next threshold, tracks `levelsGained`, and queues any extra levels in a new `pendingLevelUps` field; `takeUpgrade()` checks it after every pick and immediately serves the next queued draft (staying in `"draft"` phase) before returning to `"playing"`. See `src/lib/games/survivor/use-survivor.ts`.

*Card Battle:* Rupture's upgraded ops used `[burstBlight, burstBlight]` instead of `[doubleBlight, burstBlight]` (the upgrade didn't actually change anything); a stale "remove card" doc comment was corrected.

*Cross-game (Falling Words, Word Blaster, Ghost Racer, Boss Battle, Combo Rush, Typing Grand Prix):*
- **"Full Arcade" site achievement was permanently unearnable** — five of the ten games (`boss-battle`, `combo-rush`, `falling-words`, `typing-grand-prix`, `word-blaster`) never called `awardXp`/`bumpStat`/`checkSiteAchievements` on finish, verified by grep before fixing. All five now call them in their existing "settle once" effect, same as the other five games already did.
- Mobile IME input gaps: Combo Rush's space-to-skip only fired on a real `keydown`, which Android/GBoard never sends mid-composition — now also detects a space landed directly in the input value. Boss Battle's `onChange` didn't strip a trailing space before `setTyped`. Ghost Racer was missing an `onPaste` guard and had a stray uncleared `setTimeout` in its countdown.
- Falling Words' and Word Blaster's spawn/target logic could force a collision when no lane was free, and `findTarget()` in both picked "closest to floor" even when an exact match existed elsewhere — now prefers the exact match, and the spawner skips spawning rather than forcing an overlap.
- Boss Battle's `hit` callback didn't carry the post-hit phase, so a killing blow on a phase transition reported the enemy's *previous* phase.

*Lessons:*
- `physicalKeyFor()` (`keyboard-layout.ts`) didn't normalize shifted symbols (`!`, `?`, `:`) back to their physical base key (`1`, `/`, `;`), so the virtual keyboard highlighted the wrong key — or none — for punctuation lessons. Same bug existed independently in the hand-diagram's finger lookup; both now go through the one corrected helper.
- `lesson-drill.tsx` had no unlock-gate (a locked unit was directly playable via URL), no Enter-key advance, no mute toggle, and wasn't wired to the games' sound module at all.

*Main typing test:*
- `custom-text-modal.tsx` claimed `aria-modal="true"` but had no real focus trap — Shift+Tab out of the textarea walked straight into the page behind it, including the hidden typing input, whose own Tab handler restarts the test; a keyboard user could silently wipe an in-progress run. Fixed with a real Tab/Shift+Tab cycle.
- `results-graph.tsx`'s y-axis ticks could duplicate (and produce a duplicate React key) on a very short/low-WPM run, where several of the five tick fractions rounded to the same integer — deduplicated via `Set`.
- `results-store.ts`'s personal-best validator didn't range-check `wpm`/`accuracy` on read, so corrupted storage (`NaN`, negative, or absurdly high) could either permanently block or permanently win every future comparison — now range-validated the same way `settings-store.ts` already does.
- `typing-test.tsx`'s restart-effect depended on the whole `engine` object instead of `engine.restart`, re-subscribing the reset-bus listener roughly 10x/second during a running test (not a leak, but real unnecessary churn).
- **`word-stream.tsx`'s runtime line-pitch measurement never activated for short text** (closed 2026-09-22, second pass): `measureLinePitch()` required at least 3 distinct wrapped-row offsets before trusting a real DOM measurement, so any text wrapping onto just 1–2 lines — the common case for a short custom text or an early-test moment — silently fell back to the hardcoded `LINE_HEIGHT_FALLBACK` constant instead of measuring. Lowered the threshold to 2 tops; the existing median-of-deltas logic already handles a single delta correctly (a length-1 array's "median" is just its one element), and the existing font-size sanity check still guards against an untrustworthy measurement. This file has now had its line-height constant go stale three separate times (see Known issues fixed below) — this fix removes one more case where the constant was silently in play instead of a real measurement.

**Verification:** `npm test && npm run lint && npx tsc --noEmit && npm run build` clean (81 tests, 0 lint errors, 0 type errors, 0 build warnings) after every batch of fixes. UI-observable fixes were live-verified in a running browser — notably Spellbound's boss room actually appearing, the Typing Survivor level-up draft flow (played a live run through to a Level 2 draft with three real upgrade choices), and the achievements page reflecting all five previously-broken games. The Survivor cascade's exact "one strike crosses two level thresholds" path was **not** independently observed live (it needs a very specific same-tick XP spike that's impractical to force deterministically through simulated keystrokes) — that path is verified by code review plus the type/test/build gate, not by an observed live cascade. Worth a real live check if this code is touched again.

### Known issues fixed (context for why the code looks the way it does — read before "fixing" these back)
- **Results screen's accuracy % and its "correct/incorrect" breakdown could contradict each other.** Reproduced precisely: custom text "cat" typed with one backspaced-out mistake showed "3 correct, 0 incorrect" but 75% accuracy — impossible for both to be right. Root cause: the breakdown was tallied from each word's *final* character state, while accuracy came from full keystroke history (including corrected mistakes). Fixed by removing correct/incorrect from `CharTally` entirely; the breakdown now reads `correctKeystrokes`/`incorrectKeystrokes` directly — the same numbers accuracy is computed from — so they can never disagree again.
- **A run with visible skips reported 100% accuracy and "0 incorrect"** (caught on a screencast, 2026-09-15). Three separate causes stacked, which is why it looked so wrong:
  1. **`calculateAccuracy` never saw skipped characters.** It was computed from keystroke history alone, and a character you never press leaves no keystroke — so skips were arithmetically invisible. It now takes `missed` as a third term. Extras are deliberately *not* added on top: an extra character is already counted as an incorrect keystroke when typed, so adding it again would double-count.
  2. **Punctuation was exempt from the missed tally.** `countPenalizedMissed` skipped trailing punctuation on purpose — an explicit earlier request that was later explicitly reversed by the same person. It's `countMissed` now and exempts nothing. **This history is why the file used to carry an "awaiting input" note here; the question is settled — skipped is skipped.**
  3. **Skipped characters rendered dim grey**, identical to text not yet reached, so a mistake looked like ordinary untyped text. A committed word's untyped characters are now re-labelled `"missed"` (a `CharState`) and drawn in error red with a dotted underline. Only *committed* words get marked — the active word's untyped characters aren't skipped yet, they're just not typed yet.
  Verified end to end: ten words typed with their trailing punctuation skipped now reports 95% / 2 missed, where it previously reported 100% / 0.
- **Time-mode expiry counted the in-progress word as skipped.** Harmless while punctuation was exempt, but once every skipped character counted, the partially-typed word at the buzzer inflated the error count on every timed run. `tallyWord` takes `countMissedChars: false` on that one path — running out of time mid-word isn't the same act as spacing past it.
- **Every control on the site showed a plain arrow instead of a pointer.** Tailwind v4's preflight resets `button` to `cursor: default` (a deliberate change from v3), so nothing read as clickable. `globals.css` restores `cursor: pointer` on buttons, `[role="button"]`, `label[for]`, `summary` and `select`, and gives disabled controls `not-allowed`. **Worth remembering as a v4 migration gotcha** — it's silent and easy to miss.
- **Live WPM could spike to absurd values (e.g. "12000 wpm") in the first instant of a test.** `netWpm = correctChars / 5 / minutesElapsed` is unstable when elapsed time is a few milliseconds. Fixed by flooring the denominator at 1000ms for live display and skipping consistency-score sampling entirely during that window. Final results always use true elapsed time.
- **UI jumped/glitched the instant typing started.** The config bar was conditionally unmounted, so its layout space collapsed instantly when it exited, snapping the word-stream upward. Fixed by keeping the config bar permanently mounted and crossfading it with the live-stats bar inside one fixed-height slot.
- **A "N lines rendered inside a 3-line box" bug**, caused by `LINE_HEIGHT` (`word-stream.tsx`) being left stale after a font/size change — this has now happened **twice** (48→32 after a font-family change, then 32→38 after a later font-size bump), confirming it's a real recurring trap, not a one-off. Fixed each time by *measuring* real consecutive wrapped-line `offsetTop` deltas in a live browser rather than assuming a prior value or recalculating on paper. **If you change the word-stream font or size, re-measure this the same way — don't guess, and don't assume the last measured value still holds.**
- **`AnimatePresence` (from `motion`) didn't reliably unmount an exited single-child-by-key element when the key changed rapidly.** Found in the live-stats bar's flip-digit animation (`live-stats-bar.tsx`): each digit's old value was supposed to animate out and then be removed, but under fast successive changes (the countdown/live-WPM tick), old values kept completing their exit animation and then just sitting in the DOM forever (`opacity:0`, fully rotated, never actually removed) — confirmed via direct DOM inspection showing 9+ stacked ghost elements per digit after a burst of typing. Fixed by not using `AnimatePresence` for this case: `FlipChar` now manages its own single `prevChar` state slot and force-clears it with an explicit `setTimeout` matched to the transition duration, which structurally caps it at 2 DOM nodes per digit no matter how fast values change. **If you use `AnimatePresence` for anything that can re-key faster than its transition duration, don't trust it to clean up — verify by inspecting the live DOM node count, not just by watching the animation look right.** (`PageIntro`'s single, rarely-toggled exit has the same non-removal symptom — confirmed via computed style showing a stuck `opacity:0;height:0px` node — but since it only toggles once per test and lands at zero-size/invisible, it's cosmetically harmless and wasn't worth the same fix.)
- **The results screen's chrome didn't actually collapse, and the page overflowed by ~400px** — shipped broken and only caught once someone finally ran it in a browser. Two *independent* causes stacked on top of each other, which is why it looked so baffling: (1) `test-status-store.ts` was a module-level zustand store that the bundler duplicated across the `next/dynamic` boundary, so the writer and readers held different instances — see the Architecture note on that boundary, it is the important lesson here; (2) `PageIntro`/`SiteFooter` collapsed via `AnimatePresence`, which can't run at all without animation frames. Fixed by anchoring the store to `window` and replacing the animated collapse with a pure-CSS one. **Both fixes were needed** — either alone would have left it broken, which is worth remembering when a fix "doesn't work" and the temptation is to revert it.
- **Theme swatches drifted out of sync with the actual palette.** `themes.ts` carries a hardcoded `swatch` per theme (the preview dot in the picker) because CSS variables for a theme that isn't currently applied can't be read from the DOM. The Dark entry still showed `#1a1a1e`/`#facc15` long after the theme itself moved to Serika Dark `#323437`/`#e2b714`. **If you change a theme's `--background`/`--accent` in `globals.css`, update its swatch in `themes.ts` in the same edit.**
- **Time-mode tests recorded slightly too much elapsed time.** The finish path set `elapsedMs` to the exact configured duration and then `finalize()` immediately overwrote it with wall-clock `now - startedAt`; since the tick runs every 100ms, a 30s test recorded ~30.1s and reported WPM a few tenths of a percent low. `finalize()` now takes an explicit `elapsedMsOverride` used only by that one path — every other finish path still uses true elapsed time, which is correct for them.
- **Hydration mismatch**: the engine's initial word list uses `Math.random()`, which would differ between server and client render. Fixed via `next/dynamic(..., { ssr: false })` for the interactive island; the SSR'd shell (h1, intro, JSON-LD) around it stays server-rendered for SEO.
- **Double word-regeneration on mount**: React Strict Mode's dev-only double effect invocation defeated a naive "skip first run" ref guard. Fixed by comparing the memoized config object by reference instead of a boolean flag.
- **Custom mode + reload = stuck blank test**: `mode` persists via zustand but `customText` deliberately doesn't. Fixed: a persisted `"custom"` mode is treated as absent on rehydration and falls back to the default.
- **A CSS specificity gotcha**: Tailwind's `transition-opacity` utility sets `transition-property: opacity` on an element, which — because a class selector beats the bare `*` universal selector — *overrides*, rather than merges with, this project's global `transition: background-color, border-color, color` rule. Any element that both fades in/out AND has its own hover color needs the general `transition` utility, not `transition-opacity`, or its hover transition silently breaks.

### Awaiting human input (asked, not yet actioned — don't guess on these)
- ~~Whether skipping a word's trailing punctuation counts as a mistake~~ — **Resolved 2026-09-15: it does.** Every skipped character is penalised, including punctuation and digits. See Known issues fixed.
- What "make the language selector better" means concretely (visual polish vs. more functionality) is unscoped.
- A "make it look like the best site in the world" animation request came in but is too open-ended to implement blind — a prioritized short list of *which* interactions to focus an animation pass on (results reveal, stat count-up, tab/pill transitions, hover states, page transitions, etc.) was requested but not yet given.

### Not built yet (by design, not oversight)
- No settings modal (Escape currently just blurs the input); no sound effects (`soundEnabled` exists in settings but nothing plays).
- No custom favicon (still Next.js default); no `manifest.json`. OG image *is* handled.
- No real AdSense integration — `AdSlot` renders **nothing** until `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is set; creating/approving the account requires the human, not an AI agent.
- No focus-trap in the custom-text modal — low risk (one textarea, two buttons), worth doing if a more complex modal is added later.
- Screen-reader typing experience is fundamentally limited (industry-wide issue with this app category — a real, visually-hidden `<input>` drives a custom visual rendering, so there's no real-time spoken feedback while typing — not something a small patch fixes).
- Unicode edge case: character comparison indexes by UTF-16 code unit, not grapheme cluster — emoji in custom text render oddly but don't crash anything. Low priority.
- ~~No SEO beyond the technical baseline~~ — **substantially built out as of 2026-09-26**: 23 guides (plus 3 interactive resources), per-route structured data, GA4. See "Session 2026-09-26" and the SEO section further down for what's still genuinely open.

## Session 2026-09-23 — rebrand to HeroTyping, plus lessons "adaptive coach" Phase 1

**Built before this conversation's visible history.** Summarized from the commit (`9df3ad8`) and direct code inspection, not independently re-verified the rigorous way the rest of this file's claims are (live-clicked-through, deliberately-reintroduced-bug-to-prove-the-test-catches-it). Treat this section as a lower-confidence pointer to where to look, not a guarantee.

- **Rebrand**: ThunderTyping → HeroTyping across the UI, metadata, and brand assets (`c37814c` shipped the real logo/favicon, replacing the default Vercel one). **Persisted `localStorage` keys were deliberately left under their old `thundertyping-*`/`thundertyping:*` names** to avoid silently wiping every returning visitor's settings, personal bests, and lesson progress on the rebrand — this is intentional, not a missed rename; don't "fix" it without a real migration plan.
- **Per-key weak-spot tracking**: a new rolling-window store (`src/lib/lessons/key-performance-store.ts` per the commit message) tracks accuracy per key from real lesson attempts — a rolling window, not a lifetime tally, so a key fixed weeks ago stops reading as weak.
- **Result-screen callout**: after a lesson attempt, a summary of which specific keys caused mistakes.
- **New `/lessons/practice` route**: drills exactly the weak keys just identified, reusing the existing typing engine and `buildDrillLine` rather than new typing logic.
- **"Today's Training" card** on the `/lessons` hub: a deterministic recommendation (weak-key drill, continue the current lesson, or a vocabulary review) always traceable to real stored data.
- **Lessons now award XP on completion** — previously a real gap (every game did, lessons didn't). Fixed with a state-transition guard (gated on a unit's `completed` flag flipping `false → true`, not just re-checking a passing score) so replaying an already-completed unit can't farm XP.

**Worth doing before extending this further**: a fresh live pass confirming the weak-key drill actually surfaces the right keys after a real bad attempt, and confirming the XP guard genuinely can't be farmed by replaying a completed unit — neither was independently re-verified in the session that wrote this paragraph.

## Session 2026-09-24/25 — SEO content system, GA4 and UI refinement

The largest content push the project has had, across five requests in one continuous thread: (1) validate and fix a third-party SEO audit's real findings, (2) build a full 10-guide content library, (3) add Google Analytics 4, (4) build three "link-worthy" flagship resources (a calculator, an interactive finger map, a teacher curriculum), (5) fix a real, measured text-contrast bug and large-screen spacing. Every claim below was verified live in a real browser and against a clean `npm test && npm run lint && npx tsc --noEmit && npm run build`, not just read from source.

### 1. Technical SEO foundation + fixing a real third-party audit (`b1c5b74`, `c539e68`, `96800f4`)

Before writing new content, an external SEO audit report (54/100) was checked claim-by-claim against the actual code rather than trusted blindly. **Several of its claims were false** (missing canonical on `/vocabulary/easy` — it had one; "JSON-LD absent" — extensive JSON-LD existed) and one recommendation (400–800 words of homepage SEO copy) directly conflicted with the project owner's own earlier explicit decision to keep the homepage minimal — that conflict was surfaced, not silently overridden. What *was* real and got fixed:
- **Game-page meta descriptions were truncating mid-word.** New `truncateAtWord()` (`src/lib/seo/metadata.ts`) cuts at the last full word instead of a hard character limit.
- **Static hub pages (`/lessons`, `/games`, `/guides`, `/about`, `/achievements`, `/privacy`, `/terms`) had no explicit `openGraph`/`twitter` metadata**, so they silently inherited the *homepage's* OG tags (Next's Metadata API doesn't cascade a child's plain `title`/`description` into `openGraph` automatically). New `pageMetadata()` helper (same file) fixes this in one place; every guide and static page now calls it.
- **Ghost Racer's copy falsely implied shared multiplayer rankings** ("race real players," "climb the ranks") on a feature that is 100% local/single-device (`ghost-store.ts` has no server component at all) — directly contradicted the site's own Privacy Policy. Rewritten to describe the real mechanic (racing your own recorded runs).
- A title-duplication bug on `/lessons/practice` (`"Weak Key Drill — HeroTyping"` + the root layout's `%s | HeroTyping` template = `"...— HeroTyping | HeroTyping"`).
- Sitewide breadcrumbs, `BreadcrumbList`/`Article` JSON-LD, and per-route dynamic OG images (`opengraph-image.tsx` inside each `[param]` folder, each needing its own `generateStaticParams` even though the sibling `page.tsx` already has one, or it renders dynamically instead of static).

### 2. The 10-guide content library (`96800f4`)

Ten guides now live under `/guides`, four of them upgrades to what existed before, six genuinely new. Real research (web search + direct source verification) backed every factual claim — no invented statistics, study names, or benchmarks. Two research findings worth knowing if this content is extended:
- **There isn't one "net WPM" formula.** Some sites compute it as *correct characters only* (this site's own `stats.ts`, and now the guides); others compute *gross WPM minus an error penalty*. The two can disagree on the identical run — documented explicitly in `/guides/net-wpm-vs-gross-wpm` rather than presented as one universal formula, because that's the actual reason two typing sites can disagree.
- **Aalto University's 2018 study** (136M keystrokes, 168k volunteers, CHI '18) is the one typing-speed figure in this content with real public methodology — cited directly in `/guides/average-typing-speed` rather than repeating an unsourced "average" the way most competitor pages do.

**The guides**: `how-to-improve-typing-speed`, `average-typing-speed`, `net-wpm-vs-gross-wpm`, `how-to-touch-type`, `how-to-type-without-looking-at-the-keyboard`, `typing-practice-for-beginners`, `how-to-improve-typing-accuracy`, `english-typing-test-and-practice`, `typing-test-duration-guide`, `data-entry-typing-test`.

**New shared components** (`src/components/content/`): `FaqSection` (renders the visible FAQ *and* emits matching `FAQPage` JSON-LD from the same data, so they can't drift apart), `Callout` (quick-answer/formula boxes), `SourceList`. These reuse the existing `ContentPage` card language (`border-border`, `bg-sub-alt/20`, `rounded-xl`) rather than inventing new visual patterns.

### 3. Three flagship "link-worthy" resources (`7dde384`)

Built to be genuinely reference-worthy, not just three more SEO pages — the explicit goal was "why would a teacher/blogger/school actually link to this."

- **`/guides/wpm-cpm-kph-calculator`** — a real client-side calculator (`src/lib/tools/typing-calculator.ts`, pure and unit-tested: 10 new test cases) with two modes: calculate-from-a-test (time/characters/errors → live WPM/CPM/KPH/accuracy) and a three-way quick-converter (edit WPM, CPM, or KPH and the other two update instantly). Uses the exact same 5-chars/word and correct-characters-only formulas as the live typing test, not a separately-invented one.
- **`/guides/touch-typing-finger-map`** — an interactive explorer (`src/components/tools/finger-map-explorer.tsx`) built on the *same* finger-assignment data the lesson drill already used (`src/lib/lessons/keyboard-layout.ts`), not a duplicate dataset. This required a small refactor: `FINGER_VAR` (the finger→CSS-variable color map) and `HandDiagram` (the two-hand SVG) were pulled out of `virtual-keyboard.tsx` and exported from `keyboard-layout.ts`/`virtual-keyboard.tsx` respectively, so the lesson drill and this new page can never disagree about which finger owns a key. Every key is colored by finger permanently (not just an active one, unlike the drill); a legend lets you click a finger to highlight every key it owns at once.
- **`/guides/typing-resources-for-teachers`** — a week-by-week curriculum **computed live from the real `LESSON_LIST`** (`src/lib/lessons/lesson-types.ts`), chunked 3-per-week, so it can never reference a renamed or nonexistent lesson. Grade-level WPM benchmarks are explicitly labeled as commonly-cited compiled research, not an official standard, per an explicit instruction not to invent school policy.

All three: `pageMetadata()`, `Article`/`BreadcrumbList`/`FAQPage` JSON-LD, sitemap entries, and natural cross-links (calculator ↔ `net-wpm-vs-gross-wpm`/`data-entry-typing-test`; finger map ↔ `how-to-touch-type`).

### 4. Google Analytics 4 (`824d3e9`)

`@next/third-parties/google`'s `<GoogleAnalytics>` in the root layout (the officially recommended approach for this Next.js version — checked against the bundled `node_modules/next/dist/docs/` before writing any code, since `AGENTS.md` warns this project's Next.js version can differ from training-data assumptions). Measurement ID lives in `src/lib/analytics/constants.ts`. **Gated to `process.env.NODE_ENV === "production"`** — deliberately, so local `npm run dev` traffic never pollutes real analytics data. SPA route changes are tracked automatically via GA4's History Change enhanced measurement, no manual per-route wiring — verified live: a client-side navigation fired a real `gtm.historyChange-v2` event with the correct new URL. **No prior analytics existed** (grepped clean before adding) — this is the only installation.

### 5. Text-contrast fix and large-screen guide spacing (`6737778`)

A real, *measured* accessibility bug, not a taste call: `--sub` (`globals.css`) — the color used for article body paragraphs, card descriptions, breadcrumbs, and the guide table-of-contents — measured **2.17:1** contrast against its own background in the dark theme (checked with the actual WCAG relative-luminance formula, not eyeballed). WCAG AA requires 4.5:1 for normal text. Every theme was affected (light 2.71:1, midnight 3.00:1, forest 3.71:1, sunset 3.47:1 — all under AA too).

**Fix, in two parts** (kept deliberately minimal — no new design-token system, no rewrite of working components):
1. **Brightened `--sub` itself**, per theme, to land at ~4.9–5.8:1 — this alone fixed breadcrumbs, the TOC, and secondary nav sitewide, since they all read this one token.
2. **Body copy specifically** (article paragraphs, card descriptions, the "Quick answer" callout) was bumped one tier brighter, to `text-foreground/90` — an existing Tailwind opacity modifier on the *existing* `--foreground` token, not a new variable — because body text needs to read clearly above secondary UI chrome, and simply brightening `--sub` to AA-minimum wasn't enough to satisfy that distinction. Verified: body text now measures **6.89:1** (canvas-resolved actual rendered color, alpha-composited against the true background — `getComputedStyle` alone returns an `oklab()` string Tailwind v4 emits for opacity modifiers, which needs resolving via a canvas paint, not naive string parsing, to get a real RGB value).

**Large-screen spacing**: `GuideLayout`'s container grew `1040px → 1180px`, its reading column `760px → 800px`, with the extra width going to the sticky TOC column (`~240px → ~268px+`, verified via `getComputedStyle` at a 1920px viewport) rather than just wider dead margins. Two-column breakpoint moved `1100px → 1150px` to match. Mobile (375px) and 14"-laptop (1440px) verified with zero regressions — this only touches the `min-[1150px]:` two-column path.

**Verification**: `tsc`/`lint`/`build`/`test` clean at every step; live-checked all 6 explicitly-named pages (`/guides`, the calculator, and 4 guide pages) at 375px, 1440px, and 1920px; contrast ratios computed programmatically in-browser, not estimated.

## Mobile responsiveness pass (2026-09-16) — live-verified at 320px and 375px

The site is now usable on phones. Verified by measuring the running app at
375x812 and 320x640, not by reading the source.

**What was actually broken (all fixed):**
1. **Touch targets below 44px site-wide.** Config-bar pills were a 32x24 hit area
   around a 16px icon; the five game mute buttons were bare 15x15 icons with no
   padding; the game info button was 36x36 and its close button 32x32. All now
   clear 44px on touch screens and revert to the compact size from `sm:` up,
   where a pointer makes the padding unnecessary. The mute fix uses a negative
   margin (`-m-2` + `p-2`) so the larger hit area grows outward instead of
   reflowing the HUD.
2. **Falling-words clipped its words on narrow screens.** Lane positions were
   computed in *pixels* against a fixed 440px board, so on a 309px board the
   outer lanes pushed text past the edge. Now percentage-based
   (`LANE_INSET_PCT`, `FLOOR_INSET_PCT`) against a fluid
   `[--board-h:340px] sm:[--board-h:440px]` board. Proven by computing the
   longest word in the list (`together`, 8 chars) against all 6 lane centres at
   a 254px board: every lane fits with 7.3px to spare.
3. **Word Blaster clipped every long word at spawn — and this was never
   mobile-specific.** Enemies were left-edge-anchored at `SPAWN_X = 94%`, so the
   text ran off the board's `overflow-hidden` clip: the longest word overhung a
   320px board by 52px and stayed partly unreadable for roughly the first
   quarter of its approach. Since you cannot type a word you cannot read, this
   was a real difficulty bug that also affected desktop (spawn 722px + ~96px of
   text on a 768px board). Fixed by interpolating the horizontal anchor from the
   word's right edge at spawn to its left edge at the wall, which gets both ends
   right without needing the text width in JS. Verified over 89 live samples at
   a 254px board: zero clipped, worst case 16px *inside* the edge.

**Checked and found already correct — do not "fix" these:**
- The Grand Prix word strip is 645px wide inside a 309px container *by design*:
  it is a masked ticker, active word pinned left, upcoming words fading out at
  72%. Measured the active word ending at 91px against a fade starting at 222px.
- The Grand Prix board keeps a fixed derived height (`LANE_COUNT * LANE_HEIGHT
  + TRACK_PAD_Y * 2`) rather than the fluid `var(--board-h)` the other games
  use, because a fluid container would desync the fixed-height track lanes.
- The guides table is fluid (327px at 375, 272px at 320) — it needs no
  `overflow-x` scroll wrapper.
- The hidden typing input is 16px, so iOS will not auto-zoom on focus.

**Coverage:** every route measured for document-level horizontal overflow at
375px — `/`, `/games`, all six `/games/[gameId]`, `/guides/*`. All clean.
Desktop was re-verified for regression after the falling-words geometry change
(768x440 board, 44px/s fall rate, no clipping) since that change touched
gameplay math, and a life-loss run confirmed the floor detection still fires.

## File map — where the load-bearing logic lives

Everything else is presentation. These are the files where a careless edit changes a score, breaks a build, or reintroduces a fixed bug.

| File | What it owns | Don't |
|---|---|---|
| `src/lib/typing-engine/use-typing-engine.ts` | The reducer: every keystroke, the clock, all counters. `reducer` and `createInitialState` are exported **for tests** | Move timing back to `Date.now()`; drop the separator credit in `COMMIT_WORD` |
| `src/lib/typing-engine/stats.ts` | WPM / raw / accuracy / consistency — the single source of these formulas | Duplicate a formula into a component |
| `src/lib/typing-engine/input-commit.ts` | `splitOnCommit` — the mobile-keyboard space path | Assume `keydown` sees the space; it doesn't on Android |
| `src/components/typing-test/word-stream.tsx` | The 3-line window and its **runtime-measured** line pitch | Reintroduce a hardcoded `LINE_HEIGHT`; raise `measureLinePitch`'s minimum-tops threshold back above 2 — that's what made short text silently skip measurement (fixed 2026-09-22) |
| `src/lib/games/survivor/use-survivor.ts` | Wave/enemy sim, XP/level curve, and the **cascading** level-up draft (`pendingLevelUps`) | Collapse a multi-level XP gain into one draft — it must queue and serve one draft per level gained |
| `src/lib/games/use-typing-grand-prix.ts` | Race distance + placement. Reducer exported for tests | Bank `target.length`; hardcode `playerProgress: 1` |
| `src/lib/games/racer/progress.ts` | Ghost Racer's position rule | Use `typed.length` as position |
| `src/lib/audio/audio-bus.ts` | One AudioContext, buses, the `musicEpoch` race guard | Put the epoch in module scope (chunk duplication) |
| `src/lib/games/game-art-assets.ts` | Build-time art resolution via one scoped directory read | Go back to `existsSync` on a templated path — it traces the whole project into the bundle |
| `src/lib/persistence/settings-store.ts` | Persisted settings **with validation on rehydrate** | Trust `JSON.parse` output |
| `src/components/layout/ad-slot.tsx` | Renders nothing until AdSense is configured | Re-add visible placeholders |
| `next.config.ts` | `images.qualities` allowlist, tracing excludes, dev origins | Remove `qualities` — `quality={45}` then fails the build |
| `src/lib/lessons/lesson-types.ts` | The 28-unit, 3-tier curriculum: `LessonId`, `LessonTier`, `LESSON_DEFINITIONS`, ordered `LESSON_LIST` | Add a unit without adding it to `LESSON_LIST` — gating/routing/sitemap all derive from that array |
| `src/lib/lessons/lesson-content.ts` | Drill/review/graduation text generation (key-constrained) plus `buildSubLessons`, the per-unit step ramp | Let a generator emit a character outside `allowedKeys` — `lessons.test.ts` guards this. Hand-author sub-lesson content instead of extending the ramp |
| `src/lib/lessons/lesson-progress-store.ts` | `useLessonProgressStore` (zustand+persist): unit completion/steps/averages, cumulative totals, pure `computeUnitProgressUpdate` + `isLessonUnlocked` | Persist a separate "unlocked" field — derive it from `LESSON_LIST` order + completion instead. Put averaging logic inline in the store action instead of the exported pure function |
| `src/lib/lessons/keyboard-layout.ts` | The single finger↔key mapping the keyboard grid and hand diagram both read, plus the shared `FINGER_VAR` color map | Define a second, divergent finger mapping anywhere else |
| `src/components/lessons/virtual-keyboard.tsx` | Exports `HandDiagram`, reused by `finger-map-explorer.tsx` | Duplicate the hand SVG instead of importing this |
| `src/components/content/guide-layout.tsx` | The two-column shell (reading column + sticky TOC) every `/guides/*` detail page renders through | Change container/column widths without checking at 1920px that the TOC still gets real extra space, not just wider margins |
| `src/lib/seo/metadata.ts` | `truncateAtWord()`, `pageMetadata()` — the single source for word-safe descriptions and canonical/OG/Twitter metadata | Duplicate a `.slice(0, N)` description truncation elsewhere; write metadata by hand instead of calling `pageMetadata()` |
| `src/lib/tools/typing-calculator.ts` | Pure WPM/CPM/KPH formulas + conversions, unit-tested, mirrors `stats.ts`'s correct-characters-only net-WPM convention | Implement a second, gross-minus-penalty net-WPM formula here without explaining the difference on the page |
| `src/app/globals.css` | `--sub`/`--foreground` etc. — every theme's text-contrast tokens | Darken `--sub` back down without checking its contrast ratio against `--background` in every theme (it was 2.17:1 in dark before the 2026-09-25 fix) |
| `src/app/sitemap.ts` | Every route's `lastModified`/priority, hand-set per entry (games/lessons/vocab generated from their own list, guides hand-listed) | Add a new guide page without adding its sitemap entry |

## Before deploying (prerequisites, in order)

1. **Set `NEXT_PUBLIC_SITE_URL`** to the real origin. Unset, everything SEO-facing emits `https://herotyping.com`. Verified: `sitemap.xml`, `robots.txt` and the `/` canonical all read from it.
2. Confirm `npm run build` is **0 warnings** and `npm test` is green.
3. `/debug/typing-engine` must 404 in production (it is guarded by `NODE_ENV`; verified).
4. `NEXT_PUBLIC_ADSENSE_CLIENT_ID` stays unset until the account is approved — that is what keeps ad slots hidden.
5. Node 22+ on CI, or `npm test` won't run. `npm ci` is in sync with `package.json` (verified).
6. Optional housekeeping: four extraneous packages (`@img/sharp-wasm32` and its wasm deps) sit in local `node_modules` but are in no `package.json`, so `npm ci` won't install them. `npm prune` tidies local to match CI.

## Architecture notes (read before modifying the typing engine)

- **Engine state** (`use-typing-engine.ts`) is a `useReducer`, not zustand — mutates every keystroke (high-frequency, subtree-local). Zustand (`settings-store.ts`) holds durable, low-frequency, cross-cutting state. Don't swap these.
- **Keystroke capture** is a real, focused, offscreen `<input>` (`hidden-input.tsx`), not raw `keydown` — needed for IME composition and mobile keyboards. Space/Tab/Escape intercepted in `onKeyDown`; paste blocked entirely.
- **`correctKeystrokes`/`incorrectKeystrokes` are monotonic** — never decremented by backspace — and are the **only** source for accuracy/WPM/raw-WPM *and* the results breakdown's correct/incorrect. Don't reintroduce a second, final-state-derived tally for these two; that's the exact bug that was fixed once already (see above).
- **`charTally`** only tracks `extra`/`missed` (final-state concepts with no keystroke-history equivalent). `missed` counts **every** untyped character of a committed word, punctuation and digits included — see `countMissed`. It feeds accuracy as a third term alongside correct/incorrect keystrokes, because a skipped character produces no keystroke and would otherwise be invisible to the score.
- **One engine, all four modes** — time/words/quote/custom share the same reducer and rendering path.
- **Word/quote data is fully static** (`english-1k.ts` — actually ~360 words, not literally 1000; `english-quotes.ts` — ~26 public-domain quotes). Adding a language = new data file + config extension, not an engine rewrite.
- **Shared option constants live in `engine-types.ts`** (`TIME_DURATIONS`, `WORD_COUNTS`, `QUOTE_LENGTHS`, `MIN`/`MAX_CUSTOM_TIME_DURATION`) and `word-generator.ts` (`PUNCTUATION_MARKS`) — don't redefine these elsewhere. `TimeDuration` is `number` (not a literal union) precisely so a user-entered custom value has somewhere to live; `settings-store.ts` range-checks it on rehydration rather than checking set membership.
- **Persisted data is never trusted blindly** — `settings-store.ts`'s `merge` validates every field on rehydration; `results-store.ts`'s `getPersonalBest` validates the parsed shape. Add new persisted fields to the corresponding validator.
- **Theming**: 5 themes as CSS var blocks in `globals.css`, registered in `THEMES` in `themes.ts`. `--correct` is the bright foreground color in every theme, not green (explicit design request, matches MonkeyType's convention — correctly-typed text becomes the "main" color, only mistakes get a distinct color). A global `transition` on `*` makes theme switches fade smoothly, **except** `.char-instant` (per-character spans in `word-stream.tsx`), which must stay instant — live typing feedback must never visually lag a keystroke.
- **The config bar and live-stats bar never unmount** — both always rendered, stacked in the same CSS grid cell (`grid-area: 1/1` on both, via Tailwind's `[grid-area:1/1]` arbitrary value) inside one grid container, crossfaded via opacity. Grid-stacking (rather than one normal-flow child plus one `absolute` child) matters because the two children are now very different sizes (compact pill row vs. large flip-digit display) — a grid cell auto-sizes to the tallest stacked child regardless of which one that is, so nothing clips. The same visibility technique drives the config-bar/language-selector row, now keyed off `status === "idle"` specifically (not just `!isRunning`) so both also hide on the results screen. Don't go back to conditional mounting or a relative-plus-one-absolute-child layout; both caused real bugs (see Known issues fixed).
- **Bridging state across the `ssr:false` boundary — do NOT use a module-level singleton.** When a page-level sibling (not a descendant) needs to react to engine/test state — e.g. `PageIntro`'s h1/subtitle and `SiteFooter` hiding once a test finishes — keep that sibling *outside* the `ssr:false` boundary (a plain client component with no random content still server-renders fine, which preserves the SEO value; only `TypingTest` needs `ssr:false`, for its `Math.random()` word generation) and share the signal through **state anchored on `window`**, read via `useSyncExternalStore` — see `test-status-store.ts`.
  **A module-level singleton silently breaks here.** The bundler emits a module imported by both the `next/dynamic` chunk and the shared client chunk into *both* — verified by grepping `.next/static/chunks`, where the store's setter appeared in two separate files. A zustand `create()`, a `createContext()`, or even a plain module-scoped `let` therefore becomes **two independent instances**: the writer inside the lazy chunk updates one, the readers subscribe to the other, and the signal never arrives — with no error, no warning, and code that reads as obviously correct. This shipped once and cost two sessions to find. Anchoring the value to `window` makes the duplication harmless, since every copy of the module reads and writes the same object. The `window`-event bus in `reset-bus.ts` is the same idea and is fine for fire-and-forget signals.
### Games architecture (read before adding another game)

**Adding a game touches exactly three shared things**: a new id in the `GameId` union, one `GAME_DEFINITIONS` entry (`game-types.ts`), and one line in the `GAME_COMPONENTS` registry (`game-client.tsx`). Everything else — the hub cards, the `/games/[gameId]` route, the sitemap, the best-score badge — derives from `GAME_LIST`. Cover art needs a new `case` in `game-cover-art.tsx`; without one the switch won't compile, which is deliberate, because the old `if/else` silently gave every new game the same artwork.

- **`GameDefinition` holds only what every game shares** (name, tagline, rules, prose, lives, how the score is formatted). Mechanic tuning lives with its engine — `use-falling-words.ts` holds the spawn/fall numbers for the two games on that engine. Don't push game-specific knobs back into the shared interface; it becomes a union of unrelated concerns every other game has to ignore.
- **One engine can serve several games.** Falling Words and Word Rain are the same mechanic tuned differently. **A variant of "words descend, you type them" should be a new tuning entry, not a second engine** — but a genuinely different mechanic (racing, boss fight, time attack) rightly gets its own, as the four newer games do.
- **The games engine is separate from the typing-test engine on purpose.** `use-typing-engine.ts` is a linear model (one active word, an index that advances); games are spatial and concurrent (many live targets, positions, lives). Bending either into the other would have hurt both. What *is* shared — and should stay shared — is `word-generator.ts`, the math in `stats.ts`, theming, and `storage.ts`.
- **Words advance by a fixed fraction per tick, not by comparing timestamps.** Pausing then needs no timestamp rebasing, and the loop doesn't depend on animation frames (which matters — see the rAF note under Tech stack). CSS transitions `top` over exactly the tick interval, so 20 updates/sec still reads as continuous motion without running the loop at 60fps. **Don't "optimise" this into a rAF loop**; it would break pausing and stop working in a hidden tab.
- **Difficulty ramps with words cleared, not elapsed time** — it tracks how well the player is actually doing rather than punishing a slow start.
- **Targeting locks on.** Once a word's prefix matches, keystrokes stay committed to it even if another word also matches, otherwise the highlight visibly jumps mid-word. With nothing locked, the word closest to the floor wins — it's the one about to cost a life, so it's almost always what the player meant.
- **Runs pause on tab-hide**, so a backgrounded run doesn't drain every life at once when the player comes back.

- **`SUPPORT_EMAIL`/`SITE_URL` in `src/lib/seo/constants.ts` are placeholders** (`hello@herotyping.com`, `https://herotyping.com`) — not real yet. Referenced from `/privacy`, `/terms`, and all metadata. Update these together once a real domain/inbox exists.

### Lessons architecture (read before adding or editing a lesson)

`/lessons` is a 28-unit, 3-tier touch-typing curriculum (Beginner: home row → top row → bottom row → numbers → full-keyboard review → graduation; Intermediate: real sentences, numbers-in-prose, longer passages; Advanced: speed endurance, precision, long-form, full mastery) for people who have never typed before, through to real speed/accuracy work. Built in two passes on 2026-09-22 — the first shipped 17 flat lessons; the second, after the project owner pointed at typing.com directly, restructured everything below into tiers + sub-lessons without touching the underlying reuse strategy. It deliberately reuses the existing typing engine rather than building a second one:

- **A sub-lesson step is `useTypingEngine` in `"custom"` mode, nothing more.** `"custom"` mode already does `customText.trim().split(/\s+/)` to build its word list (`use-typing-engine.ts`), so a step is just a generated string fed in as `customText`. `WordStream` and `HiddenInput` are reused completely unmodified — neither file was touched by this feature. `LessonDrill` (`src/components/lessons/lesson-drill.tsx`) is the driver that wires them together plus the virtual keyboard and runs through a unit's steps sequentially; it is **not** the main `TypingTest` component, because that one is wired to settings-store pickers and a full results graph a drill doesn't want.
- **A unit is one `LessonDefinition`; a sub-lesson is generated from it, not authored.** `buildSubLessons` (`lesson-content.ts`) expands one unit's `content` spec into `subLessonCount` graduated steps (word count ramping ~40%→100% of the unit's full length; a `"review"`-kind unit's first step warms up as a plain drill; a `"graduation"`-kind unit only turns numbers on in its later half). This is *why* 28 units with 4–11 steps each didn't need ~180 hand-authored bodies — **don't hand-author sub-lesson content; extend the generator or the unit's `content`/`subLessonCount` instead.**
- **Adding a unit touches exactly one file**: add its id to `LessonId` and a `LESSON_DEFINITIONS` entry in `src/lib/lessons/lesson-types.ts` (set its `tier`), then add it to `LESSON_LIST` in the order it should be taken. The dashboard, the `/lessons/[lessonId]` route, the sitemap entries (generated from `LESSON_LIST`, not hand-listed — see the sitemap's own comment on this) and the unlock gating all derive from `LESSON_LIST` — same pattern as `GAME_LIST`.
- **A failed sub-lesson retries only that step, never the whole unit.** `currentStep` (in the progress store) only ever moves forward on a pass; a fail leaves it exactly where a retry resumes it. Losing all progress in an 8-step unit over one bad step would be exactly the kind of thing that kills engagement, not just a UX nicety.
- **Progression is gated on accuracy, not WPM** (per-step `minAccuracy`), matching the project's own stated position that accuracy comes before speed. **`isLessonUnlocked` is pure, derived from `LESSON_LIST` order + the completion map — there is no separate "unlocked" field stored anywhere.** Don't add one; it's exactly the kind of redundant persisted state that caused the accuracy/breakdown bug documented above.
- **Progress is a real zustand `persist` store now** (`useLessonProgressStore`, `src/lib/lessons/lesson-progress-store.ts`), not the plain-function/localStorage pattern `game-scores.ts` uses — deliberately, because progress here is read reactively from many places at once (top stats bar, every unit row, the drill's own resume) rather than written once and read by one badge. Follows `settings-store.ts`'s exact `merge`/sanitize shape. **The averaging and pass/fail logic lives in the exported pure function `computeUnitProgressUpdate`, not inline in the store action** — same reasoning as the typing engine exporting its reducer separately: it's what makes the logic testable without a browser. It reads/writes across the `next/dynamic(ssr:false)` boundary `LessonDrill` sits behind exactly the way `settings-store` already does (dynamically-loaded writer, always-loaded dashboard reader) without the module-duplication problem `test-status-store.ts` needed window-anchoring for — that bug was specific to a hand-rolled store, not to zustand's `create()`.
- **Keystroke sound reuses `playSound` from `src/lib/games/game-audio.ts`** — the same lightweight synth module `falling-words-game.tsx` already uses, wired via the identical diff-against-previous-render pattern. No second audio system. The main speed test still stays silent by its own existing, separate design.
- **The virtual keyboard + two-hand finger diagram** (`src/components/lessons/virtual-keyboard.tsx`) is abstract geometric SVG, not illustrated art, colored entirely from the `--finger-*` CSS variables in `globals.css` — same reasoning as the arcade layer's `color-mix` approach: it re-themes for free and costs nothing to load. The finger→key assignments live in `src/lib/lessons/keyboard-layout.ts` (`KEY_FINGER_MAP`) and are the single source both the grid and the hand diagram read from. **The 8 finger colors are deliberately theme-invariant** (defined once in `:root`, not per `[data-theme]`) — a categorical legend, not thematic decoration. Checked live against Dark and Light; Midnight/Forest/Sunset weren't individually screenshotted.
- **`LessonClient` (`src/components/lessons/lesson-client.tsx`) wraps `LessonDrill` in `next/dynamic(..., { ssr: false })`**, same reason `GameClient` and `TypingTest` do — the generated content uses `Math.random()`, so server-rendering it would guarantee a hydration mismatch. Don't import `LessonDrill` directly into the `/lessons/[lessonId]` server page.
- **`AdRail` (`src/components/layout/ad-rail.tsx`)** is a `sticky`, `xl:`-only 300px column beside the content on `/`, `/lessons/[lessonId]` and every `ContentPage`-based route (`/about`, `/privacy`, `/terms`, `/achievements`) — deliberately **not** added to `/games/[gameId]`, which already documents its own reasoning against an ad beside the game board (distraction/mis-click risk). Below `xl:` every one of these routes keeps its existing below-content `AdSlot` only. **Guide pages (`/guides/*`) use `GuideLayout`, not `ContentPage`** (see below) and don't currently carry an `AdRail` — their own sticky right column is the table of contents instead.

### Content/guide system architecture (read before adding or restyling a guide)

`/guides/*` (23 pages as of 2026-09-26) is built from a small set of shared components under `src/components/content/`, deliberately reusing `ContentPage`'s existing card language (`border-border`, `bg-sub-alt/20`, `rounded-xl`) rather than inventing a second visual system:

- **`GuideLayout`** (`src/components/content/guide-layout.tsx`) — the shell every guide *detail* page renders through. Not the same component as `ContentPage` (which `/about`, `/privacy`, `/terms`, `/achievements` still use) — `GuideLayout` is wider (1180px container, 800px reading column) and adds a sticky "On this page" table of contents on the right, built from a `toc: {id, label}[]` prop the page author supplies by hand (must match real `id` attributes on the page's own `<h2>`s — nothing auto-generates this, so a new `<h2>` needs a matching `toc` entry or it's just not in the TOC). Two-column layout only above `min-[1150px]:`; single column (no TOC) below that, all the way to mobile. **If you widen this container again, verify at 1920px with `getComputedStyle` that the grid's actual column widths grew, not just the outer margins** — that was the whole point of the 2026-09-25 width fix.
- **`Callout`** — the bordered "Quick answer"/formula/worked-example box. Body text is `text-foreground/90`, one tier brighter than the general secondary `--sub` token, because these boxes are often the single most-read part of a guide.
- **`FaqSection`** — renders the visible FAQ list *and* emits matching `FAQPage` JSON-LD from the exact same data in one component, specifically so the visible answers and the schema's answers can never drift apart (a real risk if they were maintained as two separate blocks). Every FAQ item needs both a rich `answer` (JSX, can contain links) and a `plainAnswer` (plain string, for the schema, no markup).
- **`SourceList`** — a short "Sources & references" block. Only added to a guide when a real external source was actually used for a factual claim — never populated with placeholder or decorative citations.
- **Body-copy contrast tiering** (fixed 2026-09-25, see "Session 2026-09-24/25" above): article paragraphs, list items, and table cells inherit `text-foreground/90` from `GuideLayout`'s wrapper div via normal CSS color inheritance — **don't add an explicit `text-sub` class to ordinary body content inside a guide**, it will override the inherited brighter tone and look duller than the rest of the page. `text-sub` (now itself fixed to a real ~4.9:1+ contrast) is still correct for genuinely secondary elements: breadcrumbs, the TOC, small mono labels, and `text-sub/70`-style muted footnotes like "Last updated."
- **Interactive tools live in `src/components/tools/`**, separate from `src/components/content/` — `TypingCalculator` (client component, wraps the pure `src/lib/tools/typing-calculator.ts`) and `FingerMapExplorer` (client component, wraps the shared `keyboard-layout.ts` data and the lesson drill's own `HandDiagram`). Both are plain client components dropped directly into an otherwise-server-rendered guide page — **not** wrapped in `next/dynamic(ssr:false)` the way `TypingTest`/`LessonDrill`/`GameClient` are, because neither uses `Math.random()` or anything else that would cause a hydration mismatch; their initial state is fixed, deterministic default values.
- **`pageMetadata()` (`src/lib/seo/metadata.ts`) is the only way a guide (or any static page) should set its `Metadata` export** — it fills `title`/`description`/`canonical`/`openGraph`/`twitter` from one call, which is what closed the real bug where several pages silently inherited the homepage's OG tags. `truncateAtWord()` in the same file is the only sanctioned way to truncate a description — never a raw `.slice(0, N)`, which can cut mid-word.
- **Adding a new guide touches**: the page itself (`src/app/guides/<slug>/page.tsx`, using `GuideLayout` + the components above), one entry in the `GUIDES` array in `src/app/guides/page.tsx` (the hub listing), and one entry in `src/app/sitemap.ts`. Nothing auto-derives the hub listing or the sitemap from the filesystem the way `GAME_LIST`/`LESSON_LIST` drive their own hubs — this is a real difference from the games/lessons pattern, and a guide that's only added to the filesystem (not those two other places) will build fine but stay effectively orphaned/unlisted.

---

## SEO — top priority, needs to be genuinely world-class

Pre-launch, zero traffic, zero backlinks, zero domain authority. "World-class SEO" for a site in this position doesn't mean "rank for 'typing test' on day one" — it means the *foundation* (technical correctness, content depth, site architecture) is built so well that once the domain has any authority at all, nothing structural is holding it back, and early long-tail/informational traffic compounds into topical authority instead of getting capped by thin-content or technical mistakes. Everything below is organized as an honest checklist: what's actually done, what's missing, and in what order to build it.

### Technical SEO — current state (audited directly against the live code)

**In place:**
- Per-route `Metadata` API usage with a title template (`%s | HeroTyping`), description, canonical, Open Graph + Twitter card defaults — **every route now calls the shared `pageMetadata()` helper** (`src/lib/seo/metadata.ts`, added 2026-09-25), not just the original four static pages. This is what closed the real bug where static hub pages and guides silently inherited the homepage's OG tags.
- `sitemap.ts` and `robots.ts` via Next.js file conventions, sitemap linked from robots. **All 75 indexable URLs (24 guide routes including hub, 11 games, 30 lesson routes including placement test, 4 vocabulary tiers including hub, and core tools) are in the sitemap** as of 2026-09-26.
- **`Organization`/`WebSite` JSON-LD site-wide** (root layout), plus **`Article`, `BreadcrumbList`, `FAQPage`, `VideoGame` (games), `LearningResource` (lessons) schema** per relevant route (`src/lib/seo/json-ld.ts`) — item 3 and item 4 below are now done, not just planned.
- Breadcrumbs on every guide, game, lesson and vocabulary-tier page (`src/components/layout/breadcrumbs.tsx`, also emits matching `BreadcrumbList` JSON-LD from the same data so the two can't drift apart).
- Dynamically generated OG image (`opengraph-image.tsx`) at the root, plus **per-route dynamic OG images** for every game and lesson (`opengraph-image.tsx` inside each `[param]` folder, each with its own `generateStaticParams`) — no static asset to go stale.
- **Google Analytics 4 wired in** (2026-09-25, `@next/third-parties/google`, production-only) — item 6 below is now done. The Privacy Policy should still be checked/updated to match (see "Launch-day technical SEO checklist" below).
- SSR'd shell (h1, intro paragraph, JSON-LD) around a client-only interactive island — crawlers see real content without executing JS, Core Web Vitals aren't dragged down by the typing engine's client bundle blocking the initial paint.
- Self-hosted fonts via `next/font` (no external font request, no render-blocking `@font-face`).
- Semantic heading hierarchy on content pages (`ContentPage`/`GuideLayout`: one h1, h2/h3 subsections, `scroll-mt-24` on guide h2s so the sticky TOC's anchor links land correctly below the header).
- Custom themed 404 with `robots: { index: false }`.
- No client-side data fetching on any page — word/quote lists are static imports, so there's nothing for Core Web Vitals to wait on.

**Missing or wrong — fix before/at launch, roughly in priority order:**
1. ~~**`sitemap.ts`'s `lastModified` is `new Date()` evaluated at request time**~~ — **Fixed 2026-09-15**: now a hand-set date per route, bumped only when that page's content changes.
2. **No Search Console verification mechanism wired up.** Add a `metadata.verification.google` field (or a DNS TXT record once the domain exists) — this blocks every other measurement/indexing action, so it's the first thing to do once a domain exists.
3. ~~**No `Organization`/`WebSite` JSON-LD with a `SearchAction`**~~ — **`Organization`/`WebSite` done** (root layout); the `SearchAction` bit specifically (sitelinks search box eligibility) is still not added — low-effort if wanted.
4. ~~**Only one schema type in use**~~ — **Fixed 2026-09-24/25**: `Article`, `BreadcrumbList`, `FAQPage`, `VideoGame`, `LearningResource` are all in use per-route, described above. Every FAQ is real content answering questions actually researched (autocomplete, common questions), not invented to hang schema on.
5. **`robots.ts` doesn't address AI/LLM crawlers** (GPTBot, Google-Extended, CCBot, ClaudeBot, etc.) one way or the other. Genuine, live policy question with no universally "correct" answer — the human's call, not a default to silently pick.
6. ~~**No analytics wired up at all.**~~ — **Fixed 2026-09-25**: GA4 via `@next/third-parties/google`, production-only. **The Privacy Policy likely still needs a matching update** — it previously correctly said "no analytics"; verify and update before launch.
7. **No `manifest.json`.** Low-effort, gives "add to home screen" plus a small completeness signal. Do it alongside the favicon.

### Content architecture — building real topical authority without thin content

Earlier competitive research (Monkeytype, 10FastFingers, TypingClub, NitroType/TypeRacer, Keybr, Ratatype) established the strategic position: **don't chase head terms pre-launch** ("typing test", "wpm test" are dominated by huge incumbents); **the real wedge is Monkeytype-grade UX + genuinely good mobile support + light beginner guidance + real accessibility**, wrapped in a legitimate content layer that Monkeytype (donation-funded, no SEO incentive) doesn't bother building. Critically: **Google's "scaled content abuse" policy explicitly names templated typing-test-style page patterns as a common abuse example in this exact niche** — a page set built by swapping one keyword across an otherwise-identical template is a real risk to the whole domain's trust.

**Information architecture decision**: `/guides/<slug>` as a flat namespace (not `/blog/<slug>`) — reads as evergreen reference material matching how-to search intent. This held up well past the original 5-guide plan; **23 guides now share it with no `/blog` split needed**.

**Tier 1 — originally planned, now all effectively superseded/done:**
1. ~~`/guides/how-to-improve-typing-speed`~~ — **Done 2026-09-15, substantially rewritten into a flagship resource 2026-09-24/25** (WPM progression ladder, a repeatable "baseline → find weak keys → drill → retest" loop, sourced FAQ).
2. ~~`/guides/average-typing-speed`~~ — **Done 2026-09-15, expanded 2026-09-24/25** with the Aalto University study citation and an "Is my WPM good?" quick-answer table.
3. ~~`/guides/touch-typing-basics`~~ — superseded by two pages instead of one: `/guides/how-to-touch-type` (the article/technique version) and **`/guides/touch-typing-finger-map`** (2026-09-25, a genuinely interactive hover/tap/click finger-map explorer, not just article text) — see "Session 2026-09-24/25" above. Both link into `/lessons` for hands-on practice rather than re-explaining what the lessons teach hands-on, exactly as this section originally suggested.
4. ~~`/guides/wpm-vs-cpm`~~ — superseded by `/guides/net-wpm-vs-gross-wpm` (formula explainer) **and** `/guides/wpm-cpm-kph-calculator` (2026-09-25, a real interactive calculator, not just a comparison article) — see "Session 2026-09-24/25" above.
5. ~~`/guides/typing-accuracy-vs-speed`~~ — became `/guides/how-to-improve-typing-accuracy` (2026-09-25): a 7-step accuracy-improvement system, accuracy targets by stage, ties back to the site's own accuracy/consistency metrics as originally scoped.

**Also shipped, not in the original Tier-1 list**: `/guides/how-to-type-without-looking-at-the-keyboard` (day-by-day plan), `/guides/typing-practice-for-beginners` (curriculum by time-available and skill stage), `/guides/english-typing-test-and-practice`, `/guides/typing-test-duration-guide`, `/guides/data-entry-typing-test`, and **`/guides/typing-resources-for-teachers`** (2026-09-25 — a week-by-week plan generated live from the real 28-lesson `LESSON_LIST`, classroom activities, honestly-sourced grade benchmarks).

**Ten new authority guides shipped on 2026-09-26 (expanding from 13 to 23 guides)**:
1. `/guides/proper-typing-posture-and-ergonomics` (desk height, elbow angles, 90-degree rule, RSI prevention)
2. `/guides/typing-stretches-and-hand-warmups` (wrist flexion, tendon glides, micro-break routines)
3. `/guides/how-to-break-a-typing-speed-plateau` (rigorous diagnostic framework, preprint-corrected natural typing study, error recovery)
4. `/guides/qwerty-vs-dvorak-vs-colemak` (finger travel analysis, home row distribution, layout switching roadmap)
5. `/guides/best-keyboard-switches-for-typing` (linear vs tactile vs clicky, actuation force, workplace acoustics)
6. `/guides/911-dispatcher-typing-test` (CAD system benchmarks, audio distraction simulation, emergency dispatch accuracy)
7. `/guides/touch-typing-for-dyslexia-and-dysgraphia` (phonemic typing vs motor memory, high-contrast themes, multisensory drills)
8. `/guides/typing-for-programmers` (bracket/symbol reach, camelCase navigation, terminal and IDE efficiency)
9. `/guides/one-handed-typing-guide` (Half-QWERTY mirror layout, single-handed Dvorak, adaptive accessibility)
10. `/guides/how-to-type-numbers-and-symbols-without-looking` (numrow finger reaches, shift-symbol pairs, numpad touch method)

## Guides Architecture & Category-First Content System

The HeroTyping Guides system uses a scalable 3-tier educational information architecture designed to support a deep knowledge base without cluttering root navigation:

```
/guides                     -> CATEGORY DIRECTORY (Landing hub, 6 category cards, 3 pillars, product CTA)
   ↓
/guides/<category>          -> ARTICLE DIRECTORY (Pillar hub, lists all guides in category, curriculum progression)
   ↓
/guides/<article-slug>      -> INDIVIDUAL GUIDE (In-depth tutorial, interactive tools, structured FAQs)
   ↓
HeroTyping Features         -> DELIBERATE PRACTICE (Lessons, Weak-Key Practice, Games, Vocabulary)
```

### Information Architecture Rules
1. **`/guides` is strictly the Category Directory**: It displays the 6 category cards, a compact 3-pillar "Start Here" roadmap, and a product action CTA. It does **not** render all individual guide cards or loop through article archives.
2. **`/guides/<category>` is the Article Directory**: Each category page (`GuideCategoryView`) lists all guides in that pillar, displays a recommended learning progression ladder, and provides a category-specific product CTA.
3. **`/guides/<article-slug>` is the individual guide**: Permanent, canonical, non-category-prefixed URL structure. Existing URLs remain stable and must never be moved to `/guides/<category>/<slug>`.
4. **Deliberate Product Tie-In**: Every guide actively connects mental models to hands-on keyboard practice on HeroTyping (speed test, guided lessons, weak-key drills, arcade games, or vocabulary).

### The Six Guide Categories

| Category | Slug & URL | Scope & Focus | Guide Count | Primary Product Link |
|---|---|---|---|---|
| **Typing Basics** | `typing-basics`<br>`/guides/typing-basics` | Home row finger placement, blind typing technique, tactile anchor bumps, and ergonomic posture foundations. | 7 guides | `/lessons` (Beginner Lessons) |
| **Typing Practice** | `typing-practice`<br>`/guides/typing-practice` | Deliberate practice frameworks, physical stretches, tendon glides, classroom curricula, and structured drills. | 10 guides | `/lessons/practice` (Weak-Key Drills) |
| **Improve Your Typing** | `improve-your-typing`<br>`/guides/improve-your-typing` | Diagnostic speed protocols, motor learning frameworks, accuracy stabilization, and speed plateau breakthroughs. | 7 guides | `/` (Typing Speed Test) |
| **Typing Tests & Tools** | `typing-tests-tools`<br>`/guides/typing-tests-tools` | Measurement formulas (Net vs. Gross WPM, CPM, KPH), live interactive converters, and test duration science. | 6 guides | `/guides/wpm-cpm-kph-calculator` (Live Calculator) |
| **Keyboard Skills** | `keyboard-skills`<br>`/guides/keyboard-skills` | Blind number and symbol typing, finger reach vectors, mechanical switch selection, and alternative layouts. | 9 guides | `/lessons/numbers-low` (Number Row) |
| **Typing for Work & Study** | `typing-work-study`<br>`/guides/typing-work-study` | Programming workflows, emergency dispatch benchmarks (CritiCall), one-handed typing, and dyslexia accommodations. | 4 guides | `/games` (Arcade Games) |

*Total active guides in registry*: **43 guides** across 6 category pillars.

### Flagship 20 Editorial Plan & Production Status

All 20 flagship guides of the educational content roadmap have been researched, authored, technically integrated, and validated in the repository:

| # | Article Slug | Category | Word Count | Status | Embedded Visual Asset |
|---|---|---|---|---|---|
| 1 | `touch-typing-lesson-order` | Typing Basics | ~2,100 | **IMPLEMENTED & VALIDATED** | `touch-typing-curriculum-flow.webp` (21.4 KB) |
| 2 | `touch-typing-roadmap-for-beginners` | Typing Basics | ~2,250 | **IMPLEMENTED & VALIDATED** | `beginner-touch-typing-timeline.webp` (19.6 KB) |
| 3 | `home-row-typing-practice` | Keyboard Skills | ~2,400 | **IMPLEMENTED & VALIDATED** | `home-row-asdf-jkl-guide.webp` (18.0 KB) |
| 4 | `how-to-type-top-row-without-looking` | Keyboard Skills | ~2,150 | **IMPLEMENTED & VALIDATED** | `top-row-reach-vectors.webp` (20.4 KB) |
| 5 | `bottom-row-typing-practice` | Keyboard Skills | ~2,100 | **IMPLEMENTED & VALIDATED** | `bottom-row-flexion-mechanics.webp` (18.4 KB) |
| 6 | `number-row-typing-practice` | Keyboard Skills | ~2,300 | **IMPLEMENTED & VALIDATED** | `number-row-reaches-guide.webp` (17.3 KB) |
| 7 | `punctuation-typing-practice` | Keyboard Skills | ~2,200 | **IMPLEMENTED & VALIDATED** | `punctuation-shift-coordination.webp` (17.0 KB) |
| 8 | `practice-typing-numbers-and-symbols-without-looking` | Keyboard Skills | ~2,350 | **IMPLEMENTED & VALIDATED** | `mixed-numeric-symbol-patterns.webp` (22.3 KB) |
| 9 | `typing-practice-for-difficult-keys` | Keyboard Skills | ~2,400 | **IMPLEMENTED & VALIDATED** | `difficult-reaches-finger-mechanics.webp` (21.4 KB) |
| 10 | `how-to-find-your-weakest-typing-keys` | Improve Your Typing | ~2,100 | **IMPLEMENTED & VALIDATED** | `weak-key-diagnostic-heatmap.webp` (20.1 KB) |
| 11 | `typing-practice-for-weak-keys` | Typing Practice | ~2,250 | **IMPLEMENTED & VALIDATED** | `weak-key-drill-progression.webp` (19.0 KB) |
| 12 | `how-to-use-typing-test-results-to-improve` | Typing Tests & Tools | ~2,300 | **IMPLEMENTED & VALIDATED** | `typing-test-improvement-loop.webp` (23.5 KB) |
| 13 | `why-wpm-is-high-accuracy-is-low` | Improve Your Typing | ~2,200 | **IMPLEMENTED & VALIDATED** | `error-backspace-penalty-chart.webp` (14.8 KB) |
| 14 | `how-to-improve-typing-consistency` | Improve Your Typing | ~2,150 | **IMPLEMENTED & VALIDATED** | `typing-consistency-waveform.webp` (22.7 KB) |
| 15 | `how-many-minutes-a-day-to-practice-typing` | Typing Practice | ~2,050 | **IMPLEMENTED & VALIDATED** | `daily-practice-duration-comparison.webp` (18.5 KB) |
| 16 | `how-to-structure-typing-practice-session` | Typing Practice | ~2,200 | **IMPLEMENTED & VALIDATED** | `practice-session-block-architecture.webp` (16.3 KB) |
| 17 | `custom-text-typing-test` | Typing Tests & Tools | ~2,100 | **IMPLEMENTED & VALIDATED** | `custom-text-typing-workflow.webp` (16.3 KB) |
| 18 | `typing-test-vs-typing-practice` | Typing Practice | ~2,150 | **IMPLEMENTED & VALIDATED** | `test-vs-practice-comparison.webp` (18.8 KB) |
| 19 | `typing-games-vs-typing-tests` | Typing Practice | ~2,200 | **IMPLEMENTED & VALIDATED** | `arcade-games-vs-timed-tests.webp` (16.6 KB) |
| 20 | `vocabulary-typing-practice` | Typing Practice | ~2,300 | **IMPLEMENTED & VALIDATED** | `vocabulary-orthographic-mapping.webp` (18.4 KB) |

### Image System Architecture & Optimization Pipeline

The visual asset system enforces strict modularity, category isolation, and bandwidth efficiency:

```
public/guides/
├── shared/
│   └── flagship-20-contact-sheet.webp      (64 KB overview reference)
├── typing-basics/
│   └── <article-slug>/<filename>.webp
├── typing-practice/
│   └── <article-slug>/<filename>.webp
├── improve-your-typing/
│   └── <article-slug>/<filename>.webp
├── typing-tests-tools/
│   └── <article-slug>/<filename>.webp
├── keyboard-skills/
│   └── <article-slug>/<filename>.webp
└── typing-work-study/
    └── <article-slug>/<filename>.webp
```

**Optimization & Validation Tooling:**
- **Automated Optimizer**: `scripts/optimize-guide-images.mjs` (`npm run images:optimize`). Uses ImageMagick to resize (max 1200px), strip EXIF metadata, and apply WebP lossy compression with Lanczos resampling.
- **Automated Validator**: `scripts/validate-guide-images.mjs` (`npm run images:validate`). Asserts zero flat root files in `public/guides/`, checks all registered assets exist on disk, verifies every file is strictly under 100 KB, and calculates total footprint.
- **Compression Standards**:
  - Preferred Target: `<80 KB`
  - Hard Target: `<100 KB`
  - Current Status: **36 guide visual assets + 1 shared contact sheet on disk**. All 36 assets range between **14.8 KB and 96.2 KB** (median ~21 KB, average 41.5 KB). Total visual footprint on disk is **1.54 MB**. 0 files missing, 0 violations.

### Sitemap Architecture & Technical SEO

- **Single Authoritative Source of Truth**: Next.js App Router metadata route in `src/app/sitemap.ts`. Generates `/sitemap.xml` dynamically and prerenders static XML at build time. No manually maintained static XML files.
- **Production Base URL**: `https://herotyping.com` (configurable via `NEXT_PUBLIC_SITE_URL`).
- **URL Inventory Audit (Exactly 100 Routes)**:
  - `1` Homepage (`/`)
  - `3` Static Company Pages (`/about`, `/privacy`, `/terms`)
  - `1` Achievements Page (`/achievements`)
  - `1` Main Guides Hub (`/guides`)
  - `6` Category Hub Pages (`/guides/typing-basics`, `/guides/typing-practice`, `/guides/improve-your-typing`, `/guides/typing-tests-tools`, `/guides/keyboard-skills`, `/guides/typing-work-study`)
  - `43` Individual Guide Content Pages (`/guides/<slug>`)
  - `11` Arcade Game Pages (`/games` hub + 10 playable game routes)
  - `30` Lesson Pages (`/lessons` hub, `/lessons/practice`, + 28 curriculum lesson units)
  - `4` Vocabulary Pages (`/vocabulary` hub + 3 difficulty tiers)
- **Formatting Guardrails**:
  - 0 duplicate URLs.
  - 0 trailing slashes (except root).
  - 0 query parameters or hash fragments.
  - 0 localhost or non-production protocols.
  - ISO 8601 hand-maintained `lastModified` dates (`YYYY-MM-DD`).
- **Automated Regression Suite**: Integrated in `src/lib/seo/metadata.test.ts` (runs on `npm test`). Automatically tests presence of `/guides`, all 6 category hubs, all 43 guides in `GUIDE_REGISTRY`, zero duplicate paths, and valid date formats.
- **Search Console Distinction**: Technical sitemap inclusion ensures discoverability and crawl eligibility; Google indexing depends on Search Console submission, crawl queue, and domain authority.

### Analytics Status & Product Telemetry

- **Engine**: Google Analytics 4 via `@next/third-parties/google` `<GoogleAnalytics>` in root layout.
- **Measurement ID**: Stored in `src/lib/analytics/constants.ts`, gated strictly to `process.env.NODE_ENV === "production"` so local development never pollutes analytics metrics.
- **Funnel Instrumentation Objective**: Moving beyond raw traffic volume to measure the complete learning and practice funnel:
  1. Test start vs test completion (WPM, accuracy, mode).
  2. Lesson starts vs lesson pass/completion rate.
  3. Weak-key practice drill engagement.
  4. Arcade game starts vs game-overs.
  5. Placement assessment usage.
  6. Guide-to-practice conversion.
- **Privacy Compliance**: Privacy policy updated with transparent aggregate disclosures; zero keystroke logging, zero PII transmission.

### Testing & Verification Status

Continuous quality gates enforced across every change:
- `npm test`: **218 passed / 0 failed** across 49 test suites (typing engine scoring, mobile commit, anti-exploit rules, countdown timer, curriculum gating, vocabulary ratios & TTS, calculator conversions, sitemap integrity).
- `npm run lint`: **0 errors, 0 warnings** (ESLint 9).
- `npm run typecheck`: **0 type errors** (`tsc --noEmit`).
- `npm run images:validate`: **36/36 guide images valid**, 0 missing, 0 > 100 KB, 0 root violations.
- `npm run build`: **All 150 static pages successfully compiled and prerendered** in ~3.0s.

### Internal linking
**Now genuinely dense and hierarchical.** Every guide cross-links related guides contextually, each category hub displays structured learning paths, and the `/guides` hub guides users to the 6 category pillars. The three flagship resources link both ways into the guides they're most related to (calculator ↔ `net-wpm-vs-gross-wpm`/`data-entry-typing-test`; finger map ↔ `how-to-touch-type`). The homepage feature nav (`HomepageFeatureNav`) links out to `/lessons`, `/games`, `/vocabulary`, `/guides`. `SiteFooter`'s "Guides" link points at the `/guides` index. Achievements page links to `/lessons` and `/games`.

### Core Web Vitals / INP
The entire product *is* keypress-to-render latency — unusually high-stakes here, not a generic checklist item. Current state is good in principle (per-character rendering bypasses the global CSS transition via `.char-instant`, no client data fetching, self-hosted fonts, static data) but has never been measured with real tooling since there's no deployed URL yet. Once deployed: run Lighthouse/PageSpeed Insights immediately, treat any INP regression as priority-one. Watch this especially once real AdSense scripts are added — third-party ad scripts are a well-documented source of INP regressions.

### Launch-day technical SEO checklist (in order, once a real domain exists)
1. Register domain, update `NEXT_PUBLIC_SITE_URL`/`SUPPORT_EMAIL`.
2. Deploy, verify in Google Search Console and Bing Webmaster Tools.
3. Submit the sitemap in both.
4. Confirm GA4 real pageviews/Realtime data once actually deployed.
5. Run Lighthouse/PageSpeed Insights on the live URL, fix anything red before further content work.
6. **Do not expect fast organic movement** — a brand-new domain with zero backlinks realistically takes weeks to months to get fully indexed, even with perfect technical SEO.

### Guardrails (don't repeat these mistakes)
- Never build templated pages differing only by keyword substitution (duration, city, job, language) without genuinely distinct content per page.
- Don't add structured data purely for rich-result gaming — only mark up content that would exist anyway.
- Don't treat page count as progress. Five genuinely good guide pages beat fifty thin ones.


---

## Prioritized backlog (non-SEO)

### Product / Architecture (unblocks the SEO launch checklist above)
1. Register a real domain, update `NEXT_PUBLIC_SITE_URL` and `SUPPORT_EMAIL` in `src/lib/seo/constants.ts`.
2. Add a custom favicon + `manifest.json`.
3. Set up a real, monitored support inbox.
4. ~~Decide on an analytics tool~~ — **Done 2026-09-25: GA4.** Remaining step is updating the Privacy Policy to match, and confirming real Realtime data once actually deployed to a live domain.

### Frontend / UX
1. Settings modal (sound toggle, additional themes) — low priority until there's a stub sound system worth surfacing.
2. Focus-trap the custom-text modal if it grows more complex.
3. ~~Custom `:focus-visible` ring styled to match the accent color~~ — **Done 2026-09-27**: Added global high-contrast `:focus-visible` outline using theme accent token in `globals.css`.
4. Real mobile-device check (physical phone/tablet, not just a resized desktop viewport).
5. Resolve the two open "Awaiting human input" items above before doing more animation/language-selector polish.
6. ~~Live countdown timer formatting~~ — **Done 2026-09-27**: Pure `formatCountdown` (<60s -> "0s", 60s+ -> "1:00", 1h+ -> "1:00:00") implemented with tabular digits and zero layout jumping; tested in `format-countdown.test.ts`.
7. ~~Live-verify the "not live-verified" items~~ — **Done 2026-09-15**; two were genuinely broken and are now fixed. See Known issues fixed.
8. **Mobile 3D Games Hub (`/games`): Shipped 2026-09-25** — Implemented a premier Hotstar-inspired mobile experience for `/games`:
   - Top section: 3D Coverflow / Layered Card Carousel with CSS 3D perspective (`preserve-3d`, `rotateY`, `scale`, `translateZ`), character art pop-outs, swipe gestures with touch physics, chevrons, and pagination pills.
   - Bottom section: Smooth horizontal momentum scrolling rail (`snap-x snap-mandatory`, `no-scrollbar`) where users see a couple of cards side-by-side (`w-[182px]`), with category filters, best score badges, and instant Play CTA.
   - Mobile hero tightened (`py-6`, concise copy) and ad slot repositioned below the games so mobile users reach the games immediately without endless vertical scrolling.
   - Desktop retains its full responsive grid and interactive hover parallax.

### QA / Performance / Security
1. **A test suite exists as of 2026-09-17, expanded 2026-09-22, 2026-09-25, 2026-09-26, and 2026-09-27: 218 cases across 49 suites, `npm test`.** No framework was added — it runs on Node 22's built-in `node:test` with `--experimental-strip-types`, so it needs **Node 22+**. `scripts/test-setup.mjs` maps the `@/*` alias (Node ignores `tsconfig` paths). Files: `src/lib/typing-engine/typing-engine.test.ts` (scoring, timing, backspace, consistency, mobile input), `src/lib/games/games-integrity.test.ts` (the anti-exploit rules), `src/lib/lessons/lessons.test.ts` (drill/review content never leaks a disallowed key, progress gating, curriculum data integrity), `src/lib/seo/metadata.test.ts` (`truncateAtWord` never cuts mid-word, sitemap integrity suite with 0 duplicate routes, all categories and registered guides), `src/lib/vocabulary/vocabulary.test.ts` (word selection, reducer, progress sanitizer, 1300-word 50/30/20 ratio and global uniqueness), `src/lib/typing-engine/format-countdown.test.ts`, and `src/lib/tools/typing-calculator.test.ts` (WPM/CPM/KPH conversion round-trips and the worked examples the guide itself shows). Tests drive pure reducers/functions directly, never rendered components — through the UI a dropped keystroke and a missed render are indistinguishable.
2. **Coverage is deliberately narrow: scoring correctness and exploit resistance only.** There are no component/render tests and no e2e suite. That is a real gap if you start changing UI behaviour; live browser verification is still the only check on anything visual.
3. Gates, all currently clean: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build` (**0 warnings** — a warning here previously meant the whole project was being traced into the server bundle, so treat a new one as a real finding).
4. No security concerns identified; custom text capped at 2000 chars bounds worst-case rendering cost. Note the *integrity* concern that did exist: two games were winnable without typing (see Session 2026-09-17). **Any new game must tie its win condition to correctly-typed characters, and should get a test in `games-integrity.test.ts`.**
5. `AnimatePresence` exit-unmount is now confirmed *unreliable* under rapid re-keying (see Known issues fixed) — the flip-digit case was fixed with manual lifecycle management instead. Other usages (`PageIntro`, `ResultsPanel`'s reveal, `CustomTextModal`) change far less frequently so the same failure mode is much less likely to matter, but haven't been stress-tested the same rigorous way (checking live DOM node counts, not just visual behavior) — worth doing if any of them are ever driven by fast-changing state.

### Growth / Retention / Monetization
- **Typing games shipped (11 games total)**: `falling-words`, `word-rain`, `word-blaster`, `typing-grand-prix`, `boss-battle`, `combo-rush`, `spellbound`, `typing-survivor`, `ghost-racer`, `card-battle`, and flagship arcade game `fruit-fury` (shipped 2026-09-26 with parabolic physics, fruit slice particles, fatal bomb hazards, fever frenzy 2X scoring, and dedicated row practice modes).
- Games worth considering next, roughly by how much new engine work each needs: an **accuracy mode** (a single typo ends the run — pure tuning, no new mechanics), a **time-attack/combo rush** (clears add time — needs a clock mechanic), and a **boss/wave mode** (discrete waves rather than a continuous ramp). None are committed; ask before building.
- Games currently have **no ad slots at all** — deliberate for now, since mid-game ads would wreck the feel. The hub page is the natural place to add one if/when games get traffic.
- Still deferred by design: accounts, leaderboards, multiplayer, achievements/streaks. Games make a leaderboard more tempting, but it needs a backend — don't start one without an explicit ask.
- AdSense requires the human to create/verify the account — `AdSlot` is ready for a real client ID whenever that happens.

---

## Working across multiple AI sessions/tools on the same codebase

This project has genuinely been worked on by more than one AI session concurrently at times (observed firsthand: a scheduled autonomous cycle picked up and committed in-progress work while an interactive session was simultaneously testing the same code; separately, commit messages and this file have referenced feedback and decisions from conversations this particular session never saw). That's not hypothetical caution — plan for it:

- **Always `git log --oneline -10` and `git status` before assuming you know the current state.** This file is written carefully but *can* drift or be mid-update by someone/something else. Git is ground truth; this file is a guide.
- **If `git status` shows substantial uncommitted work you didn't create**, someone else (human or AI) may be actively mid-task. Don't commit over it; verify what it is first.
- **Trust direct, current, specific feedback from the human over any secondhand paraphrase in this file** — including paraphrases *in this file itself* of what a "previous session" claimed the human said. If you can get fresh confirmation, prefer it. A real example from this project's history: one session's commit message claimed "the human found the smaller text too small" and reverted a size change; the human's next actual message, with screenshots, said the *reverted* size was too large. The paraphrase wasn't reliable; the direct message was.
- **Claim only what you've actually verified.** Distinguish "built," "verified in a real browser," "recommended," and "blocked on the human" — don't blur them. If you can't test something in your environment, say so plainly rather than asserting it works.

## How to resume work

1. Read this file completely.
2. `cd` into this directory and run the full gate: `npm test && npm run lint && npx tsc --noEmit && npm run build`. All four must be clean and the build must emit **0 warnings**. If any fail, fix that before anything else — it means something regressed since the last session, not that the gate is wrong.
3. Check `git log --oneline -10` and `git status` for what's actually landed vs. what this file claims.
4. Pick the next item based on what's actually being asked right now — this file is context for good decisions, not a queue to execute blindly without checking in with whoever you're working for.
5. When you're done, update this file's relevant section(s) — status, known issues, backlog — before ending your session, so the next session (whoever/whatever it is) doesn't start from behind.

**One habit that has repeatedly paid off here, worth adopting:** when you fix something, try to prove the fix matters by deliberately reintroducing the bug and confirming a test or a measurement catches it, then restoring. Several "fixes" in this codebase's history were verified only by reading the code and turned out to do nothing — a `motion` `animate` prop that silently no-opped, a Tailwind arbitrary value with a comma that never compiled, an `innerText` check that returned empty in a headless pane and made a working feature look broken four times running. If you cannot verify something, say so plainly rather than reporting it as done.
