import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import type { DbInvoiceStatus, DbPaymentMethod, Json } from '@/types/supabase';

type InvoiceRow = {
  id: number;
  invoice_code: string;
  contract_id: number;
  billing_period: string | null;
  total_amount: number | null;
  amount_paid: number | null;
  balance_due: number | null;
  due_date: string | null;
  paid_date: string | null;
  status: DbInvoiceStatus | null;
  notes: string | null;
  created_at: string | null;
  contracts: {
    contract_code: string;
    room_id: number;
    rooms: {
      room_code: string;
      buildings: {
        name: string;
      } | null;
    } | null;
    contract_tenants: Array<{
      tenant_id: number;
      is_primary: boolean | null;
      tenants: {
        full_name: string;
        phone: string | null;
      } | null;
    }>;
  } | null;
};

type InvoiceItemRow = {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number | null;
  unit_price: number;
  line_total: number;
  sort_order: number | null;
  created_at: string | null;
};

type PaymentRow = {
  id: number;
  payment_code: string;
  invoice_id: number;
  amount: number;
  method: DbPaymentMethod;
  bank_name: string | null;
  reference_number: string | null;
  receipt_url: string | null;
  payment_date: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  notes: string | null;
  created_at: string | null;
};

type ContractLinkRow = {
  contract_id: number;
};

type PaymentRpcResult = {
  attemptId?: number | null;
  paymentId?: number | null;
  paymentCode?: string | null;
  invoiceId: number;
  invoiceStatus: DbInvoiceStatus;
  amountPaid: number;
  balanceDue: number;
  attemptStatus?: string | null;
};

type MarkPaidRpcResult = {
  invoiceId: number;
  status: DbInvoiceStatus;
};

type CancelInvoiceRpcResult = {
  invoiceId: number;
  status: DbInvoiceStatus;
};

type PaymentSummaryRow = {
  amount: number;
  method: DbPaymentMethod;
  confirmed_at: string | null;
  payment_date: string;
};

type SystemSettingRow = {
  value: Json;
};

type RpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
};

export type PortalInvoiceStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export type InvoiceFilters = {
  status?: PortalInvoiceStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
};

export type InvoiceSort = 'due_date' | 'amount' | 'status';

export type PaymentMeta = {
  bankAccountName?: string;
  senderName?: string;
  receivedBy?: string;
  transactionId?: string;
  transferDate?: string;
};

export type BankTransferPayload = {
  amount: number;
  transfer_reference: string;
  bank_name?: string;
  bank_account_name?: string;
  transferred_at: string;
  notes?: string;
};

export type CashPaymentPayload = {
  amount: number;
  received_by?: string;
  notes?: string;
};

export type CardPaymentPayload = {
  amount: number;
  transaction_id?: string;
  notes?: string;
};

export type PortalPaymentMethodOption = {
  value: DbPaymentMethod;
  label: string;
  category: 'cash' | 'bank_transfer' | 'online';
};

export type PortalPaymentRecord = {
  id: string;
  paymentCode: string;
  invoiceId: string;
  amount: number;
  method: DbPaymentMethod;
  methodLabel: string;
  bankName: string | null;
  referenceNumber: string | null;
  receiptUrl: string | null;
  paymentDate: string;
  confirmedAt: string | null;
  confirmedBy: string | null;
  notes: string | null;
  rawNotes: string | null;
  transactionId: string | null;
  senderName: string | null;
  receivedBy: string | null;
  transferDate: string | null;
  status: 'confirmed' | 'pending_verification';
};

export type PortalInvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sortOrder: number;
  createdAt: string | null;
};

export type PortalBankDetails = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch: string;
  bankCode?: string;
};

export type PortalInvoice = {
  id: string;
  invoiceNumber: string;
  guestName: string;
  guestPhone: string | null;
  contractCode: string;
  contractId: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  status: PortalInvoiceStatus;
  schemaStatus: DbInvoiceStatus | null;
  dueDate: string | null;
  paidAt: string | null;
  billingPeriod: string | null;
  roomCode: string | null;
  buildingName: string | null;
  createdAt: string | null;
  notes: string | null;
};

export type PortalInvoiceDetail = PortalInvoice & {
  lineItems: PortalInvoiceItem[];
  paymentHistory: PortalPaymentRecord[];
  bankDetails: PortalBankDetails | null;
  paymentMethodOptions: PortalPaymentMethodOption[];
};

export type PaymentSummary = {
  totalCollected: number;
  paymentCount: number;
  confirmedCount: number;
  pendingVerificationCount: number;
  byMethod: Array<{
    method: DbPaymentMethod;
    amount: number;
    count: number;
  }>;
};

const PAYMENT_NOTE_PREFIX = '[smartstay-payment-meta]';

const PORTAL_PAYMENT_METHOD_OPTIONS: PortalPaymentMethodOption[] = [
  { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng', category: 'bank_transfer' },
  { value: 'cash', label: 'Tiền mặt', category: 'cash' },
  { value: 'momo', label: 'SePay QR tự động', category: 'online' },
];

const INVOICE_SELECT = `
  id,
  invoice_code,
  contract_id,
  billing_period,
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
      buildings ( name )
    ),
    contract_tenants (
      tenant_id,
      is_primary,
      tenants (
        full_name,
        phone
      )
    )
  )
`.trim();

function getEnvString(key: string): string {
  const value = import.meta.env[key];
  return typeof value === 'string' ? value.trim() : '';
}

export function buildSepayTransferContent(invoiceNumber: string): string {
  return `SMARTSTAY ${invoiceNumber}`;
}

function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function getCurrentIsoTimestamp(): string {
  return new Date().toISOString();
}

async function getCurrentTenantId(): Promise<number> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Bạn cần đăng nhập để xem hóa đơn.');
  }

  const rows = (await unwrap(
    supabase
      .from('tenants')
      .select('id')
      .eq('profile_id', user.id)
      .eq('is_deleted', false)
      .limit(1)
  )) as unknown as Array<{ id: number }>;

  const tenantId = rows[0]?.id;
  if (!tenantId) {
    throw new Error('Tài khoản này chưa được liên kết với hồ sơ khách thuê.');
  }

  return tenantId;
}

async function getContractIdsForCurrentTenant(): Promise<number[]> {
  const tenantId = await getCurrentTenantId();

  const rows = (await unwrap(
    supabase
      .from('contract_tenants')
      .select('contract_id')
      .eq('tenant_id', tenantId)
  )) as unknown as ContractLinkRow[];

  return rows.map((row) => row.contract_id);
}

function mapInvoiceStatus(status: DbInvoiceStatus | null, dueDate: string | null): PortalInvoiceStatus {
  if (status === 'paid') return 'paid';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'overdue') return 'overdue';
  if (status === 'partially_paid') return 'partial';
  if (status === 'pending_payment' || status === 'draft' || status == null) {
    if (!dueDate) return 'pending';
    const today = new Date();
    const due = new Date(dueDate);
    if (!Number.isNaN(due.getTime()) && due < new Date(today.toDateString())) {
      return 'overdue';
    }
    return 'pending';
  }
  return 'pending';
}

function getPaymentMethodLabel(method: DbPaymentMethod): string {
  return PORTAL_PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label ?? method;
}

function parsePaymentNote(rawNotes: string | null): { note: string | null; meta: PaymentMeta } {
  if (!rawNotes) {
    return { note: null, meta: {} };
  }

  if (!rawNotes.startsWith(PAYMENT_NOTE_PREFIX)) {
    return { note: rawNotes, meta: {} };
  }

  const newlineIndex = rawNotes.indexOf('\n');
  const encodedMeta = newlineIndex === -1 ? rawNotes.slice(PAYMENT_NOTE_PREFIX.length) : rawNotes.slice(PAYMENT_NOTE_PREFIX.length, newlineIndex);
  const note = newlineIndex === -1 ? null : rawNotes.slice(newlineIndex + 1).trim() || null;

  try {
    const parsed = JSON.parse(encodedMeta) as PaymentMeta;
    return { note, meta: parsed };
  } catch {
    return { note: rawNotes, meta: {} };
  }
}

function buildPaymentNote(meta: PaymentMeta, note?: string): string | null {
  const cleanedMeta = Object.fromEntries(
    Object.entries(meta).filter(([, value]) => value != null && value !== '')
  ) as PaymentMeta;

  const trimmedNote = note?.trim() || '';
  if (Object.keys(cleanedMeta).length === 0) {
    return trimmedNote || null;
  }

  return `${PAYMENT_NOTE_PREFIX}${JSON.stringify(cleanedMeta)}${trimmedNote ? `\n${trimmedNote}` : ''}`;
}

function pickPrimaryTenant(row: InvoiceRow): { fullName: string; phone: string | null } {
  const tenants = row.contracts?.contract_tenants ?? [];
  const primary = tenants.find((tenant) => tenant.is_primary) ?? tenants[0];
  return {
    fullName: primary?.tenants?.full_name ?? 'Unknown guest',
    phone: primary?.tenants?.phone ?? null,
  };
}

function mapInvoiceRow(row: InvoiceRow): PortalInvoice {
  const primaryTenant = pickPrimaryTenant(row);
  const amountDue = Number(row.total_amount ?? 0);
  const amountPaid = Number(row.amount_paid ?? 0);
  const balance = Number(row.balance_due ?? Math.max(0, amountDue - amountPaid));

  return {
    id: String(row.id),
    invoiceNumber: row.invoice_code,
    guestName: primaryTenant.fullName,
    guestPhone: primaryTenant.phone,
    contractCode: row.contracts?.contract_code ?? '',
    contractId: String(row.contract_id),
    amountDue,
    amountPaid,
    balance,
    status: mapInvoiceStatus(row.status, row.due_date),
    schemaStatus: row.status,
    dueDate: row.due_date,
    paidAt: row.paid_date,
    billingPeriod: row.billing_period,
    roomCode: row.contracts?.rooms?.room_code ?? null,
    buildingName: row.contracts?.rooms?.buildings?.name ?? null,
    createdAt: row.created_at,
    notes: row.notes,
  };
}

function mapInvoiceItemRow(row: InvoiceItemRow): PortalInvoiceItem {
  return {
    id: String(row.id),
    description: row.description,
    quantity: Number(row.quantity ?? 1),
    unitPrice: Number(row.unit_price),
    lineTotal: Number(row.line_total),
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
  };
}

function mapPaymentRow(row: PaymentRow): PortalPaymentRecord {
  const { note, meta } = parsePaymentNote(row.notes);
  const transactionId = meta.transactionId ?? row.stripe_payment_intent_id ?? row.stripe_charge_id ?? row.reference_number;

  return {
    id: String(row.id),
    paymentCode: row.payment_code,
    invoiceId: String(row.invoice_id),
    amount: Number(row.amount),
    method: row.method,
    methodLabel: getPaymentMethodLabel(row.method),
    bankName: row.bank_name,
    referenceNumber: row.reference_number,
    receiptUrl: row.receipt_url,
    paymentDate: row.payment_date,
    confirmedAt: row.confirmed_at,
    confirmedBy: row.confirmed_by,
    notes: note,
    rawNotes: row.notes,
    transactionId: transactionId ?? null,
    senderName: meta.senderName ?? meta.bankAccountName ?? null,
    receivedBy: meta.receivedBy ?? null,
    transferDate: meta.transferDate ?? null,
    status: row.confirmed_at ? 'confirmed' : 'pending_verification',
  };
}

function applyInvoiceFilters(items: PortalInvoice[], filters?: InvoiceFilters): PortalInvoice[] {
  if (!filters) return items;

  const search = filters.search ? normalizeText(filters.search) : '';

  return items.filter((item) => {
    const matchesStatus = !filters.status || item.status === filters.status;
    const matchesFrom = !filters.dateFrom || (!!item.dueDate && item.dueDate >= filters.dateFrom);
    const matchesTo = !filters.dateTo || (!!item.dueDate && item.dueDate <= filters.dateTo);
    const matchesSearch =
      !search ||
      normalizeText(item.invoiceNumber).includes(search) ||
      normalizeText(item.guestName).includes(search) ||
      normalizeText(item.contractCode).includes(search);

    return matchesStatus && matchesFrom && matchesTo && matchesSearch;
  });
}

function ensureValidPaymentAmount(invoice: PortalInvoice, amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Payment amount must be greater than 0.');
  }

  if (amount > invoice.balance) {
    throw new Error('Payment amount cannot exceed the remaining balance.');
  }
}

async function getInvoiceForMutation(invoiceId: string): Promise<PortalInvoice> {
  const detail = await fetchInvoiceById(invoiceId);
  return detail;
}

async function fetchBankTransferDetails(): Promise<PortalBankDetails | null> {
  const envBankName = getEnvString('VITE_BANK_NAME');
  const envBankCode = getEnvString('VITE_BANK_CODE');
  const envAccountNumber = getEnvString('VITE_BANK_ACCOUNT_NUMBER');
  const envAccountName = getEnvString('VITE_BANK_ACCOUNT_NAME');
  const envBranch = getEnvString('VITE_BANK_BRANCH');

  if (envBankName || envBankCode || envAccountNumber || envAccountName || envBranch) {
    return {
      bankName: envBankName,
      bankCode: envBankCode || undefined,
      accountNumber: envAccountNumber,
      accountName: envAccountName,
      branch: envBranch,
    };
  }

  const row = (await unwrap(
    supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'payment.bank_transfer_details')
      .maybeSingle()
  )) as unknown as SystemSettingRow | null;

  const value = row?.value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const bankName = typeof value.bankName === 'string' ? value.bankName : '';
  const accountNumber = typeof value.accountNumber === 'string' ? value.accountNumber : '';
  const accountName = typeof value.accountName === 'string' ? value.accountName : '';
  const branch = typeof value.branch === 'string' ? value.branch : '';
  const bankCode = typeof value.bankCode === 'string' ? value.bankCode : '';

  if (!bankName && !accountNumber && !accountName && !branch && !bankCode) {
    return null;
  }

  return { bankName, accountNumber, accountName, branch, bankCode };
}

async function recordInvoicePayment(
  invoiceId: string,
  method: DbPaymentMethod,
  amount: number,
  paymentDate: string,
  note: string | undefined,
  referenceNumber?: string,
  bankName?: string
): Promise<PortalInvoiceDetail> {
  const invoice = await getInvoiceForMutation(invoiceId);
  ensureValidPaymentAmount(invoice, amount);

  const rpcClient = supabase as unknown as RpcClient;
  const { data, error } = await rpcClient.rpc('portal_record_invoice_payment', {
    p_invoice_id: Number(invoiceId),
    p_amount: amount,
    p_method: method,
    p_payment_date: paymentDate,
    p_notes: note ?? null,
    p_reference: referenceNumber ?? null,
    p_bank_name: bankName ?? null,
  });

  if (error) {
    throw new Error(`Failed to record payment: ${error.message}`);
  }

  const rpcResult = data as PaymentRpcResult | null;
  if (!rpcResult?.attemptId && !rpcResult?.paymentId) {
    throw new Error('Payment request was not recorded correctly.');
  }

  return fetchInvoiceById(invoiceId);
}

export async function fetchInvoices(filters?: InvoiceFilters): Promise<PortalInvoice[]> {
  try {
    const contractIds = await getContractIdsForCurrentTenant();
    if (contractIds.length === 0) return [];

    const rows = (await unwrap(
      supabase
        .from('invoices')
        .select(INVOICE_SELECT)
        .in('contract_id', contractIds)
        .order('due_date', { ascending: false })
    )) as unknown as InvoiceRow[];

    return applyInvoiceFilters(rows.map(mapInvoiceRow), filters);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể tải danh sách hóa đơn.';
    throw new Error(message);
  }
}

export async function fetchInvoiceById(invoiceId: string): Promise<PortalInvoiceDetail> {
  try {
    const contractIds = await getContractIdsForCurrentTenant();
    if (contractIds.length === 0) {
      throw new Error('Không tìm thấy hợp đồng nào gắn với khách thuê này.');
    }

    const invoiceRow = (await unwrap(
      supabase
        .from('invoices')
        .select(INVOICE_SELECT)
        .eq('id', Number(invoiceId))
        .in('contract_id', contractIds)
        .single()
    )) as unknown as InvoiceRow;

    const [itemRows, paymentRows, bankDetails] = await Promise.all([
      unwrap(
        supabase
          .from('invoice_items')
          .select('id, invoice_id, description, quantity, unit_price, line_total, sort_order, created_at')
          .eq('invoice_id', Number(invoiceId))
          .order('sort_order', { ascending: true })
      ) as unknown as Promise<InvoiceItemRow[]>,
      unwrap(
        supabase
          .from('payments')
          .select('id, payment_code, invoice_id, amount, method, bank_name, reference_number, receipt_url, payment_date, confirmed_by, confirmed_at, stripe_payment_intent_id, stripe_charge_id, notes, created_at')
          .eq('invoice_id', Number(invoiceId))
          .order('payment_date', { ascending: false })
      ) as unknown as Promise<PaymentRow[]>,
      fetchBankTransferDetails(),
    ]);

    return {
      ...mapInvoiceRow(invoiceRow),
      lineItems: itemRows.map(mapInvoiceItemRow),
      paymentHistory: paymentRows.map(mapPaymentRow),
      bankDetails,
      paymentMethodOptions: PORTAL_PAYMENT_METHOD_OPTIONS,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể tải chi tiết hóa đơn.';
    throw new Error(message);
  }
}

export async function recordBankTransfer(invoiceId: string, payload: BankTransferPayload): Promise<PortalInvoiceDetail> {
  try {
    const note = buildPaymentNote(
      {
        senderName: payload.bank_account_name,
        transferDate: payload.transferred_at,
      },
      payload.notes
    );

    return await recordInvoicePayment(
      invoiceId,
      'bank_transfer',
      payload.amount,
      payload.transferred_at,
      note ?? undefined,
      payload.transfer_reference,
      payload.bank_name
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể ghi nhận yêu cầu chuyển khoản.';
    throw new Error(message);
  }
}

export async function recordCashPayment(invoiceId: string, payload: CashPaymentPayload): Promise<PortalInvoiceDetail> {
  try {
    const note = buildPaymentNote(
      {
        receivedBy: payload.received_by,
      },
      payload.notes
    );

    return await recordInvoicePayment(invoiceId, 'cash', payload.amount, getCurrentIsoTimestamp(), note ?? undefined);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể ghi nhận yêu cầu tiền mặt.';
    throw new Error(message);
  }
}

export async function recordCardPayment(invoiceId: string, payload: CardPaymentPayload & { method?: DbPaymentMethod }): Promise<PortalInvoiceDetail> {
  try {
    const invoice = await getInvoiceForMutation(invoiceId);
    const bankDetails = await fetchBankTransferDetails();
    const transferCode = buildSepayTransferContent(invoice.invoiceNumber);
    const note = buildPaymentNote(
      {
        transactionId: transferCode,
      },
      payload.notes
    );

    return await recordInvoicePayment(
      invoiceId,
      'bank_transfer',
      payload.amount,
      getCurrentIsoTimestamp(),
      note ?? undefined,
      transferCode,
      bankDetails?.bankName || 'SePay'
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể tạo yêu cầu thanh toán SePay.';
    throw new Error(message);
  }
}

export async function markInvoicePaid(invoiceId: string): Promise<PortalInvoiceDetail> {
  try {
    const detail = await fetchInvoiceById(invoiceId);
    if (detail.balance !== 0) {
      throw new Error('Chỉ có thể đánh dấu đã thanh toán khi số dư bằng 0.');
    }

    const rpcClient = supabase as unknown as RpcClient;
    const { data, error } = await rpcClient.rpc('portal_mark_invoice_paid', {
      p_invoice_id: Number(invoiceId),
    });

    if (error) {
      throw new Error(`Failed to mark invoice paid: ${error.message}`);
    }

    const rpcResult = data as MarkPaidRpcResult | null;
    if (!rpcResult?.invoiceId) {
      throw new Error('Trạng thái hóa đơn chưa được cập nhật.');
    }

    return fetchInvoiceById(invoiceId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể đánh dấu hóa đơn đã thanh toán.';
    throw new Error(message);
  }
}

export async function cancelInvoice(invoiceId: string, reason: string): Promise<PortalInvoiceDetail> {
  try {
    const rpcClient = supabase as unknown as RpcClient;
    const { data, error } = await rpcClient.rpc('portal_cancel_invoice', {
      p_invoice_id: Number(invoiceId),
      p_reason: reason,
    });

    if (error) {
      throw new Error(`Failed to cancel invoice: ${error.message}`);
    }

    const rpcResult = data as CancelInvoiceRpcResult | null;
    if (!rpcResult?.invoiceId) {
      throw new Error('Hóa đơn chưa được hủy.');
    }

    return fetchInvoiceById(invoiceId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể hủy hóa đơn.';
    throw new Error(message);
  }
}

export async function fetchPaymentSummary(dateRange: { from: string; to: string }): Promise<PaymentSummary> {
  try {
    const rows = (await unwrap(
      supabase
        .from('payments')
        .select('amount, method, confirmed_at, payment_date')
        .gte('payment_date', dateRange.from)
        .lte('payment_date', dateRange.to)
    )) as unknown as PaymentSummaryRow[];

    const byMethodMap = new Map<DbPaymentMethod, { amount: number; count: number }>();

    for (const row of rows) {
      const current = byMethodMap.get(row.method) ?? { amount: 0, count: 0 };
      current.amount += Number(row.amount);
      current.count += 1;
      byMethodMap.set(row.method, current);
    }

    return {
      totalCollected: rows.reduce((sum, row) => sum + Number(row.amount), 0),
      paymentCount: rows.length,
      confirmedCount: rows.filter((row) => !!row.confirmed_at).length,
      pendingVerificationCount: rows.filter((row) => !row.confirmed_at).length,
      byMethod: Array.from(byMethodMap.entries()).map(([method, value]) => ({
        method,
        amount: value.amount,
        count: value.count,
      })),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể tải tổng hợp thanh toán.';
    throw new Error(message);
  }
}

export function sortInvoices(items: PortalInvoice[], sortBy: InvoiceSort): PortalInvoice[] {
  const sorted = [...items];

  if (sortBy === 'amount') {
    sorted.sort((left, right) => right.amountDue - left.amountDue);
    return sorted;
  }

  if (sortBy === 'status') {
    const order: Record<PortalInvoiceStatus, number> = {
      overdue: 0,
      pending: 1,
      partial: 2,
      paid: 3,
      cancelled: 4,
    };
    sorted.sort((left, right) => order[left.status] - order[right.status]);
    return sorted;
  }

  sorted.sort((left, right) => {
    const leftValue = left.dueDate ? new Date(left.dueDate).getTime() : 0;
    const rightValue = right.dueDate ? new Date(right.dueDate).getTime() : 0;
    return rightValue - leftValue;
  });
  return sorted;
}

export function buildOptimisticPaymentRecord(input: {
  invoiceId: string;
  amount: number;
  method: DbPaymentMethod;
  bankName?: string;
  referenceNumber?: string;
  notes?: string;
  transactionId?: string;
  senderName?: string;
  receivedBy?: string;
  transferDate?: string;
}): PortalPaymentRecord {
  const now = getCurrentIsoTimestamp();

  return {
    id: `temp-${now}`,
    paymentCode: 'Pending',
    invoiceId: input.invoiceId,
    amount: input.amount,
    method: input.method,
    methodLabel: getPaymentMethodLabel(input.method),
    bankName: input.bankName ?? null,
    referenceNumber: input.referenceNumber ?? null,
    receiptUrl: null,
    paymentDate: now,
    confirmedAt: now,
    confirmedBy: null,
    notes: input.notes ?? null,
    rawNotes: input.notes ?? null,
    transactionId: input.transactionId ?? null,
    senderName: input.senderName ?? null,
    receivedBy: input.receivedBy ?? null,
    transferDate: input.transferDate ?? null,
    status: 'confirmed',
  };
}

export function applyOptimisticInvoicePayment(invoice: PortalInvoiceDetail, payment: PortalPaymentRecord): PortalInvoiceDetail {
  const amountPaid = invoice.amountPaid + payment.amount;
  const balance = Math.max(0, invoice.amountDue - amountPaid);
  const status: PortalInvoiceStatus = balance === 0 ? 'paid' : amountPaid > 0 ? 'partial' : invoice.status;

  return {
    ...invoice,
    amountPaid,
    balance,
    status,
    schemaStatus: balance === 0 ? 'paid' : amountPaid > 0 ? 'partially_paid' : invoice.schemaStatus,
    paidAt: balance === 0 ? payment.paymentDate : invoice.paidAt,
    paymentHistory: [payment, ...invoice.paymentHistory],
  };
}

export function updateInvoiceListItem(items: PortalInvoice[], detail: PortalInvoiceDetail): PortalInvoice[] {
  return items.map((item) =>
    item.id === detail.id
      ? {
          ...item,
          amountPaid: detail.amountPaid,
          balance: detail.balance,
          status: detail.status,
          schemaStatus: detail.schemaStatus,
          paidAt: detail.paidAt,
        }
      : item
  );
}

export { PORTAL_PAYMENT_METHOD_OPTIONS };
