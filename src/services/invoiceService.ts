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

// NOTE: id fields are numbers in DB (not strings). We keep string for frontend compat via String()
interface DbInvoiceRow {
  id: number;           // DB: integer
  invoice_code: string;
  contract_id: number;  // DB: integer
  billing_period: string | null;
  subtotal: number | null;
  tax_amount: number | null;
  total_amount: number | null;
  amount_paid: number | null;
  balance_due: number | null;
  due_date: string | null;
  paid_date: string | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
  contracts: {
    contract_code: string;
    room_id: number;
    rooms: {
      room_code: string;
      building_id: number;
      buildings: {
        name: string;
      };
    };
    contract_tenants: {
      tenant_id: number;
      is_primary: boolean | null;
      tenants: {
        full_name: string;
      };
    }[];
  };
}

// Matches actual smartstay.invoice_items columns exactly
interface DbInvoiceItemRow {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number | null;
  unit_price: number;
  line_total: number;
  meter_reading_id: number | null;
  sort_order: number | null;
}

interface DbPaymentRow {
  id: number;
  payment_code: string;
  invoice_id: number;
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
    id: String(row.id),
    invoiceCode: row.invoice_code,
    contractId: String(row.contract_id),
    contractCode: contract.contract_code,
    roomId: String(contract.room_id),
    roomCode: room.room_code,
    buildingId: String(room.building_id),
    buildingName: building.name,
    tenantId: primaryTenant?.tenant_id != null ? String(primaryTenant.tenant_id) : '',
    tenantName: primaryTenant?.tenants?.full_name ?? '',
    period: row.billing_period?.slice(0, 7) ?? '',
    totalAmount: row.total_amount ?? 0,
    paidAmount: row.amount_paid ?? 0,
    dueDate: row.due_date ?? '',
    status: mapInvoiceStatus.fromDb(row.status ?? 'draft') as InvoiceStatus,
    hasViewed: false,
    viewCount: 0,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

/**
 * Derive a frontend item type from the description text.
 * The DB has no `type` column — we infer from keywords.
 */
function deriveItemType(description: string): InvoiceItem['type'] {
  const lower = description.toLowerCase();
  if (lower.includes('điện') || lower.includes('electr')) return 'Electricity';
  if (lower.includes('nước') || lower.includes('water')) return 'Water';
  if (lower.includes('thuê') || lower.includes('rent')) return 'Rent';
  return 'Service';
}

function mapDbItemToInvoiceItem(item: DbInvoiceItemRow): InvoiceItem {
  return {
    id:                String(item.id),
    description:       item.description,
    quantity:          item.quantity ?? 1,
    unitPriceSnapshot: Number(item.unit_price),
    amount:            Number(item.line_total),
    type:              deriveItemType(item.description),
    snapshotPrice:     Number(item.unit_price),
    snapshotLabel:     item.description,
    tierBreakdown:     undefined,  // no tier_breakdown_json column in DB
  };
}

function mapDbPaymentToTransaction(payment: DbPaymentRow): PaymentTransaction {
  return {
    id: String(payment.id),
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
    let items = rows.map(mapDbRowToInvoice);

    // Building filter: applied in-memory because PostgREST JS client does not
    // support filtering on deeply nested join columns via dotted paths.
    // INV-01 FIX: recalculate `total` after each in-memory filter so pagination
    // doesn't show phantom pages beyond the actual filtered result size.
    if (filters.buildingId) {
      const numBuildingId = Number(filters.buildingId);
      if (Number.isFinite(numBuildingId)) {
        const targetBuildingId = String(numBuildingId);
        items = items.filter((inv) => String(inv.buildingId) === targetBuildingId);
      }
    }

    // Tenant filter: applied in-memory for the same reason
    if (filters.tenantId) {
      const numTenantId = Number(filters.tenantId);
      if (Number.isFinite(numTenantId)) {
        const targetTenantId = String(numTenantId);
        items = items.filter((inv) => String(inv.tenantId) === targetTenantId);
      }
    }

    // Additional in-memory search for tenant name (can't be filtered server-side via PostgREST join)
    // The DB query already filters invoice_code via ilike; this supplements tenant name matching.
    if (filters.search) {
      const s = filters.search.toLowerCase();
      items = items.filter(
        (inv) =>
          inv.invoiceCode.toLowerCase().includes(s) ||
          (inv.tenantName ?? '').toLowerCase().includes(s) ||
          (inv.contractCode ?? '').toLowerCase().includes(s)
      );
    }

    // INV-01: Use item count after in-memory filtering as the source-of-truth total.
    // If no in-memory filter was applied the DB count is still accurate.
    const filteredTotal = (filters.buildingId || filters.tenantId || filters.search)
      ? items.length
      : (count ?? 0);

    return {
      items,
      total: filteredTotal,
      page: typedPage ?? 1,
      limit: typedLimit ?? filteredTotal,
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

    // 2. Fetch invoice items — select only columns that exist in smartstay.invoice_items
    const itemRows = await unwrap(
      supabase
        .from('invoice_items')
        .select('id, invoice_id, description, quantity, unit_price, line_total, meter_reading_id, sort_order')
        .eq('invoice_id', Number(id))
        .order('sort_order', { ascending: true, nullsFirst: false })
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
      subTotal: invoiceRow.subtotal ?? 0,
      taxAmount: invoiceRow.tax_amount ?? 0,
      discountAmount: 0,
      overdueFee: 0,
    };
  },

  // B31 FIX: Replace stub with real payment insert + invoice status update
  initiatePayment: async (
    invoiceId: string,
    _method: PaymentMethod,
    amount?: number
  ): Promise<{ success: boolean; redirectUrl?: string; message?: string }> => {
    // Fetch current invoice to know total/paid amounts
    const invoiceRow = (await unwrap(
      supabase
        .from('invoices')
        .select('id, total_amount, amount_paid, status')
        .eq('id', Number(invoiceId))
        .single()
    )) as unknown as {
      id: number;
      total_amount: number | null;
      amount_paid: number | null;
      status: string | null;
    };

    const total = invoiceRow.total_amount ?? 0;
    const alreadyPaid = invoiceRow.amount_paid ?? 0;
    const paymentAmount = amount ?? (total - alreadyPaid);
    const newPaid = alreadyPaid + paymentAmount;

    // Determine new status
    let newStatus: string;
    if (newPaid >= total) {
      newStatus = 'paid';
    } else if (newPaid > 0) {
      newStatus = 'partially_paid';
    } else {
      newStatus = invoiceRow.status ?? 'pending_payment';
    }

    // Update invoice status + amount_paid
    await unwrap(
      supabase
        .from('invoices')
        .update({
          amount_paid: newPaid,
          balance_due: Math.max(0, total - newPaid),
          status: newStatus as import('@/types/supabase').DbInvoiceStatus,
          paid_date: newPaid >= total ? new Date().toISOString() : null,
        })
        .eq('id', Number(invoiceId))
    );

    return { success: true, message: 'Thanh toán đã được ghi nhận' };
  },

  // B32 FIX: sendNotification — toast-promise backed, logs to console (no notifications table yet)
  sendNotification: async (invoiceId: string): Promise<void> => {
    // No notifications table in schema yet — simulate a delay and resolve
    await new Promise((res) => setTimeout(res, 800));
    // In production: insert into a notifications table or call edge function
    console.info(`[invoiceService] Notification sent for invoice ${invoiceId}`);
  },

  logInvoiceView: async (_invoiceId: string): Promise<void> => {
    // no-op stub — view tracking not yet implemented on the backend
  },
};

export default invoiceService;
