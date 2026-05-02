import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import type { DbRentalApplicationStatus } from '@/types/supabase';

interface RentalApplicationRow {
  id: number;
  profile_id: string;
  room_id: number;
  status: DbRentalApplicationStatus;
  submitted_at: string | null;
  created_at: string;
  notes: string | null;
  verification_method: string | null;
  verification_payload: Record<string, unknown> | null;
}

interface ProfileRow {
  id: string;
  full_name: string;
  phone: string | null;
  tenant_stage: string;
}

interface PublicListingRow {
  room_id: number;
  room_code: string;
  building_name: string;
  building_address: string;
  base_rent: number | null;
}

interface RoomLeadRow {
  id: number;
  room_code: string;
  base_rent: number | null;
  buildings?: {
    name: string | null;
    address: string | null;
  } | null;
}

export interface RentalLeadSummary {
  id: string;
  profileId: string;
  roomId: string;
  applicantName: string;
  applicantPhone?: string;
  tenantStage: string;
  roomCode: string;
  buildingName: string;
  buildingAddress: string;
  rentAmount: number;
  status: DbRentalApplicationStatus;
  submittedAt?: string | null;
  notes?: string | null;
  verificationMethod?: string | null;
  preferredMoveIn?: string;
  isPublicListingAvailable: boolean;
}

function readPreferredMoveIn(payload: Record<string, unknown> | null): string | undefined {
  if (!payload) return undefined;
  return typeof payload.preferredMoveIn === 'string' ? payload.preferredMoveIn : undefined;
}

export const ownerLeadService = {
  getLeadSummaries: async (): Promise<RentalLeadSummary[]> => {
    const applications = await unwrap(
      supabase
        .from('rental_applications')
        .select('id, profile_id, room_id, status, submitted_at, created_at, notes, verification_method, verification_payload')
        .order('submitted_at', { ascending: false })
        .order('created_at', { ascending: false })
    ) as unknown as RentalApplicationRow[];

    if (!applications?.length) return [];

    const profileIds = Array.from(new Set(applications.map((application) => application.profile_id)));
    const roomIds = Array.from(new Set(applications.map((application) => application.room_id)));

    const [profiles, listings, rooms] = await Promise.all([
      unwrap(
        supabase
          .from('profiles')
          .select('id, full_name, phone, tenant_stage')
          .in('id', profileIds)
      ) as unknown as Promise<ProfileRow[]>,
      unwrap(
        supabase
          .from('public_room_listings')
          .select('room_id, room_code, building_name, building_address, base_rent')
          .in('room_id', roomIds)
      ) as unknown as Promise<PublicListingRow[]>,
      unwrap(
        supabase
          .from('rooms')
          .select('id, room_code, base_rent, buildings(name, address)')
          .in('id', roomIds)
      ) as unknown as Promise<RoomLeadRow[]>,
    ]);

    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
    const listingMap = new Map(listings.map((listing) => [listing.room_id, listing]));
    const roomMap = new Map(rooms.map((room) => [room.id, room]));

    return applications.map((application) => {
      const profile = profileMap.get(application.profile_id);
      const listing = listingMap.get(application.room_id);
      const room = roomMap.get(application.room_id);

      return {
        id: String(application.id),
        profileId: application.profile_id,
        roomId: String(application.room_id),
        applicantName: profile?.full_name ?? 'Khách thuê',
        applicantPhone: profile?.phone ?? undefined,
        tenantStage: profile?.tenant_stage ?? 'prospect',
        roomCode: listing?.room_code ?? room?.room_code ?? `Phòng #${application.room_id}`,
        buildingName: listing?.building_name ?? room?.buildings?.name ?? 'Tòa nhà chưa xác định',
        buildingAddress: listing?.building_address ?? room?.buildings?.address ?? '',
        rentAmount: Number(listing?.base_rent ?? room?.base_rent ?? 0),
        status: application.status,
        submittedAt: application.submitted_at,
        notes: application.notes,
        verificationMethod: application.verification_method,
        preferredMoveIn: readPreferredMoveIn(application.verification_payload),
        isPublicListingAvailable: Boolean(listing),
      };
    });
  },
};

export default ownerLeadService;
