begin;

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net;

create or replace function smartstay.schedule_monthly_utility_billing_job(
  job_name text default 'smartstay-monthly-utility-billing'
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

comment on function smartstay.schedule_monthly_utility_billing_job(text)
is 'Schedule cron-safe monthly utility billing trigger. Job runs daily at 17:05 UTC and the edge function only executes on day 1 in Asia/Saigon.';

create or replace function smartstay.unschedule_monthly_utility_billing_job(
  job_name text default 'smartstay-monthly-utility-billing'
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select cron.unschedule(job_name);
$$;

comment on function smartstay.unschedule_monthly_utility_billing_job(text)
is 'Remove the recurring utility billing cron job.';

commit;
