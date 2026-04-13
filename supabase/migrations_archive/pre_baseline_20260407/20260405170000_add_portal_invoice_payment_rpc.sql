create or replace function smartstay.portal_record_invoice_payment(
  p_invoice_id bigint,
  p_amount numeric,
  p_method text,
  p_payment_date timestamp with time zone,
  p_notes text default null,
  p_reference text default null,
  p_bank_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = smartstay, public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role smartstay.user_role;
  v_invoice record;
  v_remaining numeric;
  v_new_paid numeric;
  v_new_due numeric;
  v_new_status smartstay.invoice_status;
  v_payment_id bigint;
  v_payment_code text;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  select role
  into v_actor_role
  from smartstay.profiles
  where id = v_actor_id;

  select
    i.id,
    i.total_amount,
    i.amount_paid,
    i.balance_due,
    i.status,
    i.paid_date
  into v_invoice
  from smartstay.invoices i
  where i.id = p_invoice_id
    and (
      v_actor_role = any (array['admin', 'manager', 'staff', 'landlord']::smartstay.user_role[])
      or exists (
        select 1
        from smartstay.contract_tenants ct
        join smartstay.tenants t on t.id = ct.tenant_id
        where ct.contract_id = i.contract_id
          and t.profile_id = v_actor_id
          and coalesce(t.is_deleted, false) = false
      )
    )
  for update;

  if not found then
    raise exception 'Invoice not found or access denied';
  end if;

  if v_invoice.status = 'cancelled' then
    raise exception 'Cancelled invoices cannot receive payments';
  end if;

  v_remaining := greatest(0, coalesce(v_invoice.balance_due, coalesce(v_invoice.total_amount, 0) - coalesce(v_invoice.amount_paid, 0)));

  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than 0';
  end if;

  if v_remaining <= 0 then
    raise exception 'Invoice is already fully paid';
  end if;

  if p_amount > v_remaining then
    raise exception 'Payment amount exceeds the remaining balance';
  end if;

  if p_method is null or p_method not in ('cash', 'bank_transfer', 'momo', 'zalopay', 'vnpay', 'stripe', 'other') then
    raise exception 'Unsupported payment method: %', p_method;
  end if;

  insert into smartstay.payments (
    invoice_id,
    amount,
    method,
    bank_name,
    reference_number,
    payment_date,
    confirmed_by,
    confirmed_at,
    notes
  )
  values (
    p_invoice_id,
    p_amount,
    p_method::smartstay.payment_method,
    nullif(trim(p_bank_name), ''),
    nullif(trim(p_reference), ''),
    coalesce(p_payment_date, now()),
    v_actor_id,
    now(),
    nullif(trim(p_notes), '')
  )
  returning id, payment_code into v_payment_id, v_payment_code;

  v_new_paid := coalesce(v_invoice.amount_paid, 0) + p_amount;
  v_new_due := greatest(0, coalesce(v_invoice.total_amount, 0) - v_new_paid);
  v_new_status := case
    when v_new_due = 0 then 'paid'::smartstay.invoice_status
    when v_new_paid > 0 then 'partially_paid'::smartstay.invoice_status
    when v_invoice.status = 'overdue' then 'overdue'::smartstay.invoice_status
    else 'pending_payment'::smartstay.invoice_status
  end;

  update smartstay.invoices
  set
    amount_paid = v_new_paid,
    status = v_new_status,
    paid_date = case when v_new_due = 0 then now() else null end,
    updated_at = now()
  where id = p_invoice_id;

  return jsonb_build_object(
    'paymentId', v_payment_id,
    'paymentCode', v_payment_code,
    'invoiceId', p_invoice_id,
    'invoiceStatus', v_new_status,
    'amountPaid', v_new_paid,
    'balanceDue', v_new_due
  );
end;
$$;

create or replace function smartstay.portal_mark_invoice_paid(p_invoice_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = smartstay, public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role smartstay.user_role;
  v_invoice record;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  select role
  into v_actor_role
  from smartstay.profiles
  where id = v_actor_id;

  if v_actor_role is null or v_actor_role not in ('admin', 'manager', 'staff', 'landlord') then
    raise exception 'Only staff can mark invoices as paid';
  end if;

  select id, balance_due
  into v_invoice
  from smartstay.invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'Invoice not found';
  end if;

  if coalesce(v_invoice.balance_due, 0) <> 0 then
    raise exception 'Invoice can only be marked paid when balance_due = 0';
  end if;

  update smartstay.invoices
  set status = 'paid', paid_date = coalesce(paid_date, now()), updated_at = now()
  where id = p_invoice_id;

  return jsonb_build_object('invoiceId', p_invoice_id, 'status', 'paid');
end;
$$;

create or replace function smartstay.portal_cancel_invoice(
  p_invoice_id bigint,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = smartstay, public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role smartstay.user_role;
  v_invoice record;
  v_reason text;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  select role
  into v_actor_role
  from smartstay.profiles
  where id = v_actor_id;

  if v_actor_role is null or v_actor_role not in ('admin', 'manager', 'staff', 'landlord') then
    raise exception 'Only staff can cancel invoices';
  end if;

  v_reason := nullif(trim(p_reason), '');
  if v_reason is null then
    raise exception 'Cancellation reason is required';
  end if;

  select id, amount_paid, notes
  into v_invoice
  from smartstay.invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'Invoice not found';
  end if;

  if coalesce(v_invoice.amount_paid, 0) > 0 then
    raise exception 'Invoices with recorded payments cannot be cancelled';
  end if;

  update smartstay.invoices
  set
    status = 'cancelled',
    notes = concat_ws(E'\n', nullif(v_invoice.notes, ''), '[cancel_reason] ' || v_reason),
    updated_at = now()
  where id = p_invoice_id;

  return jsonb_build_object('invoiceId', p_invoice_id, 'status', 'cancelled');
end;
$$;

grant execute on function smartstay.portal_record_invoice_payment(bigint, numeric, text, timestamp with time zone, text, text, text) to authenticated;
grant execute on function smartstay.portal_mark_invoice_paid(bigint) to authenticated;
grant execute on function smartstay.portal_cancel_invoice(bigint, text) to authenticated;

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
    'bankName', '',
    'accountNumber', '',
    'accountName', '',
    'branch', ''
  ),
  'Business bank account details displayed to tenants on the portal invoice screen',
  'payment',
  false
)
on conflict (key) do nothing;
