-- 20261008040000_multilingual_content.sql

BEGIN;

CREATE TABLE IF NOT EXISTS public.languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  direction TEXT DEFAULT 'ltr',
  enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed languages
INSERT INTO public.languages (code, name, native_name, sort_order) VALUES
('en', 'English', 'English', 1),
('es', 'Spanish', 'Español', 2),
('pt-BR', 'Brazilian Portuguese', 'Português (Brasil)', 3),
('de', 'German', 'Deutsch', 4)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.vocabulary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code TEXT NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  word TEXT NOT NULL,
  normalized_word TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  category TEXT,
  frequency_rank INTEGER,
  part_of_speech TEXT,
  meaning TEXT,
  example TEXT,
  status TEXT DEFAULT 'published',
  content_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_vocabulary_items_lang_diff ON public.vocabulary_items(language_code, difficulty);

CREATE TABLE IF NOT EXISTS public.typing_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code TEXT NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  difficulty TEXT,
  text TEXT NOT NULL,
  normalized_text TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  char_count INTEGER NOT NULL,
  source TEXT,
  category TEXT,
  status TEXT DEFAULT 'published',
  content_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_typing_texts_lang_type ON public.typing_texts(language_code, content_type);

CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code TEXT NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  source TEXT,
  difficulty TEXT,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_quotes_lang ON public.quotes(language_code);

CREATE TABLE IF NOT EXISTS public.guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_key TEXT NOT NULL,
  language_code TEXT NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT DEFAULT 'published',
  UNIQUE(language_code, slug),
  UNIQUE(language_code, guide_key)
);

CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_key TEXT NOT NULL,
  language_code TEXT NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  difficulty TEXT,
  tier TEXT,
  stage TEXT,
  new_keys TEXT[],
  instructions TEXT[],
  min_accuracy INTEGER,
  status TEXT DEFAULT 'published',
  content_version INTEGER DEFAULT 1,
  UNIQUE(language_code, lesson_key)
);

CREATE TABLE IF NOT EXISTS public.lesson_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  practice_type TEXT NOT NULL,
  target_text TEXT,
  target_keys TEXT[],
  word_count INTEGER,
  numbers BOOLEAN DEFAULT false,
  advanced_mode TEXT,
  UNIQUE(lesson_id, step_order)
);

-- User data alterations
ALTER TABLE public.typing_results ADD COLUMN language_code TEXT;
UPDATE public.typing_results SET language_code = 'en' WHERE language_code IS NULL;
ALTER TABLE public.typing_results ALTER COLUMN language_code SET NOT NULL;
ALTER TABLE public.typing_results ALTER COLUMN language_code SET DEFAULT 'en';

ALTER TABLE public.lesson_progress ADD COLUMN language_code TEXT;
UPDATE public.lesson_progress SET language_code = 'en' WHERE language_code IS NULL;
ALTER TABLE public.lesson_progress ALTER COLUMN language_code SET NOT NULL;
ALTER TABLE public.lesson_progress ALTER COLUMN language_code SET DEFAULT 'en';

ALTER TABLE public.lesson_progress DROP CONSTRAINT unique_user_lesson;
ALTER TABLE public.lesson_progress ADD CONSTRAINT unique_user_lesson_lang UNIQUE(user_id, lesson_id, language_code);

ALTER TABLE public.lesson_attempts ADD COLUMN language_code TEXT;
UPDATE public.lesson_attempts SET language_code = 'en' WHERE language_code IS NULL;
ALTER TABLE public.lesson_attempts ALTER COLUMN language_code SET NOT NULL;
ALTER TABLE public.lesson_attempts ALTER COLUMN language_code SET DEFAULT 'en';

-- Update indices and functions
DROP INDEX IF EXISTS public.idx_typing_results_user_bucket_pb;
CREATE INDEX idx_typing_results_user_bucket_pb
  ON public.typing_results (user_id, language_code, mode, param, punctuation, numbers, wpm DESC, accuracy DESC);

CREATE OR REPLACE FUNCTION public.get_typing_bests(p_user_id UUID)
RETURNS SETOF public.typing_results
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT DISTINCT ON (t.language_code, t.mode, COALESCE(t.param, ''), t.punctuation, t.numbers) t.*
  FROM public.typing_results t
  WHERE t.user_id = p_user_id
    AND t.mode IN ('time', 'words', 'quote', 'vocabulary')
  ORDER BY t.language_code, t.mode, COALESCE(t.param, ''), t.punctuation, t.numbers, t.wpm DESC, t.accuracy DESC, t.created_at ASC;
$$;

-- RLS
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access to published languages" ON public.languages FOR SELECT USING (enabled = true);
CREATE POLICY "Allow public read-only access to published vocabulary" ON public.vocabulary_items FOR SELECT USING (status = 'published');
CREATE POLICY "Allow public read-only access to published typing texts" ON public.typing_texts FOR SELECT USING (status = 'published');
CREATE POLICY "Allow public read-only access to published quotes" ON public.quotes FOR SELECT USING (status = 'published');
CREATE POLICY "Allow public read-only access to published guides" ON public.guides FOR SELECT USING (status = 'published');
CREATE POLICY "Allow public read-only access to published lessons" ON public.lessons FOR SELECT USING (status = 'published');
CREATE POLICY "Allow public read-only access to published lesson_steps" ON public.lesson_steps FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.lessons WHERE id = lesson_steps.lesson_id AND status = 'published')
);

COMMIT;

-- Replace settle_typing_run to accept language_code
CREATE OR REPLACE FUNCTION public.settle_typing_run(
  p_run_id UUID, p_user_id UUID, p_mode TEXT, p_duration NUMERIC,
  p_wpm NUMERIC, p_accuracy NUMERIC, p_correct_chars INTEGER,
  p_incorrect_chars INTEGER, p_missed_chars INTEGER, p_extra_chars INTEGER,
  p_param TEXT, p_punctuation BOOLEAN, p_numbers BOOLEAN, p_earned_xp INTEGER,
  p_language_code TEXT DEFAULT 'en'
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  saved public.typing_results%ROWTYPE;
  inserted BOOLEAN := false;
  settlement_time TIMESTAMPTZ := clock_timestamp();
  total INTEGER := 0;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 72602));

  SELECT t.* INTO saved FROM public.typing_results t WHERE t.id = p_run_id;
  IF NOT FOUND THEN
    INSERT INTO public.typing_results (
      id, user_id, mode, duration, wpm, accuracy, correct_chars,
      incorrect_chars, missed_chars, extra_chars, param, punctuation, numbers, language_code, created_at
    ) VALUES (
      p_run_id, p_user_id, p_mode, p_duration, p_wpm, p_accuracy, p_correct_chars,
      p_incorrect_chars, p_missed_chars, p_extra_chars, p_param, p_punctuation, p_numbers, p_language_code, settlement_time
    ) ON CONFLICT (id) DO NOTHING RETURNING * INTO saved;
    inserted := FOUND;

    IF NOT inserted THEN
      SELECT t.* INTO saved FROM public.typing_results t WHERE t.id = p_run_id;
    END IF;
  END IF;

  IF saved.user_id IS DISTINCT FROM p_user_id OR saved.wpm IS DISTINCT FROM p_wpm OR saved.duration IS DISTINCT FROM p_duration THEN
    RAISE EXCEPTION 'Run ID conflicts with an existing result' USING ERRCODE = '23505';
  END IF;

  IF inserted THEN
    INSERT INTO public.daily_stats (user_id, date, tests_completed, practice_minutes, average_wpm, best_wpm, average_accuracy, updated_at)
    VALUES (p_user_id, (settlement_time AT TIME ZONE 'UTC')::date, 1, p_duration / 60.0, p_wpm, p_wpm, p_accuracy, clock_timestamp())
    ON CONFLICT (user_id, date) DO UPDATE SET
      tests_completed = public.daily_stats.tests_completed + 1,
      practice_minutes = public.daily_stats.practice_minutes + (p_duration / 60.0),
      average_wpm = (public.daily_stats.average_wpm * public.daily_stats.tests_completed + p_wpm) / (public.daily_stats.tests_completed + 1),
      best_wpm = greatest(public.daily_stats.best_wpm, p_wpm),
      average_accuracy = (public.daily_stats.average_accuracy * public.daily_stats.tests_completed + p_accuracy) / (public.daily_stats.tests_completed + 1),
      updated_at = clock_timestamp();

    INSERT INTO public.player_streaks (user_id, total_xp, updated_at)
    VALUES (p_user_id, p_earned_xp, clock_timestamp())
    ON CONFLICT (user_id) DO UPDATE SET
      total_xp = public.player_streaks.total_xp + p_earned_xp, updated_at = clock_timestamp()
    RETURNING total_xp INTO total;
  ELSE
    SELECT s.total_xp INTO total FROM public.player_streaks s WHERE s.user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object('record', to_jsonb(saved), 'earnedXp', CASE WHEN inserted THEN p_earned_xp ELSE 0 END, 'totalXp', coalesce(total, 0), 'idempotent', NOT inserted);
END;
$$;
