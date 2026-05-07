-- Super-admin: organizations, subscription plans, organization members, profiles.organization_id

begin;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table smartstay.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  monthly_price numeric(12, 2) not null default 0,
  building_limit integer not null default 999999,
  room_limit integer not null default 999999,
  user_limit integer not null default 999999,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table smartstay.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  status text not null default 'active'
    constraint organizations_status_check check (status in ('active', 'suspended', 'archived')),
  plan_id uuid references smartstay.subscription_plans (id) on delete set null,
  primary_owner_id uuid references smartstay.profiles (id) on delete set null,
  suspended_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_organizations_status on smartstay.organizations (status);
create index idx_organizations_plan_id on smartstay.organizations (plan_id);

create table smartstay.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references smartstay.organizations (id) on delete cascade,
  user_id uuid not null references smartstay.profiles (id) on delete cascade,
  member_role text not null default 'owner'
    constraint organization_members_role_check check (member_role in ('owner', 'admin', 'staff', 'viewer')),
  invited_by uuid references smartstay.profiles (id) on delete set null,
  invited_at timestamptz,
  joined_at timestamptz default now(),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index idx_organization_members_user on smartstay.organization_members (user_id);
create index idx_organization_members_org on smartstay.organization_members (organization_id);

alter table smartstay.profiles
  add column if not exists organization_id uuid references smartstay.organizations (id) on delete set null;

create index if not exists idx_profiles_organization_id on smartstay.profiles (organization_id);

-- ---------------------------------------------------------------------------
-- Triggers (updated_at)
-- ---------------------------------------------------------------------------

create trigger trg_subscription_plans_updated
  before update on smartstay.subscription_plans
  for each row execute function smartstay.trigger_set_updated_at();

create trigger trg_organizations_updated
  before update on smartstay.organizations
  for each row execute function smartstay.trigger_set_updated_at();

create trigger trg_organization_members_updated
  before update on smartstay.organization_members
  for each row execute function smartstay.trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- Seed subscription plans
-- ---------------------------------------------------------------------------

insert into smartstay.subscription_plans (slug, name, description, monthly_price, building_limit, room_limit, user_limit)
values
  ('free', 'Free', 'Gói dùng thử / khởi đầu', 0, 1, 50, 3),
  ('starter', 'Starter', 'Cho đội nhỏ', 499000, 3, 200, 10),
  ('pro', 'Pro', 'Vận hành nhiều tòa', 1499000, 15, 2000, 50),
  ('enterprise', 'Enterprise', 'Không giới hạn thực tế (theo hợp đồng)', 0, 999999, 999999, 999999);

-- ---------------------------------------------------------------------------
-- Helper: organization IDs the current user belongs to (active membership)
-- ---------------------------------------------------------------------------

create or replace function smartstay.my_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = smartstay, private
as $$
  select m.organization_id
  from smartstay.organization_members m
  where m.user_id = auth.uid()
    and m.is_active = true;
$$;

revoke all on function smartstay.my_organization_ids() from public;
grant execute on function smartstay.my_organization_ids() to authenticated;
grant execute on function smartstay.my_organization_ids() to service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table smartstay.subscription_plans enable row level security;
alter table smartstay.subscription_plans force row level security;

alter table smartstay.organizations enable row level security;
alter table smartstay.organizations force row level security;

alter table smartstay.organization_members enable row level security;
alter table smartstay.organization_members force row level security;

revoke all on table smartstay.subscription_plans from anon, authenticated, public;
revoke all on table smartstay.organizations from anon, authenticated, public;
revoke all on table smartstay.organization_members from anon, authenticated, public;

grant select, insert, update, delete on table smartstay.subscription_plans to authenticated;
grant select, insert, update, delete on table smartstay.organizations to authenticated;
grant select, insert, update, delete on table smartstay.organization_members to authenticated;

grant all on table smartstay.subscription_plans to service_role;
grant all on table smartstay.organizations to service_role;
grant all on table smartstay.organization_members to service_role;

-- Plans: everyone authenticated can read active plans; super_admin full CRUD
drop policy if exists subscription_plans_select_authenticated on smartstay.subscription_plans;
create policy subscription_plans_select_authenticated
  on smartstay.subscription_plans
  for select
  to authenticated
  using (
    coalesce(is_active, true) = true
    or private.is_super_admin(auth.uid())
  );

drop policy if exists subscription_plans_super_admin_all on smartstay.subscription_plans;
create policy subscription_plans_super_admin_all
  on smartstay.subscription_plans
  for all
  to authenticated
  using (private.is_super_admin(auth.uid()))
  with check (private.is_super_admin(auth.uid()));

-- Organizations
drop policy if exists organizations_select_scope on smartstay.organizations;
create policy organizations_select_scope
  on smartstay.organizations
  for select
  to authenticated
  using (
    private.is_super_admin(auth.uid())
    or id in (select smartstay.my_organization_ids())
  );

drop policy if exists organizations_super_admin_insert on smartstay.organizations;
create policy organizations_super_admin_insert
  on smartstay.organizations
  for insert
  to authenticated
  with check (private.is_super_admin(auth.uid()));

drop policy if exists organizations_super_admin_update on smartstay.organizations;
create policy organizations_super_admin_update
  on smartstay.organizations
  for update
  to authenticated
  using (private.is_super_admin(auth.uid()))
  with check (private.is_super_admin(auth.uid()));

drop policy if exists organizations_super_admin_delete on smartstay.organizations;
create policy organizations_super_admin_delete
  on smartstay.organizations
  for delete
  to authenticated
  using (private.is_super_admin(auth.uid()));

-- Organization members
drop policy if exists organization_members_select_scope on smartstay.organization_members;
create policy organization_members_select_scope
  on smartstay.organization_members
  for select
  to authenticated
  using (
    private.is_super_admin(auth.uid())
    or user_id = auth.uid()
    or organization_id in (select smartstay.my_organization_ids())
  );

drop policy if exists organization_members_super_admin_all on smartstay.organization_members;
create policy organization_members_super_admin_all
  on smartstay.organization_members
  for all
  to authenticated
  using (private.is_super_admin(auth.uid()))
  with check (private.is_super_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- Backfill: default org + link existing owners
-- ---------------------------------------------------------------------------

do $$
declare
  v_plan_free uuid;
  v_org_id uuid;
  r record;
begin
  select id into v_plan_free
  from smartstay.subscription_plans
  where slug = 'free'
  limit 1;

  insert into smartstay.organizations (name, slug, description, status, plan_id)
  values (
    'Default Workspace',
    'default-workspace',
    'Tổ chức mặc định cho dữ liệu hiện có',
    'active',
    v_plan_free
  )
  on conflict (slug) do nothing;

  select id into v_org_id
  from smartstay.organizations
  where slug = 'default-workspace'
  limit 1;

  if v_org_id is null then
    return;
  end if;

  -- Primary owner: earliest owner profile by created_at
  update smartstay.organizations o
  set primary_owner_id = sub.pid
  from (
    select id as pid
    from smartstay.profiles
    where role = 'owner'
    order by created_at nulls last
    limit 1
  ) sub
  where o.id = v_org_id
    and o.primary_owner_id is null;

  -- Membership + profile.organization_id for every owner profile
  for r in
    select id from smartstay.profiles where role = 'owner'
  loop
    insert into smartstay.organization_members (organization_id, user_id, member_role, joined_at, is_active)
    values (v_org_id, r.id, 'owner', now(), true)
    on conflict (organization_id, user_id) do nothing;

    update smartstay.profiles
    set organization_id = v_org_id
    where id = r.id
      and organization_id is null;
  end loop;
end;
$$;

commit;
