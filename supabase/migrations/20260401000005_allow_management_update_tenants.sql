set search_path = smartstay, public;

drop policy if exists tenants_management_update on smartstay.tenants;

create policy tenants_management_update
on smartstay.tenants
for update
to authenticated
using (
  exists (
    select 1
    from smartstay.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'manager', 'staff')
  )
)
with check (
  exists (
    select 1
    from smartstay.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'manager', 'staff')
  )
);

grant update on smartstay.tenants to authenticated;
