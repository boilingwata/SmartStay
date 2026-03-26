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

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const tenantService = {
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
        .select('id, uuid, full_name, id_number, date_of_birth, gender, phone, email, permanent_address, emergency_contact_name, emergency_contact_phone, documents')
        .eq('is_deleted', false)
    );

    if (!tenants || tenants.length === 0) return [];

    // Fetch all contract_tenant links with nested contract + room info
    const contractLinks = await unwrap(
      supabase
        .from('contract_tenants')
        .select('tenant_id, is_primary, contracts(id, status, is_deleted, room_id, rooms(id, room_code))')
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

      // An active contract is one with status='active' and not deleted
      const activeLink = links.find(
        (l) => l.contracts?.status === 'active' && !l.contracts?.is_deleted
      );

      const hasActiveContract = !!activeLink;
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
        avatarUrl: undefined,
        onboardingPercent,
        hasActiveContract,
        isRepresentative: activeLink?.is_primary ?? false,
      };

      return summary;
    });

    // Apply filters
    let result = summaries;

    if (filters?.status && filters.status !== 'All') {
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
        .select('id, uuid, full_name, id_number, date_of_birth, gender, phone, email, permanent_address, emergency_contact_name, emergency_contact_phone, documents')
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

    // Parse vehiclePlates from documents jsonb if present
    const docs = row.documents as Record<string, unknown> | null;
    const vehiclePlates: string[] = Array.isArray(docs?.vehicle_plates)
      ? (docs!.vehicle_plates as string[])
      : [];

    const profile: TenantProfile = {
      id: String(row.id),
      fullName: row.full_name,
      phone: row.phone ?? '',
      email: row.email ?? undefined,
      cccd: row.id_number,
      status,
      currentRoomId: activeLink?.contracts?.room_id != null
        ? String(activeLink.contracts.room_id)
        : undefined,
      currentRoomCode: activeLink?.contracts?.rooms?.room_code ?? undefined,
      avatarUrl: undefined,
      onboardingPercent,
      // TenantProfile-specific fields
      gender: mapGender.fromDb(row.gender ?? 'other') as 'Male' | 'Female' | 'Other',
      dateOfBirth: row.date_of_birth ?? '',
      permanentAddress: row.permanent_address ?? '',
      // Fields not stored in DB — sensible defaults
      cccdIssuedDate: '',
      cccdIssuedPlace: '',
      nationality: 'Việt Nam',
      occupation: '',
      vehiclePlates,
      notes: (docs?.notes as string | undefined) ?? '',
    };

    return profile;
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
    // Room handover has no DB field — default to false
    const isRoomHandovered = false;

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

  // -------------------------------------------------------------------------
  // Stubs — no corresponding DB tables yet
  // -------------------------------------------------------------------------

  getFeedback: async (_id: string): Promise<TenantFeedback[]> => [],
  getNPSSurveys: async (_id: string): Promise<NPSSurvey[]> => [],
  getContactGroups: async (): Promise<ContactGroup[]> => [],
};

export default tenantService;
