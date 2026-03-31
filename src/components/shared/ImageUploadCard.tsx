import React from 'react';
import { CheckCircle, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { fileService } from '@/services/fileService';
import { cn } from '@/utils';

type ImageUploadCardProps = {
  value?: string;
  label: string;
  alt: string;
  onUploaded: (url: string) => void;
  disabled?: boolean;
  className?: string;
  accept?: string;
  emptyText?: string;
  successText?: string;
  uploadingText?: string;
  successMessage?: string;
  onUploadStateChange?: (isUploading: boolean) => void;
};

export const ImageUploadCard = ({
  value,
  label,
  alt,
  onUploaded,
  disabled = false,
  className,
  accept = 'image/jpeg,image/png,image/webp',
  emptyText = 'Chưa tải lên',
  successText = 'Đã tải lên',
  uploadingText = 'Đang tải...',
  successMessage = 'Tải ảnh thành công',
  onUploadStateChange,
}: ImageUploadCardProps) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    onUploadStateChange?.(true);

    try {
      const url = await fileService.uploadFile(file, file.name);
      onUploaded(url);
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải ảnh lên.');
    } finally {
      setIsUploading(false);
      onUploadStateChange?.(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleUpload(file);
          }
          event.target.value = '';
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isUploading}
        className={cn(
          'border border-border/40 bg-card rounded-2xl p-4 flex items-center gap-4 hover:border-primary/30 transition-all group w-full text-left disabled:opacity-60',
          className,
        )}
      >
        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-background">
          {isUploading ? (
            <Loader2 size={20} className="animate-spin text-primary" />
          ) : value ? (
            <img src={value} className="w-full h-full object-cover" alt={alt} />
          ) : (
            <Upload size={18} className="text-muted group-hover:text-primary transition-colors" />
          )}
        </div>

        <div>
          <p className="text-[10px] font-bold text-primary">{label}</p>
          <p className="text-[9px] text-muted italic flex items-center gap-1">
            {isUploading ? uploadingText : value ? <><CheckCircle size={9} className="text-success" /> {successText}</> : emptyText}
          </p>
        </div>
      </button>
    </>
  );
};
