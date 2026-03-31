import {
  Room, RoomDetail, RoomStatus, RoomType,
  HandoverChecklist, RoomStatusHistory, RoomMeter, RoomAsset,
  RoomFilters, CreateRoomData, UpdateRoomData, AssetFilters
} from '@/models/Room';

import { Asset } from '@/models/Asset';
import { supabase } from '@/lib/supabase';
import { unwrap, buildingScoped } from '@/lib/supabaseHelpers';
import { mapRoomStatus, mapAssetStatus } from '@/lib/enumMaps';
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
  is_deleted: boolean | null
  buildings?: { name: string } | null
}

interface RoomAssetRow {
  id: number
  serial_number: string | null
  status: string | null
  condition_score: number | null
  purchase_date: string | null
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

interface MeterReadingRow {
  id: number
  room_id: number
  billing_period: string
  electricity_previous: number
  electricity_current: number
  water_previous: number
  water_current: number
  reading_date: string
}

// --- Transformers ---

function toRoom(row: RoomRow): Room {
  return {
    id: String(row.id),
    roomCode: row.room_code,
    buildingId: String(row.building_id),
    buildingName: (row.buildings as { name?: string } | null)?.name ?? '',
    floorNumber: row.floor_number ?? 1,
    roomType: (row.room_type ?? 'Studio') as RoomType,
    areaSqm: row.area_sqm ?? 0,
    baseRentPrice: row.base_rent ?? 0,
    status: mapRoomStatus.fromDb(row.status ?? 'available') as RoomStatus,
    hasMeter: true, // assume all rooms have meters
  };
}

function toRoomDetail(row: RoomRow, assets: RoomAssetRow[], history: StatusHistoryRow[], meters: RoomMeter[]): RoomDetail {
  const room = toRoom(row);
  const amenities = Array.isArray(row.amenities) ? (row.amenities as string[]) : [];
  return {
    ...room,
    maxOccupancy: row.max_occupants ?? 2,
    furnishing: 'Unfurnished',
    directionFacing: ((row.facing as string | null) ?? 'N') as import('@/models/Room').DirectionFacing,
    hasBalcony: row.has_balcony ?? false,
    conditionScore: row.condition_score ?? 5,
    images: [],
    amenities,
    meters,
    assets: assets.map(toRoomAsset),
    statusHistory: history.map(toStatusHistory),
  };
}

function toRoomAsset(row: RoomAssetRow): RoomAsset {
  return {
    id: String(row.id),
    assetName: row.assets?.name ?? 'Unknown',
    assetCode: row.assets?.qr_code ?? `A${row.id}`,
    type: row.assets?.category ?? 'Other',
    condition: (mapAssetStatus.fromDb(row.status ?? 'in_use') as RoomAsset['condition']),
    assignedAt: row.created_at ?? '',
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

/** Convert meter_readings rows into virtual RoomMeter objects (1 per type per room). */
function toMeters(readings: MeterReadingRow[], roomId: number): RoomMeter[] {
  if (readings.length === 0) return [];

  // Use the most recent reading
  const latest = readings[0];
  return [
    {
      id: `${roomId}-elec`,
      meterCode: `E-${roomId}`,
      meterType: 'Electricity',
      currentIndex: latest.electricity_current,
      lastReadingDate: latest.reading_date,
      history: readings.map(r => ({
        month: r.billing_period,
        value: r.electricity_current - r.electricity_previous,
      })),
    },
    {
      id: `${roomId}-water`,
      meterCode: `W-${roomId}`,
      meterType: 'Water',
      currentIndex: latest.water_current,
      lastReadingDate: latest.reading_date,
      history: readings.map(r => ({
        month: r.billing_period,
        value: r.water_current - r.water_previous,
      })),
    },
  ];
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

    if (filters?.roomType) {
      query = query.eq('room_type', filters.roomType);
    }

    if (filters?.minFloor !== undefined) query = query.gte('floor_number', filters.minFloor);
    if (filters?.maxFloor !== undefined) query = query.lte('floor_number', filters.maxFloor);
    if (filters?.minArea !== undefined) query = query.gte('area_sqm', filters.minArea);
    if (filters?.maxArea !== undefined) query = query.lte('area_sqm', filters.maxArea);
    if (filters?.minPrice !== undefined) query = query.gte('base_rent', filters.minPrice);
    if (filters?.maxPrice !== undefined) query = query.lte('base_rent', filters.maxPrice);

    const rows = await unwrap(query) as unknown as RoomRow[];
    return rows.map(toRoom);
  },

  getRoomDetail: async (id: string): Promise<RoomDetail> => {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      throw new Error(`[roomService] Invalid room id: "${id}"`);
    }

    // Fetch room, assets, history, meters, and images in parallel
    const [row, assetRows, historyRows, meterRows, imageRows] = await Promise.all([
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
          .select('*, assets(id, name, category, qr_code)')
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

      unwrap(
        supabase
          .from('meter_readings')
          .select('*')
          .eq('room_id', numId)
          .order('reading_date', { ascending: false })
          .limit(12)
      ) as unknown as Promise<MeterReadingRow[]>,

      supabase
        .from('room_images')
        .select('id, url, is_main, sort_order')
        .eq('room_id', numId)
        .order('sort_order', { ascending: true })
        .then(({ data }) => (data ?? []) as { id: number; url: string; is_main: boolean; sort_order: number }[]),
    ]);

    const meters = toMeters(meterRows, numId);
    const detail = toRoomDetail(row, assetRows, historyRows, meters);
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

  getRoomHandoverChecklist: async (_roomId: string): Promise<HandoverChecklist[]> => {
    // No handover_checklists table in DB — return empty for now
    return [];
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
        })
        .eq('id', numId)
        .select('*, buildings(name)')
        .single()
    ) as unknown as RoomRow;

    return toRoom(row);
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
      assets: { name: string; qr_code: string | null; category: string | null; unit_cost: number | null } | null;
      rooms: { room_code: string } | null;
    }
    const rows = await unwrap(query) as unknown as RoomAssetJoinRow[];
    return rows.map((r) => ({
      id: String(r.id),
      assetName: r.assets?.name ?? 'Unknown',
      assetCode: r.assets?.qr_code ?? `A${r.id}`,
      type: (r.assets?.category ?? 'Other') as Asset['type'],
      condition: mapAssetStatus.fromDb(r.status ?? 'in_use') as Asset['condition'],
      roomId: String(r.room_id),
      roomCode: r.rooms?.room_code ?? '',
      purchaseDate: r.purchase_date ?? undefined,
      purchasePrice: r.assets?.unit_cost ?? undefined,
      warrantyExpiry: r.warranty_expiry ?? undefined,
    }));
  },
};
