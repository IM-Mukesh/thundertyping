-- Fixes a real race condition in the Postgres-tier rate limiter
-- (src/lib/server/rate-limit.ts): the previous application-side logic did
-- SELECT count -> compute count+1 in JS -> UPDATE count, which is a classic
-- non-atomic read-modify-write. Two concurrent requests can both read the
-- same old count, both compute the same new count, and both write it back --
-- one increment is silently lost, so under concurrent load the limiter
-- undercounts requests and the real rate limit is weaker than configured.
--
-- This function performs the read, the conditional-reset-or-increment
-- decision, and the write as ONE statement (a single INSERT ... ON CONFLICT
-- DO UPDATE), which Postgres executes under a single row-level lock -- two
-- concurrent calls for the same key are serialized by the database itself,
-- not by application code, so no increment can be lost.
--
-- SECURITY DEFINER is required because api_rate_limits has no RLS policies
-- for any role (by design -- see 20261002000000_security_hardening.sql),
-- so a function callable by the app's Supabase client (which may run with
-- the anon/authenticated role depending on context) needs to run with the
-- privileges of its owner to read/write the table. search_path is pinned to
-- prevent search-path hijacking, the standard hardening for SECURITY
-- DEFINER functions.
CREATE OR REPLACE FUNCTION public.rate_limit_increment(
  p_key TEXT,
  p_window_seconds INTEGER
) RETURNS TABLE(count INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_new_reset_at TIMESTAMPTZ := clock_timestamp() + make_interval(secs => p_window_seconds);
BEGIN
  RETURN QUERY
  INSERT INTO public.api_rate_limits AS t (key, count, reset_at)
  VALUES (p_key, 1, v_new_reset_at)
  ON CONFLICT (key) DO UPDATE SET
    -- Window expired: this call starts a fresh window at count 1.
    -- Window still open: this call is the next request in it, +1.
    -- The CASE is evaluated against the row Postgres already holds locked
    -- for this UPDATE, not a value read in a prior statement, so there is
    -- no window for a second concurrent caller to observe stale state.
    count = CASE WHEN t.reset_at <= v_now THEN 1 ELSE t.count + 1 END,
    reset_at = CASE WHEN t.reset_at <= v_now THEN v_new_reset_at ELSE t.reset_at END
  RETURNING t.count, t.reset_at;
END;
$$;

-- Only the server's admin client (service_role) calls this -- see
-- checkPostgresRateLimit in src/lib/server/rate-limit.ts -- so it's revoked
-- from anon/authenticated the same way direct table access already is.
REVOKE ALL ON FUNCTION public.rate_limit_increment(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_increment(TEXT, INTEGER) TO service_role;
