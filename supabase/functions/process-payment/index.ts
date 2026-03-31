import { handleOptions } from '../_shared/cors.ts';
import { requireAdminRole } from '../_shared/auth.ts';
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
}

// Branch B: approve an existing pending payment
interface ApprovePaymentRequest {
  existingPaymentId: number;
  confirm: true;
}

type ProcessPaymentRequest = NewPaymentRequest | ApprovePaymentRequest;

function isApprove(body: ProcessPaymentRequest): body is ApprovePaymentRequest {
  return 'existingPaymentId' in body && (body as ApprovePaymentRequest).confirm === true;
}

const VALID_METHODS = ['cash', 'bank_transfer', 'momo', 'zalopay', 'vnpay', 'stripe', 'other'];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleOptions();

  const { caller, denied } = await requireAdminRole(req);
  if (denied) return denied;

  let body: ProcessPaymentRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const db = createAdminClient();

  // --- Branch B: Approve existing payment ---
  if (isApprove(body)) {
    const { existingPaymentId } = body;

    if (!existingPaymentId || typeof existingPaymentId !== 'number') {
      return errorResponse('existingPaymentId must be a number');
    }

    const { data, error } = await db.rpc('approve_payment', {
      p_payment_id:   existingPaymentId,
      p_confirmed_by: caller!.userId,
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
  const {
    invoiceId,
    amount,
    method,
    paymentDate,
    notes,
    receiptUrl,
    referenceNumber,
    bankName,
    autoConfirm = true,
  } = body as NewPaymentRequest;

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

  const { data, error } = await db.rpc('process_payment', {
    p_invoice_id:   invoiceId,
    p_amount:       amount,
    p_method:       method,
    p_payment_date: paymentDate,
    p_notes:        notes ?? null,
    p_receipt_url:  receiptUrl ?? null,
    p_reference:    referenceNumber ?? null,
    p_bank_name:    bankName ?? null,
    p_confirmed_by: caller!.userId,
    p_auto_confirm: autoConfirm,
  });

  if (error) {
    console.error('[process-payment] process_payment RPC error:', error);
    return errorResponse(error.message, 500);
  }

  const result = data as {
    paymentId: number;
    paymentCode: string;
    invoiceStatus: string;
    amountPaid: number;
    balanceDue: number;
  };

  return successResponse({
    paymentId:     result.paymentId,
    paymentCode:   result.paymentCode,
    invoiceStatus: result.invoiceStatus,
    amountPaid:    result.amountPaid,
    balanceDue:    result.balanceDue,
  });
});
