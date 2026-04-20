drop function if exists smartstay.create_contract_v3(
  integer,
  date,
  date,
  numeric,
  numeric,
  integer,
  integer,
  integer[],
  smallint,
  bigint,
  bigint[],
  numeric[],
  numeric[],
  boolean
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
  p_mark_deposit_received boolean default false,
  p_owner_legal_basis_type text default 'owner',
  p_owner_legal_basis_note text default null,
  p_owner_supporting_document_urls text[] default '{}'::text[],
  p_owner_has_legal_rental_rights boolean default false,
  p_owner_property_eligibility_confirmed boolean default false,
  p_owner_responsibilities_accepted boolean default false,
  p_owner_final_acknowledgement boolean default false,
  p_owner_rep_full_name text default null,
  p_owner_rep_cccd text default null,
  p_owner_rep_role text default null
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
    raise exception 'KhÃ´ng tÃ¬m tháº¥y phÃ²ng';
  end if;

  if p_primary_tenant_id is null or p_primary_tenant_id <= 0 then
    raise exception 'NgÆ°á»i Ä‘á»©ng tÃªn há»£p Ä‘á»“ng khÃ´ng há»£p lá»‡';
  end if;

  if p_start_date is null or p_end_date is null or p_end_date <= p_start_date then
    raise exception 'Khoáº£ng thá»i gian há»£p Ä‘á»“ng khÃ´ng há»£p lá»‡';
  end if;

  if p_monthly_rent is null or p_monthly_rent < 0 or p_deposit_amount is null or p_deposit_amount < 0 then
    raise exception 'GiÃ¡ trá»‹ tiá»n khÃ´ng há»£p lá»‡';
  end if;

  if p_payment_due_day is null or p_payment_due_day < 1 or p_payment_due_day > 31 then
    raise exception 'NgÃ y Ä‘áº¿n háº¡n thanh toÃ¡n pháº£i náº±m trong khoáº£ng 1-31';
  end if;

  if p_owner_legal_basis_type not in ('owner', 'authorized_representative', 'business_entity') then
    raise exception 'CÄƒn cá»© phÃ¡p lÃ½ bÃªn cho thuÃª khÃ´ng há»£p lá»‡';
  end if;

  if coalesce(p_owner_has_legal_rental_rights, false) = false then
    raise exception 'Cáº§n xÃ¡c nháº­n bÃªn cho thuÃª cÃ³ quyá»n cho thuÃª há»£p phÃ¡p';
  end if;

  if coalesce(p_owner_property_eligibility_confirmed, false) = false then
    raise exception 'Cáº§n xÃ¡c nháº­n nhÃ /phÃ²ng Ä‘á»§ Ä‘iá»u kiá»‡n cho thuÃª';
  end if;

  if coalesce(p_owner_responsibilities_accepted, false) = false then
    raise exception 'Cáº§n xÃ¡c nháº­n trÃ¡ch nhiá»‡m bÃªn cho thuÃª';
  end if;

  if coalesce(p_owner_final_acknowledgement, false) = false then
    raise exception 'Cáº§n tick cam káº¿t Ä‘á»“ng Ã½ trÆ°á»›c khi táº¡o há»£p Ä‘á»“ng';
  end if;

  if p_owner_legal_basis_type = 'authorized_representative'
     and coalesce(array_length(p_owner_supporting_document_urls, 1), 0) = 0 then
    raise exception 'NgÆ°á»i Ä‘Æ°á»£c á»§y quyá»n pháº£i Ä‘Ã­nh kÃ¨m Ã­t nháº¥t 1 há»“ sÆ¡ phÃ¡p lÃ½';
  end if;

  if not exists (
    select 1
    from smartstay.tenants t
    where t.id = p_primary_tenant_id
      and coalesce(t.is_deleted, false) = false
  ) then
    raise exception 'KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i Ä‘á»©ng tÃªn há»£p Ä‘á»“ng';
  end if;

  if p_utility_policy_id is not null and not exists (
    select 1
    from smartstay.utility_policies up
    where up.id = p_utility_policy_id
      and up.is_active = true
  ) then
    raise exception 'KhÃ´ng tÃ¬m tháº¥y chÃ­nh sÃ¡ch Ä‘iá»‡n nÆ°á»›c há»£p lá»‡';
  end if;

  if exists (
    select 1
    from smartstay.contracts c
    where c.room_id = p_room_id
      and coalesce(c.is_deleted, false) = false
      and c.status in ('active', 'pending_signature')
      and daterange(c.start_date, c.end_date, '[]') && daterange(p_start_date, p_end_date, '[]')
  ) then
    raise exception 'PhÃ²ng Ä‘Ã£ cÃ³ há»£p Ä‘á»“ng active/pending chá»“ng láº¥n';
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
    raise exception 'Há»£p Ä‘á»“ng pháº£i cÃ³ Ã­t nháº¥t 1 ngÆ°á»i á»Ÿ';
  end if;

  if v_room.max_occupants is not null and v_occupant_count > v_room.max_occupants then
    raise exception 'VÆ°á»£t sá»‘ ngÆ°á»i tá»‘i Ä‘a cá»§a phÃ²ng';
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
    raise exception 'CÃ³ ngÆ°á»i á»Ÿ cÃ¹ng Ä‘ang active á»Ÿ há»£p Ä‘á»“ng/phÃ²ng khÃ¡c';
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
      'primary_tenant_active_contract_count', v_primary_active_contract_count,
      'owner_legal_confirmation', jsonb_build_object(
        'legal_basis_type', p_owner_legal_basis_type,
        'legal_basis_note', nullif(trim(coalesce(p_owner_legal_basis_note, '')), ''),
        'supporting_document_urls', to_jsonb(coalesce(p_owner_supporting_document_urls, '{}'::text[])),
        'has_legal_rental_rights_confirmed', p_owner_has_legal_rental_rights,
        'property_eligibility_confirmed', p_owner_property_eligibility_confirmed,
        'landlord_responsibilities_accepted', p_owner_responsibilities_accepted,
        'final_acknowledgement_accepted', p_owner_final_acknowledgement,
        'acknowledged_at', now(),
        'owner_rep', jsonb_build_object(
          'full_name', nullif(trim(coalesce(p_owner_rep_full_name, '')), ''),
          'cccd', nullif(trim(coalesce(p_owner_rep_cccd, '')), ''),
          'role', nullif(trim(coalesce(p_owner_rep_role, '')), '')
        )
      )
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
        raise exception 'KhÃ´ng tÃ¬m tháº¥y dá»‹ch vá»¥ há»£p lá»‡ vá»›i id %', p_service_ids[v_idx];
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
    'utilityPolicyId', p_utility_policy_id,
    'ownerLegalConfirmation', jsonb_build_object(
      'legalBasisType', p_owner_legal_basis_type,
      'legalBasisNote', nullif(trim(coalesce(p_owner_legal_basis_note, '')), ''),
      'supportingDocumentCount', coalesce(array_length(p_owner_supporting_document_urls, 1), 0),
      'hasLegalRentalRightsConfirmed', p_owner_has_legal_rental_rights,
      'propertyEligibilityConfirmed', p_owner_property_eligibility_confirmed,
      'landlordResponsibilitiesAccepted', p_owner_responsibilities_accepted,
      'finalAcknowledgementAccepted', p_owner_final_acknowledgement,
      'ownerRepFullName', nullif(trim(coalesce(p_owner_rep_full_name, '')), '')
    )
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
