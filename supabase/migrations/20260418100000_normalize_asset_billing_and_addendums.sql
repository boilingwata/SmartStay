begin;

alter table smartstay.room_assets
  alter column room_id drop not null;

alter table smartstay.room_assets
  add column if not exists assigned_at date,
  add column if not exists removed_at date,
  add column if not exists is_billable boolean not null default false,
  add column if not exists billing_label text,
  add column if not exists monthly_charge numeric(12,2) not null default 0,
  add column if not exists billing_start_date date,
  add column if not exists billing_end_date date,
  add column if not exists billing_status text not null default 'inactive',
  add column if not exists billing_notes text,
  add column if not exists broken_reported_at timestamp with time zone;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'room_assets_monthly_charge_check'
      and conrelid = 'smartstay.room_assets'::regclass
  ) then
    alter table smartstay.room_assets
      add constraint room_assets_monthly_charge_check
      check (monthly_charge >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'room_assets_billing_status_check'
      and conrelid = 'smartstay.room_assets'::regclass
  ) then
    alter table smartstay.room_assets
      add constraint room_assets_billing_status_check
      check (billing_status in ('inactive', 'active', 'suspended', 'stopped'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'room_assets_billing_date_check'
      and conrelid = 'smartstay.room_assets'::regclass
  ) then
    alter table smartstay.room_assets
      add constraint room_assets_billing_date_check
      check (
        billing_start_date is null
        or billing_end_date is null
        or billing_end_date >= billing_start_date
      );
  end if;
end $$;

update smartstay.room_assets ra
set assigned_at = coalesce(ra.assigned_at, ra.purchase_date, ra.created_at::date, current_date)
where ra.room_id is not null
  and ra.assigned_at is null;

update smartstay.room_assets ra
set billing_label = coalesce(nullif(trim(ra.billing_label), ''), format('Phụ phí thiết bị: %s', a.name))
from smartstay.assets a
where a.id = ra.asset_id
  and coalesce(nullif(trim(ra.billing_label), ''), '') = '';

create index if not exists idx_room_assets_room_billing
  on smartstay.room_assets (room_id, is_billable, billing_status, billing_start_date, billing_end_date);

alter table smartstay.contract_addendums
  add column if not exists addendum_type text not null default 'other',
  add column if not exists summary_json jsonb not null default '{}'::jsonb,
  add column if not exists signed_at timestamp with time zone;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'contract_addendums_addendum_type_check'
      and conrelid = 'smartstay.contract_addendums'::regclass
  ) then
    alter table smartstay.contract_addendums
      add constraint contract_addendums_addendum_type_check
      check (
        addendum_type in (
          'asset_assignment',
          'asset_repricing',
          'asset_status_change',
          'rent_change',
          'service_change',
          'room_change',
          'policy_update',
          'other'
        )
      );
  end if;
end $$;

update smartstay.contract_addendums
set addendum_type = case
  when coalesce(title, '') ilike '%tài sản%' or coalesce(content, '') ilike '%tài sản%' then 'asset_assignment'
  when coalesce(title, '') ilike '%giá%' or coalesce(content, '') ilike '%giá%' then 'rent_change'
  else 'other'
end
where addendum_type = 'other';

alter table smartstay.invoice_items
  add column if not exists item_type text not null default 'other',
  add column if not exists source_ref_type text,
  add column if not exists source_ref_id bigint;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'invoice_items_item_type_check'
      and conrelid = 'smartstay.invoice_items'::regclass
  ) then
    alter table smartstay.invoice_items
      add constraint invoice_items_item_type_check
      check (
        item_type in (
          'rent',
          'utility_electric',
          'utility_water',
          'service',
          'asset',
          'discount',
          'other'
        )
      );
  end if;
end $$;

update smartstay.invoice_items
set item_type = case
  when translate(lower(description), 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd') like '%giam tru%' then 'discount'
  when translate(lower(description), 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd') like '%dien%' then 'utility_electric'
  when translate(lower(description), 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd') like '%nuoc%' then 'utility_water'
  when translate(lower(description), 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd') like '%thue%' then 'rent'
  when translate(lower(description), 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd') like '%phu phi thiet bi%' then 'asset'
  else 'service'
end
where item_type = 'other';

create or replace function smartstay.sync_room_asset_billing_fields()
returns trigger
language plpgsql
set search_path to 'smartstay', 'public'
as $$
declare
  v_asset_name text;
begin
  select a.name
  into v_asset_name
  from smartstay.assets a
  where a.id = new.asset_id;

  if new.room_id is null then
    new.assigned_at := null;
    new.removed_at := coalesce(new.removed_at, current_date);
    new.is_billable := false;
    new.billing_status := 'inactive';
    new.billing_start_date := null;
    new.billing_end_date := null;
  else
    new.removed_at := null;
    new.assigned_at := coalesce(new.assigned_at, old.assigned_at, current_date);

    if coalesce(nullif(trim(new.billing_label), ''), '') = '' then
      new.billing_label := format(
        'Phụ phí thiết bị: %s',
        coalesce(v_asset_name, format('Tài sản #%s', new.asset_id))
      );
    end if;

    if new.is_billable and coalesce(new.monthly_charge, 0) > 0 then
      new.billing_start_date := coalesce(new.billing_start_date, new.assigned_at, current_date);
      if coalesce(new.billing_status, '') in ('', 'inactive') then
        new.billing_status := 'active';
      end if;
    else
      new.billing_status := 'inactive';
    end if;
  end if;

  if new.status in ('disposed', 'cancelled') then
    new.billing_status := 'stopped';
    new.billing_end_date := coalesce(new.billing_end_date, current_date);
    new.removed_at := coalesce(new.removed_at, current_date);
  elsif new.broken_reported_at is not null and new.billing_status = 'active' then
    new.billing_status := 'suspended';
    new.billing_end_date := coalesce(new.billing_end_date, new.broken_reported_at::date, current_date);
  end if;

  if coalesce(new.monthly_charge, 0) < 0 then
    raise exception 'Monthly charge must be >= 0';
  end if;

  if new.billing_start_date is not null
    and new.billing_end_date is not null
    and new.billing_end_date < new.billing_start_date then
    raise exception 'billing_end_date cannot be before billing_start_date';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_room_assets_sync_billing_fields on smartstay.room_assets;

create trigger trg_room_assets_sync_billing_fields
before insert or update of room_id, status, is_billable, monthly_charge, billing_label, billing_start_date, billing_end_date, billing_status, broken_reported_at
on smartstay.room_assets
for each row
execute function smartstay.sync_room_asset_billing_fields();

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

  if exists (
    select 1
    from smartstay.contract_addendums ca
    where ca.contract_id = v_contract.id
      and ca.addendum_type = v_addendum_type
      and ca.summary_json @> jsonb_build_object('room_asset_id', new.id)
      and ca.summary_json ->> 'effective_date' = to_char(v_effective_date, 'YYYY-MM-DD')
  ) then
    return null;
  end if;

  insert into smartstay.contract_addendums (
    contract_id,
    addendum_type,
    title,
    content,
    effective_date,
    status,
    summary_json
  )
  values (
    v_contract.id,
    v_addendum_type,
    v_title,
    v_content,
    v_effective_date,
    'draft',
    v_summary || jsonb_build_object('effective_date', to_char(v_effective_date, 'YYYY-MM-DD'))
  );

  return null;
end;
$$;

drop trigger if exists trg_room_assets_create_addendum on smartstay.room_assets;

create trigger trg_room_assets_create_addendum
after insert or update of room_id, is_billable, monthly_charge, billing_start_date, billing_end_date, billing_status, broken_reported_at
on smartstay.room_assets
for each row
execute function smartstay.create_room_asset_contract_addendum();

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
set search_path to 'smartstay', 'public'
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
    item_type,
    source_ref_type,
    source_ref_id,
    sort_order
  )
  select
    v_invoice_id,
    coalesce(item ->> 'description', 'Utility item'),
    coalesce((item ->> 'quantity')::numeric, 1),
    coalesce((item ->> 'unitPrice')::numeric, 0),
    coalesce((item ->> 'lineTotal')::numeric, 0),
    coalesce(nullif(item ->> 'itemType', ''), 'other'),
    nullif(item ->> 'sourceRefType', ''),
    nullif(item ->> 'sourceRefId', '')::bigint,
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
  is 'Persist invoice utility policy-based trong 1 transaction: invoices + invoice_items + invoice_utility_snapshots, với item_type chuẩn cho từng dòng.';

commit;
