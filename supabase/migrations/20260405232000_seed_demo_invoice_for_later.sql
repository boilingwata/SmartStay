begin;

do $$
declare
  v_contract_id integer;
  v_invoice_id integer;
begin
  select c.id
  into v_contract_id
  from smartstay.contracts c
  join smartstay.contract_tenants ct on ct.contract_id = c.id
  join smartstay.tenants t on t.id = ct.tenant_id
  where t.phone = '0911222333'
    and c.status = 'active'
    and coalesce(c.is_deleted, false) = false
  order by c.id desc
  limit 1;

  if v_contract_id is null then
    raise exception 'Demo contract not found for tenant 0911222333';
  end if;

  select i.id
  into v_invoice_id
  from smartstay.invoices i
  where i.contract_id = v_contract_id
    and i.billing_period = '2026-05'
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
      '2026-05',
      2000,
      0,
      2000,
      0,
      date '2026-05-15',
      null,
      'pending_payment',
      'Fresh demo invoice 2,000 VND reserved for manual demo'
    )
    returning id into v_invoice_id;
  end if;

  if not exists (
    select 1
    from smartstay.invoice_items
    where invoice_id = v_invoice_id
      and description = 'Hóa đơn demo SePay 2.000đ (để demo)'
  ) then
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
      'Hóa đơn demo SePay 2.000đ (để demo)',
      1,
      2000,
      2000,
      1
    );
  end if;
end
$$;

commit;
