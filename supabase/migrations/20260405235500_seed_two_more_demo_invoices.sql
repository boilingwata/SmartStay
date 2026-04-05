begin;

do $$
declare
  v_contract_id integer;
  v_invoice_id integer;
  v_period text;
  v_due_date date;
  v_description text;
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

  foreach v_period in array array['2026-06', '2026-07'] loop
    v_due_date := (v_period || '-15')::date;
    v_description := format('Hóa đơn demo SePay 2.000đ (%s)', v_period);

    select i.id
    into v_invoice_id
    from smartstay.invoices i
    where i.contract_id = v_contract_id
      and i.billing_period = v_period
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
        v_period,
        2000,
        0,
        2000,
        0,
        v_due_date,
        null,
        'pending_payment',
        'Fresh demo invoice 2,000 VND reserved for later demo'
      )
      returning id into v_invoice_id;
    else
      update smartstay.invoices
      set
        subtotal = 2000,
        tax_amount = 0,
        total_amount = 2000,
        amount_paid = 0,
        due_date = v_due_date,
        paid_date = null,
        status = 'pending_payment',
        notes = 'Fresh demo invoice 2,000 VND reserved for later demo',
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
      v_description,
      1,
      2000,
      2000,
      1
    );
  end loop;
end
$$;

commit;
