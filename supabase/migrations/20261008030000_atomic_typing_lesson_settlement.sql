BEGIN;

CREATE FUNCTION public.settle_typing_run(
  p_run_id UUID, p_user_id UUID, p_mode TEXT, p_duration NUMERIC,
  p_wpm NUMERIC, p_accuracy NUMERIC, p_correct_chars INTEGER,
  p_incorrect_chars INTEGER, p_missed_chars INTEGER, p_extra_chars INTEGER,
  p_param TEXT, p_punctuation BOOLEAN, p_numbers BOOLEAN, p_earned_xp INTEGER
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
      incorrect_chars, missed_chars, extra_chars, param, punctuation, numbers, created_at
    ) VALUES (
      p_run_id, p_user_id, p_mode, p_duration, p_wpm, p_accuracy, p_correct_chars,
      p_incorrect_chars, p_missed_chars, p_extra_chars, p_param, p_punctuation, p_numbers, settlement_time
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

REVOKE ALL ON FUNCTION public.settle_typing_run(UUID, UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, INTEGER, INTEGER, INTEGER, INTEGER, TEXT, BOOLEAN, BOOLEAN, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_typing_run(UUID, UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, INTEGER, INTEGER, INTEGER, INTEGER, TEXT, BOOLEAN, BOOLEAN, INTEGER) TO service_role;

COMMIT;
