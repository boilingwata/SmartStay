import React, { useState } from 'react';
import { 
  Dumbbell, Clock, User, Check, 
  X, RefreshCcw, Calendar, MapPin,
  AlertTriangle, CheckCircle2, MoreVertical
} from 'lucide-react';
import { cn } from '@/utils';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/ui';

const AmenityCheckin = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-display text-primary leading-tight">Kiểm tra Tiện ích</h1>
          <p className="text-body text-muted font-medium italic">Danh sách cư dân đặt sử dụng tiện ích trong hôm nay.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="btn-primary flex items-center gap-2 h-12 px-6 opacity-50 cursor-not-allowed">
              <Calendar size={18} /> Đặt chỗ mới
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Tổng số lượt', value: 0, icon: Dumbbell, color: 'primary' },
           { label: 'Đang sử dụng', value: 0, icon: RefreshCcw, color: 'success' },
           { label: 'Chờ xác nhận', value: 0, icon: Clock, color: 'warning' },
           { label: 'Vắng mặt', value: 0, icon: AlertTriangle, color: 'danger' },
         ].map((kpi, idx) => (
           <div key={idx} className="card-container p-6 bg-white/40 border-primary/5">
              <div className="flex justify-between items-start mb-4">
                 <div className={cn("p-3 rounded-2xl", kpi.color === 'primary' ? "bg-primary/10 text-primary" : kpi.color === 'success' ? "bg-emerald-100 text-emerald-600" : kpi.color === 'warning' ? "bg-amber-100 text-amber-600" : "bg-danger/10 text-danger")}>
                    <kpi.icon size={22} />
                 </div>
                 <span className="text-[10px] font-black uppercase text-muted tracking-widest">{kpi.label}</span>
              </div>
              <p className="text-[32px] font-black text-primary">{kpi.value}</p>
           </div>
         ))}
      </div>

      <div className="card-container p-0 overflow-hidden bg-white/60 backdrop-blur-md">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-[#1e293b] text-white">
                  <tr>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[3px]">Thời gian / Tiện ích</th>
                     <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[3px]">Cư dân / Phòng</th>
                     <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[3px]">Trạng thái</th>
                     <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[3px]">Thao tác</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-border/10">
                  <tr>
                    <td colSpan={4} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-40">
                         <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <Calendar size={32} />
                         </div>
                         <p className="text-body font-black uppercase tracking-widest">Tính năng đang được phát triển</p>
                         <p className="text-[12px] italic max-w-xs mx-auto">
                            Dữ liệu đặt lịch tiện ích sẽ được tự động đồng bộ khi hoàn tất cấu hình hệ thống đặt chỗ của cư dân.
                         </p>
                      </div>
                    </td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default AmenityCheckin;
