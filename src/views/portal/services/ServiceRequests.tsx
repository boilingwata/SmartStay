import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Search, 
  Sparkles, 
  Briefcase,
  Waves,
  Droplets,
  Utensils,
  Zap,
  ShoppingBag,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/utils';
import { BottomSheet } from '@/components/portal/BottomSheet';

const MOCK_CURRENT_SERVICES = [
  { id: 101, name: 'Dọn dẹp nhà cửa (Định kỳ)', price: 1500000, unit: 'tháng', icon: Briefcase, color: 'bg-indigo-50 text-indigo-500' },
  { id: 102, name: 'Giữ xe máy', price: 150000, unit: 'tháng', icon: Zap, color: 'bg-amber-50 text-amber-500' },
];

const MOCK_AVAILABLE_SERVICES = [
  { id: 1, name: 'Dọn dẹp nhà cửa', category: 'home', price: 150000, unit: 'giờ', icon: Briefcase, color: 'bg-indigo-50 text-indigo-500', rating: 4.8 },
  { id: 2, name: 'Giặt ủi cao cấp', category: 'home', price: 30000, unit: 'kg', icon: Waves, color: 'bg-blue-50 text-blue-500', rating: 4.9 },
  { id: 3, name: 'Đổi bình nước 20L', category: 'delivery', price: 55000, unit: 'bình', icon: Droplets, color: 'bg-sky-50 text-sky-500', rating: 4.7 },
  { id: 4, name: 'Đặt chỗ BBQ', category: 'amenity', price: 200000, unit: 'giờ', icon: Utensils, color: 'bg-orange-50 text-orange-500', rating: 4.6 },
  { id: 5, name: 'Sửa chữa điện nước', category: 'home', price: 100000, unit: 'lần', icon: Zap, color: 'bg-amber-50 text-amber-500', rating: 4.9 },
  { id: 6, name: 'Thuê sảnh sự kiện', category: 'amenity', price: 500000, unit: 'buổi', icon: Sparkles, color: 'bg-purple-50 text-purple-500', rating: 4.5 },
];

const ServiceRequests: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'current' | 'available'>('current');
  const [selectedAvailable, setSelectedAvailable] = useState<any>(null);
  const [selectedCurrent, setSelectedCurrent] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubscribe = async () => {
    setProcessing(true);
    // Simulate API Call POST /api/portal/service-requests
    await new Promise(r => setTimeout(r, 1000));
    toast.success(`Đã gửi yêu cầu đăng ký: ${selectedAvailable.name}. Quản lý sẽ sớm phê duyệt.`);
    setProcessing(false);
    setSelectedAvailable(null);
  };

  const handleCancel = async () => {
    setProcessing(true);
    // Simulate API Call POST /api/portal/service-requests
    await new Promise(r => setTimeout(r, 1000));
    toast.success(`Đã gửi yêu cầu hủy: ${selectedCurrent.name}. Sẽ có hiệu lực từ kỳ tiếp theo.`);
    setProcessing(false);
    setSelectedCurrent(null);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 animate-in fade-in slide-in-from-right-6 duration-700 font-sans">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-5 pt-12 pb-4 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-11 h-11 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition-all hover:bg-slate-50">
              <ArrowLeft size={22} />
            </button>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Dịch vụ</h2>
          </div>
          <button className="w-11 h-11 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-all hover:bg-slate-50">
            <Search size={20} />
          </button>
        </div>

        {/* Main Tabs */}
        <div className="flex p-1.5 bg-slate-100/60 rounded-[24px] border border-slate-200/50">
          <button
            onClick={() => setActiveTab('current')}
            className={cn(
              "flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-full transition-all duration-500",
              activeTab === 'current' ? "bg-white text-[#0D8A8A] shadow-lg shadow-black/5 scale-[1.02]" : "text-slate-400"
            )}
          >
            Đang sử dụng
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={cn(
              "flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-full transition-all duration-500",
              activeTab === 'available' ? "bg-white text-[#0D8A8A] shadow-lg shadow-black/5 scale-[1.02]" : "text-slate-400"
            )}
          >
            Đăng ký mới
          </button>
        </div>
      </div>

      <div className="px-5 pt-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
        
        {/* CURRENT SERVICES TAB */}
        {activeTab === 'current' && (
          <div className="space-y-4">
             {MOCK_CURRENT_SERVICES.length > 0 ? (
               MOCK_CURRENT_SERVICES.map(svc => (
                 <div key={svc.id} className="p-5 bg-white rounded-[32px] border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                       <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", svc.color)}>
                          <svc.icon size={28} strokeWidth={1.5} />
                       </div>
                       <div className="flex-1 space-y-1">
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{svc.name}</h4>
                          <div className="flex items-baseline gap-1">
                             <span className="text-lg font-black text-[#0D8A8A] tabular-nums tracking-tighter">{svc.price.toLocaleString()}</span>
                             <span className="text-[10px] text-slate-400 font-bold uppercase">đ/{svc.unit}</span>
                          </div>
                       </div>
                    </div>
                    <div className="pt-4 border-t border-slate-50 flex justify-end">
                       <button onClick={() => setSelectedCurrent(svc)} className="text-[11px] font-black text-rose-500 uppercase tracking-widest px-4 py-2 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors">
                          Hủy dịch vụ
                       </button>
                    </div>
                 </div>
               ))
             ) : (
                <div className="text-center py-20">
                   <AlertCircle size={40} className="mx-auto text-slate-300 mb-4" />
                   <p className="text-sm font-black text-slate-800">Chưa có dịch vụ nào</p>
                   <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Chuyển sang Đăng ký mới để thêm</p>
                </div>
             )}
          </div>
        )}

        {/* AVAILABLE SERVICES TAB */}
        {activeTab === 'available' && (
          <div className="space-y-6">
             <div className="relative p-7 bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <ShoppingBag size={120} className="text-white" />
                </div>
                <div className="relative z-10 space-y-2">
                   <h3 className="text-xl font-black text-white tracking-tight uppercase italic">Khám phá tiện ích</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] italic leading-relaxed">
                     Thêm sự tiện nghi cho căn hộ của bạn.
                   </p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
               {MOCK_AVAILABLE_SERVICES.map((svc) => (
                 <div 
                   key={svc.id}
                   onClick={() => setSelectedAvailable(svc)}
                   className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex flex-col gap-4 active:scale-95 transition-all group hover:border-[#0D8A8A]/30 hover:shadow-xl hover:shadow-teal-100/50"
                 >
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", svc.color)}>
                       <svc.icon size={24} />
                    </div>
                    <div className="space-y-1">
                       <h4 className="text-[13px] font-black text-slate-800 line-clamp-2 leading-tight uppercase tracking-tight">{svc.name}</h4>
                       <div className="flex items-center gap-1">
                         <Star size={10} className="text-amber-400 fill-amber-400" />
                         <span className="text-[10px] font-black text-slate-400">{svc.rating}</span>
                       </div>
                    </div>
                    <div className="flex flex-col mt-auto">
                       <span className="text-sm font-black text-[#0D8A8A] tabular-nums tracking-tighter">{svc.price.toLocaleString()} đ</span>
                       <span className="text-[10px] text-slate-300 font-bold uppercase">/ {svc.unit}</span>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

      </div>

      {/* SUBSCRIBE MODAL */}
      <BottomSheet isOpen={!!selectedAvailable} onClose={() => !processing && setSelectedAvailable(null)} title="Đăng ký dịch vụ">
        {selectedAvailable && (
          <div className="space-y-8 pb-10">
             <div className="flex items-start gap-4">
                <div className={cn("w-20 h-20 rounded-[24px] flex items-center justify-center shadow-inner", selectedAvailable.color)}>
                   <selectedAvailable.icon size={36} strokeWidth={1.5} />
                </div>
                <div className="flex-1 space-y-1 pt-1">
                   <h3 className="text-lg font-black text-slate-900 leading-tight tracking-tight uppercase">{selectedAvailable.name}</h3>
                   <div className="flex items-center gap-1 text-amber-500">
                      <Star size={14} className="fill-amber-500" />
                      <span className="text-sm font-black">{selectedAvailable.rating}</span>
                   </div>
                </div>
             </div>

             <div className="p-5 bg-teal-50/50 rounded-[28px] border border-teal-100/50">
                <div className="flex justify-between items-center">
                   <span className="text-[11px] font-black text-teal-700 uppercase tracking-widest">Đơn giá áp dụng</span>
                   <div className="flex items-baseline gap-1">
                     <span className="text-2xl font-black text-[#0D8A8A] tabular-nums tracking-tighter">{selectedAvailable.price.toLocaleString()}</span>
                     <span className="text-[10px] font-bold text-[#0D8A8A] uppercase">đ / {selectedAvailable.unit}</span>
                   </div>
                </div>
                <p className="text-[11px] text-teal-600/80 mt-3 font-medium leading-relaxed italic">
                  * Yêu cầu sẽ được gửi đến BQL để phê duyệt. Phí dịch vụ sẽ được tính từ kỳ tính cước tiếp theo.
                </p>
             </div>

             <button 
               onClick={handleSubscribe}
               disabled={processing}
               className="w-full h-15 bg-[#0D8A8A] text-white rounded-[20px] font-black uppercase tracking-[3px] text-[13px] shadow-2xl shadow-[#0D8A8A]/30 active:scale-95 transition-all flex items-center justify-center"
             >
                {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Xác nhận đăng ký'}
             </button>
          </div>
        )}
      </BottomSheet>

      {/* CANCEL MODAL */}
      <BottomSheet isOpen={!!selectedCurrent} onClose={() => !processing && setSelectedCurrent(null)} title="Hủy dịch vụ">
        {selectedCurrent && (
          <div className="space-y-8 pb-10 text-center">
             <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 mb-2">
                <XCircle size={40} strokeWidth={1.5} />
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">Bạn muốn hủy dịch vụ?</h3>
                <p className="text-sm text-slate-500 font-medium mt-2">Dịch vụ <strong className="text-slate-900">{selectedCurrent.name}</strong> sẽ bị ngừng cung cấp kể từ kỳ thanh toán tiếp theo.</p>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setSelectedCurrent(null)}
                  disabled={processing}
                  className="h-14 bg-slate-100 text-slate-600 rounded-[20px] font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
                >
                   Quay lại
                </button>
                <button 
                  onClick={handleCancel}
                  disabled={processing}
                  className="h-14 bg-rose-500 text-white rounded-[20px] font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center"
                >
                   {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Xác nhận hủy'}
                </button>
             </div>
          </div>
        )}
      </BottomSheet>

    </div>
  );
};

export default ServiceRequests;
