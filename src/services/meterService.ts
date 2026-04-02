import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import {
  Meter,
  MeterType,
  MeterReading,
  LatestMeterReading,
} from '@/models/Meter';
import { handleServiceError } from '@/utils/errorUtils';
import { BaseRequestParams } from '@/types/api';

export interface MeterFilter extends BaseRequestParams {
  buildingId?: string;
  roomId?: string;
  type?: string;
  status?: string;
  missingOnly?: boolean;
  search?: string;
}

interface DbMeterReadingRow {
  id: number;
  room_id: number;
  billing_period: string;
  electricity_previous: number;
  electricity_current: number;
  electricity_usage: number | null;
  water_previous: number;
  water_current: number;
  water_usage: number | null;
  reading_date: string;
  read_by: string | null;
  created_at: string | null;
  rooms: {
    room_code: string;
    building_id: number;
    buildings: { name: string };
  } | null;
}

interface DbLatestViewRow {
  MeterId: string;
  CurrentIndex: number;
  Usage: number;
  BillingPeriod: string;
  ReadingDate: string;
  ReadingId: number;
}

interface DbRoomRow {
  id: number;
  room_code: string;
  building_id: number;
  buildings: { name: string } | null;
}

// ---------------------------------------------------------------------------
// Virtual meter helpers
//
// The DB has one row per room per billing period containing both electricity
// and water readings. The frontend models them as separate virtual meters.
// Virtual meter IDs: `{room_id}-elec` and `{room_id}-water`
// ---------------------------------------------------------------------------

function parseVirtualId(virtualId: string): { roomId: number; type: MeterType } {
  const [roomPart, typePart] = virtualId.split('-');
  return {
    roomId: Number(roomPart),
    type: typePart === 'elec' ? 'Electricity' : 'Water',
  };
}

function makeVirtualId(roomId: number, type: 'elec' | 'water'): string {
  return `${roomId}-${type}`;
}

function mapReadingRowToMeter(
  room: DbRoomRow,
  type: 'elec' | 'water',
  latestRow: DbMeterReadingRow | null
): Meter {
  const virtualId = makeVirtualId(room.id, type);
  const meterType: MeterType = type === 'elec' ? 'Electricity' : 'Water';

  let latestIndex: number | undefined;
  let previousIndex: number | undefined;
  let usage: number | undefined;
  let latestMonthYear: string | undefined;
  let readingDate: string | undefined;

  if (latestRow) {
    const isElec = type === 'elec';
    latestIndex = isElec ? latestRow.electricity_current : latestRow.water_current;
    previousIndex = isElec ? latestRow.electricity_previous : latestRow.water_previous;
    usage = isElec ? (latestRow.electricity_usage ?? latestIndex - previousIndex) : (latestRow.water_usage ?? latestIndex - previousIndex);
    latestMonthYear = latestRow.billing_period?.slice(0, 7) ?? undefined;
    readingDate = latestRow.reading_date;
  }

  return {
    id: virtualId,
    meterCode: `${room.room_code}-${type.toUpperCase()}`,
    meterType,
    meterStatus: 'Active',
    buildingId: String(room.building_id),
    buildingName: room.buildings?.name ?? undefined,
    roomId: String(room.id),
    roomCode: room.room_code,
    latestReadingIndex: latestIndex,
    previousReadingIndex: previousIndex,
    usage: usage,
    latestMonthYear: latestMonthYear,
    readingDate: readingDate,
  };
}

function mapReadingRowToMeterReading(
  row: DbMeterReadingRow,
  type: 'elec' | 'water'
): MeterReading {
  const virtualId = makeVirtualId(row.room_id, type);
  const isElec = type === 'elec';
  const previous = isElec ? row.electricity_previous : row.water_previous;
  const current = isElec ? row.electricity_current : row.water_current;
  const usage = isElec ? (row.electricity_usage ?? current - previous) : (row.water_usage ?? current - previous);

  return {
    id: `${row.id}-${type}`,
    meterId: virtualId,
    monthYear: row.billing_period?.slice(0, 7) ?? '',
    readingDate: row.reading_date,
    previousIndex: previous,
    currentIndex: current,
    consumption: usage,
    recordedById: row.read_by ?? '',
    createdAt: row.created_at ?? row.reading_date,
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const meterService = {
  getMeters: async (params: MeterFilter = {}) => {
    try {
      // 1. Fetch rooms (optionally filtered by building/room)
      let roomQuery = supabase
        .from('rooms')
        .select('id, room_code, building_id, buildings ( name )')
        .order('room_code', { ascending: true });

      if (params.buildingId) {
        const numBuildingId = Number(params.buildingId);
        if (Number.isFinite(numBuildingId)) {
          roomQuery = roomQuery.eq('building_id', numBuildingId);
        }
      }
      if (params.roomId) {
        const numRoomId = Number(params.roomId);
        if (Number.isFinite(numRoomId)) {
          roomQuery = roomQuery.eq('id', numRoomId);
        }
      }

      const rooms = (await unwrap(roomQuery)) as unknown as DbRoomRow[];
      if (rooms.length === 0) return { data: [], total: 0 };

      const roomIds = rooms.map((r) => r.id);

      // 2. RULE-01: Fetch from vw_LatestMeterReading instead of raw table
      const { data: latestRows } = await (supabase.from as any)('vw_LatestMeterReading')
        .select('*')
        .in('MeterId', [
          ...roomIds.map(id => `${id}-elec`),
          ...roomIds.map(id => `${id}-water`)
        ]);

      const latestMap = new Map<string, DbLatestViewRow>();
      (latestRows || []).forEach((row: any) => {
        latestMap.set(row.MeterId, row as DbLatestViewRow);
      });

      const currentMonth = new Date().toISOString().substring(0, 7);

      // 3. Build virtual meters
      const meters: (Meter & { hasReadingThisMonth: boolean })[] = [];

      for (const room of rooms) {
        const types: ('elec' | 'water')[] = ['elec', 'water'];
        
        for (const t of types) {
          if (params.type) {
            const expectedType: MeterType = t === 'elec' ? 'Electricity' : 'Water';
            if (expectedType !== params.type) continue;
          }

          const vId = makeVirtualId(room.id, t);
          const latest = latestMap.get(vId);
          const hasReading = latest?.BillingPeriod?.slice(0, 7) === currentMonth;

          meters.push({
            id: vId,
            meterCode: `${room.room_code}-${t.toUpperCase()}`,
            meterType: t === 'elec' ? 'Electricity' : 'Water',
            meterStatus: 'Active',
            buildingId: String(room.building_id),
            buildingName: room.buildings?.name ?? undefined,
            roomId: String(room.id),
            roomCode: room.room_code,
            latestReadingIndex: latest?.CurrentIndex,
            usage: latest?.Usage,
            latestMonthYear: latest?.BillingPeriod?.slice(0, 7),
            readingDate: latest?.ReadingDate,
            hasReadingThisMonth: hasReading,
          });
        }
      }

      // 4. Filters & Pagination
      let result = meters;
      if (params.missingOnly) result = meters.filter((m) => !m.hasReadingThisMonth);
      if (params.search) {
        const s = params.search.toLowerCase();
        result = result.filter(m => 
          (m.roomCode ?? '').toLowerCase().includes(s) || 
          (m.meterCode ?? '').toLowerCase().includes(s)
        );
      }

      const total = result.length;
      const page = params.page ?? 1;
      const limit = params.limit ?? total;
      const start = (page - 1) * limit;
      
      return { data: result.slice(start, start + limit), total };
    } catch (error) {
      return handleServiceError(error, 'Không thể tải danh sách đồng hồ');
    }
  },

  getLatestReading: async (meterId: string): Promise<LatestMeterReading> => {
    try {
      // RULE-01: Direct query from view
      const row = (await unwrap(
        (supabase.from as any)('vw_LatestMeterReading')
          .select('*')
          .eq('MeterId', meterId)
          .maybeSingle()
      )) as unknown as DbLatestViewRow | null;

      if (!row) {
        return { meterId, currentIndex: 0, monthYear: '', readingDate: '', consumption: 0 };
      }

      return {
        meterId,
        currentIndex: row.CurrentIndex,
        monthYear: row.BillingPeriod?.slice(0, 7) ?? '',
        readingDate: row.ReadingDate,
        consumption: row.Usage,
      };
    } catch (error) {
      return handleServiceError(error, 'Không thể tải chỉ số mới nhất (Rule-01)');
    }
  },

  getLatestReadingsBulk: async (meterIds: string[]): Promise<Record<string, LatestMeterReading>> => {
    try {
      if (meterIds.length === 0) return {};
      
      const { data } = await (supabase.from as any)('vw_LatestMeterReading')
        .select('*')
        .in('MeterId', meterIds);

      const result: Record<string, LatestMeterReading> = {};
      (data || []).forEach((row: any) => {
        result[row.MeterId] = {
          meterId: row.MeterId,
          currentIndex: row.CurrentIndex,
          monthYear: row.BillingPeriod?.slice(0, 7) ?? '',
          readingDate: row.ReadingDate,
          consumption: row.Usage,
        };
      });

      return result;
    } catch (error) {
      console.error('Bulk fetch failed', error);
      return {};
    }
  },

  getReadings: async (
    params: { meterId: string; monthYear?: string } & BaseRequestParams
  ) => {
    try {
      const { roomId, type } = parseVirtualId(params.meterId);

      let query = supabase
        .from('meter_readings')
        .select(
          'id, room_id, billing_period, electricity_previous, electricity_current, electricity_usage, water_previous, water_current, water_usage, reading_date, read_by, created_at'
        )
        .eq('room_id', roomId)
        .order('billing_period', { ascending: false });

      if (params.monthYear) {
        query = query.like('billing_period', `${params.monthYear}%`);
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      const rows = (await unwrap(query)) as unknown as DbMeterReadingRow[];
      const typeKey: 'elec' | 'water' = type === 'Electricity' ? 'elec' : 'water';
      const readings: MeterReading[] = rows.map((r) =>
        mapReadingRowToMeterReading(r, typeKey)
      );

      return { data: readings, total: readings.length };
    } catch (error) {
      return handleServiceError(error, 'Không thể tải lịch sử chỉ số');
    }
  },

  submitReading: async (body: {
    meterId: string;
    monthYear: string;
    currentIndex: number;
    readingDate: string;
    note?: string;
    readingImageUrl?: string;
  }) => {
    try {
      const { roomId, type } = parseVirtualId(body.meterId);
      const billingPeriod = `${body.monthYear}-01`;
      const isElec = type === 'Electricity';

      // Load both the current-period row and the latest earlier row so we can
      // preserve the sibling utility and compute usage from the true previous period.
      const [existingRow, previousRow] = await Promise.all([
        unwrap(
          supabase
            .from('meter_readings')
            .select(
              'id, room_id, billing_period, electricity_previous, electricity_current, electricity_usage, water_previous, water_current, water_usage, reading_date, read_by, created_at'
            )
            .eq('room_id', roomId)
            .eq('billing_period', billingPeriod)
            .maybeSingle()
        ) as Promise<DbMeterReadingRow | null>,
        unwrap(
          supabase
            .from('meter_readings')
            .select(
              'id, room_id, billing_period, electricity_previous, electricity_current, electricity_usage, water_previous, water_current, water_usage, reading_date, read_by, created_at'
            )
            .eq('room_id', roomId)
            .lt('billing_period', billingPeriod)
            .order('billing_period', { ascending: false })
            .limit(1)
            .maybeSingle()
        ) as Promise<DbMeterReadingRow | null>,
      ]);

      const previousElectricity = existingRow?.electricity_previous ?? previousRow?.electricity_current ?? 0;
      const previousWater = existingRow?.water_previous ?? previousRow?.water_current ?? 0;
      const nextElectricity = isElec
        ? body.currentIndex
        : (existingRow?.electricity_current ?? previousRow?.electricity_current ?? 0);
      const nextWater = isElec
        ? (existingRow?.water_current ?? previousRow?.water_current ?? 0)
        : body.currentIndex;

      const payload = {
        room_id: roomId,
        billing_period: billingPeriod,
        reading_date: body.readingDate,
        previous_reading_id: previousRow?.id ?? null,
        electricity_previous: previousElectricity,
        electricity_current: nextElectricity,
        electricity_usage: Math.max(0, nextElectricity - previousElectricity),
        water_previous: previousWater,
        water_current: nextWater,
        water_usage: Math.max(0, nextWater - previousWater),
        note: body.note,
        reading_image_url: body.readingImageUrl,
      };

      let row: DbMeterReadingRow;

      if (existingRow) {
        // Update the existing reading for this period
        row = (await unwrap(
          supabase
            .from('meter_readings')
            .update(payload)
            .eq('id', existingRow.id)
            .select(
              'id, room_id, billing_period, electricity_previous, electricity_current, electricity_usage, water_previous, water_current, water_usage, reading_date, read_by, created_at'
            )
            .single()
        )) as unknown as DbMeterReadingRow;
      } else {
        // Insert a new reading for this period
        row = (await unwrap(
          supabase
            .from('meter_readings')
            .insert(payload)
            .select(
              'id, room_id, billing_period, electricity_previous, electricity_current, electricity_usage, water_previous, water_current, water_usage, reading_date, read_by, created_at'
            )
            .single()
        )) as unknown as DbMeterReadingRow;
      }

      const typeKey: 'elec' | 'water' = isElec ? 'elec' : 'water';
      return mapReadingRowToMeterReading(row, typeKey);
    } catch (error) {
      return handleServiceError(error, 'Không thể gửi chỉ số mới');
    }
  },

  getMeterStatistics: async (params: { buildingId?: string } = {}) => {
    try {
      // 1. Efficiently get total rooms for given building
      let roomQuery = supabase.from('rooms').select('id', { count: 'exact', head: true });
      if (params.buildingId) {
        roomQuery = roomQuery.eq('building_id', Number(params.buildingId));
      }
      const { count: totalRooms } = await roomQuery;
      const total = (totalRooms || 0) * 2; // Elec + Water per room

      // 2. RULE-01: Use view to check current month completeness
      const currentMonth = new Date().toISOString().substring(0, 7);
      
      const { data: latestRows } = await (supabase.from as any)('vw_LatestMeterReading')
        .select('MeterId, BillingPeriod');

      const activeRows = latestRows || [];
      const roomsWithReading = new Set(
        activeRows
          .filter((r: any) => r.BillingPeriod?.startsWith(currentMonth))
          .map((r: any) => r.MeterId.split('-')[0])
      );

      const missingCount = (totalRooms || 0) - roomsWithReading.size;

      return {
        total,
        electricity: totalRooms || 0,
        water: totalRooms || 0,
        missing: Math.max(0, missingCount * 2),
      };
    } catch (error) {
      return { total: 0, electricity: 0, water: 0, missing: 0 };
    }
  }
};

export default meterService;
