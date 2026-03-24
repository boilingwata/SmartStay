import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { RotateCcw, Check, User } from 'lucide-react';
import { cn } from '@/utils';

interface SignaturePadProps {
  onEnd?: (dataUrl: string) => void;
  onClear?: () => void;
  width?: number | string;
  height?: number | string;
  className?: string;
  placeholder?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onEnd,
  onClear,
  width = '100%',
  height = 200,
  className,
  placeholder = 'Ký tên tại đây',
}) => {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const handleClear = () => {
    sigCanvas.current?.clear();
    onClear?.();
  };

  const handleEnd = () => {
    if (sigCanvas.current) {
      const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      onEnd?.(dataUrl);
    }
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="relative group">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none opacity-20 group-focus-within:opacity-0 transition-opacity">
          <User className="w-8 h-8 mb-1" />
          <span className="text-sm font-medium">{placeholder}</span>
        </div>
        
        <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <SignatureCanvas
            ref={sigCanvas}
            onEnd={handleEnd}
            canvasProps={{
              className: 'w-full',
              style: { 
                width: width, 
                height: height,
              }
            }}
          />
        </div>
      </div>

      <div className="flex justify-between items-center gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Xóa chữ ký
        </button>
        
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded-lg">
          <Check className="w-3.5 h-3.5" />
          Tự động lưu
        </div>
      </div>
    </div>
  );
};
