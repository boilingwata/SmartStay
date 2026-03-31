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

export interface InvoiceCreateContractOption {
  id: string;
  contractCode: string;
  roomId: string;
  roomCode: string;
  buildingId: string;
  buildingName: string;
  tenantName: string;
  monthlyRent: number;
}

export interface InvoiceDraftPreviewItem {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  meterReadingId?: number;
  source: 'rent' | 'service' | 'utility' | 'discount';
}

export interface InvoiceDraftPreview {
  contractId: string;
  contractCode: string;
  roomId: string;
  roomCode: string;
  buildingId: string;
  buildingName: string;
  tenantName: string;
  billingPeriod: string;
  dueDate: string;
  items: InvoiceDraftPreviewItem[];
  subtotal: number;
  totalAmount: number;
  missingUtilityItems: string[];
  note?: string;
}

export interface CreateInvoiceInput {
  contractId: string;
  monthYear: string;
  dueDate: string;
  discountAmount?: number;
  discountReason?: string;
  note?: string;
}

export interface BulkInvoiceInput {
  monthYear: string;
  dueDate: string;
  buildingId?: string;
  discountAmount?: number;
  discountReason?: string;
  note?: string;
}

export interface BulkInvoicePreviewRow {
  contract: InvoiceCreateContractOption;
  preview?: InvoiceDraftPreview;
  status: 'ready' | 'warning' | 'duplicate' | 'error';
  canCreate: boolean;
  issue?: string;
  existingInvoiceCode?: string;
}

export interface BulkInvoiceCreateResult {
  created: Invoice[];
  skipped: Array<{ contractId: string; contractCode: string; reason: string }>;
  failed: Array<{ contractId: string; contractCode: string; reason: string }>;
  totalRequested: number;
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

interface ContractOptionRow {
  id: number;
  contract_code: string;
  room_id: number;
  monthly_rent: number | null;
  rooms: {
    room_code: string;
    building_id: number;
    buildings: { name: string } | null;
  } | null;
  contract_tenants: {
    is_primary: boolean | null;
    tenants: {
      full_name: string;
    } | null;
  }[];
}

interface ContractDraftRow extends ContractOptionRow {
  contract_services: {
    service_id: number;
    quantity: number | null;
    fixed_price: number | null;
    services: {
      name: string;
      calc_type: string | null;
    } | null;
  }[];
}

interface ServicePriceRow {
  service_id: number;
  unit_price: number;
  effective_from: string;
}

interface MeterReadingDraftRow {
  id: number;
  room_id: number;
  billing_period: string;
  electricity_previous: number;
  electricity_current: number;
  electricity_usage: number | null;
  water_previous: number;
  water_current: number;
  water_usage: number | null;
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

function mapContractRowToOption(row: ContractOptionRow): InvoiceCreateContractOption {
  const primaryTenant =
    row.contract_tenants.find((ct) => ct.is_primary) ??
    row.contract_tenants[0];

  return {
    id: String(row.id),
    contractCode: row.contract_code,
    roomId: String(row.room_id),
    roomCode: row.rooms?.room_code ?? '',
    buildingId: row.rooms?.building_id != null ? String(row.rooms.building_id) : '',
    buildingName: row.rooms?.buildings?.name ?? '',
    tenantName: primaryTenant?.tenants?.full_name ?? '',
    monthlyRent: row.monthly_rent ?? 0,
  };
}

function normalizeForMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function inferUtilityKind(serviceName: string): 'electricity' | 'water' | null {
  const normalized = normalizeForMatch(serviceName);
  if (normalized.includes('dien') || normalized.includes('electric')) return 'electricity';
  if (normalized.includes('nuoc') || normalized.includes('water')) return 'water';
  return null;
}

function isExistingInvoiceError(message: string): boolean {
  const normalized = normalizeForMatch(message);
  return normalized.includes('hoa don') && normalized.includes('ton tai')
    || normalized.includes('already exists');
}

async function buildInvoiceDraft(input: CreateInvoiceInput): Promise<InvoiceDraftPreview> {
  const contractId = Number(input.contractId);
  if (!Number.isFinite(contractId)) {
    throw new Error('Hợp đồng không hợp lệ.');
  }
  if (!/^\d{4}-\d{2}$/.test(input.monthYear)) {
    throw new Error('Kỳ thanh toán không hợp lệ.');
  }
  if (!input.dueDate) {
    throw new Error('Vui lòng chọn hạn thanh toán.');
  }

  const billingPeriod = input.monthYear;
  const draftRow = (await unwrap(
    supabase
      .from('contracts')
      .select(`
        id,
        contract_code,
        room_id,
        monthly_rent,
        rooms (
          room_code,
          building_id,
          buildings ( name )
        ),
        contract_tenants (
          is_primary,
          tenants ( full_name )
        ),
        contract_services (
          service_id,
          quantity,
          fixed_price,
          services ( name, calc_type )
        )
      `)
      .eq('id', contractId)
      .eq('status', 'active')
      .eq('is_deleted', false)
      .single()
  )) as unknown as ContractDraftRow;

  const contract = mapContractRowToOption(draftRow);
  const discountAmount = Math.max(0, Number(input.discountAmount ?? 0));
  const items: InvoiceDraftPreviewItem[] = [];
  const missingUtilityItems: string[] = [];

  if (contract.monthlyRent > 0) {
    items.push({
      description: `Tiền thuê tháng ${input.monthYear}`,
      quantity: 1,
      unitPrice: contract.monthlyRent,
      lineTotal: contract.monthlyRent,
      source: 'rent',
    });
  }

  const contractServices = draftRow.contract_services ?? [];
  const serviceIds = contractServices.map((service) => service.service_id);
  let priceMap = new Map<number, number>();

  if (serviceIds.length > 0) {
    const servicePriceRows = (await unwrap(
      supabase
        .from('service_prices')
        .select('service_id, unit_price, effective_from')
        .in('service_id', serviceIds)
        .eq('is_active', true)
        .order('effective_from', { ascending: false })
    )) as unknown as ServicePriceRow[];

    for (const row of servicePriceRows) {
      if (!priceMap.has(row.service_id)) {
        priceMap.set(row.service_id, row.unit_price);
      }
    }
  }

  const meterReading = contract.roomId
    ? ((await unwrap(
        supabase
          .from('meter_readings')
          .select('id, room_id, billing_period, electricity_previous, electricity_current, electricity_usage, water_previous, water_current, water_usage')
          .eq('room_id', Number(contract.roomId))
          .eq('billing_period', billingPeriod)
          .maybeSingle()
      )) as unknown as MeterReadingDraftRow | null)
    : null;

  for (const service of contractServices) {
    const serviceName = service.services?.name ?? `Dịch vụ #${service.service_id}`;
    const calcType = service.services?.calc_type ?? 'flat_rate';
    const quantity = Math.max(1, Number(service.quantity ?? 1));
    const unitPrice = Number(service.fixed_price ?? priceMap.get(service.service_id) ?? 0);

    if (calcType === 'per_unit') {
      const utilityKind = inferUtilityKind(serviceName);
      if (!utilityKind || !meterReading) {
        missingUtilityItems.push(serviceName);
        continue;
      }

      const usage = utilityKind === 'electricity'
        ? (meterReading.electricity_usage ?? (meterReading.electricity_current - meterReading.electricity_previous))
        : (meterReading.water_usage ?? (meterReading.water_current - meterReading.water_previous));

      items.push({
        description: `${serviceName} tháng ${input.monthYear}`,
        quantity: Math.max(0, usage),
        unitPrice,
        lineTotal: Math.max(0, usage) * unitPrice,
        meterReadingId: meterReading.id,
        source: 'utility',
      });
      continue;
    }

    items.push({
      description: `${serviceName} tháng ${input.monthYear}`,
      quantity,
      unitPrice,
      lineTotal: quantity * unitPrice,
      source: 'service',
    });
  }

  if (discountAmount > 0) {
    items.push({
      description: input.discountReason?.trim()
        ? `Giảm trừ: ${input.discountReason.trim()}`
        : 'Giảm trừ hóa đơn',
      quantity: 1,
      unitPrice: -discountAmount,
      lineTotal: -discountAmount,
      source: 'discount',
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  if (subtotal < 0) {
    throw new Error('Giảm trừ không thể lớn hơn tổng tiền hóa đơn.');
  }

  return {
    contractId: contract.id,
    contractCode: contract.contractCode,
    roomId: contract.roomId,
    roomCode: contract.roomCode,
    buildingId: contract.buildingId,
    buildingName: contract.buildingName,
    tenantName: contract.tenantName,
    billingPeriod: input.monthYear,
    dueDate: input.dueDate,
    items,
    subtotal,
    totalAmount: subtotal,
    missingUtilityItems,
    note: input.note?.trim() || undefined,
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
  getCreateInvoiceContracts: async (): Promise<InvoiceCreateContractOption[]> => {
    const rows = (await unwrap(
      supabase
        .from('contracts')
        .select(`
          id,
          contract_code,
          room_id,
          monthly_rent,
          rooms (
            room_code,
            building_id,
            buildings ( name )
          ),
          contract_tenants (
            is_primary,
            tenants ( full_name )
          )
        `)
        .eq('status', 'active')
        .eq('is_deleted', false)
        .order('contract_code', { ascending: true })
    )) as unknown as ContractOptionRow[];

    return rows.map(mapContractRowToOption);
  },

  previewInvoice: async (input: CreateInvoiceInput): Promise<InvoiceDraftPreview> => {
    return buildInvoiceDraft(input);
  },

  previewBulkInvoices: async (input: BulkInvoiceInput): Promise<BulkInvoicePreviewRow[]> => {
    if (!/^\d{4}-\d{2}$/.test(input.monthYear)) {
      throw new Error('Kỳ thanh toán không hợp lệ.');
    }
    if (!input.dueDate) {
      throw new Error('Vui lòng chọn hạn thanh toán.');
    }

    const contracts = await invoiceService.getCreateInvoiceContracts();
    const scopedContracts = input.buildingId
      ? contracts.filter((contract) => contract.buildingId === input.buildingId)
      : contracts;

    if (scopedContracts.length === 0) {
      return [];
    }

    const existingRows = (await unwrap(
      supabase
        .from('invoices')
        .select('contract_id, invoice_code')
        .in('contract_id', scopedContracts.map((contract) => Number(contract.id)))
        .eq('billing_period', input.monthYear)
        .neq('status', 'cancelled')
    )) as unknown as Array<{ contract_id: number; invoice_code: string }>;

    const existingMap = new Map(existingRows.map((row) => [String(row.contract_id), row.invoice_code]));

    return Promise.all(
      scopedContracts.map(async (contract) => {
        const existingInvoiceCode = existingMap.get(contract.id);
        if (existingInvoiceCode) {
          return {
            contract,
            status: 'duplicate' as const,
            canCreate: false,
            existingInvoiceCode,
            issue: `Đã có hóa đơn ${existingInvoiceCode} cho kỳ ${input.monthYear}.`,
          };
        }

        try {
          const preview = await buildInvoiceDraft({
            contractId: contract.id,
            monthYear: input.monthYear,
            dueDate: input.dueDate,
            discountAmount: input.discountAmount,
            discountReason: input.discountReason,
            note: input.note,
          });

          return {
            contract,
            preview,
            status: preview.missingUtilityItems.length > 0 ? 'warning' as const : 'ready' as const,
            canCreate: true,
            issue: preview.missingUtilityItems.length > 0
              ? `Thiếu chỉ số cho: ${preview.missingUtilityItems.join(', ')}. Hóa đơn vẫn sẽ được tạo với các khoản hiện có.`
              : undefined,
          };
        } catch (error) {
          return {
            contract,
            status: 'error' as const,
            canCreate: false,
            issue: error instanceof Error ? error.message : 'Không thể xem trước hóa đơn.',
          };
        }
      })
    );
  },

  createBulkInvoices: async (
    input: BulkInvoiceInput & {
      contractIds: string[];
      onProgress?: (completed: number, total: number) => void;
    }
  ): Promise<BulkInvoiceCreateResult> => {
    const contractMap = new Map(
      (await invoiceService.getCreateInvoiceContracts()).map((contract) => [contract.id, contract])
    );

    const created: Invoice[] = [];
    const skipped: BulkInvoiceCreateResult['skipped'] = [];
    const failed: BulkInvoiceCreateResult['failed'] = [];
    const totalRequested = input.contractIds.length;

    for (let index = 0; index < input.contractIds.length; index += 1) {
      const contractId = input.contractIds[index];
      const contract = contractMap.get(contractId);
      const contractCode = contract?.contractCode ?? contractId;

      try {
        const invoice = await invoiceService.createInvoice({
          contractId,
          monthYear: input.monthYear,
          dueDate: input.dueDate,
          discountAmount: input.discountAmount,
          discountReason: input.discountReason,
          note: input.note,
        });
        created.push(invoice);
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Không thể tạo hóa đơn.';
        const bucket = isExistingInvoiceError(reason) ? skipped : failed;
        bucket.push({ contractId, contractCode, reason });
      } finally {
        input.onProgress?.(index + 1, totalRequested);
      }
    }

    return { created, skipped, failed, totalRequested };
  },

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

  initiatePayment: async (
    invoiceId: string,
    method: PaymentMethod,
    amount?: number
  ): Promise<{ success: boolean; redirectUrl?: string; message?: string }> => {
    if (import.meta.env.VITE_USE_EDGE_FUNCTIONS === 'true') {
      // Resolve amount: fetch invoice total if not provided
      let paymentAmount = amount;
      if (paymentAmount === undefined) {
        const row = (await unwrap(
          supabase.from('invoices').select('total_amount, amount_paid').eq('id', Number(invoiceId)).single()
        )) as unknown as { total_amount: number | null; amount_paid: number | null };
        paymentAmount = (row.total_amount ?? 0) - (row.amount_paid ?? 0);
      }

      const methodMap: Record<PaymentMethod, string> = {
        Wallet: 'other', VNPay: 'vnpay', MoMo: 'momo', ZaloPay: 'zalopay', Transfer: 'bank_transfer',
      };

      const { error } = await supabase.functions.invoke('process-payment', {
        body: {
          invoiceId:   Number(invoiceId),
          amount:      paymentAmount,
          method:      methodMap[method] ?? 'other',
          paymentDate: new Date().toISOString(),
          autoConfirm: true,
        },
      });
      if (error) throw new Error(error.message);
      return { success: true, message: 'Thanh toán đã được ghi nhận' };
    }

    // Legacy path: direct invoice update only (no payment row created)
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

    let newStatus: string;
    if (newPaid >= total) {
      newStatus = 'paid';
    } else if (newPaid > 0) {
      newStatus = 'partially_paid';
    } else {
      newStatus = invoiceRow.status ?? 'pending_payment';
    }

    await unwrap(
      supabase
        .from('invoices')
        .update({
          amount_paid: newPaid,
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

  createInvoice: async (input: CreateInvoiceInput): Promise<Invoice> => {
    const contractId = Number(input.contractId);
    if (!Number.isFinite(contractId)) {
      throw new Error('Hợp đồng không hợp lệ.');
    }

    const billingPeriod = input.monthYear;
    const draft = await buildInvoiceDraft(input);

    const existingInvoice = (await unwrap(
      supabase
        .from('invoices')
        .select('id, invoice_code')
        .eq('contract_id', contractId)
        .eq('billing_period', billingPeriod)
        .neq('status', 'cancelled')
        .maybeSingle()
    )) as unknown as { id: number; invoice_code: string } | null;

    if (existingInvoice) {
      throw new Error(`Hóa đơn ${existingInvoice.invoice_code} đã tồn tại cho kỳ ${input.monthYear}.`);
    }

    const insertedInvoice = (await unwrap(
      supabase
        .from('invoices')
        .insert({
          contract_id: contractId,
          billing_period: billingPeriod,
          subtotal: draft.subtotal,
          tax_amount: 0,
          total_amount: draft.totalAmount,
          amount_paid: 0,
          due_date: input.dueDate,
          status: 'pending_payment',
          notes: input.note?.trim() || null,
        })
        .select('id')
        .single()
    )) as unknown as { id: number };

    if (draft.items.length > 0) {
      await unwrap(
        supabase
          .from('invoice_items')
          .insert(
            draft.items.map((item, index) => ({
              invoice_id: insertedInvoice.id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              line_total: item.lineTotal,
              meter_reading_id: item.meterReadingId ?? null,
              sort_order: index + 1,
            }))
          )
      );
    }

    const createdInvoice = (await unwrap(
      supabase
        .from('invoices')
        .select(INVOICE_SELECT)
        .eq('id', insertedInvoice.id)
        .single()
    )) as unknown as DbInvoiceRow;

    return mapDbRowToInvoice(createdInvoice);
  },

  logInvoiceView: async (_invoiceId: string): Promise<void> => {
    // no-op stub — view tracking not yet implemented on the backend
  },
};

export default invoiceService;
