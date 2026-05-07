import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import type { Database } from '@/types/supabase';

export type OrganizationRow = Database['smartstay']['Tables']['organizations']['Row'];
export type OrganizationStatus = 'active' | 'suspended' | 'archived';

export interface OrganizationSummary extends OrganizationRow {
  plan?: Database['smartstay']['Tables']['subscription_plans']['Row'] | null;
  primary_owner?: Pick<Database['smartstay']['Tables']['profiles']['Row'], 'id' | 'full_name'> | null;
  member_count?: number;
}

export interface ListOrganizationsFilters {
  status?: OrganizationStatus | 'all';
  search?: string;
  includeArchived?: boolean;
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function attachMemberCounts(rows: OrganizationRow[]): Promise<Map<string, number>> {
  if (rows.length === 0) return new Map();
  const ids = rows.map((r) => r.id);
  const members = await unwrap(
    supabase
      .from('organization_members')
      .select('organization_id')
      .in('organization_id', ids)
      .eq('is_active', true),
  );
  const map = new Map<string, number>();
  for (const id of ids) map.set(id, 0);
  for (const m of members as { organization_id: string }[]) {
    const k = m.organization_id;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

export async function listOrganizations(filters: ListOrganizationsFilters = {}): Promise<OrganizationSummary[]> {
  let q = supabase
    .from('organizations')
    .select(
      `
      *,
      plan:subscription_plans (*),
      primary_owner:profiles!organizations_primary_owner_id_fkey (id, full_name)
    `,
    )
    .order('created_at', { ascending: false });

  const showArchived = filters.includeArchived || filters.status === 'archived';
  if (!showArchived) {
    q = q.is('deleted_at', null);
  }

  if (filters.status && filters.status !== 'all') {
    q = q.eq('status', filters.status);
  }

  if (filters.search?.trim()) {
    const raw = filters.search.trim().replace(/%/g, '');
    const s = `%${raw}%`;
    q = q.or(`name.ilike.${s},slug.ilike.${s}`);
  }

  const rows = (await unwrap(q)) as OrganizationSummary[];
  const counts = await attachMemberCounts(rows);

  return rows.map((row) => ({
    ...row,
    member_count: counts.get(row.id) ?? 0,
  }));
}

export async function getOrganization(id: string): Promise<OrganizationSummary | null> {
  const row = (await unwrap(
    supabase
      .from('organizations')
      .select(
        `
        *,
        plan:subscription_plans (*),
        primary_owner:profiles!organizations_primary_owner_id_fkey (id, full_name)
      `,
      )
      .eq('id', id)
      .maybeSingle(),
  )) as OrganizationSummary | null;
  if (!row) return null;
  const counts = await attachMemberCounts([row]);
  return { ...row, member_count: counts.get(row.id) ?? 0 };
}

export async function createOrganization(input: {
  name: string;
  slug?: string;
  description?: string | null;
  plan_id: string;
}): Promise<OrganizationRow> {
  const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.name);
  const row = await unwrap(
    supabase
      .from('organizations')
      .insert({
        name: input.name.trim(),
        slug,
        description: input.description ?? null,
        plan_id: input.plan_id,
        status: 'active',
      })
      .select('*')
      .single(),
  );
  return row as OrganizationRow;
}

export async function updateOrganization(
  id: string,
  patch: Partial<
    Pick<OrganizationRow, 'name' | 'slug' | 'description' | 'plan_id' | 'primary_owner_id'>
  >,
): Promise<OrganizationRow> {
  const row = await unwrap(supabase.from('organizations').update(patch).eq('id', id).select('*').single());
  return row as OrganizationRow;
}

export async function suspendOrganization(id: string): Promise<void> {
  await unwrap(
    supabase
      .from('organizations')
      .update({
        status: 'suspended',
        suspended_at: new Date().toISOString(),
      })
      .eq('id', id),
  );
}

export async function reactivateOrganization(id: string): Promise<void> {
  await unwrap(
    supabase
      .from('organizations')
      .update({
        status: 'active',
        suspended_at: null,
      })
      .eq('id', id),
  );
}

/** Soft-delete: archived + deleted_at */
export async function archiveOrganization(id: string): Promise<void> {
  await unwrap(
    supabase
      .from('organizations')
      .update({
        status: 'archived',
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id),
  );
}

export async function changeOrganizationPlan(organizationId: string, planId: string): Promise<void> {
  await unwrap(supabase.from('organizations').update({ plan_id: planId }).eq('id', organizationId));
}

export async function setPrimaryOwner(organizationId: string, profileId: string): Promise<void> {
  await unwrap(
    supabase.from('organizations').update({ primary_owner_id: profileId }).eq('id', organizationId),
  );
}

export interface OrganizationMemberRow {
  id: string;
  organization_id: string;
  user_id: string;
  member_role: string;
  is_active: boolean;
  joined_at: string | null;
  profile?: Pick<
    Database['smartstay']['Tables']['profiles']['Row'],
    'id' | 'full_name' | 'phone' | 'role' | 'is_active' | 'preferences'
  > | null;
}

export async function listOrganizationMembers(organizationId: string): Promise<OrganizationMemberRow[]> {
  const rows = await unwrap(
    supabase
      .from('organization_members')
      .select(
        `
        id,
        organization_id,
        user_id,
        member_role,
        is_active,
        joined_at,
        profile:profiles!organization_members_user_id_fkey (
          id,
          full_name,
          phone,
          role,
          is_active,
          preferences
        )
      `,
      )
      .eq('organization_id', organizationId)
      .order('joined_at', { ascending: false }),
  );
  return rows as OrganizationMemberRow[];
}

export async function computeMrrEstimate(): Promise<number> {
  const rows = await unwrap(
    supabase
      .from('organizations')
      .select('plan_id')
      .eq('status', 'active')
      .is('deleted_at', null),
  );
  const planIds = [...new Set((rows as { plan_id: string | null }[]).map((r) => r.plan_id).filter(Boolean))] as string[];
  if (planIds.length === 0) return 0;
  const plans = await unwrap(
    supabase.from('subscription_plans').select('id, monthly_price').in('id', planIds),
  );
  const priceById = new Map((plans as { id: string; monthly_price: number }[]).map((p) => [p.id, Number(p.monthly_price)]));
  let sum = 0;
  for (const r of rows as { plan_id: string | null }[]) {
    if (!r.plan_id) continue;
    sum += priceById.get(r.plan_id) ?? 0;
  }
  return sum;
}

export async function countOrganizationsByStatus(): Promise<{ active: number; suspended: number; archived: number }> {
  const all = await unwrap(
    supabase.from('organizations').select('status, deleted_at'),
  );
  let active = 0;
  let suspended = 0;
  let archived = 0;
  for (const o of all as { status: string; deleted_at: string | null }[]) {
    if (o.deleted_at != null) {
      archived += 1;
      continue;
    }
    if (o.status === 'suspended') suspended += 1;
    else if (o.status === 'archived') archived += 1;
    else active += 1;
  }
  return { active, suspended, archived };
}

/** JSON snapshot for backup / migration (super-admin). */
export async function exportOrganizationBackup(organizationId: string): Promise<Record<string, unknown>> {
  const org = await getOrganization(organizationId);
  const members = await listOrganizationMembers(organizationId);
  const userIds = members.map((m) => m.user_id);
  const profiles =
    userIds.length === 0
      ? []
      : await unwrap(supabase.from('profiles').select('*').in('id', userIds));
  const audit_logs =
    userIds.length === 0
      ? []
      : await unwrap(
          supabase
            .from('audit_logs')
            .select('*')
            .in('user_id', userIds)
            .order('created_at', { ascending: false })
            .limit(5000),
        );
  return {
    exported_at: new Date().toISOString(),
    organization: org,
    members,
    profiles,
    audit_logs,
  };
}
