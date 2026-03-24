import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Bell,
  Mail,
  Download,
  Filter,
  Users,
  Building2,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { toast } from 'sonner';

import reportService from '@/services/reportService';
import { buildingService } from '@/services/buildingService';
import { FilterPanel, FilterConfig } from '@/components/shared/FilterPanel';
import { DebtAgingRow, DebtAgeGroup, ReportFilter } from '@/types/reports';
import { formatVND, cn } from '@/utils';
import { EmptyState, ErrorBanner } from '@/components/ui/StatusStates';

type AgeGroupType = DebtAgeGroup | null;

const DebtReport: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroupType>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  // Filters from URL
  const buildingId = searchParams.get('buildingId') ? Number(searchParams.get('buildingId')) : undefined;
  const asOf = searchParams.get('asOf') || format(new Date(), 'yyyy-MM-dd');

  const filters: ReportFilter = useMemo(() => ({
    buildingIds: buildingId ? [buildingId] : undefined,
    from: asOf,
    to: asOf,
    period: 'custom'
  }), [buildingId, asOf]);

  // Queries
  const { data: agingData, isLoading: isLoadingAging, isError: isErrorAging, refetch: refetchAging } = useQuery({
    queryKey: ['debtAging', filters],
    queryFn: () => reportService.getDebtAging(filters),
    retry: 1,
  });

  const detailFilter = useMemo(() => {
    let minDays: number | undefined;
    let maxDays: number | undefined;

    switch (selectedAgeGroup) {
      case 'current': minDays = 0; maxDays = 0; break;
      case '1-30': minDays = 1; maxDays = 30; break;
      case '31-60': minDays = 31; maxDays = 60; break;
      case '61-90': minDays = 61; maxDays = 90; break;
      case '90+': minDays = 91; maxDays = 9999; break;
    }

    return {
      ...filters,
      minDays,
      maxDays,
    };
  }, [filters, selectedAgeGroup]);

  const { data: detailData, isLoading: isLoadingDetail, isError: isErrorDetail, refetch: refetchDetail } = useQuery({
    queryKey: ['debtDetail', detailFilter],
    queryFn: () => reportService.getDebtDetail(detailFilter),
    enabled: !!asOf,
    retry: 1,
  });

  // Multi-Remind Mutation
  const sendReminders = useMutation({
    mutationFn: (ids: number[]) => reportService.sendDebtReminder(ids),
    onSuccess: () => {
      toast.success('Đã gửi thông báo nhắc nợ thành công');
      setSelectedRows([]);
    },
    onError: () => {
      toast.error('Gửi thông báo thất bại. Vui lòng thử lại.');
    }
  });

  const handleFilterChange = (newValues: any) => {
    const params = new URLSearchParams(searchParams);
    if (newValues.buildingId) params.set('buildingId', String(newValues.buildingId));
    else params.delete('buildingId');
    
    if (newValues.asOf) params.set('asOf', newValues.asOf);
    setSearchParams(params);
  };

  const agingConfigs: FilterConfig[] = [
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
      key: 'asOf',
      label: 'Tính đến ngày',
      type: 'text', // Placeholder for a simple date input if DatePicker isn't in FilterPanel text mode
      placeholder: 'YYYY-MM-DD'
    }
  ];

  const getAgingColor = (group: string, type: 'bg' | 'text' | 'chart' = 'bg') => {
    switch (group) {
      case 'current': return type === 'chart' ? '#10b981' : type === 'bg' ? 'bg-emerald-50' : 'text-emerald-700';
      case '1-30': return type === 'chart' ? '#f59e0b' : type === 'bg' ? 'bg-amber-50' : 'text-amber-700';
      case '31-60': return type === 'chart' ? '#f97316' : type === 'bg' ? 'bg-orange-50' : 'text-orange-700';
      case '61-90': return type === 'chart' ? '#ef4444' : type === 'bg' ? 'bg-red-50' : 'text-red-700';
      case '90+': return type === 'chart' ? '#b91c1c' : type === 'bg' ? 'bg-rose-100' : 'text-rose-900';
      default: return '';
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && detailData) {
      setSelectedRows(detailData.map((r: any) => r.invoiceId));
    } else {
      setSelectedRows([]);
    }
  };

  if (isErrorAging || isErrorDetail) return <div className="p-8"><ErrorBanner message="Lỗi tải báo cáo công nợ" onRetry={() => { refetchAging(); refetchDetail(); }} /></div>;

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <AlertCircle className="text-rose-600" /> Phân tích Công nợ & Tuổi nợ
          </h1>
          <p className="text-slate-500 text-sm italic">Quản lý rủi ro tín dụng và hiệu quả thu hồi nợ.</p>
        </div>
        <button
          onClick={() => reportService.exportReport('debt', { buildingId: String(buildingId || ''), asOf })}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-sm text-sm font-medium"
        >
          <Download size={18} /> Xuất Excel
        </button>
      </div>

      <FilterPanel 
        filters={agingConfigs} 
        values={{ buildingId, asOf }} 
        onChange={handleFilterChange}
        activeCount={buildingId || asOf !== format(new Date(), 'yyyy-MM-dd') ? 1 : 0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aging Table */}
        <div className="lg:col-span-2 card-container p-0 overflow-hidden bg-white border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <th className="text-left py-4 px-6">Nhóm tuổi nợ</th>
                <th className="text-right py-4 px-4">Số HĐ</th>
                <th className="text-right py-4 px-4">Số HĐơn</th>
                <th className="text-right py-4 px-4">Tổng nợ</th>
                <th className="text-right py-4 px-6">% Tổng</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoadingAging ? (
                [1, 2, 3, 4, 5].map(i => <tr key={i} className="h-14 animate-pulse bg-slate-50/50" />)
              ) : agingData?.map((row: any) => (
                <tr 
                  key={row.ageGroup} 
                  onClick={() => setSelectedAgeGroup(row.ageGroup === selectedAgeGroup ? null : row.ageGroup)}
                  className={cn(
                    "cursor-pointer transition-all hover:brightness-95",
                    getAgingColor(row.ageGroup, 'bg'),
                    selectedAgeGroup === row.ageGroup && "ring-2 ring-primary ring-inset z-10"
                  )}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-3 h-3 rounded-full", getAgingColor(row.ageGroup, 'chart').replace('#', 'bg-[#') + ']')}></div>
                      <span className={cn("font-bold", getAgingColor(row.ageGroup, 'text'))}>{row.label}</span>
                    </div>
                  </td>
                  <td className="text-right py-4 px-4 font-medium">{row.contractCount}</td>
                  <td className="text-right py-4 px-4 font-medium">{row.invoiceCount}</td>
                  <td className="text-right py-4 px-4 font-black">{formatVND(row.totalDebt)}</td>
                  <td className="text-right py-4 px-6">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-slate-400">{row.percentage}%</span>
                      <div className="w-20 h-1 rounded-full bg-slate-200 mt-1">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${row.percentage}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Visual Chart */}
        <div className="card-container p-6 bg-white border flex flex-col items-center justify-center">
          <h3 className="text-h3 font-black text-primary uppercase tracking-[2px] mb-6">Phân bổ tuổi nợ</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agingData || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" hide />
                <YAxis hide />
                <Tooltip 
                  formatter={(v: any) => formatVND(v)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="totalDebt" radius={[8, 8, 8, 8]}>
                  {agingData?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={getAgingColor(entry.ageGroup, 'chart')} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 w-full">
             {agingData?.map((row: any) => (
               <div key={row.ageGroup} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 truncate">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getAgingColor(row.ageGroup, 'chart') }}></div>
                  {row.label}
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Debt Detail Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter">
              Chi tiết công nợ {selectedAgeGroup ? `Nhóm ${selectedAgeGroup}` : 'Tất cả'}
            </h2>
            {selectedRows.length > 0 && (
              <button
                onClick={() => sendReminders.mutate(selectedRows)}
                disabled={sendReminders.isPending}
                className="btn-primary py-1.5 px-4 text-xs flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 animate-in slide-in-from-left-2"
              >
                <Mail size={14} /> Gửi nhắc nợ hàng loạt ({selectedRows.length})
              </button>
            )}
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
            Hiển thị {detailData?.length || 0} bản ghi
          </div>
        </div>

        <div className="card-container p-0 bg-white border overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-20 bg-slate-50 border-b">
                <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <th className="py-4 px-6 text-left w-10">
                    <input type="checkbox" onChange={handleSelectAll} className="rounded border-slate-300 text-primary focus:ring-primary" />
                  </th>
                  <th className="text-left py-4 px-4">Cư dân</th>
                  <th className="text-left py-4 px-4">Phòng</th>
                  <th className="text-left py-4 px-4">Hợp đồng</th>
                  <th className="text-left py-4 px-4">Hóa đơn</th>
                  <th className="text-right py-4 px-4">Quá hạn</th>
                  <th className="text-right py-4 px-4">Số tiền</th>
                  <th className="text-center py-4 px-6">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoadingDetail ? (
                  [1, 2, 3, 4, 5].map(i => <tr key={i} className="h-16 animate-pulse bg-slate-50/20" />)
                ) : !detailData?.length ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <EmptyState title="Không có dữ liệu công nợ" message="Chúc mừng! Hiện tại không có công nợ nào trong nhóm này." />
                    </td>
                  </tr>
                ) : detailData?.map((row: any) => (
                  <tr 
                    key={row.invoiceId} 
                    className={cn(
                      "hover:bg-slate-50 transition-colors group",
                      row.daysOverdue > 60 && "bg-rose-50/30",
                      selectedRows.includes(row.invoiceId) && "bg-primary/5"
                    )}
                  >
                    <td className="py-4 px-6">
                      <input 
                        type="checkbox" 
                        checked={selectedRows.includes(row.invoiceId)}
                        onChange={() => handleToggleSelect(row.invoiceId)}
                        className="rounded border-slate-300 text-primary focus:ring-primary" 
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-primary">{row.tenantName}</div>
                      <div className="text-[10px] text-muted font-mono">{row.lastPaymentDate ? `Trả lần cuối: ${row.lastPaymentDate}` : 'Chưa từng nộp tiền'}</div>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-slate-600">{row.roomCode}</td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-500">{row.contractCode}</td>
                    <td className="py-4 px-4 text-xs font-bold text-slate-900">{row.invoiceCode}</td>
                    <td className="text-right py-4 px-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                        row.daysOverdue > 90 ? "bg-rose-600 text-white" :
                        row.daysOverdue > 30 ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-600"
                      )}>
                        {row.daysOverdue} ngày
                      </span>
                    </td>
                    <td className="text-right py-4 px-4 font-black text-rose-600">{formatVND(row.amountDue)}</td>
                    <td className="text-center py-4 px-6">
                      <button 
                        onClick={() => sendReminders.mutate([row.invoiceId])}
                        disabled={sendReminders.isPending}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Nhắc nợ"
                      >
                        <Bell size={18} />
                      </button>
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

export default DebtReport;
