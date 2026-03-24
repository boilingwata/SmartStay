import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: string;
}

export const BottomSheet = ({ isOpen, onClose, title, children, height = 'h-[70vh]' }: BottomSheetProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[100] transition-opacity duration-300",
      isOpen ? "bg-black/40 backdrop-blur-sm opacity-100" : "opacity-0 pointer-events-none"
    )}>
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 transition-transform duration-300 transform shadow-2xl overflow-hidden flex flex-col",
        height,
        isOpen ? "translate-y-0" : "translate-y-full"
      )}>
        {/* Handle bar */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>

        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-black text-primary uppercase tracking-tight">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={20} className="text-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
