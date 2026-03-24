import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  Download,
  CheckCircle2,
  Info,
  DollarSign,
  Wrench,
  ChevronRight,
  Zap,
  Droplets,
  Wifi,
  Shield,
  FilePlus,
  AlertCircle
} from 'lucide-react';
import PortalLayout from '@/components/layout/PortalLayout';
import { cn, formatVND, formatDate } from '@/utils';
import { getNormalizedHttpUrl } from '@/utils/security';
import { Spinner } from '@/components/ui/Feedback';
import { toast } from 'sonner';
import { ContractDetail, ContractService } from '@/models/Contract';
import portalService from '@/services/portalService';

const getServiceIcon = (name: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('điện')) return Zap;
  if (n.includes('nước')) return Droplets;
  if (n.includes('internet') || n.includes('wifi')) return Wifi;
  if (n.includes('an ninh') || n.includes('bảo vệ')) return Shield;
  return Wrench;
};

const ContractView = () => {
  const { data: contract, isLoading, isError, refetch } = useQuery<ContractDetail | null>({
    queryKey: ['portal-active-contract'],
    queryFn: () => portalService.getActiveContract()
  });

  return (
    <PortalLayout 
      title="Hợp đồng điện tử" 
      showBack={true}
      rightAction={
        <button onClick={() => toast.info('Chức năng đang phát triển để kết nối Backend')} className="p-2.5 bg-white/10 rounded-2xl text-white active:scale-90 transition-all backdrop-blur-md border border-white/10">
          <Download size={20} />
        </button>
      }
    >
      <div className="space-y-8 pb-32 animate-in fade-in duration-700">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
             <Spinner />
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Đang tải dữ liệu pháp lý...</p>
          </div>
        ) : isError || !contract ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-center px-6">
             <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2 shadow-inner border border-red-100">
               <AlertCircle size={32} />
             </div>
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Không thể tải hợp đồng</h3>
             <p className="text-[12px] text-slate-500 max-w-[250px] leading-relaxed">Đã xảy ra lỗi khi kết nối với máy chủ hoặc dữ liệu hợp đồng không hợp pháp.</p>
             <button onClick={() => refetch()} className="mt-4 px-6 py-2 bg-slate-900 text-white hover:bg-slate-800 transition-colors text-[11px] font-bold uppercase tracking-widest rounded-xl">Thử lại</button>
          </div>
        ) : (
          <>
            {/* 1. Header Card - Extreme Premium */}
            <div className="px-6 pt-4">
              <div className="bg-white p-8 rounded-[48px] shadow-2xl shadow-slate-200/40 border border-slate-50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                   <FileText size={180} />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] font-mono">CODE: {contract?.contractCode || 'CON-100293'}</span>
                    <div className={cn(
                       "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border backdrop-blur-sm shadow-sm",
                       contract?.status === 'Active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                    )}>
                      <ShieldCheck size={12} className="animate-pulse" /> {contract?.status || 'Đang hiệu lực'}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-[28px] font-black text-slate-900 tracking-tight leading-none uppercase mb-2">Hợp đồng thuê phòng {contract?.roomCode || '202'}</h2>
                    <p className="text-[11px] font-bold text-slate-400 italic flex items-center gap-2">
                       <CheckCircle2 size={12} className="text-secondary" /> Ký kết trang trọng ngày: {formatDate(contract?.startDate || new Date())}
                    </p>
                  </div>
                </div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-500/5 rounded-full blur-3xl" />
              </div>
            </div>

            {/* 2. Key Details Grid */}
            <div className="px-6 grid grid-cols-2 gap-4">
              <DetailBox 
                label="Giá thuê" 
                value={formatVND(contract?.rentPriceSnapshot || 5500000)} 
                icon={DollarSign} 
                color="text-teal-600" 
                bg="bg-teal-50" 
              />
              <DetailBox 
                label="Chu kỳ thanh toán" 
                value={`${contract?.paymentCycle || 1} tháng / lần`} 
                icon={Clock} 
                color="text-orange-600" bg="bg-orange-50" 
              />
            </div>

            {/* 3. Duration Card */}
            <div className="px-6">
              <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl shadow-slate-900/40 flex items-center justify-between group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-50" />
                <div className="relative z-10 space-y-2">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Thời hạn hợp đồng (Mục 1.2)</p>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black font-mono">{formatDate(contract?.startDate || new Date())}</span>
                    <div className="w-8 h-px bg-white/20" />
                    <span className="text-xl font-black font-mono text-secondary">{formatDate(contract?.endDate || new Date())}</span>
                  </div>
                </div>
                <div className="relative z-10 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 group-hover:rotate-12 transition-transform shadow-lg shadow-black/20 backdrop-blur-md">
                  <Calendar size={28} strokeWidth={1.5} />
                </div>
              </div>
            </div>

            {/* 4. Included Services */}
            <div className="px-6 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Biểu giá dịch vụ (Snapshot)</h3>
                <span className="text-[9px] font-bold text-teal-600 italic">Cam kết không thay đổi</span>
              </div>
              <div className="space-y-4">
                {(contract?.services && contract.services.length > 0 ? contract.services : [
                   { id: 'fallback-1', serviceName: 'Điện dân dụng', unitPriceSnapshot: 3500, unit: 'kWh', quantity: 1, totalPerCycle: 3500 },
                   { id: 'fallback-2', serviceName: 'Nước sinh hoạt', unitPriceSnapshot: 25000, unit: 'm3', quantity: 1, totalPerCycle: 25000 },
                   { id: 'fallback-3', serviceName: 'Quản lý & Vệ sinh', unitPriceSnapshot: 150000, unit: 'Tháng', quantity: 1, totalPerCycle: 150000 }
                ] as ContractService[]).map((svc: ContractService, idx: number) => {
                  const Icon = getServiceIcon(svc.serviceName);
                  return (
                    <div key={svc.id || idx} className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center justify-between hover:shadow-xl hover:-translate-y-1 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                          <Icon size={20} />
                        </div>
                        <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{svc.serviceName}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[15px] font-black text-teal-600 font-display">{formatVND(svc.unitPriceSnapshot)}</p>
                        <p className="text-[10px] text-slate-400 font-medium lowercase italic pr-1">/{svc.unit}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Contract Addendums Section (Phụ lục) */}
            {contract?.addendums && contract.addendums.length > 0 && (
              <div className="px-6 space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Phụ lục hợp đồng ({(contract?.addendums || []).length})</h3>
                </div>
                <div className="space-y-4">
                  {(contract?.addendums || []).map((addendum) => (
                    <div key={addendum.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-glow transition-all group">
                       <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                          <FilePlus size={20} />
                       </div>
                       <div className="flex-1 space-y-1.5 min-w-0">
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{addendum.addendumCode}</span>
                             <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded-full uppercase italic border border-emerald-100">{addendum.status}</span>
                          </div>
                          <h4 className="text-sm font-black text-slate-800 tracking-tight leading-none uppercase">{addendum.title}</h4>
                          <p className="text-[10px] font-medium text-slate-400">Có hiệu lực từ: {formatDate(addendum.effectiveDate)}</p>
                          <p className="text-[11px] text-slate-500 italic line-clamp-2 mt-1">{addendum.content}</p>
                          
                          {(() => {
                             try {
                               if (typeof addendum.fileUrl !== 'string') return null;
                               const safeUrl = getNormalizedHttpUrl(addendum.fileUrl);
                               if (!safeUrl) return null;
                               
                               return (
                                 <a 
                                   href={safeUrl}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="mt-3 inline-flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                 >
                                    <Download size={12} /> Tải bản scan PDF
                                 </a>
                               );
                             } catch (err) {
                               console.warn('[ContractView] Render failed for fileUrl', { addendumCode: addendum.addendumCode, fileUrl: addendum.fileUrl, err });
                               return (
                                 <span className="mt-3 inline-flex items-center gap-2 text-[10px] font-black text-red-500 uppercase tracking-widest">
                                   <AlertCircle size={12} /> Lỗi định dạng tệp
                                 </span>
                               );
                             }
                          })()}

                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Policy Hint */}
            <div className="px-6">
               <div className="bg-amber-50/50 border border-amber-100 p-8 rounded-[40px] flex gap-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 text-amber-500 opacity-5 group-hover:rotate-12 transition-transform">
                     <Info size={100} />
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0 shadow-sm shadow-amber-200/50">
                    <Info size={22} />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <p className="text-[12px] text-amber-900 font-black uppercase tracking-widest">Quy tắc chấm dứt hợp đồng</p>
                    <p className="text-[11px] text-amber-700/70 font-medium leading-relaxed italic">
                      Lưu ý: Bạn có {contract?.noticePeriodDays || 30} ngày để thông báo nếu muốn gia hạn hoặc kết thúc hợp đồng trước thời hạn. Vui lòng đọc kỹ các điều khoản về bồi hoàn trong bản gốc PDF.
                    </p>
                  </div>
               </div>
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
};

interface DetailBoxProps {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

const DetailBox = ({ label, value, icon: Icon, color, bg }: DetailBoxProps) => (
  <div className="bg-white p-7 rounded-[40px] shadow-sm border border-slate-50 space-y-4 hover:shadow-2xl hover:shadow-slate-100 transition-all group">
    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform", bg, color)}>
      <Icon size={24} />
    </div>
    <div className="space-y-1 text-left">
      <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">{label}</p>
      <h4 className="text-[15px] font-black text-slate-800 tracking-tight leading-none uppercase font-display">{value}</h4>
    </div>
  </div>
);

export default ContractView;
