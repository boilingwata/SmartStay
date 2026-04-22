import { Role, Permission, RolePermission } from '@/types';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';

/**
 * Role Service
 * Refactored to fetch dynamic RBAC data from Supabase with strong typing.
 */

export const roleService = {
  /**
   * Fetches all defined roles from the database.
   */
  getRoles: async (): Promise<Role[]> => {
    const rows = await unwrap(
      supabase
        .from('roles')
        .select('id, name, description, is_system')
        .order('name')
    );

    return rows.map(row => ({
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
        .from('permissions')
        .select('code, name, group_name')
        .order('group_name', { ascending: true })
    );

    return rows.map(row => ({
      key: row.code,
      name: row.name,
      group: row.group_name || 'General',
    }));
  },

  /**
   * Fetches the mapping of permissions assigned to each role.
   */
  getRolePermissions: async (): Promise<RolePermission[]> => {
    const { data: roles } = await supabase.from('roles').select('id');
    if (!roles) return [];

    // Fetch junctions with joined permission codes
    const rows = await unwrap(
      supabase
        .from('role_permissions')
        .select(`
          role_id, 
          permissions!inner(code)
        `)
    );

    // Group permissions by role_id
    const grouped = rows.reduce((acc: Record<string, string[]>, current: { role_id: string; permissions: { code: string } | null }) => {
      const roleId = current.role_id;
      const permCode = current.permissions?.code;
      if (!acc[roleId]) acc[roleId] = [];
      if (permCode) acc[roleId].push(permCode);
      return acc;
    }, {});

    return roles.map(r => ({
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
        .from('roles')
        .select('id, name, description, is_system')
        .eq('id', id)
        .maybeSingle()
    );

    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      isSystem: row.is_system || false,
    };
  },

  /**
   * Updates the permissions assigned to a specific role.
   * This is now persisted to the 'role_permissions' table.
   */
  updateRolePermissions: async (roleId: string, permissions: string[]): Promise<void> => {
    // 1. Get permission IDs for the provided codes
    const { data: permRows } = await supabase
      .from('permissions')
      .select('id, code')
      .in('code', permissions);
    
    if (!permRows) return;

    // 2. Delete existing mappings for this role
    await unwrap(
      supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)
    );

    // 3. Insert new mappings
    if (permRows.length > 0) {
      const newMappings = permRows.map(p => ({
        role_id: roleId,
        permission_id: p.id
      }));

      await unwrap(
        supabase
          .from('role_permissions')
          .insert(newMappings)
      );
    }
  },

  /**
   * Creates or updates a role definition.
   * Protects system roles from critical property modification.
   */
  upsertRole: async (role: Partial<Role>): Promise<Role> => {
    // If updating, check if it's a system role
    if (role.id) {
      const existing = await roleService.getRoleById(role.id);
      if (existing?.isSystem) {
        // For system roles, we only allow updating description
        const { data: updated } = await supabase
          .from('roles')
          .update({ description: role.description })
          .eq('id', role.id)
          .select()
          .single();
        
        if (!updated) throw new Error('Failed to update system role description');
        return {
          id: updated.id,
          name: updated.name,
          description: updated.description || '',
          isSystem: true
        };
      }
    }

    const payload = {
      name: role.name!,
      description: role.description,
      is_system: false // Users cannot create system roles
    };

    const row = await unwrap(
      role.id 
        ? supabase.from('roles').update(payload).eq('id', role.id).select().single()
        : supabase.from('roles').insert(payload).select().single()
    );

    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      isSystem: row.is_system || false,
    };
  },

  /**
   * Deletes a role definition.
   * STRICTLY prevents deletion of system roles.
   */
  deleteRole: async (id: string): Promise<void> => {
    const role = await roleService.getRoleById(id);
    if (role?.isSystem) {
      throw new Error('System roles cannot be deleted.');
    }

    await unwrap(
      supabase.from('roles').delete().eq('id', id)
    );
  }
};

export default roleService;
