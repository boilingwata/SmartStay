import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { Service } from '@/types/service';
import { getServices } from './serviceService';

// ---------------------------------------------------------------------------
// Internal DB row shapes
// ---------------------------------------------------------------------------

interface DbAmenityBookingRow {
  id: number;
  tenant_id: number;
  service_id: number;
  booking_date: string;
  time_slot: string;
  status: 'booked' | 'in_use' | 'completed' | 'cancelled';
  created_at: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getCurrentTenantId(): Promise<number | null> {
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

  return tenants?.[0]?.id ?? null;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const portalAmenityService = {
  /** Get all available amenities (Service.serviceType === 'Amenity') */
  getAmenities: async (): Promise<Service[]> => {
    const { data } = await getServices({ search: '', page: 1, limit: 100, serviceType: 'Amenity' });
    return data;
  },

  /** Get current tenant's bookings */
  getMyBookings: async (): Promise<any[]> => {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return [];

    try {
      const rows = await unwrap(
        (supabase as any)
          .from('amenity_bookings')
          .select('*, services(name, calc_type)')
          .eq('tenant_id', tenantId)
          .order('booking_date', { ascending: false })
      ) as unknown as (DbAmenityBookingRow & { services: { name: string } })[];

      return (rows ?? []).map(r => ({
        id: String(r.id),
        amenityId: String(r.service_id),
        amenityName: r.services?.name ?? 'Unknown',
        date: r.booking_date,
        timeSlot: r.time_slot,
        status: r.status,
        createdAt: r.created_at,
      }));
    } catch (e) {
      console.warn('[portalAmenityService] amenity_bookings table not found. Returning empty list.', e);
      return [];
    }
  },

  /** Create a new booking */
  createBooking: async (body: {
    amenityId: number;
    date: string;
    timeSlot: string;
  }): Promise<void> => {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) throw new Error('Unauthenticated');

    await unwrap(
      (supabase as any)
        .from('amenity_bookings')
        .insert({
          tenant_id: tenantId,
          service_id: body.amenityId,
          booking_date: body.date,
          time_slot: body.timeSlot,
          status: 'booked',
        })
    );
  },

  /** Cancel a booking */
  cancelBooking: async (bookingId: string): Promise<void> => {
    await unwrap(
      (supabase as any)
        .from('amenity_bookings')
        .update({ status: 'cancelled' })
        .eq('id', Number(bookingId))
    );
  },
};

export default portalAmenityService;
