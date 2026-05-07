-- Super-admin Phase 2: feature flags, platform billing invoices, templates, platform broadcasts

begin;

-- ---------------------------------------------------------------------------
-- Ensure super_admin can read audit logs and system settings (RLS)
-- ---------------------------------------------------------------------------

drop policy if exists audit_logs_admin_select on smartstay.audit_logs;
create policy audit_logs_admin_select
  on smartstay.audit_logs
  for select
  to authenticated
  using (
    private.is_admin(auth.uid())
    or private.is_super_admin(auth.uid())
  );

drop policy if exists system_settings_admin_select on smartstay.system_settings;
drop policy if exists system_settings_admin_insert on smartstay.system_settings;
drop policy if exists system_settings_admin_update on smartstay.system_settings;

create policy system_settings_admin_select
  on smartstay.system_settings
  for select
  to authenticated
  using (
    private.is_admin(auth.uid())
    or private.is_super_admin(auth.uid())
  );

create policy system_settings_admin_insert
  on smartstay.system_settings
  for insert
  to authenticated
  with check (
    private.is_admin(auth.uid())
    or private.is_super_admin(auth.uid())
  );

create policy system_settings_admin_update
  on smartstay.system_settings
  for update
  to authenticated
  using (
    private.is_admin(auth.uid())
    or private.is_super_admin(auth.uid())
  )
  with check (
    private.is_admin(auth.uid())
    or private.is_super_admin(auth.uid())
  );

-- ---------------------------------------------------------------------------
-- organization_feature_flags
-- ---------------------------------------------------------------------------

create table smartstay.organization_feature_flags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references smartstay.organizations (id) on delete cascade,
  flag_key text not null,
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (organization_id, flag_key)
);

create index idx_org_feature_flags_org on smartstay.organization_feature_flags (organization_id);

alter table smartstay.organization_feature_flags enable row level security;
alter table smartstay.organization_feature_flags force row level security;

revoke all on table smartstay.organization_feature_flags from anon, authenticated, public;
grant select, insert, update, delete on table smartstay.organization_feature_flags to authenticated;
grant all on table smartstay.organization_feature_flags to service_role;

drop policy if exists organization_feature_flags_super_admin_all on smartstay.organization_feature_flags;
create policy organization_feature_flags_super_admin_all
  on smartstay.organization_feature_flags
  for all
  to authenticated
  using (private.is_super_admin(auth.uid()))
  with check (private.is_super_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- platform_invoices (subscription / platform billing — not tenant invoices)
-- ---------------------------------------------------------------------------

create table smartstay.platform_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references smartstay.organizations (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  amount_due numeric(14, 2) not null default 0,
  paid_amount numeric(14, 2) not null default 0,
  currency text not null default 'VND',
  status text not null default 'pending'
    constraint platform_invoices_status_check check (status in ('pending', 'paid', 'overdue', 'cancelled')),
  due_date date,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_platform_invoices_org on smartstay.platform_invoices (organization_id);
create index idx_platform_invoices_status_due on smartstay.platform_invoices (status, due_date);

alter table smartstay.platform_invoices enable row level security;
alter table smartstay.platform_invoices force row level security;

revoke all on table smartstay.platform_invoices from anon, authenticated, public;
grant select, insert, update, delete on table smartstay.platform_invoices to authenticated;
grant all on table smartstay.platform_invoices to service_role;

drop policy if exists platform_invoices_super_admin_all on smartstay.platform_invoices;
create policy platform_invoices_super_admin_all
  on smartstay.platform_invoices
  for all
  to authenticated
  using (private.is_super_admin(auth.uid()))
  with check (private.is_super_admin(auth.uid()));

create trigger trg_platform_invoices_updated
  before update on smartstay.platform_invoices
  for each row execute function smartstay.trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- system_templates (global + per-org)
-- ---------------------------------------------------------------------------

create table smartstay.system_templates (
  id uuid primary key default gen_random_uuid(),
  kind text not null
    constraint system_templates_kind_check check (kind in ('contract', 'invoice_html', 'email_html')),
  slug text not null,
  name text not null,
  content text not null default '',
  is_default boolean not null default false,
  organization_id uuid references smartstay.organizations (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index system_templates_global_kind_slug_uidx
  on smartstay.system_templates (kind, slug)
  where organization_id is null;

create unique index system_templates_org_kind_slug_uidx
  on smartstay.system_templates (organization_id, kind, slug)
  where organization_id is not null;

create index idx_system_templates_kind on smartstay.system_templates (kind);
create index idx_system_templates_org on smartstay.system_templates (organization_id);

alter table smartstay.system_templates enable row level security;
alter table smartstay.system_templates force row level security;

revoke all on table smartstay.system_templates from anon, authenticated, public;
grant select, insert, update, delete on table smartstay.system_templates to authenticated;
grant all on table smartstay.system_templates to service_role;

drop policy if exists system_templates_super_admin_all on smartstay.system_templates;
create policy system_templates_super_admin_all
  on smartstay.system_templates
  for all
  to authenticated
  using (private.is_super_admin(auth.uid()))
  with check (private.is_super_admin(auth.uid()));

drop policy if exists system_templates_org_select on smartstay.system_templates;
create policy system_templates_org_select
  on smartstay.system_templates
  for select
  to authenticated
  using (
    organization_id is null
    or organization_id in (select smartstay.my_organization_ids())
  );

create trigger trg_system_templates_updated
  before update on smartstay.system_templates
  for each row execute function smartstay.trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- platform_broadcasts (super-admin email broadcasts; avoids name clash with announcements)
-- ---------------------------------------------------------------------------

create table smartstay.platform_broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  target_scope text not null default 'all'
    constraint platform_broadcasts_scope_check check (target_scope in ('all', 'orgs')),
  target_org_ids uuid[] not null default '{}',
  audience text not null default 'owners'
    constraint platform_broadcasts_audience_check check (audience in ('owners', 'owners_staff')),
  status text not null default 'draft'
    constraint platform_broadcasts_status_check check (status in ('draft', 'sent')),
  sent_at timestamptz,
  recipient_count integer not null default 0,
  created_by uuid references smartstay.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_platform_broadcasts_status on smartstay.platform_broadcasts (status, created_at desc);

alter table smartstay.platform_broadcasts enable row level security;
alter table smartstay.platform_broadcasts force row level security;

revoke all on table smartstay.platform_broadcasts from anon, authenticated, public;
grant select, insert, update, delete on table smartstay.platform_broadcasts to authenticated;
grant all on table smartstay.platform_broadcasts to service_role;

drop policy if exists platform_broadcasts_super_admin_all on smartstay.platform_broadcasts;
create policy platform_broadcasts_super_admin_all
  on smartstay.platform_broadcasts
  for all
  to authenticated
  using (private.is_super_admin(auth.uid()))
  with check (private.is_super_admin(auth.uid()));

create trigger trg_platform_broadcasts_updated
  before update on smartstay.platform_broadcasts
  for each row execute function smartstay.trigger_set_updated_at();

create trigger trg_org_feature_flags_updated
  before update on smartstay.organization_feature_flags
  for each row execute function smartstay.trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- Seed system_settings
-- ---------------------------------------------------------------------------

insert into smartstay.system_settings (key, value, group_name, description, is_sensitive)
values
  ('maintenance.enabled', 'false'::jsonb, 'platform', 'Bao tri toan he thong', false),
  (
    'maintenance.message',
    '"He thong dang bao tri. Vui long thu lai sau."'::jsonb,
    'platform',
    'Thong bao hien thi khi bao tri',
    false
  ),
  ('email.from_name', '"SmartStay"'::jsonb, 'platform', 'Ten hien thi gui email', false),
  ('email.from_address', '"noreply@smartstay.vn"'::jsonb, 'platform', 'Dia chi From (Resend da verify)', false),
  (
    'feature_flags.catalog',
    '[
      {"key":"beta_reports","label":"Bao cao beta","description":"Bat tinh nang bao cao nang cao"},
      {"key":"portal_ai_support","label":"Ho tro AI portal","description":"Goi y va chat AI trong portal"},
      {"key":"owner_bulk_import","label":"Nhap lieu hang loat","description":"Import phong/ hop dong tu Excel"}
    ]'::jsonb,
    'platform',
    'Danh muc feature flag (JSON array)',
    false
  ),
  ('platform_invoice.grace_days', '7'::jsonb, 'platform', 'So ngay sau due_date truoc khi danh dau overdue', false)
on conflict (key) do nothing;

commit;
