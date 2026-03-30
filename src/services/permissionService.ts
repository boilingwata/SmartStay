import { ROLE_PERMISSION_CONFIG } from '@/config/rolePermissions';

/**
 * Permissions Service
 *
 * PRM-01 FIX: Imports from @/config/rolePermissions for static definition.
 * The `role_permissions` table does NOT exist in the `smartstay` schema.
 * Permissions are managed via static configuration for security — changes require
 * a code deploy, preventing accidental escalation via a UI bug.
 *
 * TO add DB-backed permissions in the future:
 *   1. Create a `role_permissions` table in supabase/migrations
 *   2. Re-generate src/types/supabase.ts
 *   3. Replace the static return below with a supabase.from('role_permissions') query
 */
export const permissionService = {
  async getPermissionsForRole(role: string): Promise<string[]> {
    return ROLE_PERMISSION_CONFIG.roleMap[role] ?? [];
  },

  async getAllPermissions() {
    return ROLE_PERMISSION_CONFIG.permissions;
  },
};

export default permissionService;
