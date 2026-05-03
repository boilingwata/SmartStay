import { ROLE_PERMISSION_CONFIG } from '@/config/rolePermissions';
import { roleService } from '@/services/roleService';

/**
 * Permissions Service
 *
 * Dynamic RBAC tables exist in the `smartstay` schema. The static config is a
 * UI fallback only; authorization is enforced by Supabase RLS/RPC policies.
 */
export const permissionService = {
  async getPermissionsForRole(role: string): Promise<string[]> {
    try {
      const normalizedRole = role.trim().toLowerCase();
      const [roles, rolePermissions] = await Promise.all([
        roleService.getRoles(),
        roleService.getRolePermissions(),
      ]);
      const targetRole = roles.find((item) => item.name.trim().toLowerCase() === normalizedRole);
      if (!targetRole) return ROLE_PERMISSION_CONFIG.roleMap[role] ?? [];

      return rolePermissions.find((item) => item.roleId === targetRole.id)?.permissions ?? [];
    } catch {
      return ROLE_PERMISSION_CONFIG.roleMap[role] ?? [];
    }
  },

  async getAllPermissions() {
    try {
      return await roleService.getAllPermissions();
    } catch {
      return ROLE_PERMISSION_CONFIG.permissions;
    }
  },
};

export default permissionService;
