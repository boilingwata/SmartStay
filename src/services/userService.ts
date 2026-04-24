import { User, UserRoleType } from '@/types';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { mapRole } from '@/lib/enumMaps';
import { Database, Json } from '@/types/supabase';

type ProfileRow = Database['smartstay']['Tables']['profiles']['Row'] & {
  roles?: {
    name: string;
  } | null;
};

interface ProfilePreferences {
  username?: string;
  email?: string;
  buildings_access?: (number | string)[];
  force_change_password?: boolean;
  [key: string]: Json | undefined;
}

interface CreateUserResult {
  user: User;
}

const PROFILE_SELECT = 'id, full_name, phone, avatar_url, role, role_id, tenant_stage, preferences, is_active, identity_number, date_of_birth, gender, address, created_at, roles(name)';

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

function toSupportedDbRole(role: User['role']): Database['smartstay']['Enums']['user_role'] {
  return mapRole.toDb(role) as Database['smartstay']['Enums']['user_role'];
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
    role: mapRole.fromDb(row.role ?? '') as UserRoleType,
    roleId: row.role_id ?? undefined,
    roleName: row.roles?.name || mapRole.fromDb(row.role ?? ''),
    buildingsAccess: normalizeBuildingsAccess(preferences.buildings_access),
    isActive: row.is_active ?? true,
    isTwoFactorEnabled: false,
    forceChangePassword: preferences.force_change_password ?? false,
    tenantStage: row.tenant_stage as User['tenantStage'],
    identityNumber: row.identity_number ?? undefined,
    dateOfBirth: row.date_of_birth ?? undefined,
    gender: row.gender ? (row.gender.charAt(0).toUpperCase() + row.gender.slice(1)) as User['gender'] : undefined,
    address: row.address ?? undefined,
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

export const userService = {
  getUsers: async (filters?: {
    search?: string;
    role?: string;
    roleId?: string;
    isActive?: boolean | string;
  }): Promise<User[]> => {
    let query = supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .order('created_at', { ascending: false });

    if (filters?.roleId && filters.roleId !== 'All') {
      query = query.eq('role_id', filters.roleId);
    } else if (filters?.role && filters.role !== 'All') {
      const dbRole = mapRole.toDb(filters.role) as Database['smartstay']['Enums']['user_role'];
      query = query.eq('role', dbRole);
    }

    const active = parseIsActiveFilter(filters?.isActive);
    if (active !== undefined) {
      query = query.eq('is_active', active);
    }

    const rows = await unwrap(query);
    let users = (rows as ProfileRow[]).map(rowToUser);

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      users = users.filter(
        (user) =>
          user.username.toLowerCase().includes(search) ||
          user.fullName.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)
      );
    }

    return users;
  },

  getUserById: async (id: number | string): Promise<User | undefined> => {
    const row = await unwrap(
      supabase
        .from('profiles')
        .select(PROFILE_SELECT)
        .eq('id', String(id))
        .maybeSingle()
    );

    return row ? rowToUser(row as ProfileRow) : undefined;
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
        identityNumber: user.identityNumber,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender?.toLowerCase(),
        address: user.address,
      },
    });

    if (error) throw new Error(error.message);
    if (!(result as CreateUserResult | null)?.user) {
      throw new Error('Tạo người dùng thất bại: phản hồi không hợp lệ từ server.');
    }

    return (result as CreateUserResult).user;
  },

  updateUser: async (id: number | string, user: Partial<User>): Promise<User> => {
    const { data: currentRow, error: currentError } = await supabase
      .from('profiles')
      .select('role, preferences')
      .eq('id', String(id))
      .maybeSingle();

    if (currentError) {
      throw new Error(currentError.message);
    }

    const currentDbRole = String(currentRow?.role ?? '');
    const currentPreferences = (currentRow?.preferences ?? {}) as ProfilePreferences;

    const updatePayload: Database['smartstay']['Tables']['profiles']['Update'] = {};
    if (user.fullName !== undefined) updatePayload.full_name = user.fullName;
    if (user.phone !== undefined) updatePayload.phone = user.phone ?? null;
    if (user.avatar !== undefined) updatePayload.avatar_url = user.avatar ?? null;
    if (user.isActive !== undefined) updatePayload.is_active = user.isActive;
    if (user.tenantStage !== undefined) updatePayload.tenant_stage = user.tenantStage as Database['smartstay']['Tables']['profiles']['Update']['tenant_stage'];
    if (user.roleId !== undefined) updatePayload.role_id = user.roleId ?? null;
    if (user.identityNumber !== undefined) updatePayload.identity_number = user.identityNumber ?? null;
    if (user.dateOfBirth !== undefined) updatePayload.date_of_birth = user.dateOfBirth ?? null;
    if (user.gender !== undefined) updatePayload.gender = (user.gender?.toLowerCase() ?? null) as Database['smartstay']['Tables']['profiles']['Update']['gender'];
    if (user.address !== undefined) updatePayload.address = user.address ?? null;

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
        currentDbRole === 'owner' ||
        currentDbRole === 'staff' ||
        currentDbRole === 'tenant' ||
        user.role === 'Staff' ||
        user.role === 'Tenant';

      if (isSafeToUpdateRole) {
        updatePayload.role = toSupportedDbRole(user.role);
      }
    }

    const row = await unwrap(
      supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', String(id))
        .select(PROFILE_SELECT)
        .single()
    );

    return rowToUser(row as ProfileRow);
  },

  deleteUser: async (id: number | string): Promise<void> => {
    await unwrap(
      supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', String(id))
    );
  },

  toggleUserStatus: async (id: number | string): Promise<void> => {
    const { data: row } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', String(id))
      .maybeSingle();

    const current = row?.is_active ?? true;

    await unwrap(
      supabase
        .from('profiles')
        .update({ is_active: !current })
        .eq('id', String(id))
    );
  },

  sendResetPasswordEmail: async (userId: string): Promise<void> => {
    const user = await userService.getUserById(userId);
    if (!user?.email) {
      throw new Error('Người dùng chưa có email để gửi liên kết đặt lại mật khẩu.');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/public/reset-password`,
    });

    if (error) throw error;
  },
  
  resetPassword: async (userId: string, password: string): Promise<void> => {
    // Note: Admin resetting another user's password usually requires an Edge Function
    // or service role. For now, we'll try using the admin API if available, 
    // but ideally this should call a dedicated RPC or Edge Function.
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: password
    });
    if (error) throw error;
  },
};

export default userService;
