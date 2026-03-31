import React, { useState, useEffect } from 'react';
import { Search, Filter, History, Building2, Calendar, ChevronDown, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface InvoiceFilterBarProps {
  searchText: string;
  setSearchText: (val: string) => void;
  buildingId: string;
  setBuildingId: (val: string) => void;
  period: string;
  setPeriod: (val: string) => void;
  buildings: { id: string; buildingName: string }[];
  onReset: () => void;
  isAdvancedExpanded: boolean;
  onToggleAdvanced: () => void;
  isAdvancedActive: boolean;
}

export const InvoiceFilterBar: React.FC<InvoiceFilterBarProps> = ({
  searchText,
  setSearchText,
  buildingId,
  setBuildingId,
  period,
  setPeriod,
  buildings,
  onReset,
  isAdvancedExpanded,
  onToggleAdvanced,
  isAdvancedActive,
}) => {
  const { t } = useTranslation();
  const [internalSearch, setInternalSearch] = useState(searchText);
  const debouncedSearch = useDebounce(internalSearch, 500);


  useEffect(() => {
    setSearchText(debouncedSearch);
  }, [debouncedSearch, setSearchText]);

  useEffect(() => {
    setInternalSearch(searchText);
  }, [searchText]);

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 p-2 bg-card/40 backdrop-blur-md border border-white/20 rounded-2xl shadow-premium">
      {/* Search Input */}
      <div className="relative flex-1 w-full group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-primary" size={18} />
        <input
          type="text"
          placeholder={t('pages.invoices.searchPlaceholder') || "Tìm theo mã HĐ, tên cư dân..."}
          className="input-base w-full pl-11 bg-white/50 border-white/50 focus:bg-white focus:ring-primary/20 transition-all rounded-xl"
          value={internalSearch}
          onChange={(e) => setInternalSearch(e.target.value)}
        />
        {internalSearch && (
          <button 
            onClick={() => setInternalSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted/10 rounded-full text-muted transition-all"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        {/* Building Select */}
        <div className="relative flex-1 md:w-48 group">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-secondary" size={16} />
          <select
            className="input-base w-full pl-10 appearance-none bg-white/50 border-white/50 focus:bg-white transition-all rounded-xl cursor-pointer"
            value={buildingId}
            onChange={(e) => setBuildingId(e.target.value)}
          >
            <option value="">{t('pages.invoices.allBuildings') || "Tất cả tòa nhà"}</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.buildingName}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted stroke-[3px] pointer-events-none" size={14} />
        </div>

        {/* Period Picker */}
        <div className="relative flex-1 md:w-40 group">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent" size={16} />
          <input
            type="month"
            className="input-base w-full pl-10 bg-white/50 border-white/50 focus:bg-white transition-all rounded-xl cursor-pointer"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </div>

        {/* Advanced Filter Toggle */}
        <button
          onClick={onToggleAdvanced}
          className={cn(
            "relative p-3 rounded-xl border transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center min-w-[48px]",
            isAdvancedExpanded 
              ? "bg-primary text-white border-primary" 
              : isAdvancedActive
                ? "bg-primary/10 text-primary border-primary/20 shadow-inner"
                : "bg-white/50 hover:bg-white text-muted hover:text-primary border-white/50"
          )}
          title="Bộ lọc nâng cao"
        >
          <Filter size={18} className={cn("transition-transform duration-500", isAdvancedExpanded && "rotate-180")} />
          {isAdvancedActive && !isAdvancedExpanded && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary border-2 border-white rounded-full animate-pulse" />
          )}
        </button>

        {/* Reset Button */}
        {(searchText || buildingId || period || isAdvancedActive) && (
          <button
            title={t('common.resetFilters') || "Xóa lọc"}
            className="p-3 bg-white/50 hover:bg-white text-muted hover:text-danger border border-white/50 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
            onClick={onReset}
          >
            <History size={18} />
          </button>
        )}
      </div>
    </div>

  );
};
