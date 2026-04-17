begin;

create or replace function smartstay.create_policy_utility_invoice(
  p_contract_id bigint,
  p_billing_period text,
  p_due_date date,
  p_subtotal numeric,
  p_total_amount numeric,
  p_note text default null,
  p_invoice_items jsonb default '[]'::jsonb,
  p_snapshot jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = smartstay, public
as $$
declare
  v_invoice_id integer;
  v_invoice_code text;
  v_snapshot_id bigint;
begin
  if p_contract_id is null or p_contract_id <= 0 then
    raise exception 'Invalid contract id';
  end if;

  if p_billing_period is null or p_billing_period !~ '^\d{4}-\d{2}$' then
    raise exception 'Invalid billing period: %', p_billing_period;
  end if;

  if p_due_date is null then
    raise exception 'Due date is required';
  end if;

  if p_subtotal is null or p_subtotal < 0 then
    raise exception 'Subtotal must be >= 0';
  end if;

  if p_total_amount is null or p_total_amount < 0 then
    raise exception 'Total amount must be >= 0';
  end if;

  if jsonb_typeof(coalesce(p_invoice_items, '[]'::jsonb)) <> 'array' then
    raise exception 'Invoice items payload must be a JSON array';
  end if;

  if jsonb_array_length(coalesce(p_invoice_items, '[]'::jsonb)) = 0 then
    raise exception 'Invoice items payload cannot be empty';
  end if;

  if jsonb_typeof(coalesce(p_snapshot, '{}'::jsonb)) <> 'object' then
    raise exception 'Snapshot payload must be a JSON object';
  end if;

  if coalesce(nullif(p_snapshot ->> 'roomId', ''), '') = '' then
    raise exception 'Snapshot roomId is required';
  end if;

  if coalesce(nullif(p_snapshot ->> 'periodStart', ''), '') = '' then
    raise exception 'Snapshot periodStart is required';
  end if;

  if coalesce(nullif(p_snapshot ->> 'periodEnd', ''), '') = '' then
    raise exception 'Snapshot periodEnd is required';
  end if;

  if coalesce(nullif(p_snapshot ->> 'policySourceType', ''), '') = '' then
    raise exception 'Snapshot policySourceType is required';
  end if;

  if coalesce((p_snapshot ->> 'occupantsForBilling')::integer, 0) <= 0 then
    raise exception 'Snapshot occupantsForBilling must be > 0';
  end if;

  if coalesce((p_snapshot ->> 'occupiedDays')::integer, 0) <= 0 then
    raise exception 'Snapshot occupiedDays must be > 0';
  end if;

  if coalesce((p_snapshot ->> 'daysInPeriod')::integer, 0) <= 0 then
    raise exception 'Snapshot daysInPeriod must be > 0';
  end if;

  if coalesce((p_snapshot ->> 'electricFinalAmount')::numeric, -1) < 0 then
    raise exception 'Snapshot electricFinalAmount must be >= 0';
  end if;

  if coalesce((p_snapshot ->> 'waterFinalAmount')::numeric, -1) < 0 then
    raise exception 'Snapshot waterFinalAmount must be >= 0';
  end if;

  if exists (
    select 1
    from smartstay.invoices i
    where i.contract_id = p_contract_id
      and i.billing_period = p_billing_period
      and i.status <> 'cancelled'
  ) then
    raise exception 'Invoice already exists for contract % and billing period %', p_contract_id, p_billing_period;
  end if;

  insert into smartstay.invoices (
    contract_id,
    billing_period,
    subtotal,
    tax_amount,
    total_amount,
    amount_paid,
    due_date,
    status,
    notes
  )
  values (
    p_contract_id,
    p_billing_period,
    p_subtotal,
    0,
    p_total_amount,
    0,
    p_due_date,
    'pending_payment'::smartstay.invoice_status,
    nullif(trim(coalesce(p_note, '')), '')
  )
  returning id, invoice_code into v_invoice_id, v_invoice_code;

  insert into smartstay.invoice_items (
    invoice_id,
    description,
    quantity,
    unit_price,
    line_total,
    sort_order
  )
  select
    v_invoice_id,
    coalesce(item ->> 'description', 'Utility item'),
    coalesce((item ->> 'quantity')::numeric, 1),
    coalesce((item ->> 'unitPrice')::numeric, 0),
    coalesce((item ->> 'lineTotal')::numeric, 0),
    coalesce((item ->> 'sortOrder')::integer, ordinality::integer)
  from jsonb_array_elements(coalesce(p_invoice_items, '[]'::jsonb)) with ordinality as items(item, ordinality);

  insert into smartstay.invoice_utility_snapshots (
    invoice_id,
    contract_id,
    room_id,
    billing_run_id,
    override_id,
    resolved_policy_id,
    billing_period,
    period_start,
    period_end,
    policy_source_type,
    occupants_for_billing,
    occupied_days,
    days_in_period,
    prorate_ratio,
    electric_base_amount,
    electric_device_surcharge,
    electric_subtotal,
    electric_season_multiplier,
    electric_location_multiplier,
    electric_raw_amount,
    electric_rounded_amount,
    min_electric_floor,
    electric_final_amount,
    water_base_amount,
    water_per_person_amount,
    water_person_charge,
    water_subtotal,
    water_location_multiplier,
    water_raw_amount,
    water_rounded_amount,
    min_water_floor,
    water_final_amount,
    rounding_increment,
    resolved_device_surcharges_json,
    warnings_json,
    formula_snapshot_json
  )
  values (
    v_invoice_id,
    p_contract_id,
    (p_snapshot ->> 'roomId')::integer,
    nullif(p_snapshot ->> 'billingRunId', '')::bigint,
    nullif(p_snapshot ->> 'overrideId', '')::bigint,
    nullif(p_snapshot ->> 'resolvedPolicyId', '')::bigint,
    p_billing_period,
    (p_snapshot ->> 'periodStart')::date,
    (p_snapshot ->> 'periodEnd')::date,
    p_snapshot ->> 'policySourceType',
    (p_snapshot ->> 'occupantsForBilling')::integer,
    (p_snapshot ->> 'occupiedDays')::integer,
    (p_snapshot ->> 'daysInPeriod')::integer,
    coalesce((p_snapshot ->> 'prorateRatio')::numeric, 0),
    coalesce((p_snapshot ->> 'electricBaseAmount')::numeric, 0),
    coalesce((p_snapshot ->> 'electricDeviceSurcharge')::numeric, 0),
    coalesce((p_snapshot ->> 'electricSubtotal')::numeric, 0),
    coalesce((p_snapshot ->> 'electricSeasonMultiplier')::numeric, 1),
    coalesce((p_snapshot ->> 'electricLocationMultiplier')::numeric, 1),
    coalesce((p_snapshot ->> 'electricRawAmount')::numeric, 0),
    coalesce((p_snapshot ->> 'electricRoundedAmount')::numeric, 0),
    coalesce((p_snapshot ->> 'minElectricFloor')::numeric, 0),
    (p_snapshot ->> 'electricFinalAmount')::numeric,
    coalesce((p_snapshot ->> 'waterBaseAmount')::numeric, 0),
    coalesce((p_snapshot ->> 'waterPerPersonAmount')::numeric, 0),
    coalesce((p_snapshot ->> 'waterPersonCharge')::numeric, 0),
    coalesce((p_snapshot ->> 'waterSubtotal')::numeric, 0),
    coalesce((p_snapshot ->> 'waterLocationMultiplier')::numeric, 1),
    coalesce((p_snapshot ->> 'waterRawAmount')::numeric, 0),
    coalesce((p_snapshot ->> 'waterRoundedAmount')::numeric, 0),
    coalesce((p_snapshot ->> 'minWaterFloor')::numeric, 0),
    (p_snapshot ->> 'waterFinalAmount')::numeric,
    coalesce((p_snapshot ->> 'roundingIncrement')::numeric, 1000),
    coalesce(p_snapshot -> 'resolvedDeviceSurcharges', '[]'::jsonb),
    coalesce(p_snapshot -> 'warnings', '[]'::jsonb),
    coalesce(p_snapshot -> 'formulaSnapshot', '{}'::jsonb)
  )
  returning id into v_snapshot_id;

  if v_snapshot_id is null then
    raise exception 'Utility snapshot insert failed for invoice %', v_invoice_id;
  end if;

  return jsonb_build_object(
    'invoiceId', v_invoice_id,
    'invoiceCode', v_invoice_code,
    'snapshotId', v_snapshot_id
  );
end;
$$;

comment on function smartstay.create_policy_utility_invoice(bigint, text, date, numeric, numeric, text, jsonb, jsonb)
is 'Persist utility invoice in one transaction: invoice + invoice_items + mandatory immutable snapshot, without writing generated invoice columns.';

commit;
