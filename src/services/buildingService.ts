import { BuildingSummary, BuildingDetail, Building, BuildingImage, BuildingFilters, CreateBuildingData, UpdateBuildingData } from '@/models/Building';
import { OwnerSummary, OwnerDetail, Owner, CreateOwnerData, UpdateOwnerData } from '@/models/Owner';

import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { MOCK_PROVINCES, MOCK_DISTRICTS, MOCK_WARDS } from '@/mocks/systemMocks';
import { assertNoLikelyMojibake } from '@/utils';

interface ProfileRow {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  role: string;
  is_active: boolean | null;
}

// --- Row-to-model transformers ---

interface BuildingRow {
  id: number
  uuid: string
  name: string
  address: string
  description: string | null
  amenities: unknown
  owner_id: string | null
  total_floors: number | null
  opening_date: string | null
  latitude: number | null
  longitude: number | null
  is_deleted: boolean | null
  created_at: string | null
  updated_at: string | null
  rooms?: { count: number }[]
}

const validateOwnerTextEncoding = (data: Partial<CreateOwnerData & UpdateOwnerData>) => {
  assertNoLikelyMojibake(
    {
      fullName: data.fullName,
      email: data.email,
      cccd: data.cccd,
      taxCode: data.taxCode,
      address: data.address,
    },
    {
      fullName: 'họ tên',
      email: 'email',
      cccd: 'CCCD / Passport',
      taxCode: 'mã số thuế',
      address: 'địa chỉ',
    },
  );
};

function toBuildingSummary(row: BuildingRow): BuildingSummary {
  const totalRooms = row.rooms?.[0]?.count ?? 0;
  return {
    id: String(row.id),
    buildingCode: `B${String(row.id).padStart(3, '0')}`,
    buildingName: row.name,
    type: 'Apartment',
    address: row.address,
    provinceId: '',
    districtId: '',
    wardId: '',
    yearBuilt: row.opening_date ? new Date(row.opening_date).getFullYear() : 2020,
    totalFloors: row.total_floors ?? 1,
    managementPhone: '',
    managementEmail: '',
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    isDeleted: row.is_deleted ?? false,
    totalRooms,
    occupiedRooms: 0, // Will be computed with a subquery later
    occupancyRate: 0,
  };
}

function toBuildingDetail(row: BuildingRow): BuildingDetail {
  const summary = toBuildingSummary(row);
  const amenities = Array.isArray(row.amenities) ? (row.amenities as string[]) : [];
  return {
    ...summary,
    amenities,
    description: row.description ?? undefined,
    images: [],
    ownership: [],
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

    const rows = await unwrap(query) as unknown as BuildingRow[];
    const summaries = rows.map(toBuildingSummary);

    // Compute occupancy per building by querying occupied rooms
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
      ) as unknown as Promise<BuildingRow>,
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

  getOwners: async (search?: string): Promise<OwnerSummary[]> => {
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'landlord');

    if (search) {
      const s = `%${search}%`;
      query = query.or(`full_name.ilike.${s},phone.ilike.${s}`);
    }

    const rows = await unwrap(query) as unknown as ProfileRow[];
    return rows.map(r => ({
      id: r.id,
      fullName: r.full_name,
      avatarUrl: r.avatar_url ?? undefined,
      phone: r.phone ?? '',
      email: '',
      cccd: '',
      taxCode: '',
      address: '',
      buildingsOwned: [],
      totalBuildings: 0,
      isDeleted: false,
    }));
  },

  getOwnerDetail: async (id: string): Promise<OwnerDetail> => {
    const row = await unwrap(
      supabase.from('profiles').select('*').eq('id', id).single()
    ) as unknown as ProfileRow;
    return {
      id: row.id,
      fullName: row.full_name,
      avatarUrl: row.avatar_url ?? undefined,
      phone: row.phone ?? '',
      email: '',
      cccd: '',
      taxCode: '',
      address: '',
      buildingsOwned: [],
      totalBuildings: 0,
      totalRooms: 0,
      isDeleted: false,
    };
  },

  // Province/district/ward — kept as static data (no DB tables for these)
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

  getProvinces: async () => MOCK_PROVINCES,
  getDistricts: async (provinceId: string) => MOCK_DISTRICTS[provinceId] || [],
  getWards: async (districtId: string) => MOCK_WARDS[districtId] || [],

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

  createBuilding: async (data: CreateBuildingData): Promise<Building> => {
    const row = await unwrap(
      supabase
        .from('buildings')
        .insert({
          name: data.buildingName,
          address: data.address,
          description: data.description,
          amenities: data.amenities ?? [],
          total_floors: data.totalFloors,
          latitude: data.latitude,
          longitude: data.longitude,
        })
        .select()
        .single()
    ) as unknown as BuildingRow;

    return {
      id: String(row.id),
      buildingCode: `B${String(row.id).padStart(3, '0')}`,
      buildingName: row.name,
      type: data.type ?? 'Apartment',
      address: row.address,
      provinceId: data.provinceId ?? '',
      districtId: data.districtId ?? '',
      wardId: data.wardId ?? '',
      yearBuilt: data.yearBuilt ?? new Date().getFullYear(),
      totalFloors: row.total_floors ?? 1,
      managementPhone: data.managementPhone ?? '',
      managementEmail: data.managementEmail ?? '',
      isDeleted: false,
    };
  },

  updateBuilding: async (id: string, data: UpdateBuildingData): Promise<Building> => {
    const row = await unwrap(
      supabase
        .from('buildings')
        .update({
          name: data.buildingName,
          address: data.address,
          description: data.description,
          amenities: data.amenities,
          total_floors: data.totalFloors,
          latitude: data.latitude,
          longitude: data.longitude,
        })
        .eq('id', Number(id))
        .select()
        .single()
    ) as unknown as BuildingRow;

    return {
      id: String(row.id),
      buildingCode: `B${String(row.id).padStart(3, '0')}`,
      buildingName: row.name,
      type: data.type ?? 'Apartment',
      address: row.address,
      provinceId: data.provinceId ?? '',
      districtId: data.districtId ?? '',
      wardId: data.wardId ?? '',
      yearBuilt: data.yearBuilt ?? new Date().getFullYear(),
      totalFloors: row.total_floors ?? 1,
      managementPhone: data.managementPhone ?? '',
      managementEmail: data.managementEmail ?? '',
      isDeleted: row.is_deleted ?? false,
    };
  },

  createOwner: async (data: CreateOwnerData): Promise<Owner> => {
    // profiles.id is a FK → auth.users.id, so we cannot insert a profile with a
    // random UUID from the client side — there would be no matching auth.users row.
    // The Edge Function calls auth.admin.createUser() (service-role only) first,
    // which creates the auth.users row, then upserts the profile.
    validateOwnerTextEncoding(data);

    const { data: result, error } = await supabase.functions.invoke('create-owner', {
      body: {
        fullName:  data.fullName,
        email:     data.email,
        phone:     data.phone,
        cccd:      data.cccd,
        taxCode:   data.taxCode,
        address:   data.address,
        avatarUrl: data.avatarUrl,
      },
    });

    if (error) throw new Error(error.message);
    if (!result?.owner) throw new Error('Tạo chủ sở hữu thất bại: phản hồi không hợp lệ từ server.');

    return result.owner as Owner;
  },

  updateOwner: async (id: string, data: UpdateOwnerData): Promise<Owner> => {
    validateOwnerTextEncoding(data);

    const row = await unwrap(
      supabase
        .from('profiles')
        .update({
          full_name: data.fullName || undefined,
          avatar_url: data.avatarUrl === undefined ? undefined : data.avatarUrl ?? null,
          phone:     data.phone   ?? null,
        })
        .eq('id', id)
        .select()
        .single()
    ) as unknown as ProfileRow;

    return {
      id:        row.id,
      fullName:  row.full_name,
      avatarUrl: row.avatar_url ?? undefined,
      phone:     row.phone ?? '',
      email:     data.email  ?? '',
      cccd:      data.cccd   ?? '',
      taxCode:   data.taxCode ?? '',
      address:   data.address ?? '',
      isDeleted: false,
    };
  },


};
