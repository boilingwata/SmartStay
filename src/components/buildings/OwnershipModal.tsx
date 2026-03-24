import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, X, Search, User } from 'lucide-react';
import { buildingService } from '@/services/buildingService';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/Feedback';
import { cn } from '@/utils';

interface OwnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildingId: string;
  currentOwnerships: any[];
  onSuccess: () => void;
}

export const OwnershipModal = ({ isOpen, onClose, buildingId, currentOwnerships, onSuccess }: OwnershipModalProps) => {
  const [owners, setOwners] = useState<any[]>([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    ownerId: '',
    ownershipPercent: 0,
    ownershipType: 'Investor',
    startDate: new Date().toISOString().split('T')[0],
    note: ''
  });

  const totalCurrent = currentOwnerships.reduce((sum, o) => sum + o.ownershipPercent, 0);
  const remaining = 100 - totalCurrent;

  useEffect(() => {
    if (isOpen) {
      setIsLoadingOwners(true);
      buildingService.getOwners().then(data => {
        setOwners(data);
        setIsLoadingOwners(false);
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Checklist #2: Sum check
    if (formData.ownershipPercent > remaining) {
      toast.error(`Tổng cổ phần không được vượt quá 100%. (Còn lại: ${remaining}%)`);
      return;
    }

    if (formData.ownershipPercent <= 0) {
      toast.error('Phần trăm sở hữu phải lớn hơn 0');
      return;
    }

    if (!formData.ownerId) {
      toast.error('Vui lòng chọn chủ sở hữu');
      return;
    }

    try {
      // simulate save
      await new Promise(r => setTimeout(r, 600));
      toast.success('Gán chủ sở hữu thành công');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b bg-primary flex justify-between items-center text-white">
           <div className="flex items-center gap-3">
              <ShieldCheck size={20} />
              <h2 className="text-small font-black uppercase tracking-widest">Gán chủ sở hữu mới</h2>
           </div>
           <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-all">
              <X size={20} />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
           {/* Info banner */}
           <div className={cn(
             "p-4 rounded-2xl flex items-center justify-between border",
             remaining <= 0 ? "bg-danger/5 border-danger/20 text-danger" : "bg-primary/5 border-primary/10 text-primary"
           )}>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest">Cổ phần còn lại</p>
                 <p className="text-h2 font-black leading-none">{remaining}%</p>
              </div>
              <ShieldCheck size={32} className="opacity-20" />
           </div>

           <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase">Chủ sở hữu *</label>
              <div className="relative">
                 <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                 <select 
                   required
                   className="input-base w-full pl-12"
                   value={formData.ownerId}
                   onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                 >
                    <option value="">Chọn chủ sở hữu...</option>
                    {owners.filter(o => !currentOwnerships.some(co => co.ownerId === o.id)).map(o => (
                      <option key={o.id} value={o.id}>{o.fullName} ({o.email})</option>
                    ))}
                 </select>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-muted uppercase">Tỉ lệ sở hữu (%) *</label>
                 <input 
                   type="number" step="0.1" min="0.1" max={remaining} required
                   className="input-base w-full"
                   value={formData.ownershipPercent}
                   onChange={(e) => setFormData({ ...formData, ownershipPercent: Number(e.target.value) })}
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-muted uppercase">Vai trò</label>
                 <select 
                   className="input-base w-full"
                   value={formData.ownershipType}
                   onChange={(e) => setFormData({ ...formData, ownershipType: e.target.value as any })}
                 >
                    <option value="FullOwner">Chủ sở hữu chính</option>
                    <option value="CoOwner">Đồng sở hữu</option>
                    <option value="Investor">Nhà đầu tư</option>
                 </select>
              </div>
           </div>

           <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase">Ngày bắt đầu</label>
              <input 
                type="date" required
                className="input-base w-full"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
           </div>

           <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase">Ghi chú (không bắt buộc)</label>
              <textarea 
                className="input-base w-full h-24 resize-none"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
           </div>

           <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 py-3 bg-bg text-muted font-black uppercase tracking-widest rounded-2xl">Huỷ</button>
              <button 
                type="submit"
                disabled={remaining <= 0}
                className="flex-[2] py-3 bg-primary text-white font-black uppercase tracking-[3px] rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                 Xác nhận gán
              </button>
           </div>
        </form>
      </div>
    </div>
  );
};
