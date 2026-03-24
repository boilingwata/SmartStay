import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/utils';

interface SelectAsyncProps {
  placeholder?: string;
  loadOptions: (search: string) => Promise<{ label: string; value: any }[]>;
  value: any;
  onChange: (value: any) => void;
  className?: string;
  icon?: any;
  label?: string;
}

export const SelectAsync = ({ 
  placeholder = 'Chọn...', 
  loadOptions, 
  value, 
  onChange, 
  className,
  icon: Icon,
  label
}: SelectAsyncProps) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<{ label: string; value: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const res = await loadOptions(search);
        setOptions(res);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchOptions, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search, loadOptions]);

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

  return (
    <div ref={containerRef} className={cn("space-y-2 w-full relative", className)}>
      {label && <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "input-base h-14 flex items-center justify-between transition-all w-full",
          open && "border-blue-700/40 ring-4 ring-blue-900/5 shadow-xl shadow-blue-900/5"
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {Icon && <Icon size={18} className="text-muted shrink-0" />}
          <span className={cn("text-[14px] font-bold truncate", !selectedOption && "text-slate-300")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown size={18} className={cn("text-muted transition-transform duration-300", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[100] bg-white rounded-[24px] border border-slate-100 shadow-[0_20px_50px_rgba(30,58,138,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
           <div className="p-3 border-b bg-slate-50/50">
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
           
           <div className="max-h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {loading ? (
                 <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted">
                    <Loader2 className="animate-spin text-primary" size={20} />
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Đang tải dữ liệu...</p>
                 </div>
              ) : options.length > 0 ? (
                 options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                         onChange(opt.value);
                         setOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all",
                         value === opt.value 
                          ? "bg-primary text-white shadow-lg shadow-blue-900/20" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-primary"
                      )}
                    >
                       {opt.label}
                       {value === opt.value && <Check size={14} />}
                    </button>
                 ))
              ) : (
                 <div className="py-8 text-center text-muted text-[10px] font-bold uppercase italic opacity-60">Không tìm thấy kết quả</div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
