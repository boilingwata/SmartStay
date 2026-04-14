/// <reference path="../_shared/deno-globals.d.ts" />

/**
 * create-user
 *
 * Creates a preview or application user by:
 *   1. Creating an auth.users row with the service role
 *   2. Upserting the matching smartstay.profiles row for tenant-side roles
 *   3. Marking platform-only roles such as super_admin in app_metadata
 */

import { handleOptions } from '../_shared/cors.ts';
import { requireAdminRole } from '../_shared/auth.ts';
import { createAdminClient } from '../_shared/supabaseAdmin.ts';
import { errorResponse, successResponse } from '../_shared/errors.ts';

type SupportedRole = 'admin' | 'staff' | 'tenant' | 'super_admin';
type TenantStage = 'prospect' | 'applicant' | 'resident_pending_onboarding' | 'resident_active';

interface CreateUserRequest {
  fullName: string;
  username: string;
  email: string;
  password?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role?: SupportedRole;
  isActive?: boolean;
  buildingsAccess?: Array<number | string>;
  forceChangePassword?: boolean;
  tenantStage?: TenantStage;
}

const SUPPORTED_ROLES: SupportedRole[] = ['admin', 'staff', 'tenant', 'super_admin'];
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
  if (role === 'admin') return 'Owner';
  if (role === 'staff') return 'Staff';
  if (role === 'tenant') return 'Tenant';
  return 'SuperAdmin';
}

function workspaceRole(role: SupportedRole): 'owner' | 'staff' | 'tenant' | 'super_admin' {
  if (role === 'admin') return 'owner';
  return role;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleOptions();

  const { denied } = await requireAdminRole(req);
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

  if (!fullName) {
    return errorResponse('fullName is required', 400);
  }
  if (!email || !email.includes('@')) {
    return errorResponse('A valid email is required', 400);
  }
  if (username.length < 3) {
    return errorResponse('username must contain at least 3 valid characters', 400);
  }
  if (!SUPPORTED_ROLES.includes(role)) {
    return errorResponse(`Unsupported role "${body.role}"`, 400);
  }
  if (!SUPPORTED_TENANT_STAGES.includes(tenantStage)) {
    return errorResponse(`Unsupported tenantStage "${body.tenantStage}"`, 400);
  }
  if (password && password.length < 8) {
    return errorResponse('password must contain at least 8 characters', 400);
  }

  const adminClient = createAdminClient();
  const accessRole = workspaceRole(role);

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      workspace_role: accessRole,
    },
    user_metadata: {
      full_name: fullName,
      username,
      workspace_role: accessRole,
    },
  });

  if (authError) {
    if (authError.message.toLowerCase().includes('already registered')) {
      return errorResponse(`Email "${email}" đã được đăng ký. Vui lòng dùng email khác.`, 409);
    }
    return errorResponse(`Tạo tài khoản thất bại: ${authError.message}`, 400);
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
      is_active: body.isActive ?? true,
      tenant_stage: role === 'tenant' ? tenantStage : 'prospect',
      preferences,
    })
    .select('id, full_name, phone, avatar_url, role, tenant_stage, preferences, is_active, created_at')
    .single();

  if (profileError) {
    await adminClient.auth.admin.deleteUser(userId);
    return errorResponse(`Lưu hồ sơ thất bại: ${profileError.message}`, 500);
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
      buildingsAccess: preferences.buildings_access,
      isActive: profileRow.is_active ?? true,
      isTwoFactorEnabled: false,
      forceChangePassword: preferences.force_change_password,
      tenantStage: profileRow.tenant_stage,
      createdAt: profileRow.created_at ?? undefined,
    },
  }, 201);
});
