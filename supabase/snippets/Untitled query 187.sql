select
  l.language_code,
  count(ls.id) as step_count
from public.lessons l
left join public.lesson_steps ls
  on ls.lesson_id = l.id
group by l.language_code
order by l.language_code;