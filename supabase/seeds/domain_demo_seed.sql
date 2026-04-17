set search_path = smartstay, public;

with default_building as (
  select id
  from smartstay.buildings
  where coalesce(is_deleted, false) = false
  order by id
  limit 1
)
insert into smartstay.amenity_catalog (code, name, description, building_id, is_active, is_deleted)
select seed.code, seed.name, seed.description, db.id, true, false
from default_building db
cross join (
  values
    ('AMN-DEMO-GYM', 'Gym cư dân', 'Tiện ích đặt chỗ cho cư dân tập luyện'),
    ('AMN-DEMO-POOL', 'Hồ bơi cư dân', 'Tiện ích đặt chỗ theo khung giờ'),
    ('AMN-DEMO-BBQ', 'Khu BBQ sân thượng', 'Tiện ích đặt chỗ cho nhóm cư dân')
) as seed(code, name, description)
where not exists (
  select 1
  from smartstay.amenity_catalog ac
  where ac.code = seed.code
);

with default_building as (
  select id
  from smartstay.buildings
  where coalesce(is_deleted, false) = false
  order by id
  limit 1
),
catalog as (
  select id, code, name
  from smartstay.amenity_catalog
  where code in ('AMN-DEMO-GYM', 'AMN-DEMO-POOL', 'AMN-DEMO-BBQ')
)
insert into smartstay.amenity_policies (
  code,
  name,
  amenity_id,
  building_id,
  booking_mode,
  charge_mode,
  status,
  slot_granularity_minutes,
  max_capacity_per_slot,
  max_advance_days,
  cancellation_cutoff_hours,
  auto_complete_after_minutes,
  allow_waitlist,
  requires_staff_approval,
  requires_checkin,
  price_override_amount,
  active_from,
  rules_json,
  current_version_no
)
select
  concat('POL-', replace(c.code, 'AMN-', '')),
  concat('Chính sách ', c.name),
  c.id,
  db.id,
  'slot_based',
  case when c.code = 'AMN-DEMO-BBQ' then 'fixed_per_booking' else 'free' end,
  'approved',
  60,
  case when c.code = 'AMN-DEMO-POOL' then 4 else 8 end,
  14,
  4,
  120,
  false,
  false,
  true,
  case when c.code = 'AMN-DEMO-BBQ' then 250000 else 0 end,
  current_date,
  jsonb_build_object(
    'openingHours', '06:00-22:00',
    'residentLimitPerDay', 1,
    'gracePeriodMinutes', 15
  ),
  1
from catalog c
cross join default_building db
where not exists (
  select 1
  from smartstay.amenity_policies ap
  where ap.code = concat('POL-', replace(c.code, 'AMN-', ''))
    and ap.deleted_at is null
);

with default_building as (
  select id
  from smartstay.buildings
  where coalesce(is_deleted, false) = false
  order by id
  limit 1
)
insert into smartstay.service_catalog (
  code,
  name,
  description,
  service_kind,
  billing_method,
  unit,
  is_active,
  is_deleted
)
select seed.code, seed.name, seed.description, 'fixed_recurring', seed.billing_method, seed.unit, true, false
from (
  values
    ('SRV-DEMO-CLEAN', 'Vệ sinh hành lang', 'Dịch vụ tính tiền cố định theo phòng', 'per_room', 'phong/thang'),
    ('SRV-DEMO-WIFI', 'Internet cáp quang', 'Dịch vụ tính tiền cố định theo hợp đồng', 'fixed', 'thang')
) as seed(code, name, description, billing_method, unit)
where not exists (
  select 1
  from smartstay.service_catalog sc
  where sc.code = seed.code
);

insert into smartstay.service_prices (service_catalog_id, unit_price, effective_from, is_active)
select sc.id, seed.unit_price, current_date, true
from (
  values
    ('SRV-DEMO-CLEAN', 60000::numeric),
    ('SRV-DEMO-WIFI', 180000::numeric)
) as seed(code, unit_price)
join smartstay.service_catalog sc on sc.code = seed.code
where not exists (
  select 1
  from smartstay.service_prices sp
  where sp.service_catalog_id = sc.id
    and sp.effective_to is null
);

notify pgrst, 'reload schema';
