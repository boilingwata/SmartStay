import { supabase } from "@/lib/supabase";
import { unwrap } from "@/lib/supabaseHelpers";
import {
  getLegacyAmenityServiceIds,
  isLegacyUtilityServiceName,
  isSchemaCompatError,
  mapLegacyCalcTypeToBillingMethod,
  mapLegacyCalcTypeToUnit,
} from "./domainSchemaCompat";
import {
  CreateServiceDto,
  Service,
  ServiceFilter,
  ServicePriceHistory,
  UpdateServiceDto,
  UpdateServicePriceDto,
} from "@/types/service";

const db = supabase as any;

interface DbServiceCatalogRow {
  id: number;
  code: string;
  name: string;
  unit: string | null;
  billing_method: string | null;
  description: string | null;
  is_active: boolean | null;
  is_deleted: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface DbServicePriceRow {
  id: number;
  service_catalog_id: number;
  unit_price: number;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

interface DbLegacyServiceRow {
  id: number;
  name: string;
  calc_type: string | null;
  is_active: boolean | null;
  is_deleted: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface DbLegacyServicePriceRow {
  id: number;
  service_id: number;
  unit_price: number;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

function toBillingMethod(value: string | null | undefined): Service["billingMethod"] {
  if (value === "per_person") return "PerPerson";
  if (value === "per_room") return "PerRoom";
  if (value === "per_unit") return "PerUnit";
  return "Fixed";
}

function toDbBillingMethod(value: Service["billingMethod"]): string {
  if (value === "PerPerson") return "per_person";
  if (value === "PerRoom") return "per_room";
  if (value === "PerUnit") return "per_unit";
  if (value === "Usage") return "per_unit";
  if (value === "PerM2") return "per_room";
  return "fixed";
}

function toService(row: DbServiceCatalogRow, latestPrice?: DbServicePriceRow): Service {
  return {
    serviceId: row.id,
    serviceName: row.name,
    serviceCode: row.code,
    serviceType: "FixedService",
    unit: row.unit ?? "thang",
    billingMethod: toBillingMethod(row.billing_method),
    description: row.description ?? undefined,
    isActive: row.is_active ?? true,
    currentPrice: Number(latestPrice?.unit_price ?? 0),
    currentPriceEffectiveFrom: latestPrice?.effective_from ?? (row.created_at ?? ""),
  };
}

function toPriceHistory(row: DbServicePriceRow): ServicePriceHistory {
  return {
    priceHistoryId: row.id,
    serviceId: row.service_catalog_id,
    price: Number(row.unit_price ?? 0),
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    setByName: "",
    reason: "",
    isActive: row.is_active ?? row.effective_to == null,
  };
}

function toLegacyService(row: DbLegacyServiceRow, latestPrice?: DbLegacyServicePriceRow): Service {
  return {
    serviceId: row.id,
    serviceName: row.name,
    serviceCode: `SRV-${String(row.id).padStart(4, "0")}`,
    serviceType: "FixedService",
    unit: mapLegacyCalcTypeToUnit(row.calc_type),
    billingMethod: mapLegacyCalcTypeToBillingMethod(row.calc_type),
    description: undefined,
    isActive: row.is_active ?? true,
    currentPrice: Number(latestPrice?.unit_price ?? 0),
    currentPriceEffectiveFrom: latestPrice?.effective_from ?? (row.created_at ?? ""),
  };
}

function toLegacyPriceHistory(row: DbLegacyServicePriceRow): ServicePriceHistory {
  return {
    priceHistoryId: row.id,
    serviceId: row.service_id,
    price: Number(row.unit_price ?? 0),
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    setByName: "",
    reason: "",
    isActive: row.is_active ?? row.effective_to == null,
  };
}

async function fetchPriceMap(serviceIds: number[]): Promise<Map<number, DbServicePriceRow>> {
  if (serviceIds.length === 0) return new Map();

  const rows = (await unwrap(
    db
      .from("service_prices")
      .select("id, service_catalog_id, unit_price, effective_from, effective_to, is_active, created_at")
      .in("service_catalog_id", serviceIds)
      .order("effective_from", { ascending: false })
      .order("id", { ascending: false }),
  )) as unknown as DbServicePriceRow[];

  const map = new Map<number, DbServicePriceRow>();
  for (const row of rows) {
    if (!map.has(row.service_catalog_id)) {
      map.set(row.service_catalog_id, row);
    }
  }

  return map;
}

async function fetchLegacyPriceMap(serviceIds: number[]): Promise<Map<number, DbLegacyServicePriceRow>> {
  if (serviceIds.length === 0) return new Map();

  const rows = (await unwrap(
    db
      .from("service_prices")
      .select("id, service_id, unit_price, effective_from, effective_to, is_active, created_at")
      .in("service_id", serviceIds)
      .order("effective_from", { ascending: false })
      .order("id", { ascending: false }),
  )) as unknown as DbLegacyServicePriceRow[];

  const map = new Map<number, DbLegacyServicePriceRow>();
  for (const row of rows) {
    if (!map.has(row.service_id)) {
      map.set(row.service_id, row);
    }
  }

  return map;
}

async function getLegacyServices(filter: ServiceFilter): Promise<{ data: Service[]; total: number }> {
  let query = db
    .from("services")
    .select("id, name, calc_type, is_active, is_deleted, created_at, updated_at")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (filter.search) {
    query = query.ilike("name", `%${filter.search}%`);
  }
  if (filter.isActive !== undefined) {
    query = query.eq("is_active", filter.isActive);
  }

  const [rows, amenityServiceIds] = await Promise.all([
    unwrap(query) as Promise<DbLegacyServiceRow[]>,
    getLegacyAmenityServiceIds(),
  ]);

  const filteredRows = rows.filter(
    (row) => !isLegacyUtilityServiceName(row.name) && !amenityServiceIds.has(Number(row.id)),
  );
  const priceMap = await fetchLegacyPriceMap(filteredRows.map((row) => row.id));
  const data = filteredRows.map((row) => toLegacyService(row, priceMap.get(row.id)));

  return { data, total: data.length };
}

export const getServices = async (
  filter: ServiceFilter,
): Promise<{ data: Service[]; total: number }> => {
  try {
    let query = db
      .from("service_catalog")
      .select("id, code, name, unit, billing_method, description, is_active, is_deleted, created_at, updated_at")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (filter.search) {
      query = query.or(`name.ilike.%${filter.search}%,code.ilike.%${filter.search}%`);
    }
    if (filter.isActive !== undefined) {
      query = query.eq("is_active", filter.isActive);
    }

    const rows = (await unwrap(query)) as unknown as DbServiceCatalogRow[];
    const priceMap = await fetchPriceMap(rows.map((row) => row.id));
    const data = rows.map((row) => toService(row, priceMap.get(row.id)));

    return { data, total: data.length };
  } catch (error) {
    if (isSchemaCompatError(error as { code?: string; message?: string })) {
      return getLegacyServices(filter);
    }
    throw error;
  }
};

export const getServiceById = async (id: number): Promise<Service | undefined> => {
  try {
    const row = (await unwrap(
      db
        .from("service_catalog")
        .select("id, code, name, unit, billing_method, description, is_active, is_deleted, created_at, updated_at")
        .eq("id", id)
        .single(),
    )) as unknown as DbServiceCatalogRow;

    const prices = (await unwrap(
      db
        .from("service_prices")
        .select("id, service_catalog_id, unit_price, effective_from, effective_to, is_active, created_at")
        .eq("service_catalog_id", id)
        .order("effective_from", { ascending: false })
        .limit(1),
    )) as unknown as DbServicePriceRow[];

    return toService(row, prices[0]);
  } catch (error) {
    if (!isSchemaCompatError(error as { code?: string; message?: string })) throw error;

    const row = (await unwrap(
      db.from("services").select("id, name, calc_type, is_active, is_deleted, created_at, updated_at").eq("id", id).single(),
    )) as unknown as DbLegacyServiceRow;

    if (isLegacyUtilityServiceName(row.name)) return undefined;

    const prices = (await unwrap(
      db
        .from("service_prices")
        .select("id, service_id, unit_price, effective_from, effective_to, is_active, created_at")
        .eq("service_id", id)
        .order("effective_from", { ascending: false })
        .limit(1),
    )) as unknown as DbLegacyServicePriceRow[];

    return toLegacyService(row, prices[0]);
  }
};

export const getPriceHistory = async (serviceId: number): Promise<ServicePriceHistory[]> => {
  try {
    const rows = (await unwrap(
      db
        .from("service_prices")
        .select("id, service_catalog_id, unit_price, effective_from, effective_to, is_active, created_at")
        .eq("service_catalog_id", serviceId)
        .order("effective_from", { ascending: false }),
    )) as unknown as DbServicePriceRow[];

    return rows.map(toPriceHistory);
  } catch (error) {
    if (!isSchemaCompatError(error as { code?: string; message?: string })) throw error;

    const rows = (await unwrap(
      db
        .from("service_prices")
        .select("id, service_id, unit_price, effective_from, effective_to, is_active, created_at")
        .eq("service_id", serviceId)
        .order("effective_from", { ascending: false }),
    )) as unknown as DbLegacyServicePriceRow[];

    return rows.map(toLegacyPriceHistory);
  }
};

export const createService = async (dto: CreateServiceDto): Promise<Service> => {
  const row = (await unwrap(
    db
      .from("service_catalog")
      .insert({
        code: dto.serviceCode.trim(),
        name: dto.serviceName.trim(),
        unit: dto.unit.trim(),
        billing_method: toDbBillingMethod(dto.billingMethod),
        description: dto.description?.trim() || null,
        is_active: dto.isActive,
      })
      .select("id, code, name, unit, billing_method, description, is_active, is_deleted, created_at, updated_at")
      .single(),
  )) as unknown as DbServiceCatalogRow;

  const priceRow = (await unwrap(
    db
      .from("service_prices")
      .insert({
        service_catalog_id: row.id,
        unit_price: dto.initialPrice,
        effective_from: dto.priceEffectiveFrom,
        is_active: true,
      })
      .select("id, service_catalog_id, unit_price, effective_from, effective_to, is_active, created_at")
      .single(),
  )) as unknown as DbServicePriceRow;

  return toService(row, priceRow);
};

export const updateService = async (id: number, dto: UpdateServiceDto): Promise<Service> => {
  const row = (await unwrap(
    db
      .from("service_catalog")
      .update({
        name: dto.serviceName.trim(),
        unit: dto.unit.trim(),
        billing_method: toDbBillingMethod(dto.billingMethod),
        description: dto.description?.trim() || null,
        is_active: dto.isActive,
      })
      .eq("id", id)
      .select("id, code, name, unit, billing_method, description, is_active, is_deleted, created_at, updated_at")
      .single(),
  )) as unknown as DbServiceCatalogRow;

  return toService(row);
};

export const toggleServiceActive = async (id: number, isActive: boolean): Promise<void> => {
  await unwrap(db.from("service_catalog").update({ is_active: isActive }).eq("id", id));
};

export const updateServicePrice = async (
  serviceId: number,
  dto: UpdateServicePriceDto,
): Promise<void> => {
  await unwrap(
    db
      .from("service_prices")
      .update({ effective_to: dto.effectiveFrom, is_active: false })
      .eq("service_catalog_id", serviceId)
      .eq("is_active", true),
  );

  await unwrap(
    db.from("service_prices").insert({
      service_catalog_id: serviceId,
      unit_price: dto.newPrice,
      effective_from: dto.effectiveFrom,
      is_active: true,
    }),
  );
};

export const checkServiceNameUnique = async (name: string, excludeId?: number): Promise<boolean> => {
  try {
    let query = db.from("service_catalog").select("id").ilike("name", name);
    if (excludeId && Number.isFinite(excludeId)) query = query.neq("id", excludeId);
    const rows = (await unwrap(query)) as unknown as { id: number }[];
    return rows.length === 0;
  } catch (error) {
    if (!isSchemaCompatError(error as { code?: string; message?: string })) throw error;
    let query = db.from("services").select("id").ilike("name", name);
    if (excludeId && Number.isFinite(excludeId)) query = query.neq("id", excludeId);
    const rows = (await unwrap(query)) as unknown as { id: number }[];
    return rows.length === 0;
  }
};

export const checkServiceCodeUnique = async (code: string, excludeId?: number): Promise<boolean> => {
  try {
    let query = db.from("service_catalog").select("id").ilike("code", code);
    if (excludeId && Number.isFinite(excludeId)) query = query.neq("id", excludeId);
    const rows = (await unwrap(query)) as unknown as { id: number }[];
    return rows.length === 0;
  } catch (error) {
    if (!isSchemaCompatError(error as { code?: string; message?: string })) throw error;
    return true;
  }
};

export const generateServiceCode = (): string =>
  `SVC-${Date.now().toString(36).toUpperCase().slice(-4)}`;
