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
import { unwrap } from '@/lib/supabaseHelpers';
import { mapTicketStatus, mapPriority } from '@/lib/enumMaps';

// ─── helpers ────────────────────────────────────────────────────────────────

function countBy<T>(arr: T[], key: keyof T): Record<string, number> {
  return arr.reduce<Record<string, number>>((acc, item) => {
    const val = String(item[key] ?? 'unknown');
    acc[val] = (acc[val] ?? 0) + 1;
    return acc;
  }, {});
}

// ─── service ────────────────────────────────────────────────────────────────

export const dashboardService = {
  getKPIs: async (buildingId?: string | number): Promise<KPIData> => {
    // Run aggregate queries in parallel
    const [
      buildingsResult,
      roomsResult,
      contractsResult,
      invoicesResult,
      tenantsResult,
      ticketsResult,
    ] = await Promise.all([
      supabase.from('buildings').select('id', { count: 'exact', head: true }),
      supabase.from('rooms').select('id, status').eq('is_deleted', false),
      supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase.from('invoices').select('id, status, total_amount'),
      supabase.from('tenants').select('id', { count: 'exact', head: true }),
      supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .in('status', ['new', 'in_progress', 'pending_confirmation']),
    ]);

    const totalBuildings = buildingsResult.count ?? 0;

    const rooms = (roomsResult.data ?? []) as { id: number; status: string | null }[];
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const activeContracts = contractsResult.count ?? 0;
    const openTickets = ticketsResult.count ?? 0;
    const totalTenants = tenantsResult.count ?? 0;

    const invoices = (invoicesResult.data ?? []) as { id: number; status: string | null; total_amount: number | null }[];
    const overdueBalance = invoices
      .filter(i => i.status === 'overdue')
      .reduce((sum, i) => sum + (i.total_amount ?? 0), 0);

    // Current-month paid revenue
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const paidInvoicesResult = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('status', 'paid')
      .gte('created_at', monthStart);
    const currentMonthRevenue = ((paidInvoicesResult.data ?? []) as { total_amount: number | null }[])
      .reduce((sum, i) => sum + (i.total_amount ?? 0), 0);

    return {
      totalBuildings,
      totalRooms,
      occupiedRooms,
      occupancyRate,
      currentMonthRevenue,
      totalOverdueBalance: overdueBalance,
      activeContracts,
      openTickets,
      deltas: {},
    };
  },

  getRevenueChart: async (_buildingId?: string | number, months: number = 12): Promise<RevenueDataPoint[]> => {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    const { data } = await supabase
      .from('invoices')
      .select('total_amount, created_at, status')
      .in('status', ['paid'])
      .gte('created_at', cutoff.toISOString());

    const byMonth: Record<string, number> = {};
    for (const row of (data ?? []) as { total_amount: number | null; created_at: string | null }[]) {
      if (!row.created_at) continue;
      const label = row.created_at.slice(0, 7); // "YYYY-MM"
      byMonth[label] = (byMonth[label] ?? 0) + (row.total_amount ?? 0);
    }

    // Build ordered array for the last `months` months
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

  getOccupancy: async (_buildingId?: string | number): Promise<OccupancyData> => {
    const { data } = await supabase
      .from('rooms')
      .select('status')
      .eq('is_deleted', false);

    const rows = (data ?? []) as { status: string | null }[];
    const counts = countBy(rows, 'status');

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

  getRecentPayments: async (_buildingId?: string | number): Promise<RecentPayment[]> => {
    const { data } = await supabase
      .from('payments')
      .select('id, reference_number, amount, method, payment_date, confirmed_at, invoices(contracts(contract_tenants(tenants(full_name))))')
      .order('payment_date', { ascending: false })
      .limit(10);

    return ((data ?? []) as unknown[]).map((row: unknown) => {
      const r = row as Record<string, unknown>;
      const invoice = (r.invoices as Record<string, unknown> | null) ?? {};
      const contract = (invoice.contracts as Record<string, unknown> | null) ?? {};
      const contractTenants = (contract.contract_tenants as Record<string, unknown>[] | null) ?? [];
      const primaryTenant = contractTenants[0] as Record<string, unknown> | undefined;
      const tenant = (primaryTenant?.tenants as Record<string, unknown> | null) ?? {};

      return {
        id: String(r.id),
        transactionCode: (r.reference_number as string | null) ?? String(r.id),
        tenantName: (tenant.full_name as string | null) ?? 'Unknown',
        amount: (r.amount as number) ?? 0,
        method: 'Cash' as RecentPayment['method'],
        status: r.confirmed_at ? 'Confirmed' : 'Pending',
        createdAt: (r.payment_date as string) ?? new Date().toISOString(),
      } satisfies RecentPayment;
    });
  },

  getRecentTickets: async (_buildingId?: string | number): Promise<RecentTicket[]> => {
    const { data } = await supabase
      .from('tickets')
      .select('id, ticket_code, title, priority, status, created_at, sla_deadline, rooms(room_code), profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(10);

    return ((data ?? []) as unknown[]).map((row: unknown) => {
      const r = row as Record<string, unknown>;
      const room = (r.rooms as Record<string, unknown> | null) ?? {};
      const assignee = (r.profiles as Record<string, unknown> | null) ?? {};

      return {
        id: String(r.id),
        ticketCode: (r.ticket_code as string | null) ?? String(r.id),
        title: (r.title as string) ?? '',
        roomName: (room.room_code as string | null) ?? 'N/A',
        priority: mapPriority.fromDb((r.priority as string) ?? 'normal') as RecentTicket['priority'],
        status: mapTicketStatus.fromDb((r.status as string) ?? 'new') as RecentTicket['status'],
        assignedTo: (assignee.full_name as string | null) ?? undefined,
        createdAt: (r.created_at as string) ?? new Date().toISOString(),
        slaDeadline: (r.sla_deadline as string | null) ?? new Date().toISOString(),
      } satisfies RecentTicket;
    });
  },

  getElectricityChart: async (_buildingId?: string | number, _months: number = 6): Promise<ElectricityDataPoint[]> => {
    // No electricity readings table modelled in current schema — return empty array
    return [];
  },

  getAnalyticsAlerts: async (): Promise<AnalyticsAlert[]> => {
    // No analytics_alerts table in current schema — return empty array
    return [];
  },

  getStaffKPIs: async (_buildingId?: string | number): Promise<KPIData> => {
    return dashboardService.getKPIs(_buildingId);
  },

  getStaffTickets: async (_buildingId?: string | number): Promise<RecentTicket[]> => {
    const tickets = await dashboardService.getRecentTickets(_buildingId);
    return tickets.slice(0, 5);
  },

  dismissAlert: async (_id: string): Promise<void> => {
    // No analytics_alerts table — no-op
  },
};

export default dashboardService;
