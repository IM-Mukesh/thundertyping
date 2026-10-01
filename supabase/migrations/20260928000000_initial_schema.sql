-- ==============================================================================
-- HeroTyping — Initial Production Database Schema & RLS Policies
-- Target Database: Supabase PostgreSQL
-- Auth Identity: auth.users
-- ==============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark' NOT NULL,
  sound_enabled BOOLEAN DEFAULT true NOT NULL,
  sound_volume NUMERIC DEFAULT 0.5 NOT NULL,
  keyboard_layout TEXT DEFAULT 'qwerty' NOT NULL,
  confidence_mode TEXT DEFAULT 'off' NOT NULL,
  quick_restart TEXT DEFAULT 'off' NOT NULL,
  smooth_caret TEXT DEFAULT 'medium' NOT NULL,
  font_size TEXT DEFAULT 'medium' NOT NULL,
  font_family TEXT DEFAULT 'mono' NOT NULL,
  default_test_mode TEXT DEFAULT 'time' NOT NULL,
  default_test_duration INTEGER DEFAULT 30 NOT NULL,
  punctuation BOOLEAN DEFAULT false NOT NULL,
  numbers BOOLEAN DEFAULT false NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Player Streaks & Aggregate XP
CREATE TABLE IF NOT EXISTS public.player_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  longest_streak INTEGER DEFAULT 0 NOT NULL,
  last_active_date DATE,
  total_xp INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Lesson Progress Table (Aggregate best performance per unit)
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  stars INTEGER DEFAULT 0 NOT NULL,
  best_wpm NUMERIC DEFAULT 0 NOT NULL,
  best_accuracy NUMERIC DEFAULT 0 NOT NULL,
  attempt_count INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_lesson UNIQUE(user_id, lesson_id)
);

-- 5. Lesson Attempts Table (Result-level history)
CREATE TABLE IF NOT EXISTS public.lesson_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  wpm NUMERIC NOT NULL,
  accuracy NUMERIC NOT NULL,
  stars INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Typing Test Results Table
CREATE TABLE IF NOT EXISTS public.typing_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  duration NUMERIC NOT NULL,
  wpm NUMERIC NOT NULL,
  raw_wpm NUMERIC,
  accuracy NUMERIC NOT NULL,
  consistency NUMERIC,
  correct_chars INTEGER NOT NULL,
  incorrect_chars INTEGER NOT NULL,
  extra_chars INTEGER DEFAULT 0,
  missed_chars INTEGER DEFAULT 0,
  param TEXT,
  punctuation BOOLEAN DEFAULT false,
  numbers BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Game Scores Table
CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  cleared INTEGER DEFAULT 0,
  best_combo INTEGER DEFAULT 0,
  survived_ms INTEGER DEFAULT 0,
  wpm NUMERIC,
  accuracy NUMERIC,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Daily Aggregate Statistics Table
CREATE TABLE IF NOT EXISTS public.daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  tests_completed INTEGER DEFAULT 0 NOT NULL,
  games_played INTEGER DEFAULT 0 NOT NULL,
  lessons_completed INTEGER DEFAULT 0 NOT NULL,
  practice_minutes NUMERIC DEFAULT 0 NOT NULL,
  average_wpm NUMERIC DEFAULT 0,
  best_wpm NUMERIC DEFAULT 0,
  average_accuracy NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_daily_date UNIQUE(user_id, date)
);

-- 9. Achievements Table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_achievement UNIQUE(user_id, achievement_id)
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_typing_results_user_created ON public.typing_results(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON public.lesson_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attempts_user_created ON public.lesson_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_user_game ON public.game_scores(user_id, game_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON public.daily_stats(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON public.achievements(user_id);

-- ==============================================================================
-- AUTOMATIC NEW USER INITIALIZATION TRIGGER
-- ==============================================================================
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

-- Bind trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on every table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Profiles Policies (Read-only for authenticated client; mutations through server/trigger)
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- User Preferences Policies (Read-only for authenticated client; mutations through server API)
CREATE POLICY "preferences_select_own" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);

-- Player Streaks Policies (Read-only for authenticated client; mutations through server API)
CREATE POLICY "streaks_select_own" ON public.player_streaks FOR SELECT USING (auth.uid() = user_id);

-- Lesson Progress Policies (Read-only for authenticated client; mutations through server API)
CREATE POLICY "lesson_progress_select_own" ON public.lesson_progress FOR SELECT USING (auth.uid() = user_id);

-- Lesson Attempts Policies (Read-only for authenticated client; mutations through server API)
CREATE POLICY "lesson_attempts_select_own" ON public.lesson_attempts FOR SELECT USING (auth.uid() = user_id);

-- Typing Results Policies (Read and delete own test runs; inserts through server API)
CREATE POLICY "typing_results_select_own" ON public.typing_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "typing_results_delete_own" ON public.typing_results FOR DELETE USING (auth.uid() = user_id);

-- Game Scores Policies (Read-only for authenticated client; mutations through server API)
CREATE POLICY "game_scores_select_own" ON public.game_scores FOR SELECT USING (auth.uid() = user_id);

-- Daily Stats Policies (Read-only for authenticated client; mutations through server API)
CREATE POLICY "daily_stats_select_own" ON public.daily_stats FOR SELECT USING (auth.uid() = user_id);

-- Achievements Policies (Read-only for authenticated client; mutations through server API)
CREATE POLICY "achievements_select_own" ON public.achievements FOR SELECT USING (auth.uid() = user_id);
