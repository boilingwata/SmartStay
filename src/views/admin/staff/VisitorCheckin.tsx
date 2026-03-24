import React, { useState } from 'react';
import { 
  Users, QrCode, Clipboard, Check, 
  X, Search, Camera, ShieldCheck, 
  User, CreditCard, Building, Calendar,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/utils';
import { toast } from 'sonner';

const VisitorCheckin = () => {
  const [scanMode, setScanMode] = useState(true);
  const [searchCCCD, setSearchCCCD] = useState('');
  const [visitor, setVisitor] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Mock scan handler
  const handleScan = () => {
    setLoading(true);
    // Simulate finding a visitor registration
    setTimeout(() => {
      setVisitor({
        id: 'VIS-9921',
        name: 'Nguyễn Văn A',
        cccd: '001092001XXX',
        room: 'P.1205',
        tenantName: 'Lê Minh Tâm',
        expectedAt: '2026-03-08 14:00',
        purpose: 'Giao hàng / Lắp đặt',
        status: 'Pending'
      });
      setLoading(false);
      toast.success('Đã tìm thấy thông tin đăng ký!');
    }, 1000);
  };

  const handleAction = (status: 'CheckedIn' | 'Cancelled') => {
    toast.success(status === 'CheckedIn' ? 'Đã cho phép khách vào!' : 'Đã từ chối khách!');
    setVisitor(null);
    setSearchCCCD('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-display text-primary leading-tight">Kiểm tra Khách</h1>
        <p className="text-body text-muted font-medium italic">Quét mã QR hoặc nhập số CCCD để xác nhận khách vào tòa nhà.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="card-container p-8 space-y-6 bg-white/50 backdrop-blur-md border-primary/5">
          <div className="flex bg-bg/50 p-1.5 rounded-2xl border border-border/10">
            <button 
              onClick={() => setScanMode(true)}
              className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all", scanMode ? "bg-primary text-white shadow-lg" : "text-muted")}
            >
              <QrCode size={18} /> Quét mã QR
            </button>
            <button 
              onClick={() => setScanMode(false)}
              className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all", !scanMode ? "bg-primary text-white shadow-lg" : "text-muted")}
            >
              <Clipboard size={18} /> Nhập CCCD
            </button>
          </div>

          {scanMode ? (
            <div className="aspect-square bg-slate-900 rounded-[40px] flex flex-col items-center justify-center text-white/40 gap-4 group cursor-pointer overflow-hidden relative" onClick={handleScan}>
              <div className="absolute inset-0 border-[40px] border-slate-900/50 z-10"></div>
              <Camera size={64} className="group-hover:scale-110 transition-transform" />
              <p className="text-[10px] font-black uppercase tracking-[4px]">Đang chờ mã QR...</p>
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-primary/40 animate-scan"></div>
              {loading && <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-20"><div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div></div>}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input 
                  type="text" 
                  placeholder="Nhập 12 số CCCD..." 
                  className="input-base w-full pl-12 pr-4 h-14 text-lg font-mono font-black tracking-widest"
                  value={searchCCCD}
                  onChange={(e) => setSearchCCCD(e.target.value)}
                />
              </div>
              <button 
                onClick={handleScan}
                disabled={searchCCCD.length < 9}
                className="btn-primary w-full h-14 rounded-2xl font-black uppercase tracking-widest disabled:opacity-50"
              >
                Tìm kiếm thông tin
              </button>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="card-container p-8 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
             <ShieldCheck size={160} />
          </div>

          {visitor ? (
            <div className="space-y-8 relative z-10 animate-in slide-in-from-right-10">
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-white"><User size={32} /></div>
                 <div>
                    <h3 className="text-h3 font-black uppercase tracking-tight">{visitor.name}</h3>
                    <p className="text-small text-slate-400 font-mono tracking-widest">{visitor.id}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4 border-y border-white/10 py-8">
                 <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[2px] text-slate-500">Số CCCD</p>
                    <div className="flex items-center gap-2"><CreditCard size={14} className="text-primary" /> <span className="text-small font-bold">{visitor.cccd}</span></div>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[2px] text-slate-500">Phòng đến</p>
                    <div className="flex items-center gap-2"><Building size={14} className="text-primary" /> <span className="text-small font-bold">{visitor.room}</span></div>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[2px] text-slate-500">Người mời (Tenant)</p>
                    <div className="text-small font-bold">{visitor.tenantName}</div>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[2px] text-slate-500">Thời gian dự kiến</p>
                    <div className="flex items-center gap-2"><Calendar size={14} className="text-primary" /> <span className="text-small font-bold">{visitor.expectedAt}</span></div>
                 </div>
              </div>

              <div className="flex gap-4">
                 <button onClick={() => handleAction('CheckedIn')} className="flex-1 btn-primary h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 border-none flex items-center justify-center gap-2">
                    <Check size={20} /> CHO VÀO
                 </button>
                 <button onClick={() => handleAction('Cancelled')} className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-danger/20 hover:text-danger hover:border-danger/20 transition-all flex items-center justify-center gap-2">
                    <X size={20} /> TỪ CHỐI
                 </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
               <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6"><AlertCircle size={32} /></div>
               <p className="text-body font-black uppercase tracking-widest">Chưa có thông tin</p>
               <p className="text-[12px] italic">Vui lòng quét QR hoặc nhập CCCD để hiển thị</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitorCheckin;
