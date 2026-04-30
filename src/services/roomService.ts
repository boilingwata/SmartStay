import {
  Room, RoomDetail, RoomStatus,
  HandoverChecklist, HandoverSection,
  RoomStatusHistory, RoomAsset, RoomFilters, CreateRoomData, UpdateRoomData, 
  CreateHandoverData, AssetFilters, DirectionFacing
} from '@/models/Room';

import { Asset } from '@/models/Asset';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { unwrap, buildingScoped } from '@/lib/supabaseHelpers';
import { mapAssetCondition, mapAssetType, mapBillingStatusFromDb } from '@/lib/assetMappers';
import { 
  mapRoomStatus, mapContractStatus, mapHandoverType, mapConditionScore 
} from '@/lib/enumMaps';
import { deriveFurnishingFromAssets, deriveRoomType, getAmenityViewModel, normalizeAmenityCodes } from '@/lib/propertyBusiness';
import type { DbRoomStatus } from '@/types/supabase';

// --- Row interfaces ---

interface RoomRow {
  id: number
  uuid: string
  building_id: number
  room_code: string
  floor_number: number | null
  area_sqm: number | null
  room_type: string | null
  max_occupants: number | null
  has_balcony: boolean | null
  facing: string | null
  amenities: unknown
  base_rent: number | null
  condition_score: number | null
  status: string | null
  description: string | null
  last_maintenance_date: string | null
  is_deleted: boolean | null
  is_listed: boolean | null
  buildings?: { name: string } | null
}

interface RoomContractRow {
  id: number
  contract_code: string
  start_date: string
  end_date: string
  monthly_rent: number | null
  status: string | null
  contract_tenants?: {
    id: number
    is_primary: boolean | null
    tenants?: { id: number; full_name: string; profile_id: string | null } | null
  }[] | null
}

interface RoomAssetRow {
  id: number
  serial_number: string | null
  status: string | null
  condition_score: number | null
  purchase_date: string | null
  assigned_at: string | null
  is_billable: boolean | null
  monthly_charge: number | null
  billing_status: string | null
  billing_label: string | null
  created_at: string | null
  assets?: { id: number; name: string; category: string | null; qr_code: string | null } | null
}

interface StatusHistoryRow {
  id: number
  previous_status: string
  new_status: string
  changed_at: string | null
  changed_by: string | null
  reason: string | null
}

interface HandoverRow {
  id: number
  room_id: number
  contract_id: number | null
  handover_type: string
  performed_at: string | null
  performed_by: string | null
  tenant_id: string | null
  manager_signature: string | null
  tenant_signature: string | null
  notes: string | null
  rooms?: { room_code: string } | null
  handover_items?: HandoverItemRow[]
  handover_asset_snapshots?: HandoverAssetRow[]
}

interface HandoverItemRow {
  id: number
  category: string
  item_name: string
  status: string
  note: string | null
  photo_urls: string[] | null
}

interface HandoverAssetRow {
  id: number
  room_asset_id: number
  previous_condition_score: number | null
  current_condition_score: number
  note: string | null
  room_assets?: {
    assets?: { name: string; qr_code: string | null } | null
  } | null
}

// --- Transformers ---

function toRoom(row: RoomRow): Room {
  return {
    id: String(row.id),
    roomCode: row.room_code,
    buildingId: String(row.building_id),
    buildingName: (row.buildings as { name?: string } | null)?.name ?? '',
    floorNumber: row.floor_number ?? 1,
    roomType: deriveRoomType(row.area_sqm, row.room_type),
    areaSqm: row.area_sqm ?? 0,
    baseRentPrice: row.base_rent ?? 0,
    status: mapRoomStatus.fromDb(row.status ?? 'available') as RoomStatus,
    hasMeter: false,
    isListed: row.is_listed ?? false,
  };
}

function toRoomDetail(
  row: RoomRow,
  assets: RoomAssetRow[],
  history: StatusHistoryRow[],
  contracts: RoomContractRow[]
): RoomDetail {
  const room = toRoom(row);
  const amenities = normalizeAmenityCodes(row.amenities);

  // Collect tenant names from active contracts
  const activeContracts = contracts.filter(c => c.status === 'active');
  const tenantNames: string[] = [];
  for (const c of activeContracts) {
    for (const ct of (c.contract_tenants ?? [])) {
      const name = ct.tenants?.full_name;
      if (name && !tenantNames.includes(name)) tenantNames.push(name);
    }
  }

  // Map contracts to ContractSummary for the Contracts tab
  const contractSummaries = contracts.map(c => {
    const primaryTenant = c.contract_tenants?.find(ct => ct.is_primary) ?? c.contract_tenants?.[0];
    return {
      id: String(c.id),
      contractCode: c.contract_code,
      startDate: c.start_date,
      endDate: c.end_date,
      monthlyRent: c.monthly_rent ?? 0,
      status: mapContractStatus.fromDb(c.status ?? 'draft') as import('@/models/Contract').ContractStatus,
      tenantName: primaryTenant?.tenants?.full_name ?? '',
      tenantId: primaryTenant?.tenants?.profile_id ? String(primaryTenant.tenants.profile_id) : undefined,
    };
  });

  return {
    ...room,
    description: (row as unknown as { description?: string }).description ?? undefined,
    lastMaintenanceDate: (row as unknown as { last_maintenance_date?: string }).last_maintenance_date ?? undefined,
    maxOccupancy: row.max_occupants ?? 2,
    furnishing: deriveFurnishingFromAssets(
      assets.map((asset) => ({
        assetName: asset.assets?.name,
        type: asset.assets?.category,
      })),
    ),
    directionFacing: ((row.facing as string | null) ?? 'N') as import('@/models/Room').DirectionFacing,
    hasBalcony: row.has_balcony ?? false,
    conditionScore: row.condition_score ?? 5,
    tenantNames: tenantNames.length > 0 ? tenantNames : undefined,
    images: [],
    amenities,
    amenityDetails: getAmenityViewModel(row.amenities),
    meters: [],
    assets: assets.map(toRoomAsset),
    statusHistory: history.map(toStatusHistory),
    contracts: contractSummaries,
  };
}

function toRoomAsset(row: RoomAssetRow): RoomAsset {
  return {
    id: String(row.id),
    assetName: row.assets?.name ?? 'Unknown',
    assetCode: row.assets?.qr_code ?? row.serial_number ?? `RA-${row.id}`,
    type: mapAssetType(row.assets?.category ?? null),
    condition: mapAssetCondition(row.status),
    assignedAt: row.assigned_at ?? row.created_at ?? '',
    isBillable: row.is_billable ?? false,
    monthlyCharge: row.monthly_charge ?? undefined,
    billingStatus: mapBillingStatusFromDb(row.billing_status),
    billingLabel: row.billing_label ?? undefined,
  };
}

function toStatusHistory(row: StatusHistoryRow): RoomStatusHistory {
  return {
    id: String(row.id),
    fromStatus: mapRoomStatus.fromDb(row.previous_status) as RoomStatus,
    toStatus: mapRoomStatus.fromDb(row.new_status) as RoomStatus,
    changedAt: row.changed_at ?? '',
    changedBy: row.changed_by ?? '',
    reason: row.reason ?? undefined,
  };
}

function toHandoverChecklist(row: HandoverRow): HandoverChecklist {
  // Group items by category
  const sectionsMap = new Map<string, HandoverSection>();
  for (const item of (row.handover_items ?? [])) {
    if (!sectionsMap.has(item.category)) {
      sectionsMap.set(item.category, {
        id: `sec-${item.category}`,
        title: item.category,
        items: []
      });
    }
    sectionsMap.get(item.category)!.items.push({
      id: String(item.id),
      name: item.item_name,
      status: item.status === 'OK' ? 'OK' : 'NotOK',
      note: item.note ?? undefined,
      imageUrl: item.photo_urls?.[0]
    });
  }

  return {
    id: String(row.id),
    roomId: String(row.room_id),
    roomCode: row.rooms?.room_code ?? '',
    handoverType: mapHandoverType.fromDb(row.handover_type) as HandoverChecklist['handoverType'],
    date: row.performed_at ?? '',
    sections: Array.from(sectionsMap.values()),
    assets: (row.handover_asset_snapshots ?? []).map(a => ({
      id: String(a.id),
      assetName: a.room_assets?.assets?.name ?? 'Unknown',
      assetCode: a.room_assets?.assets?.qr_code ?? '',
      conditionBefore: String(a.previous_condition_score ?? 10),
      conditionAfter: String(a.current_condition_score),
      note: a.note ?? undefined
    })),
    witnessSignatureUrl: row.manager_signature ?? undefined,
    tenantSignatureUrl: row.tenant_signature ?? undefined,
    status: 'Completed' // Based on DB existence for now
  };
}

// --- Service ---

export const roomService = {
  getRooms: async (filters?: RoomFilters): Promise<Room[]> => {
    let query = supabase
      .from('rooms')
      .select('*, buildings(name)')
      .eq('is_deleted', false);

    // Building filter: only use the explicitly-provided buildingId from the caller.
    // Do NOT fall back to global store — services must remain dependency-free.
    query = buildingScoped(query, filters?.buildingId ?? null);

    if (filters?.search) {
      const s = `%${filters.search}%`;
      query = query.or(`room_code.ilike.${s}`);
    }

    if (filters?.status && filters.status.length > 0) {
      const dbStatuses = (filters.status as string[]).map(s => mapRoomStatus.toDb(s) as DbRoomStatus);
      query = query.in('status', dbStatuses);
    }

    if (filters?.facing) {
      query = query.eq('facing', filters.facing as DirectionFacing);
    }

    if (filters?.minFloor !== undefined) query = query.gte('floor_number', filters.minFloor);
    if (filters?.maxFloor !== undefined) query = query.lte('floor_number', filters.maxFloor);
    if (filters?.minArea !== undefined) query = query.gte('area_sqm', filters.minArea);
    if (filters?.maxArea !== undefined) query = query.lte('area_sqm', filters.maxArea);
    if (filters?.minPrice !== undefined) query = query.gte('base_rent', filters.minPrice);
    if (filters?.maxPrice !== undefined) query = query.lte('base_rent', filters.maxPrice);

    if (filters?.isListed !== undefined) {
      query = query.eq('is_listed', filters.isListed);
    }

    // Sorting
    const sortFieldMap: Record<string, string> = {
      price: 'base_rent',
      area: 'area_sqm',
      floor: 'floor_number',
      code: 'room_code',
      created_at: 'created_at'
    };
    const sortField = sortFieldMap[filters?.sortBy || 'code'] || 'room_code';
    query = query.order(sortField, { ascending: filters?.sortOrder !== 'desc' });

    // Pagination
    if (filters?.page !== undefined && filters?.pageSize !== undefined) {
      const from = (filters.page - 1) * filters.pageSize;
      const to = from + filters.pageSize - 1;
      query = query.range(from, to);
    }

    const rows = await unwrap(query) as unknown as RoomRow[];
    let rooms = rows.map(toRoom);

    if (filters?.roomType) {
      rooms = rooms.filter((room) => room.roomType === filters.roomType);
    }

    return rooms;
  },

  getRoomDetail: async (id: string): Promise<RoomDetail> => {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      throw new Error(`[roomService] Invalid room id: "${id}"`);
    }

    // Fetch room, assets, history, images, and contracts in parallel.
    const [row, assetRows, historyRows, imageRows, contractRows] = await Promise.all([
      unwrap(
        supabase
          .from('rooms')
          .select('*, buildings(name)')
          .eq('id', numId)
          .single()
      ) as unknown as Promise<RoomRow>,

      unwrap(
        supabase
          .from('room_assets')
          .select('id, serial_number, status, condition_score, purchase_date, assigned_at, is_billable, monthly_charge, billing_status, billing_label, created_at, assets(id, name, category, qr_code)')
          .eq('room_id', numId)
      ) as unknown as Promise<RoomAssetRow[]>,

      unwrap(
        supabase
          .from('room_status_history')
          .select('*')
          .eq('room_id', numId)
          .order('changed_at', { ascending: false })
          .limit(20)
      ) as unknown as Promise<StatusHistoryRow[]>,

      supabase
        .from('room_images')
        .select('id, url, is_main, sort_order')
        .eq('room_id', numId)
        .order('sort_order', { ascending: true })
        .then(({ data }) => (data ?? []) as { id: number; url: string; is_main: boolean; sort_order: number }[]),

      // Fetch all contracts for this room (active + historical)
      (async () => {
        try {
          return await unwrap(
            supabase
              .from('contracts')
              .select(`
                id, contract_code, start_date, end_date, monthly_rent, status,
                contract_tenants(id, is_primary, tenants(id, full_name, profile_id))
              `)
              .eq('room_id', numId)
              .eq('is_deleted', false)
              .order('start_date', { ascending: false })
          ) as unknown as RoomContractRow[];
        } catch {
          return [] as RoomContractRow[];
        }
      })(),
    ]);

    const detail = toRoomDetail(row, assetRows, historyRows, contractRows);
    detail.images = imageRows.map(r => ({
      id: String(r.id),
      url: r.url,
      isMain: r.is_main,
      sortOrder: r.sort_order,
    }));
    return detail;
  },

  addRoomImage: async (roomId: string, url: string, isMain: boolean): Promise<void> => {
    const { error } = await supabase
      .from('room_images')
      .insert({ room_id: Number(roomId), url, is_main: isMain, sort_order: 0 });
    if (error) throw new Error(error.message);
  },

  deleteRoomImage: async (imageId: string): Promise<void> => {
    const { error } = await supabase
      .from('room_images')
      .delete()
      .eq('id', Number(imageId));
    if (error) throw new Error(error.message);
  },

  setMainRoomImage: async (roomId: string, imageId: string): Promise<void> => {
    await supabase
      .from('room_images')
      .update({ is_main: false })
      .eq('room_id', Number(roomId));
    const { error } = await supabase
      .from('room_images')
      .update({ is_main: true })
      .eq('id', Number(imageId));
    if (error) throw new Error(error.message);
  },

  getRoomHandoverChecklist: async (roomId: string): Promise<HandoverChecklist[]> => {
    const rows = await unwrap(
      supabase
        .from('handover_checklists')
        .select(`
          *,
          rooms(room_code),
          handover_items(*),
          handover_asset_snapshots(*, room_assets(assets(name, qr_code)))
        `)
        .eq('room_id', Number(roomId))
        .order('performed_at', { ascending: false })
    ) as unknown as HandoverRow[];

    return rows.map(toHandoverChecklist);
  },

  checkRoomCodeUnique: async (code: string, buildingId: number): Promise<boolean> => {
    const { data } = await supabase
      .from('rooms')
      .select('id')
      .eq('room_code', code)
      .eq('building_id', buildingId)
      .limit(1);
    return !data || data.length === 0;
  },

  createRoom: async (data: CreateRoomData): Promise<Room> => {
    // BR-001 guard: ensure buildingId is a valid positive integer before insert
    const numBuildingId = Number(data.buildingId);
    if (!Number.isFinite(numBuildingId) || numBuildingId <= 0) {
      throw new Error(
        `[roomService] buildingId không hợp lệ: "${data.buildingId}". Vui lòng chọn tòa nhà trước khi tạo phòng.`
      );
    }

    const row = await unwrap(
      supabase
        .from('rooms')
        .insert({
          building_id: numBuildingId,
          room_code: data.roomCode,
          floor_number: data.floorNumber,
          area_sqm: data.areaSqm,
          room_type: data.roomType,
          max_occupants: data.maxOccupancy,
          has_balcony: data.hasBalcony ?? false,
          facing: data.directionFacing,
          amenities: data.amenities ?? [],
          base_rent: data.baseRentPrice,
          condition_score: data.conditionScore,
          status: mapRoomStatus.toDb(data.status ?? 'Vacant') as DbRoomStatus,
          is_listed: data.isListed ?? false,
        })
        .select('*, buildings(name)')
        .single()
    ) as unknown as RoomRow;

    return toRoom(row);
  },

  updateRoom: async (id: string, data: UpdateRoomData): Promise<Room> => {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      throw new Error(`[roomService] Invalid room id: "${id}"`);
    }
    const row = await unwrap(
      supabase
        .from('rooms')
        .update({
          room_code: data.roomCode,
          floor_number: data.floorNumber,
          area_sqm: data.areaSqm,
          room_type: data.roomType,
          max_occupants: data.maxOccupancy,
          has_balcony: data.hasBalcony,
          facing: data.directionFacing,
          amenities: data.amenities,
          base_rent: data.baseRentPrice,
          condition_score: data.conditionScore,
          status: data.status ? mapRoomStatus.toDb(data.status) as DbRoomStatus : undefined,
          is_listed: data.isListed,
        })
        .eq('id', numId)
        .select('*, buildings(name)')
        .single()
    ) as unknown as RoomRow;

    return toRoom(row);
  },

  deleteRoom: async (id: string): Promise<void> => {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      throw new Error(`[roomService] Invalid room id: "${id}"`);
    }
    await unwrap(
      supabase
        .from('rooms')
        .update({ is_deleted: true })
        .eq('id', numId)
    );
  },

  getAssets: async (filters?: AssetFilters): Promise<Asset[]> => {

    let query = supabase
      .from('room_assets')
      .select('*, assets(id, name, category, qr_code, unit_cost, warranty_months), rooms(room_code)');

    if (filters?.roomId) {
      query = query.eq('room_id', Number(filters.roomId));
    }

    interface RoomAssetJoinRow {
      id: number;
      room_id: number;
      status: string | null;
      purchase_date: string | null;
      warranty_expiry: string | null;
      assets: { id: number; name: string; qr_code: string | null; category: string | null; unit_cost: number | null } | null;
      rooms: { room_code: string } | null;
    }
    const rows = await unwrap(query) as unknown as RoomAssetJoinRow[];
    return rows.map((r) => ({
      id: `room-asset:${r.id}`,
      assetId: String(r.assets?.id ?? r.id),
      roomAssetId: String(r.id),
      assignmentState: 'Assigned' as const,
      assetName: r.assets?.name ?? 'Unknown',
      assetCode: r.assets?.qr_code ?? `RA-${r.id}`,
      type: mapAssetType(r.assets?.category ?? null),
      condition: mapAssetCondition(r.status),
      roomId: String(r.room_id),
      roomCode: r.rooms?.room_code ?? '',
      purchaseDate: r.purchase_date ?? undefined,
      purchasePrice: r.assets?.unit_cost ?? undefined,
      warrantyExpiry: r.warranty_expiry ?? undefined,
    }));
  },

  createHandoverChecklist: async (data: CreateHandoverData): Promise<string> => {
    // Map items to JSONB structure for RPC
    const items = data.sections.flatMap(section => 
      section.items.map(item => ({
        category: section.title,
        item_name: item.name,
        status: item.status === 'OK' ? 'OK' : 'NotOK',
        note: item.note || null,
        photo_urls: item.imageUrl ? [item.imageUrl] : []
      }))
    );

    // Map assets to JSONB structure for RPC
    const assets = data.assets.map(asset => ({
      room_asset_id: Number(asset.id),
      previous_condition_score: mapConditionScore.toNum(asset.conditionBefore),
      current_condition_score: mapConditionScore.toNum(asset.conditionAfter),
      note: asset.note || null
    }));

    const runCreateHandoverChecklist = supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>
    ) => PromiseLike<PostgrestSingleResponse<number>>;

    const result = await unwrap(
      runCreateHandoverChecklist('create_handover_checklist_v1', {
        p_room_id: Number(data.roomId),
        p_contract_id: data.contractId ? Number(data.contractId) : null,
        p_handover_type: mapHandoverType.toDb(data.handoverType),
        p_performed_by: data.performedBy,
        p_tenant_id: data.tenantId || null,
        p_manager_signature: data.managerSignatureUrl || null,
        p_tenant_signature: data.tenantSignatureUrl || null,
        p_notes: data.notes || null,
        p_items: items,
        p_assets: assets
      })
    ) as number;

    return String(result);
  },
};
