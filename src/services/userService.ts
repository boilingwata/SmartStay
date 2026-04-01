import { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { mapRole } from '@/lib/enumMaps';
import type { DbTenantStage, DbUserRole } from '@/types/supabase';

interface ProfilePreferences {
  username?: string;
  email?: string;
  buildings_access?: (number | string)[];
  force_change_password?: boolean;
}

interface ProfileRow {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: string | null;
  role_id: string | null;
  tenant_stage: DbTenantStage;
  preferences: ProfilePreferences | null;
  is_active: boolean | null;
  created_at: string | null;
  roles?: {
    id: string;
    name: string;
  } | null;
}

interface ProfileUpdate {
  full_name?: string;
  phone?: string | null;
  avatar_url?: string | null;
  role?: DbUserRole;
  role_id?: string;
  tenant_stage?: DbTenantStage;
  preferences?: ProfilePreferences | null;
  is_active?: boolean;
}

interface CreateUserResult {
  user: User;
}

function normalizeUsername(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
}

function normalizeEmail(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function normalizeBuildingsAccess(value: User['buildingsAccess']): (number | string)[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is number | string => item !== null && item !== undefined && item !== '');
}

function getPreferences(row: ProfileRow): ProfilePreferences {
  return (row.preferences ?? {}) as ProfilePreferences;
}

function toSupportedDbRole(role: User['role']): DbUserRole {
  if (role === 'Viewer') {
    throw new Error('Vai trò Viewer chưa được hỗ trợ trong cơ sở dữ liệu hiện tại.');
  }
  return mapRole.toDb(role) as DbUserRole;
}

function rowToUser(row: ProfileRow): User {
  const preferences = getPreferences(row);
  return {
    id: row.id,
    username: preferences.username?.trim() || row.full_name,
    fullName: row.full_name,
    email: preferences.email?.trim() || '',
    phone: row.phone ?? undefined,
    avatar: row.avatar_url ?? undefined,
    role: (row.roles?.name || mapRole.fromDb(row.role ?? '') || 'Staff') as User['role'],
    roleId: row.role_id ?? undefined,
    buildingsAccess: normalizeBuildingsAccess(preferences.buildings_access),
    isActive: row.is_active ?? true,
    isTwoFactorEnabled: false,
    forceChangePassword: preferences.force_change_password ?? false,
    tenantStage: row.tenant_stage,
    createdAt: row.created_at ?? undefined,
  };
}

function parseIsActiveFilter(value: boolean | string | undefined): boolean | undefined {
  if (value === undefined || value === 'All' || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'Active' || value === 'true') return true;
  if (value === 'Inactive' || value === 'false') return false;
  return undefined;
}

const PROFILE_SELECT = 'id, full_name, phone, avatar_url, role, role_id, tenant_stage, preferences, is_active, created_at, roles(id, name)';

export const userService = {
  getUsers: async (filters?: {
    search?: string;
    role?: string;
    roleId?: string;
    isActive?: boolean | string;
  }): Promise<User[]> => {
    let query = (supabase.from('profiles') as any)
      .select(PROFILE_SELECT)
      .order('created_at', { ascending: false });

    if (filters?.roleId && filters.roleId !== 'All') {
      query = query.eq('role_id', filters.roleId);
    } else if (filters?.role && filters.role !== 'All') {
      const dbRole = mapRole.toDb(filters.role) as DbUserRole;
      query = query.eq('role', dbRole);
    }

    const active = parseIsActiveFilter(filters?.isActive);
    if (active !== undefined) {
      query = query.eq('is_active', active);
    }

    const rows = await unwrap(query) as ProfileRow[];
    let users = rows.map(rowToUser);

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      users = users.filter(
        (user) =>
          user.username.toLowerCase().includes(s) ||
          user.fullName.toLowerCase().includes(s) ||
          user.email.toLowerCase().includes(s)
      );
    }

    return users;
  },

  getUserById: async (id: number | string): Promise<User | undefined> => {
    const row = await unwrap(
      (supabase.from('profiles') as any)
        .select(PROFILE_SELECT)
        .eq('id', String(id))
        .maybeSingle()
    ) as ProfileRow | null;

    return row ? rowToUser(row) : undefined;
  },

  createUser: async (user: Omit<User, 'id'>): Promise<User> => {
    const username = normalizeUsername(user.username);
    if (username.length < 3) {
      throw new Error('Username phải có ít nhất 3 ký tự hợp lệ.');
    }

    const email = normalizeEmail(user.email);
    if (!email || !email.includes('@')) {
      throw new Error('Vui lòng nhập email hợp lệ.');
    }

    const { data: result, error } = await supabase.functions.invoke('create-user', {
      body: {
        fullName: user.fullName.trim(),
        username,
        email,
        phone: user.phone?.trim() || null,
        avatarUrl: user.avatar ?? null,
        role: toSupportedDbRole(user.role),
        roleId: user.roleId,
        isActive: user.isActive ?? true,
        buildingsAccess: normalizeBuildingsAccess(user.buildingsAccess),
        forceChangePassword: user.forceChangePassword ?? true,
        tenantStage: user.role === 'Tenant' ? (user.tenantStage ?? 'prospect') : undefined,
      },
    });

    if (error) throw new Error(error.message);
    if (!(result as CreateUserResult | null)?.user) {
      throw new Error('Tạo người dùng thất bại: phản hồi không hợp lệ từ server.');
    }

    return (result as CreateUserResult).user;
  },

  updateUser: async (id: number | string, user: Partial<User & { roleId?: string }>): Promise<User> => {
    const { data: currentRow, error: currentError } = await (supabase.from('profiles') as any)
      .select('role, preferences')
      .eq('id', String(id))
      .maybeSingle();

    if (currentError) {
      throw new Error(currentError.message);
    }

    const currentDbRole = (currentRow as { role?: string } | null)?.role ?? '';
    const currentPreferences = ((currentRow as { preferences?: ProfilePreferences | null } | null)?.preferences ?? {}) as ProfilePreferences;

    const updatePayload: ProfileUpdate = {};
    if (user.fullName !== undefined) updatePayload.full_name = user.fullName;
    if (user.phone !== undefined) updatePayload.phone = user.phone ?? null;
    if (user.avatar !== undefined) updatePayload.avatar_url = user.avatar ?? null;
    if (user.isActive !== undefined) updatePayload.is_active = user.isActive;
    if (user.tenantStage !== undefined) updatePayload.tenant_stage = user.tenantStage as DbTenantStage;
    if (user.roleId !== undefined) updatePayload.role_id = user.roleId;

    const nextPreferences: ProfilePreferences = { ...currentPreferences };
    let shouldUpdatePreferences = false;

    if (user.username !== undefined) {
      nextPreferences.username = normalizeUsername(user.username);
      shouldUpdatePreferences = true;
    }
    if (user.email !== undefined) {
      nextPreferences.email = normalizeEmail(user.email);
      shouldUpdatePreferences = true;
    }
    if (user.buildingsAccess !== undefined) {
      nextPreferences.buildings_access = normalizeBuildingsAccess(user.buildingsAccess);
      shouldUpdatePreferences = true;
    }
    if (user.forceChangePassword !== undefined) {
      nextPreferences.force_change_password = user.forceChangePassword;
      shouldUpdatePreferences = true;
    }

    if (shouldUpdatePreferences) {
      updatePayload.preferences = nextPreferences;
    }

    if (user.role !== undefined) {
      const isSafeToUpdateRole =
        currentDbRole === 'admin' ||
        currentDbRole === 'staff' ||
        currentDbRole === 'tenant' ||
        user.role === 'Staff' ||
        user.role === 'Tenant';

      if (isSafeToUpdateRole) {
        updatePayload.role = toSupportedDbRole(user.role);
      }
    }

    const row = await unwrap(
      (supabase.from('profiles') as any)
        .update(updatePayload)
        .eq('id', String(id))
        .select(PROFILE_SELECT)
        .single()
    ) as ProfileRow;

    return rowToUser(row);
  },

  deleteUser: async (id: number | string): Promise<void> => {
    await unwrap(
      (supabase.from('profiles') as any)
        .update({ is_active: false })
        .eq('id', String(id))
    );
  },

  toggleUserStatus: async (id: number | string): Promise<void> => {
    const { data: row } = await (supabase.from('profiles') as any)
      .select('is_active')
      .eq('id', String(id))
      .maybeSingle();

    const current = (row as { is_active: boolean | null } | null)?.is_active ?? true;

    await unwrap(
      (supabase.from('profiles') as any)
        .update({ is_active: !current })
        .eq('id', String(id))
    );
  },

  resetPassword: async (_id: number | string, _newPassword?: string): Promise<void> => {
    // Password reset requires auth admin API (service-role).
    // The correct flow is to send a reset email via supabase.auth.resetPasswordForEmail.
  },

  sendResetPasswordEmail: async (userId: string): Promise<void> => {
    const user = await userService.getUserById(userId);
    if (!user) throw new Error('User not found');

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  },
};

export default userService;
