import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import type { Database } from '@/types/supabase';

export type SubscriptionPlanRow = Database['smartstay']['Tables']['subscription_plans']['Row'];

export async function listPlans(activeOnly = true): Promise<SubscriptionPlanRow[]> {
  let q = supabase.from('subscription_plans').select('*').order('monthly_price', { ascending: true });
  if (activeOnly) {
    q = q.eq('is_active', true);
  }
  return unwrap(q);
}

export async function getPlanById(id: string): Promise<SubscriptionPlanRow | null> {
  const rows = await unwrap(
    supabase.from('subscription_plans').select('*').eq('id', id).maybeSingle(),
  );
  return rows;
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

export async function createPlan(input: {
  name: string;
  slug?: string;
  description?: string | null;
  monthly_price: number;
  building_limit?: number;
  room_limit?: number;
  user_limit?: number;
  is_active?: boolean;
}): Promise<SubscriptionPlanRow> {
  const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.name);
  const row = await unwrap(
    supabase
      .from('subscription_plans')
      .insert({
        name: input.name.trim(),
        slug,
        description: input.description ?? null,
        monthly_price: input.monthly_price,
        building_limit: input.building_limit ?? 999999,
        room_limit: input.room_limit ?? 999999,
        user_limit: input.user_limit ?? 999999,
        is_active: input.is_active ?? true,
      })
      .select('*')
      .single(),
  );
  return row as SubscriptionPlanRow;
}

export async function updatePlan(
  id: string,
  patch: Partial<
    Pick<
      SubscriptionPlanRow,
      | 'name'
      | 'slug'
      | 'description'
      | 'monthly_price'
      | 'building_limit'
      | 'room_limit'
      | 'user_limit'
      | 'is_active'
    >
  >,
): Promise<void> {
  await unwrap(supabase.from('subscription_plans').update(patch).eq('id', id));
}
