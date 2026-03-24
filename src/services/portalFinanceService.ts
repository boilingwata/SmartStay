import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { TenantBalance, TenantBalanceTransaction, TransactionType } from '@/models/TenantBalance';
import { mapInvoiceStatus } from '@/lib/enumMaps';

// ---------------------------------------------------------------------------
// Internal DB row shapes
// ---------------------------------------------------------------------------

interface DbBalanceRow {
  tenant_id: number;
  balance: number;
  last_updated: string | null;
}

interface DbBalanceHistoryRow {
  id: number;
  tenant_id: number;
  transaction_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  notes: string | null;
  invoice_id: number | null;
  created_at: string | null;
}

interface DbInvoiceRow {
  id: number;
  invoice_code: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  due_date: string;
  status: string | null;
  billing_period: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getCurrentTenantId(): Promise<number | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const tenants = await unwrap(
    supabase
      .from('tenants')
      .select('id')
      .eq('profile_id', user.id)
      .eq('is_deleted', false)
      .limit(1)
  ) as unknown as { id: number }[];

  return tenants?.[0]?.id ?? null;
}

function mapTransactionType(dbType: string): TransactionType {
  const map: Record<string, TransactionType> = {
    deposit: 'ManualTopUp',
    deduction: 'ManualDeduct',
    refund: 'Refund',
    adjustment: 'Correction',
    payment: 'Payment',
    overpayment: 'Overpayment',
    auto_offset: 'AutoOffset',
  };
  return map[dbType] ?? 'Other';
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const portalFinanceService = {
  /**
   * RULE-05: Real-time balance — no cache, always fetched fresh.
   */
  getFreshBalance: async (): Promise<TenantBalance> => {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) {
      return {
        tenantId: '',
        currentBalance: 0,
        totalPaid: 0,
        totalUnpaid: 0,
        lastUpdated: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      };
    }

    const row = await unwrap(
      supabase
        .from('tenant_balances')
        .select('tenant_id, balance, last_updated')
        .eq('tenant_id', tenantId)
        .single()
    ) as unknown as DbBalanceRow;

    // Also compute total paid / unpaid from invoices
    const contractLinks = await unwrap(
      supabase
        .from('contract_tenants')
        .select('contract_id')
        .eq('tenant_id', tenantId)
    ) as unknown as { contract_id: number }[];

    let totalPaid = 0;
    let totalUnpaid = 0;

    if (contractLinks && contractLinks.length > 0) {
      const contractIds = contractLinks.map(cl => cl.contract_id);
      const invoices = await unwrap(
        supabase
          .from('invoices')
          .select('amount_paid, balance_due, status')
          .in('contract_id', contractIds)
      ) as unknown as { amount_paid: number; balance_due: number; status: string | null }[];

      for (const inv of invoices ?? []) {
        totalPaid += inv.amount_paid ?? 0;
        if (inv.status !== 'paid' && inv.status !== 'cancelled') {
          totalUnpaid += inv.balance_due ?? 0;
        }
      }
    }

    return {
      tenantId: String(row.tenant_id),
      currentBalance: row.balance ?? 0,
      totalPaid,
      totalUnpaid,
      lastUpdated: row.last_updated ?? new Date().toISOString(),
      lastUpdatedAt: row.last_updated ?? new Date().toISOString(),
    };
  },

  /**
   * RULE-07: Immutable Ledger — returns all balance_history rows for the tenant.
   */
  getBalanceTransactions: async (): Promise<{ items: TenantBalanceTransaction[] }> => {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return { items: [] };

    const rows = await unwrap(
      supabase
        .from('balance_history')
        .select('id, tenant_id, transaction_type, amount, balance_before, balance_after, notes, invoice_id, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
    ) as unknown as DbBalanceHistoryRow[];

    const items: TenantBalanceTransaction[] = (rows ?? []).map(r => ({
      id: String(r.id),
      tenantId: String(r.tenant_id),
      type: mapTransactionType(r.transaction_type),
      amount: r.amount,
      balanceBefore: r.balance_before,
      balanceAfter: r.balance_after,
      description: r.notes ?? '',
      relatedInvoiceId: r.invoice_id != null ? String(r.invoice_id) : undefined,
      createdAt: r.created_at ?? new Date().toISOString(),
    }));

    return { items };
  },

  getPaymentHistory: async (): Promise<{ items: any[] }> => {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return { items: [] };

    const contractLinks = await unwrap(
      supabase
        .from('contract_tenants')
        .select('contract_id')
        .eq('tenant_id', tenantId)
    ) as unknown as { contract_id: number }[];

    if (!contractLinks || contractLinks.length === 0) return { items: [] };

    const contractIds = contractLinks.map(cl => cl.contract_id);

    const invoiceRows = await unwrap(
      supabase
        .from('invoices')
        .select('id')
        .in('contract_id', contractIds)
    ) as unknown as { id: number }[];

    if (!invoiceRows || invoiceRows.length === 0) return { items: [] };

    const invoiceIds = invoiceRows.map(r => r.id);

    const payments = await unwrap(
      supabase
        .from('payments')
        .select('id, payment_code, amount, method, payment_date, notes, invoice_id')
        .in('invoice_id', invoiceIds)
        .order('payment_date', { ascending: false })
    ) as unknown as any[];

    const items = (payments ?? []).map((p: any) => ({
      id: p.payment_code ?? String(p.id),
      amount: p.amount,
      method: p.method ?? 'Transfer',
      status: 'Success',
      createdAt: p.payment_date,
      description: p.notes ?? `Thanh toán hóa đơn`,
      invoiceId: String(p.invoice_id),
    }));

    return { items };
  },

  getInvoices: async (): Promise<any[]> => {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return [];

    const contractLinks = await unwrap(
      supabase
        .from('contract_tenants')
        .select('contract_id')
        .eq('tenant_id', tenantId)
    ) as unknown as { contract_id: number }[];

    if (!contractLinks || contractLinks.length === 0) return [];

    const contractIds = contractLinks.map(cl => cl.contract_id);

    const rows = await unwrap(
      supabase
        .from('invoices')
        .select('id, invoice_code, total_amount, amount_paid, balance_due, due_date, status, billing_period')
        .in('contract_id', contractIds)
        .order('due_date', { ascending: false })
    ) as unknown as DbInvoiceRow[];

    return (rows ?? []).map(r => ({
      id: String(r.id),
      invoiceCode: r.invoice_code,
      totalAmount: r.total_amount,
      paidAmount: r.amount_paid,
      balanceDue: r.balance_due,
      dueDate: r.due_date,
      status: mapInvoiceStatus.fromDb(r.status ?? 'draft'),
      period: r.billing_period?.slice(0, 7) ?? '',
    }));
  },
};

export default portalFinanceService;
