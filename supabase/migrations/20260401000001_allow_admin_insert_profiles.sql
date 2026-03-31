-- Allow admin/manager/landlord roles to insert arbitrary profile rows.
-- The default "insert own" policy blocks inserts where id ≠ auth.uid(),
-- which prevents admins from creating owner/staff profiles server-side.

set search_path = smartstay, public;

-- Drop the policy first if it already exists (idempotent re-run safety)
drop policy if exists "profiles_insert_admin" on smartstay.profiles;

create policy "profiles_insert_admin"
  on smartstay.profiles
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from smartstay.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'manager', 'landlord')
    )
  );
