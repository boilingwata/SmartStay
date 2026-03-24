import { Contract, ContractDetail, ContractTenant, ContractService } from '@/models/Contract';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { mapContractStatus, mapDepositStatus } from '@/lib/enumMaps';
import useUIStore from '@/stores/uiStore';

// --- ContractFilter ---

export interface ContractFilter {
  buildingId?: string;
  status?: string;
  search?: string;
}

// --- Row interfaces ---

interface ContractRow {
  id: number;
  uuid: string;
  contract_code: string;
  room_id: number;
  start_date: string;
  end_date: string;
  signing_date: string | null;
  payment_cycle_months: number | null;
  monthly_rent: number | null;
  deposit_amount: number | null;
  deposit_status: string | null;
  status: string | null;
  termination_reason: string | null;
  terms: unknown;
  is_deleted: boolean | null;
  rooms?: {
    id: number;
    room_code: string;
    building_id: number;
    buildings?: { name: string } | null;
  } | null;
  contract_tenants?: ContractTenantRow[] | null;
}

interface ContractTenantRow {
  id: number;
  contract_id: number;
  tenant_id: number;
  is_primary: boolean | null;
  tenants?: {
    id: number;
    full_name: string;
    profile_id: string | null;
    profiles?: { avatar_url: string | null } | null;
  } | null;
}

interface ContractServiceRow {
  id: number;
  contract_id: number;
  service_id: number;
  quantity: number | null;
  fixed_price: number | null;
  services?: {
    id: number;
    name: string;
    calc_type: string | null;
  } | null;
}

// --- Transformers ---

function toContract(row: ContractRow): Contract {
  const room = row.rooms as ContractRow['rooms'];
  const building = room?.buildings;

  // Find primary tenant from joined contract_tenants
  const tenantRows = (row.contract_tenants ?? []) as ContractTenantRow[];
  const primaryTenant =
    tenantRows.find(ct => ct.is_primary) ?? tenantRows[0] ?? null;
  const primaryTenantData = primaryTenant?.tenants ?? null;

  return {
    id: String(row.id),
    contractCode: row.contract_code,
    roomId: String(row.room_id),
    roomCode: room?.room_code ?? '',
    buildingName: building?.name ?? '',
    tenantName: primaryTenantData?.full_name ?? '',
    tenantAvatar: primaryTenantData?.profiles?.avatar_url ?? undefined,
    type: 'Residential',
    status: mapContractStatus.fromDb(row.status ?? 'draft') as Contract['status'],
    rentPriceSnapshot: row.monthly_rent ?? 0,
    startDate: row.start_date,
    endDate: row.end_date,
    autoRenew: false,
    paymentCycle: row.payment_cycle_months ?? 1,
    isRepresentative: primaryTenant?.is_primary ?? false,
  };
}

function toContractTenant(row: ContractTenantRow): ContractTenant {
  const tenant = row.tenants;
  return {
    id: String(row.id),
    fullName: tenant?.full_name ?? '',
    avatarUrl: tenant?.profiles?.avatar_url ?? undefined,
    cccd: '',
    isRepresentative: row.is_primary ?? false,
    joinedAt: '',
    leftAt: undefined,
  };
}

function toContractService(row: ContractServiceRow): ContractService {
  const svc = row.services;
  const qty = row.quantity ?? 1;
  const price = row.fixed_price ?? 0;
  return {
    id: String(row.id),
    serviceName: svc?.name ?? '',
    unit: svc?.calc_type ?? '',
    unitPriceSnapshot: price,
    quantity: qty,
    totalPerCycle: price * qty,
    note: undefined,
  };
}

function toContractDetail(
  row: ContractRow,
  serviceRows: ContractServiceRow[]
): ContractDetail {
  const base = toContract(row);
  const tenantRows = (row.contract_tenants ?? []) as ContractTenantRow[];

  return {
    ...base,
    depositAmount: row.deposit_amount ?? 0,
    depositStatus: mapDepositStatus.fromDb(
      row.deposit_status ?? 'pending'
    ) as ContractDetail['depositStatus'],
    paymentDueDay: 5,
    terminationReason: row.termination_reason ?? undefined,
    tenants: tenantRows.map(toContractTenant),
    services: serviceRows.map(toContractService),
    addendums: [],
  };
}

// --- Service ---

export const contractService = {
  getContracts: async (filters: ContractFilter = {}): Promise<Contract[]> => {
    const targetBuildingId =
      filters.buildingId ?? useUIStore.getState().activeBuildingId;

    let query = supabase
      .from('contracts')
      .select(
        `id, uuid, contract_code, room_id, start_date, end_date,
         payment_cycle_months, monthly_rent, deposit_status, status,
         rooms!inner(id, room_code, building_id, buildings(name)),
         contract_tenants(id, contract_id, tenant_id, is_primary,
           tenants(id, full_name, profile_id,
             profiles(avatar_url)
           )
         )`
      )
      .eq('is_deleted', false);

    // Building filter via rooms.building_id
    if (targetBuildingId) {
      query = query.eq('rooms.building_id', Number(targetBuildingId));
    }

    // Status filter
    if (filters.status && filters.status !== '') {
      query = query.eq('status', mapContractStatus.toDb(filters.status) as any);
    }

    // Search by contract_code (case-insensitive)
    if (filters.search) {
      query = query.ilike('contract_code', `%${filters.search}%`);
    }

    query = query.order('id', { ascending: false });

    const rows = await unwrap(query) as unknown as ContractRow[];
    return rows.map(toContract);
  },

  getContractDetail: async (id: string): Promise<ContractDetail> => {
    const numId = Number(id);

    const [contractRow, serviceRows] = await Promise.all([
      unwrap(
        supabase
          .from('contracts')
          .select(
            `id, uuid, contract_code, room_id, start_date, end_date,
             signing_date, payment_cycle_months, monthly_rent,
             deposit_amount, deposit_status, status, termination_reason, terms,
             rooms(id, room_code, building_id, buildings(name)),
             contract_tenants(id, contract_id, tenant_id, is_primary,
               tenants(id, full_name, profile_id,
                 profiles(avatar_url)
               )
             )`
          )
          .eq('id', numId)
          .single()
      ) as unknown as Promise<ContractRow>,

      unwrap(
        supabase
          .from('contract_services')
          .select(
            `id, contract_id, service_id, quantity, fixed_price,
             services(id, name, calc_type)`
          )
          .eq('contract_id', numId)
      ) as unknown as Promise<ContractServiceRow[]>,
    ]);

    return toContractDetail(contractRow, serviceRows);
  },

  exportContracts: async (_filters: ContractFilter): Promise<Blob> => {
    return new Blob([], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  },
};
