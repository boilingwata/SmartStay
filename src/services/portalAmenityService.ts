import { supabase } from "@/lib/supabase";
import { unwrap } from "@/lib/supabaseHelpers";
import { isSchemaCompatError } from "./domainSchemaCompat";

const db = supabase as any;

export interface PortalAmenityItem {
  amenityId: number;
  amenityName: string;
  amenityCode: string;
  isActive: boolean;
  bookingPrice: number;
}

interface DbAmenityBookingRow {
  id: number;
  tenant_id: number;
  amenity_id: number;
  booking_date: string;
  time_slot: string;
  status: "booked" | "in_use" | "completed" | "cancelled";
  created_at: string | null;
  amenity_catalog: { name: string } | null;
}

interface DbLegacyAmenityBookingRow {
  id: number;
  tenant_id: number;
  service_id: number;
  booking_date: string;
  time_slot: string;
  status: "booked" | "in_use" | "completed" | "cancelled";
  created_at: string | null;
  services: { name: string } | null;
}

async function getCurrentTenantId(): Promise<number | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  const tenants = (await unwrap(
    db.from("tenants").select("id").eq("profile_id", user.id).eq("is_deleted", false).limit(1),
  )) as unknown as { id: number }[];

  return tenants?.[0]?.id ?? null;
}

export const portalAmenityService = {
  getAmenities: async (): Promise<PortalAmenityItem[]> => {
    try {
      const rows = (await unwrap(
        db
          .from("amenity_catalog")
          .select(`
            id,
            code,
            name,
            is_active,
            amenity_policies (
              price_override_amount,
              charge_mode,
              status
            )
          `)
          .eq("is_deleted", false)
          .eq("is_active", true)
          .order("name"),
      )) as unknown as Array<Record<string, unknown>>;

      return rows.map((row) => {
        const policies = Array.isArray(row.amenity_policies)
          ? (row.amenity_policies as Array<Record<string, unknown>>)
          : [];
        const activePolicy =
          policies.find((policy) => policy.status === "approved") ??
          policies.find((policy) => policy.status === "draft") ??
          null;
        const bookingPrice =
          activePolicy?.charge_mode === "free" ? 0 : Number(activePolicy?.price_override_amount ?? 0);

        return {
          amenityId: Number(row.id),
          amenityCode: String(row.code ?? ""),
          amenityName: String(row.name ?? ""),
          isActive: Boolean(row.is_active ?? true),
          bookingPrice,
        };
      });
    } catch (error) {
      if (!isSchemaCompatError(error as { code?: string; message?: string })) throw error;

      const [policies, services] = await Promise.all([
        unwrap(
          db
            .from("amenity_policies")
            .select("service_id, price_override_amount, charge_mode, status")
            .is("deleted_at", null)
            .in("status", ["draft", "approved"]),
        ) as Promise<Array<Record<string, unknown>>>,
        unwrap(
          db
            .from("services")
            .select("id, name, is_active, is_deleted")
            .eq("is_deleted", false)
            .eq("is_active", true)
            .order("name"),
        ) as Promise<Array<Record<string, unknown>>>,
      ]);

      const serviceMap = new Map(
        services.map((item) => [Number(item.id), { name: String(item.name ?? ""), isActive: Boolean(item.is_active ?? true) }]),
      );

      return policies.map((row) => {
        const serviceId = Number(row.service_id);
        const service = serviceMap.get(serviceId);
        return {
          amenityId: serviceId,
          amenityCode: `AMN-${String(serviceId).padStart(4, "0")}`,
          amenityName: service?.name ?? `Tiện ích #${serviceId}`,
          isActive: service?.isActive ?? true,
          bookingPrice: row.charge_mode === "free" ? 0 : Number(row.price_override_amount ?? 0),
        };
      });
    }
  },

  getMyBookings: async (): Promise<any[]> => {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return [];

    try {
      const rows = (await unwrap(
        db
          .from("amenity_bookings")
          .select("id, tenant_id, amenity_id, booking_date, time_slot, status, created_at, amenity_catalog(name)")
          .eq("tenant_id", tenantId)
          .order("booking_date", { ascending: false }),
      )) as unknown as DbAmenityBookingRow[];

      return rows.map((row) => ({
        id: String(row.id),
        amenityId: String(row.amenity_id),
        amenityName: row.amenity_catalog?.name ?? "Unknown",
        date: row.booking_date,
        timeSlot: row.time_slot,
        status: row.status,
        createdAt: row.created_at,
      }));
    } catch (error) {
      if (!isSchemaCompatError(error as { code?: string; message?: string })) throw error;

      const rows = (await unwrap(
        db
          .from("amenity_bookings")
          .select("id, tenant_id, service_id, booking_date, time_slot, status, created_at, services(name)")
          .eq("tenant_id", tenantId)
          .order("booking_date", { ascending: false }),
      )) as unknown as DbLegacyAmenityBookingRow[];

      return rows.map((row) => ({
        id: String(row.id),
        amenityId: String(row.service_id),
        amenityName: row.services?.name ?? "Unknown",
        date: row.booking_date,
        timeSlot: row.time_slot,
        status: row.status,
        createdAt: row.created_at,
      }));
    }
  },

  createBooking: async (body: { amenityId: number; date: string; timeSlot: string }): Promise<void> => {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) throw new Error("Unauthenticated");

    try {
      await unwrap(
        db.from("amenity_bookings").insert({
          tenant_id: tenantId,
          amenity_id: body.amenityId,
          booking_date: body.date,
          time_slot: body.timeSlot,
          status: "booked",
        }),
      );
    } catch (error) {
      if (!isSchemaCompatError(error as { code?: string; message?: string })) throw error;
      await unwrap(
        db.from("amenity_bookings").insert({
          tenant_id: tenantId,
          service_id: body.amenityId,
          booking_date: body.date,
          time_slot: body.timeSlot,
          status: "booked",
        }),
      );
    }
  },

  cancelBooking: async (bookingId: string): Promise<void> => {
    await unwrap(
      db.from("amenity_bookings").update({ status: "cancelled" }).eq("id", Number(bookingId)),
    );
  },
};

export default portalAmenityService;
