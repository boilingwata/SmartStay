import { Role, Permission, RolePermission } from '@/types';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';

/**
 * Role Service
 * Refactored to fetch dynamic RBAC data from Supabase.
 */

export const roleService = {
  /**
   * Fetches all defined roles from the database.
   */
  getRoles: async (): Promise<Role[]> => {
    const rows = await unwrap(
      supabase
        .from('roles' as any)
        .select('id, name, description, is_system')
        .order('name')
    );

    return (rows as any[]).map(row => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      isSystem: row.is_system || false,
    }));
  },

  /**
   * Fetches all unique permissions grouped by module.
   */
  getAllPermissions: async (): Promise<Permission[]> => {
    const rows = await unwrap(
      supabase
        .from('permissions' as any)
        .select('code, name, group')
        .order('group', { ascending: true })
    );

    return (rows as any[]).map(row => ({
      key: row.code,
      name: row.name,
      group: row.group,
    }));
  },

  /**
   * Fetches the mapping of permissions assigned to each role.
   */
  getRolePermissions: async (): Promise<RolePermission[]> => {
    const { data: roles } = await supabase.from('roles' as any).select('id');
    if (!roles) return [];

    const results: RolePermission[] = [];
    
    // Fetch junction data
    const rows = await unwrap(
      supabase
        .from('role_permissions' as any)
        .select('role_id, permissions(code)')
    );

    // Group permissions by role_id
    const grouped = (rows as any[]).reduce((acc, current) => {
      const roleId = current.role_id;
      const permCode = current.permissions?.code;
      if (!acc[roleId]) acc[roleId] = [];
      if (permCode) acc[roleId].push(permCode);
      return acc;
    }, {} as Record<string, string[]>);

    return (roles as any[]).map(r => ({
      roleId: r.id,
      permissions: grouped[r.id] || []
    }));
  },

  /**
   * Fetches a single role by its UUID.
   */
  getRoleById: async (id: string): Promise<Role | undefined> => {
    const row = await unwrap(
      supabase
        .from('roles' as any)
        .select('id, name, description, is_system')
        .eq('id', id)
        .maybeSingle()
    );

    if (!row) return undefined;
    return {
      id: (row as any).id,
      name: (row as any).name,
      description: (row as any).description || '',
      isSystem: (row as any).is_system || false,
    };
  },

  /**
   * Updates the permissions assigned to a specific role.
   * This is now persisted to the 'role_permissions' table.
   */
  updateRolePermissions: async (roleId: string, permissions: string[]): Promise<void> => {
    // 1. Get permission IDs for the provided codes
    const { data: permRows } = await supabase
      .from('permissions' as any)
      .select('id, code')
      .in('code', permissions);
    
    if (!permRows) return;

    // 2. Delete existing mappings for this role
    await unwrap(
      supabase
        .from('role_permissions' as any)
        .delete()
        .eq('role_id', roleId)
    );

    // 3. Insert new mappings
    if ((permRows as any[]).length > 0) {
      const newMappings = (permRows as any[]).map(p => ({
        role_id: roleId,
        permission_id: p.id
      }));

      await unwrap(
        supabase
          .from('role_permissions' as any)
          .insert(newMappings)
      );
    }
  },

  /**
   * Creates or updates a role definition.
   */
  upsertRole: async (role: Partial<Role>): Promise<Role> => {
    const payload = {
      name: role.name,
      description: role.description,
      is_system: role.isSystem ?? false
    };

    const row = await unwrap(
      role.id 
        ? supabase.from('roles' as any).update(payload).eq('id', role.id).select().single()
        : supabase.from('roles' as any).insert(payload).select().single()
    );

    return {
      id: (row as any).id,
      name: (row as any).name,
      description: (row as any).description || '',
      isSystem: (row as any).is_system || false,
    };
  }
};

export default roleService;
