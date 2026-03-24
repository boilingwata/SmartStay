import { Role } from '../models/Role';
import { RolePermission, Permission } from '../models/Permission';
import { MOCK_ROLE_PERMISSIONS } from '@/mocks/adminMocks';
import { permissionService } from './permissionService';

const DEFAULT_ROLES: Role[] = [
  { id: 'admin', name: 'Admin', description: 'Full system access', isSystem: true },
  { id: 'staff', name: 'Staff', description: 'Operational access', isSystem: true },
  { id: 'tenant', name: 'Tenant', description: 'Tenant portal access', isSystem: true },
  { id: 'viewer', name: 'Viewer', description: 'Read-only access', isSystem: true },
];

export const roleService = {
  getRoles: async (): Promise<Role[]> => {
    return [...DEFAULT_ROLES];
  },

  getAllPermissions: async (): Promise<Permission[]> => {
    return MOCK_ROLE_PERMISSIONS.permissions.map((p) => ({
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
    // Will be wired to DB when role_permissions table exists
    console.warn('[roleService] updateRolePermissions: no DB table yet, changes not persisted');
  },
};
