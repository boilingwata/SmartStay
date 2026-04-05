import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { fileService } from './fileService';

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
   * Uploads a file to the existing `smartstay-files` bucket and returns the public URL.
   */
  uploadAddendumFile: async (file: File): Promise<string> => (
    fileService.uploadFile(file, file.name, {
      allowedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      maxSize: 10 * 1024 * 1024,
      pathPrefix: 'contracts/addendums',
    })
  ),

  /**
   * Creates a new addendum in the database.
   * RULE-06: FileUrl is required if status is 'Signed'.
   */
  createAddendum: async (addendum: PortalAddendum): Promise<void> => {
    if (addendum.status === 'Signed' && !addendum.fileUrl) {
      throw new Error('RULE-06: FileUrl is required when status is Signed');
    }

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
          file_url: addendum.fileUrl,
        })
    );
  },
};

export default portalAddendumService;
