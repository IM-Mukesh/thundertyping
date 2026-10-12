select
  code,
  name,
  native_name,
  enabled,
  sort_order
from public.languages
order by sort_order;