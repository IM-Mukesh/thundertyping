select
  text,
  author
from public.quotes
where language_code = 'de'
order by id;