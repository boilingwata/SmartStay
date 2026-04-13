/// <reference path="../_shared/deno-globals.d.ts" />

import { handleOptions } from '../_shared/cors.ts';
import { requireAdminRole } from '../_shared/auth.ts';
import { createAdminClient } from '../_shared/supabaseAdmin.ts';
import { errorResponse, successResponse } from '../_shared/errors.ts';
import { buildUtilityInvoicePayload } from '../_shared/utilityInvoiceBuilder.ts';

interface CreateUtilityInvoiceRequest {
  contractId: number;
  monthYear: string;
  dueDate: string;
  discountAmount?: number;
  discountReason?: string | null;
  note?: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleOptions();

  const { denied } = await requireAdminRole(req);
  if (denied) return denied;

  let body: CreateUtilityInvoiceRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const { contractId, monthYear, dueDate, discountAmount = 0, discountReason, note } = body;
  if (!contractId || typeof contractId !== 'number') return errorResponse('contractId must be a number');
  if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) return errorResponse('monthYear must be in YYYY-MM format');
  if (!dueDate) return errorResponse('dueDate is required');

  const db = createAdminClient();
  let payload;
  try {
    payload = await buildUtilityInvoicePayload(db, {
      contractId,
      billingPeriod: monthYear,
      dueDate,
      discountAmount,
      discountReason,
      note,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to build utility invoice payload', 400);
  }

  const { data: rpcResult, error: rpcError } = await db.rpc('create_policy_utility_invoice', {
    p_contract_id: contractId,
    p_billing_period: monthYear,
    p_due_date: dueDate,
    p_subtotal: payload.subtotal,
    p_total_amount: payload.totalAmount,
    p_note: note ?? null,
    p_invoice_items: payload.items,
    p_snapshot: payload.snapshotPayload,
  });

  if (rpcError) return errorResponse(rpcError.message, 500);

  const result = rpcResult as { invoiceId: number; invoiceCode: string };
  return successResponse({
    invoiceId: result.invoiceId,
    invoiceCode: result.invoiceCode,
  }, 201);
});
