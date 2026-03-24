import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { ContractDetail, ContractTenant, ContractService } from '@/models/Contract';
import { mapContractStatus, mapDepositStatus } from '@/lib/enumMaps';

// ---------------------------------------------------------------------------
// Internal DB row shapes
// ---------------------------------------------------------------------------

interface DbContractRow {
  id: number;
  contract_code: string;
  room_id: number;
  start_date: string;
  end_date: string;
  payment_cycle_months: number | null;
  monthly_rent: number | null;
  deposit_amount: number | null;
  deposit_status: string | null;
  status: string | null;
  termination_reason: string | null;
  rooms: {
    room_code: string;
    building_id: number;
    buildings: { name: string } | null;
  } | null;
  contract_tenants: {
    id: number;
    tenant_id: number;
    is_primary: boolean | null;
    tenants: {
      full_name: string;
      profiles: { avatar_url: string | null } | null;
    } | null;
  }[];
  contract_services: {
    id: number;
    quantity: number | null;
    fixed_price: number | null;
    services: { name: string; calc_type: string | null } | null;
  }[];
}

interface DbTicketRow {
  id: number;
  ticket_code: string;
  subject: string;
  status: string | null;
  created_at: string | null;
}

interface DbInvoiceRow {
  id: number;
  invoice_code: string;
  total_amount: number;
  status: string | null;
  due_date: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve current user → tenant numeric id via profiles.id → tenants.profile_id */
async function getCurrentTenantId(): Promise<number | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const tenants = await unwrap(
    supabase
      .from('tenants')
      .select('id')
      .eq('profile_id', user.id)
      .eq('is_deleted', false)
      .limit(1)
  ) as unknown as { id: number }[];

  return tenants?.[0]?.id ?? null;
}

function toContractDetail(row: DbContractRow): ContractDetail {
  const room = row.rooms;
  const building = room?.buildings;
  const tenantRows = row.contract_tenants ?? [];
  const primary = tenantRows.find(ct => ct.is_primary) ?? tenantRows[0] ?? null;

  const tenants: ContractTenant[] = tenantRows.map(ct => ({
    id: String(ct.id),
    fullName: ct.tenants?.full_name ?? '',
    avatarUrl: ct.tenants?.profiles?.avatar_url ?? undefined,
    cccd: '',
    isRepresentative: ct.is_primary ?? false,
    joinedAt: '',
  }));

  const services: ContractService[] = (row.contract_services ?? []).map(cs => ({
    id: String(cs.id),
    serviceName: cs.services?.name ?? '',
    unit: cs.services?.calc_type ?? '',
    unitPriceSnapshot: cs.fixed_price ?? 0,
    quantity: cs.quantity ?? 1,
    totalPerCycle: (cs.fixed_price ?? 0) * (cs.quantity ?? 1),
  }));

  return {
    id: String(row.id),
    contractCode: row.contract_code,
    roomId: String(row.room_id),
    roomCode: room?.room_code ?? '',
    buildingName: building?.name ?? '',
    tenantName: primary?.tenants?.full_name ?? '',
    tenantAvatar: primary?.tenants?.profiles?.avatar_url ?? undefined,
    type: 'Residential',
    status: mapContractStatus.fromDb(row.status ?? 'draft') as ContractDetail['status'],
    rentPriceSnapshot: row.monthly_rent ?? 0,
    startDate: row.start_date,
    endDate: row.end_date,
    autoRenew: false,
    paymentCycle: row.payment_cycle_months ?? 1,
    isRepresentative: primary?.is_primary ?? false,
    depositAmount: row.deposit_amount ?? 0,
    depositStatus: mapDepositStatus.fromDb(row.deposit_status ?? 'pending') as ContractDetail['depositStatus'],
    paymentDueDay: 5,
    terminationReason: row.termination_reason ?? undefined,
    tenants,
    services,
    addendums: [],
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const portalService = {
  getActiveContract: async (): Promise<ContractDetail | null> => {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return null;

    // Find the active contract for this tenant via contract_tenants
    const contractLink = await unwrap(
      supabase
        .from('contract_tenants')
        .select('contract_id, contracts!inner(id, status, is_deleted)')
        .eq('tenant_id', tenantId)
        .eq('contracts.status', 'active')
        .eq('contracts.is_deleted', false)
        .limit(1)
        .single()
    ) as unknown as { contract_id: number };

    const row = await unwrap(
      supabase
        .from('contracts')
        .select(`
          id, contract_code, room_id, start_date, end_date,
          payment_cycle_months, monthly_rent, deposit_amount, deposit_status,
          status, termination_reason,
          rooms ( room_code, building_id, buildings ( name ) ),
          contract_tenants (
            id, tenant_id, is_primary,
            tenants ( full_name, profiles ( avatar_url ) )
          ),
          contract_services (
            id, quantity, fixed_price,
            services ( name, calc_type )
          )
        `)
        .eq('id', contractLink.contract_id)
        .single()
    ) as unknown as DbContractRow;

    return toContractDetail(row);
  },

  getRepairRequests: async (): Promise<any[]> => {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return [];

    const rows = await unwrap(
      supabase
        .from('tickets')
        .select('id, ticket_code, subject, status, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
    ) as unknown as DbTicketRow[];

    return (rows ?? []).map(r => ({
      id: r.ticket_code,
      title: r.subject,
      status: r.status ?? 'new',
      createdAt: (r.created_at ?? '').slice(0, 10),
    }));
  },

  getResidentBills: async (): Promise<any[]> => {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return [];

    // Get contract ids for this tenant
    const contractLinks = await unwrap(
      supabase
        .from('contract_tenants')
        .select('contract_id')
        .eq('tenant_id', tenantId)
    ) as unknown as { contract_id: number }[];

    if (!contractLinks || contractLinks.length === 0) return [];

    const contractIds = contractLinks.map(cl => cl.contract_id);

    const rows = await unwrap(
      supabase
        .from('invoices')
        .select('id, invoice_code, total_amount, status, due_date')
        .in('contract_id', contractIds)
        .order('due_date', { ascending: false })
    ) as unknown as DbInvoiceRow[];

    return (rows ?? []).map(r => ({
      id: String(r.id),
      code: r.invoice_code,
      amount: r.total_amount,
      status: r.status ?? 'draft',
      dueDate: r.due_date,
    }));
  },
};

export default portalService;
