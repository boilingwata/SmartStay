import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { format } from 'date-fns';

import reportService from '@/services/reportService';
import { buildingService } from '@/services/buildingService';
import { KPICard } from '@/components/data/KPICard';
import { FilterPanel, FilterConfig } from '@/components/shared/FilterPanel';
import { ErrorBanner, EmptyState } from '@/components/ui/StatusStates';
import { ReportFilter } from '@/types/reports';

const AlertsReport: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: ReportFilter = useMemo(() => ({
    buildingIds: searchParams.get('buildingIds')?.split(',').map(Number),
    from: searchParams.get('from') || format(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM-dd'),
    to: searchParams.get('to') || format(new Date(), 'yyyy-MM-dd'),
    period: (searchParams.get('period') as any) || 'month',
  }), [searchParams]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['alertAnalytics', filters],
    queryFn: () => reportService.getAlertAnalytics(filters),
    retry: 1,
  });

  const handleFilterChange = (newValues: any) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newValues).forEach(([key, value]) => {
      if (value) {
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
  ];

  if (isError) return <div className="p-8"><ErrorBanner message="Lỗi tải báo cáo cảnh báo" onRetry={() => refetch()} /></div>;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Cảnh báo Hệ thống</h1>
          <p className="text-slate-500 text-sm">Phân tích tần suất và tốc độ xử lý các cảnh báo vận hành.</p>
        </div>
      </div>

      <FilterPanel 
        filters={filterConfigs} 
        values={{ ...filters, dateRange: { start: filters.from, end: filters.to } }} 
        onChange={handleFilterChange} 
        activeCount={Object.values(filters).filter(Boolean).length}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard 
          title="Cảnh báo Khẩn cấp" 
          value={data?.criticalCount || 0} 
          icon={ShieldAlert} 
          color="danger" 
          delta={data?.criticalDelta} 
          loading={isLoading} 
        />
        <KPICard 
          title="Cảnh báo Vận hành" 
          value={data?.warningCount || 0} 
          icon={AlertCircle} 
          color="warning" 
          delta={data?.warningDelta} 
          loading={isLoading} 
        />
        <KPICard 
          title="Tỷ lệ xử lý" 
          value={`${data?.resolutionRate || 0}%`} 
          icon={Clock} 
          color="success" 
          loading={isLoading} 
          subtitle="Trong 24h" 
        />
      </div>

      <div className="bg-white border rounded-2xl shadow-sm p-6">
        <h3 className="font-semibold mb-6">Xu hướng cảnh báo hệ thống</h3>
        <div className="h-[300px]">
           {isLoading ? (
             <div className="w-full h-full bg-slate-50 animate-pulse rounded-lg" />
           ) : (
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.trend || []}>
                   <defs>
                     <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                       <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                   <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   />
                   <Area type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
             </ResponsiveContainer>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
               <h3 className="font-semibold text-sm">Cảnh báo chưa xử lý</h3>
               <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">8 KHẨN CẤP</span>
            </div>
            <div className="divide-y">
               {[1,2,3].map(i => (
                 <div key={i} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                       <ShieldAlert size={20} />
                    </div>
                    <div className="flex-1 space-y-1">
                       <div className="flex justify-between">
                          <span className="font-bold text-sm">Quá tải công suất điện</span>
                          <span className="text-[10px] text-slate-400">2 giờ trước</span>
                       </div>
                       <p className="text-xs text-slate-500">Tòa Keangnam - P.1402 vượt ngưỡng an toàn điện (định kỳ 15p).</p>
                    </div>
                 </div>
               ))}
            </div>
            <div className="p-4 border-t bg-slate-50/10 text-center">
               <button className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1">
                  Xem tất cả cảnh báo <ArrowRight size={12} />
               </button>
            </div>
         </div>

         <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
               <h3 className="font-semibold text-sm">Phân bổ theo mức độ</h3>
            </div>
            <div className="p-6 space-y-6">
               <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                     <span className="text-rose-600">Khẩn cấp</span>
                     <span>42 (20%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-rose-500 w-[20%]" />
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                     <span className="text-amber-600">Cảnh báo</span>
                     <span>156 (65%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-amber-500 w-[65%]" />
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                     <span className="text-blue-600">Thông tin</span>
                     <span>35 (15%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 w-[15%]" />
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AlertsReport;
