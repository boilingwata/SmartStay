set check_function_bodies = off;
set search_path = smartstay;

create extension if not exists pgcrypto with schema extensions;

create table if not exists smartstay.notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references smartstay.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'system',
  link text,
  is_read boolean not null default false,
  metadata jsonb,
  created_by uuid references smartstay.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists notifications_profile_created_idx
  on smartstay.notifications (profile_id, created_at desc);

create index if not exists notifications_profile_unread_idx
  on smartstay.notifications (profile_id, created_at desc)
  where is_read = false;

alter table smartstay.notifications enable row level security;

drop policy if exists notifications_select_own on smartstay.notifications;
create policy notifications_select_own
on smartstay.notifications
for select
to authenticated
using (profile_id = auth.uid());

drop policy if exists notifications_update_own on smartstay.notifications;
create policy notifications_update_own
on smartstay.notifications
for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

drop policy if exists notifications_management_all on smartstay.notifications;
create policy notifications_management_all
on smartstay.notifications
for all
to authenticated
using (
  exists (
    select 1
    from smartstay.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'manager', 'staff')
  )
)
with check (
  exists (
    select 1
    from smartstay.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'manager', 'staff')
  )
);
