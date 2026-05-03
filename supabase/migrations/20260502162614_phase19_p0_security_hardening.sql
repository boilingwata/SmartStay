-- Phase 19 P0 backend/schema security hardening.
-- No data is deleted and no tables are dropped.

begin;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function smartstay.prevent_profile_protected_field_change()
returns trigger
language plpgsql
security definer
set search_path = smartstay, private, auth, public
as $$
declare
  v_actor_id uuid := auth.uid();
begin
  if tg_op = 'UPDATE' and (
    old.role is distinct from new.role
    or old.role_id is distinct from new.role_id
    or old.tenant_stage is distinct from new.tenant_stage
    or old.is_active is distinct from new.is_active
  ) then
    if coalesce(auth.role(), '') = 'service_role' then
      return new;
    end if;

    if v_actor_id is null or not (
      private.is_owner(v_actor_id) or private.is_super_admin(v_actor_id)
    ) then
      raise exception 'Only owner or super admin can change protected profile fields';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protected_field_guard on smartstay.profiles;
create trigger profiles_protected_field_guard
before update on smartstay.profiles
for each row execute function smartstay.prevent_profile_protected_field_change();

revoke execute on function smartstay.prevent_profile_protected_field_change() from anon, authenticated, public;
grant execute on function smartstay.prevent_profile_protected_field_change() to service_role;

-- ---------------------------------------------------------------------------
-- P0-1: RBAC table lockdown
-- ---------------------------------------------------------------------------

alter table smartstay.roles enable row level security;
alter table smartstay.roles force row level security;
alter table smartstay.permissions enable row level security;
alter table smartstay.permissions force row level security;
alter table smartstay.role_permissions enable row level security;
alter table smartstay.role_permissions force row level security;

revoke all on table smartstay.roles from anon, authenticated, public;
revoke all on table smartstay.permissions from anon, authenticated, public;
revoke all on table smartstay.role_permissions from anon, authenticated, public;

grant select, insert, update, delete on table smartstay.roles to authenticated;
grant select on table smartstay.permissions to authenticated;
grant select, insert, delete on table smartstay.role_permissions to authenticated;
grant all on table smartstay.roles to service_role;
grant all on table smartstay.permissions to service_role;
grant all on table smartstay.role_permissions to service_role;

drop policy if exists roles_owner_super_select on smartstay.roles;
drop policy if exists roles_owner_super_insert on smartstay.roles;
drop policy if exists roles_owner_super_update on smartstay.roles;
drop policy if exists roles_owner_super_delete on smartstay.roles;
drop policy if exists permissions_owner_super_select on smartstay.permissions;
drop policy if exists role_permissions_owner_super_select on smartstay.role_permissions;
drop policy if exists role_permissions_owner_super_insert on smartstay.role_permissions;
drop policy if exists role_permissions_owner_super_delete on smartstay.role_permissions;

create policy roles_owner_super_select
on smartstay.roles
for select
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy roles_owner_super_insert
on smartstay.roles
for insert
to authenticated
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy roles_owner_super_update
on smartstay.roles
for update
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()))
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy roles_owner_super_delete
on smartstay.roles
for delete
to authenticated
using ((private.is_owner(auth.uid()) or private.is_super_admin(auth.uid())) and coalesce(is_system, false) = false);

create policy permissions_owner_super_select
on smartstay.permissions
for select
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy role_permissions_owner_super_select
on smartstay.role_permissions
for select
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy role_permissions_owner_super_insert
on smartstay.role_permissions
for insert
to authenticated
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy role_permissions_owner_super_delete
on smartstay.role_permissions
for delete
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- P0-3: Owner/SuperAdmin-only policies for high-impact modules
-- ---------------------------------------------------------------------------

-- Profiles: keep self policies, but admin-wide access is Owner/SuperAdmin only.
drop policy if exists profiles_admin_all on smartstay.profiles;
create policy profiles_owner_super_all
on smartstay.profiles
for all
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()))
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

-- Tenants and balances.
drop policy if exists tenants_admin_insert on smartstay.tenants;
drop policy if exists tenants_admin_update on smartstay.tenants;
drop policy if exists tenants_admin_delete on smartstay.tenants;
drop policy if exists tenants_owner_or_admin_select on smartstay.tenants;

create policy tenants_owner_super_insert
on smartstay.tenants
for insert
to authenticated
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy tenants_owner_super_update
on smartstay.tenants
for update
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()))
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy tenants_owner_super_delete
on smartstay.tenants
for delete
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy tenants_owner_super_or_self_select
on smartstay.tenants
for select
to authenticated
using (
  private.is_owner(auth.uid())
  or private.is_super_admin(auth.uid())
  or private.is_tenant_profile(id, auth.uid())
);

drop policy if exists tenant_balances_admin_insert on smartstay.tenant_balances;
drop policy if exists tenant_balances_admin_update on smartstay.tenant_balances;
drop policy if exists tenant_balances_admin_delete on smartstay.tenant_balances;
drop policy if exists tenant_balances_owner_or_admin_select on smartstay.tenant_balances;

create policy tenant_balances_owner_super_insert
on smartstay.tenant_balances
for insert
to authenticated
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy tenant_balances_owner_super_update
on smartstay.tenant_balances
for update
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()))
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy tenant_balances_owner_super_delete
on smartstay.tenant_balances
for delete
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy tenant_balances_owner_super_or_self_select
on smartstay.tenant_balances
for select
to authenticated
using (
  private.is_owner(auth.uid())
  or private.is_super_admin(auth.uid())
  or private.is_tenant_profile(tenant_id, auth.uid())
);

drop policy if exists balance_history_admin_insert on smartstay.balance_history;
drop policy if exists balance_history_owner_or_admin_select on smartstay.balance_history;

create policy balance_history_owner_super_insert
on smartstay.balance_history
for insert
to authenticated
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy balance_history_owner_super_or_self_select
on smartstay.balance_history
for select
to authenticated
using (
  private.is_owner(auth.uid())
  or private.is_super_admin(auth.uid())
  or private.is_tenant_profile(tenant_id, auth.uid())
);

-- Contracts and related lifecycle tables.
drop policy if exists contracts_admin_insert on smartstay.contracts;
drop policy if exists contracts_admin_update on smartstay.contracts;
drop policy if exists contracts_owner_or_admin_select on smartstay.contracts;

create policy contracts_owner_super_insert
on smartstay.contracts
for insert
to authenticated
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy contracts_owner_super_update
on smartstay.contracts
for update
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()))
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy contracts_owner_super_or_participant_select
on smartstay.contracts
for select
to authenticated
using (
  private.is_owner(auth.uid())
  or private.is_super_admin(auth.uid())
  or private.is_contract_participant(id, auth.uid())
);

drop policy if exists admin_all_contract_tenants on smartstay.contract_tenants;
drop policy if exists contract_tenants_admin_or_participant_select on smartstay.contract_tenants;

create policy contract_tenants_owner_super_all
on smartstay.contract_tenants
for all
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()))
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy contract_tenants_owner_super_or_participant_select
on smartstay.contract_tenants
for select
to authenticated
using (
  private.is_owner(auth.uid())
  or private.is_super_admin(auth.uid())
  or private.is_contract_participant(contract_id, auth.uid())
);

drop policy if exists admin_all_room_occupants on smartstay.room_occupants;
drop policy if exists room_occupants_admin_or_participant_select on smartstay.room_occupants;

create policy room_occupants_owner_super_all
on smartstay.room_occupants
for all
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()))
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy room_occupants_owner_super_or_participant_select
on smartstay.room_occupants
for select
to authenticated
using (
  private.is_owner(auth.uid())
  or private.is_super_admin(auth.uid())
  or private.is_contract_participant(contract_id, auth.uid())
);

drop policy if exists admin_all_contract_services on smartstay.contract_services;
drop policy if exists authenticated_select_contract_services on smartstay.contract_services;

create policy contract_services_owner_super_all
on smartstay.contract_services
for all
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()))
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy contract_services_owner_super_or_participant_select
on smartstay.contract_services
for select
to authenticated
using (
  private.is_owner(auth.uid())
  or private.is_super_admin(auth.uid())
  or private.is_contract_participant(contract_id, auth.uid())
);

drop policy if exists admin_all_contract_addendums on smartstay.contract_addendums;
drop policy if exists contract_addendums_admin_or_participant_select on smartstay.contract_addendums;

create policy contract_addendums_owner_super_all
on smartstay.contract_addendums
for all
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()))
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy contract_addendums_owner_super_or_participant_select
on smartstay.contract_addendums
for select
to authenticated
using (
  private.is_owner(auth.uid())
  or private.is_super_admin(auth.uid())
  or private.is_contract_participant(contract_id, auth.uid())
);

drop policy if exists admin_all_contract_renewals on smartstay.contract_renewals;
drop policy if exists authenticated_select_contract_renewals on smartstay.contract_renewals;

create policy contract_renewals_owner_super_all
on smartstay.contract_renewals
for all
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()))
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy contract_renewals_owner_super_or_participant_select
on smartstay.contract_renewals
for select
to authenticated
using (
  private.is_owner(auth.uid())
  or private.is_super_admin(auth.uid())
  or private.is_contract_participant(contract_id, auth.uid())
);

drop policy if exists admin_all_contract_terminations on smartstay.contract_terminations;
drop policy if exists contract_terminations_admin_or_participant_select on smartstay.contract_terminations;

create policy contract_terminations_owner_super_all
on smartstay.contract_terminations
for all
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()))
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy contract_terminations_owner_super_or_participant_select
on smartstay.contract_terminations
for select
to authenticated
using (
  private.is_owner(auth.uid())
  or private.is_super_admin(auth.uid())
  or private.is_contract_participant(contract_id, auth.uid())
);

drop policy if exists admin_all_contract_transfers on smartstay.contract_transfers;
drop policy if exists contract_transfers_admin_or_participant_select on smartstay.contract_transfers;

create policy contract_transfers_owner_super_all
on smartstay.contract_transfers
for all
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()))
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy contract_transfers_owner_super_or_participant_select
on smartstay.contract_transfers
for select
to authenticated
using (
  private.is_owner(auth.uid())
  or private.is_super_admin(auth.uid())
  or private.is_contract_participant(old_contract_id, auth.uid())
  or private.is_contract_participant(new_contract_id, auth.uid())
);

-- Finance.
drop policy if exists invoices_admin_insert on smartstay.invoices;
drop policy if exists invoices_admin_update on smartstay.invoices;
drop policy if exists invoices_owner_or_admin_select on smartstay.invoices;

create policy invoices_owner_super_insert
on smartstay.invoices
for insert
to authenticated
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy invoices_owner_super_update
on smartstay.invoices
for update
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()))
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy invoices_owner_super_or_invoice_owner_select
on smartstay.invoices
for select
to authenticated
using (
  private.is_owner(auth.uid())
  or private.is_super_admin(auth.uid())
  or private.is_invoice_owner(id, auth.uid())
);

drop policy if exists invoice_items_admin_insert on smartstay.invoice_items;
drop policy if exists invoice_items_admin_update on smartstay.invoice_items;
drop policy if exists invoice_items_owner_or_admin_select on smartstay.invoice_items;

create policy invoice_items_owner_super_insert
on smartstay.invoice_items
for insert
to authenticated
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy invoice_items_owner_super_update
on smartstay.invoice_items
for update
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()))
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy invoice_items_owner_super_or_invoice_owner_select
on smartstay.invoice_items
for select
to authenticated
using (
  private.is_owner(auth.uid())
  or private.is_super_admin(auth.uid())
  or private.is_invoice_owner(invoice_id, auth.uid())
);

drop policy if exists payments_admin_insert on smartstay.payments;
drop policy if exists payments_admin_update on smartstay.payments;
drop policy if exists payments_owner_or_admin_select on smartstay.payments;

create policy payments_owner_super_insert
on smartstay.payments
for insert
to authenticated
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy payments_owner_super_update
on smartstay.payments
for update
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()))
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy payments_owner_super_or_invoice_owner_select
on smartstay.payments
for select
to authenticated
using (
  private.is_owner(auth.uid())
  or private.is_super_admin(auth.uid())
  or private.is_invoice_owner(invoice_id, auth.uid())
);

drop policy if exists payment_attempts_owner_or_admin_select on smartstay.payment_attempts;

create policy payment_attempts_owner_super_or_initiator_select
on smartstay.payment_attempts
for select
to authenticated
using (
  private.is_owner(auth.uid())
  or private.is_super_admin(auth.uid())
  or initiated_by = auth.uid()
  or private.is_invoice_owner(invoice_id, auth.uid())
);

-- Utility policy and billing administration.
drop policy if exists utility_policies_admin_select on smartstay.utility_policies;
drop policy if exists utility_policies_admin_insert on smartstay.utility_policies;
drop policy if exists utility_policies_admin_update on smartstay.utility_policies;
drop policy if exists utility_policies_admin_delete on smartstay.utility_policies;

create policy utility_policies_owner_super_select
on smartstay.utility_policies
for select
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy utility_policies_owner_super_insert
on smartstay.utility_policies
for insert
to authenticated
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy utility_policies_owner_super_update
on smartstay.utility_policies
for update
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()))
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy utility_policies_owner_super_delete
on smartstay.utility_policies
for delete
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

drop policy if exists utility_policy_device_adjustments_admin_select on smartstay.utility_policy_device_adjustments;
drop policy if exists utility_policy_device_adjustments_admin_insert on smartstay.utility_policy_device_adjustments;
drop policy if exists utility_policy_device_adjustments_admin_update on smartstay.utility_policy_device_adjustments;
drop policy if exists utility_policy_device_adjustments_admin_delete on smartstay.utility_policy_device_adjustments;

create policy utility_policy_device_adjustments_owner_super_select
on smartstay.utility_policy_device_adjustments
for select
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy utility_policy_device_adjustments_owner_super_insert
on smartstay.utility_policy_device_adjustments
for insert
to authenticated
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy utility_policy_device_adjustments_owner_super_update
on smartstay.utility_policy_device_adjustments
for update
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()))
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy utility_policy_device_adjustments_owner_super_delete
on smartstay.utility_policy_device_adjustments
for delete
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

drop policy if exists invoice_utility_overrides_admin_select on smartstay.invoice_utility_overrides;
drop policy if exists invoice_utility_overrides_admin_insert on smartstay.invoice_utility_overrides;
drop policy if exists invoice_utility_overrides_admin_update on smartstay.invoice_utility_overrides;
drop policy if exists invoice_utility_overrides_admin_delete on smartstay.invoice_utility_overrides;

create policy invoice_utility_overrides_owner_super_select
on smartstay.invoice_utility_overrides
for select
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy invoice_utility_overrides_owner_super_insert
on smartstay.invoice_utility_overrides
for insert
to authenticated
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy invoice_utility_overrides_owner_super_update
on smartstay.invoice_utility_overrides
for update
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()))
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy invoice_utility_overrides_owner_super_delete
on smartstay.invoice_utility_overrides
for delete
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

drop policy if exists billing_runs_admin_select on smartstay.billing_runs;
drop policy if exists billing_runs_admin_insert on smartstay.billing_runs;
drop policy if exists billing_runs_admin_update on smartstay.billing_runs;
drop policy if exists billing_runs_admin_delete on smartstay.billing_runs;

create policy billing_runs_owner_super_select
on smartstay.billing_runs
for select
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy billing_runs_owner_super_insert
on smartstay.billing_runs
for insert
to authenticated
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy billing_runs_owner_super_update
on smartstay.billing_runs
for update
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()))
with check (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

create policy billing_runs_owner_super_delete
on smartstay.billing_runs
for delete
to authenticated
using (private.is_owner(auth.uid()) or private.is_super_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- P0-5: Handover RPC role boundary
-- ---------------------------------------------------------------------------

create or replace function smartstay.create_handover_checklist_v1(
  p_room_id bigint,
  p_contract_id bigint,
  p_handover_type smartstay.handover_type,
  p_performed_by uuid,
  p_tenant_id uuid,
  p_manager_signature text,
  p_tenant_signature text,
  p_notes text,
  p_items jsonb,
  p_assets jsonb
)
returns bigint
language plpgsql
security definer
set search_path = smartstay, pg_temp
as $$
declare
  v_handover_id bigint;
  v_item jsonb;
  v_asset jsonb;
  v_actor_id uuid := auth.uid();
  v_room_asset_id bigint;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if not private.is_workspace_operator(v_actor_id) then
    raise exception 'Only workspace operators can create handover checklists';
  end if;

  if p_room_id is null or not exists (
    select 1 from smartstay.rooms r where r.id = p_room_id and coalesce(r.is_deleted, false) = false
  ) then
    raise exception 'Room not found';
  end if;

  if p_contract_id is not null and not exists (
    select 1
    from smartstay.contracts c
    where c.id = p_contract_id
      and c.room_id = p_room_id
      and coalesce(c.is_deleted, false) = false
  ) then
    raise exception 'Contract not found for room';
  end if;

  if p_items is not null and jsonb_typeof(p_items) <> 'array' then
    raise exception 'p_items must be a JSON array';
  end if;

  if p_assets is not null and jsonb_typeof(p_assets) <> 'array' then
    raise exception 'p_assets must be a JSON array';
  end if;

  insert into smartstay.handover_checklists (
    room_id,
    contract_id,
    handover_type,
    performed_by,
    tenant_id,
    manager_signature,
    tenant_signature,
    notes
  ) values (
    p_room_id,
    p_contract_id,
    p_handover_type,
    v_actor_id,
    p_tenant_id,
    p_manager_signature,
    p_tenant_signature,
    p_notes
  ) returning id into v_handover_id;

  if p_items is not null and jsonb_array_length(p_items) > 0 then
    for v_item in select * from jsonb_array_elements(p_items)
    loop
      insert into smartstay.handover_items (
        handover_id,
        category,
        item_name,
        status,
        note,
        photo_urls
      ) values (
        v_handover_id,
        v_item->>'category',
        v_item->>'item_name',
        v_item->>'status',
        v_item->>'note',
        case
          when v_item->'photo_urls' is not null
            then array(select jsonb_array_elements_text(v_item->'photo_urls'))
          else null
        end
      );
    end loop;
  end if;

  if p_assets is not null and jsonb_array_length(p_assets) > 0 then
    for v_asset in select * from jsonb_array_elements(p_assets)
    loop
      v_room_asset_id := (v_asset->>'room_asset_id')::bigint;

      if not exists (
        select 1
        from smartstay.room_assets ra
        where ra.id = v_room_asset_id
          and ra.room_id = p_room_id
      ) then
        raise exception 'Room asset % does not belong to room %', v_room_asset_id, p_room_id;
      end if;

      insert into smartstay.handover_asset_snapshots (
        handover_id,
        room_asset_id,
        previous_condition_score,
        current_condition_score,
        note
      ) values (
        v_handover_id,
        v_room_asset_id,
        (v_asset->>'previous_condition_score')::integer,
        (v_asset->>'current_condition_score')::integer,
        v_asset->>'note'
      );

      update smartstay.room_assets
      set condition_score = (v_asset->>'current_condition_score')::integer,
          updated_at = now()
      where id = v_room_asset_id
        and room_id = p_room_id;
    end loop;
  end if;

  return v_handover_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- P0-2: RPC EXECUTE hardening
-- ---------------------------------------------------------------------------

-- Private helpers are used by RLS, but should not be executable by anon/public.
revoke execute on function private.is_owner(uuid) from anon, authenticated, public;
revoke execute on function private.is_staff(uuid) from anon, authenticated, public;
revoke execute on function private.is_super_admin(uuid) from anon, authenticated, public;
revoke execute on function private.is_workspace_operator(uuid) from anon, authenticated, public;
revoke execute on function private.current_tenant_building_ids(uuid) from anon, authenticated, public;
revoke execute on function private.log_audit_event(text, text, text, jsonb, jsonb, uuid) from anon, authenticated, public;
grant execute on function private.is_owner(uuid) to authenticated, service_role;
grant execute on function private.is_staff(uuid) to authenticated, service_role;
grant execute on function private.is_super_admin(uuid) to authenticated, service_role;
grant execute on function private.is_workspace_operator(uuid) to authenticated, service_role;
grant execute on function private.current_tenant_building_ids(uuid) to authenticated, service_role;
grant execute on function private.log_audit_event(text, text, text, jsonb, jsonb, uuid) to authenticated, service_role;

-- Server-only privileged functions.
revoke execute on function smartstay.adjust_balance(bigint, numeric, text, text, bigint, uuid) from anon, authenticated, public;
revoke execute on function smartstay.apply_confirmed_payment(bigint, text, uuid, boolean) from anon, authenticated, public;
revoke execute on function smartstay.approve_payment(bigint, uuid) from anon, authenticated, public;
revoke execute on function smartstay.approve_payment(bigint, uuid, bigint, text) from anon, authenticated, public;
revoke execute on function smartstay.create_contract(bigint, date, date, numeric, numeric, integer, bigint[], bigint, bigint[], numeric[], integer[], boolean) from anon, authenticated, public;
revoke execute on function smartstay.create_contract_v3(integer, date, date, numeric, numeric, integer, integer, integer[], smallint, bigint, bigint[], numeric[], numeric[], boolean, text, text, text[], boolean, boolean, boolean, boolean, text, text, text) from anon, authenticated, public;
revoke execute on function smartstay.create_policy_utility_invoice(bigint, text, date, numeric, numeric, text, jsonb, jsonb) from anon, authenticated, public;
revoke execute on function smartstay.ensure_tenant_balance_record(bigint) from anon, authenticated, public;
revoke execute on function smartstay.ensure_contract_tenant_balance() from anon, authenticated, public;
revoke execute on function smartstay.handle_momo_ipn(jsonb, text, text, timestamp with time zone) from anon, authenticated, public;
revoke execute on function smartstay.handle_sepay_webhook(jsonb, text, timestamp with time zone) from anon, authenticated, public;
revoke execute on function smartstay.portal_mark_invoice_paid(bigint) from anon, authenticated, public;
revoke execute on function smartstay.portal_cancel_invoice(bigint, text) from anon, authenticated, public;
revoke execute on function smartstay.process_payment(bigint, numeric, text, timestamp with time zone, text, text, text, text, uuid, boolean) from anon, authenticated, public;
revoke execute on function smartstay.process_payment(bigint, numeric, text, timestamp with time zone, text, text, text, text, uuid, boolean, text, smartstay.payment_status) from anon, authenticated, public;
revoke execute on function smartstay.schedule_monthly_utility_billing_job(text) from anon, authenticated, public;
revoke execute on function smartstay.unschedule_monthly_utility_billing_job(text) from anon, authenticated, public;

grant execute on function smartstay.adjust_balance(bigint, numeric, text, text, bigint, uuid) to service_role;
grant execute on function smartstay.apply_confirmed_payment(bigint, text, uuid, boolean) to service_role;
grant execute on function smartstay.approve_payment(bigint, uuid) to service_role;
grant execute on function smartstay.approve_payment(bigint, uuid, bigint, text) to service_role;
grant execute on function smartstay.create_contract(bigint, date, date, numeric, numeric, integer, bigint[], bigint, bigint[], numeric[], integer[], boolean) to service_role;
grant execute on function smartstay.create_contract_v3(integer, date, date, numeric, numeric, integer, integer, integer[], smallint, bigint, bigint[], numeric[], numeric[], boolean, text, text, text[], boolean, boolean, boolean, boolean, text, text, text) to service_role;
grant execute on function smartstay.create_policy_utility_invoice(bigint, text, date, numeric, numeric, text, jsonb, jsonb) to service_role;
grant execute on function smartstay.ensure_tenant_balance_record(bigint) to service_role;
grant execute on function smartstay.ensure_contract_tenant_balance() to service_role;
grant execute on function smartstay.handle_momo_ipn(jsonb, text, text, timestamp with time zone) to service_role;
grant execute on function smartstay.handle_sepay_webhook(jsonb, text, timestamp with time zone) to service_role;
grant execute on function smartstay.portal_mark_invoice_paid(bigint) to service_role;
grant execute on function smartstay.portal_cancel_invoice(bigint, text) to service_role;
grant execute on function smartstay.process_payment(bigint, numeric, text, timestamp with time zone, text, text, text, text, uuid, boolean) to service_role;
grant execute on function smartstay.process_payment(bigint, numeric, text, timestamp with time zone, text, text, text, text, uuid, boolean, text, smartstay.payment_status) to service_role;
grant execute on function smartstay.schedule_monthly_utility_billing_job(text) to service_role;
grant execute on function smartstay.unschedule_monthly_utility_billing_job(text) to service_role;

-- Intentionally exposed authenticated functions.
revoke execute on function smartstay.create_handover_checklist_v1(bigint, bigint, smartstay.handover_type, uuid, uuid, text, text, text, jsonb, jsonb) from anon, authenticated, public;
revoke execute on function smartstay.portal_record_invoice_payment(bigint, numeric, text, timestamp with time zone, text, text, text) from anon, authenticated, public;
revoke execute on function smartstay.add_contract_occupant(integer, integer, date, text, text, uuid) from anon, authenticated, public;
revoke execute on function smartstay.remove_contract_occupant(integer, integer, date, text, uuid) from anon, authenticated, public;
revoke execute on function smartstay.transfer_contract_representative(integer, integer, date, text, uuid) from anon, authenticated, public;
revoke execute on function smartstay.liquidate_contract(integer, date, text, numeric, numeric, uuid) from anon, authenticated, public;
revoke execute on function smartstay.create_contract_addendum(integer, text, text, text, date, text, text, jsonb, text, bigint, uuid) from anon, authenticated, public;

grant execute on function smartstay.create_handover_checklist_v1(bigint, bigint, smartstay.handover_type, uuid, uuid, text, text, text, jsonb, jsonb) to authenticated, service_role;
grant execute on function smartstay.portal_record_invoice_payment(bigint, numeric, text, timestamp with time zone, text, text, text) to authenticated, service_role;
grant execute on function smartstay.add_contract_occupant(integer, integer, date, text, text, uuid) to authenticated, service_role;
grant execute on function smartstay.remove_contract_occupant(integer, integer, date, text, uuid) to authenticated, service_role;
grant execute on function smartstay.transfer_contract_representative(integer, integer, date, text, uuid) to authenticated, service_role;
grant execute on function smartstay.liquidate_contract(integer, date, text, numeric, numeric, uuid) to authenticated, service_role;
grant execute on function smartstay.create_contract_addendum(integer, text, text, text, date, text, text, jsonb, text, bigint, uuid) to authenticated, service_role;

-- Trigger/helper functions should not be externally executable.
revoke execute on function smartstay.create_room_asset_contract_addendum() from anon, authenticated, public;
revoke execute on function smartstay.sync_room_asset_billing_fields() from anon, authenticated, public;
revoke execute on function smartstay.touch_utility_updated_at() from anon, authenticated, public;
grant execute on function smartstay.create_room_asset_contract_addendum() to service_role;
grant execute on function smartstay.sync_room_asset_billing_fields() to service_role;
grant execute on function smartstay.touch_utility_updated_at() to service_role;

-- Fix mutable search_path on legacy privileged overloads that remain for service-role compatibility.
alter function smartstay.approve_payment(bigint, uuid) set search_path = smartstay, public;
alter function smartstay.process_payment(bigint, numeric, text, timestamp with time zone, text, text, text, text, uuid, boolean) set search_path = smartstay, public;

commit;
