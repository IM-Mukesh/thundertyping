-- Requires 20261004010000_atomic_game_settlement.sql first. Prepared only:
-- review the schema and approve application separately from this game change.
-- Preserve the existing transaction/metrics/ownership/XP policy; register one ID.
BEGIN;

CREATE OR REPLACE FUNCTION public.settle_game_run(
  p_user_id UUID, p_run_id UUID, p_game_id TEXT, p_variant TEXT,
  p_score BIGINT, p_cleared BIGINT, p_best_combo BIGINT, p_survived_ms BIGINT,
  p_wpm NUMERIC, p_accuracy NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  saved public.game_scores%ROWTYPE;
  best public.game_scores%ROWTYPE;
  previous_score BIGINT;
  awarded INTEGER := 0;
  total INTEGER := 0;
  inserted BOOLEAN := false;
  new_best BOOLEAN := false;
  settlement_time TIMESTAMPTZ := clock_timestamp();
BEGIN
  IF p_user_id IS NULL OR p_run_id IS NULL OR p_game_id IS NULL OR p_variant IS NULL
     OR p_game_id NOT IN ('falling-words', 'word-rain', 'word-blaster', 'typing-grand-prix',
       'boss-battle', 'combo-rush', 'spellbound', 'typing-survivor', 'ghost-racer', 'card-battle', 'fruit-fury', 'rakshasa-war')
     OR p_score IS NULL OR p_cleared IS NULL OR p_best_combo IS NULL OR p_survived_ms IS NULL
     OR p_score < 0 OR p_cleared < 0 OR p_best_combo < 0 OR p_survived_ms < 0
     OR p_score > 9007199254740991 OR p_cleared > 9007199254740991
     OR p_best_combo > 9007199254740991 OR p_survived_ms > 9007199254740991
     OR (p_wpm IS NOT NULL AND (p_wpm < 0 OR p_wpm > 9007199254740991))
     OR (p_accuracy IS NOT NULL AND (p_accuracy < 0 OR p_accuracy > 100))
     OR NOT (p_variant = '' OR (length(p_variant) <= 96 AND p_variant ~ '^[a-z0-9]+([:-][a-z0-9]+)*$')) THEN
    RAISE EXCEPTION 'Invalid game result' USING ERRCODE = '22023';
  END IF;

  -- Serialize game settlement per account, including best comparisons. Other
  -- progress writers still coordinate through atomic row updates/CAS.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 72601));

  SELECT g.* INTO saved FROM public.game_scores g WHERE g.id = p_run_id;
  IF NOT FOUND THEN
    SELECT g.score INTO previous_score FROM public.game_scores g
      WHERE g.user_id = p_user_id AND g.game_id = p_game_id AND g.variant = p_variant
      ORDER BY g.score DESC LIMIT 1;

    -- XP is a bounded progression policy, not a claim that metrics were verified.
    awarded := greatest(5, least(150,
      CASE WHEN p_game_id = 'fruit-fury' THEN round(p_score::numeric / 15) + least(40, p_cleared * 2)
           WHEN p_game_id IN ('card-battle', 'spellbound') THEN round(p_score::numeric / 8) + least(40, p_cleared * 5)
           ELSE round(p_score::numeric / 10) + least(40, p_cleared * 2) END))::integer;

    INSERT INTO public.game_scores (id, user_id, game_id, variant, score, cleared, best_combo,
      survived_ms, wpm, accuracy, created_at, settlement_version, earned_xp)
    VALUES (p_run_id, p_user_id, p_game_id, p_variant, p_score, p_cleared, p_best_combo,
      p_survived_ms, p_wpm, p_accuracy, settlement_time, 1, awarded)
    ON CONFLICT (id) DO NOTHING RETURNING * INTO saved;
    inserted := FOUND;
    -- A different account can race the same UUID; never acknowledge its row.
    IF NOT inserted THEN
      SELECT g.* INTO saved FROM public.game_scores g WHERE g.id = p_run_id;
    END IF;
  END IF;

  IF saved.user_id IS DISTINCT FROM p_user_id OR saved.game_id IS DISTINCT FROM p_game_id
     OR saved.variant IS DISTINCT FROM p_variant OR saved.score IS DISTINCT FROM p_score
     OR saved.cleared IS DISTINCT FROM p_cleared OR saved.best_combo IS DISTINCT FROM p_best_combo
     OR saved.survived_ms IS DISTINCT FROM p_survived_ms OR saved.wpm IS DISTINCT FROM p_wpm
     OR saved.accuracy IS DISTINCT FROM p_accuracy THEN
    RAISE EXCEPTION 'Run ID conflicts with an existing result' USING ERRCODE = '23505';
  END IF;

  IF inserted THEN
    new_best := previous_score IS NULL OR p_score > previous_score;
    INSERT INTO public.daily_stats (user_id, date, games_played, updated_at)
    VALUES (p_user_id, (settlement_time AT TIME ZONE 'UTC')::date, 1, clock_timestamp())
    ON CONFLICT (user_id, date) DO UPDATE SET
      games_played = public.daily_stats.games_played + 1, updated_at = clock_timestamp();

    INSERT INTO public.player_streaks (user_id, total_xp, updated_at)
    VALUES (p_user_id, awarded, clock_timestamp())
    ON CONFLICT (user_id) DO UPDATE SET
      total_xp = public.player_streaks.total_xp + EXCLUDED.total_xp, updated_at = clock_timestamp()
    RETURNING total_xp INTO total;
  ELSE
    -- Includes pre-migration rows: their prior settlement status is unknowable,
    -- so a retry must never award XP or daily counts again.
    awarded := 0;
    SELECT s.total_xp INTO total FROM public.player_streaks s WHERE s.user_id = p_user_id;
  END IF;

  SELECT g.* INTO best FROM public.game_scores g
    WHERE g.user_id = p_user_id AND g.game_id = p_game_id AND g.variant = p_variant
    ORDER BY g.score DESC, g.created_at, g.id LIMIT 1;
  RETURN jsonb_build_object('record', to_jsonb(saved), 'best', to_jsonb(best),
    'isNewBest', new_best, 'earnedXp', awarded, 'totalXp', coalesce(total, 0), 'idempotent', NOT inserted);
END;
$$;

REVOKE ALL ON FUNCTION public.settle_game_run(UUID, UUID, TEXT, TEXT, BIGINT, BIGINT, BIGINT, BIGINT, NUMERIC, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_game_run(UUID, UUID, TEXT, TEXT, BIGINT, BIGINT, BIGINT, BIGINT, NUMERIC, NUMERIC) TO service_role;

COMMIT;
