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
  paymentDueDay?: number;
  utilityPolicyId?: number | null;
  primaryTenantId: number;
  occupantIds: number[];
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
    paymentDueDay = 5,
    primaryTenantId,
    utilityPolicyId = null,
    occupantIds,
    selectedServices = [],
    markDepositReceived = false,
  } = body;

  // Basic validation
  if (!roomId || typeof roomId !== 'number') return errorResponse('roomId is required');
  if (!startDate || !endDate) return errorResponse('startDate and endDate are required');
  if (typeof rentPrice !== 'number' || rentPrice <= 0) return errorResponse('rentPrice must be positive');
  if (!primaryTenantId || typeof primaryTenantId !== 'number') return errorResponse('primaryTenantId is required');
  if (!Array.isArray(occupantIds)) return errorResponse('occupantIds must be an array');

  const serviceIds = selectedServices.map((s) => s.serviceId);
  const db = createAdminClient();
  const { data: serviceRows, error: serviceError } = serviceIds.length === 0
    ? { data: [], error: null }
    : await db
        .from('service_catalog')
        .select('id')
        .in('id', serviceIds);

  if (serviceError) {
    return errorResponse(serviceError.message, 500);
  }

  const catalogServiceIds = new Set((serviceRows ?? []).map((item) => item.id));
  const filteredServices = selectedServices.filter((service) => catalogServiceIds.has(service.serviceId));
  const filteredServiceIds = filteredServices.map((s) => s.serviceId);
  const servicePrices = filteredServices.map((s) => s.fixedPrice ?? null);
  const serviceQuantities = filteredServices.map((s) => s.quantity ?? 1);

  const { data, error } = await db.rpc('create_contract_v2', {
    p_room_id:               roomId,
    p_start_date:            startDate,
    p_end_date:              endDate,
    p_monthly_rent:          rentPrice,
    p_deposit_amount:        depositAmount ?? 0,
    p_payment_cycle_months:  paymentCycle ?? 1,
    p_primary_tenant_id:     primaryTenantId,
    p_occupant_ids:          occupantIds,
    p_payment_due_day:       paymentDueDay ?? 5,
    p_utility_policy_id:     utilityPolicyId,
    p_service_ids:           filteredServiceIds.length > 0 ? filteredServiceIds : null,
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
