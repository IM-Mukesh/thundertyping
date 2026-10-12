BEGIN;

-- Insert German into languages table
INSERT INTO public.languages (code, name, native_name, enabled, sort_order)
VALUES ('de', 'German', 'Deutsch', true, 2)
ON CONFLICT (code) DO UPDATE SET enabled = true;

-- German Quotes
INSERT INTO public.quotes (id, language_code, text, author, difficulty, status)
VALUES
  (gen_random_uuid(), 'de', 'Das Leben ist wie Fahrrad fahren. Um die Balance zu halten, musst du in Bewegung bleiben.', 'Albert Einstein', 'short', 'published'),
  (gen_random_uuid(), 'de', 'Zwei Dinge sind unendlich, das Universum und die menschliche Dummheit, aber bei dem Universum bin ich mir noch nicht ganz sicher.', 'Albert Einstein', 'long', 'published'),
  (gen_random_uuid(), 'de', 'Wer aufhört, besser werden zu wollen, hört auf, gut zu sein.', 'Marie von Ebner-Eschenbach', 'medium', 'published'),
  (gen_random_uuid(), 'de', 'Phantasie ist wichtiger als Wissen, denn Wissen ist begrenzt.', 'Albert Einstein', 'medium', 'published'),
  (gen_random_uuid(), 'de', 'Man sieht nur mit dem Herzen gut. Das Wesentliche ist für die Augen unsichtbar.', 'Antoine de Saint-Exupéry', 'medium', 'published')
ON CONFLICT DO NOTHING;

-- German Vocabulary (Easy)
INSERT INTO public.vocabulary_items (language_code, word, normalized_word, difficulty, part_of_speech, meaning, frequency_rank, status)
VALUES
  ('de', 'Haus', 'haus', 'easy', 'n.', 'Gebäude, in dem Menschen leben', 1, 'published'),
  ('de', 'Katze', 'katze', 'easy', 'n.', 'Ein kleines, pelziges Haustier', 2, 'published'),
  ('de', 'Hund', 'hund', 'easy', 'n.', 'Ein vierbeiniges Haustier, das bellt', 3, 'published'),
  ('de', 'Baum', 'baum', 'easy', 'n.', 'Eine große Pflanze mit einem Holzstamm', 4, 'published'),
  ('de', 'Auto', 'auto', 'easy', 'n.', 'Ein motorisiertes Fahrzeug für den Straßenverkehr', 5, 'published')
ON CONFLICT DO NOTHING;

-- German Vocabulary (Medium/Hard - containing Umlauts and ß for testing Phase 10)
INSERT INTO public.vocabulary_items (language_code, word, normalized_word, difficulty, part_of_speech, meaning, frequency_rank, status)
VALUES
  ('de', 'Großartig', 'grossartig', 'medium', 'adj.', 'Sehr gut, fantastisch', 6, 'published'),
  ('de', 'Überraschung', 'uberraschung', 'medium', 'n.', 'Ein unerwartetes Ereignis', 7, 'published'),
  ('de', 'Ästhetik', 'asthetik', 'hard', 'n.', 'Lehre von der Wahrnehmung oder Schönheit', 8, 'published'),
  ('de', 'Öffentlichkeit', 'offentlichkeit', 'hard', 'n.', 'Alle Leute in einer Gesellschaft', 9, 'published')
ON CONFLICT DO NOTHING;

-- Basic German Lessons
DO $$
DECLARE
  lesson_id UUID;
BEGIN
  INSERT INTO public.lessons (lesson_key, language_code, title, description, order_index, difficulty, tier, stage, new_keys, min_accuracy, status)
  VALUES ('grundlagen-1', 'de', 'Die Grundreihe', 'Lerne die mittlere Tastenreihe kennen: A S D F J K L Ö', 1, 'beginner', '1', '1', ARRAY['a','s','d','f','j','k','l','ö'], 90, 'published')
  RETURNING id INTO lesson_id;

  INSERT INTO public.lesson_steps (lesson_id, step_order, practice_type, target_text)
  VALUES
    (lesson_id, 1, 'letters', 'asdf jklö asdf jklö'),
    (lesson_id, 2, 'letters', 'fasd ölkj fasd ölkj');
END $$;

COMMIT;
