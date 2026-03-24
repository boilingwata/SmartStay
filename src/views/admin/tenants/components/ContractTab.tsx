import React from 'react';
import { 
  FileText, Calendar, Wallet, Home, 
  ShieldCheck, AlertCircle, ArrowRight,
  Download, History, UserCheck
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Contract } from '@/models/Contract';
import { formatDate, formatVND, cn } from '@/utils';

interface ContractTabProps {
  contract?: Contract | null; 
}

export const ContractTab: React.FC<ContractTabProps> = ({ contract }) => {
  // If no contract provided, show empty state or a default mock for demonstration
  const displayContract = contract || {
    id: 'CON-1',
    contractCode: 'CON-MAN-123456',
    roomCode: '34.05',
    buildingName: 'The Manor Office',
    status: 'Active',
    startDate: '2024-01-01',
    endDate: '2025-01-01',
    rentPriceSnapshot: 15000000,
    type: 'Residential',
    isRepresentative: true,
  } as Contract;

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      {/* Header Info Card */}
      <div className="card-container p-10 bg-white/40 backdrop-blur-md border-none shadow-2xl shadow-primary/5 relative overflow-hidden group">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-primary/5 text-primary rounded-[32px] flex items-center justify-center border border-primary/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
               <FileText size={36} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                 <h2 className="text-h2 text-primary font-black uppercase tracking-tighter">{displayContract.contractCode}</h2>
                 <StatusBadge status={displayContract.status} size="sm" />
              </div>
              <p className="text-small text-muted font-bold flex items-center gap-2 italic">
                <Home size={14} className="text-accent" /> {displayContract.roomCode} - {displayContract.buildingName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button className="btn-outline px-6 py-3 rounded-2xl flex items-center gap-2 text-[11px] font-black uppercase tracking-widest hover:bg-white transition-all">
                <Download size={16} /> Tải bản scan (PDF)
             </button>
             <button className="btn-primary px-8 py-3 rounded-2xl flex items-center gap-2 text-[11px] font-black uppercase tracking-[3px] shadow-xl shadow-primary/10">
                <History size={16} /> Xem lịch sử
             </button>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">
           <ShieldCheck size={160} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Core Stats */}
        {[
          { icon: Calendar, label: 'Thời hạn thuê', value: `${formatDate(displayContract.startDate)} - ${formatDate(displayContract.endDate)}`, sub: '12 Tháng' },
          { icon: Wallet, label: 'Giá thuê snapshot', value: formatVND(displayContract.rentPriceSnapshot), sub: 'Cố định theo hợp đồng', color: 'text-success' },
          { icon: UserCheck, label: 'Người đại diện', value: displayContract.tenantName || 'Manager', sub: 'Chủ hộ / Đại diện pháp lý' },
        ].map((item, i) => (
          <div key={i} className="card-container p-8 bg-white/60 border-none shadow-xl shadow-primary/5 hover:bg-white transition-all group">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-bg rounded-xl flex items-center justify-center text-muted group-hover:text-primary transition-colors">
                   <item.icon size={20} />
                </div>
                <p className="text-[10px] text-muted font-black uppercase tracking-[2px]">{item.label}</p>
             </div>
             <p className={cn("text-body font-black uppercase tracking-tighter mb-1", item.color || "text-primary")}>{item.value}</p>
             <p className="text-[10px] text-muted italic font-medium">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Details Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="card-container p-8 bg-white/40 border-none shadow-xl">
            <h3 className="text-h3 text-primary font-black uppercase tracking-widest mb-6 flex items-center gap-3">
               <AlertCircle size={20} className="text-accent" /> Thông tin bổ sung
            </h3>
            <div className="space-y-4">
               {[
                 { label: 'Kỳ thanh toán', value: 'Hàng tháng (Cước trả trước)' },
                 { label: 'Hạn thanh toán', value: 'Ngày 05 hàng tháng' },
                 { label: 'Tiền cọc', value: '15.000.000 VND (Đã nộp)' },
                 { label: 'Thời gian báo trước', value: '30 Ngày' },
               ].map((info, i) => (
                 <div key={i} className="flex justify-between items-center py-3 border-b border-dashed border-border/10">
                    <span className="text-small text-muted font-bold">{info.label}</span>
                    <span className="text-small text-primary font-black uppercase italic tracking-tighter">{info.value}</span>
                 </div>
               ))}
            </div>
         </div>

         <div className="card-container p-8 bg-slate-900 border-none shadow-xl text-white relative overflow-hidden">
            <div className="relative z-10">
               <h3 className="text-h3 text-slate-400 font-black uppercase tracking-widest mb-6">Quick Actions</h3>
               <div className="grid grid-cols-2 gap-4">
                  <button className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center gap-2 group">
                     <FileText size={24} className="text-primary group-hover:scale-110 transition-transform" />
                     <span className="text-[9px] font-black uppercase tracking-widest">Tạo phụ lục</span>
                  </button>
                  <button className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center gap-2 group">
                     <ArrowRight size={24} className="text-accent group-hover:scale-110 transition-transform" />
                     <span className="text-[9px] font-black uppercase tracking-widest">Chuyển phòng</span>
                  </button>
                  <button className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center gap-2 group">
                     <ShieldCheck size={24} className="text-success group-hover:scale-110 transition-transform" />
                     <span className="text-[9px] font-black uppercase tracking-widest">Gia hạn</span>
                  </button>
                  <button className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center gap-2 group">
                     <AlertCircle size={24} className="text-danger group-hover:scale-110 transition-transform" />
                     <span className="text-[9px] font-black uppercase tracking-widest">Chấm dứt</span>
                  </button>
               </div>
            </div>
            <FileText size={200} className="absolute -bottom-20 -right-20 text-white/5 rotate-12" />
         </div>
      </div>
    </div>
  );
};
