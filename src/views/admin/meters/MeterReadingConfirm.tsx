import React from 'react';
import { 
  Building, Zap, Droplets, CheckCircle, 
  ChevronLeft, Database, Info, History
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const MeterReadingConfirm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;

  // In a real app, we'd get this from location state or a store
  // For this design frame, we'll show a premium confirmation UI
  const stats = state?.stats || { valid: 12, error: 2, pending: 1 };
  const meterType = state?.meterType || 'Electricity';

  const handleCommit = () => {
    toast.promise(new Promise(res => setTimeout(res, 2000)), {
      loading: 'Đang lưu dữ liệu vào hệ thống...',
      success: 'Đã lưu tất cả chỉ số thành công!',
      error: 'Lỗi khi lưu dữ liệu.'
    });
    setTimeout(() => navigate('/admin/meters'), 2200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700 py-10">
      {/* Header */}
      <div className="flex items-center gap-6">
        <button 
          onClick={() => navigate(-1)} 
          className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-muted hover:text-primary transition-all active:scale-90"
        >
          <ChevronLeft size={28} />
        </button>
        <div>
          <h1 className="text-[40px] font-black leading-tight tracking-tighter text-slate-900">Xác nhận chỉ số</h1>
          <p className="text-small text-muted font-bold uppercase tracking-[2px]">Kiểm tra dữ liệu lần cuối trước khi ghi sổ</p>
        </div>
      </div>

      {/* Main Stats Card */}
      <div className="card-container p-10 bg-slate-900 text-white relative overflow-hidden shadow-2xl rounded-[48px]">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-6 text-center md:text-left">
            <div className="w-20 h-20 rounded-[28px] bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto md:mx-0 shadow-xl border border-white/20">
              <Database size={40} className="text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight uppercase">Chuẩn bị ghi nhận</h2>
              <p className="text-slate-400 font-medium">Bạn có <span className="text-white font-black">{stats.valid}</span> bản ghi hợp lệ sẵn sàng để lưu.</p>
            </div>
          </div>

          <div className="flex gap-8">
            <div className="text-center space-y-2">
              <div className="text-[48px] font-black font-mono leading-none text-teal-400">{stats.valid}</div>
              <div className="text-[10px] font-black uppercase tracking-[3px] text-slate-500">Hợp lệ</div>
            </div>
            <div className="w-px h-16 bg-white/10 self-center" />
            <div className="text-center space-y-2">
              <div className="text-[48px] font-black font-mono leading-none text-red-500">{stats.error}</div>
              <div className="text-[10px] font-black uppercase tracking-[3px] text-slate-500">Lỗi</div>
            </div>
          </div>
        </div>
        
        <History size={300} className="absolute -bottom-20 -right-20 opacity-5 rotate-12" />
      </div>

      {/* Information Alert */}
      <div className="flex items-start gap-4 p-8 bg-amber-50 rounded-[32px] border border-amber-100/50">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
          <Info size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest leading-none mt-2">Lưu ý quan trọng</h4>
          <p className="text-sm font-medium text-amber-800/70 leading-relaxed">
            Hệ thống sẽ chỉ ghi nhận các chỉ số hợp lệ (Số hiện tại ≥ Số trước). Các bản ghi lỗi hoặc trống sẽ bị bỏ qua và không ảnh hưởng đến dữ liệu cũ. Sau khi lưu, hóa đơn tháng sẽ tự động được cập nhật.
          </p>
        </div>
      </div>

      {/* Action Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        <button 
          onClick={handleCommit}
          className="btn-primary h-24 rounded-[36px] flex items-center justify-center gap-4 text-[20px] font-black uppercase tracking-[6px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
        >
          LƯU DỮ LIỆU
          <CheckCircle size={32} />
        </button>
        <button 
          onClick={() => navigate(-1)}
          className="h-24 rounded-[36px] bg-white border-2 border-slate-100 text-slate-900 flex items-center justify-center gap-4 text-[18px] font-black uppercase tracking-[4px] hover:bg-slate-50 active:scale-95 transition-all shadow-xl"
        >
          QUAY LẠI SỬA
          <ChevronLeft size={28} />
        </button>
      </div>

      {/* Visual background element */}
      <div className="fixed bottom-0 right-0 p-10 opacity-[0.02] pointer-events-none">
        {meterType === 'Electricity' ? <Zap size={600} /> : <Droplets size={600} />}
      </div>
    </div>
  );
};

export default MeterReadingConfirm;
