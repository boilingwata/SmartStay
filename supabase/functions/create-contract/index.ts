/// <reference path="../_shared/deno-globals.d.ts" />

/**
 * create-contract
 *
 * Atomically creates a contract with all linked tenants and services,
 * and marks the room as occupied — all in one DB transaction via RPC.
 *
 * Fixes the current contractService.createContract() which only inserts
 * the contracts row, missing contract_tenants and contract_services.
 */

import { handleOptions } from '../_shared/cors.ts';
import { requireAdminRole } from '../_shared/auth.ts';
import { createAdminClient } from '../_shared/supabaseAdmin.ts';
import { errorResponse, successResponse } from '../_shared/errors.ts';

interface TenantEntry {
  id: number;
  isPrimary: boolean;
}

interface ServiceEntry {
  serviceId: number;
  fixedPrice?: number;
  quantity?: number;
}

interface CreateContractRequest {
  roomId: number;
  startDate: string;
  endDate: string;
  rentPrice: number;
  depositAmount: number;
  paymentCycle: number;
  tenants: TenantEntry[];
  selectedServices?: ServiceEntry[];
  markDepositReceived?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleOptions();

  const { caller, denied } = await requireAdminRole(req);
  if (denied) return denied;

  let body: CreateContractRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const {
    roomId,
    startDate,
    endDate,
    rentPrice,
    depositAmount,
    paymentCycle,
    tenants,
    selectedServices = [],
    markDepositReceived = false,
  } = body;

  // Basic validation
  if (!roomId || typeof roomId !== 'number') return errorResponse('roomId is required');
  if (!startDate || !endDate) return errorResponse('startDate and endDate are required');
  if (typeof rentPrice !== 'number' || rentPrice <= 0) return errorResponse('rentPrice must be positive');
  if (!Array.isArray(tenants) || tenants.length === 0) return errorResponse('At least one tenant is required');

  const primaryTenant = tenants.find((t) => t.isPrimary) ?? tenants[0];
  const tenantIds = tenants.map((t) => t.id);
  const serviceIds = selectedServices.map((s) => s.serviceId);
  const servicePrices = selectedServices.map((s) => s.fixedPrice ?? null);
  const serviceQuantities = selectedServices.map((s) => s.quantity ?? 1);

  const db = createAdminClient();

  const { data, error } = await db.rpc('create_contract', {
    p_room_id:               roomId,
    p_start_date:            startDate,
    p_end_date:              endDate,
    p_monthly_rent:          rentPrice,
    p_deposit_amount:        depositAmount ?? 0,
    p_payment_cycle_months:  paymentCycle ?? 1,
    p_tenant_ids:            tenantIds,
    p_primary_tenant_id:     primaryTenant.id,
    p_service_ids:           serviceIds.length > 0 ? serviceIds : null,
    p_service_prices:        servicePrices.length > 0 ? servicePrices : null,
    p_service_quantities:    serviceQuantities.length > 0 ? serviceQuantities : null,
    p_mark_deposit_received: markDepositReceived,
  });

  if (error) {
    console.error('[create-contract] RPC error:', error);
    // Surface validation errors (room not available, etc.) as 400
    if (error.message.includes('not available') || error.message.includes('not found')) {
      return errorResponse(error.message, 400);
    }
    return errorResponse(error.message, 500);
  }

  const result = data as { contractId: number; contractCode: string };

  return successResponse({
    contractId:   result.contractId,
    contractCode: result.contractCode,
    createdBy:    caller!.userId,
  });
});
