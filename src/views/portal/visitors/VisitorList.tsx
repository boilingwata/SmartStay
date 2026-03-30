import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  Clock, 
  ArrowLeft,
  AlertCircle,
  Construction,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/utils';
import { Button } from '@/components/ui/Button';

const VisitorList: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white pb-32 animate-in fade-in slide-in-from-right-8 duration-700 font-sans relative overflow-hidden">
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl px-6 pt-10 pb-6 flex items-center justify-between border-b border-slate-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 active:scale-95 transition-all">
            <ArrowLeft size={18} />
          </button>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-teal-600/60 uppercase tracking-[3px] leading-none mb-1 font-mono">An ninh & Truy cập</p>
            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Đăng ký khách</h2>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-[600px] mx-auto text-center space-y-10 py-20 relative">
        {/* Background Visual Ornament */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] -z-10 pointer-events-none">
            <Construction size={400} strokeWidth={1} />
        </div>

        <div className="space-y-6">
           <div className="w-24 h-24 bg-teal-50 rounded-[32px] flex items-center justify-center text-teal-600 shadow-2xl shadow-teal-500/10 mx-auto border-4 border-white">
              <ShieldAlert size={40} strokeWidth={2.5} className="animate-bounce" />
           </div>
           
           <div className="space-y-3">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight">Tính năng tạm đóng</h3>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-relaxed">Hệ thống đang được nâng cấp cơ sở dữ liệu để bảo mật thông tin khách thăm tốt hơn.</p>
           </div>
        </div>

        <div className="bg-slate-50 rounded-[40px] p-8 border border-slate-100 space-y-6 shadow-inner text-left max-w-sm mx-auto">
           <div className="flex gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-teal-500 shadow-sm shrink-0 border border-slate-50">
                 <Clock size={20} strokeWidth={3} />
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dự kiến hoàn tất</p>
                 <p className="text-sm font-black text-slate-700">Trong 24-48 giờ tới</p>
              </div>
           </div>
           <div className="flex gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm shrink-0 border border-slate-50">
                 <AlertCircle size={20} strokeWidth={3} />
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hỗ trợ khẩn cấp</p>
                 <p className="text-sm font-black text-slate-700">Liên hệ trực tiếp lễ tân</p>
              </div>
           </div>
        </div>

        <div className="pt-6">
           <button 
             onClick={() => navigate('/portal/tickets/create')}
             className="w-full h-16 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-[4px] text-xs shadow-2xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-3"
           >
              Gửi yêu cầu hỗ trợ
              <UserPlus size={18} strokeWidth={3} />
           </button>
           <p className="text-[9px] text-slate-300 font-black uppercase tracking-[4px] mt-6 italic">Cảm ơn sự kiên nhẫn của cư dân</p>
        </div>
      </div>
    </div>
  );
};

export default VisitorList;
