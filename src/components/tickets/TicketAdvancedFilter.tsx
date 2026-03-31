import React from 'react';
import { 
  Building, Home, User as UserIcon, 
  Tag, Calendar, Filter as FilterIcon, 
  RotateCcw, SlidersHorizontal, ChevronDown
} from 'lucide-react';
import { cn } from '@/utils';
import { TicketType, TicketPriority, TicketStatus } from '@/models/Ticket';
import { SelectAsync } from '@/components/ui/SelectAsync';
import { buildingService } from '@/services/buildingService';
import { roomService } from '@/services/roomService';
import { ticketService } from '@/services/ticketService';
import { useQuery } from '@tanstack/react-query';

// Safe Font Stack for Vietnamese
const SAFE_FONT = { fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' };

interface FilterState {
  buildingId: string;
  roomId: string;
  type: TicketType[];
  priority: TicketPriority[];
  status: TicketStatus[];
  assignedTo: string;
  dateRange: { from: string; to: string };
  search: string;
  slaBreached: boolean;
}

interface TicketAdvancedFilterProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const CATEGORIES: TicketType[] = ['Maintenance', 'Complaint', 'ServiceRequest', 'Inquiry', 'Emergency'];
const PRIORITIES: TicketPriority[] = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES: TicketStatus[] = ['Open', 'InProgress', 'Resolved', 'Closed', 'Cancelled'];

export const TicketAdvancedFilter = ({ 
  filters, 
  onChange, 
  onReset, 
  isExpanded
}: TicketAdvancedFilterProps) => {
  
  const updateFilter = (key: keyof FilterState, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const { data: staffMembers } = useQuery({
    queryKey: ['staff-members'],
    queryFn: () => ticketService.getStaff()
  });

  const toggleMultiSelect = (key: 'type' | 'priority' | 'status', value: any) => {
    const current = filters[key] as any[];
    const next = current.includes(value) 
      ? current.filter(v => v !== value) 
      : [...current, value];
    updateFilter(key, next);
  };

  if (!isExpanded) return null;

  return (
    <div className="space-y-6 pt-2" style={SAFE_FONT}>
      {/* Three Column Layout - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Location & Staff */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
              <Building size={12} />
              <span>Vị trí & Nhân sự</span>
           </div>
           <div className="space-y-3">
             <SelectAsync 
               placeholder="Chọn tòa nhà..."
               value={filters.buildingId}
               onChange={(val) => {
                 updateFilter('buildingId', val);
                 updateFilter('roomId', '');
               }}
               onClear={() => {
                 updateFilter('buildingId', '');
                 updateFilter('roomId', '');
               }}
               loadOptions={async (search) => {
                 const buildings = await buildingService.getBuildings({ search });
                 return buildings.map(b => ({ label: b.buildingName, value: String(b.id) }));
               }}
             />
             <SelectAsync 
               placeholder="Chọn phòng..."
               value={filters.roomId}
               disabled={!filters.buildingId}
               onChange={(val) => updateFilter('roomId', val)}
               onClear={() => updateFilter('roomId', '')}
               loadOptions={async (search) => {
                 if (!filters.buildingId) return [];
                 const rooms = await roomService.getRooms({ buildingId: filters.buildingId, search });
                 return rooms.map(r => ({ label: `Phòng ${r.roomCode}`, value: String(r.id) }));
               }}
             />
             <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <select 
                  value={filters.assignedTo}
                  onChange={(e) => updateFilter('assignedTo', e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary transition-all font-bold text-xs appearance-none"
                >
                  <option value="">Tất cả NV phụ trách</option>
                  {staffMembers?.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.role})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
             </div>
           </div>
        </div>

        {/* Column 2: Date & Special Status */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
              <Calendar size={12} />
              <span>Thời gian & Đặc biệt</span>
           </div>
           <div className="space-y-3">
              <div className="flex items-center gap-2">
                 <input 
                   type="date"
                   value={filters.dateRange.from}
                   onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, from: e.target.value })}
                   className="flex-1 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-[11px] font-bold"
                 />
                 <span className="text-slate-300">→</span>
                 <input 
                   type="date"
                   value={filters.dateRange.to}
                   onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, to: e.target.value })}
                   className="flex-1 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-[11px] font-bold"
                 />
              </div>

              <button 
                onClick={() => updateFilter('slaBreached', !filters.slaBreached)}
                className={cn(
                  "w-full h-10 px-4 rounded-xl flex items-center justify-between border transition-all",
                  filters.slaBreached 
                    ? "bg-red-50 border-red-200 text-red-600 shadow-sm" 
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                )}
              >
                 <div className="flex items-center gap-2 text-xs font-bold">
                    <FilterIcon size={14} />
                    <span>Vi phạm SLA</span>
                 </div>
                 <div className={cn("w-4 h-4 rounded-full border-2", filters.slaBreached ? "bg-red-600 border-red-600" : "bg-white border-slate-300")} />
              </button>
           </div>
        </div>

        {/* Column 3: Multi-select Tags (Condensed) */}
        <div className="space-y-4">
           <div className="flex items-center justify-between pl-1">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 <Tag size={12} />
                 <span>Phân loại & Trạng thái</span>
              </div>
              <button onClick={onReset} className="text-[10px] font-black text-primary hover:underline flex items-center gap-1 uppercase tracking-tighter">
                 <RotateCcw size={10} /> Reset
              </button>
           </div>
           <div className="space-y-4">
              {/* Type Tags */}
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => toggleMultiSelect('type', cat)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all",
                      filters.type.includes(cat)
                        ? "bg-primary text-white border-primary"
                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {/* Status Tags */}
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map(stat => (
                  <button
                    key={stat}
                    onClick={() => toggleMultiSelect('status', stat)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all",
                      filters.status.includes(stat)
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    {stat}
                  </button>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
