select
  language_code,
  count(*) as typing_text_count
from public.typing_texts
group by language_code
order by language_code;