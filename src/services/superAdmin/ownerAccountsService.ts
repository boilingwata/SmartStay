import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import type { Database } from '@/types/supabase';

export type OwnerProfileRow = Database['smartstay']['Tables']['profiles']['Row'];

export interface OwnerAccount extends OwnerProfileRow {
  emailDisplay?: string;
  organizationName?: string | null;
}

function prefsEmail(preferences: OwnerProfileRow['preferences']): string | undefined {
  if (!preferences || typeof preferences !== 'object') return undefined;
  const o = preferences as Record<string, unknown>;
  return typeof o.email === 'string' ? o.email : undefined;
}

type OwnerListRow = OwnerProfileRow & {
  org?: { id: string; name: string } | null;
};

export async function listOwners(filters?: { activeOnly?: boolean | null }): Promise<OwnerAccount[]> {
  let q = supabase
    .from('profiles')
    .select(
      `
      *,
      org:organizations!profiles_organization_id_fkey (id, name)
    `,
    )
    .eq('role', 'owner')
    .order('created_at', { ascending: false });

  if (filters?.activeOnly === true) {
    q = q.eq('is_active', true);
  } else if (filters?.activeOnly === false) {
    q = q.eq('is_active', false);
  }

  const rows = (await unwrap(q)) as OwnerListRow[];
  return rows.map((r) => {
    const { org, ...profile } = r;
    return {
      ...profile,
      emailDisplay: prefsEmail(profile.preferences),
      organizationName: org?.name ?? null,
    };
  });
}

export async function getOwner(id: string): Promise<OwnerAccount | null> {
  const row = (await unwrap(
    supabase
      .from('profiles')
      .select(
        `
        *,
        org:organizations!profiles_organization_id_fkey (id, name)
      `,
      )
      .eq('id', id)
      .eq('role', 'owner')
      .maybeSingle(),
  )) as OwnerListRow | null;
  if (!row) return null;
  const { org, ...profile } = row;
  return {
    ...profile,
    emailDisplay: prefsEmail(profile.preferences),
    organizationName: org?.name ?? null,
  };
}

export async function updateOwner(
  id: string,
  patch: Pick<OwnerProfileRow, 'full_name' | 'phone'> & { email?: string },
): Promise<void> {
  let preferences: OwnerProfileRow['preferences'] | undefined;
  if (patch.email !== undefined) {
    const existing = await getOwner(id);
    const basePrefs =
      existing?.preferences && typeof existing.preferences === 'object'
        ? { ...(existing.preferences as Record<string, unknown>) }
        : {};
    basePrefs.email = patch.email.trim().toLowerCase();
    preferences = basePrefs as OwnerProfileRow['preferences'];
  }
  await unwrap(
    supabase
      .from('profiles')
      .update({
        full_name: patch.full_name,
        phone: patch.phone ?? null,
        ...(preferences !== undefined ? { preferences } : {}),
      })
      .eq('id', id)
      .eq('role', 'owner'),
  );
}

export async function setOwnerActive(id: string, isActive: boolean): Promise<void> {
  await unwrap(supabase.from('profiles').update({ is_active: isActive }).eq('id', id).eq('role', 'owner'));
}

export async function sendOwnerPasswordReset(email: string): Promise<void> {
  const redirectTo = `${window.location.origin}/public/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo,
  });
  if (error) throw error;
}

export interface InviteOwnerPayload {
  fullName: string;
  email: string;
  phone?: string;
  organizationId: string;
  memberRole?: 'owner' | 'admin' | 'staff' | 'viewer';
}

/** Calls Edge Function create-owner (requires Owner or SuperAdmin JWT). */
export async function inviteOwnerToOrganization(payload: InviteOwnerPayload): Promise<{ ownerId: string }> {
  const { data, error } = await supabase.functions.invoke<{
    success?: boolean;
    owner?: { id: string };
  }>('create-owner', {
    body: {
      fullName: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone?.trim(),
      organizationId: payload.organizationId,
      memberRole: payload.memberRole ?? 'owner',
    },
  });
  if (error) throw error;
  const id = data?.owner?.id;
  if (!id) throw new Error('Invalid response from create-owner');
  return { ownerId: id };
}

export async function countOwnersByActive(): Promise<{ active: number; inactive: number }> {
  const rows = await unwrap(supabase.from('profiles').select('is_active').eq('role', 'owner'));
  let active = 0;
  let inactive = 0;
  for (const r of rows as { is_active: boolean | null }[]) {
    if (r.is_active === false) inactive += 1;
    else active += 1;
  }
  return { active, inactive };
}
