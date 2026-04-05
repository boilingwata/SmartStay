-- Du lieu mau de test portal invoices va 3 luong thanh toan:
-- 1. Chuyen khoan thu cong
-- 2. Tien mat cho admin duyet
-- 3. MoMo online qua payment_attempts + IPN
--
-- Cach dung:
-- psql "$DATABASE_URL" -f supabase/seed/payment_portal_demo.sql
-- hoac copy vao SQL editor sau khi da apply migration payment_model_v2.

begin;

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
    'bankName', 'Ngân hàng TMCP Ngoại thương Việt Nam',
    'bankCode', 'VCB',
    'accountNumber', '0011223344556',
    'accountName', 'CONG TY TNHH SMARTSTAY',
    'branch', 'Chi nhánh Quận 1'
  ),
  'Thông tin chuyển khoản hiển thị trên portal hóa đơn',
  'payment',
  false
)
on conflict (key) do update
set
  value = excluded.value,
  description = excluded.description,
  group_name = excluded.group_name,
  is_sensitive = excluded.is_sensitive;

with candidate_invoices as (
  select
    i.id,
    i.invoice_code,
    i.total_amount,
    coalesce(i.balance_due, greatest(0, coalesce(i.total_amount, 0) - coalesce(i.amount_paid, 0))) as balance_due,
    row_number() over (
      order by
        case when i.due_date is null then 1 else 0 end,
        i.due_date asc,
        i.id asc
    ) as rn
  from smartstay.invoices i
  where i.status <> 'cancelled'::smartstay.invoice_status
    and coalesce(i.balance_due, greatest(0, coalesce(i.total_amount, 0) - coalesce(i.amount_paid, 0))) > 0
),
selected as (
  select *
  from candidate_invoices
  where rn <= 3
)
insert into smartstay.payment_attempts (
  invoice_id,
  method,
  amount,
  status,
  idempotency_key,
  reference_number,
  bank_name,
  gateway_order_id,
  notes,
  gateway_payload
)
select
  s.id,
  case s.rn
    when 1 then 'chuyen_khoan'::smartstay.payment_attempt_method
    when 2 then 'tien_mat'::smartstay.payment_attempt_method
    else 'momo_online'::smartstay.payment_attempt_method
  end,
  least(s.balance_due, case when s.balance_due >= 100000 then 100000 else s.balance_due end),
  case s.rn
    when 1 then 'da_gui'::smartstay.payment_status
    when 2 then 'da_gui'::smartstay.payment_status
    else 'that_bai'::smartstay.payment_status
  end,
  format('demo-portal-%s-%s', s.rn, s.id),
  case s.rn
    when 1 then format('CK-DEMO-%s', s.id)
    when 2 then format('TM-DEMO-%s', s.id)
    else format('MOMO-DEMO-%s', s.id)
  end,
  case when s.rn = 1 then 'Vietcombank' else null end,
  case when s.rn = 3 then format('MOMO-DEMO-%s', s.id) else null end,
  case s.rn
    when 1 then format('Yêu cầu chuyển khoản mẫu cho %s', s.invoice_code)
    when 2 then format('Yêu cầu tiền mặt mẫu cho %s', s.invoice_code)
    else format('Yêu cầu MoMo thất bại mẫu cho %s', s.invoice_code)
  end,
  case s.rn
    when 3 then jsonb_build_object(
      'provider', 'momo',
      'message', 'Demo IPN failure for local testing',
      'resultCode', 1006
    )
    else '{}'::jsonb
  end
from selected s
where not exists (
  select 1
  from smartstay.payment_attempts pa
  where pa.idempotency_key = format('demo-portal-%s-%s', s.rn, s.id)
);

commit;
