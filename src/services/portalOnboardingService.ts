import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';

export interface PortalOnboardingStatus {
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

interface TenantOnboardingRow {
  id: number;
  full_name: string | null;
  id_number: string | null;
  date_of_birth: string | null;
  emergency_contact_name: string | null;
  documents: unknown | null;
}

const EMPTY_STATUS: PortalOnboardingStatus = {
  completionPercent: 0,
  steps: {
    isPersonalInfoConfirmed: false,
    isCCCDUploaded: false,
    isEmergencyContactAdded: false,
    isRoomHandovered: false,
    isDepositPaid: false,
    isContractSigned: false,
  },
};

async function resolveProfileId(profileId?: string): Promise<string | null> {
  if (profileId) return profileId;

  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function getTenantRow(profileId?: string): Promise<TenantOnboardingRow | null> {
  const resolvedProfileId = await resolveProfileId(profileId);
  if (!resolvedProfileId) return null;

  try {
    return await unwrap(
      supabase
        .from('tenants')
        .select('id, full_name, id_number, date_of_birth, emergency_contact_name, documents')
        .eq('profile_id', resolvedProfileId)
        .eq('is_deleted', false)
        .single()
    ) as unknown as TenantOnboardingRow;
  } catch {
    return null;
  }
}

async function getContractSteps(tenantId: number): Promise<{
  isContractSigned: boolean;
  isDepositPaid: boolean;
}> {
  try {
    const contractLinks = await unwrap(
      supabase
        .from('contract_tenants')
        .select('contracts(status, is_deleted, deposit_status)')
        .eq('tenant_id', tenantId)
    ) as unknown as {
      contracts: { status: string | null; is_deleted: boolean | null; deposit_status: string | null } | null;
    }[];

    const activeContract = (contractLinks ?? []).find(
      (link) => link.contracts?.status === 'active' && !link.contracts?.is_deleted
    );

    return {
      isContractSigned: !!activeContract,
      isDepositPaid:
        !!activeContract?.contracts?.deposit_status &&
        ['received', 'partially_refunded'].includes(activeContract.contracts.deposit_status),
    };
  } catch {
    return {
      isContractSigned: false,
      isDepositPaid: false,
    };
  }
}

function buildStatus(row: TenantOnboardingRow, contractSteps: {
  isContractSigned: boolean;
  isDepositPaid: boolean;
}): PortalOnboardingStatus {
  const docs = row.documents as Record<string, unknown> | null;
  const hasCCCDDoc = Array.isArray(docs?.cccd_images)
    ? (docs!.cccd_images as unknown[]).length > 0
    : false;

  const status = {
    isPersonalInfoConfirmed: !!(row.full_name && row.id_number && row.date_of_birth),
    isCCCDUploaded: hasCCCDDoc,
    isEmergencyContactAdded: !!row.emergency_contact_name,
    // PO-01: isRoomHandovered is always false because neither the `contracts` nor
    // `tenants` table has a room-handover timestamp/flag column.
    // TO ENABLE: add `room_handover_at TIMESTAMPTZ` to the `contracts` table,
    // then check `activeContract.contracts?.room_handover_at != null` here.
    isRoomHandovered: false,
    isDepositPaid: contractSteps.isDepositPaid,
    isContractSigned: contractSteps.isContractSigned,
  };

  const completionPercent = Math.round(
    (Object.values(status).filter(Boolean).length / Object.keys(status).length) * 100
  );

  return {
    completionPercent,
    steps: status,
  };
}

export const portalOnboardingService = {
  getStatus: async (): Promise<PortalOnboardingStatus> => {
    const tenantRow = await getTenantRow();
    if (!tenantRow) return EMPTY_STATUS;

    const contractSteps = await getContractSteps(tenantRow.id);
    return buildStatus(tenantRow, contractSteps);
  },

  getStatusForProfile: async (profileId: string): Promise<PortalOnboardingStatus> => {
    const tenantRow = await getTenantRow(profileId);
    if (!tenantRow) return EMPTY_STATUS;

    const contractSteps = await getContractSteps(tenantRow.id);
    return buildStatus(tenantRow, contractSteps);
  },

  activateResident: async (profileId?: string): Promise<void> => {
    const resolvedProfileId = await resolveProfileId(profileId);
    if (!resolvedProfileId) return;

    await unwrap(
      supabase
        .from('profiles')
        .update({ tenant_stage: 'resident_active' })
        .eq('id', resolvedProfileId)
    );
  },
};

export default portalOnboardingService;
