import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { MeterReading, ConsumptionStats } from '@/models/Meter';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getCurrentTenantId(): Promise<number | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id')
    .eq('profile_id', user.id)
    .eq('is_deleted', false)
    .limit(1);

  return tenants?.[0]?.id ?? null;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const portalMeterService = {
  /**
   * RULE-01: Meter Readings. Since we cannot create views in read-only mode,
   * we fetch from smartstay.meter_readings directly and pick the latest.
   */
  getLatestReading: async (type: 'Electricity' | 'Water'): Promise<MeterReading | null> => {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return null;

    // 1. Get the current active contract for this tenant to find their room
    const { data: contracts } = await supabase
      .from('contracts')
      .select('room_id')
      .eq('tenant_id', tenantId)
      .eq('status', 'active') 
      .limit(1);

    const roomId = contracts?.[0]?.room_id;
    if (!roomId) return null;

    // 2. Get latest reading from meter_readings table
    const { data: readings } = await supabase
      .from('meter_readings')
      .select('*')
      .eq('room_id', roomId)
      .order('reading_date', { ascending: false })
      .limit(1);

    const row = readings?.[0];
    if (!row) return null;

    return {
      id: String(row.id),
      meterId: type,
      monthYear: row.billing_period,
      readingDate: row.reading_date,
      currentIndex: type === 'Electricity' ? row.electricity_current : row.water_current,
      previousIndex: type === 'Electricity' ? row.electricity_previous : row.water_previous,
      consumption: (type === 'Electricity' ? row.electricity_usage : row.water_usage) ?? 0,
      recordedById: row.read_by ?? '',
      createdAt: row.created_at ?? new Date().toISOString(),
    };
  },

  getReadingHistory: async (type: 'Electricity' | 'Water', limit: number = 6): Promise<MeterReading[]> => {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return [];

    // 1. Get the current active contract for this tenant to find their room
    const { data: contracts } = await supabase
      .from('contracts')
      .select('room_id')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .limit(1);

    const roomId = contracts?.[0]?.room_id;
    if (!roomId) return [];

    // 2. Get history from meter_readings table
    const { data: rows } = await supabase
      .from('meter_readings')
      .select('*')
      .eq('room_id', roomId)
      .order('reading_date', { ascending: false })
      .limit(limit);

    return (rows || []).map(row => ({
      id: String(row.id),
      meterId: type,
      monthYear: row.billing_period,
      readingDate: row.reading_date,
      currentIndex: type === 'Electricity' ? row.electricity_current : row.water_current,
      previousIndex: type === 'Electricity' ? row.electricity_previous : row.water_previous,
      consumption: (type === 'Electricity' ? row.electricity_usage : row.water_usage) ?? 0,
      recordedById: row.read_by ?? '',
      createdAt: row.created_at ?? new Date().toISOString(),
    }));
  },


  getConsumptionStats: async (): Promise<ConsumptionStats> => {
    // This is used for a high-level summary if needed.
    const elec = await portalMeterService.getLatestReading('Electricity');
    const water = await portalMeterService.getLatestReading('Water');

    return {
      electric: {
        current: elec?.currentIndex ?? 0,
        usage: elec?.consumption ?? 0,
        unit: 'kWh',
        trend: 0
      },
      water: {
        current: water?.currentIndex ?? 0,
        usage: water?.consumption ?? 0,
        unit: 'm3',
        trend: 0
      }
    };
  }
};

