import '../_shared/deno-globals.d.ts';

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
import { requireOwner } from '../_shared/auth.ts';
import { createAdminClient } from '../_shared/supabaseAdmin.ts';
import { errorResponse, successResponse } from '../_shared/errors.ts';

interface ServiceEntry {
  serviceId: number;
  fixedPrice?: number;
  quantity?: number;
}

interface ServiceCatalogRow {
  id: number;
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
  ownerRep?: {
    fullName: string;
    cccd?: string | null;
    role: string;
  };
  ownerLegalConfirmation?: {
    legalBasisType: 'owner' | 'authorized_representative' | 'business_entity';
    legalBasisNote?: string | null;
    supportingDocumentUrls?: string[];
    hasLegalRentalRightsConfirmed: boolean;
    propertyEligibilityConfirmed: boolean;
    landlordResponsibilitiesAccepted: boolean;
    finalAcknowledgementAccepted: boolean;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleOptions();

  const { caller, denied } = await requireOwner(req);
  if (denied) return denied;

  let body: CreateContractRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Dữ liệu gửi lên không hợp lệ.');
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
    ownerRep,
    ownerLegalConfirmation,
  } = body;

  if (!roomId || typeof roomId !== 'number') return errorResponse('Thiếu thông tin phòng hợp lệ.');
  if (!startDate || !endDate) return errorResponse('Thiếu ngày bắt đầu hoặc ngày kết thúc hợp đồng.');
  if (typeof rentPrice !== 'number' || rentPrice <= 0) return errorResponse('Giá thuê phải lớn hơn 0.');
  if (!primaryTenantId || typeof primaryTenantId !== 'number') return errorResponse('Thiếu người đứng tên hợp đồng.');
  if (!Array.isArray(occupantIds)) return errorResponse('Danh sách người ở cùng không hợp lệ.');
  if (!ownerLegalConfirmation?.legalBasisType) return errorResponse('Thiếu căn cứ pháp lý của bên cho thuê.');
  if (!ownerLegalConfirmation?.hasLegalRentalRightsConfirmed) {
    return errorResponse('Chưa xác nhận quyền cho thuê hợp pháp.');
  }
  if (!ownerLegalConfirmation?.propertyEligibilityConfirmed) {
    return errorResponse('Chưa xác nhận nhà hoặc phòng đủ điều kiện cho thuê.');
  }
  if (!ownerLegalConfirmation?.landlordResponsibilitiesAccepted) {
    return errorResponse('Chưa xác nhận trách nhiệm của bên cho thuê.');
  }
  if (!ownerLegalConfirmation?.finalAcknowledgementAccepted) {
    return errorResponse('Chưa xác nhận cam kết cuối trước khi tạo hợp đồng.');
  }
  if (
    ownerLegalConfirmation.legalBasisType === 'authorized_representative' &&
    (ownerLegalConfirmation.supportingDocumentUrls?.length ?? 0) === 0
  ) {
    return errorResponse('Người được ủy quyền phải có ít nhất 1 hồ sơ pháp lý đính kèm.');
  }

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

  const catalogServiceIds = new Set(((serviceRows ?? []) as ServiceCatalogRow[]).map((item: ServiceCatalogRow) => item.id));
  const filteredServices = selectedServices.filter((service) => catalogServiceIds.has(service.serviceId));
  const filteredServiceIds = filteredServices.map((s) => s.serviceId);
  const servicePrices = filteredServices.map((s) => s.fixedPrice ?? null);
  const serviceQuantities = filteredServices.map((s) => s.quantity ?? 1);

  const { data, error } = await db.rpc('create_contract_v3', {
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
    p_owner_legal_basis_type: ownerLegalConfirmation?.legalBasisType ?? 'owner',
    p_owner_legal_basis_note: ownerLegalConfirmation?.legalBasisNote ?? null,
    p_owner_supporting_document_urls: ownerLegalConfirmation?.supportingDocumentUrls ?? [],
    p_owner_has_legal_rental_rights: ownerLegalConfirmation?.hasLegalRentalRightsConfirmed ?? false,
    p_owner_property_eligibility_confirmed: ownerLegalConfirmation?.propertyEligibilityConfirmed ?? false,
    p_owner_responsibilities_accepted: ownerLegalConfirmation?.landlordResponsibilitiesAccepted ?? false,
    p_owner_final_acknowledgement: ownerLegalConfirmation?.finalAcknowledgementAccepted ?? false,
    p_owner_rep_full_name: ownerRep?.fullName ?? null,
    p_owner_rep_cccd: ownerRep?.cccd ?? null,
    p_owner_rep_role: ownerRep?.role ?? null,
  });

  if (error) {
    if (
      error.message.includes('Kh') ||
      error.message.includes('kh') ||
      error.message.includes('not available') ||
      error.message.includes('not found')
    ) {
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
