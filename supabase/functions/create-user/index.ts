/**
 * create-user
 *
 * Creates a workspace or tenant user by:
 *   1. Creating an auth.users row with the service role
 *   2. Writing trusted workspace role projection into app_metadata only
 *   3. Upserting the matching smartstay.profiles row for non-platform users
 */

import '../_shared/deno-globals.d.ts';
import { handleOptions } from '../_shared/cors.ts';
import { requireWorkspaceOperator } from '../_shared/auth.ts';
import { createAdminClient } from '../_shared/supabaseAdmin.ts';
import { errorResponse, successResponse } from '../_shared/errors.ts';

type SupportedRole = 'owner' | 'staff' | 'tenant' | 'super_admin';
type TenantStage = 'prospect' | 'applicant' | 'resident_pending_onboarding' | 'resident_active';

interface CreateUserRequest {
  fullName: string;
  username: string;
  email: string;
  password?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role?: SupportedRole;
  roleId?: string | null;
  isActive?: boolean;
  buildingsAccess?: Array<number | string>;
  forceChangePassword?: boolean;
  tenantStage?: TenantStage;
  identityNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  address?: string | null;
}

const SUPPORTED_ROLES: SupportedRole[] = ['owner', 'staff', 'tenant', 'super_admin'];
const SUPPORTED_TENANT_STAGES: TenantStage[] = [
  'prospect',
  'applicant',
  'resident_pending_onboarding',
  'resident_active',
];

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
}

function roleLabel(role: SupportedRole): 'Owner' | 'Staff' | 'Tenant' | 'SuperAdmin' {
  if (role === 'owner') return 'Owner';
  if (role === 'staff') return 'Staff';
  if (role === 'tenant') return 'Tenant';
  return 'SuperAdmin';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleOptions();

  const { denied } = await requireWorkspaceOperator(req);
  if (denied) return denied;

  let body: CreateUserRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const fullName = body.fullName?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim();
  const username = normalizeUsername(body.username ?? '');
  const role = body.role ?? 'staff';
  const tenantStage = body.tenantStage ?? 'prospect';

  if (!fullName) return errorResponse('fullName is required', 400);
  if (!email || !email.includes('@')) return errorResponse('A valid email is required', 400);
  if (username.length < 3) return errorResponse('username must contain at least 3 valid characters', 400);
  if (!SUPPORTED_ROLES.includes(role)) return errorResponse(`Unsupported role "${body.role}"`, 400);
  if (!SUPPORTED_TENANT_STAGES.includes(tenantStage)) {
    return errorResponse(`Unsupported tenantStage "${body.tenantStage}"`, 400);
  }
  if (password && password.length < 8) {
    return errorResponse('password must contain at least 8 characters', 400);
  }

  const adminClient = createAdminClient();
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      workspace_role: role,
    },
    user_metadata: {
      full_name: fullName,
      username,
    },
  });

  if (authError) {
    if (authError.message.toLowerCase().includes('already registered')) {
      return errorResponse(`Email "${email}" da duoc dang ky. Vui long dung email khac.`, 409);
    }
    return errorResponse(`Tao tai khoan that bai: ${authError.message}`, 400);
  }

  const userId = authData.user.id;
  const preferences = {
    username,
    email,
    buildings_access: Array.isArray(body.buildingsAccess) ? body.buildingsAccess : [],
    force_change_password: body.forceChangePassword ?? true,
  };

  if (role === 'super_admin') {
    return successResponse({
      user: {
        id: userId,
        username,
        fullName,
        email,
        role: roleLabel(role),
        isActive: body.isActive ?? true,
        isTwoFactorEnabled: false,
        forceChangePassword: preferences.force_change_password,
      },
    }, 201);
  }

  const { data: profileRow, error: profileError } = await adminClient
    .from('profiles')
    .upsert({
      id: userId,
      full_name: fullName,
      phone: body.phone?.trim() ?? null,
      avatar_url: body.avatarUrl ?? null,
      role,
      role_id: body.roleId ?? null,
      identity_number: body.identityNumber?.trim() ?? null,
      date_of_birth: body.dateOfBirth ?? null,
      gender: body.gender ?? null,
      address: body.address?.trim() ?? null,
      is_active: body.isActive ?? true,
      tenant_stage: role === 'tenant' ? tenantStage : null,
      preferences,
    })
    .select('id, full_name, phone, avatar_url, role, role_id, identity_number, date_of_birth, gender, address, tenant_stage, preferences, is_active, created_at')
    .single();

  if (profileError) {
    await adminClient.auth.admin.deleteUser(userId);
    return errorResponse(`Luu ho so that bai: ${profileError.message}`, 500);
  }

  return successResponse({
    user: {
      id: profileRow.id,
      username,
      fullName: profileRow.full_name,
      email,
      phone: profileRow.phone ?? undefined,
      avatar: profileRow.avatar_url ?? undefined,
      role: roleLabel(role),
      roleId: profileRow.role_id,
      identityNumber: profileRow.identity_number,
      dateOfBirth: profileRow.date_of_birth,
      gender: profileRow.gender,
      address: profileRow.address,
      buildingsAccess: preferences.buildings_access,
      isActive: profileRow.is_active ?? true,
      isTwoFactorEnabled: false,
      forceChangePassword: preferences.force_change_password,
      tenantStage: profileRow.tenant_stage ?? undefined,
      createdAt: profileRow.created_at ?? undefined,
    },
  }, 201);
});
