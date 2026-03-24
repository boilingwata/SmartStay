import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { mapPaymentMethod } from '@/lib/enumMaps';
import {
  PaymentTransaction,
  PaymentStatus,
  WebhookLog,
  ChannelHealth,
  TransactionType,
} from '@/models/Payment';
import { TenantBalance, TenantBalanceTransaction } from '@/models/TenantBalance';

// ---------------------------------------------------------------------------
// Internal DB row shapes
// ---------------------------------------------------------------------------

interface DbPaymentRow {
  id: number;
  uuid: string;
  payment_code: string;
  invoice_id: number;
  amount: number;
  method: string;
  bank_name: string | null;
  reference_number: string | null;
  receipt_url: string | null;
  payment_date: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
  notes: string | null;
  created_at: string | null;
  invoices: {
    invoice_code: string;
    contracts: {
      contract_tenants: {
        tenant_id: number;
        is_primary: boolean;
        tenants: { full_name: string };
      }[];
    };
  } | null;
}

interface DbWebhookRow {
  id: number;
  provider: string;
  payload: unknown;
  received_at: string | null;
  processed_at: string | null;
  status: string | null;
  retry_count: number | null;
  error_message: string | null;
}

interface DbTenantBalanceRow {
  id: number;
  tenant_id: number;
  balance: number | null;
  last_updated: string | null;
}

interface DbBalanceHistoryRow {
  id: number;
  tenant_id: number;
  transaction_type: string;
  amount: number;
  invoice_id: number | null;
  payment_id: number | null;
  balance_before: number;
  balance_after: number;
  notes: string | null;
  created_at: string | null;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

const PAYMENT_SELECT = `
  id,
  uuid,
  payment_code,
  invoice_id,
  amount,
  method,
  bank_name,
  reference_number,
  receipt_url,
  payment_date,
  confirmed_by,
  confirmed_at,
  notes,
  created_at,
  invoices (
    invoice_code,
    contracts (
      contract_tenants (
        tenant_id,
        is_primary,
        tenants ( full_name )
      )
    )
  )
`.trim();

function deriveStatus(row: DbPaymentRow): PaymentStatus {
  if (row.confirmed_at) return 'Confirmed';
  return 'Pending';
}

function mapDbRowToPayment(row: DbPaymentRow): PaymentTransaction {
  const invoice = row.invoices;
  const contractTenants = invoice?.contracts?.contract_tenants ?? [];
  const primaryTenant =
    contractTenants.find((ct) => ct.is_primary) ?? contractTenants[0];

  return {
    id: String(row.id),
    transactionCode: row.payment_code,
    invoiceId: String(row.invoice_id),
    invoiceCode: invoice?.invoice_code ?? undefined,
    tenantId: primaryTenant ? String(primaryTenant.tenant_id) : '',
    tenantName: primaryTenant?.tenants?.full_name ?? '',
    amount: row.amount,
    method: mapPaymentMethod.fromDb(row.method) as PaymentTransaction['method'],
    status: deriveStatus(row),
    paidAt: row.payment_date,
    evidenceImage: row.receipt_url ?? undefined,
    recordedBy: row.confirmed_by ?? undefined,
    note: row.notes ?? undefined,
    createdAt: row.created_at ?? row.payment_date,
  };
}

function mapDbWebhookToLog(row: DbWebhookRow): WebhookLog {
  const payload = row.payload as Record<string, unknown>;
  return {
    id: String(row.id),
    provider: (row.provider as WebhookLog['provider']) ?? 'VNPay',
    transactionCode: (payload?.transaction_code as string) ?? '',
    amount: (payload?.amount as number) ?? 0,
    status: mapWebhookStatus(row.status ?? ''),
    receivedAt: row.received_at ?? '',
    processedAt: row.processed_at ?? undefined,
    retryCount: row.retry_count ?? 0,
    maxRetries: 3,
    payloadJson: JSON.stringify(row.payload),
  };
}

function mapWebhookStatus(dbStatus: string): WebhookLog['status'] {
  const map: Record<string, WebhookLog['status']> = {
    success: 'Processed',
    failed: 'Failed',
    retry: 'Failed',
    processing: 'Pending',
    received: 'Pending',
  };
  return map[dbStatus] ?? 'Pending';
}

function mapDbBalanceRow(row: DbTenantBalanceRow): TenantBalance {
  const now = new Date().toISOString();
  return {
    tenantId: String(row.tenant_id),
    currentBalance: row.balance ?? 0,
    lastUpdated: row.last_updated ?? now,
    lastUpdatedAt: row.last_updated ?? now,
  };
}

function mapDbHistoryRow(row: DbBalanceHistoryRow): TenantBalanceTransaction {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    amount: row.amount,
    type: mapBalanceTxType(row.transaction_type),
    description: row.notes ?? '',
    balanceBefore: row.balance_before,
    balanceAfter: row.balance_after,
    relatedInvoiceId: row.invoice_id ? String(row.invoice_id) : undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function mapBalanceTxType(dbType: string): TransactionType {
  const map: Record<string, TransactionType> = {
    deposit: 'ManualTopUp',
    adjustment: 'ManualTopUp',
    deduction: 'ManualDeduct',
    refund: 'Refund',
  };
  return (map[dbType] as TransactionType) ?? 'Other';
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const paymentService = {
  getPayments: async (filters?: {
    status?: string;
    search?: string;
    invoiceId?: string;
  }): Promise<PaymentTransaction[]> => {
    let query = supabase
      .from('payments')
      .select(PAYMENT_SELECT)
      .order('created_at', { ascending: false });

    if (filters?.invoiceId) {
      query = query.eq('invoice_id', Number(filters.invoiceId));
    }

    const rows = (await unwrap(query)) as unknown as DbPaymentRow[];
    let payments = rows.map(mapDbRowToPayment);

    // Status filtering is done in-memory because status is derived, not stored
    if (filters?.status && filters.status !== 'All') {
      payments = payments.filter((p) => p.status === filters.status);
    }

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      payments = payments.filter(
        (p) =>
          p.transactionCode.toLowerCase().includes(s) ||
          p.tenantName.toLowerCase().includes(s)
      );
    }

    return payments;
  },

  getPendingCount: async (): Promise<{ count: number; total: number }> => {
    const rows = (await unwrap(
      supabase
        .from('payments')
        .select('id, amount, confirmed_at')
        .is('confirmed_at', null)
    )) as unknown as { id: number; amount: number; confirmed_at: string | null }[];

    const pending = rows.filter((r) => !r.confirmed_at);
    return {
      count: pending.length,
      total: pending.reduce((sum, r) => sum + (r.amount ?? 0), 0),
    };
  },

  approvePayment: async (id: string): Promise<boolean> => {
    const now = new Date().toISOString();
    const { data: user } = await supabase.auth.getUser();
    await unwrap(
      supabase
        .from('payments')
        .update({ confirmed_at: now, confirmed_by: user.user?.id ?? null })
        .eq('id', Number(id))
    );
    return true;
  },

  rejectPayment: async (id: string, reason: string): Promise<boolean> => {
    // Mark with a rejection note; set confirmed_at to a sentinel value or leave null with a note
    await unwrap(
      supabase
        .from('payments')
        .update({ notes: `[REJECTED] ${reason}` })
        .eq('id', Number(id))
    );
    return true;
  },

  recordPayment: async (
    payment: Omit<PaymentTransaction, 'id' | 'createdAt'>
  ): Promise<PaymentTransaction> => {
    const row = await unwrap(
      supabase
        .from('payments')
        .insert({
          invoice_id: Number(payment.invoiceId),
          amount: payment.amount,
          method: mapPaymentMethod.toDb(payment.method) as import('@/types/supabase').DbPaymentMethod,
          payment_date: payment.paidAt,
          receipt_url: payment.evidenceImage ?? null,
          notes: payment.note ?? null,
        })
        .select(PAYMENT_SELECT)
        .single()
    ) as unknown as DbPaymentRow;

    return mapDbRowToPayment(row);
  },

  getTenantBalance: async (tenantId: string): Promise<TenantBalance> => {
    const row = (await unwrap(
      supabase
        .from('tenant_balances')
        .select('id, tenant_id, balance, last_updated')
        .eq('tenant_id', Number(tenantId))
        .maybeSingle()
    )) as unknown as DbTenantBalanceRow | null;

    if (!row) {
      const now = new Date().toISOString();
      return {
        tenantId,
        currentBalance: 0,
        lastUpdated: now,
        lastUpdatedAt: now,
      };
    }
    return mapDbBalanceRow(row);
  },

  getTenantLedger: async (tenantId: string): Promise<TenantBalanceTransaction[]> => {
    const rows = (await unwrap(
      supabase
        .from('balance_history')
        .select(
          'id, tenant_id, transaction_type, amount, invoice_id, payment_id, balance_before, balance_after, notes, created_at'
        )
        .eq('tenant_id', Number(tenantId))
        .order('created_at', { ascending: false })
    )) as unknown as DbBalanceHistoryRow[];

    return rows.map(mapDbHistoryRow);
  },

  getWebhookLogs: async (): Promise<WebhookLog[]> => {
    const rows = (await unwrap(
      supabase
        .from('webhook_logs')
        .select(
          'id, provider, payload, received_at, processed_at, status, retry_count, error_message'
        )
        .order('received_at', { ascending: false })
        .limit(200)
    )) as unknown as DbWebhookRow[];

    return rows.map(mapDbWebhookToLog);
  },

  // Channel health is not stored in DB — return empty list
  getChannelHealth: async (): Promise<ChannelHealth[]> => {
    return [];
  },

  retryWebhook: async (id: string): Promise<boolean> => {
    await unwrap(
      supabase
        .from('webhook_logs')
        .update({ status: 'retry' as import('@/types/supabase').DbWebhookStatus })
        .eq('id', Number(id))
    );
    return true;
  },

  generateCashCode: (): string => {
    return `CASH-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  },

  manualBalanceAdjustment: async (
    tenantId: string,
    amount: number,
    type: TransactionType,
    note: string
  ): Promise<TenantBalanceTransaction> => {
    // Fetch current balance first
    const balance = await paymentService.getTenantBalance(tenantId);
    const balanceBefore = balance.currentBalance;
    const balanceAfter = balanceBefore + amount;

    // Get the balance record id
    const balanceRow = (await unwrap(
      supabase
        .from('tenant_balances')
        .select('id')
        .eq('tenant_id', Number(tenantId))
        .single()
    )) as unknown as { id: number };

    const dbType = mapTransactionTypeToDb(type);

    // Insert history record
    const historyRow = (await unwrap(
      supabase
        .from('balance_history')
        .insert({
          tenant_id: Number(tenantId),
          balance_id: balanceRow.id,
          transaction_type: dbType as import('@/types/supabase').DbBalanceTransactionType,
          amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          notes: note,
        })
        .select(
          'id, tenant_id, transaction_type, amount, invoice_id, payment_id, balance_before, balance_after, notes, created_at'
        )
        .single()
    )) as unknown as DbBalanceHistoryRow;

    // Update the balance table
    await unwrap(
      supabase
        .from('tenant_balances')
        .update({ balance: balanceAfter, last_updated: new Date().toISOString() })
        .eq('tenant_id', Number(tenantId))
    );

    return mapDbHistoryRow(historyRow);
  },

  // Stub — real offset logic requires transaction-level DB support
  autoOffsetInvoices: async (
    _tenantId: string,
    _invoiceIds: string[]
  ): Promise<boolean> => {
    return true;
  },
};

function mapTransactionTypeToDb(type: TransactionType): string {
  const map: Record<TransactionType, string> = {
    ManualTopUp: 'deposit',
    ManualDeduct: 'deduction',
    Refund: 'refund',
    AutoOffset: 'deduction',
    Overpayment: 'deposit',
    Other: 'adjustment',
  };
  return map[type] ?? 'adjustment';
}

export default paymentService;
