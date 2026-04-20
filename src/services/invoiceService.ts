import { FunctionsHttpError, type Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { mapInvoiceStatus, mapPaymentMethod } from '@/lib/enumMaps';
import { normalizeInvoiceItemType, toUiInvoiceItemType } from '@/lib/invoiceItems';
import type { DbInvoiceStatus } from '@/types/supabase';
import { buildPolicyInvoiceDraft } from '@/services/utilityBillingService';
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
  startDate: string;
  createdAt: string;
}

export interface InvoiceDraftPreviewItem {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  source: 'rent' | 'service' | 'utility' | 'asset' | 'discount';
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
  status: 'ready' | 'blocked' | 'duplicate' | 'error';
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

interface DbInvoiceRow {
  id: number;
  invoice_code: string;
  contract_id: number;
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

interface DbInvoiceItemRow {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number | null;
  unit_price: number;
  line_total: number;
  item_type: string | null;
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

interface DbUtilitySnapshotRow {
  policy_source_type: string;
  resolved_policy_id: number | null;
  occupants_for_billing: number;
  occupied_days: number;
  days_in_period: number;
  prorate_ratio: number;
  rounding_increment: number;
  electric_base_amount: number;
  electric_device_surcharge: number;
  electric_subtotal: number;
  electric_season_multiplier: number;
  electric_location_multiplier: number;
  electric_raw_amount: number;
  electric_rounded_amount: number;
  min_electric_floor: number;
  electric_final_amount: number;
  water_base_amount: number;
  water_per_person_amount: number;
  water_person_charge: number;
  water_subtotal: number;
  water_location_multiplier: number;
  water_raw_amount: number;
  water_rounded_amount: number;
  min_water_floor: number;
  water_final_amount: number;
  resolved_device_surcharges_json: Array<{ deviceCode?: string; device_code?: string; chargeAmount?: number; charge_amount?: number }> | null;
  formula_snapshot_json: Record<string, unknown> | null;
  warnings_json: Array<{ code: string; message: string }> | null;
}

interface ContractOptionRow {
  id: number;
  contract_code: string;
  room_id: number;
  start_date: string;
  created_at: string | null;
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
  occupants_for_billing: number | null;
  utility_billing_type: string | null;
}

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

function mapDbItemToInvoiceItem(item: DbInvoiceItemRow): InvoiceItem {
  const typeKey = normalizeInvoiceItemType(item.item_type, item.description);
  return {
    id: String(item.id),
    description: item.description,
    quantity: item.quantity ?? 1,
    unitPriceSnapshot: Number(item.unit_price),
    amount: Number(item.line_total),
    type: toUiInvoiceItemType(typeKey),
    typeKey,
    snapshotPrice: Number(item.unit_price),
    snapshotLabel: item.description,
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
    startDate: row.start_date,
    createdAt: row.created_at ?? row.start_date,
  };
}

function normalizeForMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isExistingInvoiceError(message: string): boolean {
  const normalized = normalizeForMatch(message);
  return (
    (normalized.includes('hoa don') && normalized.includes('ton tai')) ||
    normalized.includes('already exists')
  );
}

function isAuthErrorMessage(message: string): boolean {
  return (
    message.includes('401') ||
    message.includes('403') ||
    message.includes('unauthorized') ||
    message.includes('invalid token') ||
    message.includes('expired token') ||
    message.includes('jwt') ||
    message.includes('auth')
  );
}

async function validateSession(session: Session | null): Promise<Session> {
  if (!session?.access_token) {
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tạo hóa đơn.');
  }

  const activeSession = session as Session;
  const { data: userData, error: userError } = await supabase.auth.getUser(activeSession.access_token);
  if (userError || !userData.user) {
    throw new Error('Không xác minh được phiên đăng nhập hiện tại. Vui lòng đăng nhập lại.');
  }

  return activeSession;
}

async function requireInvoiceFunctionSession(): Promise<Session> {
  const { data, error } = await supabase.auth.getSession();
  if (!error && data.session?.access_token) {
    try {
      return await validateSession(data.session);
    } catch {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError && refreshData.session?.access_token) {
        return validateSession(refreshData.session);
      }
    }
  }

  throw new Error('Không lấy được access token hợp lệ để gọi chức năng tạo hóa đơn.');
}

async function getFunctionErrorMessage(error: Error, fallback: string): Promise<string> {
  const normalizedMessage = error.message.toLowerCase();
  const status =
    error instanceof FunctionsHttpError && error.context instanceof Response
      ? error.context.status
      : null;

  let responseMessage: string | null = null;
  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    try {
      const json = (await error.context.clone().json()) as { error?: string; message?: string };
      responseMessage = json.error ?? json.message ?? null;
    } catch {
      try {
        responseMessage = await error.context.clone().text();
      } catch {
        responseMessage = null;
      }
    }
  }

  if (status === 401) {
    return responseMessage
      ? `Tạo hóa đơn bị từ chối xác thực (401): ${responseMessage}`
      : 'Tạo hóa đơn bị từ chối xác thực (401). Vui lòng đăng nhập lại.';
  }

  if (status === 403) {
    return responseMessage
      ? `Tài khoản hiện tại không có quyền tạo hóa đơn (403): ${responseMessage}`
      : 'Tài khoản hiện tại không có quyền tạo hóa đơn (403).';
  }

  if (normalizedMessage.includes('invoice already exists')) {
    return responseMessage ?? 'Hóa đơn của hợp đồng này trong kỳ đã tồn tại.';
  }

  if (isAuthErrorMessage(normalizedMessage)) {
    return responseMessage ?? 'Supabase Auth từ chối access token khi gọi Edge Function.';
  }

  if (normalizedMessage.includes('non-2xx')) {
    return responseMessage ? `Edge Function trả lỗi: ${responseMessage}` : fallback;
  }

  return responseMessage ?? error.message ?? fallback;
}

async function invokeCreateUtilityInvoice(
  payload: Omit<CreateInvoiceInput, 'contractId'> & { contractId: number }
): Promise<{ invoiceId: number; invoiceCode?: string }> {
  const session = await requireInvoiceFunctionSession();

  const attemptInvoke = async (accessToken: string) =>
    supabase.functions.invoke('create-utility-invoice', {
      body: payload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

  let { data, error } = await attemptInvoke(session.access_token);

  if (error && isAuthErrorMessage(error.message.toLowerCase())) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshData.session?.access_token) {
      throw new Error('Không thể làm mới phiên đăng nhập để tạo hóa đơn.');
    }

    ({ data, error } = await attemptInvoke(refreshData.session.access_token));
  }

  if (error) {
    throw new Error(await getFunctionErrorMessage(error, 'Không thể gọi Edge Function tạo hóa đơn.'));
  }

  return (data ?? {}) as { invoiceId: number; invoiceCode?: string };
}

async function fetchContractDraft(contractId: number): Promise<ContractDraftRow> {
  return (await unwrap(
    supabase
      .from('contracts')
      .select(`
        id,
        contract_code,
        room_id,
        start_date,
        created_at,
        occupants_for_billing,
        utility_billing_type,
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
      .eq('id', contractId)
      .eq('status', 'active')
      .eq('is_deleted', false)
      .single()
  )) as unknown as ContractDraftRow;
}

async function buildInvoiceDraft(input: CreateInvoiceInput): Promise<InvoiceDraftPreview> {
  const contractId = Number(input.contractId);
  if (!Number.isFinite(contractId)) {
    throw new Error('Hop dong khong hop le.');
  }

  const contractDraft = await fetchContractDraft(contractId);
  if ((contractDraft.utility_billing_type ?? 'policy') !== 'policy') {
    throw new Error('Hop dong nay chua duoc chuyen sang utility policy.');
  }
  if (!Number.isFinite(Number(contractDraft.occupants_for_billing)) || Number(contractDraft.occupants_for_billing) <= 0) {
    throw new Error('Hop dong thieu occupants_for_billing hop le.');
  }

  const draft = await buildPolicyInvoiceDraft(input);

  return {
    contractId: draft.contractId,
    contractCode: draft.contractCode,
    roomId: draft.roomId,
    roomCode: draft.roomCode,
    buildingId: draft.buildingId,
    buildingName: draft.buildingName,
    tenantName: draft.tenantName,
    billingPeriod: draft.billingPeriod,
    dueDate: draft.dueDate,
    items: draft.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      source: item.source,
    })),
    subtotal: draft.subtotal,
    totalAmount: draft.totalAmount,
    missingUtilityItems: draft.missingUtilityItems,
    note: draft.note,
  };
}

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

export const invoiceService = {
  getCreateInvoiceContracts: async (): Promise<InvoiceCreateContractOption[]> => {
    const rows = (await unwrap(
      supabase
        .from('contracts')
        .select(`
          id,
          contract_code,
          room_id,
          start_date,
          created_at,
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
        .order('created_at', { ascending: false })
    )) as unknown as ContractOptionRow[];

    return rows.map(mapContractRowToOption);
  },

  previewInvoice: async (input: CreateInvoiceInput): Promise<InvoiceDraftPreview> => {
    return buildInvoiceDraft(input);
  },

  previewBulkInvoices: async (input: BulkInvoiceInput): Promise<BulkInvoicePreviewRow[]> => {
    if (!/^\d{4}-\d{2}$/.test(input.monthYear)) {
      throw new Error('Ky thanh toan khong hop le.');
    }
    if (!input.dueDate) {
      throw new Error('Vui long chon han thanh toan.');
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
            issue: `Da co hoa don ${existingInvoiceCode} cho ky ${input.monthYear}.`,
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
            status: preview.missingUtilityItems.length > 0 ? 'blocked' as const : 'ready' as const,
            canCreate: preview.missingUtilityItems.length === 0,
            issue: preview.missingUtilityItems.length > 0
              ? `Thieu cau hinh utility cho: ${preview.missingUtilityItems.join(', ')}.`
              : undefined,
          };
        } catch (error) {
          return {
            contract,
            status: 'error' as const,
            canCreate: false,
            issue: error instanceof Error ? error.message : 'Khong the xem truoc hoa don.',
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
        const reason = error instanceof Error ? error.message : 'Khong the tao hoa don.';
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

    let query = supabase
      .from('invoices')
      .select(INVOICE_SELECT, { count: 'exact' })
      .order('due_date', { ascending: false });

    if (status) {
      if (status === 'Unpaid') {
        query = query.in('status', ['draft', 'pending_payment', 'partially_paid'] as DbInvoiceStatus[]);
      } else {
        query = query.eq('status', mapInvoiceStatus.toDb(status) as DbInvoiceStatus);
      }
    }
    if (period) query = query.eq('billing_period', period);
    if (dueDateFrom) query = query.gte('due_date', dueDateFrom);
    if (dueDateTo) query = query.lte('due_date', dueDateTo);

    const isInMemoryNeeded = !!(buildingId || tenantId || search || minAmount !== undefined || maxAmount !== undefined || roomCode);
    const typedPage = Math.max(1, Number(page));
    const typedLimit = Math.max(1, Number(limit));

    if (!isInMemoryNeeded) {
      const from = (typedPage - 1) * typedLimit;
      const to = from + typedLimit - 1;
      query = query.range(from, to);
    } else {
      query = query.limit(1000);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(`Failed to fetch invoices: ${error.message}`);
    if (!data) throw new Error('Failed to fetch invoices: no data returned');

    let items = (data as unknown as DbInvoiceRow[]).map(mapDbRowToInvoice);

    if (isInMemoryNeeded) {
      items = items.filter((item) => {
        const matchesBuilding = !buildingId || String(item.buildingId) === String(buildingId);
        const matchesTenant = !tenantId || String(item.tenantId) === String(tenantId);
        const matchesAmountRange =
          (minAmount === undefined || item.totalAmount >= minAmount) &&
          (maxAmount === undefined || item.totalAmount <= maxAmount);
        const matchesRoom = !roomCode || normalizeForMatch(item.roomCode).includes(normalizeForMatch(roomCode));

        let matchesSearch = true;
        if (search) {
          const s = normalizeForMatch(search);
          matchesSearch =
            normalizeForMatch(item.invoiceCode).includes(s) ||
            normalizeForMatch(item.tenantName).includes(s) ||
            normalizeForMatch(item.roomCode).includes(s) ||
            normalizeForMatch(item.contractCode).includes(s) ||
            normalizeForMatch(item.buildingName).includes(s);
        }

        return matchesBuilding && matchesTenant && matchesSearch && matchesAmountRange && matchesRoom;
      });
    }

    const filteredTotal = isInMemoryNeeded ? items.length : (count ?? 0);

    if (isInMemoryNeeded) {
      items.sort((a, b) => {
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return bTime - aTime;
      });
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
    const invoiceRow = await unwrap(
      supabase
        .from('invoices')
        .select(INVOICE_SELECT)
        .eq('id', Number(id))
        .single()
    ) as unknown as DbInvoiceRow;

    const base = mapDbRowToInvoice(invoiceRow);

    const itemRows = await unwrap(
      supabase
        .from('invoice_items')
        .select('id, invoice_id, description, quantity, unit_price, line_total, item_type, sort_order')
        .eq('invoice_id', Number(id))
        .order('sort_order', { ascending: true, nullsFirst: false })
    ) as unknown as DbInvoiceItemRow[];

    const items: InvoiceItem[] = itemRows.map(mapDbItemToInvoiceItem);

    const paymentRows = await unwrap(
      supabase
        .from('payments')
        .select('id, payment_code, invoice_id, amount, method, payment_date, notes')
        .eq('invoice_id', Number(id))
        .order('payment_date', { ascending: false })
    ) as unknown as DbPaymentRow[];

    const payments: PaymentTransaction[] = paymentRows.map(mapDbPaymentToTransaction);
    const utilitySnapshot = (await unwrap(
      supabase
        .from('invoice_utility_snapshots')
        .select(`
          policy_source_type,
          resolved_policy_id,
          occupants_for_billing,
          occupied_days,
          days_in_period,
          prorate_ratio,
          rounding_increment,
          electric_base_amount,
          electric_device_surcharge,
          electric_subtotal,
          electric_season_multiplier,
          electric_location_multiplier,
          electric_raw_amount,
          electric_rounded_amount,
          min_electric_floor,
          electric_final_amount,
          water_base_amount,
          water_per_person_amount,
          water_person_charge,
          water_subtotal,
          water_location_multiplier,
          water_raw_amount,
          water_rounded_amount,
          min_water_floor,
          water_final_amount,
          resolved_device_surcharges_json,
          formula_snapshot_json,
          warnings_json
        `)
        .eq('invoice_id', Number(id))
        .maybeSingle()
    )) as unknown as DbUtilitySnapshotRow | null;

    return {
      ...base,
      items,
      payments,
      subTotal: invoiceRow.subtotal ?? 0,
      taxAmount: invoiceRow.tax_amount ?? 0,
      discountAmount: 0,
      overdueFee: 0,
      utilitySnapshot: utilitySnapshot
        ? {
            policySourceType: utilitySnapshot.policy_source_type,
            resolvedPolicyId: utilitySnapshot.resolved_policy_id,
            occupantsForBilling: Number(utilitySnapshot.occupants_for_billing ?? 0),
            occupiedDays: Number(utilitySnapshot.occupied_days ?? 0),
            daysInPeriod: Number(utilitySnapshot.days_in_period ?? 0),
            prorateRatio: Number(utilitySnapshot.prorate_ratio ?? 0),
            roundingIncrement: Number(utilitySnapshot.rounding_increment ?? 0),
            electricBaseAmount: Number(utilitySnapshot.electric_base_amount ?? 0),
            electricDeviceSurcharge: Number(utilitySnapshot.electric_device_surcharge ?? 0),
            electricSubtotal: Number(utilitySnapshot.electric_subtotal ?? 0),
            electricSeasonMultiplier: Number(utilitySnapshot.electric_season_multiplier ?? 1),
            electricLocationMultiplier: Number(utilitySnapshot.electric_location_multiplier ?? 1),
            electricRawAmount: Number(utilitySnapshot.electric_raw_amount ?? 0),
            electricRoundedAmount: Number(utilitySnapshot.electric_rounded_amount ?? 0),
            minElectricFloor: Number(utilitySnapshot.min_electric_floor ?? 0),
            electricFinalAmount: Number(utilitySnapshot.electric_final_amount ?? 0),
            waterBaseAmount: Number(utilitySnapshot.water_base_amount ?? 0),
            waterPerPersonAmount: Number(utilitySnapshot.water_per_person_amount ?? 0),
            waterPersonCharge: Number(utilitySnapshot.water_person_charge ?? 0),
            waterSubtotal: Number(utilitySnapshot.water_subtotal ?? 0),
            waterLocationMultiplier: Number(utilitySnapshot.water_location_multiplier ?? 1),
            waterRawAmount: Number(utilitySnapshot.water_raw_amount ?? 0),
            waterRoundedAmount: Number(utilitySnapshot.water_rounded_amount ?? 0),
            minWaterFloor: Number(utilitySnapshot.min_water_floor ?? 0),
            waterFinalAmount: Number(utilitySnapshot.water_final_amount ?? 0),
            resolvedDeviceSurcharges: Array.isArray(utilitySnapshot.resolved_device_surcharges_json)
              ? utilitySnapshot.resolved_device_surcharges_json.map((item) => ({
                  deviceCode: String(item.deviceCode ?? item.device_code ?? ''),
                  chargeAmount: Number(item.chargeAmount ?? item.charge_amount ?? 0),
                }))
              : [],
            formulaSnapshot:
              utilitySnapshot.formula_snapshot_json && typeof utilitySnapshot.formula_snapshot_json === 'object'
                ? utilitySnapshot.formula_snapshot_json
                : undefined,
            warnings: Array.isArray(utilitySnapshot.warnings_json) ? utilitySnapshot.warnings_json : [],
          }
        : undefined,
    };
  },

  initiatePayment: async (
    invoiceId: string,
    method: PaymentMethod,
    amount?: number
  ): Promise<{ success: boolean; redirectUrl?: string; message?: string }> => {
    if (import.meta.env.VITE_USE_EDGE_FUNCTIONS === 'true') {
      let paymentAmount = amount;
      if (paymentAmount === undefined) {
        const row = (await unwrap(
          supabase.from('invoices').select('total_amount, amount_paid').eq('id', Number(invoiceId)).single()
        )) as unknown as { total_amount: number | null; amount_paid: number | null };
        paymentAmount = (row.total_amount ?? 0) - (row.amount_paid ?? 0);
      }

      const methodMap: Record<PaymentMethod, string> = {
        Wallet: 'other',
        VNPay: 'vnpay',
        MoMo: 'momo',
        ZaloPay: 'zalopay',
        Transfer: 'bank_transfer',
      };

      const { error } = await supabase.functions.invoke('process-payment', {
        body: {
          invoiceId: Number(invoiceId),
          amount: paymentAmount,
          method: methodMap[method] ?? 'other',
          paymentDate: new Date().toISOString(),
          autoConfirm: true,
        },
      });
      if (error) throw new Error(error.message);
      return { success: true, message: 'Thanh toan da duoc ghi nhan' };
    }

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

    return { success: true, message: 'Thanh toan da duoc ghi nhan' };
  },

  sendNotification: async (invoiceId: string): Promise<void> => {
    console.info(`[invoiceService] Notification sent for invoice ${invoiceId}`);
  },

  createInvoice: async (input: CreateInvoiceInput): Promise<Invoice> => {
    const contractId = Number(input.contractId);
    if (!Number.isFinite(contractId)) {
      throw new Error('Hợp đồng không hợp lệ.');
    }
    if (!/^\d{4}-\d{2}$/.test(input.monthYear)) {
      throw new Error('Kỳ thanh toán không hợp lệ. Định dạng đúng là YYYY-MM.');
    }
    if (!input.dueDate) {
      throw new Error('Vui lòng chọn hạn thanh toán.');
    }

    const contractDraft = await fetchContractDraft(contractId);
    if ((contractDraft.utility_billing_type ?? 'policy') !== 'policy') {
      throw new Error('Hợp đồng này chưa được chuyển sang utility policy.');
    }
    if (!Number.isFinite(Number(contractDraft.occupants_for_billing)) || Number(contractDraft.occupants_for_billing) <= 0) {
      throw new Error('Hợp đồng thiếu occupants_for_billing hợp lệ.');
    }

    const data = await invokeCreateUtilityInvoice({
      contractId,
      monthYear: input.monthYear,
      dueDate: input.dueDate,
      discountAmount: input.discountAmount ?? 0,
      discountReason: input.discountReason?.trim() || undefined,
      note: input.note?.trim() || undefined,
    });

    const invoiceId = Number((data as { invoiceId?: number | string } | null)?.invoiceId);
    if (!Number.isFinite(invoiceId)) {
      throw new Error('Edge Function không trả về `invoiceId` hợp lệ sau khi tạo hóa đơn.');
    }

    const createdInvoice = (await unwrap(
      supabase
        .from('invoices')
        .select(INVOICE_SELECT)
        .eq('id', invoiceId)
        .single()
    )) as unknown as DbInvoiceRow;

    return mapDbRowToInvoice(createdInvoice);
  },

  logInvoiceView: async (_invoiceId: string): Promise<void> => {
    // no-op
  },
};

export default invoiceService;
export * from './portalInvoiceService';
