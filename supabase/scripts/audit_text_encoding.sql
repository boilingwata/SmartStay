-- Audit likely mojibake in UI-facing text columns.
-- Run in Supabase SQL Editor or via psql before doing any data repair.

with suspect_rows as (
  select
    'profiles' as table_name,
    id::text as row_id,
    'full_name' as column_name,
    full_name as value
  from profiles
  where coalesce(full_name, '') ~ '(Ã.|Ä.|Æ.|á».|áº.|â€.|Â[[:space:][:punct:]])'

  union all

  select
    'tenants',
    id::text,
    'full_name',
    full_name
  from tenants
  where coalesce(full_name, '') ~ '(Ã.|Ä.|Æ.|á».|áº.|â€.|Â[[:space:][:punct:]])'

  union all

  select
    'tenants',
    id::text,
    'permanent_address',
    permanent_address
  from tenants
  where coalesce(permanent_address, '') ~ '(Ã.|Ä.|Æ.|á».|áº.|â€.|Â[[:space:][:punct:]])'

  union all

  select
    'buildings',
    id::text,
    'name',
    name
  from buildings
  where coalesce(name, '') ~ '(Ã.|Ä.|Æ.|á».|áº.|â€.|Â[[:space:][:punct:]])'

  union all

  select
    'buildings',
    id::text,
    'address',
    address
  from buildings
  where coalesce(address, '') ~ '(Ã.|Ä.|Æ.|á».|áº.|â€.|Â[[:space:][:punct:]])'

  union all

  select
    'buildings',
    id::text,
    'description',
    description
  from buildings
  where coalesce(description, '') ~ '(Ã.|Ä.|Æ.|á».|áº.|â€.|Â[[:space:][:punct:]])'

  union all

  select
    'services',
    id::text,
    'name',
    name
  from services
  where coalesce(name, '') ~ '(Ã.|Ä.|Æ.|á».|áº.|â€.|Â[[:space:][:punct:]])'

  union all

  select
    'rental_applications',
    id::text,
    'notes',
    notes
  from rental_applications
  where coalesce(notes, '') ~ '(Ã.|Ä.|Æ.|á».|áº.|â€.|Â[[:space:][:punct:]])'
)
select *
from suspect_rows
order by table_name, row_id, column_name;
