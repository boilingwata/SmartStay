set check_function_bodies = off;
set search_path = smartstay, public;

-- Keep payment processing compatible with deployments where invoices.balance_due
-- is a generated/computed column. We still calculate and return the value, but we
-- no longer attempt to write it explicitly.
create or replace function smartstay.process_payment(
  p_invoice_id   bigint,
  p_amount       numeric,
  p_method       text,
  p_payment_date timestamptz,
  p_notes        text          default null,
  p_receipt_url  text          default null,
  p_reference    text          default null,
  p_bank_name    text          default null,
  p_confirmed_by uuid          default null,
  p_auto_confirm boolean       default true
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_invoice      record;
  v_payment_id   bigint;
  v_payment_code text;
  v_new_paid     numeric;
  v_new_due      numeric;
  v_new_status   text;
begin
  select id, total_amount, amount_paid, status
  into v_invoice
  from smartstay.invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'Invoice not found: %', p_invoice_id;
  end if;

  v_new_paid   := coalesce(v_invoice.amount_paid, 0) + p_amount;
  v_new_due    := greatest(0, coalesce(v_invoice.total_amount, 0) - v_new_paid);
  v_new_status := case
    when v_new_paid >= coalesce(v_invoice.total_amount, 0) then 'paid'
    when v_new_paid > 0                                    then 'partially_paid'
    else coalesce(v_invoice.status, 'pending_payment')
  end;

  insert into smartstay.payments (
    invoice_id,
    amount,
    method,
    payment_date,
    notes,
    receipt_url,
    reference_number,
    bank_name,
    confirmed_by,
    confirmed_at
  )
  values (
    p_invoice_id,
    p_amount,
    p_method,
    p_payment_date,
    p_notes,
    p_receipt_url,
    p_reference,
    p_bank_name,
    case when p_auto_confirm then p_confirmed_by else null end,
    case when p_auto_confirm then now()          else null end
  )
  returning id, payment_code into v_payment_id, v_payment_code;

  update smartstay.invoices
  set
    amount_paid = v_new_paid,
    status      = v_new_status,
    paid_date   = case when v_new_status = 'paid' then now() else null end,
    updated_at  = now()
  where id = p_invoice_id;

  return jsonb_build_object(
    'paymentId',      v_payment_id,
    'paymentCode',    v_payment_code,
    'invoiceStatus',  v_new_status,
    'amountPaid',     v_new_paid,
    'balanceDue',     v_new_due
  );
end;
$$;

create or replace function smartstay.approve_payment(
  p_payment_id   bigint,
  p_confirmed_by uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_payment    record;
  v_invoice    record;
  v_new_paid   numeric;
  v_new_due    numeric;
  v_new_status text;
begin
  select id, invoice_id, amount, confirmed_at
  into v_payment
  from smartstay.payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Payment not found: %', p_payment_id;
  end if;

  if v_payment.confirmed_at is not null then
    raise exception 'Payment % is already confirmed', p_payment_id;
  end if;

  select id, total_amount, amount_paid, status
  into v_invoice
  from smartstay.invoices
  where id = v_payment.invoice_id
  for update;

  if not found then
    raise exception 'Invoice not found for payment %', p_payment_id;
  end if;

  v_new_paid   := coalesce(v_invoice.amount_paid, 0) + v_payment.amount;
  v_new_due    := greatest(0, coalesce(v_invoice.total_amount, 0) - v_new_paid);
  v_new_status := case
    when v_new_paid >= coalesce(v_invoice.total_amount, 0) then 'paid'
    when v_new_paid > 0                                    then 'partially_paid'
    else coalesce(v_invoice.status, 'pending_payment')
  end;

  update smartstay.payments
  set confirmed_at = now(), confirmed_by = p_confirmed_by
  where id = p_payment_id;

  update smartstay.invoices
  set
    amount_paid = v_new_paid,
    status      = v_new_status,
    paid_date   = case when v_new_status = 'paid' then now() else null end,
    updated_at  = now()
  where id = v_payment.invoice_id;

  return jsonb_build_object(
    'paymentId',     p_payment_id,
    'invoiceId',     v_payment.invoice_id,
    'invoiceStatus', v_new_status,
    'amountPaid',    v_new_paid,
    'balanceDue',    v_new_due
  );
end;
$$;
