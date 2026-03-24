import React, { useState } from 'react';
import { X, FilePlus, AlertCircle, Upload, Check } from 'lucide-react';
import { cn } from '@/utils';
import { toast } from 'sonner';

interface CreateAddendumModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: any;
}

export const CreateAddendumModal = ({ isOpen, onClose, contract }: CreateAddendumModalProps) => {
  const [formData, setFormData] = useState({
    addendumCode: `PL-${contract?.contractCode}-01`,
    type: 'PriceChange',
    title: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    status: 'Draft',
    fileUrl: '',
    content: ''
  });

  if (!isOpen) return null;

  const isSignedWithoutFile = formData.status === 'Signed' && !formData.fileUrl;

  const handleSubmit = () => {
    if (isSignedWithoutFile) {
      toast.error('FileUrl BẮT BUỘC khi Status=Signed -- Phụ lục không có file không có giá trị pháp lý');
      return;
    }
    toast.success('Đã lưu phụ lục hợp đồng');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-[700px] bg-white rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-h2 text-primary flex items-center gap-2">
            <FilePlus size={24} /> Tạo phụ lục hợp đồng
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-bg rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {isSignedWithoutFile && (
            <div className="bg-danger/5 p-4 rounded-2xl border border-danger/20 flex gap-3 animate-bounce">
              <AlertCircle className="text-danger shrink-0" size={20} />
              <p className="text-small text-danger font-bold uppercase">
                (RULE-06) Vui lòng upload file scan bản ký tay trước khi chuyển sang trạng thái "Đã ký" (Signed)
              </p>
            </div>
          )}


          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-small font-bold text-muted">Mã phụ lục</label>
              <input type="text" className="input-base w-full font-mono font-bold" value={formData.addendumCode} readOnly />
            </div>
            <div className="space-y-1.5">
              <label className="text-small font-bold text-muted">Loại phụ lục</label>
              <select className="input-base w-full" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                <option value="PriceChange">Thay đổi giá thuê</option>
                <option value="RoomChange">Thay đổi phòng</option>
                <option value="RuleChange">Thay đổi nội quy</option>
                <option value="Other">Khác</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-small font-bold text-muted">Tiêu đề phụ lục</label>
            <input 
              type="text" 
              className="input-base w-full" 
              placeholder="Ví dụ: Điều chỉnh đơn giá tiền điện từ 01/2025"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-small font-bold text-muted">Ngày hiệu lực</label>
              <input type="date" className="input-base w-full" value={formData.effectiveDate} onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-small font-bold text-muted">Trạng thái</label>
              <select 
                className={cn("input-base w-full font-bold", formData.status === 'Signed' ? 'text-success' : 'text-primary')}
                value={formData.status} 
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="Draft">Bản nháp (Draft)</option>
                <option value="Signed">Đã ký (Signed)</option>
                <option value="Cancelled">Đã hủy (Cancelled)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-small font-bold text-muted">Tài liệu đính kèm (Scan PDF/DOCX)</label>
            <div className={cn(
               "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all",
               formData.fileUrl ? "border-success bg-success/5" : "border-border hover:border-primary/30"
            )}>
              {formData.fileUrl ? (
                <>
                  <Check className="text-success" size={32} />
                  <p className="text-small font-bold text-success">File đã được chọn: addendum_signed.pdf</p>
                  <button onClick={() => setFormData({...formData, fileUrl: ''})} className="text-[10px] text-danger underline font-bold uppercase">Xóa file</button>
                </>
              ) : (
                <>
                  <Upload className="text-muted/30" size={32} />
                  <p className="text-small text-muted font-medium text-center">Kéo thả hoặc <span className="text-primary font-bold cursor-pointer">tải lên</span> file scan phụ lục.</p>
                  <button onClick={() => setFormData({...formData, fileUrl: 'mock_url'})} className="btn-outline scale-75">Simulate Upload</button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-bg/50 border-t flex justify-end gap-3">
          <button onClick={onClose} className="btn-outline">Hủy bỏ</button>
          <button 
            onClick={handleSubmit}
            className={cn(
              "btn-primary",
              isSignedWithoutFile && "opacity-50 cursor-not-allowed grayscale"
            )}
          >
            Lưu phụ lục
          </button>
        </div>
      </div>
    </div>
  );
};
