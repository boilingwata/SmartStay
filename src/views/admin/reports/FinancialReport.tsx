import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Wallet,
  Clock,
  Download,
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
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

const FinancialReport: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: ReportFilter = useMemo(() => {
    const from = searchParams.get('from') || format(subMonths(new Date(), 12), 'yyyy-MM-dd');
    const to = searchParams.get('to') || format(new Date(), 'yyyy-MM-dd');
    const period = (searchParams.get('period') as ReportFilter['period']) || 'month';
    const buildingIds = searchParams.get('buildingId') ? [Number(searchParams.get('buildingId'))] : undefined;

    return { buildingIds, from, to, period };
  }, [searchParams]);

  // Queries
  const { data: kpi, isLoading: isLoadingKPI, isError: isErrorKPI, refetch: refetchKPI } = useQuery({
    queryKey: ['financialKPI', filters],
    queryFn: () => reportService.getFinancialKPI(filters),
    retry: 1,
  });

  const { data: chartData, isLoading: isLoadingChart, isError: isErrorChart, refetch: refetchChart } = useQuery({
    queryKey: ['financialChart', filters],
    queryFn: () => reportService.getFinancialChart(filters),
    retry: 1,
  });

  const { data: breakdown, isLoading: isLoadingBreakdown, isError: isErrorBreakdown, refetch: refetchBreakdown } = useQuery({
    queryKey: ['revenueBreakdown', filters],
    queryFn: () => reportService.getRevenueBreakdown(filters),
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

  const handleRefetch = () => {
    refetchKPI();
    refetchChart();
    refetchBreakdown();
  };

  if (isErrorKPI || isErrorChart || isErrorBreakdown) {
    return <div className="p-8"><ErrorBanner message="Lỗi tải báo cáo tài chính" onRetry={handleRefetch} /></div>;
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Báo cáo Tài chính</h1>
          <p className="text-slate-500 text-sm italic">Quản lý dòng tiền, doanh thu và tình trạng công nợ.</p>
        </div>
        <button
          onClick={() => reportService.exportReport('financial', filters)}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard 
          title="Tổng doanh thu" 
          value={kpi?.totalRevenue || 0} 
          icon={DollarSign} 
          delta={kpi?.totalRevenueDelta} 
          isCurrency 
          color="primary"
          loading={isLoadingKPI}
        />
        <KPICard 
          title="Doanh thu thuần" 
          value={kpi?.netRevenue || 0} 
          icon={Wallet} 
          isCurrency 
          color="success"
          loading={isLoadingKPI}
        />
        <KPICard 
          title="Tổng công nợ" 
          value={kpi?.totalDebt || 0} 
          icon={AlertCircle} 
          delta={kpi?.totalDebtDelta} 
          isCurrency 
          color="danger"
          loading={isLoadingKPI}
          reverseDeltaColor={true}
        />
        <KPICard 
          title="Đã thu" 
          value={kpi?.collected || 0} 
          icon={TrendingUp} 
          isCurrency 
          color="accent"
          loading={isLoadingKPI}
        />
        <KPICard 
          title="Tỷ lệ thu nợ" 
          value={`${kpi?.collectionRate || 0}%`} 
          icon={Clock} 
          color={Number(kpi?.collectionRate) >= 80 ? 'success' : 'warning'}
          loading={isLoadingKPI}
        />
        <KPICard 
          title="Số HĐ hết hạn" 
          value={kpi?.expiringContracts || 0} 
          icon={Clock} 
          color="warning"
          loading={isLoadingKPI}
        />
      </div>

      <div className="p-6 bg-white border rounded-2xl shadow-sm">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
           <TrendingUp className="text-blue-600" size={20} />
           Biến động Doanh thu vs Công nợ
        </h3>
        <div className="h-[300px]">
          {isLoadingChart ? (
            <div className="w-full h-full bg-slate-50 animate-pulse rounded-lg" />
          ) : !chartData?.length ? (
            <EmptyState title="Không có dữ liệu biểu đồ" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart 
                data={chartData}
                onClick={(data) => {
                  if (data?.activeLabel) {
                    // Navigate to a more detailed view or filter
                    // For now, syncing with the search params
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => formatVND(v).replace('₫', '')} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => formatVND(v).replace('₫', '')} />
                <Tooltip 
                  content={({ active, label, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl text-[10px] space-y-1">
                          <p className="font-black uppercase tracking-widest border-b border-white/10 pb-1 mb-1">Tháng {label}</p>
                          <p>Phát sinh: <span className="font-black">{formatVND(data.revenue)}</span></p>
                          <p>Thu: <span className="font-black text-emerald-400">{formatVND(data.collected)}</span></p>
                          <p>Còn lại: <span className="font-black text-rose-400">{formatVND(data.revenue - data.collected)}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Phát sinh" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar yAxisId="left" dataKey="collected" name="Đã thu" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Line yAxisId="right" type="monotone" dataKey="debt" name="Cách biệt" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444' }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="p-6 bg-white border rounded-2xl shadow-sm overflow-hidden">
        <h3 className="text-lg font-semibold mb-6">Chi tiết nguồn thu</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-slate-500 uppercase text-[10px] font-bold tracking-wider bg-slate-50">
                <th className="text-left py-3 px-4">Nguồn thu</th>
                {breakdown?.[0]?.months.map((_, i) => (
                  <th key={i} className="text-right py-3 px-4">Tháng {i + 1}</th>
                ))}
                <th className="text-right py-3 px-4 font-bold text-slate-900 bg-slate-100">Tổng quý</th>
                <th className="text-right py-3 px-4">% Tổng</th>
                <th className="text-right py-3 px-4">YoY %</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoadingBreakdown ? (
                [1, 2, 3, 4].map(i => <tr key={i} className="h-12 bg-slate-50/20 animate-pulse" />)
              ) : breakdown?.map((row, i) => (
                <tr key={i} className={cn("hover:bg-slate-50 transition-colors", row.source === 'TỔNG' && "bg-slate-50/50 font-bold")}>
                  <td className="py-4 px-4 font-medium">{row.source}</td>
                  {row.months.map((m, idx) => (
                    <td key={idx} className="text-right py-4 px-4">{formatVND(m)}</td>
                  ))}
                  <td className="text-right py-4 px-4 font-bold bg-slate-100/30">{formatVND(row.quarterTotal)}</td>
                  <td className="text-right py-4 px-4 text-slate-500 font-mono">{row.percentage}%</td>
                  <td className={cn(
                    "text-right py-4 px-4 font-bold",
                    row.yoyPct > 0 ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {row.yoyPct > 0 ? '+' : ''}{row.yoyPct}%
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

export default FinancialReport;
