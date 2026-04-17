set search_path = smartstay, public;

alter table smartstay.contracts
  add column if not exists occupants_for_billing integer,
  add column if not exists utility_billing_type text,
  add column if not exists utility_policy_id bigint null references smartstay.utility_policies(id) on delete set null;

update smartstay.contracts c
set occupants_for_billing = coalesce(
  nullif(c.terms ->> 'occupants_for_billing', '')::integer,
  (
    select count(*)::integer
    from smartstay.room_occupants ro
    where ro.contract_id = c.id
      and ro.status = 'active'
  ),
  1
)
where c.occupants_for_billing is null;

alter table smartstay.contracts
  alter column occupants_for_billing set default 1;

update smartstay.contracts
set utility_billing_type = 'policy'
where utility_billing_type is null;

update smartstay.contracts c
set utility_billing_type = 'legacy_metered'
where exists (
  select 1
  from smartstay.contract_services cs
  join smartstay.services s on s.id = cs.service_id
  where cs.contract_id = c.id
    and s.calc_type = 'per_unit'
    and lower(s.name) in ('electricity', 'water', 'electric', 'dien', 'nuoc')
);

with resolved_policy as (
  select
    c.id as contract_id,
    p.id as policy_id
  from smartstay.contracts c
  join smartstay.rooms r on r.id = c.room_id
  left join lateral (
    select up.id
    from smartstay.utility_policies up
    where up.is_active = true
      and (
        (up.scope_type = 'contract' and up.scope_id = c.id)
        or (up.scope_type = 'room' and up.scope_id = c.room_id)
        or (up.scope_type = 'building' and up.scope_id = r.building_id)
        or (up.scope_type = 'system' and up.scope_id is null)
      )
    order by
      case up.scope_type
        when 'contract' then 1
        when 'room' then 2
        when 'building' then 3
        when 'system' then 4
        else 5
      end,
      up.effective_from desc,
      up.id desc
    limit 1
  ) p on true
)
update smartstay.contracts c
set utility_policy_id = rp.policy_id
from resolved_policy rp
where rp.contract_id = c.id
  and (c.utility_policy_id is distinct from rp.policy_id);

update smartstay.contracts
set utility_billing_type = 'policy'
where utility_billing_type = 'legacy_metered';

alter table smartstay.contracts
  alter column occupants_for_billing set not null;

alter table smartstay.contracts
  drop constraint if exists contracts_utility_billing_type_ck;

alter table smartstay.contracts
  add constraint contracts_utility_billing_type_ck
  check (utility_billing_type in ('policy', 'legacy_metered'));

update smartstay.contracts c
set terms = coalesce(c.terms, '{}'::jsonb)
  || jsonb_build_object('occupants_for_billing', c.occupants_for_billing)
where coalesce((c.terms ->> 'occupants_for_billing')::integer, -1) <> c.occupants_for_billing;

delete from smartstay.contract_services cs
using smartstay.services s
where s.id = cs.service_id
  and s.calc_type = 'per_unit'
  and lower(s.name) in ('electricity', 'water', 'electric', 'dien', 'nuoc');

delete from smartstay.meter_readings;

update smartstay.invoice_items
set meter_reading_id = null
where meter_reading_id is not null;

alter table smartstay.invoice_items
  drop constraint if exists invoice_items_meter_reading_id_fkey;

alter table smartstay.invoice_items
  drop column if exists meter_reading_id;

drop table if exists smartstay.meter_readings;

insert into smartstay.system_settings (key, value, group_name, description, is_sensitive)
values
  ('billing.default_rounding_rule', '1000'::jsonb, 'billing', 'Lam tron utility den buoc mac dinh.', false),
  ('billing.min_electric_floor', '120000'::jsonb, 'billing', 'Muc san tien dien mac dinh.', false),
  ('billing.min_water_floor', '60000'::jsonb, 'billing', 'Muc san tien nuoc mac dinh.', false),
  ('billing.hot_season_months', '[4,5,6,7,8,9]'::jsonb, 'billing', 'Cac thang ap dung he so mua nong.', false),
  ('billing.hot_season_multiplier', '1.15'::jsonb, 'billing', 'He so mua nong mac dinh cho tien dien.', false),
  ('billing.default_location_multiplier', '1.0'::jsonb, 'billing', 'He so vi tri mac dinh cho utility policy.', false)
on conflict (key) do update
set
  value = excluded.value,
  group_name = excluded.group_name,
  description = excluded.description,
  is_sensitive = excluded.is_sensitive,
  updated_at = now();
