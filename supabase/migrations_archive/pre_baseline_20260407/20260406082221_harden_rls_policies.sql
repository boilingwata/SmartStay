begin;

set check_function_bodies = off;

create schema if not exists private;

create or replace function private.is_admin(user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from smartstay.profiles
    where id = user_id
      and role::text in ('admin', 'manager', 'staff', 'landlord')
  );
$$;

create or replace function private.is_tenant_profile(p_tenant_id integer, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from smartstay.tenants t
    where t.id = p_tenant_id
      and t.profile_id = p_user_id
      and coalesce(t.is_deleted, false) = false
  );
$$;

create or replace function private.is_contract_participant(p_contract_id integer, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from smartstay.contract_tenants ct
    join smartstay.tenants t on t.id = ct.tenant_id
    join smartstay.contracts c on c.id = ct.contract_id
    where ct.contract_id = p_contract_id
      and t.profile_id = p_user_id
      and coalesce(t.is_deleted, false) = false
      and coalesce(c.is_deleted, false) = false
  );
$$;

create or replace function private.is_invoice_owner(p_invoice_id integer, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from smartstay.invoices i
    where i.id = p_invoice_id
      and private.is_contract_participant(i.contract_id, p_user_id)
  );
$$;

create or replace function private.can_view_meter_reading(p_meter_reading_id bigint, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from smartstay.meter_readings mr
    join smartstay.contracts c on c.room_id = mr.room_id
    join smartstay.contract_tenants ct on ct.contract_id = c.id
    join smartstay.tenants t on t.id = ct.tenant_id
    where mr.id = p_meter_reading_id
      and t.profile_id = p_user_id
      and coalesce(t.is_deleted, false) = false
      and coalesce(c.is_deleted, false) = false
      and c.status = 'active'
  );
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke all on function private.is_admin(uuid) from public, anon, authenticated;
revoke all on function private.is_tenant_profile(integer, uuid) from public, anon, authenticated;
revoke all on function private.is_contract_participant(integer, uuid) from public, anon, authenticated;
revoke all on function private.is_invoice_owner(integer, uuid) from public, anon, authenticated;
revoke all on function private.can_view_meter_reading(bigint, uuid) from public, anon, authenticated;
grant execute on function private.is_admin(uuid) to authenticated;
grant execute on function private.is_tenant_profile(integer, uuid) to authenticated;
grant execute on function private.is_contract_participant(integer, uuid) to authenticated;
grant execute on function private.is_invoice_owner(integer, uuid) to authenticated;
grant execute on function private.can_view_meter_reading(bigint, uuid) to authenticated;

create or replace view smartstay.public_profiles as
select
  id,
  full_name,
  avatar_url
from smartstay.profiles;

revoke all on smartstay.public_profiles from public;
grant select on smartstay.public_profiles to authenticated;

create or replace view smartstay.portal_payment_settings as
select
  key,
  value
from smartstay.system_settings
where key = 'payment.bank_transfer_details'
  and coalesce(is_sensitive, false) = false;

revoke all on smartstay.portal_payment_settings from public;
grant select on smartstay.portal_payment_settings to authenticated;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'payment_attempts',
    'profiles',
    'contracts',
    'invoices',
    'invoice_items',
    'payments',
    'tenants',
    'tenant_balances',
    'balance_history',
    'audit_logs',
    'meter_readings',
    'system_settings',
    'webhook_logs',
    'building_images',
    'room_images'
  ]
  loop
    execute format('alter table smartstay.%I enable row level security', v_table);
    execute format('alter table smartstay.%I force row level security', v_table);
  end loop;
end
$$;

do $$
declare
  r record;
begin
  for r in
    select tablename, policyname
    from pg_policies
    where schemaname = 'smartstay'
      and tablename in (
        'payment_attempts',
        'profiles',
        'contracts',
        'invoices',
        'invoice_items',
        'payments',
        'tenants',
        'tenant_balances',
        'balance_history',
        'audit_logs',
        'meter_readings',
        'system_settings',
        'webhook_logs',
        'building_images',
        'room_images'
      )
  loop
    execute format('drop policy if exists %I on smartstay.%I', r.policyname, r.tablename);
  end loop;
end
$$;

create policy profiles_self_select
on smartstay.profiles
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = id
);

create policy profiles_self_insert
on smartstay.profiles
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = id
);

create policy profiles_self_update
on smartstay.profiles
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = id
)
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = id
);

create policy profiles_admin_all
on smartstay.profiles
for all
to authenticated
using ((select private.is_admin((select auth.uid()))))
with check ((select private.is_admin((select auth.uid()))));

create policy payment_attempts_owner_or_admin_select
on smartstay.payment_attempts
for select
to authenticated
using (
  (select private.is_admin((select auth.uid())))
  or initiated_by = (select auth.uid())
  or (select private.is_invoice_owner(invoice_id, (select auth.uid())))
);

create policy contracts_owner_or_admin_select
on smartstay.contracts
for select
to authenticated
using (
  (select private.is_admin((select auth.uid())))
  or (select private.is_contract_participant(id, (select auth.uid())))
);

create policy contracts_admin_insert
on smartstay.contracts
for insert
to authenticated
with check ((select private.is_admin((select auth.uid()))));

create policy contracts_admin_update
on smartstay.contracts
for update
to authenticated
using ((select private.is_admin((select auth.uid()))))
with check ((select private.is_admin((select auth.uid()))));

create policy invoices_owner_or_admin_select
on smartstay.invoices
for select
to authenticated
using (
  (select private.is_admin((select auth.uid())))
  or (select private.is_invoice_owner(id, (select auth.uid())))
);

create policy invoices_admin_insert
on smartstay.invoices
for insert
to authenticated
with check ((select private.is_admin((select auth.uid()))));

create policy invoices_admin_update
on smartstay.invoices
for update
to authenticated
using ((select private.is_admin((select auth.uid()))))
with check ((select private.is_admin((select auth.uid()))));

create policy invoice_items_owner_or_admin_select
on smartstay.invoice_items
for select
to authenticated
using (
  (select private.is_admin((select auth.uid())))
  or (select private.is_invoice_owner(invoice_id, (select auth.uid())))
);

create policy invoice_items_admin_insert
on smartstay.invoice_items
for insert
to authenticated
with check ((select private.is_admin((select auth.uid()))));

create policy invoice_items_admin_update
on smartstay.invoice_items
for update
to authenticated
using ((select private.is_admin((select auth.uid()))))
with check ((select private.is_admin((select auth.uid()))));

create policy payments_owner_or_admin_select
on smartstay.payments
for select
to authenticated
using (
  (select private.is_admin((select auth.uid())))
  or (select private.is_invoice_owner(invoice_id, (select auth.uid())))
);

create policy tenants_owner_or_admin_select
on smartstay.tenants
for select
to authenticated
using (
  (select private.is_admin((select auth.uid())))
  or (select private.is_tenant_profile(id, (select auth.uid())))
);

create policy tenants_admin_insert
on smartstay.tenants
for insert
to authenticated
with check ((select private.is_admin((select auth.uid()))));

create policy tenants_admin_update
on smartstay.tenants
for update
to authenticated
using ((select private.is_admin((select auth.uid()))))
with check ((select private.is_admin((select auth.uid()))));

create policy tenants_admin_delete
on smartstay.tenants
for delete
to authenticated
using ((select private.is_admin((select auth.uid()))));

create policy tenant_balances_owner_or_admin_select
on smartstay.tenant_balances
for select
to authenticated
using (
  (select private.is_admin((select auth.uid())))
  or (select private.is_tenant_profile(tenant_id, (select auth.uid())))
);

create policy tenant_balances_admin_insert
on smartstay.tenant_balances
for insert
to authenticated
with check ((select private.is_admin((select auth.uid()))));

create policy tenant_balances_admin_update
on smartstay.tenant_balances
for update
to authenticated
using ((select private.is_admin((select auth.uid()))))
with check ((select private.is_admin((select auth.uid()))));

create policy tenant_balances_admin_delete
on smartstay.tenant_balances
for delete
to authenticated
using ((select private.is_admin((select auth.uid()))));

create policy balance_history_owner_or_admin_select
on smartstay.balance_history
for select
to authenticated
using (
  (select private.is_admin((select auth.uid())))
  or (select private.is_tenant_profile(tenant_id, (select auth.uid())))
);

create policy balance_history_admin_insert
on smartstay.balance_history
for insert
to authenticated
with check ((select private.is_admin((select auth.uid()))));

create policy audit_logs_admin_select
on smartstay.audit_logs
for select
to authenticated
using ((select private.is_admin((select auth.uid()))));

create policy meter_readings_owner_or_admin_select
on smartstay.meter_readings
for select
to authenticated
using (
  (select private.is_admin((select auth.uid())))
  or (select private.can_view_meter_reading(id, (select auth.uid())))
);

create policy meter_readings_admin_insert
on smartstay.meter_readings
for insert
to authenticated
with check ((select private.is_admin((select auth.uid()))));

create policy meter_readings_admin_update
on smartstay.meter_readings
for update
to authenticated
using ((select private.is_admin((select auth.uid()))))
with check ((select private.is_admin((select auth.uid()))));

create policy system_settings_admin_select
on smartstay.system_settings
for select
to authenticated
using ((select private.is_admin((select auth.uid()))));

create policy webhook_logs_admin_select
on smartstay.webhook_logs
for select
to authenticated
using ((select private.is_admin((select auth.uid()))));

create policy building_images_authenticated_select
on smartstay.building_images
for select
to authenticated
using ((select auth.uid()) is not null);

create policy building_images_admin_insert
on smartstay.building_images
for insert
to authenticated
with check ((select private.is_admin((select auth.uid()))));

create policy building_images_admin_update
on smartstay.building_images
for update
to authenticated
using ((select private.is_admin((select auth.uid()))))
with check ((select private.is_admin((select auth.uid()))));

create policy building_images_admin_delete
on smartstay.building_images
for delete
to authenticated
using ((select private.is_admin((select auth.uid()))));

create policy room_images_authenticated_select
on smartstay.room_images
for select
to authenticated
using ((select auth.uid()) is not null);

create policy room_images_admin_insert
on smartstay.room_images
for insert
to authenticated
with check ((select private.is_admin((select auth.uid()))));

create policy room_images_admin_update
on smartstay.room_images
for update
to authenticated
using ((select private.is_admin((select auth.uid()))))
with check ((select private.is_admin((select auth.uid()))));

create policy room_images_admin_delete
on smartstay.room_images
for delete
to authenticated
using ((select private.is_admin((select auth.uid()))));

commit;
