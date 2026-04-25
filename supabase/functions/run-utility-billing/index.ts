import "../_shared/deno-globals.d.ts";

import { handleOptions } from '../_shared/cors.ts';
import { requireWorkspaceOperator } from '../_shared/auth.ts';
import { createAdminClient } from '../_shared/supabaseAdmin.ts';
import { errorResponse, successResponse } from '../_shared/errors.ts';
import { buildUtilityInvoicePayload } from '../_shared/utilityInvoiceBuilder.ts';

interface RunUtilityBillingRequest {
  billingPeriod?: string;
  dueDate?: string;
  dryRun?: boolean;
  trigger?: 'manual' | 'cron';
}

function toIsoDatePart(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const map = new Map(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(map.get('year')),
    month: Number(map.get('month')),
    day: Number(map.get('day')),
  };
}

function getDefaultBillingPeriod(now = new Date()): string {
  const local = getTimeZoneParts(now, 'Asia/Saigon');
  const currentMonthStartUtc = new Date(Date.UTC(local.year, local.month - 1, 1));
  currentMonthStartUtc.setUTCMonth(currentMonthStartUtc.getUTCMonth() - 1);
  return currentMonthStartUtc.toISOString().slice(0, 7);
}

function getDefaultDueDate(billingPeriod: string): string {
  const [year, month] = billingPeriod.split('-').map(Number);
  const nextMonth = new Date(Date.UTC(year, month, 10));
  return toIsoDatePart(nextMonth);
}

function getPeriodBounds(billingPeriod: string) {
  const [year, month] = billingPeriod.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return {
    start: toIsoDatePart(start),
    end: toIsoDatePart(end),
  };
}

async function isValidCronRequest(req: Request): Promise<boolean> {
  const candidate = req.headers.get('x-cron-secret');
  if (!candidate) return false;

  const db = createAdminClient();
  const { data, error } = await db.rpc('validate_utility_billing_cron_secret', {
    p_candidate: candidate,
  });

  if (error) return false;
  return data === true;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleOptions();

  const cronAuthorized = await isValidCronRequest(req);
  if (!cronAuthorized) {
    const { denied } = await requireWorkspaceOperator(req);
    if (denied) return denied;
  }

  let body: RunUtilityBillingRequest = {};
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const trigger = body.trigger ?? (cronAuthorized ? 'cron' : 'manual');
  const dryRun = Boolean(body.dryRun);
  const billingPeriod = body.billingPeriod ?? getDefaultBillingPeriod();
  const dueDate = body.dueDate ?? getDefaultDueDate(billingPeriod);

  if (!/^\d{4}-\d{2}$/.test(billingPeriod)) {
    return errorResponse('billingPeriod must be in YYYY-MM format');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return errorResponse('dueDate must be in YYYY-MM-DD format');
  }

  const localNow = getTimeZoneParts(new Date(), 'Asia/Saigon');
  if (trigger === 'cron' && localNow.day !== 1) {
    return successResponse({
      status: 'noop',
      billingPeriod,
      dueDate,
      message: 'Cron invocation skipped because today is not the first day of the month in Asia/Saigon.',
    });
  }

  const db = createAdminClient();
  const bounds = getPeriodBounds(billingPeriod);

  const { data: contractRows, error: contractsError } = await db
    .from('contracts')
    .select(`
      id,
      contract_code,
      occupants_for_billing,
      utility_billing_type
    `)
    .eq('status', 'active')
    .eq('is_deleted', false)
    .lte('start_date', bounds.end)
    .or(`end_date.is.null,end_date.gte.${bounds.start}`);

  if (contractsError) return errorResponse(contractsError.message, 500);

  const contracts = (contractRows ?? []) as Array<{
    id: number;
    contract_code: string;
    occupants_for_billing: number | null;
    utility_billing_type: string | null;
  }>;
  if (contracts.length === 0) {
    return successResponse({
      status: 'completed',
      billingPeriod,
      dueDate,
      totalContracts: 0,
      createdInvoices: 0,
      skippedInvoices: 0,
      failedInvoices: 0,
      failures: [],
    });
  }

  const { data: existingInvoices, error: existingError } = await db
    .from('invoices')
    .select('contract_id, invoice_code')
    .in('contract_id', contracts.map((contract) => contract.id))
    .eq('billing_period', billingPeriod)
    .neq('status', 'cancelled');

  if (existingError) return errorResponse(existingError.message, 500);

  const existingMap = new Map(
    ((existingInvoices ?? []) as Array<{ contract_id: number; invoice_code: string }>).map((row) => [
      row.contract_id,
      row.invoice_code,
    ]),
  );

  const policyContracts: typeof contracts = [];
  const ineligibleContracts: Array<{ contractId: number; contractCode: string; reason: string }> = [];

  for (const contract of contracts) {
    if ((contract.utility_billing_type ?? 'policy') !== 'policy') {
      ineligibleContracts.push({
        contractId: contract.id,
        contractCode: contract.contract_code,
        reason: 'Hop dong chua duoc chuan hoa sang utility policy.',
      });
      continue;
    }

    if (!Number.isFinite(Number(contract.occupants_for_billing)) || Number(contract.occupants_for_billing) <= 0) {
      ineligibleContracts.push({
        contractId: contract.id,
        contractCode: contract.contract_code,
        reason: 'Hop dong thieu occupants_for_billing hop le.',
      });
      continue;
    }

    policyContracts.push(contract);
  }

  const existingInvoiceContracts = policyContracts
    .filter((contract) => existingMap.has(contract.id))
    .map((contract) => ({
      contractId: contract.id,
      contractCode: contract.contract_code,
    }));

  const eligibleContracts = policyContracts
    .filter((contract) => !existingMap.has(contract.id))
    .map((contract) => ({
      contractId: contract.id,
      contractCode: contract.contract_code,
    }));

  if (dryRun) {
    return successResponse({
      status: 'preview',
      billingPeriod,
      dueDate,
      totalContracts: contracts.length,
      validContracts: policyContracts.length,
      skippedContracts: ineligibleContracts.length,
      ineligibleContracts,
      existingInvoices: existingMap.size,
      existingInvoiceContracts,
      eligibleContracts,
      diagnostics: {
        billingPeriodStart: bounds.start,
        billingPeriodEnd: bounds.end,
        totalContracts: contracts.length,
        validContracts: policyContracts.length,
        skippedContracts: ineligibleContracts.length,
        existingInvoiceContracts: existingInvoiceContracts.length,
        eligibleContracts: eligibleContracts.length,
      },
    });
  }

  const upsertPayload = {
    billing_period: billingPeriod,
    status: 'running',
    started_at: new Date().toISOString(),
    completed_at: null,
    summary_json: {
      trigger,
      totalContracts: contracts.length,
      validContracts: policyContracts.length,
      skippedContracts: ineligibleContracts.length,
      ineligibleContracts,
      existingInvoiceContracts,
      startedAt: new Date().toISOString(),
    },
    error_json: null,
  };

  const { data: runRow, error: runError } = await db
    .from('billing_runs')
    .upsert(upsertPayload, { onConflict: 'billing_period' })
    .select('id, billing_period, lock_version')
    .single();

  if (runError || !runRow) return errorResponse(runError?.message ?? 'Failed to initialize billing run', 500);

  const failures: Array<{ contractId: number; contractCode: string; message: string }> = [];
  let createdInvoices = 0;
  let skippedInvoices = 0;

  for (const contract of policyContracts) {
    if (existingMap.has(contract.id)) {
      skippedInvoices += 1;
      continue;
    }

    try {
      const payload = await buildUtilityInvoicePayload(db, {
        contractId: contract.id,
        billingPeriod,
        dueDate,
        billingRunId: Number(runRow.id),
      });

      const { error } = await db.rpc('create_policy_utility_invoice', {
        p_contract_id: payload.contractId,
        p_billing_period: payload.billingPeriod,
        p_due_date: payload.dueDate,
        p_subtotal: payload.subtotal,
        p_total_amount: payload.totalAmount,
        p_note: payload.note,
        p_invoice_items: payload.items,
        p_snapshot: payload.snapshotPayload,
      });

      if (error) {
        throw new Error(error.message);
      }

      createdInvoices += 1;
    } catch (error) {
      failures.push({
        contractId: contract.id,
        contractCode: contract.contract_code,
        message: error instanceof Error ? error.message : 'Unknown billing error',
      });
    }
  }

  const status = failures.length > 0 ? 'failed' : 'completed';
  const summary = {
    trigger,
    billingPeriod,
    dueDate,
    totalContracts: contracts.length,
    validContracts: policyContracts.length,
    skippedContracts: ineligibleContracts.length,
    ineligibleContracts,
    existingInvoiceContracts,
    createdInvoices,
    skippedInvoices,
    failedInvoices: failures.length,
    completedAt: new Date().toISOString(),
  };

  const { error: finalizeError } = await db
    .from('billing_runs')
    .update({
      status,
      completed_at: new Date().toISOString(),
      summary_json: summary,
      error_json: failures.length > 0 ? { failures } : null,
      lock_version: Number(runRow.lock_version ?? 0) + 1,
    })
    .eq('id', runRow.id);

  if (finalizeError) return errorResponse(finalizeError.message, 500);

  return successResponse({
    status,
    billingRunId: runRow.id,
    ...summary,
    failures,
  });
});
