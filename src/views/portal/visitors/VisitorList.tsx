import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  Clock, 
  ShieldCheck, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  AlertCircle,
  ArrowLeft,
  Calendar,
  Phone,
  QrCode,
  Share2
} from 'lucide-react';
import { cn } from '@/utils';
import { visitorService } from '@/services/visitorService';
import { Visitor, VisitorStatus } from '@/services/visitorService';
import { BottomSheet } from '@/components/portal/BottomSheet';
import { toast } from 'sonner';

const VisitorList: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    idCard: '',
    phone: '',
    visitDate: '',
    visitTime: '',
    leaveDate: '',
    leaveTime: '',
    notes: ''
  });

  useEffect(() => {
    const fetchVisitors = async () => {
      setLoading(true);
      try {
        const data = await visitorService.getVisitors({ tenantId: 'T1' });
        setVisitors(data);
      } catch (error) {
        console.error('Error fetching visitors:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVisitors();
  }, []);

  const filteredVisitors = visitors.filter(v => 
    activeTab === 'upcoming' ? v.status !== 'Departed' : v.status === 'Departed'
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = () => {
    if (!formData.name || !formData.idCard || !formData.visitDate || !formData.visitTime) {
      toast.error('Vui lòng điền các trường bắt buộc');
      return;
    }
    
    // Simulate submission
    const newVisitor: Visitor = {
      id: `V${Date.now()}`,
      tenantId: 'T1',
      name: formData.name,
      idCard: formData.idCard,
      phone: formData.phone || '',
      visitDate: formData.visitDate,
      visitTime: formData.visitTime,
      status: 'Expected' as VisitorStatus,
      qrCode: `QR${Math.floor(Math.random() * 10000)}`
    };

    setVisitors([newVisitor, ...visitors]);
    toast.success('Đăng ký khách thành công!');
    setIsFormOpen(false);
    setFormData({
      name: '', idCard: '', phone: '', visitDate: '', visitTime: '', leaveDate: '', leaveTime: '', notes: ''
    });
  };

  const handleShareQR = (qrCode: string, name: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Mã QR SmartStay',
        text: `Mã QR vào cổng cho khách: ${name} là ${qrCode}`,
        url: window.location.href, // just a mock
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`Mã QR: ${qrCode}`);
      toast.success('Đã copy mã QR');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-6 bg-slate-50 min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#0D8A8A] rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400 font-black animate-pulse uppercase tracking-[3px]">Loading Visitors</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 animate-in fade-in slide-in-from-right-6 duration-700 font-sans">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl px-5 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3 ml-1">
          <button onClick={() => navigate(-1)} className="w-11 h-11 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition-all">
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-[17px] font-black text-slate-900 tracking-tight leading-none uppercase">Khách ghé thăm</h2>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="w-11 h-11 bg-[#0D8A8A] rounded-2xl shadow-lg shadow-[#0D8A8A]/30 flex items-center justify-center text-white active:scale-95 transition-all"
        >
          <UserPlus size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="p-5 space-y-8 max-w-[430px] mx-auto pt-6">
        {/* Tab Switcher */}
        <div className="flex p-1 bg-white rounded-[20px] shadow-sm border border-slate-100">
          {(['upcoming', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-[16px] transition-all",
                activeTab === tab 
                  ? "bg-slate-50 text-[#0D8A8A] shadow-inner" 
                  : "text-slate-400 hover:bg-slate-50/50"
              )}
            >
              {tab === 'upcoming' ? 'Sắp tới' : 'Lịch sử'}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-4">
          {filteredVisitors.length > 0 ? (
            filteredVisitors.map((visitor) => (
              <div key={visitor.id} className="p-5 bg-white rounded-[28px] shadow-sm border border-slate-100 space-y-5 group relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-teal-50 rounded-[20px] flex items-center justify-center text-[#0D8A8A] font-black text-xl border border-teal-100/50 group-hover:scale-110 shadow-inner overflow-hidden uppercase">
                      {visitor.name.split(' ')[visitor.name.split(' ').length - 1][0]}
                    </div>
                    <div className="pt-1">
                      <h4 className="text-[15px] font-black text-slate-800 tracking-tight leading-none">{visitor.name}</h4>
                      <div className="flex items-center gap-1.5 text-slate-400 mt-1.5">
                        <Phone size={10} className="text-teal-500" />
                        <span className="text-[11px] font-bold tracking-widest">{visitor.phone || 'Không có số'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <div className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border",
                        visitor.status === 'Expected' ? "bg-amber-50 border-amber-200 text-amber-600" : 
                        visitor.status === 'Arrived' ? "bg-teal-50 border-[#0D8A8A]/30 text-[#0D8A8A]" : 
                        "bg-slate-50 border-slate-200 text-slate-400"
                      )}>
                        {visitor.status === 'Expected' ? 'Sắp đến' : visitor.status === 'Arrived' ? 'Đã đến' : 'Đã rời'}
                      </div>
                  </div>
                </div>

                <div className="flex items-end justify-between pt-4 border-t border-slate-50">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Thời gian đăng ký</p>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Calendar size={12} className="text-[#0D8A8A]" />
                      <span className="text-[11px] font-black">{visitor.visitDate}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] font-black text-[#0D8A8A]">{visitor.visitTime}</span>
                    </div>
                  </div>
                  
                  {visitor.status !== 'Departed' && (
                    <button 
                      onClick={() => handleShareQR(visitor.qrCode, visitor.name)}
                      className="h-10 px-4 bg-teal-50 rounded-xl flex items-center gap-2 text-[#0D8A8A] hover:bg-teal-100 transition-colors border border-teal-100/50 active:scale-95"
                    >
                      <Share2 size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Share QR</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200 space-y-4 opacity-50">
              <AlertCircle size={48} className="mx-auto text-slate-300" />
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] italic">Trống danh sách</p>
            </div>
          )}
        </div>

        {/* CTA Hero Card */}
        <div className="p-8 bg-slate-900 rounded-[32px] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck size={120} className="font-light group-hover:rotate-12 transition-transform duration-700" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="space-y-1.5">
              <h4 className="text-[15px] font-black uppercase tracking-[2px]">Bảo mật & Nhanh chóng</h4>
              <p className="text-[11px] text-slate-400 font-bold leading-relaxed w-[85%]">
                Đăng ký trước thông tin khách để rút ngắn thời gian check-in tại quầy an ninh bằng mã QR.
              </p>
            </div>
            <button 
              onClick={() => setIsFormOpen(true)}
              className="w-full h-14 bg-white text-[#0D8A8A] font-black text-[12px] uppercase tracking-[3px] rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Đăng ký khách
              <ArrowRight size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <BottomSheet isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Đăng ký khách">
        <div className="space-y-6 py-2 pb-10 max-h-[80vh] overflow-y-auto no-scrollbar">
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Họ và tên khách <span className="text-rose-500">*</span></label>
              <input 
                name="name" value={formData.name} onChange={handleInputChange} placeholder="VD: Nguyễn Văn A" maxLength={200}
                className="w-full h-14 px-5 bg-slate-50 border-none rounded-[20px] font-bold text-sm text-slate-800 focus:ring-2 focus:ring-[#0D8A8A]/30 placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">CCCD/CMND <span className="text-rose-500">*</span></label>
                 <input 
                   name="idCard" value={formData.idCard} onChange={handleInputChange} placeholder="Số định danh"
                   className="w-full h-14 px-5 bg-slate-50 border-none rounded-[20px] font-bold text-sm text-slate-800 focus:ring-2 focus:ring-[#0D8A8A]/30 placeholder:text-slate-400"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">SDT</label>
                 <input 
                   name="phone" value={formData.phone} onChange={handleInputChange} placeholder="09xxxx..."
                   className="w-full h-14 px-5 bg-slate-50 border-none rounded-[20px] font-bold text-sm text-slate-800 focus:ring-2 focus:ring-[#0D8A8A]/30 placeholder:text-slate-400"
                 />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Ngày đến <span className="text-rose-500">*</span></label>
                 <input 
                   type="date" name="visitDate" value={formData.visitDate} onChange={handleInputChange}
                   className="w-full h-14 px-4 bg-slate-50 border-none rounded-[20px] font-bold text-sm text-slate-800 focus:ring-2 focus:ring-[#0D8A8A]/30 text-center"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Giờ đến <span className="text-rose-500">*</span></label>
                 <input 
                   type="time" name="visitTime" value={formData.visitTime} onChange={handleInputChange}
                   className="w-full h-14 px-4 bg-slate-50 border-none rounded-[20px] font-bold text-sm text-slate-800 focus:ring-2 focus:ring-[#0D8A8A]/30 text-center"
                 />
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Ngày giờ chuyển đi (Tùy chọn)</label>
              <div className="flex gap-3">
                 <input type="date" name="leaveDate" value={formData.leaveDate} onChange={handleInputChange} className="flex-1 h-14 px-4 bg-slate-50 border-none rounded-[20px] font-bold text-sm text-slate-600 focus:ring-2 focus:ring-slate-200" />
                 <input type="time" name="leaveTime" value={formData.leaveTime} onChange={handleInputChange} className="flex-1 h-14 px-4 bg-slate-50 border-none rounded-[20px] font-bold text-sm text-slate-600 focus:ring-2 focus:ring-slate-200" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Ghi chú</label>
              <textarea 
                name="notes" value={formData.notes} onChange={handleInputChange} placeholder="VD: Người nhà lên thăm, ở lại 2 hôm, v.v..." rows={3}
                className="w-full p-5 bg-slate-50 border-none rounded-[24px] font-medium text-sm text-slate-600 focus:ring-2 focus:ring-[#0D8A8A]/30 placeholder:text-slate-400 resize-none italic"
              />
            </div>
          </div>

          <div className="pt-2">
            <button 
              onClick={handleRegister}
              className="w-full h-16 bg-[#0D8A8A] text-white rounded-[24px] font-black text-[13px] uppercase tracking-[3px] shadow-2xl shadow-[#0D8A8A]/30 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              Tạo mã đăng ký
              <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

export default VisitorList;
