import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building, Home, Zap, Droplets, AlertCircle, 
  Activity, Search, Download, 
  History, TrendingUp, ChevronRight, Inbox
} from 'lucide-react';
import { cn } from '@/utils';
import { Select } from '@/components/ui/Select';
import { SelectAsync } from '@/components/ui/SelectAsync';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spinner, Skeleton } from '@/components/ui/Feedback';
import { useQuery } from '@tanstack/react-query';
import { meterService } from '@/services/meterService';
import { buildingService } from '@/services/buildingService';
import { roomService } from '@/services/roomService';
import { Meter } from '@/models/Meter';
import { MeterReadingModal } from '@/components/forms/MeterReadingModal';
import useUIStore from '@/stores/uiStore';
import { toast } from 'sonner';

const MeterList = () => {
  const navigate = useNavigate();
  const activeBuildingId = useUIStore((s) => s.activeBuildingId);
  const setBuilding = useUIStore((s) => s.setBuilding);
  const [roomId, setRoomId] = useState('');
  const [meterType, setMeterType] = useState<'Electricity' | 'Water' | ''>('');
  const [meterStatus, setMeterStatus] = useState<'Active' | 'Inactive' | 'Replaced'>('Active');
  const [search, setSearch] = useState('');
  const [isMissingOnly, setIsMissingOnly] = useState(false);
  
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);

  const { data: meters, isLoading, refetch } = useQuery({
    queryKey: ['meters', activeBuildingId, roomId, meterType, meterStatus, search, isMissingOnly, page],
    queryFn: () => meterService.getMeters({ 
      buildingId: activeBuildingId ? String(activeBuildingId) : undefined, 
      roomId: roomId || undefined, 
      type: meterType || undefined,
      status: meterStatus,
      search: search || undefined,
      missingOnly: isMissingOnly,
      page,
      limit: PAGE_SIZE,
    })
  });

  const totalPages = Math.max(1, Math.ceil((meters?.total ?? 0) / PAGE_SIZE));

  // B34 FIX: Generate and download CSV from current meters
  const handleDownloadCSV = () => {
    const data = meters?.data ?? [];
    if (data.length === 0) {
      toast.warning('Không có dữ liệu để xuất.');
      return;
    }
    const headers = ['Mã đồng hồ', 'Phòng', 'Loại', 'Chỉ số mới nhất', 'Tháng', 'Trạng thái'];
    const rows = data.map(m => [
      m.meterCode,
      m.roomCode,
      m.meterType === 'Electricity' ? 'Điện' : 'Nước',
      m.latestReadingIndex ?? '',
      m.latestMonthYear ?? '',
      m.meterStatus,
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
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

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {/* 5.1.1 Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-[44px] font-black leading-tight tracking-tighter text-slate-900">
            Đồng hồ <span className="text-primary italic">& Chỉ số</span>
          </h1>
          <p className="text-small text-muted font-bold uppercase tracking-[2px] mt-2">
            Quản lý chỉ số điện nước & Lịch sử ghi nhận
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin/meters/bulk')}
            className="btn-primary h-14"
          >
            <History size={18} />
            <span>Ghi hàng loạt</span>
          </button>
          <button 
            onClick={handleDownloadCSV}
            className="h-14 w-14 flex items-center justify-center rounded-[20px] bg-white text-muted hover:text-primary transition-all shadow-xl shadow-slate-200/50 active:scale-95 border border-white"
            title="Xuất CSV"
          >
            <Download size={22} />
          </button>
        </div>
      </div>

      {/* 5.1.1 Filter Panel */}
      <div className="card-container p-8 animate-in slide-in-from-top-4 duration-500 relative z-20 overflow-visible border-none bg-white/60 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 items-start">
          <div>
            <SelectAsync 
              label="Tòa nhà"
              placeholder="Tất cả tòa nhà"
              icon={Building}
              value={activeBuildingId ? String(activeBuildingId) : ''}
              loadOptions={async (search) => {
                const buildings = await buildingService.getBuildings({ search });
                return buildings.map(b => ({ label: b.buildingName, value: String(b.id) }));
              }}
              onChange={(val) => setBuilding(val)} 
            />
          </div>

          <div>
            <SelectAsync 
              label="Phòng"
              placeholder="Tất cả phòng"
              icon={Home}
              value={roomId}
              loadOptions={async (search) => {
                 const rooms = await roomService.getRooms({
                   buildingId: activeBuildingId ? String(activeBuildingId) : undefined,
                   search: search || undefined,
                 });
                 return rooms.map(r => ({ label: `Phòng ${r.roomCode}`, value: String(r.id) }));
              }}
              onChange={(val) => setRoomId(val)} 
            />
          </div>

          <div>
            <Select 
              label="Loại đồng hồ"
              placeholder="Tất cả"
              icon={Zap}
              options={[
                { label: 'Tất cả loại', value: '' },
                { label: 'Điện (Electricity)', value: 'Electricity' },
                { label: 'Nước (Water)', value: 'Water' }
              ]}
              value={meterType}
              onChange={(val) => setMeterType(val as any)}
            />
          </div>

          <div>
            <Select 
              label="Trạng thái"
              placeholder="Đang hoạt động"
              icon={Activity}
              options={[
                { label: 'Đang hoạt động', value: 'Active' },
                { label: 'Tạm dừng', value: 'Inactive' },
                { label: 'Đã thay mới', value: 'Replaced' }
              ]}
              value={meterStatus}
              onChange={(val) => setMeterStatus(val as any)}
            />
          </div>

          <div>
            <div className="space-y-2">
               <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Tìm kiếm</label>
               <div className="relative group">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Mã/Số phòng..."
                    className="input-base pl-12 h-14 w-full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
               </div>
            </div>
          </div>

          <div>
            <div className="space-y-2">
               <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Bộ lọc nhanh</label>
               <button 
                 onClick={() => setIsMissingOnly(!isMissingOnly)}
                 className={cn(
                   "flex h-14 w-full items-center justify-center gap-3 rounded-[20px] cursor-pointer transition-all border-2 font-black uppercase tracking-widest text-[11px]",
                   isMissingOnly ? "bg-danger text-white border-danger shadow-lg shadow-danger/20" : "bg-bg border-transparent text-muted hover:bg-slate-100"
                 )}
               >
                  <AlertCircle size={18} className={isMissingOnly ? "animate-pulse" : ""} />
                  Chưa nhập
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5.1.2 DataTable */}
      <div className="card-container overflow-hidden bg-white/40 border-border/5">
        <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900/5 backdrop-blur-sm border-b border-border/5">
                 <tr>
                    <th className="px-8 py-6 text-[10px] font-black text-muted uppercase tracking-[3px]">Mã đồng hồ</th>
                    <th className="px-6 py-6 text-[10px] font-black text-muted uppercase tracking-[3px]">Phòng</th>
                    <th className="px-6 py-6 text-[10px] font-black text-muted uppercase tracking-[3px]">Loại thiết bị</th>
                    <th className="px-6 py-6 text-[10px] font-black text-muted uppercase tracking-[3px]">Chỉ số mới nhất</th>
                    <th className="px-6 py-6 text-[10px] font-black text-muted uppercase tracking-[3px]">Kỳ chốt</th>
                    <th className="px-6 py-6 text-[10px] font-black text-muted uppercase tracking-[3px]">Trạng thái</th>
                    <th className="px-8 py-6 text-right text-[10px] font-black text-muted uppercase tracking-[3px]">Thao tác</th>
                 </tr>
              </thead>
              <tbody>
                 {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/5">
                        <td className="px-8 py-6"><Skeleton className="h-6 w-32" /></td>
                        <td className="px-6 py-6"><Skeleton className="h-6 w-24" /></td>
                        <td className="px-6 py-6"><Skeleton className="h-8 w-20 rounded-full" /></td>
                        <td className="px-6 py-6"><Skeleton className="h-8 w-24" /></td>
                        <td className="px-6 py-6"><Skeleton className="h-6 w-16" /></td>
                        <td className="px-6 py-6"><Skeleton className="h-8 w-24 rounded-full" /></td>
                        <td className="px-8 py-6 text-right"><Skeleton className="h-10 w-24 ml-auto rounded-xl" /></td>
                      </tr>
                    ))
                 ) : meters?.data?.length === 0 ? (
                    <tr>
                       <td colSpan={7} className="py-24 text-center">
                          <div className="flex flex-col items-center justify-center opacity-30">
                            <Inbox size={64} className="mb-4 text-primary" strokeWidth={1} />
                            <p className="text-[14px] font-black uppercase tracking-[4px] text-slate-800">Không tìm thấy dữ liệu</p>
                            <p className="text-small font-bold mt-2">Vui lòng điều chỉnh bộ lọc hoặc tìm kiếm khác</p>
                          </div>
                       </td>
                    </tr>
                 ) : (
                    meters?.data?.map((meter: Meter) => (
                       <tr key={meter.id} className="group border-b border-border/5 hover:bg-white/50 transition-all">
                          <td className="px-8 py-6">
                             <Link to={`/admin/meters/${meter.id}/readings`} className="font-mono text-[13px] font-black text-primary hover:underline flex items-center gap-2">
                               {meter.meterCode}
                               <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                             </Link>
                          </td>
                          <td className="px-6 py-6">
                             <Link to={`/admin/rooms/${meter.roomId}`} className="text-small font-black text-slate-700 hover:text-primary transition-colors">
                                Phòng {meter.roomCode}
                             </Link>
                          </td>
                          <td className="px-6 py-6">
                             <div className={cn(
                               "flex items-center gap-2 px-3 py-1 rounded-full w-fit",
                               meter.meterType === 'Electricity' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                             )}>
                                {meter.meterType === 'Electricity' ? <Zap size={12} fill="currentColor" /> : <Droplets size={12} fill="currentColor" />}
                                <span className="text-[10px] font-black uppercase tracking-tighter">
                                   {meter.meterType === 'Electricity' ? 'Điện' : 'Nước'}
                                </span>
                             </div>
                          </td>
                          <td className="px-6 py-6 font-mono">
                             <span className="text-[16px] font-black text-slate-800">
                                {Number(meter.latestReadingIndex || 0).toLocaleString()}
                             </span>
                             <p className="text-[9px] text-muted font-bold uppercase tracking-tighter mt-1 italic opacity-60">RULE-01 Source</p>
                          </td>
                          <td className="px-6 py-6 font-mono font-bold text-slate-600">
                             {meter.latestMonthYear || '--'}
                          </td>
                          <td className="px-6 py-6">
                             <StatusBadge status={meter.meterStatus} />
                          </td>
                          <td className="px-8 py-6 text-right">
                             <div className="flex justify-end gap-3">
                                <button 
                                  onClick={() => handleOpenReadingModal(meter)}
                                  className="h-11 w-11 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5 active:scale-90"
                                  title="Nhập chỉ số"
                                >
                                   <History size={18} />
                                </button>
                                <button 
                                  onClick={() => navigate(`/admin/meters/${meter.id}/readings`)}
                                  className="h-11 w-11 flex items-center justify-center rounded-xl bg-bg border border-border/50 text-muted hover:text-primary transition-all active:scale-90"
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
        <div className="p-8 border-t border-border/5 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-6">
           <p className="text-small text-muted font-bold uppercase tracking-wider">
              Hiển thị {meters?.data?.length || 0} trong {meters?.total || 0} đồng hồ
           </p>
           <div className="flex items-center gap-2">
              <button
                className={cn('h-11 px-6 rounded-xl border text-[11px] font-black uppercase transition-all',
                  page <= 1 ? 'border-border text-muted opacity-50 cursor-not-allowed' : 'border-primary/30 text-primary hover:bg-primary/5 cursor-pointer'
                )}
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >Trước</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                Math.max(0, page - 3), Math.min(totalPages, page + 2)
              ).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn('h-11 w-11 rounded-xl text-[11px] font-black uppercase transition-all',
                    p === page
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-white border border-border text-muted hover:border-primary/30 hover:text-primary'
                  )}
                >{p}</button>
              ))}
              <button
                className={cn('h-11 px-6 rounded-xl border text-[11px] font-black uppercase transition-all',
                  page >= totalPages ? 'border-border text-muted opacity-50 cursor-not-allowed' : 'border-primary/30 text-primary hover:bg-primary/5 cursor-pointer'
                )}
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >Sau</button>
           </div>
        </div>
      </div>
      
      {/* 5.2 Meter Reading Modal */}
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
