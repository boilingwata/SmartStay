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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MeterFilter extends BaseRequestParams {
  buildingId?: string;
  roomId?: string;
  type?: string;
  status?: string;
  missingOnly?: boolean;
  search?: string;
}

// ---------------------------------------------------------------------------
// Internal DB row shapes
// ---------------------------------------------------------------------------

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
  let latestMonthYear: string | undefined;

  if (latestRow) {
    latestIndex =
      type === 'elec' ? latestRow.electricity_current : latestRow.water_current;
    latestMonthYear = latestRow.billing_period?.slice(0, 7) ?? undefined;
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
    latestMonthYear: latestMonthYear,
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

      if (rooms.length === 0) {
        return { data: [], total: 0 };
      }

      const roomIds = rooms.map((r) => r.id);

      // 2. Fetch the latest reading per room (most recent billing_period)
      const latestRows = (await unwrap(
        supabase
          .from('meter_readings')
          .select(
            'id, room_id, billing_period, electricity_current, water_current, reading_date, read_by, electricity_previous, electricity_usage, water_previous, water_usage, created_at'
          )
          .in('room_id', roomIds)
          .order('billing_period', { ascending: false })
      )) as unknown as DbMeterReadingRow[];

      // Keep only the latest row per room
      const latestByRoom = new Map<number, DbMeterReadingRow>();
      for (const row of latestRows) {
        if (!latestByRoom.has(row.room_id)) {
          latestByRoom.set(row.room_id, row);
        }
      }

      const currentMonth = new Date().toISOString().substring(0, 7);

      // 3. Build virtual meters — one elec + one water per room
      const meters: (Meter & { hasReadingThisMonth: boolean })[] = [];

      for (const room of rooms) {
        const latest = latestByRoom.get(room.id) ?? null;
        const hasReading = latest
          ? (latest.billing_period?.slice(0, 7) ?? '') === currentMonth
          : false;

        const types: ('elec' | 'water')[] = ['elec', 'water'];
        for (const t of types) {
          if (params.type) {
            const expectedType: MeterType = t === 'elec' ? 'Electricity' : 'Water';
            if (expectedType !== params.type) continue;
          }
          meters.push({
            ...mapReadingRowToMeter(room, t, latest),
            hasReadingThisMonth: hasReading,
          });
        }
      }

      // 4. missingOnly filter
      let result = meters;
      if (params.missingOnly) {
        result = meters.filter((m) => !m.hasReadingThisMonth);
      }

      // 5. search filter (in-memory, by room code)
      if (params.search) {
        const s = params.search.toLowerCase();
        result = result.filter(
          (m) =>
            (m.roomCode ?? '').toLowerCase().includes(s) ||
            (m.meterCode ?? '').toLowerCase().includes(s)
        );
      }

      // 6. B36 FIX: in-memory pagination
      const total = result.length;
      const page = params.page ?? 1;
      const limit = params.limit ?? total;
      const start = (page - 1) * limit;
      const paged = result.slice(start, start + limit);

      return { data: paged, total };
    } catch (error) {
      return handleServiceError(error, 'Không thể tải danh sách đồng hồ');
    }
  },

  getLatestReading: async (meterId: string): Promise<LatestMeterReading> => {
    try {
      const { roomId, type } = parseVirtualId(meterId);

      const row = (await unwrap(
        supabase
          .from('meter_readings')
          .select(
            'id, room_id, billing_period, electricity_current, electricity_previous, electricity_usage, water_current, water_previous, water_usage, reading_date, created_at'
          )
          .eq('room_id', roomId)
          .order('billing_period', { ascending: false })
          .limit(1)
          .maybeSingle()
      )) as unknown as DbMeterReadingRow | null;

      if (!row) {
        return { meterId, currentIndex: 0, monthYear: '', readingDate: '', consumption: 0 };
      }

      const isElec = type === 'Electricity';
      const current = isElec ? row.electricity_current : row.water_current;
      const previous = isElec ? row.electricity_previous : row.water_previous;
      const usage = isElec
        ? (row.electricity_usage ?? current - previous)
        : (row.water_usage ?? current - previous);

      return {
        meterId,
        currentIndex: current,
        monthYear: row.billing_period?.slice(0, 7) ?? '',
        readingDate: row.reading_date,
        consumption: usage,
      };
    } catch (error) {
      return handleServiceError(error, 'Không thể tải chỉ số mới nhất');
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

      // Find the previous reading to set previous index
      const prevRow = (await unwrap(
        supabase
          .from('meter_readings')
          .select(
            'electricity_current, water_current, electricity_previous, water_previous'
          )
          .eq('room_id', roomId)
          .order('billing_period', { ascending: false })
          .limit(1)
          .maybeSingle()
      )) as unknown as Pick<
        DbMeterReadingRow,
        'electricity_current' | 'water_current' | 'electricity_previous' | 'water_previous'
      > | null;

      const isElec = type === 'Electricity';
      const prevElec = prevRow?.electricity_current ?? 0;
      const prevWater = prevRow?.water_current ?? 0;

      const billingPeriod = `${body.monthYear}-01`;

      const insertData = {
        room_id: roomId,
        billing_period: billingPeriod,
        reading_date: body.readingDate,
        electricity_previous: isElec ? prevElec : prevElec,
        electricity_current: isElec ? body.currentIndex : prevElec,
        electricity_usage: isElec ? body.currentIndex - prevElec : 0,
        water_previous: !isElec ? prevWater : prevWater,
        water_current: !isElec ? body.currentIndex : prevWater,
        water_usage: !isElec ? body.currentIndex - prevWater : 0,
        note: body.note,
        reading_image_url: body.readingImageUrl,
      };

      // C-08: Use select-then-update/insert instead of upsert to avoid depending on
      // a UNIQUE(room_id, billing_period) DB constraint that may not exist.
      const existingRow = (await unwrap(
        supabase
          .from('meter_readings')
          .select('id')
          .eq('room_id', roomId)
          .eq('billing_period', billingPeriod)
          .maybeSingle()
      )) as unknown as { id: number } | null;

      let row: DbMeterReadingRow;

      if (existingRow) {
        // Update the existing reading for this period
        row = (await unwrap(
          supabase
            .from('meter_readings')
            .update(insertData)
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
            .insert(insertData)
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
};

export default meterService;
