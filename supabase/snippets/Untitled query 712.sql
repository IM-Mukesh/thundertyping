select
  word,
  difficulty,
  category
from public.vocabulary_items
where language_code = 'de'
order by id;