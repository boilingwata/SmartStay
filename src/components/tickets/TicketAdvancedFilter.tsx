import React from 'react';
import { Building, Calendar, RotateCcw, User as UserIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { SelectAsync } from '@/components/ui/SelectAsync';
import {
  getTicketStatusLabel,
  getTicketCategoryShortLabel,
  ticketQueryKeys,
} from '@/features/tickets/ticketPresentation';
import { PRIORITY_LABELS_VI } from '@/features/tickets/ticketMetadata';
import type { TicketPriority, TicketStatus, TicketType } from '@/models/Ticket';
import { buildingService } from '@/services/buildingService';
import { roomService } from '@/services/roomService';
import { ticketService } from '@/services/ticketService';
import { cn } from '@/utils';

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
const STATUSES: TicketStatus[] = ['Open', 'InProgress', 'PendingConfirmation', 'Resolved', 'Closed'];

export const TicketAdvancedFilter = ({
  filters,
  onChange,
  onReset,
  isExpanded,
}: TicketAdvancedFilterProps) => {
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const { data: staffMembers } = useQuery({
    queryKey: ticketQueryKeys.staffList,
    queryFn: () => ticketService.getStaff(),
  });

  const toggleMultiSelect = (key: 'type' | 'priority' | 'status', value: string) => {
    const current = filters[key] as string[];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    updateFilter(key, next as FilterState[typeof key]);
  };

  if (!isExpanded) return null;

  return (
    <div className="space-y-6 pt-2">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pl-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Building size={12} />
            <span>Vị trí và phụ trách</span>
          </div>

          <div className="space-y-3">
            <SelectAsync
              placeholder="Chọn tòa nhà..."
              value={filters.buildingId}
              onChange={(value) => {
                updateFilter('buildingId', value);
                updateFilter('roomId', '');
              }}
              onClear={() => {
                updateFilter('buildingId', '');
                updateFilter('roomId', '');
              }}
              loadOptions={async (search) => {
                const buildings = await buildingService.getBuildings({ search });
                return buildings.map((building) => ({
                  label: building.buildingName,
                  value: String(building.id),
                }));
              }}
            />

            <SelectAsync
              placeholder={filters.buildingId ? 'Chọn phòng...' : 'Chọn tòa nhà trước'}
              value={filters.roomId}
              disabled={!filters.buildingId}
              onChange={(value) => updateFilter('roomId', value)}
              onClear={() => updateFilter('roomId', '')}
              loadOptions={async (search) => {
                if (!filters.buildingId) return [];
                const rooms = await roomService.getRooms({ buildingId: filters.buildingId, search });
                return rooms.map((room) => ({
                  label: `Phòng ${room.roomCode}`,
                  value: String(room.id),
                }));
              }}
            />

            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <select
                value={filters.assignedTo}
                onChange={(event) => updateFilter('assignedTo', event.target.value)}
                className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-bold text-slate-800 outline-none transition-all focus:border-primary focus:bg-white"
              >
                <option value="">Tất cả người phụ trách</option>
                {staffMembers?.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.fullName} ({staff.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 pl-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Calendar size={12} />
            <span>Thời gian và ưu tiên</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.dateRange.from}
                onChange={(event) =>
                  updateFilter('dateRange', { ...filters.dateRange, from: event.target.value })
                }
                className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[11px] font-bold outline-none"
              />
              <span className="text-slate-300">→</span>
              <input
                type="date"
                value={filters.dateRange.to}
                onChange={(event) =>
                  updateFilter('dateRange', { ...filters.dateRange, to: event.target.value })
                }
                className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[11px] font-bold outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => updateFilter('slaBreached', !filters.slaBreached)}
              className={cn(
                'flex h-10 w-full items-center justify-between rounded-xl border px-4 transition-all',
                filters.slaBreached
                  ? 'border-red-200 bg-red-50 text-red-600'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
              )}
            >
              <span className="text-xs font-bold">Chỉ hiện yêu cầu quá hạn xử lý tham chiếu</span>
              <span
                className={cn(
                  'h-4 w-4 rounded-full border-2',
                  filters.slaBreached ? 'border-red-600 bg-red-600' : 'border-slate-300 bg-white'
                )}
              />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between pl-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Phân loại và trạng thái
            </div>
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-tight text-primary hover:underline"
            >
              <RotateCcw size={10} />
              Đặt lại
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleMultiSelect('type', category)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-[10px] font-bold transition-all',
                    filters.type.includes(category)
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                  )}
                >
                  {getTicketCategoryShortLabel(category)}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PRIORITIES.map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => toggleMultiSelect('priority', priority)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-[10px] font-bold transition-all',
                    filters.priority.includes(priority)
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                  )}
                >
                  {PRIORITY_LABELS_VI[priority]}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleMultiSelect('status', status)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-[10px] font-bold transition-all',
                    filters.status.includes(status)
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                  )}
                >
                  {getTicketStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
