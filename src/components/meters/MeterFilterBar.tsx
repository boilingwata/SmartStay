import React from 'react';
import { Search, Filter as FilterIcon, X, Zap, Droplets, AlertCircle } from 'lucide-react';
import { QuickFilterChips, QuickFilterOption } from '@/components/ui/QuickFilterChips';
import { cn } from '@/utils';

interface MeterFilterBarProps {
  filters: {
    search: string;
    meterType: string;
    missingOnly: boolean;
  };
  setFilters: (filters: any) => void;
  isAdvancedExpanded: boolean;
  setIsAdvancedExpanded: (val: boolean) => void;
  activeFilterCount: number;
  stats?: {
    total: number;
    electricity: number;
    water: number;
    missing: number;
  };
}

export const MeterFilterBar: React.FC<MeterFilterBarProps> = ({
  filters,
  setFilters,
  isAdvancedExpanded,
  setIsAdvancedExpanded,
  activeFilterCount,
  stats
}) => {
  const quickFilterOptions: QuickFilterOption[] = [
    { label: 'Tất cả', value: 'all', count: stats?.total },
    { label: '⚡ Điện', value: 'Electricity', count: stats?.electricity },
    { label: '💧 Nước', value: 'Water', count: stats?.water },
    { label: '⚠️ Chưa chốt', value: 'missing', count: stats?.missing, color: 'red' },
  ];

  const activeQuickFilter = filters.missingOnly 
    ? 'missing' 
    : filters.meterType || 'all';

  const handleQuickFilterChange = (val: string) => {
    if (val === 'all') {
      setFilters({ ...filters, meterType: '', missingOnly: false });
    } else if (val === 'missing') {
      setFilters({ ...filters, meterType: '', missingOnly: true });
    } else {
      setFilters({ ...filters, meterType: val, missingOnly: false });
    }
  };

  return (
    <div className="space-y-4">
      <QuickFilterChips 
        options={quickFilterOptions}
        value={activeQuickFilter}
        onChange={handleQuickFilterChange}
      />

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Tìm theo mã đồng hồ, số phòng..." 
              className="w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-primary transition-all outline-none font-bold text-sm placeholder:font-medium text-slate-900"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            {filters.search && (
              <button 
                onClick={() => setFilters({ ...filters, search: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-all"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <button 
            onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
            className={cn(
              "flex items-center gap-2 px-6 h-12 rounded-xl font-bold transition-all border",
              isAdvancedExpanded 
                ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            )}
          >
            <FilterIcon size={18} className={cn("transition-transform duration-300", isAdvancedExpanded && "rotate-180")} />
            <span>Bộ lọc nâng cao</span>
            {activeFilterCount > 0 && (
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] ml-1 font-black", 
                isAdvancedExpanded ? "bg-white/20 text-white" : "bg-primary text-white"
              )}>
                {activeFilterCount}
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
