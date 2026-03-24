import React, { useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  History,
  TrendingDown,
  Clock,
  Home,
  ArrowRight,
  Download,
  Calendar,
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

import reportService from '@/services/reportService';
import { buildingService } from '@/services/buildingService';
import { KPICard } from '@/components/data/KPICard';
import { FilterPanel, FilterConfig } from '@/components/shared/FilterPanel';
import { ReportFilter } from '@/types/reports';
import { cn } from '@/utils';
import { ErrorBanner, EmptyState } from '@/components/ui/StatusStates';

const RoomLifecycleReport: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const filters: ReportFilter = useMemo(() => {
    const from = searchParams.get('from') || format(new Date().setMonth(new Date().getMonth() - 6), 'yyyy-MM-dd');
    const to = searchParams.get('to') || format(new Date(), 'yyyy-MM-dd');
    return {
      buildingIds: searchParams.get('buildingId') ? [Number(searchParams.get('buildingId'))] : undefined,
      from,
      to,
      period: (searchParams.get('period') as ReportFilter['period']) || 'custom',
    };
  }, [searchParams]);

  // Queries
  const { data: lifecycle, isLoading: isLoadingLifecycle, isError: isErrorLifecycle, refetch: refetchLifecycle } = useQuery({
    queryKey: ['roomLifecycle', filters],
    queryFn: () => reportService.getRoomLifecycle(filters),
    retry: 1,
  });

  const { data: summary, isLoading: isLoadingSummary, isError: isErrorSummary, refetch: refetchSummary } = useQuery({
    queryKey: ['vacancySummary', filters],
    queryFn: () => reportService.getVacancySummary(filters),
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
      key: 'floor',
      label: 'Tầng',
      type: 'select',
      options: Array.from({ length: 30 }, (_, i) => ({ label: `Tầng ${i + 1}`, value: i + 1 }))
    },
    {
      key: 'roomType',
      label: 'Loại phòng',
      type: 'select',
      options: [
        { label: 'Studio', value: 'Studio' },
        { label: '1BR', value: '1BR' },
        { label: '2BR', value: '2BR' },
      ]
    },
    {
      key: 'dateRange',
      label: 'Khoảng thời gian',
      type: 'dateRange',
      placeholder: 'Chọn khoảng thời gian'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Occupied': return 'bg-[#065F46]';
      case 'Vacant': return 'bg-[#9CA3AF]';
      case 'Maintenance': return 'bg-[#F59E0B]';
      case 'Reserved': return 'bg-[#7C3AED]';
      default: return 'bg-slate-200';
    }
  };

  const totalRangeDays = useMemo(() => {
    return differenceInDays(parseISO(filters.to), parseISO(filters.from)) + 1;
  }, [filters.from, filters.to]);

  const handleRefetch = () => {
    refetchLifecycle();
    refetchSummary();
  };

  if (isErrorLifecycle || isErrorSummary) {
    return <div className="p-8"><ErrorBanner message="Lỗi tải báo cáo vòng đời phòng" onRetry={handleRefetch} /></div>;
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-mono uppercase tracking-tighter">Báo cáo Vòng đời Phòng</h1>
          <p className="text-slate-500 text-sm">Phân tích quá trình vận hành và khai thác của từng phòng theo thời gian.</p>
        </div>
        <button
          onClick={() => reportService.exportReport('lifecycle', filters)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-sm text-sm font-medium"
        >
          <Download size={18} /> Xuất Excel
        </button>
      </div>

      <FilterPanel 
        filters={filterConfigs} 
        values={{ ...filters, buildingId: filters.buildingIds?.[0], dateRange: { start: filters.from, end: filters.to } }} 
        onChange={handleFilterChange as any} 
        activeCount={Object.values(filters).filter(Boolean).length}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Thời gian trống TB" 
          value={`${summary?.avgVacancyDaysThisMonth || 0} ngày`} 
          icon={Clock} 
          delta={(summary?.avgVacancyDaysThisMonth || 0) - (summary?.avgVacancyDaysPrevMonth || 0)}
          color="success" 
          loading={isLoadingSummary} 
          reverseDeltaColor={true}
        />
        <KPICard 
          title="Tỷ lệ trống TB" 
          value={`${summary?.avgVacancyRateThisMonth || 0}%`} 
          icon={TrendingDown} 
          delta={(summary?.avgVacancyRateThisMonth || 0) - (summary?.avgVacancyRatePrevMonth || 0)}
          color="primary" 
          loading={isLoadingSummary} 
          reverseDeltaColor={true}
        />
        <KPICard 
          title="Phòng trống lâu nhất" 
          value={summary?.longestVacantRoom.roomCode || '---'} 
          icon={Home} 
          subtitle={`${summary?.longestVacantRoom.days || 0} ngày`} 
          color="danger" 
          loading={isLoadingSummary} 
          onClick={() => summary?.longestVacantRoom.roomId && navigate(`/admin/rooms/${summary.longestVacantRoom.roomId}`)}
        />
        <KPICard 
          title="TB ngày ký HĐ" 
          value={`${summary?.avgDaysToLease || 0} ngày`} 
          icon={History} 
          subtitle="Từ khi phòng trống" 
          color="accent" 
          loading={isLoadingSummary} 
        />
      </div>

      <div className="p-8 bg-white border rounded-3xl shadow-xl shadow-slate-200/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h3 className="text-xl font-black text-primary uppercase tracking-tighter flex items-center gap-2">
              <div className="w-2 h-8 bg-blue-600 rounded-full" />
              Lịch sử trạng thái phòng (Visual Timeline)
            </h3>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest italic">Dữ liệu từ {filters.from} đến {filters.to}</p>
          </div>
          <div className="flex flex-wrap items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#065F46]" /> 
                <span className="text-[10px] font-black text-slate-500 uppercase">Đang ở</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#7C3AED]" /> 
                <span className="text-[10px] font-black text-slate-500 uppercase">Đã đặt</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#9CA3AF]" /> 
                <span className="text-[10px] font-black text-slate-500 uppercase">Trống</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#F59E0B]" /> 
                <span className="text-[10px] font-black text-slate-500 uppercase">Bảo trì</span>
             </div>
          </div>
        </div>

        {isLoadingLifecycle ? (
          <div className="space-y-6">
             {[1,2,3,4,5].map(i => (
               <div key={i} className="flex gap-4 items-center">
                  <div className="w-16 h-4 bg-slate-100 animate-pulse rounded" />
                  <div className="flex-1 h-8 bg-slate-50 animate-pulse rounded-full" />
               </div>
             ))}
          </div>
        ) : !lifecycle?.length ? (
          <EmptyState title="Không tìm thấy phòng" message="Vui lòng kiểm tra lại tòa nhà hoặc tầng đã chọn." />
        ) : (
          <div className="space-y-8 overflow-y-auto max-h-[600px] pr-4 custom-scrollbar">
            {lifecycle.slice(0, 20).map((room: any) => (
              <div key={room.roomId} className="relative group/row">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-primary group-hover/row:text-blue-600 transition-colors uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">{room.roomCode}</span>
                  <span className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter italic">{totalRangeDays} ngày lịch sử</span>
                </div>
                <div className="flex h-8 w-full rounded-2xl overflow-hidden bg-slate-100 shadow-inner border border-slate-200">
                  {room.segments.map((seg: any, idx: number) => (
                    <div
                      key={idx}
                      className={cn(
                        "h-full relative transition-all hover:brightness-110 cursor-pointer group/item flex items-center justify-center",
                        getStatusColor(seg.status)
                      )}
                      style={{ width: `${(seg.days / totalRangeDays) * 100}%` }}
                    >
                       {seg.days > 5 && (
                         <span className="text-[8px] font-black text-white/40 uppercase hidden group-item-hover:block">{seg.days}d</span>
                       )}
                       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-item-hover:block z-20">
                          <div className="bg-slate-900 text-white text-[10px] px-3 py-2 rounded-xl shadow-2xl whitespace-nowrap border border-white/10">
                             <div className="font-black text-blue-400 uppercase tracking-widest border-b border-white/10 pb-1 mb-1">{seg.status}</div>
                             <div className="font-medium">{seg.fromDate} → {seg.toDate}</div>
                             <div className="font-bold text-emerald-400 mt-0.5">{seg.days} ngày vận hành</div>
                          </div>
                          <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1 border-r border-b border-white/10" />
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-8 bg-white border rounded-3xl shadow-sm">
        <h3 className="text-xl font-black text-primary uppercase tracking-tighter mb-8 flex items-center gap-2">
          <TrendingDown className="text-primary" />
          Báo cáo hiệu suất lấp đầy chi tiết
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="text-left py-4 px-6">Chỉ số Hiệu suất (Metric)</th>
                <th className="text-right py-4 px-6">Tháng này</th>
                <th className="text-right py-4 px-6">Tháng trước</th>
                <th className="text-right py-4 px-6">Biến động (Delta)</th>
                <th className="text-left py-4 px-6">Ghi chú vận hành</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { 
                  label: "Thời gian trống trung bình", 
                  this: `${summary?.avgVacancyDaysThisMonth || 0} d`, 
                  prev: `${summary?.avgVacancyDaysPrevMonth || 0} d`,
                  delta: (summary?.avgVacancyDaysThisMonth || 0) - (summary?.avgVacancyDaysPrevMonth || 0),
                  note: "Số ngày trung bình phòng ở trạng thái Vacant."
                },
                { 
                  label: "Tỷ lệ trống trung bình", 
                  this: `${summary?.avgVacancyRateThisMonth || 0}%`, 
                  prev: `${summary?.avgVacancyRatePrevMonth || 0}%`,
                  delta: (summary?.avgVacancyRateThisMonth || 0) - (summary?.avgVacancyRatePrevMonth || 0),
                  note: "Tỷ lệ % thời gian phòng không mang lại doanh thu."
                },
                { 
                  label: "Phòng trống lâu nhất", 
                  this: summary?.longestVacantRoom.roomCode || "---", 
                  prev: "---",
                  delta: 0,
                  note: `Cần đẩy mạnh marketing cho phòng đã trống ${summary?.longestVacantRoom.days || 0} ngày.`,
                  link: `/admin/rooms/${summary?.longestVacantRoom.roomId}`
                },
                { 
                  label: "TB ngày trống trước khi thuê", 
                  this: `${summary?.avgDaysToLease || 0} d`, 
                  prev: `${summary?.avgDaysToLeasePrev || 0} d`,
                  delta: (summary?.avgDaysToLease || 0) - (summary?.avgDaysToLeasePrev || 0),
                  note: "Đo lường tốc độ chốt hợp đồng mới của bộ phận Sale."
                }
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-5 px-6 font-bold text-primary">{row.label}</td>
                  <td className="text-right py-5 px-6 font-black text-slate-700">{row.this}</td>
                  <td className="text-right py-5 px-6 text-slate-400 font-medium">{row.prev}</td>
                  <td className={cn(
                    "text-right py-5 px-6 font-black",
                    row.delta > 0 ? "text-rose-600" : row.delta < 0 ? "text-emerald-600" : "text-slate-400"
                  )}>
                    {row.delta > 0 ? '+' : ''}{row.delta === 0 ? '--' : row.delta}
                  </td>
                  <td className="py-5 px-6 text-xs text-slate-500 italic max-w-xs">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoomLifecycleReport;
