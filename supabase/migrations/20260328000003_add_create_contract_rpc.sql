set check_function_bodies = off;
set search_path = smartstay, public;

-- Atomic contract creation: inserts contracts + contract_tenants + contract_services
-- + updates room status in one transaction.
-- Called by the create-contract Edge Function via supabase.rpc().
create or replace function smartstay.create_contract(
  p_room_id              bigint,
  p_start_date           date,
  p_end_date             date,
  p_monthly_rent         numeric,
  p_deposit_amount       numeric,
  p_payment_cycle_months integer,
  p_tenant_ids           bigint[],
  p_primary_tenant_id    bigint,
  p_service_ids          bigint[]         default '{}',
  p_service_prices       numeric[]        default '{}',
  p_service_quantities   integer[]        default '{}',
  p_mark_deposit_received boolean         default false
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_contract_id   bigint;
  v_contract_code text;
  v_tenant_id     bigint;
  i               integer;
begin
  -- Verify room exists and is not already occupied
  if not exists (
    select 1 from smartstay.rooms where id = p_room_id and status != 'occupied'
  ) then
    raise exception 'Room % is not available (not found or already occupied)', p_room_id;
  end if;

  -- Insert the contract
  insert into smartstay.contracts (
    room_id,
    start_date,
    end_date,
    monthly_rent,
    deposit_amount,
    payment_cycle_months,
    status,
    deposit_status,
    is_deleted
  )
  values (
    p_room_id,
    p_start_date,
    p_end_date,
    p_monthly_rent,
    p_deposit_amount,
    p_payment_cycle_months,
    'active',
    case when p_mark_deposit_received then 'received' else 'pending' end,
    false
  )
  returning id, contract_code into v_contract_id, v_contract_code;

  -- Insert contract_tenants rows
  foreach v_tenant_id in array p_tenant_ids loop
    insert into smartstay.contract_tenants (contract_id, tenant_id, is_primary)
    values (v_contract_id, v_tenant_id, v_tenant_id = p_primary_tenant_id);
  end loop;

  -- Insert contract_services rows (arrays are index-aligned)
  for i in 1..array_length(p_service_ids, 1) loop
    insert into smartstay.contract_services (contract_id, service_id, fixed_price, quantity)
    values (
      v_contract_id,
      p_service_ids[i],
      case when array_length(p_service_prices, 1) >= i then p_service_prices[i] else null end,
      case when array_length(p_service_quantities, 1) >= i then p_service_quantities[i] else 1 end
    );
  end loop;

  -- Mark room as occupied
  update smartstay.rooms
  set status = 'occupied'
  where id = p_room_id;

  return jsonb_build_object(
    'contractId',   v_contract_id,
    'contractCode', v_contract_code
  );
end;
$$;
