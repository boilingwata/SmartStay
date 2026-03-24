import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { mapInvoiceStatus, mapPaymentMethod } from '@/lib/enumMaps';
import type { DbInvoiceStatus } from '@/types/supabase';
import {
  Invoice,
  InvoiceDetail,
  InvoiceItem,
  InvoiceStatus,
  PaymentTransaction,
} from '@/models/Invoice';

export type PaymentMethod = 'Wallet' | 'VNPay' | 'MoMo' | 'ZaloPay' | 'Transfer';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface InvoiceFilter {
  buildingId?: string;
  status?: InvoiceStatus;
  search?: string;
  period?: string;
  tenantId?: string;
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Internal DB row shapes (used only inside this file via `as unknown as`)
// ---------------------------------------------------------------------------

interface DbInvoiceRow {
  id: string;
  invoice_code: string;
  contract_id: string;
  billing_period: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  contracts: {
    contract_code: string;
    room_id: string;
    rooms: {
      room_code: string;
      building_id: string;
      buildings: {
        name: string;
      };
    };
    contract_tenants: {
      tenant_id: string;
      is_primary: boolean;
      tenants: {
        full_name: string;
      };
    }[];
  };
}

interface DbInvoiceItemRow {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  meter_reading_id: string | null;
  sort_order: number;
}

interface DbPaymentRow {
  id: string;
  payment_code: string;
  invoice_id: string;
  amount: number;
  method: string;
  payment_date: string;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapDbRowToInvoice(row: DbInvoiceRow): Invoice {
  const contract = row.contracts;
  const room = contract.rooms;
  const building = room.buildings;
  const primaryTenant =
    contract.contract_tenants.find((ct) => ct.is_primary) ??
    contract.contract_tenants[0];

  return {
    id: row.id,
    invoiceCode: row.invoice_code,
    contractId: row.contract_id,
    contractCode: contract.contract_code,
    roomId: contract.room_id,
    roomCode: room.room_code,
    buildingId: room.building_id,
    buildingName: building.name,
    tenantId: primaryTenant?.tenant_id ?? '',
    tenantName: primaryTenant?.tenants?.full_name ?? '',
    period: row.billing_period?.slice(0, 7) ?? '',
    totalAmount: row.total_amount,
    paidAmount: row.amount_paid,
    dueDate: row.due_date,
    status: mapInvoiceStatus.fromDb(row.status) as InvoiceStatus,
    hasViewed: false,
    viewCount: 0,
    createdAt: row.created_at,
  };
}

function mapDbItemToInvoiceItem(item: DbInvoiceItemRow): InvoiceItem {
  const price = item.unit_price !== undefined && item.unit_price !== null ? Number(item.unit_price) : null;
  return {
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    unitPriceSnapshot: price ?? 0,
    amount: item.line_total,
    type: (item as any).type || 'Other',
    snapshotPrice: (item as any).snapshot_price ?? 0,
    snapshotLabel: (item as any).snapshot_label || 'Hợp đồng',
    tierBreakdown: (() => {
      const json = (item as any).tier_breakdown_json;
      if (!json) return undefined;
      try {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed.map((t: any) => ({
          label: t.label || `Bậc ${t.tierOrder || ''}`,
          qty: t.qty || t.kwh || t.usage || 0,
          unitPrice: t.unitPrice || t.price || 0,
          amount: t.amount || 0
        })) : undefined;
      } catch {
        console.error('Failed to parse tier_breakdown_json for item:', item.id);
        return undefined;
      }
    })()
  };
}

function mapDbPaymentToTransaction(payment: DbPaymentRow): PaymentTransaction {
  return {
    id: payment.id,
    transactionCode: payment.payment_code,
    paidAt: payment.payment_date,
    amount: payment.amount,
    method: mapPaymentMethod.fromDb(payment.method) as PaymentTransaction['method'],
    note: payment.notes ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Base query builder (shared select string for list + detail)
// ---------------------------------------------------------------------------

const INVOICE_SELECT = `
  id,
  invoice_code,
  contract_id,
  billing_period,
  subtotal,
  tax_amount,
  total_amount,
  amount_paid,
  balance_due,
  due_date,
  paid_date,
  status,
  notes,
  created_at,
  contracts (
    contract_code,
    room_id,
    rooms (
      room_code,
      building_id,
      buildings ( name )
    ),
    contract_tenants (
      tenant_id,
      is_primary,
      tenants ( full_name )
    )
  )
`.trim();

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const invoiceService = {
  getInvoices: async (filters: InvoiceFilter = {}): Promise<PaginatedResult<Invoice>> => {
    let query = supabase
      .from('invoices')
      .select(INVOICE_SELECT, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters.buildingId) {
      // Filter via the nested rooms.building_id path
      query = query.eq('contracts.rooms.building_id' as any, Number(filters.buildingId));
    }

    if (filters.tenantId) {
      // Filter via the nested contracts.contract_tenants.tenant_id path
      query = query.eq('contracts.contract_tenants.tenant_id' as any, Number(filters.tenantId));
    }

    if (filters.status) {
      // Map frontend status → DB status; for 'Unpaid' we use in() to cover all three DB variants
      if (filters.status === 'Unpaid') {
        query = query.in('status', ['draft', 'pending_payment', 'partially_paid'] as DbInvoiceStatus[]);
      } else {
        query = query.eq('status', mapInvoiceStatus.toDb(filters.status) as DbInvoiceStatus);
      }
    }

    if (filters.period) {
      // billing_period is stored as a date; match the YYYY-MM prefix
      query = query.like('billing_period', `${filters.period}%`);
    }

    if (filters.search) {
      // Search against invoice_code (contracts.contract_code is not directly filterable via PostgREST text search here)
      query = query.ilike('invoice_code', `%${filters.search}%`);
    }

    // Defaulting logic: only paginate if both are provided, otherwise return a large batch
    const typedPage = filters.page !== undefined ? Math.max(1, Math.floor(Number(filters.page) || 1)) : undefined;
    const typedLimit = filters.limit !== undefined ? Math.max(1, Math.floor(Number(filters.limit) || 10)) : undefined;

    if (typedPage !== undefined && typedLimit !== undefined) {
      const from = (typedPage - 1) * typedLimit;
      const to = from + typedLimit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(`Failed to fetch invoices: ${error.message}`);
    if (!data) throw new Error('Failed to fetch invoices: no data returned');

    const rows = data as unknown as DbInvoiceRow[];
    return {
      items: rows.map(mapDbRowToInvoice),
      total: count ?? 0,
      page: typedPage ?? 1,
      limit: typedLimit ?? (count ?? 0),
    };
  },

  getInvoiceCounts: async (): Promise<Record<InvoiceStatus | 'All', number>> => {
    const rows = await unwrap(
      supabase
        .from('invoices')
        .select('status')
    ) as unknown as { status: string }[];

    const counts: Record<string, number> = { All: rows.length, Unpaid: 0, Paid: 0, Overdue: 0, Cancelled: 0 };

    for (const row of rows) {
      const mapped = mapInvoiceStatus.fromDb(row.status) as InvoiceStatus;
      counts[mapped] = (counts[mapped] ?? 0) + 1;
    }

    return counts as Record<InvoiceStatus | 'All', number>;
  },

  getInvoiceDetail: async (id: string): Promise<InvoiceDetail> => {
    // 1. Fetch the invoice base row
    const invoiceRow = await unwrap(
      supabase
        .from('invoices')
        .select(INVOICE_SELECT)
        .eq('id', Number(id))
        .single()
    ) as unknown as DbInvoiceRow;

    const base = mapDbRowToInvoice(invoiceRow);

    // 2. Fetch invoice items
    const itemRows = await unwrap(
      supabase
        .from('invoice_items')
        .select('id, invoice_id, description, quantity, unit_price, line_total, meter_reading_id, sort_order, type, snapshot_label, tier_breakdown_json')
        .eq('invoice_id', Number(id))
        .order('sort_order', { ascending: true })
    ) as unknown as DbInvoiceItemRow[];

    const items: InvoiceItem[] = itemRows.map(mapDbItemToInvoiceItem);

    // 3. Fetch payments
    const paymentRows = await unwrap(
      supabase
        .from('payments')
        .select('id, payment_code, invoice_id, amount, method, payment_date, notes')
        .eq('invoice_id', Number(id))
        .order('payment_date', { ascending: false })
    ) as unknown as DbPaymentRow[];

    const payments: PaymentTransaction[] = paymentRows.map(mapDbPaymentToTransaction);

    return {
      ...base,
      items,
      payments,
      subTotal: invoiceRow.subtotal,
      taxAmount: invoiceRow.tax_amount,
      discountAmount: 0,
      overdueFee: 0,
    };
  },

  initiatePayment: async (
    _invoiceId: string,
    _method: PaymentMethod
  ): Promise<{ success: boolean; redirectUrl?: string; message?: string }> => {
    return { success: true, message: 'Payment initiated' };
  },

  logInvoiceView: async (_invoiceId: string): Promise<void> => {
    // no-op stub — view tracking not yet implemented on the backend
  },
};

export default invoiceService;
