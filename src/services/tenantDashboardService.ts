import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { mapTicketStatus, mapPriority } from '@/lib/enumMaps';
import type { DbInvoiceStatus } from '@/types/supabase';
import { RecentTicket } from '../models/Dashboard';
import { TenantBalance } from '../models/TenantBalance';
import { Announcement } from '../types/announcement';
import { ContractDetail } from '../models/Contract';

export interface OnboardingStatus {
  completionPercent: number;
  steps: {
    isPersonalInfoConfirmed: boolean;
    isCCCDUploaded: boolean;
    isEmergencyContactAdded: boolean;
    isRoomHandovered: boolean;
    isDepositPaid: boolean;
    isContractSigned: boolean;
  };
}

export interface DashboardSummary {
  balance: TenantBalance;
  pendingInvoicesCount: number;
  totalPendingAmount: number;
  upcomingInvoices: any[];
  recentTickets: RecentTicket[];
  hotAnnouncements: Announcement[];
  activeContract: ContractDetail | null;
  onboarding: OnboardingStatus;
}

async function resolveTenantId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const rows = await unwrap(
    supabase.from('tenants').select('id').eq('profile_id', user.id).limit(1)
  ) as unknown as { id: number }[];

  return rows[0]?.id?.toString() ?? null;
}

export const tenantDashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const tenantId = await resolveTenantId();

    const emptyResult: DashboardSummary = {
      balance: { tenantId: tenantId ?? '', currentBalance: 0, lastUpdated: new Date().toISOString(), lastUpdatedAt: new Date().toISOString() },
      pendingInvoicesCount: 0,
      totalPendingAmount: 0,
      upcomingInvoices: [],
      recentTickets: [],
      hotAnnouncements: [],
      activeContract: null,
      onboarding: {
        completionPercent: 0,
        steps: {
          isPersonalInfoConfirmed: false,
          isCCCDUploaded: false,
          isEmergencyContactAdded: false,
          isRoomHandovered: false,
          isDepositPaid: false,
          isContractSigned: false,
        },
      },
    };

    if (!tenantId) return emptyResult;

    // Fetch data in parallel
    interface BalanceRow { balance_after: number }
    interface InvoiceRow { id: number; total_amount: number; due_date: string; status: string }
    interface TicketRow { id: number; ticket_code: string; title: string; priority: string; status: string; created_at: string; sla_deadline: string | null; rooms: { room_code: string } | null }

    const [balanceRows, invoiceRows, ticketRows] = await Promise.all([
      // Balance
      unwrap(
        supabase.from('balance_history')
          .select('balance_after')
          .eq('tenant_id', Number(tenantId))
          .order('created_at', { ascending: false })
          .limit(1)
      ).catch(() => []) as Promise<unknown>,

      // Pending invoices via contract_tenants
      unwrap(
        supabase.from('invoices')
          .select('id, total_amount, due_date, status, contracts!inner(contract_tenants!inner(tenant_id))')
          .in('status', ['draft', 'pending_payment', 'partially_paid'] as DbInvoiceStatus[])
          .order('due_date', { ascending: true })
          .limit(5)
      ).catch(() => []) as Promise<unknown>,

      // Recent tickets
      unwrap(
        supabase.from('tickets')
          .select('id, ticket_code, title, priority, status, created_at, sla_deadline, rooms(room_code)')
          .eq('reported_by', Number(tenantId))
          .order('created_at', { ascending: false })
          .limit(5)
      ).catch(() => []) as Promise<unknown>,
    ]);

    const typedBalance = balanceRows as BalanceRow[];
    const typedInvoices = invoiceRows as InvoiceRow[];
    const typedTickets = ticketRows as TicketRow[];

    const currentBalance = typedBalance[0]?.balance_after ?? 0;

    const totalPendingAmount = typedInvoices.reduce((sum, inv) => sum + (inv.total_amount ?? 0), 0);

    const recentTickets: RecentTicket[] = typedTickets.map((t) => ({
      id: String(t.id),
      ticketCode: t.ticket_code,
      title: t.title,
      roomName: t.rooms?.room_code ?? '',
      priority: mapPriority.fromDb(t.priority) as RecentTicket['priority'],
      status: mapTicketStatus.fromDb(t.status) as RecentTicket['status'],
      createdAt: t.created_at,
      slaDeadline: t.sla_deadline ?? t.created_at,
    }));

    return {
      ...emptyResult,
      balance: {
        tenantId: tenantId,
        currentBalance,
        lastUpdated: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      },
      pendingInvoicesCount: typedInvoices.length,
      totalPendingAmount,
      upcomingInvoices: typedInvoices.map((inv) => ({
        id: String(inv.id),
        title: `Hóa đơn #${inv.id}`,
        amount: inv.total_amount,
        dueDate: inv.due_date,
      })),
      recentTickets,
    };
  }
};

export default tenantDashboardService;
