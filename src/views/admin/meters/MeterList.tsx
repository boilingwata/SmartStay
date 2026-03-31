import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Zap, Droplets, AlertCircle, 
  Activity, Download, 
  History, TrendingUp, ChevronRight, Inbox, ChevronLeft
} from 'lucide-react';
import { cn } from '@/utils';
import { Skeleton } from '@/components/ui/Feedback';
import { useQuery } from '@tanstack/react-query';
import { meterService } from '@/services/meterService';
import { buildingService } from '@/services/buildingService';
import { roomService } from '@/services/roomService';
import { Meter } from '@/models/Meter';
import { MeterReadingModal } from '@/components/forms/MeterReadingModal';
import useUIStore from '@/stores/uiStore';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { MeterFilterBar } from '@/components/meters/MeterFilterBar';
import { MeterAdvancedFilter } from '@/components/meters/MeterAdvancedFilter';
import { format, parseISO } from 'date-fns';

const MeterList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const activeBuildingId = useUIStore((s) => s.activeBuildingId);
  
  const [filters, setFilters] = useState({
    buildingId: activeBuildingId ? String(activeBuildingId) : '',
    roomId: '',
    meterType: '' as 'Electricity' | 'Water' | '',
    meterStatus: 'Active',
    search: '',
    missingOnly: false,
    monthYear: '', // YYYY-MM
  });

  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);

  useEffect(() => {
    setFilters(f => ({ ...f, buildingId: activeBuildingId ? String(activeBuildingId) : '' }));
  }, [activeBuildingId]);

  const { data: meters, isLoading, refetch } = useQuery({
    queryKey: ['meters', filters, page],
    queryFn: () => meterService.getMeters({ 
      buildingId: filters.buildingId || undefined, 
      roomId: filters.roomId || undefined, 
      type: filters.meterType || undefined,
      status: filters.meterStatus,
      search: filters.search || undefined,
      missingOnly: filters.missingOnly,
      page,
      limit: PAGE_SIZE,
    })
  });

  const { data: stats } = useQuery({
    queryKey: ['meter-stats', filters.buildingId],
    queryFn: () => meterService.getMeterStatistics({ buildingId: filters.buildingId })
  });

  const totalPages = Math.max(1, Math.ceil((meters?.total ?? 0) / PAGE_SIZE));

  const handleDownloadCSV = () => {
    const data = meters?.data ?? [];
    if (data.length === 0) {
      toast.warning('Không có dữ liệu để xuất.');
      return;
    }
    const headers = ['Mã đồng hồ', 'Phòng', 'Loại', 'Chỉ số cũ', 'Chỉ số mới', 'Tiêu thụ', 'Tháng', 'Ngày ghi'];
    const rows = data.map(m => [
      m.meterCode,
      m.roomCode,
      m.meterType === 'Electricity' ? 'Điện' : 'Nước',
      m.previousReadingIndex ?? '',
      m.latestReadingIndex ?? '',
      m.usage ?? '',
      m.latestMonthYear ?? '',
      m.readingDate ? format(parseISO(m.readingDate), 'dd/MM/yyyy HH:mm') : '',
    ]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meters_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Đã xuất ${data.length} đồng hồ ra file CSV!`);
  };

  const handleOpenReadingModal = (meter: Meter) => {
    setSelectedMeter(meter);
    setIsModalOpen(true);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.buildingId && filters.buildingId !== String(activeBuildingId)) count++;
    if (filters.roomId) count++;
    if (filters.meterStatus && filters.meterStatus !== 'Active') count++;
    if (filters.monthYear) count++;
    return count;
  }, [filters, activeBuildingId]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20">
      {/* Header & Interactive Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight">
             Thống kê <span className="text-primary italic">Đồng hồ</span>
           </h1>
           <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Hệ thống đo lường thông minh</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           {/* Interactive Stats Panel */}
           <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-slate-200/60 shadow-sm transition-all hover:shadow-md">
              <button 
                onClick={() => setFilters({ ...filters, meterType: '', missingOnly: false })}
                className="flex items-center gap-2 pr-4 border-r border-slate-100 hover:opacity-70 transition-opacity"
              >
                 <Activity size={14} className="text-primary" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng:</span>
                 <span className="text-sm font-black text-slate-800">{stats?.total || 0}</span>
              </button>
              <button 
                onClick={() => setFilters({ ...filters, meterType: 'Electricity', missingOnly: false })}
                className="flex items-center gap-2 pr-4 border-r border-slate-100 hover:opacity-70 transition-opacity"
              >
                 <Zap size={14} className="text-amber-500" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Điện:</span>
                 <span className="text-sm font-black text-slate-800">{stats?.electricity || 0}</span>
              </button>
              <button 
                onClick={() => setFilters({ ...filters, meterType: 'Water', missingOnly: false })}
                className="flex items-center gap-2 pr-4 border-r border-slate-100 hover:opacity-70 transition-opacity"
              >
                 <Droplets size={14} className="text-blue-500" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nước:</span>
                 <span className="text-sm font-black text-slate-800">{stats?.water || 0}</span>
              </button>
              <button 
                onClick={() => setFilters({ ...filters, meterType: '', missingOnly: true })}
                className="flex items-center gap-2 hover:opacity-70 transition-opacity"
              >
                 <AlertCircle size={14} className="text-red-500 animate-pulse" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chưa nhập:</span>
                 <span className="text-sm font-black text-red-600">{stats?.missing || 0}</span>
              </button>
           </div>

           <div className="h-10 w-px bg-slate-200 mx-2 hidden xl:block" />

           <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/admin/meters/bulk')}
                className="h-12 px-6 flex items-center gap-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all active:scale-95"
              >
                 <History size={18} />
                 <span>Chốt hàng loạt</span>
              </button>
              <button 
                onClick={handleDownloadCSV}
                className="h-12 w-12 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-primary hover:border-primary/30 transition-all shadow-sm active:scale-95"
                title="Xuất CSV"
              >
                <Download size={20} />
              </button>
           </div>
        </div>
      </div>

      {/* Modern Filter Section */}
      <div className="space-y-4">
        <MeterFilterBar 
          filters={filters}
          setFilters={(f) => {
            setFilters(f);
            setPage(1);
          }}
          isAdvancedExpanded={isAdvancedExpanded}
          setIsAdvancedExpanded={setIsAdvancedExpanded}
          activeFilterCount={activeFilterCount}
          stats={stats}
        />

        <div className={cn(
           "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-500",
           isAdvancedExpanded ? "p-4 pt-0" : "h-0 border-none p-0 overflow-hidden"
        )}>
          <MeterAdvancedFilter 
            filters={filters}
            onChange={(f) => {
              setFilters(f);
              setPage(1);
            }}
            onReset={() => {
              setFilters({
                buildingId: activeBuildingId ? String(activeBuildingId) : '',
                roomId: '',
                meterType: '',
                meterStatus: 'Active',
                search: '',
                missingOnly: false,
                monthYear: '',
              });
              setPage(1);
            }}
            isExpanded={isAdvancedExpanded}
            onClose={() => setIsAdvancedExpanded(false)}
          />
        </div>
      </div>

      {/* DataTable */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500 mt-6">
        <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                 <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[2px]">Mã đồng hồ</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[2px]">Phòng</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[2px] text-center">Loại</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[2px] text-right">Chỉ số cũ</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[2px] text-right">Chỉ số mới</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[2px] text-right">Tiêu thụ</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[2px] text-center">Kỳ chốt</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[2px] text-right">Ngày ghi</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-[2px]">Thao tác</th>
                 </tr>
              </thead>
              <tbody>
                 {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></td>
                        <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                        <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                        <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                        <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-16 mx-auto" /></td>
                        <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-24 ml-auto" /></td>
                        <td className="px-6 py-4 text-right"><Skeleton className="h-10 w-24 ml-auto rounded-xl" /></td>
                      </tr>
                    ))
                 ) : meters?.data?.length === 0 ? (
                    <tr>
                       <td colSpan={9} className="py-24 text-center">
                          <div className="flex flex-col items-center justify-center opacity-30">
                            <Inbox size={64} className="mb-4 text-primary" strokeWidth={1} />
                            <p className="text-[14px] font-black uppercase tracking-[4px] text-slate-800">Không tìm thấy dữ liệu</p>
                            <p className="text-xs font-bold mt-2">Vui lòng điều chỉnh bộ lọc hoặc tìm kiếm khác</p>
                          </div>
                       </td>
                    </tr>
                 ) : (
                    meters?.data?.map((meter: Meter) => (
                       <tr key={meter.id} className="group border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                          <td className="px-6 py-4">
                             <Link to={`/admin/meters/${meter.id}/readings`} className="font-mono text-[13px] font-black text-slate-900 group-hover:text-primary flex items-center gap-2">
                               {meter.meterCode}
                               <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                             </Link>
                          </td>
                          <td className="px-6 py-4">
                             <Link to={`/admin/rooms/${meter.roomId}`} className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">
                                P.{meter.roomCode}
                             </Link>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex justify-center">
                               <div className={cn(
                                 "flex items-center gap-1.5 px-3 py-1 rounded-full w-fit",
                                 meter.meterType === 'Electricity' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                               )}>
                                  {meter.meterType === 'Electricity' ? <Zap size={10} fill="currentColor" /> : <Droplets size={10} fill="currentColor" />}
                                  <span className="text-[9px] font-black uppercase tracking-tighter">
                                     {meter.meterType === 'Electricity' ? 'Điện' : 'Nước'}
                                  </span>
                               </div>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-sm font-bold text-slate-400">
                             {meter.previousReadingIndex?.toLocaleString() ?? '--'}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-[15px] font-black text-slate-900">
                             {meter.latestReadingIndex?.toLocaleString() ?? '--'}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className={cn(
                               "px-2 py-1 rounded-lg font-mono text-sm font-black",
                               (meter.usage ?? 0) > 0 ? "bg-primary/5 text-primary" : "text-slate-300"
                             )}>
                               {(meter.usage ?? 0).toLocaleString()}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-center font-mono font-bold text-slate-600 text-[13px]">
                             {meter.latestMonthYear || '--'}
                          </td>
                          <td className="px-6 py-4 text-right text-[12px] font-bold text-slate-500 italic">
                             {meter.readingDate ? format(parseISO(meter.readingDate), 'dd/MM/yy HH:mm') : '--'}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleOpenReadingModal(meter)}
                                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all active:scale-90"
                                  title="Nhập chỉ số"
                                >
                                   <History size={18} />
                                </button>
                                <button 
                                  onClick={() => navigate(`/admin/meters/${meter.id}/readings`)}
                                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-primary transition-all active:scale-90"
                                  title="Lịch sử tiêu thụ"
                                >
                                   <TrendingUp size={18} />
                                </button>
                             </div>
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        </div>
        
        {/* Pagination */}
        <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between gap-6">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Hiển thị {meters?.data?.length || 0} trong {meters?.total || 0} đồng hồ
           </p>
           <div className="flex items-center gap-2">
              <button
                className={cn('h-10 px-4 rounded-xl border text-[11px] font-black uppercase transition-all flex items-center gap-2',
                  page <= 1 ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:border-primary hover:text-primary bg-white shadow-sm'
                )}
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
                Trước
              </button>
              
              <div className="flex items-center px-4 font-mono text-sm font-bold text-slate-400">
                Trang {page} / {totalPages}
              </div>

              <button
                className={cn('h-10 px-4 rounded-xl border text-[11px] font-black uppercase transition-all flex items-center gap-2',
                  page >= totalPages ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:border-primary hover:text-primary bg-white shadow-sm'
                )}
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Sau
                <ChevronRight size={16} />
              </button>
           </div>
        </div>
      </div>
      
      {/* Meter Reading Modal */}
      <MeterReadingModal 
        isOpen={isModalOpen}
        meter={selectedMeter}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

export default MeterList;
