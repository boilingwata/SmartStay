import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import type { Database } from '@/types/supabase';

export interface FlagCatalogItem {
  key: string;
  label: string;
  description?: string;
}

export type OrgFeatureFlagRow = Database['smartstay']['Tables']['organization_feature_flags']['Row'];

async function getCatalog(): Promise<FlagCatalogItem[]> {
  const row = await unwrap(
    supabase.from('system_settings').select('value').eq('key', 'feature_flags.catalog').maybeSingle(),
  );
  const val = (row as { value?: unknown } | null)?.value;
  if (!Array.isArray(val)) return [];
  return val
    .filter((x): x is FlagCatalogItem => x != null && typeof x === 'object' && typeof (x as FlagCatalogItem).key === 'string')
    .map((x) => ({
      key: String((x as FlagCatalogItem).key),
      label: String((x as FlagCatalogItem).label ?? (x as FlagCatalogItem).key),
      description: (x as FlagCatalogItem).description != null ? String((x as FlagCatalogItem).description) : undefined,
    }));
}

export async function listCatalog(): Promise<FlagCatalogItem[]> {
  return getCatalog();
}

export async function listFlagsForOrganization(organizationId: string): Promise<OrgFeatureFlagRow[]> {
  return unwrap(
    supabase.from('organization_feature_flags').select('*').eq('organization_id', organizationId),
  );
}

export async function upsertOrganizationFlag(
  organizationId: string,
  flagKey: string,
  enabled: boolean,
): Promise<void> {
  await unwrap(
    supabase.from('organization_feature_flags').upsert(
      {
        organization_id: organizationId,
        flag_key: flagKey,
        enabled,
      },
      { onConflict: 'organization_id,flag_key', ignoreDuplicates: false },
    ),
  );
}
