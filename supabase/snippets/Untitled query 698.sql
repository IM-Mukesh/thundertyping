select
  language_code,
  count(*) as lesson_count
from public.lessons
group by language_code
order by language_code;