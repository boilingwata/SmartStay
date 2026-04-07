begin;

create policy system_settings_admin_insert
on smartstay.system_settings
for insert
to authenticated
with check ((select private.is_admin((select auth.uid()))));

create policy system_settings_admin_update
on smartstay.system_settings
for update
to authenticated
using ((select private.is_admin((select auth.uid()))))
with check ((select private.is_admin((select auth.uid()))));

create policy payments_admin_insert
on smartstay.payments
for insert
to authenticated
with check ((select private.is_admin((select auth.uid()))));

create policy payments_admin_update
on smartstay.payments
for update
to authenticated
using ((select private.is_admin((select auth.uid()))))
with check ((select private.is_admin((select auth.uid()))));

commit;
