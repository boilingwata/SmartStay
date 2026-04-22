/// <reference path="../_shared/deno-globals.d.ts" />

/**
 * activate-resident
 *
 * Validates that a tenant has completed all onboarding prerequisites,
 * then atomically sets profiles.tenant_stage = 'resident_active'.
 *
 * Currently portalOnboardingService.activateResident() does a single UPDATE
 * with zero validation — any tenant can call it. This function enforces the
 * checklist server-side.
 */

import { handleOptions } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/auth.ts';
import { createAdminClient } from '../_shared/supabaseAdmin.ts';
import { errorResponse, successResponse } from '../_shared/errors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleOptions();

  let caller;
  try {
    caller = await requireAuth(req);
  } catch {
    return errorResponse('Unauthorized', 401);
  }

  // Allow workspace operators to activate on behalf of a specific profile
  let profileId = caller.userId;
  try {
    const body = await req.json().catch(() => ({}));
    if (body.profileId && ['owner', 'staff', 'super_admin'].includes(caller.role)) {
      profileId = body.profileId;
    }
  } catch { /* no body is fine */ }

  const db = createAdminClient();

  // 1. Fetch tenant row
  const { data: tenant, error: tenantErr } = await db
    .from('tenants')
    .select('id, full_name, id_number, date_of_birth, emergency_contact_name, documents')
    .eq('profile_id', profileId)
    .eq('is_deleted', false)
    .maybeSingle();

  if (tenantErr || !tenant) {
    return errorResponse('Tenant profile not found', 404);
  }

  // 2. Validate checklist
  const docs = (tenant.documents as Record<string, unknown>) ?? {};
  const cccdImages = docs['cccd_images'];
  const hasCCCD = Array.isArray(cccdImages) && cccdImages.length > 0;

  if (!tenant.full_name || !tenant.id_number || !tenant.date_of_birth) {
    return errorResponse('Bước 1 chưa hoàn thành: Vui lòng điền đầy đủ thông tin cá nhân (họ tên, CCCD, ngày sinh)', 400);
  }
  if (!hasCCCD) {
    return errorResponse('Bước 2 chưa hoàn thành: Vui lòng tải lên ảnh CCCD', 400);
  }
  if (!tenant.emergency_contact_name) {
    return errorResponse('Bước 3 chưa hoàn thành: Vui lòng thêm thông tin liên hệ khẩn cấp', 400);
  }

  // 3. Verify active contract with deposit
  const { data: contractLinks, error: contractErr } = await db
    .from('contract_tenants')
    .select('contracts(status, is_deleted, deposit_status)')
    .eq('tenant_id', tenant.id);

  if (contractErr) {
    return errorResponse('Không thể kiểm tra hợp đồng', 500);
  }

  const activeContract = (contractLinks ?? []).find((link: Record<string, unknown>) => {
    const c = link['contracts'] as Record<string, unknown> | null;
    return c?.status === 'active' && !c?.is_deleted;
  });

  if (!activeContract) {
    return errorResponse('Bước 6 chưa hoàn thành: Chưa có hợp đồng đang hoạt động', 400);
  }

  const contract = (activeContract as Record<string, unknown>)['contracts'] as Record<string, unknown>;
  const depositOk = ['received', 'partially_refunded'].includes(contract['deposit_status'] as string ?? '');
  if (!depositOk) {
    return errorResponse('Bước 5 chưa hoàn thành: Cọc chưa được xác nhận', 400);
  }

  // 4. All checks passed — update tenant_stage
  const { error: updateErr } = await db
    .from('profiles')
    .update({ tenant_stage: 'resident_active' })
    .eq('id', profileId);

  if (updateErr) {
    console.error('[activate-resident] Update error:', updateErr);
    return errorResponse('Không thể cập nhật trạng thái. Vui lòng thử lại.', 500);
  }

  return successResponse({ tenantStage: 'resident_active', profileId });
});
