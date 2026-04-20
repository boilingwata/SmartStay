import { toContractAddendum, toDbAddendumStatus, toDbAddendumType } from '@/lib/contractAddendums';
import { unwrap } from '@/lib/supabaseHelpers';
import { supabase } from '@/lib/supabase';
import { ContractAddendum } from '@/models/Contract';
import { fileService } from './fileService';

export interface AddendumFormInput {
  contractId: number;
  addendumCode?: string;
  type: ContractAddendum['type'];
  title: string;
  content: string;
  effectiveDate: string;
  status: ContractAddendum['status'];
  fileUrl?: string;
  summary?: Record<string, unknown>;
}

export interface AdminAddendumListItem extends ContractAddendum {
  contractId: string;
  contractCode: string;
  tenantName: string;
  roomCode: string;
  buildingName: string;
}

async function buildNextAddendumCode(contractId: number): Promise<string> {
  const contract = await unwrap(
    (supabase as any)
      .from('contracts')
      .select('contract_code')
      .eq('id', contractId)
      .single()
  ) as { contract_code: string };

  const rows = await unwrap(
    (supabase as any)
      .from('contract_addendums')
      .select('id')
      .eq('contract_id', contractId)
  ) as Array<{ id: number }>;

  const nextSequence = String((rows?.length ?? 0) + 1).padStart(2, '0');
  return `PL-${contract.contract_code}-${nextSequence}`;
}

export const portalAddendumService = {
  uploadAddendumFile: async (file: File): Promise<string> =>
    fileService.uploadFile(file, file.name, {
      allowedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      maxSize: 10 * 1024 * 1024,
      pathPrefix: 'contracts/addendums',
    }),

  listByContract: async (contractId: number): Promise<ContractAddendum[]> => {
    const rows = await unwrap(
      (supabase as any)
        .from('contract_addendums')
        .select('id, addendum_code, addendum_type, title, content, effective_date, status, signed_file_url, summary_json, created_at, source_type, version_no, parent_addendum_id')
        .eq('contract_id', contractId)
        .order('effective_date', { ascending: false })
        .order('version_no', { ascending: false })
        .order('created_at', { ascending: false })
    ) as Array<Record<string, unknown>>;

    return rows.map((row) =>
      toContractAddendum({
        id: Number(row.id),
        addendum_code: (row.addendum_code as string | null) ?? null,
        addendum_type: (row.addendum_type as string | null) ?? null,
        title: String(row.title ?? ''),
        content: (row.content as string | null) ?? null,
        effective_date: String(row.effective_date ?? ''),
        status: (row.status as string | null) ?? null,
        signed_file_url: (row.signed_file_url as string | null) ?? null,
        summary_json: (row.summary_json as Record<string, unknown> | null) ?? null,
        created_at: (row.created_at as string | null) ?? null,
        source_type: (row.source_type as string | null) ?? null,
        version_no: Number(row.version_no ?? 1),
        parent_addendum_id: row.parent_addendum_id ? Number(row.parent_addendum_id) : null,
      })
    );
  },

  listAdminAddendums: async (): Promise<AdminAddendumListItem[]> => {
    const rows = await unwrap(
      (supabase as any)
        .from('contract_addendums')
        .select(`
          id,
          contract_id,
          addendum_code,
          addendum_type,
          title,
          content,
          effective_date,
          status,
          signed_file_url,
          summary_json,
          created_at,
          source_type,
          version_no,
          parent_addendum_id,
          contracts (
            contract_code,
            rooms (
              room_code,
              buildings ( name )
            ),
            contract_tenants (
              is_primary,
              tenants ( full_name )
            )
          )
        `)
        .order('effective_date', { ascending: false })
        .order('created_at', { ascending: false })
    ) as Array<Record<string, unknown>>;

    return rows.map((row) => {
      const contract = (row.contracts as Record<string, unknown> | null) ?? {};
      const room = (contract.rooms as Record<string, unknown> | null) ?? {};
      const building = (room.buildings as Record<string, unknown> | null) ?? {};
      const contractTenants = (contract.contract_tenants as Array<Record<string, unknown>> | null) ?? [];
      const primaryTenant =
        contractTenants.find((item) => Boolean(item.is_primary)) ??
        contractTenants[0] ??
        null;
      const tenant = (primaryTenant?.tenants as Record<string, unknown> | null) ?? {};

      return {
        ...toContractAddendum({
          id: Number(row.id),
          addendum_code: (row.addendum_code as string | null) ?? null,
          addendum_type: (row.addendum_type as string | null) ?? null,
          title: String(row.title ?? ''),
          content: (row.content as string | null) ?? null,
          effective_date: String(row.effective_date ?? ''),
          status: (row.status as string | null) ?? null,
          signed_file_url: (row.signed_file_url as string | null) ?? null,
          summary_json: (row.summary_json as Record<string, unknown> | null) ?? null,
          created_at: (row.created_at as string | null) ?? null,
          source_type: (row.source_type as string | null) ?? null,
          version_no: Number(row.version_no ?? 1),
          parent_addendum_id: row.parent_addendum_id ? Number(row.parent_addendum_id) : null,
        }),
        contractId: String(row.contract_id ?? ''),
        contractCode: String(contract.contract_code ?? ''),
        tenantName: String(tenant.full_name ?? ''),
        roomCode: String(room.room_code ?? ''),
        buildingName: String(building.name ?? ''),
      };
    });
  },

  createAddendum: async (addendum: AddendumFormInput): Promise<ContractAddendum> => {
    void addendum.addendumCode;

    const { data, error } = await (supabase as any).rpc('create_contract_addendum', {
      p_contract_id: addendum.contractId,
      p_addendum_type: toDbAddendumType(addendum.type),
      p_title: addendum.title.trim(),
      p_content: addendum.content.trim() || null,
      p_effective_date: addendum.effectiveDate,
      p_status: toDbAddendumStatus(addendum.status),
      p_signed_file_url: addendum.fileUrl?.trim() || null,
      p_summary_json: addendum.summary ?? {},
      p_source_type: 'manual',
      p_parent_addendum_id: addendum.summary?.parentAddendumId ?? null,
    });

    if (error) throw new Error(error.message);
    const row = data as Record<string, unknown>;

    return toContractAddendum({
      id: Number(row.id),
      addendum_code: (row.addendum_code as string | null) ?? null,
      addendum_type: (row.addendum_type as string | null) ?? null,
      title: String(row.title ?? ''),
      content: (row.content as string | null) ?? null,
      effective_date: String(row.effective_date ?? ''),
      status: (row.status as string | null) ?? null,
      signed_file_url: (row.signed_file_url as string | null) ?? null,
      summary_json: (row.summary_json as Record<string, unknown> | null) ?? null,
      created_at: (row.created_at as string | null) ?? null,
      source_type: (row.source_type as string | null) ?? null,
      version_no: Number(row.version_no ?? 1),
      parent_addendum_id: row.parent_addendum_id ? Number(row.parent_addendum_id) : null,
    });
  },
};

export default portalAddendumService;
