import React, { useEffect, useState } from 'react';
import { X, Search, Bell, User, MessageSquare } from 'lucide-react';
import { cn } from '@/utils';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const SidePanel: React.FC<SidePanelProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer 
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setShouldRender(true);
  }, [isOpen]);

  const handleAnimationEnd = () => {
    if (!isOpen) setShouldRender(false);
  };

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-[100] flex overflow-hidden">
      {/* 4.1 Backdrop Layer */}
      <div 
        className={cn(
          "absolute inset-0 bg-primary/20 backdrop-blur-sm transition-opacity duration-500",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* 4.1 Drawer Layer (380px) */}
      <aside 
        onAnimationEnd={handleAnimationEnd}
        className={cn(
          "absolute right-0 top-0 h-full w-[380px] bg-white shadow-2xl flex flex-col transition-transform duration-500 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <header className="h-16 px-6 border-b border-border flex items-center justify-between bg-bg/20">
          <h3 className="text-h3 text-primary truncate">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-bg rounded-lg text-muted hover:text-danger transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 animate-in slide-in-from-right-4 duration-700 delay-200">
          {children}
        </div>

        {footer && (
          <footer className="p-6 border-t border-border bg-bg/10 flex items-center gap-4 sticky bottom-0">
            {footer}
          </footer>
        )}
      </aside>
    </div>
  );
};
