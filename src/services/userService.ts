import { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { mapRole } from '@/lib/enumMaps';
import type { DbUserRole } from '@/types/supabase';

interface ProfileRow {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean | null;
  created_at: string | null;
}

interface ProfileUpdate {
  full_name?: string;
  phone?: string | null;
  avatar_url?: string | null;
  role?: DbUserRole;
  is_active?: boolean;
}

function rowToUser(row: ProfileRow): User {
  return {
    id: row.id,
    // profiles table has no separate username column; use full_name as fallback
    username: row.full_name,
    fullName: row.full_name,
    // USR-02: email is intentionally empty here.
    // The `profiles` table does NOT store email — it lives only in `auth.users`,
    // which is not directly accessible from the client JS SDK.
    // Email is patched in ONLY by authStore.syncSessionUser() which has access
    // to `session.user.email` from the active Supabase session.
    // Callers that need email must go through authStore, not userService.getUsers().
    email: '',
    phone: row.phone ?? undefined,
    avatar: row.avatar_url ?? undefined,
    role: mapRole.fromDb(row.role) as User['role'],
    isActive: row.is_active ?? true,
    isTwoFactorEnabled: false,
    createdAt: row.created_at ?? undefined,
  };
}

export const userService = {
  getUsers: async (filters?: {
    search?: string;
    role?: string;
    isActive?: boolean | string;
    buildingId?: string | number;
  }): Promise<User[]> => {
    let query = supabase
      .from('profiles')
      .select('id, full_name, phone, avatar_url, role, is_active, created_at')
      .order('created_at', { ascending: false });

    if (filters?.role && filters.role !== 'All') {
      const dbRole = mapRole.toDb(filters.role) as import('@/types/supabase').DbUserRole;
      query = query.eq('role', dbRole);
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
          u.fullName.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s)
      );
    }

    return users;
  },

  getUserById: async (id: number | string): Promise<User | undefined> => {
    const row = await unwrap(
      supabase
        .from('profiles')
        .select('id, full_name, phone, avatar_url, role, is_active, created_at')
        .eq('id', String(id))
        .maybeSingle()
    ) as ProfileRow | null;

    return row ? rowToUser(row) : undefined;
  },

  createUser: async (_user: Omit<User, 'id'>): Promise<User> => {
    // Creating auth users requires service-role key (not available client-side).
    // Stub: throw a descriptive error so the UI can surface it gracefully.
    throw new Error(
      'User creation requires server-side invocation (service-role key). ' +
      'Use a Supabase Edge Function or the admin dashboard instead.'
    );
  },

  updateUser: async (id: number | string, user: Partial<User>): Promise<User> => {
    const updatePayload: ProfileUpdate = {};
    if (user.fullName !== undefined) updatePayload.full_name = user.fullName;
    if (user.phone !== undefined) updatePayload.phone = user.phone ?? null;
    if (user.avatar !== undefined) updatePayload.avatar_url = user.avatar ?? null;
    if (user.isActive !== undefined) updatePayload.is_active = user.isActive;

    // E-02 FIX: Prevent silent role corruption for manager/landlord users.
    // mapRole.fromDb maps 'manager' and 'landlord' → 'Admin', and mapRole.toDb('Admin') → 'admin'.
    // If we naively persist the mapped role, managers/landlords become admins silently.
    // Guard: only update role if explicitly provided AND the current DB role is not one of the
    // privileged variants (manager, landlord) that round-trip incorrectly.
    if (user.role !== undefined) {
      const { data: currentRow } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', String(id))
        .maybeSingle();
      const currentDbRole = (currentRow as { role: string } | null)?.role ?? '';
      // Only write role if the DB currently stores 'admin' (safe to overwrite)
      // or if the target is 'staff'/'tenant' (no round-trip ambiguity for those).
      const isSafeToUpdateRole =
        currentDbRole === 'admin' ||
        currentDbRole === 'staff' ||
        currentDbRole === 'tenant' ||
        user.role === 'Staff' ||
        user.role === 'Tenant';
      if (isSafeToUpdateRole) {
        updatePayload.role = mapRole.toDb(user.role) as DbUserRole;
      }
      // If currentDbRole is 'manager' or 'landlord' and user.role === 'Admin',
      // skip the update to avoid data corruption (E-02).
    }

    const row = await unwrap(
      supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', String(id))
        .select('id, full_name, phone, avatar_url, role, is_active, created_at')
        .single()
    ) as ProfileRow;

    return rowToUser(row);
  },

  deleteUser: async (id: number | string): Promise<void> => {
    // Soft-delete: mark inactive rather than physically removing auth user
    await unwrap(
      supabase
        .from('profiles')
        .update({ is_active: false } as ProfileUpdate)
        .eq('id', String(id))
    );
  },

  resetPassword: async (_id: number | string, _newPassword?: string): Promise<void> => {
    // Password reset requires auth admin API (service-role).
    // The correct flow is to send a reset email via supabase.auth.resetPasswordForEmail.
    // This is a no-op stub; the caller should use sendResetPasswordEmail instead.
  },

  toggleUserStatus: async (id: number | string): Promise<void> => {
    // Fetch current status first, then flip it
    const { data: row } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', String(id))
      .maybeSingle();

    const current = (row as { is_active: boolean | null } | null)?.is_active ?? true;

    await unwrap(
      supabase
        .from('profiles')
        .update({ is_active: !current } as ProfileUpdate)
        .eq('id', String(id))
    );
  },

  sendResetPasswordEmail: async (_id: number | string): Promise<void> => {
    // Requires knowing the user's email, which lives in auth.users (server-side only).
    // Stub — implement via Edge Function in a full setup.
  },
};

export default userService;
