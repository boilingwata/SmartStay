/// <reference path="../_shared/deno-globals.d.ts" />

import { handleOptions } from '../_shared/cors.ts';
import { requireOwner } from '../_shared/auth.ts';
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

  const { denied } = await requireOwner(req);
  if (denied) return denied;

  let body: CreateOwnerRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const fullName = body.fullName?.trim();
  const email = body.email?.trim().toLowerCase();
  if (!fullName) return errorResponse('fullName is required', 400);
  if (!email || !email.includes('@')) return errorResponse('A valid email is required', 400);

  const adminClient = createAdminClient();
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata: { workspace_role: 'owner' },
    user_metadata: { full_name: fullName },
  });

  if (authError) {
    if (authError.message.toLowerCase().includes('already registered')) {
      return errorResponse(`Email "${email}" da duoc dang ky. Vui long dung email khac.`, 409);
    }
    return errorResponse(`Tao tai khoan that bai: ${authError.message}`, 400);
  }

  const userId = authData.user.id;
  const { data: profileRow, error: profileError } = await adminClient
    .from('profiles')
    .upsert({
      id: userId,
      full_name: fullName,
      phone: body.phone?.trim() ?? null,
      avatar_url: body.avatarUrl ?? null,
      role: 'owner',
      identity_number: body.cccd?.trim() ?? null,
      address: body.address?.trim() ?? null,
      is_active: true,
    })
    .select('id, full_name, phone, avatar_url, role, is_active, identity_number, address')
    .single();

  if (profileError) {
    await adminClient.auth.admin.deleteUser(userId);
    return errorResponse(`Luu ho so that bai: ${profileError.message}`, 500);
  }

  return successResponse({
    owner: {
      id: profileRow.id,
      fullName: profileRow.full_name,
      phone: profileRow.phone ?? '',
      avatarUrl: profileRow.avatar_url ?? undefined,
      email,
      cccd: profileRow.identity_number ?? body.cccd ?? '',
      taxCode: body.taxCode ?? '',
      address: profileRow.address ?? '',
      isDeleted: false,
    },
  });
});
