-- ==============================================================================
-- HeroTyping — Security Hardening, Table Constraints & Rate Limiting Migration
-- Safe, additive migration preserving all existing records.
-- ==============================================================================

-- 1. Distributed Rate Limiting Table (Accessed strictly via server-side admin client)
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (No policies granted to anon or authenticated users; only service_role/admin)
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Auto-cleanup index for rate limit resets
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON public.api_rate_limits(reset_at);

-- 2. Enhanced Indexing for Scalable Game Bests Retrieval
CREATE INDEX IF NOT EXISTS idx_game_scores_user_game_score ON public.game_scores(user_id, game_id, score DESC);

-- 3. Defensive Table Integrity Constraints
-- Wrapped in DO blocks to ensure idempotent re-runs without duplicate constraint errors

DO $$
BEGIN
  -- profiles constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_username_len') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_username_len
      CHECK (username IS NULL OR (length(username) >= 3 AND length(username) <= 24));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_display_name_len') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_display_name_len
      CHECK (display_name IS NULL OR length(display_name) <= 50);
  END IF;

  -- user_preferences constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_preferences_sound_volume') THEN
    ALTER TABLE public.user_preferences ADD CONSTRAINT chk_preferences_sound_volume
      CHECK (sound_volume >= 0 AND sound_volume <= 1);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_preferences_duration') THEN
    ALTER TABLE public.user_preferences ADD CONSTRAINT chk_preferences_duration
      CHECK (default_test_duration >= 1 AND default_test_duration <= 7200);
  END IF;

  -- player_streaks constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_streaks_total_xp') THEN
    ALTER TABLE public.player_streaks ADD CONSTRAINT chk_streaks_total_xp
      CHECK (total_xp >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_streaks_counters') THEN
    ALTER TABLE public.player_streaks ADD CONSTRAINT chk_streaks_counters
      CHECK (current_streak >= 0 AND longest_streak >= 0);
  END IF;

  -- lesson_progress constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_lesson_progress_stars') THEN
    ALTER TABLE public.lesson_progress ADD CONSTRAINT chk_lesson_progress_stars
      CHECK (stars >= 0 AND stars <= 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_lesson_progress_metrics') THEN
    ALTER TABLE public.lesson_progress ADD CONSTRAINT chk_lesson_progress_metrics
      CHECK (best_wpm >= 0 AND best_wpm <= 350 AND best_accuracy >= 0 AND best_accuracy <= 100 AND attempt_count >= 0);
  END IF;

  -- lesson_attempts constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_lesson_attempts_stars') THEN
    ALTER TABLE public.lesson_attempts ADD CONSTRAINT chk_lesson_attempts_stars
      CHECK (stars >= 0 AND stars <= 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_lesson_attempts_metrics') THEN
    ALTER TABLE public.lesson_attempts ADD CONSTRAINT chk_lesson_attempts_metrics
      CHECK (wpm >= 0 AND wpm <= 350 AND accuracy >= 0 AND accuracy <= 100);
  END IF;

  -- typing_results constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_typing_results_duration') THEN
    ALTER TABLE public.typing_results ADD CONSTRAINT chk_typing_results_duration
      CHECK (duration > 0 AND duration <= 7200);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_typing_results_wpm') THEN
    ALTER TABLE public.typing_results ADD CONSTRAINT chk_typing_results_wpm
      CHECK (wpm >= 0 AND wpm <= 350 AND (raw_wpm IS NULL OR (raw_wpm >= 0 AND raw_wpm <= 450)));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_typing_results_accuracy') THEN
    ALTER TABLE public.typing_results ADD CONSTRAINT chk_typing_results_accuracy
      CHECK (accuracy >= 0 AND accuracy <= 100 AND (consistency IS NULL OR (consistency >= 0 AND consistency <= 100)));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_typing_results_chars') THEN
    ALTER TABLE public.typing_results ADD CONSTRAINT chk_typing_results_chars
      CHECK (correct_chars >= 0 AND incorrect_chars >= 0 AND extra_chars >= 0 AND missed_chars >= 0);
  END IF;

  -- game_scores constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_game_scores_score') THEN
    ALTER TABLE public.game_scores ADD CONSTRAINT chk_game_scores_score
      CHECK (score >= 0 AND cleared >= 0 AND best_combo >= 0 AND survived_ms >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_game_scores_metrics') THEN
    ALTER TABLE public.game_scores ADD CONSTRAINT chk_game_scores_metrics
      CHECK ((wpm IS NULL OR (wpm >= 0 AND wpm <= 350)) AND (accuracy IS NULL OR (accuracy >= 0 AND accuracy <= 100)));
  END IF;

  -- daily_stats constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_daily_stats_counters') THEN
    ALTER TABLE public.daily_stats ADD CONSTRAINT chk_daily_stats_counters
      CHECK (tests_completed >= 0 AND games_played >= 0 AND lessons_completed >= 0 AND practice_minutes >= 0);
  END IF;
END $$;
