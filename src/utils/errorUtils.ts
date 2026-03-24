import { toast } from 'sonner';
import { ApiError } from '@/types/api';

export const handleServiceError = (error: any, fallbackMessage: string = 'Đã có lỗi xảy ra'): never => {
  console.error('[Service Error]:', error);
  
  const message = error.response?.data?.message || error.message || fallbackMessage;
  
  toast.error(message);
  
  throw error;
};
