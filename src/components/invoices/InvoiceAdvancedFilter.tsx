import { 
  Building, Calendar, DollarSign, 
  RotateCcw, SlidersHorizontal, Hash,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AdvancedFilterState {
  minAmount?: number;
  maxAmount?: number;
  dueDateFrom?: string;
  dueDateTo?: string;
  roomCode?: string;
}

interface InvoiceAdvancedFilterProps {
  filters: AdvancedFilterState;
  onChange: (filters: AdvancedFilterState) => void;
  onReset: () => void;
  isExpanded: boolean;
}

export const InvoiceAdvancedFilter = ({ 
  filters, 
  onChange, 
  onReset, 
  isExpanded 
}: InvoiceAdvancedFilterProps) => {
  const { t } = useTranslation();

  const updateFilter = <K extends keyof AdvancedFilterState>(key: K, value: AdvancedFilterState[K] | undefined) => {
    onChange({ ...filters, [key]: value === '' ? undefined : value });
  };

  if (!isExpanded) return null;

  return (
    <div className="space-y-6 pt-4 pb-2 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Column 1: Financial Range */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">
              <DollarSign size={12} className="text-primary/60" />
              <span>{t('pages.invoices.minAmount') || "Khoảng giá trị (VND)"}</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input 
                  type="number"
                  placeholder={t('pages.invoices.minAmount') || "Từ..."}
                  value={filters.minAmount || ''}
                  onChange={(e) => updateFilter('minAmount', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full h-11 pl-4 pr-3 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary/30 transition-all font-bold text-xs shadow-inner"
                />
              </div>
              <span className="text-slate-300 font-black">→</span>
              <div className="relative flex-1">
                <input 
                  type="number"
                  placeholder={t('pages.invoices.maxAmount') || "Đến..."}
                  value={filters.maxAmount || ''}
                  onChange={(e) => updateFilter('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full h-11 pl-4 pr-3 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary/30 transition-all font-bold text-xs shadow-inner"
                />
              </div>
           </div>
        </div>

        {/* Column 2: Date Range */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">
              <Calendar size={12} className="text-secondary/60" />
              <span>{t('pages.invoices.dueDateLabel') || "Hạn thanh toán"}</span>
           </div>
           <div className="flex items-center gap-3">
              <input 
                type="date"
                value={filters.dueDateFrom || ''}
                onChange={(e) => updateFilter('dueDateFrom', e.target.value)}
                className="flex-1 h-11 px-3 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary/30 transition-all font-bold text-[11px] shadow-inner"
              />
              <span className="text-slate-300 font-black">→</span>
              <input 
                type="date"
                value={filters.dueDateTo || ''}
                onChange={(e) => updateFilter('dueDateTo', e.target.value)}
                className="flex-1 h-11 px-3 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary/30 transition-all font-bold text-[11px] shadow-inner"
              />
           </div>
        </div>

        {/* Column 3: Location & Actions */}
        <div className="space-y-4">
           <div className="flex items-center justify-between pl-1">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                 <Building size={12} className="text-accent/60" />
                 <span>{t('pages.invoices.locationOther') || "Vị trí & Khác"}</span>
              </div>
              <button 
                onClick={onReset}
                className="group flex items-center gap-1.5 text-[9px] font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-tighter"
              >
                 <RotateCcw size={10} className="group-hover:rotate-[-120deg] transition-transform duration-500" />
                 {t('actions.refresh') || "Làm mới bộ lọc"}
              </button>
           </div>
           <div className="flex flex-col gap-3">
              <div className="relative group/input">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-primary transition-colors" size={14} />
                <input 
                  type="text"
                  placeholder={t('pages.invoices.roomCodePlaceholder') || "Mã phòng (ví dụ: A-101)..."}
                  value={filters.roomCode || ''}
                  onChange={(e) => updateFilter('roomCode', e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary/30 transition-all font-bold text-xs shadow-inner"
                />
              </div>
           </div>
        </div>

      </div>

      {/* Decorative summary footer if filters are active */}
      {(filters.minAmount || filters.maxAmount || filters.dueDateFrom || filters.dueDateTo || filters.roomCode) && (
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100/50">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 text-primary rounded-full border border-primary/10">
            <SlidersHorizontal size={10} />
            <span className="text-[9px] font-black uppercase tracking-widest">{t('pages.invoices.appliedActive') || "Đang áp dụng bộ lọc nâng cao"}</span>
          </div>
        </div>
      )}

    </div>
  );
};
