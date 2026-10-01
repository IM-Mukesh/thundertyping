# HeroTyping Backend Architecture & Production Setup

This document outlines the production backend architecture for HeroTyping, combining Next.js 16 (App Router + Turbopack) deployed on Vercel with Supabase (Auth + Postgres + Row Level Security).

---

## 1. Architecture Overview

HeroTyping adheres strictly to a **zero separate server** architecture:
- No standalone Express/Fastify server.
- No microservices or external Node containers.
- All backend endpoints run as serverless Next.js App Router Route Handlers (`src/app/api/**`).
- Supabase provides fully managed PostgreSQL and authentication services.
- Vercel executes server-side utilities with cookie-based session management (`@supabase/ssr`).

```
                    HEROTYPING
                         |
                    Next.js 16 (App Router)
                         |
              -------------------------
              |                       |
         Client UI                Vercel
        (React 19)              Server-side
                                      |
                         Route Handlers /
                         Server Utilities
                                      |
                                  Supabase
                               /            \
                            Auth          Postgres
```

---

## 2. Supabase Setup & Environment Variables

### Required Environment Variables

Add the following to your `.env.local` (for local development) and in your **Vercel Project Settings > Environment Variables** (for production):

```env
# Supabase URL & Public API Key (Safe for browser / client)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key-here

# Server-only Privileged Secret Key (New Supabase API key model - NEVER expose to NEXT_PUBLIC_)
SUPABASE_SECRET_KEY=sb_secret_your-secret-key-here
```

### Google OAuth Configuration in Supabase

1. Open your [Google Cloud Console](https://console.cloud.google.com/).
2. Create an **OAuth 2.0 Client ID** (Web application).
3. Set Authorized JavaScript Origins:
   - `http://localhost:3000` (for local development)
   - `https://herotyping.com` (for production)
4. Set Authorized Redirect URIs:
   - `https://<your-supabase-project-id>.supabase.co/auth/v1/callback`
5. Open your [Supabase Dashboard](https://supabase.com/dashboard) > **Authentication** > **Providers** > **Google**:
   - Toggle **Enable Google provider**.
   - Paste your **Client ID** and **Client Secret**.
   - Save.

---

## 3. Database Schema & Migrations

The full schema migration is located at:
`supabase/migrations/20260928000000_initial_schema.sql`

To apply it to your Supabase project:
- **Via Supabase Dashboard**: Go to **SQL Editor**, paste the contents of `20260928000000_initial_schema.sql`, and click **Run**.
- **Via Supabase CLI**: `supabase db push` or `supabase migration up`.

### Tables Created

| Table | Description | RLS Policy |
| :--- | :--- | :--- |
| `profiles` | User profiles (`username`, `display_name`, `avatar_url`) | Users can view all, modify only their own (`id = auth.uid()`) |
| `user_preferences` | User settings (`theme`, `sound`, `caret`, `layout`, etc.) | Read/Write owned row only (`user_id = auth.uid()`) |
| `player_streaks` | XP, level, daily streak counts | Read/Write owned row only (`user_id = auth.uid()`) |
| `lesson_progress` | Completed units, star counts, best speed & accuracy | Read/Write owned row only (`user_id = auth.uid()`) |
| `lesson_attempts` | Full history of lesson runs | Read/Write owned row only (`user_id = auth.uid()`) |
| `typing_results` | Full history of typing tests (time, words, quote, etc.) | Read/Write owned row only (`user_id = auth.uid()`) |
| `game_scores` | Arcade game runs, high scores, levels, metadata | Read/Write owned row only (`user_id = auth.uid()`) |
| `daily_stats` | Daily aggregated metrics (tests, lessons, games played) | Read/Write owned row only (`user_id = auth.uid()`) |
| `achievements` | Unlocked player badges | Read/Write owned row only (`user_id = auth.uid()`) |

### Automated Profile Creation Trigger

An automated database trigger `on_auth_user_created` runs on `auth.users` whenever a user signs up via Google OAuth or Email OTP. It automatically initializes:
- A `profiles` record.
- A `user_preferences` record with defaults.
- A `player_streaks` record starting at Level 1 with 0 XP.

---

## 4. API Endpoints Contract

All API endpoints follow a standardized response envelope:

```typescript
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT" | "UNAUTHORIZED" | "CONFLICT" | "INTERNAL_ERROR",
    "message": "Human readable explanation"
  }
}
```

### Route Handlers

1. **`GET /api/auth/callback`**
   - Handles OAuth code exchange (`exchangeCodeForSession`).
   - Includes open-redirect protection (ensuring `next` parameter is a relative local URL).
2. **`GET /api/profile`** & **`PATCH /api/profile`**
   - `GET`: Returns the authenticated user's profile, preferences, and streak data.
   - `PATCH`: Updates `displayName` and/or `username` with alphanumeric validation and duplicate checks.
3. **`GET /api/profile/preferences`** & **`PUT /api/profile/preferences`**
   - Retrieves and updates user theme, sound, layout, and typing test preferences.
4. **`GET /api/typing-results`** & **`POST /api/typing-results`**
   - `GET`: Returns recent typing test history (`?limit=50`).
   - `POST`: Records test results (WPM, accuracy, consistency, duration), updating daily stats and streak XP.
5. **`GET /api/lessons/progress`** & **`POST /api/lessons/progress`**
   - `GET`: Returns user's unit-by-unit lesson progress.
   - `POST`: Upserts unit progress (retaining higher stars and best WPM) and records the attempt.
6. **`GET /api/games/scores`** & **`POST /api/games/scores`**
   - `GET`: Returns highest score per game for the user.
   - `POST`: Records run score, evaluates personal bests, and updates daily games played count.
7. **`POST /api/sync/migrate`**
   - Migrates local guest data (profile XP, streak, lesson stars, game bests, typing records) into the user's cloud account.

---

## 5. Guest Mode & Deterministic Migration

HeroTyping prioritizes an instant, frictionless experience:
1. **Zero Login Walls**: All typing tests, lessons, games, and tools are 100% playable as a guest without creating an account.
2. **Local First**: Guest state is stored safely in `localStorage`.
3. **Deterministic Cloud Sync**: When a guest signs in or creates an account, `gatherAndMigrateGuestData` runs automatically in the background:
   - **Stars & Progress**: Retains the highest stars, highest WPM, and highest accuracy between guest and cloud data.
   - **Game High Scores**: Retains the highest score achieved for each game.
   - **Streaks & XP**: Retains the highest streak and takes the maximum accumulated XP.
   - **Achievements**: Merges the set of unlocked badges without duplicates.
