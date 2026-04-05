begin;

alter table smartstay.payments
  drop constraint if exists payments_confirmation_source_check;

alter table smartstay.payments
  add constraint payments_confirmation_source_check
  check (
    confirmation_source is null
    or confirmation_source in (
      'momo_ipn',
      'admin_thu_cong',
      'tien_mat',
      'doi_soat_ngan_hang',
      'sepay_webhook'
    )
  );

comment on column smartstay.payments.confirmation_source is
  'Nguon xac nhan thanh toan: momo_ipn, admin_thu_cong, tien_mat, doi_soat_ngan_hang, sepay_webhook.';

create or replace function smartstay.handle_sepay_webhook(
  p_payload jsonb,
  p_api_key text default null,
  p_received_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = smartstay, public
as $$
declare
  v_log_id bigint;
  v_code text;
  v_content text;
  v_amount numeric := 0;
  v_trans_id text;
  v_bank_name text;
  v_bank_acc text;
  v_reference text;
  v_transfer_type text;
  v_invoice_id bigint;
  v_attempt_id bigint;
  v_result jsonb;
begin
  insert into smartstay.webhook_logs (
    provider,
    payload,
    received_at,
    status
  )
  values (
    'sepay',
    coalesce(p_payload, '{}'::jsonb),
    coalesce(p_received_at, now()),
    'processing'
  )
  returning id into v_log_id;

  v_code := nullif(trim(coalesce(p_payload ->> 'code', '')), '');
  v_content := trim(coalesce(p_payload ->> 'content', ''));
  v_transfer_type := lower(trim(coalesce(p_payload ->> 'transferType', '')));
  v_amount := coalesce(nullif(p_payload ->> 'transferAmount', '')::numeric, 0);
  v_trans_id := nullif(trim(coalesce(p_payload ->> 'id', '')), '');
  v_bank_name := nullif(trim(coalesce(p_payload ->> 'gateway', '')), '');
  v_bank_acc := nullif(trim(coalesce(p_payload ->> 'accountNumber', '')), '');
  v_reference := nullif(trim(coalesce(p_payload ->> 'referenceCode', '')), '');

  if v_transfer_type <> 'in' then
    update smartstay.webhook_logs
    set
      status = 'skipped',
      error_message = format('Unsupported transfer type: %s', coalesce(v_transfer_type, 'null')),
      processed_at = now()
    where id = v_log_id;

    return jsonb_build_object('status', 'skipped', 'reason', 'unsupported_transfer_type');
  end if;

  if v_amount <= 0 then
    update smartstay.webhook_logs
    set
      status = 'skipped',
      error_message = 'transferAmount <= 0',
      processed_at = now()
    where id = v_log_id;

    return jsonb_build_object('status', 'skipped', 'reason', 'invalid_amount');
  end if;

  if v_trans_id is null then
    update smartstay.webhook_logs
    set
      status = 'failed',
      error_message = 'Missing SePay transaction id',
      processed_at = now()
    where id = v_log_id;

    return jsonb_build_object('status', 'failed', 'reason', 'missing_transaction_id');
  end if;

  if v_code is not null then
    v_invoice_id := nullif(substring(v_code from '(?i)SS\s*(\d+)'), '')::bigint;
  end if;

  if v_invoice_id is null and v_content <> '' then
    v_invoice_id := nullif(substring(v_content from '(?i)SS\s*(\d+)'), '')::bigint;
  end if;

  if v_invoice_id is null then
    update smartstay.webhook_logs
    set
      status = 'failed',
      error_message = format('Khong tim thay ma SS<invoice_id> trong code/content. code=%s content=%s', coalesce(v_code, 'null'), coalesce(v_content, 'null')),
      processed_at = now()
    where id = v_log_id;

    return jsonb_build_object('status', 'failed', 'reason', 'invoice_code_not_found');
  end if;

  select pa.id
  into v_attempt_id
  from smartstay.payment_attempts pa
  where pa.idempotency_key = format('sepay:%s', v_trans_id)
     or pa.gateway_transaction_id = v_trans_id
  limit 1;

  if v_attempt_id is not null then
    update smartstay.webhook_logs
    set
      status = 'success',
      error_message = 'Duplicate transaction',
      processed_at = now()
    where id = v_log_id;

    return jsonb_build_object('status', 'duplicate', 'attemptId', v_attempt_id, 'provider', 'sepay');
  end if;

  if not exists (
    select 1
    from smartstay.invoices i
    where i.id = v_invoice_id
  ) then
    update smartstay.webhook_logs
    set
      status = 'failed',
      error_message = format('Invoice %s not found', v_invoice_id),
      processed_at = now()
    where id = v_log_id;

    return jsonb_build_object('status', 'failed', 'reason', 'invoice_not_found', 'invoiceId', v_invoice_id);
  end if;

  v_result := smartstay.process_payment(
    p_invoice_id := v_invoice_id,
    p_amount := v_amount,
    p_method := 'chuyen_khoan',
    p_payment_date := coalesce(p_received_at, now()),
    p_notes := format(
      'SePay tu dong xac nhan. Ngan hang: %s. So tai khoan: %s. Reference: %s. Noi dung: %s',
      coalesce(v_bank_name, ''),
      coalesce(v_bank_acc, ''),
      coalesce(v_reference, ''),
      coalesce(v_content, '')
    ),
    p_reference := coalesce(v_reference, v_trans_id),
    p_bank_name := v_bank_name,
    p_confirmed_by := null,
    p_auto_confirm := false,
    p_idempotency_key := format('sepay:%s', v_trans_id),
    p_attempt_status := 'dang_xu_ly'
  );

  v_attempt_id := nullif(v_result ->> 'attemptId', '')::bigint;

  if v_attempt_id is null then
    raise exception 'SePay webhook did not create payment attempt for transaction %', v_trans_id;
  end if;

  update smartstay.payment_attempts
  set
    gateway_transaction_id = v_trans_id,
    gateway_order_id = coalesce(gateway_order_id, v_reference),
    gateway_payload = p_payload,
    reference_number = coalesce(reference_number, v_reference)
  where id = v_attempt_id;

  v_result := smartstay.approve_payment(
    p_payment_id := 0,
    p_confirmed_by := null,
    p_attempt_id := v_attempt_id,
    p_confirmation_source := 'sepay_webhook'
  );

  update smartstay.webhook_logs
  set
    status = 'success',
    processed_at = now()
  where id = v_log_id;

  return v_result || jsonb_build_object('status', 'processed', 'provider', 'sepay', 'attemptId', v_attempt_id);
exception
  when others then
    update smartstay.webhook_logs
    set
      status = 'failed',
      error_message = sqlerrm,
      processed_at = now()
    where id = v_log_id;
    raise;
end;
$$;

commit;
