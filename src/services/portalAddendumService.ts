import { toContractAddendum, toDbAddendumStatus, toDbAddendumType } from '@/lib/contractAddendums';
import { supabase } from '@/lib/supabase';
import type { ContractAddendum } from '@/models/Contract';
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

interface AddendumRow {
  id: number | string | null;
  addendum_code: string | null;
  addendum_type: string | null;
  title: string | null;
  content: string | null;
  effective_date: string | null;
  status: string | null;
  signed_file_url: string | null;
  summary_json: Record<string, unknown> | null;
  created_at: string | null;
  source_type: string | null;
  version_no: number | string | null;
  parent_addendum_id: number | string | null;
}

interface AdminAddendumRow extends AddendumRow {
  contract_id: number | string | null;
  contracts?: {
    contract_code?: string | null;
    rooms?: {
      room_code?: string | null;
      buildings?: {
        name?: string | null;
      } | null;
    } | null;
    contract_tenants?: Array<{
      is_primary?: boolean | null;
      tenants?: {
        full_name?: string | null;
      } | null;
    }> | null;
  } | null;
}

type UntypedSelectQuery<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }> & {
  select: (columns: string) => UntypedSelectQuery<T>;
  eq: (column: string, value: unknown) => UntypedSelectQuery<T>;
  order: (column: string, options?: { ascending?: boolean }) => UntypedSelectQuery<T>;
};

interface UntypedSupabaseClient {
  from: <T>(table: string) => UntypedSelectQuery<T>;
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
}

const supabaseUntyped = supabase as unknown as UntypedSupabaseClient;

async function executeRows<T>(query: UntypedSelectQuery<T>): Promise<T[]> {
  const { data, error } = await (query as unknown as Promise<{ data: T[] | null; error: { message: string } | null }>);
  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

function mapAddendumRow(row: AddendumRow): ContractAddendum {
  return toContractAddendum({
    id: Number(row.id),
    addendum_code: row.addendum_code ?? null,
    addendum_type: row.addendum_type ?? null,
    title: String(row.title ?? ''),
    content: row.content ?? null,
    effective_date: String(row.effective_date ?? ''),
    status: row.status ?? null,
    signed_file_url: row.signed_file_url ?? null,
    summary_json: row.summary_json ?? null,
    created_at: row.created_at ?? null,
    source_type: row.source_type ?? null,
    version_no: Number(row.version_no ?? 1),
    parent_addendum_id: row.parent_addendum_id ? Number(row.parent_addendum_id) : null,
  });
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
    const rows = await executeRows(
      supabaseUntyped
        .from<AddendumRow>('contract_addendums')
        .select('id, addendum_code, addendum_type, title, content, effective_date, status, signed_file_url, summary_json, created_at, source_type, version_no, parent_addendum_id')
        .eq('contract_id', contractId)
        .order('effective_date', { ascending: false })
        .order('version_no', { ascending: false })
        .order('created_at', { ascending: false })
    );

    return rows.map(mapAddendumRow);
  },

  listAdminAddendums: async (): Promise<AdminAddendumListItem[]> => {
    const rows = await executeRows(
      supabaseUntyped
        .from<AdminAddendumRow>('contract_addendums')
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
    );

    return rows.map((row) => {
      const contract = row.contracts ?? {};
      const room = contract.rooms ?? {};
      const building = room.buildings ?? {};
      const contractTenants = contract.contract_tenants ?? [];
      const primaryTenant = contractTenants.find((item) => Boolean(item.is_primary)) ?? contractTenants[0] ?? null;
      const tenant = primaryTenant?.tenants ?? {};

      return {
        ...mapAddendumRow(row),
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

    const { data, error } = await supabaseUntyped.rpc('create_contract_addendum', {
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

    return mapAddendumRow(data as AddendumRow);
  },
};

export default portalAddendumService;
