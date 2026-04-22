/// <reference path="../_shared/deno-globals.d.ts" />

import { handleOptions } from '../_shared/cors.ts';
import { requireWorkspaceOperator } from '../_shared/auth.ts';
import { createAdminClient } from '../_shared/supabaseAdmin.ts';
import { errorResponse, successResponse } from '../_shared/errors.ts';

interface AdjustBalanceRequest {
  tenantId: number;
  amount: number;
  transactionType: 'deposit' | 'deduction' | 'refund' | 'adjustment';
  notes: string;
  invoiceId?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleOptions();

  const { caller, denied } = await requireWorkspaceOperator(req);
  if (denied) return denied;

  let body: AdjustBalanceRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const { tenantId, amount, transactionType, notes, invoiceId } = body;

  if (!tenantId || typeof amount !== 'number' || !transactionType || !notes) {
    return errorResponse('Missing required fields: tenantId, amount, transactionType, notes');
  }

  const validTypes = ['deposit', 'deduction', 'refund', 'adjustment'];
  if (!validTypes.includes(transactionType)) {
    return errorResponse(`Invalid transactionType. Must be one of: ${validTypes.join(', ')}`);
  }

  const db = createAdminClient();

  const { data, error } = await db.rpc('adjust_balance', {
    p_tenant_id:        tenantId,
    p_amount:           amount,
    p_transaction_type: transactionType,
    p_notes:            notes,
    p_invoice_id:       invoiceId ?? null,
    p_created_by:       caller!.userId,
  });

  if (error) {
    console.error('[adjust-balance] RPC error:', error);
    return errorResponse(error.message, 500);
  }

  const result = data as { historyId: number; balanceBefore: number; balanceAfter: number };

  return successResponse({
    historyId:     result.historyId,
    balanceBefore: result.balanceBefore,
    balanceAfter:  result.balanceAfter,
    lastUpdated:   new Date().toISOString(),
  });
});
