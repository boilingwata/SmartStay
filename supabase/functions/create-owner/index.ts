/**
 * create-owner
 *
 * Creates a new owner (landlord) profile by:
 *   1. Calling auth.admin.createUser() to get a real UUID in auth.users
 *      (required to satisfy profiles_id_fkey → auth.users.id)
 *   2. Upserting into smartstay.profiles with that UUID
 *
 * Why an Edge Function and not a direct client-side insert:
 *   - auth.admin.createUser() requires the service-role key, never exposed to the browser.
 *   - Direct client-side inserts with crypto.randomUUID() fail with
 *     "profiles_id_fkey" because auth.users has no matching row.
 */

import { handleOptions } from '../_shared/cors.ts';
import { requireAdminRole } from '../_shared/auth.ts';
import { createAdminClient } from '../_shared/supabaseAdmin.ts';
import { errorResponse, successResponse } from '../_shared/errors.ts';

interface CreateOwnerRequest {
  fullName: string;
  email: string;
  phone?: string;
  cccd?: string;
  taxCode?: string;
  address?: string;
  avatarUrl?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleOptions();

  // Only admin/manager role may create owners
  const { caller, denied } = await requireAdminRole(req);
  if (denied) return denied;

  let body: CreateOwnerRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { fullName, email, phone, cccd, taxCode, address, avatarUrl } = body;

  if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
    return errorResponse('fullName is required', 400);
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return errorResponse('A valid email is required', 400);
  }

  const adminClient = createAdminClient();

  // Step 1 — Create auth user. email_confirm: true skips the verification
  // email so the account is immediately usable. A password-reset email can
  // be sent separately via supabase.auth.resetPasswordForEmail().
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    email_confirm: true,
    user_metadata: { full_name: fullName.trim() },
  });

  if (authError) {
    // Common case: duplicate email already registered
    if (authError.message.toLowerCase().includes('already registered')) {
      return errorResponse(
        `Email "${email}" đã được đăng ký. Vui lòng dùng email khác.`,
        409
      );
    }
    return errorResponse(`Tạo tài khoản thất bại: ${authError.message}`, 400);
  }

  const userId = authData.user.id;

  // Step 2 — Upsert profile row in smartstay schema.
  // Use upsert (not insert) in case a trigger already created a skeleton row.
  const { data: profileRow, error: profileError } = await adminClient
    .from('profiles')
    .upsert({
      id:         userId,
      full_name:  fullName.trim(),
      phone:      phone?.trim() ?? null,
      avatar_url: avatarUrl ?? null,
      role:       'landlord',
      is_active:  true,
    })
    .select('id, full_name, phone, avatar_url, role, is_active')
    .single();

  if (profileError) {
    // Roll back: delete the auth user so we don't leave orphaned auth rows
    await adminClient.auth.admin.deleteUser(userId);
    return errorResponse(`Lưu hồ sơ thất bại: ${profileError.message}`, 500);
  }

  return successResponse({
    owner: {
      id:        profileRow.id,
      fullName:  profileRow.full_name,
      phone:     profileRow.phone ?? '',
      avatarUrl: profileRow.avatar_url ?? undefined,
      email,
      cccd:      cccd ?? '',
      taxCode:   taxCode ?? '',
      address:   address ?? '',
      isDeleted: false,
    },
  });
});
