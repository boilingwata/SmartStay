import React, { useState, useId } from 'react';
import { useConfirmStore } from '@/hooks/useConfirm';
import { cn } from '@/utils';
import { AlertTriangle, Info, AlertCircle, Loader2 } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export const ConfirmDialog: React.FC = () => {
  const { isOpen, options, onConfirm, onCancel } = useConfirmStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleId = useId();
  const descId = useId();
  const trapRef = useFocusTrap(isOpen, onCancel);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const variantStyles = {
    danger: {
      icon: <AlertCircle className="w-6 h-6 text-red-600" />,
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      bg: 'bg-red-100',
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
      button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      bg: 'bg-yellow-100',
    },
    info: {
      icon: <Info className="w-6 h-6 text-blue-600" />,
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      bg: 'bg-blue-100',
    },
  };

  const style = variantStyles[options.variant || 'info'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div
        ref={trapRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={cn('p-2 rounded-full shrink-0', style.bg)}>
              {style.icon}
            </div>
            <div className="flex-1">
              <h3 id={titleId} className="text-lg font-semibold text-gray-900">
                {options.title}
              </h3>
              <div id={descId} className="mt-2 text-sm text-gray-500">
                {typeof options.description === 'string' ? (
                  <p>{options.description}</p>
                ) : (
                  options.description
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
          >
            {options.cancelLabel || 'Hủy'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={cn(
              'px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors flex items-center gap-2 disabled:opacity-50',
              style.button
            )}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {options.confirmLabel || 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
};
