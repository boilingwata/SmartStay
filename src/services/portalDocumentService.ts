import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';

export type DocumentType = 'Contract' | 'Receipt' | 'ID' | 'Other';

export interface PortalDocument {
  id: string;
  name: string;
  type: DocumentType;
  category: string;
  date: string;
  url: string | null;
  size?: string;
}

export const portalDocumentService = {
  getDocuments: async (): Promise<PortalDocument[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // 1. Fetch Tenant and their JSON documents
    const tenant = await unwrap(
      supabase
        .from('tenants')
        .select('id, documents')
        .eq('profile_id', user.id)
        .eq('is_deleted', false)
        .single()
    ) as unknown as { id: number; documents: any };

    const docs: PortalDocument[] = [];

    // Add profile documents (e.g. CCCD)
    if (tenant.documents?.cccd_images) {
      const images = Array.isArray(tenant.documents.cccd_images) 
        ? tenant.documents.cccd_images 
        : [tenant.documents.cccd_images];
        
      images.forEach((url: string, index: number) => {
        docs.push({
          id: `id-${index}`,
          name: `CCCD / Pasport - Mặt ${index + 1}`,
          type: 'ID',
          category: 'Cá nhân',
          date: new Date().toISOString(), // Fallback
          url: url
        });
      });
    }

    // 2. Fetch Contracts
    const contractLinks = await unwrap(
      supabase
        .from('contract_tenants')
        .select('contracts(id, contract_code, start_date, status)')
        .eq('tenant_id', tenant.id)
    ) as unknown as { contracts: { id: number; contract_code: string; start_date: string; status: string } }[];

    const contractIds = contractLinks.map(l => l.contracts?.id).filter(Boolean) as number[];

    contractLinks.forEach(link => {
      if (link.contracts) {
        docs.push({
          id: `con-${link.contracts.id}`,
          name: `Hợp đồng thuê - ${link.contracts.contract_code}`,
          type: 'Contract',
          category: 'Hợp đồng',
          date: link.contracts.start_date,
          url: null // Contracts typically need a generated PDF or specific storage path
        });
      }
    });

    // 3. Fetch Invoices with Receipts
    const invoices = await unwrap(
      supabase
        .from('invoices')
        .select('id, invoice_code, created_at, payments(receipt_url)')
        .in('contract_id', contractIds)
    ) as unknown as { id: number; invoice_code: string; created_at: string; payments: { receipt_url: string | null }[] }[];

    invoices.forEach(inv => {
      const receipt = inv.payments?.find(p => p.receipt_url)?.receipt_url;
      docs.push({
        id: `inv-${inv.id}`,
        name: `Hóa đơn ${inv.invoice_code}`,
        type: 'Receipt',
        category: 'Thanh toán',
        date: inv.created_at,
        url: receipt || null
      });
    });

    return docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
};

export default portalDocumentService;
