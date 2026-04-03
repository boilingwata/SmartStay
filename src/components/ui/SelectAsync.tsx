import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, Loader2, X } from 'lucide-react';
import { cn } from '@/utils';

interface SelectAsyncProps {
  placeholder?: string;
  loadOptions: (search: string) => Promise<{ label: string; value: any }[]>;
  value: any;
  onChange: (value: any) => void;
  onClear?: () => void;
  initialLabel?: string;
  className?: string;
  icon?: any;
  label?: string;
  disabled?: boolean;
}

export const SelectAsync = ({ 
  placeholder = 'Chọn...', 
  loadOptions, 
  value, 
  onChange, 
  onClear,
  initialLabel,
  className,
  icon: Icon,
  label,
  disabled
}: SelectAsyncProps) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<{ label: string; value: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [internalLabel, setInternalLabel] = useState<string | undefined>(initialLabel);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const res = await loadOptions(search);
        setOptions(res);
        
        // Update internal label if we find a match for the current value
        if (value) {
          const match = res.find(o => o.value === value);
          if (match) setInternalLabel(match.label);
        }
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchOptions, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search, loadOptions, value]);

  // Sync internal label when value changes externally (e.g. cleared)
  useEffect(() => {
    if (!value) {
      setInternalLabel(undefined);
    }
  }, [value]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const selectedOption = options.find(o => o.value === value);
  const displayLabel = selectedOption?.label || internalLabel || placeholder;

  return (
    <div ref={containerRef} className={cn("space-y-2.5 w-full", className)}>
      {label && (
        <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1 flex items-center gap-2">
          {Icon && <Icon size={12} className="text-primary/70" />}
          {label}
        </label>
      )}
      <div className="relative w-full group/select">
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          className={cn(
            "h-14 pl-6 pr-20 bg-slate-50/50 border border-slate-200 rounded-2xl flex items-center transition-all w-full font-bold text-slate-900 text-left",
            "hover:bg-white hover:border-primary/30 active:scale-[0.99]",
            open && "bg-white border-primary shadow-xl shadow-primary/10 ring-4 ring-primary/5",
            disabled && "opacity-60 cursor-not-allowed bg-slate-100 border-slate-200 shadow-none"
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <span className={cn(
              "text-[14px] font-bold truncate", 
              !value && "text-slate-400 font-medium italic",
              disabled && "text-slate-400"
            )}>
              {displayLabel}
            </span>
          </div>
          
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <ChevronDown size={18} className={cn("text-slate-400 transition-transform duration-500 shrink-0", open && "rotate-180 text-primary")} />
          </div>
        </button>
        {value && onClear && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
              setOpen(false);
            }}
            className="absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-300 hover:bg-danger/10 hover:text-danger transition-colors opacity-0 group-hover/select:opacity-100"
          >
            <X size={16} />
          </button>
        )}

        {open && !disabled && (
          <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[100] bg-white rounded-[16px] border border-slate-100 shadow-[0_20px_40px_rgba(30,58,138,0.12)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
             <div className="p-2 border-b bg-slate-50/50">
                <div className="relative">
                   <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                   <input 
                     autoFocus
                     className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-medium placeholder:text-muted/60 outline-none focus:border-primary/30 transition-all shadow-inner"
                     placeholder="Tìm kiếm..."
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                   />
                </div>
             </div>
             
             <div className="max-h-52 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
                {loading ? (
                   <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted">
                      <Loader2 className="animate-spin text-primary" size={20} />
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Đang tải dữ liệu...</p>
                   </div>
                ) : options.length > 0 ? (
                   options.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onMouseDown={(e) => {
                           // Use MouseDown instead of Click to trigger BEFORE blur
                           e.preventDefault();
                           e.stopPropagation();
                           onChange(opt.value);
                           setOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-bold transition-all text-left",
                           value === opt.value 
                            ? "bg-primary text-white shadow-md shadow-blue-900/10" 
                            : "text-slate-600 hover:bg-slate-50 hover:text-primary"
                        )}
                      >
                         <span className="truncate">{opt.label}</span>
                         {value === opt.value && <Check size={14} className="shrink-0 ml-2" />}
                      </button>
                   ))
                ) : (
                   <div className="py-8 text-center text-muted text-[10px] font-bold uppercase italic opacity-60">Không tìm thấy kết quả</div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
