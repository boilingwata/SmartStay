drop policy if exists tenant_select_own_ticket_comments on smartstay.ticket_comments;

create policy tenant_select_own_ticket_comments
on smartstay.ticket_comments
for select
to authenticated
using (
  exists (
    select 1
    from smartstay.tickets
    where tickets.id = ticket_comments.ticket_id
      and tickets.tenant_id in (
        select tenants.id
        from smartstay.tenants
        where tenants.profile_id = auth.uid()
          and coalesce(tenants.is_deleted, false) = false
      )
  )
  and coalesce(ticket_comments.is_internal, false) = false
);
