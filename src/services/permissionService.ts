import { supabase } from '@/lib/supabase';
import { MOCK_ROLE_PERMISSIONS } from '@/mocks/adminMocks';

interface RolePermissionRow {
  id: string;
  role: string;
  permission_key: string;
}

/**
 * Fetches the permission keys for a given role from the `role_permissions` table.
 * Falls back to the static MOCK_ROLE_PERMISSIONS when the table doesn't exist yet.
 */
export const permissionService = {
  async getPermissionsForRole(role: string): Promise<string[]> {
    const dbRole = role.toLowerCase();

    const { data, error } = await supabase
      .from('role_permissions' as any)
      .select('permission_key')
      .eq('role', dbRole);

    if (error) {
      // Table likely doesn't exist yet — fall back to static map
      console.warn('[permissionService] Falling back to static permissions:', error.message);
      return MOCK_ROLE_PERMISSIONS.roleMap[role] ?? [];
    }

    if (!data || data.length === 0) {
      // Table exists but no rows for this role — still fall back
      return MOCK_ROLE_PERMISSIONS.roleMap[role] ?? [];
    }

    return (data as unknown as RolePermissionRow[]).map((row) => row.permission_key);
  },
};

export default permissionService;
