begin;

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
  v_invoice record;
  v_invoice_code text;
  v_content text;
  v_code text;
  v_amount numeric := 0;
  v_trans_id text;
  v_bank_name text;
  v_bank_acc text;
  v_reference text;
  v_transfer_type text;
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

  v_code := nullif(trim(coalesce(
    p_payload ->> 'code',
    p_payload ->> 'transactionCode',
    ''
  )), '');

  v_content := trim(coalesce(
    p_payload ->> 'transferContent',
    p_payload ->> 'content',
    p_payload ->> 'description',
    ''
  ));

  v_transfer_type := lower(trim(coalesce(
    p_payload ->> 'transferType',
    'in'
  )));

  v_amount := coalesce(
    nullif(p_payload ->> 'transferAmount', '')::numeric,
    nullif(p_payload ->> 'amount', '')::numeric,
    0
  );

  v_trans_id := nullif(trim(coalesce(
    p_payload ->> 'id',
    p_payload ->> 'transactionId',
    ''
  )), '');

  v_bank_name := nullif(trim(coalesce(
    p_payload ->> 'gateway',
    p_payload ->> 'bankName',
    ''
  )), '');

  v_bank_acc := nullif(trim(coalesce(
    p_payload ->> 'accountNumber',
    p_payload ->> 'bankAccountNumber',
    ''
  )), '');

  v_reference := nullif(trim(coalesce(
    p_payload ->> 'referenceCode',
    p_payload ->> 'referenceNumber',
    ''
  )), '');

  if v_transfer_type <> 'in' then
    update smartstay.webhook_logs
    set
      status = 'success',
      error_message = format('ignored_transfer_type:%s', coalesce(v_transfer_type, 'null')),
      processed_at = now()
    where id = v_log_id;

    return jsonb_build_object(
      'status', 'ignored',
      'reason', 'unsupported_transfer_type',
      'provider', 'sepay'
    );
  end if;

  if v_amount <= 0 then
    update smartstay.webhook_logs
    set
      status = 'failed',
      error_message = 'invalid_amount',
      processed_at = now()
    where id = v_log_id;

    return jsonb_build_object('status', 'failed', 'reason', 'invalid_amount', 'provider', 'sepay');
  end if;

  if v_trans_id is null then
    update smartstay.webhook_logs
    set
      status = 'failed',
      error_message = 'missing_transaction_id',
      processed_at = now()
    where id = v_log_id;

    return jsonb_build_object('status', 'failed', 'reason', 'missing_transaction_id', 'provider', 'sepay');
  end if;

  v_invoice_code := upper(
    coalesce(
      nullif(substring(v_code from '(?i)(INV-[A-Z0-9-]+)'), ''),
      nullif(substring(v_content from '(?i)(INV-[A-Z0-9-]+)'), '')
    )
  );

  if v_invoice_code is null then
    update smartstay.webhook_logs
    set
      status = 'failed',
      error_message = format(
        'invoice_code_not_found: code=%s content=%s',
        coalesce(v_code, 'null'),
        coalesce(v_content, 'null')
      ),
      processed_at = now()
    where id = v_log_id;

    return jsonb_build_object(
      'status', 'failed',
      'reason', 'invoice_code_not_found',
      'provider', 'sepay'
    );
  end if;

  select
    i.id,
    i.invoice_code,
    i.total_amount,
    i.amount_paid,
    i.balance_due,
    i.status
  into v_invoice
  from smartstay.invoices i
  where upper(i.invoice_code) = v_invoice_code
  limit 1
  for update;

  if not found then
    update smartstay.webhook_logs
    set
      status = 'failed',
      error_message = format('invoice_not_found:%s', v_invoice_code),
      processed_at = now()
    where id = v_log_id;

    return jsonb_build_object(
      'status', 'failed',
      'reason', 'invoice_not_found',
      'invoiceCode', v_invoice_code,
      'provider', 'sepay'
    );
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
      error_message = 'duplicate_transaction',
      processed_at = now()
    where id = v_log_id;

    return jsonb_build_object(
      'status', 'duplicate',
      'attemptId', v_attempt_id,
      'invoiceCode', v_invoice.invoice_code,
      'provider', 'sepay'
    );
  end if;

  if coalesce(v_invoice.balance_due, greatest(0, coalesce(v_invoice.total_amount, 0) - coalesce(v_invoice.amount_paid, 0))) <= 0
     or v_invoice.status = 'paid' then
    update smartstay.webhook_logs
    set
      status = 'success',
      error_message = 'invoice_already_paid',
      processed_at = now()
    where id = v_log_id;

    return jsonb_build_object(
      'status', 'already_paid',
      'invoiceCode', v_invoice.invoice_code,
      'provider', 'sepay'
    );
  end if;

  if v_amount > coalesce(v_invoice.balance_due, greatest(0, coalesce(v_invoice.total_amount, 0) - coalesce(v_invoice.amount_paid, 0))) then
    update smartstay.webhook_logs
    set
      status = 'failed',
      error_message = format(
        'amount_exceeds_balance:received=%s,balance=%s',
        v_amount,
        coalesce(v_invoice.balance_due, 0)
      ),
      processed_at = now()
    where id = v_log_id;

    return jsonb_build_object(
      'status', 'failed',
      'reason', 'amount_exceeds_balance',
      'invoiceCode', v_invoice.invoice_code,
      'provider', 'sepay'
    );
  end if;

  v_result := smartstay.process_payment(
    p_invoice_id := v_invoice.id,
    p_amount := v_amount,
    p_method := 'chuyen_khoan',
    p_payment_date := coalesce(
      nullif(p_payload ->> 'transactionDate', '')::timestamptz,
      p_received_at,
      now()
    ),
    p_notes := format(
      'SePay auto confirm. Invoice: %s. Bank: %s. Account: %s. Reference: %s. Content: %s',
      v_invoice.invoice_code,
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
    reference_number = coalesce(reference_number, v_reference),
    bank_name = coalesce(bank_name, v_bank_name)
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
    error_message = null,
    processed_at = now()
  where id = v_log_id;

  return v_result || jsonb_build_object(
    'status', 'processed',
    'provider', 'sepay',
    'attemptId', v_attempt_id,
    'invoiceCode', v_invoice.invoice_code
  );
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
