select
  id,
  lesson_key,
  title,
  description,
  order_index
from public.lessons
where language_code = 'de'
order by order_index;