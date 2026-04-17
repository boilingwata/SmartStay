import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { mapInvoiceStatus, mapPaymentMethod } from '@/lib/enumMaps';
import { TenantBalance, TenantBalanceTransaction, TransactionType } from '@/models/TenantBalance';
import type { Database } from '@/types/supabase';

type DbPaymentAttemptMethod = Database['smartstay']['Enums']['payment_attempt_method'];
type DbPaymentStatus = Database['smartstay']['Enums']['payment_status'];

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

interface DbPaymentHistoryRow {
  id: number;
  payment_code: string | null;
  amount: number;
  method: string | null;
  payment_date: string;
  confirmed_at: string | null;
  notes: string | null;
  invoice_id: number;
  payment_attempt_id: number | null;
  reference_number: string | null;
  bank_name: string | null;
}

interface DbPaymentAttemptHistoryRow {
  id: number;
  invoice_id: number;
  amount: number;
  method: DbPaymentAttemptMethod;
  status: DbPaymentStatus;
  reference_number: string | null;
  bank_name: string | null;
  notes: string | null;
  rejection_reason: string | null;
  payment_id: number | null;
  created_at: string | null;
}

export interface PortalPaymentHistoryItem {
  id: string;
  code: string;
  amount: number;
  method: string;
  status: 'Pending' | 'Confirmed' | 'Rejected' | 'Cancelled';
  createdAt: string;
  description: string;
  invoiceId: string;
  invoiceCode: string;
  referenceNumber: string | null;
  bankName: string | null;
  source: 'payment' | 'attempt';
}

async function getCurrentTenantId(): Promise<number | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error('Not authenticated');

  const tenants = (await unwrap(
    supabase
      .from('tenants')
      .select('id')
      .eq('profile_id', user.id)
      .eq('is_deleted', false)
      .limit(1)
  )) as unknown as { id: number }[];

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

function normalizeAttemptMethod(method: DbPaymentAttemptMethod): string {
  if (method === 'bank_transfer') return mapPaymentMethod.fromDb('bank_transfer');
  if (method === 'cash') return mapPaymentMethod.fromDb('cash');
  return mapPaymentMethod.fromDb('momo');
}

function mapAttemptStatus(status: DbPaymentStatus): PortalPaymentHistoryItem['status'] {
  if (status === 'succeeded') return 'Confirmed';
  if (status === 'failed' || status === 'rejected') return 'Rejected';
  if (status === 'cancelled') return 'Cancelled';
  return 'Pending';
}

function mapAttemptDescription(attempt: DbPaymentAttemptHistoryRow): string {
  if (attempt.rejection_reason) {
    return `Bi tu choi: ${attempt.rejection_reason}`;
  }

  const trimmedNote = attempt.notes?.trim();
  if (trimmedNote) {
    return trimmedNote;
  }

  if (attempt.method === 'bank_transfer') {
    return 'Yeu cau chuyen khoan dang cho doi soat';
  }

  if (attempt.method === 'momo') {
    return 'Yeu cau thanh toan dien tu dang xu ly';
  }

  return 'Yeu cau thanh toan dang cho xac nhan';
}

export const portalFinanceService = {
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

    const row = (await unwrap(
      supabase
        .from('tenant_balances')
        .select('tenant_id, balance, last_updated')
        .eq('tenant_id', tenantId)
        .maybeSingle()
    )) as unknown as DbBalanceRow | null;

    if (!row) {
      return {
        tenantId: String(tenantId),
        currentBalance: 0,
        totalPaid: 0,
        totalUnpaid: 0,
        lastUpdated: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      };
    }

    const contractLinks = (await unwrap(
      supabase.from('contract_tenants').select('contract_id').eq('tenant_id', tenantId)
    )) as unknown as { contract_id: number }[];

    let totalPaid = 0;
    let totalUnpaid = 0;

    if (contractLinks.length > 0) {
      const contractIds = contractLinks.map((link) => link.contract_id);
      const invoices = (await unwrap(
        supabase
          .from('invoices')
          .select('amount_paid, balance_due, status')
          .in('contract_id', contractIds)
      )) as unknown as { amount_paid: number; balance_due: number; status: string | null }[];

      for (const invoice of invoices ?? []) {
        totalPaid += invoice.amount_paid ?? 0;
        if (invoice.status !== 'paid' && invoice.status !== 'cancelled') {
          totalUnpaid += invoice.balance_due ?? 0;
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

  getBalanceTransactions: async (): Promise<{ items: TenantBalanceTransaction[] }> => {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return { items: [] };

    const rows = (await unwrap(
      supabase
        .from('balance_history')
        .select('id, tenant_id, transaction_type, amount, balance_before, balance_after, notes, invoice_id, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
    )) as unknown as DbBalanceHistoryRow[];

    const items: TenantBalanceTransaction[] = (rows ?? []).map((row) => ({
      id: String(row.id),
      tenantId: String(row.tenant_id),
      type: mapTransactionType(row.transaction_type),
      amount: row.amount,
      balanceBefore: row.balance_before,
      balanceAfter: row.balance_after,
      description: row.notes ?? '',
      relatedInvoiceId: row.invoice_id != null ? String(row.invoice_id) : undefined,
      createdAt: row.created_at ?? new Date().toISOString(),
    }));

    return { items };
  },

  getPaymentHistory: async (): Promise<{ items: PortalPaymentHistoryItem[] }> => {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return { items: [] };

    const contractLinks = (await unwrap(
      supabase.from('contract_tenants').select('contract_id').eq('tenant_id', tenantId)
    )) as unknown as { contract_id: number }[];

    if (contractLinks.length === 0) return { items: [] };

    const contractIds = contractLinks.map((link) => link.contract_id);
    const invoiceRows = (await unwrap(
      supabase.from('invoices').select('id, invoice_code').in('contract_id', contractIds)
    )) as unknown as Pick<DbInvoiceRow, 'id' | 'invoice_code'>[];

    if (invoiceRows.length === 0) return { items: [] };

    const invoiceIds = invoiceRows.map((row) => row.id);
    const invoiceCodeById = new Map(invoiceRows.map((row) => [row.id, row.invoice_code]));

    const [payments, attempts] = await Promise.all([
      unwrap(
        supabase
          .from('payments')
          .select('id, payment_code, amount, method, payment_date, confirmed_at, notes, invoice_id, payment_attempt_id, reference_number, bank_name')
          .in('invoice_id', invoiceIds)
          .order('payment_date', { ascending: false })
      ) as unknown as Promise<DbPaymentHistoryRow[]>,
      unwrap(
        supabase
          .from('payment_attempts')
          .select('id, invoice_id, amount, method, status, reference_number, bank_name, notes, rejection_reason, payment_id, created_at')
          .in('invoice_id', invoiceIds)
          .order('created_at', { ascending: false })
      ) as unknown as Promise<DbPaymentAttemptHistoryRow[]>,
    ]);

    const linkedAttemptIds = new Set(
      (payments ?? [])
        .map((payment) => payment.payment_attempt_id)
        .filter((value): value is number => value != null)
    );

    const paymentItems: PortalPaymentHistoryItem[] = (payments ?? []).map((payment) => {
      let status: PortalPaymentHistoryItem['status'] = 'Pending';
      if (payment.confirmed_at) status = 'Confirmed';
      else if (payment.notes?.startsWith('[REJECTED]')) status = 'Rejected';

      return {
        id: `payment-${payment.id}`,
        code: payment.payment_code ?? `PAY-${payment.id}`,
        amount: payment.amount,
        method: mapPaymentMethod.fromDb(payment.method ?? 'cash'),
        status,
        createdAt: payment.payment_date,
        description:
          payment.notes && !payment.notes.startsWith('[REJECTED]')
            ? payment.notes
            : 'Thanh toan hoa don',
        invoiceId: String(payment.invoice_id),
        invoiceCode: invoiceCodeById.get(payment.invoice_id) ?? `INV-${payment.invoice_id}`,
        referenceNumber: payment.reference_number,
        bankName: payment.bank_name,
        source: 'payment',
      };
    });

    const attemptItems: PortalPaymentHistoryItem[] = (attempts ?? [])
      .filter((attempt) => attempt.payment_id == null && !linkedAttemptIds.has(attempt.id))
      .map((attempt) => ({
        id: `attempt-${attempt.id}`,
        code: attempt.reference_number ?? `REQ-${attempt.id}`,
        amount: attempt.amount,
        method: normalizeAttemptMethod(attempt.method),
        status: mapAttemptStatus(attempt.status),
        createdAt: attempt.created_at ?? new Date().toISOString(),
        description: mapAttemptDescription(attempt),
        invoiceId: String(attempt.invoice_id),
        invoiceCode: invoiceCodeById.get(attempt.invoice_id) ?? `INV-${attempt.invoice_id}`,
        referenceNumber: attempt.reference_number,
        bankName: attempt.bank_name,
        source: 'attempt',
      }));

    const items = [...paymentItems, ...attemptItems].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );

    return { items };
  },

  getInvoices: async (): Promise<any[]> => {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return [];

    const contractLinks = (await unwrap(
      supabase.from('contract_tenants').select('contract_id').eq('tenant_id', tenantId)
    )) as unknown as { contract_id: number }[];

    if (contractLinks.length === 0) return [];

    const contractIds = contractLinks.map((link) => link.contract_id);
    const rows = (await unwrap(
      supabase
        .from('invoices')
        .select('id, invoice_code, total_amount, amount_paid, balance_due, due_date, status, billing_period')
        .in('contract_id', contractIds)
        .order('due_date', { ascending: false })
    )) as unknown as DbInvoiceRow[];

    return (rows ?? []).map((row) => ({
      id: String(row.id),
      invoiceCode: row.invoice_code,
      totalAmount: row.total_amount,
      paidAmount: row.amount_paid,
      balanceDue: row.balance_due,
      dueDate: row.due_date,
      status: mapInvoiceStatus.fromDb(row.status ?? 'draft'),
      period: row.billing_period?.slice(0, 7) ?? '',
    }));
  },
};

export default portalFinanceService;
