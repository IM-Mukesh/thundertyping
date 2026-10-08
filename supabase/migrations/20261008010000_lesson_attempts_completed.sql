-- ==============================================================================
-- HeroTyping — A01 Fix: Add completed to lesson_attempts
-- ==============================================================================

ALTER TABLE public.lesson_attempts
  ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false NOT NULL;
