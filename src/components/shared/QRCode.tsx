import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/utils';
import { toast } from 'sonner';

interface QRCodeProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  logo?: string;
  className?: string;
}

export const QRCode: React.FC<QRCodeProps> = ({
  value,
  size = 200,
  level = 'M',
  logo,
  className,
}) => {
  const qrRef = useRef<SVGSVGElement>(null);
  const [copied, setCopied] = useState(false);

  const downloadQR = () => {
    const svg = qrRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qrcode-${Date.now()}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  const copyValue = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Đã sao chép giá trị QR');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Không thể sao chép');
    }
  };

  return (
    <div className={cn('flex flex-col items-center gap-4 p-4 bg-white rounded-xl border shadow-sm', className)}>
      <div className="p-2 border rounded-lg bg-gray-50">
        <QRCodeSVG
          ref={qrRef}
          value={value}
          size={size}
          level={level}
          includeMargin={true}
          imageSettings={
            logo
              ? {
                  src: logo,
                  x: undefined,
                  y: undefined,
                  height: size * 0.2,
                  width: size * 0.2,
                  excavate: true,
                }
              : undefined
          }
        />
      </div>
      
      <div className="flex gap-2 w-full">
        <button
          onClick={copyValue}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          Copy
        </button>
        <button
          onClick={downloadQR}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Tải QR
        </button>
      </div>
    </div>
  );
};
