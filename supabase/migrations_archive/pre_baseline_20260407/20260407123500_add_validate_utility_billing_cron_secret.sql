begin;

create or replace function smartstay.validate_utility_billing_cron_secret(
  p_candidate text
)
returns boolean
language sql
security definer
set search_path = ''
as $$
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

revoke all on function smartstay.validate_utility_billing_cron_secret(text) from public;
revoke all on function smartstay.validate_utility_billing_cron_secret(text) from anon;
revoke all on function smartstay.validate_utility_billing_cron_secret(text) from authenticated;
grant execute on function smartstay.validate_utility_billing_cron_secret(text) to service_role;

comment on function smartstay.validate_utility_billing_cron_secret(text)
is 'Validate the utility billing cron secret for internal automation. Execute is restricted to service_role.';

commit;
