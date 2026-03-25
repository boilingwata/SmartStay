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
  Share2,
  ChevronRight,
  X
} from 'lucide-react';
import { cn } from '@/utils';
import { visitorService } from '@/services/visitorService';
import { Visitor, VisitorStatus } from '@/services/visitorService';
import { BottomSheet } from '@/components/portal/BottomSheet';
import { toast } from 'sonner';

import { QRCodeSVG } from 'qrcode.react';

const generateDeterministicQR = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `STAY-${Math.abs(hash % 900000 + 100000)}`;
};

const VisitorList: React.FC = () => {
  const navigate = useNavigate();
  const ENABLE_SIMULATION = import.meta.env.DEV && !import.meta.env.PROD;
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showQRCard, setShowQRCard] = useState<Visitor | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    idCard: '',
    phone: '',
    visitDateTime: '',
    leaveDateTime: '',
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.idCard || !formData.visitDateTime) {
      toast.error('Vui lòng điền các trường bắt buộc');
      return;
    }

    if (!/^\d{9}(\d{3})?$/.test(formData.idCard)) {
      toast.error('CCCD/CMND phải là 9 hoặc 12 chữ số');
      return;
    }
    
    const visitorId = `V${Date.now()}`;
    // Simulate submission
    const newVisitor: Visitor = {
      id: visitorId,
      tenantId: 'T1',
      name: formData.name,
      idCard: formData.idCard,
      phone: formData.phone || '',
      visitDate: formData.visitDateTime.split('T')[0],
      visitTime: formData.visitDateTime.split('T')[1],
      status: 'Expected' as VisitorStatus,
      qrCode: ENABLE_SIMULATION ? generateDeterministicQR(visitorId) : ''
    };

    setVisitors([newVisitor, ...visitors]);
    toast.success('Đăng ký khách thành công!');
    setIsFormOpen(false);
    setShowQRCard(newVisitor);
    setFormData({
      name: '', idCard: '', phone: '', visitDateTime: '', leaveDateTime: '', notes: ''
    });
  };

  const handleShare = async (visitor: Visitor) => {
    const shareText = `Mã QR vào cổng cho khách: ${visitor.name}\nMã QR: ${visitor.qrCode}`;
    const shareData = {
      title: "Mã QR khách SmartStay",
      text: shareText,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        console.error('Share failed, falling back to clipboard', err);
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('Đã copy thông tin chia sẻ');
    } catch (err) {
      console.error('Clipboard copy failed', err);
      toast.error('Không thể copy thông tin');
    }
  };
  const getStatusChip = (status: VisitorStatus) => {
    const configs: Record<string, { bg: string, text: string, label: string }> = {
      Expected: { bg: 'bg-teal-50 border-teal-100', text: 'text-teal-600', label: 'Dự kiến' },
      Arrived: { bg: 'bg-green-50 border-green-100', text: 'text-green-600', label: 'Đã đến' },
      Departed: { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-500', label: 'Đã về' },
      Cancelled: { bg: 'bg-red-50 border-red-100', text: 'text-red-500', label: 'Đã hủy' }
    };
    const config = configs[status] || configs.Expected;
    return (
      <span className={cn("px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border", config.bg, config.text)}>
        {config.label}
      </span>
    );
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
      {/* F.13.1 Visitor List Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl px-5 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-slate-700 active:scale-95 transition-all">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">Khách sắp đến</h2>
            <span className="bg-teal-100 text-teal-700 text-[10px] font-black px-2 py-0.5 rounded-full">{visitors.filter(v => v.status === 'Expected').length}</span>
          </div>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-teal-600 text-white text-[11px] font-black uppercase tracking-widest px-4 h-11 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 active:scale-95 transition-all"
        >
          <UserPlus size={16} strokeWidth={3} />
          Đăng ký
        </button>
      </div>

      <div className="p-5 space-y-3">
        {visitors.length > 0 ? (
          visitors.map((visitor) => (
            <div 
              key={visitor.id} 
              onClick={() => visitor.status === 'Expected' && setShowQRCard(visitor)}
              className="flex items-center gap-4 p-4 bg-white rounded-[20px] border border-gray-100 shadow-sm active:scale-[0.98] transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-lg border border-gray-100 shrink-0 uppercase group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:border-teal-100 transition-colors">
                {visitor.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-[14px] font-black text-slate-800 tracking-tight truncate uppercase leading-none">{visitor.name}</h4>
                  {getStatusChip(visitor.status)}
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 mt-1.5">
                  <Clock size={11} className="text-teal-500" />
                  <span className="text-[10px] font-bold tracking-widest italic">{visitor.visitDate} • {visitor.visitTime}</span>
                </div>
              </div>
              <div className="shrink-0 text-slate-300 group-hover:text-teal-500 transition-colors">
                <ChevronRight size={18} />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white/50 rounded-[32px] border-2 border-dashed border-gray-200">
            <AlertCircle size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Không có khách nào</p>
          </div>
        )}
      </div>

      {/* F.13.2 Register Form */}
      <BottomSheet isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Đăng ký khách">
        <div className="space-y-5 py-2 pb-10 max-h-[80vh] overflow-y-auto no-scrollbar">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Họ tên khách <span className="text-red-500">*</span></label>
            <input 
              name="name" value={formData.name} onChange={handleInputChange} placeholder="Nhập họ và tên" maxLength={200}
              className="w-full h-13 px-5 bg-gray-50 border-gray-100 rounded-xl font-bold text-sm text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:bg-white outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">CCCD/CMND <span className="text-red-500">*</span></label>
            <input 
              name="idCard" value={formData.idCard} onChange={handleInputChange} placeholder="9 hoặc 12 chữ số"
              className="w-full h-13 px-5 bg-gray-50 border-gray-100 rounded-xl font-bold text-sm text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:bg-white outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Số điện thoại</label>
            <input 
              name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Tùy chọn"
              className="w-full h-13 px-5 bg-gray-50 border-gray-100 rounded-xl font-bold text-sm text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:bg-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
             <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Ngày giờ đến dự kiến <span className="text-red-500">*</span></label>
                <input 
                  type="datetime-local" name="visitDateTime" value={formData.visitDateTime} onChange={handleInputChange}
                  className="w-full h-13 px-4 bg-gray-50 border-gray-100 rounded-xl font-bold text-sm text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:bg-white outline-none"
                />
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Ngày giờ đi dự kiến</label>
                <input 
                  type="datetime-local" name="leaveDateTime" value={formData.leaveDateTime} onChange={handleInputChange}
                  className="w-full h-13 px-4 bg-gray-50 border-gray-100 rounded-xl font-bold text-sm text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:bg-white outline-none"
                />
             </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Ghi chú</label>
            <textarea 
              name="notes" value={formData.notes} onChange={handleInputChange} placeholder="VD: Khách giao đồ ăn, gia đình về thăm..." rows={3}
              className="w-full p-4 bg-gray-50 border-gray-100 rounded-xl font-medium text-sm text-slate-600 focus:ring-2 focus:ring-teal-500/20 focus:bg-white outline-none resize-none"
            />
          </div>

          <div className="pt-2">
            <button 
              onClick={handleRegister}
              className="w-full h-15 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-[3px] shadow-xl shadow-teal-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              Đăng ký khách
              <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* QR Code Full Screen Dialog */}
      {showQRCard && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="relative w-full max-w-sm bg-gradient-to-br from-teal-600 to-blue-700 rounded-[32px] p-8 text-white text-center space-y-8 shadow-2xl overflow-hidden group">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
            
            <button 
              onClick={() => setShowQRCard(null)}
              className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <X size={20} />
            </button>

            <div className="space-y-2">
              <h3 className="text-2xl font-black tracking-tight uppercase leading-none">Mã truy cập</h3>
              <p className="text-teal-100/80 text-[11px] font-bold uppercase tracking-widest italic">{showQRCard.name}</p>
            </div>

            <div className="bg-white p-5 rounded-[24px] shadow-2xl shadow-black/20 mx-auto w-fit">
              <QRCodeSVG 
                value={showQRCard.qrCode || ''} 
                size={200}
                fgColor="#0D8A8A"
                bgColor="transparent"
                level="H"
              />
            </div>

            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <p className="text-[10px] font-black uppercase text-teal-200 tracking-[2px] mb-1">Thời gian hiệu lực</p>
                <p className="text-sm font-black">{showQRCard.visitDate} • {showQRCard.visitTime}</p>
              </div>

              <button 
                onClick={() => handleShare(showQRCard)}
                className="w-full h-14 bg-white text-teal-700 rounded-2xl font-black uppercase tracking-[3px] text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Share2 size={16} strokeWidth={3} />
                Chia sẻ mã QR
              </button>
            </div>
            
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest italic">Vui lòng xuất trình mã này tại quầy an ninh</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorList;
