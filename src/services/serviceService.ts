import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import {
  Service,
  ServiceFilter,
  ServicePriceHistory,
  CreateServiceDto,
  UpdateServiceDto,
  UpdateServicePriceDto,
} from '@/types/service';

// ---------------------------------------------------------------------------
// DB row shapes
// ---------------------------------------------------------------------------

interface DbServiceRow {
  id: number;
  service_code: string;
  name: string;
  service_type: string;
  unit: string;
  billing_method: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface DbServicePriceRow {
  id: number;
  service_id: number;
  price: number;
  effective_from: string;
  effective_to: string | null;
  set_by: string | null;
  reason: string | null;
  created_at: string;
}

// Insert/update shapes for tables whose generated types are stale.
// The actual DB columns exist but supabase.ts hasn't been regenerated.
interface ServiceInsert {
  service_code: string;
  name: string;
  service_type: string;
  unit: string;
  billing_method: string;
  description: string | null;
  is_active: boolean;
}

interface ServiceUpdate {
  name?: string;
  service_type?: string;
  unit?: string;
  billing_method?: string;
  description?: string | null;
  is_active?: boolean;
}

interface ServicePriceInsert {
  service_id: number;
  price: number;
  effective_from: string;
  reason?: string;
}

interface ServicePriceUpdate {
  effective_to?: string;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

const SERVICE_TYPE_MAP: Record<string, string> = {
  utility: 'Utility',
  management: 'Management',
  amenity: 'Amenity',
  optional: 'Optional',
};

const BILLING_METHOD_MAP: Record<string, string> = {
  fixed: 'Fixed',
  per_person: 'PerPerson',
  per_m2: 'PerM2',
  metered: 'Metered',
  usage: 'Usage',
};

function toService(row: DbServiceRow, latestPrice?: DbServicePriceRow): Service {
  return {
    serviceId: row.id,
    serviceName: row.name,
    serviceCode: row.service_code,
    serviceType: (SERVICE_TYPE_MAP[row.service_type] ?? row.service_type) as Service['serviceType'],
    unit: row.unit,
    billingMethod: (BILLING_METHOD_MAP[row.billing_method] ?? row.billing_method) as Service['billingMethod'],
    description: row.description ?? undefined,
    isActive: row.is_active,
    currentPrice: latestPrice?.price ?? 0,
    currentPriceEffectiveFrom: latestPrice?.effective_from ?? row.created_at,
  };
}

function toPriceHistory(row: DbServicePriceRow): ServicePriceHistory {
  return {
    priceHistoryId: row.id,
    serviceId: row.service_id,
    price: row.price,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    setByName: row.set_by ?? '',
    reason: row.reason ?? '',
    isActive: row.effective_to === null,
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const getServices = async (
  filter: ServiceFilter
): Promise<{ data: Service[]; total: number }> => {
  let query = supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: false });

  if (filter.search) {
    query = query.ilike('name', `%${filter.search}%`);
  }
  if (filter.serviceType) {
    const dbType = Object.entries(SERVICE_TYPE_MAP).find(([, v]) => v === filter.serviceType)?.[0];
    // service_type column exists in DB but not in generated types
    if (dbType) query = (query as any).eq('service_type', dbType);
  }
  if (filter.isActive !== undefined) {
    query = query.eq('is_active', filter.isActive);
  }

  const rows = await unwrap(query) as unknown as DbServiceRow[];

  // Fetch latest price for each service
  const serviceIds = rows.map(r => r.id);
  let priceRows: DbServicePriceRow[] = [];
  if (serviceIds.length > 0) {
    priceRows = await unwrap(
      supabase
        .from('service_prices')
        .select('*')
        .in('service_id', serviceIds)
        .is('effective_to', null)
    ) as unknown as DbServicePriceRow[];
  }

  const priceMap = new Map<number, DbServicePriceRow>();
  for (const p of priceRows) {
    priceMap.set(p.service_id, p);
  }

  const data = rows.map(r => toService(r, priceMap.get(r.id)));
  return { data, total: data.length };
};

export const getServiceById = async (id: number): Promise<Service | undefined> => {
  const row = await unwrap(
    supabase.from('services').select('*').eq('id', id).single()
  ) as unknown as DbServiceRow;

  const prices = await unwrap(
    supabase.from('service_prices').select('*').eq('service_id', id).is('effective_to', null).limit(1)
  ) as unknown as DbServicePriceRow[];

  return toService(row, prices[0]);
};

export const getPriceHistory = async (serviceId: number): Promise<ServicePriceHistory[]> => {
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
  const dbType = Object.entries(SERVICE_TYPE_MAP).find(([, v]) => v === dto.serviceType)?.[0] ?? 'utility';
  const dbBilling = Object.entries(BILLING_METHOD_MAP).find(([, v]) => v === dto.billingMethod)?.[0] ?? 'fixed';

  const insertPayload: ServiceInsert = {
    service_code: dto.serviceCode,
    name: dto.serviceName,
    service_type: dbType,
    unit: dto.unit,
    billing_method: dbBilling,
    description: dto.description ?? null,
    is_active: dto.isActive,
  };
  const row = await unwrap(
    supabase.from('services').insert(insertPayload as never).select().single()
  ) as unknown as DbServiceRow;

  // Create initial price
  const pricePayload: ServicePriceInsert = {
    service_id: row.id,
    price: dto.initialPrice,
    effective_from: dto.priceEffectiveFrom,
    reason: dto.priceReason,
  };
  await unwrap(
    supabase.from('service_prices').insert(pricePayload as never)
  );

  return toService(row, {
    id: 0,
    service_id: row.id,
    price: dto.initialPrice,
    effective_from: dto.priceEffectiveFrom,
    effective_to: null,
    set_by: null,
    reason: dto.priceReason,
    created_at: new Date().toISOString(),
  });
};

export const updateService = async (id: number, dto: UpdateServiceDto): Promise<Service> => {
  const dbType = Object.entries(SERVICE_TYPE_MAP).find(([, v]) => v === dto.serviceType)?.[0] ?? 'utility';
  const dbBilling = Object.entries(BILLING_METHOD_MAP).find(([, v]) => v === dto.billingMethod)?.[0] ?? 'fixed';

  const updatePayload: ServiceUpdate = {
    name: dto.serviceName,
    service_type: dbType,
    unit: dto.unit,
    billing_method: dbBilling,
    description: dto.description ?? null,
    is_active: dto.isActive,
  };
  const row = await unwrap(
    supabase.from('services').update(updatePayload as never).eq('id', id).select().single()
  ) as unknown as DbServiceRow;

  return toService(row);
};

export const toggleServiceActive = async (id: number, isActive: boolean): Promise<void> => {
  await unwrap(
    supabase.from('services').update({ is_active: isActive } as ServiceUpdate as never).eq('id', id)
  );
};

export const updateServicePrice = async (serviceId: number, dto: UpdateServicePriceDto): Promise<void> => {
  // Close current active price
  await unwrap(
    supabase
      .from('service_prices')
      .update({ effective_to: dto.effectiveFrom } as ServicePriceUpdate as never)
      .eq('service_id', serviceId)
      .is('effective_to', null)
  );

  // Insert new price
  await unwrap(
    supabase.from('service_prices').insert({
      service_id: serviceId,
      price: dto.newPrice,
      effective_from: dto.effectiveFrom,
      reason: dto.reason,
    } as ServicePriceInsert as never)
  );
};

export const checkServiceCodeUnique = async (code: string, excludeId?: number): Promise<boolean> => {
  let query = supabase.from('services').select('id').eq('service_code', code);
  if (excludeId) query = query.neq('id', excludeId);
  const rows = await unwrap(query) as unknown as { id: number }[];
  return rows.length === 0;
};

export const checkServiceNameUnique = async (name: string, excludeId?: number): Promise<boolean> => {
  let query = supabase.from('services').select('id').eq('name', name);
  if (excludeId) query = query.neq('id', excludeId);
  const rows = await unwrap(query) as unknown as { id: number }[];
  return rows.length === 0;
};

export const generateServiceCode = (): string => `SVC-${Date.now().toString(36).toUpperCase().slice(-4)}`;
