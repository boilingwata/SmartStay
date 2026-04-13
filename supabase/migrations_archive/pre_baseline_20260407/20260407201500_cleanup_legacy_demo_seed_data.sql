begin;

delete from smartstay.payment_attempts
where invoice_id in (
  select id
  from smartstay.invoices
  where notes in (
    'Demo invoice 2,000 VND for SePay auto-approval test',
    'Fresh demo invoice 2,000 VND reserved for manual demo',
    'Fresh demo invoice 2,000 VND reserved for later demo'
  )
);

delete from smartstay.payments
where invoice_id in (
  select id
  from smartstay.invoices
  where notes in (
    'Demo invoice 2,000 VND for SePay auto-approval test',
    'Fresh demo invoice 2,000 VND reserved for manual demo',
    'Fresh demo invoice 2,000 VND reserved for later demo'
  )
);

delete from smartstay.invoice_items
where invoice_id in (
  select id
  from smartstay.invoices
  where notes in (
    'Demo invoice 2,000 VND for SePay auto-approval test',
    'Fresh demo invoice 2,000 VND reserved for manual demo',
    'Fresh demo invoice 2,000 VND reserved for later demo'
  )
);

delete from smartstay.invoices
where notes in (
  'Demo invoice 2,000 VND for SePay auto-approval test',
  'Fresh demo invoice 2,000 VND reserved for manual demo',
  'Fresh demo invoice 2,000 VND reserved for later demo'
);

delete from smartstay.contract_services
where contract_id in (
  select c.id
  from smartstay.contracts c
  join smartstay.contract_tenants ct on ct.contract_id = c.id
  join smartstay.tenants t on t.id = ct.tenant_id
  where t.phone = '0911222333'
    and c.monthly_rent = 2000
);

delete from smartstay.contract_tenants
where contract_id in (
  select c.id
  from smartstay.contracts c
  join smartstay.contract_tenants ct on ct.contract_id = c.id
  join smartstay.tenants t on t.id = ct.tenant_id
  where t.phone = '0911222333'
    and c.monthly_rent = 2000
);

update smartstay.rooms
set status = 'available'::smartstay.room_status
where id in (
  select c.room_id
  from smartstay.contracts c
  join smartstay.contract_tenants ct on ct.contract_id = c.id
  join smartstay.tenants t on t.id = ct.tenant_id
  where t.phone = '0911222333'
    and c.monthly_rent = 2000
);

delete from smartstay.contracts
where id in (
  select c.id
  from smartstay.contracts c
  join smartstay.contract_tenants ct on ct.contract_id = c.id
  join smartstay.tenants t on t.id = ct.tenant_id
  where t.phone = '0911222333'
    and c.monthly_rent = 2000
);

delete from smartstay.tenant_balances
where tenant_id in (
  select id
  from smartstay.tenants
  where phone = '0911222333'
);

delete from smartstay.tenants
where phone = '0911222333'
  and full_name = 'Nguyễn Văn Cư Dân';

commit;
