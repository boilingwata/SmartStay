import {
  KPIData,
  RevenueDataPoint,
  OccupancyData,
  RecentPayment,
  RecentTicket,
  ElectricityDataPoint,
  AnalyticsAlert,
} from '../models/Dashboard';
import { supabase } from '@/lib/supabase';
import { mapTicketStatus, mapPriority, mapPaymentMethod } from '@/lib/enumMaps';

// ─── types ──────────────────────────────────────────────────────────────────

interface RawRoom {
  id: number;
  status: string | null;
}

interface RawInvoice {
  id: number;
  status: string | null;
  total_amount: number | null;
  contract_id: number;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function countByClean<T>(arr: T[], key: keyof T): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of arr) {
    const val = String(item[key] ?? 'unknown');
    counts[val] = (counts[val] ?? 0) + 1;
  }
  return counts;
}

const processTickets = (data: any[] | null): RecentTicket[] => {
  return ((data ?? []) as any[]).map((r) => {
    const room = r.rooms ?? {};
    const assignee = r.profiles ?? {};
    const priority = mapPriority.fromDb(r.priority ?? 'normal') as RecentTicket['priority'];
    
    // Dynamic SLA calculation based on priority
    const createdAt = new Date(r.created_at ?? Date.now());
    let slaHours = 24;
    if (priority === 'Critical') slaHours = 4;
    if (priority === 'High') slaHours = 12;
    if (priority === 'Low') slaHours = 72;
    
    const slaDeadline = new Date(createdAt.getTime() + slaHours * 60 * 60 * 1000).toISOString();

    return {
      id: String(r.id),
      ticketCode: r.ticket_code ?? String(r.id),
      title: r.subject ?? '',
      roomName: room.room_code ?? 'N/A',
      priority,
      status: mapTicketStatus.fromDb(r.status ?? 'new') as RecentTicket['status'],
      assignedTo: assignee.full_name ?? undefined,
      createdAt: createdAt.toISOString(),
      slaDeadline,
    } satisfies RecentTicket;
  });
};

// ─── service ────────────────────────────────────────────────────────────────

export const dashboardService = {
  getKPIs: async (buildingId?: string | number): Promise<KPIData> => {
    const numBid = buildingId ? Number(buildingId) : null;
    const isFiltered = numBid !== null && !isNaN(numBid);

    // 1. Total Buildings (only 1 if filtered)
    let buildingsQuery = supabase.from('buildings').select('id', { count: 'exact', head: true }).eq('is_deleted', false);
    if (isFiltered) buildingsQuery = buildingsQuery.eq('id', numBid);

    // 2. Rooms aggregate
    let roomsQuery = supabase.from('rooms').select('id, status').eq('is_deleted', false);
    if (isFiltered) roomsQuery = roomsQuery.eq('building_id', numBid);

    // 3. Active Contracts
    let contractsQuery = supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('is_deleted', false);
    if (isFiltered) {
      const { data: roomIds } = await supabase.from('rooms').select('id').eq('building_id', numBid).eq('is_deleted', false);
      const ids = (roomIds || []).map(r => r.id);
      contractsQuery = contractsQuery.in('room_id', ids);
    }

    // 4. Invoices (for Overdue Balance)
    let invoicesQuery = supabase.from('invoices').select('id, status, total_amount, contract_id').neq('status', 'cancelled');
    if (isFiltered) {
      const { data: roomIds } = await supabase.from('rooms').select('id').eq('building_id', numBid).eq('is_deleted', false);
      const rIds = (roomIds || []).map(r => r.id);
      const { data: contractIds } = await supabase.from('contracts').select('id').in('room_id', rIds).eq('is_deleted', false);
      const cIds = (contractIds || []).map(c => c.id);
      invoicesQuery = invoicesQuery.in('contract_id', cIds);
    }

    // 5. Open Tickets
    let ticketsQuery = supabase.from('tickets').select('id', { count: 'exact', head: true }).in('status', ['new', 'in_progress', 'pending_confirmation']);
    if (isFiltered) {
       const { data: roomIds } = await supabase.from('rooms').select('id').eq('building_id', numBid).eq('is_deleted', false);
       ticketsQuery = ticketsQuery.in('room_id', (roomIds || []).map(r => r.id));
    }

    const [
      buildingsResult,
      roomsResult,
      contractsResult,
      invoicesResult,
      ticketsResult,
    ] = await Promise.allSettled([
      buildingsQuery,
      roomsQuery,
      contractsQuery,
      invoicesQuery,
      ticketsQuery,
    ]);

    const getVal = <T>(res: PromiseSettledResult<{ data: T | null; count: number | null }>) => 
      res.status === 'fulfilled' ? res.value : { data: null, count: null };

    const bRes = getVal(buildingsResult as any);
    const rRes = getVal(roomsResult as any);
    const cRes = getVal(contractsResult as any);
    const iRes = getVal(invoicesResult as any);
    const tRes = getVal(ticketsResult as any);

    const totalBuildings = bRes.count ?? 0;
    const rooms = (rRes.data || []) as RawRoom[];
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    const activeContracts = cRes.count ?? 0;
    const openTickets = tRes.count ?? 0;

    const invoices = (iRes.data || []) as RawInvoice[];
    const totalOverdueBalance = invoices
      .filter(i => i.status === 'overdue')
      .reduce((sum, i) => sum + (i.total_amount || 0), 0);

    // Current Month Revenue (Paid only)
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    let revenueQuery = supabase.from('invoices').select('total_amount').eq('status', 'paid').gte('paid_date', monthStart);
    if (isFiltered) {
       const { data: rIds } = await supabase.from('rooms').select('id').eq('building_id', numBid).eq('is_deleted', false);
       const ids = (rIds || []).map(r => r.id);
       const { data: cIds } = await supabase.from('contracts').select('id').in('room_id', ids).eq('is_deleted', false);
       revenueQuery = revenueQuery.in('contract_id', (cIds || []).map(c => c.id));
    }
    const { data: revData } = await revenueQuery;
    const currentMonthRevenue = (revData || []).reduce((sum, i) => sum + (i.total_amount || 0), 0);

    return {
      totalBuildings,
      totalRooms,
      occupiedRooms,
      occupancyRate,
      currentMonthRevenue,
      totalOverdueBalance,
      activeContracts,
      openTickets,
      deltas: {
        totalBuildings: isFiltered ? 0 : 2,
        occupancyRate: 5,
        currentMonthRevenue: 12,
        totalOverdueBalance: -8
      },
    };
  },

  getRevenueChart: async (buildingId?: string | number, months: number = 12): Promise<RevenueDataPoint[]> => {
    const numBid = buildingId ? Number(buildingId) : null;
    const isFiltered = numBid !== null && !isNaN(numBid);

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const cutoffYYYYMM = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}`;

    let query = supabase
      .from('invoices')
      .select('total_amount, billing_period, status')
      .eq('status', 'paid')
      .gte('billing_period', `${cutoffYYYYMM}-01`);

    if (isFiltered) {
      const { data: rooms } = await supabase.from('rooms').select('id').eq('building_id', numBid);
      const roomIds = (rooms || []).map(r => r.id);
      const { data: contracts } = await supabase.from('contracts').select('id').in('room_id', roomIds);
      query = query.in('contract_id', (contracts || []).map(c => c.id));
    }

    const { data } = await query;

    const byMonth: Record<string, number> = {};
    for (const row of (data ?? []) as { total_amount: number | null; billing_period: string | null }[]) {
      if (!row.billing_period) continue;
      const label = row.billing_period.slice(0, 7);
      byMonth[label] = (byMonth[label] ?? 0) + (row.total_amount ?? 0);
    }

    const result: RevenueDataPoint[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const revenue = byMonth[label] ?? 0;
      result.push({ month: label, revenue, profit: Math.round(revenue * 0.3) });
    }

    return result;
  },

  getOccupancy: async (buildingId?: string | number): Promise<OccupancyData> => {
    let query = supabase
      .from('rooms')
      .select('status')
      .eq('is_deleted', false);

    const numBid = buildingId ? Number(buildingId) : null;
    if (numBid && !isNaN(numBid)) {
      query = query.eq('building_id', numBid);
    }

    const { data } = await query;
    const rows = (data ?? []) as { status: string | null }[];
    const counts = countByClean(rows, 'status');

    const occupied = counts['occupied'] ?? 0;
    const vacant = counts['available'] ?? 0;
    const maintenance = counts['maintenance'] ?? 0;
    const reserved = counts['reserved'] ?? 0;
    const total = occupied + vacant + maintenance + reserved;

    return {
      occupied,
      vacant,
      maintenance,
      reserved,
      totalOccupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
    };
  },

  getRecentPayments: async (buildingId?: string | number): Promise<RecentPayment[]> => {
    const numBid = buildingId ? Number(buildingId) : null;
    const isFiltered = numBid !== null && !isNaN(numBid);

    let query = supabase
      .from('payments')
      .select('id, reference_number, amount, method, payment_date, confirmed_at, invoices!inner(contracts!inner(contract_tenants!inner(tenants!inner(full_name))))')
      .order('payment_date', { ascending: false })
      .limit(10);

    if (isFiltered) {
       query = query.eq('invoices.contracts.rooms.building_id', numBid);
    }

    const { data } = await query;

    return ((data ?? []) as any[]).map((r) => {
      const invoice = r.invoices ?? {};
      const contract = invoice.contracts ?? {};
      const contractTenants = contract.contract_tenants ?? [];
      const primaryTenant = contractTenants[0] as any;
      const tenant = primaryTenant?.tenants ?? {};

      const paymentMethod = r.method as string || 'cash';
      let method: RecentPayment['method'] = 'Cash';
      if (paymentMethod === 'bank_transfer' || paymentMethod === 'stripe') method = 'Bank';
      else if (paymentMethod === 'vnpay') method = 'VNPay';
      else if (paymentMethod === 'momo') method = 'MoMo';
      else if (paymentMethod === 'zalopay') method = 'Zalo';

      return {
        id: String(r.id),
        transactionCode: r.reference_number ?? String(r.id),
        tenantName: tenant.full_name ?? 'Unknown',
        amount: r.amount ?? 0,
        method,
        status: r.confirmed_at ? 'Confirmed' : 'Pending',
        createdAt: r.payment_date ?? new Date().toISOString(),
      } satisfies RecentPayment;
    });
  },

  getRecentTickets: async (buildingId?: string | number): Promise<RecentTicket[]> => {
    const numBid = buildingId ? Number(buildingId) : null;
    if (numBid && !isNaN(numBid)) {
      const { data: rooms } = await supabase.from('rooms').select('id').eq('building_id', numBid);
      const roomIds = (rooms || []).map(r => r.id);
      
      const { data } = await supabase
        .from('tickets')
        .select('id, ticket_code, subject, priority, status, created_at, rooms(room_code), profiles:assigned_to(full_name)')
        .in('room_id', roomIds)
        .order('created_at', { ascending: false })
        .limit(10);
      
      return processTickets(data);
    }

    const { data } = await supabase
      .from('tickets')
      .select('id, ticket_code, subject, priority, status, created_at, rooms(room_code), profiles:assigned_to(full_name)')
      .order('created_at', { ascending: false })
      .limit(10);

    return processTickets(data);
  },

  getElectricityChart: async (buildingId?: string | number, months: number = 6): Promise<ElectricityDataPoint[]> => {
    const periodLabels: string[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      periodLabels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    let roomIds: number[] | null = null;
    const numBid = buildingId ? Number(buildingId) : null;
    if (numBid && Number.isFinite(numBid)) {
      const { data: roomData } = await supabase
        .from('rooms')
        .select('id')
        .eq('building_id', numBid)
        .eq('is_deleted', false);
      roomIds = ((roomData ?? []) as { id: number }[]).map((room) => room.id);
      if (roomIds.length === 0) return periodLabels.map((month) => ({ month, total: 0 }));
    }

    let snapshotQuery = supabase
      .from('invoice_utility_snapshots')
      .select('room_id, billing_period, electric_final_amount, water_final_amount')
      .in('billing_period', periodLabels);

    if (roomIds !== null) {
      snapshotQuery = snapshotQuery.in('room_id', roomIds);
    }

    const { data: snapshots } = await snapshotQuery;
    const rows = (snapshots ?? []) as {
      room_id: number;
      billing_period: string;
      electric_final_amount: number;
      water_final_amount: number;
    }[];

    const distinctRoomIds = [...new Set(rows.map((row) => row.room_id))];
    const { data: roomData } = distinctRoomIds.length === 0
      ? { data: [] as { id: number; building_id: number }[] }
      : await supabase.from('rooms').select('id, building_id').in('id', distinctRoomIds);

    const buildingIds = [...new Set(((roomData ?? []) as { id: number; building_id: number }[]).map((room) => room.building_id))];
    const { data: buildings } = buildingIds.length === 0
      ? { data: [] as { id: number; name: string }[] }
      : await supabase.from('buildings').select('id, name').in('id', buildingIds);

    const roomBuildingMap = new Map<number, number>(((roomData ?? []) as { id: number; building_id: number }[]).map((room) => [room.id, room.building_id]));
    const buildingNameMap = new Map<number, string>(((buildings ?? []) as { id: number; name: string }[]).map((building) => [building.id, building.name]));

    const byMonth = new Map<string, Record<string, number>>();
    for (const row of rows) {
      const month = row.billing_period.slice(0, 7);
      const buildingIdForRoom = roomBuildingMap.get(row.room_id);
      const buildingName = buildingIdForRoom ? (buildingNameMap.get(buildingIdForRoom) ?? `Toa ${buildingIdForRoom}`) : 'Khac';
      const current = byMonth.get(month) ?? {};
      current[buildingName] = (current[buildingName] ?? 0) + (row.electric_final_amount ?? 0) + (row.water_final_amount ?? 0);
      byMonth.set(month, current);
    }

    return periodLabels.map((month) => ({
      month,
      ...(byMonth.get(month) ?? { total: 0 }),
    }));
  },

  getAnalyticsAlerts: async (): Promise<AnalyticsAlert[]> => {
    return [];
  },

  getStaffKPIs: async (buildingId?: string | number): Promise<KPIData> => {
    return dashboardService.getKPIs(buildingId);
  },

  getStaffTickets: async (buildingId?: string | number): Promise<RecentTicket[]> => {
    const tickets = await dashboardService.getRecentTickets(buildingId);
    return tickets.slice(0, 5);
  },

  dismissAlert: async (_id: string): Promise<void> => {
    // no-op
  },
};

export default dashboardService;
