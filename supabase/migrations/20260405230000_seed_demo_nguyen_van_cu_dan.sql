begin;

update smartstay.system_settings
set
  value = jsonb_build_object(
    'bankName', 'MBBank',
    'bankCode', 'MB',
    'accountNumber', '0565484027',
    'accountName', 'NGUYEN TO LINH DUC',
    'branch', ''
  ),
  description = 'Demo bank transfer details for VietQR / SePay portal',
  group_name = 'payment',
  is_sensitive = false,
  updated_at = now()
where key = 'payment.bank_transfer_details';

do $$
declare
  v_tenant_id integer;
  v_contract_id integer;
  v_invoice_id integer;
  v_room_id integer;
begin
  select t.id
  into v_tenant_id
  from smartstay.tenants t
  where t.phone = '0911222333'
  limit 1;

  if v_tenant_id is null then
    insert into smartstay.tenants (
      full_name,
      id_number,
      phone,
      permanent_address,
      emergency_contact_name,
      emergency_contact_phone,
      is_deleted
    )
    values (
      'Nguyễn Văn Cư Dân',
      '079123456789',
      '0911222333',
      'Demo SmartStay',
      'Nguyễn Văn Cư Dân',
      '0911222333',
      false
    )
    returning id into v_tenant_id;
  else
    update smartstay.tenants
    set
      full_name = 'Nguyễn Văn Cư Dân',
      phone = '0911222333',
      updated_at = now(),
      is_deleted = false
    where id = v_tenant_id;
  end if;

  select c.id
  into v_contract_id
  from smartstay.contracts c
  join smartstay.contract_tenants ct on ct.contract_id = c.id
  where ct.tenant_id = v_tenant_id
    and c.status = 'active'
    and coalesce(c.is_deleted, false) = false
  order by c.id desc
  limit 1;

  if v_contract_id is null then
    select r.id
    into v_room_id
    from smartstay.rooms r
    where r.status = 'available'
      and coalesce(r.is_deleted, false) = false
    order by r.id desc
    limit 1;

    if v_room_id is null then
      raise exception 'No available room found for demo contract';
    end if;

    v_contract_id := nullif((
      smartstay.create_contract(
        p_room_id := v_room_id,
        p_start_date := date '2026-04-05',
        p_end_date := date '2027-04-04',
        p_monthly_rent := 2000,
        p_deposit_amount := 0,
        p_payment_cycle_months := 1,
        p_tenant_ids := array[v_tenant_id]::bigint[],
        p_primary_tenant_id := v_tenant_id,
        p_service_ids := '{}'::bigint[],
        p_service_prices := '{}'::numeric[],
        p_service_quantities := '{}'::integer[],
        p_mark_deposit_received := false
      ) ->> 'contractId'
    ), '')::integer;
  end if;

  if v_contract_id is null then
    raise exception 'Demo contract was not created';
  end if;

  select i.id
  into v_invoice_id
  from smartstay.invoices i
  where i.contract_id = v_contract_id
    and i.billing_period = '2026-04'
  order by i.id desc
  limit 1;

  if v_invoice_id is null then
    insert into smartstay.invoices (
      contract_id,
      billing_period,
      subtotal,
      tax_amount,
      total_amount,
      amount_paid,
      due_date,
      paid_date,
      status,
      notes
    )
    values (
      v_contract_id,
      '2026-04',
      2000,
      0,
      2000,
      0,
      date '2026-04-15',
      null,
      'pending_payment',
      'Demo invoice 2,000 VND for SePay auto-approval test'
    )
    returning id into v_invoice_id;
  else
    update smartstay.invoices
    set
      subtotal = 2000,
      tax_amount = 0,
      total_amount = 2000,
      amount_paid = 0,
      due_date = date '2026-04-15',
      paid_date = null,
      status = 'pending_payment',
      notes = 'Demo invoice 2,000 VND for SePay auto-approval test',
      updated_at = now()
    where id = v_invoice_id;

    delete from smartstay.invoice_items
    where invoice_id = v_invoice_id;
  end if;

  insert into smartstay.invoice_items (
    invoice_id,
    description,
    quantity,
    unit_price,
    line_total,
    sort_order
  )
  values (
    v_invoice_id,
    'Hóa đơn demo SePay 2.000đ',
    1,
    2000,
    2000,
    1
  );
end
$$;

commit;
