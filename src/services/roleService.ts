import { Role } from '../models/Role';
import { RolePermission, Permission } from '../models/Permission';
import { ROLE_PERMISSION_CONFIG } from '@/config/rolePermissions';
import { permissionService } from './permissionService';

/**
 * Role Service
 *
 * ROL-01 / MK-01 FIX: Imports from @/config/rolePermissions instead of @/mocks/adminMocks.
 * `updateRolePermissions()` logs a clear warning because there is no DB table to persist
 * changes to. The UI should disable this action or show a tooltip explaining this limitation.
 */

const DEFAULT_ROLES: Role[] = [
  { id: 'admin',  name: 'Admin',  description: 'Toàn quyền hệ thống',    isSystem: true },
  { id: 'staff',  name: 'Staff',  description: 'Quyền vận hành',          isSystem: true },
  { id: 'tenant', name: 'Tenant', description: 'Quyền cổng cư dân',       isSystem: true },
  { id: 'viewer', name: 'Viewer', description: 'Chỉ xem',                  isSystem: true },
];

export const roleService = {
  getRoles: async (): Promise<Role[]> => [...DEFAULT_ROLES],

  getAllPermissions: async (): Promise<Permission[]> => {
    return ROLE_PERMISSION_CONFIG.permissions.map(p => ({
      key: p.permissionKey,
      group: p.module,
      name: p.description,
    }));
  },

  getRolePermissions: async (): Promise<RolePermission[]> => {
    const results: RolePermission[] = [];
    for (const role of DEFAULT_ROLES) {
      const perms = await permissionService.getPermissionsForRole(role.name);
      results.push({ roleId: role.id, permissions: perms });
    }
    return results;
  },

  getRoleById: async (id: string): Promise<Role | undefined> => {
    return DEFAULT_ROLES.find((r: Role) => r.id === id);
  },

  updateRolePermissions: async (_roleId: string, _permissions: string[]): Promise<void> => {
    // ROL-01: No role_permissions table exists in the DB.
    // Changes are NOT persisted. The UI should either hide this action or show
    // a tooltip: "Thay đổi quyền cần cập nhật cấu hình hệ thống."
    console.warn(
      '[roleService] updateRolePermissions: no role_permissions table — changes not persisted. ' +
      'To persist changes, create the role_permissions table and regenerate supabase.ts.'
    );
  },
};

export default roleService;
