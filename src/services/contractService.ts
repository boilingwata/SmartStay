import {
  Contract,
  ContractDetail,
  ContractInvoice,
  ContractOccupant,
  ContractRenewal,
  ContractService,
  ContractTenant,
  ContractTransfer,
} from '@/models/Contract';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { mapContractStatus, mapDepositStatus } from '@/lib/enumMaps';
import { ContractAddendumRow, toContractAddendum } from '@/lib/contractAddendums';
import type { DbContractStatus } from '@/types/supabase';

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

export interface RemoveOccupantPayload {
  contractId: string;
  tenantId: string;
  moveOutDate: string;
  note?: string;
}

export interface AddOccupantPayload {
  contractId: string;
  tenantId: string;
  moveInDate: string;
  relationshipToPrimary?: string;
  note?: string;
}

export interface TransferContractPayload {
  contractId: string;
  toTenantId: string;
  transferDate: string;
  note?: string;
}

export interface LiquidateContractPayload {
  contractId: string;
  terminationDate: string;
  reason: string;
  depositUsed?: number;
  additionalCharges?: number;
}

interface ContractRow {
  id: number;
  uuid: string;
  contract_code: string;
  room_id: number;
  primary_tenant_id?: number | null;
  linked_contract_id?: number | null;
  start_date: string;
  end_date: string;
  signing_date: string | null;
  payment_cycle_months: number | null;
  payment_due_day?: number | null;
  notice_period_days?: number | null;
  occupants_for_billing?: number | null;
  monthly_rent: number | null;
  deposit_amount: number | null;
  deposit_status: string | null;
  status: string | null;
  termination_reason: string | null;
  terminated_at?: string | null;
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
  tenants?: TenantRow | null;
}

interface TenantRow {
  id: number;
  full_name: string;
  id_number: string | null;
  phone: string | null;
  email: string | null;
  profile_id: string | null;
  profiles?: { avatar_url: string | null } | null;
}

interface RoomOccupantRow {
  id: number;
  contract_id: number;
  room_id: number;
  tenant_id: number;
  is_primary_tenant: boolean;
  relationship_to_primary: string | null;
  note: string | null;
  move_in_at: string;
  move_out_at: string | null;
  status: 'active' | 'moved_out';
  tenants?: TenantRow | null;
}

interface ContractServiceRow {
  id: number;
  contract_id: number;
  service_catalog_id: number;
  quantity: number | null;
  fixed_price: number | null;
  service_catalog?: {
    id: number;
    name: string;
    unit: string | null;
    billing_method: string | null;
  } | null;
}

interface ContractRenewalRow {
  id: number;
  contract_id: number;
  previous_end_date: string;
  new_end_date: string;
  new_monthly_rent: number | null;
  reason: string | null;
  created_at: string | null;
}

interface ContractInvoiceRow {
  id: number;
  invoice_code: string;
  billing_period: string | null;
  total_amount: number | null;
  amount_paid: number | null;
  balance_due: number | null;
  due_date: string | null;
  paid_date: string | null;
  status: string | null;
  created_at: string | null;
}

interface ContractTransferRow {
  id: number;
  old_contract_id: number;
  new_contract_id: number;
  from_tenant_id: number;
  to_tenant_id: number;
  transfer_date: string;
  status: 'pending' | 'completed' | 'cancelled';
  deposit_mode: string;
  carry_over_deposit_amount: number | null;
  note: string | null;
  approved_by: string | null;
  created_at: string | null;
  from_tenant?: TenantRow | null;
  to_tenant?: TenantRow | null;
}

interface ContractAddendumQueryRow extends ContractAddendumRow {}

interface RpcContractResult {
  contractId: number;
  contractCode: string;
}

function parseTerms(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function toContractTenant(row: ContractTenantRow): ContractTenant {
  const tenant = row.tenants;
  return {
    id: String(row.id),
    fullName: tenant?.full_name ?? '',
    avatarUrl: tenant?.profiles?.avatar_url ?? undefined,
    cccd: tenant?.id_number ?? '',
    phone: tenant?.phone ?? undefined,
    email: tenant?.email ?? undefined,
    isRepresentative: row.is_primary ?? false,
    joinedAt: '',
    leftAt: undefined,
  };
}

function toContractOccupant(row: RoomOccupantRow): ContractOccupant {
  const tenant = row.tenants;
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    fullName: tenant?.full_name ?? '',
    avatarUrl: tenant?.profiles?.avatar_url ?? undefined,
    cccd: tenant?.id_number ?? '',
    phone: tenant?.phone ?? undefined,
    email: tenant?.email ?? undefined,
    isPrimaryTenant: row.is_primary_tenant,
    relationshipToPrimary: row.relationship_to_primary ?? undefined,
    note: row.note ?? undefined,
    moveInAt: row.move_in_at,
    moveOutAt: row.move_out_at ?? undefined,
    status: row.status,
  };
}

function toContractService(row: ContractServiceRow): ContractService {
  const svc = row.service_catalog;
  const qty = row.quantity ?? 1;
  const price = row.fixed_price ?? 0;
  return {
    id: String(row.id),
    serviceName: svc?.name ?? '',
    unit: svc?.unit ?? '',
    unitPriceSnapshot: price,
    quantity: qty,
    totalPerCycle: price * qty,
    note: undefined,
  };
}

function toContractRenewal(row: ContractRenewalRow): ContractRenewal {
  return {
    id: String(row.id),
    previousEndDate: row.previous_end_date,
    newEndDate: row.new_end_date,
    newMonthlyRent: row.new_monthly_rent ?? 0,
    reason: row.reason ?? undefined,
    createdAt: row.created_at ?? undefined,
  };
}

function toContractInvoice(row: ContractInvoiceRow): ContractInvoice {
  return {
    id: String(row.id),
    invoiceCode: row.invoice_code,
    billingPeriod: row.billing_period ?? '',
    totalAmount: row.total_amount ?? 0,
    amountPaid: row.amount_paid ?? 0,
    balanceDue: row.balance_due ?? 0,
    dueDate: row.due_date ?? '',
    paidDate: row.paid_date ?? undefined,
    status: row.status ?? '',
    createdAt: row.created_at ?? undefined,
  };
}

function toContractTransfer(row: ContractTransferRow): ContractTransfer {
  return {
    id: String(row.id),
    oldContractId: String(row.old_contract_id),
    newContractId: String(row.new_contract_id),
    fromTenantId: String(row.from_tenant_id),
    fromTenantName: row.from_tenant?.full_name ?? '',
    toTenantId: String(row.to_tenant_id),
    toTenantName: row.to_tenant?.full_name ?? '',
    transferDate: row.transfer_date,
    status: row.status,
    depositMode: row.deposit_mode,
    carryOverDepositAmount: row.carry_over_deposit_amount ?? 0,
    note: row.note ?? undefined,
    approvedBy: row.approved_by ?? undefined,
    createdAt: row.created_at ?? undefined,
  };
}

function deriveOccupantCount(row: ContractRow, occupants: ContractOccupant[]): number {
  if (occupants.length > 0) return occupants.filter((item) => item.status === 'active').length;
  if (typeof row.occupants_for_billing === 'number' && row.occupants_for_billing > 0) {
    return row.occupants_for_billing;
  }
  const terms = parseTerms(row.terms);
  const occupantsForBilling = terms.occupants_for_billing;
  if (typeof occupantsForBilling === 'number') return occupantsForBilling;
  return row.contract_tenants?.length ?? 1;
}

function toContract(row: ContractRow, occupants: ContractOccupant[] = []): Contract {
  const room = row.rooms as ContractRow['rooms'];
  const building = room?.buildings;
  const tenantRows = (row.contract_tenants ?? []) as ContractTenantRow[];
  const primaryTenantRow = tenantRows.find((ct) => ct.is_primary) ?? tenantRows[0] ?? null;
  const primaryTenant = primaryTenantRow?.tenants ?? null;

  return {
    id: String(row.id),
    contractCode: row.contract_code,
    roomId: String(row.room_id),
    roomCode: room?.room_code ?? '',
    buildingName: building?.name ?? '',
    tenantName: primaryTenant?.full_name ?? '',
    tenantAvatar: primaryTenant?.profiles?.avatar_url ?? undefined,
    type: 'Residential',
    status: mapContractStatus.fromDb(row.status ?? 'draft') as Contract['status'],
    rentPriceSnapshot: row.monthly_rent ?? 0,
    startDate: row.start_date,
    endDate: row.end_date,
    autoRenew: false,
    paymentCycle: row.payment_cycle_months ?? 1,
    isRepresentative: true,
    occupantCount: deriveOccupantCount(row, occupants),
  };
}

function toContractDetail(
  row: ContractRow,
  serviceRows: ContractServiceRow[],
  renewalRows: ContractRenewalRow[],
  invoiceRows: ContractInvoiceRow[],
  occupantRows: RoomOccupantRow[],
  transferRows: ContractTransferRow[],
  addendumSourceAvailable: boolean,
  addendumRows: ContractAddendumQueryRow[]
): ContractDetail {
  const signers = (row.contract_tenants ?? []).map(toContractTenant);
  const occupants = occupantRows.map(toContractOccupant);
  const primaryTenant =
    signers.find((tenant) => tenant.isRepresentative) ??
    (occupants.find((occupant) => occupant.isPrimaryTenant)
      ? {
          id: occupants.find((occupant) => occupant.isPrimaryTenant)!.id,
          fullName: occupants.find((occupant) => occupant.isPrimaryTenant)!.fullName,
          avatarUrl: occupants.find((occupant) => occupant.isPrimaryTenant)!.avatarUrl,
          cccd: occupants.find((occupant) => occupant.isPrimaryTenant)!.cccd,
          phone: occupants.find((occupant) => occupant.isPrimaryTenant)!.phone,
          email: occupants.find((occupant) => occupant.isPrimaryTenant)!.email,
          isRepresentative: true,
          joinedAt: occupants.find((occupant) => occupant.isPrimaryTenant)!.moveInAt,
          leftAt: occupants.find((occupant) => occupant.isPrimaryTenant)!.moveOutAt,
        }
      : undefined);

  const base = toContract(row, occupants);

  return {
    ...base,
    signingDate: row.signing_date ?? undefined,
    depositAmount: row.deposit_amount ?? 0,
    depositStatusRaw: row.deposit_status ?? undefined,
    depositStatus: mapDepositStatus.fromDb(
      row.deposit_status ?? 'pending'
    ) as ContractDetail['depositStatus'],
    paymentDueDay: row.payment_due_day ?? 5,
    noticePeriodDays: row.notice_period_days ?? undefined,
    terminationDate: row.terminated_at ?? undefined,
    terminationReason: row.termination_reason ?? undefined,
    tenants: signers,
    primaryTenant,
    occupants,
    services: serviceRows.map(toContractService),
    renewals: renewalRows.map(toContractRenewal),
    invoices: invoiceRows.map(toContractInvoice),
    transfers: transferRows.map(toContractTransfer),
    addendumSourceAvailable,
    addendums: addendumRows.map(toContractAddendum),
  };
}

async function fetchContractRow(id: number): Promise<ContractRow> {
  return (await unwrap(
    supabase
      .from('contracts')
      .select(
        `id, uuid, contract_code, room_id, primary_tenant_id, linked_contract_id,
         start_date, end_date, signing_date, payment_cycle_months, payment_due_day, notice_period_days, occupants_for_billing,
         monthly_rent, deposit_amount, deposit_status, status, termination_reason, terminated_at, terms,
         rooms(id, room_code, building_id, buildings(name)),
         contract_tenants(id, contract_id, tenant_id, is_primary,
           tenants(id, full_name, id_number, phone, email, profile_id,
             profiles(avatar_url)
           )
         )`
      )
      .eq('id', id)
      .single()
  )) as unknown as ContractRow;
}

export const contractService = {
  getContracts: async (filters: ContractFilter = {}): Promise<Contract[]> => {
    let query = supabase
      .from('contracts')
      .select(
        `id, uuid, contract_code, room_id, primary_tenant_id, start_date, end_date,
         payment_cycle_months, payment_due_day, occupants_for_billing, monthly_rent, deposit_status, status, terms,
         rooms!inner(id, room_code, building_id, buildings(name)),
         contract_tenants(id, contract_id, tenant_id, is_primary,
           tenants(id, full_name, id_number, phone, email, profile_id,
             profiles(avatar_url)
           )
         )`
      )
      .eq('is_deleted', false);

    if (filters.status && filters.status !== '' && filters.status !== 'All') {
      query = query.eq('status', mapContractStatus.toDb(filters.status) as DbContractStatus);
    }

    if (filters.buildingId && filters.buildingId !== '') {
      query = query.eq('rooms.building_id', Number(filters.buildingId));
    }

    if (filters.roomCode && filters.roomCode !== '') {
      query = query.ilike('rooms.room_code', `%${filters.roomCode}%`);
    }

    if (filters.search && filters.search !== '') {
      const searchPattern = `%${filters.search}%`;
      query = query.or(`contract_code.ilike.${searchPattern}`);
    }

    if (filters.startDateFrom) query = query.gte('start_date', filters.startDateFrom);
    if (filters.startDateTo) query = query.lte('start_date', filters.startDateTo);
    if (filters.endDateFrom) query = query.gte('end_date', filters.endDateFrom);
    if (filters.endDateTo) query = query.lte('end_date', filters.endDateTo);
    if (filters.minRent) query = query.gte('monthly_rent', filters.minRent);
    if (filters.maxRent) query = query.lte('monthly_rent', filters.maxRent);

    if (filters.expiringSoon) {
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
      query = query
        .lte('end_date', thirtyDaysLater.toISOString().split('T')[0])
        .gte('end_date', new Date().toISOString().split('T')[0])
        .eq('status', 'active');
    }

    query = query.order('id', { ascending: false });

    const rows = (await unwrap(query)) as unknown as ContractRow[];
    let contracts = rows.map((row) => toContract(row));

    if (filters.search && filters.search !== '') {
      const term = filters.search.toLowerCase();
      contracts = contracts.filter((contract) =>
        contract.contractCode.toLowerCase().includes(term) ||
        contract.tenantName.toLowerCase().includes(term) ||
        contract.roomCode.toLowerCase().includes(term)
      );
    }

    return contracts;
  },

  getContractDetail: async (id: string): Promise<ContractDetail> => {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      throw new Error(`[contractService] Invalid contract id: "${id}"`);
    }

    const db = supabase as any;

    const [contractRow, serviceRows, renewalRows, invoiceRows, occupantRows, transferRows, addendumSourceAvailable, addendumRows] =
      await Promise.all([
        fetchContractRow(numId),
        unwrap(
          supabase
            .from('contract_services')
            .select(
              `id, contract_id, service_catalog_id, quantity, fixed_price,
               service_catalog!contract_services_service_catalog_id_fkey(id, name, unit, billing_method)`
            )
            .eq('contract_id', numId)
        ) as unknown as Promise<ContractServiceRow[]>,
        unwrap(
          supabase
            .from('contract_renewals')
            .select('id, contract_id, previous_end_date, new_end_date, new_monthly_rent, reason, created_at')
            .eq('contract_id', numId)
            .order('created_at', { ascending: false })
        ) as unknown as Promise<ContractRenewalRow[]>,
        unwrap(
          supabase
            .from('invoices')
            .select('id, invoice_code, billing_period, total_amount, amount_paid, balance_due, due_date, paid_date, status, created_at')
            .eq('contract_id', numId)
            .order('created_at', { ascending: false })
        ) as unknown as Promise<ContractInvoiceRow[]>,
        unwrap(
          db
            .from('room_occupants')
            .select(
              `id, contract_id, room_id, tenant_id, is_primary_tenant, relationship_to_primary, note,
               move_in_at, move_out_at, status,
               tenants(id, full_name, id_number, phone, email, profile_id, profiles(avatar_url))`
            )
            .eq('contract_id', numId)
            .order('is_primary_tenant', { ascending: false })
            .order('move_in_at', { ascending: true })
        ) as Promise<RoomOccupantRow[]>,
        unwrap(
          db
            .from('contract_transfers')
            .select(
              `id, old_contract_id, new_contract_id, from_tenant_id, to_tenant_id, transfer_date,
               status, deposit_mode, carry_over_deposit_amount, note, approved_by, created_at,
               from_tenant:tenants!contract_transfers_from_tenant_id_fkey(id, full_name),
               to_tenant:tenants!contract_transfers_to_tenant_id_fkey(id, full_name)`
            )
            .or(`old_contract_id.eq.${numId},new_contract_id.eq.${numId}`)
            .order('transfer_date', { ascending: false })
        ) as Promise<ContractTransferRow[]>,
        (async (): Promise<boolean> => {
          const { error } = await db
            .from('contract_addendums')
            .select('id', { head: true, count: 'exact' })
            .eq('contract_id', numId);

          return !error;
        })(),
        unwrap(
          db
            .from('contract_addendums')
            .select('id, addendum_code, addendum_type, title, content, effective_date, status, signed_file_url, summary_json, created_at, source_type, version_no, parent_addendum_id')
            .eq('contract_id', numId)
            .order('effective_date', { ascending: false })
            .order('version_no', { ascending: false })
            .order('created_at', { ascending: false })
        ) as Promise<ContractAddendumQueryRow[]>,
      ]);

    return toContractDetail(
      contractRow,
      serviceRows,
      renewalRows,
      invoiceRows,
      occupantRows,
      transferRows,
      addendumSourceAvailable,
      addendumRows
    );
  },

  exportContracts: async (_filters: ContractFilter): Promise<Blob> => {
    return new Blob([], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  },

  createContract: async (data: import('@/schemas/contractSchema').ContractFormData): Promise<Contract> => {
    const numRoomId = Number(data.roomId);
    if (!Number.isFinite(numRoomId)) {
      throw new Error(`[contractService] Invalid room id: "${data.roomId}"`);
    }

    const occupantIds = data.occupantIds.map((tenantId) => Number(tenantId)).filter(Number.isFinite);
    const representativeId = Number(data.primaryTenantId);
    const selectedServiceIds = data.selectedServices.map((id) => Number(id)).filter(Number.isFinite);
    const utilityPolicyId = data.utilityPolicyId ? Number(data.utilityPolicyId) : null;
    const legalDocumentUrls = data.ownerLegalConfirmation.supportingDocumentUrls.filter(Boolean);
    const legalBasisType =
      data.ownerLegalConfirmation.legalBasisType === 'Owner'
        ? 'owner'
        : data.ownerLegalConfirmation.legalBasisType === 'AuthorizedRepresentative'
          ? 'authorized_representative'
          : 'business_entity';

    if (!Number.isFinite(representativeId)) {
      throw new Error('Người đại diện không hợp lệ');
    }

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

    const { data: invokeResult, error } = await supabase.functions.invoke('create-contract', {
      body: {
        roomId: numRoomId,
        startDate: data.startDate,
        endDate: data.endDate,
        rentPrice: data.rentPrice,
        depositAmount: data.depositAmount,
        paymentCycle: data.paymentCycle,
        paymentDueDay: data.paymentDueDay,
        primaryTenantId: representativeId,
        occupantIds,
        utilityPolicyId,
        selectedServices: selectedServiceIds.map((id) => ({ serviceId: id })),
        markDepositReceived: data.depositAmount > 0,
        ownerRep: data.ownerRep,
        ownerLegalConfirmation: {
          ...data.ownerLegalConfirmation,
          legalBasisType,
          supportingDocumentUrls: legalDocumentUrls,
        },
      },
    });

    if (error) throw new Error(error.message);
    const result = invokeResult as RpcContractResult | null;

    if (!result?.contractId) {
      throw new Error('Không thể tạo hợp đồng');
    }

    const contractRow = await fetchContractRow(result.contractId);
    return toContract(contractRow);
  },

  addOccupant: async (payload: AddOccupantPayload) => {
    const { data, error } = await (supabase as any).rpc('add_contract_occupant', {
      p_contract_id: Number(payload.contractId),
      p_tenant_id: Number(payload.tenantId),
      p_move_in_date: payload.moveInDate,
      p_relationship_to_primary: payload.relationshipToPrimary ?? null,
      p_note: payload.note ?? null,
    });

    if (error) throw new Error(error.message);
    return data as {
      contractId: number;
      tenantId: number;
      activeOccupants: number;
    };
  },

  removeOccupant: async (payload: RemoveOccupantPayload) => {
    const { data, error } = await (supabase as any).rpc('remove_contract_occupant', {
      p_contract_id: Number(payload.contractId),
      p_tenant_id: Number(payload.tenantId),
      p_move_out_date: payload.moveOutDate,
      p_note: payload.note ?? null,
    });

    if (error) throw new Error(error.message);
    return data as {
      contractId: number;
      tenantId: number;
      remainingActiveOccupants: number;
      autoLiquidated: boolean;
    };
  },

  transferContract: async (payload: TransferContractPayload) => {
    const { data, error } = await (supabase as any).rpc('transfer_contract_representative', {
      p_old_contract_id: Number(payload.contractId),
      p_to_tenant_id: Number(payload.toTenantId),
      p_transfer_date: payload.transferDate,
      p_note: payload.note ?? null,
    });

    if (error) throw new Error(error.message);
    return data as {
      oldContractId: number;
      newContractId: number;
      newContractCode: string;
    };
  },

  liquidateContract: async (payload: LiquidateContractPayload) => {
    const { data, error } = await (supabase as any).rpc('liquidate_contract', {
      p_contract_id: Number(payload.contractId),
      p_termination_date: payload.terminationDate,
      p_reason: payload.reason,
      p_deposit_used: payload.depositUsed ?? 0,
      p_additional_charges: payload.additionalCharges ?? 0,
    });

    if (error) throw new Error(error.message);
    return data as {
      contractId: number;
      roomId: number;
      status: string;
    };
  },
};
