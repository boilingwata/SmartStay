import { supabase } from '@/lib/supabase';
import { checkImageIntegrity } from '@/utils/security';

// Rate-limiting for uploads (max 5 per minute)
const UPLOAD_TIMESTAMPS: number[] = [];
const RATE_LIMIT_COUNT = 5;
const RATE_LIMIT_WINDOW = 60000;

export const fileService = {
  /**
   * Upload a file to Supabase Storage with MIME validation
   */
  uploadFile: async (file: File | Blob, originalName?: string): Promise<string> => {
    // 1. Client-side Rate Limiting
    const now = Date.now();
    const recentUploads = UPLOAD_TIMESTAMPS.filter(ts => now - ts < RATE_LIMIT_WINDOW);
    if (recentUploads.length >= RATE_LIMIT_COUNT) {
      throw new Error('SECURITY_REJECTION: Tải lên quá nhanh. Vui lòng đợi 1 phút.');
    }
    UPLOAD_TIMESTAMPS.push(now);

    // 2. Client-side Integrity Validation (Magic Bytes)
    const isValid = await checkImageIntegrity(file);
    if (!isValid) {
      throw new Error('SECURITY_REJECTION: Tệp không hợp lệ hoặc bị hỏng (Magic Byte mismatch).');
    }

    // 3. MIME Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('SERVER_REJECTION: Định dạng file không hỗ trợ.');
    }

    // 4. Size Validation (2MB max)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('SERVER_REJECTION: File quá lớn (Tối đa 2MB).');
    }

    // 5. Upload to Supabase Storage
    const fileName = originalName || `upload_${Date.now()}.png`;
    const filePath = `uploads/${Date.now()}_${fileName}`;

    const { data, error } = await supabase.storage
      .from('smartstay-files')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Upload failed:', error);
      throw new Error('Lỗi hệ thống khi lưu trữ tệp tin');
    }

    const { data: urlData } = supabase.storage
      .from('smartstay-files')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }
};
