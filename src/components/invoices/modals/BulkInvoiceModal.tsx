import React, { useState } from 'react';
import { 
  X, Layers, Calendar, ChevronRight, 
  ChevronLeft, Building2, CheckCircle2, 
  AlertTriangle, XCircle, Loader2, Download, Info
} from 'lucide-react';
import { cn, formatVND } from '@/utils';

interface BulkInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkInvoiceModal = ({ isOpen, onClose }: BulkInvoiceModalProps) => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b flex items-center justify-between bg-white z-10">
          <div>
            <h2 className="text-h2 text-primary">Tạo hóa đơn hàng loạt</h2>
            <p className="text-small text-muted">Tự động lập hóa đơn cho toàn bộ tòa nhà theo kỳ.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-8 py-4 bg-bg/30 border-b flex items-center justify-center gap-12">
           {[1, 2, 3].map((s) => (
             <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  step === s ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : 
                  step > s ? "bg-success text-white" : "bg-white border text-muted"
                )}>
                  {step > s ? <CheckCircle2 size={16} /> : s}
                </div>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", step === s ? "text-primary" : "text-muted")}>
                   {s === 1 ? 'Chọn kỳ' : s === 2 ? 'Xem trước' : 'Hoàn tất'}
                </span>
             </div>
           ))}
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto">
           {/* Step 1: Settings */}
           {step === 1 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <h4 className="text-body font-bold text-primary flex items-center gap-2"><Calendar size={18} /> Cấu hình thời gian</h4>
                      <div className="space-y-2">
                         <label className="text-label text-muted">Chọn kỳ thanh toán</label>
                         <input type="month" className="input-base w-full" defaultValue="2025-03" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-label text-muted">Hạn thanh toán mặc định</label>
                         <input type="date" className="input-base w-full" defaultValue="2025-04-10" />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <h4 className="text-body font-bold text-primary flex items-center gap-2"><Building2 size={18} /> Phạm vi áp dụng</h4>
                      <div className="space-y-2">
                         <label className="text-label text-muted">Tòa nhà</label>
                         <select className="input-base w-full">
                            <option>Tất cả tòa nhà đang quản lý</option>
                            <option>Keangnam Landmark</option>
                            <option>Vinhones Ocean Park</option>
                         </select>
                      </div>
                      <div className="p-4 bg-info/5 rounded-2xl border border-info/10 text-small text-info flex gap-2">
                         <Info size={16} className="shrink-0" />
                         Chỉ áp dụng cho các Hợp đồng có trạng thái <strong>Active</strong>.
                      </div>
                   </div>
                </div>
             </div>
           )}

           {/* Step 2: Preview */}
           {step === 2 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between">
                   <h4 className="text-body font-bold text-primary">Danh sách hợp đồng dự kiến (42)</h4>
                   <div className="flex gap-2 text-[10px]">
                      <span className="flex items-center gap-1 text-success"><CheckCircle2 size={12} /> Sẵn sàng (38)</span>
                      <span className="flex items-center gap-1 text-warning"><AlertTriangle size={12} /> Thiếu chỉ số (4)</span>
                   </div>
                </div>
                <div className="border rounded-2xl overflow-hidden">
                   <table className="w-full text-left text-small">
                      <thead className="bg-bg/50 border-b">
                         <tr>
                            <th className="px-4 py-3"><input type="checkbox" checked readOnly /></th>
                            <th className="px-4 py-3">Phòng</th>
                            <th className="px-4 py-3">Cư dân</th>
                            <th className="px-4 py-3 text-right">Dự kiến</th>
                            <th className="px-4 py-3 text-center">Trạng thái</th>
                         </tr>
                      </thead>
                      <tbody>
                         {[1, 2, 3, 4, 5].map((i) => (
                           <tr key={i} className="border-b last:border-0 hover:bg-bg/20">
                              <td className="px-4 py-3"><input type="checkbox" checked readOnly /></td>
                              <td className="px-4 py-3 font-bold">A-{100+i}</td>
                              <td className="px-4 py-3 font-medium">Nguyễn Văn {i}</td>
                              <td className="px-4 py-3 text-right font-bold text-primary">{formatVND(15000000)}</td>
                              <td className="px-4 py-3 text-center">
                                 {i === 4 ? (
                                   <span className="px-2 py-0.5 bg-warning/10 text-warning rounded-full text-[9px] font-bold">Thanh toán sau</span>
                                 ) : (
                                   <span className="px-2 py-0.5 bg-success/10 text-success rounded-full text-[9px] font-bold">Đủ dữ liệu</span>
                                 )}
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
           )}

           {/* Step 3: Success / Progress */}
           {step === 3 && (
             <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-in zoom-in-95 duration-500">
                {isGenerating ? (
                   <div className="text-center space-y-6 w-full max-w-md">
                      <div className="relative w-32 h-32 mx-auto">
                         <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
                         <div 
                           className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"
                           style={{ animationDuration: '3s' }}
                         ></div>
                         <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-h2 font-black text-primary">{progress}%</span>
                         </div>
                      </div>
                      <div className="space-y-2">
                         <p className="text-body font-bold text-primary">Đang tạo hóa đơn...</p>
                         <p className="text-small text-muted">Vui lòng không đóng cửa sổ này. Hệ thống đang đồng bộ dữ liệu.</p>
                      </div>
                      <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                         <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }}></div>
                      </div>
                   </div>
                ) : (
                  <div className="text-center space-y-6">
                     <div className="w-24 h-24 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto shadow-xl shadow-success/10">
                        <CheckCircle2 size={48} />
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-h2 text-success font-black">Xử lý thành công!</h3>
                        <p className="text-body text-muted">Đã khởi tạo <strong>38 hóa đơn</strong> trong tổng số 42 hợp đồng.</p>
                     </div>
                     <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                        <div className="p-4 bg-bg/50 rounded-2xl border">
                           <p className="text-[24px] font-black text-primary">38</p>
                           <p className="text-[10px] text-muted font-bold uppercase">Thành công</p>
                        </div>
                        <div className="p-4 bg-danger/5 rounded-2xl border border-danger/10">
                           <p className="text-[24px] font-black text-danger">4</p>
                           <p className="text-[10px] text-muted font-bold uppercase">Thất bại</p>
                        </div>
                     </div>
                     <button className="btn-outline flex items-center gap-2 mx-auto">
                        <Download size={18} /> Tải báo cáo lỗi (.csv)
                     </button>
                  </div>
                )}
             </div>
           )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t bg-bg/20 flex items-center justify-between">
           {step > 1 && !isGenerating && (
             <button onClick={() => setStep(step - 1)} className="btn-outline flex items-center gap-2">
                <ChevronLeft size={18} /> Quay lại
             </button>
           )}
           <div className="flex items-center gap-3 ml-auto">
              {step < 3 ? (
                <button onClick={() => setStep(step + 1)} className="btn-primary flex items-center gap-2">
                   Tiếp tục <ChevronRight size={18} />
                </button>
              ) : !isGenerating ? (
                <button onClick={onClose} className="btn-primary px-12">Đóng</button>
              ) : null}
              
              {step === 2 && (
                <button 
                  onClick={() => {
                    setStep(3);
                    setIsGenerating(true);
                    let p = 0;
                    const interval = setInterval(() => {
                      p += 5;
                      setProgress(p);
                      if (p >= 100) {
                        clearInterval(interval);
                        setIsGenerating(false);
                      }
                    }, 100);
                  }}
                  className="btn-primary bg-success hover:bg-success/90 border-none px-8"
                >
                   Xác nhận & Khởi tạo
                </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
