begin;

-- Reset the minimal demo slice so repeated seeding stays deterministic.
delete from smartstay.invoice_items
where invoice_id in (
  select i.id
  from smartstay.invoices i
  join smartstay.contracts c on c.id = i.contract_id
  where c.contract_code = 'DEMO-UTILITY-2000'
);

delete from smartstay.invoice_utility_snapshots
where contract_id in (
  select id
  from smartstay.contracts
  where contract_code = 'DEMO-UTILITY-2000'
);

delete from smartstay.invoice_utility_overrides
where contract_id in (
  select id
  from smartstay.contracts
  where contract_code = 'DEMO-UTILITY-2000'
);

delete from smartstay.invoices
where contract_id in (
  select id
  from smartstay.contracts
  where contract_code = 'DEMO-UTILITY-2000'
);

delete from smartstay.contract_services
where contract_id in (
  select id
  from smartstay.contracts
  where contract_code = 'DEMO-UTILITY-2000'
);

delete from smartstay.contract_tenants
where contract_id in (
  select id
  from smartstay.contracts
  where contract_code = 'DEMO-UTILITY-2000'
);

update smartstay.rooms
set status = 'available'
where id in (
  select room_id
  from smartstay.contracts
  where contract_code = 'DEMO-UTILITY-2000'
);

delete from smartstay.contracts
where contract_code = 'DEMO-UTILITY-2000';

delete from smartstay.tenant_balances
where tenant_id in (
  select id
  from smartstay.tenants
  where phone = '0900002000'
);

delete from smartstay.tenants
where phone = '0900002000';

delete from smartstay.utility_policy_device_adjustments
where utility_policy_id in (
  select id
  from smartstay.utility_policies
  where code = 'DEMO-UTILITY-SYSTEM'
);

delete from smartstay.utility_policies
where code = 'DEMO-UTILITY-SYSTEM';

delete from smartstay.service_prices
where service_id in (
  select id
  from smartstay.services
  where name = 'Internet Demo 500'
);

delete from smartstay.services
where name = 'Internet Demo 500';

delete from smartstay.rooms
where room_code = 'D-2000'
  and building_id in (
    select id
    from smartstay.buildings
    where name = 'Demo Utility Building'
  );

delete from smartstay.buildings
where name = 'Demo Utility Building';

insert into smartstay.system_settings (
  key,
  value,
  description,
  group_name,
  is_sensitive
)
values (
  'payment.bank_transfer_details',
  jsonb_build_object(
    'bankName', 'MBBank',
    'bankCode', 'MB',
    'accountNumber', '0565484027',
    'accountName', 'SMARTSTAY DEMO',
    'branch', 'Quan 1'
  ),
  'Thong tin chuyen khoan cho bo du lieu demo utility toi gian',
  'payment',
  false
)
on conflict (key) do update
set
  value = excluded.value,
  description = excluded.description,
  group_name = excluded.group_name,
  is_sensitive = excluded.is_sensitive,
  updated_at = now();

with inserted_building as (
  insert into smartstay.buildings (
    name,
    address,
    description,
    total_floors,
    is_deleted
  )
  values (
    'Demo Utility Building',
    '2000 Duong Demo, Quan 1, TP HCM',
    'Bo du lieu toi gian de demo hop dong + hoa don tong 2.000 VND',
    1,
    false
  )
  returning id
),
inserted_room as (
  insert into smartstay.rooms (
    building_id,
    room_code,
    floor_number,
    area_sqm,
    room_type,
    max_occupants,
    amenities,
    base_rent,
    status,
    is_deleted
  )
  select
    id,
    'D-2000',
    2,
    20,
    'studio',
    2,
    '[]'::jsonb,
    500,
    'available'::smartstay.room_status,
    false
  from inserted_building
  returning id
),
inserted_tenant as (
  insert into smartstay.tenants (
    full_name,
    id_number,
    phone,
    email,
    permanent_address,
    emergency_contact_name,
    emergency_contact_phone,
    is_deleted
  )
  values (
    'Khach Demo Utility 2000',
    '079200020000',
    '0900002000',
    'demo.utility2000@smartstay.local',
    '2000 Duong Demo, Quan 1, TP HCM',
    'Lien he Demo',
    '0900002001',
    false
  )
  returning id
),
inserted_balance as (
  insert into smartstay.tenant_balances (tenant_id, balance)
  select id, 0
  from inserted_tenant
  returning tenant_id
),
inserted_service as (
  insert into smartstay.services (
    name,
    calc_type,
    is_active,
    is_deleted
  )
  values (
    'Internet Demo 500',
    'flat_rate',
    true,
    false
  )
  returning id
),
inserted_service_price as (
  insert into smartstay.service_prices (
    service_id,
    unit_price,
    effective_from,
    effective_to,
    is_active
  )
  select
    id,
    500,
    date '2026-01-01',
    null,
    true
  from inserted_service
  returning service_id
),
inserted_contract as (
  insert into smartstay.contracts (
    contract_code,
    room_id,
    start_date,
    end_date,
    signing_date,
    payment_cycle_months,
    monthly_rent,
    deposit_amount,
    deposit_status,
    status,
    terms,
    is_deleted
  )
  select
    'DEMO-UTILITY-2000',
    r.id,
    date '2026-04-01',
    date '2027-03-31',
    date '2026-04-01',
    1,
    500,
    0,
    'received'::smartstay.deposit_status,
    'active'::smartstay.contract_status,
    jsonb_build_object(
      'occupants_for_billing', 1,
      'payment_due_day', 15,
      'demo_seed', true
    ),
    false
  from inserted_room r
  returning id, room_id
),
inserted_contract_tenant as (
  insert into smartstay.contract_tenants (
    contract_id,
    tenant_id,
    is_primary
  )
  select
    c.id,
    t.id,
    true
  from inserted_contract c
  cross join inserted_tenant t
  returning contract_id
),
inserted_contract_service as (
  insert into smartstay.contract_services (
    contract_id,
    service_id,
    quantity,
    fixed_price
  )
  select
    c.id,
    s.id,
    1,
    500
  from inserted_contract c
  cross join inserted_service s
  returning contract_id
),
updated_room as (
  update smartstay.rooms
  set status = 'occupied'::smartstay.room_status
  where id in (select room_id from inserted_contract)
  returning id
),
inserted_policy as (
  insert into smartstay.utility_policies (
    code,
    name,
    scope_type,
    scope_id,
    is_active,
    description,
    electric_base_amount,
    water_base_amount,
    water_per_person_amount,
    electric_hot_season_multiplier,
    location_multiplier,
    season_months,
    rounding_increment,
    min_electric_floor,
    min_water_floor,
    effective_from,
    effective_to,
    created_by
  )
  values (
    'DEMO-UTILITY-SYSTEM',
    'Demo Utility Policy 2K',
    'system'::smartstay.utility_policy_scope,
    null,
    true,
    'Policy toi gian de utility moi co the tinh hoa don demo 2.000 VND.',
    0,
    0,
    0,
    1,
    1,
    '[]'::jsonb,
    1000,
    0,
    0,
    date '2026-01-01',
    null,
    null
  )
  returning id
)
insert into smartstay.invoice_utility_overrides (
  contract_id,
  invoice_id,
  billing_period,
  occupants_for_billing_override,
  electric_base_override,
  electric_final_override,
  water_base_override,
  water_final_override,
  location_multiplier_override,
  season_months_override,
  electric_hot_season_multiplier_override,
  reason,
  old_values_json,
  new_values_json,
  created_by
)
select
  c.id,
  null,
  '2026-04',
  1,
  0,
  500,
  0,
  500,
  1,
  '[]'::jsonb,
  1,
  'Force utility tong 1.000 VND de hoa don tong hop = 2.000 VND',
  jsonb_build_object(
    'billing_period', '2026-04',
    'policy_code', 'DEMO-UTILITY-SYSTEM'
  ),
  jsonb_build_object(
    'rent_amount', 500,
    'service_amount', 500,
    'electric_final_override', 500,
    'water_final_override', 500,
    'expected_total_amount', 2000
  ),
  null
from inserted_contract c;

commit;
