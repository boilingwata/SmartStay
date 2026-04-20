begin;

create or replace function private.log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_old_values jsonb default null,
  p_new_values jsonb default null,
  p_user_id uuid default auth.uid()
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into smartstay.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  )
  values (
    p_user_id,
    left(coalesce(nullif(trim(p_action), ''), 'unknown_action'), 255),
    left(coalesce(nullif(trim(p_entity_type), ''), 'unknown_entity'), 255),
    nullif(trim(p_entity_id), ''),
    p_old_values,
    p_new_values
  );
end;
$$;

alter table smartstay.contract_addendums
  add column if not exists source_type text not null default 'manual',
  add column if not exists parent_addendum_id bigint,
  add column if not exists version_no integer not null default 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'contract_addendums_source_type_check'
      and conrelid = 'smartstay.contract_addendums'::regclass
  ) then
    alter table smartstay.contract_addendums
      add constraint contract_addendums_source_type_check
      check (source_type in ('manual', 'room_asset_auto'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'contract_addendums_version_no_check'
      and conrelid = 'smartstay.contract_addendums'::regclass
  ) then
    alter table smartstay.contract_addendums
      add constraint contract_addendums_version_no_check
      check (version_no > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'contract_addendums_parent_addendum_id_fkey'
      and conrelid = 'smartstay.contract_addendums'::regclass
  ) then
    alter table smartstay.contract_addendums
      add constraint contract_addendums_parent_addendum_id_fkey
      foreign key (parent_addendum_id)
      references smartstay.contract_addendums(id)
      on delete set null;
  end if;
end $$;

update smartstay.contract_addendums
set source_type = case
  when coalesce(addendum_type, 'other') in ('asset_assignment', 'asset_repricing', 'asset_status_change')
    and summary_json ? 'room_asset_id'
    then 'room_asset_auto'
  else 'manual'
end
where source_type not in ('manual', 'room_asset_auto');

with version_seed as (
  select
    id,
    row_number() over (
      partition by contract_id, addendum_type, title
      order by effective_date asc, created_at asc, id asc
    ) as version_no_seed
  from smartstay.contract_addendums
)
update smartstay.contract_addendums ca
set version_no = vs.version_no_seed
from version_seed vs
where ca.id = vs.id
  and ca.version_no is distinct from vs.version_no_seed;

create index if not exists idx_contract_addendums_parent_addendum
  on smartstay.contract_addendums(parent_addendum_id);

create index if not exists idx_contract_addendums_source_type
  on smartstay.contract_addendums(source_type, contract_id, effective_date desc);

create unique index if not exists idx_contract_addendums_root_version_unique
  on smartstay.contract_addendums ((coalesce(parent_addendum_id, id)), version_no);

drop policy if exists authenticated_select_contract_tenants on smartstay.contract_tenants;
drop policy if exists authenticated_select_room_occupants on smartstay.room_occupants;
drop policy if exists authenticated_select_contract_addendums on smartstay.contract_addendums;
drop policy if exists authenticated_select_contract_transfers on smartstay.contract_transfers;
drop policy if exists authenticated_select_contract_terminations on smartstay.contract_terminations;

create policy contract_tenants_admin_or_participant_select
  on smartstay.contract_tenants
  for select
  to authenticated
  using (
    (select private.is_admin((select auth.uid())))
    or (select private.is_contract_participant(contract_id, (select auth.uid())))
  );

create policy room_occupants_admin_or_participant_select
  on smartstay.room_occupants
  for select
  to authenticated
  using (
    (select private.is_admin((select auth.uid())))
    or (select private.is_contract_participant(contract_id, (select auth.uid())))
  );

create policy contract_addendums_admin_or_participant_select
  on smartstay.contract_addendums
  for select
  to authenticated
  using (
    (select private.is_admin((select auth.uid())))
    or (select private.is_contract_participant(contract_id, (select auth.uid())))
  );

create policy contract_terminations_admin_or_participant_select
  on smartstay.contract_terminations
  for select
  to authenticated
  using (
    (select private.is_admin((select auth.uid())))
    or (select private.is_contract_participant(contract_id, (select auth.uid())))
  );

create policy contract_transfers_admin_or_participant_select
  on smartstay.contract_transfers
  for select
  to authenticated
  using (
    (select private.is_admin((select auth.uid())))
    or (select private.is_contract_participant(old_contract_id, (select auth.uid())))
    or (select private.is_contract_participant(new_contract_id, (select auth.uid())))
  );

create or replace function smartstay.create_contract_v3(
  p_room_id integer,
  p_start_date date,
  p_end_date date,
  p_monthly_rent numeric,
  p_deposit_amount numeric default 0,
  p_payment_cycle_months integer default 1,
  p_primary_tenant_id integer default null,
  p_occupant_ids integer[] default '{}'::integer[],
  p_payment_due_day smallint default 5,
  p_utility_policy_id bigint default null,
  p_service_ids bigint[] default '{}'::bigint[],
  p_service_prices numeric[] default '{}'::numeric[],
  p_service_quantities numeric[] default '{}'::numeric[],
  p_mark_deposit_received boolean default false
) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_contract_id integer;
  v_contract_code text;
  v_room smartstay.rooms%rowtype;
  v_all_occupants integer[];
  v_extra_occupants integer[];
  v_occupant_count integer;
  v_idx integer;
  v_primary_active_contract_count integer;
  v_catalog_item record;
  v_old_values jsonb;
  v_new_values jsonb;
begin
  select *
  into v_room
  from smartstay.rooms
  where id = p_room_id
    and coalesce(is_deleted, false) = false
  for update;

  if v_room.id is null then
    raise exception 'Không tìm thấy phòng';
  end if;

  if p_primary_tenant_id is null or p_primary_tenant_id <= 0 then
    raise exception 'Người đứng tên hợp đồng không hợp lệ';
  end if;

  if p_start_date is null or p_end_date is null or p_end_date <= p_start_date then
    raise exception 'Khoảng thời gian hợp đồng không hợp lệ';
  end if;

  if p_monthly_rent is null or p_monthly_rent < 0 or p_deposit_amount is null or p_deposit_amount < 0 then
    raise exception 'Giá trị tiền không hợp lệ';
  end if;

  if p_payment_due_day is null or p_payment_due_day < 1 or p_payment_due_day > 31 then
    raise exception 'Ngày đến hạn thanh toán phải nằm trong khoảng 1-31';
  end if;

  if not exists (
    select 1
    from smartstay.tenants t
    where t.id = p_primary_tenant_id
      and coalesce(t.is_deleted, false) = false
  ) then
    raise exception 'Không tìm thấy người đứng tên hợp đồng';
  end if;

  if p_utility_policy_id is not null and not exists (
    select 1
    from smartstay.utility_policies up
    where up.id = p_utility_policy_id
      and up.is_active = true
  ) then
    raise exception 'Không tìm thấy chính sách điện nước hợp lệ';
  end if;

  if exists (
    select 1
    from smartstay.contracts c
    where c.room_id = p_room_id
      and coalesce(c.is_deleted, false) = false
      and c.status in ('active', 'pending_signature')
      and daterange(c.start_date, c.end_date, '[]') && daterange(p_start_date, p_end_date, '[]')
  ) then
    raise exception 'Phòng đã có hợp đồng active/pending chồng lấn';
  end if;

  v_all_occupants := array(
    select distinct item
    from unnest(array_append(coalesce(p_occupant_ids, '{}'::integer[]), p_primary_tenant_id)) as item
    where item is not null
  );

  v_extra_occupants := array(
    select distinct item
    from unnest(coalesce(p_occupant_ids, '{}'::integer[])) as item
    where item is not null
  );

  v_occupant_count := coalesce(array_length(v_all_occupants, 1), 0);

  if v_occupant_count = 0 then
    raise exception 'Hợp đồng phải có ít nhất 1 người ở';
  end if;

  if v_room.max_occupants is not null and v_occupant_count > v_room.max_occupants then
    raise exception 'Vượt số người tối đa của phòng';
  end if;

  if exists (
    select 1
    from unnest(coalesce(v_extra_occupants, '{}'::integer[])) as occupant_id
    join smartstay.room_occupants ro on ro.tenant_id = occupant_id
    join smartstay.contracts c on c.id = ro.contract_id
    where ro.status = 'active'
      and c.status in ('active', 'pending_signature')
      and coalesce(c.is_deleted, false) = false
      and c.room_id <> p_room_id
  ) then
    raise exception 'Có người ở cùng đang active ở hợp đồng/phòng khác';
  end if;

  select count(*)
  into v_primary_active_contract_count
  from smartstay.contracts c
  where c.primary_tenant_id = p_primary_tenant_id
    and coalesce(c.is_deleted, false) = false
    and c.status in ('active', 'pending_signature')
    and c.room_id <> p_room_id;

  insert into smartstay.contracts (
    room_id,
    primary_tenant_id,
    start_date,
    end_date,
    signing_date,
    payment_cycle_months,
    payment_due_day,
    monthly_rent,
    deposit_amount,
    deposit_status,
    status,
    terms,
    is_deleted,
    occupants_for_billing,
    utility_billing_type,
    utility_policy_id,
    created_by
  )
  values (
    p_room_id,
    p_primary_tenant_id,
    p_start_date,
    p_end_date,
    p_start_date,
    coalesce(p_payment_cycle_months, 1),
    p_payment_due_day,
    coalesce(p_monthly_rent, 0),
    coalesce(p_deposit_amount, 0),
    case
      when coalesce(p_mark_deposit_received, false)
        then 'received'::smartstay.deposit_status
      else 'pending'::smartstay.deposit_status
    end,
    'active'::smartstay.contract_status,
    jsonb_build_object(
      'occupants_for_billing', v_occupant_count,
      'contract_model', 'single_representative',
      'is_supplementary_contract', v_primary_active_contract_count > 0,
      'primary_tenant_active_contract_count', v_primary_active_contract_count
    ),
    false,
    v_occupant_count,
    case when p_utility_policy_id is null then null else 'policy' end,
    p_utility_policy_id,
    auth.uid()
  )
  returning id, contract_code into v_contract_id, v_contract_code;

  insert into smartstay.contract_tenants (contract_id, tenant_id, is_primary)
  values (v_contract_id, p_primary_tenant_id, true)
  on conflict (contract_id, tenant_id)
  do update set is_primary = excluded.is_primary;

  insert into smartstay.room_occupants (
    contract_id,
    room_id,
    tenant_id,
    is_primary_tenant,
    move_in_at,
    status,
    created_by
  )
  select
    v_contract_id,
    p_room_id,
    occupant_id,
    occupant_id = p_primary_tenant_id,
    p_start_date,
    'active'::smartstay.occupant_status,
    auth.uid()
  from unnest(v_all_occupants) as occupant_id;

  if coalesce(array_length(p_service_ids, 1), 0) > 0 then
    for v_idx in 1..array_length(p_service_ids, 1) loop
      select sc.id, sc.legacy_service_id
      into v_catalog_item
      from smartstay.service_catalog sc
      where sc.id = p_service_ids[v_idx]
        and sc.is_active = true
        and coalesce(sc.is_deleted, false) = false;

      if v_catalog_item.id is null then
        raise exception 'Không tìm thấy dịch vụ hợp lệ với id %', p_service_ids[v_idx];
      end if;

      insert into smartstay.contract_services (
        contract_id,
        service_id,
        service_catalog_id,
        fixed_price,
        quantity
      )
      values (
        v_contract_id,
        v_catalog_item.legacy_service_id,
        v_catalog_item.id,
        coalesce(p_service_prices[v_idx], 0),
        coalesce(p_service_quantities[v_idx], 1)
      );
    end loop;
  end if;

  insert into smartstay.tenant_balances (tenant_id, balance)
  values (p_primary_tenant_id, 0)
  on conflict (tenant_id) do nothing;

  update smartstay.rooms
  set status = 'occupied'::smartstay.room_status,
      updated_at = now()
  where id = p_room_id;

  v_old_values := jsonb_build_object(
    'status', 'available',
    'roomId', p_room_id
  );
  v_new_values := jsonb_build_object(
    'contractId', v_contract_id,
    'contractCode', v_contract_code,
    'roomId', p_room_id,
    'primaryTenantId', p_primary_tenant_id,
    'occupantsForBilling', v_occupant_count,
    'utilityPolicyId', p_utility_policy_id
  );

  perform private.log_audit_event(
    'contract_created',
    'contracts',
    v_contract_id::text,
    v_old_values,
    v_new_values,
    auth.uid()
  );

  return jsonb_build_object(
    'contractId', v_contract_id,
    'contractCode', v_contract_code
  );
end;
$$;

create or replace function smartstay.add_contract_occupant(
  p_contract_id integer,
  p_tenant_id integer,
  p_move_in_date date,
  p_relationship_to_primary text default null,
  p_note text default null,
  p_processed_by uuid default auth.uid()
) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_contract smartstay.contracts%rowtype;
  v_room smartstay.rooms%rowtype;
  v_active_occupants integer;
  v_existing_active_id bigint;
begin
  select *
  into v_contract
  from smartstay.contracts
  where id = p_contract_id
    and coalesce(is_deleted, false) = false
  for update;

  if v_contract.id is null then
    raise exception 'Không tìm thấy hợp đồng';
  end if;

  if v_contract.status not in ('active', 'pending_signature') then
    raise exception 'Chỉ được thêm occupant vào hợp đồng đang hiệu lực';
  end if;

  if p_tenant_id = v_contract.primary_tenant_id then
    raise exception 'Người đại diện hợp đồng không được thêm lại như occupant';
  end if;

  if p_move_in_date is null or p_move_in_date < v_contract.start_date or p_move_in_date > v_contract.end_date then
    raise exception 'Ngày vào ở không hợp lệ';
  end if;

  select *
  into v_room
  from smartstay.rooms
  where id = v_contract.room_id
  for update;

  select ro.id
  into v_existing_active_id
  from smartstay.room_occupants ro
  where ro.contract_id = p_contract_id
    and ro.tenant_id = p_tenant_id
    and ro.status = 'active'::smartstay.occupant_status
  limit 1;

  if v_existing_active_id is not null then
    raise exception 'Occupant đã tồn tại trong hợp đồng';
  end if;

  select count(*)
  into v_active_occupants
  from smartstay.room_occupants ro
  where ro.contract_id = p_contract_id
    and ro.status = 'active';

  if v_room.max_occupants is not null and v_active_occupants + 1 > v_room.max_occupants then
    raise exception 'Vượt số người tối đa của phòng';
  end if;

  if exists (
    select 1
    from smartstay.room_occupants ro
    join smartstay.contracts c on c.id = ro.contract_id
    where ro.tenant_id = p_tenant_id
      and ro.status = 'active'
      and c.status in ('active', 'pending_signature')
      and coalesce(c.is_deleted, false) = false
      and c.id <> p_contract_id
  ) then
    raise exception 'Occupant đang active tại hợp đồng khác';
  end if;

  insert into smartstay.room_occupants (
    contract_id,
    room_id,
    tenant_id,
    is_primary_tenant,
    relationship_to_primary,
    note,
    move_in_at,
    status,
    created_by
  )
  values (
    p_contract_id,
    v_contract.room_id,
    p_tenant_id,
    false,
    nullif(trim(coalesce(p_relationship_to_primary, '')), ''),
    nullif(trim(coalesce(p_note, '')), ''),
    p_move_in_date,
    'active',
    p_processed_by
  );

  select count(*)
  into v_active_occupants
  from smartstay.room_occupants ro
  where ro.contract_id = p_contract_id
    and ro.status = 'active';

  update smartstay.contracts
  set occupants_for_billing = v_active_occupants,
      terms = coalesce(terms, '{}'::jsonb) || jsonb_build_object('occupants_for_billing', v_active_occupants),
      updated_at = now()
  where id = p_contract_id;

  perform private.log_audit_event(
    'contract_occupant_added',
    'room_occupants',
    p_contract_id::text || ':' || p_tenant_id::text,
    null,
    jsonb_build_object(
      'contractId', p_contract_id,
      'tenantId', p_tenant_id,
      'moveInDate', p_move_in_date,
      'relationshipToPrimary', nullif(trim(coalesce(p_relationship_to_primary, '')), ''),
      'note', nullif(trim(coalesce(p_note, '')), ''),
      'occupantsForBilling', v_active_occupants
    ),
    p_processed_by
  );

  return jsonb_build_object(
    'contractId', p_contract_id,
    'tenantId', p_tenant_id,
    'activeOccupants', v_active_occupants
  );
end;
$$;

create or replace function smartstay.remove_contract_occupant(
  p_contract_id integer,
  p_tenant_id integer,
  p_move_out_date date,
  p_note text default null,
  p_processed_by uuid default auth.uid()
) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_row smartstay.room_occupants%rowtype;
  v_remaining integer;
begin
  select ro.*
  into v_row
  from smartstay.room_occupants ro
  where ro.contract_id = p_contract_id
    and ro.tenant_id = p_tenant_id
    and ro.status = 'active'::smartstay.occupant_status
  for update;

  if v_row.id is null then
    raise exception 'Không tìm thấy occupant còn hiệu lực trong hợp đồng';
  end if;

  if v_row.is_primary_tenant then
    raise exception 'Không được xóa người đại diện hợp đồng. Hãy dùng chuyển đại diện hoặc thanh lý';
  end if;

  if p_move_out_date is null or p_move_out_date < v_row.move_in_at then
    raise exception 'Ngày rời đi không hợp lệ';
  end if;

  update smartstay.room_occupants
  set status = 'moved_out'::smartstay.occupant_status,
      move_out_at = p_move_out_date,
      note = coalesce(nullif(trim(coalesce(p_note, '')), ''), note),
      updated_at = now()
  where id = v_row.id;

  select count(*)
  into v_remaining
  from smartstay.room_occupants ro
  where ro.contract_id = p_contract_id
    and ro.status = 'active'::smartstay.occupant_status;

  update smartstay.contracts c
  set occupants_for_billing = v_remaining,
      terms = coalesce(c.terms, '{}'::jsonb) || jsonb_build_object('occupants_for_billing', v_remaining),
      updated_at = now()
  where c.id = p_contract_id;

  perform private.log_audit_event(
    'contract_occupant_removed',
    'room_occupants',
    p_contract_id::text || ':' || p_tenant_id::text,
    jsonb_build_object(
      'contractId', p_contract_id,
      'tenantId', p_tenant_id,
      'status', 'active'
    ),
    jsonb_build_object(
      'contractId', p_contract_id,
      'tenantId', p_tenant_id,
      'status', 'moved_out',
      'moveOutDate', p_move_out_date,
      'note', nullif(trim(coalesce(p_note, '')), ''),
      'occupantsForBilling', v_remaining
    ),
    p_processed_by
  );

  return jsonb_build_object(
    'contractId', p_contract_id,
    'tenantId', p_tenant_id,
    'remainingActiveOccupants', v_remaining,
    'autoLiquidated', false
  );
end;
$$;

create or replace function smartstay.liquidate_contract(
  p_contract_id integer,
  p_termination_date date,
  p_reason text,
  p_deposit_used numeric default 0,
  p_additional_charges numeric default 0,
  p_processed_by uuid default auth.uid()
) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_room_id integer;
  v_deposit_amount numeric;
  v_remaining_active_contracts integer;
  v_unpaid_invoice_count integer;
  v_contract smartstay.contracts%rowtype;
begin
  select *
  into v_contract
  from smartstay.contracts c
  where c.id = p_contract_id
    and coalesce(c.is_deleted, false) = false
  for update;

  if v_contract.id is null then
    raise exception 'Không tìm thấy hợp đồng để thanh lý';
  end if;

  if v_contract.status not in ('active', 'pending_signature') then
    raise exception 'Chỉ được thanh lý hợp đồng đang hiệu lực';
  end if;

  if p_termination_date is null
    or p_termination_date < v_contract.start_date
    or p_termination_date > v_contract.end_date then
    raise exception 'Ngày thanh lý phải nằm trong thời hạn hợp đồng';
  end if;

  if coalesce(p_deposit_used, 0) < 0 or coalesce(p_additional_charges, 0) < 0 then
    raise exception 'Giá trị khấu trừ và chi phí phát sinh không được âm';
  end if;

  v_room_id := v_contract.room_id;
  v_deposit_amount := coalesce(v_contract.deposit_amount, 0);

  select count(*)
  into v_unpaid_invoice_count
  from smartstay.invoices i
  where i.contract_id = p_contract_id
    and coalesce(i.status::text, 'draft') not in ('paid', 'cancelled')
    and coalesce(i.balance_due, 0) > 0;

  if v_unpaid_invoice_count > 0 then
    raise exception 'Không thể thanh lý hợp đồng khi vẫn còn hóa đơn chưa thanh toán';
  end if;

  update smartstay.room_occupants
  set status = 'moved_out'::smartstay.occupant_status,
      move_out_at = coalesce(move_out_at, p_termination_date),
      updated_at = now()
  where contract_id = p_contract_id
    and status = 'active'::smartstay.occupant_status;

  update smartstay.contracts
  set status = 'terminated'::smartstay.contract_status,
      termination_reason = coalesce(nullif(trim(coalesce(p_reason, '')), ''), 'Thanh lý hợp đồng'),
      terminated_at = p_termination_date::timestamptz,
      occupants_for_billing = 0,
      updated_at = now(),
      terms = coalesce(terms, '{}'::jsonb) || jsonb_build_object('occupants_for_billing', 0)
  where id = p_contract_id;

  insert into smartstay.contract_terminations (
    contract_id,
    deposit_used,
    deposit_refunded,
    additional_charges,
    reason,
    processed_by
  )
  values (
    p_contract_id,
    greatest(coalesce(p_deposit_used, 0), 0),
    greatest(v_deposit_amount - greatest(coalesce(p_deposit_used, 0), 0) - greatest(coalesce(p_additional_charges, 0), 0), 0),
    greatest(coalesce(p_additional_charges, 0), 0),
    left(coalesce(nullif(trim(coalesce(p_reason, '')), ''), 'Thanh lý hợp đồng'), 255),
    p_processed_by
  )
  on conflict (contract_id) do update
  set deposit_used = excluded.deposit_used,
      deposit_refunded = excluded.deposit_refunded,
      additional_charges = excluded.additional_charges,
      reason = excluded.reason,
      processed_by = excluded.processed_by;

  select count(*)
  into v_remaining_active_contracts
  from smartstay.contracts c
  where c.room_id = v_room_id
    and c.id <> p_contract_id
    and c.status in ('active', 'pending_signature')
    and coalesce(c.is_deleted, false) = false;

  if v_remaining_active_contracts = 0 then
    update smartstay.rooms
    set status = 'available'::smartstay.room_status,
        updated_at = now()
    where id = v_room_id;
  end if;

  perform private.log_audit_event(
    'contract_liquidated',
    'contracts',
    p_contract_id::text,
    jsonb_build_object(
      'status', v_contract.status,
      'roomId', v_room_id,
      'depositAmount', v_deposit_amount
    ),
    jsonb_build_object(
      'status', 'terminated',
      'roomId', v_room_id,
      'terminationDate', p_termination_date,
      'reason', coalesce(nullif(trim(coalesce(p_reason, '')), ''), 'Thanh lý hợp đồng'),
      'depositUsed', greatest(coalesce(p_deposit_used, 0), 0),
      'additionalCharges', greatest(coalesce(p_additional_charges, 0), 0)
    ),
    p_processed_by
  );

  return jsonb_build_object(
    'contractId', p_contract_id,
    'roomId', v_room_id,
    'status', 'terminated'
  );
end;
$$;

create or replace function smartstay.transfer_contract_representative(
  p_old_contract_id integer,
  p_to_tenant_id integer,
  p_transfer_date date,
  p_note text default null,
  p_approved_by uuid default auth.uid()
) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_old_contract smartstay.contracts%rowtype;
  v_old_primary_tenant_id integer;
  v_new_contract_id integer;
  v_new_contract_code text;
  v_remaining_occupants integer[];
  v_occupant_count integer;
begin
  select *
  into v_old_contract
  from smartstay.contracts
  where id = p_old_contract_id
    and coalesce(is_deleted, false) = false
  for update;

  if v_old_contract.id is null then
    raise exception 'Không tìm thấy hợp đồng cần chuyển';
  end if;

  if v_old_contract.status not in ('active', 'pending_signature') then
    raise exception 'Chỉ chuyển được hợp đồng đang hiệu lực';
  end if;

  if p_transfer_date is null
    or p_transfer_date < v_old_contract.start_date
    or p_transfer_date > v_old_contract.end_date then
    raise exception 'Ngày chuyển đại diện phải nằm trong thời hạn hợp đồng';
  end if;

  v_old_primary_tenant_id := v_old_contract.primary_tenant_id;

  if v_old_primary_tenant_id is null then
    raise exception 'Hợp đồng hiện tại chưa có người đại diện';
  end if;

  if p_to_tenant_id = v_old_primary_tenant_id then
    raise exception 'Người nhận chuyển phải khác người đại diện hiện tại';
  end if;

  if not exists (
    select 1
    from smartstay.room_occupants ro
    where ro.contract_id = p_old_contract_id
      and ro.tenant_id = p_to_tenant_id
      and ro.status = 'active'::smartstay.occupant_status
  ) then
    raise exception 'Người nhận chuyển phải nằm trong danh sách occupant còn hiệu lực';
  end if;

  v_remaining_occupants := array(
    select ro.tenant_id
    from smartstay.room_occupants ro
    where ro.contract_id = p_old_contract_id
      and ro.status = 'active'::smartstay.occupant_status
      and ro.tenant_id <> v_old_primary_tenant_id
    order by ro.is_primary_tenant desc, ro.id asc
  );

  v_occupant_count := coalesce(array_length(v_remaining_occupants, 1), 0);

  if v_occupant_count = 0 then
    raise exception 'Không còn occupant ở lại để nhận chuyển hợp đồng';
  end if;

  update smartstay.contracts
  set status = 'terminated'::smartstay.contract_status,
      termination_reason = 'Chuyển người đại diện hợp đồng',
      terminated_at = p_transfer_date::timestamptz,
      occupants_for_billing = 0,
      updated_at = now()
  where id = p_old_contract_id;

  update smartstay.room_occupants
  set status = 'moved_out'::smartstay.occupant_status,
      move_out_at = coalesce(move_out_at, p_transfer_date),
      updated_at = now()
  where contract_id = p_old_contract_id
    and status = 'active'::smartstay.occupant_status;

  insert into smartstay.contracts (
    room_id,
    primary_tenant_id,
    linked_contract_id,
    start_date,
    end_date,
    signing_date,
    payment_cycle_months,
    payment_due_day,
    monthly_rent,
    deposit_amount,
    deposit_status,
    status,
    terms,
    is_deleted,
    occupants_for_billing,
    utility_billing_type,
    utility_policy_id,
    created_by
  )
  values (
    v_old_contract.room_id,
    p_to_tenant_id,
    p_old_contract_id,
    p_transfer_date,
    v_old_contract.end_date,
    p_transfer_date,
    v_old_contract.payment_cycle_months,
    coalesce(v_old_contract.payment_due_day, 5),
    v_old_contract.monthly_rent,
    v_old_contract.deposit_amount,
    v_old_contract.deposit_status,
    'active'::smartstay.contract_status,
    coalesce(v_old_contract.terms, '{}'::jsonb)
      || jsonb_build_object(
        'occupants_for_billing', v_occupant_count,
        'transferred_from_contract_id', p_old_contract_id
      ),
    false,
    v_occupant_count,
    v_old_contract.utility_billing_type,
    v_old_contract.utility_policy_id,
    p_approved_by
  )
  returning id, contract_code into v_new_contract_id, v_new_contract_code;

  update smartstay.contracts
  set linked_contract_id = v_new_contract_id
  where id = p_old_contract_id;

  insert into smartstay.contract_tenants (contract_id, tenant_id, is_primary)
  values (v_new_contract_id, p_to_tenant_id, true)
  on conflict (contract_id, tenant_id)
  do update set is_primary = true;

  insert into smartstay.room_occupants (
    contract_id,
    room_id,
    tenant_id,
    is_primary_tenant,
    move_in_at,
    status,
    created_by
  )
  select
    v_new_contract_id,
    v_old_contract.room_id,
    occupant_id,
    occupant_id = p_to_tenant_id,
    p_transfer_date,
    'active'::smartstay.occupant_status,
    p_approved_by
  from unnest(v_remaining_occupants) as occupant_id;

  insert into smartstay.contract_terminations (
    contract_id,
    deposit_used,
    deposit_refunded,
    additional_charges,
    reason,
    processed_by
  )
  values (
    p_old_contract_id,
    0,
    0,
    0,
    'Chuyển người đại diện hợp đồng',
    p_approved_by
  )
  on conflict (contract_id) do update
  set reason = excluded.reason,
      processed_by = excluded.processed_by;

  insert into smartstay.contract_transfers (
    old_contract_id,
    new_contract_id,
    room_id,
    from_tenant_id,
    to_tenant_id,
    transfer_date,
    approved_by,
    status,
    deposit_mode,
    carry_over_deposit_amount,
    note
  )
  values (
    p_old_contract_id,
    v_new_contract_id,
    v_old_contract.room_id,
    v_old_primary_tenant_id,
    p_to_tenant_id,
    p_transfer_date,
    p_approved_by,
    'completed'::smartstay.contract_transfer_status,
    'carry_over',
    coalesce(v_old_contract.deposit_amount, 0),
    nullif(trim(coalesce(p_note, '')), '')
  );

  update smartstay.rooms
  set status = 'occupied'::smartstay.room_status,
      updated_at = now()
  where id = v_old_contract.room_id;

  perform private.log_audit_event(
    'contract_representative_transferred',
    'contracts',
    p_old_contract_id::text,
    jsonb_build_object(
      'oldContractId', p_old_contract_id,
      'oldPrimaryTenantId', v_old_primary_tenant_id
    ),
    jsonb_build_object(
      'oldContractId', p_old_contract_id,
      'newContractId', v_new_contract_id,
      'newContractCode', v_new_contract_code,
      'toTenantId', p_to_tenant_id,
      'transferDate', p_transfer_date
    ),
    p_approved_by
  );

  return jsonb_build_object(
    'oldContractId', p_old_contract_id,
    'newContractId', v_new_contract_id,
    'newContractCode', v_new_contract_code
  );
end;
$$;

create or replace function smartstay.create_contract_addendum(
  p_contract_id integer,
  p_addendum_type text,
  p_title text,
  p_content text default null,
  p_effective_date date default current_date,
  p_status text default 'draft',
  p_signed_file_url text default null,
  p_summary_json jsonb default '{}'::jsonb,
  p_source_type text default 'manual',
  p_parent_addendum_id bigint default null,
  p_created_by uuid default auth.uid()
) returns smartstay.contract_addendums
language plpgsql
set search_path = ''
as $$
declare
  v_contract smartstay.contracts%rowtype;
  v_parent smartstay.contract_addendums%rowtype;
  v_root_id bigint;
  v_next_version integer;
  v_row smartstay.contract_addendums%rowtype;
begin
  select *
  into v_contract
  from smartstay.contracts c
  where c.id = p_contract_id
    and coalesce(c.is_deleted, false) = false
  for update;

  if v_contract.id is null then
    raise exception 'Không tìm thấy hợp đồng để tạo phụ lục';
  end if;

  if nullif(trim(coalesce(p_title, '')), '') is null then
    raise exception 'Tiêu đề phụ lục không được để trống';
  end if;

  if p_effective_date is null then
    raise exception 'Ngày hiệu lực phụ lục không hợp lệ';
  end if;

  if coalesce(p_addendum_type, '') not in (
    'asset_assignment',
    'asset_repricing',
    'asset_status_change',
    'rent_change',
    'service_change',
    'room_change',
    'policy_update',
    'other'
  ) then
    raise exception 'Loại phụ lục không hợp lệ';
  end if;

  if lower(coalesce(p_status, 'draft')) not in ('draft', 'signed', 'cancelled') then
    raise exception 'Trạng thái phụ lục không hợp lệ';
  end if;

  if coalesce(p_source_type, 'manual') not in ('manual', 'room_asset_auto') then
    raise exception 'Nguồn phụ lục không hợp lệ';
  end if;

  if p_parent_addendum_id is not null then
    select *
    into v_parent
    from smartstay.contract_addendums ca
    where ca.id = p_parent_addendum_id
      and ca.contract_id = p_contract_id
    for update;

    if v_parent.id is null then
      raise exception 'Không tìm thấy bản phụ lục gốc để tạo version mới';
    end if;

    v_root_id := coalesce(v_parent.parent_addendum_id, v_parent.id);
  else
    select ca.*
    into v_parent
    from smartstay.contract_addendums ca
    where ca.contract_id = p_contract_id
      and ca.addendum_type = p_addendum_type
      and ca.title = nullif(trim(coalesce(p_title, '')), '')
      and ca.source_type = coalesce(p_source_type, 'manual')
      and (
        (
          coalesce(p_summary_json, '{}'::jsonb) ? 'room_asset_id'
          and ca.summary_json ->> 'room_asset_id' = p_summary_json ->> 'room_asset_id'
        )
        or not (coalesce(p_summary_json, '{}'::jsonb) ? 'room_asset_id')
      )
    order by ca.version_no desc, ca.id desc
    limit 1
    for update;

    v_root_id := coalesce(v_parent.parent_addendum_id, v_parent.id);
  end if;

  if coalesce(p_source_type, 'manual') = 'room_asset_auto'
    and coalesce(p_summary_json, '{}'::jsonb) ? 'room_asset_id'
    and exists (
      select 1
      from smartstay.contract_addendums ca
      where ca.contract_id = p_contract_id
        and ca.addendum_type = p_addendum_type
        and ca.source_type = 'room_asset_auto'
        and ca.summary_json @> jsonb_build_object('room_asset_id', p_summary_json -> 'room_asset_id')
        and ca.summary_json ->> 'effective_date' = to_char(p_effective_date, 'YYYY-MM-DD')
    ) then
    raise exception 'Phụ lục tự động cho tài sản này đã tồn tại ở ngày hiệu lực đã chọn';
  end if;

  select coalesce(max(ca.version_no), 0) + 1
  into v_next_version
  from smartstay.contract_addendums ca
  where coalesce(ca.parent_addendum_id, ca.id) = coalesce(v_root_id, -1);

  if v_root_id is null then
    v_next_version := 1;
  end if;

  insert into smartstay.contract_addendums (
    contract_id,
    addendum_type,
    title,
    content,
    effective_date,
    status,
    signed_file_url,
    summary_json,
    created_by,
    source_type,
    parent_addendum_id,
    version_no,
    signed_at
  )
  values (
    p_contract_id,
    p_addendum_type,
    nullif(trim(coalesce(p_title, '')), ''),
    nullif(trim(coalesce(p_content, '')), ''),
    p_effective_date,
    lower(coalesce(p_status, 'draft')),
    nullif(trim(coalesce(p_signed_file_url, '')), ''),
    coalesce(p_summary_json, '{}'::jsonb) || jsonb_build_object('effective_date', to_char(p_effective_date, 'YYYY-MM-DD')),
    p_created_by,
    coalesce(p_source_type, 'manual'),
    v_root_id,
    v_next_version,
    case when lower(coalesce(p_status, 'draft')) = 'signed' then now() else null end
  )
  returning * into v_row;

  perform private.log_audit_event(
    'contract_addendum_created',
    'contract_addendums',
    v_row.id::text,
    null,
    jsonb_build_object(
      'contractId', p_contract_id,
      'addendumType', p_addendum_type,
      'sourceType', coalesce(p_source_type, 'manual'),
      'versionNo', v_next_version
    ),
    p_created_by
  );

  return v_row;
end;
$$;

create or replace function smartstay.create_room_asset_contract_addendum()
returns trigger
language plpgsql
set search_path to 'smartstay', 'public'
as $$
declare
  v_contract record;
  v_asset_name text;
  v_addendum_type text;
  v_title text;
  v_content text;
  v_summary jsonb;
  v_effective_date date;
begin
  if new.room_id is null then
    return null;
  end if;

  select c.id, c.contract_code
  into v_contract
  from smartstay.contracts c
  where c.room_id = new.room_id
    and coalesce(c.is_deleted, false) = false
    and c.status in ('active', 'pending_signature')
    and daterange(c.start_date, c.end_date, '[]') && daterange(
      coalesce(new.billing_start_date, current_date),
      coalesce(new.billing_end_date, current_date),
      '[]'
    )
  order by c.start_date desc
  limit 1;

  if v_contract.id is null then
    return null;
  end if;

  select a.name
  into v_asset_name
  from smartstay.assets a
  where a.id = new.asset_id;

  if tg_op = 'INSERT' then
    if not new.is_billable or coalesce(new.monthly_charge, 0) <= 0 or new.billing_status <> 'active' then
      return null;
    end if;

    v_addendum_type := 'asset_assignment';
    v_effective_date := coalesce(new.billing_start_date, new.assigned_at, current_date);
    v_title := format('Bổ sung tài sản tính phí: %s', coalesce(v_asset_name, new.billing_label));
    v_content := format(
      'Bổ sung tài sản tính phí vào phòng. Mức thu %s/tháng, hiệu lực từ %s.',
      to_char(new.monthly_charge, 'FM999G999G999G990D00'),
      to_char(v_effective_date, 'DD/MM/YYYY')
    );
    v_summary := jsonb_build_object(
      'room_asset_id', new.id,
      'asset_id', new.asset_id,
      'asset_name', coalesce(v_asset_name, new.billing_label),
      'monthly_charge', new.monthly_charge,
      'billing_status', new.billing_status,
      'effective_date', v_effective_date
    );
  elsif old.room_id is distinct from new.room_id
    and new.room_id is not null
    and new.is_billable
    and coalesce(new.monthly_charge, 0) > 0 then
    v_addendum_type := 'asset_assignment';
    v_effective_date := coalesce(new.billing_start_date, new.assigned_at, current_date);
    v_title := format('Bổ sung tài sản tính phí: %s', coalesce(v_asset_name, new.billing_label));
    v_content := format(
      'Chuyển tài sản sang phòng đang có hợp đồng và bắt đầu tính %s/tháng từ %s.',
      to_char(new.monthly_charge, 'FM999G999G999G990D00'),
      to_char(v_effective_date, 'DD/MM/YYYY')
    );
    v_summary := jsonb_build_object(
      'room_asset_id', new.id,
      'asset_id', new.asset_id,
      'asset_name', coalesce(v_asset_name, new.billing_label),
      'monthly_charge', new.monthly_charge,
      'billing_status', new.billing_status,
      'effective_date', v_effective_date
    );
  elsif coalesce(old.monthly_charge, 0) is distinct from coalesce(new.monthly_charge, 0)
    and new.is_billable
    and coalesce(new.monthly_charge, 0) > 0 then
    v_addendum_type := 'asset_repricing';
    v_effective_date := coalesce(new.billing_start_date, current_date);
    v_title := format('Điều chỉnh giá tài sản tính phí: %s', coalesce(v_asset_name, new.billing_label));
    v_content := format(
      'Điều chỉnh mức thu từ %s/tháng lên %s/tháng, hiệu lực từ %s.',
      to_char(coalesce(old.monthly_charge, 0), 'FM999G999G999G990D00'),
      to_char(new.monthly_charge, 'FM999G999G999G990D00'),
      to_char(v_effective_date, 'DD/MM/YYYY')
    );
    v_summary := jsonb_build_object(
      'room_asset_id', new.id,
      'asset_id', new.asset_id,
      'asset_name', coalesce(v_asset_name, new.billing_label),
      'previous_monthly_charge', old.monthly_charge,
      'monthly_charge', new.monthly_charge,
      'billing_status', new.billing_status,
      'effective_date', v_effective_date
    );
  elsif old.billing_status is distinct from new.billing_status
    and new.billing_status in ('suspended', 'stopped') then
    v_addendum_type := 'asset_status_change';
    v_effective_date := coalesce(new.billing_end_date, current_date);
    v_title := format('Tạm dừng tính phí tài sản: %s', coalesce(v_asset_name, new.billing_label));
    v_content := format(
      'Ngừng tính phí tài sản từ %s do trạng thái %s.',
      to_char(v_effective_date, 'DD/MM/YYYY'),
      new.billing_status
    );
    v_summary := jsonb_build_object(
      'room_asset_id', new.id,
      'asset_id', new.asset_id,
      'asset_name', coalesce(v_asset_name, new.billing_label),
      'previous_billing_status', old.billing_status,
      'billing_status', new.billing_status,
      'effective_date', v_effective_date
    );
  else
    return null;
  end if;

  perform smartstay.create_contract_addendum(
    p_contract_id => v_contract.id,
    p_addendum_type => v_addendum_type,
    p_title => v_title,
    p_content => v_content,
    p_effective_date => v_effective_date,
    p_status => 'draft',
    p_signed_file_url => null,
    p_summary_json => v_summary,
    p_source_type => 'room_asset_auto',
    p_parent_addendum_id => null,
    p_created_by => auth.uid()
  );

  return null;
exception
  when others then
    if sqlerrm like '%đã tồn tại ở ngày hiệu lực%' then
      return null;
    end if;
    raise;
end;
$$;

commit;
