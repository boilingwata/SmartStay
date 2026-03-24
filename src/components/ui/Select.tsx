import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils';

interface SelectOption {
  label: string;
  value: string;
  icon?: any;
}

interface SelectProps {
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: any;
  className?: string;
  label?: string;
  disabled?: boolean;
}

export const Select = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Chọn...", 
  icon: Icon,
  className,
  label,
  disabled = false
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("space-y-2 w-full relative", className)}>
      {label && <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">{label}</label>}
      
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "input-base h-14 flex items-center justify-between transition-all w-full",
            isOpen && "border-blue-700/40 ring-4 ring-blue-900/5 shadow-xl shadow-blue-900/5",
            disabled && "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed shadow-none"
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {Icon && <Icon size={18} className="text-muted shrink-0" />}
            <span className={cn("text-[14px] font-bold truncate", !selectedOption && "text-slate-300")}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronDown size={18} className={cn("text-muted transition-transform duration-300", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[100] bg-white rounded-[24px] border border-slate-100 shadow-[0_20px_50px_rgba(30,58,138,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
             <div className="p-2 max-h-60 overflow-y-auto custom-scrollbar">
                {options.map((opt) => (
                   <button
                     key={opt.value}
                     type="button"
                     onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                     }}
                     className={cn(
                       "w-full flex items-center justify-between px-4 py-3 rounded-[16px] text-[13px] font-bold transition-all",
                       value === opt.value 
                        ? "bg-primary text-white shadow-lg shadow-blue-900/20" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-primary"
                     )}
                   >
                      <div className="flex items-center gap-3">
                         {opt.icon && <opt.icon size={16} />}
                         {opt.label}
                      </div>
                      {value === opt.value && <Check size={16} />}
                   </button>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
