import { BuildingSummary, BuildingDetail, Building, BuildingFilters, CreateBuildingData, UpdateBuildingData } from '@/models/Building';
import { OwnerSummary, OwnerDetail, Owner, CreateOwnerData, UpdateOwnerData } from '@/models/Owner';

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

    // Server-side Sorting
    const sortField = filters?.sortBy === 'totalRooms' ? 'id' : (filters?.sortBy || 'name'); // Cannot directly sort by computed room count in base table without a view
    query = query.order(sortField === 'name' ? 'name' : (sortField === 'created_at' ? 'created_at' : 'id'), { 
      ascending: filters?.sortOrder === 'asc' 
    });

    // Server-side Pagination
    if (filters?.page !== undefined && filters?.pageSize !== undefined) {
      const from = (filters.page - 1) * filters.pageSize;
      const to = from + filters.pageSize - 1;
      query = query.range(from, to);
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
    const row = await unwrap(
      supabase
        .from('buildings')
        .select('*, rooms(count)')
        .eq('id', Number(id))
        .single()
    ) as unknown as BuildingRow;
    return toBuildingDetail(row);
  },

  getOwners: async (options?: { 
    search?: string;
    minBuildings?: number;
    maxBuildings?: number;
    isActive?: boolean;
    buildingId?: string;
  }): Promise<OwnerSummary[]> => {
    let query = supabase
      .from('profiles')
      .select('*, buildings(id, name)')
      .eq('role', 'landlord');

    const { search, minBuildings, maxBuildings, isActive, buildingId } = options || {};

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    if (search) {
      const s = `%${search}%`;
      query = query.or(`full_name.ilike.${s},phone.ilike.${s}`);
    }

    // Note: Filtering by building_id would require a specific join or subquery.
    // We'll handle building filter in JS for now or via a specific where if possible.
    
    let rows = await unwrap(query) as unknown as (ProfileRow & { buildings: { id: number, name: string }[] })[];
    
    // Client-side filtering for complex conditions (building count, specific building)
    if (buildingId) {
      rows = rows.filter(r => r.buildings?.some(b => String(b.id) === buildingId));
    }

    if (minBuildings !== undefined) {
      rows = rows.filter(r => (r.buildings?.length || 0) >= minBuildings);
    }
    
    if (maxBuildings !== undefined) {
      rows = rows.filter(r => (r.buildings?.length || 0) <= maxBuildings);
    }

    return rows.map(r => {
      const prefs = r.preferences || {};
      return {
        id: r.id,
        fullName: r.full_name,
        avatarUrl: r.avatar_url ?? undefined,
        phone: r.phone ?? '',
        email: prefs.email ?? '',
        cccd: prefs.cccd ?? '',
        taxCode: prefs.tax_code ?? '',
        address: prefs.address ?? '',
        buildingsOwned: r.buildings?.map(b => ({ 
          buildingId: String(b.id), 
          buildingName: b.name 
        })) || [],
        totalBuildings: r.buildings?.length || 0,
        isDeleted: false,
      };
    });
  },

  getOwnerDetail: async (id: string): Promise<OwnerDetail> => {
    const row = await unwrap(
      supabase
        .from('profiles')
        .select('*, buildings(*, rooms(count))')
        .eq('id', id)
        .single()
    ) as unknown as (ProfileRow & { buildings: any[] });

    const prefs = row.preferences || {};
    
    // Compute total rooms across all owned buildings
    const totalRooms = row.buildings?.reduce((acc, b) => acc + (b.rooms?.[0]?.count || 0), 0) || 0;

    return {
      id: row.id,
      fullName: row.full_name,
      avatarUrl: row.avatar_url ?? undefined,
      phone: row.phone ?? '',
      email: prefs.email ?? '',
      cccd: prefs.cccd ?? '',
      taxCode: prefs.tax_code ?? '',
      address: prefs.address ?? '',
      buildingsOwned: row.buildings?.map(b => ({
        buildingId: String(b.id),
        buildingName: b.name,
        buildingCode: `B${String(b.id).padStart(3, '0')}`,
        ownershipPercent: 100, // Default to 100% since we use buildings.owner_id
        ownershipType: 'FullOwner',
        startDate: b.opening_date || b.created_at,
      })) || [],
      totalBuildings: row.buildings?.length || 0,
      totalRooms,
      isDeleted: false,
    };
  },

  // Get real location data from Vietnam Open API
  getProvinces: async () => {
    try {
      const res = await fetch('https://provinces.open-api.vn/api/p/');
      if (!res.ok) return FALLBACK_PROVINCES;
      const data = await res.json();
      return data.map((p: any) => ({ id: String(p.code), name: p.name }));
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
      return (data.districts || []).map((d: any) => ({ id: String(d.code), name: d.name }));
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
      return (data.wards || []).map((w: any) => ({ id: String(w.code), name: w.name }));
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
    console.log(`[Mock] Uploading file for building ${id}:`, file.name);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(URL.createObjectURL(file));
      }, 1000);
    });
  },

  createOwner: async (data: CreateOwnerData): Promise<Owner> => {
    // Note: In a real app, you'd call an Edge Function to create an auth user.
    // For now, we simulate by inserting into profiles. 
    // We'll use a random UUID as the ID.
    const newId = crypto.randomUUID();
    
    const row = await unwrap(
      supabase
        .from('profiles')
        .insert({
          id:        newId,
          full_name: data.fullName,
          phone:     data.phone,
          role:      'landlord',
          is_active: true,
          preferences: {
            cccd:     data.cccd,
            tax_code: data.taxCode,
            address:  data.address,
            email:    data.email,
          }
        })
        .select()
        .single()
    ) as unknown as ProfileRow;

    const prefs = row.preferences || {};

    return {
      id:         row.id,
      fullName:   row.full_name,
      avatarUrl:  row.avatar_url ?? undefined,
      phone:      row.phone ?? '',
      email:      prefs.email ?? '',
      cccd:       prefs.cccd ?? '',
      taxCode:    prefs.tax_code ?? '',
      address:    prefs.address ?? '',
      isDeleted:  false,
    };
  },

  updateOwner: async (id: string, data: UpdateOwnerData): Promise<Owner> => {
    // First fetch current preferences to merge
    const current = await unwrap(
      supabase.from('profiles').select('preferences').eq('id', id).single()
    ) as { preferences: any };

    const newPrefs = {
      ...(current.preferences || {}),
      cccd:     data.cccd     !== undefined ? data.cccd     : current.preferences?.cccd,
      tax_code: data.taxCode  !== undefined ? data.taxCode  : current.preferences?.tax_code,
      address:  data.address  !== undefined ? data.address  : current.preferences?.address,
      email:    data.email    !== undefined ? data.email    : current.preferences?.email,
    };

    const row = await unwrap(
      supabase
        .from('profiles')
        .update({
          full_name: data.fullName || undefined,
          phone:     data.phone   || undefined,
          preferences: newPrefs,
        })
        .eq('id', id)
        .select()
        .single()
    ) as unknown as ProfileRow;

    const prefs = row.preferences || {};

    return {
      id:        row.id,
      fullName:  row.full_name,
      avatarUrl: row.avatar_url ?? undefined,
      phone:     row.phone ?? '',
      email:     prefs.email ?? '',
      cccd:      prefs.cccd ?? '',
      taxCode:   prefs.tax_code ?? '',
      address:   prefs.address ?? '',
      isDeleted: false,
    };
  },


};
