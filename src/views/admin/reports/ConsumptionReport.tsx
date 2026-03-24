import React, { useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Zap,
  Droplets,
  TrendingUp,
  Download,
  Building2,
  Home,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, subMonths } from 'date-fns';

import reportService from '@/services/reportService';
import { buildingService } from '@/services/buildingService';
import { KPICard } from '@/components/data/KPICard';
import { FilterPanel, FilterConfig } from '@/components/shared/FilterPanel';
import { ReportFilter } from '@/types/reports';
import { formatVND, cn } from '@/utils';
import { EmptyState, ErrorBanner } from '@/components/ui/StatusStates';

const ConsumptionReport: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const filters: ReportFilter = useMemo(() => {
    const from = searchParams.get('from') || format(subMonths(new Date(), 6), 'yyyy-MM-dd');
    const to = searchParams.get('to') || format(new Date(), 'yyyy-MM-dd');
    const period = (searchParams.get('period') as ReportFilter['period']) || 'month';
    const buildingIds = searchParams.get('buildingIds')?.split(',').map(Number);
    const consumptionType = (searchParams.get('type') as ReportFilter['consumptionType']) || 'both';

    return { buildingIds, from, to, period, consumptionType };
  }, [searchParams]);

  // Queries
  const { data: kpi, isLoading: isLoadingKPI, isError: isErrorKPI, refetch: refetchKPI } = useQuery({
    queryKey: ['consumptionKPI', filters],
    queryFn: () => reportService.getConsumptionKPI(filters),
    retry: 1,
  });

  const { data: chartData, isLoading: isLoadingChart, isError: isErrorChart, refetch: refetchChart } = useQuery({
    queryKey: ['consumptionChart', filters],
    queryFn: () => reportService.getConsumptionChart(filters),
    retry: 1,
  });

  const { data: details, isLoading: isLoadingDetails, isError: isErrorDetails, refetch: refetchDetails } = useQuery({
    queryKey: ['consumptionDetail', filters],
    queryFn: () => reportService.getConsumptionDetail(filters),
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

  const setConsumptionType = (type: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('type', type);
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

  // Process chart data for multi-building grouping
  const processedChartData = useMemo(() => {
    if (!chartData) return [];
    const months = Array.from(new Set(chartData.map((d: any) => d.month))).sort();
    return months.map(m => {
      const point: any = { month: m };
      chartData.filter((d: any) => d.month === m).forEach((d: any) => {
        const value = filters.consumptionType === 'water' ? d.water : d.electricity;
        point[d.buildingName] = value;
      });
      return point;
    });
  }, [chartData, filters.consumptionType]);

  const buildingNames = useMemo(() => {
    if (!chartData) return [];
    return Array.from(new Set(chartData.map((d: any) => d.buildingName)));
  }, [chartData]);

  const handleRefetch = () => {
    refetchKPI();
    refetchChart();
    refetchDetails();
  };

  if (isErrorKPI || isErrorChart || isErrorDetails) {
    return <div className="p-8"><ErrorBanner message="Lỗi tải báo cáo tiêu thụ" onRetry={handleRefetch} /></div>;
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Zap className="text-amber-500" /> Báo cáo Tiêu thụ Điện & Nước
          </h1>
          <p className="text-slate-500 text-sm italic">Theo dõi chỉ số tiêu thụ và chi phí vận hành hạ tầng.</p>
        </div>
        <button
          onClick={() => reportService.exportReport('consumption', filters as any)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-sm text-sm font-medium"
        >
          <Download size={18} /> Xuất Excel
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <FilterPanel 
            filters={filterConfigs} 
            values={{ ...filters, dateRange: { start: filters.from, end: filters.to } }} 
            onChange={handleFilterChange} 
            activeCount={Object.values(filters).filter(Boolean).length}
          />
        </div>
        <div className="bg-white border rounded-xl p-3 flex items-center gap-2 h-fit self-end">
          <span className="text-[10px] font-black uppercase text-muted px-2">Phạm vi:</span>
          {[
            { id: 'electricity', label: 'Điện', icon: Zap },
            { id: 'water', label: 'Nước', icon: Droplets },
            { id: 'both', label: 'Cả hai', icon: TrendingUp },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setConsumptionType(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                (searchParams.get('type') || 'both') === t.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              )}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Điện TB/Phòng" 
          value={`${kpi?.avgElectricityPerRoom || 0} kWh`} 
          icon={Zap} 
          delta={kpi?.avgElectricityDelta}
          color="warning"
          loading={isLoadingKPI}
          reverseDeltaColor={true}
        />
        <KPICard 
          title="Nước TB/Phòng" 
          value={`${kpi?.avgWaterPerRoom || 0} m3`} 
          icon={Droplets} 
          delta={kpi?.avgWaterDelta}
          color="primary"
          loading={isLoadingKPI}
          reverseDeltaColor={true}
        />
        <KPICard 
          title="Phòng tiêu thụ cao" 
          value={kpi?.highestRoom.roomCode || '---'} 
          icon={AlertTriangle} 
          subtitle={`${kpi?.highestRoom.kwh || 0} kWh`}
          color="danger"
          loading={isLoadingKPI}
          onClick={() => navigate(`/admin/rooms/${kpi?.highestRoom.roomId}`)}
        />
        <KPICard 
          title="Tiền điện ước tính TB" 
          value={kpi?.avgElectricityBill || 0} 
          icon={TrendingUp} 
          isCurrency
          color="success"
          loading={isLoadingKPI}
        />
      </div>

      <div className="p-6 bg-white border rounded-2xl shadow-sm">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
           <Building2 className="text-primary" size={20} />
           Biến động tiêu thụ theo tòa nhà ({filters.consumptionType === 'water' ? 'm3' : 'kWh'})
        </h3>
        <div className="h-[300px]">
          {isLoadingChart ? (
            <div className="w-full h-full bg-slate-50 animate-pulse rounded-lg" />
          ) : !processedChartData.length ? (
            <EmptyState title="Không có dữ liệu biểu đồ" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={processedChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  content={({ active, label, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl text-[10px] space-y-2">
                          <p className="font-black uppercase tracking-widest border-b border-white/10 pb-1 mb-1">Tháng {label}</p>
                          {payload.map((item, i) => (
                            <div key={i} className="flex flex-col">
                              <span className="font-bold text-slate-400">{item.name}</span>
                              <div className="flex items-center gap-2">
                                <span className={cn("font-black", i === 0 ? "text-blue-400" : "text-emerald-400")}>
                                  {item.value} {filters.consumptionType === 'water' ? 'm3' : 'kWh'}
                                </span>
                                <span className="text-[9px] text-slate-500 italic">
                                  ~{formatVND(Number(item.value) * (filters.consumptionType === 'water' ? 15000 : 3500))}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                {buildingNames.map((name, i) => (
                  <Bar 
                    key={name}
                    dataKey={name as any}
                    fill={['#2563eb', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'][i % 5]} 
                    radius={[4, 4, 0, 0]}
                    barSize={buildingNames.length > 2 ? 15 : 30}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="p-6 bg-white border rounded-2xl shadow-sm overflow-hidden">
        <h3 className="text-lg font-semibold mb-6">Chi tiết tiêu thụ theo phòng</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-slate-500 uppercase text-[10px] font-bold tracking-wider bg-slate-50">
                <th className="text-left py-3 px-4">Phòng</th>
                <th className="text-left py-3 px-4">Tòa nhà</th>
                <th className="text-center py-3 px-4">Loại</th>
                <th className="text-right py-3 px-4">Chỉ số cũ</th>
                <th className="text-right py-3 px-4">Chỉ số mới</th>
                <th className="text-right py-3 px-4">Tiêu thụ</th>
                <th className="text-right py-3 px-4">Ước tính</th>
                <th className="text-right py-3 px-4">So tháng trước</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoadingDetails ? (
                [1, 2, 3, 4, 5].map(i => <tr key={i} className="h-12 bg-slate-50/20 animate-pulse" />)
              ) : !details?.length ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <EmptyState title="Không có dữ liệu chi tiết" message="Không tìm thấy bản ghi tiêu thụ nào khớp với bộ lọc." />
                  </td>
                </tr>
              ) : details?.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-4 px-4 font-bold text-primary">
                    <Link to={`/admin/rooms/${row.roomId}`} className="hover:underline flex items-center gap-1">
                      {row.roomCode} <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </td>
                  <td className="py-4 px-4 text-slate-500 font-medium">{row.buildingName}</td>
                  <td className="py-4 px-4 text-center">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                      row.type === 'electricity' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {row.type === 'electricity' ? 'Điện' : 'Nước'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-slate-400">{row.prevIndex}</td>
                  <td className="py-4 px-4 text-right font-mono font-bold">{row.currentIndex}</td>
                  <td className="py-4 px-4 text-right font-black text-primary">
                    {row.consumption} {row.type === 'electricity' ? 'kWh' : 'm3'}
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-emerald-600">{formatVND(row.estimatedAmount)}</td>
                  <td className={cn(
                    "py-4 px-4 text-right font-bold",
                    row.vsLastMonth > 0 ? "text-rose-600" : "text-emerald-600"
                  )}>
                    {row.vsLastMonth > 0 ? '+' : ''}{row.vsLastMonth}%
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

export default ConsumptionReport;
