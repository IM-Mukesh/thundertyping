-- ==============================================================================
-- HeroTyping — Part 1 Core Data Integrity & Settlement Hardening
-- Forward Migration (Safe & Idempotent, Forward-Compatible)
-- NOTE: DO NOT APPLY AUTOMATICALLY TO PRODUCTION WITHOUT AUTHORIZATION.
-- ==============================================================================

BEGIN;

-- 1. Settlement Receipts Table
-- Provides durable tracking of multi-stage progress settlement across retries.
CREATE TABLE IF NOT EXISTS public.settlement_receipts (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('typing_test', 'lesson_progress', 'game_score')),
  run_id UUID NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('received', 'primary_saved', 'aggregate_saved', 'rewards_saved', 'complete')),
  earned_xp INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, event_type, run_id)
);

ALTER TABLE public.settlement_receipts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'settlement_receipts'
      AND policyname = 'Users can view their own settlement receipts'
  ) THEN
    CREATE POLICY "Users can view their own settlement receipts"
      ON public.settlement_receipts
      FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_settlement_receipts_user_run
  ON public.settlement_receipts(user_id, run_id);

-- 2. Indexes for All-Time Personal Bests & Ranked Queries
CREATE INDEX IF NOT EXISTS idx_typing_results_user_bucket_pb
  ON public.typing_results (user_id, mode, param, punctuation, numbers, wpm DESC, accuracy DESC);

CREATE INDEX IF NOT EXISTS idx_typing_results_user_wpm_desc
  ON public.typing_results (user_id, wpm DESC);

-- 3. All-Time Personal Bests Aggregation Function (F05)
-- Returns the true all-time best score per mode/configuration partition for a user.
CREATE OR REPLACE FUNCTION public.get_typing_bests(p_user_id UUID)
RETURNS SETOF public.typing_results
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT DISTINCT ON (t.mode, COALESCE(t.param, ''), t.punctuation, t.numbers) t.*
  FROM public.typing_results t
  WHERE t.user_id = p_user_id
    AND t.mode IN ('time', 'words', 'quote', 'vocabulary')
  ORDER BY t.mode, COALESCE(t.param, ''), t.punctuation, t.numbers, t.wpm DESC, t.accuracy DESC, t.created_at ASC;
$$;

-- Revoke public access; only privileged server role may execute
REVOKE ALL ON FUNCTION public.get_typing_bests(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_typing_bests(UUID) TO service_role;

COMMIT;

-- ==============================================================================
-- ROLLBACK SCRIPT (IF NEEDED):
-- ==============================================================================
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.get_typing_bests(UUID);
-- DROP INDEX IF EXISTS public.idx_typing_results_user_wpm_desc;
-- DROP INDEX IF EXISTS public.idx_typing_results_user_bucket_pb;
-- DROP INDEX IF EXISTS public.idx_settlement_receipts_user_run;
-- DROP TABLE IF EXISTS public.settlement_receipts;
-- COMMIT;

