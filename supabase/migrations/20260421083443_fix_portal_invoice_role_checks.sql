begin;

create or replace function smartstay.portal_cancel_invoice(p_invoice_id bigint, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = smartstay, public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_invoice record;
  v_reason text;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if not private.is_workspace_operator(v_actor_id) then
    raise exception 'Only workspace operators can cancel invoices';
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

create or replace function smartstay.portal_mark_invoice_paid(p_invoice_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = smartstay, public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_invoice record;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if not private.is_workspace_operator(v_actor_id) then
    raise exception 'Only workspace operators can mark invoices as paid';
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

commit;
