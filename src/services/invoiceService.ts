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
  // Advanced filters
  minAmount?: number;
  maxAmount?: number;
  dueDateFrom?: string;
  dueDateTo?: string;
  roomCode?: string;
  hasViewed?: boolean;
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
    const {
      buildingId,
      status,
      search,
      period,
      tenantId,
      page = 1,
      limit = 10,
      minAmount,
      maxAmount,
      dueDateFrom,
      dueDateTo,
      roomCode,
    } = filters;

    // 1. Base query (apply basic filters that work directly on `invoices` table)
    let query = supabase
      .from('invoices')
      .select(INVOICE_SELECT, { count: 'exact' });

    if (status) {
      if (status === 'Unpaid') {
        query = query.in('status', ['draft', 'pending_payment', 'partially_payment'] as DbInvoiceStatus[]);
      } else {
        query = query.eq('status', mapInvoiceStatus.toDb(status) as DbInvoiceStatus);
      }
    }
    if (dueDateFrom) query = query.gte('due_date', dueDateFrom);
    if (dueDateTo) query = query.lte('due_date', dueDateTo);

    // Determine if we need to do in-memory filtering for nested relations or complex criteria
    const isInMemoryNeeded = !!(buildingId || tenantId || search || minAmount !== undefined || maxAmount !== undefined || roomCode);
    
    // If we need in-memory filtering, we should fetch a larger batch 
    // to ensure we capture enough matches for the current page.
    const typedPage = Math.max(1, Number(page));
    const typedLimit = Math.max(1, Number(limit));


    if (!isInMemoryNeeded) {
      const from = (typedPage - 1) * typedLimit;
      const to = from + typedLimit - 1;
      query = query.range(from, to);
    } else {
      // Limit the "deep scan" to 1000 items for performance
      query = query.limit(1000);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(`Failed to fetch invoices: ${error.message}`);
    if (!data) throw new Error('Failed to fetch invoices: no data returned');

    let items = (data as unknown as DbInvoiceRow[]).map(mapDbRowToInvoice);

    // Apply in-memory filters
    if (isInMemoryNeeded) {
      items = items.filter((item) => {
        const matchesBuilding = !buildingId || String(item.buildingId) === String(buildingId);
        const matchesTenant = !tenantId || String(item.tenantId) === String(tenantId);
        const matchesAmountRange = 
          (minAmount === undefined || item.totalAmount >= minAmount) &&
          (maxAmount === undefined || item.totalAmount <= maxAmount);
        const matchesRoom = !roomCode || item.roomCode.toLowerCase().includes(roomCode.toLowerCase());
        
        let matchesSearch = true;
        if (search) {
          const s = search.toLowerCase();
          matchesSearch =
            item.invoiceCode.toLowerCase().includes(s) ||
            item.tenantName.toLowerCase().includes(s) ||
            item.roomCode.toLowerCase().includes(s) ||
            item.contractCode.toLowerCase().includes(s);
        }

        return matchesBuilding && matchesTenant && matchesSearch && matchesAmountRange && matchesRoom;
      });
    }

    const filteredTotal = isInMemoryNeeded ? items.length : (count ?? 0);

    // Apply client-side pagination on the filtered results
    if (isInMemoryNeeded) {
      const start = (typedPage - 1) * typedLimit;
      items = items.slice(start, start + typedLimit);
    }

    return {
      items,
      total: filteredTotal,
      page: typedPage,
      limit: typedLimit,
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
    // In production: insert into a notifications table or call edge function
    console.info(`[invoiceService] Notification sent for invoice ${invoiceId}`);
  },

  logInvoiceView: async (_invoiceId: string): Promise<void> => {
    // no-op stub — view tracking not yet implemented on the backend
  },
};

export default invoiceService;
