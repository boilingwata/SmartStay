-- Operate only on objects in the `smartstay` schema.
set check_function_bodies = off;
set search_path = smartstay;

drop policy if exists authenticated_select_tickets on smartstay.tickets;
drop policy if exists tenant_select_own_tickets on smartstay.tickets;
create policy tenant_select_own_tickets
on smartstay.tickets
for select
to authenticated
using (
  exists (
    select 1
    from smartstay.tenants t
    where t.id = tickets.tenant_id
      and t.profile_id = auth.uid()
      and coalesce(t.is_deleted, false) = false
  )
);

drop policy if exists tenant_insert_own_tickets on smartstay.tickets;
create policy tenant_insert_own_tickets
on smartstay.tickets
for insert
to authenticated
with check (
  exists (
    select 1
    from smartstay.tenants t
    where t.id = tickets.tenant_id
      and t.profile_id = auth.uid()
      and coalesce(t.is_deleted, false) = false
  )
);

drop policy if exists authenticated_select_ticket_comments on smartstay.ticket_comments;
drop policy if exists tenant_select_own_ticket_comments on smartstay.ticket_comments;
create policy tenant_select_own_ticket_comments
on smartstay.ticket_comments
for select
to authenticated
using (
  exists (
    select 1
    from smartstay.tickets tk
    join smartstay.tenants t on t.id = tk.tenant_id
    where tk.id = ticket_comments.ticket_id
      and t.profile_id = auth.uid()
      and coalesce(t.is_deleted, false) = false
  )
);

drop policy if exists tenant_insert_own_ticket_comments on smartstay.ticket_comments;
create policy tenant_insert_own_ticket_comments
on smartstay.ticket_comments
for insert
to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1
    from smartstay.tickets tk
    join smartstay.tenants t on t.id = tk.tenant_id
    where tk.id = ticket_comments.ticket_id
      and t.profile_id = auth.uid()
      and coalesce(t.is_deleted, false) = false
  )
);
