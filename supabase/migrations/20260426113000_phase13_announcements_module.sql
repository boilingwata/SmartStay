create or replace function private.current_tenant_building_ids(p_user_id uuid)
returns integer[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(distinct scoped.building_id order by scoped.building_id), '{}'::integer[])
  from (
    select r.building_id
    from smartstay.contracts c
    join smartstay.rooms r on r.id = c.room_id
    join smartstay.tenants t on t.id = c.primary_tenant_id
    where t.profile_id = p_user_id
      and coalesce(t.is_deleted, false) = false
      and coalesce(c.is_deleted, false) = false
      and coalesce(r.is_deleted, false) = false
      and c.status = 'active'::smartstay.contract_status
      and (c.start_date is null or c.start_date <= current_date)
      and (c.end_date is null or c.end_date >= current_date)
      and r.building_id is not null

    union

    select r.building_id
    from smartstay.contracts c
    join smartstay.rooms r on r.id = c.room_id
    join smartstay.room_occupants ro on ro.contract_id = c.id
    join smartstay.tenants t on t.id = ro.tenant_id
    where t.profile_id = p_user_id
      and coalesce(t.is_deleted, false) = false
      and coalesce(c.is_deleted, false) = false
      and coalesce(r.is_deleted, false) = false
      and c.status = 'active'::smartstay.contract_status
      and (c.start_date is null or c.start_date <= current_date)
      and (c.end_date is null or c.end_date >= current_date)
      and r.building_id is not null

    union

    select r.building_id
    from smartstay.contracts c
    join smartstay.rooms r on r.id = c.room_id
    join smartstay.contract_tenants ct on ct.contract_id = c.id
    join smartstay.tenants t on t.id = ct.tenant_id
    where t.profile_id = p_user_id
      and coalesce(t.is_deleted, false) = false
      and coalesce(c.is_deleted, false) = false
      and coalesce(r.is_deleted, false) = false
      and c.status = 'active'::smartstay.contract_status
      and (c.start_date is null or c.start_date <= current_date)
      and (c.end_date is null or c.end_date >= current_date)
      and r.building_id is not null
  ) as scoped;
$$;

create table if not exists smartstay.announcements (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null,
  content text not null,
  type text not null default 'general',
  status text not null default 'draft',
  publish_at timestamptz null,
  is_pinned boolean not null default false,
  target_groups text[] not null default array['resident']::text[],
  building_ids integer[] not null default '{}'::integer[],
  created_by uuid null references smartstay.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint announcements_type_check
    check (type = any (array['general', 'maintenance', 'security', 'event', 'holiday', 'urgent']::text[])),
  constraint announcements_status_check
    check (status = any (array['draft', 'published', 'scheduled', 'archived']::text[])),
  constraint announcements_target_groups_not_empty
    check (cardinality(target_groups) > 0),
  constraint announcements_scheduled_requires_publish_at
    check (status <> 'scheduled' or publish_at is not null)
);

create index if not exists announcements_status_publish_idx
  on smartstay.announcements (status, publish_at desc, created_at desc);

create index if not exists announcements_target_groups_gin_idx
  on smartstay.announcements
  using gin (target_groups);

create index if not exists announcements_building_ids_gin_idx
  on smartstay.announcements
  using gin (building_ids);

drop trigger if exists set_announcements_updated_at on smartstay.announcements;
create trigger set_announcements_updated_at
before update on smartstay.announcements
for each row
execute function smartstay.trigger_set_updated_at();

alter table smartstay.announcements enable row level security;

grant select, insert, update, delete on smartstay.announcements to authenticated;
grant select, insert, update, delete on smartstay.announcements to service_role;

drop policy if exists announcements_management_all on smartstay.announcements;
create policy announcements_management_all
on smartstay.announcements
for all
to authenticated
using (
  (select private.is_workspace_operator((select auth.uid() as uid)) as is_admin)
)
with check (
  (select private.is_workspace_operator((select auth.uid() as uid)) as is_admin)
);

drop policy if exists announcements_portal_select on smartstay.announcements;
create policy announcements_portal_select
on smartstay.announcements
for select
to authenticated
using (
  status = 'published'
  and (publish_at is null or publish_at <= now())
  and 'resident' = any (target_groups)
  and (
    cardinality(building_ids) = 0
    or building_ids && private.current_tenant_building_ids((select auth.uid() as uid))
  )
);
