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
    availabilityLabel: row.availability_status === 'available_now' ? 'Available now' : 'Open for booking',
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
    const rows = await unwrap(
      (supabase as any)
        .from('public_room_listings')
        .select('*')
        .order('base_rent', { ascending: true })
    ) as unknown as PublicListingRow[];

    return (rows ?? []).map(toPublicListing);
  },

  getListingDetail: async (roomId: string): Promise<PublicListing | null> => {
    const rows = await unwrap(
      (supabase as any)
        .from('public_room_listings')
        .select('*')
        .eq('room_id', Number(roomId))
        .limit(1)
    ) as unknown as PublicListingRow[];

    if (!rows || rows.length === 0) return null;
    return toPublicListing(rows[0]);
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

  submitInquiry: async (roomId: string, data: RoomInquiryData): Promise<void> => {
    const { error } = await (supabase as any)
      .from('room_inquiries')
      .insert({
        room_id: Number(roomId),
        inquirer_name: data.name.trim(),
        inquirer_phone: data.phone.trim(),
        message: data.message.trim(),
      });
    if (error) throw new Error('Không thể gửi câu hỏi. Vui lòng thử lại sau.');
  },

  submitApplication: async (roomId: string, form: RentalApplicationFormData): Promise<RentalApplicationSummary> => {
    const profile = await getCurrentProfile();
    if (!profile) {
      throw new Error('Please sign in before submitting an application.');
    }

    if (profile.role !== 'tenant') {
      throw new Error('Only tenant accounts can submit rental applications.');
    }

    if (profile.tenantStage === 'resident_active' || profile.tenantStage === 'resident_pending_onboarding') {
      throw new Error('Resident accounts should use the resident portal instead of the application flow.');
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
