create or replace function smartstay.create_contract_v2(
  p_room_id integer,
  p_start_date date,
  p_end_date date,
  p_monthly_rent numeric,
  p_deposit_amount numeric,
  p_payment_cycle_months integer,
  p_primary_tenant_id integer,
  p_occupant_ids integer[] default '{}'::integer[],
  p_payment_due_day integer default 5,
  p_service_ids integer[] default '{}'::integer[],
  p_service_prices numeric[] default '{}'::numeric[],
  p_service_quantities integer[] default '{}'::integer[],
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
    room_id, primary_tenant_id, start_date, end_date, signing_date, payment_cycle_months, payment_due_day,
    monthly_rent, deposit_amount, deposit_status, status, terms, is_deleted
  )
  values (
    p_room_id, p_primary_tenant_id, p_start_date, p_end_date, p_start_date, coalesce(p_payment_cycle_months, 1),
    p_payment_due_day, coalesce(p_monthly_rent, 0), coalesce(p_deposit_amount, 0),
    case when coalesce(p_mark_deposit_received, false) then 'received'::smartstay.deposit_status else 'pending'::smartstay.deposit_status end,
    'active'::smartstay.contract_status,
    jsonb_build_object(
      'occupants_for_billing', v_occupant_count,
      'contract_model', 'single_representative',
      'is_supplementary_contract', v_primary_active_contract_count > 0,
      'primary_tenant_active_contract_count', v_primary_active_contract_count
    ),
    false
  )
  returning id, contract_code into v_contract_id, v_contract_code;

  insert into smartstay.contract_tenants (contract_id, tenant_id, is_primary)
  values (v_contract_id, p_primary_tenant_id, true)
  on conflict (contract_id, tenant_id) do update set is_primary = excluded.is_primary;

  insert into smartstay.room_occupants (contract_id, room_id, tenant_id, is_primary_tenant, move_in_at, status)
  select v_contract_id, p_room_id, occupant_id, occupant_id = p_primary_tenant_id, p_start_date, 'active'::smartstay.occupant_status
  from unnest(v_all_occupants) as occupant_id;

  if coalesce(array_length(p_service_ids, 1), 0) > 0 then
    for v_idx in 1..array_length(p_service_ids, 1) loop
      insert into smartstay.contract_services (contract_id, service_id, fixed_price, quantity)
      values (v_contract_id, p_service_ids[v_idx], coalesce(p_service_prices[v_idx], 0), coalesce(p_service_quantities[v_idx], 1));
    end loop;
  end if;

  insert into smartstay.tenant_balances (tenant_id, balance)
  values (p_primary_tenant_id, 0)
  on conflict (tenant_id) do nothing;

  update smartstay.rooms
  set status = 'occupied'::smartstay.room_status,
      updated_at = now()
  where id = p_room_id;

  return jsonb_build_object('contractId', v_contract_id, 'contractCode', v_contract_code);
end;
$$;
