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
  const [bookings, setBookings] = useState([
    { id: 'BK-001', tenant: 'Lê Minh Tâm', room: 'P.1205', amenity: 'Phòng Gym', time: '08:00 - 09:30', status: 'Booked', isLate: false },
    { id: 'BK-002', tenant: 'Hoàng Thu Trang', room: 'P.2201', amenity: 'Sân Tennis 1', time: '14:00 - 15:00', status: 'Booked', isLate: true },
    { id: 'BK-003', tenant: 'Trần Văn B', room: 'P.0504', amenity: 'Hồ bơi', time: '14:30 - 16:00', status: 'InUse', isLate: false },
    { id: 'BK-004', tenant: 'Phạm Thị C', room: 'P.1808', amenity: 'Phòng đọc sách', time: '16:00 - 17:00', status: 'Booked', isLate: false },
  ]);

  // 5.4.1 Auto no-show logic for bookings delayed by 15 minutes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setBookings(prev => prev.map(b => {
        if (b.isLate && b.status === 'Booked') {
           // Auto transition to Cancelled (NoShow) if not checked in
           return { ...b, status: 'Cancelled' };
        }
        return b;
      }));
    }, 5000); // Simulate after 5 seconds for demonstration
    return () => clearTimeout(timer);
  }, []);

  const handleAction = (id: string, action: 'CheckIn' | 'CheckOut' | 'NoShow') => {
    setBookings(prev => prev.map(b => {
      if (b.id === id) {
        if (action === 'CheckIn') return { ...b, status: 'InUse' };
        if (action === 'CheckOut') return { ...b, status: 'Completed' };
        if (action === 'NoShow') return { ...b, status: 'Cancelled' };
      }
      return b;
    }));
    toast.success('Đã cập nhật trạng thái tiện ích!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-display text-primary leading-tight">Kiểm tra Tiện ích</h1>
          <p className="text-body text-muted font-medium italic">Danh sách cư dân đặt sử dụng tiện ích trong hôm nay.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="btn-primary flex items-center gap-2 h-12 px-6">
              <Calendar size={18} /> Đặt chỗ mới
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Tổng số lượt', value: 24, icon: Dumbbell, color: 'primary' },
           { label: 'Đang sử dụng', value: 8, icon: RefreshCcw, color: 'success' },
           { label: 'Chờ xác nhận', value: 12, icon: Clock, color: 'warning' },
           { label: 'Vắng mặt', value: 4, icon: AlertTriangle, color: 'danger' },
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
                  {bookings.map(b => (
                     <tr key={b.id} className={cn("group hover:bg-white transition-all", b.isLate && b.status === 'Booked' ? "bg-danger/[0.02]" : "")}>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-bg rounded-2xl flex flex-col items-center justify-center border border-border/10">
                                 <Clock size={16} className="text-primary mb-1" />
                                 <span className="text-[9px] font-black text-primary">LIVE</span>
                              </div>
                              <div>
                                 <p className="text-small font-black text-primary tracking-tight">{b.amenity}</p>
                                 <p className="text-[10px] font-mono font-black text-muted">{b.time}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-6">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold">{b.tenant.charAt(0)}</div>
                              <div>
                                 <p className="text-small font-bold text-primary">{b.tenant}</p>
                                 <p className="text-[10px] font-bold text-muted uppercase tracking-tighter">{b.room}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-6 font-mono">
                           <StatusBadge status={b.status as any} size="sm" />
                           {b.isLate && b.status === 'Booked' && (
                              <div className="flex items-center gap-1.5 mt-1.5 text-danger animate-pulse">
                                 <AlertTriangle size={12} />
                                 <span className="text-[9px] font-black uppercase">Trễ 15 phút</span>
                              </div>
                           )}
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex items-center justify-end gap-2">
                              {b.status === 'Booked' && (
                                 <>
                                    <button 
                                      onClick={() => handleAction(b.id, 'CheckIn')}
                                      className="h-10 px-4 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2"
                                    >
                                       <CheckCircle2 size={14} /> Xác nhận
                                    </button>
                                    <button 
                                      onClick={() => handleAction(b.id, 'NoShow')}
                                      className="p-2.5 bg-bg text-muted rounded-xl hover:bg-danger/10 hover:text-danger transition-all"
                                      title="Báo vắng mặt"
                                    >
                                       <X size={18} />
                                    </button>
                                 </>
                              )}
                              {b.status === 'InUse' && (
                                 <button 
                                   onClick={() => handleAction(b.id, 'CheckOut')}
                                   className="h-10 px-4 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                                 >
                                    <Check size={14} /> Hoàn thành
                                 </button>
                              )}
                              <button className="p-2.5 text-muted hover:bg-bg rounded-xl">
                                 <MoreVertical size={18} />
                              </button>
                           </div>
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

export default AmenityCheckin;
