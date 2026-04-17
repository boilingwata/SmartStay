import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import type { DbRentalApplicationStatus } from '@/types/supabase';

interface PublicListingRow {
  room_id: number
  room_uuid: string
  room_code: string
  room_type: string | null
  area_sqm: number | string | null
  base_rent: number | string | null
  max_occupants: number | null
  floor_number: number | null
  has_balcony: boolean | null
  has_private_bathroom: boolean | null
  facing: string | null
  condition_score: number | null
  room_amenities: unknown
  building_id: number
  building_uuid: string
  building_name: string
  building_address: string
  building_description: string | null
  building_amenities: unknown
  availability_status: string
}

interface ExistingApplicationRow {
  id: number
  status: DbRentalApplicationStatus
  verification_method: string | null
  verification_payload: Record<string, unknown> | null
  notes: string | null
  submitted_at: string | null
}

export interface PublicListing {
  roomId: string
  roomCode: string
  roomType: string
  areaSqm: number
  baseRent: number
  maxOccupants: number
  floorNumber: number | null
  hasBalcony: boolean
  hasPrivateBathroom: boolean
  facing?: string
  conditionScore?: number | null
  availabilityLabel: string
  buildingId: string
  buildingName: string
  buildingAddress: string
  buildingDescription?: string
  amenities: string[]
}

export interface RoomInquiryData {
  name: string;
  phone: string;
  message: string;
}

export interface RentalApplicationFormData {
  fullName: string
  phone: string
  email: string
  preferredMoveIn: string
  verificationMethod: 'id' | 'phone' | 'email'
  verificationValue: string
  notes?: string
}

export interface RentalApplicationSummary {
  id: string
  status: DbRentalApplicationStatus
  verificationMethod?: string | null
  preferredMoveIn?: string
  verificationValue?: string
  notes?: string | null
  submittedAt?: string | null
}

function normalizeAmenities(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function toPublicListing(row: PublicListingRow): PublicListing {
  const amenitySet = new Set([
    ...normalizeAmenities(row.room_amenities),
    ...normalizeAmenities(row.building_amenities),
  ]);

  return {
    roomId: String(row.room_id),
    roomCode: row.room_code,
    roomType: row.room_type ?? 'Studio',
    areaSqm: Number(row.area_sqm ?? 0),
    baseRent: Number(row.base_rent ?? 0),
    maxOccupants: row.max_occupants ?? 1,
    floorNumber: row.floor_number,
    hasBalcony: row.has_balcony ?? false,
    hasPrivateBathroom: row.has_private_bathroom ?? false,
    facing: row.facing ?? undefined,
    conditionScore: row.condition_score,
    availabilityLabel: row.availability_status === 'available_now' ? 'Có thể vào ở ngay' : 'Đang nhận đặt chỗ',
    buildingId: String(row.building_id),
    buildingName: row.building_name,
    buildingAddress: row.building_address,
    buildingDescription: row.building_description ?? undefined,
    amenities: Array.from(amenitySet),
  };
}

async function getCurrentProfile() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const profile = await unwrap(
    supabase
      .from('profiles')
      .select('id, role, tenant_stage, full_name, phone')
      .eq('id', user.id)
      .single()
  ) as unknown as {
    id: string
    role: string
    tenant_stage: string
    full_name: string
    phone: string | null
  };

  return {
    id: profile.id,
    role: profile.role,
    tenantStage: profile.tenant_stage,
    fullName: profile.full_name,
    phone: profile.phone,
    email: user.email ?? '',
  };
}

export const publicListingsService = {
  getListings: async (): Promise<PublicListing[]> => {
    try {
      // PL-01 FIX: public_room_listings view type added to supabase.ts — no longer need (supabase as any).
      // If the view doesn't exist in the DB, this will return an error caught gracefully below.
      const rows = await unwrap(
        supabase
          .from('public_room_listings')
          .select('*')
          .order('base_rent', { ascending: true })
      ) as unknown as PublicListingRow[];

      return (rows ?? []).map(toPublicListing);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[publicListingsService] getListings failed — view may not exist:', msg);
      return [];
    }
  },

  getListingDetail: async (roomId: string): Promise<PublicListing | null> => {
    try {
      // PL-01 FIX: Using typed client after adding view type to supabase.ts
      const rows = await unwrap(
        supabase
          .from('public_room_listings')
          .select('*')
          .eq('room_id', Number(roomId))
          .limit(1)
      ) as unknown as PublicListingRow[];

      if (!rows || rows.length === 0) return null;
      return toPublicListing(rows[0]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[publicListingsService] getListingDetail failed — view may not exist:', msg);
      return null;
    }
  },

  getExistingApplication: async (roomId: string): Promise<RentalApplicationSummary | null> => {
    const profile = await getCurrentProfile();
    if (!profile) return null;

    const rows = await unwrap(
      supabase
        .from('rental_applications')
        .select('id, status, verification_method, verification_payload, notes, submitted_at')
        .eq('profile_id', profile.id)
        .eq('room_id', Number(roomId))
        .order('created_at', { ascending: false })
        .limit(1)
    ) as unknown as ExistingApplicationRow[];

    const application = rows?.[0];
    if (!application) return null;

    return {
      id: String(application.id),
      status: application.status,
      verificationMethod: application.verification_method,
      preferredMoveIn: typeof application.verification_payload?.preferredMoveIn === 'string'
        ? application.verification_payload.preferredMoveIn
        : undefined,
      verificationValue: typeof application.verification_payload?.verificationValue === 'string'
        ? application.verification_payload.verificationValue
        : undefined,
      notes: application.notes,
      submittedAt: application.submitted_at,
    };
  },

  submitInquiry: async (_roomId: string, _data: RoomInquiryData): Promise<void> => {
    /**
     * FEATURE STUB (PL-02): The `room_inquiries` table does NOT exist in the `smartstay` schema.
     *
     * TO ENABLE THIS FEATURE:
     *   1. CREATE TABLE smartstay.room_inquiries (
     *        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     *        room_id BIGINT NOT NULL REFERENCES smartstay.rooms(id),
     *        inquirer_name TEXT NOT NULL,
     *        inquirer_phone TEXT NOT NULL,
     *        message TEXT,
     *        created_at TIMESTAMPTZ DEFAULT NOW()
     *      );
     *   2. Re-generate src/types/supabase.ts
     *   3. Replace this stub with a real insert
     */
    throw new Error('Tính năng gửi câu hỏi chưa được kích hoạt. Vui lòng liên hệ quản lý qua số điện thoại hoặc email.');
  },

  submitApplication: async (roomId: string, form: RentalApplicationFormData): Promise<RentalApplicationSummary> => {
    const profile = await getCurrentProfile();
    if (!profile) {
      throw new Error('Vui lòng đăng nhập trước khi gửi đơn đăng ký.');
    }

    if (profile.role !== 'tenant') {
      throw new Error('Chỉ tài khoản người thuê mới có thể gửi đơn thuê.');
    }

    if (profile.tenantStage === 'resident_active' || profile.tenantStage === 'resident_pending_onboarding') {
      throw new Error('Tài khoản này hiện không dùng luồng đăng ký thuê mới. Vui lòng liên hệ SmartStay để được hỗ trợ.');
    }

    const payload = {
      fullName: form.fullName,
      phone: form.phone,
      email: form.email,
      preferredMoveIn: form.preferredMoveIn,
      verificationValue: form.verificationValue,
    };

    const submittedAt = new Date().toISOString();

    const openApplications = await unwrap(
      supabase
        .from('rental_applications')
        .select('id, status')
        .eq('profile_id', profile.id)
        .eq('room_id', Number(roomId))
        .in('status', ['draft', 'submitted', 'under_review'] as DbRentalApplicationStatus[])
        .limit(1)
    ) as unknown as { id: number; status: DbRentalApplicationStatus }[];

    let applicationId: number;

    if (openApplications?.[0]) {
      applicationId = openApplications[0].id;
      await unwrap(
        supabase
          .from('rental_applications')
          .update({
            status: 'submitted',
            verification_method: form.verificationMethod,
            verification_payload: payload,
            notes: form.notes?.trim() || null,
            submitted_at: submittedAt,
          })
          .eq('id', applicationId)
      );
    } else {
      const inserted = await unwrap(
        supabase
          .from('rental_applications')
          .insert({
            profile_id: profile.id,
            room_id: Number(roomId),
            status: 'submitted',
            verification_method: form.verificationMethod,
            verification_payload: payload,
            notes: form.notes?.trim() || null,
            submitted_at: submittedAt,
          })
          .select('id')
          .single()
      ) as unknown as { id: number };

      applicationId = inserted.id;
    }

    if (profile.tenantStage !== 'applicant') {
      await unwrap(
        supabase
          .from('profiles')
          .update({ tenant_stage: 'applicant' })
          .eq('id', profile.id)
      );
    }

    return {
      id: String(applicationId),
      status: 'submitted',
      verificationMethod: form.verificationMethod,
      preferredMoveIn: form.preferredMoveIn,
      verificationValue: form.verificationValue,
      notes: form.notes?.trim() || null,
      submittedAt,
    };
  },
};

export default publicListingsService;
