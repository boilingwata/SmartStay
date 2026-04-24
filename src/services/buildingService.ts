import { BuildingSummary, BuildingDetail, Building, BuildingImage, BuildingFilters, CreateBuildingData, UpdateBuildingData, BuildingDbRow } from '@/models/Building';


import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { FALLBACK_PROVINCES, FALLBACK_DISTRICTS, FALLBACK_WARDS } from '@/constants/administrative';

interface ProfileRow {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  role: string;
  is_active: boolean | null;
  preferences: {
    cccd?: string;
    tax_code?: string;
    address?: string;
    email?: string;
  } | null;
}

interface LocationApiItem {
  code: number | string;
  name: string;
  districts?: LocationApiItem[];
  wards?: LocationApiItem[];
}

// --- Row-to-model transformers ---



function toBuildingSummary(row: BuildingDbRow): BuildingSummary {
  const totalRooms = row.rooms?.[0]?.count ?? 0;
  return {
    id: String(row.id),
    uuid: row.uuid,
    buildingCode: `B${String(row.id).padStart(3, '0')}`,
    name: row.name,
    buildingName: row.name,
    address: row.address,
    description: row.description ?? undefined,
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    totalFloors: row.total_floors ?? 0,
    openingDate: row.opening_date ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    electricityProvider: row.electricity_provider ?? undefined,
    waterProvider: row.water_provider ?? undefined,
    fireCertExpiry: row.fire_cert_expiry ?? undefined,
    lastMaintenanceDate: row.last_maintenance_date ?? undefined,
    isDeleted: row.is_deleted ?? false,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    totalRooms,
    occupiedRooms: 0,
    occupancyRate: 0,
    // Transient/Legacy
    type: 'Apartment',
    managementPhone: '',
    managementEmail: '',
  };
}

function toBuildingDetail(row: BuildingDbRow): BuildingDetail {
  const summary = toBuildingSummary(row);
  return {
    ...summary,
    images: [],
  };
}

export const buildingService = {
  getBuildings: async (filters?: BuildingFilters): Promise<BuildingSummary[]> => {
    let query = supabase
      .from('buildings')
      .select('*, rooms(count)')
      .eq('is_deleted', false);

    if (filters?.search) {
      const s = `%${filters.search}%`;
      query = query.or(`name.ilike.${s},address.ilike.${s}`);
    }

    // Server-side Sorting
    const sortField = filters?.sortBy === 'totalRooms' ? 'id' : (filters?.sortBy || 'name');
    query = query.order(sortField === 'name' ? 'name' : (sortField === 'created_at' ? 'created_at' : 'id'), {
      ascending: filters?.sortOrder === 'asc'
    });

    if (filters?.page !== undefined && filters?.pageSize !== undefined) {
      const from = (filters.page - 1) * filters.pageSize;
      const to = from + filters.pageSize - 1;
      query = query.range(from, to);
    }

    const rows = await unwrap(query) as unknown as BuildingDbRow[];
    const summaries = rows.map(toBuildingSummary);

    const buildingIds = rows.map(r => r.id);
    if (buildingIds.length > 0) {
      const { data: occupiedData } = await supabase
        .from('rooms')
        .select('building_id')
        .in('building_id', buildingIds)
        .eq('status', 'occupied');

      if (occupiedData) {
        const occupiedMap: Record<number, number> = {};
        occupiedData.forEach((r: { building_id: number }) => {
          occupiedMap[r.building_id] = (occupiedMap[r.building_id] || 0) + 1;
        });
        summaries.forEach(s => {
          const occupied = occupiedMap[Number(s.id)] || 0;
          s.occupiedRooms = occupied;
          s.occupancyRate = s.totalRooms > 0 ? Math.round((occupied / s.totalRooms) * 100) : 0;
        });
      }
    }

    return summaries;
  },

  getBuildingDetail: async (id: string): Promise<BuildingDetail> => {
    const [row, imagesData] = await Promise.all([
      unwrap(
        supabase
          .from('buildings')
          .select('*, rooms(count)')
          .eq('id', Number(id))
          .single()
      ) as unknown as Promise<BuildingDbRow>,
      supabase
        .from('building_images')
        .select('*')
        .eq('building_id', Number(id))
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
    ]);

    const detail = toBuildingDetail(row);
    const images = (imagesData.data ?? []) as Array<{
      id: number; url: string; is_main: boolean; sort_order: number;
    }>;
    detail.images = images.map(img => ({
      id: String(img.id),
      url: img.url,
      isMain: img.is_main,
      sortOrder: img.sort_order,
    }));

    detail.totalRooms = row.rooms?.[0]?.count ?? 0;

    // Fetch occupied rooms count separately
    const { count: occupiedCount } = await supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('building_id', Number(id))
      .eq('status', 'occupied');

    detail.occupiedRooms = occupiedCount ?? 0;
    detail.occupancyRate = detail.totalRooms > 0 ? Math.round((detail.occupiedRooms / detail.totalRooms) * 100) : 0;

    // Fetch owner profile for management contact info
    const { data: buildingWithOwner } = await supabase
      .from('buildings')
      .select('*, profiles!owner_id(*)')
      .eq('id', Number(id))
      .single();

    if (buildingWithOwner?.profiles) {
      const profiles = buildingWithOwner.profiles as unknown as ProfileRow;
      const prefs = profiles.preferences || {};
      detail.managementPhone = profiles.phone || '';
      detail.managementEmail = prefs.email || '';
    }

    return detail;
  },

  addBuildingImage: async (buildingId: string, url: string, isMain: boolean): Promise<BuildingImage> => {
    if (isMain) {
      // Clear existing main flag first
      await supabase
        .from('building_images')
        .update({ is_main: false })
        .eq('building_id', Number(buildingId))
        .eq('is_main', true);
    }

    const { data, error } = await supabase
      .from('building_images')
      .insert({ building_id: Number(buildingId), url, is_main: isMain, sort_order: 0 })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: String((data as { id: number }).id),
      url: (data as { url: string }).url,
      isMain: (data as { is_main: boolean }).is_main,
      sortOrder: (data as { sort_order: number }).sort_order,
    };
  },

  deleteBuildingImage: async (imageId: string): Promise<void> => {
    const { error } = await supabase
      .from('building_images')
      .delete()
      .eq('id', Number(imageId));
    if (error) throw new Error(error.message);
  },

  setMainBuildingImage: async (buildingId: string, imageId: string): Promise<void> => {
    await supabase
      .from('building_images')
      .update({ is_main: false })
      .eq('building_id', Number(buildingId));
    const { error } = await supabase
      .from('building_images')
      .update({ is_main: true })
      .eq('id', Number(imageId));
    if (error) throw new Error(error.message);
  },



  // Province/district/ward — fetch from Vietnam Open API with fallback to constants
  getBuildingRevenueChart: async (buildingId: string): Promise<{ month: string; revenue: number; collected: number }[]> => {
    try {
      // Step 1: room IDs for this building
      const { data: roomData } = await supabase
        .from('rooms')
        .select('id')
        .eq('building_id', Number(buildingId))
        .eq('is_deleted', false);
      const roomIds = ((roomData ?? []) as { id: number }[]).map(r => r.id);
      if (roomIds.length === 0) return [];

      // Step 2: contract IDs for those rooms
      const { data: contractData } = await supabase
        .from('contracts')
        .select('id')
        .in('room_id', roomIds);
      const contractIds = ((contractData ?? []) as { id: number }[]).map(c => c.id);
      if (contractIds.length === 0) return [];

      // Step 3: invoices for those contracts, last 6 months
      const fromDate = new Date();
      fromDate.setMonth(fromDate.getMonth() - 5);
      fromDate.setDate(1);
      const fromStr = fromDate.toISOString().slice(0, 7) + '-01';

      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('total_amount, amount_paid, billing_period')
        .in('contract_id', contractIds)
        .gte('billing_period', fromStr);

      type InvRow = { total_amount: number | null; amount_paid: number | null; billing_period: string | null };
      const byMonth = new Map<string, { revenue: number; collected: number }>();
      for (const row of (invoiceData ?? []) as InvRow[]) {
        const m = (row.billing_period ?? '').slice(0, 7);
        if (!m) continue;
        const cur = byMonth.get(m) ?? { revenue: 0, collected: 0 };
        cur.revenue += row.total_amount ?? 0;
        cur.collected += row.amount_paid ?? 0;
        byMonth.set(m, cur);
      }

      // Ensure all 6 months present (including zero months)
      const months: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        months.push(d.toISOString().slice(0, 7));
      }
      return months.map(month => ({ month, ...(byMonth.get(month) ?? { revenue: 0, collected: 0 }) }));
    } catch { return []; }
  },

  // Get real location data from Vietnam Open API with fallback
  getProvinces: async () => {
    try {
      const res = await fetch('https://provinces.open-api.vn/api/p/');
      if (!res.ok) return FALLBACK_PROVINCES;
      const data = await res.json();
      return data.map((p: LocationApiItem) => ({ id: String(p.code), name: p.name }));
    } catch {
      return FALLBACK_PROVINCES;
    }
  },
  getDistricts: async (provinceId: string) => {
    if (!provinceId) return [];
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/p/${provinceId}?depth=2`);
      if (!res.ok) return FALLBACK_DISTRICTS[provinceId] || [];
      const data = await res.json();
      return (data.districts || []).map((d: LocationApiItem) => ({ id: String(d.code), name: d.name }));
    } catch {
      return FALLBACK_DISTRICTS[provinceId] || [];
    }
  },
  getWards: async (districtId: string) => {
    if (!districtId) return [];
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/d/${districtId}?depth=2`);
      if (!res.ok) return FALLBACK_WARDS[districtId] || [];
      const data = await res.json();
      return (data.wards || []).map((w: LocationApiItem) => ({ id: String(w.code), name: w.name }));
    } catch {
      return FALLBACK_WARDS[districtId] || [];
    }
  },

  checkBuildingCodeUnique: async (name: string): Promise<boolean> => {
    // buildingCode is derived from DB id — not stored as a column.
    // Check building name uniqueness instead (case-insensitive).
    const { data } = await supabase
      .from('buildings')
      .select('id')
      .ilike('name', name)
      .eq('is_deleted', false)
      .limit(1);
    return !data || data.length === 0;
  },

  createBuilding: async (data: CreateBuildingData, ownerId: string): Promise<Building> => {
    const row = await unwrap(
      supabase
        .from('buildings')
        .insert({
          name: data.name,
          address: data.address,
          description: data.description,
          amenities: data.amenities ?? [],
          total_floors: data.totalFloors,
          opening_date: data.openingDate || null,
          latitude: data.latitude,
          longitude: data.longitude,
          electricity_provider: data.electricityProvider,
          water_provider: data.waterProvider,
          owner_id: ownerId,
        })
        .select()
        .single()
    ) as unknown as BuildingDbRow;

    return toBuildingSummary(row);
  },

  updateBuilding: async (id: string, data: UpdateBuildingData): Promise<Building> => {
    const row = await unwrap(
      supabase
        .from('buildings')
        .update({
          name: data.name,
          address: data.address,
          description: data.description,
          amenities: data.amenities,
          total_floors: data.totalFloors,
          opening_date: data.openingDate,
          latitude: data.latitude,
          longitude: data.longitude,
          electricity_provider: data.electricityProvider,
          water_provider: data.waterProvider,
        })
        .eq('id', Number(id))
        .select()
        .single()
    ) as unknown as BuildingDbRow;

    return toBuildingSummary(row);
  },

  deleteBuilding: async (id: string): Promise<void> => {
    await unwrap(
      supabase
        .from('buildings')
        .update({ is_deleted: true })
        .eq('id', Number(id))
    );
  },

  uploadBuildingImage: async (id: string, file: File): Promise<string> => {
    // Backend Not Yet Implemented (as requested by user)
    // For now, return a local Object URL to allow for immediate UI preview

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(URL.createObjectURL(file));
      }, 1000);
    });
  },




};
