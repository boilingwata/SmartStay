import React, { memo } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { type AmenityPolicyStatus } from '@/services/amenityAdminService';

interface AmenityFilters {
  search: string;
  status: AmenityPolicyStatus | 'all';
  serviceId: number | null;
  page: number;
  limit: number;
}

interface Props {
  filters: Pick<AmenityFilters, 'search' | 'status' | 'serviceId'>;
  setFilters: React.Dispatch<React.SetStateAction<AmenityFilters>>;
  options: { label: string; value: string }[] | undefined;
  onCreateOpen: () => void;
}


const AmenityToolbar = memo(({ filters, setFilters, options, onCreateOpen }: Props) => {
  return (
    <div className="group/toolbar flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-3xl bg-black/[0.02] dark:bg-white/[0.02] border border-border/50 p-4 transition-all duration-500 hover:border-primary/20">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Container with Refined Interaction */}
        <div className="relative flex-1 group">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground transition-colors group-focus-within:text-primary">
            <Search size={16} strokeWidth={2.5} />
          </div>
          <input 
            className="h-11 w-full rounded-2xl border-border/50 bg-card pl-11 pr-4 text-sm font-bold tracking-tight shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none" 
            placeholder="Tìm mã hoặc tên chính sách..." 
            value={filters.search} 
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))} 
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex h-11 items-center gap-2 rounded-2xl border border-border/50 bg-card px-3 shadow-sm transition-all hover:border-primary/20">
            <Filter size={14} className="text-muted-foreground" />
            <Select 
              value={filters.status}
              onChange={(val) => setFilters((prev) => ({ ...prev, status: val as AmenityPolicyStatus | 'all', page: 1 }))}
              options={[
                { label: 'Tất cả trạng thái', value: 'all' },
                { label: 'Nháp', value: 'draft' },
                { label: 'Chờ duyệt', value: 'pending_approval' },
                { label: 'Đã duyệt', value: 'approved' },
                { label: 'Lưu trữ', value: 'archived' }
              ]}
              className="w-[160px] border-none bg-transparent p-0 focus:ring-0 h-auto"
            />
          </div>

          <div className="flex h-11 items-center gap-2 rounded-2xl border border-border/50 bg-card px-3 shadow-sm transition-all hover:border-primary/20">
            <Select 
              value={filters.serviceId ? String(filters.serviceId) : ''}
              onChange={(val) => setFilters((prev) => ({ ...prev, serviceId: val ? Number(val) : null, page: 1 }))}
              options={[
                { label: 'Tất cả tiện ích', value: '' },
                ...(options ?? [])
              ]}
              className="w-[180px] border-none bg-transparent p-0 focus:ring-0 h-auto"
            />
          </div>
        </div>
      </div>

      <button 
        onClick={onCreateOpen} 
        className="group relative flex h-11 items-center justify-center gap-3 overflow-hidden rounded-2xl bg-foreground px-6 font-black text-xs uppercase tracking-widest text-background transition-all duration-500 hover:bg-primary hover:shadow-[0_8px_30px_rgb(var(--primary-rgb),0.3)] active:scale-[0.98]"
      >
        <Plus size={16} strokeWidth={3} className="transition-transform duration-500 group-hover:rotate-90" /> 
        Tạo chính sách
        <div className="absolute inset-0 -z-10 translate-y-full bg-primary transition-transform duration-500 group-hover:translate-y-0" />
      </button>
    </div>
  );
});

AmenityToolbar.displayName = 'AmenityToolbar';

export default AmenityToolbar;
