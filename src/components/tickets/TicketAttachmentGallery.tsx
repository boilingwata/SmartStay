import React from 'react';
import { FileImage, Paperclip } from 'lucide-react';

import type { TicketAttachment } from '@/models/Ticket';
import { cn } from '@/utils';
import { sanitizeUrl } from '@/utils/security';

type TicketAttachmentGalleryProps = {
  attachments: TicketAttachment[];
  compact?: boolean;
  className?: string;
};

const IMAGE_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export const TicketAttachmentGallery: React.FC<TicketAttachmentGalleryProps> = ({
  attachments,
  compact = false,
  className,
}) => {
  if (!attachments.length) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
        <Paperclip size={14} />
        <span>Hình ảnh đính kèm</span>
      </div>

      <div className={cn('grid gap-3', compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2')}>
        {attachments.map((attachment) => {
          const safeUrl = sanitizeUrl(attachment.fileUrl, '/images/safe-fallback.png');
          const isImage = IMAGE_FILE_TYPES.includes(attachment.fileType);

          return (
            <a
              key={attachment.id}
              href={safeUrl}
              target="_blank"
              rel="noreferrer"
              className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              {isImage ? (
                <div className={cn('overflow-hidden bg-slate-100', compact ? 'aspect-[1.1]' : 'aspect-[1.35]')}>
                  <img
                    src={safeUrl}
                    alt={attachment.fileName}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex aspect-[1.35] items-center justify-center bg-slate-100 text-slate-400">
                  <FileImage size={28} />
                </div>
              )}

              <div className="space-y-1 px-4 py-3">
                <p className="truncate text-sm font-bold text-slate-800">{attachment.fileName}</p>
                <p className="text-xs text-slate-500">
                  {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
