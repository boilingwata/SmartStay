set check_function_bodies = off;
set search_path = smartstay, public;

create table if not exists smartstay.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references smartstay.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'admin_message',
  link text,
  is_read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references smartstay.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists notifications_profile_created_at_idx
  on smartstay.notifications(profile_id, created_at desc);

create index if not exists notifications_profile_is_read_idx
  on smartstay.notifications(profile_id, is_read);

alter table smartstay.notifications enable row level security;

drop policy if exists notifications_tenant_read_self on smartstay.notifications;
create policy notifications_tenant_read_self
on smartstay.notifications
for select
to authenticated
using (profile_id = auth.uid());

drop policy if exists notifications_tenant_update_self on smartstay.notifications;
create policy notifications_tenant_update_self
on smartstay.notifications
for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

drop policy if exists notifications_management_select_all on smartstay.notifications;
create policy notifications_management_select_all
on smartstay.notifications
for select
to authenticated
using (
  exists (
    select 1
    from smartstay.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'manager', 'staff')
  )
);

drop policy if exists notifications_management_insert on smartstay.notifications;
create policy notifications_management_insert
on smartstay.notifications
for insert
to authenticated
with check (
  exists (
    select 1
    from smartstay.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'manager', 'staff')
  )
);

grant select, insert, update on smartstay.notifications to authenticated;
