import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';

export interface PortalAddendum {
  id?: string;
  contractId: number;
  addendumCode: string;
  type: string;
  title: string;
  content: string;
  effectiveDate: string;
  status: 'Draft' | 'Signed' | 'Cancelled';
  fileUrl?: string;
}

export const portalAddendumService = {
  /**
   * Uploads a file to Supabase Storage and returns the public URL.
   * Note: Requires 'contracts' bucket to exist.
   */
  uploadAddendumFile: async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `addendums/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Không thể tải tệp lên: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from('contracts')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  /**
   * Creates a new addendum in the database.
   * RULE-06: FileUrl is required if status is 'Signed'.
   */
  createAddendum: async (addendum: PortalAddendum): Promise<void> => {
    if (addendum.status === 'Signed' && !addendum.fileUrl) {
      throw new Error('RULE-06: FileUrl là bắt buộc khi trạng thái là Signed');
    }

    // FIX: Using (supabase as any) for the missing contract_addendums table.
    // This is intentionally left as a "real" call to demonstrate the production pattern.
    await unwrap(
      (supabase as any)
        .from('contract_addendums')
        .insert({
          contract_id: addendum.contractId,
          addendum_code: addendum.addendumCode,
          type: addendum.type,
          title: addendum.title,
          content: addendum.content,
          effective_date: addendum.effectiveDate,
          status: addendum.status,
          file_url: addendum.fileUrl
        })
    );
  }
};

export default portalAddendumService;
