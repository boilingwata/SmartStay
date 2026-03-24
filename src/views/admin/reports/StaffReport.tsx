import React, { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Star as StarIcon,
  Clock,
  CheckCircle2,
  Ticket,
  Download,
  ArrowUpDown,
  User,
} from 'lucide-react';
import { format, subMonths } from 'date-fns';

import reportService from '@/services/reportService';
import { buildingService } from '@/services/buildingService';
import { FilterPanel, FilterConfig } from '@/components/shared/FilterPanel';
import { ReportFilter, StaffPerformance } from '@/types/reports';
import { cn } from '@/utils';
import { EmptyState, ErrorBanner } from '@/components/ui/StatusStates';

const StaffReport: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortConfig, setSortConfig] = useState<{ key: keyof StaffPerformance; direction: 'asc' | 'desc' }>({
    key: 'avgRating',
    direction: 'desc'
  });

  const filters: ReportFilter = useMemo(() => {
    const from = searchParams.get('from') || format(subMonths(new Date(), 1), 'yyyy-MM-dd');
    const to = searchParams.get('to') || format(new Date(), 'yyyy-MM-dd');
    const period = (searchParams.get('period') as ReportFilter['period']) || 'month';
    const buildingIds = searchParams.get('buildingId') ? [Number(searchParams.get('buildingId'))] : undefined;

    return { buildingIds, from, to, period };
  }, [searchParams]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['staffPerformance', filters],
    queryFn: () => reportService.getStaffPerformance(filters),
    retry: 1,
  });

  const handleFilterChange = (newValues: any) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newValues).forEach(([key, value]) => {
      if (value) {
        if (key === 'buildingId') {
          params.set('buildingId', String(value));
        } else if (typeof value === 'object' && 'start' in (value as any)) {
          params.set('from', (value as any).start);
          params.set('to', (value as any).end);
        } else {
          params.set(key, String(value));
        }
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'buildingId',
      label: 'Tòa nhà',
      type: 'selectAsync',
      onSearch: async (q) => {
        const res = await buildingService.getBuildings({ search: q });
        return res.map(b => ({ label: b.buildingName, value: b.id }));
      }
    },
    {
      key: 'period',
      label: 'Kỳ báo cáo',
      type: 'select',
      options: [
        { label: 'Tháng', value: 'month' },
        { label: 'Quý', value: 'quarter' },
        { label: 'Năm', value: 'year' },
        { label: 'Tùy chỉnh', value: 'custom' },
      ]
    },
    ...(filters.period === 'custom' ? [{ key: 'dateRange', label: 'Khoảng thời gian', type: 'dateRange' } as FilterConfig] : []),
  ];

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getSLALevel = (rate: number) => {
    if (rate >= 80) return 'text-emerald-600 bg-emerald-50';
    if (rate >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };

  const sortedData = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = aVal < bVal ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  const requestSort = (key: keyof StaffPerformance) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  if (isError) return <div className="p-8"><ErrorBanner message="Lỗi tải dữ liệu hiệu suất nhân viên" onRetry={() => refetch()} /></div>;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="text-cyan-600" /> Hiệu suất & Đánh giá Nhân viên
          </h1>
          <p className="text-slate-500 text-sm italic">Theo dõi năng năng suất xử lý công việc và mức độ hài lòng của cư dân với nhân sự.</p>
        </div>
        <button
          onClick={() => reportService.exportReport('staff', filters as any)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-sm text-sm font-medium"
        >
          <Download size={18} /> Xuất Excel
        </button>
      </div>

      <FilterPanel 
        filters={filterConfigs} 
        values={{ ...filters, buildingId: filters.buildingIds?.[0], dateRange: { start: filters.from, end: filters.to } }} 
        onChange={handleFilterChange} 
        activeCount={Object.values(filters).filter(Boolean).length}
      />

      <div className="card-container p-0 bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="py-4 px-6 text-left cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('staffName')}>
                  <div className="flex items-center gap-1">Nhân viên <ArrowUpDown size={12} /></div>
                </th>
                <th className="py-4 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('ticketsResolved')}>
                  <div className="flex items-center justify-center gap-1">Ticket xử lý <ArrowUpDown size={12} /></div>
                </th>
                <th className="py-4 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('avgResolutionHours')}>
                  <div className="flex items-center justify-center gap-1">TG xử lý TB <ArrowUpDown size={12} /></div>
                </th>
                <th className="py-4 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('slaRate')}>
                  <div className="flex items-center justify-center gap-1">Đúng hạn SLA <ArrowUpDown size={12} /></div>
                </th>
                <th className="py-4 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('avgRating')}>
                  <div className="flex items-center justify-center gap-1">Đánh giá TB <ArrowUpDown size={12} /></div>
                </th>
                <th className="py-4 px-6 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('ratingCount')}>
                  <div className="flex items-center justify-end gap-1">Số lượt ĐG <ArrowUpDown size={12} /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="h-16 animate-pulse bg-slate-50/20">
                    <td colSpan={6} className="px-6 py-4"><div className="w-full h-8 bg-slate-100 rounded-lg" /></td>
                  </tr>
                ))
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <EmptyState title="Chưa có dữ liệu" message="Chưa có dữ liệu nhân viên trong kỳ này." />
                  </td>
                </tr>
              ) : sortedData.map((staff) => (
                <tr key={staff.staffId} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-4 px-6">
                    <Link to={`/admin/staff/${staff.staffId}/ratings`} className="flex items-center gap-3 group/link">
                       <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border-2 border-white shadow-sm transition-transform group-hover/link:scale-110">
                          {staff.avatarUrl ? (
                            <img src={staff.avatarUrl} alt={staff.staffName} className="w-full h-full object-cover" />
                          ) : (
                            <User size={20} className="text-slate-400" />
                          )}
                       </div>
                       <div>
                          <p className="font-black text-primary group-hover/link:text-cyan-600 transition-colors">{staff.staffName}</p>
                          <p className="text-[10px] text-muted font-bold uppercase tracking-tight">Kỹ thuật viên</p>
                       </div>
                    </Link>
                  </td>
                  <td className="py-4 px-4 text-center">
                     <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100 shadow-sm">
                        <Ticket size={14} /> {staff.ticketsResolved}
                     </span>
                  </td>
                  <td className="py-4 px-4 text-center font-mono font-bold text-slate-600">
                    <div className="flex items-center justify-center gap-1.5">
                       <Clock size={14} className="text-slate-400" />
                       {formatHours(staff.avgResolutionHours)}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black border tracking-tighter shadow-sm",
                      getSLALevel(staff.slaRate)
                    )}>
                       <CheckCircle2 size={14} />
                       {staff.slaRate}%
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex flex-col items-center">
                       <div className="flex items-center gap-0.5 mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon 
                              key={star} 
                              size={12} 
                              className={cn(
                                star <= staff.avgRating ? "text-amber-400 fill-amber-400" : "text-slate-200"
                              )} 
                            />
                          ))}
                       </div>
                       <span className="text-sm font-black text-primary leading-none">{staff.avgRating.toFixed(1)}/5.0</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-xs font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                       {staff.ratingCount} lượt
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffReport;
