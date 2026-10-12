select language_code, count(*)
from public.quotes
group by language_code
order by language_code;