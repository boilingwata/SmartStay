import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { TenantProfile } from '@/models/Tenant';
import { mapGender } from '@/lib/enumMaps';
import { handleServiceError } from '@/utils/errorUtils';
import { assertNoLikelyMojibake } from '@/utils';

export interface PortalProfile extends TenantProfile {
  buildingName: string;
  roomCode: string;
  avatar: string;
  notificationPrefs: {
    sms: boolean;
    email: boolean;
    push: boolean;
  };
}

// ---------------------------------------------------------------------------
// Internal DB row shapes
// ---------------------------------------------------------------------------

interface DbTenantProfileRow {
  id: number;
  full_name: string;
  id_number: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  permanent_address: string | null;
  documents: unknown | null;
  profile_id: string | null;
  profiles: { avatar_url: string | null } | null;
}

interface DbContractTenantRow {
  is_primary: boolean | null;
  contracts: {
    status: string | null;
    is_deleted: boolean | null;
    room_id: number;
    rooms: {
      room_code: string;
      buildings: { name: string } | null;
    } | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getCurrentTenantRow(): Promise<{ tenantId: number; profileId: string } | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const tenants = await unwrap(
    supabase
      .from('tenants')
      .select('id')
      .eq('profile_id', user.id)
      .eq('is_deleted', false)
      .limit(1)
  ) as unknown as { id: number }[];

  if (!tenants?.[0]) return null;
  return { tenantId: tenants[0].id, profileId: user.id };
}

async function getFallbackProfile(profileId: string): Promise<PortalProfile> {
  const profile = await unwrap(
    supabase
      .from('profiles')
      .select('full_name, phone, avatar_url')
      .eq('id', profileId)
      .single()
  ) as unknown as { full_name: string; phone: string | null; avatar_url: string | null };

  return {
    id: profileId,
    fullName: profile.full_name,
    phone: profile.phone ?? '',
    email: undefined,
    cccd: '',
    status: 'CheckedOut',
    currentRoomId: undefined,
    currentRoomCode: undefined,
    avatarUrl: profile.avatar_url ?? undefined,
    onboardingPercent: 0,
    gender: 'Other',
    dateOfBirth: '',
    permanentAddress: '',
    cccdIssuedDate: '',
    cccdIssuedPlace: '',
    nationality: 'Việt Nam',
    occupation: '',
    vehiclePlates: [],
    notes: '',
    avatar: profile.avatar_url ?? '',
    roomCode: '',
    buildingName: 'SmartStay',
    notificationPrefs: {
      sms: true,
      email: true,
      push: true,
    },
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const portalProfileService = {
  getProfile: async (): Promise<PortalProfile> => {
    try {
      const context = await getCurrentTenantRow();
      if (!context) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        return await getFallbackProfile(user.id);
      }

      const { tenantId } = context;

      const row = await unwrap(
        supabase
          .from('tenants')
          .select(`
            id, full_name, id_number, date_of_birth, gender,
            phone, email, permanent_address, documents, profile_id,
            profiles ( avatar_url )
          `)
          .eq('id', tenantId)
          .eq('is_deleted', false)
          .single()
      ) as unknown as DbTenantProfileRow;

      // Determine active contract room + building
      const contractLinks = await unwrap(
        supabase
          .from('contract_tenants')
          .select(`
            is_primary,
            contracts (
              status, is_deleted, room_id,
              rooms ( room_code, buildings ( name ) )
            )
          `)
          .eq('tenant_id', tenantId)
      ) as unknown as DbContractTenantRow[];

      const activeLink = (contractLinks ?? []).find(
        l => l.contracts?.status === 'active' && !l.contracts?.is_deleted
      );

      const docs = row.documents as Record<string, unknown> | null;
      const vehiclePlates: string[] = Array.isArray(docs?.vehicle_plates)
        ? (docs!.vehicle_plates as string[])
        : [];

      const avatarUrl = row.profiles?.avatar_url ?? '';

      return {
        id: String(row.id),
        fullName: row.full_name,
        phone: row.phone ?? '',
        email: row.email ?? undefined,
        cccd: row.id_number,
        status: activeLink ? 'Active' : 'CheckedOut',
        currentRoomId: activeLink?.contracts?.room_id != null
          ? String(activeLink.contracts.room_id)
          : undefined,
        currentRoomCode: activeLink?.contracts?.rooms?.room_code ?? undefined,
        avatarUrl: avatarUrl || undefined,
        onboardingPercent: 0,
        gender: mapGender.fromDb(row.gender ?? 'other') as 'Male' | 'Female' | 'Other',
        dateOfBirth: row.date_of_birth ?? '',
        permanentAddress: row.permanent_address ?? '',
        cccdIssuedDate: '',
        cccdIssuedPlace: '',
        nationality: 'Việt Nam',
        occupation: '',
        vehiclePlates,
        notes: (docs?.notes as string | undefined) ?? '',
        // PortalProfile-specific fields
        avatar: avatarUrl,
        roomCode: activeLink?.contracts?.rooms?.room_code ?? '',
        buildingName: activeLink?.contracts?.rooms?.buildings?.name ?? 'SmartStay',
        // PP-01: notificationPrefs are hardcoded to all-enabled defaults.
        // The `profiles` and `tenants` tables have no notification preferences column.
        // TO PERSIST USER PREFS: add a `notification_prefs` JSONB column to `profiles`
        // or create a separate `notification_preferences` table, then query it here.
        notificationPrefs: {
          sms: true,
          email: true,
          push: true,
        },
      };
    } catch (error) {
      return handleServiceError(error, 'Không thể tải thông tin cá nhân');
    }
  },

  updateProfile: async (data: Partial<PortalProfile>): Promise<void> => {
    try {
      assertNoLikelyMojibake(
        {
          fullName: data.fullName,
          email: data.email,
          permanentAddress: data.permanentAddress,
        },
        {
          fullName: 'họ tên',
          email: 'email',
          permanentAddress: 'địa chỉ thường trú',
        },
      );

      const context = await getCurrentTenantRow();
      if (!context) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Not authenticated');

        const fallbackUpdates: Record<string, unknown> = {};
        if (data.fullName !== undefined) fallbackUpdates.full_name = data.fullName;
        if (data.phone !== undefined) fallbackUpdates.phone = data.phone;

        if (Object.keys(fallbackUpdates).length === 0) return;

        await unwrap(
          supabase
            .from('profiles')
            .update(fallbackUpdates)
            .eq('id', user.id)
        );
        return;
      }

      const { tenantId } = context;

      const updates: Record<string, unknown> = {};
      if (data.fullName !== undefined) updates.full_name = data.fullName;
      if (data.phone !== undefined) updates.phone = data.phone;
      if (data.email !== undefined) updates.email = data.email;
      if (data.permanentAddress !== undefined) updates.permanent_address = data.permanentAddress;
      if (data.dateOfBirth !== undefined) updates.date_of_birth = data.dateOfBirth;
      if (data.gender !== undefined) updates.gender = mapGender.toDb(data.gender);

      if (Object.keys(updates).length > 0) {
        await unwrap(
          supabase
            .from('tenants')
            .update(updates)
            .eq('id', tenantId)
        );
      }
    } catch (error) {
      handleServiceError(error, 'Không thể cập nhật thông tin cá nhân');
    }
  },

  updateAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Not authenticated');

      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `avatars/${user.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(path, file, { upsert: true });

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage
        .from('public-assets')
        .getPublicUrl(path);

      const avatarUrl = urlData.publicUrl;

      await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      return { avatarUrl };
    } catch (error) {
      return handleServiceError(error, 'Không thể cập nhật ảnh đại diện');
    }
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: data.newPassword });
      if (error) throw new Error(error.message);
    } catch (error) {
      handleServiceError(error, 'Không thể đổi mật khẩu');
    }
  },

  submitFeedback: async (content: string): Promise<void> => {
    try {
      const context = await getCurrentTenantRow();
      if (!context) {
        throw new Error('Resident feedback is available after tenant provisioning.');
      }

      const { tenantId } = context;

      // tenant_feedback table does not exist — redirect to tickets table with category 'feedback'
      await unwrap(
        supabase
          .from('tickets')
          .insert({
            tenant_id: tenantId,
            subject: content.slice(0, 200),
            category: 'feedback',
            priority: 'normal',
            status: 'new',
          })
      );
    } catch (error) {
      handleServiceError(error, 'Không thể gửi góp ý');
    }
  },
};

export default portalProfileService;
