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
        "absolute bottom-0 left-0 right-0 flex w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-card p-5 shadow-2xl transition-transform duration-300 md:bottom-10 md:left-1/2 md:max-w-[600px] md:-translate-x-1/2 md:rounded-3xl md:p-6 lg:max-w-[640px]",
        height,
        isOpen ? "translate-y-0" : "translate-y-full"
      )}>
        {/* Handle bar */}
        <div className="flex justify-center mb-6">
          <div className="h-1.5 w-12 rounded-full bg-muted" />
        </div>

        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-black text-primary uppercase tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-2 transition-all hover:bg-muted"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
