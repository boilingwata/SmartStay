import {
  TenantSummary, TenantProfile, TenantStatus,
  EmergencyContact, OnboardingProgress,
  TenantFeedback, NPSSurvey, ContactGroup
} from '@/models/Tenant';
import { TenantBalance, TenantBalanceTransaction, TransactionType } from '@/models/TenantBalance';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { mapGender } from '@/lib/enumMaps';

// ---------------------------------------------------------------------------
// Internal DB row shapes used in multi-table joins
// ---------------------------------------------------------------------------

interface DbTenantRow {
  id: number;
  uuid: string;
  full_name: string;
  id_number: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  permanent_address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  documents: unknown | null;
  profile_id?: string | null;
}

interface DuplicateTenantRow {
  id: number;
  full_name: string;
}

interface DbContractTenantJoined {
  tenant_id: number;
  is_primary: boolean | null;
  contracts: {
    id: number;
    status: string | null;
    is_deleted: boolean | null;
    room_id: number;
    rooms: {
      id: number;
      room_code: string;
      building_id: number;
    } | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map DB transaction_type → frontend TransactionType */
function mapTransactionType(dbType: string): TransactionType {
  const map: Record<string, TransactionType> = {
    deposit: 'ManualTopUp',
    deduction: 'ManualDeduct',
    refund: 'Refund',
    adjustment: 'Correction',
  };
  return map[dbType] ?? 'Other';
}

/** Derive TenantStatus from whether the tenant has an active contract. */
function deriveTenantStatus(hasActive: boolean): TenantStatus {
  return hasActive ? 'Active' : 'CheckedOut';
}

/**
 * Compute a naive onboarding percent for a tenant based on which fields
 * are populated. Six equally-weighted steps.
 */
function computeOnboardingPercent(row: DbTenantRow, hasContract: boolean): number {
  const steps = [
    !!row.full_name,
    !!row.id_number,
    !!row.date_of_birth,
    !!row.emergency_contact_name,
    hasContract,
    !!row.permanent_address,
  ];
  const done = steps.filter(Boolean).length;
  return Math.round((done / steps.length) * 100);
}

function extractAvatarUrl(documents: unknown): string | undefined {
  if (!documents || typeof documents !== 'object') return undefined;
  const avatarUrl = (documents as Record<string, unknown>).avatar_url;
  return typeof avatarUrl === 'string' && avatarUrl.length > 0 ? avatarUrl : undefined;
}

function extractStringDocumentField(documents: unknown, key: string): string | undefined {
  if (!documents || typeof documents !== 'object') return undefined;
  const value = (documents as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function extractVehiclePlates(documents: unknown): string[] {
  if (!documents || typeof documents !== 'object') return [];
  const value = (documents as Record<string, unknown>).vehicle_plates;
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function normalizeIdNumber(value: string): string {
  return value.trim();
}

function isDuplicateIdNumberError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('tenants_id_number_key')
    || (lower.includes('duplicate key value') && lower.includes('id_number'));
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const tenantService = {
  findTenantByIdNumber: async (idNumber: string): Promise<{ id: string; fullName: string } | null> => {
    const normalizedIdNumber = normalizeIdNumber(idNumber);
    if (!normalizedIdNumber) return null;

    const row = await unwrap(
      supabase
        .from('tenants')
        .select('id, full_name')
        .eq('id_number', normalizedIdNumber)
        .eq('is_deleted', false)
        .maybeSingle()
    ) as unknown as DuplicateTenantRow | null;

    if (!row) return null;

    return {
      id: String(row.id),
      fullName: row.full_name,
    };
  },

  /**
   * Return a flat list of TenantSummary rows.
   * Joins contract_tenants → contracts → rooms to determine active status
   * and current room. Applies optional status/search filters.
   */
  getTenants: async (filters?: {
    status?: string | string[];
    search?: string;
    buildingId?: string | number;
    hasActiveContract?: boolean | string;
    onboardingComplete?: boolean | string;
  }): Promise<TenantSummary[]> => {
    // Fetch all non-deleted tenants
    const tenants = await unwrap(
      supabase
        .from('tenants')
        .select('id, uuid, profile_id, full_name, id_number, date_of_birth, gender, phone, email, permanent_address, emergency_contact_name, emergency_contact_phone, documents')
        .eq('is_deleted', false)
    );

    if (!tenants || tenants.length === 0) return [];

    // Fetch all contract_tenant links with nested contract + room info
    const contractLinks = await unwrap(
      supabase
        .from('contract_tenants')
        .select('tenant_id, is_primary, contracts(id, status, is_deleted, room_id, rooms(id, room_code, building_id))')
    ) as unknown as DbContractTenantJoined[];

    // Build a lookup: tenantId → list of contract links
    const linksByTenant = new Map<number, DbContractTenantJoined[]>();
    for (const link of contractLinks ?? []) {
      const existing = linksByTenant.get(link.tenant_id) ?? [];
      existing.push(link);
      linksByTenant.set(link.tenant_id, existing);
    }

    const summaries: TenantSummary[] = tenants.map((t) => {
      const links = linksByTenant.get(t.id) ?? [];

      const getScore = (status: string | null | undefined): number => {
        if (status === 'active') return 3;
        if (status === 'draft' || status === 'pending_signature') return 2;
        if (status === 'expired' || status === 'terminated') return 1;
        return 0;
      };

      // Find the most relevant contract link:
      // Priority: active > draft/pending_signature > everything else
      const activeLink = [...links].sort((a, b) => {
        return getScore(b.contracts?.status) - getScore(a.contracts?.status);
      })[0];

      const hasActiveContract = activeLink?.contracts?.status === 'active';
      const status = deriveTenantStatus(hasActiveContract);
      const onboardingPercent = computeOnboardingPercent(t as DbTenantRow, hasActiveContract);

      const summary: TenantSummary = {
        id: String(t.id),
        fullName: t.full_name,
        phone: t.phone ?? '',
        email: t.email ?? undefined,
        cccd: t.id_number,
        status,
        currentRoomId: activeLink?.contracts?.room_id != null
          ? String(activeLink.contracts.room_id)
          : undefined,
        currentRoomCode: activeLink?.contracts?.rooms?.room_code ?? undefined,
        currentBuildingId: activeLink?.contracts?.rooms?.building_id != null
          ? String(activeLink.contracts.rooms.building_id)
          : undefined,
        avatarUrl: extractAvatarUrl(t.documents),
        onboardingPercent,
        hasActiveContract,
        isRepresentative: activeLink?.is_primary ?? false,
      };

      return summary;
    });

    // Apply filters
    let result = summaries;

    if (filters?.status && filters.status !== 'All' && (Array.isArray(filters.status) ? filters.status.length > 0 : true)) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      result = result.filter((t) => statuses.includes(t.status));
    }

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.fullName.toLowerCase().includes(s) ||
          t.phone.includes(s) ||
          (t.email ?? '').toLowerCase().includes(s)
      );
    }

    if (filters?.hasActiveContract !== undefined) {
      const active = filters.hasActiveContract === true || filters.hasActiveContract === 'true';
      result = result.filter((t) => t.hasActiveContract === active);
    }

    if (filters?.onboardingComplete !== undefined) {
      const complete = filters.onboardingComplete === true || filters.onboardingComplete === 'true';
      if (complete) {
        result = result.filter((t) => t.onboardingPercent === 100);
      } else {
        result = result.filter((t) => t.onboardingPercent < 100);
      }
    }

    if (filters?.buildingId) {
      const bId = String(filters.buildingId);
      result = result.filter((t) => t.currentBuildingId === bId);
    }

    return result;
  },

  /**
   * Return full TenantProfile for a single tenant by numeric string id.
   */
  getTenantDetail: async (id: string): Promise<TenantProfile> => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      throw new Error(`[tenantService] getTenantDetail: invalid id "${id}"`);
    }

    const row = await unwrap(
      supabase
        .from('tenants')
        .select('id, uuid, profile_id, full_name, id_number, date_of_birth, gender, phone, email, permanent_address, emergency_contact_name, emergency_contact_phone, documents')
        .eq('id', numericId)
        .eq('is_deleted', false)
        .single()
    );

    // Determine active contract + room
    const contractLinks = await unwrap(
      supabase
        .from('contract_tenants')
        .select('tenant_id, is_primary, contracts(id, status, is_deleted, room_id, rooms(id, room_code))')
        .eq('tenant_id', numericId)
    ) as unknown as DbContractTenantJoined[];

    const activeLink = (contractLinks ?? []).find(
      (l) => l.contracts?.status === 'active' && !l.contracts?.is_deleted
    );

    const hasActiveContract = !!activeLink;
    const status = deriveTenantStatus(hasActiveContract);
    const onboardingPercent = computeOnboardingPercent(row as unknown as DbTenantRow, hasActiveContract);

    const docs = row.documents as Record<string, unknown> | null;
    const vehiclePlates = extractVehiclePlates(docs);
    const nationality = extractStringDocumentField(docs, 'nationality') ?? 'Việt Nam';
    const occupation = extractStringDocumentField(docs, 'occupation') ?? '';

    const profile: TenantProfile = {
      id: String(row.id),
      profileId: row.profile_id ?? undefined,
      hasPortalAccount: !!row.profile_id,
      fullName: row.full_name,
      phone: row.phone ?? '',
      email: row.email ?? undefined,
      cccd: row.id_number,
      status,
      currentRoomId: activeLink?.contracts?.room_id != null
        ? String(activeLink.contracts.room_id)
        : undefined,
      currentRoomCode: activeLink?.contracts?.rooms?.room_code ?? undefined,
      avatarUrl: extractAvatarUrl(row.documents),
      onboardingPercent,
      // TenantProfile-specific fields
      gender: mapGender.fromDb(row.gender ?? 'other') as 'Male' | 'Female' | 'Other',
      dateOfBirth: row.date_of_birth ?? '',
      permanentAddress: row.permanent_address ?? '',
      cccdIssuedDate: (docs?.cccd_issued_date as string) ?? '',
      cccdIssuedPlace: (docs?.cccd_issued_place as string) ?? '',
      nationality,
      occupation,
      vehiclePlates,
      notes: (docs?.notes as string | undefined) ?? '',
    };

    return profile;
  },

  /**
   * Return all contracts associated with a tenant.
   */
  getTenantContracts: async (tenantId: string): Promise<import('@/models/Contract').Contract[]> => {
    const numericId = Number(tenantId);
    const contractLinks = await unwrap(
      supabase
        .from('contract_tenants')
        .select(`
          contract_id,
          is_primary,
          contracts(
            id, uuid, contract_code, room_id, start_date, end_date,
            monthly_rent, payment_cycle_months, status, is_deleted,
            rooms(id, room_code, building_id, buildings(name))
          )
        `)
        .eq('tenant_id', numericId)
    ) as unknown as any[];

    return (contractLinks ?? [])
      .filter(l => l.contracts && !l.contracts.is_deleted)
      .map(l => {
        const c = l.contracts;
        const room = c.rooms;
        return {
          id: String(c.id),
          contractCode: c.contract_code,
          roomId: String(c.room_id),
          roomCode: room?.room_code ?? '',
          buildingName: room?.buildings?.name ?? '',
          tenantName: '', // Will be filled if needed
          status: (c.status.charAt(0).toUpperCase() + c.status.slice(1)) as any,
          rentPriceSnapshot: c.monthly_rent ?? 0,
          startDate: c.start_date,
          endDate: c.end_date,
          paymentCycle: c.payment_cycle_months ?? 1,
          isRepresentative: l.is_primary ?? false,
          type: 'Residential' as any,
          autoRenew: false
        };
      });
  },

  /**
   * Return all invoices for all contracts associated with a tenant.
   */
  getTenantInvoices: async (tenantId: string): Promise<any[]> => {
    const numericId = Number(tenantId);
    
    // 1. Get all contract IDs for this tenant
    const contractLinks = await unwrap(
      supabase
        .from('contract_tenants')
        .select('contract_id')
        .eq('tenant_id', numericId)
    ) as unknown as { contract_id: number }[];

    const contractIds = contractLinks?.map(l => l.contract_id) ?? [];
    if (contractIds.length === 0) return [];

    // 2. Fetch invoices for these contracts
    const invoices = await unwrap(
      supabase
        .from('invoices')
        .select('id, invoice_code, billing_period, total_amount, amount_paid, due_date, status, contract_id')
        .in('contract_id', contractIds)
        .order('due_date', { ascending: false })
    );

    return (invoices ?? []).map(inv => ({
      id: String(inv.id),
      code: inv.invoice_code,
      billingPeriod: inv.billing_period,
      amount: inv.total_amount,
      amountPaid: inv.amount_paid,
      dueDate: inv.due_date,
      status: (inv.status ? (inv.status.charAt(0).toUpperCase() + inv.status.slice(1).replace('_', ' ')) : 'Unpaid') as any,
      contractId: String(inv.contract_id)
    }));
  },

  /**
   * Return the current wallet balance for a tenant.
   */
  getTenantBalance: async (id: string): Promise<TenantBalance> => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      throw new Error(`[tenantService] getTenantBalance: invalid id "${id}"`);
    }

    const row = await unwrap(
      supabase
        .from('tenant_balances')
        .select('tenant_id, balance, last_updated')
        .eq('tenant_id', numericId)
        .single()
    );

    return {
      tenantId: String(row.tenant_id),
      currentBalance: row.balance ?? 0,
      lastUpdated: row.last_updated ?? new Date().toISOString(),
      lastUpdatedAt: row.last_updated ?? new Date().toISOString(),
    };
  },

  /**
   * Return the full transaction ledger for a tenant from balance_history.
   */
  getTenantLedger: async (id: string): Promise<TenantBalanceTransaction[]> => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      throw new Error(`[tenantService] getTenantLedger: invalid id "${id}"`);
    }

    const rows = await unwrap(
      supabase
        .from('balance_history')
        .select('id, tenant_id, transaction_type, amount, balance_before, balance_after, notes, invoice_id, created_by, created_at')
        .eq('tenant_id', numericId)
        .order('created_at', { ascending: false })
    );

    return (rows ?? []).map((r): TenantBalanceTransaction => ({
      id: String(r.id),
      tenantId: String(r.tenant_id),
      type: mapTransactionType(r.transaction_type),
      amount: r.amount,
      balanceBefore: r.balance_before,
      balanceAfter: r.balance_after,
      description: r.notes ?? '',
      relatedInvoiceId: r.invoice_id != null ? String(r.invoice_id) : undefined,
      createdAt: r.created_at ?? new Date().toISOString(),
    }));
  },

  /**
   * Alias for getTenantLedger — used by some views under a different name.
   */
  getTenantBalanceTransactions: async (id: string): Promise<TenantBalanceTransaction[]> => {
    return tenantService.getTenantLedger(id);
  },

  /**
   * Return emergency contacts derived from the tenants table columns
   * (emergency_contact_name / emergency_contact_phone).
   * The DB has no dedicated emergency_contacts table, so we synthesise a
   * single-element array when data is present.
   */
  getEmergencyContacts: async (id: string): Promise<EmergencyContact[]> => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      throw new Error(`[tenantService] getEmergencyContacts: invalid id "${id}"`);
    }

    const row = await unwrap(
      supabase
        .from('tenants')
        .select('id, emergency_contact_name, emergency_contact_phone')
        .eq('id', numericId)
        .eq('is_deleted', false)
        .single()
    );

    if (!row.emergency_contact_name && !row.emergency_contact_phone) {
      return [];
    }

    return [
      {
        id: `ec-${row.id}`,
        tenantId: String(row.id),
        contactName: row.emergency_contact_name ?? '',
        relationship: 'Khac',
        phone: row.emergency_contact_phone ?? '',
        email: undefined,
        isPrimary: true,
      },
    ];
  },

  /**
   * Compute onboarding progress by inspecting tenant fields and checking
   * whether an active contract and deposit exist.
   */
  getOnboardingProgress: async (id: string): Promise<OnboardingProgress> => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      throw new Error(`[tenantService] getOnboardingProgress: invalid id "${id}"`);
    }

    const row = await unwrap(
      supabase
        .from('tenants')
        .select('id, full_name, id_number, date_of_birth, permanent_address, emergency_contact_name, documents')
        .eq('id', numericId)
        .eq('is_deleted', false)
        .single()
    );

    const contractLinks = await unwrap(
      supabase
        .from('contract_tenants')
        .select('contracts(id, status, is_deleted, deposit_status)')
        .eq('tenant_id', numericId)
    ) as unknown as { contracts: { status: string | null; is_deleted: boolean | null; deposit_status: string | null } | null }[];

    const activeContract = (contractLinks ?? []).find(
      (l) => l.contracts?.status === 'active' && !l.contracts?.is_deleted
    );

    const docs = row.documents as Record<string, unknown> | null;
    const hasCCCDDoc = Array.isArray(docs?.cccd_images)
      ? (docs!.cccd_images as unknown[]).length > 0
      : false;

    const isPersonalInfoConfirmed = !!(row.full_name && row.id_number && row.date_of_birth);
    const isCCCDUploaded = hasCCCDDoc;
        const isEmergencyContactAdded = !!row.emergency_contact_name;
    const isContractSigned = !!activeContract;
    const isDepositPaid =
      !!activeContract?.contracts?.deposit_status &&
      ['received', 'partially_refunded'].includes(activeContract.contracts.deposit_status);
    
    // Room handover derived from active contract + room status if possible
    // For now, if contract is active, we assume room is handovered unless there's a specific flag
    const isRoomHandovered = !!activeContract && activeContract.contracts?.status === 'active';

    const steps = [
      isPersonalInfoConfirmed,
      isCCCDUploaded,
      isEmergencyContactAdded,
      isContractSigned,
      isDepositPaid,
      isRoomHandovered,
    ];
    const completionPercent = Math.round(
      (steps.filter(Boolean).length / steps.length) * 100
    );

    return {
      tenantId: id,
      isPersonalInfoConfirmed,
      isCCCDUploaded,
      isEmergencyContactAdded,
      isContractSigned,
      isDepositPaid,
      isRoomHandovered,
      completionPercent,
    };
  },

  /**
   * Check whether a given CCCD/id_number already exists (including soft-deleted rows).
   * Returns the tenant row if found, null otherwise.
   */
  checkIdNumberExists: async (idNumber: string): Promise<{ id: number; full_name: string; is_deleted: boolean } | null> => {
    const { data, error } = await supabase
      .from('tenants')
      .select('id, full_name, is_deleted')
      .eq('id_number', idNumber)
      .maybeSingle();

    if (error) {
      console.error('[tenantService] checkIdNumberExists error:', error);
      return null;
    }
    return data as { id: number; full_name: string; is_deleted: boolean } | null;
  },

  /**
   * Create a new tenant record in the `tenants` table.
   * Pre-validates uniqueness of id_number to provide a friendly error
   * instead of a raw PostgreSQL constraint violation.
   */
  createTenant: async (data: {
    fullName: string;
    phone: string;
    email?: string;
    cccd: string;
    dateOfBirth?: string;
    gender?: string;
    nationality?: string;
    occupation?: string;
    permanentAddress?: string;
    vehiclePlates?: string[];
    avatarUrl?: string;
  }): Promise<TenantSummary> => {
    const normalizedIdNumber = normalizeIdNumber(data.cccd);

    // --- Pre-flight: check for duplicate CCCD ---
    if (normalizedIdNumber) {
      const existing = await tenantService.checkIdNumberExists(normalizedIdNumber);
      if (existing) {
        if (existing.is_deleted) {
          throw new Error(
            `Số CCCD "${normalizedIdNumber}" đã tồn tại trong hệ thống (cư dân "${existing.full_name}" đã bị xoá). Vui lòng liên hệ quản trị viên để khôi phục hồ sơ.`
          );
        } else {
          throw new Error(
            `Số CCCD "${normalizedIdNumber}" đã được đăng ký bởi cư dân "${existing.full_name}". Mỗi CCCD chỉ được dùng cho một cư dân.`
          );
        }
      }
    }

    const genderMap: Record<string, string> = { Male: 'male', Female: 'female', Other: 'other' };
    const documentsPayload: Record<string, unknown> = {};
    if (data.vehiclePlates && data.vehiclePlates.length > 0) {
      documentsPayload.vehicle_plates = data.vehiclePlates;
    }
    if (data.avatarUrl) {
      documentsPayload.avatar_url = data.avatarUrl;
    }
    if (data.nationality) {
      documentsPayload.nationality = data.nationality.trim();
    }
    if (data.occupation) {
      documentsPayload.occupation = data.occupation.trim();
    }

    try {
      const row = await unwrap(
        supabase
          .from('tenants')
          .insert({
            full_name: data.fullName,
            phone: data.phone || null,
            email: data.email || null,
            id_number: normalizedIdNumber,
            date_of_birth: data.dateOfBirth || null,
            gender: genderMap[data.gender ?? 'Other'] ?? 'other',
            permanent_address: data.permanentAddress || null,
            documents: Object.keys(documentsPayload).length > 0 ? documentsPayload : null,
            is_deleted: false,
          })
          .select('id, full_name, id_number, phone, email, date_of_birth, gender, permanent_address, emergency_contact_name, emergency_contact_phone, documents')
          .single()
      ) as unknown as DbTenantRow;

      return {
        id: String(row.id),
        fullName: row.full_name,
        phone: row.phone ?? '',
        email: row.email ?? undefined,
        cccd: row.id_number,
        status: 'CheckedOut',
        currentRoomId: undefined,
        currentRoomCode: undefined,
        currentBuildingId: undefined,
        avatarUrl: extractAvatarUrl(row.documents),
        onboardingPercent: computeOnboardingPercent(row, false),
        hasActiveContract: false,
        isRepresentative: false,
      };
    } catch (err: unknown) {
      const message = (err as Error)?.message ?? '';
      if (message.includes('duplicate key') && message.includes('id_number')) {
        throw new Error(`Số CCCD "${normalizedIdNumber}" đã tồn tại trong hệ thống.`);
      }
      if (message.includes('duplicate key') && message.includes('phone')) {
        throw new Error(`Số điện thoại "${data.phone}" đã được đăng ký. Vui lòng dùng số khác.`);
      }
      throw err;
    }
  },

  /**
   * Update an existing tenant's profile fields.
   */
  updateTenant: async (
    id: string,
    data: {
      fullName?: string;
      phone?: string;
      email?: string;
      cccd?: string;
      dateOfBirth?: string;
      gender?: string;
      nationality?: string;
      occupation?: string;
      permanentAddress?: string;
      vehiclePlates?: string[];
      avatarUrl?: string;
    }
  ): Promise<void> => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      throw new Error(`[tenantService] updateTenant: invalid id "${id}"`);
    }
    const genderMap: Record<string, string> = { Male: 'male', Female: 'female', Other: 'other' };
    const updatePayload: Record<string, unknown> = {};
    if (data.fullName !== undefined) updatePayload.full_name = data.fullName;
    if (data.phone !== undefined) updatePayload.phone = data.phone || null;
    if (data.email !== undefined) updatePayload.email = data.email || null;
    if (data.cccd !== undefined) {
      const normalizedIdNumber = normalizeIdNumber(data.cccd);
      const existingTenant = await tenantService.findTenantByIdNumber(normalizedIdNumber);
      if (existingTenant && existingTenant.id !== id) {
        throw new Error(`CCCD ${normalizedIdNumber} đã tồn tại trong hệ thống.`);
      }
      updatePayload.id_number = normalizedIdNumber;
    }
    if (data.dateOfBirth !== undefined) updatePayload.date_of_birth = data.dateOfBirth || null;
    if (data.gender !== undefined) updatePayload.gender = genderMap[data.gender] ?? 'other';
    if (data.permanentAddress !== undefined) updatePayload.permanent_address = data.permanentAddress || null;
    if (
      data.vehiclePlates !== undefined
      || data.avatarUrl !== undefined
      || data.nationality !== undefined
      || data.occupation !== undefined
    ) {
      const existingRow = await unwrap(
        supabase
          .from('tenants')
          .select('documents')
          .eq('id', numericId)
          .single()
      ) as unknown as { documents: Record<string, unknown> | null };
      const nextDocuments = { ...(existingRow.documents ?? {}) } as Record<string, unknown>;
      if (data.vehiclePlates !== undefined) {
        nextDocuments.vehicle_plates = data.vehiclePlates;
      }
      if (data.avatarUrl !== undefined) {
        if (data.avatarUrl) nextDocuments.avatar_url = data.avatarUrl;
        else delete nextDocuments.avatar_url;
      }
      if (data.nationality !== undefined) {
        if (data.nationality.trim()) nextDocuments.nationality = data.nationality.trim();
        else delete nextDocuments.nationality;
      }
      if (data.occupation !== undefined) {
        if (data.occupation.trim()) nextDocuments.occupation = data.occupation.trim();
        else delete nextDocuments.occupation;
      }
      updatePayload.documents = Object.keys(nextDocuments).length > 0 ? nextDocuments : null;
    }
    await unwrap(
      supabase.from('tenants').update(updatePayload).eq('id', numericId)
    );
  },

  // -------------------------------------------------------------------------
  // Stubs — no corresponding DB tables yet
  // -------------------------------------------------------------------------

  getFeedback: async (_id: string): Promise<TenantFeedback[]> => [],
  getNPSSurveys: async (_id: string): Promise<NPSSurvey[]> => [],
  getContactGroups: async (): Promise<ContactGroup[]> => [],
};

export default tenantService;
