select
  ls.id,
  ls.lesson_id,
  ls.step_order,
  ls.practice_type,
  ls.target_text,
  ls.target_keys
from public.lesson_steps ls
join public.lessons l
  on l.id = ls.lesson_id
where l.language_code = 'de'
order by ls.step_order;