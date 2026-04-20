import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { ContractDetail } from '@/models/Contract';
import { contractService } from './contractService';

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

async function getCurrentTenantId(): Promise<number | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const tenants = (await unwrap(
    supabase.from('tenants').select('id').eq('profile_id', user.id).eq('is_deleted', false).limit(1)
  )) as unknown as { id: number }[];

  return tenants?.[0]?.id ?? null;
}

export const portalService = {
  getActiveContract: async (): Promise<ContractDetail | null> => {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return null;
    const db = supabase as any;

    const links = (await unwrap(
      db
        .from('room_occupants')
        .select(
          `
            contract_id,
            move_in_at,
            contracts!inner(id, status, is_deleted)
          `
        )
        .eq('tenant_id', tenantId)
        .eq('contracts.is_deleted', false)
    )) as Array<{
      contract_id: number;
      move_in_at: string;
      contracts: { status: string | null; is_deleted: boolean | null } | null;
    }>;

    if (!links.length) return null;

    const rankStatus = (status?: string | null) => {
      switch (status) {
        case 'active':
          return 0;
        case 'pending_signature':
          return 1;
        case 'terminated':
          return 2;
        case 'expired':
          return 3;
        default:
          return 4;
      }
    };

    const selected = [...links].sort((a, b) => {
      const statusDiff = rankStatus(a.contracts?.status) - rankStatus(b.contracts?.status);
      if (statusDiff !== 0) return statusDiff;
      return new Date(b.move_in_at).getTime() - new Date(a.move_in_at).getTime();
    })[0];

    return contractService.getContractDetail(String(selected.contract_id));
  },

  getRepairRequests: async (): Promise<{ id: string; title: string; status: string; createdAt: string }[]> => {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return [];

    const rows = (await unwrap(
      supabase
        .from('tickets')
        .select('id, ticket_code, subject, status, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
    )) as unknown as DbTicketRow[];

    return (rows ?? []).map((r) => ({
      id: r.ticket_code,
      title: r.subject,
      status: r.status ?? 'new',
      createdAt: (r.created_at ?? '').slice(0, 10),
    }));
  },

  getResidentBills: async (): Promise<{ id: string; code: string; amount: number; status: string; dueDate: string }[]> => {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return [];
    const db = supabase as any;

    const contractLinks = (await unwrap(
      db.from('room_occupants').select('contract_id').eq('tenant_id', tenantId)
    )) as unknown as { contract_id: number }[];

    if (!contractLinks || contractLinks.length === 0) return [];

    const contractIds = [...new Set(contractLinks.map((cl) => cl.contract_id))];

    const rows = (await unwrap(
      supabase
        .from('invoices')
        .select('id, invoice_code, total_amount, status, due_date')
        .in('contract_id', contractIds)
        .order('due_date', { ascending: false })
    )) as unknown as DbInvoiceRow[];

    return (rows ?? []).map((r) => ({
      id: String(r.id),
      code: r.invoice_code,
      amount: r.total_amount,
      status: r.status ?? 'draft',
      dueDate: r.due_date,
    }));
  },
};

export default portalService;
