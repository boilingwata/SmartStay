import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import type { DbServiceCalcType } from '@/types/supabase';
import {
  Service,
  ServiceFilter,
  ServicePriceHistory,
  CreateServiceDto,
  UpdateServiceDto,
  UpdateServicePriceDto,
} from '@/types/service';

// ---------------------------------------------------------------------------
// DB row shapes — matches smartstay.services and smartstay.service_prices exactly
// ---------------------------------------------------------------------------

interface DbServiceRow {
  id: number;
  name: string;
  calc_type: DbServiceCalcType;
  is_active: boolean | null;
  is_deleted: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface DbServicePriceRow {
  id: number;
  service_id: number;
  unit_price: number;        // was wrongly named "price" before
  effective_from: string;
  effective_to: string | null;
  is_active: boolean | null; // actual DB column; use this instead of deriving
  created_at: string | null;
}

// ---------------------------------------------------------------------------
// calc_type ↔ billingMethod mapping (calc_type is the only discriminator in DB)
// ---------------------------------------------------------------------------

const CALC_TYPE_TO_BILLING: Record<DbServiceCalcType, Service['billingMethod']> = {
  per_person: 'PerPerson',
  per_unit:   'Metered',
  flat_rate:  'Fixed',
  per_room:   'Fixed',
};

const BILLING_TO_CALC_TYPE: Record<string, DbServiceCalcType> = {
  PerPerson: 'per_person',
  Metered:   'per_unit',
  Fixed:     'flat_rate',
  Usage:     'per_unit',
  PerM2:     'per_unit',
};

// Derive a reasonable serviceType from calc_type (DB has no service_type col)
// C-04: per_room maps to 'Amenity' so AmenityList filter (`s.serviceType === 'Amenity'`) works
const CALC_TYPE_TO_SERVICE_TYPE: Record<DbServiceCalcType, Service['serviceType']> = {
  per_person: 'Management',
  per_unit:   'Utility',
  flat_rate:  'Management',
  per_room:   'Amenity',
};

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function toService(row: DbServiceRow, latestPrice?: DbServicePriceRow): Service {
  const billingMethod = CALC_TYPE_TO_BILLING[row.calc_type] ?? 'Fixed';
  return {
    serviceId:                 row.id,
    serviceName:               row.name,
    serviceCode:               `SVC-${String(row.id).padStart(4, '0')}`,  // generated client-side
    serviceType:               CALC_TYPE_TO_SERVICE_TYPE[row.calc_type] ?? 'Management',
    unit:                      row.calc_type === 'per_unit' ? 'kWh' : '月',
    billingMethod,
    description:               undefined,  // no description column in DB
    isActive:                  row.is_active ?? true,
    currentPrice:              latestPrice?.unit_price ?? 0,
    currentPriceEffectiveFrom: latestPrice?.effective_from ?? (row.created_at ?? ''),
  };
}

function toPriceHistory(row: DbServicePriceRow): ServicePriceHistory {
  return {
    priceHistoryId: row.id,
    serviceId:      row.service_id,
    price:          row.unit_price,        // mapped from DB's unit_price
    effectiveFrom:  row.effective_from,
    effectiveTo:    row.effective_to,
    setByName:      '',                    // no set_by column in DB
    reason:         '',                    // no reason column in DB
    isActive:       row.is_active ?? (row.effective_to === null),
  };
}

// ---------------------------------------------------------------------------
// Service functions (all pure — no Zustand coupling)
// ---------------------------------------------------------------------------

export const getServices = async (
  filter: ServiceFilter
): Promise<{ data: Service[]; total: number }> => {
  let query = supabase
    .from('services')
    .select('*')
    .eq('is_deleted', false)          // always exclude soft-deleted
    .order('created_at', { ascending: false });

  if (filter.search) {
    query = query.ilike('name', `%${filter.search}%`);
  }
  if (filter.isActive !== undefined) {
    query = query.eq('is_active', filter.isActive);
  }
  // SV-02: service_type column does not exist in the DB — serviceType filter is derived from
  // calc_type and applied in-memory after the DB fetch.
  // Warn developers so they can detect where the filter is being ignored.
  if (filter.serviceType) {
    console.info(
      `[serviceService] serviceType filter '${filter.serviceType}' applied in-memory ` +
      `(DB has no service_type column — derived from calc_type via CALC_TYPE_TO_SERVICE_TYPE).`
    );
  }

  const rows = await unwrap(query) as unknown as DbServiceRow[];

  // Fetch latest active price for each service
  const serviceIds = rows.map(r => r.id);
  let priceRows: DbServicePriceRow[] = [];
  if (serviceIds.length > 0) {
    priceRows = await unwrap(
      supabase
        .from('service_prices')
        .select('*')
        .in('service_id', serviceIds)
        .eq('is_active', true)         // use the DB flag, not effective_to heuristic
    ) as unknown as DbServicePriceRow[];
  }

  const priceMap = new Map<number, DbServicePriceRow>();
  for (const p of priceRows) {
    // Keep only the newest active price per service
    if (!priceMap.has(p.service_id)) {
      priceMap.set(p.service_id, p);
    }
  }

  const data = rows.map(r => toService(r, priceMap.get(r.id)));

  // SV-02: Apply serviceType filter in-memory (no service_type column in DB).
  // The derived serviceType comes from CALC_TYPE_TO_SERVICE_TYPE in toService().
  const filtered = filter.serviceType
    ? data.filter(s => s.serviceType === filter.serviceType)
    : data;

  return { data: filtered, total: filtered.length };
};

export const getServiceById = async (id: number): Promise<Service | undefined> => {
  if (!Number.isFinite(id)) throw new Error(`Invalid service id: ${id}`);

  const row = await unwrap(
    supabase.from('services').select('*').eq('id', id).single()
  ) as unknown as DbServiceRow;

  const prices = await unwrap(
    supabase
      .from('service_prices')
      .select('*')
      .eq('service_id', id)
      .eq('is_active', true)
      .limit(1)
  ) as unknown as DbServicePriceRow[];

  return toService(row, prices[0]);
};

export const getPriceHistory = async (serviceId: number): Promise<ServicePriceHistory[]> => {
  if (!Number.isFinite(serviceId)) throw new Error(`Invalid serviceId: ${serviceId}`);

  const rows = await unwrap(
    supabase
      .from('service_prices')
      .select('*')
      .eq('service_id', serviceId)
      .order('effective_from', { ascending: false })
  ) as unknown as DbServicePriceRow[];

  return rows.map(toPriceHistory);
};

export const createService = async (dto: CreateServiceDto): Promise<Service> => {
  const calcType: DbServiceCalcType =
    BILLING_TO_CALC_TYPE[dto.billingMethod] ?? 'flat_rate';

  const row = await unwrap(
    supabase
      .from('services')
      .insert({
        name:      dto.serviceName,
        calc_type: calcType,
        is_active: dto.isActive,
      })
      .select()
      .single()
  ) as unknown as DbServiceRow;

  // Create initial price
  const priceRow = await unwrap(
    supabase
      .from('service_prices')
      .insert({
        service_id:     row.id,
        unit_price:     dto.initialPrice,
        effective_from: dto.priceEffectiveFrom,
        is_active:      true,
      })
      .select()
      .single()
  ) as unknown as DbServicePriceRow;

  return toService(row, priceRow);
};

export const updateService = async (id: number, dto: UpdateServiceDto): Promise<Service> => {
  if (!Number.isFinite(id)) throw new Error(`Invalid service id: ${id}`);

  const calcType: DbServiceCalcType =
    dto.billingMethod ? (BILLING_TO_CALC_TYPE[dto.billingMethod] ?? 'flat_rate') : 'flat_rate';

  const row = await unwrap(
    supabase
      .from('services')
      .update({
        name:      dto.serviceName,
        calc_type: calcType,
        is_active: dto.isActive,
      })
      .eq('id', id)
      .select()
      .single()
  ) as unknown as DbServiceRow;

  return toService(row);
};

export const toggleServiceActive = async (id: number, isActive: boolean): Promise<void> => {
  if (!Number.isFinite(id)) throw new Error(`Invalid service id: ${id}`);
  await unwrap(
    supabase.from('services').update({ is_active: isActive }).eq('id', id)
  );
};

export const updateServicePrice = async (serviceId: number, dto: UpdateServicePriceDto): Promise<void> => {
  if (!Number.isFinite(serviceId)) throw new Error(`Invalid serviceId: ${serviceId}`);

  // Mark current active price as inactive + set effective_to
  await unwrap(
    supabase
      .from('service_prices')
      .update({ effective_to: dto.effectiveFrom, is_active: false })
      .eq('service_id', serviceId)
      .eq('is_active', true)
  );

  // Insert new price record
  await unwrap(
    supabase.from('service_prices').insert({
      service_id:     serviceId,
      unit_price:     dto.newPrice,
      effective_from: dto.effectiveFrom,
      is_active:      true,
    })
  );
};

/**
 * Check name uniqueness (service_code column does not exist in DB).
 * Callers that previously used checkServiceCodeUnique should migrate to this.
 */
export const checkServiceNameUnique = async (name: string, excludeId?: number): Promise<boolean> => {
  let query = supabase.from('services').select('id').ilike('name', name);
  if (excludeId && Number.isFinite(excludeId)) query = query.neq('id', excludeId);
  const rows = await unwrap(query) as unknown as { id: number }[];
  return rows.length === 0;
};

/**
 * @deprecated service_code column does not exist in the DB.
 * Use checkServiceNameUnique instead. Kept as alias for backwards compat.
 */
export const checkServiceCodeUnique = checkServiceNameUnique;

/** Generate a human-readable label — purely client-side, never stored in DB. */
export const generateServiceCode = (): string =>
  `SVC-${Date.now().toString(36).toUpperCase().slice(-4)}`;
