create unique index if not exists invoices_contract_period_unique_idx
  on smartstay.invoices (contract_id, billing_period)
  where billing_period is not null and status <> 'cancelled';
