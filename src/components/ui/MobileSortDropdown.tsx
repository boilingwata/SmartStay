import React from 'react';
import { ListFilter, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils';

export interface SortOption {
  label: string;
  value: string;
  dir: 'asc' | 'desc';
}

interface MobileSortDropdownProps {
  options: SortOption[];
  currentValue: string;
  currentDir: 'asc' | 'desc';
  onChange: (value: string, dir: 'asc' | 'desc') => void;
  className?: string;
}

export const MobileSortDropdown: React.FC<MobileSortDropdownProps> = ({
  options,
  currentValue,
  currentDir,
  onChange,
  className
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedOption = options.find(o => o.value === currentValue && o.dir === currentDir);

  return (
    <div className={cn("relative lg:hidden", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-12 px-4 bg-white border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-wider text-slate-700 shadow-sm active:bg-slate-50 transition-all w-full justify-between"
      >
        <div className="flex items-center gap-2">
            <ListFilter size={16} className="text-primary" />
            <span>Sắp xếp: {selectedOption?.label || 'Mặc định'}</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/5" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-3 space-y-1">
              {options.map((option) => {
                const isSelected = currentValue === option.value && currentDir === option.dir;
                return (
                  <button
                    key={`${option.value}-${option.dir}`}
                    onClick={() => {
                      onChange(option.value, option.dir);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-[18px] text-[10px] font-bold uppercase tracking-widest transition-colors text-left",
                      isSelected ? "bg-primary/5 text-primary" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
