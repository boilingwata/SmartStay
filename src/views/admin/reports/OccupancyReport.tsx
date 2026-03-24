import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Home,
  Clock,
  AlertCircle,
  Download,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { format, subMonths } from 'date-fns';

import reportService from '@/services/reportService';
import { buildingService } from '@/services/buildingService';
import { KPICard } from '@/components/data/KPICard';
import { FilterPanel, FilterConfig } from '@/components/shared/FilterPanel';
import { ReportFilter } from '@/types/reports';
import { cn } from '@/utils';
import { EmptyState, ErrorBanner } from '@/components/ui/StatusStates';

// Skeleton Component
const ReportSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-2xl" />
      ))}
    </div>
    <div className="h-[300px] bg-slate-100 animate-pulse rounded-2xl" />
    <div className="h-[400px] bg-slate-100 animate-pulse rounded-2xl" />
  </div>
);

const Sparkline = ({ data }: { data: any[] }) => (
  <div className="h-8 w-16">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const OccupancyReport: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const filters: ReportFilter = useMemo(() => {
    const from = searchParams.get('from') || format(subMonths(new Date(), 6), 'yyyy-MM-dd');
    const to = searchParams.get('to') || format(new Date(), 'yyyy-MM-dd');
    const period = (searchParams.get('period') as ReportFilter['period']) || 'month';
    const buildingIds = searchParams.get('buildingIds')?.split(',').map(Number);

    return { buildingIds, from, to, period };
  }, [searchParams]);

  // KPI Query
  const { data: kpi, isLoading: isLoadingKPI, isError: isErrorKPI, refetch: refetchKPI } = useQuery({
    queryKey: ['occupancyKPI', filters],
    queryFn: () => reportService.getOccupancyKPI(filters),
    retry: 1,
  });

  // Trend Query
  const { data: trend, isLoading: isLoadingTrend, isError: isErrorTrend, refetch: refetchTrend } = useQuery({
    queryKey: ['occupancyTrend', filters],
    queryFn: () => reportService.getOccupancyTrend(filters),
    retry: 1,
  });

  // Heatmap Query
  const { data: heatmap, isLoading: isLoadingHeatmap, isError: isErrorHeatmap, refetch: refetchHeatmap } = useQuery({
    queryKey: ['occupancyHeatmap', filters.buildingIds?.[0], filters.from, filters.to],
    queryFn: () => reportService.getOccupancyHeatmap(filters),
    enabled: !!filters.from && !!filters.to && !!filters.buildingIds?.[0],
    retry: 1,
  });

  const handleFilterChange = (newValues: Record<string, unknown>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newValues).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
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
      key: 'buildingIds',
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
    {
      key: 'roomType',
      label: 'Loại phòng',
      type: 'select',
      options: [
        { label: 'Studio', value: 'Studio' },
        { label: '1BR', value: '1BR' },
        { label: '2BR', value: '2BR' },
        { label: '3BR', value: '3BR' },
        { label: 'Penthouse', value: 'Penthouse' },
      ]
    }
  ];

  const handleRefetch = () => {
    refetchKPI();
    refetchTrend();
    refetchHeatmap();
  };

  const trendDataGrouped = useMemo(() => {
    if (!trend) return [];
    const months = Array.from(new Set(trend.map(p => p.month))).sort();
    return months.map(month => {
      const point: any = { month };
      trend.filter(p => p.month === month).forEach(p => {
        point[p.buildingName] = p.rate;
      });
      return point;
    });
  }, [trend]);

  const buildingNames = useMemo(() => {
    if (!trend) return [];
    return Array.from(new Set(trend.map(p => p.buildingName)));
  }, [trend]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Occupied': return 'bg-[#065F46]';
      case 'Reserved': return 'bg-[#BFDBFE]'; // Spec: "xanh nhat"
      case 'Maintenance': return 'bg-[#ef4444]'; // Spec: "do"
      case 'Vacant': return 'bg-[#E5E7EB]'; // Spec: "xam"
      default: return 'bg-slate-200';
    }
  };

  if (isErrorKPI || isErrorTrend || isErrorHeatmap) {
    return <div className="p-8"><ErrorBanner message="Lỗi tải báo cáo lấp đầy" onRetry={handleRefetch} /></div>;
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Báo cáo Lấp đầy</h1>
          <p className="text-slate-500 text-sm italic">Theo dõi hiệu suất vận hành và xu hướng lấp đầy phòng.</p>
        </div>
        <button
          onClick={() => reportService.exportReport('occupancy', filters)}
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-slate-50 transition-all shadow-sm text-sm font-medium"
        >
          <Download size={18} /> Xuất Excel
        </button>
      </div>

      <FilterPanel 
        filters={filterConfigs} 
        values={{ ...filters, dateRange: { start: filters.from, end: filters.to } }} 
        onChange={handleFilterChange} 
        activeCount={Object.values(filters).filter(Boolean).length}
      />

      {(isLoadingKPI || isLoadingTrend) ? (
        <ReportSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard 
              title="Tỷ lệ lấp đầy TB" 
              value={`${kpi?.avgOccupancyRate || 0}%`} 
              icon={TrendingUp} 
              delta={kpi?.avgOccupancyDelta} 
              color="primary" 
            />
            <KPICard 
              title="Phòng đang thuê" 
              value={kpi?.occupiedRooms || 0} 
              icon={Users} 
              color="success" 
              subtitle={
                <div className="flex items-center gap-2 mt-1">
                  <Sparkline data={kpi?.sparklineData || [
                    { value: 10 }, { value: 12 }, { value: 11 }, { value: 14 }, { value: 13 }, { value: 15 }, { value: 14 }
                  ]} />
                  <span className="text-[10px] text-slate-400 font-bold">7 ngày qua</span>
                </div>
              }
            />
            <KPICard 
              title="Phòng trống lâu nhất" 
              value={kpi?.longestVacantRoom.roomCode || '---'} 
              icon={Home} 
              subtitle={`${kpi?.longestVacantRoom.days || 0} ngày`}
              color={(kpi?.longestVacantRoom.days ?? 0) > 30 ? 'danger' : 'warning'}
            />
            <KPICard 
              title="Thời gian trống TB" 
              value={`${kpi?.avgVacancyDays || 0} ngày`} 
              icon={Clock} 
              color="accent" 
            />
          </div>

          <div className="p-6 bg-white border rounded-2xl shadow-sm">
            <h3 className="text-lg font-semibold mb-6">Xu hướng tỷ lệ lấp đầy</h3>
            <div className="h-[300px]">
              {!trendDataGrouped.length ? (
                <EmptyState title="Không có dữ liệu xu hướng" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart 
                    data={trendDataGrouped}
                    onClick={(data) => {
                      if (data?.activeLabel) {
                        navigate(`/reports/occupancy?month=${data.activeLabel}`);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    <ReferenceLine y={80} stroke="green" strokeDasharray="3 3" label="Target 80%" />
                    <ReferenceLine y={60} stroke="orange" strokeDasharray="3 3" label="Safety 60%" />
                    {buildingNames.map((name, i) => (
                      <Line 
                        key={name} 
                        type="monotone" 
                        dataKey={name} 
                        stroke={['#2563eb', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'][i % 5]} 
                        strokeWidth={3} 
                        dot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="p-6 bg-white border rounded-2xl shadow-sm">
            <h3 className="text-lg font-semibold mb-6 font-mono uppercase tracking-widest">Bản đồ trạng thái phòng (Heatmap)</h3>
            <div className="flex gap-4 mb-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
               <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#065F46]" /> Occupied</div>
               <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#BFDBFE]" /> Reserved</div>
               <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#E5E7EB]" /> Vacant</div>
               <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#ef4444]" /> Maintenance</div>
            </div>
            
            <div className="overflow-x-auto overflow-y-auto max-h-[400px] border rounded-xl custom-scrollbar">
              {isLoadingHeatmap ? (
                <div className="h-64 flex items-center justify-center bg-slate-50 animate-pulse">
                   <div className="text-slate-400 font-bold italic">Đang tải bản đồ nhiệt...</div>
                </div>
              ) : !heatmap?.length ? (
                <EmptyState title="Không có dữ liệu heatmap" message="Vui lòng chọn 1 tòa nhà cụ thể." />
              ) : (
                <div 
                  className="grid gap-px bg-slate-100" 
                  style={{ 
                    gridTemplateColumns: `120px repeat(${Array.from(new Set(heatmap.map(c => c.month))).length}, 40px)`,
                    minWidth: 'max-content'
                  }}
                >
                  <div className="bg-slate-50 p-2 font-bold text-xs sticky left-0 z-10 border-r">Tháng / Phòng</div>
                  {Array.from(new Set(heatmap.map(c => c.month))).sort().map(m => (
                    <div key={m} className="bg-slate-50 p-2 font-bold text-[10px] text-center">{m}</div>
                  ))}
                  
                  {Array.from(new Set(heatmap.map(c => c.roomCode))).sort().slice(0, 20).map(room => (
                    <React.Fragment key={room}>
                      <div className="bg-white p-2 text-xs font-black text-primary sticky left-0 z-10 border-r">{room}</div>
                      {Array.from(new Set(heatmap.map(c => c.month))).sort().map(month => {
                        const cell = heatmap.find(c => c.roomCode === room && c.month === month);
                        return (
                          <div 
                            key={month} 
                            className={cn("h-10 transition-all hover:scale-110 cursor-pointer relative group", cell ? getStatusColor(cell.status) : 'bg-slate-50')}
                          >
                             {cell && (
                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                                  <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap">
                                     Phòng {cell.roomCode}: <span className="font-bold">{cell.status}</span>
                                     <br />
                                     {cell.fromDate} - {cell.toDate} ({cell.days} ngày)
                                  </div>
                                  <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1" />
                               </div>
                             )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OccupancyReport;
