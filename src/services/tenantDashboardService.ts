import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { mapPriority, mapTicketStatus } from '@/lib/enumMaps';
import type { DbInvoiceStatus } from '@/types/supabase';
import type { Notification } from '@/types/notification';
import type { RecentTicket } from '@/models/Dashboard';
import type { TenantBalance } from '@/models/TenantBalance';
import type { ContractDetail } from '@/models/Contract';
import notificationService from '@/services/notificationService';
import portalService from '@/services/portalService';
import portalOnboardingService, { type PortalOnboardingStatus } from '@/services/portalOnboardingService';

type TenantContext = {
  profileId: string;
  tenantId: number;
  contractIds: number[];
};

type TenantBalanceRow = {
  tenant_id: number;
  balance: number | null;
  last_updated: string | null;
};

type InvoiceRow = {
  id: number;
  invoice_code: string;
  total_amount: number | null;
  due_date: string | null;
  status: DbInvoiceStatus | null;
};

type TicketRow = {
  id: number;
  ticket_code: string;
  subject: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  rooms: {
    room_code: string;
  } | null;
};

export interface DashboardInvoice {
  id: string;
  invoiceCode: string;
  title: string;
  amount: number;
  dueDate: string | null;
  status: DbInvoiceStatus | null;
}

export interface DashboardSummary {
  context: {
    profileId: string | null;
    tenantId: number | null;
    contractIds: number[];
  };
  balance: TenantBalance;
  pendingInvoicesCount: number;
  totalPendingAmount: number;
  upcomingInvoices: DashboardInvoice[];
  recentTickets: RecentTicket[];
  hotAnnouncements: Notification[];
  activeContract: ContractDetail | null;
  onboarding: PortalOnboardingStatus;
}

async function getTenantContext(): Promise<TenantContext | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  if (!user) {
    return null;
  }

  const tenantRows = (await unwrap(
    supabase
      .from('tenants')
      .select('id')
      .eq('profile_id', user.id)
      .eq('is_deleted', false)
      .limit(1)
  )) as unknown as Array<{ id: number }>;

  const tenantId = tenantRows[0]?.id;
  if (!tenantId) {
    return null;
  }

  const contractRows = (await unwrap(
    supabase
      .from('contract_tenants')
      .select('contract_id')
      .eq('tenant_id', tenantId)
  )) as unknown as Array<{ contract_id: number }>;

  return {
    profileId: user.id,
    tenantId,
    contractIds: contractRows.map((row) => row.contract_id),
  };
}

function buildEmptySummary(tenantId?: number): DashboardSummary {
  const now = new Date().toISOString();

  return {
    context: {
      profileId: null,
      tenantId: tenantId ?? null,
      contractIds: [],
    },
    balance: {
      tenantId: tenantId ? String(tenantId) : '',
      currentBalance: 0,
      lastUpdated: now,
      lastUpdatedAt: now,
    },
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
}

function toDashboardInvoice(row: InvoiceRow): DashboardInvoice {
  return {
    id: String(row.id),
    invoiceCode: row.invoice_code,
    title: row.invoice_code,
    amount: Number(row.total_amount ?? 0),
    dueDate: row.due_date,
    status: row.status,
  };
}

function toRecentTicket(row: TicketRow): RecentTicket {
  return {
    id: String(row.id),
    ticketCode: row.ticket_code,
    title: row.subject,
    roomName: row.rooms?.room_code ?? '',
    priority: mapPriority.fromDb(row.priority) as RecentTicket['priority'],
    status: mapTicketStatus.fromDb(row.status) as RecentTicket['status'],
    createdAt: row.created_at,
    slaDeadline: row.updated_at ?? row.created_at,
  };
}

async function fetchBalance(tenantId: number): Promise<TenantBalance> {
  const row = (await unwrap(
    supabase
      .from('tenant_balances')
      .select('tenant_id, balance, last_updated')
      .eq('tenant_id', tenantId)
      .maybeSingle()
  )) as unknown as TenantBalanceRow | null;

  const lastUpdated = row?.last_updated ?? new Date().toISOString();

  return {
    tenantId: String(tenantId),
    currentBalance: Number(row?.balance ?? 0),
    lastUpdated,
    lastUpdatedAt: lastUpdated,
  };
}

async function fetchUpcomingInvoices(contractIds: number[]): Promise<DashboardInvoice[]> {
  if (contractIds.length === 0) {
    return [];
  }

  const rows = (await unwrap(
    supabase
      .from('invoices')
      .select('id, invoice_code, total_amount, due_date, status')
      .in('contract_id', contractIds)
      .in('status', ['draft', 'pending_payment', 'partially_paid', 'overdue'] satisfies DbInvoiceStatus[])
      .order('due_date', { ascending: true })
      .limit(5)
  )) as unknown as InvoiceRow[];

  return rows.map(toDashboardInvoice);
}

async function fetchRecentTickets(tenantId: number): Promise<RecentTicket[]> {
  const rows = (await unwrap(
    supabase
      .from('tickets')
      .select('id, ticket_code, subject, priority, status, created_at, updated_at, rooms(room_code)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5)
  )) as unknown as TicketRow[];

  return rows.map(toRecentTicket);
}

export const tenantDashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    try {
      const context = await getTenantContext();
      if (!context) {
        return buildEmptySummary();
      }

      const emptySummary = buildEmptySummary(context.tenantId);

      const [balance, upcomingInvoices, recentTickets, hotAnnouncements, activeContract, onboarding] = await Promise.all([
        fetchBalance(context.tenantId),
        fetchUpcomingInvoices(context.contractIds),
        fetchRecentTickets(context.tenantId),
        notificationService.getNotifications(context.profileId, 3),
        portalService.getActiveContract(),
        portalOnboardingService.getStatusForProfile(context.profileId),
      ]);

      const totalPendingAmount = upcomingInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

      return {
        ...emptySummary,
        context: {
          profileId: context.profileId,
          tenantId: context.tenantId,
          contractIds: context.contractIds,
        },
        balance,
        pendingInvoicesCount: upcomingInvoices.length,
        totalPendingAmount,
        upcomingInvoices,
        recentTickets,
        hotAnnouncements,
        activeContract,
        onboarding,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Khong the tai du lieu dashboard.';
      throw new Error(message);
    }
  },
};

export default tenantDashboardService;
