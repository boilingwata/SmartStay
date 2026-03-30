import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';

export interface SystemSetting {
  key: string;
  value: any;
  groupName: string | null;
  description?: string;
  isSensitive: boolean;
  updatedAt: string;
}

interface SystemSettingRow {
  key: string;
  value: any;
  group_name: string | null;
  description: string | null;
  is_sensitive: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

function rowToSetting(row: SystemSettingRow): SystemSetting {
  return {
    key: row.key,
    value: row.value,
    groupName: row.group_name,
    description: row.description ?? undefined,
    isSensitive: row.is_sensitive ?? false,
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
}

export const systemService = {
  getSettings: async (group?: string): Promise<SystemSetting[]> => {
    let query = supabase
      .from('system_settings')
      .select('*')
      .order('group_name', { ascending: true })
      .order('key', { ascending: true });

    if (group) {
      query = query.eq('group_name', group);
    }

    const rows = await unwrap(query) as unknown as SystemSettingRow[];
    return rows.map(rowToSetting);
  },

  getSettingByKey: async (key: string): Promise<SystemSetting | undefined> => {
    const row = await unwrap(
      supabase
        .from('system_settings')
        .select('*')
        .eq('key', key)
        .maybeSingle()
    ) as unknown as SystemSettingRow | null;

    return row ? rowToSetting(row) : undefined;
  },

  updateSetting: async (key: string, value: any): Promise<void> => {
    await unwrap(
      supabase
        .from('system_settings')
        .update({ value })
        .eq('key', key)
    );
  },
};

export default systemService;
