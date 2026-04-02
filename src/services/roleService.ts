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
      (supabase.from('roles' as any) as any)
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
      (supabase.from('permissions' as any) as any)
        .select('code, name, group_name')
        .order('group_name', { ascending: true })
    );

    return (rows as any[]).map(row => ({
      key: row.code,
      name: row.name,
      group: row.group_name,
    }));
  },

  /**
   * Fetches the mapping of permissions assigned to each role.
   */
  getRolePermissions: async (): Promise<RolePermission[]> => {
    const { data: roles } = await (supabase.from('roles' as any) as any).select('id');
    if (!roles) return [];

    // Fetch junctions with joined permission codes
    const rows = await unwrap(
      (supabase.from('role_permissions' as any) as any)
        .select(`
          role_id, 
          permissions!inner(code)
        `)
    );

    // Group permissions by role_id
    const grouped = (rows as any[]).reduce((acc: Record<string, string[]>, current: any) => {
      const roleId = current.role_id;
      const permCode = current.permissions?.code;
      if (!acc[roleId]) acc[roleId] = [];
      if (permCode) acc[roleId].push(permCode);
      return acc;
    }, {});

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
      (supabase.from('roles' as any) as any)
        .select('id, name, description, is_system')
        .eq('id', id)
        .maybeSingle()
    );

    if (!row) return undefined;
    const r = row as any;
    return {
      id: r.id,
      name: r.name,
      description: r.description || '',
      isSystem: r.is_system || false,
    };
  },

  /**
   * Updates the permissions assigned to a specific role.
   * This is now persisted to the 'role_permissions' table.
   */
  updateRolePermissions: async (roleId: string, permissions: string[]): Promise<void> => {
    // 1. Get permission IDs for the provided codes
    const { data: permRows } = await (supabase.from('permissions' as any) as any)
      .select('id, code')
      .in('code', permissions);
    
    if (!permRows) return;

    // 2. Delete existing mappings for this role
    await unwrap(
      (supabase.from('role_permissions' as any) as any)
        .delete()
        .eq('role_id', roleId)
    );

    // 3. Insert new mappings
    if ((permRows as any[]).length > 0) {
      const newMappings = (permRows as any[]).map((p: any) => ({
        role_id: roleId,
        permission_id: p.id
      }));

      await unwrap(
        (supabase.from('role_permissions' as any) as any)
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
        ? (supabase.from('roles' as any) as any).update(payload).eq('id', role.id).select().single()
        : (supabase.from('roles' as any) as any).insert(payload).select().single()
    );

    const r = row as any;
    return {
      id: r.id,
      name: r.name,
      description: r.description || '',
      isSystem: r.is_system || false,
    };
  }
};

export default roleService;
