--
-- PostgreSQL database dump
--

-- \restrict MXEdJ8bStjOcK2c59hcYXbPezy19NxooVT6ADU3EPBDktNhEkxurMdx4eBTCxdm

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";

--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


--
-- Name: private; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";

--
-- Name: smartstay; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA IF NOT EXISTS "smartstay";


ALTER SCHEMA "smartstay" OWNER TO "postgres";

--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "btree_gist" WITH SCHEMA "public";

--
-- Name: asset_status; Type: TYPE; Schema: smartstay; Owner: postgres
--

CREATE TYPE "smartstay"."asset_status" AS ENUM (
    'in_use',
    'maintenance',
    'disposed',
    'cancelled'
);


ALTER TYPE "smartstay"."asset_status" OWNER TO "postgres";

--
-- Name: balance_transaction_type; Type: TYPE; Schema: smartstay; Owner: postgres
--

CREATE TYPE "smartstay"."balance_transaction_type" AS ENUM (
    'deposit',
    'deduction',
    'refund',
    'adjustment'
);


ALTER TYPE "smartstay"."balance_transaction_type" OWNER TO "postgres";

--
-- Name: billing_run_status; Type: TYPE; Schema: smartstay; Owner: postgres
--

CREATE TYPE "smartstay"."billing_run_status" AS ENUM (
    'draft',
    'running',
    'completed',
    'failed',
    'cancelled'
);


ALTER TYPE "smartstay"."billing_run_status" OWNER TO "postgres";

--
-- Name: contract_status; Type: TYPE; Schema: smartstay; Owner: postgres
--

CREATE TYPE "smartstay"."contract_status" AS ENUM (
    'draft',
    'pending_signature',
    'active',
    'expired',
    'terminated',
    'cancelled'
);


ALTER TYPE "smartstay"."contract_status" OWNER TO "postgres";

--
-- Name: deposit_status; Type: TYPE; Schema: smartstay; Owner: postgres
--

CREATE TYPE "smartstay"."deposit_status" AS ENUM (
    'pending',
    'received',
    'partially_refunded',
    'refunded',
    'forfeited'
);


ALTER TYPE "smartstay"."deposit_status" OWNER TO "postgres";

--
-- Name: gender_type; Type: TYPE; Schema: smartstay; Owner: postgres
--

CREATE TYPE "smartstay"."gender_type" AS ENUM (
    'male',
    'female',
    'other'
);


ALTER TYPE "smartstay"."gender_type" OWNER TO "postgres";

--
-- Name: invoice_status; Type: TYPE; Schema: smartstay; Owner: postgres
--

CREATE TYPE "smartstay"."invoice_status" AS ENUM (
    'draft',
    'pending_payment',
    'partially_paid',
    'paid',
    'overdue',
    'cancelled'
);


ALTER TYPE "smartstay"."invoice_status" OWNER TO "postgres";

--
-- Name: payment_attempt_method; Type: TYPE; Schema: smartstay; Owner: postgres
--

CREATE TYPE "smartstay"."payment_attempt_method" AS ENUM (
    'momo',
    'cash',
    'bank_transfer'
);


ALTER TYPE "smartstay"."payment_attempt_method" OWNER TO "postgres";

--
-- Name: TYPE "payment_attempt_method"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON TYPE "smartstay"."payment_attempt_method" IS 'Phuong thuc payment attempt.
momo_online = Thanh toan MoMo online qua gateway
tien_mat = Thu tien mat, admin/thu ngan duyet tay
chuyen_khoan = Tenant chuyen khoan va upload bien lai, admin duyet tay';


--
-- Name: payment_method; Type: TYPE; Schema: smartstay; Owner: postgres
--

CREATE TYPE "smartstay"."payment_method" AS ENUM (
    'cash',
    'bank_transfer',
    'momo',
    'zalopay',
    'vnpay',
    'stripe',
    'other'
);


ALTER TYPE "smartstay"."payment_method" OWNER TO "postgres";

--
-- Name: payment_status; Type: TYPE; Schema: smartstay; Owner: postgres
--

CREATE TYPE "smartstay"."payment_status" AS ENUM (
    'pending',
    'submitted',
    'processing',
    'succeeded',
    'failed',
    'cancelled',
    'rejected',
    'refunded'
);


ALTER TYPE "smartstay"."payment_status" OWNER TO "postgres";

--
-- Name: TYPE "payment_status"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON TYPE "smartstay"."payment_status" IS 'Trang thai xu ly thanh toan.
cho_xu_ly = Cho xu ly (vua tao, chua lam gi)
da_gui = Da gui yeu cau (tenant da submit, cho admin hoac gateway)
dang_xu_ly = Dang xu ly (gateway dang xu ly)
thanh_cong = Thanh toan thanh cong
that_bai = Thanh toan that bai
da_huy = Da huy (tenant huy truoc khi xu ly)
bi_tu_choi = Bi tu choi (admin reject)
da_hoan_tien = Da hoan tien';


--
-- Name: priority_type; Type: TYPE; Schema: smartstay; Owner: postgres
--

CREATE TYPE "smartstay"."priority_type" AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
);


ALTER TYPE "smartstay"."priority_type" OWNER TO "postgres";

--
-- Name: room_status; Type: TYPE; Schema: smartstay; Owner: postgres
--

CREATE TYPE "smartstay"."room_status" AS ENUM (
    'available',
    'occupied',
    'maintenance',
    'reserved'
);


ALTER TYPE "smartstay"."room_status" OWNER TO "postgres";

--
-- Name: service_calc_type; Type: TYPE; Schema: smartstay; Owner: postgres
--

CREATE TYPE "smartstay"."service_calc_type" AS ENUM (
    'per_person',
    'per_unit',
    'flat_rate',
    'per_room'
);


ALTER TYPE "smartstay"."service_calc_type" OWNER TO "postgres";

--
-- Name: ticket_status; Type: TYPE; Schema: smartstay; Owner: postgres
--

CREATE TYPE "smartstay"."ticket_status" AS ENUM (
    'new',
    'in_progress',
    'pending_confirmation',
    'resolved',
    'closed'
);


ALTER TYPE "smartstay"."ticket_status" OWNER TO "postgres";

--
-- Name: user_role; Type: TYPE; Schema: smartstay; Owner: postgres
--

CREATE TYPE "smartstay"."user_role" AS ENUM (
    'admin',
    'manager',
    'staff',
    'landlord',
    'tenant'
);


ALTER TYPE "smartstay"."user_role" OWNER TO "postgres";

--
-- Name: utility_policy_scope; Type: TYPE; Schema: smartstay; Owner: postgres
--

CREATE TYPE "smartstay"."utility_policy_scope" AS ENUM (
    'system',
    'building',
    'room',
    'contract'
);


ALTER TYPE "smartstay"."utility_policy_scope" OWNER TO "postgres";

--
-- Name: webhook_status; Type: TYPE; Schema: smartstay; Owner: postgres
--

CREATE TYPE "smartstay"."webhook_status" AS ENUM (
    'received',
    'processing',
    'success',
    'failed',
    'retry'
);


ALTER TYPE "smartstay"."webhook_status" OWNER TO "postgres";

--
-- Name: can_view_meter_reading(bigint, "uuid"); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE OR REPLACE FUNCTION "private"."can_view_meter_reading"("p_meter_reading_id" bigint, "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from smartstay.meter_readings mr
    join smartstay.contracts c on c.room_id = mr.room_id
    join smartstay.contract_tenants ct on ct.contract_id = c.id
    join smartstay.tenants t on t.id = ct.tenant_id
    where mr.id = p_meter_reading_id
      and t.profile_id = p_user_id
      and coalesce(t.is_deleted, false) = false
      and coalesce(c.is_deleted, false) = false
      and c.status = 'active'
  );
$$;


ALTER FUNCTION "private"."can_view_meter_reading"("p_meter_reading_id" bigint, "p_user_id" "uuid") OWNER TO "postgres";

--
-- Name: is_admin("uuid"); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE OR REPLACE FUNCTION "private"."is_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from smartstay.profiles
    where id = user_id
      and role::text in ('admin', 'manager', 'staff', 'landlord')
  );
$$;


ALTER FUNCTION "private"."is_admin"("user_id" "uuid") OWNER TO "postgres";

--
-- Name: is_contract_participant(integer, "uuid"); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE OR REPLACE FUNCTION "private"."is_contract_participant"("p_contract_id" integer, "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from smartstay.contract_tenants ct
    join smartstay.tenants t on t.id = ct.tenant_id
    join smartstay.contracts c on c.id = ct.contract_id
    where ct.contract_id = p_contract_id
      and t.profile_id = p_user_id
      and coalesce(t.is_deleted, false) = false
      and coalesce(c.is_deleted, false) = false
  );
$$;


ALTER FUNCTION "private"."is_contract_participant"("p_contract_id" integer, "p_user_id" "uuid") OWNER TO "postgres";

--
-- Name: is_invoice_owner(integer, "uuid"); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE OR REPLACE FUNCTION "private"."is_invoice_owner"("p_invoice_id" integer, "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from smartstay.invoices i
    where i.id = p_invoice_id
      and private.is_contract_participant(i.contract_id, p_user_id)
  );
$$;


ALTER FUNCTION "private"."is_invoice_owner"("p_invoice_id" integer, "p_user_id" "uuid") OWNER TO "postgres";

--
-- Name: is_tenant_profile(integer, "uuid"); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE OR REPLACE FUNCTION "private"."is_tenant_profile"("p_tenant_id" integer, "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from smartstay.tenants t
    where t.id = p_tenant_id
      and t.profile_id = p_user_id
      and coalesce(t.is_deleted, false) = false
  );
$$;


ALTER FUNCTION "private"."is_tenant_profile"("p_tenant_id" integer, "p_user_id" "uuid") OWNER TO "postgres";

--
-- Name: adjust_balance(bigint, numeric, "text", "text", bigint, "uuid"); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."adjust_balance"("p_tenant_id" bigint, "p_amount" numeric, "p_transaction_type" "text", "p_notes" "text", "p_invoice_id" bigint DEFAULT NULL::bigint, "p_created_by" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'smartstay', 'public'
    AS $$
declare
  v_bal record;
  v_history_id bigint;
  v_after numeric;
begin
  perform smartstay.ensure_tenant_balance_record(p_tenant_id);

  select id, balance
  into v_bal
  from smartstay.tenant_balances
  where tenant_id = p_tenant_id
  for update;

  if not found then
    raise exception 'Tenant balance not found for tenant %', p_tenant_id;
  end if;

  v_after := coalesce(v_bal.balance, 0) + p_amount;

  insert into smartstay.balance_history (
    tenant_id,
    balance_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    notes,
    invoice_id,
    created_by
  )
  values (
    p_tenant_id,
    v_bal.id,
    p_transaction_type::smartstay.balance_transaction_type,
    p_amount,
    coalesce(v_bal.balance, 0),
    v_after,
    p_notes,
    p_invoice_id,
    p_created_by
  )
  returning id into v_history_id;

  update smartstay.tenant_balances
  set balance = v_after, last_updated = now()
  where id = v_bal.id;

  return jsonb_build_object(
    'historyId', v_history_id,
    'balanceBefore', coalesce(v_bal.balance, 0),
    'balanceAfter', v_after
  );
end;
$$;


ALTER FUNCTION "smartstay"."adjust_balance"("p_tenant_id" bigint, "p_amount" numeric, "p_transaction_type" "text", "p_notes" "text", "p_invoice_id" bigint, "p_created_by" "uuid") OWNER TO "postgres";

--
-- Name: apply_confirmed_payment(bigint, "text", "uuid", boolean); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."apply_confirmed_payment"("p_payment_id" bigint, "p_confirmation_source" "text", "p_confirmed_by" "uuid" DEFAULT NULL::"uuid", "p_fail_if_applied" boolean DEFAULT true) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'smartstay', 'public'
    AS $$
declare
  v_payment record;
  v_invoice record;
  v_primary_tenant_id bigint;
  v_balance_id integer;
  v_balance_before numeric;
  v_balance_after numeric;
  v_new_paid numeric;
  v_new_due numeric;
  v_new_status smartstay.invoice_status;
begin
  select
    p.id,
    p.invoice_id,
    p.amount,
    p.notes,
    p.payment_date,
    p.confirmed_at,
    p.confirmed_by,
    p.applied_at,
    p.status
  into v_payment
  from smartstay.payments p
  where p.id = p_payment_id
  for update;

  if not found then
    raise exception 'Payment not found: %', p_payment_id;
  end if;

  if v_payment.applied_at is not null then
    if p_fail_if_applied then
      raise exception 'Payment % has already been applied to the invoice', p_payment_id;
    end if;

    select
      i.id,
      i.amount_paid,
      i.balance_due,
      i.status
    into v_invoice
    from smartstay.invoices i
    where i.id = v_payment.invoice_id;

    return jsonb_build_object(
      'paymentId', v_payment.id,
      'invoiceId', v_payment.invoice_id,
      'invoiceStatus', v_invoice.status,
      'amountPaid', v_invoice.amount_paid,
      'balanceDue', v_invoice.balance_due
    );
  end if;

  select
    i.id,
    i.contract_id,
    i.invoice_code,
    i.total_amount,
    i.amount_paid,
    i.balance_due,
    i.status
  into v_invoice
  from smartstay.invoices i
  where i.id = v_payment.invoice_id
  for update;

  if not found then
    raise exception 'Invoice not found for payment %', p_payment_id;
  end if;

  v_new_paid := coalesce(v_invoice.amount_paid, 0) + v_payment.amount;
  if v_new_paid > coalesce(v_invoice.total_amount, 0) then
    raise exception 'Payment % would overpay invoice %', p_payment_id, v_invoice.id;
  end if;

  v_new_due := greatest(0, coalesce(v_invoice.total_amount, 0) - v_new_paid);
  v_new_status := case
    when v_new_due = 0 then 'paid'::smartstay.invoice_status
    when v_new_paid > 0 then 'partially_paid'::smartstay.invoice_status
    when v_invoice.status = 'draft' then 'draft'::smartstay.invoice_status
    when v_invoice.status = 'overdue' then 'overdue'::smartstay.invoice_status
    else 'pending_payment'::smartstay.invoice_status
  end;

  update smartstay.payments
  set
    status = 'succeeded'::smartstay.payment_status,
    confirmation_source = p_confirmation_source,
    confirmed_at = coalesce(confirmed_at, now()),
    confirmed_by = coalesce(confirmed_by, p_confirmed_by),
    applied_at = now(),
    applied_by = coalesce(applied_by, p_confirmed_by)
  where id = p_payment_id;

  update smartstay.invoices
  set
    amount_paid = v_new_paid,
    status = v_new_status,
    paid_date = case when v_new_due = 0 then coalesce(v_payment.confirmed_at, now()) else null end,
    updated_at = now()
  where id = v_invoice.id;

  select ct.tenant_id
  into v_primary_tenant_id
  from smartstay.contract_tenants ct
  where ct.contract_id = v_invoice.contract_id
  order by ct.is_primary desc, ct.id asc
  limit 1;

  if v_primary_tenant_id is not null then
    v_balance_id := smartstay.ensure_tenant_balance_record(v_primary_tenant_id);

    select balance
    into v_balance_before
    from smartstay.tenant_balances
    where id = v_balance_id
    for update;

    v_balance_after := coalesce(v_balance_before, 0) - v_payment.amount;

    update smartstay.tenant_balances
    set
      balance = v_balance_after,
      last_updated = now()
    where id = v_balance_id;

    insert into smartstay.balance_history (
      tenant_id,
      balance_id,
      transaction_type,
      amount,
      invoice_id,
      payment_id,
      balance_before,
      balance_after,
      notes,
      created_by
    )
    values (
      v_primary_tenant_id,
      v_balance_id,
      'deduction'::smartstay.balance_transaction_type,
      -v_payment.amount,
      v_invoice.id,
      v_payment.id,
      coalesce(v_balance_before, 0),
      v_balance_after,
      format('Ghi nhan thanh toan cho invoice %s', v_invoice.invoice_code),
      p_confirmed_by
    );
  end if;

  return jsonb_build_object(
    'paymentId', v_payment.id,
    'invoiceId', v_invoice.id,
    'invoiceStatus', v_new_status,
    'amountPaid', v_new_paid,
    'balanceDue', v_new_due
  );
end;
$$;


ALTER FUNCTION "smartstay"."apply_confirmed_payment"("p_payment_id" bigint, "p_confirmation_source" "text", "p_confirmed_by" "uuid", "p_fail_if_applied" boolean) OWNER TO "postgres";

--
-- Name: approve_payment(bigint, "uuid"); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."approve_payment"("p_payment_id" bigint, "p_confirmed_by" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
    balance_due = v_new_due,
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


ALTER FUNCTION "smartstay"."approve_payment"("p_payment_id" bigint, "p_confirmed_by" "uuid") OWNER TO "postgres";

--
-- Name: approve_payment(bigint, "uuid", bigint, "text"); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."approve_payment"("p_payment_id" bigint, "p_confirmed_by" "uuid" DEFAULT NULL::"uuid", "p_attempt_id" bigint DEFAULT NULL::bigint, "p_confirmation_source" "text" DEFAULT 'admin_manual'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'smartstay', 'public'
    AS $$
declare
  v_attempt record;
  v_payment_id bigint;
  v_result jsonb;
begin
  if p_attempt_id is not null then
    select
      pa.id,
      pa.invoice_id,
      pa.amount,
      pa.method,
      pa.status,
      pa.receipt_url,
      pa.reference_number,
      pa.bank_name,
      pa.notes,
      pa.payment_id
    into v_attempt
    from smartstay.payment_attempts pa
    where pa.id = p_attempt_id
    for update;

    if not found then
      raise exception 'Payment attempt not found: %', p_attempt_id;
    end if;

    if v_attempt.status in ('cancelled', 'rejected', 'failed', 'refunded') then
      raise exception 'Payment attempt % is not approvable in status %', p_attempt_id, v_attempt.status;
    end if;

    if v_attempt.payment_id is not null then
      raise exception 'Payment attempt % already created confirmed payment %', p_attempt_id, v_attempt.payment_id;
    end if;

    insert into smartstay.payments (
      invoice_id,
      amount,
      method,
      bank_name,
      reference_number,
      receipt_url,
      payment_date,
      confirmed_by,
      confirmed_at,
      notes,
      status,
      payment_attempt_id
    )
    values (
      v_attempt.invoice_id,
      v_attempt.amount,
      smartstay.map_legacy_payment_method(v_attempt.method),
      v_attempt.bank_name,
      v_attempt.reference_number,
      v_attempt.receipt_url,
      now(),
      p_confirmed_by,
      now(),
      v_attempt.notes,
      'succeeded'::smartstay.payment_status,
      v_attempt.id
    )
    returning id into v_payment_id;

    update smartstay.payment_attempts
    set
      status = 'succeeded'::smartstay.payment_status,
      payment_id = v_payment_id,
      approved_at = now(),
      approved_by = p_confirmed_by
    where id = v_attempt.id;

    return smartstay.apply_confirmed_payment(
      p_payment_id := v_payment_id,
      p_confirmation_source := p_confirmation_source,
      p_confirmed_by := p_confirmed_by,
      p_fail_if_applied := true
    );
  end if;

  v_result := smartstay.apply_confirmed_payment(
    p_payment_id := p_payment_id,
    p_confirmation_source := p_confirmation_source,
    p_confirmed_by := p_confirmed_by,
    p_fail_if_applied := true
  );

  return v_result;
end;
$$;


ALTER FUNCTION "smartstay"."approve_payment"("p_payment_id" bigint, "p_confirmed_by" "uuid", "p_attempt_id" bigint, "p_confirmation_source" "text") OWNER TO "postgres";

--
-- Name: create_contract(bigint, "date", "date", numeric, numeric, integer, bigint[], bigint, bigint[], numeric[], integer[], boolean); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."create_contract"("p_room_id" bigint, "p_start_date" "date", "p_end_date" "date", "p_monthly_rent" numeric, "p_deposit_amount" numeric, "p_payment_cycle_months" integer, "p_tenant_ids" bigint[], "p_primary_tenant_id" bigint, "p_service_ids" bigint[] DEFAULT '{}'::bigint[], "p_service_prices" numeric[] DEFAULT '{}'::numeric[], "p_service_quantities" integer[] DEFAULT '{}'::integer[], "p_mark_deposit_received" boolean DEFAULT false) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'smartstay', 'public'
    AS $$
declare
  v_contract_id bigint;
  v_contract_code text;
  v_tenant_id bigint;
  i integer;
begin
  if not exists (
    select 1
    from smartstay.rooms
    where id = p_room_id
      and status <> 'occupied'
  ) then
    raise exception 'Room % is not available (not found or already occupied)', p_room_id;
  end if;

  insert into smartstay.contracts (
    room_id,
    start_date,
    end_date,
    monthly_rent,
    deposit_amount,
    payment_cycle_months,
    status,
    deposit_status,
    is_deleted
  )
  values (
    p_room_id,
    p_start_date,
    p_end_date,
    p_monthly_rent,
    p_deposit_amount,
    p_payment_cycle_months,
    'active',
    case when p_mark_deposit_received then 'received' else 'pending' end,
    false
  )
  returning id, contract_code into v_contract_id, v_contract_code;

  foreach v_tenant_id in array p_tenant_ids loop
    insert into smartstay.contract_tenants (contract_id, tenant_id, is_primary)
    values (v_contract_id, v_tenant_id, v_tenant_id = p_primary_tenant_id);
  end loop;

  if array_length(p_service_ids, 1) is not null then
    for i in 1..array_length(p_service_ids, 1) loop
      insert into smartstay.contract_services (contract_id, service_id, fixed_price, quantity)
      values (
        v_contract_id,
        p_service_ids[i],
        case when array_length(p_service_prices, 1) >= i then p_service_prices[i] else null end,
        case when array_length(p_service_quantities, 1) >= i then p_service_quantities[i] else 1 end
      );
    end loop;
  end if;

  update smartstay.rooms
  set status = 'occupied'
  where id = p_room_id;

  return jsonb_build_object(
    'contractId', v_contract_id,
    'contractCode', v_contract_code
  );
end;
$$;


ALTER FUNCTION "smartstay"."create_contract"("p_room_id" bigint, "p_start_date" "date", "p_end_date" "date", "p_monthly_rent" numeric, "p_deposit_amount" numeric, "p_payment_cycle_months" integer, "p_tenant_ids" bigint[], "p_primary_tenant_id" bigint, "p_service_ids" bigint[], "p_service_prices" numeric[], "p_service_quantities" integer[], "p_mark_deposit_received" boolean) OWNER TO "postgres";

--
-- Name: create_policy_utility_invoice(bigint, "text", "date", numeric, numeric, "text", "jsonb", "jsonb"); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."create_policy_utility_invoice"("p_contract_id" bigint, "p_billing_period" "text", "p_due_date" "date", "p_subtotal" numeric, "p_total_amount" numeric, "p_note" "text" DEFAULT NULL::"text", "p_invoice_items" "jsonb" DEFAULT '[]'::"jsonb", "p_snapshot" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'smartstay', 'public'
    AS $_$
declare
  v_invoice_id integer;
  v_invoice_code text;
begin
  if p_contract_id is null or p_contract_id <= 0 then
    raise exception 'Invalid contract id';
  end if;

  if p_billing_period is null or p_billing_period !~ '^\d{4}-\d{2}$' then
    raise exception 'Invalid billing period: %', p_billing_period;
  end if;

  if p_due_date is null then
    raise exception 'Due date is required';
  end if;

  if p_subtotal is null or p_subtotal < 0 then
    raise exception 'Subtotal must be >= 0';
  end if;

  if p_total_amount is null or p_total_amount < 0 then
    raise exception 'Total amount must be >= 0';
  end if;

  if jsonb_typeof(coalesce(p_invoice_items, '[]'::jsonb)) <> 'array' then
    raise exception 'Invoice items payload must be a JSON array';
  end if;

  if jsonb_typeof(coalesce(p_snapshot, '{}'::jsonb)) <> 'object' then
    raise exception 'Snapshot payload must be a JSON object';
  end if;

  if exists (
    select 1
    from smartstay.invoices i
    where i.contract_id = p_contract_id
      and i.billing_period = p_billing_period
      and i.status <> 'cancelled'
  ) then
    raise exception 'Invoice already exists for contract % and billing period %', p_contract_id, p_billing_period;
  end if;

  insert into smartstay.invoices (
    contract_id,
    billing_period,
    subtotal,
    tax_amount,
    total_amount,
    amount_paid,
    balance_due,
    due_date,
    status,
    notes
  )
  values (
    p_contract_id,
    p_billing_period,
    p_subtotal,
    0,
    p_total_amount,
    0,
    p_total_amount,
    p_due_date,
    'pending_payment'::smartstay.invoice_status,
    nullif(trim(coalesce(p_note, '')), '')
  )
  returning id, invoice_code into v_invoice_id, v_invoice_code;

  insert into smartstay.invoice_items (
    invoice_id,
    description,
    quantity,
    unit_price,
    line_total,
    meter_reading_id,
    sort_order
  )
  select
    v_invoice_id,
    coalesce(item ->> 'description', 'Utility item'),
    coalesce((item ->> 'quantity')::numeric, 1),
    coalesce((item ->> 'unitPrice')::numeric, 0),
    coalesce((item ->> 'lineTotal')::numeric, 0),
    null,
    coalesce((item ->> 'sortOrder')::integer, ordinality::integer)
  from jsonb_array_elements(coalesce(p_invoice_items, '[]'::jsonb)) with ordinality as items(item, ordinality);

  insert into smartstay.invoice_utility_snapshots (
    invoice_id,
    contract_id,
    room_id,
    billing_run_id,
    override_id,
    resolved_policy_id,
    billing_period,
    period_start,
    period_end,
    policy_source_type,
    occupants_for_billing,
    occupied_days,
    days_in_period,
    prorate_ratio,
    electric_base_amount,
    electric_device_surcharge,
    electric_subtotal,
    electric_season_multiplier,
    electric_location_multiplier,
    electric_raw_amount,
    electric_rounded_amount,
    min_electric_floor,
    electric_final_amount,
    water_base_amount,
    water_per_person_amount,
    water_person_charge,
    water_subtotal,
    water_location_multiplier,
    water_raw_amount,
    water_rounded_amount,
    min_water_floor,
    water_final_amount,
    rounding_increment,
    resolved_device_surcharges_json,
    warnings_json,
    formula_snapshot_json
  )
  values (
    v_invoice_id,
    p_contract_id,
    (p_snapshot ->> 'roomId')::integer,
    nullif(p_snapshot ->> 'billingRunId', '')::bigint,
    nullif(p_snapshot ->> 'overrideId', '')::bigint,
    nullif(p_snapshot ->> 'resolvedPolicyId', '')::bigint,
    p_billing_period,
    (p_snapshot ->> 'periodStart')::date,
    (p_snapshot ->> 'periodEnd')::date,
    coalesce(p_snapshot ->> 'policySourceType', 'system'),
    coalesce((p_snapshot ->> 'occupantsForBilling')::integer, 0),
    coalesce((p_snapshot ->> 'occupiedDays')::integer, 0),
    coalesce((p_snapshot ->> 'daysInPeriod')::integer, 1),
    coalesce((p_snapshot ->> 'prorateRatio')::numeric, 0),
    coalesce((p_snapshot ->> 'electricBaseAmount')::numeric, 0),
    coalesce((p_snapshot ->> 'electricDeviceSurcharge')::numeric, 0),
    coalesce((p_snapshot ->> 'electricSubtotal')::numeric, 0),
    coalesce((p_snapshot ->> 'electricSeasonMultiplier')::numeric, 1),
    coalesce((p_snapshot ->> 'electricLocationMultiplier')::numeric, 1),
    coalesce((p_snapshot ->> 'electricRawAmount')::numeric, 0),
    coalesce((p_snapshot ->> 'electricRoundedAmount')::numeric, 0),
    coalesce((p_snapshot ->> 'minElectricFloor')::numeric, 0),
    coalesce((p_snapshot ->> 'electricFinalAmount')::numeric, 0),
    coalesce((p_snapshot ->> 'waterBaseAmount')::numeric, 0),
    coalesce((p_snapshot ->> 'waterPerPersonAmount')::numeric, 0),
    coalesce((p_snapshot ->> 'waterPersonCharge')::numeric, 0),
    coalesce((p_snapshot ->> 'waterSubtotal')::numeric, 0),
    coalesce((p_snapshot ->> 'waterLocationMultiplier')::numeric, 1),
    coalesce((p_snapshot ->> 'waterRawAmount')::numeric, 0),
    coalesce((p_snapshot ->> 'waterRoundedAmount')::numeric, 0),
    coalesce((p_snapshot ->> 'minWaterFloor')::numeric, 0),
    coalesce((p_snapshot ->> 'waterFinalAmount')::numeric, 0),
    coalesce((p_snapshot ->> 'roundingIncrement')::numeric, 1000),
    coalesce(p_snapshot -> 'resolvedDeviceSurcharges', '[]'::jsonb),
    coalesce(p_snapshot -> 'warnings', '[]'::jsonb),
    coalesce(p_snapshot -> 'formulaSnapshot', '{}'::jsonb)
  );

  return jsonb_build_object(
    'invoiceId', v_invoice_id,
    'invoiceCode', v_invoice_code
  );
end;
$_$;


ALTER FUNCTION "smartstay"."create_policy_utility_invoice"("p_contract_id" bigint, "p_billing_period" "text", "p_due_date" "date", "p_subtotal" numeric, "p_total_amount" numeric, "p_note" "text", "p_invoice_items" "jsonb", "p_snapshot" "jsonb") OWNER TO "postgres";

--
-- Name: FUNCTION "create_policy_utility_invoice"("p_contract_id" bigint, "p_billing_period" "text", "p_due_date" "date", "p_subtotal" numeric, "p_total_amount" numeric, "p_note" "text", "p_invoice_items" "jsonb", "p_snapshot" "jsonb"); Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON FUNCTION "smartstay"."create_policy_utility_invoice"("p_contract_id" bigint, "p_billing_period" "text", "p_due_date" "date", "p_subtotal" numeric, "p_total_amount" numeric, "p_note" "text", "p_invoice_items" "jsonb", "p_snapshot" "jsonb") IS 'Persist invoice utility policy-based trong 1 transaction: invoices + invoice_items + invoice_utility_snapshots.';


--
-- Name: ensure_contract_tenant_balance(); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."ensure_contract_tenant_balance"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'smartstay', 'public'
    AS $$
begin
  perform smartstay.ensure_tenant_balance_record(new.tenant_id);
  return new;
end;
$$;


ALTER FUNCTION "smartstay"."ensure_contract_tenant_balance"() OWNER TO "postgres";

--
-- Name: ensure_tenant_balance_record(bigint); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."ensure_tenant_balance_record"("p_tenant_id" bigint) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'smartstay', 'public'
    AS $$
declare
  v_balance_id integer;
begin
  insert into smartstay.tenant_balances (tenant_id, balance, last_updated)
  values (p_tenant_id, 0, now())
  on conflict (tenant_id) do update
    set last_updated = smartstay.tenant_balances.last_updated
  returning id into v_balance_id;

  return v_balance_id;
end;
$$;


ALTER FUNCTION "smartstay"."ensure_tenant_balance_record"("p_tenant_id" bigint) OWNER TO "postgres";

--
-- Name: generate_code("text", "text"); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."generate_code"("prefix" "text", "sequence_name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    next_val BIGINT;
BEGIN
    EXECUTE format('SELECT nextval(%L)', 'smartstay.' || sequence_name) INTO next_val;
    RETURN prefix || '-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(next_val::TEXT, 5, '0');
END;
$$;


ALTER FUNCTION "smartstay"."generate_code"("prefix" "text", "sequence_name" "text") OWNER TO "postgres";

--
-- Name: handle_momo_ipn("jsonb", "text", "text", timestamp with time zone); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."handle_momo_ipn"("p_payload" "jsonb", "p_secret_key" "text", "p_access_key" "text", "p_received_at" timestamp with time zone DEFAULT "now"()) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'smartstay', 'public'
    AS $$
declare
  v_log_id bigint;
  v_order_id text;
  v_request_id text;
  v_trans_id text;
  v_message text;
  v_signature text;
  v_raw_signature text;
  v_expected_signature text;
  v_result_code integer;
  v_amount numeric;
  v_attempt record;
  v_result jsonb;
begin
  insert into smartstay.webhook_logs (
    provider,
    payload,
    received_at,
    status
  )
  values (
    'momo',
    coalesce(p_payload, '{}'::jsonb),
    coalesce(p_received_at, now()),
    'processing'
  )
  returning id into v_log_id;

  v_order_id := nullif(p_payload ->> 'orderId', '');
  v_request_id := nullif(p_payload ->> 'requestId', '');
  v_trans_id := nullif(p_payload ->> 'transId', '');
  v_message := coalesce(p_payload ->> 'message', '');
  v_signature := lower(coalesce(p_payload ->> 'signature', ''));
  v_result_code := coalesce(nullif(p_payload ->> 'resultCode', '')::integer, -1);
  v_amount := coalesce(nullif(p_payload ->> 'amount', '')::numeric, 0);

  v_raw_signature := format(
    'accessKey=%s&amount=%s&extraData=%s&message=%s&orderId=%s&orderInfo=%s&orderType=%s&partnerCode=%s&payType=%s&requestId=%s&responseTime=%s&resultCode=%s&transId=%s',
    coalesce(p_access_key, ''),
    coalesce(p_payload ->> 'amount', ''),
    coalesce(p_payload ->> 'extraData', ''),
    coalesce(p_payload ->> 'message', ''),
    coalesce(v_order_id, ''),
    coalesce(p_payload ->> 'orderInfo', ''),
    coalesce(p_payload ->> 'orderType', ''),
    coalesce(p_payload ->> 'partnerCode', ''),
    coalesce(p_payload ->> 'payType', ''),
    coalesce(v_request_id, ''),
    coalesce(p_payload ->> 'responseTime', ''),
    coalesce(p_payload ->> 'resultCode', ''),
    coalesce(v_trans_id, '')
  );

  v_expected_signature := lower(
    encode(
      extensions.hmac(v_raw_signature::bytea, coalesce(p_secret_key, '')::bytea, 'sha256'),
      'hex'
    )
  );

  if v_signature = '' or v_expected_signature <> v_signature then
    update smartstay.webhook_logs
    set
      status = 'failed',
      error_message = 'invalid_signature',
      processed_at = now()
    where id = v_log_id;

    return jsonb_build_object('status', 'invalid_signature');
  end if;

  select
    pa.id,
    pa.invoice_id,
    pa.amount,
    pa.status,
    pa.payment_id
  into v_attempt
  from smartstay.payment_attempts pa
  where pa.gateway_order_id = v_order_id
     or pa.idempotency_key = concat('momo:', v_order_id)
  order by pa.id desc
  limit 1
  for update;

  if not found then
    update smartstay.webhook_logs
    set
      status = 'failed',
      error_message = 'payment_attempt_not_found',
      processed_at = now()
    where id = v_log_id;

    return jsonb_build_object('status', 'payment_attempt_not_found', 'orderId', v_order_id);
  end if;

  if v_attempt.payment_id is not null or v_attempt.status = 'succeeded' then
    update smartstay.payment_attempts
    set
      status = 'succeeded'::smartstay.payment_status,
      gateway_request_id = coalesce(v_request_id, gateway_request_id),
      gateway_transaction_id = coalesce(v_trans_id, gateway_transaction_id),
      gateway_payload = coalesce(p_payload, '{}'::jsonb)
    where id = v_attempt.id;

    update smartstay.webhook_logs
    set
      status = 'success',
      processed_at = now(),
      error_message = null
    where id = v_log_id;

    return jsonb_build_object('status', 'duplicate', 'attemptId', v_attempt.id, 'paymentId', v_attempt.payment_id);
  end if;

  if v_result_code <> 0 then
    update smartstay.payment_attempts
    set
      status = 'failed'::smartstay.payment_status,
      gateway_request_id = coalesce(v_request_id, gateway_request_id),
      gateway_transaction_id = coalesce(v_trans_id, gateway_transaction_id),
      gateway_payload = coalesce(p_payload, '{}'::jsonb),
      notes = concat_ws(E'\n', notes, format('[momo_ipn] %s', v_message))
    where id = v_attempt.id;

    update smartstay.webhook_logs
    set
      status = 'failed',
      error_message = format('momo_result_code_%s', v_result_code),
      processed_at = now()
    where id = v_log_id;

    return jsonb_build_object('status', 'payment_failed', 'attemptId', v_attempt.id, 'resultCode', v_result_code);
  end if;

  if v_amount <> v_attempt.amount then
    update smartstay.webhook_logs
    set
      status = 'failed',
      error_message = 'amount_mismatch',
      processed_at = now()
    where id = v_log_id;

    raise exception 'MoMo IPN amount mismatch for attempt %', v_attempt.id;
  end if;

  update smartstay.payment_attempts
  set
    status = 'processing'::smartstay.payment_status,
    gateway_request_id = coalesce(v_request_id, gateway_request_id),
    gateway_transaction_id = coalesce(v_trans_id, gateway_transaction_id),
    gateway_payload = coalesce(p_payload, '{}'::jsonb)
  where id = v_attempt.id;

  v_result := smartstay.approve_payment(
    p_payment_id := 0,
    p_confirmed_by := null,
    p_attempt_id := v_attempt.id,
    p_confirmation_source := 'momo_ipn'
  );

  update smartstay.webhook_logs
  set
    status = 'success',
    error_message = null,
    processed_at = now()
  where id = v_log_id;

  return v_result || jsonb_build_object(
    'status', 'processed',
    'attemptId', v_attempt.id,
    'provider', 'momo'
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


ALTER FUNCTION "smartstay"."handle_momo_ipn"("p_payload" "jsonb", "p_secret_key" "text", "p_access_key" "text", "p_received_at" timestamp with time zone) OWNER TO "postgres";

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
    BEGIN
      INSERT INTO smartstay.profiles (id, full_name, role)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::smartstay.user_role, 'tenant'::smartstay.user_role)
      );
      RETURN NEW;
    END;
    $$;


ALTER FUNCTION "smartstay"."handle_new_user"() OWNER TO "postgres";

--
-- Name: handle_sepay_webhook("jsonb", "text", timestamp with time zone); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."handle_sepay_webhook"("p_payload" "jsonb", "p_api_key" "text" DEFAULT NULL::"text", "p_received_at" timestamp with time zone DEFAULT "now"()) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'smartstay', 'public'
    AS $$
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
  v_code_match text[];
  v_content_match text[];
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
    v_code_match := regexp_match(coalesce(v_code, ''), '(?i)INV[- ]?([0-9]{4})[- ]?([0-9]{3,})');
    v_content_match := regexp_match(coalesce(v_content, ''), '(?i)INV[- ]?([0-9]{4})[- ]?([0-9]{3,})');

    if v_code_match is not null then
      v_invoice_code := format('INV-%s-%s', v_code_match[1], v_code_match[2]);
    elsif v_content_match is not null then
      v_invoice_code := format('INV-%s-%s', v_content_match[1], v_content_match[2]);
    end if;
  end if;

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
    p_method := 'bank_transfer',
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
    p_attempt_status := 'processing'
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


ALTER FUNCTION "smartstay"."handle_sepay_webhook"("p_payload" "jsonb", "p_api_key" "text", "p_received_at" timestamp with time zone) OWNER TO "postgres";

--
-- Name: map_legacy_payment_method("smartstay"."payment_attempt_method"); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."map_legacy_payment_method"("p_method" "smartstay"."payment_attempt_method") RETURNS "smartstay"."payment_method"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'smartstay', 'public'
    AS $$
begin
  case p_method
    when 'momo' then
      return 'momo'::smartstay.payment_method;
    when 'cash' then
      return 'cash'::smartstay.payment_method;
    when 'bank_transfer' then
      return 'bank_transfer'::smartstay.payment_method;
    else
      raise exception 'Unsupported mapped method: %', p_method;
  end case;
end;
$$;


ALTER FUNCTION "smartstay"."map_legacy_payment_method"("p_method" "smartstay"."payment_attempt_method") OWNER TO "postgres";

--
-- Name: map_payment_attempt_method("text"); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."map_payment_attempt_method"("p_method" "text") RETURNS "smartstay"."payment_attempt_method"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'smartstay', 'public'
    AS $$
begin
  case lower(coalesce(trim(p_method), ''))
    when 'momo', 'momo_online' then
      return 'momo'::smartstay.payment_attempt_method;
    when 'cash', 'tien_mat' then
      return 'cash'::smartstay.payment_attempt_method;
    when 'bank_transfer', 'chuyen_khoan' then
      return 'bank_transfer'::smartstay.payment_attempt_method;
    else
      raise exception 'Unsupported payment method: %', p_method;
  end case;
end;
$$;


ALTER FUNCTION "smartstay"."map_payment_attempt_method"("p_method" "text") OWNER TO "postgres";

--
-- Name: portal_cancel_invoice(bigint, "text"); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."portal_cancel_invoice"("p_invoice_id" bigint, "p_reason" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'smartstay', 'public'
    AS $$
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


ALTER FUNCTION "smartstay"."portal_cancel_invoice"("p_invoice_id" bigint, "p_reason" "text") OWNER TO "postgres";

--
-- Name: portal_mark_invoice_paid(bigint); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."portal_mark_invoice_paid"("p_invoice_id" bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'smartstay', 'public'
    AS $$
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


ALTER FUNCTION "smartstay"."portal_mark_invoice_paid"("p_invoice_id" bigint) OWNER TO "postgres";

--
-- Name: portal_record_invoice_payment(bigint, numeric, "text", timestamp with time zone, "text", "text", "text"); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."portal_record_invoice_payment"("p_invoice_id" bigint, "p_amount" numeric, "p_method" "text", "p_payment_date" timestamp with time zone, "p_notes" "text" DEFAULT NULL::"text", "p_reference" "text" DEFAULT NULL::"text", "p_bank_name" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'smartstay', 'public'
    AS $$
declare
  v_actor_id uuid := auth.uid();
  v_invoice record;
  v_attempt_status smartstay.payment_status;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  select
    i.id,
    i.contract_id,
    i.amount_paid,
    i.balance_due,
    i.total_amount,
    i.status
  into v_invoice
  from smartstay.invoices i
  where i.id = p_invoice_id
    and exists (
      select 1
      from smartstay.contract_tenants ct
      join smartstay.tenants t on t.id = ct.tenant_id
      where ct.contract_id = i.contract_id
        and t.profile_id = v_actor_id
        and coalesce(t.is_deleted, false) = false
    )
  for update;

  if not found then
    raise exception 'Invoice not found or access denied';
  end if;

  if smartstay.map_payment_attempt_method(p_method) = 'momo'::smartstay.payment_attempt_method then
    v_attempt_status := 'pending'::smartstay.payment_status;
  else
    v_attempt_status := 'submitted'::smartstay.payment_status;
  end if;

  return smartstay.process_payment(
    p_invoice_id := p_invoice_id,
    p_amount := p_amount,
    p_method := p_method,
    p_payment_date := p_payment_date,
    p_notes := p_notes,
    p_receipt_url := null,
    p_reference := p_reference,
    p_bank_name := p_bank_name,
    p_confirmed_by := v_actor_id,
    p_auto_confirm := false,
    p_idempotency_key := case
      when p_reference is not null and smartstay.map_payment_attempt_method(p_method) = 'momo'::smartstay.payment_attempt_method
        then concat('momo:', p_reference)
      else null
    end,
    p_attempt_status := v_attempt_status
  );
end;
$$;


ALTER FUNCTION "smartstay"."portal_record_invoice_payment"("p_invoice_id" bigint, "p_amount" numeric, "p_method" "text", "p_payment_date" timestamp with time zone, "p_notes" "text", "p_reference" "text", "p_bank_name" "text") OWNER TO "postgres";

--
-- Name: process_payment(bigint, numeric, "text", timestamp with time zone, "text", "text", "text", "text", "uuid", boolean); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."process_payment"("p_invoice_id" bigint, "p_amount" numeric, "p_method" "text", "p_payment_date" timestamp with time zone, "p_notes" "text" DEFAULT NULL::"text", "p_receipt_url" "text" DEFAULT NULL::"text", "p_reference" "text" DEFAULT NULL::"text", "p_bank_name" "text" DEFAULT NULL::"text", "p_confirmed_by" "uuid" DEFAULT NULL::"uuid", "p_auto_confirm" boolean DEFAULT true) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
    invoice_id, amount, method, payment_date, notes,
    receipt_url, reference_number, bank_name, confirmed_by, confirmed_at
  )
  values (
    p_invoice_id, p_amount, p_method, p_payment_date, p_notes,
    p_receipt_url, p_reference, p_bank_name,
    case when p_auto_confirm then p_confirmed_by else null end,
    case when p_auto_confirm then now()          else null end
  )
  returning id, payment_code into v_payment_id, v_payment_code;

  update smartstay.invoices
  set
    amount_paid = v_new_paid,
    balance_due = v_new_due,
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


ALTER FUNCTION "smartstay"."process_payment"("p_invoice_id" bigint, "p_amount" numeric, "p_method" "text", "p_payment_date" timestamp with time zone, "p_notes" "text", "p_receipt_url" "text", "p_reference" "text", "p_bank_name" "text", "p_confirmed_by" "uuid", "p_auto_confirm" boolean) OWNER TO "postgres";

--
-- Name: process_payment(bigint, numeric, "text", timestamp with time zone, "text", "text", "text", "text", "uuid", boolean, "text", "smartstay"."payment_status"); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."process_payment"("p_invoice_id" bigint, "p_amount" numeric, "p_method" "text", "p_payment_date" timestamp with time zone, "p_notes" "text" DEFAULT NULL::"text", "p_receipt_url" "text" DEFAULT NULL::"text", "p_reference" "text" DEFAULT NULL::"text", "p_bank_name" "text" DEFAULT NULL::"text", "p_confirmed_by" "uuid" DEFAULT NULL::"uuid", "p_auto_confirm" boolean DEFAULT true, "p_idempotency_key" "text" DEFAULT NULL::"text", "p_attempt_status" "smartstay"."payment_status" DEFAULT NULL::"smartstay"."payment_status") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'smartstay', 'public'
    AS $$
declare
  v_invoice record;
  v_attempt record;
  v_attempt_id bigint;
  v_attempt_method smartstay.payment_attempt_method;
  v_attempt_status smartstay.payment_status;
  v_payment_id bigint;
  v_payment_code text;
  v_result jsonb;
begin
  select
    i.id,
    i.total_amount,
    i.amount_paid,
    i.balance_due,
    i.status
  into v_invoice
  from smartstay.invoices i
  where i.id = p_invoice_id
  for update;

  if not found then
    raise exception 'Invoice not found: %', p_invoice_id;
  end if;

  if v_invoice.status = 'cancelled' then
    raise exception 'Cancelled invoices cannot receive payments';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than 0';
  end if;

  if p_amount > greatest(0, coalesce(v_invoice.balance_due, coalesce(v_invoice.total_amount, 0) - coalesce(v_invoice.amount_paid, 0))) then
    raise exception 'Payment amount exceeds the remaining balance';
  end if;

  v_attempt_method := smartstay.map_payment_attempt_method(p_method);
  v_attempt_status := coalesce(
    p_attempt_status,
    case
      when p_auto_confirm then 'processing'::smartstay.payment_status
      else 'pending'::smartstay.payment_status
    end
  );

  if p_idempotency_key is not null then
    select
      pa.id,
      pa.status,
      pa.payment_id
    into v_attempt
    from smartstay.payment_attempts pa
    where pa.idempotency_key = p_idempotency_key
    for update;

    if found then
      if v_attempt.payment_id is not null then
        select p.payment_code
        into v_payment_code
        from smartstay.payments p
        where p.id = v_attempt.payment_id;
      end if;

      return jsonb_build_object(
        'attemptId', v_attempt.id,
        'paymentId', v_attempt.payment_id,
        'paymentCode', v_payment_code,
        'attemptStatus', v_attempt.status,
        'invoiceId', p_invoice_id,
        'invoiceStatus', v_invoice.status,
        'amountPaid', v_invoice.amount_paid,
        'balanceDue', coalesce(v_invoice.balance_due, greatest(0, coalesce(v_invoice.total_amount, 0) - coalesce(v_invoice.amount_paid, 0)))
      );
    end if;
  end if;

  insert into smartstay.payment_attempts (
    invoice_id,
    initiated_by,
    method,
    amount,
    status,
    idempotency_key,
    receipt_url,
    reference_number,
    bank_name,
    gateway_order_id,
    notes
  )
  values (
    p_invoice_id,
    p_confirmed_by,
    v_attempt_method,
    p_amount,
    v_attempt_status,
    p_idempotency_key,
    p_receipt_url,
    p_reference,
    p_bank_name,
    case when v_attempt_method = 'momo' then p_reference else null end,
    p_notes
  )
  returning id into v_attempt_id;

  if not p_auto_confirm then
    return jsonb_build_object(
      'attemptId', v_attempt_id,
      'paymentId', null,
      'paymentCode', null,
      'attemptStatus', v_attempt_status,
      'invoiceId', p_invoice_id,
      'invoiceStatus', v_invoice.status,
      'amountPaid', v_invoice.amount_paid,
      'balanceDue', coalesce(v_invoice.balance_due, greatest(0, coalesce(v_invoice.total_amount, 0) - coalesce(v_invoice.amount_paid, 0)))
    );
  end if;

  insert into smartstay.payments (
    invoice_id,
    amount,
    method,
    bank_name,
    reference_number,
    receipt_url,
    payment_date,
    confirmed_by,
    confirmed_at,
    notes,
    status,
    payment_attempt_id
  )
  values (
    p_invoice_id,
    p_amount,
    smartstay.map_legacy_payment_method(v_attempt_method),
    p_bank_name,
    p_reference,
    p_receipt_url,
    coalesce(p_payment_date, now()),
    p_confirmed_by,
    now(),
    p_notes,
    'succeeded'::smartstay.payment_status,
    v_attempt_id
  )
  returning id, payment_code into v_payment_id, v_payment_code;

  update smartstay.payment_attempts
  set
    status = 'succeeded'::smartstay.payment_status,
    payment_id = v_payment_id,
    approved_at = now(),
    approved_by = p_confirmed_by
  where id = v_attempt_id;

  v_result := smartstay.apply_confirmed_payment(
    p_payment_id := v_payment_id,
    p_confirmation_source := case
      when v_attempt_method = 'cash' then 'cash'
      else 'admin_manual'
    end,
    p_confirmed_by := p_confirmed_by,
    p_fail_if_applied := true
  );

  return v_result || jsonb_build_object(
    'attemptId', v_attempt_id,
    'paymentCode', v_payment_code,
    'attemptStatus', 'succeeded'
  );
end;
$$;


ALTER FUNCTION "smartstay"."process_payment"("p_invoice_id" bigint, "p_amount" numeric, "p_method" "text", "p_payment_date" timestamp with time zone, "p_notes" "text", "p_receipt_url" "text", "p_reference" "text", "p_bank_name" "text", "p_confirmed_by" "uuid", "p_auto_confirm" boolean, "p_idempotency_key" "text", "p_attempt_status" "smartstay"."payment_status") OWNER TO "postgres";

--
-- Name: schedule_monthly_utility_billing_job("text"); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."schedule_monthly_utility_billing_job"("job_name" "text" DEFAULT 'smartstay-monthly-utility-billing'::"text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
declare
  scheduled_job_id bigint;
begin
  select cron.schedule(
    job_name,
    '5 17 * * *',
    $cmd$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'smartstay_project_url') || '/functions/v1/run-utility-billing',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'smartstay_utility_billing_cron_secret')
        ),
        body := jsonb_build_object('trigger', 'cron'),
        timeout_milliseconds := 10000
      ) as request_id;
    $cmd$
  ) into scheduled_job_id;

  return scheduled_job_id;
end;
$_$;


ALTER FUNCTION "smartstay"."schedule_monthly_utility_billing_job"("job_name" "text") OWNER TO "postgres";

--
-- Name: FUNCTION "schedule_monthly_utility_billing_job"("job_name" "text"); Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON FUNCTION "smartstay"."schedule_monthly_utility_billing_job"("job_name" "text") IS 'Schedule cron-safe monthly utility billing trigger. Job runs daily at 17:05 UTC and the edge function only executes on day 1 in Asia/Saigon.';


--
-- Name: touch_payment_attempt_updated_at(); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."touch_payment_attempt_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'smartstay', 'public'
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "smartstay"."touch_payment_attempt_updated_at"() OWNER TO "postgres";

--
-- Name: touch_utility_updated_at(); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."touch_utility_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'smartstay', 'public'
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "smartstay"."touch_utility_updated_at"() OWNER TO "postgres";

--
-- Name: trigger_set_updated_at(); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."trigger_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "smartstay"."trigger_set_updated_at"() OWNER TO "postgres";

--
-- Name: unschedule_monthly_utility_billing_job("text"); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."unschedule_monthly_utility_billing_job"("job_name" "text" DEFAULT 'smartstay-monthly-utility-billing'::"text") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select cron.unschedule(job_name);
$$;


ALTER FUNCTION "smartstay"."unschedule_monthly_utility_billing_job"("job_name" "text") OWNER TO "postgres";

--
-- Name: FUNCTION "unschedule_monthly_utility_billing_job"("job_name" "text"); Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON FUNCTION "smartstay"."unschedule_monthly_utility_billing_job"("job_name" "text") IS 'Remove the recurring utility billing cron job.';


--
-- Name: validate_utility_billing_cron_secret("text"); Type: FUNCTION; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE FUNCTION "smartstay"."validate_utility_billing_cron_secret"("p_candidate" "text") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select coalesce(
    p_candidate = (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'smartstay_utility_billing_cron_secret'
      limit 1
    ),
    false
  );
$$;


ALTER FUNCTION "smartstay"."validate_utility_billing_cron_secret"("p_candidate" "text") OWNER TO "postgres";

--
-- Name: FUNCTION "validate_utility_billing_cron_secret"("p_candidate" "text"); Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON FUNCTION "smartstay"."validate_utility_billing_cron_secret"("p_candidate" "text") IS 'Validate the utility billing cron secret for internal automation. Execute is restricted to service_role.';


SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: assets; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."assets" (
    "id" integer NOT NULL,
    "name" character varying(150) NOT NULL,
    "category" character varying(100),
    "brand" character varying(100),
    "model" character varying(100),
    "warranty_months" integer,
    "depreciation_years" integer,
    "unit_cost" numeric(18,2),
    "supplier" character varying(200),
    "description" "text",
    "qr_code" character varying(200),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "assets_depreciation_years_check" CHECK (("depreciation_years" > 0)),
    CONSTRAINT "assets_unit_cost_check" CHECK (("unit_cost" >= (0)::numeric)),
    CONSTRAINT "assets_warranty_months_check" CHECK (("warranty_months" >= 0))
);


ALTER TABLE "smartstay"."assets" OWNER TO "postgres";

--
-- Name: assets_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."assets_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."assets_id_seq" OWNER TO "postgres";

--
-- Name: assets_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."assets_id_seq" OWNED BY "smartstay"."assets"."id";


--
-- Name: audit_logs; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."audit_logs" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "action" character varying(100) NOT NULL,
    "entity_type" character varying(100) NOT NULL,
    "entity_id" character varying(50),
    "old_values" "jsonb",
    "new_values" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ONLY "smartstay"."audit_logs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "smartstay"."audit_logs" OWNER TO "postgres";

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."audit_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."audit_logs_id_seq" OWNER TO "postgres";

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."audit_logs_id_seq" OWNED BY "smartstay"."audit_logs"."id";


--
-- Name: balance_history; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."balance_history" (
    "id" bigint NOT NULL,
    "tenant_id" integer NOT NULL,
    "balance_id" integer NOT NULL,
    "transaction_type" "smartstay"."balance_transaction_type" NOT NULL,
    "amount" numeric(18,2) NOT NULL,
    "invoice_id" integer,
    "payment_id" bigint,
    "balance_before" numeric(18,2) NOT NULL,
    "balance_after" numeric(18,2) NOT NULL,
    "notes" character varying(255),
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chk_balance_calc" CHECK (("balance_after" = ("balance_before" + "amount")))
);

ALTER TABLE ONLY "smartstay"."balance_history" FORCE ROW LEVEL SECURITY;


ALTER TABLE "smartstay"."balance_history" OWNER TO "postgres";

--
-- Name: balance_history_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."balance_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."balance_history_id_seq" OWNER TO "postgres";

--
-- Name: balance_history_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."balance_history_id_seq" OWNED BY "smartstay"."balance_history"."id";


--
-- Name: billing_runs; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."billing_runs" (
    "id" bigint NOT NULL,
    "billing_period" "text" NOT NULL,
    "status" "smartstay"."billing_run_status" DEFAULT 'draft'::"smartstay"."billing_run_status" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_by" "uuid",
    "lock_version" integer DEFAULT 0 NOT NULL,
    "summary_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "error_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "billing_runs_billing_period_ck" CHECK (("billing_period" ~ '^\d{4}-\d{2}$'::"text")),
    CONSTRAINT "billing_runs_completed_after_started_ck" CHECK ((("completed_at" IS NULL) OR ("started_at" IS NULL) OR ("completed_at" >= "started_at")))
);

ALTER TABLE ONLY "smartstay"."billing_runs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "smartstay"."billing_runs" OWNER TO "postgres";

--
-- Name: TABLE "billing_runs"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON TABLE "smartstay"."billing_runs" IS 'Moi ky billing dau thang chi co 1 run canonical. Retry phai cap nhat cung row de giu idempotency.';


--
-- Name: COLUMN "billing_runs"."lock_version"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON COLUMN "smartstay"."billing_runs"."lock_version" IS 'Dung cho optimistic concurrency khi co nhieu admin thao tac cung billing run.';


--
-- Name: billing_runs_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."billing_runs" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "smartstay"."billing_runs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: building_images; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."building_images" (
    "id" bigint NOT NULL,
    "building_id" bigint NOT NULL,
    "url" "text" NOT NULL,
    "is_main" boolean DEFAULT false NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "smartstay"."building_images" FORCE ROW LEVEL SECURITY;


ALTER TABLE "smartstay"."building_images" OWNER TO "postgres";

--
-- Name: building_images_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."building_images" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "smartstay"."building_images_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buildings; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."buildings" (
    "id" integer NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(150) NOT NULL,
    "address" character varying(255) NOT NULL,
    "description" "text",
    "amenities" "jsonb" DEFAULT '[]'::"jsonb",
    "owner_id" "uuid",
    "total_floors" integer,
    "opening_date" "date",
    "latitude" numeric(9,6),
    "longitude" numeric(9,6),
    "electricity_provider" character varying(200),
    "water_provider" character varying(200),
    "fire_cert_expiry" "date",
    "last_maintenance_date" "date",
    "is_deleted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "search_vector" "tsvector" GENERATED ALWAYS AS ((("setweight"("to_tsvector"('"simple"'::"regconfig", (COALESCE("name", ''::character varying))::"text"), 'A'::"char") || "setweight"("to_tsvector"('"simple"'::"regconfig", (COALESCE("address", ''::character varying))::"text"), 'B'::"char")) || "setweight"("to_tsvector"('"simple"'::"regconfig", COALESCE("description", ''::"text")), 'C'::"char"))) STORED,
    CONSTRAINT "buildings_total_floors_check" CHECK (("total_floors" > 0))
);


ALTER TABLE "smartstay"."buildings" OWNER TO "postgres";

--
-- Name: buildings_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."buildings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."buildings_id_seq" OWNER TO "postgres";

--
-- Name: buildings_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."buildings_id_seq" OWNED BY "smartstay"."buildings"."id";


--
-- Name: contract_renewals; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."contract_renewals" (
    "id" integer NOT NULL,
    "contract_id" integer NOT NULL,
    "previous_end_date" "date" NOT NULL,
    "new_end_date" "date" NOT NULL,
    "new_monthly_rent" numeric(18,2) NOT NULL,
    "reason" "text",
    "renewed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chk_renewal_dates" CHECK (("new_end_date" > "previous_end_date"))
);


ALTER TABLE "smartstay"."contract_renewals" OWNER TO "postgres";

--
-- Name: contract_renewals_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."contract_renewals_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."contract_renewals_id_seq" OWNER TO "postgres";

--
-- Name: contract_renewals_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."contract_renewals_id_seq" OWNED BY "smartstay"."contract_renewals"."id";


--
-- Name: contract_services; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."contract_services" (
    "id" bigint NOT NULL,
    "contract_id" integer NOT NULL,
    "service_id" integer NOT NULL,
    "quantity" numeric(18,2) DEFAULT 1,
    "fixed_price" numeric(18,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contract_services_fixed_price_check" CHECK (("fixed_price" >= (0)::numeric)),
    CONSTRAINT "contract_services_quantity_check" CHECK (("quantity" > (0)::numeric))
);


ALTER TABLE "smartstay"."contract_services" OWNER TO "postgres";

--
-- Name: contract_services_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."contract_services_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."contract_services_id_seq" OWNER TO "postgres";

--
-- Name: contract_services_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."contract_services_id_seq" OWNED BY "smartstay"."contract_services"."id";


--
-- Name: contract_tenants; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."contract_tenants" (
    "id" bigint NOT NULL,
    "contract_id" integer NOT NULL,
    "tenant_id" integer NOT NULL,
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "smartstay"."contract_tenants" OWNER TO "postgres";

--
-- Name: contract_tenants_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."contract_tenants_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."contract_tenants_id_seq" OWNER TO "postgres";

--
-- Name: contract_tenants_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."contract_tenants_id_seq" OWNED BY "smartstay"."contract_tenants"."id";


--
-- Name: contract_terminations; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."contract_terminations" (
    "id" integer NOT NULL,
    "contract_id" integer NOT NULL,
    "final_invoice_id" integer,
    "final_invoice_amount" numeric(18,2) DEFAULT 0,
    "deposit_used" numeric(18,2) DEFAULT 0,
    "deposit_refunded" numeric(18,2) DEFAULT 0,
    "additional_charges" numeric(18,2) DEFAULT 0,
    "reason" character varying(255),
    "processed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "smartstay"."contract_terminations" OWNER TO "postgres";

--
-- Name: contract_terminations_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."contract_terminations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."contract_terminations_id_seq" OWNER TO "postgres";

--
-- Name: contract_terminations_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."contract_terminations_id_seq" OWNED BY "smartstay"."contract_terminations"."id";


--
-- Name: contracts; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."contracts" (
    "id" integer NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_code" character varying(50) DEFAULT "smartstay"."generate_code"('CTR'::"text", 'seq_contract_code'::"text") NOT NULL,
    "room_id" integer NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "signing_date" "date",
    "payment_cycle_months" integer DEFAULT 1 NOT NULL,
    "monthly_rent" numeric(18,2) NOT NULL,
    "deposit_amount" numeric(18,2) DEFAULT 0,
    "deposit_status" "smartstay"."deposit_status" DEFAULT 'pending'::"smartstay"."deposit_status",
    "status" "smartstay"."contract_status" DEFAULT 'draft'::"smartstay"."contract_status",
    "termination_reason" "text",
    "terms" "jsonb" DEFAULT '{}'::"jsonb",
    "is_deleted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chk_contract_dates" CHECK (("end_date" > "start_date")),
    CONSTRAINT "contracts_deposit_amount_check" CHECK (("deposit_amount" >= (0)::numeric)),
    CONSTRAINT "contracts_monthly_rent_check" CHECK (("monthly_rent" >= (0)::numeric)),
    CONSTRAINT "contracts_payment_cycle_months_check" CHECK (("payment_cycle_months" > 0))
);

ALTER TABLE ONLY "smartstay"."contracts" FORCE ROW LEVEL SECURITY;


ALTER TABLE "smartstay"."contracts" OWNER TO "postgres";

--
-- Name: contracts_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."contracts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."contracts_id_seq" OWNER TO "postgres";

--
-- Name: contracts_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."contracts_id_seq" OWNED BY "smartstay"."contracts"."id";


--
-- Name: invoice_items; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."invoice_items" (
    "id" bigint NOT NULL,
    "invoice_id" integer NOT NULL,
    "description" character varying(255) NOT NULL,
    "quantity" numeric(18,2) DEFAULT 1,
    "unit_price" numeric(18,2) NOT NULL,
    "line_total" numeric(18,2) NOT NULL,
    "meter_reading_id" bigint,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ONLY "smartstay"."invoice_items" FORCE ROW LEVEL SECURITY;


ALTER TABLE "smartstay"."invoice_items" OWNER TO "postgres";

--
-- Name: invoice_items_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."invoice_items_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."invoice_items_id_seq" OWNER TO "postgres";

--
-- Name: invoice_items_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."invoice_items_id_seq" OWNED BY "smartstay"."invoice_items"."id";


--
-- Name: invoice_utility_overrides; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."invoice_utility_overrides" (
    "id" bigint NOT NULL,
    "contract_id" integer NOT NULL,
    "invoice_id" integer,
    "billing_period" "text" NOT NULL,
    "occupants_for_billing_override" integer,
    "electric_base_override" numeric,
    "electric_final_override" numeric,
    "water_base_override" numeric,
    "water_final_override" numeric,
    "location_multiplier_override" numeric,
    "season_months_override" "jsonb",
    "electric_hot_season_multiplier_override" numeric,
    "reason" "text" NOT NULL,
    "old_values_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "new_values_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "invoice_utility_overrides_electric_base_override_check" CHECK (("electric_base_override" >= (0)::numeric)),
    CONSTRAINT "invoice_utility_overrides_electric_final_override_check" CHECK (("electric_final_override" >= (0)::numeric)),
    CONSTRAINT "invoice_utility_overrides_electric_hot_season_multiplier__check" CHECK (("electric_hot_season_multiplier_override" > (0)::numeric)),
    CONSTRAINT "invoice_utility_overrides_location_multiplier_override_check" CHECK (("location_multiplier_override" > (0)::numeric)),
    CONSTRAINT "invoice_utility_overrides_occupants_for_billing_override_check" CHECK (("occupants_for_billing_override" >= 0)),
    CONSTRAINT "invoice_utility_overrides_period_ck" CHECK (("billing_period" ~ '^\d{4}-\d{2}$'::"text")),
    CONSTRAINT "invoice_utility_overrides_season_months_ck" CHECK ((("season_months_override" IS NULL) OR ("jsonb_typeof"("season_months_override") = 'array'::"text"))),
    CONSTRAINT "invoice_utility_overrides_water_base_override_check" CHECK (("water_base_override" >= (0)::numeric)),
    CONSTRAINT "invoice_utility_overrides_water_final_override_check" CHECK (("water_final_override" >= (0)::numeric))
);

ALTER TABLE ONLY "smartstay"."invoice_utility_overrides" FORCE ROW LEVEL SECURITY;


ALTER TABLE "smartstay"."invoice_utility_overrides" OWNER TO "postgres";

--
-- Name: TABLE "invoice_utility_overrides"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON TABLE "smartstay"."invoice_utility_overrides" IS 'Override utility cho duy nhat 1 ky billing. Khong duoc dung de sua policy goc.';


--
-- Name: COLUMN "invoice_utility_overrides"."old_values_json"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON COLUMN "smartstay"."invoice_utility_overrides"."old_values_json" IS 'Snapshot gia tri resolve truoc khi admin sua.';


--
-- Name: COLUMN "invoice_utility_overrides"."new_values_json"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON COLUMN "smartstay"."invoice_utility_overrides"."new_values_json" IS 'Gia tri sau override de audit va replay.';


--
-- Name: invoice_utility_overrides_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."invoice_utility_overrides" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "smartstay"."invoice_utility_overrides_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: invoice_utility_snapshots; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."invoice_utility_snapshots" (
    "id" bigint NOT NULL,
    "invoice_id" integer NOT NULL,
    "contract_id" integer NOT NULL,
    "room_id" integer NOT NULL,
    "billing_run_id" bigint,
    "override_id" bigint,
    "resolved_policy_id" bigint,
    "billing_period" "text" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "policy_source_type" "text" NOT NULL,
    "occupants_for_billing" integer NOT NULL,
    "occupied_days" integer NOT NULL,
    "days_in_period" integer NOT NULL,
    "prorate_ratio" numeric NOT NULL,
    "electric_base_amount" numeric DEFAULT 0 NOT NULL,
    "electric_device_surcharge" numeric DEFAULT 0 NOT NULL,
    "electric_subtotal" numeric DEFAULT 0 NOT NULL,
    "electric_season_multiplier" numeric DEFAULT 1.0 NOT NULL,
    "electric_location_multiplier" numeric DEFAULT 1.0 NOT NULL,
    "electric_raw_amount" numeric DEFAULT 0 NOT NULL,
    "electric_rounded_amount" numeric DEFAULT 0 NOT NULL,
    "min_electric_floor" numeric DEFAULT 0 NOT NULL,
    "electric_final_amount" numeric DEFAULT 0 NOT NULL,
    "water_base_amount" numeric DEFAULT 0 NOT NULL,
    "water_per_person_amount" numeric DEFAULT 0 NOT NULL,
    "water_person_charge" numeric DEFAULT 0 NOT NULL,
    "water_subtotal" numeric DEFAULT 0 NOT NULL,
    "water_location_multiplier" numeric DEFAULT 1.0 NOT NULL,
    "water_raw_amount" numeric DEFAULT 0 NOT NULL,
    "water_rounded_amount" numeric DEFAULT 0 NOT NULL,
    "min_water_floor" numeric DEFAULT 0 NOT NULL,
    "water_final_amount" numeric DEFAULT 0 NOT NULL,
    "rounding_increment" numeric DEFAULT 1000 NOT NULL,
    "resolved_device_surcharges_json" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "warnings_json" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "formula_snapshot_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "invoice_utility_snapshots_billing_period_ck" CHECK (("billing_period" ~ '^\d{4}-\d{2}$'::"text")),
    CONSTRAINT "invoice_utility_snapshots_days_in_period_check" CHECK (("days_in_period" > 0)),
    CONSTRAINT "invoice_utility_snapshots_electric_base_amount_check" CHECK (("electric_base_amount" >= (0)::numeric)),
    CONSTRAINT "invoice_utility_snapshots_electric_device_surcharge_check" CHECK (("electric_device_surcharge" >= (0)::numeric)),
    CONSTRAINT "invoice_utility_snapshots_electric_final_amount_check" CHECK (("electric_final_amount" >= (0)::numeric)),
    CONSTRAINT "invoice_utility_snapshots_electric_location_multiplier_check" CHECK (("electric_location_multiplier" > (0)::numeric)),
    CONSTRAINT "invoice_utility_snapshots_electric_raw_amount_check" CHECK (("electric_raw_amount" >= (0)::numeric)),
    CONSTRAINT "invoice_utility_snapshots_electric_rounded_amount_check" CHECK (("electric_rounded_amount" >= (0)::numeric)),
    CONSTRAINT "invoice_utility_snapshots_electric_season_multiplier_check" CHECK (("electric_season_multiplier" > (0)::numeric)),
    CONSTRAINT "invoice_utility_snapshots_electric_subtotal_check" CHECK (("electric_subtotal" >= (0)::numeric)),
    CONSTRAINT "invoice_utility_snapshots_min_electric_floor_check" CHECK (("min_electric_floor" >= (0)::numeric)),
    CONSTRAINT "invoice_utility_snapshots_min_water_floor_check" CHECK (("min_water_floor" >= (0)::numeric)),
    CONSTRAINT "invoice_utility_snapshots_occupants_for_billing_check" CHECK (("occupants_for_billing" >= 0)),
    CONSTRAINT "invoice_utility_snapshots_occupied_days_check" CHECK (("occupied_days" >= 0)),
    CONSTRAINT "invoice_utility_snapshots_period_ck" CHECK (("period_end" >= "period_start")),
    CONSTRAINT "invoice_utility_snapshots_prorate_ratio_check" CHECK ((("prorate_ratio" >= (0)::numeric) AND ("prorate_ratio" <= (1)::numeric))),
    CONSTRAINT "invoice_utility_snapshots_rounding_increment_check" CHECK (("rounding_increment" > (0)::numeric)),
    CONSTRAINT "invoice_utility_snapshots_water_base_amount_check" CHECK (("water_base_amount" >= (0)::numeric)),
    CONSTRAINT "invoice_utility_snapshots_water_final_amount_check" CHECK (("water_final_amount" >= (0)::numeric)),
    CONSTRAINT "invoice_utility_snapshots_water_location_multiplier_check" CHECK (("water_location_multiplier" > (0)::numeric)),
    CONSTRAINT "invoice_utility_snapshots_water_per_person_amount_check" CHECK (("water_per_person_amount" >= (0)::numeric)),
    CONSTRAINT "invoice_utility_snapshots_water_person_charge_check" CHECK (("water_person_charge" >= (0)::numeric)),
    CONSTRAINT "invoice_utility_snapshots_water_raw_amount_check" CHECK (("water_raw_amount" >= (0)::numeric)),
    CONSTRAINT "invoice_utility_snapshots_water_rounded_amount_check" CHECK (("water_rounded_amount" >= (0)::numeric)),
    CONSTRAINT "invoice_utility_snapshots_water_subtotal_check" CHECK (("water_subtotal" >= (0)::numeric))
);

ALTER TABLE ONLY "smartstay"."invoice_utility_snapshots" FORCE ROW LEVEL SECURITY;


ALTER TABLE "smartstay"."invoice_utility_snapshots" OWNER TO "postgres";

--
-- Name: TABLE "invoice_utility_snapshots"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON TABLE "smartstay"."invoice_utility_snapshots" IS 'Immutable snapshot cong thuc utility tai thoi diem tao invoice.';


--
-- Name: COLUMN "invoice_utility_snapshots"."policy_source_type"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON COLUMN "smartstay"."invoice_utility_snapshots"."policy_source_type" IS 'Gia tri ky vong: invoice_override, contract, room, building, system.';


--
-- Name: COLUMN "invoice_utility_snapshots"."resolved_device_surcharges_json"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON COLUMN "smartstay"."invoice_utility_snapshots"."resolved_device_surcharges_json" IS 'Danh sach phu thu thiet bi da resolve, vi du [{"device_code":"aircon","charge_amount":25000}].';


--
-- Name: COLUMN "invoice_utility_snapshots"."warnings_json"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON COLUMN "smartstay"."invoice_utility_snapshots"."warnings_json" IS 'Danh sach warning business guard, vi du duoi floor truoc khi ap floor.';


--
-- Name: COLUMN "invoice_utility_snapshots"."formula_snapshot_json"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON COLUMN "smartstay"."invoice_utility_snapshots"."formula_snapshot_json" IS 'Snapshot day du cua cong thuc va input da dung de tinh utility.';


--
-- Name: invoice_utility_snapshots_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."invoice_utility_snapshots" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "smartstay"."invoice_utility_snapshots_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: invoices; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."invoices" (
    "id" integer NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_code" character varying(50) DEFAULT "smartstay"."generate_code"('INV'::"text", 'seq_invoice_code'::"text") NOT NULL,
    "contract_id" integer NOT NULL,
    "billing_period" character(7),
    "subtotal" numeric(18,2) DEFAULT 0,
    "tax_amount" numeric(18,2) DEFAULT 0,
    "total_amount" numeric(18,2) DEFAULT 0,
    "amount_paid" numeric(18,2) DEFAULT 0,
    "balance_due" numeric(18,2) GENERATED ALWAYS AS (("total_amount" - "amount_paid")) STORED,
    "due_date" "date",
    "paid_date" timestamp with time zone,
    "status" "smartstay"."invoice_status" DEFAULT 'draft'::"smartstay"."invoice_status",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chk_invoice_paid" CHECK (((("status" = 'paid'::"smartstay"."invoice_status") AND ("paid_date" IS NOT NULL)) OR ("status" <> 'paid'::"smartstay"."invoice_status")))
);

ALTER TABLE ONLY "smartstay"."invoices" FORCE ROW LEVEL SECURITY;


ALTER TABLE "smartstay"."invoices" OWNER TO "postgres";

--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."invoices_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."invoices_id_seq" OWNER TO "postgres";

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."invoices_id_seq" OWNED BY "smartstay"."invoices"."id";


--
-- Name: maintenance_logs; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."maintenance_logs" (
    "id" integer NOT NULL,
    "room_asset_id" integer NOT NULL,
    "maintenance_date" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "issue_description" "text",
    "cost" numeric(18,2),
    "performed_by" character varying(200),
    "next_maintenance_date" "date",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "maintenance_logs_cost_check" CHECK (("cost" >= (0)::numeric))
);


ALTER TABLE "smartstay"."maintenance_logs" OWNER TO "postgres";

--
-- Name: maintenance_logs_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."maintenance_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."maintenance_logs_id_seq" OWNER TO "postgres";

--
-- Name: maintenance_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."maintenance_logs_id_seq" OWNED BY "smartstay"."maintenance_logs"."id";


--
-- Name: meter_readings; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."meter_readings" (
    "id" bigint NOT NULL,
    "room_id" integer NOT NULL,
    "billing_period" character(7) NOT NULL,
    "electricity_previous" integer NOT NULL,
    "electricity_current" integer NOT NULL,
    "electricity_usage" integer GENERATED ALWAYS AS (("electricity_current" - "electricity_previous")) STORED,
    "water_previous" integer NOT NULL,
    "water_current" integer NOT NULL,
    "water_usage" integer GENERATED ALWAYS AS (("water_current" - "water_previous")) STORED,
    "previous_reading_id" bigint,
    "reading_date" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "read_by" "uuid",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chk_electricity" CHECK (("electricity_current" >= "electricity_previous")),
    CONSTRAINT "chk_water" CHECK (("water_current" >= "water_previous")),
    CONSTRAINT "meter_readings_electricity_current_check" CHECK (("electricity_current" >= 0)),
    CONSTRAINT "meter_readings_electricity_previous_check" CHECK (("electricity_previous" >= 0)),
    CONSTRAINT "meter_readings_water_current_check" CHECK (("water_current" >= 0)),
    CONSTRAINT "meter_readings_water_previous_check" CHECK (("water_previous" >= 0))
);

ALTER TABLE ONLY "smartstay"."meter_readings" FORCE ROW LEVEL SECURITY;


ALTER TABLE "smartstay"."meter_readings" OWNER TO "postgres";

--
-- Name: meter_readings_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."meter_readings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."meter_readings_id_seq" OWNER TO "postgres";

--
-- Name: meter_readings_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."meter_readings_id_seq" OWNED BY "smartstay"."meter_readings"."id";


--
-- Name: notifications; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."notifications" (
    "id" "uuid" DEFAULT "extensions"."gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" DEFAULT 'system'::"text" NOT NULL,
    "link" "text",
    "is_read" boolean DEFAULT false NOT NULL,
    "metadata" "jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "smartstay"."notifications" OWNER TO "postgres";

--
-- Name: payment_attempts; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."payment_attempts" (
    "id" bigint NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" integer NOT NULL,
    "initiated_by" "uuid",
    "method" "smartstay"."payment_attempt_method" NOT NULL,
    "amount" numeric NOT NULL,
    "status" "smartstay"."payment_status" DEFAULT 'pending'::"smartstay"."payment_status" NOT NULL,
    "idempotency_key" "text",
    "receipt_url" "text",
    "reference_number" character varying,
    "bank_name" character varying,
    "gateway_order_id" "text",
    "gateway_request_id" "text",
    "gateway_transaction_id" "text",
    "gateway_payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "notes" "text",
    "rejection_reason" "text",
    "payment_id" bigint,
    "approved_at" timestamp with time zone,
    "approved_by" "uuid",
    "rejected_at" timestamp with time zone,
    "rejected_by" "uuid",
    "cancelled_at" timestamp with time zone,
    "cancelled_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payment_attempts_amount_check" CHECK (("amount" > (0)::numeric))
);

ALTER TABLE ONLY "smartstay"."payment_attempts" FORCE ROW LEVEL SECURITY;


ALTER TABLE "smartstay"."payment_attempts" OWNER TO "postgres";

--
-- Name: TABLE "payment_attempts"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON TABLE "smartstay"."payment_attempts" IS 'Bang luu yeu cau thanh toan tu tenant hoac gateway. Khong phai so cai thu tien da xac nhan.';


--
-- Name: COLUMN "payment_attempts"."status"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON COLUMN "smartstay"."payment_attempts"."status" IS 'Trang thai xu ly cua yeu cau thanh toan.';


--
-- Name: COLUMN "payment_attempts"."idempotency_key"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON COLUMN "smartstay"."payment_attempts"."idempotency_key" IS 'Khoa chong xu ly lap cho IPN va retry request.';


--
-- Name: COLUMN "payment_attempts"."gateway_payload"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON COLUMN "smartstay"."payment_attempts"."gateway_payload" IS 'Payload gateway gan nhat lien quan den yeu cau thanh toan.';


--
-- Name: payment_attempts_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."payment_attempts" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "smartstay"."payment_attempts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: payments; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."payments" (
    "id" bigint NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_code" character varying(100) DEFAULT "smartstay"."generate_code"('PAY'::"text", 'seq_payment_code'::"text") NOT NULL,
    "invoice_id" integer NOT NULL,
    "amount" numeric(18,2) NOT NULL,
    "method" "smartstay"."payment_method" NOT NULL,
    "bank_name" character varying(100),
    "reference_number" character varying(100),
    "receipt_url" character varying(500),
    "payment_date" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "confirmed_by" "uuid",
    "confirmed_at" timestamp with time zone,
    "stripe_payment_intent_id" character varying(255),
    "stripe_charge_id" character varying(255),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "status" "smartstay"."payment_status" DEFAULT 'pending'::"smartstay"."payment_status" NOT NULL,
    "confirmation_source" "text",
    "applied_at" timestamp with time zone,
    "applied_by" "uuid",
    "payment_attempt_id" bigint,
    CONSTRAINT "payments_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "payments_confirmation_source_check" CHECK ((("confirmation_source" IS NULL) OR ("confirmation_source" = ANY (ARRAY['momo_ipn'::"text", 'admin_manual'::"text", 'cash'::"text", 'bank_reconciliation'::"text", 'sepay_webhook'::"text"])))),
    CONSTRAINT "payments_status_confirmed_check" CHECK ((("status" <> 'succeeded'::"smartstay"."payment_status") OR ("confirmed_at" IS NOT NULL)))
);

ALTER TABLE ONLY "smartstay"."payments" FORCE ROW LEVEL SECURITY;


ALTER TABLE "smartstay"."payments" OWNER TO "postgres";

--
-- Name: COLUMN "payments"."status"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON COLUMN "smartstay"."payments"."status" IS 'Trang thai dong tien da ghi nhan. Tuong thich nguoc voi du lieu cu.';


--
-- Name: COLUMN "payments"."confirmation_source"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON COLUMN "smartstay"."payments"."confirmation_source" IS 'Nguon xac nhan thanh toan: momo_ipn, admin_thu_cong, tien_mat, doi_soat_ngan_hang, sepay_webhook.';


--
-- Name: COLUMN "payments"."applied_at"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON COLUMN "smartstay"."payments"."applied_at" IS 'Thoi diem dong tien da duoc cong vao invoice va balance. Dung de chong double-apply.';


--
-- Name: COLUMN "payments"."payment_attempt_id"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON COLUMN "smartstay"."payments"."payment_attempt_id" IS 'Lien ket nguoc ve payment_attempt da sinh ra payment confirmed nay.';


--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."payments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."payments_id_seq" OWNER TO "postgres";

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."payments_id_seq" OWNED BY "smartstay"."payments"."id";


--
-- Name: permissions; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying(100) NOT NULL,
    "name" character varying(255) NOT NULL,
    "group_name" character varying(100),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "smartstay"."permissions" OWNER TO "postgres";

--
-- Name: system_settings; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."system_settings" (
    "key" character varying(100) NOT NULL,
    "value" "jsonb" NOT NULL,
    "description" character varying(500),
    "group_name" character varying(50) DEFAULT 'general'::character varying,
    "is_sensitive" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ONLY "smartstay"."system_settings" FORCE ROW LEVEL SECURITY;


ALTER TABLE "smartstay"."system_settings" OWNER TO "postgres";

--
-- Name: portal_payment_settings; Type: VIEW; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE VIEW "smartstay"."portal_payment_settings" AS
 SELECT "key",
    "value"
   FROM "smartstay"."system_settings"
  WHERE ((("key")::"text" = 'payment.bank_transfer_details'::"text") AND (COALESCE("is_sensitive", false) = false));


ALTER VIEW "smartstay"."portal_payment_settings" OWNER TO "postgres";

--
-- Name: profiles; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" character varying(150) NOT NULL,
    "phone" character varying(30),
    "avatar_url" character varying(500),
    "role" "smartstay"."user_role" DEFAULT 'tenant'::"smartstay"."user_role" NOT NULL,
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "tenant_stage" "text" DEFAULT 'prospect'::"text" NOT NULL,
    "identity_number" character varying(20),
    "date_of_birth" "date",
    "gender" "smartstay"."gender_type",
    "address" "text",
    "role_id" "uuid",
    CONSTRAINT "profiles_tenant_stage_check" CHECK (("tenant_stage" = ANY (ARRAY['prospect'::"text", 'applicant'::"text", 'resident_pending_onboarding'::"text", 'resident_active'::"text"])))
);

ALTER TABLE ONLY "smartstay"."profiles" FORCE ROW LEVEL SECURITY;


ALTER TABLE "smartstay"."profiles" OWNER TO "postgres";

--
-- Name: public_profiles; Type: VIEW; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE VIEW "smartstay"."public_profiles" AS
 SELECT "id",
    "full_name",
    "avatar_url"
   FROM "smartstay"."profiles";


ALTER VIEW "smartstay"."public_profiles" OWNER TO "postgres";

--
-- Name: rooms; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."rooms" (
    "id" integer NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "building_id" integer NOT NULL,
    "room_code" character varying(50) NOT NULL,
    "floor_number" integer,
    "area_sqm" numeric(10,2),
    "room_type" character varying(50),
    "max_occupants" integer,
    "has_balcony" boolean DEFAULT false,
    "has_private_bathroom" boolean DEFAULT false,
    "facing" character varying(50),
    "amenities" "jsonb" DEFAULT '{}'::"jsonb",
    "base_rent" numeric(18,2),
    "condition_score" integer,
    "noise_level" integer,
    "last_inspection" "date",
    "status" "smartstay"."room_status" DEFAULT 'available'::"smartstay"."room_status",
    "is_deleted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rooms_area_sqm_check" CHECK (("area_sqm" > (0)::numeric)),
    CONSTRAINT "rooms_base_rent_check" CHECK (("base_rent" >= (0)::numeric)),
    CONSTRAINT "rooms_condition_score_check" CHECK ((("condition_score" >= 1) AND ("condition_score" <= 10))),
    CONSTRAINT "rooms_max_occupants_check" CHECK (("max_occupants" > 0)),
    CONSTRAINT "rooms_noise_level_check" CHECK ((("noise_level" >= 1) AND ("noise_level" <= 5)))
);


ALTER TABLE "smartstay"."rooms" OWNER TO "postgres";

--
-- Name: public_room_listings; Type: VIEW; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE VIEW "smartstay"."public_room_listings" AS
 SELECT "r"."id" AS "room_id",
    "r"."uuid" AS "room_uuid",
    "r"."room_code",
    "r"."room_type",
    "r"."area_sqm",
    "r"."base_rent",
    "r"."max_occupants",
    "r"."floor_number",
    "r"."has_balcony",
    "r"."has_private_bathroom",
    "r"."facing",
    "r"."condition_score",
        CASE
            WHEN ("jsonb_typeof"("r"."amenities") = 'array'::"text") THEN "r"."amenities"
            ELSE '[]'::"jsonb"
        END AS "room_amenities",
    "b"."id" AS "building_id",
    "b"."uuid" AS "building_uuid",
    "b"."name" AS "building_name",
    "b"."address" AS "building_address",
    "b"."description" AS "building_description",
        CASE
            WHEN ("jsonb_typeof"("b"."amenities") = 'array'::"text") THEN "b"."amenities"
            ELSE '[]'::"jsonb"
        END AS "building_amenities",
    'available_now'::"text" AS "availability_status"
   FROM ("smartstay"."rooms" "r"
     JOIN "smartstay"."buildings" "b" ON (("b"."id" = "r"."building_id")))
  WHERE (("r"."status" = 'available'::"smartstay"."room_status") AND (COALESCE("r"."is_deleted", false) = false) AND (COALESCE("b"."is_deleted", false) = false));


ALTER VIEW "smartstay"."public_room_listings" OWNER TO "postgres";

--
-- Name: rental_applications; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."rental_applications" (
    "id" bigint NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "room_id" bigint NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "verification_method" "text",
    "verification_payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "notes" "text",
    "submitted_at" timestamp with time zone,
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "rental_applications_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'submitted'::"text", 'under_review'::"text", 'approved'::"text", 'rejected'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "rental_applications_verification_method_check" CHECK ((("verification_method" IS NULL) OR ("verification_method" = ANY (ARRAY['id'::"text", 'phone'::"text", 'email'::"text"]))))
);


ALTER TABLE "smartstay"."rental_applications" OWNER TO "postgres";

--
-- Name: rental_applications_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."rental_applications" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "smartstay"."rental_applications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: role_permissions; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."role_permissions" (
    "role_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL
);


ALTER TABLE "smartstay"."role_permissions" OWNER TO "postgres";

--
-- Name: roles; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "is_system" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "smartstay"."roles" OWNER TO "postgres";

--
-- Name: room_assets; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."room_assets" (
    "id" integer NOT NULL,
    "room_id" integer NOT NULL,
    "asset_id" integer NOT NULL,
    "serial_number" character varying(100),
    "quantity" integer DEFAULT 1,
    "status" "smartstay"."asset_status" DEFAULT 'in_use'::"smartstay"."asset_status",
    "condition_score" integer,
    "purchase_date" "date",
    "warranty_expiry" "date",
    "last_maintenance" "date",
    "maintenance_interval_months" integer,
    "location_notes" character varying(500),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "room_assets_condition_score_check" CHECK ((("condition_score" >= 1) AND ("condition_score" <= 10))),
    CONSTRAINT "room_assets_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "smartstay"."room_assets" OWNER TO "postgres";

--
-- Name: room_assets_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."room_assets_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."room_assets_id_seq" OWNER TO "postgres";

--
-- Name: room_assets_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."room_assets_id_seq" OWNED BY "smartstay"."room_assets"."id";


--
-- Name: room_images; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."room_images" (
    "id" bigint NOT NULL,
    "room_id" bigint NOT NULL,
    "url" "text" NOT NULL,
    "is_main" boolean DEFAULT false NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "smartstay"."room_images" FORCE ROW LEVEL SECURITY;


ALTER TABLE "smartstay"."room_images" OWNER TO "postgres";

--
-- Name: room_images_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."room_images" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "smartstay"."room_images_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: room_status_history; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."room_status_history" (
    "id" bigint NOT NULL,
    "room_id" integer NOT NULL,
    "previous_status" "smartstay"."room_status" NOT NULL,
    "new_status" "smartstay"."room_status" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "changed_by" "uuid",
    "reason" character varying(500),
    "notes" "text",
    "days_in_status" integer,
    "is_automated" boolean DEFAULT false
);


ALTER TABLE "smartstay"."room_status_history" OWNER TO "postgres";

--
-- Name: room_status_history_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."room_status_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."room_status_history_id_seq" OWNER TO "postgres";

--
-- Name: room_status_history_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."room_status_history_id_seq" OWNED BY "smartstay"."room_status_history"."id";


--
-- Name: rooms_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."rooms_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."rooms_id_seq" OWNER TO "postgres";

--
-- Name: rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."rooms_id_seq" OWNED BY "smartstay"."rooms"."id";


--
-- Name: seq_contract_code; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."seq_contract_code"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."seq_contract_code" OWNER TO "postgres";

--
-- Name: seq_invoice_code; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."seq_invoice_code"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."seq_invoice_code" OWNER TO "postgres";

--
-- Name: seq_payment_code; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."seq_payment_code"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."seq_payment_code" OWNER TO "postgres";

--
-- Name: seq_ticket_code; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."seq_ticket_code"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."seq_ticket_code" OWNER TO "postgres";

--
-- Name: service_prices; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."service_prices" (
    "id" integer NOT NULL,
    "service_id" integer NOT NULL,
    "unit_price" numeric(18,2) NOT NULL,
    "effective_from" "date" NOT NULL,
    "effective_to" "date",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chk_price_dates" CHECK ((("effective_to" IS NULL) OR ("effective_to" > "effective_from"))),
    CONSTRAINT "service_prices_unit_price_check" CHECK (("unit_price" >= (0)::numeric))
);


ALTER TABLE "smartstay"."service_prices" OWNER TO "postgres";

--
-- Name: service_prices_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."service_prices_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."service_prices_id_seq" OWNER TO "postgres";

--
-- Name: service_prices_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."service_prices_id_seq" OWNED BY "smartstay"."service_prices"."id";


--
-- Name: services; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."services" (
    "id" integer NOT NULL,
    "name" character varying(150) NOT NULL,
    "calc_type" "smartstay"."service_calc_type" NOT NULL,
    "is_active" boolean DEFAULT true,
    "is_deleted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "smartstay"."services" OWNER TO "postgres";

--
-- Name: services_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."services_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."services_id_seq" OWNER TO "postgres";

--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."services_id_seq" OWNED BY "smartstay"."services"."id";


--
-- Name: tenant_balances; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."tenant_balances" (
    "id" integer NOT NULL,
    "tenant_id" integer NOT NULL,
    "balance" numeric(18,2) DEFAULT 0,
    "last_updated" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ONLY "smartstay"."tenant_balances" FORCE ROW LEVEL SECURITY;


ALTER TABLE "smartstay"."tenant_balances" OWNER TO "postgres";

--
-- Name: tenant_balances_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."tenant_balances_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."tenant_balances_id_seq" OWNER TO "postgres";

--
-- Name: tenant_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."tenant_balances_id_seq" OWNED BY "smartstay"."tenant_balances"."id";


--
-- Name: tenants; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."tenants" (
    "id" integer NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid",
    "full_name" character varying(150) NOT NULL,
    "id_number" character varying(20) NOT NULL,
    "date_of_birth" "date",
    "gender" "smartstay"."gender_type",
    "phone" character varying(30),
    "email" character varying(150),
    "permanent_address" character varying(255),
    "emergency_contact_name" character varying(150),
    "emergency_contact_phone" character varying(30),
    "documents" "jsonb" DEFAULT '[]'::"jsonb",
    "is_deleted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "search_vector" "tsvector" GENERATED ALWAYS AS (((("setweight"("to_tsvector"('"simple"'::"regconfig", (COALESCE("full_name", ''::character varying))::"text"), 'A'::"char") || "setweight"("to_tsvector"('"simple"'::"regconfig", (COALESCE("id_number", ''::character varying))::"text"), 'A'::"char")) || "setweight"("to_tsvector"('"simple"'::"regconfig", (COALESCE("phone", ''::character varying))::"text"), 'B'::"char")) || "setweight"("to_tsvector"('"simple"'::"regconfig", (COALESCE("email", ''::character varying))::"text"), 'B'::"char"))) STORED
);

ALTER TABLE ONLY "smartstay"."tenants" FORCE ROW LEVEL SECURITY;


ALTER TABLE "smartstay"."tenants" OWNER TO "postgres";

--
-- Name: tenants_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."tenants_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."tenants_id_seq" OWNER TO "postgres";

--
-- Name: tenants_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."tenants_id_seq" OWNED BY "smartstay"."tenants"."id";


--
-- Name: ticket_comments; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."ticket_comments" (
    "id" bigint NOT NULL,
    "ticket_id" integer NOT NULL,
    "author_id" "uuid",
    "content" "text" NOT NULL,
    "is_internal" boolean DEFAULT false,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "smartstay"."ticket_comments" OWNER TO "postgres";

--
-- Name: ticket_comments_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."ticket_comments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."ticket_comments_id_seq" OWNER TO "postgres";

--
-- Name: ticket_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."ticket_comments_id_seq" OWNED BY "smartstay"."ticket_comments"."id";


--
-- Name: tickets; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."tickets" (
    "id" integer NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_code" character varying(50) DEFAULT "smartstay"."generate_code"('TKT'::"text", 'seq_ticket_code'::"text") NOT NULL,
    "tenant_id" integer,
    "room_id" integer,
    "room_asset_id" integer,
    "subject" character varying(255) NOT NULL,
    "description" "text",
    "category" character varying(100),
    "priority" "smartstay"."priority_type" DEFAULT 'normal'::"smartstay"."priority_type",
    "status" "smartstay"."ticket_status" DEFAULT 'new'::"smartstay"."ticket_status",
    "assigned_to" "uuid",
    "resolved_at" timestamp with time zone,
    "resolution_notes" "text",
    "resolution_cost" numeric(18,2),
    "satisfaction_rating" integer,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tickets_satisfaction_rating_check" CHECK ((("satisfaction_rating" >= 1) AND ("satisfaction_rating" <= 5)))
);


ALTER TABLE "smartstay"."tickets" OWNER TO "postgres";

--
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."tickets_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."tickets_id_seq" OWNER TO "postgres";

--
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."tickets_id_seq" OWNED BY "smartstay"."tickets"."id";


--
-- Name: utility_policies; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."utility_policies" (
    "id" bigint NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "scope_type" "smartstay"."utility_policy_scope" NOT NULL,
    "scope_id" bigint,
    "is_active" boolean DEFAULT true NOT NULL,
    "description" "text",
    "electric_base_amount" numeric DEFAULT 0 NOT NULL,
    "water_base_amount" numeric DEFAULT 0 NOT NULL,
    "water_per_person_amount" numeric DEFAULT 0 NOT NULL,
    "electric_hot_season_multiplier" numeric DEFAULT 1.15 NOT NULL,
    "location_multiplier" numeric DEFAULT 1.0 NOT NULL,
    "season_months" "jsonb" DEFAULT '["04", "05", "06", "07", "08", "09"]'::"jsonb" NOT NULL,
    "rounding_increment" numeric DEFAULT 1000 NOT NULL,
    "min_electric_floor" numeric DEFAULT 120000 NOT NULL,
    "min_water_floor" numeric DEFAULT 60000 NOT NULL,
    "effective_from" "date" DEFAULT CURRENT_DATE NOT NULL,
    "effective_to" "date",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "utility_policies_effective_range_ck" CHECK ((("effective_to" IS NULL) OR ("effective_to" >= "effective_from"))),
    CONSTRAINT "utility_policies_electric_base_amount_check" CHECK (("electric_base_amount" >= (0)::numeric)),
    CONSTRAINT "utility_policies_electric_hot_season_multiplier_check" CHECK (("electric_hot_season_multiplier" > (0)::numeric)),
    CONSTRAINT "utility_policies_location_multiplier_check" CHECK (("location_multiplier" > (0)::numeric)),
    CONSTRAINT "utility_policies_min_electric_floor_check" CHECK (("min_electric_floor" >= (0)::numeric)),
    CONSTRAINT "utility_policies_min_water_floor_check" CHECK (("min_water_floor" >= (0)::numeric)),
    CONSTRAINT "utility_policies_rounding_increment_check" CHECK (("rounding_increment" > (0)::numeric)),
    CONSTRAINT "utility_policies_scope_ck" CHECK (((("scope_type" = 'system'::"smartstay"."utility_policy_scope") AND ("scope_id" IS NULL)) OR (("scope_type" <> 'system'::"smartstay"."utility_policy_scope") AND ("scope_id" IS NOT NULL)))),
    CONSTRAINT "utility_policies_season_months_ck" CHECK (("jsonb_typeof"("season_months") = 'array'::"text")),
    CONSTRAINT "utility_policies_water_base_amount_check" CHECK (("water_base_amount" >= (0)::numeric)),
    CONSTRAINT "utility_policies_water_per_person_amount_check" CHECK (("water_per_person_amount" >= (0)::numeric))
);

ALTER TABLE ONLY "smartstay"."utility_policies" FORCE ROW LEVEL SECURITY;


ALTER TABLE "smartstay"."utility_policies" OWNER TO "postgres";

--
-- Name: TABLE "utility_policies"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON TABLE "smartstay"."utility_policies" IS 'Policy utility billing theo scope system/building/room/contract cho mo hinh khong cong to.';


--
-- Name: COLUMN "utility_policies"."scope_type"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON COLUMN "smartstay"."utility_policies"."scope_type" IS 'Thu tu resolve duoc ap o service layer: invoice-period override -> contract -> room -> building -> system.';


--
-- Name: COLUMN "utility_policies"."season_months"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON COLUMN "smartstay"."utility_policies"."season_months" IS 'Danh sach thang nong dang string MM. Neu thang billing nam trong danh sach nay thi ap electric_hot_season_multiplier, nguoc lai mac dinh multiplier = 1.0.';


--
-- Name: COLUMN "utility_policies"."rounding_increment"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON COLUMN "smartstay"."utility_policies"."rounding_increment" IS 'Muc lam tron canonical cho utility. Ban dau la 1000 VND.';


--
-- Name: utility_policies_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."utility_policies" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "smartstay"."utility_policies_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: utility_policy_device_adjustments; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."utility_policy_device_adjustments" (
    "id" bigint NOT NULL,
    "utility_policy_id" bigint NOT NULL,
    "device_code" "text" NOT NULL,
    "charge_amount" numeric DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "utility_policy_device_adjustments_charge_amount_check" CHECK (("charge_amount" >= (0)::numeric))
);

ALTER TABLE ONLY "smartstay"."utility_policy_device_adjustments" FORCE ROW LEVEL SECURITY;


ALTER TABLE "smartstay"."utility_policy_device_adjustments" OWNER TO "postgres";

--
-- Name: TABLE "utility_policy_device_adjustments"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON TABLE "smartstay"."utility_policy_device_adjustments" IS 'Phu thu thiet bi cho tien dien. Device inventory cua phong se duoc resolve o lop nghiep vu tu metadata phong hien co.';


--
-- Name: COLUMN "utility_policy_device_adjustments"."device_code"; Type: COMMENT; Schema: smartstay; Owner: postgres
--

COMMENT ON COLUMN "smartstay"."utility_policy_device_adjustments"."device_code" IS 'Vi du: aircon, electric_stove, water_heater, dryer, freezer.';


--
-- Name: utility_policy_device_adjustments_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."utility_policy_device_adjustments" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "smartstay"."utility_policy_device_adjustments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: vw_room_assets_warranty; Type: VIEW; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE VIEW "smartstay"."vw_room_assets_warranty" AS
 SELECT "id",
    "room_id",
    "asset_id",
    "serial_number",
    "quantity",
    "status",
    "condition_score",
    "purchase_date",
    "warranty_expiry",
    "last_maintenance",
    "maintenance_interval_months",
    "location_notes",
    "created_at",
    "updated_at",
        CASE
            WHEN (("warranty_expiry" IS NOT NULL) AND ("warranty_expiry" >= CURRENT_DATE)) THEN true
            ELSE false
        END AS "is_under_warranty"
   FROM "smartstay"."room_assets";


ALTER VIEW "smartstay"."vw_room_assets_warranty" OWNER TO "postgres";

--
-- Name: webhook_logs; Type: TABLE; Schema: smartstay; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "smartstay"."webhook_logs" (
    "id" bigint NOT NULL,
    "provider" character varying(50) NOT NULL,
    "payload" "jsonb" NOT NULL,
    "received_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "processed_at" timestamp with time zone,
    "status" "smartstay"."webhook_status" DEFAULT 'received'::"smartstay"."webhook_status",
    "retry_count" integer DEFAULT 0,
    "error_message" character varying(500),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ONLY "smartstay"."webhook_logs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "smartstay"."webhook_logs" OWNER TO "postgres";

--
-- Name: webhook_logs_id_seq; Type: SEQUENCE; Schema: smartstay; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "smartstay"."webhook_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "smartstay"."webhook_logs_id_seq" OWNER TO "postgres";

--
-- Name: webhook_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: smartstay; Owner: postgres
--

ALTER SEQUENCE "smartstay"."webhook_logs_id_seq" OWNED BY "smartstay"."webhook_logs"."id";


--
-- Name: assets id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."assets" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."assets_id_seq"'::"regclass");


--
-- Name: audit_logs id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."audit_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."audit_logs_id_seq"'::"regclass");


--
-- Name: balance_history id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."balance_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."balance_history_id_seq"'::"regclass");


--
-- Name: buildings id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."buildings" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."buildings_id_seq"'::"regclass");


--
-- Name: contract_renewals id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contract_renewals" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."contract_renewals_id_seq"'::"regclass");


--
-- Name: contract_services id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contract_services" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."contract_services_id_seq"'::"regclass");


--
-- Name: contract_tenants id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contract_tenants" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."contract_tenants_id_seq"'::"regclass");


--
-- Name: contract_terminations id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contract_terminations" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."contract_terminations_id_seq"'::"regclass");


--
-- Name: contracts id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contracts" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."contracts_id_seq"'::"regclass");


--
-- Name: invoice_items id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoice_items" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."invoice_items_id_seq"'::"regclass");


--
-- Name: invoices id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoices" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."invoices_id_seq"'::"regclass");


--
-- Name: maintenance_logs id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."maintenance_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."maintenance_logs_id_seq"'::"regclass");


--
-- Name: meter_readings id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."meter_readings" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."meter_readings_id_seq"'::"regclass");


--
-- Name: payments id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."payments" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."payments_id_seq"'::"regclass");


--
-- Name: room_assets id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."room_assets" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."room_assets_id_seq"'::"regclass");


--
-- Name: room_status_history id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."room_status_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."room_status_history_id_seq"'::"regclass");


--
-- Name: rooms id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."rooms" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."rooms_id_seq"'::"regclass");


--
-- Name: service_prices id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."service_prices" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."service_prices_id_seq"'::"regclass");


--
-- Name: services id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."services" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."services_id_seq"'::"regclass");


--
-- Name: tenant_balances id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."tenant_balances" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."tenant_balances_id_seq"'::"regclass");


--
-- Name: tenants id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."tenants" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."tenants_id_seq"'::"regclass");


--
-- Name: ticket_comments id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."ticket_comments" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."ticket_comments_id_seq"'::"regclass");


--
-- Name: tickets id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."tickets" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."tickets_id_seq"'::"regclass");


--
-- Name: webhook_logs id; Type: DEFAULT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."webhook_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"smartstay"."webhook_logs_id_seq"'::"regclass");


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."assets"
    ADD CONSTRAINT "assets_pkey" PRIMARY KEY ("id");


--
-- Name: assets assets_qr_code_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."assets"
    ADD CONSTRAINT "assets_qr_code_key" UNIQUE ("qr_code");


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");


--
-- Name: balance_history balance_history_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."balance_history"
    ADD CONSTRAINT "balance_history_pkey" PRIMARY KEY ("id");


--
-- Name: billing_runs billing_runs_billing_period_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."billing_runs"
    ADD CONSTRAINT "billing_runs_billing_period_key" UNIQUE ("billing_period");


--
-- Name: billing_runs billing_runs_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."billing_runs"
    ADD CONSTRAINT "billing_runs_pkey" PRIMARY KEY ("id");


--
-- Name: building_images building_images_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."building_images"
    ADD CONSTRAINT "building_images_pkey" PRIMARY KEY ("id");


--
-- Name: buildings buildings_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."buildings"
    ADD CONSTRAINT "buildings_pkey" PRIMARY KEY ("id");


--
-- Name: buildings buildings_uuid_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."buildings"
    ADD CONSTRAINT "buildings_uuid_key" UNIQUE ("uuid");


--
-- Name: contract_renewals contract_renewals_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contract_renewals"
    ADD CONSTRAINT "contract_renewals_pkey" PRIMARY KEY ("id");


--
-- Name: contract_services contract_services_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contract_services"
    ADD CONSTRAINT "contract_services_pkey" PRIMARY KEY ("id");


--
-- Name: contract_tenants contract_tenants_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contract_tenants"
    ADD CONSTRAINT "contract_tenants_pkey" PRIMARY KEY ("id");


--
-- Name: contract_terminations contract_terminations_contract_id_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contract_terminations"
    ADD CONSTRAINT "contract_terminations_contract_id_key" UNIQUE ("contract_id");


--
-- Name: contract_terminations contract_terminations_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contract_terminations"
    ADD CONSTRAINT "contract_terminations_pkey" PRIMARY KEY ("id");


--
-- Name: contracts contracts_contract_code_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contracts"
    ADD CONSTRAINT "contracts_contract_code_key" UNIQUE ("contract_code");


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contracts"
    ADD CONSTRAINT "contracts_pkey" PRIMARY KEY ("id");


--
-- Name: contracts contracts_uuid_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contracts"
    ADD CONSTRAINT "contracts_uuid_key" UNIQUE ("uuid");


--
-- Name: contracts excl_room_contract; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contracts"
    ADD CONSTRAINT "excl_room_contract" EXCLUDE USING "gist" ("room_id" WITH =, "daterange"("start_date", "end_date", '[]'::"text") WITH &&) WHERE ((("status" = ANY (ARRAY['active'::"smartstay"."contract_status", 'pending_signature'::"smartstay"."contract_status"])) AND ("is_deleted" = false)));


--
-- Name: service_prices excl_service_price; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."service_prices"
    ADD CONSTRAINT "excl_service_price" EXCLUDE USING "gist" ("service_id" WITH =, "daterange"("effective_from", COALESCE("effective_to", '9999-12-31'::"date"), '[]'::"text") WITH &&) WHERE (("is_active" = true));


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoice_items"
    ADD CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id");


--
-- Name: invoice_utility_overrides invoice_utility_overrides_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoice_utility_overrides"
    ADD CONSTRAINT "invoice_utility_overrides_key" UNIQUE ("contract_id", "billing_period");


--
-- Name: invoice_utility_overrides invoice_utility_overrides_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoice_utility_overrides"
    ADD CONSTRAINT "invoice_utility_overrides_pkey" PRIMARY KEY ("id");


--
-- Name: invoice_utility_snapshots invoice_utility_snapshots_invoice_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoice_utility_snapshots"
    ADD CONSTRAINT "invoice_utility_snapshots_invoice_key" UNIQUE ("invoice_id");


--
-- Name: invoice_utility_snapshots invoice_utility_snapshots_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoice_utility_snapshots"
    ADD CONSTRAINT "invoice_utility_snapshots_pkey" PRIMARY KEY ("id");


--
-- Name: invoices invoices_invoice_code_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoices"
    ADD CONSTRAINT "invoices_invoice_code_key" UNIQUE ("invoice_code");


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");


--
-- Name: invoices invoices_uuid_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoices"
    ADD CONSTRAINT "invoices_uuid_key" UNIQUE ("uuid");


--
-- Name: maintenance_logs maintenance_logs_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."maintenance_logs"
    ADD CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id");


--
-- Name: meter_readings meter_readings_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."meter_readings"
    ADD CONSTRAINT "meter_readings_pkey" PRIMARY KEY ("id");


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");


--
-- Name: payment_attempts payment_attempts_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."payment_attempts"
    ADD CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id");


--
-- Name: payment_attempts payment_attempts_uuid_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."payment_attempts"
    ADD CONSTRAINT "payment_attempts_uuid_key" UNIQUE ("uuid");


--
-- Name: payments payments_payment_code_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."payments"
    ADD CONSTRAINT "payments_payment_code_key" UNIQUE ("payment_code");


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");


--
-- Name: payments payments_uuid_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."payments"
    ADD CONSTRAINT "payments_uuid_key" UNIQUE ("uuid");


--
-- Name: permissions permissions_code_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."permissions"
    ADD CONSTRAINT "permissions_code_key" UNIQUE ("code");


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");


--
-- Name: rental_applications rental_applications_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."rental_applications"
    ADD CONSTRAINT "rental_applications_pkey" PRIMARY KEY ("id");


--
-- Name: rental_applications rental_applications_uuid_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."rental_applications"
    ADD CONSTRAINT "rental_applications_uuid_key" UNIQUE ("uuid");


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id");


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");


--
-- Name: room_assets room_assets_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."room_assets"
    ADD CONSTRAINT "room_assets_pkey" PRIMARY KEY ("id");


--
-- Name: room_images room_images_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."room_images"
    ADD CONSTRAINT "room_images_pkey" PRIMARY KEY ("id");


--
-- Name: room_status_history room_status_history_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."room_status_history"
    ADD CONSTRAINT "room_status_history_pkey" PRIMARY KEY ("id");


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."rooms"
    ADD CONSTRAINT "rooms_pkey" PRIMARY KEY ("id");


--
-- Name: rooms rooms_uuid_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."rooms"
    ADD CONSTRAINT "rooms_uuid_key" UNIQUE ("uuid");


--
-- Name: service_prices service_prices_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."service_prices"
    ADD CONSTRAINT "service_prices_pkey" PRIMARY KEY ("id");


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key");


--
-- Name: tenant_balances tenant_balances_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."tenant_balances"
    ADD CONSTRAINT "tenant_balances_pkey" PRIMARY KEY ("id");


--
-- Name: tenant_balances tenant_balances_tenant_id_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."tenant_balances"
    ADD CONSTRAINT "tenant_balances_tenant_id_key" UNIQUE ("tenant_id");


--
-- Name: tenants tenants_id_number_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."tenants"
    ADD CONSTRAINT "tenants_id_number_key" UNIQUE ("id_number");


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");


--
-- Name: tenants tenants_uuid_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."tenants"
    ADD CONSTRAINT "tenants_uuid_key" UNIQUE ("uuid");


--
-- Name: ticket_comments ticket_comments_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."ticket_comments"
    ADD CONSTRAINT "ticket_comments_pkey" PRIMARY KEY ("id");


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."tickets"
    ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("id");


--
-- Name: tickets tickets_ticket_code_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."tickets"
    ADD CONSTRAINT "tickets_ticket_code_key" UNIQUE ("ticket_code");


--
-- Name: tickets tickets_uuid_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."tickets"
    ADD CONSTRAINT "tickets_uuid_key" UNIQUE ("uuid");


--
-- Name: contract_services uq_contract_service; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contract_services"
    ADD CONSTRAINT "uq_contract_service" UNIQUE ("contract_id", "service_id");


--
-- Name: contract_tenants uq_contract_tenant; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contract_tenants"
    ADD CONSTRAINT "uq_contract_tenant" UNIQUE ("contract_id", "tenant_id");


--
-- Name: rooms uq_room_building_code; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."rooms"
    ADD CONSTRAINT "uq_room_building_code" UNIQUE ("building_id", "room_code");


--
-- Name: meter_readings uq_room_period; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."meter_readings"
    ADD CONSTRAINT "uq_room_period" UNIQUE ("room_id", "billing_period");


--
-- Name: utility_policies utility_policies_code_key; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."utility_policies"
    ADD CONSTRAINT "utility_policies_code_key" UNIQUE ("code");


--
-- Name: utility_policies utility_policies_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."utility_policies"
    ADD CONSTRAINT "utility_policies_pkey" PRIMARY KEY ("id");


--
-- Name: utility_policy_device_adjustments utility_policy_device_adjustments_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."utility_policy_device_adjustments"
    ADD CONSTRAINT "utility_policy_device_adjustments_pkey" PRIMARY KEY ("id");


--
-- Name: utility_policy_device_adjustments utility_policy_device_adjustments_unique_device; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."utility_policy_device_adjustments"
    ADD CONSTRAINT "utility_policy_device_adjustments_unique_device" UNIQUE ("utility_policy_id", "device_code");


--
-- Name: webhook_logs webhook_logs_pkey; Type: CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id");


--
-- Name: billing_runs_status_idx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "billing_runs_status_idx" ON "smartstay"."billing_runs" USING "btree" ("status", "created_at" DESC);


--
-- Name: building_images_main_idx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE UNIQUE INDEX "building_images_main_idx" ON "smartstay"."building_images" USING "btree" ("building_id") WHERE ("is_main" = true);


--
-- Name: idx_assets_category; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_assets_category" ON "smartstay"."assets" USING "btree" ("category");


--
-- Name: idx_assets_qr; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_assets_qr" ON "smartstay"."assets" USING "btree" ("qr_code") WHERE ("qr_code" IS NOT NULL);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_audit_logs_action" ON "smartstay"."audit_logs" USING "btree" ("action");


--
-- Name: idx_audit_logs_date; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_audit_logs_date" ON "smartstay"."audit_logs" USING "btree" ("created_at" DESC);


--
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_audit_logs_entity" ON "smartstay"."audit_logs" USING "btree" ("entity_type", "entity_id");


--
-- Name: idx_audit_logs_user; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_audit_logs_user" ON "smartstay"."audit_logs" USING "btree" ("user_id");


--
-- Name: idx_balance_history_date; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_balance_history_date" ON "smartstay"."balance_history" USING "btree" ("created_at" DESC);


--
-- Name: idx_balance_history_tenant; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_balance_history_tenant" ON "smartstay"."balance_history" USING "btree" ("tenant_id");


--
-- Name: idx_buildings_active; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_buildings_active" ON "smartstay"."buildings" USING "btree" ("is_deleted") WHERE ("is_deleted" = false);


--
-- Name: idx_buildings_location; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_buildings_location" ON "smartstay"."buildings" USING "btree" ("latitude", "longitude") WHERE (("latitude" IS NOT NULL) AND ("longitude" IS NOT NULL));


--
-- Name: idx_buildings_owner; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_buildings_owner" ON "smartstay"."buildings" USING "btree" ("owner_id");


--
-- Name: idx_buildings_search; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_buildings_search" ON "smartstay"."buildings" USING "gin" ("search_vector");


--
-- Name: idx_contract_primary_tenant; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE UNIQUE INDEX "idx_contract_primary_tenant" ON "smartstay"."contract_tenants" USING "btree" ("contract_id") WHERE ("is_primary" = true);


--
-- Name: idx_contract_services_contract; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_contract_services_contract" ON "smartstay"."contract_services" USING "btree" ("contract_id");


--
-- Name: idx_contract_tenants_contract; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_contract_tenants_contract" ON "smartstay"."contract_tenants" USING "btree" ("contract_id");


--
-- Name: idx_contract_tenants_tenant; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_contract_tenants_tenant" ON "smartstay"."contract_tenants" USING "btree" ("tenant_id");


--
-- Name: idx_contracts_active; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_contracts_active" ON "smartstay"."contracts" USING "btree" ("room_id", "status") WHERE (("status" = 'active'::"smartstay"."contract_status") AND ("is_deleted" = false));


--
-- Name: idx_contracts_dates; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_contracts_dates" ON "smartstay"."contracts" USING "btree" ("start_date", "end_date");


--
-- Name: idx_contracts_room; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_contracts_room" ON "smartstay"."contracts" USING "btree" ("room_id");


--
-- Name: idx_contracts_status; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_contracts_status" ON "smartstay"."contracts" USING "btree" ("status");


--
-- Name: idx_invoice_items_invoice; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_invoice_items_invoice" ON "smartstay"."invoice_items" USING "btree" ("invoice_id");


--
-- Name: idx_invoices_contract; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_invoices_contract" ON "smartstay"."invoices" USING "btree" ("contract_id");


--
-- Name: idx_invoices_due; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_invoices_due" ON "smartstay"."invoices" USING "btree" ("due_date") WHERE ("status" = ANY (ARRAY['pending_payment'::"smartstay"."invoice_status", 'overdue'::"smartstay"."invoice_status"]));


--
-- Name: idx_invoices_period; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_invoices_period" ON "smartstay"."invoices" USING "btree" ("billing_period");


--
-- Name: idx_invoices_status; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_invoices_status" ON "smartstay"."invoices" USING "btree" ("status");


--
-- Name: idx_maintenance_logs_asset; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_maintenance_logs_asset" ON "smartstay"."maintenance_logs" USING "btree" ("room_asset_id");


--
-- Name: idx_maintenance_logs_date; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_maintenance_logs_date" ON "smartstay"."maintenance_logs" USING "btree" ("maintenance_date" DESC);


--
-- Name: idx_meter_readings_period; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_meter_readings_period" ON "smartstay"."meter_readings" USING "btree" ("billing_period" DESC);


--
-- Name: idx_meter_readings_room; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_meter_readings_room" ON "smartstay"."meter_readings" USING "btree" ("room_id");


--
-- Name: idx_payments_date; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_payments_date" ON "smartstay"."payments" USING "btree" ("payment_date" DESC);


--
-- Name: idx_payments_invoice; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_payments_invoice" ON "smartstay"."payments" USING "btree" ("invoice_id");


--
-- Name: idx_payments_stripe; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_payments_stripe" ON "smartstay"."payments" USING "btree" ("stripe_payment_intent_id") WHERE ("stripe_payment_intent_id" IS NOT NULL);


--
-- Name: idx_profiles_active; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_profiles_active" ON "smartstay"."profiles" USING "btree" ("is_active") WHERE ("is_active" = true);


--
-- Name: idx_profiles_identity_number; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_profiles_identity_number" ON "smartstay"."profiles" USING "btree" ("identity_number");


--
-- Name: idx_profiles_role; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_profiles_role" ON "smartstay"."profiles" USING "btree" ("role");


--
-- Name: idx_profiles_role_id; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_profiles_role_id" ON "smartstay"."profiles" USING "btree" ("role_id");


--
-- Name: idx_renewals_contract; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_renewals_contract" ON "smartstay"."contract_renewals" USING "btree" ("contract_id");


--
-- Name: idx_room_assets_asset; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_room_assets_asset" ON "smartstay"."room_assets" USING "btree" ("asset_id");


--
-- Name: idx_room_assets_room; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_room_assets_room" ON "smartstay"."room_assets" USING "btree" ("room_id");


--
-- Name: idx_room_assets_warranty; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_room_assets_warranty" ON "smartstay"."room_assets" USING "btree" ("warranty_expiry") WHERE ("warranty_expiry" IS NOT NULL);


--
-- Name: idx_room_history_date; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_room_history_date" ON "smartstay"."room_status_history" USING "btree" ("changed_at" DESC);


--
-- Name: idx_room_history_room; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_room_history_room" ON "smartstay"."room_status_history" USING "btree" ("room_id");


--
-- Name: idx_rooms_available; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_rooms_available" ON "smartstay"."rooms" USING "btree" ("building_id", "status") WHERE (("status" = 'available'::"smartstay"."room_status") AND ("is_deleted" = false));


--
-- Name: idx_rooms_building; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_rooms_building" ON "smartstay"."rooms" USING "btree" ("building_id");


--
-- Name: idx_rooms_rent; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_rooms_rent" ON "smartstay"."rooms" USING "btree" ("base_rent");


--
-- Name: idx_rooms_status; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_rooms_status" ON "smartstay"."rooms" USING "btree" ("status") WHERE ("is_deleted" = false);


--
-- Name: idx_rooms_type; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_rooms_type" ON "smartstay"."rooms" USING "btree" ("room_type");


--
-- Name: idx_service_prices_current; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_service_prices_current" ON "smartstay"."service_prices" USING "btree" ("service_id", "effective_from" DESC) WHERE (("effective_to" IS NULL) AND ("is_active" = true));


--
-- Name: idx_service_prices_service; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_service_prices_service" ON "smartstay"."service_prices" USING "btree" ("service_id");


--
-- Name: idx_settings_group; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_settings_group" ON "smartstay"."system_settings" USING "btree" ("group_name");


--
-- Name: idx_tenant_balances_tenant; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_tenant_balances_tenant" ON "smartstay"."tenant_balances" USING "btree" ("tenant_id");


--
-- Name: idx_tenants_active; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_tenants_active" ON "smartstay"."tenants" USING "btree" ("is_deleted") WHERE ("is_deleted" = false);


--
-- Name: idx_tenants_id_number; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_tenants_id_number" ON "smartstay"."tenants" USING "btree" ("id_number");


--
-- Name: idx_tenants_profile; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_tenants_profile" ON "smartstay"."tenants" USING "btree" ("profile_id");


--
-- Name: idx_tenants_search; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_tenants_search" ON "smartstay"."tenants" USING "gin" ("search_vector");


--
-- Name: idx_terminations_contract; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_terminations_contract" ON "smartstay"."contract_terminations" USING "btree" ("contract_id");


--
-- Name: idx_ticket_comments_ticket; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_ticket_comments_ticket" ON "smartstay"."ticket_comments" USING "btree" ("ticket_id");


--
-- Name: idx_tickets_assigned; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_tickets_assigned" ON "smartstay"."tickets" USING "btree" ("assigned_to") WHERE ("status" <> ALL (ARRAY['resolved'::"smartstay"."ticket_status", 'closed'::"smartstay"."ticket_status"]));


--
-- Name: idx_tickets_priority; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_tickets_priority" ON "smartstay"."tickets" USING "btree" ("priority") WHERE ("status" <> ALL (ARRAY['resolved'::"smartstay"."ticket_status", 'closed'::"smartstay"."ticket_status"]));


--
-- Name: idx_tickets_room; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_tickets_room" ON "smartstay"."tickets" USING "btree" ("room_id");


--
-- Name: idx_tickets_status; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_tickets_status" ON "smartstay"."tickets" USING "btree" ("status");


--
-- Name: idx_tickets_tenant; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_tickets_tenant" ON "smartstay"."tickets" USING "btree" ("tenant_id");


--
-- Name: idx_webhook_logs_date; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_webhook_logs_date" ON "smartstay"."webhook_logs" USING "btree" ("received_at" DESC);


--
-- Name: idx_webhook_logs_provider; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_webhook_logs_provider" ON "smartstay"."webhook_logs" USING "btree" ("provider");


--
-- Name: idx_webhook_logs_status; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "idx_webhook_logs_status" ON "smartstay"."webhook_logs" USING "btree" ("status") WHERE ("status" <> 'success'::"smartstay"."webhook_status");


--
-- Name: invoice_utility_overrides_invoice_idx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "invoice_utility_overrides_invoice_idx" ON "smartstay"."invoice_utility_overrides" USING "btree" ("invoice_id");


--
-- Name: invoice_utility_overrides_period_idx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "invoice_utility_overrides_period_idx" ON "smartstay"."invoice_utility_overrides" USING "btree" ("billing_period", "created_at" DESC);


--
-- Name: invoice_utility_snapshots_contract_period_idx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "invoice_utility_snapshots_contract_period_idx" ON "smartstay"."invoice_utility_snapshots" USING "btree" ("contract_id", "billing_period");


--
-- Name: invoice_utility_snapshots_room_period_idx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "invoice_utility_snapshots_room_period_idx" ON "smartstay"."invoice_utility_snapshots" USING "btree" ("room_id", "billing_period");


--
-- Name: notifications_profile_created_idx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "notifications_profile_created_idx" ON "smartstay"."notifications" USING "btree" ("profile_id", "created_at" DESC);


--
-- Name: notifications_profile_unread_idx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "notifications_profile_unread_idx" ON "smartstay"."notifications" USING "btree" ("profile_id", "created_at" DESC) WHERE ("is_read" = false);


--
-- Name: payment_attempts_gateway_order_id_uidx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE UNIQUE INDEX "payment_attempts_gateway_order_id_uidx" ON "smartstay"."payment_attempts" USING "btree" ("gateway_order_id") WHERE ("gateway_order_id" IS NOT NULL);


--
-- Name: payment_attempts_idempotency_key_uidx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE UNIQUE INDEX "payment_attempts_idempotency_key_uidx" ON "smartstay"."payment_attempts" USING "btree" ("idempotency_key") WHERE ("idempotency_key" IS NOT NULL);


--
-- Name: payment_attempts_invoice_id_idx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "payment_attempts_invoice_id_idx" ON "smartstay"."payment_attempts" USING "btree" ("invoice_id", "created_at" DESC);


--
-- Name: payment_attempts_payment_id_uidx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE UNIQUE INDEX "payment_attempts_payment_id_uidx" ON "smartstay"."payment_attempts" USING "btree" ("payment_id") WHERE ("payment_id" IS NOT NULL);


--
-- Name: payment_attempts_status_idx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "payment_attempts_status_idx" ON "smartstay"."payment_attempts" USING "btree" ("status", "created_at" DESC);


--
-- Name: payments_invoice_applied_idx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "payments_invoice_applied_idx" ON "smartstay"."payments" USING "btree" ("invoice_id", "applied_at");


--
-- Name: payments_payment_attempt_id_uidx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE UNIQUE INDEX "payments_payment_attempt_id_uidx" ON "smartstay"."payments" USING "btree" ("payment_attempt_id") WHERE ("payment_attempt_id" IS NOT NULL);


--
-- Name: payments_status_idx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "payments_status_idx" ON "smartstay"."payments" USING "btree" ("status", "confirmed_at" DESC);


--
-- Name: rental_applications_open_room_profile_idx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE UNIQUE INDEX "rental_applications_open_room_profile_idx" ON "smartstay"."rental_applications" USING "btree" ("profile_id", "room_id") WHERE ("status" = ANY (ARRAY['draft'::"text", 'submitted'::"text", 'under_review'::"text", 'approved'::"text"]));


--
-- Name: rental_applications_profile_id_idx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "rental_applications_profile_id_idx" ON "smartstay"."rental_applications" USING "btree" ("profile_id");


--
-- Name: rental_applications_room_id_idx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "rental_applications_room_id_idx" ON "smartstay"."rental_applications" USING "btree" ("room_id");


--
-- Name: rental_applications_status_idx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "rental_applications_status_idx" ON "smartstay"."rental_applications" USING "btree" ("status");


--
-- Name: room_images_main_idx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE UNIQUE INDEX "room_images_main_idx" ON "smartstay"."room_images" USING "btree" ("room_id") WHERE ("is_main" = true);


--
-- Name: utility_policies_effective_period_idx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "utility_policies_effective_period_idx" ON "smartstay"."utility_policies" USING "btree" ("effective_from" DESC, "effective_to");


--
-- Name: utility_policies_scope_active_idx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "utility_policies_scope_active_idx" ON "smartstay"."utility_policies" USING "btree" ("scope_type", "scope_id", "is_active", "effective_from" DESC);


--
-- Name: utility_policy_device_adjustments_policy_idx; Type: INDEX; Schema: smartstay; Owner: postgres
--

CREATE INDEX "utility_policy_device_adjustments_policy_idx" ON "smartstay"."utility_policy_device_adjustments" USING "btree" ("utility_policy_id", "is_active");


--
-- Name: rental_applications set_rental_applications_updated_at; Type: TRIGGER; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_rental_applications_updated_at" BEFORE UPDATE ON "smartstay"."rental_applications" FOR EACH ROW EXECUTE FUNCTION "smartstay"."trigger_set_updated_at"();


--
-- Name: assets trg_assets_updated; Type: TRIGGER; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_assets_updated" BEFORE UPDATE ON "smartstay"."assets" FOR EACH ROW EXECUTE FUNCTION "smartstay"."trigger_set_updated_at"();


--
-- Name: buildings trg_buildings_updated; Type: TRIGGER; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_buildings_updated" BEFORE UPDATE ON "smartstay"."buildings" FOR EACH ROW EXECUTE FUNCTION "smartstay"."trigger_set_updated_at"();


--
-- Name: contract_tenants trg_contract_tenants_ensure_balance; Type: TRIGGER; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_contract_tenants_ensure_balance" AFTER INSERT ON "smartstay"."contract_tenants" FOR EACH ROW EXECUTE FUNCTION "smartstay"."ensure_contract_tenant_balance"();


--
-- Name: contracts trg_contracts_updated; Type: TRIGGER; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_contracts_updated" BEFORE UPDATE ON "smartstay"."contracts" FOR EACH ROW EXECUTE FUNCTION "smartstay"."trigger_set_updated_at"();


--
-- Name: invoices trg_invoices_updated; Type: TRIGGER; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_invoices_updated" BEFORE UPDATE ON "smartstay"."invoices" FOR EACH ROW EXECUTE FUNCTION "smartstay"."trigger_set_updated_at"();


--
-- Name: profiles trg_profiles_updated; Type: TRIGGER; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_profiles_updated" BEFORE UPDATE ON "smartstay"."profiles" FOR EACH ROW EXECUTE FUNCTION "smartstay"."trigger_set_updated_at"();


--
-- Name: room_assets trg_room_assets_updated; Type: TRIGGER; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_room_assets_updated" BEFORE UPDATE ON "smartstay"."room_assets" FOR EACH ROW EXECUTE FUNCTION "smartstay"."trigger_set_updated_at"();


--
-- Name: rooms trg_rooms_updated; Type: TRIGGER; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_rooms_updated" BEFORE UPDATE ON "smartstay"."rooms" FOR EACH ROW EXECUTE FUNCTION "smartstay"."trigger_set_updated_at"();


--
-- Name: services trg_services_updated; Type: TRIGGER; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_services_updated" BEFORE UPDATE ON "smartstay"."services" FOR EACH ROW EXECUTE FUNCTION "smartstay"."trigger_set_updated_at"();


--
-- Name: system_settings trg_system_settings_updated; Type: TRIGGER; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_system_settings_updated" BEFORE UPDATE ON "smartstay"."system_settings" FOR EACH ROW EXECUTE FUNCTION "smartstay"."trigger_set_updated_at"();


--
-- Name: tenants trg_tenants_updated; Type: TRIGGER; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_tenants_updated" BEFORE UPDATE ON "smartstay"."tenants" FOR EACH ROW EXECUTE FUNCTION "smartstay"."trigger_set_updated_at"();


--
-- Name: tickets trg_tickets_updated; Type: TRIGGER; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_tickets_updated" BEFORE UPDATE ON "smartstay"."tickets" FOR EACH ROW EXECUTE FUNCTION "smartstay"."trigger_set_updated_at"();


--
-- Name: billing_runs trg_touch_billing_runs_updated_at; Type: TRIGGER; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_touch_billing_runs_updated_at" BEFORE UPDATE ON "smartstay"."billing_runs" FOR EACH ROW EXECUTE FUNCTION "smartstay"."touch_utility_updated_at"();


--
-- Name: invoice_utility_overrides trg_touch_invoice_utility_overrides_updated_at; Type: TRIGGER; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_touch_invoice_utility_overrides_updated_at" BEFORE UPDATE ON "smartstay"."invoice_utility_overrides" FOR EACH ROW EXECUTE FUNCTION "smartstay"."touch_utility_updated_at"();


--
-- Name: payment_attempts trg_touch_payment_attempt_updated_at; Type: TRIGGER; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_touch_payment_attempt_updated_at" BEFORE UPDATE ON "smartstay"."payment_attempts" FOR EACH ROW EXECUTE FUNCTION "smartstay"."touch_payment_attempt_updated_at"();


--
-- Name: utility_policies trg_touch_utility_policies_updated_at; Type: TRIGGER; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_touch_utility_policies_updated_at" BEFORE UPDATE ON "smartstay"."utility_policies" FOR EACH ROW EXECUTE FUNCTION "smartstay"."touch_utility_updated_at"();


--
-- Name: utility_policy_device_adjustments trg_touch_utility_policy_device_adjustments_updated_at; Type: TRIGGER; Schema: smartstay; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_touch_utility_policy_device_adjustments_updated_at" BEFORE UPDATE ON "smartstay"."utility_policy_device_adjustments" FOR EACH ROW EXECUTE FUNCTION "smartstay"."touch_utility_updated_at"();


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "smartstay"."profiles"("id");


--
-- Name: balance_history balance_history_balance_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."balance_history"
    ADD CONSTRAINT "balance_history_balance_id_fkey" FOREIGN KEY ("balance_id") REFERENCES "smartstay"."tenant_balances"("id") ON DELETE CASCADE;


--
-- Name: balance_history balance_history_created_by_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."balance_history"
    ADD CONSTRAINT "balance_history_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "smartstay"."profiles"("id");


--
-- Name: balance_history balance_history_invoice_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."balance_history"
    ADD CONSTRAINT "balance_history_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "smartstay"."invoices"("id");


--
-- Name: balance_history balance_history_payment_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."balance_history"
    ADD CONSTRAINT "balance_history_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "smartstay"."payments"("id");


--
-- Name: balance_history balance_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."balance_history"
    ADD CONSTRAINT "balance_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "smartstay"."tenants"("id") ON DELETE CASCADE;


--
-- Name: billing_runs billing_runs_created_by_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."billing_runs"
    ADD CONSTRAINT "billing_runs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "smartstay"."profiles"("id");


--
-- Name: building_images building_images_building_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."building_images"
    ADD CONSTRAINT "building_images_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "smartstay"."buildings"("id") ON DELETE CASCADE;


--
-- Name: buildings buildings_owner_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."buildings"
    ADD CONSTRAINT "buildings_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "smartstay"."profiles"("id") ON DELETE SET NULL;


--
-- Name: contract_renewals contract_renewals_contract_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contract_renewals"
    ADD CONSTRAINT "contract_renewals_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "smartstay"."contracts"("id") ON DELETE CASCADE;


--
-- Name: contract_renewals contract_renewals_renewed_by_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contract_renewals"
    ADD CONSTRAINT "contract_renewals_renewed_by_fkey" FOREIGN KEY ("renewed_by") REFERENCES "smartstay"."profiles"("id");


--
-- Name: contract_services contract_services_contract_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contract_services"
    ADD CONSTRAINT "contract_services_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "smartstay"."contracts"("id") ON DELETE CASCADE;


--
-- Name: contract_services contract_services_service_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contract_services"
    ADD CONSTRAINT "contract_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "smartstay"."services"("id") ON DELETE RESTRICT;


--
-- Name: contract_tenants contract_tenants_contract_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contract_tenants"
    ADD CONSTRAINT "contract_tenants_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "smartstay"."contracts"("id") ON DELETE CASCADE;


--
-- Name: contract_tenants contract_tenants_tenant_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contract_tenants"
    ADD CONSTRAINT "contract_tenants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "smartstay"."tenants"("id") ON DELETE RESTRICT;


--
-- Name: contract_terminations contract_terminations_contract_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contract_terminations"
    ADD CONSTRAINT "contract_terminations_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "smartstay"."contracts"("id") ON DELETE RESTRICT;


--
-- Name: contract_terminations contract_terminations_processed_by_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contract_terminations"
    ADD CONSTRAINT "contract_terminations_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "smartstay"."profiles"("id");


--
-- Name: contracts contracts_room_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contracts"
    ADD CONSTRAINT "contracts_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "smartstay"."rooms"("id") ON DELETE RESTRICT;


--
-- Name: contract_terminations fk_termination_invoice; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."contract_terminations"
    ADD CONSTRAINT "fk_termination_invoice" FOREIGN KEY ("final_invoice_id") REFERENCES "smartstay"."invoices"("id");


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoice_items"
    ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "smartstay"."invoices"("id") ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_meter_reading_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoice_items"
    ADD CONSTRAINT "invoice_items_meter_reading_id_fkey" FOREIGN KEY ("meter_reading_id") REFERENCES "smartstay"."meter_readings"("id");


--
-- Name: invoice_utility_overrides invoice_utility_overrides_contract_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoice_utility_overrides"
    ADD CONSTRAINT "invoice_utility_overrides_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "smartstay"."contracts"("id") ON DELETE CASCADE;


--
-- Name: invoice_utility_overrides invoice_utility_overrides_created_by_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoice_utility_overrides"
    ADD CONSTRAINT "invoice_utility_overrides_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "smartstay"."profiles"("id");


--
-- Name: invoice_utility_overrides invoice_utility_overrides_invoice_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoice_utility_overrides"
    ADD CONSTRAINT "invoice_utility_overrides_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "smartstay"."invoices"("id") ON DELETE SET NULL;


--
-- Name: invoice_utility_snapshots invoice_utility_snapshots_billing_run_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoice_utility_snapshots"
    ADD CONSTRAINT "invoice_utility_snapshots_billing_run_id_fkey" FOREIGN KEY ("billing_run_id") REFERENCES "smartstay"."billing_runs"("id") ON DELETE SET NULL;


--
-- Name: invoice_utility_snapshots invoice_utility_snapshots_contract_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoice_utility_snapshots"
    ADD CONSTRAINT "invoice_utility_snapshots_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "smartstay"."contracts"("id") ON DELETE CASCADE;


--
-- Name: invoice_utility_snapshots invoice_utility_snapshots_invoice_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoice_utility_snapshots"
    ADD CONSTRAINT "invoice_utility_snapshots_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "smartstay"."invoices"("id") ON DELETE CASCADE;


--
-- Name: invoice_utility_snapshots invoice_utility_snapshots_override_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoice_utility_snapshots"
    ADD CONSTRAINT "invoice_utility_snapshots_override_id_fkey" FOREIGN KEY ("override_id") REFERENCES "smartstay"."invoice_utility_overrides"("id") ON DELETE SET NULL;


--
-- Name: invoice_utility_snapshots invoice_utility_snapshots_resolved_policy_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoice_utility_snapshots"
    ADD CONSTRAINT "invoice_utility_snapshots_resolved_policy_id_fkey" FOREIGN KEY ("resolved_policy_id") REFERENCES "smartstay"."utility_policies"("id") ON DELETE SET NULL;


--
-- Name: invoice_utility_snapshots invoice_utility_snapshots_room_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoice_utility_snapshots"
    ADD CONSTRAINT "invoice_utility_snapshots_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "smartstay"."rooms"("id") ON DELETE RESTRICT;


--
-- Name: invoices invoices_contract_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."invoices"
    ADD CONSTRAINT "invoices_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "smartstay"."contracts"("id") ON DELETE RESTRICT;


--
-- Name: maintenance_logs maintenance_logs_room_asset_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."maintenance_logs"
    ADD CONSTRAINT "maintenance_logs_room_asset_id_fkey" FOREIGN KEY ("room_asset_id") REFERENCES "smartstay"."room_assets"("id") ON DELETE CASCADE;


--
-- Name: meter_readings meter_readings_previous_reading_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."meter_readings"
    ADD CONSTRAINT "meter_readings_previous_reading_id_fkey" FOREIGN KEY ("previous_reading_id") REFERENCES "smartstay"."meter_readings"("id");


--
-- Name: meter_readings meter_readings_read_by_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."meter_readings"
    ADD CONSTRAINT "meter_readings_read_by_fkey" FOREIGN KEY ("read_by") REFERENCES "smartstay"."profiles"("id");


--
-- Name: meter_readings meter_readings_room_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."meter_readings"
    ADD CONSTRAINT "meter_readings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "smartstay"."rooms"("id") ON DELETE CASCADE;


--
-- Name: notifications notifications_created_by_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."notifications"
    ADD CONSTRAINT "notifications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "smartstay"."profiles"("id") ON DELETE SET NULL;


--
-- Name: notifications notifications_profile_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."notifications"
    ADD CONSTRAINT "notifications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "smartstay"."profiles"("id") ON DELETE CASCADE;


--
-- Name: payment_attempts payment_attempts_approved_by_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."payment_attempts"
    ADD CONSTRAINT "payment_attempts_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "smartstay"."profiles"("id");


--
-- Name: payment_attempts payment_attempts_cancelled_by_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."payment_attempts"
    ADD CONSTRAINT "payment_attempts_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "smartstay"."profiles"("id");


--
-- Name: payment_attempts payment_attempts_initiated_by_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."payment_attempts"
    ADD CONSTRAINT "payment_attempts_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "smartstay"."profiles"("id");


--
-- Name: payment_attempts payment_attempts_invoice_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."payment_attempts"
    ADD CONSTRAINT "payment_attempts_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "smartstay"."invoices"("id") ON DELETE RESTRICT;


--
-- Name: payment_attempts payment_attempts_payment_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."payment_attempts"
    ADD CONSTRAINT "payment_attempts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "smartstay"."payments"("id");


--
-- Name: payment_attempts payment_attempts_rejected_by_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."payment_attempts"
    ADD CONSTRAINT "payment_attempts_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "smartstay"."profiles"("id");


--
-- Name: payments payments_applied_by_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."payments"
    ADD CONSTRAINT "payments_applied_by_fkey" FOREIGN KEY ("applied_by") REFERENCES "smartstay"."profiles"("id");


--
-- Name: payments payments_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."payments"
    ADD CONSTRAINT "payments_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "smartstay"."profiles"("id");


--
-- Name: payments payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."payments"
    ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "smartstay"."invoices"("id") ON DELETE RESTRICT;


--
-- Name: payments payments_payment_attempt_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."payments"
    ADD CONSTRAINT "payments_payment_attempt_id_fkey" FOREIGN KEY ("payment_attempt_id") REFERENCES "smartstay"."payment_attempts"("id");


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: profiles profiles_role_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."profiles"
    ADD CONSTRAINT "profiles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "smartstay"."roles"("id");


--
-- Name: rental_applications rental_applications_profile_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."rental_applications"
    ADD CONSTRAINT "rental_applications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "smartstay"."profiles"("id") ON DELETE CASCADE;


--
-- Name: rental_applications rental_applications_room_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."rental_applications"
    ADD CONSTRAINT "rental_applications_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "smartstay"."rooms"("id") ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "smartstay"."permissions"("id") ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "smartstay"."roles"("id") ON DELETE CASCADE;


--
-- Name: room_assets room_assets_asset_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."room_assets"
    ADD CONSTRAINT "room_assets_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "smartstay"."assets"("id") ON DELETE RESTRICT;


--
-- Name: room_assets room_assets_room_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."room_assets"
    ADD CONSTRAINT "room_assets_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "smartstay"."rooms"("id") ON DELETE CASCADE;


--
-- Name: room_images room_images_room_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."room_images"
    ADD CONSTRAINT "room_images_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "smartstay"."rooms"("id") ON DELETE CASCADE;


--
-- Name: room_status_history room_status_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."room_status_history"
    ADD CONSTRAINT "room_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "smartstay"."profiles"("id") ON DELETE SET NULL;


--
-- Name: room_status_history room_status_history_room_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."room_status_history"
    ADD CONSTRAINT "room_status_history_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "smartstay"."rooms"("id") ON DELETE CASCADE;


--
-- Name: rooms rooms_building_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."rooms"
    ADD CONSTRAINT "rooms_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "smartstay"."buildings"("id") ON DELETE CASCADE;


--
-- Name: service_prices service_prices_service_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."service_prices"
    ADD CONSTRAINT "service_prices_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "smartstay"."services"("id") ON DELETE CASCADE;


--
-- Name: tenant_balances tenant_balances_tenant_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."tenant_balances"
    ADD CONSTRAINT "tenant_balances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "smartstay"."tenants"("id") ON DELETE CASCADE;


--
-- Name: tenants tenants_profile_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."tenants"
    ADD CONSTRAINT "tenants_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "smartstay"."profiles"("id") ON DELETE SET NULL;


--
-- Name: ticket_comments ticket_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."ticket_comments"
    ADD CONSTRAINT "ticket_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "smartstay"."profiles"("id") ON DELETE SET NULL;


--
-- Name: ticket_comments ticket_comments_ticket_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."ticket_comments"
    ADD CONSTRAINT "ticket_comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "smartstay"."tickets"("id") ON DELETE CASCADE;


--
-- Name: tickets tickets_assigned_to_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."tickets"
    ADD CONSTRAINT "tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "smartstay"."profiles"("id");


--
-- Name: tickets tickets_room_asset_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."tickets"
    ADD CONSTRAINT "tickets_room_asset_id_fkey" FOREIGN KEY ("room_asset_id") REFERENCES "smartstay"."room_assets"("id") ON DELETE SET NULL;


--
-- Name: tickets tickets_room_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."tickets"
    ADD CONSTRAINT "tickets_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "smartstay"."rooms"("id") ON DELETE SET NULL;


--
-- Name: tickets tickets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."tickets"
    ADD CONSTRAINT "tickets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "smartstay"."tenants"("id") ON DELETE SET NULL;


--
-- Name: utility_policies utility_policies_created_by_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."utility_policies"
    ADD CONSTRAINT "utility_policies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "smartstay"."profiles"("id");


--
-- Name: utility_policy_device_adjustments utility_policy_device_adjustments_utility_policy_id_fkey; Type: FK CONSTRAINT; Schema: smartstay; Owner: postgres
--

ALTER TABLE ONLY "smartstay"."utility_policy_device_adjustments"
    ADD CONSTRAINT "utility_policy_device_adjustments_utility_policy_id_fkey" FOREIGN KEY ("utility_policy_id") REFERENCES "smartstay"."utility_policies"("id") ON DELETE CASCADE;


--
-- Name: assets admin_all_assets; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "admin_all_assets" ON "smartstay"."assets" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"]))))));


--
-- Name: buildings admin_all_buildings; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "admin_all_buildings" ON "smartstay"."buildings" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"]))))));


--
-- Name: contract_renewals admin_all_contract_renewals; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "admin_all_contract_renewals" ON "smartstay"."contract_renewals" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"]))))));


--
-- Name: contract_services admin_all_contract_services; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "admin_all_contract_services" ON "smartstay"."contract_services" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"]))))));


--
-- Name: contract_tenants admin_all_contract_tenants; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "admin_all_contract_tenants" ON "smartstay"."contract_tenants" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"]))))));


--
-- Name: contract_terminations admin_all_contract_terminations; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "admin_all_contract_terminations" ON "smartstay"."contract_terminations" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"]))))));


--
-- Name: maintenance_logs admin_all_maintenance_logs; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "admin_all_maintenance_logs" ON "smartstay"."maintenance_logs" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"]))))));


--
-- Name: room_assets admin_all_room_assets; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "admin_all_room_assets" ON "smartstay"."room_assets" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"]))))));


--
-- Name: room_status_history admin_all_room_status_history; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "admin_all_room_status_history" ON "smartstay"."room_status_history" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"]))))));


--
-- Name: rooms admin_all_rooms; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "admin_all_rooms" ON "smartstay"."rooms" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"]))))));


--
-- Name: service_prices admin_all_service_prices; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "admin_all_service_prices" ON "smartstay"."service_prices" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"]))))));


--
-- Name: services admin_all_services; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "admin_all_services" ON "smartstay"."services" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"]))))));


--
-- Name: ticket_comments admin_all_ticket_comments; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "admin_all_ticket_comments" ON "smartstay"."ticket_comments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"]))))));


--
-- Name: tickets admin_all_tickets; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "admin_all_tickets" ON "smartstay"."tickets" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"]))))));


--
-- Name: rental_applications admin_manage_all_rental_applications; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "admin_manage_all_rental_applications" ON "smartstay"."rental_applications" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role", 'landlord'::"smartstay"."user_role"]))))));


--
-- Name: rental_applications applicant_manage_own_rental_applications; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "applicant_manage_own_rental_applications" ON "smartstay"."rental_applications" TO "authenticated" USING (("auth"."uid"() = "profile_id")) WITH CHECK (("auth"."uid"() = "profile_id"));


--
-- Name: assets; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."assets" ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."audit_logs" ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs audit_logs_admin_select; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "audit_logs_admin_select" ON "smartstay"."audit_logs" FOR SELECT TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: assets authenticated_select_assets; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "authenticated_select_assets" ON "smartstay"."assets" FOR SELECT TO "authenticated" USING (true);


--
-- Name: buildings authenticated_select_buildings; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "authenticated_select_buildings" ON "smartstay"."buildings" FOR SELECT TO "authenticated" USING (true);


--
-- Name: contract_renewals authenticated_select_contract_renewals; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "authenticated_select_contract_renewals" ON "smartstay"."contract_renewals" FOR SELECT TO "authenticated" USING (true);


--
-- Name: contract_services authenticated_select_contract_services; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "authenticated_select_contract_services" ON "smartstay"."contract_services" FOR SELECT TO "authenticated" USING (true);


--
-- Name: contract_tenants authenticated_select_contract_tenants; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "authenticated_select_contract_tenants" ON "smartstay"."contract_tenants" FOR SELECT TO "authenticated" USING (true);


--
-- Name: contract_terminations authenticated_select_contract_terminations; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "authenticated_select_contract_terminations" ON "smartstay"."contract_terminations" FOR SELECT TO "authenticated" USING (true);


--
-- Name: maintenance_logs authenticated_select_maintenance_logs; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "authenticated_select_maintenance_logs" ON "smartstay"."maintenance_logs" FOR SELECT TO "authenticated" USING (true);


--
-- Name: room_assets authenticated_select_room_assets; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "authenticated_select_room_assets" ON "smartstay"."room_assets" FOR SELECT TO "authenticated" USING (true);


--
-- Name: room_status_history authenticated_select_room_status_history; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "authenticated_select_room_status_history" ON "smartstay"."room_status_history" FOR SELECT TO "authenticated" USING (true);


--
-- Name: rooms authenticated_select_rooms; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "authenticated_select_rooms" ON "smartstay"."rooms" FOR SELECT TO "authenticated" USING (true);


--
-- Name: service_prices authenticated_select_service_prices; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "authenticated_select_service_prices" ON "smartstay"."service_prices" FOR SELECT TO "authenticated" USING (true);


--
-- Name: services authenticated_select_services; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "authenticated_select_services" ON "smartstay"."services" FOR SELECT TO "authenticated" USING (true);


--
-- Name: balance_history; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."balance_history" ENABLE ROW LEVEL SECURITY;

--
-- Name: balance_history balance_history_admin_insert; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "balance_history_admin_insert" ON "smartstay"."balance_history" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: balance_history balance_history_owner_or_admin_select; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "balance_history_owner_or_admin_select" ON "smartstay"."balance_history" FOR SELECT TO "authenticated" USING ((( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin") OR ( SELECT "private"."is_tenant_profile"("balance_history"."tenant_id", ( SELECT "auth"."uid"() AS "uid")) AS "is_tenant_profile")));


--
-- Name: billing_runs; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."billing_runs" ENABLE ROW LEVEL SECURITY;

--
-- Name: billing_runs billing_runs_admin_delete; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "billing_runs_admin_delete" ON "smartstay"."billing_runs" FOR DELETE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: billing_runs billing_runs_admin_insert; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "billing_runs_admin_insert" ON "smartstay"."billing_runs" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: billing_runs billing_runs_admin_select; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "billing_runs_admin_select" ON "smartstay"."billing_runs" FOR SELECT TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: billing_runs billing_runs_admin_update; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "billing_runs_admin_update" ON "smartstay"."billing_runs" FOR UPDATE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin")) WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: building_images; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."building_images" ENABLE ROW LEVEL SECURITY;

--
-- Name: building_images building_images_admin_delete; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "building_images_admin_delete" ON "smartstay"."building_images" FOR DELETE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: building_images building_images_admin_insert; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "building_images_admin_insert" ON "smartstay"."building_images" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: building_images building_images_admin_update; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "building_images_admin_update" ON "smartstay"."building_images" FOR UPDATE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin")) WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: building_images building_images_authenticated_select; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "building_images_authenticated_select" ON "smartstay"."building_images" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));


--
-- Name: buildings; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."buildings" ENABLE ROW LEVEL SECURITY;

--
-- Name: buildings buildings_all; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "buildings_all" ON "smartstay"."buildings" USING ((("owner_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"smartstay"."user_role"))))));


--
-- Name: buildings buildings_select; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "buildings_select" ON "smartstay"."buildings" FOR SELECT USING ((("owner_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "smartstay"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role"])))))));


--
-- Name: contract_renewals; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."contract_renewals" ENABLE ROW LEVEL SECURITY;

--
-- Name: contract_services; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."contract_services" ENABLE ROW LEVEL SECURITY;

--
-- Name: contract_tenants; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."contract_tenants" ENABLE ROW LEVEL SECURITY;

--
-- Name: contract_terminations; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."contract_terminations" ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."contracts" ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts contracts_admin_insert; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "contracts_admin_insert" ON "smartstay"."contracts" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: contracts contracts_admin_update; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "contracts_admin_update" ON "smartstay"."contracts" FOR UPDATE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin")) WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: contracts contracts_owner_or_admin_select; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "contracts_owner_or_admin_select" ON "smartstay"."contracts" FOR SELECT TO "authenticated" USING ((( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin") OR ( SELECT "private"."is_contract_participant"("contracts"."id", ( SELECT "auth"."uid"() AS "uid")) AS "is_contract_participant")));


--
-- Name: invoice_items; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."invoice_items" ENABLE ROW LEVEL SECURITY;

--
-- Name: invoice_items invoice_items_admin_insert; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "invoice_items_admin_insert" ON "smartstay"."invoice_items" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: invoice_items invoice_items_admin_update; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "invoice_items_admin_update" ON "smartstay"."invoice_items" FOR UPDATE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin")) WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: invoice_items invoice_items_owner_or_admin_select; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "invoice_items_owner_or_admin_select" ON "smartstay"."invoice_items" FOR SELECT TO "authenticated" USING ((( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin") OR ( SELECT "private"."is_invoice_owner"("invoice_items"."invoice_id", ( SELECT "auth"."uid"() AS "uid")) AS "is_invoice_owner")));


--
-- Name: invoice_utility_overrides; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."invoice_utility_overrides" ENABLE ROW LEVEL SECURITY;

--
-- Name: invoice_utility_overrides invoice_utility_overrides_admin_delete; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "invoice_utility_overrides_admin_delete" ON "smartstay"."invoice_utility_overrides" FOR DELETE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: invoice_utility_overrides invoice_utility_overrides_admin_insert; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "invoice_utility_overrides_admin_insert" ON "smartstay"."invoice_utility_overrides" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: invoice_utility_overrides invoice_utility_overrides_admin_select; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "invoice_utility_overrides_admin_select" ON "smartstay"."invoice_utility_overrides" FOR SELECT TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: invoice_utility_overrides invoice_utility_overrides_admin_update; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "invoice_utility_overrides_admin_update" ON "smartstay"."invoice_utility_overrides" FOR UPDATE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin")) WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: invoice_utility_snapshots; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."invoice_utility_snapshots" ENABLE ROW LEVEL SECURITY;

--
-- Name: invoice_utility_snapshots invoice_utility_snapshots_admin_delete; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "invoice_utility_snapshots_admin_delete" ON "smartstay"."invoice_utility_snapshots" FOR DELETE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: invoice_utility_snapshots invoice_utility_snapshots_admin_insert; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "invoice_utility_snapshots_admin_insert" ON "smartstay"."invoice_utility_snapshots" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: invoice_utility_snapshots invoice_utility_snapshots_admin_update; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "invoice_utility_snapshots_admin_update" ON "smartstay"."invoice_utility_snapshots" FOR UPDATE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin")) WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: invoice_utility_snapshots invoice_utility_snapshots_owner_or_admin_select; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "invoice_utility_snapshots_owner_or_admin_select" ON "smartstay"."invoice_utility_snapshots" FOR SELECT TO "authenticated" USING ((( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin") OR ( SELECT "private"."is_invoice_owner"("invoice_utility_snapshots"."invoice_id", ( SELECT "auth"."uid"() AS "uid")) AS "is_invoice_owner")));


--
-- Name: invoices; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."invoices" ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices invoices_admin_insert; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "invoices_admin_insert" ON "smartstay"."invoices" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: invoices invoices_admin_update; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "invoices_admin_update" ON "smartstay"."invoices" FOR UPDATE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin")) WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: invoices invoices_owner_or_admin_select; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "invoices_owner_or_admin_select" ON "smartstay"."invoices" FOR SELECT TO "authenticated" USING ((( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin") OR ( SELECT "private"."is_invoice_owner"("invoices"."id", ( SELECT "auth"."uid"() AS "uid")) AS "is_invoice_owner")));


--
-- Name: maintenance_logs; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."maintenance_logs" ENABLE ROW LEVEL SECURITY;

--
-- Name: meter_readings; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."meter_readings" ENABLE ROW LEVEL SECURITY;

--
-- Name: meter_readings meter_readings_admin_insert; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "meter_readings_admin_insert" ON "smartstay"."meter_readings" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: meter_readings meter_readings_admin_update; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "meter_readings_admin_update" ON "smartstay"."meter_readings" FOR UPDATE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin")) WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: meter_readings meter_readings_owner_or_admin_select; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "meter_readings_owner_or_admin_select" ON "smartstay"."meter_readings" FOR SELECT TO "authenticated" USING ((( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin") OR ( SELECT "private"."can_view_meter_reading"("meter_readings"."id", ( SELECT "auth"."uid"() AS "uid")) AS "can_view_meter_reading")));


--
-- Name: notifications; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."notifications" ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications notifications_management_all; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "notifications_management_all" ON "smartstay"."notifications" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "smartstay"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"smartstay"."user_role", 'manager'::"smartstay"."user_role", 'staff'::"smartstay"."user_role"]))))));


--
-- Name: notifications notifications_select_own; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "notifications_select_own" ON "smartstay"."notifications" FOR SELECT TO "authenticated" USING (("profile_id" = "auth"."uid"()));


--
-- Name: notifications notifications_update_own; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "notifications_update_own" ON "smartstay"."notifications" FOR UPDATE TO "authenticated" USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));


--
-- Name: payment_attempts; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."payment_attempts" ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_attempts payment_attempts_owner_or_admin_select; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "payment_attempts_owner_or_admin_select" ON "smartstay"."payment_attempts" FOR SELECT TO "authenticated" USING ((( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin") OR ("initiated_by" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "private"."is_invoice_owner"("payment_attempts"."invoice_id", ( SELECT "auth"."uid"() AS "uid")) AS "is_invoice_owner")));


--
-- Name: payments; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."payments" ENABLE ROW LEVEL SECURITY;

--
-- Name: payments payments_admin_insert; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "payments_admin_insert" ON "smartstay"."payments" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: payments payments_admin_update; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "payments_admin_update" ON "smartstay"."payments" FOR UPDATE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin")) WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: payments payments_owner_or_admin_select; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "payments_owner_or_admin_select" ON "smartstay"."payments" FOR SELECT TO "authenticated" USING ((( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin") OR ( SELECT "private"."is_invoice_owner"("payments"."invoice_id", ( SELECT "auth"."uid"() AS "uid")) AS "is_invoice_owner")));


--
-- Name: profiles; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."profiles" ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_admin_all; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "profiles_admin_all" ON "smartstay"."profiles" TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin")) WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: profiles profiles_self_insert; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "profiles_self_insert" ON "smartstay"."profiles" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (( SELECT "auth"."uid"() AS "uid") = "id")));


--
-- Name: profiles profiles_self_select; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "profiles_self_select" ON "smartstay"."profiles" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (( SELECT "auth"."uid"() AS "uid") = "id")));


--
-- Name: profiles profiles_self_update; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "profiles_self_update" ON "smartstay"."profiles" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (( SELECT "auth"."uid"() AS "uid") = "id"))) WITH CHECK (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (( SELECT "auth"."uid"() AS "uid") = "id")));


--
-- Name: rental_applications; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."rental_applications" ENABLE ROW LEVEL SECURITY;

--
-- Name: room_assets; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."room_assets" ENABLE ROW LEVEL SECURITY;

--
-- Name: room_images; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."room_images" ENABLE ROW LEVEL SECURITY;

--
-- Name: room_images room_images_admin_delete; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "room_images_admin_delete" ON "smartstay"."room_images" FOR DELETE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: room_images room_images_admin_insert; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "room_images_admin_insert" ON "smartstay"."room_images" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: room_images room_images_admin_update; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "room_images_admin_update" ON "smartstay"."room_images" FOR UPDATE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin")) WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: room_images room_images_authenticated_select; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "room_images_authenticated_select" ON "smartstay"."room_images" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));


--
-- Name: room_status_history; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."room_status_history" ENABLE ROW LEVEL SECURITY;

--
-- Name: rooms; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."rooms" ENABLE ROW LEVEL SECURITY;

--
-- Name: service_prices; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."service_prices" ENABLE ROW LEVEL SECURITY;

--
-- Name: services; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."services" ENABLE ROW LEVEL SECURITY;

--
-- Name: system_settings; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."system_settings" ENABLE ROW LEVEL SECURITY;

--
-- Name: system_settings system_settings_admin_insert; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "system_settings_admin_insert" ON "smartstay"."system_settings" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: system_settings system_settings_admin_select; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "system_settings_admin_select" ON "smartstay"."system_settings" FOR SELECT TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: system_settings system_settings_admin_update; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "system_settings_admin_update" ON "smartstay"."system_settings" FOR UPDATE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin")) WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: tenant_balances; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."tenant_balances" ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_balances tenant_balances_admin_delete; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "tenant_balances_admin_delete" ON "smartstay"."tenant_balances" FOR DELETE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: tenant_balances tenant_balances_admin_insert; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "tenant_balances_admin_insert" ON "smartstay"."tenant_balances" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: tenant_balances tenant_balances_admin_update; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "tenant_balances_admin_update" ON "smartstay"."tenant_balances" FOR UPDATE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin")) WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: tenant_balances tenant_balances_owner_or_admin_select; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "tenant_balances_owner_or_admin_select" ON "smartstay"."tenant_balances" FOR SELECT TO "authenticated" USING ((( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin") OR ( SELECT "private"."is_tenant_profile"("tenant_balances"."tenant_id", ( SELECT "auth"."uid"() AS "uid")) AS "is_tenant_profile")));


--
-- Name: ticket_comments tenant_insert_own_ticket_comments; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "tenant_insert_own_ticket_comments" ON "smartstay"."ticket_comments" FOR INSERT TO "authenticated" WITH CHECK ((("author_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("smartstay"."tickets" "tk"
     JOIN "smartstay"."tenants" "t" ON (("t"."id" = "tk"."tenant_id")))
  WHERE (("tk"."id" = "ticket_comments"."ticket_id") AND ("t"."profile_id" = "auth"."uid"()) AND (COALESCE("t"."is_deleted", false) = false))))));


--
-- Name: tickets tenant_insert_own_tickets; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "tenant_insert_own_tickets" ON "smartstay"."tickets" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "smartstay"."tenants" "t"
  WHERE (("t"."id" = "tickets"."tenant_id") AND ("t"."profile_id" = "auth"."uid"()) AND (COALESCE("t"."is_deleted", false) = false)))));


--
-- Name: ticket_comments tenant_select_own_ticket_comments; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "tenant_select_own_ticket_comments" ON "smartstay"."ticket_comments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("smartstay"."tickets" "tk"
     JOIN "smartstay"."tenants" "t" ON (("t"."id" = "tk"."tenant_id")))
  WHERE (("tk"."id" = "ticket_comments"."ticket_id") AND ("t"."profile_id" = "auth"."uid"()) AND (COALESCE("t"."is_deleted", false) = false)))));


--
-- Name: tickets tenant_select_own_tickets; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "tenant_select_own_tickets" ON "smartstay"."tickets" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "smartstay"."tenants" "t"
  WHERE (("t"."id" = "tickets"."tenant_id") AND ("t"."profile_id" = "auth"."uid"()) AND (COALESCE("t"."is_deleted", false) = false)))));


--
-- Name: tenants; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."tenants" ENABLE ROW LEVEL SECURITY;

--
-- Name: tenants tenants_admin_delete; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "tenants_admin_delete" ON "smartstay"."tenants" FOR DELETE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: tenants tenants_admin_insert; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "tenants_admin_insert" ON "smartstay"."tenants" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: tenants tenants_admin_update; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "tenants_admin_update" ON "smartstay"."tenants" FOR UPDATE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin")) WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: tenants tenants_owner_or_admin_select; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "tenants_owner_or_admin_select" ON "smartstay"."tenants" FOR SELECT TO "authenticated" USING ((( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin") OR ( SELECT "private"."is_tenant_profile"("tenants"."id", ( SELECT "auth"."uid"() AS "uid")) AS "is_tenant_profile")));


--
-- Name: ticket_comments; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."ticket_comments" ENABLE ROW LEVEL SECURITY;

--
-- Name: tickets; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."tickets" ENABLE ROW LEVEL SECURITY;

--
-- Name: utility_policies; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."utility_policies" ENABLE ROW LEVEL SECURITY;

--
-- Name: utility_policies utility_policies_admin_delete; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "utility_policies_admin_delete" ON "smartstay"."utility_policies" FOR DELETE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: utility_policies utility_policies_admin_insert; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "utility_policies_admin_insert" ON "smartstay"."utility_policies" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: utility_policies utility_policies_admin_select; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "utility_policies_admin_select" ON "smartstay"."utility_policies" FOR SELECT TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: utility_policies utility_policies_admin_update; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "utility_policies_admin_update" ON "smartstay"."utility_policies" FOR UPDATE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin")) WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: utility_policy_device_adjustments; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."utility_policy_device_adjustments" ENABLE ROW LEVEL SECURITY;

--
-- Name: utility_policy_device_adjustments utility_policy_device_adjustments_admin_delete; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "utility_policy_device_adjustments_admin_delete" ON "smartstay"."utility_policy_device_adjustments" FOR DELETE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: utility_policy_device_adjustments utility_policy_device_adjustments_admin_insert; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "utility_policy_device_adjustments_admin_insert" ON "smartstay"."utility_policy_device_adjustments" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: utility_policy_device_adjustments utility_policy_device_adjustments_admin_select; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "utility_policy_device_adjustments_admin_select" ON "smartstay"."utility_policy_device_adjustments" FOR SELECT TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: utility_policy_device_adjustments utility_policy_device_adjustments_admin_update; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "utility_policy_device_adjustments_admin_update" ON "smartstay"."utility_policy_device_adjustments" FOR UPDATE TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin")) WITH CHECK (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: webhook_logs; Type: ROW SECURITY; Schema: smartstay; Owner: postgres
--

ALTER TABLE "smartstay"."webhook_logs" ENABLE ROW LEVEL SECURITY;

--
-- Name: webhook_logs webhook_logs_admin_select; Type: POLICY; Schema: smartstay; Owner: postgres
--

CREATE POLICY "webhook_logs_admin_select" ON "smartstay"."webhook_logs" FOR SELECT TO "authenticated" USING (( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"));


--
-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


--
-- Name: SCHEMA "private"; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA "private" TO "authenticated";


--
-- Name: SCHEMA "smartstay"; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA "smartstay" TO "anon";
GRANT USAGE ON SCHEMA "smartstay" TO "authenticated";
GRANT USAGE ON SCHEMA "smartstay" TO "service_role";


--
-- Name: FUNCTION "can_view_meter_reading"("p_meter_reading_id" bigint, "p_user_id" "uuid"); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION "private"."can_view_meter_reading"("p_meter_reading_id" bigint, "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."can_view_meter_reading"("p_meter_reading_id" bigint, "p_user_id" "uuid") TO "authenticated";


--
-- Name: FUNCTION "is_admin"("user_id" "uuid"); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION "private"."is_admin"("user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."is_admin"("user_id" "uuid") TO "authenticated";


--
-- Name: FUNCTION "is_contract_participant"("p_contract_id" integer, "p_user_id" "uuid"); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION "private"."is_contract_participant"("p_contract_id" integer, "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."is_contract_participant"("p_contract_id" integer, "p_user_id" "uuid") TO "authenticated";


--
-- Name: FUNCTION "is_invoice_owner"("p_invoice_id" integer, "p_user_id" "uuid"); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION "private"."is_invoice_owner"("p_invoice_id" integer, "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."is_invoice_owner"("p_invoice_id" integer, "p_user_id" "uuid") TO "authenticated";


--
-- Name: FUNCTION "is_tenant_profile"("p_tenant_id" integer, "p_user_id" "uuid"); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION "private"."is_tenant_profile"("p_tenant_id" integer, "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."is_tenant_profile"("p_tenant_id" integer, "p_user_id" "uuid") TO "authenticated";


--
-- Name: FUNCTION "create_policy_utility_invoice"("p_contract_id" bigint, "p_billing_period" "text", "p_due_date" "date", "p_subtotal" numeric, "p_total_amount" numeric, "p_note" "text", "p_invoice_items" "jsonb", "p_snapshot" "jsonb"); Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON FUNCTION "smartstay"."create_policy_utility_invoice"("p_contract_id" bigint, "p_billing_period" "text", "p_due_date" "date", "p_subtotal" numeric, "p_total_amount" numeric, "p_note" "text", "p_invoice_items" "jsonb", "p_snapshot" "jsonb") TO "authenticated";


--
-- Name: FUNCTION "portal_cancel_invoice"("p_invoice_id" bigint, "p_reason" "text"); Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON FUNCTION "smartstay"."portal_cancel_invoice"("p_invoice_id" bigint, "p_reason" "text") TO "authenticated";


--
-- Name: FUNCTION "portal_mark_invoice_paid"("p_invoice_id" bigint); Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON FUNCTION "smartstay"."portal_mark_invoice_paid"("p_invoice_id" bigint) TO "authenticated";


--
-- Name: FUNCTION "portal_record_invoice_payment"("p_invoice_id" bigint, "p_amount" numeric, "p_method" "text", "p_payment_date" timestamp with time zone, "p_notes" "text", "p_reference" "text", "p_bank_name" "text"); Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON FUNCTION "smartstay"."portal_record_invoice_payment"("p_invoice_id" bigint, "p_amount" numeric, "p_method" "text", "p_payment_date" timestamp with time zone, "p_notes" "text", "p_reference" "text", "p_bank_name" "text") TO "authenticated";


--
-- Name: FUNCTION "validate_utility_billing_cron_secret"("p_candidate" "text"); Type: ACL; Schema: smartstay; Owner: postgres
--

REVOKE ALL ON FUNCTION "smartstay"."validate_utility_billing_cron_secret"("p_candidate" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "smartstay"."validate_utility_billing_cron_secret"("p_candidate" "text") TO "service_role";


--
-- Name: TABLE "assets"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."assets" TO "anon";
GRANT ALL ON TABLE "smartstay"."assets" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."assets" TO "service_role";


--
-- Name: SEQUENCE "assets_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."assets_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."assets_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."assets_id_seq" TO "service_role";


--
-- Name: TABLE "audit_logs"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."audit_logs" TO "anon";
GRANT ALL ON TABLE "smartstay"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."audit_logs" TO "service_role";


--
-- Name: SEQUENCE "audit_logs_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."audit_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."audit_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."audit_logs_id_seq" TO "service_role";


--
-- Name: TABLE "balance_history"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."balance_history" TO "anon";
GRANT ALL ON TABLE "smartstay"."balance_history" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."balance_history" TO "service_role";


--
-- Name: SEQUENCE "balance_history_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."balance_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."balance_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."balance_history_id_seq" TO "service_role";


--
-- Name: TABLE "billing_runs"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."billing_runs" TO "anon";
GRANT ALL ON TABLE "smartstay"."billing_runs" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."billing_runs" TO "service_role";


--
-- Name: SEQUENCE "billing_runs_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."billing_runs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."billing_runs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."billing_runs_id_seq" TO "service_role";


--
-- Name: TABLE "building_images"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."building_images" TO "anon";
GRANT ALL ON TABLE "smartstay"."building_images" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."building_images" TO "service_role";


--
-- Name: SEQUENCE "building_images_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."building_images_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."building_images_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."building_images_id_seq" TO "service_role";


--
-- Name: TABLE "buildings"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."buildings" TO "anon";
GRANT ALL ON TABLE "smartstay"."buildings" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."buildings" TO "service_role";


--
-- Name: SEQUENCE "buildings_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."buildings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."buildings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."buildings_id_seq" TO "service_role";


--
-- Name: TABLE "contract_renewals"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."contract_renewals" TO "anon";
GRANT ALL ON TABLE "smartstay"."contract_renewals" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."contract_renewals" TO "service_role";


--
-- Name: SEQUENCE "contract_renewals_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."contract_renewals_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."contract_renewals_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."contract_renewals_id_seq" TO "service_role";


--
-- Name: TABLE "contract_services"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."contract_services" TO "anon";
GRANT ALL ON TABLE "smartstay"."contract_services" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."contract_services" TO "service_role";


--
-- Name: SEQUENCE "contract_services_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."contract_services_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."contract_services_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."contract_services_id_seq" TO "service_role";


--
-- Name: TABLE "contract_tenants"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."contract_tenants" TO "anon";
GRANT ALL ON TABLE "smartstay"."contract_tenants" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."contract_tenants" TO "service_role";


--
-- Name: SEQUENCE "contract_tenants_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."contract_tenants_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."contract_tenants_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."contract_tenants_id_seq" TO "service_role";


--
-- Name: TABLE "contract_terminations"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."contract_terminations" TO "anon";
GRANT ALL ON TABLE "smartstay"."contract_terminations" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."contract_terminations" TO "service_role";


--
-- Name: SEQUENCE "contract_terminations_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."contract_terminations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."contract_terminations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."contract_terminations_id_seq" TO "service_role";


--
-- Name: TABLE "contracts"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."contracts" TO "anon";
GRANT ALL ON TABLE "smartstay"."contracts" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."contracts" TO "service_role";


--
-- Name: SEQUENCE "contracts_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."contracts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."contracts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."contracts_id_seq" TO "service_role";


--
-- Name: TABLE "invoice_items"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."invoice_items" TO "anon";
GRANT ALL ON TABLE "smartstay"."invoice_items" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."invoice_items" TO "service_role";


--
-- Name: SEQUENCE "invoice_items_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."invoice_items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."invoice_items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."invoice_items_id_seq" TO "service_role";


--
-- Name: TABLE "invoice_utility_overrides"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."invoice_utility_overrides" TO "anon";
GRANT ALL ON TABLE "smartstay"."invoice_utility_overrides" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."invoice_utility_overrides" TO "service_role";


--
-- Name: SEQUENCE "invoice_utility_overrides_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."invoice_utility_overrides_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."invoice_utility_overrides_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."invoice_utility_overrides_id_seq" TO "service_role";


--
-- Name: TABLE "invoice_utility_snapshots"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."invoice_utility_snapshots" TO "anon";
GRANT ALL ON TABLE "smartstay"."invoice_utility_snapshots" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."invoice_utility_snapshots" TO "service_role";


--
-- Name: SEQUENCE "invoice_utility_snapshots_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."invoice_utility_snapshots_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."invoice_utility_snapshots_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."invoice_utility_snapshots_id_seq" TO "service_role";


--
-- Name: TABLE "invoices"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."invoices" TO "anon";
GRANT ALL ON TABLE "smartstay"."invoices" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."invoices" TO "service_role";


--
-- Name: SEQUENCE "invoices_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."invoices_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."invoices_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."invoices_id_seq" TO "service_role";


--
-- Name: TABLE "maintenance_logs"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."maintenance_logs" TO "anon";
GRANT ALL ON TABLE "smartstay"."maintenance_logs" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."maintenance_logs" TO "service_role";


--
-- Name: SEQUENCE "maintenance_logs_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."maintenance_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."maintenance_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."maintenance_logs_id_seq" TO "service_role";


--
-- Name: TABLE "meter_readings"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."meter_readings" TO "anon";
GRANT ALL ON TABLE "smartstay"."meter_readings" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."meter_readings" TO "service_role";


--
-- Name: SEQUENCE "meter_readings_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."meter_readings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."meter_readings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."meter_readings_id_seq" TO "service_role";


--
-- Name: TABLE "notifications"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."notifications" TO "anon";
GRANT ALL ON TABLE "smartstay"."notifications" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."notifications" TO "service_role";


--
-- Name: TABLE "payment_attempts"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."payment_attempts" TO "anon";
GRANT ALL ON TABLE "smartstay"."payment_attempts" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."payment_attempts" TO "service_role";


--
-- Name: SEQUENCE "payment_attempts_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."payment_attempts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."payment_attempts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."payment_attempts_id_seq" TO "service_role";


--
-- Name: TABLE "payments"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."payments" TO "anon";
GRANT ALL ON TABLE "smartstay"."payments" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."payments" TO "service_role";


--
-- Name: SEQUENCE "payments_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."payments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."payments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."payments_id_seq" TO "service_role";


--
-- Name: TABLE "permissions"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."permissions" TO "anon";
GRANT ALL ON TABLE "smartstay"."permissions" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."permissions" TO "service_role";


--
-- Name: TABLE "system_settings"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."system_settings" TO "anon";
GRANT ALL ON TABLE "smartstay"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."system_settings" TO "service_role";


--
-- Name: TABLE "portal_payment_settings"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."portal_payment_settings" TO "anon";
GRANT ALL ON TABLE "smartstay"."portal_payment_settings" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."portal_payment_settings" TO "service_role";


--
-- Name: TABLE "profiles"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."profiles" TO "anon";
GRANT ALL ON TABLE "smartstay"."profiles" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."profiles" TO "service_role";


--
-- Name: TABLE "public_profiles"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."public_profiles" TO "anon";
GRANT ALL ON TABLE "smartstay"."public_profiles" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."public_profiles" TO "service_role";


--
-- Name: TABLE "rooms"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."rooms" TO "anon";
GRANT ALL ON TABLE "smartstay"."rooms" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."rooms" TO "service_role";


--
-- Name: TABLE "public_room_listings"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."public_room_listings" TO "anon";
GRANT ALL ON TABLE "smartstay"."public_room_listings" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."public_room_listings" TO "service_role";


--
-- Name: TABLE "rental_applications"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."rental_applications" TO "anon";
GRANT ALL ON TABLE "smartstay"."rental_applications" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."rental_applications" TO "service_role";


--
-- Name: SEQUENCE "rental_applications_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."rental_applications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."rental_applications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."rental_applications_id_seq" TO "service_role";


--
-- Name: TABLE "role_permissions"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."role_permissions" TO "anon";
GRANT ALL ON TABLE "smartstay"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."role_permissions" TO "service_role";


--
-- Name: TABLE "roles"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."roles" TO "anon";
GRANT ALL ON TABLE "smartstay"."roles" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."roles" TO "service_role";


--
-- Name: TABLE "room_assets"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."room_assets" TO "anon";
GRANT ALL ON TABLE "smartstay"."room_assets" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."room_assets" TO "service_role";


--
-- Name: SEQUENCE "room_assets_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."room_assets_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."room_assets_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."room_assets_id_seq" TO "service_role";


--
-- Name: TABLE "room_images"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."room_images" TO "anon";
GRANT ALL ON TABLE "smartstay"."room_images" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."room_images" TO "service_role";


--
-- Name: SEQUENCE "room_images_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."room_images_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."room_images_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."room_images_id_seq" TO "service_role";


--
-- Name: TABLE "room_status_history"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."room_status_history" TO "anon";
GRANT ALL ON TABLE "smartstay"."room_status_history" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."room_status_history" TO "service_role";


--
-- Name: SEQUENCE "room_status_history_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."room_status_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."room_status_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."room_status_history_id_seq" TO "service_role";


--
-- Name: SEQUENCE "rooms_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."rooms_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."rooms_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."rooms_id_seq" TO "service_role";


--
-- Name: SEQUENCE "seq_contract_code"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."seq_contract_code" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."seq_contract_code" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."seq_contract_code" TO "service_role";


--
-- Name: SEQUENCE "seq_invoice_code"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."seq_invoice_code" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."seq_invoice_code" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."seq_invoice_code" TO "service_role";


--
-- Name: SEQUENCE "seq_payment_code"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."seq_payment_code" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."seq_payment_code" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."seq_payment_code" TO "service_role";


--
-- Name: SEQUENCE "seq_ticket_code"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."seq_ticket_code" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."seq_ticket_code" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."seq_ticket_code" TO "service_role";


--
-- Name: TABLE "service_prices"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."service_prices" TO "anon";
GRANT ALL ON TABLE "smartstay"."service_prices" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."service_prices" TO "service_role";


--
-- Name: SEQUENCE "service_prices_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."service_prices_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."service_prices_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."service_prices_id_seq" TO "service_role";


--
-- Name: TABLE "services"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."services" TO "anon";
GRANT ALL ON TABLE "smartstay"."services" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."services" TO "service_role";


--
-- Name: SEQUENCE "services_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."services_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."services_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."services_id_seq" TO "service_role";


--
-- Name: TABLE "tenant_balances"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."tenant_balances" TO "anon";
GRANT ALL ON TABLE "smartstay"."tenant_balances" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."tenant_balances" TO "service_role";


--
-- Name: SEQUENCE "tenant_balances_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."tenant_balances_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."tenant_balances_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."tenant_balances_id_seq" TO "service_role";


--
-- Name: TABLE "tenants"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."tenants" TO "anon";
GRANT ALL ON TABLE "smartstay"."tenants" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."tenants" TO "service_role";


--
-- Name: SEQUENCE "tenants_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."tenants_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."tenants_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."tenants_id_seq" TO "service_role";


--
-- Name: TABLE "ticket_comments"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."ticket_comments" TO "anon";
GRANT ALL ON TABLE "smartstay"."ticket_comments" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."ticket_comments" TO "service_role";


--
-- Name: SEQUENCE "ticket_comments_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."ticket_comments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."ticket_comments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."ticket_comments_id_seq" TO "service_role";


--
-- Name: TABLE "tickets"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."tickets" TO "anon";
GRANT ALL ON TABLE "smartstay"."tickets" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."tickets" TO "service_role";


--
-- Name: SEQUENCE "tickets_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."tickets_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."tickets_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."tickets_id_seq" TO "service_role";


--
-- Name: TABLE "utility_policies"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."utility_policies" TO "anon";
GRANT ALL ON TABLE "smartstay"."utility_policies" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."utility_policies" TO "service_role";


--
-- Name: SEQUENCE "utility_policies_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."utility_policies_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."utility_policies_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."utility_policies_id_seq" TO "service_role";


--
-- Name: TABLE "utility_policy_device_adjustments"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."utility_policy_device_adjustments" TO "anon";
GRANT ALL ON TABLE "smartstay"."utility_policy_device_adjustments" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."utility_policy_device_adjustments" TO "service_role";


--
-- Name: SEQUENCE "utility_policy_device_adjustments_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."utility_policy_device_adjustments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."utility_policy_device_adjustments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."utility_policy_device_adjustments_id_seq" TO "service_role";


--
-- Name: TABLE "vw_room_assets_warranty"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."vw_room_assets_warranty" TO "anon";
GRANT ALL ON TABLE "smartstay"."vw_room_assets_warranty" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."vw_room_assets_warranty" TO "service_role";


--
-- Name: TABLE "webhook_logs"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON TABLE "smartstay"."webhook_logs" TO "anon";
GRANT ALL ON TABLE "smartstay"."webhook_logs" TO "authenticated";
GRANT ALL ON TABLE "smartstay"."webhook_logs" TO "service_role";


--
-- Name: SEQUENCE "webhook_logs_id_seq"; Type: ACL; Schema: smartstay; Owner: postgres
--

GRANT ALL ON SEQUENCE "smartstay"."webhook_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "smartstay"."webhook_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "smartstay"."webhook_logs_id_seq" TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: smartstay; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "smartstay" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "smartstay" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "smartstay" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: smartstay; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "smartstay" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "smartstay" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "smartstay" GRANT ALL ON TABLES TO "service_role";


--
-- PostgreSQL database dump complete
--

-- \unrestrict MXEdJ8bStjOcK2c59hcYXbPezy19NxooVT6ADU3EPBDktNhEkxurMdx4eBTCxdm


--
-- Storage bootstrap retained outside schema dump so local reset also recreates the media bucket.
--
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'smartstay-files',
  'smartstay-files',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read smartstay-files" on storage.objects;
create policy "Public read smartstay-files"
on storage.objects
for select
to public
using (bucket_id = 'smartstay-files');

drop policy if exists "Authenticated upload smartstay-files" on storage.objects;
create policy "Authenticated upload smartstay-files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'smartstay-files');

drop policy if exists "Authenticated delete smartstay-files" on storage.objects;
create policy "Authenticated delete smartstay-files"
on storage.objects
for delete
to authenticated
using (bucket_id = 'smartstay-files');
