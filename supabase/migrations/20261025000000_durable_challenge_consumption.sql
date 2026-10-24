-- Migration: 20261025000000_durable_challenge_consumption.sql
-- Dedicated durable single-use challenge consumption registry.
-- Forward-compatible and safe.
-- NOTE: DO NOT APPLY AUTOMATICALLY TO PRODUCTION WITHOUT AUTHORIZATION.

BEGIN;

CREATE TABLE IF NOT EXISTS public.consumed_challenges (
  challenge_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_id UUID NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('game', 'typing')),
  consumed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.consumed_challenges ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'consumed_challenges'
      AND policyname = 'Service role manages consumed_challenges'
  ) THEN
    CREATE POLICY "Deny anon access on consumed_challenges" ON public.consumed_challenges FOR ALL TO anon USING (false);
    CREATE POLICY "Deny authenticated access on consumed_challenges" ON public.consumed_challenges FOR ALL TO authenticated USING (false);
    CREATE POLICY "Service role manages consumed_challenges" ON public.consumed_challenges FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.consume_challenge_atomic(
  p_challenge_id TEXT,
  p_user_id UUID,
  p_run_id UUID,
  p_domain TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.consumed_challenges (challenge_id, user_id, run_id, domain, consumed_at)
  VALUES (p_challenge_id, p_user_id, p_run_id, p_domain, clock_timestamp());
  RETURN true;
EXCEPTION WHEN unique_violation THEN
  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_challenge_atomic(TEXT, UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_challenge_atomic(TEXT, UUID, UUID, TEXT) TO service_role;

COMMIT;
