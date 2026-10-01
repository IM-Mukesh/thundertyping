# HeroTyping — Complete Backend Architecture & Implementation Handoff

> **Canonical Backend Reference & Knowledge Base**  
> **Repository:** [IM-Mukesh/thundertyping](https://github.com/IM-Mukesh/thundertyping)  
> **Production URL:** [https://herotyping.com/](https://herotyping.com/)  
> **Target Audience:** Any AI coding assistant (Gemini, Claude, GPT, Cursor) or human engineer continuing backend development without conversational history.  
> **Last Verified Date:** 2026-09-28  
> **Quality Gate Status:** 315/315 Unit Tests Passing (70 Suites), 0 TypeScript Errors, 0 Lint Errors, 161 Static Pages Prerendered.

---

## Table of Contents

1. [Executive Summary](#section-1--executive-summary)
2. [Current Backend Status](#section-2--current-backend-status)
3. [Architecture Diagram](#section-3--architecture-diagram)
4. [Directory Map](#section-4--directory-map)
5. [Supabase Client Types](#section-5--supabase-client-types)
6. [Authentication Architecture](#section-6--authentication-architecture)
7. [Session Management](#section-7--session-management)
8. [Google OAuth Configuration](#section-8--google-oauth-configuration)
9. [Email Authentication](#section-9--email-authentication)
10. [Logout Architecture](#section-10--logout-architecture)
11. [Database Schema](#section-11--database-schema)
12. [Database Table Details](#section-12--database-table-details)
13. [Database Relationships](#section-13--database-relationships)
14. [User Provisioning Trigger](#section-14--user-provisioning-trigger)
15. [Row Level Security (RLS)](#section-15--row-level-security-rls)
16. [Server-Side Write Security](#section-16--server-side-write-security)
17. [API Routes Contract](#section-17--api-routes-contract)
18. [Input Validation Engine](#section-18--input-validation-engine)
19. [Guest Mode Architecture](#section-19--guest-mode-architecture)
20. [Guest to Account Migration](#section-20--guest-to-account-migration)
21. [Data Persistence Matrix](#section-21--data-persistence-matrix)
22. [Performance & Storage Strategy](#section-22--performance--storage-strategy)
23. [Environment Variables](#section-23--environment-variables)
24. [Local Development Setup](#section-24--local-development-setup)
25. [Vercel Deployment Guide](#section-25--vercel-deployment-guide)
26. [Testing Suite](#section-26--testing-suite)
27. [Manual QA Verification Matrix](#section-27--manual-qa-verification-matrix)
28. [Current Known Issues](#section-28--current-known-issues)
29. [Current System Limitations](#section-29--current-system-limitations)
30. [Security Rules for Future AI Agents](#section-30--security-rules-for-future-ai-agents)
31. [Backend Change Rules](#section-31--backend-change-rules)
32. [Database Migration Policy](#section-32--database-migration-policy)
33. [How to Add a New User Data Feature](#section-33--how-to-add-a-new-user-data-feature)
34. [How to Debug Auth & Backend](#section-34--how-to-debug-auth--backend)
35. [Chronological Change History](#section-35--chronological-change-history)
36. [Recommended Next Steps](#section-36--recommended-next-steps)
37. [AI Agent Startup Checklist](#section-37--ai-agent-startup-checklist)
38. [Fact vs. Assumption Matrix](#section-38--fact-vs-assumption-matrix)

---

## Section 1 — Executive Summary

HeroTyping is an open-access, zero-friction speed typing platform, arcade gaming suite, and touch-typing academy. The application operates on a modern serverless architecture pairing **Next.js 16 (App Router + React 19)** on **Vercel** with managed **Supabase (Auth + PostgreSQL + Row Level Security)**.

**Explicit Architectural Invariant:**  
There is **NO standalone Express, Fastify, NestJS, Docker container, or persistent Node.js server**. All backend logic executes strictly within serverless Next.js Route Handlers (`src/app/api/**`) on Vercel. Supabase acts exclusively as a managed authentication authority (GoTrue) and PostgreSQL database. Security is enforced through a dual barrier: PostgreSQL Row Level Security (RLS) protects client reads, while server-side Vercel Route Handlers validate incoming payloads and perform trusted writes using a privileged administrative client (`SUPABASE_SECRET_KEY`). Guest users require zero network calls, running completely on local browser storage until they explicitly authenticate.

---

## Section 2 — Current Backend Status

The table below reflects the exact factual state of all backend subsystems based on codebase inspection and verified test execution as of 2026-09-28:

| Subsystem | Status | Description & Verification Evidence |
| :--- | :--- | :--- |
| **Backend Foundation** | **IMPLEMENTED & VERIFIED** | All 10 Route Handlers, server utilities, validation schemas, and error envelopes implemented and verified by 315 passing automated tests. |
| **Database Migration File** | **IMPLEMENTED** | Schema authored in `supabase/migrations/20260928000000_initial_schema.sql` covering 9 tables, 6 composite indexes, automated provisioning trigger, and hardened RLS. |
| **Live Database Deployment** | **DEPLOYED & VERIFIED** | Confirmed live on 2026-09-28: direct REST calls to all 9 tables (`profiles`, `user_preferences`, `player_streaks`, `lesson_progress`, `lesson_attempts`, `typing_results`, `game_scores`, `daily_stats`, `achievements`) against the production Supabase project return HTTP 200, proving the schema in the migration file is already applied — this is not a pending step. |
| **Row Level Security Model** | **IMPLEMENTED & VERIFIED** | Hardened model applied in migration. Authenticated clients have `SELECT` only on private tables (`DELETE` only on `typing_results`). All inserts/updates routed through server. Verified 2026-09-28 by direct unauthenticated-write attempts (publishable key, forged `user_id`) against all 9 tables — every attempt was rejected with HTTP 401 and Postgres error `42501` ("new row violates row-level security policy"). |
| **Google OAuth Code Path** | **IMPLEMENTED** | Implemented via `signInWithOAuth`, PKCE code exchange in `/api/auth/callback`, and explicit cookie persistence on redirect. |
| **Google OAuth Cloud Config** | **REQUIRES CONFIGURATION** | Requires authorized redirect URI `https://humzucvcxyapcxkrmutj.supabase.co/auth/v1/callback` in Google Cloud Console and Google credentials in Supabase Dashboard. |
| **Email Authentication (Magic Link)** | **HIDDEN FROM UI** | `/api/auth/otp` sends a magic-link email (Supabase's configured template never includes a usable 6-digit code, so the old code-entry step and `/api/auth/verify` were removed 2026-10-01). Backend intact but the sign-in button is hidden until a dedicated SMTP provider replaces Supabase's shared dev SMTP, which project-wide rate-limits almost immediately under real traffic. |
| **Session Refresh & Persistence** | **IMPLEMENTED & VERIFIED** | Next.js 16 request proxy (`src/proxy.ts` -> `src/lib/supabase/proxy.ts`) refreshes JWT tokens seamlessly via cookies. |
| **Browser Sandbox Isolation** | **IMPLEMENTED & VERIFIED** | Direct browser cross-origin calls to GoTrue replaced with same-origin server routes to eliminate `TypeError: Failed to fetch` in iframe/extension environments. |
| **Logout Architecture** | **IMPLEMENTED & VERIFIED** | Complete cookie purge via `POST /api/auth/signout` and GoTrue session revocation in `auth-context.tsx`. |
| **Guest Mode & Persistence** | **IMPLEMENTED & VERIFIED** | Full offline/guest capability maintained across all 10 games, 28 curriculum units, and typing test modes. |
| **Guest Data Migration** | **REMOVED 2026-10-01** | Deliberately removed, not a gap — see Section 20. Had a real cross-account data leak bug on shared browsers. Signed-in players are now cloud-only and guests local-only, with no merge between them ever. |
| **Vercel Build Readiness** | **IMPLEMENTED & VERIFIED** | `npm run build` generates 161 static and dynamic pages with 0 warnings or typecheck failures. |

---

## Section 3 — Architecture Diagram

### End-to-End System Overview

```
                      +------------------------------------------+
                      |         User Browser / Client            |
                      |   (React 19 Client Components / SPA)     |
                      +--------------------+---------------------+
                                           |
                   +-----------------------+-----------------------+
                   | (Unauthenticated)                             | (Authenticated)
                   v                                               v
         +-------------------+                          +--------------------+
         |   localStorage    |                          |  Next.js 16 Proxy  |
         | (Guest Profiles,  |                          |   (src/proxy.ts)   |
         |  Scores, Units,   |                          +---------+----------+
         |  Settings, PBs)   |                                    |
         +-------------------+                                    | Session Refresh
                                                                  v
                                                        +--------------------+
                                                        |  Vercel Serverless |
                                                        |   Route Handlers   |
                                                        | (src/app/api/**)   |
                                                        +---------+----------+
                                                                  |
                                      +---------------------------+---------------------------+
                                      | 1. requireAuthUser()                                  | 3. createAdminClient()
                                      |    (Validates cookie JWT)                             |    (Privileged write)
                                      v                                                       v
                         +-------------------------+                             +-------------------------+
                         |  Supabase Auth (GoTrue)  |                             |   Supabase PostgreSQL   |
                         |  - Validates session    |                             |   - 9 Schema Tables     |
                         |  - Derives auth.uid()   |                             |   - Hardened RLS        |
                         +-------------------------+                             |   - Trigger Automation  |
                                                                                 +-------------------------+
```

### Guest vs. Authenticated Operation

```
+---------------------------------------------------------------------------------------------------+
| GUEST OPERATION (Default Zero-Friction)                                                            |
| Browser Action -> Local Storage Read/Write -> UI Updates Instantly (Zero Network Overhead)        |
+---------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------+
| AUTHENTICATED MUTATION FLOW (Server-Verified & Tamper-Proof)                                      |
| Browser Action -> POST /api/... (Cookie Attached) -> requireAuthUser() -> validation.ts           |
|                -> createAdminClient() (SUPABASE_SECRET_KEY) -> PostgreSQL Database               |
+---------------------------------------------------------------------------------------------------+
```

---

## Section 4 — Directory Map

Every backend, auth, and data-related file in HeroTyping:

| File Path | Environment | Purpose & Responsibility |
| :--- | :--- | :--- |
| `src/proxy.ts` | Server | Next.js 16 Request Proxy entrypoint. Replaces legacy `middleware.ts`. Intercepts incoming non-static requests and refreshes auth tokens. |
| `src/lib/supabase/proxy.ts` | Server | Helper invoked by `src/proxy.ts`. Reads request cookies, invokes `@supabase/ssr` `createServerClient`, and sets refreshed cookies on response. Exits early if no auth cookies exist. |
| `src/lib/supabase/client.ts` | Client | Browser Supabase client instantiated with `createBrowserClient`. Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Bound by RLS. |
| `src/lib/supabase/server.ts` | Server | SSR Supabase client instantiated with `createServerClient`. Reads cookies via `next/headers`. Used to verify incoming sessions with `supabase.auth.getUser()`. |
| `src/lib/supabase/admin.ts` | Server-Only | Privileged Supabase client instantiated with `createClient`. Uses `SUPABASE_SECRET_KEY`. Bypasses RLS for validated server-side writes. **NEVER import into Client Components.** |
| `src/lib/supabase/database.types.ts` | Shared | TypeScript type definitions for all 9 database tables, columns, relationships, and trigger functions. |
| `src/lib/auth/auth-context.tsx` | Client | React `AuthProvider` and `useAuth` hook. Manages client session lifecycle, user state, profile sync, and exposes `signInWithGoogle`, `signInWithOtp`, and `signOut`. Also primes/clears every `primeCloud*`/`clearCloud*` in-memory cache on sign-in/out (game bests, lesson progress, typing bests, XP, achievements). |
| `src/lib/auth/current-user.ts` | Client | Tiny non-React mirror of the signed-in user id, kept in sync by `AuthProvider`. Lets plain modules (not components) branch local-vs-cloud without a hook. |
| `src/lib/auth/guest-sync.ts` | **Removed** | Was the guest→account migration harvester. Moved to `.removed-backup/` 2026-10-01 — see Section 20. |
| `src/lib/server/auth.ts` | Server-Only | Server identity helpers: `getAuthenticatedUser()` and `requireAuthUser()`. Extracts and validates `auth.uid()` without trusting client payloads. |
| `src/lib/server/errors.ts` | Server-Only | Standard API response envelopes: `apiSuccess(data, status)` and `apiError(code, message, status, details)`. |
| `src/lib/server/validation.ts` | Server-Only | Strict mathematical and structural boundary validation engine for typing results, lessons, game runs, profiles, and preferences. |
| `src/lib/server/profiles.ts` | Server-Only | Server data access for `profiles` and `user_preferences`. Implements self-healing default row creation and profile updates. |
| `src/lib/server/typing-results.ts` | Server-Only | Saves typing test runs to `typing_results`, updates daily rolling stats in `daily_stats`, and increments player streak and XP in `player_streaks`. |
| `src/lib/server/lesson-progress.ts` | Server-Only | Records individual attempts in `lesson_attempts` and upserts best unit performance in `lesson_progress`. |
| `src/lib/server/game-scores.ts` | Server-Only | Records arcade game runs in `game_scores`, computes personal best flags, and updates daily games played in `daily_stats`. |
| `src/lib/server/progress.ts` | Server-Only | `awardCloudXp()` (atomic, race-safe increment on `player_streaks.total_xp`) and `getCloudAchievements()`/`grantCloudAchievement()` (backed by the `achievements` table). Added 2026-10-01. |
| `src/lib/server/migration.ts` | **Removed** | Was the server-side guest-data merger. Moved to `.removed-backup/` 2026-10-01 — see Section 20. |
| `src/lib/server/backend.test.ts` | Node Test | Automated unit tests covering validation constraints, error envelopes, and privileged admin client isolation rules. |
| `src/app/api/auth/callback/route.ts` | Server-Only | OAuth PKCE code exchange handler. Writes auth cookies directly to the redirect response and validates target redirect URLs. |
| `src/app/api/auth/otp/route.ts` | Server-Only | Dispatches a magic-link sign-in email through the server to avoid browser cross-origin fetch failures. |
| `src/app/api/auth/verify/route.ts` | **Removed** | Was the 6-digit code verifier; removed 2026-10-01 since Supabase's email template never actually included a code. |
| `src/app/api/auth/signout/route.ts` | Server-Only | Deletes all `sb-*` auth cookies from the browser and revokes the GoTrue session. Supports POST and GET. |
| `src/app/api/profile/route.ts` | Server-Only | `GET` fetches user profile, preferences, and streak. `PATCH` validates and updates display name and unique username. |
| `src/app/api/profile/preferences/route.ts` | Server-Only | `GET` fetches user settings. `PUT` validates and upserts typing preferences (theme, audio, layout, caret, etc.). |
| `src/app/api/profile/xp/route.ts` | Server-Only | `POST` awards cloud XP for a signed-in player. Added 2026-10-01. |
| `src/app/api/profile/achievements/route.ts` | Server-Only | `GET` lists earned achievement ids. `POST` grants one (idempotent). Added 2026-10-01. |
| `src/app/api/typing-results/route.ts` | Server-Only | `GET` fetches historical test runs. `POST` validates and saves completed typing test runs. Now actually called by the client for signed-in players (previously built but unused — see Section 20). |
| `src/app/api/lessons/progress/route.ts` | Server-Only | `GET` fetches unit completion records. `POST` validates and records lesson attempts and aggregate progress. Now actually called by the client for signed-in players. |
| `src/app/api/games/scores/route.ts` | Server-Only | `GET` fetches personal bests across all games. `POST` validates and saves game runs. Now actually called by the client for signed-in players. |
| `src/app/api/sync/migrate/route.ts` | **Removed** | Was the guest-data migration endpoint. Moved to `.removed-backup/` 2026-10-01 — see Section 20. |
| `src/app/auth/login/page.tsx` | Client | Google OAuth button plus a single-step magic-link email form (no code-entry step — see Section 20's sibling note above on OTP). |
| `src/components/auth/user-account-menu.tsx` | Client | Desktop header and mobile navigation user avatar, email badge, sync indicator, and sign-out action menu. |
| `src/components/profile/profile-client.tsx` | Client | User profile dashboard showing account cloud status, level progression, achievements, and inline name/username editing. |
| `supabase/migrations/20260928000000_initial_schema.sql` | SQL | The authoritative schema migration defining all 9 tables, indexes, provisioning trigger, and hardened RLS policies. |

---

## Section 5 — Supabase Client Types

HeroTyping isolates client access into three distinct layers to ensure security and prevent privilege escalation:

```
+---------------------------------------------------------------------------------------------+
| 1. BROWSER CLIENT (createBrowserClient)                                                     |
| - File: src/lib/supabase/client.ts                                                          |
| - Package: @supabase/ssr                                                                    |
| - Keys: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY                      |
| - Scope: Client Components ONLY ("use client").                                             |
| - Auth Context: Reads browser cookies; carries authenticated user JWT.                      |
| - RLS Status: STRICTLY ENFORCED. Can only SELECT user-owned rows. Cannot write.              |
+---------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------+
| 2. SSR / SERVER CLIENT (createServerClient)                                                 |
| - File: src/lib/supabase/server.ts                                                          |
| - Package: @supabase/ssr                                                                    |
| - Keys: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY                      |
| - Scope: Server Components, Server Actions, Route Handlers, src/proxy.ts                    |
| - Auth Context: Reads request cookies via next/headers. Carries user session.               |
| - Primary Responsibility: requireAuthUser() / supabase.auth.getUser() verification.         |
| - RLS Status: STRICTLY ENFORCED. Bound to auth.uid() of incoming cookie session.             |
+---------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------+
| 3. PRIVILEGED / ADMIN CLIENT (createAdminClient)                                            |
| - File: src/lib/supabase/admin.ts                                                           |
| - Package: @supabase/supabase-js                                                            |
| - Keys: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY (Fallback: SUPABASE_SERVICE_ROLE_KEY)   |
| - Scope: STRICTLY SERVER-ONLY. Used exclusively in Vercel server data services.             |
| - Auth Context: persistSession: false, autoRefreshToken: false. No cookie attachment.       |
| - Forbidden Import: MUST NEVER BE IMPORTED INTO CLIENT COMPONENTS OR BROWSER BUNDLES.        |
| - RLS Status: BYPASSES RLS. Executes trusted, pre-validated writes on behalf of auth.uid(). |
+---------------------------------------------------------------------------------------------+
```

### Key Differences: Publishable Key vs. Secret Key

1. **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...` or legacy `anon` key):**  
   - Safe to expose in HTML source, client bundles, and network requests.  
   - Grants **zero write privileges** against HeroTyping private tables.  
   - Any attempt to insert or update rows using this key is rejected by PostgreSQL RLS.
2. **`SUPABASE_SECRET_KEY` (`sb_secret_...` or legacy `service_role` key):**  
   - **Superuser key** that completely bypasses Row Level Security.  
   - Must **NEVER** be prefixed with `NEXT_PUBLIC_`.  
   - Must **NEVER** be referenced in client code. If leaked, an attacker could wipe or manipulate all user data.

---

## Section 6 — Authentication Architecture

All HeroTyping user accounts are anchored to Supabase Auth's canonical UUID (`auth.users.id`). This ID serves as the single foreign key for all user-owned rows in PostgreSQL.

### 1. Google OAuth Flow (PKCE)

```
[User clicks 'Sign in with Google']
               |
               v
   src/app/auth/login/page.tsx
               |
               v (calls signInWithGoogle in auth-context.tsx)
   supabase.auth.signInWithOAuth({
     provider: "google",
     options: { redirectTo: "https://herotyping.com/api/auth/callback?next=/profile" }
   })
               |
               v
   Supabase GoTrue (/auth/v1/authorize)
               |
               v
   Google Accounts Consent Screen (User approves)
               |
               v
   Supabase Callback Handler (/auth/v1/callback)
               |
               v (Redirects to HeroTyping with authorization code)
   GET /api/auth/callback?code=abc123xyz&next=/profile
               |
               +---> Validate next parameter (prevent open redirects)
               +---> supabase.auth.exchangeCodeForSession(code)
               +---> Write 'sb-*-auth-token' directly to redirectResponse.cookies
               |
               v
   HTTP 307 Redirect to /profile (with session cookies attached)
               |
               v
   Profile Page loads -> AuthProvider calls /api/profile -> User is Authenticated
```

### 2. Email OTP Flow (Passwordless)

Direct browser-to-Supabase calls for OTP can fail in restricted environments (e.g., browser extensions, embedded frames) due to CORS or `TypeError: Failed to fetch`. HeroTyping routes all OTP traffic through same-origin Next.js Route Handlers:

```
[User enters email and clicks 'Send Code']
               |
               v
   POST /api/auth/otp { email: "user@example.com", redirectTo: "..." }
               |
               v (Server invokes createClient() -> supabase.auth.signInWithOtp)
   Supabase sends 6-digit code + magic link to user inbox
               |
               v
   Client displays 6-digit OTP input box
               |
[User enters 6-digit code and submits]
               |
               v
   POST /api/auth/verify { email: "user@example.com", token: "123456" }
               |
               v (Server invokes createServerClient() -> supabase.auth.verifyOtp)
   Supabase validates token and generates user session
               |
               +---> Attaches session cookies to JSON response
               |
               v
   HTTP 200 OK -> Client calls refreshProfile() -> Session active immediately
```

---

## Section 7 — Session Management

### Session Refresh with Next.js 16 Request Proxy

Next.js 16 deprecated `middleware.ts` in favor of the request proxy model (`src/proxy.ts`). 

1. **Proxy Execution (`src/proxy.ts`):**  
   Every incoming request (excluding static assets, images, and fonts) passes through `proxy(request)`.
2. **Guest Optimization (`src/lib/supabase/proxy.ts`):**  
   The proxy checks `request.cookies.getAll()` for any cookie beginning with `sb-`. If no auth cookies are found, it immediately returns `NextResponse.next()` without making any remote Supabase network calls.
3. **Session Refresh:**  
   If auth cookies exist, the proxy initializes `@supabase/ssr` `createServerClient` and calls `supabase.auth.getUser()`. If the session access token has expired, Supabase automatically issues a refreshed token, which the proxy commits back to the browser via response cookies.
4. **Lifecycle Events in `auth-context.tsx`:**  
   - `INITIAL_SESSION`: Verifies user with server.
   - `SIGNED_IN`: Updates state and triggers background guest migration.
   - `SIGNED_OUT`: Nullifies all client authentication state.
   - `TOKEN_REFRESHED`: Kept in sync automatically by `@supabase/ssr`.

### Persistence Behavior

- **Page Refresh:** Session cookies are read by the server proxy and `/api/profile`. The user remains logged in without flickering.
- **Browser Restart:** Persistent `HttpOnly` cookies survive browser restarts until the refresh token expires or is explicitly revoked.
- **Token Expiry:** The proxy silently refreshes expired access tokens in the background on every page navigation.

---

## Section 8 — Google OAuth Configuration

The exact external configuration parameters required for Google Sign-In:

### 1. Google Cloud Console ([console.cloud.google.com](https://console.cloud.google.com/))
- **Application Type:** Web application
- **Name:** HeroTyping Auth
- **Authorized JavaScript Origins:**
  - `http://localhost:3000` (Local development)
  - `https://herotyping.com` (Production)
- **Authorized Redirect URI:**  
  `https://humzucvcxyapcxkrmutj.supabase.co/auth/v1/callback`

### 2. Supabase Dashboard ([supabase.com/dashboard](https://supabase.com/dashboard))
- **URL Configuration (Authentication > URL Configuration):**
  - **Site URL:** `https://herotyping.com` (or `http://localhost:3000` for local dev)
  - **Redirect URLs:**
    - `http://localhost:3000/api/auth/callback`
    - `https://herotyping.com/api/auth/callback`
- **Google Provider (Authentication > Providers > Google):**
  - **Enable Google provider:** ON
  - **Client ID:** Configured from Google Cloud Console
  - **Client Secret:** Configured from Google Cloud Console *(NEVER store in source code)*

---

## Section 9 — Email Authentication

- **Mechanism:** Passwordless 6-digit OTP code + magic link via `signInWithOtp` and `verifyOtp`.
- **Default Delivery:** Handled by Supabase's built-in mailer. Rate-limited to approximately 3–4 emails per hour on free tiers.
- **Production Recommendation:** For production volume at `herotyping.com`, configure a dedicated custom SMTP provider (Resend, SendGrid, Amazon SES, or Postmark) in **Supabase Dashboard > Project Settings > Authentication > SMTP Settings**.

---

## Section 10 — Logout Architecture

Logout requires invalidating state across both server cookies and client memory:

```
[User clicks 'Sign Out' in Header or Mobile Drawer]
                    |
                    v
         useAuth().signOut()
                    |
                    +------------------------------------+
                    |                                    |
                    v (Step 1: Server Purge)             v (Step 2: Client Revocation)
          POST /api/auth/signout               supabase.auth.signOut()
                    |                                    |
                    +---> supabase.auth.signOut()        +---> Clears in-memory tokens
                    +---> Deletes all 'sb-*' cookies     |
                    |                                    |
                    +-----------------+------------------+
                                      |
                                      v
                    AuthContext State Reset:
                    - user = null
                    - profile = null
                    - preferences = null
                    - streak = null
                                      |
                                      v
                    UI updates instantly to Guest state
                    (Refresh confirms cookies are deleted)
```

---

## Section 11 — Database Schema

The production schema is defined in `supabase/migrations/20260928000000_initial_schema.sql`. It contains **9 tables**, all located in the `public` schema and anchored to `auth.users(id)`:

```
====================================================================================================
TABLE: profiles
PURPOSE: Publicly visible user identity and avatar metadata.
PRIMARY KEY: id UUID REFERENCES auth.users(id) ON DELETE CASCADE
COLUMNS:
  - id UUID (PK, FK)
  - username TEXT UNIQUE (Nullable, 3-24 alphanumeric chars)
  - display_name TEXT (Nullable, max 50 chars)
  - avatar_url TEXT (Nullable)
  - created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
  - updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
RLS: ENABLED (SELECT own only; all writes via server/trigger)
====================================================================================================

====================================================================================================
TABLE: user_preferences
PURPOSE: User typing engine, audio, theme, and viewport settings.
PRIMARY KEY: user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
COLUMNS:
  - user_id UUID (PK, FK)
  - theme TEXT DEFAULT 'dark' NOT NULL
  - sound_enabled BOOLEAN DEFAULT true NOT NULL
  - sound_volume NUMERIC DEFAULT 0.5 NOT NULL
  - keyboard_layout TEXT DEFAULT 'qwerty' NOT NULL
  - confidence_mode TEXT DEFAULT 'off' NOT NULL
  - quick_restart TEXT DEFAULT 'off' NOT NULL
  - smooth_caret TEXT DEFAULT 'medium' NOT NULL
  - font_size TEXT DEFAULT 'medium' NOT NULL
  - font_family TEXT DEFAULT 'mono' NOT NULL
  - default_test_mode TEXT DEFAULT 'time' NOT NULL
  - default_test_duration INTEGER DEFAULT 30 NOT NULL
  - punctuation BOOLEAN DEFAULT false NOT NULL
  - numbers BOOLEAN DEFAULT false NOT NULL
  - updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
RLS: ENABLED (SELECT own only; mutations via server API)
====================================================================================================

====================================================================================================
TABLE: player_streaks
PURPOSE: Player progression aggregate: daily streaks and cumulative XP.
PRIMARY KEY: user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
COLUMNS:
  - user_id UUID (PK, FK)
  - current_streak INTEGER DEFAULT 0 NOT NULL
  - longest_streak INTEGER DEFAULT 0 NOT NULL
  - last_active_date DATE (Nullable)
  - total_xp INTEGER DEFAULT 0 NOT NULL
  - updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
RLS: ENABLED (SELECT own only; mutations via server API)
====================================================================================================

====================================================================================================
TABLE: lesson_progress
PURPOSE: Aggregate personal best for each curriculum lesson unit.
PRIMARY KEY: id UUID DEFAULT gen_random_uuid()
FOREIGN KEY: user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
CONSTRAINTS: CONSTRAINT unique_user_lesson UNIQUE(user_id, lesson_id)
COLUMNS:
  - id UUID (PK)
  - user_id UUID (FK, NOT NULL)
  - lesson_id TEXT NOT NULL
  - completed BOOLEAN DEFAULT false NOT NULL
  - stars INTEGER DEFAULT 0 NOT NULL (0 to 5)
  - best_wpm NUMERIC DEFAULT 0 NOT NULL
  - best_accuracy NUMERIC DEFAULT 0 NOT NULL
  - attempt_count INTEGER DEFAULT 0 NOT NULL
  - updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
INDEXES: idx_lesson_progress_user ON (user_id, lesson_id)
RLS: ENABLED (SELECT own only; mutations via server API)
====================================================================================================

====================================================================================================
TABLE: lesson_attempts
PURPOSE: Granular historical attempt log for touch-typing lesson runs.
PRIMARY KEY: id UUID DEFAULT gen_random_uuid()
FOREIGN KEY: user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
COLUMNS:
  - id UUID (PK)
  - user_id UUID (FK, NOT NULL)
  - lesson_id TEXT NOT NULL
  - wpm NUMERIC NOT NULL
  - accuracy NUMERIC NOT NULL
  - stars INTEGER DEFAULT 0 NOT NULL
  - created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
INDEXES: idx_lesson_attempts_user_created ON (user_id, created_at DESC)
RLS: ENABLED (SELECT own only; mutations via server API)
====================================================================================================

====================================================================================================
TABLE: typing_results
PURPOSE: History of completed speed typing test runs.
PRIMARY KEY: id UUID DEFAULT gen_random_uuid()
FOREIGN KEY: user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
COLUMNS:
  - id UUID (PK)
  - user_id UUID (FK, NOT NULL)
  - mode TEXT NOT NULL ('time', 'words', 'quote', 'custom', 'vocabulary')
  - duration NUMERIC NOT NULL (seconds)
  - wpm NUMERIC NOT NULL
  - raw_wpm NUMERIC (Nullable)
  - accuracy NUMERIC NOT NULL
  - consistency NUMERIC (Nullable)
  - correct_chars INTEGER NOT NULL
  - incorrect_chars INTEGER NOT NULL
  - extra_chars INTEGER DEFAULT 0
  - missed_chars INTEGER DEFAULT 0
  - param TEXT (Nullable)
  - punctuation BOOLEAN DEFAULT false
  - numbers BOOLEAN DEFAULT false
  - created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
INDEXES: idx_typing_results_user_created ON (user_id, created_at DESC)
RLS: ENABLED (SELECT own only; DELETE own allowed; INSERT/UPDATE via server API)
====================================================================================================

====================================================================================================
TABLE: game_scores
PURPOSE: Arcade game runs, high scores, levels, and survival metadata.
PRIMARY KEY: id UUID DEFAULT gen_random_uuid()
FOREIGN KEY: user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
COLUMNS:
  - id UUID (PK)
  - user_id UUID (FK, NOT NULL)
  - game_id TEXT NOT NULL
  - score INTEGER NOT NULL
  - cleared INTEGER DEFAULT 0
  - best_combo INTEGER DEFAULT 0
  - survived_ms INTEGER DEFAULT 0
  - wpm NUMERIC (Nullable)
  - accuracy NUMERIC (Nullable)
  - created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
INDEXES: idx_game_scores_user_game ON (user_id, game_id, score DESC)
RLS: ENABLED (SELECT own only; mutations via server API)
====================================================================================================

====================================================================================================
TABLE: daily_stats
PURPOSE: Pre-aggregated daily activity summary per user for performant profile rendering.
PRIMARY KEY: id UUID DEFAULT gen_random_uuid()
FOREIGN KEY: user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
CONSTRAINTS: CONSTRAINT unique_user_daily_date UNIQUE(user_id, date)
COLUMNS:
  - id UUID (PK)
  - user_id UUID (FK, NOT NULL)
  - date DATE NOT NULL
  - tests_completed INTEGER DEFAULT 0 NOT NULL
  - games_played INTEGER DEFAULT 0 NOT NULL
  - lessons_completed INTEGER DEFAULT 0 NOT NULL
  - practice_minutes NUMERIC DEFAULT 0 NOT NULL
  - average_wpm NUMERIC DEFAULT 0
  - best_wpm NUMERIC DEFAULT 0
  - average_accuracy NUMERIC DEFAULT 0
  - updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
INDEXES: idx_daily_stats_user_date ON (user_id, date DESC)
RLS: ENABLED (SELECT own only; mutations via server API)
====================================================================================================

====================================================================================================
TABLE: achievements
PURPOSE: Badges and milestones unlocked by the player.
PRIMARY KEY: id UUID DEFAULT gen_random_uuid()
FOREIGN KEY: user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
CONSTRAINTS: CONSTRAINT unique_user_achievement UNIQUE(user_id, achievement_id)
COLUMNS:
  - id UUID (PK)
  - user_id UUID (FK, NOT NULL)
  - achievement_id TEXT NOT NULL
  - unlocked_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
INDEXES: idx_achievements_user ON (user_id)
RLS: ENABLED (SELECT own only; mutations via server API)
====================================================================================================
```

---

## Section 12 — Database Table Details

1. **`profiles`:** Represents the user's primary public persona. Generated automatically on auth signup. Stores username, display name, and avatar.
2. **`user_preferences`:** Stores 13 customizable user settings, guaranteeing synchronized typing preferences across any device after login.
3. **`player_streaks`:** Tracks overall user XP, daily streaks, and last active date. Used to render level badges and streak counters.
4. **`lesson_progress`:** Contains one row per completed or attempted curriculum lesson unit per user. Holds best stars, best WPM, and best accuracy.
5. **`lesson_attempts`:** Append-only log recording every individual lesson attempt for motor progression analytics.
6. **`typing_results`:** Historical record of every standard typing test completed, including keystroke accuracy totals and duration.
7. **`game_scores`:** Arcade run log storing high scores, combo streaks, and survival durations for all 10 arcade games.
8. **`daily_stats`:** Aggregates activity per calendar day. Prevents expensive table-scanning aggregations when rendering dashboard stats.
9. **`achievements`:** Tracks unlocked achievements (e.g., speed milestones, accuracy streaks, curriculum badges).

---

## Section 13 — Database Relationships

All 9 user-state tables link to Supabase Auth's `auth.users` via foreign keys with `ON DELETE CASCADE`. If a user deletes their account in Supabase, all associated records are purged automatically.

```
                           +------------------------+
                           |       auth.users       |
                           |   (Supabase Managed)   |
                           +-----------+------------+
                                       |
         +-----------------------------+-----------------------------+
         | 1:1                         | 1:1                         | 1:1
         v                             v                             v
  +--------------+             +------------------+           +---------------+
  |   profiles   |             | user_preferences |           | player_streaks|
  +--------------+             +------------------+           +---------------+
         |                             |                             |
         +-----------------------------+-----------------------------+
                                       |
         +-----------------------------+-----------------------------+
         | 1:N                         | 1:N                         | 1:N
         v                             v                             v
  +-----------------+           +-----------------+           +----------------+
  | lesson_progress |           | lesson_attempts |           | typing_results |
  +-----------------+           +-----------------+           +----------------+
         |                             |                             |
         +-----------------------------+-----------------------------+
                                       |
         +-----------------------------+-----------------------------+
         | 1:N                         | 1:N                         | 1:N
         v                             v                             v
  +-----------------+           +-----------------+           +----------------+
  |   game_scores   |           |   daily_stats   |           |  achievements  |
  +-----------------+           +-----------------+           +----------------+
```

---

## Section 14 — User Provisioning Trigger

Whenever a user is created in `auth.users` (via Google OAuth or Email OTP), PostgreSQL executes the `on_auth_user_created` trigger.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- 1. Create Default Profile
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Hero Typist'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL)
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Create Default Preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Create Default Streaks Row
  INSERT INTO public.player_streaks (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Critical Security Aspects:
1. **`SECURITY DEFINER`**: Runs with superuser rights to initialize private tables even before client permissions are established.
2. **`SET search_path = ''`**: Prevents `search_path` hijacking attacks by forcing all table references to be explicitly schema-qualified (`public.profiles`, `public.user_preferences`, `public.player_streaks`).
3. **`ON CONFLICT DO NOTHING`**: Ensures idempotency. If a row already exists, the trigger finishes cleanly without throwing errors.

---

## Section 15 — Row Level Security (RLS)

### The Hardened Security Model

> [!IMPORTANT]
> **Discrepancy with legacy `docs/backend.md`:**  
> Stale documentation in `docs/backend.md` previously claimed tables allowed direct client writes (`Read/Write owned row only`). This was identified as a security risk and hardened. The code in `supabase/migrations/20260928000000_initial_schema.sql` is the single source of truth.

To prevent malicious browser scripts from modifying scores, stars, or XP, **authenticated browser clients have `SELECT` only permissions** on private tables. All write mutations must flow through Vercel Route Handlers.

| Table | RLS Active | Client SELECT Policy | Client INSERT | Client UPDATE | Client DELETE |
| :--- | :---: | :--- | :---: | :---: | :---: |
| `profiles` | YES | `auth.uid() = id` | BLOCKED | BLOCKED | BLOCKED |
| `user_preferences` | YES | `auth.uid() = user_id` | BLOCKED | BLOCKED | BLOCKED |
| `player_streaks` | YES | `auth.uid() = user_id` | BLOCKED | BLOCKED | BLOCKED |
| `lesson_progress` | YES | `auth.uid() = user_id` | BLOCKED | BLOCKED | BLOCKED |
| `lesson_attempts` | YES | `auth.uid() = user_id` | BLOCKED | BLOCKED | BLOCKED |
| `typing_results` | YES | `auth.uid() = user_id` | BLOCKED | BLOCKED | `auth.uid() = user_id` |
| `game_scores` | YES | `auth.uid() = user_id` | BLOCKED | BLOCKED | BLOCKED |
| `daily_stats` | YES | `auth.uid() = user_id` | BLOCKED | BLOCKED | BLOCKED |
| `achievements` | YES | `auth.uid() = user_id` | BLOCKED | BLOCKED | BLOCKED |

*Note: `typing_results` intentionally allows client `DELETE` so users can delete their own typing history.*

---

## Section 16 — Server-Side Write Security

Every write operation follows a strict, tamper-proof lifecycle:

```
[Browser sends Mutation Request]
               |
               v
     Next.js Route Handler
               |
               v
1. requireAuthUser() (src/lib/server/auth.ts)
   - Reads cookie session
   - Validates JWT with Supabase Auth
   - Throws 401 if missing or invalid
   - DERIVES verified userId = user.id
               |
               v
2. validation.ts (src/lib/server/validation.ts)
   - Validates JSON payload against strict limits (WPM <= 350, score <= 50,000,000, valid IDs)
   - Throws 400 if invalid
               |
               v
3. createAdminClient() (src/lib/supabase/admin.ts)
   - Uses SUPABASE_SECRET_KEY
   - Bypasses RLS to write pre-validated data
   - MUST bind user_id = verified userId (NEVER client-supplied ID)
               |
               v
[PostgreSQL Database Commits Write]
```

---

## Section 17 — API Routes Contract

All Route Handlers follow a unified JSON envelope defined in `src/lib/server/errors.ts`:
- **Success:** `{ success: true, data: T }` (HTTP 200/201)
- **Failure:** `{ success: false, error: { code: string, message: string, details?: unknown } }` (HTTP 400/401/409/500)

| Method & Route | Auth Req? | Input Payload | Validation Rules | Primary Server Service & Target Tables | Output Data |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `GET /api/profile` | YES | None | None | `getUserProfile()` -> `profiles`, `user_preferences`, `player_streaks` | Profile, preferences, streak objects |
| `PATCH /api/profile` | YES | `{ displayName?, username? }` | `validateProfileUpdateInput()`: username (3-24 alphanumeric/_), displayName (1-50 chars) | `updateUserProfile()` -> `profiles` | Updated profile record |
| `GET /api/profile/preferences` | YES | None | None | `getUserPreferences()` -> `user_preferences` | Preferences record |
| `PUT /api/profile/preferences` | YES | Preferences JSON | `validatePreferencesInput()`: theme, sound volume (0-1), layout, etc. | `updateUserPreferences()` -> `user_preferences` (upsert) | Updated preferences record |
| `GET /api/typing-results` | YES | Query: `?limit=50` | Limit capped between 1 and 100 | `getTypingResultsHistory()` -> `typing_results` | Array of typing result records |
| `POST /api/typing-results` | YES | Typing result JSON | `validateTypingResultInput()`: WPM (0-350), accuracy (0-100), duration (1-7200s), valid mode | `saveTypingResult()` -> `typing_results`, `daily_stats`, `player_streaks` | Created test record |
| `GET /api/lessons/progress` | YES | None | None | `getUserLessonProgress()` -> `lesson_progress` | Array of lesson progress records |
| `POST /api/lessons/progress` | YES | Lesson progress JSON | `validateLessonProgressInput()`: valid lessonId, stars (0-5), WPM (0-350), accuracy (0-100) | `saveLessonProgress()` -> `lesson_attempts`, `lesson_progress`, `daily_stats` | Created/updated progress record |
| `GET /api/games/scores` | YES | None | None | `getUserGameBests()` -> `game_scores` | Deduplicated personal bests per game |
| `POST /api/games/scores` | YES | Game score JSON | `validateGameScoreInput()`: valid gameId, score (0-50M), WPM, accuracy | `saveGameScore()` -> `game_scores`, `daily_stats` | `{ record, isNewBest }` |
| `POST /api/sync/migrate` | YES | Guest data payload | Full structure verification in `migration.ts` | `migrateGuestData()` -> All 9 tables | Summary of merged items |
| `GET /api/auth/callback` | NO | Query: `?code=...&next=...` | Relative local path validation on `next` | `supabase.auth.exchangeCodeForSession(code)` | Redirect to target path with session cookies |
| `POST /api/auth/otp` | NO | `{ email, redirectTo }` | Email format check (`@`) | `supabase.auth.signInWithOtp()` | `{ success: true }` |
| `POST /api/auth/verify` | NO | `{ email, token }` | Non-empty email and token | `supabase.auth.verifyOtp()` | Sets auth cookies on response |
| `POST /api/auth/signout` | NO | None | None | `supabase.auth.signOut()` + cookie purge | Clears all `sb-*` auth cookies |
| `GET /api/auth/signout` | NO | Query: `?redirect=...` | None | `supabase.auth.signOut()` + cookie purge | Redirects to `/auth/login` |

---

## Section 18 — Input Validation Engine

Implemented in `src/lib/server/validation.ts`. Any payload violating these constraints is rejected with HTTP 400 before reaching the database:

- **WPM:** Non-negative, max `350` WPM.
- **Raw WPM:** Nullable or non-negative, max `450` WPM.
- **Accuracy:** Non-negative, max `100.0`%.
- **Consistency:** Nullable or non-negative, max `100.0`%.
- **Test Duration:** Positive integer, max `7,200` seconds (2 hours).
- **Test Modes:** Strict set: `time`, `words`, `quote`, `custom`, `vocabulary`.
- **Lesson IDs:** Must match one of 28 registered units in `LESSON_LIST` (`src/lib/lessons/lesson-types.ts`).
- **Lesson Stars:** Integer between `0` and `5`.
- **Game IDs:** Must match one of 10 registered arcade games in `GAME_LIST` (`src/lib/games/game-types.ts`).
- **Game Scores:** Integer between `0` and `50,000,000`.
- **Username:** 3 to 24 characters matching `/^[a-zA-Z0-9_]{3,24}$/`. Stored in lowercase.
- **Display Name:** 1 to 50 characters (trimmed).
- **Sound Volume:** Number between `0.0` and `1.0`.
- **Quick Restart:** Strict set: `tab`, `esc`, `enter`, `off`.
- **Smooth Caret:** Strict set: `off`, `slow`, `medium`, `fast`.
- **Confidence Mode:** Strict set: `off`, `on`, `max`.
- **Font Size:** Strict set: `small`, `medium`, `large`, `xlarge`.

---

## Section 19 — Guest Mode Architecture

HeroTyping is completely functional without an account. Unauthenticated users experience zero login prompts, zero disabled features, and zero latency:

- **Typing Tests:** Unrestricted access to all modes (Time, Words, Quotes, Custom, Vocabulary).
- **Curriculum Lessons:** All 28 units, star ratings, and motor progression fully playable.
- **Arcade Games:** All 10 games fully playable with real-time sound effects and high score tracking.
- **Local Storage Footprint:**
  - `player-profile`: XP, level, unlocked badges, streaks.
  - `lesson-progress-store`: Unit completion state, attempts, best stars, WPM, and accuracy.
  - `game-best:${gameId}`: High scores and cleared word counters per arcade game.
  - `thundertyping-pb:*`: Personal best runs for typing configurations.
  - `sound-settings`: Volume and mute toggles.
  - `typing-theme`: Selected visual theme.

---

## Section 20 — No Guest → Account Migration (Removed 2026-10-01)

**There is no migration between guest and account data, by design.** An earlier version of this feature (`gatherAndMigrateGuestData` in `src/lib/auth/guest-sync.ts`, `POST /api/sync/migrate`) automatically merged a browser's local guest data into whichever account next signed in on that browser. It had a real bug: on a shared computer, the "already migrated" check only compared against the *new* signer's user id, not whose data was actually sitting in `localStorage` — so a second person signing in after a first could inherit the first person's (or a leftover guest session's) scores. That code has been moved to `.removed-backup/` (not deleted, in case any of it is useful again later) and is no longer called from anywhere.

**Current model — strict separation, never merged:**
- **Guest (not signed in):** every write (typing-test bests, game scores, lesson progress, XP, achievements) goes to `localStorage` only, exactly as in Section 19.
- **Signed in:** every write goes to the cloud only — `localStorage` is neither read from nor written to for that data. This is enforced per-concern, not by one central switch:
  - `src/lib/persistence/results-store.ts`, `src/lib/games/game-scores.ts`, `src/lib/lessons/lesson-progress-store.ts`, `src/lib/profile/player-profile.ts` each check `getCurrentUserId()` (`src/lib/auth/current-user.ts` — a small non-React module kept in sync by `AuthProvider`, since these are plain modules, not React components, and can't call `useAuth()`).
  - Signed in → POST to the relevant API route, with an in-memory read cache primed from the cloud on sign-in (`primeCloud*` functions) and dropped on sign-out (`clearCloud*` functions), so UI feedback (e.g. "new best!") stays instant without touching `localStorage`.
  - Guest → the exact same `localStorage` read/write path these modules always had.
- **Sign-out** restores the browser's own local guest data back into view (`restoreLocalLessonProgress()` calls zustand's `persist.rehydrate()`) rather than leaving the just-signed-out account's cloud data visible.
- **Still local-only for everyone** (not yet given a cloud home): unlocks and daily-challenge streak counters (`src/lib/profile/player-profile.ts`'s `grantUnlock`/`recordDaily`) — no database table exists for these yet; would need a new migration to close.

---

## Section 21 — Data Persistence Matrix

| Action / Lifecycle Event | Guest (Local-Only) | Signed In (Cloud-Only) |
| :--- | :--- | :--- |
| **Page Refresh** | Preserved in `localStorage`. | Re-fetched from the cloud via `/api/profile` + the `primeCloud*` calls; cookies refreshed by proxy. |
| **Tab / Window Navigation** | Preserved. | Preserved. |
| **Browser Restart** | Preserved in `localStorage`. | Preserved via persistent `HttpOnly` session cookies. |
| **Explicit Logout** | N/A (already local). | Cloud data stays in Supabase; this browser's own local guest data (if any) is restored into view; cookies deleted. |
| **Sign Back In (Same Device)** | N/A. | Restored completely from the cloud — never merged with whatever is in this browser's `localStorage`. |
| **Switch Devices / Browsers** | Does not transfer (by design — it's a different guest). | Available immediately upon login, identical across devices. |
| **Clear Browser Cache** | Erased. | Unaffected; restored on next login. |
| **A different account signs in on the same browser** | N/A. | Sees only their own cloud data — never the previous signed-in account's or a prior guest session's local leftovers. |

---

## Section 22 — Performance & Storage Strategy

HeroTyping employs an aggregate-first storage strategy:

### What HeroTyping Deliberately Does NOT Store:
- **NO Raw Keystroke Streams:** Keydown/keyup timestamps, individual millisecond key sequences, or replay frames are **never** persisted to the database.
- **NO High-Frequency Game Ticks:** Game frames, obstacle coordinates, or per-second positions are discarded upon run completion.

### What HeroTyping DOES Store:
- **Result Summaries:** Finished test metrics (WPM, accuracy, duration, character counters).
- **Unit Aggregates:** Star ratings and attempt counts per lesson unit (`lesson_progress`).
- **Game High Scores:** Completed arcade game scores and survival milestones (`game_scores`).
- **Daily Rollups:** Pre-calculated daily statistics (`daily_stats`) to enable instant profile loading.

### High-Growth Tables:
`typing_results`, `lesson_attempts`, and `game_scores` will grow linearly with user activity. All three tables are indexed on `(user_id, created_at DESC)` or `(user_id, game_id, score DESC)` to guarantee sub-10ms queries even as tables reach millions of rows.

---

## Section 23 — Environment Variables

| Variable Name | Environment | Server/Client | Description & Usage |
| :--- | :--- | :---: | :--- |
| `NEXT_PUBLIC_SITE_URL` | All | Client/Server | Canonical URL (`https://herotyping.com` or `http://localhost:3000`). Used for OAuth callbacks, sitemaps, and OpenGraph tags. |
| `NEXT_PUBLIC_SUPABASE_URL` | All | Client/Server | The HTTPS endpoint of the Supabase project (e.g. `https://humzucvcxyapcxkrmutj.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | All | Client/Server | The public API key (`sb_publishable_...` or anon key). Safe for browser exposure. Bound by RLS. |
| `SUPABASE_SECRET_KEY` | Vercel Server / `.env.local` | **SERVER-ONLY** | Privileged server secret key (`sb_secret_...`). Bypasses RLS for validated writes. **NEVER expose with NEXT_PUBLIC_.** |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel Server / `.env.local` | **SERVER-ONLY** | Backward-compatible fallback for legacy Supabase service role keys. |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | Production | Client | Google AdSense publisher ID (`ca-pub-XXXXXXXXXXXX`). Leave empty in local dev to disable ads. |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | All | Client/Server | Contact email rendered on `/privacy` and `/terms` (`hello@herotyping.com`). |

---

## Section 24 — Local Development Setup

1. **Clone & Install:**
   ```bash
   git clone https://github.com/IM-Mukesh/thundertyping.git
   cd thundertyping
   npm install
   ```
2. **Configure Environment:**  
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Ensure `.env.local` contains:
   ```env
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=https://humzucvcxyapcxkrmutj.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_4jYCbNHvfcUYhstD6_QZyA_iwV3hD-X
   SUPABASE_SECRET_KEY=sb_secret_your-actual-secret-key-here
   ```
3. **Run Dev Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.
4. **Verify Backend Status:**  
   Navigate to `/auth/login` to verify the authentication card. Sign in with Google or Email OTP to confirm session creation.

---

## Section 25 — Vercel Deployment Guide

1. **Deployment Architecture:**  
   Deploying the repository to Vercel requires **zero standalone server infrastructure**. Vercel detects Next.js 16 and automatically deploys all Route Handlers as Serverless Functions.
2. **Required Vercel Project Environment Variables:**
   - `NEXT_PUBLIC_SITE_URL` = `https://herotyping.com`
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://humzucvcxyapcxkrmutj.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_4jYCbNHvfcUYhstD6_QZyA_iwV3hD-X`
   - `SUPABASE_SECRET_KEY` = `sb_secret_...` *(Configure for Production and Preview environments)*
3. **Supabase Redirect Configuration:**  
   Ensure `https://herotyping.com/api/auth/callback` is listed in Supabase Dashboard > Authentication > URL Configuration > Redirect URLs.

---

## Section 26 — Testing Suite

HeroTyping uses Node.js's built-in test runner (`node:test` with `scripts/test-setup.mjs` for `@/*` path alias resolution).

```bash
npm test            # Runs all 315 tests across 70 test suites
npm run typecheck   # Runs next typegen && tsc --noEmit
npm run lint        # Runs ESLint checks
npm run build       # Verifies static page prerendering (161 routes)
```

### Backend Test Coverage (`src/lib/server/backend.test.ts`):
- **Typing Result Validation:** Tests modes, duration bounds (1–7200s), WPM limits (0–350), accuracy bounds (0–100), and character counters.
- **Lesson Progress Validation:** Verifies known lesson IDs, star limits (0–5 integer), and invalid ID rejections.
- **Game Score Validation:** Verifies valid game IDs, runaway score exploitation limits (<= 50,000,000), and survival durations.
- **Profile Validation:** Verifies alphanumeric username regex (`/^[a-zA-Z0-9_]{3,24}$/`), length limits, and trimmed display names.
- **Preferences Validation:** Verifies sound volume (0–1) and strict setting values.
- **API Response Envelopes:** Verifies formatting of `apiSuccess` and `apiError` objects with correct status codes.
- **Supabase Client Isolation:** Verifies that `createAdminClient` prioritizes `SUPABASE_SECRET_KEY`, never uses `NEXT_PUBLIC_`, throws clear descriptive errors if keys are missing, and isolates session states.

---

## Section 27 — Manual QA Verification Matrix

| Scenario | Tested Environment | Status | Verification Observations |
| :--- | :--- | :---: | :--- |
| **Guest Mode Flow** | Chrome / Firefox / Mobile Safari | **VERIFIED** | Typing tests, all 10 games, and 28 lessons save to localStorage without error. Zero network errors. |
| **Google Sign-In Trigger** | Localhost & Production | **VERIFIED** | Redirects cleanly to Google account chooser without invalid redirect errors. |
| **Google Auth Callback** | Localhost (`/api/auth/callback`) | **VERIFIED** | Code exchanged for session, cookies attached to redirect response, user landed on `/profile`. |
| **Email OTP Dispatch** | Localhost (`/api/auth/otp`) | **VERIFIED** | Same-origin POST returns HTTP 200, triggers Supabase GoTrue OTP delivery. |
| **Email OTP Verification** | Localhost (`/api/auth/verify`) | **VERIFIED** | 6-digit code verified, session cookies set on HTTP response, UI transitions to authenticated. |
| **Profile Display & Persistence** | Real Browser | **VERIFIED** | Shows avatar initial, email, display name, and synced badge. Survives page reload. |
| **Inline Profile Editing** | Real Browser | **VERIFIED** | Changing display name or username sends `PATCH /api/profile`, updates UI instantly. |
| **User Sign Out** | Desktop Menu & Mobile Drawer | **VERIFIED** | `POST /api/auth/signout` purges all `sb-*` cookies. UI resets to guest mode immediately. |
| **Guest Data Merge** | Real Browser (Guest -> Login) | **VERIFIED** | Background sync sends local games/lessons/XP to `/api/sync/migrate`. No data loss. |
| **Unauthorized API Access** | cURL / Postman | **VERIFIED** | Calling `/api/profile` without cookies returns HTTP 401 with standard error envelope. |

---

## Section 28 — Current Known Issues

| Issue | Status | Symptom | Root Cause | Workaround / Mitigation | Next Action |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Non-atomic aggregate stat updates** | FIXED 2026-09-28 | Under concurrent or retried requests, a `daily_stats`/`player_streaks`/`lesson_progress` increment could be silently lost or double-counted (classic read-then-write race). | `saveTypingResult`, `saveLessonProgress`, and `saveGameScore` each did a plain `select()` then `update()` with no concurrency guard. | Added `src/lib/server/optimistic-retry.ts`: each aggregate write now does a compare-and-swap on `updated_at` (or catches the table's unique-constraint violation on insert) and retries up to 3 times on conflict. Regression tests in `optimistic-retry.test.ts`. | None — closed. A true DB-level atomic increment (Postgres RPC with `ON CONFLICT DO UPDATE SET x = x + 1`) would be marginally stronger but requires a schema migration; the CAS/retry approach fixes the bug without one. |
| **Supabase Email Rate Limits** | KNOWN LIMITATION | Email OTP throttled after ~3 attempts in 1 hour. | Supabase default shared SMTP limits free tier projects. | Wait for hourly rate limit window to expire or use Google OAuth. | Configure dedicated SMTP provider (Resend, SendGrid) in Supabase Dashboard. |
| **Google Cloud OAuth Consent Screen** | REQUIRES CONFIG | External test users must be added in Google Cloud Console. | Google OAuth app is in "Testing" mode before verification. | Add developer/tester email to "Test Users" in Google Cloud Console. | Move OAuth app from "Testing" to "In Production" in Google Cloud Console. |

---

## Section 29 — Current System Limitations

1. **No Public Leaderboards:** Scores are currently private to the user. Global competitive leaderboards are slated for Phase 2.
2. **No Multiplayer Realtime WebSockets:** Games and tests are strictly client-side single-player runs.
3. **No Paid Subscriptions / Paywalls:** All curriculum lessons, arcade games, and typing modes remain 100% free and open-access.
4. **No Server Keystroke Anti-Cheat:** Anti-cheat is enforced via statistical boundary validation (WPM <= 350, accuracy <= 100%, score limits) rather than keystroke cadence analysis.

---

## Section 30 — Security Rules for Future AI Agents

> [!CAUTION]
> **DO NOT BREAK THESE SECURITY RULES**  
> Any future AI assistant modifying this codebase must adhere strictly to these 14 commandments:

1. **NEVER expose `SUPABASE_SECRET_KEY`:** Never prefix it with `NEXT_PUBLIC_`, never import `createAdminClient` into Client Components, and never reference it in client bundles.
2. **NEVER trust client-supplied `user_id`:** Always derive the user identity on the server using `requireAuthUser()`. Never allow a request body to specify whose data is being written.
3. **NEVER weaken Row Level Security:** Do NOT add permissive `FOR INSERT` or `FOR UPDATE` policies to private user tables. All mutations must go through server Route Handlers.
4. **NEVER store raw keystroke streams:** Do not capture millisecond keydown events in the database. Store only completed test summary statistics.
5. **NEVER break guest mode:** Every feature must continue functioning for unauthenticated users using `localStorage`. Never block gameplay with mandatory login walls.
6. **NEVER commit `.env.local`:** Environment secrets must remain strictly local or inside Vercel Project Settings.
7. **NEVER put real secret keys in `.env.example`:** Keep placeholder strings only in documentation and example files.
8. **NEVER bypass validation:** All Route Handlers must validate incoming JSON using `src/lib/server/validation.ts` before calling server services.
9. **NEVER replace `src/proxy.ts` with legacy `middleware.ts`:** Next.js 16 uses the request proxy architecture.
10. **NEVER make un-schema-qualified triggers:** All trigger functions must specify `SECURITY DEFINER SET search_path = ''` and schema-qualify all table names (`public.table_name`).
11. **NEVER use `getSession()` for server authorization:** Always use `supabase.auth.getUser()`, which validates the JWT authenticity with the Supabase Auth server.
12. **NEVER remove `ON DELETE CASCADE` from user foreign keys:** Deleting a user in Auth must cleanly cascade across all 9 schema tables.
13. **NEVER allow open redirects in `/api/auth/callback`:** Ensure the `next` query parameter strictly begins with `/` and does not contain `://` or `//`.
14. **NEVER commit or push code without explicit human user authorization.**

---

## Section 31 — Backend Change Rules

Before modifying any backend or auth code in HeroTyping:
1. Read **`BACKEND_PROGRESS.md`** (this document) completely.
2. Read **`PROGRESS.md`** to understand recent project history.
3. Inspect the live code and migration files rather than assuming conversational memory is accurate.
4. Check Row Level Security implications before creating new tables or queries.
5. Verify that guest data persistence remains completely intact.
6. Run `npm test`, `npm run typecheck`, and `npm run lint` before declaring work complete.
7. Perform manual browser QA for any auth or session changes.
8. Do not run destructive database commands or commit code without explicit instructions.

---

## Section 32 — Database Migration Policy

- **Source Control:** All schema changes must be authored as SQL files inside `supabase/migrations/`.
- **Current Migration:** `supabase/migrations/20260928000000_initial_schema.sql` is the authoritative initial schema.
- **Never Rewrite Applied Migrations:** Once a migration has been executed against production, never edit it retroactively. Always author a new incremental migration file (e.g. `20260929000000_add_leaderboards.sql`).
- **No Ad-Hoc Dashboard Editing:** Do not create or alter tables manually inside the Supabase Table Editor without writing the corresponding version-controlled migration script.

---

## Section 33 — How to Add a New User Data Feature

Follow this 10-step protocol to add a new persistent feature (e.g., custom word lists):

1. **Define Schema:** Author a new migration in `supabase/migrations/` creating the table with `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE`.
2. **Apply RLS:** Enable RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) and add a `SELECT` policy (`USING (auth.uid() = user_id)`). Do not add client write policies.
3. **Update TypeScript Types:** Add the table definition to `src/lib/supabase/database.types.ts`.
4. **Add Validation:** Add a validation function in `src/lib/server/validation.ts` defining strict boundary constraints.
5. **Add Server Service:** In `src/lib/server/`, create a service using `createAdminClient()` for writes and `requireAuthUser()` for identity.
6. **Add Route Handler:** Create `src/app/api/[feature]/route.ts` implementing `GET` and `POST` handlers using `apiSuccess` and `apiError`.
7. **Add Guest Local Storage:** In client code, ensure guest users can use the feature via `localStorage`.
8. **Add Migration Logic:** In `src/lib/auth/guest-sync.ts` and `src/lib/server/migration.ts`, add merging logic to transfer guest data upon signup.
9. **Write Tests:** Add unit tests in `src/lib/server/backend.test.ts` testing validation boundaries and service methods.
10. **Document Changes:** Update `BACKEND_PROGRESS.md` with the new table, route, and validation rules.

---

## Section 34 — How to Debug Auth & Backend

### 1. "TypeError: Failed to fetch"
- **Symptom:** Browser console logs `TypeError: Failed to fetch` during auth initialization or OTP request.
- **Root Cause:** A Client Component is attempting a direct cross-origin fetch to `https://*.supabase.co` from inside a sandboxed iframe or extension environment (e.g., `frame_ant.js`).
- **Solution:** Verify that the client calls the same-origin Next.js Route Handler (`/api/auth/otp`, `/api/auth/verify`, `/api/profile`) rather than calling Supabase GoTrue directly from the browser.

### 2. Google OAuth Error / Redirect Loop
- **Symptom:** User is redirected to `/auth/login?error=...` after selecting their Google account.
- **Checks:**
  1. Check **Google Cloud Console > Authorized redirect URIs**: Must be `https://humzucvcxyapcxkrmutj.supabase.co/auth/v1/callback`.
  2. Check **Supabase Dashboard > URL Configuration > Redirect URLs**: Must include `http://localhost:3000/api/auth/callback` and `https://herotyping.com/api/auth/callback`.
  3. Check `/api/auth/callback/route.ts`: Ensure `exchangeCodeForSession` receives the code and writes cookies directly to `redirectResponse.cookies`.

### 3. Profile Does Not Persist on Page Refresh
- **Symptom:** User appears logged in immediately after OAuth, but refreshing the page returns them to guest mode.
- **Checks:**
  1. Inspect browser DevTools > Application > Cookies: Check if `sb-*-auth-token` cookies exist.
  2. Check `src/app/api/auth/callback/route.ts`: Verify that `redirectResponse.cookies.set()` was called inside `setAll`. Calling `cookieStore.set()` alone inside `NextResponse.redirect` drops cookies in Next.js 16.
  3. Check `src/proxy.ts`: Verify the matcher does not exclude API routes or profile pages.

### 4. Database Write Fails with 401 / 403
- **Symptom:** API returns `{ success: false, error: { code: "UNAUTHORIZED" } }` or PostgreSQL returns permission denied.
- **Checks:**
  1. Verify `SUPABASE_SECRET_KEY` is configured in `.env.local` or Vercel environment variables.
  2. Check that the service uses `createAdminClient()`. If it uses `createClient()` (SSR client), RLS will block inserts and updates.
  3. Ensure `requireAuthUser()` successfully extracts `user.id`.

---

## Section 35 — Chronological Change History

| Date | Milestone / Change | Rationale | Key Files Affected | Verification |
| :--- | :--- | :--- | :--- | :--- |
| **2026-09-28** | Initial Backend Foundation | Establish serverless architecture with Next.js 16 App Router + Supabase. | `src/app/api/**`, `src/lib/server/**`, `src/lib/supabase/**` | 313 unit tests pass; build clean. |
| **2026-09-28** | Privileged Admin Client Hardening | Support new Supabase API key model (`SUPABASE_SECRET_KEY`). Decouple admin client from user cookies. | `src/lib/supabase/admin.ts`, `.env.example`, `backend.test.ts` | Unit tests verify secret key priority and isolation. |
| **2026-09-28** | Trigger Hardening | Add `SECURITY DEFINER SET search_path = ''` to `handle_new_user()` to prevent search_path poisoning. | `supabase/migrations/20260928000000_initial_schema.sql` | SQL inspected and validated. |
| **2026-09-28** | RLS Security Hardening | Convert permissive user-table policies to `SELECT` only. Route all inserts/updates through Vercel server. | `supabase/migrations/20260928000000_initial_schema.sql` | Security audit completed; policies verified. |
| **2026-09-28** | OAuth Cookie Fix for Next.js 16 | Write cookies directly to `redirectResponse.cookies` in `/api/auth/callback` to prevent dropped session cookies. | `src/app/api/auth/callback/route.ts` | Browser OAuth callback flow verified. |
| **2026-09-28** | Extension Sandbox Isolation | Route `initAuth`, OTP request, and OTP verification through same-origin server routes to eliminate `Failed to fetch`. | `src/lib/auth/auth-context.tsx`, `/api/auth/otp`, `/api/auth/verify` | Zero browser console errors in sandboxed frames. |
| **2026-09-28** | Authoritative Backend Documentation | Author comprehensive handoff document `BACKEND_PROGRESS.md`. | `BACKEND_PROGRESS.md` | All 38 sections verified against codebase. |

---

## Section 36 — Recommended Next Steps

### Immediate Priority (Next Session):
1. **Apply Initial Database Migration:** Project owner copies `supabase/migrations/20260928000000_initial_schema.sql` into the Supabase SQL Editor and executes it.
2. **Verify Google OAuth Cloud Dashboard:** Confirm authorized redirect URI `https://humzucvcxyapcxkrmutj.supabase.co/auth/v1/callback` is live in Google Cloud Console.
3. **Verify Vercel Environment Variables:** Add `SUPABASE_SECRET_KEY` in Vercel Project Settings > Environment Variables.

### Medium-Term Priority:
1. **Configure Custom SMTP in Supabase:** Replace Supabase shared mailer with a dedicated provider (Resend, SendGrid, Amazon SES) for high-volume email delivery.
2. **Implement User Avatar Uploads:** Add Supabase Storage bucket for custom profile pictures.
3. **Public User Profiles:** Create `/u/[username]` public profile pages showcasing badges and personal bests.

### Long-Term Priority:
1. **Global Competitive Leaderboards:** Add global and weekly high-score tables for all 10 arcade games and 60-second typing tests.
2. **Classrooms / Teacher Dashboard:** Add group tracking for touch-typing curriculum progress in educational settings.

---

## Section 37 — AI Agent Startup Checklist

Before making ANY changes to the HeroTyping backend, verify each step:

```
[ ] 1. Read PROGRESS.md and BACKEND_PROGRESS.md completely.
[ ] 2. Inspect the live code and migration files rather than trusting conversational memory.
[ ] 3. Run `npm test` and verify that all 315 tests pass.
[ ] 4. Run `npm run typecheck` to confirm zero TypeScript compilation errors.
[ ] 5. Confirm that NO functional code is being modified if the task is documentation-only.
[ ] 6. Ensure `SUPABASE_SECRET_KEY` is NEVER exposed to client bundles or prefixed with `NEXT_PUBLIC_`.
[ ] 7. Confirm that Row Level Security (RLS) is preserved and private tables remain read-only to browser clients.
[ ] 8. Verify that guest mode functionality and localStorage persistence remain intact.
[ ] 9. Never execute destructive SQL (`DROP TABLE`, `TRUNCATE`) against production.
[ ] 10. DO NOT commit or push code unless explicitly instructed by the user.
```

---

## Section 38 — Fact vs. Assumption Matrix

| Item | Factual Status | Verification Method |
| :--- | :--- | :--- |
| **9 Database Tables Defined** | **FACT** | Verified in `supabase/migrations/20260928000000_initial_schema.sql`. |
| **Hardened RLS Model Active in Code** | **FACT** | Verified in migration SQL (SELECT only for browser; writes via server API). |
| **Privileged Client Uses `SUPABASE_SECRET_KEY`** | **FACT** | Verified in `src/lib/supabase/admin.ts` and unit tests in `backend.test.ts`. |
| **All 10 Route Handlers Exist and Compile** | **FACT** | Verified in `src/app/api/**` and clean `npm run build` output. |
| **Zero Standalone Server Invariant** | **FACT** | Verified by repository structure: Next.js 16 App Router on Vercel only. |
| **315 Unit Tests Passing Cleanly** | **FACT** | Verified by running `npm test` on Node 22 (70 test suites, 0 failures). |
| **Database Schema Applied in Live Supabase** | **MANUAL STEP REQUIRED** | Tables were cleaned; awaiting manual SQL execution by project owner. |
| **Google Cloud OAuth Production Verification** | **ASSUMPTION / PENDING** | Assumes Google Cloud project consent screen will be published by project owner. |
| **Production Custom SMTP Configured** | **ASSUMPTION / PENDING** | Default Supabase mailer active; custom SMTP recommended for production scale. |
