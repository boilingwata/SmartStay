set check_function_bodies = off;
set search_path = smartstay, public;

-- Atomic balance adjustment: updates tenant_balances + inserts balance_history in one transaction.
-- Called by the adjust-balance Edge Function via supabase.rpc().
create or replace function smartstay.adjust_balance(
  p_tenant_id        bigint,
  p_amount           numeric,
  p_transaction_type text,
  p_notes            text,
  p_invoice_id       bigint  default null,
  p_created_by       uuid    default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_bal        record;
  v_history_id bigint;
  v_after      numeric;
begin
  -- Lock the balance row
  select id, balance
  into v_bal
  from smartstay.tenant_balances
  where tenant_id = p_tenant_id
  for update;

  if not found then
    raise exception 'Tenant balance not found for tenant %', p_tenant_id;
  end if;

  v_after := coalesce(v_bal.balance, 0) + p_amount;

  -- Insert history entry (balance_id is required FK to tenant_balances.id)
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
    p_transaction_type,
    p_amount,
    coalesce(v_bal.balance, 0),
    v_after,
    p_notes,
    p_invoice_id,
    p_created_by
  )
  returning id into v_history_id;

  -- Update balance
  update smartstay.tenant_balances
  set balance = v_after, last_updated = now()
  where id = v_bal.id;

  return jsonb_build_object(
    'historyId',     v_history_id,
    'balanceBefore', coalesce(v_bal.balance, 0),
    'balanceAfter',  v_after
  );
end;
$$;
