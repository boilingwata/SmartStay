import { Contract, ContractDetail, ContractTenant, ContractService } from '@/models/Contract';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { mapContractStatus, mapDepositStatus } from '@/lib/enumMaps';
import type { DbContractStatus } from '@/types/supabase';

// --- ContractFilter ---

export interface ContractFilter {
  buildingId?: string;
  status?: string;
  search?: string;
  roomCode?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  minRent?: number;
  maxRent?: number;
  expiringSoon?: boolean;
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
    // PS-01: paymentDueDay is hardcoded to 5 (5th of each month).
    // The `contracts` table has no `payment_due_day` column in the current schema.
    // TO PERSIST: add `payment_due_day SMALLINT DEFAULT 5` to the `contracts` table.
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

    // Filter by Status
    if (filters.status && filters.status !== '' && filters.status !== 'All') {
      query = query.eq('status', mapContractStatus.toDb(filters.status) as DbContractStatus);
    }

    // Filter by Building (via inner join)
    if (filters.buildingId && filters.buildingId !== '') {
      query = query.eq('rooms.building_id', Number(filters.buildingId));
    }

    // Filter by Room Code
    if (filters.roomCode && filters.roomCode !== '') {
      query = query.ilike('rooms.room_code', `%${filters.roomCode}%`);
    }

    // Search: Code OR Primary Tenant Name
    if (filters.search && filters.search !== '') {
      const searchPattern = `%${filters.search}%`;
      // We use raw SQL or complex filters for OR across tables if needed, 
      // but ilike on code is a good start. 
      // For tenant name, we might need a separate approach or computed field.
      // Since PostgREST OR over joins is tricky, we filter by code first here.
      query = query.or(`contract_code.ilike.${searchPattern}`);
    }

    // Date Filters
    if (filters.startDateFrom) query = query.gte('start_date', filters.startDateFrom);
    if (filters.startDateTo) query = query.lte('start_date', filters.startDateTo);
    if (filters.endDateFrom) query = query.gte('end_date', filters.endDateFrom);
    if (filters.endDateTo) query = query.lte('end_date', filters.endDateTo);

    // Rent Filters
    if (filters.minRent) query = query.gte('monthly_rent', filters.minRent);
    if (filters.maxRent) query = query.lte('monthly_rent', filters.maxRent);

    // Expiring Soon (30 days)
    if (filters.expiringSoon) {
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
      query = query.lte('end_date', thirtyDaysLater.toISOString().split('T')[0])
                   .gte('end_date', new Date().toISOString().split('T')[0])
                   .eq('status', 'active');
    }

    query = query.order('id', { ascending: false });

    const rows = await unwrap(query) as unknown as ContractRow[];
    
    // In-memory filter for Tenant Name if search is active
    let contracts = rows.map(toContract);
    if (filters.search && filters.search !== '') {
      const term = filters.search.toLowerCase();
      contracts = contracts.filter(c => 
        c.contractCode.toLowerCase().includes(term) || 
        c.tenantName.toLowerCase().includes(term) ||
        c.roomCode.toLowerCase().includes(term)
      );
    }

    return contracts;
  },

  getContractDetail: async (id: string): Promise<ContractDetail> => {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      throw new Error(`[contractService] Invalid contract id: "${id}"`);
    }

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
    // Note: No export endpoint in current schema. Returns empty blob.
    // TO IMPLEMENT: add a Supabase Edge Function or use a CSV library.
    return new Blob([], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  },

  createContract: async (data: import('@/schemas/contractSchema').ContractFormData): Promise<Contract> => {
    const numRoomId = Number(data.roomId);
    if (!Number.isFinite(numRoomId)) {
      throw new Error(`[contractService] Invalid room id: "${data.roomId}"`);
    }

    // Pre-insert guard: check for overlapping active/pending contracts on this room
    const { data: conflicting } = await supabase
      .from('contracts')
      .select('id, contract_code')
      .eq('room_id', numRoomId)
      .in('status', ['active', 'pending_signature'])
      .eq('is_deleted', false)
      .lte('start_date', data.endDate)
      .gte('end_date', data.startDate)
      .limit(1);

    if (conflicting && conflicting.length > 0) {
      const code = (conflicting[0] as { contract_code: string }).contract_code;
      throw new Error(
        `Phòng này đã có hợp đồng đang hoạt động (${code}) trong khoảng thời gian được chọn. ` +
        `Vui lòng kết thúc hợp đồng hiện tại hoặc chọn khoảng thời gian khác.`
      );
    }

    if (import.meta.env.VITE_USE_EDGE_FUNCTIONS === 'true') {
      const tenants = data.tenants.map((t) => ({
        id: Number(t.id),
        isPrimary: t.id === data.representativeId,
      }));

      const { data: result, error } = await supabase.functions.invoke('create-contract', {
        body: {
          roomId:               numRoomId,
          startDate:            data.startDate,
          endDate:              data.endDate,
          rentPrice:            data.rentPrice,
          depositAmount:        data.depositAmount,
          paymentCycle:         data.paymentCycle,
          tenants,
          selectedServices:     data.selectedServices.map((id) => ({ serviceId: Number(id) })),
          markDepositReceived:  data.depositAmount > 0,
        },
      });
      if (error) throw new Error(error.message);

      // Fetch the full contract row for the return value
      const contractRow = await unwrap(
        supabase
          .from('contracts')
          .select(`
            id, uuid, contract_code, room_id, start_date, end_date,
            payment_cycle_months, monthly_rent, deposit_status, status,
            rooms!inner(id, room_code, building_id, buildings(name)),
            contract_tenants(id, contract_id, tenant_id, is_primary,
              tenants(id, full_name, profile_id, profiles(avatar_url))
            )
          `)
          .eq('id', result.contractId)
          .single()
      ) as unknown as ContractRow;

      return toContract(contractRow);
    }

    // Legacy path: inserts contracts row only (missing tenants + services)
    const { data: insertData, error: insertError } = await supabase
      .from('contracts')
      .insert({
        room_id: numRoomId,
        start_date: data.startDate,
        end_date: data.endDate,
        monthly_rent: data.rentPrice,
        deposit_amount: data.depositAmount,
        payment_cycle_months: data.paymentCycle,
        status: 'active' as DbContractStatus,
        is_deleted: false,
      })
      .select(`
        id, uuid, contract_code, room_id, start_date, end_date,
        payment_cycle_months, monthly_rent, deposit_status, status,
        rooms!inner(id, room_code, building_id, buildings(name)),
        contract_tenants(id, contract_id, tenant_id, is_primary,
          tenants(id, full_name, profile_id,
            profiles(avatar_url)
          )
        )
      `)
      .single();

    if (insertError) {
      if (insertError.message.includes('excl_room_contract')) {
        throw new Error(
          'Phòng này đã có hợp đồng đang hoạt động trong khoảng thời gian được chọn. ' +
          'Vui lòng kết thúc hợp đồng hiện tại hoặc chọn khoảng thời gian khác.'
        );
      }
      throw new Error(insertError.message);
    }

    return toContract(insertData as unknown as ContractRow);
  },
};
