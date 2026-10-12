select language_code, count(*)
from public.vocabulary_items
group by language_code
order by language_code;