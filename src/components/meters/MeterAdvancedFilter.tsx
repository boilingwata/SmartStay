import React from 'react';
import { Building, Home, Activity, Calendar, History, X } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { SelectAsync } from '@/components/ui/SelectAsync';
import { buildingService } from '@/services/buildingService';
import { roomService } from '@/services/roomService';

interface MeterAdvancedFilterProps {
  filters: {
    buildingId: string;
    roomId: string;
    meterStatus: string;
    monthYear: string;
  };
  onChange: (filters: any) => void;
  onReset: () => void;
  isExpanded: boolean;
  onClose: () => void;
}

export const MeterAdvancedFilter: React.FC<MeterAdvancedFilterProps> = ({
  filters,
  onChange,
  onReset,
  isExpanded,
  onClose
}) => {
  if (!isExpanded) return null;

  return (
    <div className={isExpanded ? "mt-4 pt-6 border-t border-slate-100 max-h-[800px] opacity-100 transition-all duration-500 ease-in-out" : "max-h-0 opacity-0 overflow-hidden"}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
        <div>
          <SelectAsync 
            label="Tòa nhà"
            placeholder="Tất cả tòa nhà"
            icon={Building}
            value={filters.buildingId}
            loadOptions={async (search) => {
              const buildings = await buildingService.getBuildings({ search });
              return buildings.map(b => ({ label: b.buildingName, value: String(b.id) }));
            }}
            onChange={(val) => onChange({ ...filters, buildingId: val })} 
          />
        </div>

        <div>
          <SelectAsync 
            label="Phòng"
            placeholder="Tất cả phòng"
            icon={Home}
            value={filters.roomId}
            loadOptions={async (search) => {
               const rooms = await roomService.getRooms({
                 buildingId: filters.buildingId ? String(filters.buildingId) : undefined,
                 search: search || undefined,
               });
               return rooms.map(r => ({ label: `Phòng ${r.roomCode}`, value: String(r.id) }));
            }}
            onChange={(val) => onChange({ ...filters, roomId: val })} 
          />
        </div>

        <div>
          <Select 
            label="Trạng thái"
            placeholder="Đang hoạt động"
            icon={Activity}
            options={[
              { label: 'Tất cả trạng thái', value: '' },
              { label: 'Đang hoạt động', value: 'Active' },
              { label: 'Tạm dừng', value: 'Inactive' },
              { label: 'Đã thay mới', value: 'Replaced' }
            ]}
            value={filters.meterStatus}
            onChange={(val) => onChange({ ...filters, meterStatus: val })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1 flex items-center gap-2">
             <Calendar size={12} className="text-secondary" /> Kỳ chốt
          </label>
          <input 
            type="month"
            className="input-base h-12 w-full appearance-none pr-10 cursor-pointer hover:border-secondary/50 transition-all focus:border-secondary font-bold text-sm text-slate-800"
            value={filters.monthYear}
            onChange={(e) => onChange({ ...filters, monthYear: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-50">
        <button 
           onClick={onReset}
           className="flex items-center gap-2 px-6 h-11 text-slate-400 hover:text-danger font-bold text-[12px] uppercase tracking-widest transition-all rounded-xl hover:bg-red-50"
        >
           <History size={16} />
           <span>Đặt lại các lọc</span>
        </button>
        <button 
           onClick={onClose}
           className="flex items-center gap-2 px-8 h-11 bg-slate-900 text-white font-bold text-[12px] uppercase tracking-widest rounded-xl shadow-lg shadow-slate-200 hover:bg-black transition-all active:scale-95"
        >
           <X size={16} />
           <span>Đóng</span>
        </button>
      </div>
    </div>
  );
};
