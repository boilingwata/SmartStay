import { supabase } from '@/lib/supabase';
import { checkImageIntegrity, checkPdfIntegrity } from '@/utils/security';

const UPLOAD_TIMESTAMPS: number[] = [];
const RATE_LIMIT_COUNT = 5;
const RATE_LIMIT_WINDOW = 60000;

type UploadOptions = {
  allowedTypes?: string[];
  maxSize?: number;
  pathPrefix?: string;
};

export const fileService = {
  /**
   * Upload a file to Supabase Storage with MIME and signature validation.
   * Defaults to images to preserve existing callers.
   */
  uploadFile: async (
    file: File | Blob,
    originalName?: string,
    options?: UploadOptions
  ): Promise<string> => {
    const allowedTypes = options?.allowedTypes ?? ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = options?.maxSize ?? 2 * 1024 * 1024;
    const pathPrefix = options?.pathPrefix ?? 'uploads';

    const now = Date.now();
    const recentUploads = UPLOAD_TIMESTAMPS.filter((ts) => now - ts < RATE_LIMIT_WINDOW);
    if (recentUploads.length >= RATE_LIMIT_COUNT) {
      throw new Error('SECURITY_REJECTION: Tải lên quá nhanh. Vui lòng đợi 1 phút.');
    }
    UPLOAD_TIMESTAMPS.push(now);

    if (!allowedTypes.includes(file.type)) {
      throw new Error('SERVER_REJECTION: Định dạng file không hỗ trợ.');
    }

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    const isValid = isImage
      ? await checkImageIntegrity(file)
      : isPdf
        ? await checkPdfIntegrity(file)
        : false;

    if (!isValid) {
      throw new Error('SECURITY_REJECTION: Tệp không hợp lệ hoặc bị hỏng.');
    }

    if (file.size > maxSize) {
      throw new Error(`SERVER_REJECTION: File quá lớn (tối đa ${Math.round(maxSize / 1024 / 1024)}MB).`);
    }

    const fallbackName = isPdf ? `upload_${Date.now()}.pdf` : `upload_${Date.now()}.png`;
    const safeName = (originalName || fallbackName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${pathPrefix}/${Date.now()}_${safeName}`;

    const { data, error } = await supabase.storage
      .from('smartstay-files')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Upload failed:', error);
      throw new Error(error.message || 'Lỗi hệ thống khi lưu trữ tệp tin.');
    }

    const { data: urlData } = supabase.storage
      .from('smartstay-files')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  },
};
