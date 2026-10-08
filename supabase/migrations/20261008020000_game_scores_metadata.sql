-- ==============================================================================
-- HeroTyping — A13 Fix: Add metadata to game_scores
-- ==============================================================================

ALTER TABLE public.game_scores
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb NOT NULL;
