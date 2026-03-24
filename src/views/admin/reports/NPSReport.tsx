import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Star,
  Users,
  MessageSquare,
  TrendingUp,
  Download,
  Calendar,
  ArrowRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import { format, subMonths } from 'date-fns';

import reportService from '@/services/reportService';
import { buildingService } from '@/services/buildingService';
import { FilterPanel, FilterConfig } from '@/components/shared/FilterPanel';
import { ReportFilter } from '@/types/reports';
import { cn } from '@/utils';
import { EmptyState, ErrorBanner } from '@/components/ui/StatusStates';

const NPSReport: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const from = searchParams.get('from') || format(subMonths(new Date(), 12), 'yyyy-MM-dd');
    const to = searchParams.get('to') || format(new Date(), 'yyyy-MM-dd');
    const period = (searchParams.get('period') as ReportFilter['period']) || 'month';
    const buildingIds = searchParams.get('buildingId') ? [Number(searchParams.get('buildingId'))] : undefined;
    const triggerType = searchParams.get('triggerType') || undefined;

    return { buildingIds, from, to, period, triggerType };
  }, [searchParams]);

  // Queries
  const { data: summary, isLoading: isLoadingSummary, isError: isErrorSummary, refetch: refetchSummary } = useQuery({
    queryKey: ['npsSummary', filters],
    queryFn: () => reportService.getNPSSummary(filters),
    retry: 1,
  });

  const { data: trend, isLoading: isLoadingTrend, isError: isErrorTrend, refetch: refetchTrend } = useQuery({
    queryKey: ['npsTrend', filters],
    queryFn: () => reportService.getNPSTrend(filters),
    retry: 1,
  });

  const { data: responses, isLoading: isLoadingResponses, isError: isErrorResponses, refetch: refetchResponses } = useQuery({
    queryKey: ['npsResponses', filters],
    queryFn: () => reportService.getNPSResponses(filters),
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
      key: 'triggerType',
      label: 'Loại khảo sát',
      type: 'select',
      options: [
        { label: 'Tất cả', value: '' },
        { label: 'Hàng tháng', value: 'Monthly' },
        { label: 'Sau Check-out', value: 'PostCheckOut' },
        { label: 'Sau Bảo trì', value: 'PostMaintenance' },
      ]
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

  const handleRefetch = () => {
    refetchSummary();
    refetchTrend();
    refetchResponses();
  };

  // Radial Bar Data (Gauge logic)
  // Recharts RadialBar starts from -90 deg (top) by default or 0 (right).
  // For a gauge -100 to 100:
  // Map -100 to 0 and 100 to 200.
  const radialData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'Detractors', value: 100, fill: '#fee2e2' },
      { name: 'Passives', value: 150, fill: '#f1f5f9' },
      { name: 'Promoters', value: 200, fill: '#dcfce7' },
      {
        name: 'NPS',
        value: summary.score + 100, // Shift range to 0-200
        fill: summary.score >= 50 ? '#10b981' : summary.score >= 0 ? '#64748b' : '#ef4444',
      }
    ];
  }, [summary]);

  if (isErrorSummary || isErrorTrend || isErrorResponses) {
    return <div className="p-8"><ErrorBanner message="Lỗi tải báo cáo NPS" onRetry={handleRefetch} /></div>;
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Star className="text-amber-500 fill-amber-500" /> Báo cáo NPS & Hài lòng
          </h1>
          <p className="text-slate-500 text-sm italic">Đo lường mức độ trung thành và ý kiến phản hồi từ cư dân.</p>
        </div>
        <button
          onClick={() => reportService.exportReport('nps', filters as any)}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NPS Score Gauge */}
        <div className="card-container p-8 bg-white border border-slate-200 flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-64 h-64 flex items-center justify-center">
             {isLoadingSummary ? (
               <div className="w-full h-full rounded-full bg-slate-100 animate-pulse" />
             ) : (
               <>
                 <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      innerRadius="70%" 
                      outerRadius="100%" 
                      data={radialData} 
                      startAngle={225} 
                      endAngle={-45}
                      barSize={20}
                    >
                      <PolarAngleAxis 
                        type="number" 
                        domain={[0, 200]} 
                        angleAxisId={0} 
                        tick={false} 
                      />
                      <RadialBar 
                        dataKey="value" 
                        cornerRadius={10}
                      />
                    </RadialBarChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Net Promoter Score</span>
                    <span className={cn(
                      "text-6xl font-black tracking-tighter",
                      (summary?.score ?? 0) >= 50 ? "text-emerald-600" : (summary?.score ?? 0) >= 0 ? "text-slate-600" : "text-rose-600"
                    )}>
                      {summary?.score}
                    </span>
                    <div className="flex items-center gap-1 mt-2">
                       <div className={cn(
                         "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest text-white shadow-lg",
                         (summary?.score ?? 0) >= 50 ? "bg-emerald-500 shadow-emerald-500/20" : (summary?.score ?? 0) >= 0 ? "bg-slate-400 shadow-slate-400/20" : "bg-rose-500 shadow-rose-500/20"
                       )}>
                         {(summary?.score ?? 0) >= 50 ? 'Excellent' : (summary?.score ?? 0) >= 0 ? 'Good' : 'Needs Work'}
                       </div>
                    </div>
                 </div>
               </>
             )}
          </div>

          <div className="flex-1 w-full space-y-4">
             <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between group hover:shadow-xl transition-all">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <Users size={20} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Promoters (9-10)</p>
                      <p className="text-xl font-black text-emerald-600">{summary?.promoterPct || 0}%</p>
                   </div>
                </div>
                <div className="h-1 flex-1 mx-6 bg-emerald-200 rounded-full overflow-hidden hidden md:block">
                   <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${summary?.promoterPct || 0}%` }} />
                </div>
             </div>

             <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:shadow-xl transition-all">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-slate-400 text-white flex items-center justify-center shadow-lg shadow-slate-400/20">
                      <Users size={20} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Passives (7-8)</p>
                      <p className="text-xl font-black text-slate-600">{summary?.passivePct || 0}%</p>
                   </div>
                </div>
                <div className="h-1 flex-1 mx-6 bg-slate-200 rounded-full overflow-hidden hidden md:block">
                   <div className="h-full bg-slate-400 rounded-full" style={{ width: `${summary?.passivePct || 0}%` }} />
                </div>
             </div>

             <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-between group hover:shadow-xl transition-all">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                      <Users size={20} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest">Detractors (0-6)</p>
                      <p className="text-xl font-black text-rose-600">{summary?.detractorPct || 0}%</p>
                   </div>
                </div>
                <div className="h-1 flex-1 mx-6 bg-rose-200 rounded-full overflow-hidden hidden md:block">
                   <div className="h-full bg-rose-500 rounded-full" style={{ width: `${summary?.detractorPct || 0}%` }} />
                </div>
             </div>
          </div>
        </div>

        {/* NPS Trend Line Chart */}
        <div className="card-container p-8 bg-white border border-slate-200 flex flex-col justify-between">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                 <TrendingUp className="text-blue-600" size={20} />
                 Xu hướng NPS (12 tháng)
              </h3>
              <div className="flex items-center gap-3">
                 <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted uppercase tracking-tighter">
                    <div className="w-2 h-2 rounded-full bg-blue-600" /> Điểm số
                 </span>
              </div>
           </div>

           <div className="h-[300px] w-full mt-4">
             {isLoadingTrend ? (
               <div className="w-full h-full bg-slate-50 animate-pulse rounded-2xl" />
             ) : (
               <ResponsiveContainer width="100%" height={300}>
                 <LineChart data={trend}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                   />
                   <YAxis 
                    domain={[-100, 100]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10 }} 
                   />
                   <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                   />
                   <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="3 3" />
                   <ReferenceLine y={50} stroke="#bbf7d0" strokeDasharray="3 3" label={{ position: 'right', value: 'Excellent', fill: '#10b981', fontSize: 10, fontWeight: 'bold' }} />
                   <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#2563eb" 
                    strokeWidth={4} 
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#2563eb' }}
                    activeDot={{ r: 6 }}
                   />
                 </LineChart>
               </ResponsiveContainer>
             )}
           </div>
           
           <div className="mt-8 pt-6 border-t border-dashed border-slate-200">
              <div className="flex items-center justify-between">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng phản hồi</span>
                    <span className="text-2xl font-black text-primary">{summary?.totalResponses || 0}</span>
                 </div>
                 <button className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1.5 hover:gap-2 transition-all">
                    Xem tất cả khảo sát <ArrowRight size={14} />
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* NPS Responses Table */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-primary flex items-center gap-2 uppercase tracking-tighter">
           <MessageSquare className="text-indigo-500" /> Ý kiến phản hồi gần đây
        </h3>
        
        <div className="card-container p-0 bg-white border border-slate-200 overflow-hidden">
           <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
              <table className="w-full text-sm">
                 <thead className="sticky top-0 z-20 bg-slate-50 border-b">
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                       <th className="py-4 px-6 text-left">Cư dân</th>
                       <th className="py-4 px-4 text-center">Điểm NPS</th>
                       <th className="py-4 px-4 text-left">Bình luận</th>
                       <th className="py-4 px-4 text-center">Nguồn</th>
                       <th className="py-4 px-6 text-right">Thời gian</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {isLoadingResponses ? (
                      [1,2,3,4,5].map(i => <tr key={i} className="h-16 animate-pulse bg-slate-50/20" />)
                    ) : !responses?.length ? (
                      <tr>
                        <td colSpan={5} className="py-20">
                           <EmptyState title="Không có phản hồi nào" message="Hiện tại chưa có dữ liệu khảo sát phù hợp với tiêu chí lọc." />
                        </td>
                      </tr>
                    ) : responses.sort((a, b) => a.score - b.score).map((resp, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                         <td className="py-4 px-6 font-bold text-primary">{resp.tenantName}</td>
                         <td className="py-4 px-4 text-center">
                            <span className={cn(
                              "inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-white shadow-lg",
                              resp.score >= 9 ? "bg-emerald-500 shadow-emerald-500/20" : resp.score >= 7 ? "bg-slate-400 shadow-slate-400/20" : "bg-rose-500 shadow-rose-500/20"
                            )}>
                              {resp.score}
                            </span>
                         </td>
                         <td className="py-4 px-4 text-slate-600 leading-relaxed italic max-w-sm truncate group" title={resp.comment}>
                            "{resp.comment}"
                         </td>
                         <td className="py-4 px-4 text-center">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-widest">
                               {resp.triggerType}
                            </span>
                         </td>
                         <td className="py-4 px-6 text-right font-mono text-slate-400 text-xs">
                            {format(new Date(resp.createdAt), 'dd/MM/yyyy HH:mm')}
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
};

export default NPSReport;
