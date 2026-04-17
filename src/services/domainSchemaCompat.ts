import { supabase } from "@/lib/supabase";
import { unwrap } from "@/lib/supabaseHelpers";

const db = supabase as any;

export function isSchemaCompatError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  const message = String(error.message ?? "").toLowerCase();

  return (
    error.code === "PGRST205" ||
    error.code === "PGRST204" ||
    error.code === "42P01" ||
    error.code === "42703" ||
    message.includes("schema cache") ||
    message.includes("could not find the table") ||
    message.includes("could not find the '") ||
    message.includes("does not exist") ||
    message.includes("column") && message.includes("schema cache")
  );
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function isLegacyUtilityServiceName(name: string) {
  const normalized = normalizeText(name);
  return (
    normalized === "electricity" ||
    normalized === "water" ||
    normalized === "electric" ||
    normalized === "dien" ||
    normalized === "nuoc"
  );
}

export function mapLegacyCalcTypeToBillingMethod(calcType: string | null | undefined) {
  if (calcType === "per_person") return "PerPerson" as const;
  if (calcType === "per_room") return "PerRoom" as const;
  if (calcType === "per_unit") return "PerUnit" as const;
  return "Fixed" as const;
}

export function mapLegacyCalcTypeToUnit(calcType: string | null | undefined) {
  if (calcType === "per_person") return "nguoi/thang";
  if (calcType === "per_room") return "phong/thang";
  if (calcType === "per_unit") return "so_luong";
  return "thang";
}

export async function getLegacyAmenityServiceIds(): Promise<Set<number>> {
  const results = await Promise.allSettled([
    unwrap(db.from("amenity_policies").select("service_id").not("service_id", "is", null)),
    unwrap(db.from("amenity_booking_exceptions").select("service_id").not("service_id", "is", null)),
    unwrap(db.from("amenity_bookings").select("service_id").not("service_id", "is", null)),
  ]);

  const ids = new Set<number>();
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const row of (result.value ?? []) as Array<{ service_id?: number | null }>) {
      const serviceId = Number(row.service_id);
      if (Number.isFinite(serviceId)) ids.add(serviceId);
    }
  }

  return ids;
}
