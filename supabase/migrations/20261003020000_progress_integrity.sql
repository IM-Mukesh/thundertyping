-- Enforce the same invariants as the API at the database boundary. NOT VALID
-- keeps deployments with historical rows safe while checking every new row.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_game_scores_survived_ms') THEN
    ALTER TABLE public.game_scores ADD CONSTRAINT chk_game_scores_survived_ms
      CHECK (survived_ms >= 1000) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_game_scores_integer_metrics') THEN
    ALTER TABLE public.game_scores ADD CONSTRAINT chk_game_scores_integer_metrics
      CHECK (score >= 0 AND cleared >= 0 AND best_combo >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_lesson_attempts_integer_metrics') THEN
    ALTER TABLE public.lesson_attempts ADD CONSTRAINT chk_lesson_attempts_integer_metrics
      CHECK (stars >= 0 AND stars <= 5) NOT VALID;
  END IF;
END $$;

-- The original schema already has unique_user_achievement and the run UUID is
-- the primary key on result tables; retain those constraints as the replay
-- protection for callers that supply a run id.
