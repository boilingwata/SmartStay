// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../_shared/deno-globals.d.ts" />
// eslint-disable no-console -- console.error is appropriate for Deno Edge Function server-side logging

import { handleOptions } from '../_shared/cors.ts';
import { requireOwner, requireAuth, type Caller } from '../_shared/auth.ts';
import { createAdminClient } from '../_shared/supabaseAdmin.ts';
import { errorResponse, successResponse } from '../_shared/errors.ts';

// Branch A: create a new payment for an invoice
interface NewPaymentRequest {
  invoiceId: number;
  amount: number;
  method: string;
  paymentDate: string;
  notes?: string;
  receiptUrl?: string;
  referenceNumber?: string;
  bankName?: string;
  autoConfirm?: boolean;
  idempotencyKey?: string;
  attemptStatus?: string;
}

// Branch B: approve an existing pending payment
interface ApprovePaymentRequest {
  existingPaymentId?: number;
  paymentAttemptId?: number;
  confirm: true;
}

interface RejectPaymentRequest {
  existingPaymentId?: number;
  paymentAttemptId?: number;
  reject: true;
  reason: string;
}

type ProcessPaymentRequest = NewPaymentRequest | ApprovePaymentRequest | RejectPaymentRequest;

async function hmacSha256(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function isApprove(body: ProcessPaymentRequest): body is ApprovePaymentRequest {
  return (
    ('existingPaymentId' in body || 'paymentAttemptId' in body)
    && (body as ApprovePaymentRequest).confirm === true
  );
}

function isReject(body: ProcessPaymentRequest): body is RejectPaymentRequest {
  return (
    ('existingPaymentId' in body || 'paymentAttemptId' in body)
    && (body as RejectPaymentRequest).reject === true
  );
}

const VALID_METHODS = ['cash', 'bank_transfer', 'momo', 'zalopay', 'vnpay', 'other'];

type AdminClient = ReturnType<typeof createAdminClient>;

async function callerOwnsInvoice(db: AdminClient, invoiceId: number, userId: string): Promise<boolean> {
  const { data: invoice, error: invoiceError } = await db
    .from('invoices')
    .select('contract_id')
    .eq('id', invoiceId)
    .maybeSingle();

  if (invoiceError || !invoice?.contract_id) return false;

  const { data: tenantRows, error: tenantsError } = await db
    .from('tenants')
    .select('id')
    .eq('profile_id', userId)
    .eq('is_deleted', false);

  if (tenantsError || !tenantRows || tenantRows.length === 0) return false;

  const { data: participant, error: participantError } = await db
    .from('contract_tenants')
    .select('tenant_id')
    .eq('contract_id', invoice.contract_id)
    .in('tenant_id', tenantRows.map((row) => row.id))
    .maybeSingle();

  if (participantError) return false;
  return !!participant;
}

function normalizeAutoConfirm(value: unknown): boolean {
  return value === true;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleOptions();

  let body: ProcessPaymentRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const db = createAdminClient();

  // --- Branch C: Reject existing payment or attempt ---
  if (isReject(body)) {
    const { caller, denied } = await requireOwner(req);
    if (denied) return denied;

    const { existingPaymentId, paymentAttemptId, reason } = body;
    const trimmedReason = reason?.trim();

    if (
      (existingPaymentId == null || typeof existingPaymentId !== 'number')
      && (paymentAttemptId == null || typeof paymentAttemptId !== 'number')
    ) {
      return errorResponse('existingPaymentId hoặc paymentAttemptId phải là số.');
    }

    if (!trimmedReason) {
      return errorResponse('Lý do từ chối là bắt buộc.');
    }

    if (paymentAttemptId != null) {
      const now = new Date().toISOString();
      const { data: attempt, error: attemptError } = await db
        .from('payment_attempts')
        .select('id, status, payment_id')
        .eq('id', paymentAttemptId)
        .single();

      if (attemptError) {
        console.error('[process-payment] load payment_attempts error:', attemptError);
        return errorResponse(attemptError.message, 500);
      }

      if (attempt.payment_id != null) {
        return errorResponse('Yêu cầu này đã được chuyển thành thanh toán, vui lòng xử lý trên bản ghi thanh toán.', 409);
      }

      if (attempt.status === 'succeeded') {
        return errorResponse('Yêu cầu này đã được duyệt, không thể từ chối.', 409);
      }

      const { error } = await db
        .from('payment_attempts')
        .update({
          status: 'rejected',
          rejection_reason: trimmedReason,
          rejected_at: now,
          rejected_by: caller!.userId,
          updated_at: now,
        })
        .eq('id', paymentAttemptId)
        .is('payment_id', null);

      if (error) {
        console.error('[process-payment] reject payment_attempt error:', error);
        return errorResponse(error.message, 500);
      }

      return successResponse({
        attemptId: paymentAttemptId,
        status: 'rejected',
      });
    }

    const { data: payment, error: paymentLoadError } = await db
      .from('payments')
      .select('id, status')
      .eq('id', existingPaymentId!)
      .single();

    if (paymentLoadError) {
      console.error('[process-payment] load payments error:', paymentLoadError);
      return errorResponse(paymentLoadError.message, 500);
    }

    if (payment.status === 'succeeded') {
      return errorResponse('Thanh toán này đã được xác nhận, không thể từ chối.', 409);
    }

    const { error } = await db
      .from('payments')
      .update({
        status: 'rejected',
        notes: `[REJECTED] ${trimmedReason}`,
      })
      .eq('id', existingPaymentId!);

    if (error) {
      console.error('[process-payment] reject payment error:', error);
      return errorResponse(error.message, 500);
    }

    return successResponse({
      paymentId: existingPaymentId,
      status: 'rejected',
    });
  }

  // --- Branch B: Approve existing payment ---
  if (isApprove(body)) {
    const { caller, denied } = await requireOwner(req);
    if (denied) return denied;

    const { existingPaymentId, paymentAttemptId } = body;

    if (
      (existingPaymentId == null || typeof existingPaymentId !== 'number')
      && (paymentAttemptId == null || typeof paymentAttemptId !== 'number')
    ) {
      return errorResponse('existingPaymentId or paymentAttemptId must be a number');
    }

    const { data, error } = await db.rpc('approve_payment', {
      p_payment_id:   existingPaymentId ?? 0,
      p_confirmed_by: caller!.userId,
      p_attempt_id:   paymentAttemptId ?? null,
    });

    if (error) {
      console.error('[process-payment] approve_payment RPC error:', error);
      return errorResponse(error.message, 500);
    }

    const result = data as {
      paymentId: number;
      invoiceId: number;
      invoiceStatus: string;
      amountPaid: number;
      balanceDue: number;
    };

    return successResponse({
      paymentId:     result.paymentId,
      invoiceId:     result.invoiceId,
      invoiceStatus: result.invoiceStatus,
      amountPaid:    result.amountPaid,
      balanceDue:    result.balanceDue,
    });
  }

  // --- Branch A: New payment ---
  let caller: Caller;
  try {
    caller = await requireAuth(req);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Authentication failed', 401);
  }

  const {
    invoiceId,
    amount,
    method,
    paymentDate,
    notes,
    receiptUrl,
    referenceNumber,
    bankName,
    autoConfirm: rawAutoConfirm,
    idempotencyKey,
    attemptStatus: rawAttemptStatus,
  } = body as NewPaymentRequest;

  const autoConfirm = normalizeAutoConfirm(rawAutoConfirm);

  if (!invoiceId || typeof invoiceId !== 'number') {
    return errorResponse('invoiceId must be a number');
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return errorResponse('amount must be a positive number');
  }
  if (!method || !VALID_METHODS.includes(method)) {
    return errorResponse(`method must be one of: ${VALID_METHODS.join(', ')}`);
  }
  if (!paymentDate) {
    return errorResponse('paymentDate is required');
  }

  if (autoConfirm) {
    const { caller: ownerCaller, denied } = await requireOwner(req);
    if (denied) return denied;
    caller = ownerCaller!;
  } else if (caller.role === 'staff') {
    return errorResponse('Owner access required for staff payment handling', 403);
  } else if (caller.role === 'tenant') {
    const ownsInvoice = await callerOwnsInvoice(db, invoiceId, caller.userId);
    if (!ownsInvoice) {
      return errorResponse('Invoice not found or access denied', 403);
    }
  }

  const attemptStatus = autoConfirm
    ? rawAttemptStatus
    : method === 'momo'
      ? 'processing'
      : 'submitted';

  if (method === 'momo' && !autoConfirm) {
    const partnerCode = Deno.env.get('MOMO_PARTNER_CODE') ?? '';
    const accessKey = Deno.env.get('MOMO_ACCESS_KEY') ?? '';
    const secretKey = Deno.env.get('MOMO_SECRET_KEY') ?? '';
    const partnerName = Deno.env.get('MOMO_PARTNER_NAME') ?? 'SmartStay';
    const storeId = Deno.env.get('MOMO_STORE_ID') ?? 'SmartStay';
    const redirectUrl = Deno.env.get('MOMO_REDIRECT_URL') ?? `${Deno.env.get('SITE_URL') ?? ''}/portal/invoices`;
    const ipnUrl = Deno.env.get('MOMO_IPN_URL') ?? `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-payment?provider=momo`;
    const endpoint = Deno.env.get('MOMO_API_ENDPOINT') ?? 'https://test-payment.momo.vn/v2/gateway/api/create';

    if (!partnerCode || !accessKey || !secretKey || !redirectUrl || !ipnUrl) {
      return errorResponse('MoMo chưa được cấu hình đầy đủ trên server.', 500);
    }

    const orderId = `INV${invoiceId}-${Date.now()}`;
    const requestId = crypto.randomUUID();
    const extraData = '';
    const rawSignature =
      `accessKey=${accessKey}&amount=${Math.round(amount)}&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=Thanh toán hóa đơn ${invoiceId}` +
      `&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}&requestType=captureWallet`;

    const signature = await hmacSha256(secretKey, rawSignature);

    const { data, error } = await db.rpc('process_payment', {
      p_invoice_id: invoiceId,
      p_amount: amount,
      p_method: 'momo',
      p_payment_date: paymentDate,
      p_notes: notes ?? null,
      p_receipt_url: receiptUrl ?? null,
      p_reference: orderId,
      p_bank_name: null,
      p_confirmed_by: caller.userId,
      p_auto_confirm: false,
      p_idempotency_key: idempotencyKey ?? `momo:${orderId}`,
      p_attempt_status: 'processing',
    });

    if (error) {
      console.error('[process-payment] momo process_payment RPC error:', error);
      return errorResponse(error.message, 500);
    }

    const momoResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerCode,
        partnerName,
        storeId,
        requestType: 'captureWallet',
        ipnUrl,
        redirectUrl,
        orderId,
        amount: String(Math.round(amount)),
        orderInfo: `Thanh toán hóa đơn ${invoiceId}`,
        requestId,
        extraData,
        lang: 'vi',
        autoCapture: true,
        signature,
      }),
    });

    const momoPayload = await momoResponse.json().catch(() => null);
    if (!momoResponse.ok || !momoPayload || momoPayload.resultCode !== 0) {
      console.error('[process-payment] momo create error:', momoPayload);
      return errorResponse(momoPayload?.message ?? 'Không tạo được đơn MoMo.', 500);
    }

    return successResponse({
      ...(data as Record<string, unknown>),
      orderId,
      requestId,
      payUrl: momoPayload.payUrl ?? null,
      deeplink: momoPayload.deeplink ?? null,
      qrCodeUrl: momoPayload.qrCodeUrl ?? null,
    });
  }

  const { data, error } = await db.rpc('process_payment', {
    p_invoice_id:   invoiceId,
    p_amount:       amount,
    p_method:       method,
    p_payment_date: paymentDate,
    p_notes:        notes ?? null,
    p_receipt_url:  receiptUrl ?? null,
    p_reference:    referenceNumber ?? null,
    p_bank_name:    bankName ?? null,
    p_confirmed_by: caller.userId,
    p_auto_confirm: autoConfirm,
    p_idempotency_key: idempotencyKey ?? null,
    p_attempt_status: attemptStatus ?? null,
  });

  if (error) {
    console.error('[process-payment] process_payment RPC error:', error);
    return errorResponse(error.message, 500);
  }

  const result = data as {
    attemptId?: number;
    paymentId?: number | null;
    paymentCode?: string | null;
    attemptStatus?: string;
    invoiceStatus: string;
    amountPaid: number;
    balanceDue: number;
  };

  return successResponse({
    attemptId:     result.attemptId ?? null,
    paymentId:     result.paymentId ?? null,
    paymentCode:   result.paymentCode ?? null,
    attemptStatus: result.attemptStatus ?? null,
    invoiceStatus: result.invoiceStatus,
    amountPaid:    result.amountPaid,
    balanceDue:    result.balanceDue,
  });
});
