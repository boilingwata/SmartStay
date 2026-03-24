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

        {/* E.8.1 Header: "Dịch vụ đang dùng" + chip */}
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-bold text-gray-900">Dịch vụ đang dùng</h3>
          <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold border border-teal-100">
            {MOCK_CURRENT_SERVICES.length} dịch vụ
          </span>
        </div>
      </div>

      <div className="px-5 pt-6 animate-in slide-in-from-bottom-4 fade-in duration-500 space-y-8">
        
        {/* CURRENT SERVICES LIST */}
        <div className="space-y-3">
           {MOCK_CURRENT_SERVICES.length > 0 ? (
             MOCK_CURRENT_SERVICES.map(svc => (
               <div key={svc.id} className="flex items-center gap-3 bg-white rounded-[16px] p-4 border border-gray-100 shadow-sm">
                  {/* Icon dịch vụ: w-10 h-10 rounded-[12px] bg-teal-50 text-teal-600 */}
                  <div className="w-10 h-10 rounded-[12px] bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                     <svc.icon size={20} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                     <h4 className="text-sm font-semibold text-gray-900 truncate">{svc.name}</h4>
                     <p className="text-xs text-slate-500 font-medium">{svc.price.toLocaleString()}đ/{svc.unit}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedCurrent(svc)} 
                    className="text-red-500 border border-red-200 rounded-lg px-3 py-1 text-sm font-medium hover:bg-red-50 transition-colors shrink-0"
                  >
                     Hủy đăng ký
                  </button>
               </div>
             ))
           ) : (
              <div className="text-center py-10 bg-white rounded-[24px] border border-dashed border-slate-200">
                 <AlertCircle size={32} className="mx-auto text-slate-300 mb-2" />
                 <p className="text-sm font-bold text-slate-400">Chưa có dịch vụ nào đang dùng</p>
              </div>
           )}
        </div>

        {/* E.8.2 Available Services Grid */}
        <div className="space-y-4">
           <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-gray-900">Dịch vụ có sẵn</h3>
              <p className="text-xs text-slate-500">Đăng ký thêm tiện ích cho căn hộ của bạn</p>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
             {MOCK_AVAILABLE_SERVICES.map((svc) => (
               <div 
                 key={svc.id}
                 className="bg-white rounded-[20px] p-5 border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all flex flex-col gap-4 group"
               >
                  <div className="flex justify-between items-start">
                    <div className={cn("w-12 h-12 rounded-[16px] flex items-center justify-center transition-transform group-hover:scale-110", svc.color)}>
                       <svc.icon size={24} />
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-[11px] font-bold text-amber-700">{svc.rating}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                     <h4 className="text-[15px] font-bold text-gray-900 leading-tight">{svc.name}</h4>
                     <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-teal-600">{svc.price.toLocaleString()}đ</span>
                        <span className="text-[10px] text-slate-400 font-bold">/{svc.unit}</span>
                     </div>
                  </div>

                  <button 
                    onClick={() => setSelectedAvailable(svc)}
                    className="w-full bg-teal-600 text-white h-10 rounded-xl font-semibold text-sm active:scale-95 transition-all hover:bg-teal-700 shadow-sm shadow-teal-200"
                  >
                    Đăng ký
                  </button>
               </div>
             ))}
           </div>
        </div>

      </div>

      {/* SUBSCRIBE MODAL */}
      <BottomSheet isOpen={!!selectedAvailable} onClose={() => !processing && setSelectedAvailable(null)} title="Xác nhận đăng ký">
        {selectedAvailable && (
          <div className="space-y-6 pb-10">
             <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className={cn("w-16 h-16 rounded-[16px] flex items-center justify-center shadow-sm", selectedAvailable.color)}>
                   <selectedAvailable.icon size={32} strokeWidth={1.5} />
                </div>
                <div className="flex-1 space-y-1">
                   <h3 className="text-base font-bold text-slate-900 leading-tight">{selectedAvailable.name}</h3>
                   <p className="text-xs text-slate-500 font-medium">Giá: {selectedAvailable.price.toLocaleString()}đ/{selectedAvailable.unit}</p>
                </div>
             </div>

             <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl">
                <p className="text-[13px] text-teal-700 font-medium leading-relaxed">
                  Bạn có chắc chắn muốn đăng ký dịch vụ này? Yêu cầu sẽ được gửi đến Ban quản lý để phê duyệt. Phí sẽ được tính vào hóa đơn kỳ tới.
                </p>
             </div>

             <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedAvailable(null)}
                  disabled={processing}
                  className="flex-1 h-12 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm active:scale-95 transition-all"
                >
                   Bỏ qua
                </button>
                <button 
                  onClick={handleSubscribe}
                  disabled={processing}
                  className="flex-[2] h-12 bg-teal-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-200 active:scale-95 transition-all flex items-center justify-center"
                >
                   {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Xác nhận đăng ký'}
                </button>
             </div>
          </div>
        )}
      </BottomSheet>

      {/* CANCEL MODAL */}
      <BottomSheet isOpen={!!selectedCurrent} onClose={() => !processing && setSelectedCurrent(null)} title="Hủy dịch vụ">
        {selectedCurrent && (
          <div className="space-y-6 pb-10 text-center">
             <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 mb-2">
                <XCircle size={40} strokeWidth={1.5} />
             </div>
             <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Xác nhận hủy dịch vụ?</h3>
                <p className="text-sm text-slate-500 mt-2 px-4">Dịch vụ <strong className="text-slate-900">{selectedCurrent.name}</strong> sẽ ngừng cung cấp từ kỳ thanh toán tiếp theo.</p>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setSelectedCurrent(null)}
                  disabled={processing}
                  className="h-12 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm active:scale-95 transition-all"
                >
                   Quay lại
                </button>
                <button 
                  onClick={handleCancel}
                  disabled={processing}
                  className="h-12 bg-rose-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-200 active:scale-95 transition-all flex items-center justify-center"
                >
                   {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Hủy ngay'}
                </button>
             </div>
          </div>
        )}
      </BottomSheet>

    </div>
  );
};

export default ServiceRequests;
