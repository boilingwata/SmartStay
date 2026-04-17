set search_path = smartstay, public;

select
  'schema_health' as check_name,
  smartstay.get_domain_schema_health() as result;

select
  'amenity_policies_missing_amenity_id' as check_name,
  count(*) as affected_rows
from smartstay.amenity_policies
where deleted_at is null
  and amenity_id is null;

select
  'amenity_bookings_missing_amenity_id' as check_name,
  count(*) as affected_rows
from smartstay.amenity_bookings
where amenity_id is null;

select
  'amenity_exceptions_missing_amenity_id' as check_name,
  count(*) as affected_rows
from smartstay.amenity_booking_exceptions
where amenity_id is null;

select
  'service_prices_missing_service_catalog_id' as check_name,
  count(*) as affected_rows
from smartstay.service_prices
where service_catalog_id is null
  and service_id not in (
    select id
    from smartstay.services
    where lower(name) in ('electricity', 'water', 'electric', 'dien', 'nuoc')
  );

select
  'legacy_utility_service_prices' as check_name,
  count(*) as affected_rows
from smartstay.service_prices
where service_catalog_id is null
  and service_id in (
    select id
    from smartstay.services
    where lower(name) in ('electricity', 'water', 'electric', 'dien', 'nuoc')
  );

select
  'contract_services_missing_service_catalog_id' as check_name,
  count(*) as affected_rows
from smartstay.contract_services
where service_catalog_id is null;

select
  'contract_services_duplicate_new_keys' as check_name,
  count(*) as duplicate_groups
from (
  select contract_id, service_catalog_id
  from smartstay.contract_services
  where service_catalog_id is not null
  group by contract_id, service_catalog_id
  having count(*) > 1
) duplicates;

select
  'demo_amenities' as check_name,
  jsonb_agg(jsonb_build_object('code', code, 'name', name) order by code) as result
from smartstay.amenity_catalog
where code like 'AMN-DEMO-%';

select
  'demo_services' as check_name,
  jsonb_agg(jsonb_build_object('code', code, 'name', name) order by code) as result
from smartstay.service_catalog
where code like 'SRV-DEMO-%';
