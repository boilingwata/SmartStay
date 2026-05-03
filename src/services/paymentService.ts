import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import type { DbPaymentMethod, DbWebhookStatus } from '@/types/supabase';
import {
  ChannelHealth,
  PaymentMethod,
  PaymentStatus,
  PaymentTransaction,
  WebhookLog,
  WebhookProvider,
  WebhookStatus,
} from '@/models/Payment';

type DbPaymentStatus =
  | 'pending'
  | 'submitted'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'rejected'
  | 'refunded';

interface InvoiceRelation {
  invoice_code: string;
  status: string | null;
  balance_due: number | null;
  contracts: {
    contract_tenants: {
      tenant_id: number;
      is_primary: boolean;
      tenants: { full_name: string } | null;
    }[];
  } | null;
}

interface DbPaymentRow {
  id: number;
  uuid: string;
  payment_code: string | null;
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
  status: DbPaymentStatus | null;
  confirmation_source: string | null;
  applied_at: string | null;
  payment_attempt_id: number | null;
  invoices: InvoiceRelation | null;
}

interface DbPaymentAttemptRow {
  id: number;
  uuid: string;
  invoice_id: number;
  amount: number;
  method: string;
  status: DbPaymentStatus;
  receipt_url: string | null;
  reference_number: string | null;
  bank_name: string | null;
  notes: string | null;
  rejection_reason: string | null;
  payment_id: number | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string | null;
  invoices: InvoiceRelation | null;
}

interface DbWebhookRow {
  id: number;
  provider: string;
  payload: unknown;
  received_at: string | null;
  processed_at: string | null;
  status: DbWebhookStatus | null;
  retry_count: number | null;
  error_message: string | null;
}

const TENANT_RELATION_SELECT = `
  invoice_code,
  status,
  balance_due,
  contracts (
    contract_tenants (
      tenant_id,
      is_primary,
      tenants ( full_name )
    )
  )
`.trim();

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
  status,
  confirmation_source,
  applied_at,
  payment_attempt_id,
  invoices (
    ${TENANT_RELATION_SELECT}
  )
`.trim();

const ATTEMPT_SELECT = `
  id,
  uuid,
  invoice_id,
  amount,
  method,
  status,
  receipt_url,
  reference_number,
  bank_name,
  notes,
  rejection_reason,
  payment_id,
  approved_at,
  rejected_at,
  created_at,
  invoices (
    ${TENANT_RELATION_SELECT}
  )
`.trim();

const REVIEWABLE_STATUSES: PaymentStatus[] = ['Pending', 'Submitted', 'Processing'];

function canOperateOnInvoice(payment: PaymentTransaction): boolean {
  const normalizedStatus = payment.invoiceStatus?.toLowerCase();

  if (normalizedStatus === 'paid' || normalizedStatus === 'cancelled') {
    return false;
  }

  if (typeof payment.invoiceBalanceDue === 'number') {
    return payment.invoiceBalanceDue > 0;
  }

  return true;
}

function parsePaymentRouteId(routeId: string): { source: 'payment' | 'attempt'; id: number } {
  const trimmed = routeId.trim();

  if (/^\d+$/.test(trimmed)) {
    return { source: 'payment', id: Number(trimmed) };
  }

  if (/^payment-\d+$/.test(trimmed)) {
    return { source: 'payment', id: Number(trimmed.replace('payment-', '')) };
  }

  if (/^attempt-\d+$/.test(trimmed)) {
    return { source: 'attempt', id: Number(trimmed.replace('attempt-', '')) };
  }

  throw new Error('Mã thanh toán không hợp lệ.');
}

function getPrimaryTenant(invoice: InvoiceRelation | null) {
  const contractTenants = invoice?.contracts?.contract_tenants ?? [];
  return contractTenants.find((contractTenant) => contractTenant.is_primary) ?? contractTenants[0] ?? null;
}

function sanitizeRejectedNote(note?: string | null): { note?: string; rejectionReason?: string } {
  const trimmed = note?.trim();
  if (!trimmed) return {};

  const rejectedPrefix = '[REJECTED]';
  if (!trimmed.startsWith(rejectedPrefix)) {
    return { note: trimmed };
  }

  const reason = trimmed.slice(rejectedPrefix.length).trim();
  return {
    note: undefined,
    rejectionReason: reason || undefined,
  };
}

function mapDbStatusToUi(status: DbPaymentStatus | null | undefined): PaymentStatus {
  switch (status) {
    case 'submitted':
      return 'Submitted';
    case 'processing':
      return 'Processing';
    case 'succeeded':
      return 'Confirmed';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    case 'rejected':
      return 'Rejected';
    case 'refunded':
      return 'Refunded';
    case 'pending':
    default:
      return 'Pending';
  }
}

function mapDbMethodToUi(method: string | null | undefined): PaymentMethod {
  switch ((method ?? '').toLowerCase()) {
    case 'cash':
    case 'tien_mat':
      return 'Cash';
    case 'bank_transfer':
    case 'chuyen_khoan':
      return 'BankTransfer';
    case 'vnpay':
      return 'VNPay';
    case 'momo':
    case 'momo_online':
      return 'Momo';
    case 'zalopay':
      return 'ZaloPay';
    default:
      return 'Other';
  }
}

function mapUiMethodToDb(method: PaymentMethod): DbPaymentMethod {
  switch (method) {
    case 'Cash':
      return 'cash';
    case 'BankTransfer':
      return 'bank_transfer';
    case 'VNPay':
      return 'vnpay';
    case 'Momo':
      return 'momo';
    case 'ZaloPay':
      return 'zalopay';
    case 'Other':
    default:
      return 'other';
  }
}

function mapDbProviderToUi(provider: string | null | undefined): WebhookProvider {
  switch ((provider ?? '').toLowerCase()) {
    case 'sepay':
      return 'SePay';
    case 'vnpay':
      return 'VNPay';
    case 'momo':
      return 'Momo';
    case 'zalopay':
      return 'ZaloPay';
    default:
      return 'Other';
  }
}

function mapDbWebhookStatusToUi(status: DbWebhookStatus | null | undefined): WebhookStatus {
  switch (status) {
    case 'processing':
      return 'Processing';
    case 'success':
      return 'Success';
    case 'failed':
      return 'Failed';
    case 'retry':
      return 'Retry';
    case 'received':
    default:
      return 'Received';
  }
}

function mapPaymentRow(row: DbPaymentRow): PaymentTransaction {
  const tenant = getPrimaryTenant(row.invoices);
  const sanitized = sanitizeRejectedNote(row.notes);

  return {
    id: String(row.id),
    routeId: String(row.id),
    source: 'Payment',
    transactionCode: row.payment_code?.trim() || row.reference_number?.trim() || `TT-${row.id}`,
    invoiceId: String(row.invoice_id),
    invoiceCode: row.invoices?.invoice_code ?? undefined,
    invoiceStatus: row.invoices?.status ?? undefined,
    invoiceBalanceDue: row.invoices?.balance_due != null ? Number(row.invoices.balance_due) : undefined,
    tenantId: tenant ? String(tenant.tenant_id) : '',
    tenantName: tenant?.tenants?.full_name ?? '',
    amount: Number(row.amount ?? 0),
    method: mapDbMethodToUi(row.method),
    status: mapDbStatusToUi(row.status),
    paidAt: row.payment_date,
    evidenceImage: row.receipt_url ?? undefined,
    rejectionReason: row.status === 'rejected' ? sanitized.rejectionReason : undefined,
    recordedBy: row.confirmed_by ?? undefined,
    note: sanitized.note,
    createdAt: row.created_at ?? row.payment_date,
    confirmedAt: row.confirmed_at ?? undefined,
    referenceNumber: row.reference_number ?? undefined,
    bankName: row.bank_name ?? undefined,
    confirmationSource: row.confirmation_source ?? undefined,
  };
}

function mapAttemptRow(row: DbPaymentAttemptRow): PaymentTransaction {
  const tenant = getPrimaryTenant(row.invoices);

  return {
    id: String(row.id),
    routeId: `attempt-${row.id}`,
    source: 'Attempt',
    transactionCode: row.reference_number?.trim() || `YC-TT-${String(row.id).padStart(5, '0')}`,
    invoiceId: String(row.invoice_id),
    invoiceCode: row.invoices?.invoice_code ?? undefined,
    invoiceStatus: row.invoices?.status ?? undefined,
    invoiceBalanceDue: row.invoices?.balance_due != null ? Number(row.invoices.balance_due) : undefined,
    tenantId: tenant ? String(tenant.tenant_id) : '',
    tenantName: tenant?.tenants?.full_name ?? '',
    amount: Number(row.amount ?? 0),
    method: mapDbMethodToUi(row.method),
    status: mapDbStatusToUi(row.status),
    paidAt: row.created_at ?? new Date().toISOString(),
    evidenceImage: row.receipt_url ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    note: row.notes?.trim() || undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
    confirmedAt: row.approved_at ?? undefined,
    referenceNumber: row.reference_number ?? undefined,
    bankName: row.bank_name ?? undefined,
  };
}

function filterPayments(
  payments: PaymentTransaction[],
  filters?: {
    status?: string;
    method?: string;
    search?: string;
    invoiceId?: string;
  },
): PaymentTransaction[] {
  let result = payments;

  if (filters?.invoiceId) {
    result = result.filter((payment) => payment.invoiceId === String(filters.invoiceId));
  }

  if (filters?.status && filters.status !== 'All') {
    result = result.filter((payment) => payment.status === filters.status);
  }

  if (filters?.method && filters.method !== 'All') {
    result = result.filter((payment) => payment.method === filters.method);
  }

  if (filters?.search?.trim()) {
    const normalizedSearch = filters.search.trim().toLowerCase();
    result = result.filter((payment) =>
      [
        payment.transactionCode,
        payment.invoiceCode,
        payment.tenantName,
        payment.referenceNumber,
        payment.note,
        payment.rejectionReason,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch)),
    );
  }

  return result.sort(
    (left, right) => new Date(right.createdAt || right.paidAt).getTime() - new Date(left.createdAt || left.paidAt).getTime(),
  );
}

async function fetchPaymentRows(invoiceId?: string): Promise<DbPaymentRow[]> {
  let query = supabase.from('payments').select(PAYMENT_SELECT).order('created_at', { ascending: false });

  if (invoiceId) {
    query = query.eq('invoice_id', Number(invoiceId));
  }

  return (await unwrap(query)) as unknown as DbPaymentRow[];
}

async function fetchPendingAttemptRows(invoiceId?: string): Promise<DbPaymentAttemptRow[]> {
  let query = supabase
    .from('payment_attempts')
    .select(ATTEMPT_SELECT)
    .is('payment_id', null)
    .order('created_at', { ascending: false });

  if (invoiceId) {
    query = query.eq('invoice_id', Number(invoiceId));
  }

  return (await unwrap(query)) as unknown as DbPaymentAttemptRow[];
}

async function invokeProcessPayment(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('process-payment', { body });
  if (error) {
    throw new Error(error.message);
  }
  return data as Record<string, unknown> | null;
}

export const paymentService = {
  getPayments: async (filters?: {
    status?: string;
    method?: string;
    search?: string;
    invoiceId?: string;
  }): Promise<PaymentTransaction[]> => {
    const [paymentRows, attemptRows] = await Promise.all([
      fetchPaymentRows(filters?.invoiceId),
      fetchPendingAttemptRows(filters?.invoiceId),
    ]);

    const items = [...paymentRows.map(mapPaymentRow), ...attemptRows.map(mapAttemptRow)];
    return filterPayments(items, filters);
  },

  getPaymentDetail: async (routeId: string): Promise<PaymentTransaction> => {
    const parsed = parsePaymentRouteId(routeId);

    if (parsed.source === 'attempt') {
      const row = (await unwrap(
        supabase.from('payment_attempts').select(ATTEMPT_SELECT).eq('id', parsed.id).single(),
      )) as unknown as DbPaymentAttemptRow;
      return mapAttemptRow(row);
    }

    const row = (await unwrap(
      supabase.from('payments').select(PAYMENT_SELECT).eq('id', parsed.id).single(),
    )) as unknown as DbPaymentRow;
    return mapPaymentRow(row);
  },

  getPendingCount: async (): Promise<{ count: number; total: number }> => {
    const [paymentRows, attemptRows] = await Promise.all([
      unwrap(supabase.from('payments').select('id, amount, status').eq('status', 'pending')),
      unwrap(
        supabase
          .from('payment_attempts')
          .select('id, amount, status')
          .is('payment_id', null)
          .in('status', ['pending', 'submitted', 'processing']),
      ),
    ]);

    const pendingPayments = (paymentRows as unknown as Array<{ amount: number | null }> | null) ?? [];
    const pendingAttempts = (attemptRows as unknown as Array<{ amount: number | null }> | null) ?? [];
    const total = [...pendingPayments, ...pendingAttempts].reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

    return {
      count: pendingPayments.length + pendingAttempts.length,
      total,
    };
  },

  approvePayment: async (routeId: string): Promise<boolean> => {
    const parsed = parsePaymentRouteId(routeId);

    await invokeProcessPayment(
      parsed.source === 'attempt'
        ? { paymentAttemptId: parsed.id, confirm: true }
        : { existingPaymentId: parsed.id, confirm: true },
    );
    return true;
  },

  rejectPayment: async (routeId: string, reason: string): Promise<boolean> => {
    const parsed = parsePaymentRouteId(routeId);
    const trimmedReason = reason.trim();

    if (trimmedReason.length < 3) {
      throw new Error('Vui lòng nhập lý do từ chối rõ ràng.');
    }

    await invokeProcessPayment(
      parsed.source === 'attempt'
        ? { paymentAttemptId: parsed.id, reject: true, reason: trimmedReason }
        : { existingPaymentId: parsed.id, reject: true, reason: trimmedReason },
    );
    return true;
  },

  recordPayment: async (
    payment: Omit<PaymentTransaction, 'id' | 'routeId' | 'source' | 'createdAt'>,
  ): Promise<PaymentTransaction> => {
    const invoiceId = Number(payment.invoiceId);
    if (!Number.isFinite(invoiceId)) {
      throw new Error('Hóa đơn thanh toán không hợp lệ.');
    }

    const autoConfirm = payment.status === 'Confirmed';
    const payload = {
      invoiceId,
      amount: payment.amount,
      method: mapUiMethodToDb(payment.method),
      paymentDate: payment.paidAt,
      notes: payment.note?.trim() || null,
      receiptUrl: payment.evidenceImage ?? null,
      referenceNumber: payment.transactionCode?.trim() || payment.referenceNumber || null,
      bankName: payment.bankName ?? null,
      autoConfirm,
      attemptStatus: autoConfirm ? null : 'submitted',
    };

    const data = await invokeProcessPayment(payload);
    const paymentId = Number(data?.paymentId);
    const attemptId = Number(data?.attemptId);

    if (Number.isFinite(paymentId) && paymentId > 0) {
      return paymentService.getPaymentDetail(String(paymentId));
    }

    if (Number.isFinite(attemptId) && attemptId > 0) {
      return paymentService.getPaymentDetail(`attempt-${attemptId}`);
    }

    throw new Error('Không nhận được mã thanh toán sau khi ghi nhận giao dịch.');
  },

  getWebhookLogs: async (): Promise<WebhookLog[]> => {
    const rows = (await unwrap(
      supabase
        .from('webhook_logs')
        .select('id, provider, payload, received_at, processed_at, status, retry_count, error_message')
        .order('received_at', { ascending: false })
        .limit(200),
    )) as unknown as DbWebhookRow[];

    return rows.map((row) => {
      const payload = (row.payload as Record<string, unknown> | null) ?? {};
      const txCode =
        String(payload.transaction_code ?? payload.reference_number ?? payload.transferContent ?? payload.content ?? '').trim();
      const rawAmount = payload.amount;
      const parsedAmount =
        typeof rawAmount === 'number'
          ? rawAmount
          : typeof rawAmount === 'string'
            ? Number(rawAmount.replace(/[^\d.-]/g, ''))
            : 0;

      return {
        id: String(row.id),
        provider: mapDbProviderToUi(row.provider),
        transactionCode: txCode || '--',
        amount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
        status: mapDbWebhookStatusToUi(row.status),
        receivedAt: row.received_at ?? '',
        processedAt: row.processed_at ?? undefined,
        retryCount: Number(row.retry_count ?? 0),
        maxRetries: 3,
        payloadJson: JSON.stringify(row.payload, null, 2),
        errorMessage: row.error_message ?? undefined,
      };
    });
  },

  getChannelHealth: async (): Promise<ChannelHealth[]> => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const rows = (await unwrap(
      supabase
        .from('webhook_logs')
        .select('provider, status, received_at')
        .gte('received_at', since)
        .order('received_at', { ascending: false }),
    )) as unknown as Array<{ provider: string; status: DbWebhookStatus | null; received_at: string | null }>;

    const grouped = new Map<WebhookProvider, Array<{ status: DbWebhookStatus | null; received_at: string | null }>>();
    for (const row of rows) {
      const provider = mapDbProviderToUi(row.provider);
      const current = grouped.get(provider) ?? [];
      current.push({ status: row.status, received_at: row.received_at });
      grouped.set(provider, current);
    }

    return Array.from(grouped.entries()).map(([provider, items]) => {
      const total24h = items.length;
      const failed24h = items.filter((item) => item.status === 'failed').length;
      const success24h = items.filter((item) => item.status === 'success').length;
      const successRate24h = total24h === 0 ? 0 : Math.round((success24h / total24h) * 100);
      const lastReceivedAt = items[0]?.received_at ?? '';

      let status: ChannelHealth['status'] = 'OK';
      if (total24h === 0 || successRate24h < 50) {
        status = 'Down';
      } else if (successRate24h < 90 || failed24h > 0) {
        status = 'Degraded';
      }

      return {
        provider,
        successRate24h,
        status,
        lastReceivedAt,
        total24h,
        failed24h,
      };
    });
  },

  retryWebhook: async (): Promise<boolean> => {
    throw new Error('Luồng chạy lại webhook an toàn chưa được triển khai ở backend.');
  },

  canApprovePayment: (payment: PaymentTransaction): boolean =>
    REVIEWABLE_STATUSES.includes(payment.status) && canOperateOnInvoice(payment),

  canRejectPayment: (payment: PaymentTransaction): boolean => {
    if (!REVIEWABLE_STATUSES.includes(payment.status) || !canOperateOnInvoice(payment)) {
      return false;
    }

    return true;
  },

  canReviewPayment: (payment: PaymentTransaction): boolean =>
    paymentService.canApprovePayment(payment) || paymentService.canRejectPayment(payment),

  getPaymentStatusLabel: (status: PaymentStatus): string => {
    switch (status) {
      case 'Submitted':
        return 'Đã gửi';
      case 'Processing':
        return 'Đang xử lý';
      case 'Confirmed':
        return 'Đã xác nhận';
      case 'Rejected':
        return 'Bị từ chối';
      case 'Cancelled':
        return 'Đã hủy';
      case 'Refunded':
        return 'Đã hoàn tiền';
      case 'Failed':
        return 'Thất bại';
      case 'Pending':
      default:
        return 'Chờ xử lý';
    }
  },

  getPaymentMethodLabel: (method: PaymentMethod | string): string => {
    switch (method) {
      case 'Cash':
        return 'Tiền mặt';
      case 'Transfer':
      case 'BankTransfer':
        return 'Chuyển khoản';
      case 'E-wallet':
        return 'Ví điện tử';
      case 'VNPay':
        return 'VNPay';
      case 'Momo':
        return 'MoMo';
      case 'ZaloPay':
        return 'ZaloPay';
      case 'Other':
      default:
        return 'Khác';
    }
  },

  getPaymentSourceLabel: (source: PaymentTransaction['source']): string =>
    source === 'Attempt' ? 'Yêu cầu chờ duyệt' : 'Thanh toán đã ghi nhận',

  getConfirmationSourceLabel: (source?: string): string => {
    switch ((source ?? '').toLowerCase()) {
      case 'admin_manual':
        return 'Nhân sự xác nhận thủ công';
      case 'cash':
        return 'Thu tiền mặt';
      case 'bank_reconciliation':
        return 'Đối soát ngân hàng';
      case 'momo_ipn':
        return 'Webhook MoMo';
      case 'sepay_webhook':
        return 'Webhook SePay';
      default:
        return source || '--';
    }
  },

  getWebhookStatusLabel: (status: WebhookStatus): string => {
    switch (status) {
      case 'Processing':
        return 'Đang xử lý';
      case 'Success':
        return 'Thành công';
      case 'Failed':
        return 'Thất bại';
      case 'Retry':
        return 'Chờ thử lại';
      case 'Received':
      default:
        return 'Đã nhận';
    }
  },

  getWebhookProviderLabel: (provider: WebhookProvider): string => {
    switch (provider) {
      case 'SePay':
        return 'SePay';
      case 'VNPay':
        return 'VNPay';
      case 'Momo':
        return 'MoMo';
      case 'ZaloPay':
        return 'ZaloPay';
      case 'Other':
      default:
        return 'Khác';
    }
  },

  generateCashCode: (): string => `TM-${Date.now()}-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
};

export default paymentService;
