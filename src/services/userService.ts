import { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { toast } from 'sonner';

interface ProfileRow {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: string | null; // Old enum column
  role_id: string | null; // New UUID column
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
  role_id?: string;
  is_active?: boolean;
}

function rowToUser(row: ProfileRow): User {
  return {
    id: row.id,
    username: row.full_name,
    fullName: row.full_name,
    email: '', // Email lives in auth.users
    phone: row.phone ?? undefined,
    avatar: row.avatar_url ?? undefined,
    // Use the dynamic role name from the joined table, fallback to old role enum
    role: (row.roles?.name || row.role || 'Tenant') as any,
    roleId: row.role_id ?? undefined,
    isActive: row.is_active ?? true,
    isTwoFactorEnabled: false,
    createdAt: row.created_at ?? undefined,
  };
}

const PROFILE_SELECT = 'id, full_name, phone, avatar_url, role, role_id, is_active, created_at, roles(id, name)';

export const userService = {
  getUsers: async (filters?: {
    search?: string;
    roleId?: string;
    isActive?: boolean | string;
  }): Promise<User[]> => {
    let query = (supabase.from('profiles') as any)
      .select(PROFILE_SELECT)
      .order('created_at', { ascending: false });

    if (filters?.roleId && filters.roleId !== 'All') {
      query = query.eq('role_id', filters.roleId);
    }

    if (filters?.isActive !== undefined && filters.isActive !== 'All') {
      const active = filters.isActive === true || filters.isActive === 'Active';
      query = query.eq('is_active', active);
    }

    const rows = await unwrap(query) as ProfileRow[];
    let users = rows.map(rowToUser);

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      users = users.filter(
        u =>
          u.username.toLowerCase().includes(s) ||
          u.fullName.toLowerCase().includes(s)
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

  updateUser: async (id: number | string, user: Partial<User & { roleId?: string }>): Promise<User> => {
    const updatePayload: ProfileUpdate = {};
    if (user.fullName !== undefined) updatePayload.full_name = user.fullName;
    if (user.phone !== undefined) updatePayload.phone = user.phone ?? null;
    if (user.avatar !== undefined) updatePayload.avatar_url = user.avatar ?? null;
    if (user.isActive !== undefined) updatePayload.is_active = user.isActive;
    if (user.roleId !== undefined) updatePayload.role_id = user.roleId;

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

  createUser: async (user: Omit<User, 'id'>): Promise<User> => {
    // Note: Creating auth users requires service_role key or Edge Function
    // We simulate creating a profile for now
    const { data: { user: authUser }, error } = await supabase.auth.signUp({
      email: user.email,
      password: 'TemporaryPassword123!', // Should be randomized in production
      options: {
        data: {
          full_name: user.fullName,
        }
      }
    });

    if (error) throw error;
    if (!authUser) throw new Error('Failed to create auth user');

    const updatePayload: ProfileUpdate = {
      full_name: user.fullName,
      phone: user.phone || null,
      role_id: user.roleId,
      is_active: true
    };

    const row = await unwrap(
      (supabase.from('profiles') as any)
        .update(updatePayload)
        .eq('id', authUser.id)
        .select(PROFILE_SELECT)
        .single()
    ) as ProfileRow;

    return rowToUser(row);
  },

  resetPassword: async (userId: string, newPassword: string): Promise<void> => {
    // In production, this would call an Edge Function or Supabase Admin API
    // Clients can only update their own password
    toast.info('Chức năng đổi mật khẩu thủ công yêu cầu Edge Function. Đang giả lập...');
    console.log(`Simulating password reset for ${userId} to ${newPassword}`);
  },

  sendResetPasswordEmail: async (userId: string): Promise<void> => {
    const user = await userService.getUserById(userId);
    if (!user) throw new Error('User not found');
    
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) throw error;
  }
};

export default userService;
